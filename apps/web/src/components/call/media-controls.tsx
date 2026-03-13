"use client";

type MediaControlsProps = {
  audioEnabled: boolean;
  videoEnabled: boolean;
  disabled?: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onHangUp: () => void;
};

export function MediaControls({
  audioEnabled,
  videoEnabled,
  disabled = false,
  onToggleAudio,
  onToggleVideo,
  onHangUp
}: MediaControlsProps) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
      <button type="button" onClick={onToggleAudio} disabled={disabled}>
        {audioEnabled ? "Mute microphone" : "Unmute microphone"}
      </button>
      <button type="button" onClick={onToggleVideo} disabled={disabled}>
        {videoEnabled ? "Turn camera off" : "Turn camera on"}
      </button>
      <button type="button" onClick={onHangUp}>
        Hang up
      </button>
    </div>
  );
}
