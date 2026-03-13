---
name: repo-truth-check
description: Confirm the repo’s declared contracts and boundaries before changing behavior in an unfamiliar area.
---

# Purpose
Anchor decisions to the repo’s authority sources before editing unfamiliar behavior.

# Trigger conditions
Use before implementing or debugging in an unfamiliar area, or when docs and code may disagree.

# Required inputs
- Target behavior under discussion
- Candidate files to edit

# Repo inspection targets
- `project-manifest.json`
- `AGENTS.md`
- `docs/contracts/*`
- `docs/flows/*`
- `docs/architecture/*`

# Execution steps
1. Read authority sources in order.
2. Identify the declared contract or behavior.
3. Compare implementation to that declared truth.
4. Identify any drift or ambiguity.
5. Only then choose the bounded implementation or debugging path.

# Decision rules
- Higher authority sources win.
- Do not invent behavior that conflicts with declared contracts or boundaries.
- If the task is still a bug, switch to `debug-bug-triage` after the truth check.

# Stop conditions
- Stop when the relevant repo truth is identified and the next bounded task is clear.

# Required output
- current objective
- exact failing point
- files changed
- verified working
- still broken
- next best bounded task
