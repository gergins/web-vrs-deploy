# System Overview

This repository currently implements a single-deployable-first Video Relay Service monorepo with six runtime components:

- `web`: Next.js browser client
- `api`: Express REST API plus WebSocket signaling gateway
- `postgres`: authoritative persistence for users, interpreters, call requests, assignment attempts, sessions, and audit history
- `redis`: reserved for ephemeral realtime state
- `coturn`: TURN relay for browser media connectivity fallback
- `nginx`: public entry point for web, API, and WebSocket traffic

## Current implemented shape

The backend control plane is implemented as a locally runnable authenticated prototype:

- REST routes are mounted for `health`, `auth`, `calls`, `queue`, `sessions`, and `interpreters`
- TURN credential REST route is mounted at `/turn/credentials`
- WebSocket signaling is attached at `/ws`
- inbound signaling messages use the documented envelope shape
- canonical signaling events are validated and routed
- a bounded call-control flow exists:
  - call request created
  - call enters `queued`
  - one or more available interpreters are offered the call according to the configured routing mode
  - interpreter may accept or decline
  - session record is created on accept

The frontend implements the current prototype surfaces:

- home page supports local seeded login
- queue page supports signer authentication, call creation, and queue/session progress
- interpreter page supports interpreter authentication, active-session recovery, active-offer recovery, and offer response
- call page supports authenticated session join/rejoin, call controls, diagnostics, and browser WebRTC media setup
- TURN verification page exists for local ICE/TURN validation
- admin page is still scaffold-only

## Control plane boundaries

- REST handles call creation and simple queue/session lookups
- WebSocket signaling handles local auth handoff, session joins, assignment responses, and SDP/ICE relay
- PostgreSQL is the source of truth for control-plane history
- Redis is used for transient presence and short-lived realtime coordination
- media transport is not handled by the API; browser peers use WebRTC directly

## Current limitations

- auth is seeded local-prototype auth only
- reconnect and heartbeat recovery are implemented in bounded prototype form and still require runtime verification
- admin and analytics tooling are deferred
- regression coverage is still thin; the repo currently has one E2E happy-path script plus manual verification docs
