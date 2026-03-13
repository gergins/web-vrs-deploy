"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ConnectionStatus } from "../../../components/call/connection-status";
import { LocalVideo } from "../../../components/call/local-video";
import { MediaControls } from "../../../components/call/media-controls";
import { RemoteVideo } from "../../../components/call/remote-video";
import { SignalingClient } from "../../../signaling/signaling-client";
import { createClientEnvelope, signalingEvents } from "../../../signaling/signaling-events";
import {
  getSeededIdentityForRole,
  getStoredAuthIdentity,
  setStoredAuthIdentity
} from "../../../state/auth-store";
import { authenticateLocalUser } from "../../../api/client";
import { getPublicEnv } from "../../../utils/env";
import { buildIceServers } from "../../../webrtc/ice-manager";
import { MediaManager } from "../../../webrtc/media-manager";
import { PeerSession } from "../../../webrtc/peer-session";

type CallSignalMessage = {
  type: string;
  actorId?: string;
  sessionId: string | null;
  payload: Record<string, unknown>;
};

export default function CallPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId;
  const rawSearchParams = searchParams.toString();
  const parsedRole =
    (searchParams.get("role") as "signer" | "interpreter" | "admin" | null) ?? "signer";
  const [authenticatedIdentity, setAuthenticatedIdentity] = useState<{
    userId: string;
    role: "signer" | "interpreter" | "admin";
  } | null>(null);
  const derivedActorId = authenticatedIdentity?.userId ?? "unauthenticated";
  const env = useMemo(() => getPublicEnv(), []);
  const wsUrl = env.wsUrl;
  const clientRef = useRef<SignalingClient | null>(null);
  const mediaManagerRef = useRef<MediaManager | null>(null);
  const peerSessionRef = useRef<PeerSession | null>(null);
  const cleanupRef = useRef<(reason: string, options?: { navigate?: boolean }) => void>(() => {});
  const recoveryTimeoutRef = useRef<number | null>(null);
  const disconnectGraceTimeoutRef = useRef<number | null>(null);
  const mediaWatchdogIntervalRef = useRef<number | null>(null);
  const staleMediaSinceRef = useRef<number | null>(null);
  const staleMediaCleanupTriggeredRef = useRef(false);
  const terminalRemoteDepartureRef = useRef(false);
  const remoteDepartureLikelyRef = useRef(false);
  const lastKnownRemotePeerRef = useRef<string | null>(null);
  const latestCallPhaseRef = useRef<
    "initializing" | "waiting_for_peer" | "negotiating" | "connected" | "reconnecting" | "disconnected" | "failed" | "ended"
  >("initializing");
  const latestRemoteVideoStateRef = useRef({
    hasSrcObject: false,
    autoplay: true,
    playsInline: true,
    muted: false,
    isPlaying: false
  });
  const lastInboundMediaStatsRef = useRef<{
    videoBytesReceived: number;
    audioBytesReceived: number;
    packetsReceived: number;
    framesDecoded: number;
  } | null>(null);
  const didEndRef = useRef(false);
  const skipNextSocketCloseCleanupRef = useRef(false);
  const latestConnectionStateRef = useRef<RTCPeerConnectionState | "Disconnected">("Disconnected");
  const latestIceConnectionStateRef = useRef<RTCIceConnectionState | "new">("new");
  const latestRemoteAttachedRef = useRef(false);
  const latestConnectedPeerCountRef = useRef(0);
  const latestConnectedPeersRef = useRef<string[]>([]);
  const reinitializationCountRef = useRef(0);
  const [status, setStatus] = useState("Idle");
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | "Disconnected">(
    "Disconnected"
  );
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState | "new">(
    "new"
  );
  const [iceGatheringState, setIceGatheringState] = useState<RTCIceGatheringState>("new");
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteTrackCount, setRemoteTrackCount] = useState(0);
  const [remoteStreamId, setRemoteStreamId] = useState<string | null>(null);
  const [remoteTrackSource, setRemoteTrackSource] = useState("none");
  const [remoteVideoState, setRemoteVideoState] = useState({
    hasSrcObject: false,
    autoplay: true,
    playsInline: true,
    muted: false,
    isPlaying: false
  });
  const [signalingState, setSignalingState] = useState("Disconnected");
  const [reconnectState, setReconnectState] = useState<"idle" | "reconnecting" | "reconnected" | "failed">("idle");
  const [callPhase, setCallPhase] = useState<
    "initializing" | "waiting_for_peer" | "negotiating" | "connected" | "reconnecting" | "disconnected" | "failed" | "ended"
  >("initializing");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [lastMajorEvent, setLastMajorEvent] = useState("none yet");
  const [iceCandidatesSent, setIceCandidatesSent] = useState(0);
  const [iceCandidatesReceived, setIceCandidatesReceived] = useState(0);
  const [relayCandidateObserved, setRelayCandidateObserved] = useState(false);
  const [signalingLost, setSignalingLost] = useState(false);
  const [rejoinedSession, setRejoinedSession] = useState(false);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [recoveryFailed, setRecoveryFailed] = useState(false);
  const [lastInboundVideoBytes, setLastInboundVideoBytes] = useState(0);
  const [lastInboundAudioBytes, setLastInboundAudioBytes] = useState(0);
  const [lastFramesDecoded, setLastFramesDecoded] = useState(0);
  const [staleMediaTimerActive, setStaleMediaTimerActive] = useState(false);
  const [staleMediaCleanupTriggered, setStaleMediaCleanupTriggered] = useState(false);
  const [lastAuthPayload, setLastAuthPayload] = useState("none yet");
  const [lastJoinPayload, setLastJoinPayload] = useState("none yet");
  const [localMediaState, setLocalMediaState] = useState({
    hasStream: false,
    audioEnabled: false,
    videoEnabled: false,
    hasAudioTrack: false,
    hasVideoTrack: false
  });
  const [browserUrl, setBrowserUrl] = useState("");
  const [authStatus, setAuthStatus] = useState("Unauthenticated");
  const [remoteDepartureUxState, setRemoteDepartureUxState] = useState<
    "none" | "reconnecting" | "departed"
  >("none");
  const remoteVideoOverlayMessage =
    remoteDepartureUxState === "reconnecting"
      ? "Reconnecting…"
      : remoteDepartureUxState === "departed"
        ? "Remote participant left the call"
        : null;

  useEffect(() => {
    const stored = getStoredAuthIdentity();
    if (stored?.role === parsedRole) {
      setAuthenticatedIdentity(stored);
      setAuthStatus("Authenticated");
    }
  }, [parsedRole]);

  useEffect(() => {
    setBrowserUrl(window.location.href);
    console.log("[call] raw search params", {
      sessionId,
      browserUrl: window.location.href,
      rawSearchParams
    });
    console.log("[call] parsed identity from URL", {
      sessionId,
      role: parsedRole,
      derivedActorId
    });
  }, [derivedActorId, parsedRole, rawSearchParams, sessionId]);

  useEffect(() => {
    latestConnectionStateRef.current = connectionState;
  }, [connectionState]);

  useEffect(() => {
    latestIceConnectionStateRef.current = iceConnectionState;
  }, [iceConnectionState]);

  useEffect(() => {
    latestRemoteAttachedRef.current = Boolean(remoteStream);
  }, [remoteStream]);

  useEffect(() => {
    latestCallPhaseRef.current = callPhase;
  }, [callPhase]);

  useEffect(() => {
    latestRemoteVideoStateRef.current = remoteVideoState;
  }, [remoteVideoState]);

  useEffect(() => {
    latestConnectedPeerCountRef.current = connectedPeers.length;
    latestConnectedPeersRef.current = connectedPeers;
    if (connectedPeers[0]) {
      lastKnownRemotePeerRef.current = connectedPeers[0];
    }
  }, [connectedPeers]);

  function appendEvent(message: CallSignalMessage) {
    setLastMajorEvent(message.type);
    setEventLog((current) => [
      JSON.stringify(message, null, 2),
      ...current
    ].slice(0, 10));

    if (message.actorId && message.actorId !== derivedActorId) {
      const remoteActorId = message.actorId;
      setConnectedPeers((current) =>
        current.includes(remoteActorId) ? current : [...current, remoteActorId]
      );
    }
  }

  function isRelayCandidate(candidate: RTCIceCandidateInit | Record<string, unknown>) {
    const candidateRecord = candidate as Record<string, unknown>;
    const typedCandidate =
      typeof candidateRecord.candidate === "string" ? candidateRecord.candidate : "";
    const typedType = typeof candidateRecord.type === "string" ? candidateRecord.type : "";
    return typedType === "relay" || typedCandidate.includes(" typ relay ");
  }

  function sendSignalMessage(type: string, payload: Record<string, unknown>) {
    clientRef.current?.send(
        createClientEnvelope({
          type,
          actorId: derivedActorId,
          sessionId,
          payload
        })
    );
  }

  function clearRecoveryTimeout() {
    if (recoveryTimeoutRef.current !== null) {
      window.clearTimeout(recoveryTimeoutRef.current);
      recoveryTimeoutRef.current = null;
    }
  }

  function clearDisconnectGraceTimeout() {
    if (disconnectGraceTimeoutRef.current !== null) {
      window.clearTimeout(disconnectGraceTimeoutRef.current);
      disconnectGraceTimeoutRef.current = null;
    }
  }

  function clearMediaWatchdogInterval() {
    if (mediaWatchdogIntervalRef.current !== null) {
      window.clearInterval(mediaWatchdogIntervalRef.current);
      mediaWatchdogIntervalRef.current = null;
    }
  }

  function hasHealthyTransport() {
    return (
      latestConnectionStateRef.current === "connected" ||
      latestIceConnectionStateRef.current === "connected" ||
      latestIceConnectionStateRef.current === "completed"
    );
  }

  function hasMediaFailureEvidence(reason: string) {
    if (reason === "remote_track_muted" || reason === "remote_media_stale") {
      return true;
    }

    return !latestRemoteAttachedRef.current;
  }

  function clearStaleMediaGrace() {
    if (staleMediaSinceRef.current === null && !staleMediaTimerActive) {
      return;
    }

    staleMediaSinceRef.current = null;
    setStaleMediaTimerActive(false);
  }

  function resetRemoteMediaDebug() {
    clearStaleMediaGrace();
    lastInboundMediaStatsRef.current = null;
    clearMediaWatchdogInterval();
    setRemoteStream(null);
    setRemoteTrackCount(0);
    setRemoteStreamId(null);
    setRemoteTrackSource("none");
    setLastInboundVideoBytes(0);
    setLastInboundAudioBytes(0);
    setLastFramesDecoded(0);
    setRemoteVideoState({
      hasSrcObject: false,
      autoplay: true,
      playsInline: true,
      muted: false,
      isPlaying: false
    });
    console.log("[call] remote stream cleared");
  }

  function removeConnectedPeer(actorId?: string) {
    if (!actorId) {
      setConnectedPeers([]);
      console.log("[call] peer removed from connected peers", {
        actorId: "all"
      });
      return;
    }

    setConnectedPeers((current) => {
      if (!current.includes(actorId)) {
        return current;
      }

      console.log("[call] peer removed from connected peers", {
        actorId
      });
      return current.filter((peerActorId) => peerActorId !== actorId);
    });
  }

  function softClearRemoteMedia(reason: string, options?: { clearPeer?: boolean }) {
    console.log("[call] soft clearing remote media", {
      reason,
      clearPeer: options?.clearPeer ?? false
    });
    clearMediaWatchdogInterval();
    clearStaleMediaGrace();
    setRemoteStream(null);
    setRemoteTrackCount(0);
    setRemoteStreamId(null);
    setRemoteTrackSource("none");
    setRemoteVideoState({
      hasSrcObject: false,
      autoplay: true,
      playsInline: true,
      muted: false,
      isPlaying: false
    });
    if (options?.clearPeer) {
      removeConnectedPeer(lastKnownRemotePeerRef.current ?? latestConnectedPeersRef.current[0]);
    }
  }

  function finalizeRemoteDeparture(reason: string, actorId?: string) {
    clearDisconnectGraceTimeout();
    clearStaleMediaGrace();
    clearRecoveryTimeout();
    clearMediaWatchdogInterval();
    terminalRemoteDepartureRef.current = true;
    remoteDepartureLikelyRef.current = false;
    setRemoteDepartureUxState("departed");
    staleMediaCleanupTriggeredRef.current ||= reason === "remote_media_stale";
    if (reason === "remote_media_stale") {
      setStaleMediaCleanupTriggered(true);
    }
    console.log("[call] terminal remote departure detected", {
      reason,
      actorId: actorId ?? "unknown"
    });
    peerSessionRef.current?.close();
    console.log("[call] peer session closed due to remote departure");
    peerSessionRef.current = null;
    resetRemoteMediaDebug();
    removeConnectedPeer(actorId);
    setConnectionState("Disconnected");
    setIceConnectionState("closed");
    setIceGatheringState("complete");
    setLastMajorEvent(reason);
    setStatus("Remote participant left the call");
    setErrorText("Wait for rejoin if supported, return to queue, or end the call.");
    const nextPhase = "disconnected";
    console.log("[call] call phase moved after remote departure", {
      previousPhase: callPhase,
      nextPhase,
      reason
    });
    setCallPhase(nextPhase);
    setSignalingLost(false);
  }

  function startDisconnectGrace(reason: string, actorId?: string) {
    if (didEndRef.current || disconnectGraceTimeoutRef.current !== null) {
      return;
    }

    remoteDepartureLikelyRef.current = true;
    setRemoteDepartureUxState("reconnecting");
    console.log("[call] disconnect grace started", {
      reason,
      actorId: actorId ?? "unknown"
    });
    disconnectGraceTimeoutRef.current = window.setTimeout(() => {
      disconnectGraceTimeoutRef.current = null;
      const unhealthyTransport = !hasHealthyTransport();
      const mediaFailureEvidence = hasMediaFailureEvidence(reason);
      console.log("[call] disconnect grace expired", {
        reason,
        actorId: actorId ?? "unknown",
        unhealthyTransport,
        mediaFailureEvidence
      });
      if (mediaFailureEvidence || unhealthyTransport) {
        finalizeRemoteDeparture(reason, actorId);
        return;
      }

      console.log("[call] disconnect grace ignored due to healthy transport", {
        reason,
        actorId: actorId ?? "unknown"
      });
    }, 2000);
  }

  function markRemoteMediaProgress(stats: {
    videoBytesReceived: number;
    audioBytesReceived: number;
    packetsReceived: number;
    framesDecoded: number;
  }) {
    lastInboundMediaStatsRef.current = stats;
    setLastInboundVideoBytes(stats.videoBytesReceived);
    setLastInboundAudioBytes(stats.audioBytesReceived);
    setLastFramesDecoded(stats.framesDecoded);
    clearStaleMediaGrace();
  }

  function evaluateRemoteMediaStaleness(stats: {
    videoBytesReceived: number;
    audioBytesReceived: number;
    packetsReceived: number;
    framesDecoded: number;
  }) {
    const previous = lastInboundMediaStatsRef.current;
    setLastInboundVideoBytes(stats.videoBytesReceived);
    setLastInboundAudioBytes(stats.audioBytesReceived);
    setLastFramesDecoded(stats.framesDecoded);

    if (!previous) {
      lastInboundMediaStatsRef.current = stats;
      return;
    }

    const hasProgress =
      stats.videoBytesReceived > previous.videoBytesReceived ||
      stats.audioBytesReceived > previous.audioBytesReceived ||
      stats.packetsReceived > previous.packetsReceived ||
      stats.framesDecoded > previous.framesDecoded;

    const remoteTracks = remoteStream?.getTracks() ?? [];
    const allRemoteTracksMutedOrEnded =
      remoteTracks.length > 0 &&
      remoteTracks.every((track) => track.readyState === "ended" || track.muted);

    if (hasProgress) {
      markRemoteMediaProgress(stats);
      return;
    }

    const shouldWatch =
      latestCallPhaseRef.current === "connected" &&
      latestRemoteAttachedRef.current &&
      latestConnectedPeersRef.current.length > 0 &&
      !didEndRef.current &&
      (
        latestConnectionStateRef.current === "connected" ||
        latestIceConnectionStateRef.current === "connected" ||
        latestIceConnectionStateRef.current === "completed"
      );

    if (!shouldWatch) {
      lastInboundMediaStatsRef.current = stats;
      clearStaleMediaGrace();
      return;
    }

    if (staleMediaSinceRef.current === null) {
      staleMediaSinceRef.current = window.performance.now();
      setStaleMediaTimerActive(true);
      console.log("[call] stale media grace started", {
        actorId: latestConnectedPeersRef.current[0] ?? "unknown",
        remoteVideoPlaying: latestRemoteVideoStateRef.current.isPlaying,
        allRemoteTracksMutedOrEnded
      });
      lastInboundMediaStatsRef.current = stats;
      return;
    }

    lastInboundMediaStatsRef.current = stats;
    const elapsedMs = window.performance.now() - staleMediaSinceRef.current;
    if (elapsedMs < 6000) {
      return;
    }

    if (staleMediaCleanupTriggeredRef.current) {
      return;
    }

    console.log("[call] stale media cleanup triggered", {
      elapsedMs,
      actorId: latestConnectedPeersRef.current[0] ?? "unknown",
      remoteVideoPlaying: latestRemoteVideoStateRef.current.isPlaying,
      allRemoteTracksMutedOrEnded
    });
    staleMediaCleanupTriggeredRef.current = true;
    setStaleMediaCleanupTriggered(true);
    finalizeRemoteDeparture("remote_media_stale", latestConnectedPeersRef.current[0]);
  }

  function resetCallDebugState() {
    terminalRemoteDepartureRef.current = false;
    remoteDepartureLikelyRef.current = false;
    setRemoteDepartureUxState("none");
    setConnectedPeers([]);
    setEventLog([]);
    resetRemoteMediaDebug();
    setLocalStream(null);
    setConnectionState("Disconnected");
    setIceConnectionState("new");
    setIceGatheringState("new");
    setIceCandidatesSent(0);
    setIceCandidatesReceived(0);
    setLastMajorEvent("none yet");
    setRelayCandidateObserved(false);
    setSignalingLost(false);
    setReconnectState("idle");
    setRejoinedSession(false);
    setRecoveryAttempted(false);
    setRecoveryFailed(false);
    clearStaleMediaGrace();
    staleMediaCleanupTriggeredRef.current = false;
    lastInboundMediaStatsRef.current = null;
    setLastInboundVideoBytes(0);
    setLastInboundAudioBytes(0);
    setLastFramesDecoded(0);
    setStaleMediaCleanupTriggered(false);
  }

  function scheduleRecoveryAttempt(reason: string) {
    if (didEndRef.current || peerSessionRef.current?.isPolite || latestConnectedPeerCountRef.current === 0) {
      return;
    }

    clearRecoveryTimeout();
    recoveryTimeoutRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          setRecoveryAttempted(true);
          setRecoveryFailed(false);
          setStatus(`Recovery attempted: ${reason}`);
          setCallPhase("reconnecting");
          const restarted = await peerSessionRef.current?.restartIce();
          if (!restarted) {
            setRecoveryFailed(true);
            setErrorText("Recovery attempt could not start");
          }
        } catch (error) {
          setRecoveryFailed(true);
          setErrorText(error instanceof Error ? error.message : "Recovery attempt failed");
        }
      })();
    }, 1500);
  }

  function connectAndJoin() {
    if (!authenticatedIdentity) {
      setStatus("Authentication required");
      setAuthStatus("Unauthenticated");
      setErrorText("Authenticate with a seeded identity before joining this session");
      return;
    }

    if (clientRef.current) {
      skipNextSocketCloseCleanupRef.current = true;
      clientRef.current.close();
    }

    const client = new SignalingClient();
    clientRef.current = client;
    client.onReconnectStateChange(({ state }) => {
      setReconnectState(state);
      if (state === "reconnecting") {
        setStatus("Reconnecting signaling");
        setSignalingLost(true);
        setCallPhase("reconnecting");
      } else if (state === "reconnected") {
        setStatus("Signaling reconnected");
      } else if (state === "failed") {
        setStatus("Signaling reconnect failed");
        setErrorText("Signaling reconnect failed");
      }
    });
    client.connect(wsUrl);

    client.onOpen(() => {
      terminalRemoteDepartureRef.current = false;
      clearDisconnectGraceTimeout();
      setSignalingState("Connected");
      setSignalingLost(false);
      setStatus(client.wasReconnected ? "Recovering signaling session" : "Authenticating");
      setErrorText(null);
      setRejoinedSession(false);
      const authPayload = createClientEnvelope({
        type: client.wasReconnected ? signalingEvents.clientReconnect : signalingEvents.clientAuth,
        actorId: derivedActorId,
        sessionId: client.wasReconnected ? sessionId : null,
        payload: { role: parsedRole }
      });
      client.send(authPayload);
      setLastAuthPayload(JSON.stringify(authPayload));
      console.log("[call] auth payload", authPayload);
    });

    client.on(signalingEvents.serverAuthenticated, (message) => {
      if (terminalRemoteDepartureRef.current) {
        console.log("[call] auth ack ignored after terminal remote departure");
        return;
      }
      const typed = message as CallSignalMessage;
      console.log("[call] auth ack handled", typed);
      clearDisconnectGraceTimeout();
      appendEvent(typed);
      const reconnected = typed.payload.reconnected === true;
      setStatus(reconnected ? "Re-authenticated after reconnect" : "Authenticated");
      if (reconnected) {
        setReconnectState("reconnected");
      }
      setCallPhase(remoteStream ? "negotiating" : "waiting_for_peer");
      clearStaleMediaGrace();
      const joinPayload = createClientEnvelope({
        type: signalingEvents.clientJoinSession,
        actorId: derivedActorId,
        sessionId,
        payload: {}
      });
      client.send(joinPayload);
      setLastJoinPayload(JSON.stringify(joinPayload));
      console.log("[call] join payload", joinPayload);
    });

    client.on(signalingEvents.sessionJoined, (message) => {
      if (terminalRemoteDepartureRef.current) {
        console.log("[call] join ack ignored after terminal remote departure");
        return;
      }
      const typed = message as CallSignalMessage;
      console.log("[call] join ack handled", typed);
      clearDisconnectGraceTimeout();
      appendEvent(typed);
      setStatus("Joined session");
      setRejoinedSession(true);
      clearStaleMediaGrace();

      if (typed.actorId && typed.actorId !== derivedActorId) {
        setConnectedPeers([typed.actorId]);
        setCallPhase("negotiating");
        void peerSessionRef.current?.setRemotePeerReady(true);
      } else if (client.wasReconnected) {
        setStatus("Rejoined session");
        if (
          latestConnectionStateRef.current !== "connected" &&
          latestIceConnectionStateRef.current !== "connected"
        ) {
          scheduleRecoveryAttempt("session rejoin");
        }
      }
    });

    client.on(signalingEvents.signalOffer, (message) => {
      if (terminalRemoteDepartureRef.current) {
        console.log("[call] offer ignored after terminal remote departure");
        return;
      }
      const typed = message as CallSignalMessage;
      clearDisconnectGraceTimeout();
      appendEvent(typed);

      const description = typed.payload.description;
      if (!description || typeof description !== "object") {
        return;
      }

      void (async () => {
        try {
          console.log("[webrtc] offer received");
          setStatus("Handling offer");
          setCallPhase("negotiating");
          const answer = await peerSessionRef.current?.handleOffer(
            description as RTCSessionDescriptionInit
          );
          if (answer) {
            console.log("[webrtc] answer sent");
            sendSignalMessage(signalingEvents.signalAnswer, { description: answer });
          setStatus("Answer sent");
          setRecoveryFailed(false);
          clearStaleMediaGrace();
        }
        } catch (error) {
          setErrorText(error instanceof Error ? error.message : "Negotiation error while handling offer");
          setCallPhase("failed");
        }
      })();
    });

    client.on(signalingEvents.signalAnswer, (message) => {
      if (terminalRemoteDepartureRef.current) {
        console.log("[call] answer ignored after terminal remote departure");
        return;
      }
      const typed = message as CallSignalMessage;
      clearDisconnectGraceTimeout();
      appendEvent(typed);

      const description = typed.payload.description;
      if (!description || typeof description !== "object") {
        return;
      }

      console.log("[webrtc] answer received");
      void (async () => {
        try {
          await peerSessionRef.current?.handleAnswer(description as RTCSessionDescriptionInit);
          setStatus("Answer applied");
          setCallPhase("negotiating");
          setRecoveryFailed(false);
          clearStaleMediaGrace();
        } catch (error) {
          setErrorText(error instanceof Error ? error.message : "Negotiation error while handling answer");
          setCallPhase("failed");
        }
      })();
    });

    client.on(signalingEvents.signalIceCandidate, (message) => {
      if (terminalRemoteDepartureRef.current) {
        console.log("[call] ICE ignored after terminal remote departure");
        return;
      }
      const typed = message as CallSignalMessage;
      clearDisconnectGraceTimeout();
      appendEvent(typed);

      const candidate = typed.payload.candidate;
      if (!candidate || typeof candidate !== "object") {
        return;
      }

      console.log("[webrtc] ICE received");
      setIceCandidatesReceived((current) => current + 1);
      clearStaleMediaGrace();
      if (isRelayCandidate(candidate as RTCIceCandidateInit)) {
        setRelayCandidateObserved(true);
      }
      void (async () => {
        try {
          await peerSessionRef.current?.addIceCandidate(candidate as RTCIceCandidateInit);
        } catch (error) {
          setErrorText(error instanceof Error ? error.message : "Failed to apply ICE candidate");
        }
      })();
    });

    client.on(signalingEvents.serverError, (message) => {
      const typed = message as CallSignalMessage;
      appendEvent(typed);
      setStatus("Join rejected");
      const joinError = typed.payload.error;
      setErrorText(typeof joinError === "string" ? joinError : "Session join rejected");
      setCallPhase("failed");
    });

    client.on(signalingEvents.sessionEnded, (message) => {
      const typed = message as CallSignalMessage;
      console.log("[call] session-ended handled", typed);
      appendEvent(typed);
      handleRemoteDeparture(
        typeof typed.payload.reason === "string" ? typed.payload.reason : "session_ended"
        ,
        typed.actorId
      );
    });

    client.onClose(() => {
      if (skipNextSocketCloseCleanupRef.current) {
        skipNextSocketCloseCleanupRef.current = false;
        return;
      }

      setSignalingState("Disconnected");
      setSignalingLost(true);
      console.log("[call] signaling connection closed");
      setStatus("Signaling lost");
      if (!didEndRef.current) {
        setErrorText("Signaling connection lost while call page remains open");
        if (latestRemoteAttachedRef.current && !hasHealthyTransport()) {
          setCallPhase("reconnecting");
          startDisconnectGrace("signaling_lost", latestConnectedPeersRef.current[0]);
          scheduleRecoveryAttempt("signaling reconnect");
        } else if (hasHealthyTransport()) {
          setReconnectState("reconnecting");
          setCallPhase("connected");
          scheduleRecoveryAttempt("signaling reconnect");
        } else {
          setCallPhase("disconnected");
        }
      }
    });
  }

  function refreshLocalMediaState() {
    setLocalMediaState(
      mediaManagerRef.current?.getTrackState() ?? {
        hasStream: false,
        audioEnabled: false,
        videoEnabled: false,
        hasAudioTrack: false,
        hasVideoTrack: false
      }
    );
  }

  function cleanupCall(reason: string, options?: { navigate?: boolean }) {
    if (didEndRef.current) {
      console.log("[call] cleanup skipped (already ended)", { reason });
      return;
    }

    didEndRef.current = true;
    clearRecoveryTimeout();
    clearDisconnectGraceTimeout();
    console.log("[call] hangup initiated", { reason });
    setLastMajorEvent(reason);
    setStatus("Call ended");
    setCallPhase(
      reason === "peer_failed"
        ? "failed"
        : reason === "signaling_closed"
          ? "disconnected"
          : "ended"
    );

    if (sessionId) {
      sendSignalMessage(signalingEvents.clientLeaveSession, {});
    }

    skipNextSocketCloseCleanupRef.current = true;
    clientRef.current?.close();
    console.log("[call] signaling connection closed");
    clientRef.current = null;
    peerSessionRef.current?.close();
    peerSessionRef.current = null;
    mediaManagerRef.current?.stopLocalStream();
    mediaManagerRef.current = null;
    resetRemoteMediaDebug();
    setLocalStream(null);
    setConnectedPeers([]);
    setSignalingState("Disconnected");
    setSignalingLost(false);
    setReconnectState("idle");
    setConnectionState("Disconnected");
    setIceConnectionState("closed");
    setIceGatheringState("complete");
    setRejoinedSession(false);
    setRecoveryAttempted(false);
    setRecoveryFailed(false);
    refreshLocalMediaState();

    if (options?.navigate) {
      router.push("/");
    }
  }

  function handleToggleAudio() {
    const state = mediaManagerRef.current?.toggleAudioEnabled();
    if (state) {
      setLocalMediaState(state);
    }
  }

  function handleToggleVideo() {
    const state = mediaManagerRef.current?.toggleVideoEnabled();
    if (state) {
      setLocalMediaState(state);
    }
  }

  function handleRemoteDeparture(reason: string, actorId?: string) {
    if (didEndRef.current) {
      return;
    }

    clearRecoveryTimeout();
    console.log("[call] remote leave detected", { reason });
    finalizeRemoteDeparture(reason, actorId);
  }

  useEffect(() => {
    let cancelled = false;
    didEndRef.current = false;
    cleanupRef.current = cleanupCall;

    async function initializeCall() {
      if (!sessionId || !authenticatedIdentity) {
        setStatus("Unauthenticated");
        return;
      }

      const mediaManager = new MediaManager();
      mediaManagerRef.current = mediaManager;
      reinitializationCountRef.current += 1;
      console.log("[call] repeated call reinitialization", {
        count: reinitializationCountRef.current,
        sessionId,
        actorId: authenticatedIdentity.userId
      });
      setCallPhase("initializing");
      setStatus("Requesting local media");
      setErrorText(null);
      resetCallDebugState();

      let stream: MediaStream;
      try {
        stream = await mediaManager.getLocalStream();
      } catch (error) {
        setErrorText(
          error instanceof Error ? error.message : "Media permission denied or unavailable"
        );
        setStatus("Media unavailable");
        setCallPhase("failed");
        return;
      }

      if (cancelled) {
        mediaManager.stopLocalStream();
        return;
      }

      setLocalStream(stream);
      refreshLocalMediaState();

      const peerSession = new PeerSession(
        {
          iceServers: buildIceServers({
            stunUrl: env.stunUrl,
            turnUrl: env.turnUrl,
            turnUsername: env.turnUsername,
            turnPassword: env.turnPassword
          }),
          polite: parsedRole === "interpreter"
        }
      );
      peerSessionRef.current = peerSession;
      console.log("[call] peer session created", {
        sessionId,
        actorId: authenticatedIdentity.userId,
        role: parsedRole
      });

      peerSession.onNegotiatedOffer((offer) => {
        console.log("[webrtc] offer sent");
        sendSignalMessage(signalingEvents.signalOffer, { description: offer });
        setStatus("Offer sent");
        setCallPhase("negotiating");
      });
      await peerSession.initialize(stream);
      if (cancelled) {
        peerSession.close();
        return;
      }

      setConnectionState(peerSession.connectionState);
      setIceGatheringState(peerSession.iceGatheringState);
      peerSession.onConnectionStateChange((state) => {
        if (terminalRemoteDepartureRef.current) {
          return;
        }
        setConnectionState(state);
        if (state === "connected") {
          clearDisconnectGraceTimeout();
          clearStaleMediaGrace();
          remoteDepartureLikelyRef.current = false;
          setRemoteDepartureUxState("none");
          setCallPhase("connected");
          setErrorText(null);
          clearRecoveryTimeout();
        } else if (state === "failed") {
          if (remoteDepartureLikelyRef.current) {
            handleRemoteDeparture("peer_failed");
            return;
          }
          setStatus("Remote participant left the call");
          setErrorText("Wait for rejoin if supported, return to queue, or end the call.");
          setCallPhase("disconnected");
          handleRemoteDeparture("peer_failed");
        } else if (state === "closed") {
          handleRemoteDeparture("peer_closed");
        } else if (state === "disconnected") {
          setCallPhase("reconnecting");
          setStatus("Remote participant connection interrupted");
          setErrorText("Waiting briefly to see if the remote participant rejoins.");
          softClearRemoteMedia("peer_disconnected_soft_clear", {
            clearPeer: true
          });
          startDisconnectGrace("peer_disconnected", latestConnectedPeersRef.current[0]);
          scheduleRecoveryAttempt("peer disconnected");
        } else if (state === "connecting") {
          clearDisconnectGraceTimeout();
          clearStaleMediaGrace();
          setCallPhase("negotiating");
        }
      });
      peerSession.onIceConnectionStateChange((state) => {
        if (terminalRemoteDepartureRef.current) {
          return;
        }
        setIceConnectionState(state);
        if (state === "connected" || state === "completed") {
          clearDisconnectGraceTimeout();
          clearStaleMediaGrace();
          remoteDepartureLikelyRef.current = false;
          setRemoteDepartureUxState("none");
          setCallPhase("connected");
        } else if (state === "disconnected") {
          setCallPhase("reconnecting");
          setStatus("Remote participant connection interrupted");
          setErrorText("Waiting briefly to see if the remote participant rejoins.");
          softClearRemoteMedia("ice_disconnected_soft_clear", {
            clearPeer: true
          });
          startDisconnectGrace("ice_disconnected", latestConnectedPeersRef.current[0]);
          scheduleRecoveryAttempt("ice disconnected");
        } else if (state === "failed") {
          setStatus("Remote participant left the call");
          setErrorText("Wait for rejoin if supported, return to queue, or end the call.");
          setCallPhase("disconnected");
          handleRemoteDeparture("ice_failed");
        } else if (state === "closed") {
          handleRemoteDeparture("ice_closed");
        }
      });
      peerSession.onIceGatheringStateChange((state) => {
        setIceGatheringState(state);
      });
      peerSession.onTrack(({ stream, trackCount, streamId, source }) => {
        if (terminalRemoteDepartureRef.current) {
          console.log("[call] remote track ignored after terminal remote departure", {
            streamId,
            trackCount
          });
          return;
        }
        console.log("[call] remote stream attached", {
          streamId,
          trackCount,
          source
        });

        for (const track of stream.getTracks()) {
          track.onmute = () => {
            console.log("[call] remote track muted", {
              trackId: track.id,
              kind: track.kind
            });
            if (
              latestConnectionStateRef.current === "disconnected" ||
              latestIceConnectionStateRef.current === "disconnected" ||
              latestCallPhaseRef.current === "reconnecting"
            ) {
              softClearRemoteMedia("remote_track_muted_soft_clear", {
                clearPeer: true
              });
            }
            startDisconnectGrace("remote_track_muted", latestConnectedPeersRef.current[0]);
          };

          track.onunmute = () => {
            console.log("[call] remote track unmuted", {
              trackId: track.id,
              kind: track.kind
            });
            clearDisconnectGraceTimeout();
          };

          track.onended = () => {
            const allEnded = stream.getTracks().every((currentTrack) => currentTrack.readyState === "ended");
            if (allEnded) {
              handleRemoteDeparture("remote_track_ended");
            }
          };
        }

        stream.onremovetrack = () => {
          const hasLiveTracks = stream.getTracks().some((track) => track.readyState === "live");
          if (!hasLiveTracks) {
            handleRemoteDeparture("remote_stream_removed");
          }
        };

        setRemoteStream(stream);
        setRemoteTrackCount(trackCount);
        setRemoteStreamId(streamId);
        setRemoteTrackSource(source);
        setStatus("Remote media received");
        setCallPhase("connected");
        setErrorText(null);
        if (lastKnownRemotePeerRef.current) {
          setConnectedPeers((current) =>
            current.includes(lastKnownRemotePeerRef.current as string)
              ? current
              : [...current, lastKnownRemotePeerRef.current as string]
          );
        }
        terminalRemoteDepartureRef.current = false;
        staleMediaCleanupTriggeredRef.current = false;
        setStaleMediaCleanupTriggered(false);
        clearStaleMediaGrace();
      });
      peerSession.onIceCandidate((candidate) => {
        console.log("[webrtc] ICE sent");
        setIceCandidatesSent((current) => current + 1);
        if (isRelayCandidate(candidate)) {
          setRelayCandidateObserved(true);
        }
        sendSignalMessage(signalingEvents.signalIceCandidate, { candidate });
      });

      connectAndJoin();
    }

    void initializeCall();

    return () => {
      cancelled = true;
      cleanupRef.current("unmount");
    };
  }, [
    env.stunUrl,
    env.turnPassword,
    env.turnUrl,
    env.turnUsername,
    parsedRole,
    router,
    sessionId,
    wsUrl,
    authenticatedIdentity
  ]);

  async function handleAuthenticate() {
    const seededIdentity = getSeededIdentityForRole(parsedRole);
    if (!seededIdentity) {
      setErrorText(`No seeded identity available for role ${parsedRole}`);
      return;
    }

    try {
      setAuthStatus("Authenticating");
      const result = await authenticateLocalUser({
        userId: seededIdentity.userId
      });
      const identity = result.identity as {
        userId: string;
        role: "signer" | "interpreter" | "admin";
      };
      setStoredAuthIdentity(identity);
      setAuthenticatedIdentity(identity);
      setAuthStatus("Authenticated");
      setErrorText(null);
    } catch (authError) {
      setAuthStatus("Authentication failed");
      setErrorText(authError instanceof Error ? authError.message : "Authentication failed");
    }
  }

  useEffect(() => {
    clearMediaWatchdogInterval();

    if (!remoteStream || !peerSessionRef.current || didEndRef.current) {
      clearStaleMediaGrace();
      return;
    }

    mediaWatchdogIntervalRef.current = window.setInterval(() => {
      void (async () => {
        try {
          const peerSession = peerSessionRef.current;
          if (!peerSession || didEndRef.current || !latestRemoteAttachedRef.current) {
            return;
          }

          const stats = await peerSession.getInboundMediaStats();
          if (!stats) {
            return;
          }

          evaluateRemoteMediaStaleness(stats);
        } catch (error) {
          console.log("[call] media watchdog stats failed", {
            error: error instanceof Error ? error.message : "unknown"
          });
        }
      })();
    }, 2000);

    return () => {
      clearMediaWatchdogInterval();
    };
  }, [remoteStream]);

  useEffect(() => {
    function handleBeforeUnload() {
      cleanupRef.current("beforeunload");
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto", padding: 24 }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: "0 0 8px" }}>Relay Call</h1>
            <p style={{ margin: 0 }}>
              You are in a live relay session. Your video, the interpreter video, and connection status appear below.
            </p>
          </div>
          <div
            style={{
              minWidth: 240,
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 10,
              background: "#fff"
            }}
          >
            <div data-testid="call-session-id"><strong>Session:</strong> {sessionId}</div>
            <div data-testid="call-role" style={{ marginTop: 6 }}><strong>Role:</strong> {parsedRole}</div>
            <div data-testid="call-actor-id" style={{ marginTop: 6 }}><strong>Actor:</strong> {derivedActorId}</div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "minmax(320px, 2fr) minmax(260px, 1fr)"
          }}
        >
          <section
            style={{
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 12,
              background: "#fff"
            }}
          >
            <div style={{ fontSize: 18 }}>
              <strong>Status:</strong> <span data-testid="call-status">{status}</span>
            </div>
            <p style={{ marginBottom: 0 }}>
              This area shows whether the interpreter is connected, reconnecting, or has left the call.
            </p>
          </section>

          <section
            style={{
              padding: 16,
              border: "1px solid #ddd",
              borderRadius: 12,
              background: "#fff",
              display: "grid",
              gap: 10
            }}
          >
            {!authenticatedIdentity ? (
              <button type="button" onClick={handleAuthenticate} data-testid="call-authenticate">
                Authenticate Seeded {parsedRole === "signer" ? "Signer" : parsedRole === "interpreter" ? "Interpreter" : "Admin"}
              </button>
            ) : null}
            <button type="button" onClick={connectAndJoin} disabled={!authenticatedIdentity} data-testid="call-reconnect-join">
              Reconnect And Join Session
            </button>
            <div>
              <strong>Connected peers:</strong>{" "}
              <span data-testid="call-connected-peers">
                {connectedPeers.length === 0 ? "none yet" : connectedPeers.join(", ")}
              </span>
            </div>
            {remoteDepartureUxState !== "none" ? (
              <div
                style={{
                  display: "grid",
                  gap: 4,
                  padding: 12,
                  borderRadius: 10,
                  background: "#fafafa",
                  border: "1px solid #eee"
                }}
              >
                <div><strong>Next actions:</strong></div>
                {remoteDepartureUxState === "reconnecting" ? (
                  <div>- Wait briefly while reconnect is attempted.</div>
                ) : (
                  <>
                    <div>- Wait for rejoin if the remote participant reconnects.</div>
                    <div>- Return to queue to start a new call.</div>
                    <div>- End the call if this session is finished.</div>
                  </>
                )}
              </div>
            ) : null}
          </section>
        </div>
      </section>

      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Call diagnostics</summary>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <div data-testid="call-auth-state"><strong>Auth state:</strong> {authStatus}</div>
          <div><strong>Full browser URL:</strong> {browserUrl || "unavailable"}</div>
          <div><strong>Raw search params:</strong> {rawSearchParams || "none"}</div>
          <div><strong>Parsed URL role:</strong> {parsedRole}</div>
          <div><strong>Final auth payload:</strong> {lastAuthPayload}</div>
          <div><strong>Final join payload:</strong> {lastJoinPayload}</div>
        </div>
      </details>

      <ConnectionStatus
        callPhase={callPhase}
        signalingState={signalingState}
        reconnectState={reconnectState}
        peerConnectionState={connectionState}
        iceConnectionState={iceConnectionState}
        iceGatheringState={iceGatheringState}
        remoteAttached={Boolean(remoteStream)}
        remoteTrackCount={remoteTrackCount}
        remoteStreamId={remoteStreamId}
        remoteTrackSource={remoteTrackSource}
        remoteVideoState={remoteVideoState}
        relayCandidateObserved={relayCandidateObserved}
        signalingLost={signalingLost}
        localMediaState={localMediaState}
        iceCandidatesSent={iceCandidatesSent}
        iceCandidatesReceived={iceCandidatesReceived}
        turnConfigured={Boolean(env.turnUrl && env.turnUsername && env.turnPassword)}
        lastMajorEvent={lastMajorEvent}
        rejoinedSession={rejoinedSession}
        recoveryAttempted={recoveryAttempted}
        recoveryFailed={recoveryFailed}
        lastInboundVideoBytes={lastInboundVideoBytes}
        lastInboundAudioBytes={lastInboundAudioBytes}
        lastFramesDecoded={lastFramesDecoded}
        staleMediaTimerActive={staleMediaTimerActive}
        staleMediaCleanupTriggered={staleMediaCleanupTriggered}
        error={errorText}
      />

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(300px, 1fr) minmax(420px, 1.35fr)",
          marginTop: 24,
          alignItems: "start"
        }}
      >
        <section
          style={{
            display: "grid",
            gap: 12,
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 12,
            background: "#fff"
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 8px" }}>Your Video</h2>
            <p style={{ margin: 0 }}>This is your local camera preview.</p>
          </div>
          <LocalVideo stream={localStream} />
        </section>

        <section
          style={{
            display: "grid",
            gap: 12,
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 12,
            background: "#fff"
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 8px" }}>Interpreter Video</h2>
            <p style={{ margin: 0 }}>This area shows the interpreter video and remote-call status overlays.</p>
          </div>
          <RemoteVideo
            stream={remoteStream}
            overlayMessage={remoteVideoOverlayMessage}
            onStateChange={setRemoteVideoState}
          />
        </section>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(280px, 0.9fr) minmax(320px, 1.1fr)",
          marginTop: 24,
          alignItems: "start"
        }}
      >
        <section
          style={{
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 12,
            background: "#fafafa"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Call Controls</h2>
          <p style={{ marginTop: 0 }}>Mute your microphone, turn your camera off, or hang up the call.</p>
          <MediaControls
            audioEnabled={localMediaState.audioEnabled}
            videoEnabled={localMediaState.videoEnabled}
            disabled={!localMediaState.hasStream}
            onToggleAudio={handleToggleAudio}
            onToggleVideo={handleToggleVideo}
            onHangUp={() => cleanupCall("hangup", { navigate: true })}
          />
        </section>

        <section
          style={{
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 12,
            background: "#fafafa"
          }}
        >
          <h2 style={{ marginTop: 0 }}>Text Chat</h2>
          <p style={{ marginTop: 0 }}>
            Chat is not active yet. This panel is reserved for short text clarification during the call.
          </p>
          <div
            style={{
              minHeight: 120,
              border: "1px dashed #bbb",
              borderRadius: 8,
              padding: 12,
              background: "#fff"
            }}
          >
            Chat placeholder only.
          </div>
        </section>
      </div>

      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Recent signaling events</summary>
        <p style={{ marginTop: 12, fontSize: 14 }}>
          Relay verification: if direct connectivity is blocked, watch for
          <strong> Relay candidate observed: yes</strong> while the call remains connected.
        </p>
        <p style={{ marginTop: 8, fontSize: 14 }}>
          Manual diagnosis: compare <strong>Signaling state</strong>, <strong>Reconnect state</strong>,
          and <strong>Call phase</strong> to distinguish auth/join success, signaling loss, remote leave,
          or peer transport failure.
        </p>

        <pre style={{ marginTop: 16, padding: 12, background: "#f4f4f4", overflowX: "auto" }}>
          {eventLog.length === 0 ? "No signaling messages yet" : eventLog.join("\n\n")}
        </pre>
      </details>
    </main>
  );
}
