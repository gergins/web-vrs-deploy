export interface LiveConnection {
  connectionId: string;
  userId: string;
  role: "signer" | "interpreter" | "admin";
  authenticatedAt: string;
  sessionIds: Set<string>;
}

export class SignalingConnectionRegistry {
  private readonly byConnection = new Map<string, LiveConnection>();
  private readonly byUserId = new Map<string, Set<string>>();

  register(connection: LiveConnection) {
    this.byConnection.set(connection.connectionId, connection);
    const connections = this.byUserId.get(connection.userId) ?? new Set<string>();
    connections.add(connection.connectionId);
    this.byUserId.set(connection.userId, connections);
  }

  remove(connectionId: string) {
    const connection = this.byConnection.get(connectionId);
    if (connection) {
      const connections = this.byUserId.get(connection.userId);
      connections?.delete(connectionId);
      if (connections && connections.size === 0) {
        this.byUserId.delete(connection.userId);
      }
    }

    this.byConnection.delete(connectionId);
  }

  get(connectionId: string) {
    return this.byConnection.get(connectionId);
  }

  isRegistered(connectionId: string) {
    return this.byConnection.has(connectionId);
  }

  addSession(connectionId: string, sessionId: string) {
    const connection = this.byConnection.get(connectionId);
    if (!connection) return;

    connection.sessionIds.add(sessionId);
  }

  removeSession(connectionId: string, sessionId: string) {
    const connection = this.byConnection.get(connectionId);
    if (!connection) return;

    connection.sessionIds.delete(sessionId);
  }

  getConnectionsForUser(userId: string) {
    return [...(this.byUserId.get(userId) ?? new Set<string>())];
  }
}
