import type { InboundSignalMessage } from "../dto/inbound-signal-message";
import { createOutboundSignalMessage } from "../dto/outbound-signal-message";
import type { SignalRouteContext, SignalRouteResult } from "../signaling-context";
import { logger } from "../../config/logger";

export async function handleLeaveSession(
  message: InboundSignalMessage,
  context: SignalRouteContext
): Promise<SignalRouteResult> {
  if (!message.sessionId) {
    throw new Error("client.leave-session requires sessionId");
  }

  const liveConnection = context.connectionRegistry.get(context.connectionId);
  if (!liveConnection) {
    throw new Error("Connection must authenticate before leaving a session");
  }

  context.sessionRegistry.leave(message.sessionId, context.connectionId);
  context.connectionRegistry.removeSession(context.connectionId, message.sessionId);
  logger.info("[signal] leave.accepted", {
    connectionId: context.connectionId,
    sessionId: message.sessionId,
    userId: liveConnection.userId
  });

  await context.heartbeat.touch(
    context.connectionId,
    liveConnection.userId,
    [...liveConnection.sessionIds]
  );

  return {
    peerMessages: [
      createOutboundSignalMessage({
        correlationId: message.correlationId,
        type: "session.ended",
        actorId: liveConnection.userId,
        sessionId: message.sessionId,
        payload: {
          connectionId: context.connectionId,
          reason: "peer_left"
        }
      })
    ]
  };
}
