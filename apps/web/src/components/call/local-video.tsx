"use client";

import { useEffect, useRef } from "react";

type LocalVideoProps = {
  stream: MediaStream | null;
  overlayMessage?: string | null;
};

export function LocalVideo({ stream, overlayMessage }: LocalVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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

  if (!stream) {
    return (
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
        Local preview unavailable
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", minHeight: 240, background: "#111" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "100%", background: "#111", minHeight: 240 }}
      />
      {overlay}
    </div>
  );
}
