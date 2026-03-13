import type { InboundSignalMessage } from "./dto/inbound-signal-message";
import type { LiveConnection } from "./signaling-connection-registry";
import { AuthService } from "../services/auth-service";

function isRole(value: unknown): value is LiveConnection["role"] {
  return value === "signer" || value === "interpreter" || value === "admin";
}

const authService = new AuthService();

export async function authenticateSignalActor(
  message: InboundSignalMessage,
  connectionId: string
): Promise<LiveConnection> {
  const role = message.payload.role;

  if (!isRole(role)) {
    throw new Error(`${message.type} requires a valid role`);
  }

  const identity = await authService.assertAuthenticatedIdentity({
    userId: message.actorId,
    role
  });

  return {
    connectionId,
    userId: identity.userId,
    role: identity.role,
    authenticatedAt: new Date().toISOString(),
    sessionIds: new Set<string>()
  };
}
