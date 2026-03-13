"use client";

import { useEffect, useRef } from "react";

type LocalVideoProps = {
  stream: MediaStream | null;
};

export function LocalVideo({ stream }: LocalVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      style={{ width: "100%", background: "#111", minHeight: 240 }}
    />
  );
}
