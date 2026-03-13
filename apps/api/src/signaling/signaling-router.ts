import type { InboundSignalMessage } from "./dto/inbound-signal-message";
import { createDirectMessage } from "./handlers/create-direct-message";
import { handleAnswer } from "./handlers/handle-answer";
import { handleAssignmentResponse } from "./handlers/handle-assignment-response";
import { handleClientHeartbeat } from "./handlers/handle-client-heartbeat";
import { handleClientReconnect } from "./handlers/handle-client-reconnect";
import { handleCallRequest } from "./handlers/handle-call-request";
import { handleIceCandidate } from "./handlers/handle-ice-candidate";
import { handleJoinSession } from "./handlers/handle-join-session";
import { handleLeaveSession } from "./handlers/handle-leave-session";
import { handleOffer } from "./handlers/handle-offer";
import { authenticateSignalActor } from "./signaling-auth";
import type { SignalRouteContext, SignalRouteResult } from "./signaling-context";
import { logger } from "../config/logger";

export async function routeSignalMessage(
  message: InboundSignalMessage,
  context: SignalRouteContext
): Promise<SignalRouteResult> {
  switch (message.type) {
    case "client.auth": {
      logger.info("[signal.trace] auth.start", {
        connectionId: context.connectionId,
        type: message.type,
        correlationId: message.correlationId,
        timestamp: message.timestamp
      });
      const authenticatedConnection = await authenticateSignalActor(
        message,
        context.connectionId
      );

      context.connectionRegistry.register(authenticatedConnection);
      logger.info("[signal.trace] auth.registered", {
        connectionId: context.connectionId,
        type: message.type,
        correlationId: message.correlationId,
        timestamp: message.timestamp,
        hasLiveConnection: Boolean(
          context.connectionRegistry.get(context.connectionId)
        )
      });
      logger.info("[signal] auth.accepted", {
        connectionId: context.connectionId,
        userId: authenticatedConnection.userId,
        role: authenticatedConnection.role
      });
      void context.heartbeat
        .touch(
        context.connectionId,
        authenticatedConnection.userId,
        []
        )
        .catch((error) => {
          logger.warn("[signal] auth.heartbeat_failed", {
            connectionId: context.connectionId,
            userId: authenticatedConnection.userId,
            error: error instanceof Error ? error.message : "Unknown heartbeat error"
          });
        });

      const result = {
        directMessages: [
          createDirectMessage(message, "server.authenticated", {
            connectionId: context.connectionId,
            role: authenticatedConnection.role
          })
        ]
      };

      logger.info("[signal.trace] auth.complete", {
        connectionId: context.connectionId,
        type: message.type,
        correlationId: message.correlationId,
        timestamp: message.timestamp,
        hasLiveConnection: Boolean(
          context.connectionRegistry.get(context.connectionId)
        )
      });

      return result;
    }

    case "client.reconnect": {
      return handleClientReconnect(message, context);
    }

    case "client.join-session": {
      return handleJoinSession(message, context);
    }

    case "client.leave-session": {
      return handleLeaveSession(message, context);
    }

    case "client.heartbeat": {
      return handleClientHeartbeat(message, context);
    }

    case "client.call-request": {
      const liveConnection = context.connectionRegistry.get(context.connectionId);
      if (!liveConnection) {
        throw new Error("Connection must authenticate before requesting a call");
      }

      if (liveConnection.role !== "signer" && liveConnection.role !== "admin") {
        throw new Error("Only signer or admin connections can request calls");
      }

      return handleCallRequest(message, liveConnection.userId);
    }

    case "client.assignment-response": {
      const liveConnection = context.connectionRegistry.get(context.connectionId);
      if (!liveConnection) {
        throw new Error("Connection must authenticate before responding to assignments");
      }

      return handleAssignmentResponse({
        message,
        actorId: liveConnection.userId,
        actorRole: liveConnection.role
      });
    }

    case "signal.offer": {
      return {
        peerMessages: await handleOffer({
          message,
          connectionId: context.connectionId,
          sessionRegistry: context.sessionRegistry
        })
      };
    }

    case "signal.answer": {
      return {
        peerMessages: await handleAnswer({
          message,
          connectionId: context.connectionId,
          sessionRegistry: context.sessionRegistry
        })
      };
    }

    case "signal.ice-candidate": {
      return {
        peerMessages: await handleIceCandidate({
          message,
          connectionId: context.connectionId,
          sessionRegistry: context.sessionRegistry
        })
      };
    }

    default: {
      throw new Error(`Unsupported signaling message type: ${message.type}`);
    }
  }
}
