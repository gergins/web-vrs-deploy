# AI Implementation Protocol for Web VRS Platform

## Purpose

This document defines the required development workflow for AI-assisted implementation in this repository.

The protocol ensures that automated development remains deterministic, safe, and aligned with the system architecture.

All implementation must follow this protocol.

------------------------------------------------

# Rule 1 — Specification First Development

All major development work must begin with a specification.

Specifications must exist in:

`/docs/specifications`

Before implementing a subsystem, the agent must:

1. locate the corresponding specification
2. read the architecture section
3. identify required modules
4. verify repository locations

Implementation must follow the specification.

Agents must not invent new architecture without updating the specification.

------------------------------------------------

# Rule 2 — No Direct Architecture Changes

Agents must not modify architecture structure unless explicitly instructed.

Prohibited changes include:

moving subsystem directories  
renaming signaling protocol messages  
moving media infrastructure outside `/media`  
moving signaling outside `/apps/api/src/signaling`

Architecture changes require specification updates first.

------------------------------------------------

# Rule 3 — Small Bounded Changes

Each implementation task must be bounded.

Tasks must include:

objective  
files to modify  
invariants  
acceptance criteria

Large uncontrolled code generation is not allowed.

------------------------------------------------

# Rule 4 — Preserve System Contracts

The following contracts must not change without specification updates:

WebSocket signaling message types  
session state vocabulary  
REST API contract definitions  
database schema definitions

Changes must update documentation first.

------------------------------------------------

# Rule 5 — Typecheck Before Reporting Success

Agents must run verification commands before reporting success.

Required commands:

`pnpm --dir apps/api typecheck`  
`pnpm --dir apps/web typecheck`

If tests exist:

`pnpm test`

Agents must not claim success if typecheck fails.

------------------------------------------------

# Rule 6 — Deterministic Output Format

All implementation tasks must produce a change report.

Required report format:

Change Report

Files modified

Behavior changed

Contracts affected

Commands executed

Verification results

Remaining risks

------------------------------------------------

# Rule 7 — Preserve Layer Boundaries

Agents must maintain architecture layers.

Client Layer:  
`apps/web`

Application Layer:  
`apps/api`

Media Layer:  
`webrtc + signaling`

Infrastructure Layer:  
`docker / media / turn`

Cross-layer logic must not occur.

------------------------------------------------

# Rule 8 — Media Layer Safety

Media subsystem must remain isolated.

Allowed responsibilities:

WebRTC peer connections  
ICE candidate exchange  
media transport

Not allowed:

call routing  
authentication logic  
queue management

------------------------------------------------

# Rule 9 — Session Lifecycle Authority

Session state changes must occur only in the Session Orchestrator.

Client code must not manipulate session states.

Session states include:

REQUESTED  
QUEUED  
OFFERED  
ACCEPTED  
SESSION_CREATED  
ACTIVE  
ENDED

------------------------------------------------

# Rule 10 — WebSocket Protocol Discipline

WebSocket message structure must remain stable.

Message structure:

```json
{
  "messageId": "uuid",
  "correlationId": "uuid",
  "type": "client.auth",
  "sessionId": "session-uuid",
  "actorId": "user-signer-1",
  "payload": {}
}
```

Agents must not change this structure without specification updates.

------------------------------------------------

# Rule 11 — Verification Before Completion

Agents must confirm:

system compiles  
typecheck passes  
contracts remain intact  
architecture guardrails remain respected

------------------------------------------------

# Rule 12 — Safe E2E Validation

Where possible agents must run existing verification flows.

Example:

happy-path E2E tests  
manual call setup validation  
session join validation

Agents must not modify test logic unless fixing broken tests.

------------------------------------------------

# Rule 13 — Documentation Synchronization

Whenever implementation changes affect:

protocols  
APIs  
session states  
architecture structure

the agent must update documentation accordingly.

After each successfully implemented and validated component, update `/docs/architecture/current-system-status.md` before closing the task.

------------------------------------------------

# Rule 14 — Incremental Development

Agents must prefer:

small patch sets  
minimal surface changes  
clear acceptance criteria

Large multi-subsystem changes should be broken into phases.

------------------------------------------------

# Rule 15 — Repository Safety

Agents must not:

delete infrastructure directories  
rewrite the repository structure  
remove existing specifications  
replace signaling protocols
