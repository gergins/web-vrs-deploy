import type { WebSocket } from "ws";
import type { InboundSignalMessage } from "./dto/inbound-signal-message";
import type { OutboundSignalMessage } from "./dto/outbound-signal-message";
import { SignalingConnectionRegistry } from "./signaling-connection-registry";
import { SignalingHeartbeat } from "./signaling-heartbeat";
import { SignalingSessionRegistry } from "./signaling-session-registry";

export type SignalRouteContext = {
  connectionId: string;
  sockets: Map<string, WebSocket>;
  connectionRegistry: SignalingConnectionRegistry;
  sessionRegistry: SignalingSessionRegistry;
  heartbeat: SignalingHeartbeat;
};

export type SignalRouteResult = {
  directMessages?: OutboundSignalMessage[];
  peerMessages?: OutboundSignalMessage[];
  userMessages?: Array<{
    userId: string;
    message: OutboundSignalMessage;
  }>;
};

export type SignalRouteHandler = (
  message: InboundSignalMessage,
  context: SignalRouteContext
) => Promise<SignalRouteResult>;
