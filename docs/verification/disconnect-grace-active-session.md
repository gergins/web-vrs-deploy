# Disconnect Grace Active Session Verification

This verification checks the non-explicit end path:

- a call is active
- one side refreshes or disconnects without pressing `Hang up`
- reconnect does not complete
- disconnect grace expires
- we verify whether the ended call still appears as an active session

This is a manual verification procedure rather than a stable automated E2E regression.

Why manual for now:

- the current disconnect path depends on browser refresh timing, websocket close timing, reconnect grace timing, and page re-auth/rejoin behavior
- current repo truth already shows an asymmetry between explicit `client.leave-session` and disconnect-grace expiry
- the goal of this check is to determine the current observed runtime outcome, not to encode an assumed-good behavior that the repo does not yet guarantee

## What current repo code suggests

Current implementation paths:

- explicit hangup:
  - `apps/web/src/app/call/[sessionId]/page.tsx`
  - sends `client.leave-session`
  - `apps/api/src/signaling/handlers/handle-leave-session.ts`
  - persists `SessionRecord.state = completed`
  - sets `endedAt`

- refresh / unmount:
  - `apps/web/src/app/call/[sessionId]/page.tsx`
  - cleanup on unmount does **not** send `client.leave-session`
  - backend disconnect handling uses reconnect grace in:
    - `apps/api/src/signaling/signaling-presence-bridge.ts`
  - on grace expiry, transient session membership is removed and `session.ended` is emitted to peers
  - current disconnect-grace expiry path does **not** persist `SessionRecord.state = completed`
  - `/interpreters/active-session` still checks persisted session truth in:
    - `apps/api/src/routes/interpreter-routes.ts`
    - `apps/api/src/services/session-service.ts`
    - `apps/api/src/repositories/session-repository.ts`

Because of that, the most likely current failure is:

- explicit hangup path cleans up correctly
- refresh/disconnect-without-hangup can still leave a stale persisted active session

## Preconditions

Local stack running:

- web on `http://localhost:3000`
- api on `http://localhost:3001`
- local DB/Redis/Coturn up

Recommended local identities:

- signer: `user-signer-1`
- interpreter: `user-interpreter-1`

Recommended runtime config:

- `.env`
  - `ROUTING_MODE=simultaneous` or `sequential` is fine for this check
  - only one interpreter is needed for this verification

## Verification steps

1. Open Browser A at `http://localhost:3000/queue`
2. Open Browser B at `http://localhost:3000/interpreter`
3. Authenticate:
   - Browser A as `user-signer-1`
   - Browser B as `user-interpreter-1`
4. Start a call from Browser A
5. Accept the offer from Browser B
6. Confirm both browsers land on the same `/call/[sessionId]`
7. Record the `sessionId` shown on the call page
8. In Browser B only, refresh the page or close the browser tab/window without pressing `Hang up`
9. Do **not** reopen/reconnect Browser B yet
10. Wait longer than reconnect grace
    - current local default from `.env` is `RECONNECT_GRACE_MS=30000`
    - wait at least 35 seconds
11. On the machine, query interpreter active-session:

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/interpreters/active-session" -Headers @{ "x-user-id" = "user-interpreter-1" }
```

12. Also query interpreter active-offer:

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/interpreters/active-offer" -Headers @{ "x-user-id" = "user-interpreter-1" }
```

13. Reopen Browser B at `http://localhost:3000/interpreter`
14. Authenticate again as `user-interpreter-1`
15. Observe whether Browser B:
    - stays on `/interpreter`
    - or redirects back into the old `/call/[sessionId]`
16. Start a new call from Browser A
17. Observe whether Browser B receives a visible new offer on the interpreter workspace

## Expected outcomes to classify

### Healthy cleanup

All of these should be true:

- `GET /interpreters/active-session` returns:
  - `activeSession: null`
- `GET /interpreters/active-offer` returns:
  - `activeOffer: null`
- re-authenticated Browser B stays on `/interpreter`
- Browser B can receive a fresh new offer after Browser A starts another call

### Stale active-session failure

One or more of these happens:

- `GET /interpreters/active-session` still returns the old `sessionId`
- Browser B re-auth redirects into the old `/call/[sessionId]`
- Browser B does not remain on the interpreter workspace for the next offer

### Mixed result

Possible mixed case:

- active-session is stale in the API
- but backend can still create a new offer for the interpreter
- Browser B still misses the visible offer because it is redirected into the stale old session instead of staying on `/interpreter`

## What this check proves

This procedure determines whether disconnect-grace expiry currently behaves like a real terminal session cleanup path.

It specifically verifies:

- whether refresh/disconnect without explicit `client.leave-session` clears the persisted active session
- whether `/interpreters/active-session` remains trustworthy after grace expiry
- whether interpreter workspace recovery is blocked by stale session state

## What this check does not prove

This procedure does not prove:

- media-layer correctness after reconnect
- explicit hangup correctness
  - that is covered separately by the explicit hangup verification path
- simultaneous loser cancellation behavior
- full transport recovery under flaky network conditions

## Current likely conclusion from repo truth

Before runtime verification, current code suggests this path is still weak:

- disconnect-grace expiry performs transient signaling cleanup
- explicit persisted session completion is only wired on `client.leave-session`
- stale active-session recovery is therefore still likely after refresh/disconnect without explicit hangup
