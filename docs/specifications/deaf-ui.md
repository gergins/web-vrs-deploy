# System Overview

The Deaf user interface is the primary client experience for requesting and participating in interpreted calls.

Responsibilities:
- authenticate Deaf/signer identity
- initiate a call request
- show queue and assignment progress
- navigate into the active call
- present local and interpreter video
- present connection state clearly
- host in-call text fallback tools

This subsystem does NOT handle:
- interpreter routing algorithm internals
- SIP/PSTN bridging
- admin reporting
- low-level WebRTC implementation details

--------------------------------

# Architecture Layers

Client Layer
- home page
- queue page
- call page in signer role

Application Layer
- auth store
- API client
- signaling client
- queue state controller

Media Layer
- local video preview
- remote interpreter video
- call status and health display

Data Layer
- authenticated user identity
- call request state
- session state

Infrastructure Layer
- API routes
- WebSocket signaling

--------------------------------

# Module Responsibilities

Module Name: Home Page

Location:
`/apps/web/src/app/page.tsx`

Responsibilities:
- act as Deaf user entry point into the product

Module Name: Queue Page

Location:
`/apps/web/src/app/queue/page.tsx`

Responsibilities:
- authenticate signer identity
- create call requests
- show queue and assignment/session progress
- navigate into the session call

Module Name: Call Page

Location:
`/apps/web/src/app/call/[sessionId]/page.tsx`

Responsibilities:
- host signer role call experience
- present local and remote video
- show connection, reconnect, and error states

Module Name: Auth Store

Location:
`/apps/web/src/state/auth-store.ts`

Responsibilities:
- persist authenticated Deaf/signer identity across reloads

--------------------------------

# Data Structures

Session
```json
{
  "id": "session-uuid",
  "requesterId": "user-signer-1",
  "assignedInterpreterId": "user-interpreter-1",
  "state": "connected"
}
```

Participant
```json
{
  "actorId": "user-signer-1",
  "role": "signer",
  "displayName": "Signer One"
}
```

InterpreterStatus
```json
{
  "interpreterId": "user-interpreter-1",
  "availability": "available"
}
```

CallRequest
```json
{
  "id": "call-request-uuid",
  "requesterId": "user-signer-1",
  "state": "queued"
}
```

SessionTransportState
```json
{
  "signalingState": "Connected",
  "callPhase": "connected",
  "remoteStreamAttached": true
}
```

--------------------------------

# Communication Protocols

REST APIs:
- `POST /auth/local`
- `POST /calls`
- `GET /queue/:callRequestId`

WebSocket messages used:
- `client.auth`
- `assignment.offered`
- `session.created`
- `client.join-session`
- `session.joined`
- `session.ended`

--------------------------------

# API Definitions

`POST /auth/local`
```json
{
  "userId": "user-signer-1"
}
```

`POST /calls`
```json
{
  "requesterId": "user-signer-1"
}
```

WebSocket envelope:
```json
{
  "type": "client.join-session",
  "sessionId": "session-uuid",
  "actorId": "user-signer-1",
  "payload": {}
}
```

--------------------------------

# Folder Structure

`/apps/web/src/app/page.tsx`  
`/apps/web/src/app/queue/page.tsx`  
`/apps/web/src/app/call/[sessionId]/page.tsx`  
`/apps/web/src/state/auth-store.ts`  
`/apps/web/src/api/client.ts`  
`/docs/specifications`

--------------------------------

# Implementation Steps

1. Implement Deaf/signer auth bootstrap.
2. Implement call-request creation flow.
3. Implement queue and assignment progress display.
4. Implement session navigation from queue to call.
5. Implement in-call UI with local/remote video.
6. Implement connection and status indicators.
7. Implement basic in-call text fallback panel.

--------------------------------

# Completion Criteria

- signer can authenticate and create a call
- signer sees deterministic queue/session progress
- signer reaches the call page with correct identity and session
- interpreter video and connection state are visible in the call UI
- UI remains accessible and status-driven

--------------------------------

# Verification Commands

`pnpm --dir apps/web typecheck`  
`pnpm --dir apps/api typecheck`  
`pnpm demo:infra`  
`pnpm demo:api:built`  
`pnpm demo:web:built`

Manual validation:
- authenticate as seeded signer
- create a call from `/queue`
- verify queue/session state updates
- reach `/call/[sessionId]`
- verify local video preview, remote interpreter video, and connection status
