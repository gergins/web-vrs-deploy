import { createId } from "../../utils/ids";
import { nowIsoString } from "../../utils/time";

export const outboundEventTypes = [
  "server.authenticated",
  "server.error",
  "queue.updated",
  "assignment.offered",
  "assignment.accepted",
  "assignment.declined",
  "session.created",
  "session.joined",
  "session.connecting",
  "session.connected",
  "session.reconnecting",
  "session.degraded",
  "session.failed",
  "session.ended",
  "signal.offer",
  "signal.answer",
  "signal.ice-candidate"
] as const;

export type OutboundEventType = (typeof outboundEventTypes)[number];

export type OutboundSignalMessage = {
  messageId: string;
  correlationId: string;
  type: OutboundEventType;
  timestamp: string;
  sessionId: string | null;
  actorId: string;
  payload: Record<string, unknown>;
};

export function createOutboundSignalMessage(input: {
  correlationId: string;
  type: OutboundSignalMessage["type"];
  actorId: string;
  sessionId: string | null;
  payload: Record<string, unknown>;
}): OutboundSignalMessage {
  return {
    messageId: createId(),
    correlationId: input.correlationId,
    type: input.type,
    timestamp: nowIsoString(),
    sessionId: input.sessionId,
    actorId: input.actorId,
    payload: input.payload
  };
}
