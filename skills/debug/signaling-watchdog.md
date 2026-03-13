# Signaling Watchdog

## Purpose
Make signaling order visible and isolate bugs in auth, join, offer, answer, ICE, and session lifecycle handling.

## When to use
- Auth/join ack stall
- No signaling messages received
- Negotiation not starting
- Offer or answer not applied
- ICE ordering problems
- Stale identity propagation or wrong actor/session mapping

Primary ownership:
- Backend signaling and session behavior
- Frontend signaling parsing and event handling

## Inputs / evidence
- WebSocket connect/open/close events
- Outbound auth/join payloads
- Inbound `server.authenticated`, `session.joined`, `signal.offer`, `signal.answer`, `signal.ice-candidate`, `session.ended`
- Browser event timeline
- API signaling logs

Repo-relevant paths:
- `apps/web/src/signaling/signaling-client.ts`
- `apps/web/src/app/call/[sessionId]/page.tsx`
- `apps/api/src/signaling/*`

## Required workflow
1. Add temporary logs at the exact signaling boundary being inspected.
2. Log with timestamp, session id, actor id, and event type where practical.
3. Verify this sequence when relevant:
   - websocket connected
   - auth sent
   - auth acknowledged
   - join sent
   - join acknowledged
   - offer/answer exchange
   - ICE exchange
4. Check state-sensitive assertions:
   - answer handled only after offer flow exists
   - early ICE is buffered if remote description is missing
   - no second peer session is created unintentionally
   - stale peer/session state is not retained after terminal close
5. Remove or reduce excessive temporary logs after the root cause is proven.

## Hard rules
- Temporary frontend logs should usually live in `apps/web/src/signaling/signaling-client.ts` or `apps/web/src/app/call/[sessionId]/page.tsx`.
- Temporary backend logs should usually live in `apps/api/src/signaling/*`.
- Do not leave broad permanent spam logging after the bug is fixed.
- Reduce logs once the exact failure point is found and verified.
- If the failure is clearly infra-related, switch to `skills/debug/local-env-sanity.md`.

## Output
- Exact event sequence
- Exact wrong state or missing event
- Likely source file
- Smallest safe fix
- Verification result

## Recommended usage order
- Start with `skills/debug/bug-triage.md`.
- Use this file for auth/join ack stall or negotiation-start failures.
- Use `skills/debug/media-watchdog.md` only if signaling looks correct but media is still stale.
- Finish with `skills/debug/regression-gate.md`.
