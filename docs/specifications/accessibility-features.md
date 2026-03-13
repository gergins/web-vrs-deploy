# System Overview

Accessibility features extend the base VRS experience with additional communication and usability support.

Responsibilities:
- provide communication fallback channels
- support user accessibility customization
- improve usability for Deaf and hard-of-hearing participants

This subsystem does NOT handle:
- core session routing
- telephony bridging internals
- admin metrics aggregation

--------------------------------

# Architecture Layers

Client Layer
- accessibility controls in queue and call UIs

Application Layer
- settings/state management
- optional text communication services

Media Layer
- works alongside media but does not replace it

Data Layer
- user preferences
- contact lists
- RTT message history when persisted

Infrastructure Layer
- WebSocket messaging
- optional persistence services

--------------------------------

# Module Responsibilities

Module Name: Call Page

Location:
`/apps/web/src/app/call/[sessionId]/page.tsx`

Responsibilities:
- host text fallback tools and accessibility indicators

Module Name: Queue Page

Location:
`/apps/web/src/app/queue/page.tsx`

Responsibilities:
- respect accessibility-focused entry and status design

Module Name: Auth Store / User Settings

Location:
`/apps/web/src/state`

Responsibilities:
- persist user accessibility preferences

--------------------------------

# Data Structures

Session
```json
{
  "id": "session-uuid",
  "state": "connected"
}
```

Participant
```json
{
  "actorId": "user-signer-1",
  "role": "signer",
  "preferences": {
    "preferredLanguage": "ASL"
  }
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
  "requesterId": "user-signer-1"
}
```

SessionTransportState
```json
{
  "sessionId": "session-uuid",
  "rttEnabled": false,
  "chatEnabled": true
}
```

--------------------------------

# Communication Protocols

Planned WebSocket messages:
- existing signaling envelope for chat/RTT additions if implemented

Feature areas:
- Real-Time Text (RTT)
- contact lists
- accessibility customization

--------------------------------

# API Definitions

Planned REST APIs:
- `GET /users/:userId/preferences`
- `PUT /users/:userId/preferences`
- `GET /users/:userId/contacts`

WebSocket envelope example for RTT/chat:
```json
{
  "type": "session.message",
  "sessionId": "session-uuid",
  "actorId": "user-signer-1",
  "payload": {
    "mode": "rtt",
    "text": "hello"
  }
}
```

--------------------------------

# Folder Structure

`/apps/web/src/app/call/[sessionId]`  
`/apps/web/src/app/queue`  
`/apps/web/src/state`  
`/apps/api/src/routes`  
`/apps/api/src/services`  
`/docs/specifications`

--------------------------------

# Implementation Steps

1. Define accessibility preference model.
2. Implement basic chat fallback.
3. Implement RTT transport model.
4. Implement contact list persistence and UI.
5. Implement accessibility customization controls.

--------------------------------

# Completion Criteria

- text fallback exists for in-call communication
- RTT can be enabled and used if implemented
- user accessibility preferences persist
- contact list and quick-call features are available if implemented

--------------------------------

# Verification Commands

`pnpm --dir apps/web typecheck`  
`pnpm --dir apps/api typecheck`

Manual validation:
- enable accessibility preferences
- verify chat/RTT behavior if implemented
- verify preferences persist across reload
