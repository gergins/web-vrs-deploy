# Regression Gate

## Purpose
Require explicit pass/fail evidence after a debugging fix so the repo does not trade one bug for another.

## When to use
- After any debugging patch
- After changes to signaling, queue, session lifecycle, cleanup, or media watchdog logic

Primary ownership:
- Cross-layer verification

## Inputs / evidence
- Browser console evidence
- API logs
- Visible UI status text
- Event sequence
- Peer and ICE state
- Remote stream cleanup outcome
- Queue/create-call response

Repo-relevant paths:
- `docs/operations/manual-test-checklist.md`
- `apps/web/src/app/call/[sessionId]/page.tsx`
- `apps/api/src/routes/call-routes.ts`
- `apps/api/src/signaling/*`

## Required workflow
1. Re-test the original bug.
2. Re-test at least 2 adjacent flows.
3. Record pass/fail evidence for each flow.
4. Do not mark complete without concrete observed results.

Required checks:
- Auth/join flow:
  - expected status text moves past authenticating
  - expected event sequence includes `server.authenticated` then `session.joined`
- Queue/create-call flow:
  - expected `POST /calls` succeeds
  - expected no `500` before queue creation
- Negotiation start:
  - expected offer/answer sequence occurs
  - expected peer/ICE states leave `new`
- Remote leave:
  - expected connected peer is removed
  - expected remote stream is cleared
  - expected remote video no longer remains black/live-looking
- Repeated call safety:
  - expected call B does not inherit stale stream, peer state, or listener state

## Hard rules
- No fix is complete unless the original bug and at least 2 adjacent flows are rechecked.
- "Looks good" is not acceptable evidence.
- If a check fails, record the exact failed expectation.

## Output
- Test matrix with pass/fail
- Evidence for each checked flow
- Remaining regression risk

## Recommended usage order
- Use this after any fix from the other debug skills.
- If it fails, return to `skills/debug/bug-triage.md` with the failed expectation.
