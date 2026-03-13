# System Overview

The analytics platform provides reporting and trend visibility across queue, session, interpreter, and media outcomes.

Responsibilities:
- compute operational KPIs
- surface historical trends
- support reporting for wait time, utilization, success rate, and session quality

This subsystem does NOT handle:
- live browser media transport
- core call routing decisions
- telephony gateway signaling

--------------------------------

# Architecture Layers

Client Layer
- reporting dashboards and exports

Application Layer
- metrics aggregation jobs
- reporting APIs

Media Layer
- contributes transport-health metrics as inputs

Data Layer
- PostgreSQL session, call, assignment, and audit records
- optional metrics store for aggregated timeseries

Infrastructure Layer
- scheduled jobs
- analytics storage
- dashboard rendering

--------------------------------

# Module Responsibilities

Module Name: Metrics Service

Location:
`/apps/api/src/services/metrics-service.ts`

Responsibilities:
- compute and expose aggregate KPIs

Module Name: Audit Repository

Location:
`/apps/api/src/repositories/audit-log-repository.ts`

Responsibilities:
- supply lifecycle event history to analytics jobs

Module Name: Session Repository

Location:
`/apps/api/src/repositories/session-repository.ts`

Responsibilities:
- supply historical session data

--------------------------------

# Data Structures

Session
```json
{
  "id": "session-uuid",
  "state": "completed",
  "durationSeconds": 420
}
```

Participant
```json
{
  "actorId": "user-interpreter-1",
  "role": "interpreter"
}
```

InterpreterStatus
```json
{
  "interpreterId": "user-interpreter-1",
  "utilizationPercent": 72
}
```

CallRequest
```json
{
  "id": "call-request-uuid",
  "waitSeconds": 33,
  "state": "completed"
}
```

SessionTransportState
```json
{
  "sessionId": "session-uuid",
  "relayUsed": false,
  "reconnectCount": 1,
  "endedReason": "completed"
}
```

--------------------------------

# Communication Protocols

REST reporting APIs:
- queue analytics
- interpreter utilization analytics
- call success/failure analytics
- session quality analytics

Telemetry inputs:
- audit logs
- session records
- assignment attempts
- media health summaries

--------------------------------

# API Definitions

Planned REST APIs:
- `GET /reports/wait-times`
- `GET /reports/interpreter-utilization`
- `GET /reports/call-success-rate`
- `GET /reports/session-metrics`

Example response:
```json
{
  "averageWaitSeconds": 28,
  "callSuccessRate": 0.94,
  "interpreterUtilization": 0.72
}
```

--------------------------------

# Folder Structure

`/apps/api/src/services/metrics-service.ts`  
`/apps/api/src/repositories/session-repository.ts`  
`/apps/api/src/repositories/audit-log-repository.ts`  
`/apps/api/src/routes`  
`/docs/specifications`

--------------------------------

# Implementation Steps

1. Define analytics KPI set.
2. Implement aggregate queries over queue, assignment, session, and audit data.
3. Implement reporting endpoints.
4. Add historical media health inputs where available.
5. Add dashboard/report consumers.

--------------------------------

# Completion Criteria

- average wait time is reportable
- interpreter utilization is reportable
- call success rate is reportable
- session metrics are reportable
- analytics outputs match persisted source-of-truth records

--------------------------------

# Verification Commands

`pnpm --dir apps/api typecheck`

Manual validation:
- seed representative call/session history
- query reporting endpoints
- verify output matches persisted records
