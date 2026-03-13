export type AuthRole = "signer" | "interpreter" | "admin";

export type AuthIdentity = {
  userId: string;
  role: AuthRole;
};

const AUTH_STORAGE_KEY = "web-vrs.auth.identity";

export const seededIdentities: AuthIdentity[] = [
  {
    userId: "user-signer-1",
    role: "signer"
  },
  {
    userId: "user-interpreter-1",
    role: "interpreter"
  }
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isAuthRole(value: unknown): value is AuthRole {
  return value === "signer" || value === "interpreter" || value === "admin";
}

export function getStoredAuthIdentity(): AuthIdentity | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthIdentity>;
    if (typeof parsed.userId !== "string" || !isAuthRole(parsed.role)) {
      return null;
    }

    return {
      userId: parsed.userId,
      role: parsed.role
    };
  } catch {
    return null;
  }
}

export function setStoredAuthIdentity(identity: AuthIdentity) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(identity));
}

export function clearStoredAuthIdentity() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getSeededIdentityForRole(role: AuthRole) {
  return seededIdentities.find((identity) => identity.role === role) ?? null;
}
