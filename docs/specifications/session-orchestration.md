# System Overview

Session orchestration manages control-plane lifecycle for VRS calls from request through termination.

Responsibilities:
- create and persist session records
- map participants to session membership
- authorize session join by authenticated role and membership
- coordinate session lifecycle transitions
- support reconnect, disconnect grace, and session end signaling
- preserve auditable history for completed or failed sessions

This subsystem does NOT handle:
- direct browser media transport
- TURN/STUN infrastructure
- detailed admin analytics
- PSTN/SIP carrier integration

--------------------------------

# Architecture Layers

Client Layer
- queue page, interpreter page, and call page consume session state

Application Layer
- session service
- assignment service
- signaling join/leave handlers
- session routes

Media Layer
- consumes session identity and membership but does not author lifecycle

Data Layer
- PostgreSQL session and call-request records
- Redis session cache and transient membership maps

Infrastructure Layer
- WebSocket gateway
- API HTTP routes
- Redis presence/session cache

--------------------------------

# Module Responsibilities

Module Name: Session Service

Location:
`/apps/api/src/services/session-service.ts`

Responsibilities:
- validate whether an actor can join a session
- load session state
- enforce role/membership authorization

Module Name: Session Repository

Location:
`/apps/api/src/repositories/session-repository.ts`

Responsibilities:
- persist session records
- load session history and active session metadata

Module Name: Assignment Service

Location:
`/apps/api/src/services/assignment-service.ts`

Responsibilities:
- create a session when an offered assignment is accepted
- transition control-plane state from offered to session-created

Module Name: Join Session Handler

Location:
`/apps/api/src/signaling/handlers/handle-join-session.ts`

Responsibilities:
- validate authenticated connection state
- authorize join by session membership
- register session membership in signaling registries
- emit `session.joined`

Module Name: Leave Session Handler

Location:
`/apps/api/src/signaling/handlers/handle-leave-session.ts`

Responsibilities:
- remove session membership from registries
- emit session end/leave signals when required

Module Name: Session Routes

Location:
`/apps/api/src/routes/session-routes.ts`

Responsibilities:
- expose session lookup over HTTP

--------------------------------

# Data Structures

Session
```json
{
  "id": "session-uuid",
  "callRequestId": "call-request-uuid",
  "assignedInterpreterId": "user-interpreter-1",
  "requesterId": "user-signer-1",
  "state": "session_created",
  "startedAt": "2026-03-12T12:00:00.000Z",
  "endedAt": null
}
```

Participant
```json
{
  "actorId": "user-signer-1",
  "role": "signer",
  "sessionId": "session-uuid",
  "connectionId": "ws-connection-id"
}
```

InterpreterStatus
```json
{
  "interpreterId": "user-interpreter-1",
  "availability": "available",
  "activeSessionId": null
}
```

CallRequest
```json
{
  "id": "call-request-uuid",
  "requesterId": "user-signer-1",
  "assignedInterpreterId": "user-interpreter-1",
  "state": "accepted"
}
```

SessionTransportState
```json
{
  "sessionId": "session-uuid",
  "signalingConnected": true,
  "participantCount": 2,
  "reconnectGraceActive": false
}
```

--------------------------------

# Communication Protocols

WebSocket signaling messages used:
- `client.auth`
- `client.reconnect`
- `client.join-session`
- `client.leave-session`
- `server.authenticated`
- `session.joined`
- `session.ended`
- `server.error`

Example join message:
```json
{
  "type": "client.join-session",
  "sessionId": "session-uuid",
  "actorId": "user-interpreter-1",
  "payload": {}
}
```

Example joined message:
```json
{
  "type": "session.joined",
  "sessionId": "session-uuid",
  "actorId": "user-signer-1",
  "payload": {
    "role": "signer"
  }
}
```

--------------------------------

# API Definitions

REST APIs:
- `GET /sessions/:sessionId`
- `POST /calls`
- `GET /queue/:callRequestId`

WebSocket APIs:
- `client.auth`
- `client.reconnect`
- `client.join-session`
- `client.leave-session`
- `session.joined`
- `session.ended`

Envelope format:
```json
{
  "type": "session.joined",
  "sessionId": "session-uuid",
  "actorId": "user-signer-1",
  "payload": {}
}
```

--------------------------------

# Folder Structure

`/apps/api/src/services/session-service.ts`  
`/apps/api/src/services/assignment-service.ts`  
`/apps/api/src/repositories/session-repository.ts`  
`/apps/api/src/routes/session-routes.ts`  
`/apps/api/src/signaling/handlers/handle-join-session.ts`  
`/apps/api/src/signaling/handlers/handle-leave-session.ts`  
`/apps/api/src/signaling/signaling-session-registry.ts`  
`/docs/specifications`

--------------------------------

# Implementation Steps

1. Define authoritative session lifecycle transitions.
2. Persist session creation at assignment acceptance time.
3. Implement authenticated session join authorization.
4. Register and fan out participant membership on successful join.
5. Implement explicit leave and terminal end handling.
6. Add reconnect-grace behavior for temporary disconnects.
7. Persist final session completion/failure state for auditability.

--------------------------------

# Completion Criteria

- session is created when assignment is accepted
- only authenticated, authorized participants can join
- participant membership is reflected correctly to peers
- disconnect and leave behavior result in deterministic session end signals
- session history is persisted and queryable

--------------------------------

# Verification Commands

`pnpm --dir apps/api typecheck`  
`pnpm --dir apps/web typecheck`  
`pnpm demo:infra`  
`pnpm demo:api:built`  
`pnpm demo:web:built`

Manual validation:
- create a call from `/queue`
- accept the offer from `/interpreter`
- confirm session creation occurs
- confirm both peers can join the same session
- reload one call page and verify rejoin behavior
- close one peer and verify session-end handling on the remaining peer
