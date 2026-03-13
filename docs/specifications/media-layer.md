# System Overview

The media layer provides real-time browser media transport for Web VRS sessions.

Responsibilities:
- create and manage browser `RTCPeerConnection` instances
- attach local audio and video tracks
- receive and render remote tracks
- perform SDP offer/answer negotiation through WebSocket signaling
- perform ICE candidate exchange through WebSocket signaling
- consume STUN and TURN configuration from backend/environment
- monitor connection health, degraded transport, frozen media, and recovery state

This subsystem does NOT handle:
- interpreter assignment
- call queue ordering
- session authorization policy
- SIP or PSTN signaling
- admin analytics aggregation

--------------------------------

# Architecture Layers

Client Layer
- call page UI
- local/remote video rendering
- call diagnostics and status display

Application Layer
- signaling client
- reconnect manager
- media manager
- peer-session coordination

Media Layer
- `RTCPeerConnection`
- track attachment/detachment
- ICE gathering and relay fallback
- media watchdog and terminal cleanup triggers

Data Layer
- persisted TURN credential source from API/env
- session metadata used to bind media to the correct call

Infrastructure Layer
- WebSocket signaling gateway
- STUN/TURN services
- browser networking environment

--------------------------------

# Module Responsibilities

Module Name: Call Page Controller

Location:
`/apps/web/src/app/call/[sessionId]/page.tsx`

Responsibilities:
- initialize local media for a session
- authenticate signaling connection
- join the session after auth acknowledgment
- bind peer-session callbacks to UI state
- manage reconnect, disconnect grace, and terminal remote departure cleanup
- expose debug state for signaling, peer, ICE, and media health

Module Name: Peer Session Manager

Location:
`/apps/web/src/webrtc/peer-session.ts`

Responsibilities:
- create `RTCPeerConnection`
- manage polite/impolite negotiation role
- negotiate SDP offers and answers
- send ICE candidates through callback hooks
- surface peer and ICE state changes
- surface inbound media stats for watchdog use

Module Name: Media Manager

Location:
`/apps/web/src/webrtc/media-manager.ts`

Responsibilities:
- acquire local camera and microphone
- stop local tracks during cleanup
- expose stream lifecycle to the call page

Module Name: Signaling Client

Location:
`/apps/web/src/signaling/signaling-client.ts`

Responsibilities:
- open WebSocket connection
- parse inbound signaling messages
- dispatch typed signaling events
- send outbound auth, join, offer, answer, ICE, and leave messages

Module Name: TURN Credential Service

Location:
`/apps/api/src/services/turn-credential-service.ts`

Responsibilities:
- provide TURN/STUN configuration to clients
- align browser ICE server configuration with environment settings

Module Name: Signaling Gateway

Location:
`/apps/api/src/signaling`

Responsibilities:
- validate inbound signaling messages
- route SDP and ICE signaling
- preserve per-connection sequencing
- support reconnect-aware session signaling

--------------------------------

# Data Structures

Session
```json
{
  "id": "session-uuid",
  "callRequestId": "call-request-uuid",
  "state": "connecting",
  "participants": [
    {
      "actorId": "user-signer-1",
      "role": "signer"
    },
    {
      "actorId": "user-interpreter-1",
      "role": "interpreter"
    }
  ]
}
```

Participant
```json
{
  "actorId": "user-interpreter-1",
  "role": "interpreter",
  "displayName": "Interpreter One",
  "connectionId": "ws-connection-id"
}
```

InterpreterStatus
```json
{
  "interpreterId": "user-interpreter-1",
  "availability": "available",
  "lastHeartbeatAt": "2026-03-12T12:00:00.000Z"
}
```

CallRequest
```json
{
  "id": "call-request-uuid",
  "requesterId": "user-signer-1",
  "state": "queued",
  "requestedAt": "2026-03-12T12:00:00.000Z"
}
```

SessionTransportState
```json
{
  "signalingState": "Connected",
  "peerConnectionState": "connected",
  "iceConnectionState": "connected",
  "iceGatheringState": "complete",
  "remoteStreamAttached": true,
  "relayCandidateObserved": false
}
```

--------------------------------

# Communication Protocols

WebSocket signaling protocol:
- `client.auth`
- `client.reconnect`
- `client.join-session`
- `client.leave-session`
- `signal.offer`
- `signal.answer`
- `signal.ice-candidate`
- `server.authenticated`
- `server.error`
- `session.joined`
- `session.ended`

Message envelope:
```json
{
  "type": "signal.offer",
  "sessionId": "session-uuid",
  "actorId": "user-signer-1",
  "correlationId": "correlation-uuid",
  "payload": {}
}
```

STUN discovery:
- browser uses configured STUN servers to discover direct candidates
- discovered host, srflx, and relay candidates remain within the normal ICE process

TURN relay infrastructure:
- TURN credentials are served by the API from environment-backed configuration
- relay fallback is required when direct connectivity fails

Media health monitoring:
- observe:
  - `connectionState`
  - `iceConnectionState`
  - remote track lifecycle
  - inbound media stats from `getStats()`
- terminal remote cleanup may be triggered by:
  - explicit session end
  - peer/ICE failure
  - stale media watchdog

Reconnection and recovery:
- reconnect state remains signaling-driven
- media cleanup must distinguish transient reconnect from terminal departure
- recovery must preserve session identity for the same call

--------------------------------

# API Definitions

REST APIs used by this subsystem:
- `POST /auth/local`
- `GET /sessions/:sessionId`

WebSocket APIs used by this subsystem:

`client.auth`
```json
{
  "type": "client.auth",
  "sessionId": null,
  "actorId": "user-signer-1",
  "payload": {
    "role": "signer"
  }
}
```

`client.join-session`
```json
{
  "type": "client.join-session",
  "sessionId": "session-uuid",
  "actorId": "user-signer-1",
  "payload": {}
}
```

`signal.offer`
```json
{
  "type": "signal.offer",
  "sessionId": "session-uuid",
  "actorId": "user-signer-1",
  "payload": {
    "sdp": "..."
  }
}
```

`signal.answer`
```json
{
  "type": "signal.answer",
  "sessionId": "session-uuid",
  "actorId": "user-interpreter-1",
  "payload": {
    "sdp": "..."
  }
}
```

`signal.ice-candidate`
```json
{
  "type": "signal.ice-candidate",
  "sessionId": "session-uuid",
  "actorId": "user-signer-1",
  "payload": {
    "candidate": {}
  }
}
```

--------------------------------

# Folder Structure

`/apps/web/src/app/call/[sessionId]`  
`/apps/web/src/webrtc`  
`/apps/web/src/signaling`  
`/apps/web/src/components/call`  
`/apps/api/src/signaling`  
`/apps/api/src/services/turn-credential-service.ts`  
`/infra`  
`/docs/specifications`

--------------------------------

# Implementation Steps

1. Implement authenticated signaling handshake for the call page.
2. Implement join sequencing so session join occurs only after `server.authenticated`.
3. Implement peer-session offer/answer negotiation.
4. Implement ICE candidate forwarding through the signaling gateway.
5. Integrate STUN/TURN configuration from environment-backed backend sources.
6. Attach local media tracks and render remote tracks.
7. Implement disconnect grace and reconnect handling.
8. Implement stale-media watchdog and terminal remote cleanup.
9. Add relay observability and media health diagnostics.

--------------------------------

# Completion Criteria

- two browser clients establish a WebRTC session
- SDP negotiation succeeds through WebSocket signaling only
- ICE negotiation succeeds with direct connectivity or TURN relay fallback
- `connectionState` and `iceConnectionState` are surfaced to the UI
- remote media attaches and detaches truthfully
- reconnect and terminal cleanup paths are deterministic

--------------------------------

# Verification Commands

`pnpm --dir apps/web typecheck`  
`pnpm --dir apps/api typecheck`  
`pnpm demo:infra`  
`pnpm demo:api:built`  
`pnpm demo:web:built`

Manual validation:
- open signer and interpreter flows in two browsers
- complete queue -> offer -> accept -> session -> call
- verify both call pages reach `Signaling state: Connected`
- verify offer/answer and ICE exchange occur
- verify remote media attaches
- verify remote close triggers truthful cleanup
