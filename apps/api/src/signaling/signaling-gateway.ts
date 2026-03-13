import { createServer } from "http";
import { randomUUID } from "crypto";
import type { OutboundSignalMessage } from "./dto/outbound-signal-message";
import { WebSocketServer, type WebSocket } from "ws";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { signalingPresenceBridge } from "./signaling-presence-bridge";
import { routeSignalMessage } from "./signaling-router";
import { validateSignalMessage } from "./signaling-message-validator";

function sendMessage(
  socket: WebSocket,
  message: OutboundSignalMessage,
  metadata: { connectionId: string; target: "self" | "peer" | "user" }
) {
  socket.send(JSON.stringify(message));
  logger.info("[signal] outbound", {
    connectionId: metadata.connectionId,
    target: metadata.target,
    type: message.type,
    correlationId: message.correlationId,
    sessionId: message.sessionId,
    actorId: message.actorId
  });
}

function createErrorMessage(
  connectionId: string,
  error: string,
  correlationId?: string
): OutboundSignalMessage {
  return {
    messageId: randomUUID(),
    correlationId: correlationId ?? connectionId,
    type: "server.error",
    timestamp: new Date().toISOString(),
    sessionId: null,
    actorId: "system",
    payload: { error }
  };
}

export function attachSignalingGateway(server: ReturnType<typeof createServer>) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    const connectionId = randomUUID();
    let messageProcessingChain = Promise.resolve();
    let messageSequence = 0;
    signalingPresenceBridge.registerSocket(connectionId, ws);
    void signalingPresenceBridge.heartbeat.touch(connectionId);

    ws.on("message", (raw) => {
      messageProcessingChain = messageProcessingChain
        .catch(() => {})
        .then(async () => {
          let messageType = "unknown";
          let correlationId: string | undefined;

          try {
            const payload =
              typeof raw === "string" || raw instanceof Buffer ? raw.toString() : "";
            const parsed = JSON.parse(payload);
            const message = validateSignalMessage(parsed);
            const sequence = ++messageSequence;
            messageType = message.type;
            correlationId = message.correlationId;
            logger.info("[signal.trace] receipt", {
              connectionId,
              sequence,
              type: message.type,
              correlationId: message.correlationId,
              timestamp: message.timestamp
            });
            logger.info("[signal] inbound", {
              connectionId,
              type: message.type,
              correlationId: message.correlationId,
              sessionId: message.sessionId,
              actorId: message.actorId
            });
            const result = await routeSignalMessage(message, {
              connectionId,
              sockets: signalingPresenceBridge.sockets,
              connectionRegistry: signalingPresenceBridge.connectionRegistry,
              sessionRegistry: signalingPresenceBridge.sessionRegistry,
              heartbeat: signalingPresenceBridge.heartbeat
            });

            for (const directMessage of result.directMessages ?? []) {
              sendMessage(ws, directMessage, { connectionId, target: "self" });
            }

            for (const peerConnectionId of message.sessionId
              ? signalingPresenceBridge.sessionRegistry.getPeerConnections(
                  message.sessionId,
                  connectionId
                )
              : []) {
              const peerSocket = signalingPresenceBridge.sockets.get(peerConnectionId);
              if (!peerSocket) continue;

              for (const peerMessage of result.peerMessages ?? []) {
                sendMessage(peerSocket, peerMessage, {
                  connectionId: peerConnectionId,
                  target: "peer"
                });
              }
            }

            for (const userMessage of result.userMessages ?? []) {
              signalingPresenceBridge.emitToUser(userMessage.userId, userMessage.message);
            }
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown signaling error";
            logger.warn("[signal] rejected", {
              connectionId,
              type: messageType,
              correlationId,
              error: message
            });
            sendMessage(ws, createErrorMessage(connectionId, message, correlationId), {
              connectionId,
              target: "self"
            });
          }
        });
    });

    ws.on("close", () => {
      const liveConnection = signalingPresenceBridge.connectionRegistry.get(connectionId);
      signalingPresenceBridge.unregisterSocket(connectionId);

      if (!liveConnection) {
        void signalingPresenceBridge.heartbeat.remove(connectionId);
        return;
      }

      const activeSessionIds = [...liveConnection.sessionIds];
      if (activeSessionIds.length === 0) {
        signalingPresenceBridge.connectionRegistry.remove(connectionId);
        const shouldClearUserCache =
          signalingPresenceBridge.connectionRegistry.getConnectionsForUser(
            liveConnection.userId
          ).length === 0;
        void signalingPresenceBridge.heartbeat.remove(
          connectionId,
          shouldClearUserCache ? liveConnection.userId : undefined
        );
        return;
      }

      signalingPresenceBridge.scheduleTerminalDeparture({
        connectionId,
        userId: liveConnection.userId,
        sessionIds: activeSessionIds,
        graceMs: env.reconnectGraceMs
      });
    });
  });

  return wss;
}
