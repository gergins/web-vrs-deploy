"use client";

import { useEffect, useRef, useState } from "react";
import {
  getTurnCredentials,
  type TurnCredentialsResponse,
  type TurnIceServer
} from "../../api/client";

type LogEntry = {
  timestamp: string;
  message: string;
};

type HarnessState = "idle" | "loading" | "ready" | "gathering" | "completed" | "failed";
type HarnessMode = "default" | "relay-only";
type CandidateType = "host" | "srflx" | "prflx" | "relay" | "unknown";
type CandidateEntry = {
  candidate: string;
  type: CandidateType;
};

type IceCandidateErrorEntry = {
  url: string;
  errorCode: number;
  errorText: string;
};

function toJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function classifyCandidateType(candidate: string): CandidateType {
  const match = candidate.match(/\styp\s([a-z]+)/i);
  const candidateType = match?.[1]?.toLowerCase();

  if (
    candidateType === "host" ||
    candidateType === "srflx" ||
    candidateType === "prflx" ||
    candidateType === "relay"
  ) {
    return candidateType;
  }

  return "unknown";
}

function createEmptyCandidateCounts(): Record<CandidateType, number> {
  return {
    host: 0,
    srflx: 0,
    prflx: 0,
    relay: 0,
    unknown: 0
  };
}

export default function TurnTestPage() {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [harnessMode, setHarnessMode] = useState<HarnessMode>("default");
  const [harnessState, setHarnessState] = useState<HarnessState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [turnResponse, setTurnResponse] = useState<TurnCredentialsResponse["turn"] | null>(null);
  const [iceGatheringState, setIceGatheringState] = useState<RTCIceGatheringState>("new");
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState>("new");
  const [iceCandidates, setIceCandidates] = useState<CandidateEntry[]>([]);
  const [iceCandidateErrors, setIceCandidateErrors] = useState<IceCandidateErrorEntry[]>([]);
  const [candidateCounts, setCandidateCounts] = useState<Record<CandidateType, number>>(
    createEmptyCandidateCounts()
  );
  const [logs, setLogs] = useState<LogEntry[]>([]);

  function appendLog(message: string) {
    const entry = {
      timestamp: new Date().toISOString(),
      message
    };

    console.log("[turn-test]", message);
    setLogs((current) => [entry, ...current].slice(0, 40));
  }

  function resetHarness() {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    setHarnessState("idle");
    setError(null);
    setTurnResponse(null);
    setIceGatheringState("new");
    setIceConnectionState("new");
    setIceCandidates([]);
    setIceCandidateErrors([]);
    setCandidateCounts(createEmptyCandidateCounts());
    setLogs([]);
  }

  async function runHarness(mode: HarnessMode) {
    resetHarness();
    setHarnessMode(mode);
    setHarnessState("loading");
    appendLog(`Fetching TURN credentials for ${mode} mode`);

    try {
      const response = await getTurnCredentials();
      const turn = response.turn;
      setTurnResponse(turn);
      appendLog(`Fetched ${turn.iceServers.length} ICE server entries`);

      const peerConnection = new RTCPeerConnection({
        iceServers: turn.iceServers as RTCIceServer[],
        iceTransportPolicy: mode === "relay-only" ? "relay" : "all"
      });
      peerConnectionRef.current = peerConnection;
      setHarnessState("ready");
      setIceGatheringState(peerConnection.iceGatheringState);
      setIceConnectionState(peerConnection.iceConnectionState);
      appendLog(`RTCPeerConnection created with iceTransportPolicy=${peerConnection.getConfiguration().iceTransportPolicy ?? "all"}`);

      peerConnection.onicecandidate = (event) => {
        const candidateText = event.candidate?.candidate ?? "[null candidate]";
        const candidateType = event.candidate ? classifyCandidateType(candidateText) : "unknown";
        appendLog(`icecandidate: ${candidateText}`);
        if (event.candidate) {
          setIceCandidates((current) => [
            { candidate: candidateText, type: candidateType },
            ...current
          ].slice(0, 20));
          setCandidateCounts((current) => ({
            ...current,
            [candidateType]: current[candidateType] + 1
          }));
          appendLog(`candidate classified as ${candidateType}`);
        }
        if (!event.candidate) {
          setHarnessState("completed");
        }
      };

      peerConnection.onicecandidateerror = (event) => {
        const errorEntry = {
          url: event.url ?? "unknown",
          errorCode: event.errorCode,
          errorText: event.errorText || "unknown"
        };
        const errorMessage =
          `icecandidateerror: url=${errorEntry.url} ` +
          `code=${errorEntry.errorCode} text=${errorEntry.errorText}`;
        appendLog(errorMessage);
        setIceCandidateErrors((current) => [errorEntry, ...current].slice(0, 20));
      };

      peerConnection.onicegatheringstatechange = () => {
        appendLog(`iceGatheringState: ${peerConnection.iceGatheringState}`);
        setIceGatheringState(peerConnection.iceGatheringState);
      };

      peerConnection.oniceconnectionstatechange = () => {
        appendLog(`iceConnectionState: ${peerConnection.iceConnectionState}`);
        setIceConnectionState(peerConnection.iceConnectionState);
      };

      // A local data channel is enough to trigger ICE gathering without call-flow integration.
      peerConnection.createDataChannel("turn-verification");
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      setHarnessState("gathering");
      appendLog(`Local offer created and applied for ${mode} mode`);
    } catch (harnessError) {
      const message =
        harnessError instanceof Error ? harnessError.message : "TURN verification failed";
      setError(message);
      setHarnessState("failed");
      appendLog(`Harness failed: ${message}`);
    }
  }

  useEffect(() => {
    return () => {
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
    };
  }, []);

  const iceServers: TurnIceServer[] = turnResponse?.iceServers ?? [];
  const relayCandidatesGathered = candidateCounts.relay > 0;
  const turnUrlFailures = iceCandidateErrors.filter((entry) =>
    entry.url.startsWith("turn:") || entry.url.startsWith("turns:")
  );

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 960, margin: "0 auto", padding: 24 }}>
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
          <h1 style={{ margin: "0 0 8px" }}>TURN Verification Harness</h1>
          <p style={{ margin: 0 }}>
            This dev-only page fetches backend TURN credentials and creates a standalone
            RTCPeerConnection to observe ICE gathering behavior.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => void runHarness("default")}
            data-testid="turn-test-run"
          >
            Run Default ICE Gathering
          </button>
          <button
            type="button"
            onClick={() => void runHarness("relay-only")}
            data-testid="turn-test-run-relay-only"
          >
            Run Relay-Only ICE Gathering
          </button>
          <button type="button" onClick={resetHarness} data-testid="turn-test-reset">
            Reset
          </button>
        </div>

        <section
          style={{
            display: "grid",
            gap: 8,
            padding: 16,
            border: "1px solid #eee",
            borderRadius: 10,
            background: "#fff"
          }}
        >
          <div><strong>Harness mode:</strong> {harnessMode}</div>
          <div><strong>Harness state:</strong> {harnessState}</div>
          <div><strong>ICE gathering state:</strong> {iceGatheringState}</div>
          <div><strong>ICE connection state:</strong> {iceConnectionState}</div>
          <div><strong>Relay candidates gathered:</strong> {relayCandidatesGathered ? "yes" : "no"}</div>
          <div><strong>Credential TTL:</strong> {turnResponse?.ttlSeconds ?? "not fetched"}</div>
          <div><strong>Credential expiry:</strong> {turnResponse?.expiresAt ?? "not fetched"}</div>
          {error ? <div><strong>Error:</strong> {error}</div> : null}
        </section>

        <section
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "minmax(280px, 1fr) minmax(280px, 1fr)"
          }}
        >
          <div
            style={{
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 12,
              background: "#fff"
            }}
          >
            <h2 style={{ marginTop: 0 }}>Fetched ICE Servers</h2>
            <pre
              style={{
                margin: 0,
                padding: 12,
                background: "#f4f4f4",
                overflowX: "auto"
              }}
            >
              {iceServers.length === 0 ? "No ICE servers fetched yet" : toJson(iceServers)}
            </pre>
          </div>

          <div
            style={{
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 12,
              background: "#fff"
            }}
          >
            <h2 style={{ marginTop: 0 }}>TURN URL Failures</h2>
            <pre
              style={{
                margin: 0,
                padding: 12,
                background: "#f4f4f4",
                overflowX: "auto"
              }}
            >
              {turnUrlFailures.length === 0
                ? "No TURN URL-specific failures yet"
                : toJson(turnUrlFailures)}
            </pre>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "minmax(280px, 1fr) minmax(280px, 1fr)"
          }}
        >
          <div
            style={{
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 12,
              background: "#fff"
            }}
          >
            <h2 style={{ marginTop: 0 }}>ICE Candidates</h2>
            <pre
              style={{
                margin: 0,
                padding: 12,
                background: "#f4f4f4",
                overflowX: "auto"
              }}
            >
              {iceCandidates.length === 0 ? "No icecandidate events yet" : toJson(iceCandidates)}
            </pre>
          </div>

          <div
            style={{
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 12,
              background: "#fff"
            }}
          >
            <h2 style={{ marginTop: 0 }}>Candidate Type Summary</h2>
            <pre
              style={{
                margin: 0,
                padding: 12,
                background: "#f4f4f4",
                overflowX: "auto"
              }}
            >
              {toJson(candidateCounts)}
            </pre>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "minmax(280px, 1fr) minmax(280px, 1fr)"
          }}
        >
          <div
            style={{
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 12,
              background: "#fff"
            }}
          >
            <h2 style={{ marginTop: 0 }}>All ICE Candidate Errors</h2>
            <pre
              style={{
                margin: 0,
                padding: 12,
                background: "#f4f4f4",
                overflowX: "auto"
              }}
            >
              {iceCandidateErrors.length === 0
                ? "No icecandidateerror events yet"
                : toJson(iceCandidateErrors)}
            </pre>
          </div>

          <div
            style={{
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 12,
              background: "#fff"
            }}
          >
            <h2 style={{ marginTop: 0 }}>Event Log</h2>
            <pre
              style={{
                margin: 0,
                padding: 12,
                background: "#f4f4f4",
                overflowX: "auto"
              }}
            >
              {logs.length === 0 ? "No events yet" : toJson(logs)}
            </pre>
          </div>
        </section>
      </section>
    </main>
  );
}
