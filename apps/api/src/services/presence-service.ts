import { getLastSeenForUser } from "../realtime/redis-presence";
import type { OutboundSignalMessage } from "../signaling/dto/outbound-signal-message";
import { signalingPresenceBridge } from "../signaling/signaling-presence-bridge";

export class PresenceService {
  emitToUser(userId: string, message: OutboundSignalMessage) {
    return signalingPresenceBridge.emitToUser(userId, message);
  }

  async isUserPresent(userId: string) {
    if (signalingPresenceBridge.connectionRegistry.getConnectionsForUser(userId).length > 0) {
      return true;
    }

    const lastSeen = await getLastSeenForUser(userId);
    return lastSeen !== null;
  }
}
