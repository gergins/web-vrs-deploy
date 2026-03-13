"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  authenticateLocalUser,
  createCallRequest,
  getQueueStatus
} from "../../api/client";
import { SignalingClient } from "../../signaling/signaling-client";
import { createClientEnvelope, signalingEvents } from "../../signaling/signaling-events";
import {
  getSeededIdentityForRole,
  getStoredAuthIdentity,
  setStoredAuthIdentity,
  type AuthIdentity
} from "../../state/auth-store";
import { getPublicEnv } from "../../utils/env";

type QueueEvent = {
  type: string;
  actorId?: string;
  payload: Record<string, unknown>;
  sessionId: string | null;
};

function buildCallUrl(sessionId: string, role: "signer" | "interpreter") {
  const params = new URLSearchParams({
    role
  });
  return `/call/${sessionId}?${params.toString()}`;
}

export default function QueuePage() {
  const router = useRouter();
  const wsUrl = useMemo(() => getPublicEnv().wsUrl, []);
  const [identity, setIdentity] = useState<AuthIdentity | null>(null);
  const [callRequestId, setCallRequestId] = useState("");
  const [callState, setCallState] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<QueueEvent | null>(null);
  const [lastEventType, setLastEventType] = useState("none yet");
  const [statusText, setStatusText] = useState("Unauthenticated");
  const [authStatus, setAuthStatus] = useState("Unauthenticated");
  const [error, setError] = useState<string | null>(null);
  const [navigationTarget, setNavigationTarget] = useState("none yet");
  const [lastEventActorId, setLastEventActorId] = useState("none");

  useEffect(() => {
    const stored = getStoredAuthIdentity();
    if (stored?.role === "signer") {
      setIdentity(stored);
      setAuthStatus("Authenticated");
    }
  }, []);

  useEffect(() => {
    if (!identity) {
      setStatusText("Unauthenticated");
      return;
    }

    const client = new SignalingClient();
    client.connect(wsUrl);
    client.onOpen(() => {
      setStatusText("Signaling connected, sending client.auth");
      client.send(
        createClientEnvelope({
          type: signalingEvents.clientAuth,
          actorId: identity.userId,
          payload: { role: identity.role }
        })
      );
    });
    client.onMessage((message) => {
      const typed = message as QueueEvent;
      setLastEvent(typed);
      setLastEventType(typed.type);
      setLastEventActorId(typeof typed.actorId === "string" ? typed.actorId : "none");

      if (typed.type === signalingEvents.queueUpdated) {
        const state = typed.payload.state;
        if (typeof state === "string") {
          setCallState(state);
        }
      }

      if (typed.type === signalingEvents.sessionCreated && typeof typed.sessionId === "string") {
        const targetUrl = buildCallUrl(typed.sessionId, "signer");
        setSessionId(typed.sessionId);
        setCallState("session_created");
        setStatusText("Session created, opening call page");
        setNavigationTarget(targetUrl);
        router.push(targetUrl);
      }

      if (typed.type === signalingEvents.assignmentAccepted) {
        setCallState("accepted");
        setStatusText("Assignment accepted");
      }

      if (typed.type === signalingEvents.assignmentDeclined) {
        setCallState("queued");
        setStatusText("Assignment declined, waiting in queue");
      }

      if (typed.type === signalingEvents.serverError) {
        const serverError = typed.payload.error;
        if (typeof serverError === "string") {
          setError(serverError);
          setStatusText("Server error received");
        }
      }
    });
    client.onClose(() => {
      setStatusText("Signaling disconnected");
    });

    return () => {
      client.close();
    };
  }, [identity, router, wsUrl]);

  async function handleAuthenticate() {
    const seededIdentity = getSeededIdentityForRole("signer");
    if (!seededIdentity) {
      setError("Seeded signer identity is unavailable");
      return;
    }

    try {
      setAuthStatus("Authenticating");
      const result = await authenticateLocalUser({
        userId: seededIdentity.userId
      });
      const nextIdentity = result.identity as AuthIdentity;
      setStoredAuthIdentity(nextIdentity);
      setIdentity(nextIdentity);
      setAuthStatus("Authenticated");
      setStatusText("Authenticated");
      setError(null);
    } catch (authError) {
      setAuthStatus("Authentication failed");
      setError(authError instanceof Error ? authError.message : "Authentication failed");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!identity) {
      setStatusText("Unauthenticated");
      setError("Authenticate as the seeded signer before creating a call request");
      return;
    }

    try {
      setStatusText("Creating call request");
      const result = await createCallRequest({ requesterId: identity.userId });
      const createdCallRequest = result.callRequest as {
        id: string;
        state: string;
      };

      console.log("[queue] call request created", createdCallRequest);
      setCallRequestId(createdCallRequest.id);
      setCallState(createdCallRequest.state);
      setStatusText("Call request created");
    } catch (submitError) {
      console.error("[queue] call request failed", submitError);
      setError(submitError instanceof Error ? submitError.message : "Unknown queue error");
      setStatusText("Create call failed");
    }
  }

  async function refreshQueue() {
    if (!callRequestId) {
      return;
    }

    try {
      const result = await getQueueStatus(callRequestId);
      const queue = result.queue as {
        state: string;
      };
      setCallState(queue.state);
      setStatusText("Queue status refreshed");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh queue");
    }
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
          background: "#fafafa",
          marginBottom: 24
        }}
      >
        <h1 style={{ margin: 0 }}>Start a Relay Call</h1>
        <p style={{ margin: 0 }}>
          Use this page to request an interpreter and enter the call when a session is ready.
        </p>

        <div style={{ display: "grid", gap: 8 }}>
          <div><strong>Step 1</strong> Authenticate the Deaf user identity.</div>
          <div><strong>Step 2</strong> Start the call request.</div>
          <div><strong>Step 3</strong> Wait for interpreter assignment and session creation.</div>
        </div>
      </section>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <div data-testid="queue-actor-id"><strong>Deaf user actorId:</strong> {identity?.userId ?? "unauthenticated"}</div>
        {!identity ? (
          <button type="button" onClick={handleAuthenticate} style={{ width: 220, padding: 10 }} data-testid="queue-authenticate">
            Authenticate Deaf User
          </button>
        ) : null}
        <button type="submit" style={{ width: 220, padding: 10 }} data-testid="queue-create-call">
          Start Call
        </button>
      </form>

      <div style={{ display: "grid", gap: 8, padding: 16, border: "1px solid #eee", borderRadius: 10 }}>
        <div data-testid="queue-auth-state"><strong>Auth state:</strong> {authStatus}</div>
        <div><strong>User role:</strong> signer</div>
        <div data-testid="queue-identity"><strong>Authenticated identity:</strong> {identity?.userId ?? "unauthenticated"}</div>
        <div><strong>Call status:</strong> {statusText}</div>
        <div><strong>Call request id:</strong> {callRequestId || "none"}</div>
        <div><strong>Queue state:</strong> {callState || "none"}</div>
        <div data-testid="queue-session-id"><strong>Session id:</strong> {sessionId || "none"}</div>
      </div>

      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Technical diagnostics</summary>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <div><strong>Event payload actorId:</strong> {lastEventActorId}</div>
        <div><strong>Signer navigation target:</strong> {navigationTarget}</div>
        <div><strong>Signer navigation role:</strong> signer</div>
        <div data-testid="queue-last-event"><strong>Last event:</strong> {lastEventType}</div>
        {error ? <div data-testid="queue-error"><strong>Error:</strong> {error}</div> : null}
        </div>
      </details>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <button type="button" onClick={refreshQueue} disabled={!callRequestId}>
          Refresh Queue Status
        </button>
        {sessionId ? (
          <Link href={buildCallUrl(sessionId, "signer")}>Open Call Page</Link>
        ) : null}
      </div>

      {lastEvent ? (
        <pre style={{ marginTop: 24, padding: 12, background: "#f4f4f4", overflowX: "auto" }}>
          {JSON.stringify(lastEvent, null, 2)}
        </pre>
      ) : null}
    </main>
  );
}
