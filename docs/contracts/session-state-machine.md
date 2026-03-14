# Session State Machine

This contract defines the canonical state names used across the repo.

Authoritative supporting truth:
- `AGENTS.md`
- `docs/flows/session-state-machine.md`
- `docs/flows/call-flow.md`
- `apps/api/src/db/prisma/schema.prisma`

## Canonical states

Only these states are valid unless the docs and implementation are updated together:

- `idle`
- `requesting`
- `queued`
- `offered`
- `accepted`
- `session_created`
- `connecting`
- `connected`
- `reconnecting`
- `degraded`
- `failed`
- `completed`
- `cancelled`

## Current durable usage in the repo

The current implementation persists only a subset of these states directly:

- `CallRequest.state`
  - `requesting`
  - `queued`
  - `offered`
  - `accepted`
  - `cancelled`
- `SessionRecord.state`
  - `session_created`
  - `completed`
- `AssignmentAttempt.outcome`
  - not a session state machine field
  - currently uses `offered`, `accepted`, `declined`, and `cancelled`

Frontend call UI also uses additional local call-phase labels such as `connected`, `reconnecting`, `failed`, and `ended` for user experience and media/signaling diagnostics. Those local UI labels do not replace the canonical contract states above.

## Required transition model

The canonical transition model currently documented in repo truth is:

- `idle -> requesting`
- `requesting -> queued`
- `queued -> offered`
- `offered -> accepted`
- `offered -> queued`
- `accepted -> session_created`
- `session_created -> connecting`
- `connecting -> connected`
- `connecting -> failed`
- `connected -> reconnecting`
- `reconnecting -> connected`
- `reconnecting -> degraded`
- `reconnecting -> failed`
- `connected -> completed`
- `queued -> cancelled`
- `offered -> cancelled`

## Terminal states

These states are terminal in the canonical model:

- `failed`
- `completed`
- `cancelled`

Once a persisted session is marked terminal and `endedAt` is set, it must no longer be returned by active-session recovery paths such as `/interpreters/active-session`.

## Current implementation notes

- Accepting an assignment creates a `SessionRecord` in `session_created`.
- `client.leave-session` currently marks the `SessionRecord` as `completed` and sets `endedAt`.
- Call-request terminal cleanup after session completion is not fully generalized across all end paths yet. The canonical state model still reserves `completed` and `cancelled` for that eventual control-plane use.

## Flow relationship

This file is the contract.

- Use this file for canonical state names and allowed transitions.
- Use `docs/flows/session-state-machine.md` for explanatory flow context.
