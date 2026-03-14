# Web VRS

Browser-based Video Relay Service prototype.

Current working prototype scope:
- local role-based login from `/`
- Deaf user flow
- interpreter flow
- queue -> offer -> accept -> session -> call
- browser-to-browser signaling and WebRTC media
- local Docker-backed runtime

## Current status

This repository is a **locally runnable authenticated prototype**.

What works today:
- seeded local auth
- signer requests a call
- interpreter receives and accepts an offer
- session creation
- WebSocket signaling
- SDP / ICE exchange
- browser WebRTC call entry
- first-pass Deaf UI
- first-pass interpreter UI

Out of scope for now:
- PSTN bridge
- SIP addressing
- RTT
- device selection
- group calls

Authoritative repo truth:
- `project-manifest.json`
- `docs/architecture/*`
- `docs/flows/*`
- `docs/contracts/*`

## Monorepo shape

- `apps/web` — Next.js client
- `apps/api` — Express API + WebSocket signaling server
- `packages/*` — shared contracts and utilities
- `infra/*` — Docker and nginx assets
- `docs/*` — architecture, specifications, contracts, operations, product notes

Runtime model:
- `web`
- `api`
- `postgres`
- `redis`
- `coturn`
- `nginx`

## Core flow

The current primary flow is:

1. Deaf user logs in from `/`
2. Deaf user starts a call from `/queue`
3. Interpreter logs in and waits on `/interpreter`
4. Interpreter receives an offer
5. Interpreter accepts
6. Session is created
7. Both browsers navigate to `/call/[sessionId]`
8. WebRTC call setup begins

## Local development

Use the repo operations guide as the source of truth:

- `docs/operations/local-demo.md`

Typical local startup sequence:

```powershell
pnpm.cmd install
pnpm.cmd demo:infra
pnpm.cmd db:generate
pnpm.cmd db:push
pnpm.cmd db:seed
pnpm.cmd demo:api:built
pnpm.cmd demo:web:built
```

If the normal dev commands work on your machine, you can also use:

```powershell
pnpm.cmd demo:api
pnpm.cmd demo:web
```

Normal local API starts prefer the repo-root `.env`.
If `.env` is missing, the local API scripts fall back to `.env.example`.

Default local URLs:
- app: `http://localhost:3000`
- api: `http://localhost:3001`
- websocket: `ws://localhost:3001/ws`

## Seeded local identities

Current local prototype users:
- Deaf user: `user-signer-1`
- Interpreter 1: `user-interpreter-1`
- Interpreter 2: `user-interpreter-2`

The home page `/` provides the local role-based login entry for the seeded signer and interpreter identities.

## Verification

Useful commands:

```powershell
pnpm.cmd --dir apps/api typecheck
pnpm.cmd --dir apps/web typecheck
pnpm.cmd test:e2e:happy-path
```

## Important architecture rules

- WebRTC signaling uses WebSocket only.
- Signaling transports messages; it must not own business logic.
- PostgreSQL is the durable source of truth.
- Redis is transient only.
- Do not rename canonical websocket events casually.
- Do not change session states without updating docs first.

Relevant architecture docs:
- `docs/architecture/system-architecture-map.md`
- `docs/architecture/architecture-guardrails.md`
- `docs/architecture/system-invariants.md`
- `docs/architecture/ai-implementation-protocol.md`
- `docs/architecture/webrtc-anti-drift-rule.md`

## Specifications

Subsystem specifications live under:

- `docs/specifications/`

Key specs:
- `docs/specifications/media-layer.md`
- `docs/specifications/session-orchestration.md`
- `docs/specifications/queue-routing.md`
- `docs/specifications/interpreter-workspace.md`
- `docs/specifications/deaf-ui.md`

## Next priority

Current implementation priority after the first working prototype loop:

1. call UI polish
2. remote departure and reconnect UX hardening
3. basic in-call chat

See:
- `docs/architecture/development-priority-order.md`
- `docs/product/development-roadmap.md`
