"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticateLocalUser } from "../api/client";
import {
  clearStoredAuthIdentity,
  getSeededIdentityForRole,
  getStoredAuthIdentity,
  setStoredAuthIdentity,
  type AuthIdentity,
  type AuthRole
} from "../state/auth-store";

function getDestinationForRole(role: AuthRole) {
  if (role === "interpreter") {
    return "/interpreter";
  }

  return "/queue";
}

export default function HomePage() {
  const router = useRouter();
  const [identity, setIdentity] = useState<AuthIdentity | null>(null);
  const [status, setStatus] = useState("Unauthenticated");
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const stored = getStoredAuthIdentity();
    if (!stored) {
      return;
    }

    setIdentity(stored);
    setStatus("Authenticated");
  }, []);

  const continueTarget = useMemo(
    () => (identity ? getDestinationForRole(identity.role) : null),
    [identity]
  );

  async function handleAuthenticate(role: "signer" | "interpreter") {
    const seededIdentity = getSeededIdentityForRole(role);
    if (!seededIdentity) {
      setError(`Seeded ${role} identity is unavailable`);
      return;
    }

    try {
      setIsAuthenticating(true);
      setStatus("Authenticating");
      const result = await authenticateLocalUser({ userId: seededIdentity.userId });
      const nextIdentity = result.identity as AuthIdentity;
      setStoredAuthIdentity(nextIdentity);
      setIdentity(nextIdentity);
      setStatus("Authenticated");
      setError(null);
      router.push(getDestinationForRole(nextIdentity.role));
    } catch (authError) {
      setStatus("Authentication failed");
      setError(authError instanceof Error ? authError.message : "Authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  }

  function handleSignOut() {
    clearStoredAuthIdentity();
    setIdentity(null);
    setStatus("Unauthenticated");
    setError(null);
  }

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 760, margin: "0 auto", padding: 24 }}>
      <section
        style={{
          display: "grid",
          gap: 16,
          padding: 24,
          border: "1px solid #ddd",
          borderRadius: 12,
          background: "#fafafa"
        }}
      >
        <div>
          <h1 style={{ marginBottom: 8 }}>Web VRS Login</h1>
          <p style={{ margin: 0, fontSize: 18 }}>
            Choose your role and continue into the local Video Relay Service prototype.
          </p>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div><strong>Current local auth flow</strong></div>
          <div>- Deaf user enters the call flow through the queue</div>
          <div>- Interpreter enters the interpreter workspace</div>
          <div>- Authenticated identity persists across reload</div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 8,
            padding: 16,
            border: "1px solid #eee",
            borderRadius: 10,
            background: "#fff"
          }}
        >
          <div data-testid="home-auth-state"><strong>Auth state:</strong> {status}</div>
          <div data-testid="home-identity"><strong>Authenticated identity:</strong> {identity?.userId ?? "unauthenticated"}</div>
          <div><strong>Authenticated role:</strong> {identity?.role ?? "none"}</div>
          {error ? <div data-testid="home-auth-error"><strong>Error:</strong> {error}</div> : null}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => handleAuthenticate("signer")}
            disabled={isAuthenticating}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              fontWeight: 600
            }}
            data-testid="home-login-signer"
          >
            Continue as Deaf User
          </button>
          <button
            type="button"
            onClick={() => handleAuthenticate("interpreter")}
            disabled={isAuthenticating}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#fff",
              color: "#111",
              fontWeight: 600
            }}
            data-testid="home-login-interpreter"
          >
            Continue as Interpreter
          </button>
          {continueTarget ? (
            <Link href={continueTarget} data-testid="home-continue-link">
              Continue to current workspace
            </Link>
          ) : null}
          {identity ? (
            <button type="button" onClick={handleSignOut} data-testid="home-sign-out">
              Sign out
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
