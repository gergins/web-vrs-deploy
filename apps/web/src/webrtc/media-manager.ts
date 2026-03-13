export class MediaManager {
  private localStream: MediaStream | null = null;
  private readonly defaultConstraints: MediaStreamConstraints = {
    video: true,
    audio: true
  };

  async getLocalStream() {
    if (this.localStream) {
      return this.localStream;
    }

    this.localStream = await navigator.mediaDevices.getUserMedia(this.defaultConstraints);
    console.log("[call] local stream acquired", {
      trackCount: this.localStream.getTracks().length
    });

    return this.localStream;
  }

  stopLocalStream() {
    if (!this.localStream) {
      return;
    }

    for (const track of this.localStream?.getTracks() ?? []) {
      track.stop();
    }
    console.log("[call] local stream stopped");

    this.localStream = null;
  }

  toggleAudioEnabled() {
    const nextEnabled = !this.getTrackState().audioEnabled;

    for (const track of this.localStream?.getAudioTracks() ?? []) {
      track.enabled = nextEnabled;
    }

    return this.getTrackState();
  }

  toggleVideoEnabled() {
    const nextEnabled = !this.getTrackState().videoEnabled;

    for (const track of this.localStream?.getVideoTracks() ?? []) {
      track.enabled = nextEnabled;
    }

    return this.getTrackState();
  }

  getTrackState() {
    const audioTracks = this.localStream?.getAudioTracks() ?? [];
    const videoTracks = this.localStream?.getVideoTracks() ?? [];

    return {
      hasStream: Boolean(this.localStream),
      audioEnabled: audioTracks.length > 0 && audioTracks.some((track) => track.enabled),
      videoEnabled: videoTracks.length > 0 && videoTracks.some((track) => track.enabled),
      hasAudioTrack: audioTracks.length > 0,
      hasVideoTrack: videoTracks.length > 0
    };
  }
}
