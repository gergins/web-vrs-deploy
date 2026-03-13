"use client";

type ConnectionStatusProps = {
  callPhase: string;
  signalingState: string;
  reconnectState: string;
  peerConnectionState: string;
  iceConnectionState: string;
  iceGatheringState: string;
  remoteAttached: boolean;
  remoteTrackCount: number;
  remoteStreamId: string | null;
  remoteTrackSource: string;
  remoteVideoState: {
    hasSrcObject: boolean;
    autoplay: boolean;
    playsInline: boolean;
    muted: boolean;
    isPlaying: boolean;
  };
  relayCandidateObserved: boolean;
  signalingLost: boolean;
  localMediaState: {
    hasStream: boolean;
    audioEnabled: boolean;
    videoEnabled: boolean;
    hasAudioTrack: boolean;
    hasVideoTrack: boolean;
  };
  iceCandidatesSent: number;
  iceCandidatesReceived: number;
  turnConfigured: boolean;
  lastMajorEvent: string;
  rejoinedSession: boolean;
  recoveryAttempted: boolean;
  recoveryFailed: boolean;
  lastInboundVideoBytes: number;
  lastInboundAudioBytes: number;
  lastFramesDecoded: number;
  staleMediaTimerActive: boolean;
  staleMediaCleanupTriggered: boolean;
  error: string | null;
};

export function ConnectionStatus({
  callPhase,
  signalingState,
  reconnectState,
  peerConnectionState,
  iceConnectionState,
  iceGatheringState,
  remoteAttached,
  remoteTrackCount,
  remoteStreamId,
  remoteTrackSource,
  remoteVideoState,
  relayCandidateObserved,
  signalingLost,
  localMediaState,
  iceCandidatesSent,
  iceCandidatesReceived,
  turnConfigured,
  lastMajorEvent,
  rejoinedSession,
  recoveryAttempted,
  recoveryFailed,
  lastInboundVideoBytes,
  lastInboundAudioBytes,
  lastFramesDecoded,
  staleMediaTimerActive,
  staleMediaCleanupTriggered,
  error
}: ConnectionStatusProps) {
  return (
    <section style={{ display: "grid", gap: 8, marginTop: 16 }}>
      <div><strong>Call phase:</strong> {callPhase}</div>
      <div data-testid="call-signaling-state"><strong>Signaling state:</strong> {signalingState}</div>
      <div><strong>Reconnect state:</strong> {reconnectState}</div>
      <div><strong>Peer connection state:</strong> {peerConnectionState}</div>
      <div><strong>ICE connection state:</strong> {iceConnectionState}</div>
      <div><strong>ICE gathering state:</strong> {iceGatheringState}</div>
      <div><strong>Remote stream attached:</strong> {remoteAttached ? "yes" : "no"}</div>
      <div><strong>Remote stream id:</strong> {remoteStreamId ?? "none"}</div>
      <div><strong>Remote track count:</strong> {remoteTrackCount}</div>
      <div><strong>Remote track source:</strong> {remoteTrackSource}</div>
      <div><strong>Remote video srcObject:</strong> {remoteVideoState.hasSrcObject ? "yes" : "no"}</div>
      <div><strong>Remote video autoplay:</strong> {remoteVideoState.autoplay ? "yes" : "no"}</div>
      <div><strong>Remote video playsInline:</strong> {remoteVideoState.playsInline ? "yes" : "no"}</div>
      <div><strong>Remote video muted:</strong> {remoteVideoState.muted ? "yes" : "no"}</div>
      <div><strong>Remote video playing:</strong> {remoteVideoState.isPlaying ? "yes" : "no"}</div>
      <div><strong>Relay candidate observed:</strong> {relayCandidateObserved ? "yes" : "no"}</div>
      <div><strong>Signaling lost:</strong> {signalingLost ? "yes" : "no"}</div>
      <div><strong>Local stream ready:</strong> {localMediaState.hasStream ? "yes" : "no"}</div>
      <div><strong>Microphone:</strong> {localMediaState.hasAudioTrack ? (localMediaState.audioEnabled ? "on" : "muted") : "missing"}</div>
      <div><strong>Camera:</strong> {localMediaState.hasVideoTrack ? (localMediaState.videoEnabled ? "on" : "off") : "missing"}</div>
      <div><strong>ICE sent:</strong> {iceCandidatesSent}</div>
      <div><strong>ICE received:</strong> {iceCandidatesReceived}</div>
      <div><strong>TURN configured:</strong> {turnConfigured ? "yes" : "no"}</div>
      <div><strong>Last major event:</strong> {lastMajorEvent || "none yet"}</div>
      <div><strong>Session rejoined:</strong> {rejoinedSession ? "yes" : "no"}</div>
      <div><strong>Recovery attempted:</strong> {recoveryAttempted ? "yes" : "no"}</div>
      <div><strong>Recovery failed:</strong> {recoveryFailed ? "yes" : "no"}</div>
      <div><strong>Last inbound video bytes:</strong> {lastInboundVideoBytes}</div>
      <div><strong>Last inbound audio bytes:</strong> {lastInboundAudioBytes}</div>
      <div><strong>Last frames decoded:</strong> {lastFramesDecoded}</div>
      <div><strong>Stale-media timer active:</strong> {staleMediaTimerActive ? "yes" : "no"}</div>
      <div><strong>Stale-media cleanup triggered:</strong> {staleMediaCleanupTriggered ? "yes" : "no"}</div>
      {error ? <div data-testid="call-error"><strong>Error:</strong> {error}</div> : null}
    </section>
  );
}
