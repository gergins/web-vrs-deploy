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

export type InboundEventType = typeof inboundEventTypes[number];
export type OutboundEventType = typeof outboundEventTypes[number];
