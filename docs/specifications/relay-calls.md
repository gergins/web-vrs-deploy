# System Overview

Relay calls extend the two-party VRS model to include a hearing participant connected through the interpreter.

Responsibilities:
- support a three-party relay topology
- allow interpreter to invite or dial a third participant
- maintain clear participant roles and media routing expectations
- preserve session control and visibility across all participants

This subsystem does NOT handle:
- low-level SIP gateway implementation details
- interpreter scheduling
- admin analytics beyond relay-call visibility

--------------------------------

# Architecture Layers

Client Layer
- interpreter controls for inviting/dialing a third participant
- signer and hearing participant call views

Application Layer
- session orchestration extensions for third participant membership
- signaling fanout for multi-party call control

Media Layer
- multi-party media topology or relay topology coordination

Data Layer
- participant membership extensions
- relay-call session metadata

Infrastructure Layer
- signaling gateway
- optional telephony/SIP bridge

--------------------------------

# Module Responsibilities

Module Name: Call Page Controller

Location:
`/apps/web/src/app/call/[sessionId]/page.tsx`

Responsibilities:
- surface relay-call participant state
- expose interpreter controls to invite/dial hearing participant

Module Name: Session Service

Location:
`/apps/api/src/services/session-service.ts`

Responsibilities:
- extend membership rules to support a third participant

Module Name: Signaling Gateway

Location:
`/apps/api/src/signaling`

Responsibilities:
- route participant presence, join, leave, and SDP/ICE messages for relay calls

--------------------------------

# Data Structures

Session
```json
{
  "id": "session-uuid",
  "state": "session_created",
  "participants": [
    { "actorId": "user-signer-1", "role": "signer" },
    { "actorId": "user-interpreter-1", "role": "interpreter" },
    { "actorId": "participant-hearing-1", "role": "hearing" }
  ]
}
```

Participant
```json
{
  "actorId": "participant-hearing-1",
  "role": "hearing",
  "joinMode": "invited"
}
```

InterpreterStatus
```json
{
  "interpreterId": "user-interpreter-1",
  "availability": "busy",
  "activeSessionId": "session-uuid"
}
```

CallRequest
```json
{
  "id": "call-request-uuid",
  "state": "accepted",
  "relayMode": "three-party"
}
```

SessionTransportState
```json
{
  "sessionId": "session-uuid",
  "participantCount": 3,
  "mediaTopology": "relay"
}
```

--------------------------------

# Communication Protocols

WebSocket messages:
- existing two-party signaling messages
- session membership events extended to third participant presence

Planned relay-call flow:
1. Deaf user and interpreter establish session
2. interpreter invites or dials hearing participant
3. hearing participant joins session or telephony bridge
4. signaling routes multi-party membership and transport events

--------------------------------

# API Definitions

Planned REST APIs:
- `POST /sessions/:sessionId/participants`
- `POST /sessions/:sessionId/dial`

Planned WebSocket envelope:
```json
{
  "type": "session.joined",
  "sessionId": "session-uuid",
  "actorId": "participant-hearing-1",
  "payload": {
    "role": "hearing"
  }
}
```

--------------------------------

# Folder Structure

`/apps/web/src/app/call/[sessionId]`  
`/apps/api/src/services/session-service.ts`  
`/apps/api/src/signaling`  
`/docs/specifications`

--------------------------------

# Implementation Steps

1. Extend session membership model for third participant.
2. Define interpreter invite/dial actions.
3. Extend signaling fanout for multi-party presence.
4. Define media topology for three-party relay.
5. Add UI visibility for third participant state.

--------------------------------

# Completion Criteria

- interpreter can invite or dial a third participant
- third participant can be represented in session membership
- signer, interpreter, and hearing participant presence are visible
- relay-call session remains controllable and auditable

--------------------------------

# Verification Commands

`pnpm --dir apps/api typecheck`  
`pnpm --dir apps/web typecheck`

Manual validation:
- start a two-party session
- invite a hearing participant
- verify participant membership updates for all clients
