# System Invariants — Web VRS Platform

## Purpose

This document defines system invariants that must always hold true in the Web Video Relay Service platform.

Invariants protect the reliability of real-time communication and ensure consistent system behavior across releases.

------------------------------------------------

# Invariant 1 — Auth Before Session Join

A client connection must always authenticate before joining a session.

Required message sequence:

`client.auth`  
`server.authenticated`  
`client.join-session`  
`session.joined`

If authentication has not completed, `join-session` must be rejected.

This invariant protects access control and prevents unauthorized session participation.

------------------------------------------------

# Invariant 2 — One Session Registry Authority

Session state must be owned exclusively by the Session Orchestrator.

No other subsystem may mutate session lifecycle state.

Allowed transitions:

`REQUESTED → QUEUED`  
`QUEUED → OFFERED`  
`OFFERED → ACCEPTED`  
`ACCEPTED → SESSION_CREATED`  
`SESSION_CREATED → ACTIVE`  
`ACTIVE → ENDED`

Clients and signaling handlers may observe state but must not modify it.

------------------------------------------------

# Invariant 3 — Control Plane Separate from Media Plane

Media transport must remain separate from control logic.

Control plane responsibilities:

authentication  
queue routing  
interpreter assignment  
session orchestration

Media plane responsibilities:

WebRTC transport  
ICE negotiation  
media streaming  
TURN relay

Control plane must never directly manipulate peer connections.

------------------------------------------------

# Invariant 4 — Canonical WebSocket Message Envelope

All WebSocket signaling messages must follow the canonical structure:

```json
{
  "messageId": "string",
  "correlationId": "string",
  "type": "string",
  "timestamp": "string",
  "sessionId": "string | null",
  "actorId": "string",
  "payload": {}
}
```

This structure must not change without specification updates.

------------------------------------------------

# Invariant 5 — TURN Relay Availability

The platform must always support TURN relay fallback.

If direct peer-to-peer connection fails, media must be able to flow through TURN infrastructure.

TURN configuration must always be present in WebRTC peer connection configuration.

------------------------------------------------

# Invariant 6 — Deterministic Message Ordering

Messages arriving on the same WebSocket connection must be processed in order.

Later messages must not overtake earlier ones.

This invariant prevents authentication races and session join errors.

------------------------------------------------

# Invariant 7 — Interpreter Assignment Exclusivity

A single interpreter may only participate in one active VRS session at a time unless explicitly configured for multi-session operation.

Interpreter availability states must be respected:

`AVAILABLE`  
`BUSY`  
`OFFLINE`  
`BREAK`

Queue routing must not assign `BUSY` interpreters.

------------------------------------------------

# Invariant 8 — Session Participant Integrity

Each active session must contain the correct participants.

Minimum required participants:

Deaf participant  
Interpreter

Optional participants:

hearing participant  
viewer

Sessions must not activate unless required participants are present.

------------------------------------------------

# Invariant 9 — Signaling Protocol Stability

Signaling message types are canonical.

Examples:

`client.auth`  
`client.join-session`  
`signal.offer`  
`signal.answer`  
`signal.ice-candidate`  
`session.joined`  
`session.left`  
`session.ended`

These message types must remain stable unless specification updates occur.

------------------------------------------------

# Invariant 10 — Media Connection Health

Active sessions must monitor connection health.

Metrics must include:

ICE connection state  
peer connection state  
packet loss  
round-trip time

Sessions must detect disconnected peers.

------------------------------------------------

# Invariant 11 — Queue Fairness

Call assignment must follow deterministic routing rules.

Required properties:

FIFO call ordering  
availability-based interpreter selection  
no interpreter starvation

Queue behavior must remain predictable.

------------------------------------------------

# Invariant 12 — Authentication Identity Consistency

The same authenticated identity must be used across:

REST API requests  
WebSocket signaling  
session participation

Identity must not change during a session.

------------------------------------------------

# Invariant 13 — Repository Architecture Integrity

Subsystem locations must remain stable.

Examples:

`/apps/web` — client UI  
`/apps/api` — application services  
`/apps/api/src/signaling` — signaling server  
`/media` — media infrastructure  
`/media/turn` — TURN servers

Subsystems must not be relocated without architecture updates.

------------------------------------------------

# Invariant 14 — Deterministic Logging

Critical events must be logged.

Required log categories:

authentication events  
session lifecycle events  
queue assignment events  
media connection changes

Logs must include `connectionId` and `sessionId` where applicable.

------------------------------------------------

# Invariant 15 — Backward Compatibility of Core Flow

The core VRS flow must remain functional:

Deaf user requests call  
call enters queue  
interpreter receives assignment  
interpreter accepts call  
session created  
participants join session  
WebRTC connection established

Implementation changes must not break this flow.
