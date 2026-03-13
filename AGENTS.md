# AGENTS.md

This repository contains a browser-based Video Relay Service.

## Authority order

1. project-manifest.json
2. docs/architecture/*
3. docs/flows/*
4. docs/contracts/*
5. packages/contracts/src/*
6. implementation files

Implementation must follow documented contracts.
Do not invent alternate architecture.

## Runtime model

Single-deployable-first monorepo.

Deployables:
- web
- api
- postgres
- redis
- coturn
- nginx

No premature microservices.

## Authoritative domains

Backend:
- auth
- presence
- queue
- interpreter
- assignment
- session
- reporting

Frontend:
- api client
- signaling client
- call state
- media manager
- WebRTC peer session
- reconnect manager

## Signaling rules

WebRTC signaling must use WebSocket only.
All SDP offer/answer exchange passes through signaling gateway.
All ICE candidate exchange passes through signaling gateway.
Do not create any peer-discovery path outside the signaling module.

## Media rules

Use RTCPeerConnection for browser media sessions.
Observe both:
- connectionState
- iceConnectionState

Support:
- direct connectivity
- TURN relay fallback

ICE server configuration comes from environment variables.

## Data authority

PostgreSQL is the source of truth for:
- users
- interpreters
- call requests
- assignment attempts
- session history
- audit logs

Redis is only for:
- presence
- websocket connection maps
- short-lived session cache
- queue counters
- locks
- transient fanout

## Session state rules

Only these states are valid unless docs are updated:
- idle
- requesting
- queued
- offered
- accepted
- session_created
- connecting
- connected
- reconnecting
- degraded
- failed
- completed
- cancelled

## Security rules

Never expose secrets in frontend bundles.
Validate every inbound signaling message.
Authenticate websocket connections.
Authorize session join by role and membership.
Log every session lifecycle transition.
Protect admin routes.

## Development rules

Prefer small bounded edits.
Update contracts before implementation when changing behavior.
Keep docs aligned with behavior.
Do not silently rename event types or states.

## Truth Promotion Rule

If a bug reveals a missing or ambiguous system behavior that is likely to recur,
Codex must determine whether the repo needs a new or updated authoritative doc.

Examples:
- `disconnect-flow.md`
- `signaling-flow.md`
- `media-flow.md`
- `call-flow.md`

Create or update a truth doc only when all 3 are true:
1. behavior was ambiguous
2. repeated fixes occurred in the same area
3. future drift is likely without a repo-level definition

Truth docs must describe actual intended system behavior,
not aspirational architecture.

## Agent guidance

Canonical execution-method layer:
- `.agents/skills/*`

Supporting reference notes live under:
- `skills/debug/*`

Treat `.agents/skills/*` as the canonical Codex skill layer.
Treat `skills/debug/*` as supporting human-readable debugging notes and source material for those skills.
Use both to stay aligned with this repo's documented flows and failure classes.

## Goal

Build a stable browser VRS capable of:
- signer requesting interpreter
- interpreter receiving and accepting offer
- session creation
- SDP and ICE exchange
- WebRTC media connection
- reconnect and recovery
- session completion
- auditable lifecycle
