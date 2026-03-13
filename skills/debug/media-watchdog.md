# Media Watchdog

## Purpose
Use `RTCPeerConnection.getStats()` evidence to determine whether remote media is still flowing, stalled, or only visually stale.

## When to use
- Transport looks connected but remote media is frozen
- Remote video becomes black after peer departure
- Stale connected UI keeps remote media attached
- Session or transport signals lag behind actual media loss

Primary ownership:
- Frontend/browser media and rendering behavior

## Inputs / evidence
- Repeated `getStats()` samples
- Remote stream attachment state
- Remote track state: live, muted, ended
- Remote video element state if relevant
- Current call phase and peer/ICE state

Repo-relevant paths:
- `apps/web/src/app/call/[sessionId]/page.tsx`
- `apps/web/src/webrtc/peer-session.ts`
- `apps/web/src/components/call/remote-video.tsx`

## Required workflow
1. Sample `getStats()` every 2 seconds for at least 3 intervals.
2. Track inbound video when available:
   - `bytesReceived`
   - `packetsReceived`
   - `framesDecoded`
   - `framesPerSecond` if available
3. Track inbound audio when available:
   - `bytesReceived`
   - `packetsReceived`
4. Compare samples for actual progress.
5. If counters stop advancing for a bounded grace period while UI still looks connected, treat the call as a stale-media candidate.
6. Only then clear stale remote media and move UI out of misleading connected state.

## Hard rules
- Current active code in this repo may use inbound stats only.
- Outbound stats are optional or future enrichment; do not assume they are present in active code.
- Do not assume both inbound and outbound stats exist in every browser path.
- Do not clear media on brief jitter; require multiple flat samples over grace.
- If signaling order looks wrong, use `skills/debug/signaling-watchdog.md` first.

## Output
- Last 3 to 5 samples
- Interpretation
- Likely failing layer: transport, media pipeline, rendering, or stale UI state
- Exact stale-media rule used
- Verification result

## Recommended usage order
- Start with `skills/debug/bug-triage.md`.
- Use this file after transport and signaling look mostly correct.
- Pair with `skills/debug/disconnect-decision-tree.md` for peer-left vs reconnecting decisions.
- Finish with `skills/debug/regression-gate.md`.
