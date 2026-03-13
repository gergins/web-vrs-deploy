# System Overview

Telephony integration extends Web VRS beyond browser-only calls by introducing SIP addressing and PSTN relay through an interpreter.

Responsibilities:
- define SIP addressing model
- define WebRTC-to-SIP gateway architecture
- define PSTN dialing flow
- define provider integration boundaries

This subsystem does NOT handle:
- browser call queueing
- interpreter assignment rules
- admin reporting beyond telephony telemetry

--------------------------------

# Architecture Layers

Client Layer
- interpreter dialing controls
- call UI indicators for telephony bridge status

Application Layer
- telephony service orchestration
- session service integration
- call routing integration for dial-out legs

Media Layer
- WebRTC media on browser side
- RTP/SIP bridge on gateway side

Data Layer
- telephony session metadata
- dial attempts
- provider configuration references

Infrastructure Layer
- SIP gateway
- PSTN provider integration
- TURN and signaling alongside bridge infrastructure

--------------------------------

# Module Responsibilities

Module Name: Telephony Service

Location:
`/apps/api/src/services`

Responsibilities:
- orchestrate outbound SIP/PSTN call legs
- bridge browser session state with telephony gateway state

Module Name: Session Service

Location:
`/apps/api/src/services/session-service.ts`

Responsibilities:
- maintain telephony participant/session membership model

Module Name: Call Page Controller

Location:
`/apps/web/src/app/call/[sessionId]/page.tsx`

Responsibilities:
- expose interpreter telephony controls
- surface telephony bridge status

--------------------------------

# Data Structures

Session
```json
{
  "id": "session-uuid",
  "state": "active",
  "bridgeMode": "sip"
}
```

Participant
```json
{
  "actorId": "pstn:+15551234567",
  "role": "hearing",
  "transport": "sip"
}
```

InterpreterStatus
```json
{
  "interpreterId": "user-interpreter-1",
  "availability": "busy"
}
```

CallRequest
```json
{
  "id": "call-request-uuid",
  "state": "accepted",
  "telephonyMode": "pstn"
}
```

SessionTransportState
```json
{
  "sessionId": "session-uuid",
  "browserTransport": "webrtc",
  "bridgeTransport": "sip",
  "pstnConnected": false
}
```

--------------------------------

# Communication Protocols

WebSocket messages:
- existing browser signaling remains unchanged for browser participants

SIP addressing model:
```text
user@vrs.example.com
```

WebRTC-to-SIP gateway architecture:
1. browser participant connects through WebRTC
2. interpreter initiates dial or invite action
3. API instructs SIP gateway to create a bridge leg
4. gateway exchanges SIP signaling and RTP with external participant
5. session service reflects telephony participant state back to browser clients

PSTN dialing flow:
1. interpreter enters a telephone number
2. API validates dial request
3. SIP/PSTN provider creates outbound call
4. bridge joins resulting call leg into the VRS session

Provider integration examples:
- Twilio
- Telnyx

--------------------------------

# API Definitions

Planned REST APIs:
- `POST /sessions/:sessionId/dial`
- `POST /sessions/:sessionId/invite-sip`

Planned request shape:
```json
{
  "destination": "+15551234567",
  "transport": "pstn"
}
```

WebSocket envelope for telephony status:
```json
{
  "type": "session.joined",
  "sessionId": "session-uuid",
  "actorId": "pstn:+15551234567",
  "payload": {
    "role": "hearing"
  }
}
```

--------------------------------

# Folder Structure

`/apps/api/src/services`  
`/apps/api/src/routes`  
`/apps/web/src/app/call/[sessionId]`  
`/infra`  
`/docs/specifications`

--------------------------------

# Implementation Steps

1. Define telephony destination and bridge data model.
2. Implement API endpoints for dial/invite requests.
3. Integrate a SIP gateway abstraction.
4. Implement session membership for telephony participants.
5. Surface telephony bridge status in interpreter UI.
6. Add provider-specific adapter implementation.

--------------------------------

# Completion Criteria

- interpreter can initiate a SIP/PSTN dial action
- telephony leg is represented in session state
- bridge status is visible to browser participants
- session lifecycle remains auditable across browser and telephony legs

--------------------------------

# Verification Commands

`pnpm --dir apps/api typecheck`  
`pnpm --dir apps/web typecheck`

Manual validation:
- configure SIP/PSTN provider sandbox
- initiate telephony dial from interpreter workspace
- verify bridge participant joins session state
