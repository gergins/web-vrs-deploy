# System Overview

The interpreter workspace is the operational UI and workflow used by interpreters to receive, accept, manage, and end calls.

Responsibilities:
- authenticate interpreter identity
- expose interpreter availability
- receive and display assignment offers
- accept or decline inbound offers
- navigate into active session calls
- expose call controls and end-call actions

This subsystem does NOT handle:
- browser media transport internals
- interpreter scheduling/payroll
- SIP/PSTN gateway behavior
- global admin dashboards

--------------------------------

# Architecture Layers

Client Layer
- interpreter landing page
- call page controls when role is interpreter

Application Layer
- auth store
- API client
- signaling client
- assignment response flow

Media Layer
- call page media session after interpreter enters a call

Data Layer
- interpreter availability records
- assignment attempts
- session records

Infrastructure Layer
- API routes
- WebSocket signaling delivery of assignment and session events

--------------------------------

# Module Responsibilities

Module Name: Interpreter Page

Location:
`/apps/web/src/app/interpreter/page.tsx`

Responsibilities:
- establish authenticated interpreter context
- connect to signaling
- receive `assignment.offered`
- accept or decline the assignment
- navigate to the created session

Module Name: Call Page

Location:
`/apps/web/src/app/call/[sessionId]/page.tsx`

Responsibilities:
- host interpreter call controls and in-call state
- surface signaling, peer, and media state
- expose end-call action

Module Name: Auth Store

Location:
`/apps/web/src/state/auth-store.ts`

Responsibilities:
- persist authenticated interpreter identity across reloads

Module Name: Assignment Service

Location:
`/apps/api/src/services/assignment-service.ts`

Responsibilities:
- create assignment attempts
- process accept/decline
- create session on acceptance

Module Name: Interpreter Route

Location:
`/apps/api/src/routes/interpreter-routes.ts`

Responsibilities:
- expose interpreter availability data for current prototype/admin use

--------------------------------

# Data Structures

Session
```json
{
  "id": "session-uuid",
  "assignedInterpreterId": "user-interpreter-1",
  "state": "session_created"
}
```

Participant
```json
{
  "actorId": "user-interpreter-1",
  "role": "interpreter",
  "displayName": "Interpreter One"
}
```

Seeded interpreter identities available for local testing:

- `user-interpreter-1`
- `user-interpreter-2`

InterpreterStatus
```json
{
  "interpreterId": "user-interpreter-1",
  "availability": "available",
  "activeCallCount": 0
}
```

CallRequest
```json
{
  "id": "call-request-uuid",
  "requesterId": "user-signer-1",
  "state": "offered",
  "assignedInterpreterId": "user-interpreter-1"
}
```

SessionTransportState
```json
{
  "sessionId": "session-uuid",
  "signalingState": "Connected",
  "callPhase": "connected"
}
```

--------------------------------

# Communication Protocols

WebSocket signaling messages used:
- `client.auth`
- `assignment.offered`
- `assignment.accepted`
- `assignment.declined`
- `session.created`
- `server.authenticated`
- `server.error`
- `client.join-session`
- `session.joined`

--------------------------------

# API Definitions

REST APIs:
- `POST /auth/local`
- `GET /interpreters`
- `POST /calls/:callRequestId/respond`

WebSocket message envelope:
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

`/apps/web/src/app/interpreter`  
`/apps/web/src/app/call/[sessionId]`  
`/apps/web/src/state/auth-store.ts`  
`/apps/web/src/api/client.ts`  
`/apps/web/src/signaling`  
`/apps/api/src/services/assignment-service.ts`  
`/apps/api/src/routes/interpreter-routes.ts`  
`/docs/specifications`

--------------------------------

# Implementation Steps

1. Implement authenticated interpreter page bootstrap.
2. Implement interpreter signaling connection and auth.
3. Implement inbound assignment offer rendering.
4. Implement accept/decline actions.
5. Implement navigation to session call page on acceptance.
6. Implement interpreter call controls and end-call behavior.
7. Implement truthful reconnect and remote-leave status for interpreter role.

--------------------------------

# Completion Criteria

- interpreter can authenticate with a seeded identity
- interpreter receives assignment offers
- interpreter can accept or decline offers
- accepted offers create and navigate into a session
- interpreter can join and participate in the call
- workspace status is truthful across offer, call, and end-call states

--------------------------------

# Verification Commands

`pnpm --dir apps/web typecheck`  
`pnpm --dir apps/api typecheck`  
`pnpm demo:infra`  
`pnpm demo:api:built`  
`pnpm demo:web:built`

Manual validation:
- authenticate interpreter on `/interpreter`
- choose `user-interpreter-1` or `user-interpreter-2` from the seeded interpreter selector
- confirm identity persists after reload
- create a call from signer flow
- confirm offer appears on interpreter page
- accept the offer
- verify navigation to `/call/[sessionId]`
- verify interpreter call page shows correct authenticated role and session
