# Observability

This document describes the current observability reality in the repo.

## Current implemented observability

The repo currently relies on application logging and page-level diagnostics.

### Backend logging

Backend code logs through:

- `apps/api/src/config/logger.ts`

Current logger implementation is minimal:

- `logger.info(...)` -> `console.log(...)`
- `logger.warn(...)` -> `console.warn(...)`
- `logger.error(...)` -> `console.error(...)`

There is no structured log pipeline, log shipping, or metrics backend wired in the repo today.

### Logged backend areas

Current backend logging is used in important control-plane paths, including:

- queue request creation
- queue state transitions
- assignment creation and offer delivery
- assignment cancellation delivery
- signaling auth and message receipt
- signaling rejection and websocket send failures
- session leave acceptance

This means the repo does have useful local runtime traces for queue, assignment, signaling, and session termination debugging.

### Frontend diagnostics

The web app currently exposes runtime diagnostics in-page rather than through a shared observability platform.

Examples:

- `/queue`
  - last event type
  - current queue state
  - session id
  - latest raw signaling payload
- `/interpreter`
  - last signaling event
  - active session id
  - open offer count
  - latest raw signaling payload
  - bounded interpreter trace diagnostics
- `/call/[sessionId]`
  - connection status diagnostics
  - signaling state
  - session id
  - role
  - last major event
  - media and peer diagnostics
- `/turn-test`
  - ICE gathering logs
  - ICE candidate list
  - ICE candidate errors
  - candidate-type counts

## What is not implemented

The following observability capabilities are not implemented yet:

- metrics endpoint
- Prometheus/OpenTelemetry integration
- distributed tracing
- centralized log aggregation
- alerting
- dashboards
- durable audit/event reporting pipeline

The following files currently exist but are not implemented:

- `apps/api/src/services/metrics-service.ts`
- `apps/api/src/services/audit-service.ts`

## Current operational guidance

For the current local prototype, the primary observability workflow is:

1. read API stdout/stderr logs
2. read web dev stdout/stderr logs
3. inspect in-page diagnostics on `/queue`, `/interpreter`, `/call/[sessionId]`, and `/turn-test`
4. use browser DevTools for websocket, media, and React-state inspection when needed

## Verification reality

Current verification in the repo is mostly:

- `pnpm.cmd --dir apps/api typecheck`
- `pnpm.cmd --dir apps/web typecheck`
- targeted manual browser validation
- one E2E happy-path script in `tests/e2e/authenticated-happy-path.mjs`

That means observability is currently sufficient for local prototype debugging, but not production-grade operations.
