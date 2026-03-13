---
name: stop-after-two-failures
description: Stop repeated low-signal fixes and switch to instrumentation after two failed attempts.
---

# Purpose
Prevent repeated speculative fixes when the same debugging method has already failed twice.

# Trigger conditions
Use when two consecutive fixes did not solve the same bug.

# Required inputs
- Previous two failed attempts
- Repeated method
- Missing evidence

# Repo inspection targets
- `project-manifest.json`
- `skills/debug/stop-after-two-failures.md`
- Any files touched by the failed attempts

# Execution steps
1. Name the two failed attempts.
2. Identify the repeated low-signal method.
3. Stop adding more guess patches.
4. Switch to instrumentation or stronger evidence collection.
5. Choose the next bounded task from that evidence.

# Decision rules
- Prefer instrumentation, event timelines, `getStats()`, or backend lifecycle tracing.
- If the failure spans layers, return to `debug-bug-triage`.
- Do not refactor as a substitute for evidence.

# Stop conditions
- Stop when a new evidence-driven method is chosen and the next bounded task is defined.

# Required output
- current objective
- exact failing point
- files changed
- verified working
- still broken
- next best bounded task
