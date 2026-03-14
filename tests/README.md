# Web VRS E2E Regression Tests

This document describes the current browser-based end-to-end regression suite for the local Web VRS prototype.

These tests run from the repo root and drive real browser sessions against the local demo stack.

## Current core regression suite

Root command to run the current core E2E regressions in sequence:

```powershell
pnpm.cmd test:e2e:core
```

This runs:

- `pnpm.cmd test:e2e:happy-path`
- `pnpm.cmd test:e2e:simultaneous-offer`
- `pnpm.cmd test:e2e:hangup-reoffer`
- `pnpm.cmd test:e2e:disconnect-grace`

## Individual tests

### `tests/e2e/authenticated-happy-path.mjs`

Run:

```powershell
pnpm.cmd test:e2e:happy-path
```

Covers:

- signer authenticates
- interpreter authenticates
- signer starts a call
- interpreter receives an offer
- interpreter accepts
- both browsers land in the same `/call/[sessionId]`
- call page auth, role, session id, and signaling state are valid

### `tests/e2e/simultaneous-offer-fanout.mjs`

Run:

```powershell
pnpm.cmd test:e2e:simultaneous-offer
```

Covers:

- both interpreters receive offers for the same call in simultaneous mode
- each interpreter gets a distinct assignment attempt
- one interpreter accepts first
- only the winner lands in the call session
- losing interpreter receives cancellation and loses the stale offer
- losing interpreter refresh/re-auth does not restore the cancelled offer

### `tests/e2e/hangup-reoffer-eligibility.mjs`

Run:

```powershell
pnpm.cmd test:e2e:hangup-reoffer
```

Covers:

- signer and interpreter complete the normal call entry flow
- explicit `Hang up` is used through the normal call UI
- session end cleanup completes through the explicit leave path
- interpreter active-session recovery no longer restores the ended session
- the interpreter can return to the workspace and receive a fresh next offer

### `tests/e2e/disconnect-grace-active-session.mjs`

Run:

```powershell
pnpm.cmd test:e2e:disconnect-grace
```

Covers:

- signer and interpreter enter an active call
- interpreter disconnects without pressing `Hang up`
- reconnect is intentionally not completed
- reconnect grace expires
- old session is no longer returned by `/interpreters/active-session`
- interpreter workspace does not restore the stale old session
- interpreter can receive a fresh next offer after reopening the workspace

## Prerequisites

Before running the E2E suite:

1. install dependencies

```powershell
pnpm.cmd install
```

2. make sure the local stack is running

Expected local endpoints:

- web: `http://localhost:3000`
- api: `http://localhost:3001`
- websocket: `ws://localhost:3001/ws`

3. make sure the local database has been prepared and seeded

Typical local setup:

```powershell
pnpm.cmd demo:infra
pnpm.cmd db:generate
pnpm.cmd db:push
pnpm.cmd db:seed
```

Expected seeded users:

- signer: `user-signer-1`
- interpreter 1: `user-interpreter-1`
- interpreter 2: `user-interpreter-2`

4. Chrome must be installed at this path:

```text
C:\Program Files\Google\Chrome\Application\chrome.exe
```

The current E2E harness uses Chrome DevTools Protocol and assumes that path.

## High-level failure interpretation

Common failure categories:

- auth or startup failures
  - likely local stack not running
  - wrong ports
  - missing seeded users

- missing offer failures
  - likely queue/assignment routing issue
  - wrong routing mode for simultaneous test
  - interpreter presence/auth problem

- call join failures
  - likely stale session URL
  - wrong role/session ownership
  - signaling join authorization rejection

- hangup/reoffer failures
  - likely session completion cleanup issue
  - stale active-session recovery still blocking interpreter workspace

- disconnect-grace failures
  - likely reconnect-grace expiry did not persist terminal session completion
  - or interpreter workspace recovery still restored stale session state

## Timing-sensitive tests

These tests are more timing-sensitive than the base happy path:

- `tests/e2e/simultaneous-offer-fanout.mjs`
  - depends on both interpreters being ready for the same live offer window

- `tests/e2e/hangup-reoffer-eligibility.mjs`
  - depends on explicit call-end cleanup and subsequent next-call timing

- `tests/e2e/disconnect-grace-active-session.mjs`
  - most timing-sensitive
  - waits for reconnect grace expiry and depends on disconnect timing, browser close timing, and post-grace recovery state

The happy-path test is the least timing-sensitive.

## What is not covered yet

Current E2E coverage does not yet prove:

- near-simultaneous double-accept race timing under simultaneous mode
- neither-interpreter-accepts timeout/expiry path
- full media-quality or TURN-relay correctness under hostile network conditions
- all stale URL / stale browser-session permutations
- admin/operations flows
- unit-level or integration-level service coverage
