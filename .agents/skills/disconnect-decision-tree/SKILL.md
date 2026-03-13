---
name: disconnect-decision-tree
description: Classify disconnect symptoms into reconnecting, terminal peer-left, or stale UI/media.
---

# Purpose
Classify disconnect symptoms before changing cleanup or session-end behavior.

# Trigger conditions
Use when peer-left, reconnecting, stale connected UI, or frozen/black remote video after departure is involved.

# Required inputs
- Peer state
- ICE state
- Signaling state
- Connected peer list
- Remote stream state
- Terminal session event evidence

# Repo inspection targets
- `project-manifest.json`
- `skills/debug/disconnect-decision-tree.md`
- `apps/web/src/app/call/[sessionId]/page.tsx`
- `apps/web/src/components/call/remote-video.tsx`
- `apps/api/src/signaling/*`

# Execution steps
1. Determine whether the case is transient reconnect, terminal departure, or stale UI.
2. Confirm the classification with evidence.
3. Check whether backend terminal signaling exists.
4. Check whether frontend cleanup is idempotent and terminal.
5. Apply only the smallest fix for the classified case.

# Decision rules
- Brief `disconnected` does not imply terminal departure.
- A post-grace explicit terminal event should override stale connected UI.
- If media remains attached after terminal departure, switch to `media-watchdog` only if session and cleanup paths already look correct.

# Stop conditions
- Stop when the disconnect symptom is correctly classified and the bounded fix is verified.

# Required output
- current objective
- exact failing point
- files changed
- verified working
- still broken
- next best bounded task
