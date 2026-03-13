# System Overview

Queue routing is responsible for turning an inbound call request into an interpreter offer and, on acceptance, a created session.

Responsibilities:
- accept and persist new call requests
- maintain queue state
- track interpreter availability
- choose an interpreter candidate
- create assignment attempts
- emit assignment offers
- coordinate fair routing evolution without bypassing session creation

This subsystem does NOT handle:
- browser media transport
- WebRTC offer/answer negotiation
- full admin reporting
- SIP/PSTN call bridging

--------------------------------

# Architecture Layers

Client Layer
- queue page for signer
- interpreter page for offer handling

Application Layer
- queue service
- assignment service
- interpreter service
- signaling assignment handlers

Media Layer
- not responsible for media transport

Data Layer
- PostgreSQL call requests, interpreters, assignment attempts
- Redis queue counters, presence, short-lived availability fanout

Infrastructure Layer
- HTTP API routes
- WebSocket signaling gateway
- Redis transient structures

--------------------------------

# Module Responsibilities

Module Name: Queue Route

Location:
`/apps/api/src/routes/call-routes.ts`

Responsibilities:
- accept new call requests
- validate input
- trigger queue service and assignment workflow

Module Name: Queue Service

Location:
`/apps/api/src/services/queue-service.ts`

Responsibilities:
- create and persist call requests
- transition queue state to queued

Module Name: Assignment Service

Location:
`/apps/api/src/services/assignment-service.ts`

Responsibilities:
- select available interpreter candidate
- create assignment attempts
- emit `assignment.offered`
- accept or decline assignment
- create session on acceptance

Module Name: Interpreter Service

Location:
`/apps/api/src/services/interpreter-service.ts`

Responsibilities:
- expose interpreter availability information
- support routing decisions

Module Name: Presence Service

Location:
`/apps/api/src/services/presence-service.ts`

Responsibilities:
- map transient websocket presence to interpreter availability inputs

--------------------------------

# Data Structures

Session
```json
{
  "id": "session-uuid",
  "callRequestId": "call-request-uuid",
  "state": "session_created"
}
```

Participant
```json
{
  "actorId": "user-interpreter-1",
  "role": "interpreter",
  "availability": "available"
}
```

InterpreterStatus
```json
{
  "interpreterId": "user-interpreter-1",
  "availability": "available",
  "activeSessionId": null,
  "lastSeenAt": "2026-03-12T12:00:00.000Z"
}
```

CallRequest
```json
{
  "id": "call-request-uuid",
  "requesterId": "user-signer-1",
  "state": "offered",
  "assignedInterpreterId": "user-interpreter-1",
  "createdAt": "2026-03-12T12:00:00.000Z"
}
```

SessionTransportState
```json
{
  "callRequestId": "call-request-uuid",
  "offerDeliveredCount": 1,
  "assignmentActive": true
}
```

--------------------------------

# Communication Protocols

HTTP call queue flow:
- `POST /calls`
- `GET /queue/:callRequestId`
- `POST /calls/:callRequestId/respond`

WebSocket messages used:
- `client.auth`
- `assignment.offered`
- `assignment.accepted`
- `assignment.declined`
- `session.created`
- `server.error`

Redis queue design:
- Redis is transient only
- use Redis for:
  - availability/presence hints
  - queue counters
  - short-lived locks
  - transient fanout
- PostgreSQL remains source of truth for:
  - call requests
  - assignment attempts
  - session creation

Call assignment algorithm:
1. load available interpreters from authoritative service inputs
2. choose a candidate using current deterministic rule set
3. create an assignment attempt in PostgreSQL
4. emit `assignment.offered` to the selected interpreter
5. on accept, create the session
6. on decline/timeout, move to next routing attempt

--------------------------------

# API Definitions

`POST /calls`
```json
{
  "requesterId": "user-signer-1"
}
```

`GET /queue/:callRequestId`
```json
{
  "callRequest": {
    "id": "call-request-uuid",
    "state": "offered"
  }
}
```

`POST /calls/:callRequestId/respond`
```json
{
  "interpreterId": "user-interpreter-1",
  "accepted": true
}
```

WebSocket envelope:
```json
{
  "type": "assignment.offered",
  "sessionId": null,
  "actorId": "user-interpreter-1",
  "payload": {
    "callRequestId": "call-request-uuid"
  }
}
```

--------------------------------

# Folder Structure

`/apps/api/src/routes/call-routes.ts`  
`/apps/api/src/routes/queue-routes.ts`  
`/apps/api/src/routes/interpreter-routes.ts`  
`/apps/api/src/services/queue-service.ts`  
`/apps/api/src/services/assignment-service.ts`  
`/apps/api/src/services/interpreter-service.ts`  
`/apps/api/src/services/presence-service.ts`  
`/apps/api/src/repositories`  
`/apps/api/src/realtime`  
`/docs/specifications`

--------------------------------

# Implementation Steps

1. Implement call request persistence.
2. Implement queue state transitions from requesting to queued.
3. Implement interpreter availability tracking from persisted and transient sources.
4. Implement deterministic assignment attempt creation.
5. Implement `assignment.offered` delivery to interpreters.
6. Implement accept/decline handling.
7. Implement retry/fairness strategy for declined or timed-out offers.
8. Add queue counters and transient locks in Redis.

--------------------------------

# Completion Criteria

- call requests are persisted
- queue state transitions are deterministic
- available interpreters can be selected for offers
- offers are emitted to interpreters
- accepted offers create sessions
- declined/time-out offers can continue routing without data corruption

--------------------------------

# Verification Commands

`pnpm --dir apps/api typecheck`  
`pnpm --dir apps/web typecheck`  
`pnpm demo:infra`  
`pnpm db:push`  
`pnpm db:seed`  
`pnpm demo:api:built`  
`pnpm demo:web:built`

Manual validation:
- authenticate signer and interpreter with seeded users
- create a call from `/queue`
- confirm `assignment.offered` appears on `/interpreter`
- accept the offer
- confirm session creation and navigation to `/call/[sessionId]`
