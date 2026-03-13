import type { OutboundSignalMessage } from "../signaling/dto/outbound-signal-message";
import { signalingPresenceBridge } from "../signaling/signaling-presence-bridge";

export class PresenceService {
  emitToUser(userId: string, message: OutboundSignalMessage) {
    return signalingPresenceBridge.emitToUser(userId, message);
  }
}

