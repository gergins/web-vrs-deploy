# Disconnect Flow

This file describes the currently implemented disconnect behavior for call sessions when a participant
does not leave through explicit `client.leave-session`.

This is a flow doc.

- Use `docs/contracts/session-state-machine.md` for canonical state names and terminal-state meaning.
- Use `docs/flows/reconnect-flow.md` for the successful reconnect sequence.

## Scope

This flow covers:

- websocket disconnect during an active call
- reconnect grace handling
- successful reconnect before grace expiry
- grace expiry without successful reconnect
- transient signaling cleanup
- persisted session completion on grace expiry
- active-session recovery impact after disconnect-only termination

This flow does not describe explicit hangup in detail.
Explicit hangup uses `client.leave-session` and is covered separately in `docs/flows/call-flow.md`.

## Current disconnect entry point

When a call participant loses the websocket connection without pressing `Hang up`:

1. the websocket connection closes
2. backend schedules disconnect grace for that authenticated connection
3. the connection remains eligible for reconnect during that grace window

Current implementation path:

- `apps/api/src/signaling/signaling-presence-bridge.ts`
  - `scheduleTerminalDeparture(...)`

Current frontend causes that can reach this path:

- browser refresh while on `/call/[sessionId]`
- browser tab or window close
- websocket loss during the call page while no explicit `client.leave-session` was sent

## Reconnect grace window

During the grace window:

1. the participant is not yet treated as terminally departed
2. the session is not immediately persisted as completed
3. the client may reconnect and rejoin the authorized session

Current repo truth:

- the grace duration comes from `RECONNECT_GRACE_MS`
- successful reconnect is handled through the reconnect flow in:
  - `docs/flows/reconnect-flow.md`
- if reconnect succeeds in time, pending disconnect-grace cleanup is cancelled

Relevant implementation:

- `apps/api/src/signaling/signaling-presence-bridge.ts`
  - `cancelTerminalDeparture(...)`

## Successful reconnect path

If the disconnected participant reconnects before grace expiry:

1. the pending disconnect-grace timeout is cancelled
2. terminal cleanup does not run
3. the session remains active
4. the client can re-authenticate and rejoin the same session
5. active-session recovery should continue to treat the session as active

This is intentionally different from hangup:

- reconnect within grace preserves the session
- it must not mark the session `completed`

## Grace-expiry path

If reconnect does not complete before grace expires:

1. the pending disconnect-grace timer fires
2. backend logs disconnect-grace expiry
3. backend now marks each affected persisted `SessionRecord` as:
   - `state = "completed"`
   - `endedAt = now`
4. backend emits `session.ended` to any remaining peer connections in that session
5. backend removes the disconnected participant from transient session registries
6. backend removes the disconnected connection from transient connection maps
7. backend clears heartbeat presence for that connection, and clears user cache if no other live connections remain

Current implementation:

- `apps/api/src/signaling/signaling-presence-bridge.ts`
  - disconnect-grace expiry timeout inside `scheduleTerminalDeparture(...)`
- `apps/api/src/services/session-service.ts`
  - `markSessionsCompleted(...)`
- `apps/api/src/repositories/session-repository.ts`
  - `markCompleted(...)`

## Persisted session completion on grace expiry

Current behavior now matches the implemented explicit terminal rule:

- a session that fails to recover within reconnect grace is persistently terminal
- the persisted `SessionRecord` is updated to:
  - `state = "completed"`
  - `endedAt = timestamp`

This completion path is idempotent:

- `markCompleted(...)` only updates sessions where `endedAt` is still `null`
- if another terminal path already completed the session, the repository returns the current row without re-opening or corrupting it

## Difference from explicit `client.leave-session`

Explicit hangup:

1. participant clicks `Hang up`
2. frontend sends `client.leave-session`
3. backend immediately marks the session `completed`
4. backend emits `session.ended`
5. frontend closes signaling and media as a local terminal path

Disconnect-only path:

1. websocket closes without explicit leave
2. backend starts reconnect grace
3. session is still recoverable during that grace window
4. only after grace actually expires does backend mark the session `completed`
5. backend then emits `session.ended` and removes transient membership

So the key difference is timing:

- explicit leave completes immediately
- disconnect-only termination completes only after reconnect grace expires

## Active-session recovery after disconnect-only termination

Interpreter active-session recovery uses persisted session truth:

- `apps/api/src/routes/interpreter-routes.ts`
- `apps/api/src/services/session-service.ts`
- `apps/api/src/repositories/session-repository.ts`

`/interpreters/active-session` returns only sessions where:

- `endedAt === null`
- state is not terminal

After disconnect grace expires and the session is marked `completed`:

- that session must no longer be returned by `/interpreters/active-session`
- interpreter workspace recovery should stay on `/interpreter`
- the interpreter should become available for future offer handling instead of being redirected into the stale old call

## Current limitations and manual verification status

Current repo truth is stronger than before, but this area is still only partially runtime-verified.

Verified in implementation:

- grace-expiry transient cleanup exists
- grace-expiry now also persists `SessionRecord.completed` and `endedAt`
- active-session recovery excludes terminal persisted sessions

Still requiring manual verification:

- the full browser refresh/disconnect path under local runtime timing
- whether the interpreter always remains on `/interpreter` after grace expiry instead of being redirected to an old call
- whether the same interpreter reliably receives a fresh next offer after that path

Current manual verification guide:

- `docs/verification/disconnect-grace-active-session.md`

## Relationship to the session-state contract

This flow uses the canonical contract in `docs/contracts/session-state-machine.md`.

Relevant contract implications:

- `completed` is terminal
- terminal persisted sessions must not be returned as active recoverable sessions
- disconnect-only termination now converges on the same terminal persisted state used by explicit leave
