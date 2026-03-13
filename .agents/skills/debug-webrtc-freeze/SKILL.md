---
name: debug-webrtc-freeze
description: Isolate frozen, black, or stale remote media in the browser WebRTC path.
---

# Purpose
Debug a connected or partially connected call where remote media is frozen, black, missing, or stale.

# Trigger conditions
Use when signaling may already be working but remote media does not behave correctly.

# Required inputs
- Reproduction steps
- Peer state
- ICE state
- Remote stream state
- Visible remote video symptom

# Repo inspection targets
- `project-manifest.json`
- `skills/debug/webrtc-freeze-triage.md`
- `apps/web/src/app/call/[sessionId]/page.tsx`
- `apps/web/src/webrtc/peer-session.ts`
- `apps/web/src/components/call/remote-video.tsx`

# Execution steps
1. Confirm whether signaling completed.
2. Inspect peer and ICE state timeline.
3. Inspect `ontrack`, remote stream id, and remote track count.
4. Inspect remote video element state.
5. Inspect inbound media stats.
6. Isolate transport, rendering, stale UI, or cleanup failure.
7. Apply the smallest bounded fix only.
8. Verify the freeze symptom is resolved.

# Decision rules
- If auth/join/offer/answer ordering is suspect, switch to `signaling-watchdog`.
- If media counters are flat while UI still looks connected, switch to `media-watchdog`.
- If peer-left vs reconnecting is unclear, switch to `disconnect-decision-tree`.

# Stop conditions
- Stop when the freeze symptom is isolated to a failing layer and the bounded fix is verified.
- Stop and escalate to instrumentation if the same method fails twice.

# Required output
- current objective
- exact failing point
- files changed
- verified working
- still broken
- next best bounded task
