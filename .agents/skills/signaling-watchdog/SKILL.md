---
name: signaling-watchdog
description: Trace signaling ordering and isolate missing auth, join, offer, answer, ICE, or terminal session events.
---

# Purpose
Make signaling order visible and isolate signaling-state bugs without speculative patches.

# Trigger conditions
Use when auth, join, offer, answer, ICE, or terminal signaling may be missing, late, or out of order.

# Required inputs
- Outbound signaling payloads
- Inbound signaling events
- Browser signaling logs
- Backend signaling logs

# Repo inspection targets
- `project-manifest.json`
- `skills/debug/signaling-watchdog.md`
- `apps/web/src/signaling/signaling-client.ts`
- `apps/web/src/app/call/[sessionId]/page.tsx`
- `apps/api/src/signaling/*`

# Execution steps
1. Add temporary logs at the exact signaling boundary under suspicion.
2. Record outbound and inbound event order.
3. Verify auth and join acknowledgement path when relevant.
4. Verify offer, answer, and ICE ordering when relevant.
5. Verify terminal session events when relevant.
6. Identify the exact missing event or invalid state transition.
7. Apply the smallest safe fix only.
8. Reduce logging once the root cause is proven.

# Decision rules
- If infra or host/port mismatch is plausible, switch to `local-env-sanity`.
- If signaling is correct but media is stale, switch to `media-watchdog` or `debug-webrtc-freeze`.
- If two fixes fail, switch to `stop-after-two-failures`.

# Stop conditions
- Stop when the missing or invalid signaling transition is proven and the bounded fix is verified.
- Stop before leaving broad debug logging in place permanently.

# Required output
- current objective
- exact failing point
- files changed
- verified working
- still broken
- next best bounded task
