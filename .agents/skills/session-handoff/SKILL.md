---
name: session-handoff
description: Mandatory continuity summary for any non-trivial task before ending the session.
---

# Purpose
Prevent drift between sessions by forcing a precise handoff before ending non-trivial work.

# Trigger conditions
Use before ending any non-trivial debugging or implementation task.

# Required inputs
- Current objective
- Exact failing point or exact verified fix point
- Files changed
- Verification results
- Remaining gaps

# Repo inspection targets
- `project-manifest.json`
- `AGENTS.md`
- Files changed in the current task
- `skills/debug/regression-gate.md`

# Execution steps
1. Restate the current objective.
2. State the exact failing point found, or the exact fix point verified.
3. List files changed.
4. State what is verified working.
5. State what is still broken or unverified.
6. State the next best bounded task.

# Decision rules
- This handoff is mandatory for non-trivial work.
- Do not end with vague status like `mostly fixed`.
- If verification has not happened, say so explicitly and name the missing check.

# Stop conditions
- Stop only after the handoff contains all required fields.

# Required output
- current objective
- exact failing point
- files changed
- verified working
- still broken
- next best bounded task
