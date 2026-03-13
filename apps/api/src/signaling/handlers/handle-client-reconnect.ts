import type { InboundSignalMessage } from "../dto/inbound-signal-message";
import type { SignalRouteContext, SignalRouteResult } from "../signaling-context";
import { authenticateSignalActor } from "../signaling-auth";
import { signalingPresenceBridge } from "../signaling-presence-bridge";
import { createDirectMessage } from "./create-direct-message";
import { logger } from "../../config/logger";

export async function handleClientReconnect(
  message: InboundSignalMessage,
  context: SignalRouteContext
): Promise<SignalRouteResult> {
  const isReconnectAllowed = await context.heartbeat.isReconnectAllowed({
    userId: message.actorId,
    sessionId: message.sessionId
  });

  if (!isReconnectAllowed) {
    throw new Error("Reconnect grace window expired or session context is invalid");
  }

  const authenticatedConnection = await authenticateSignalActor(
    message,
    context.connectionId
  );
  context.connectionRegistry.register(authenticatedConnection);
  signalingPresenceBridge.cancelTerminalDeparture({
    userId: authenticatedConnection.userId,
    sessionId: message.sessionId
  });
  logger.info("[signal] auth.accepted", {
    connectionId: context.connectionId,
    userId: authenticatedConnection.userId,
    role: authenticatedConnection.role,
    reconnected: true
  });
  void context.heartbeat
    .touch(context.connectionId, authenticatedConnection.userId, [])
    .catch((error) => {
      logger.warn("[signal] auth.heartbeat_failed", {
        connectionId: context.connectionId,
        userId: authenticatedConnection.userId,
        error: error instanceof Error ? error.message : "Unknown heartbeat error",
        reconnected: true
      });
    });

  return {
    directMessages: [
      createDirectMessage(message, "server.authenticated", {
        connectionId: context.connectionId,
        role: authenticatedConnection.role,
        reconnected: true
      })
    ]
  };
}
