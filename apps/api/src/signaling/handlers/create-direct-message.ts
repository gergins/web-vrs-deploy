import type { InboundSignalMessage } from "../dto/inbound-signal-message";
import {
  createOutboundSignalMessage,
  type OutboundSignalMessage
} from "../dto/outbound-signal-message";

export function createDirectMessage(
  message: InboundSignalMessage,
  type: OutboundSignalMessage["type"],
  payload: Record<string, unknown>
) {
  return createOutboundSignalMessage({
    correlationId: message.correlationId,
    type,
    actorId: message.actorId,
    sessionId: message.sessionId,
    payload
  });
}
