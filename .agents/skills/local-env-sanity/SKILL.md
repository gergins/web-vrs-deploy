---
name: local-env-sanity
description: Rule out local runtime and infrastructure mismatches before app-layer debugging.
---

# Purpose
Prevent app-layer debugging when the real blocker is local environment, process ownership, or infra reachability.

# Trigger conditions
Use when DB, Redis, Docker, ports, or hostnames may be wrong.

# Required inputs
- Health endpoint result
- Active processes and ports
- DB and Redis connection targets
- Local infra status

# Repo inspection targets
- `project-manifest.json`
- `skills/debug/local-env-sanity.md`
- `apps/api/scripts/local-env.mjs`
- `apps/api/src/routes/call-routes.ts`
- `docs/operations/env-vars.md`

# Execution steps
1. Check web and API reachability.
2. Check DB and Redis reachability.
3. Check hostname and port assumptions.
4. Check the real process bound to expected ports.
5. Only then continue to app-layer debugging.

# Decision rules
- If `/calls` fails before queue creation, verify DB reachability before debugging queue or assignment code.
- If WebSocket auth/join fails and Redis is suspect, confirm runtime connectivity before changing signaling code.
- If env sanity passes, switch to `debug-bug-triage`.

# Stop conditions
- Stop when a concrete env mismatch is found and reported, or runtime sanity is proven clean.

# Required output
- current objective
- exact failing point
- files changed
- verified working
- still broken
- next best bounded task
