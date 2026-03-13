# Disconnect Decision Tree

## Purpose
Decide whether a disconnect symptom is a transient transport issue, a terminal remote departure, or stale UI/media state.

## When to use
- Remote tab closes
- Frozen then black remote video
- Call stays connected after peer left
- Reconnecting vs ended confusion
- Stale connected UI after peer departure

Primary ownership:
- Frontend/browser call state
- Backend session lifecycle only if terminal peer removal is unclear

## Inputs / evidence
- `connectionState`
- `iceConnectionState`
- Signaling connection state
- Connected peer list
- Remote stream attachment state
- `session.ended` or similar terminal signal
- Media watchdog evidence

Repo-relevant paths:
- `apps/web/src/app/call/[sessionId]/page.tsx`
- `apps/web/src/components/call/remote-video.tsx`
- `apps/api/src/signaling/*`

## Required workflow
1. Classify the symptom into one case.
2. Confirm the classification with evidence, not intuition.
3. Apply only the smallest fix for that case.

Case A — temporary transport issue
- signaling still alive, or recovery is actively progressing
- peer/ICE state may go `disconnected` then recover
- inbound media stats resume within grace

Action:
- stay in `reconnecting`
- do not clear remote stream yet

Case B — terminal remote departure
- peer closes tab/browser and does not recover
- participant is removed from session, or explicit `session.ended` arrives
- or media watchdog shows no progress past grace

Action:
- clear remote stream
- clear remote track state
- clear connected peers
- close/drop peer session
- move UI to peer-left or ended

Case C — stale UI only
- media is dead or peer is gone
- but UI still says connected
- stale stream is still attached

Action:
- clear stale `srcObject`
- reset remote state
- verify backend session cleanup path
- verify media watchdog fallback

## Hard rules
- Do not treat a brief `disconnected` as terminal without grace.
- Do not stay connected forever just because the last peer state was `connected`.
- If the backend never tells the remaining peer that the call ended, inspect `apps/api/src/signaling/*`.

## Output
- Chosen case
- Evidence
- Smallest fix path
- Verification result

## Recommended usage order
- Start with `skills/debug/bug-triage.md`.
- Use this file once disconnect symptoms are reproduced.
- Pair with `skills/debug/media-watchdog.md` when the remote video freezes or turns black.
- Finish with `skills/debug/regression-gate.md`.
