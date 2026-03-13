import type { OutboundSignalMessage } from "../dto/outbound-signal-message";
import type { InboundSignalMessage } from "../dto/inbound-signal-message";
import type { SignalingSessionRegistry } from "../signaling-session-registry";

type HandleSignalRelayParams = {
  message: InboundSignalMessage;
  connectionId: string;
  sessionRegistry: SignalingSessionRegistry;
};

export async function handleIceCandidate({
  message,
  connectionId,
  sessionRegistry
}: HandleSignalRelayParams): Promise<OutboundSignalMessage[]> {
  if (!message.sessionId) {
    throw new Error("signal.ice-candidate requires sessionId");
  }

  const isMember = sessionRegistry.getConnections(message.sessionId).has(connectionId);
  if (!isMember) {
    throw new Error("Connection must join the session before sending signal.ice-candidate");
  }

  return [
    {
      ...message,
      type: "signal.ice-candidate"
    }
  ];
}
