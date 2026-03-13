---
name: regression-gate
description: Recheck the intended flow and adjacent risk with explicit pass/fail evidence before claiming success.
---

# Purpose
Prevent unverified success claims and catch adjacent regressions after a debugging change.

# Trigger conditions
Use before declaring any non-trivial debugging or implementation task complete.

# Required inputs
- Original bug acceptance criteria
- Adjacent flow checklist
- Pass/fail evidence from logs, UI, and state transitions

# Repo inspection targets
- `project-manifest.json`
- `skills/debug/regression-gate.md`
- `docs/operations/manual-test-checklist.md`
- `apps/web/src/app/call/[sessionId]/page.tsx`
- `apps/api/src/routes/call-routes.ts`
- `apps/api/src/signaling/*`

# Execution steps
1. Re-test the original bug.
2. Re-test at least 2 adjacent flows.
3. Record explicit pass/fail evidence.
4. Record any remaining regression risk.
5. Require `session-handoff` before ending the task.

# Decision rules
- Do not treat `should work` or `looks good` as verification.
- If any expected state, event sequence, or cleanup result fails, the task is not done.
- Use `session-handoff` after verification, not instead of verification.

# Stop conditions
- Stop only after pass/fail verification is recorded and `session-handoff` is prepared.

# Required output
- current objective
- exact failing point
- files changed
- verified working
- still broken
- next best bounded task
