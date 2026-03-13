# Media Architecture

Browser clients establish media sessions with RTCPeerConnection.

## Requirements

- local media acquisition
- remote track binding
- ICE candidate exchange through signaling
- connectionState monitoring
- iceConnectionState monitoring
- TURN fallback support
- reconnect policy

## Notes

Media does not flow through the signaling server.
The signaling server is control plane only.
Coturn provides relay when direct peer connectivity fails.
