export const inboundEventTypes = [
  "client.auth",
  "client.join-session",
  "client.leave-session",
  "client.call-request",
  "client.assignment-response",
  "client.heartbeat",
  "client.reconnect",
  "signal.offer",
  "signal.answer",
  "signal.ice-candidate"
] as const;

export type InboundEventType = (typeof inboundEventTypes)[number];

export type InboundSignalMessage = {
  messageId: string;
  correlationId: string;
  type: InboundEventType;
  timestamp: string;
  sessionId: string | null;
  actorId: string;
  payload: Record<string, unknown>;
};
