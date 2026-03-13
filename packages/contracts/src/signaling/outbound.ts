import type { SignalEnvelope } from "./envelopes";
import type { OutboundEventType } from "./event-types";

export type OutboundSignalMessage = SignalEnvelope<OutboundEventType, Record<string, unknown>>;
