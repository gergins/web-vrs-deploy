export class SignalingSessionRegistry {
  private readonly sessions = new Map<string, Set<string>>();
  private readonly sessionsByConnection = new Map<string, Set<string>>();

  join(sessionId: string, connectionId: string) {
    const set = this.sessions.get(sessionId) ?? new Set<string>();
    set.add(connectionId);
    this.sessions.set(sessionId, set);

    const connectionSessions = this.sessionsByConnection.get(connectionId) ?? new Set<string>();
    connectionSessions.add(sessionId);
    this.sessionsByConnection.set(connectionId, connectionSessions);
  }

  leave(sessionId: string, connectionId: string) {
    const set = this.sessions.get(sessionId);
    if (!set) return;
    set.delete(connectionId);
    if (set.size === 0) this.sessions.delete(sessionId);

    const connectionSessions = this.sessionsByConnection.get(connectionId);
    connectionSessions?.delete(sessionId);
    if (connectionSessions && connectionSessions.size === 0) {
      this.sessionsByConnection.delete(connectionId);
    }
  }

  getConnections(sessionId: string) {
    return this.sessions.get(sessionId) ?? new Set<string>();
  }

  getPeerConnections(sessionId: string, senderConnectionId: string) {
    return [...this.getConnections(sessionId)].filter(
      (connectionId) => connectionId !== senderConnectionId
    );
  }

  cleanupConnection(connectionId: string) {
    const sessionIds = this.sessionsByConnection.get(connectionId);
    if (!sessionIds) return;

    for (const sessionId of [...sessionIds]) {
      this.leave(sessionId, connectionId);
    }
  }
}
