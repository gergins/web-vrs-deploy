import {
  inboundEventTypes,
  type InboundEventType,
  type InboundSignalMessage
} from "./dto/inbound-signal-message";

function isRecord(input: unknown): input is Record<string, unknown> {
  return !!input && typeof input === "object" && !Array.isArray(input);
}

export function validateSignalMessage(input: unknown): InboundSignalMessage {
  if (!isRecord(input)) {
    throw new Error("Invalid signaling message");
  }

  const {
    messageId,
    correlationId,
    type,
    timestamp,
    sessionId,
    actorId,
    payload
  } = input;

  if (typeof messageId !== "string" || messageId.length === 0) {
    throw new Error("Invalid signaling message: messageId");
  }

  if (typeof correlationId !== "string" || correlationId.length === 0) {
    throw new Error("Invalid signaling message: correlationId");
  }

  if (typeof type !== "string" || !inboundEventTypes.includes(type as InboundEventType)) {
    throw new Error("Invalid signaling message: type");
  }

  if (typeof timestamp !== "string" || Number.isNaN(Date.parse(timestamp))) {
    throw new Error("Invalid signaling message: timestamp");
  }

  if (sessionId !== null && typeof sessionId !== "string") {
    throw new Error("Invalid signaling message: sessionId");
  }

  if (typeof actorId !== "string" || actorId.length === 0) {
    throw new Error("Invalid signaling message: actorId");
  }

  if (!isRecord(payload)) {
    throw new Error("Invalid signaling message: payload");
  }

  return {
    messageId,
    correlationId,
    type: type as InboundEventType,
    timestamp,
    sessionId,
    actorId,
    payload
  };
}
