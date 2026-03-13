---
name: media-watchdog
description: Use getStats evidence to detect stale remote media when UI or transport signals lag.
---

# Purpose
Detect stale remote media using repeated `getStats()` evidence and bounded cleanup rules.

# Trigger conditions
Use when remote media is frozen, black, or stale while transport or session state may still look connected.

# Required inputs
- Reproduction steps
- Remote stream state
- Peer state
- ICE state
- Repeated `getStats()` samples

# Repo inspection targets
- `project-manifest.json`
- `skills/debug/media-watchdog.md`
- `apps/web/src/app/call/[sessionId]/page.tsx`
- `apps/web/src/webrtc/peer-session.ts`
- `apps/web/src/components/call/remote-video.tsx`

# Execution steps
1. Sample inbound media stats over multiple intervals.
2. Compare `bytesReceived`, `packetsReceived`, and `framesDecoded` where available.
3. Check whether the UI still claims connected state.
4. Check whether remote stream or video element state is stale.
5. Apply terminal cleanup only after bounded grace.
6. Verify stale media is cleared without over-clearing short jitter.

# Decision rules
- Current active code may rely on inbound stats only.
- Outbound stats are optional or future enrichment, not a required active-code assumption.
- If signaling order is suspect, switch to `signaling-watchdog`.
- If disconnect classification is unclear, switch to `disconnect-decision-tree`.

# Stop conditions
- Stop when stale-media detection is proven and bounded cleanup is verified.
- Stop if evidence shows the issue is not media staleness and switch to the relevant skill.

# Required output
- current objective
- exact failing point
- files changed
- verified working
- still broken
- next best bounded task
