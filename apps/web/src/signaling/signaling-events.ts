export const signalingEvents = {
  clientAuth: "client.auth",
  clientJoinSession: "client.join-session",
  clientLeaveSession: "client.leave-session",
  clientHeartbeat: "client.heartbeat",
  clientReconnect: "client.reconnect",
  clientAssignmentResponse: "client.assignment-response",
  queueUpdated: "queue.updated",
  assignmentOffered: "assignment.offered",
  assignmentAccepted: "assignment.accepted",
  assignmentDeclined: "assignment.declined",
  sessionCreated: "session.created",
  sessionJoined: "session.joined",
  sessionEnded: "session.ended",
  signalOffer: "signal.offer",
  signalAnswer: "signal.answer",
  signalIceCandidate: "signal.ice-candidate",
  serverAuthenticated: "server.authenticated",
  serverError: "server.error"
} as const;

export function createClientEnvelope(input: {
  type: string;
  actorId: string;
  sessionId?: string | null;
  payload?: Record<string, unknown>;
}) {
  return {
    messageId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    type: input.type,
    timestamp: new Date().toISOString(),
    sessionId: input.sessionId ?? null,
    actorId: input.actorId,
    payload: input.payload ?? {}
  };
}
