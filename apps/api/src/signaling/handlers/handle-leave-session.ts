import type { InboundSignalMessage } from "../dto/inbound-signal-message";
import type { SignalRouteContext, SignalRouteResult } from "../signaling-context";
import { createDirectMessage } from "./create-direct-message";
import { logger } from "../../config/logger";

export async function handleLeaveSession(
  message: InboundSignalMessage,
  context: SignalRouteContext
): Promise<SignalRouteResult> {
  if (!message.sessionId) {
    throw new Error("client.leave-session requires sessionId");
  }

  context.sessionRegistry.leave(message.sessionId, context.connectionId);
  context.connectionRegistry.removeSession(context.connectionId, message.sessionId);
  logger.info("[signal] leave.accepted", {
    connectionId: context.connectionId,
    sessionId: message.sessionId
  });

  const liveConnection = context.connectionRegistry.get(context.connectionId);
  await context.heartbeat.touch(
    context.connectionId,
    liveConnection?.userId,
    liveConnection ? [...liveConnection.sessionIds] : []
  );

  return {
    peerMessages: [
      createDirectMessage(message, "session.ended", {
        connectionId: context.connectionId,
        reason: "peer_left"
      })
    ]
  };
}
