# Architecture Compliance Rules

## Rule 1 — Layer Boundary Enforcement

Client Layer:
`apps/web`

Application Layer:
`apps/api`

Media Layer:
`webrtc + signaling`

Data Layer:
`database`

Infrastructure Layer:
`infra + media`

Checks:

- `apps/web` must not import modules from `/apps/api`
- client code must not access database modules
- media code must not implement queue logic

------------------------------------------------

## Rule 2 — Signaling Protocol Contract

Verify that signaling messages use canonical types:

`client.auth`  
`client.join-session`  
`signal.offer`  
`signal.answer`  
`signal.ice-candidate`  
`session.joined`  
`session.left`  
`session.ended`

Check:

message envelope contains required fields:

`messageId`  
`correlationId`  
`type`  
`sessionId`  
`actorId`  
`payload`

------------------------------------------------

## Rule 3 — Session Lifecycle Validation

Ensure session states follow valid transitions:

`REQUESTED → QUEUED`  
`QUEUED → OFFERED`  
`OFFERED → ACCEPTED`  
`ACCEPTED → SESSION_CREATED`  
`SESSION_CREATED → ACTIVE`  
`ACTIVE → ENDED`

No component except the Session Orchestrator may change session state.

------------------------------------------------

## Rule 4 — Authentication Enforcement

Verify that `join-session` cannot occur before authentication.

Required sequence:

`client.auth`  
`server.authenticated`  
`client.join-session`  
`session.joined`

Any violation must produce an error.

------------------------------------------------

## Rule 5 — Repository Structure Integrity

Verify critical directories exist:

`/apps/web`  
`/apps/api`  
`/media/turn`  
`/docs/specifications`  
`/docs/architecture`

Signaling must remain located in:

`/apps/api/src/signaling`

------------------------------------------------

## Rule 6 — TURN Configuration Requirement

Verify WebRTC peer connections include:

STUN servers  
TURN relay configuration

TURN must remain configured as fallback.

------------------------------------------------

## Rule 7 — Logging Requirements

Ensure critical events are logged:

authentication  
session lifecycle  
queue assignment  
media connection state

Logs must include:

`connectionId`  
`sessionId`

------------------------------------------------

# Implementation Strategy

Compliance checks should run during development workflows.

Possible implementation approaches:

ESLint rules  
TypeScript import boundary rules  
repository validation scripts  
CI verification scripts

------------------------------------------------

# CI Integration

Add architecture compliance step to CI pipeline.

Example command:

`pnpm run verify:architecture`

CI must fail if:

layer violations detected  
protocol changes detected  
repository structure altered  
session lifecycle rules violated

------------------------------------------------

# Completion Criteria

Architecture compliance checks are considered operational when:

CI rejects invalid architecture changes  
layer violations are automatically detected  
protocol changes trigger review  
repository structure remains stable
