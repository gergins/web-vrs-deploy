import { createOutboundSignalMessage, type OutboundSignalMessage } from "./dto/outbound-signal-message";
import type { WebSocket } from "ws";
import { SignalingConnectionRegistry } from "./signaling-connection-registry";
import { SignalingHeartbeat } from "./signaling-heartbeat";
import { SignalingSessionRegistry } from "./signaling-session-registry";
import { logger } from "../config/logger";

const sockets = new Map<string, WebSocket>();
const connectionRegistry = new SignalingConnectionRegistry();
const sessionRegistry = new SignalingSessionRegistry();
const heartbeat = new SignalingHeartbeat();
const pendingDepartures = new Map<
  string,
  {
    connectionId: string;
    userId: string;
    sessionIds: string[];
    timeout: ReturnType<typeof setTimeout>;
  }
>();

function send(socket: WebSocket, message: OutboundSignalMessage) {
  socket.send(JSON.stringify(message));
}

export const signalingPresenceBridge = {
  sockets,
  connectionRegistry,
  sessionRegistry,
  heartbeat,
  registerSocket(connectionId: string, socket: WebSocket) {
    sockets.set(connectionId, socket);
  },
  unregisterSocket(connectionId: string) {
    sockets.delete(connectionId);
  },
  emitToConnection(connectionId: string, message: OutboundSignalMessage) {
    const socket = sockets.get(connectionId);
    if (!socket) {
      return false;
    }

    send(socket, message);
    logger.info("[signal] outbound", {
      connectionId,
      target: "user",
      type: message.type,
      correlationId: message.correlationId,
      sessionId: message.sessionId,
      actorId: message.actorId
    });
    return true;
  },
  emitToUser(userId: string, message: OutboundSignalMessage) {
    const connectionIds = connectionRegistry.getConnectionsForUser(userId);
    let deliveredCount = 0;
    for (const connectionId of connectionIds) {
      if (this.emitToConnection(connectionId, message)) {
        deliveredCount += 1;
      }
    }

    return deliveredCount;
  },
  scheduleTerminalDeparture(input: {
    connectionId: string;
    userId: string;
    sessionIds: string[];
    graceMs: number;
  }) {
    const existing = pendingDepartures.get(input.connectionId);
    if (existing) {
      clearTimeout(existing.timeout);
    }

    logger.info("[signal] disconnect_grace_started", {
      connectionId: input.connectionId,
      userId: input.userId,
      sessionIds: input.sessionIds,
      graceMs: input.graceMs
    });

    const timeout = setTimeout(() => {
      pendingDepartures.delete(input.connectionId);
      logger.info("[signal] disconnect_grace_expired", {
        connectionId: input.connectionId,
        userId: input.userId,
        sessionIds: input.sessionIds
      });

      for (const sessionId of input.sessionIds) {
        for (const peerConnectionId of sessionRegistry.getPeerConnections(
          sessionId,
          input.connectionId
        )) {
          logger.info("[signal] session_ended_emitted", {
            connectionId: input.connectionId,
            userId: input.userId,
            sessionId,
            peerConnectionId
          });
          signalingPresenceBridge.emitToConnection(
            peerConnectionId,
            createOutboundSignalMessage({
              correlationId: input.connectionId,
              type: "session.ended",
              actorId: input.userId,
              sessionId,
              payload: {
                connectionId: input.connectionId,
                reason: "reconnect_grace_expired"
              }
            })
          );
        }
      }

      logger.info("[signal] participant_removed_from_session", {
        connectionId: input.connectionId,
        userId: input.userId,
        sessionIds: input.sessionIds
      });
      sessionRegistry.cleanupConnection(input.connectionId);
      connectionRegistry.remove(input.connectionId);
      const shouldClearUserCache =
        connectionRegistry.getConnectionsForUser(input.userId).length === 0;
      void heartbeat.remove(
        input.connectionId,
        shouldClearUserCache ? input.userId : undefined
      );
    }, input.graceMs);

    pendingDepartures.set(input.connectionId, {
      connectionId: input.connectionId,
      userId: input.userId,
      sessionIds: input.sessionIds,
      timeout
    });
  },
  cancelTerminalDeparture(input: {
    userId: string;
    sessionId?: string | null;
  }) {
    for (const [connectionId, pendingDeparture] of pendingDepartures.entries()) {
      const sessionMatches =
        !input.sessionId || pendingDeparture.sessionIds.includes(input.sessionId);
      if (pendingDeparture.userId !== input.userId || !sessionMatches) {
        continue;
      }

      clearTimeout(pendingDeparture.timeout);
      pendingDepartures.delete(connectionId);
      logger.info("[signal] disconnect_grace_cancelled", {
        connectionId,
        userId: input.userId,
        sessionId: input.sessionId ?? null
      });

      sessionRegistry.cleanupConnection(connectionId);
      connectionRegistry.remove(connectionId);
      const shouldClearUserCache =
        connectionRegistry.getConnectionsForUser(input.userId).length === 0;
      void heartbeat.remove(
        connectionId,
        shouldClearUserCache ? input.userId : undefined
      );
    }
  }
};
