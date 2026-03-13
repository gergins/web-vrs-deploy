# Bug Triage

## Purpose
Provide an evidence-first workflow for debugging a concrete bug in this web VRS repo without broad refactors or repeated guess patches.

## When to use
- Any reported bug with a reproducible symptom
- Auth/join ack stall
- `/calls` `500` before queue creation
- Negotiation not starting
- Stale identity propagation
- Stale connected UI
- Frozen then black remote video after peer leaves

Primary ownership:
- Cross-layer triage
- Start narrow, then route to frontend, backend, or local environment based on evidence

## Inputs / evidence
- Exact reproduction steps
- Expected result vs actual result
- Browser console output
- API logs
- Request/response traces
- WebSocket event timeline
- `RTCPeerConnection` state
- ICE state
- Track events
- `getStats()` samples if media is involved

Repo-relevant paths:
- `apps/web/src/app/call/[sessionId]/page.tsx`
- `apps/web/src/signaling/signaling-client.ts`
- `apps/web/src/webrtc/peer-session.ts`
- `apps/api/src/signaling/*`
- `apps/api/src/routes/call-routes.ts`
- `docs/operations/manual-test-checklist.md`

## Required workflow
1. Restate the bug in one sentence.
2. Define exact reproduction steps.
3. State expected result and actual result.
4. Identify the narrowest relevant execution path.
5. Gather evidence before editing code.
6. Produce the top 3 hypotheses ranked by evidence.
7. Identify the exact throw site or failing state transition if found.
8. Apply the smallest bounded fix only.
9. Verify against explicit acceptance criteria.

## Hard rules
- Do not retry the same idea in different wording.
- Do not refactor unrelated files.
- Do not change signaling, media, UI, and backend together unless evidence proves a cross-layer fault.
- Do not blame app code before checking `skills/debug/local-env-sanity.md` when local infra may be involved.
- If two attempts fail, switch to `skills/debug/stop-after-two-failures.md`.

## Output
- Failure summary
- Reproduction
- Expected vs actual
- Evidence gathered
- Top hypotheses
- Exact throw site or failing state transition
- Smallest bounded fix
- Verification result
- Remaining risk

## Recommended usage order
- Start with `skills/debug/local-env-sanity.md` if env/runtime may be involved.
- Then use this file.
- Then branch to `skills/debug/signaling-watchdog.md`, `skills/debug/media-watchdog.md`, or `skills/debug/webrtc-freeze-triage.md` based on evidence.
- Finish with `skills/debug/regression-gate.md`.
