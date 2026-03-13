export class PeerSession {
  private pc: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private readonly polite: boolean;
  private isMakingOffer = false;
  private isIgnoringOffer = false;
  private remotePeerReady = false;
  private offerHandler: ((offer: RTCSessionDescriptionInit) => void | Promise<void>) | null = null;
  private isClosed = false;

  constructor(input: { iceServers: RTCIceServer[]; polite: boolean }) {
    this.polite = input.polite;
    this.pc = new RTCPeerConnection({ iceServers: input.iceServers });
    this.pc.onnegotiationneeded = () => {
      console.log("[webrtc] negotiationneeded fired", {
        polite: this.polite,
        remotePeerReady: this.remotePeerReady,
        signalingState: this.pc.signalingState
      });
      void this.handleNegotiationNeeded();
    };
  }

  get connectionState() {
    return this.pc.connectionState;
  }

  get iceConnectionState() {
    return this.pc.iceConnectionState;
  }

  get iceGatheringState() {
    return this.pc.iceGatheringState;
  }

  async initialize(stream: MediaStream) {
    this.localStream = stream;

    const existingTrackIds = new Set(
      this.pc.getSenders().map((sender) => sender.track?.id).filter((trackId): trackId is string => Boolean(trackId))
    );

    for (const track of stream.getTracks()) {
      if (!existingTrackIds.has(track.id)) {
        this.pc.addTrack(track, stream);
        console.log("[webrtc] local track added", {
          trackId: track.id,
          kind: track.kind
        });
      }
    }
  }

  async createOffer() {
    return this.createOfferWithOptions();
  }

  async createOfferWithOptions(options?: RTCOfferOptions) {
    console.log("[webrtc] createOffer called", {
      polite: this.polite,
      remotePeerReady: this.remotePeerReady,
      options: options ?? null
    });
    const configuredOffer = await this.pc.createOffer(options);
    await this.pc.setLocalDescription(configuredOffer);
    return configuredOffer;
  }

  async handleOffer(offer: RTCSessionDescriptionInit) {
    const offerCollision = this.isMakingOffer || this.pc.signalingState !== "stable";
    this.isIgnoringOffer = !this.polite && offerCollision;

    if (this.isIgnoringOffer) {
      console.log("[webrtc] ignoring incoming offer due to collision");
      return null;
    }

    if (offerCollision) {
      console.log("[webrtc] rolling back local description to accept incoming offer");
      await Promise.all([
        this.pc.setLocalDescription({ type: "rollback" }),
        this.pc.setRemoteDescription(offer)
      ]);
    } else {
      await this.pc.setRemoteDescription(offer);
    }

    await this.flushPendingIceCandidates();

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.pc.setRemoteDescription(answer);
    await this.flushPendingIceCandidates();
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.pc.remoteDescription) {
      this.pendingIceCandidates.push(candidate);
      console.log("[webrtc] queued ICE candidate before remote description");
      return;
    }

    await this.pc.addIceCandidate(candidate);
  }

  onIceCandidate(callback: (candidate: RTCIceCandidateInit) => void) {
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        callback(event.candidate.toJSON());
      }
    };
  }

  onTrack(
    callback: (input: {
      stream: MediaStream;
      trackCount: number;
      streamId: string;
      source: "event-stream" | "fallback-stream";
    }) => void
  ) {
    this.pc.ontrack = (event) => {
      const [eventStream] = event.streams;
      const stream = eventStream ?? new MediaStream([event.track]);
      const source = eventStream ? "event-stream" : "fallback-stream";

      console.log("[webrtc] remote track received", {
        kind: event.track.kind,
        trackId: event.track.id,
        streamId: stream.id,
        trackCount: stream.getTracks().length,
        source
      });

      callback({
        stream,
        trackCount: stream.getTracks().length,
        streamId: stream.id,
        source
      });
    };
  }

  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.pc.onconnectionstatechange = () => {
      console.log("[webrtc] connectionState ->", this.pc.connectionState);
      callback(this.pc.connectionState);
    };
  }

  onIceConnectionStateChange(callback: (state: RTCIceConnectionState) => void) {
    this.pc.oniceconnectionstatechange = () => {
      console.log("[webrtc] iceConnectionState ->", this.pc.iceConnectionState);
      callback(this.pc.iceConnectionState);
    };
  }

  onIceGatheringStateChange(callback: (state: RTCIceGatheringState) => void) {
    this.pc.onicegatheringstatechange = () => {
      console.log("[webrtc] iceGatheringState ->", this.pc.iceGatheringState);
      callback(this.pc.iceGatheringState);
    };
  }

  onNegotiatedOffer(callback: (offer: RTCSessionDescriptionInit) => void | Promise<void>) {
    this.offerHandler = callback;
  }

  async setRemotePeerReady(isReady: boolean) {
    this.remotePeerReady = isReady;
    console.log("[webrtc] remote peer ready", {
      isReady,
      polite: this.polite
    });

    if (isReady) {
      await this.handleNegotiationNeeded();
    }
  }

  close() {
    if (this.isClosed) {
      console.log("[webrtc] peer closed (already closed)");
      return;
    }

    this.isClosed = true;
    this.pc.onnegotiationneeded = null;
    this.pc.onicecandidate = null;
    this.pc.ontrack = null;
    this.pc.onconnectionstatechange = null;
    this.pc.oniceconnectionstatechange = null;
    this.pc.onicegatheringstatechange = null;
    this.pc.close();
    this.localStream = null;
    this.pendingIceCandidates = [];
    this.remotePeerReady = false;
    this.offerHandler = null;
    console.log("[webrtc] peer closed");
  }

  get isPolite() {
    return this.polite;
  }

  async getInboundMediaStats() {
    if (this.isClosed) {
      return null;
    }

    const stats = await this.pc.getStats();
    let videoBytesReceived = 0;
    let audioBytesReceived = 0;
    let packetsReceived = 0;
    let framesDecoded = 0;

    stats.forEach((report) => {
      if (report.type !== "inbound-rtp" || report.isRemote) {
        return;
      }

      const kind =
        typeof report.kind === "string"
          ? report.kind
          : typeof report.mediaType === "string"
            ? report.mediaType
            : null;

      if (!kind) {
        return;
      }

      packetsReceived += typeof report.packetsReceived === "number" ? report.packetsReceived : 0;

      if (kind === "video") {
        videoBytesReceived += typeof report.bytesReceived === "number" ? report.bytesReceived : 0;
        framesDecoded += typeof report.framesDecoded === "number" ? report.framesDecoded : 0;
      }

      if (kind === "audio") {
        audioBytesReceived += typeof report.bytesReceived === "number" ? report.bytesReceived : 0;
      }
    });

    return {
      videoBytesReceived,
      audioBytesReceived,
      packetsReceived,
      framesDecoded
    };
  }

  async restartIce() {
    if (!this.offerHandler || !this.remotePeerReady || this.polite) {
      return false;
    }

    try {
      this.isMakingOffer = true;
      console.log("[webrtc] creating ICE restart offer");
      const offer = await this.createOfferWithOptions({ iceRestart: true });
      await this.offerHandler(offer);
      return true;
    } finally {
      this.isMakingOffer = false;
    }
  }

  private async flushPendingIceCandidates() {
    while (this.pendingIceCandidates.length > 0) {
      const candidate = this.pendingIceCandidates.shift();
      if (!candidate) {
        continue;
      }

      await this.pc.addIceCandidate(candidate);
    }
  }

  private async handleNegotiationNeeded() {
    if (!this.offerHandler || !this.remotePeerReady || this.polite) {
      console.log("[webrtc] negotiation skipped", {
        hasOfferHandler: Boolean(this.offerHandler),
        remotePeerReady: this.remotePeerReady,
        polite: this.polite
      });
      return;
    }

    try {
      this.isMakingOffer = true;
      console.log("[webrtc] creating offer");
      const offer = await this.createOfferWithOptions();
      await this.offerHandler(offer);
    } finally {
      this.isMakingOffer = false;
    }
  }
}
