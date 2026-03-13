# System Overview

The admin platform provides operational control and monitoring for the VRS system.

Responsibilities:
- monitor active sessions
- monitor queue depth and assignment behavior
- manage interpreter availability at an operational level
- surface system health and media health telemetry
- support administrative oversight

This subsystem does NOT handle:
- end-user media transport logic
- direct interpreter scheduling/payroll
- telephony provider signaling internals

--------------------------------

# Architecture Layers

Client Layer
- admin dashboard UI

Application Layer
- admin routes and services
- queue/session/availability aggregation

Media Layer
- media health telemetry consumption, not transport generation

Data Layer
- PostgreSQL audit/session/call records
- Redis transient counters and live presence

Infrastructure Layer
- logging pipeline
- metrics store
- dashboard serving layer

--------------------------------

# Module Responsibilities

Module Name: Admin Page

Location:
`/apps/web/src/app/admin/page.tsx`

Responsibilities:
- host admin dashboard UI

Module Name: Metrics Service

Location:
`/apps/api/src/services/metrics-service.ts`

Responsibilities:
- aggregate system and media metrics for admin consumption

Module Name: Audit Service

Location:
`/apps/api/src/services/audit-service.ts`

Responsibilities:
- expose auditable lifecycle data for queue, session, and failure review

Module Name: Presence Service

Location:
`/apps/api/src/services/presence-service.ts`

Responsibilities:
- expose live availability and connection state inputs

--------------------------------

# Data Structures

Session
```json
{
  "id": "session-uuid",
  "state": "connected",
  "participantCount": 2,
  "startedAt": "2026-03-12T12:00:00.000Z"
}
```

Participant
```json
{
  "actorId": "user-interpreter-1",
  "role": "interpreter",
  "connected": true
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
  "state": "queued",
  "waitSeconds": 15
}
```

SessionTransportState
```json
{
  "sessionId": "session-uuid",
  "signalingConnected": true,
  "peerConnectionState": "connected",
  "iceConnectionState": "connected",
  "relayCandidateObserved": false
}
```

--------------------------------

# Communication Protocols

REST APIs:
- planned admin dashboard endpoints for active calls, queue stats, interpreter status, and system health

WebSocket or streaming options:
- optional live admin telemetry feed for queue/session updates

Media health telemetry expectations:
- collect session transport summaries
- surface reconnecting/degraded/failed patterns

--------------------------------

# API Definitions

Planned REST APIs:
- `GET /admin/queue`
- `GET /admin/sessions`
- `GET /admin/interpreters`
- `GET /admin/system-health`

Example response:
```json
{
  "activeSessions": 3,
  "queuedCalls": 2,
  "availableInterpreters": 5
}
```

--------------------------------

# Folder Structure

`/apps/web/src/app/admin`  
`/apps/api/src/services/metrics-service.ts`  
`/apps/api/src/services/audit-service.ts`  
`/apps/api/src/services/presence-service.ts`  
`/apps/api/src/routes`  
`/docs/specifications`

--------------------------------

# Implementation Steps

1. Define admin dashboard data model.
2. Implement aggregated queue/session/interpreter metrics endpoints.
3. Implement active session monitoring view.
4. Implement interpreter availability management view.
5. Add media health telemetry surfacing.
6. Add system health dashboard panels.

--------------------------------

# Completion Criteria

- admin can view active call counts
- admin can view queue statistics
- admin can inspect interpreter availability
- system health and media health summaries are visible
- session lifecycle events are auditable from admin tooling

--------------------------------

# Verification Commands

`pnpm --dir apps/api typecheck`  
`pnpm --dir apps/web typecheck`

Manual validation:
- open admin page
- verify active queue/session/interpreter metrics load
- verify system health data is visible
