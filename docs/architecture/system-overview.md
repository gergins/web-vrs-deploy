# System Overview

This repository currently implements a single-deployable-first Video Relay Service monorepo with six runtime components:

- `web`: Next.js browser client
- `api`: Express REST API plus WebSocket signaling gateway
- `postgres`: authoritative persistence for users, interpreters, call requests, assignment attempts, sessions, and audit history
- `redis`: reserved for ephemeral realtime state
- `coturn`: TURN relay for browser media connectivity fallback
- `nginx`: public entry point for web, API, and WebSocket traffic

## Current implemented shape

The backend control plane is partially implemented today:

- REST routes are mounted for `health`, `auth`, `calls`, `queue`, `sessions`, and `interpreters`
- WebSocket signaling is attached at `/ws`
- inbound signaling messages use the documented envelope shape
- canonical signaling events are validated and routed
- a bounded call-control flow exists:
  - call request created
  - call enters `queued`
  - first available interpreter is offered the call
  - interpreter may accept or decline
  - session record is created on accept

The frontend is still minimal:

- home page exists
- queue page can be used as a thin client for the current call request flow
- call page can connect to the signaling gateway and show session join status
- full media UI, stores, and queue/admin workflows are not implemented yet

## Control plane boundaries

- REST handles call creation and simple queue/session lookups
- WebSocket signaling handles authentication placeholders, session joins, assignment responses, and SDP/ICE relay
- PostgreSQL is the source of truth for control-plane history
- Redis is not yet deeply integrated into the runtime behavior
- media transport is not handled by the API; browser peers will eventually use WebRTC directly

## Current limitations

- auth is placeholder-level
- reconnect and heartbeat recovery are only partially implemented
- Docker and nginx are being brought to minimum structural coherence
- tests are not implemented yet
