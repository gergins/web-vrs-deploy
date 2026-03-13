# Local Environment Sanity

## Purpose
Rule out local runtime and infrastructure issues before changing application code.

## When to use
- API health mismatch
- `/calls` `500` before queue creation
- Local Docker hostname or env mismatch
- Postgres or Redis not reachable
- Port conflicts or wrong process bound to expected port

Primary ownership:
- Local environment and runtime setup

## Inputs / evidence
- `/health` response
- Active process and port mapping
- `DATABASE_URL`
- `REDIS_URL`
- Docker or local infra status
- Prisma connectivity

Repo-relevant paths:
- `apps/api/src/routes/call-routes.ts`
- `apps/api/scripts/local-env.mjs`
- `docs/operations/manual-test-checklist.md`

## Required workflow
1. Verify the API is reachable.
2. Verify the web app is reachable.
3. Verify Postgres and Redis are actually running.
4. Verify `DATABASE_URL` points to localhost host port, not a Docker-only hostname, for host-based local runs.
5. Verify `REDIS_URL` points to localhost host port, not a Docker-only hostname, for host-based local runs.
6. Verify the expected process is the one listening on the expected port.
7. Only after env sanity passes, continue into app-layer debugging.

## Hard rules
- Do not assume localhost and Docker service hostnames are interchangeable.
- Do not blame product code before runtime sanity is checked when infra symptoms exist.
- If `/calls` fails before queue creation, confirm DB reachability before debugging assignment logic.

## Output
- Infra status summary
- Exact mismatch found, if any
- Corrected local runtime assumptions
- Whether app-layer debugging should continue

## Recommended usage order
- Start here when DB, Redis, Docker, or port issues are plausible.
- Then continue with `skills/debug/bug-triage.md`.
- Finish with `skills/debug/regression-gate.md` after any fix.
