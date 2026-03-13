---
name: truth-promotion
description: Promote repeated bug-learning into authoritative repo truth when drift is likely to recur.
---

# Purpose
Promote repeated bug-learning into authoritative repo truth.

# Trigger conditions
Use when:
- the same area has needed multiple fixes
- behavior is ambiguous
- future Codex sessions may drift without a doc

# Required inputs
- bug summary
- repeated failure area
- files involved
- intended behavior now understood

# Repo inspection targets
- `project-manifest.json`
- `AGENTS.md`
- `docs/flows/*`
- `docs/contracts/*`
- affected source files

# Execution steps
1. Identify the repeated failure class.
2. Decide whether an existing doc should be updated or a new one created.
3. Write the smallest authoritative doc needed.
4. Align wording with current implementation.
5. Update `project-manifest.json` if the doc becomes authoritative.

# Decision rules
- Promote truth only when all three hold:
  - behavior was ambiguous
  - repeated fixes occurred in the same area
  - future drift is likely without a repo-level definition
- Prefer updating an existing doc over creating a duplicate doc.
- Keep authoritative docs descriptive of intended current behavior.

# Stop conditions
- Stop when the truth gap is either documented in the smallest authoritative place or explicitly rejected as not worthy of promotion.

# Required output
- repeated bug class
- truth gap found
- doc created or updated
- authoritative behavior defined
- files changed
