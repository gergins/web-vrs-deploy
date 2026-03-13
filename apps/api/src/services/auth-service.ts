import type { UserRecord } from "../db/model-types";
import { UserRepository } from "../repositories/user-repository";

export type AuthenticatedIdentity = {
  userId: string;
  role: "signer" | "interpreter" | "admin";
};

function isSupportedRole(role: string): role is AuthenticatedIdentity["role"] {
  return role === "signer" || role === "interpreter" || role === "admin";
}

export class AuthService {
  constructor(private readonly userRepository = new UserRepository()) {}

  async authenticateLocalUser(userId: string): Promise<AuthenticatedIdentity> {
    const user = await this.requireUser(userId);

    if (!isSupportedRole(user.role)) {
      throw new Error("User role is not supported by the current local auth flow");
    }

    return {
      userId: user.id,
      role: user.role
    };
  }

  async assertAuthenticatedIdentity(input: {
    userId: string;
    role: string;
  }): Promise<AuthenticatedIdentity> {
    const identity = await this.authenticateLocalUser(input.userId);

    if (identity.role !== input.role) {
      throw new Error("Authenticated user role does not match signaling role");
    }

    return identity;
  }

  private async requireUser(userId: string): Promise<UserRecord> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Local seeded user not found");
    }

    return user;
  }
}
