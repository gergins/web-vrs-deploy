---
name: debug-bug-triage
description: Reproduce the bug, find the failing transition or throw site, and choose the smallest bounded fix.
---

# Purpose
Route a reproduced bug into an evidence-first debugging workflow.

# Trigger conditions
Use when a bug is reported and reproducible or nearly reproducible.

# Required inputs
- Bug summary
- Expected result
- Actual result
- Reproduction steps

# Repo inspection targets
- `project-manifest.json`
- `AGENTS.md`
- `skills/debug/bug-triage.md`
- `apps/web/src/app/call/[sessionId]/page.tsx`
- `apps/web/src/signaling/signaling-client.ts`
- `apps/web/src/webrtc/peer-session.ts`
- `apps/api/src/signaling/*`
- `apps/api/src/routes/call-routes.ts`

# Execution steps
1. Restate the bug in one sentence.
2. Define exact reproduction steps.
3. Identify the narrowest execution path.
4. Gather evidence before editing code.
5. Identify the exact failing transition or throw site if found.
6. Form up to 3 hypotheses.
7. Test one hypothesis at a time.
8. Apply the smallest bounded fix only.
9. Verify with explicit pass/fail evidence.

# Decision rules
- If environment or infra is suspect, switch to `local-env-sanity`.
- If signaling ordering is suspect, switch to `signaling-watchdog`.
- If media is stale or frozen after transport appears connected, switch to `media-watchdog` or `debug-webrtc-freeze`.
- If two fixes fail, switch to `stop-after-two-failures`.

# Stop conditions
- Stop when the exact failure point is identified and a bounded fix is verified.
- Stop and switch method if two fixes fail.

# Required output
- current objective
- exact failing point
- files changed
- verified working
- still broken
- next best bounded task
