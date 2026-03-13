"use client";

import { useEffect, useRef } from "react";

type RemoteVideoProps = {
  stream: MediaStream | null;
  overlayMessage?: string | null;
  onStateChange?: (state: {
    hasStream: boolean;
    streamId: string | null;
    hasSrcObject: boolean;
    autoplay: boolean;
    playsInline: boolean;
    muted: boolean;
    isPlaying: boolean;
  }) => void;
};

export function RemoteVideo({ stream, overlayMessage, onStateChange }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (!stream) {
      video.pause();
      video.srcObject = null;
      console.log("[call] remote video srcObject cleared");
    } else {
      video.srcObject = stream;
    }
    onStateChange?.({
      hasStream: Boolean(stream),
      streamId: stream?.id ?? null,
      hasSrcObject: video.srcObject instanceof MediaStream,
      autoplay: video.autoplay,
      playsInline: video.playsInline,
      muted: video.muted,
      isPlaying: !video.paused && !video.ended && video.readyState >= 2
    });
  }, [onStateChange, stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const emitState = () => {
      onStateChange?.({
        hasStream: Boolean(stream),
        streamId: stream?.id ?? null,
        hasSrcObject: video.srcObject instanceof MediaStream,
        autoplay: video.autoplay,
        playsInline: video.playsInline,
        muted: video.muted,
        isPlaying: !video.paused && !video.ended && video.readyState >= 2
      });
    };

    video.addEventListener("loadedmetadata", emitState);
    video.addEventListener("play", emitState);
    video.addEventListener("pause", emitState);

    return () => {
      video.removeEventListener("loadedmetadata", emitState);
      video.removeEventListener("play", emitState);
      video.removeEventListener("pause", emitState);
    };
  }, [onStateChange, stream]);

  const overlay = overlayMessage ? (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "rgba(0, 0, 0, 0.55)",
        color: "#fff",
        fontWeight: 600,
        textAlign: "center",
        padding: 16
      }}
    >
      {overlayMessage}
    </div>
  ) : null;

  return stream ? (
    <div style={{ position: "relative", width: "100%", minHeight: 240, background: "#111" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", background: "#111", minHeight: 240 }}
      />
      {overlay}
    </div>
  ) : (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: 240,
        background: "#111",
        color: "#fff",
        display: "grid",
        placeItems: "center"
      }}
    >
      Remote peer unavailable
    </div>
  );
}
