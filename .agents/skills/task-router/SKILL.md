---
name: task-router
description: Choose the correct skill before making changes.
---

# Purpose
Route the task into the correct execution mode before editing code.

# Trigger conditions
Use at the start of any non-trivial task.

# Required inputs
- User objective
- Observed symptom or requested change
- Whether the area is familiar or unfamiliar
- Whether prior fixes already failed

# Repo inspection targets
- `project-manifest.json`
- `AGENTS.md`
- `.agents/skills/*`
- `skills/debug/*`

# Execution steps
1. Classify the task before editing code.
2. Choose the first skill.
3. Inspect the first repo files indicated by that skill.
4. Re-route if new evidence changes the layer or failure class.
5. Before ending the task, require `regression-gate`.
6. Before ending any non-trivial task, require `session-handoff`.

# Decision rules
- If environment/runtime is suspect -> use `local-env-sanity`
- If bug reproduced -> use `debug-bug-triage`
- If auth/join/offer/answer/ICE ordering is suspect -> use `signaling-watchdog`
- If remote media is frozen/black/stale -> use `media-watchdog` or `debug-webrtc-freeze`
- If disconnect/peer-left/reconnecting confusion -> use `disconnect-decision-tree`
- If two fixes already failed -> use `stop-after-two-failures`
- Before declaring done -> use `regression-gate`
- Before implementing in an unfamiliar area -> use `repo-truth-check`
- Before ending any non-trivial task -> use `session-handoff`

# Stop conditions
- Stop when the correct first skill and first inspection targets are chosen.
- Stop again at the end only after `regression-gate` and `session-handoff` are both satisfied.

# Required output
- chosen skill
- reason
- first repo files to inspect
