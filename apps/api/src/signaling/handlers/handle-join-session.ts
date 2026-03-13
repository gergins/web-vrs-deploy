import type { InboundSignalMessage } from "../dto/inbound-signal-message";
import { createOutboundSignalMessage } from "../dto/outbound-signal-message";
import type { SignalRouteContext, SignalRouteResult } from "../signaling-context";
import { SessionService } from "../../services/session-service";
import { signalingPresenceBridge } from "../signaling-presence-bridge";
import { createDirectMessage } from "./create-direct-message";
import { logger } from "../../config/logger";

const sessionService = new SessionService();

export async function handleJoinSession(
  message: InboundSignalMessage,
  context: SignalRouteContext
): Promise<SignalRouteResult> {
  const liveConnection = context.connectionRegistry.get(context.connectionId);
  logger.info("[signal.trace] join.start", {
    connectionId: context.connectionId,
    type: message.type,
    correlationId: message.correlationId,
    timestamp: message.timestamp,
    hasLiveConnection: Boolean(liveConnection)
  });
  if (!liveConnection) {
    logger.warn("[signal] join.rejected", {
      connectionId: context.connectionId,
      sessionId: message.sessionId,
      reason: "unauthenticated_connection"
    });
    throw new Error("Connection must authenticate before joining a session");
  }

  if (!message.sessionId) {
    logger.warn("[signal] join.rejected", {
      connectionId: context.connectionId,
      userId: liveConnection.userId,
      reason: "missing_session_id"
    });
    throw new Error("client.join-session requires sessionId");
  }

  const canJoin = await sessionService.canJoinSession(
    message.sessionId,
    liveConnection.userId,
    liveConnection.role
  );
  if (!canJoin) {
    logger.warn("[signal] join.rejected", {
      connectionId: context.connectionId,
      sessionId: message.sessionId,
      userId: liveConnection.userId,
      role: liveConnection.role,
      reason: "session_authorization_failed"
    });
    throw new Error("Connection is not authorized to join this session");
  }

  signalingPresenceBridge.cancelTerminalDeparture({
    userId: liveConnection.userId,
    sessionId: message.sessionId
  });

  const existingPeerConnectionIds = [
    ...context.sessionRegistry.getConnections(message.sessionId)
  ].filter((connectionId) => connectionId !== context.connectionId);
  const existingPeerMessages = existingPeerConnectionIds
    .map((connectionId) => context.connectionRegistry.get(connectionId))
    .filter((connection): connection is NonNullable<typeof connection> => Boolean(connection))
    .map((connection) =>
      createOutboundSignalMessage({
        correlationId: message.correlationId,
        type: "session.joined",
        actorId: connection.userId,
        sessionId: message.sessionId,
        payload: {
          connectionId: connection.connectionId
        }
      })
    );

  context.sessionRegistry.join(message.sessionId, context.connectionId);
  context.connectionRegistry.addSession(context.connectionId, message.sessionId);
  const peerCount = context.sessionRegistry.getConnections(message.sessionId).size;
  logger.info("[signal] join.accepted", {
    connectionId: context.connectionId,
    sessionId: message.sessionId,
    userId: liveConnection.userId,
    role: liveConnection.role,
    peerCount,
    existingPeerCount: existingPeerMessages.length
  });
  void context.heartbeat
    .touch(context.connectionId, liveConnection.userId, [...liveConnection.sessionIds])
    .catch((error) => {
      logger.warn("[signal] join.heartbeat_failed", {
        connectionId: context.connectionId,
        sessionId: message.sessionId,
        userId: liveConnection.userId,
        error: error instanceof Error ? error.message : "Unknown heartbeat error"
      });
    });

  return {
    directMessages: [
      createDirectMessage(message, "session.joined", {
        connectionId: context.connectionId
      }),
      ...existingPeerMessages
    ],
    peerMessages: [
      createDirectMessage(message, "session.joined", {
        connectionId: context.connectionId
      })
    ]
  };
}
