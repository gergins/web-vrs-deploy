import type { SignalEnvelope } from "./envelopes";
import type { InboundEventType } from "./event-types";

export type InboundSignalMessage = SignalEnvelope<InboundEventType, Record<string, unknown>>;
