import { env } from "../config/env";
import {
  clearConnectionPresence,
  getLastSeenForConnection,
  getLastSeenForUser,
  touchConnectionPresence
} from "../realtime/redis-presence";
import {
  cacheSessionMembership,
  clearCachedSessionMembership,
  getCachedSessionMembership
} from "../realtime/redis-session-cache";

export class SignalingHeartbeat {
  private readonly lastSeenByConnection = new Map<string, number>();

  async touch(connectionId: string, userId?: string, sessionIds: string[] = []) {
    const now = Date.now();
    this.lastSeenByConnection.set(connectionId, now);
    await touchConnectionPresence(connectionId, userId);

    if (userId) {
      await cacheSessionMembership(userId, sessionIds);
    }
  }

  reapStaleConnections() {
    const staleBefore = Date.now() - env.sessionHeartbeatIntervalMs * 2;

    return [...this.lastSeenByConnection.entries()]
      .filter(([, lastSeenAt]) => lastSeenAt < staleBefore)
      .map(([connectionId]) => connectionId);
  }

  async isReconnectAllowed(input: {
    connectionId?: string;
    userId: string;
    sessionId?: string | null;
  }) {
    const threshold = Date.now() - env.reconnectGraceMs;
    const userLastSeen = await getLastSeenForUser(input.userId);
    if (userLastSeen !== null && userLastSeen >= threshold) {
      if (!input.sessionId) {
        return true;
      }

      const cachedSessionIds = await getCachedSessionMembership(input.userId);
      return cachedSessionIds.includes(input.sessionId);
    }

    if (input.connectionId) {
      const connectionLastSeen = await getLastSeenForConnection(input.connectionId);
      return connectionLastSeen !== null && connectionLastSeen >= threshold;
    }

    return false;
  }

  async remove(connectionId: string, userId?: string) {
    this.lastSeenByConnection.delete(connectionId);
    await clearConnectionPresence(connectionId);
    if (userId) {
      await clearCachedSessionMembership(userId);
    }
  }
}
