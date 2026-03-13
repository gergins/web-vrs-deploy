"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticateLocalUser } from "../../api/client";
import { SignalingClient } from "../../signaling/signaling-client";
import { createClientEnvelope, signalingEvents } from "../../signaling/signaling-events";
import {
  getSeededIdentityForRole,
  getStoredAuthIdentity,
  setStoredAuthIdentity,
  type AuthIdentity
} from "../../state/auth-store";
import { getPublicEnv } from "../../utils/env";

type InterpreterOffer = {
  assignmentAttemptId: string;
  callRequestId: string;
  interpreterId: string;
};

type SignalingMessage = {
  type: string;
  actorId?: string;
  sessionId: string | null;
  payload: Record<string, unknown>;
};

function buildCallUrl(sessionId: string, role: "signer" | "interpreter") {
  const params = new URLSearchParams({
    role
  });
  return `/call/${sessionId}?${params.toString()}`;
}

export default function InterpreterPage() {
  const router = useRouter();
  const wsUrl = useMemo(() => getPublicEnv().wsUrl, []);
  const clientRef = useRef<SignalingClient | null>(null);
  const [identity, setIdentity] = useState<AuthIdentity | null>(null);
  const [status, setStatus] = useState("Unauthenticated");
  const [authStatus, setAuthStatus] = useState("Unauthenticated");
  const [offers, setOffers] = useState<InterpreterOffer[]>([]);
  const [lastMessage, setLastMessage] = useState<string>("No signaling messages yet");
  const [lastEventType, setLastEventType] = useState("none yet");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [navigationTarget, setNavigationTarget] = useState("none yet");
  const [lastEventActorId, setLastEventActorId] = useState("none");

  useEffect(() => {
    const stored = getStoredAuthIdentity();
    if (stored?.role === "interpreter") {
      setIdentity(stored);
      setAuthStatus("Authenticated");
    }
  }, []);

  useEffect(() => {
    if (!identity) {
      setStatus("Unauthenticated");
      return;
    }

    const client = new SignalingClient();
    clientRef.current = client;
    client.connect(wsUrl);

    client.onOpen(() => {
      console.log("[interpreter] auth sent", {
        actorId: identity.userId,
        role: identity.role
      });
      setStatus("Signaling connected, sending client.auth");
      client.send(
        createClientEnvelope({
          type: signalingEvents.clientAuth,
          actorId: identity.userId,
          payload: { role: identity.role }
        })
      );
    });

    client.onMessage((message) => {
      const typed = message as SignalingMessage;
      console.log("[interpreter] inbound raw", typed);
      console.log("[interpreter] inbound event type", typed.type);
      setLastMessage(JSON.stringify(typed, null, 2));
      setLastEventType(typed.type);
      setLastEventActorId(typeof typed.actorId === "string" ? typed.actorId : "none");
    });

    client.on(signalingEvents.serverAuthenticated, (message) => {
      const typed = message as SignalingMessage;
      setStatus("Signaling authenticated");
      setLastMessage(JSON.stringify(typed, null, 2));
      setLastEventType(typed.type);
      setLastEventActorId(typeof typed.actorId === "string" ? typed.actorId : "none");
      console.log("[interpreter] auth acknowledged", typed);
    });

    client.on(signalingEvents.assignmentOffered, (message) => {
      const typed = message as SignalingMessage;
      setLastMessage(JSON.stringify(typed, null, 2));
      setLastEventType(typed.type);
      setLastEventActorId(typeof typed.actorId === "string" ? typed.actorId : "none");
      setStatus("Assignment offered");
      const assignmentAttemptId = typed.payload.assignmentAttemptId;
      const callRequestId = typed.payload.callRequestId;
      const interpreterId = typed.payload.interpreterId;

      if (
        typeof assignmentAttemptId === "string" &&
        typeof callRequestId === "string" &&
        typeof interpreterId === "string"
      ) {
        setOffers((current) => {
          const next = current.filter((offer) => offer.assignmentAttemptId !== assignmentAttemptId);
          next.push({
            assignmentAttemptId,
            callRequestId,
            interpreterId
          });
          return next;
        });
      }
    });

    client.on(signalingEvents.assignmentAccepted, (message) => {
      const typed = message as SignalingMessage;
      setLastMessage(JSON.stringify(typed, null, 2));
      setLastEventType(typed.type);
      setLastEventActorId(typeof typed.actorId === "string" ? typed.actorId : "none");
      setStatus("Assignment accepted");
    });

    client.on(signalingEvents.assignmentDeclined, (message) => {
      const typed = message as SignalingMessage;
      setLastMessage(JSON.stringify(typed, null, 2));
      setLastEventType(typed.type);
      setLastEventActorId(typeof typed.actorId === "string" ? typed.actorId : "none");
      setStatus("Assignment declined");
      const assignmentAttemptId = typed.payload.assignmentAttemptId;
      if (typeof assignmentAttemptId === "string") {
        setOffers((current) =>
          current.filter((offer) => offer.assignmentAttemptId !== assignmentAttemptId)
        );
      }
    });

    client.on(signalingEvents.sessionCreated, (message) => {
      const typed = message as SignalingMessage;
      setLastMessage(JSON.stringify(typed, null, 2));
      setLastEventType(typed.type);
      setLastEventActorId(typeof typed.actorId === "string" ? typed.actorId : "none");
      if (typed.sessionId) {
        const targetUrl = buildCallUrl(typed.sessionId, "interpreter");
        setCurrentSessionId(typed.sessionId);
        setStatus("Session created");
        setNavigationTarget(targetUrl);
        router.push(targetUrl);
      }
    });

    client.on(signalingEvents.serverError, (message) => {
      const typed = message as SignalingMessage;
      setLastMessage(JSON.stringify(typed, null, 2));
      setLastEventType(typed.type);
      setLastEventActorId(typeof typed.actorId === "string" ? typed.actorId : "none");
      const serverError = typed.payload.error;
      if (typeof serverError === "string") {
        setError(serverError);
        setStatus("Server error received");
      }
    });

    client.onClose(() => {
      setStatus("Signaling disconnected");
    });

    return () => {
      client.close();
      clientRef.current = null;
    };
  }, [identity, router, wsUrl]);

  async function handleAuthenticate() {
    const seededIdentity = getSeededIdentityForRole("interpreter");
    if (!seededIdentity) {
      setError("Seeded interpreter identity is unavailable");
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
      setStatus("Authenticated");
      setError(null);
    } catch (authError) {
      setAuthStatus("Authentication failed");
      setError(authError instanceof Error ? authError.message : "Authentication failed");
    }
  }

  function respondToOffer(offer: InterpreterOffer, decision: "accept" | "decline") {
    setError(null);
    if (!identity) {
      setError("Authenticate as the seeded interpreter before responding to offers");
      return;
    }
    clientRef.current?.send(
      createClientEnvelope({
        type: signalingEvents.clientAssignmentResponse,
        actorId: identity.userId,
        payload: {
          decision,
          callRequestId: offer.callRequestId,
          assignmentAttemptId: offer.assignmentAttemptId
        }
      })
    );

    if (decision === "decline") {
      setOffers((current) =>
        current.filter((item) => item.assignmentAttemptId !== offer.assignmentAttemptId)
      );
    }
  }

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 860, margin: "0 auto", padding: 24 }}>
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
        <div>
          <h1 style={{ margin: "0 0 8px" }}>Interpreter Workspace</h1>
          <p style={{ margin: 0 }}>
            Receive relay call offers, respond to assignments, and enter active sessions.
          </p>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div><strong>Current workflow</strong></div>
          <div>- authenticate the interpreter identity</div>
          <div>- wait for an incoming offer</div>
          <div>- accept or decline the assignment</div>
          <div>- enter the active call session</div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          marginBottom: 24
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 10,
            padding: 16,
            border: "1px solid #eee",
            borderRadius: 10,
            background: "#fff"
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20 }}>Interpreter Identity</h2>
          <div data-testid="interpreter-auth-state"><strong>Auth state:</strong> {authStatus}</div>
          <div><strong>Role:</strong> interpreter</div>
          <div data-testid="interpreter-identity"><strong>Authenticated identity:</strong> {identity?.userId ?? "unauthenticated"}</div>
          <div data-testid="interpreter-actor-id"><strong>ActorId in use:</strong> {identity?.userId ?? "unauthenticated"}</div>
          {!identity ? (
            <button
              type="button"
              onClick={handleAuthenticate}
              style={{ width: 240, padding: 10 }}
              data-testid="interpreter-authenticate"
            >
              Authenticate Interpreter
            </button>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
            padding: 16,
            border: "1px solid #eee",
            borderRadius: 10,
            background: "#fff"
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20 }}>Workspace Status</h2>
          <div><strong>Status:</strong> {status}</div>
          <div data-testid="interpreter-session-id"><strong>Current session:</strong> {currentSessionId || "none"}</div>
          <div><strong>Open offers:</strong> {offers.length}</div>
          <div data-testid="interpreter-last-event"><strong>Last event:</strong> {lastEventType}</div>
          {error ? <div data-testid="interpreter-error"><strong>Error:</strong> {error}</div> : null}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: 12,
          padding: 20,
          border: "1px solid #ddd",
          borderRadius: 12,
          background: "#fff",
          marginBottom: 24
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 8px" }}>Incoming Offers</h2>
          <p style={{ margin: 0 }}>
            Respond to call assignments here. Accepting an offer opens the active call session.
          </p>
        </div>

        {offers.length === 0 ? (
          <div
            style={{
              padding: 16,
              border: "1px dashed #ccc",
              borderRadius: 10,
              background: "#fafafa"
            }}
          >
            No current offers.
          </div>
        ) : null}

        {offers.map((offer) => (
          <div
            key={offer.assignmentAttemptId}
            style={{
              border: "1px solid #ccc",
              borderRadius: 10,
              padding: 16,
              display: "grid",
              gap: 10,
              background: "#fafafa"
            }}
          >
            <div><strong>Call request:</strong> {offer.callRequestId}</div>
            <div><strong>Assignment attempt:</strong> {offer.assignmentAttemptId}</div>
            <div><strong>Interpreter id:</strong> {offer.interpreterId}</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => respondToOffer(offer, "accept")}
                data-testid="interpreter-accept"
                style={{ padding: "10px 16px" }}
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => respondToOffer(offer, "decline")}
                style={{ padding: "10px 16px" }}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </section>

      <p style={{ marginTop: 24 }}>
        <Link href="/">Back to role selector</Link>
      </p>

      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Technical diagnostics</summary>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <div><strong>Event payload actorId:</strong> {lastEventActorId}</div>
          <div><strong>Interpreter navigation target:</strong> {navigationTarget}</div>
          <div><strong>Interpreter navigation role:</strong> interpreter</div>
        </div>
        <pre style={{ marginTop: 16, padding: 12, background: "#f4f4f4", overflowX: "auto" }}>
          {lastMessage}
        </pre>
      </details>
    </main>
  );
}
