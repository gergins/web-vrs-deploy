# WebRTC Freeze Triage

## Purpose
Debug a call that appears connected but remote media is frozen, black, missing, or visually stale.

## When to use
- Frozen remote video
- Black remote video
- Connected call but no moving media
- Renegotiation breaks media
- One side sees local video only
- Peer leaves and the remaining side still shows stale remote media

Primary ownership:
- Frontend/browser WebRTC behavior
- Use backend signaling evidence only when transport or session lifecycle suggests it

## Inputs / evidence
- `signalingState`
- `connectionState`
- `iceConnectionState`
- Remote stream id
- Remote track count
- Remote video element state
- Inbound video stats
- Outbound video stats if available
- Relevant browser console logs

Repo-relevant paths:
- `apps/web/src/app/call/[sessionId]/page.tsx`
- `apps/web/src/webrtc/peer-session.ts`
- `apps/web/src/components/call/remote-video.tsx`
- `apps/web/src/signaling/signaling-client.ts`

## Required workflow
1. Check signaling correctness:
   - was offer created?
   - was answer created?
   - was remote description applied?
   - was duplicate negotiation triggered?
2. Check ICE and transport:
   - `iceConnectionState` timeline
   - `connectionState` timeline
   - relay candidate observed or not
3. Check track lifecycle:
   - did `ontrack` fire?
   - how many remote tracks exist?
   - are tracks muted or ended?
   - was a stale stream left attached?
4. Check RTP flow:
   - inbound video bytes increasing?
   - packets received increasing?
   - frames decoded increasing?
5. Check rendering:
   - `srcObject` attached?
   - autoplay and `playsInline` correct?
   - stale stream visually left behind?
6. Check reconnect or duplicate session behavior:
   - duplicate peer sessions?
   - stale peer session not cleaned up?
   - recovery path reusing dead state?

## Hard rules
- Do not change TURN/STUN and UI and signaling together.
- Do not assume backend is at fault without transport or media evidence.
- Do not keep patching rendering if inbound media stats are flat.
- If the symptom is auth/join ack stall, use `skills/debug/signaling-watchdog.md` first.

## Output
- Freeze symptom summary
- Evidence by layer: signaling, ICE, tracks, RTP, rendering
- Likely failing layer
- Exact failing state transition if found
- Smallest bounded fix
- Verification result

## Recommended usage order
- Start with `skills/debug/bug-triage.md`.
- Use `skills/debug/signaling-watchdog.md` if negotiation ordering is suspect.
- Use `skills/debug/media-watchdog.md` if transport looks connected but media appears stale.
- Finish with `skills/debug/regression-gate.md`.
