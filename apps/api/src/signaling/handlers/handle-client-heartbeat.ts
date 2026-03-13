import type { InboundSignalMessage } from "../dto/inbound-signal-message";
import type { SignalRouteContext, SignalRouteResult } from "../signaling-context";

export async function handleClientHeartbeat(
  _message: InboundSignalMessage,
  context: SignalRouteContext
): Promise<SignalRouteResult> {
  const liveConnection = context.connectionRegistry.get(context.connectionId);
  await context.heartbeat.touch(
    context.connectionId,
    liveConnection?.userId,
    liveConnection ? [...liveConnection.sessionIds] : []
  );

  return {};
}
