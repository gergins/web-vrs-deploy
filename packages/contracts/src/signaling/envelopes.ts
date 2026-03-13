export interface SignalEnvelope<TType extends string = string, TPayload = unknown> {
  messageId: string;
  correlationId: string;
  type: TType;
  timestamp: string;
  sessionId: string | null;
  actorId: string;
  payload: TPayload;
}
