# Local VRS Demo

This document describes the simplest local setup for testing the current browser-to-browser VRS prototype on one machine.

## 1. Install dependencies

```bash
pnpm install
```

## 2. Pick a PostgreSQL host port if needed

Docker keeps PostgreSQL inside the compose network on `postgres:5432`.

The host-side port is configurable through `POSTGRES_HOST_PORT`:

- default: `5433`
- example override: `5434`

PowerShell example:

```powershell
$env:POSTGRES_HOST_PORT="5434"
```

If you override the host port, keep `LOCAL_DATABASE_URL` aligned with it. Example:

```text
LOCAL_DATABASE_URL=postgresql://postgres:postgres@localhost:5434/vrs
```

PowerShell example for the local DB override:

```powershell
$env:LOCAL_DATABASE_URL="postgresql://postgres:postgres@localhost:5434/vrs"
```

## 2b. Pick a Redis host port if needed

Docker keeps Redis inside the compose network on `redis:6379`.

The host-side port is configurable through `REDIS_HOST_PORT`:

- default: `6379`
- example override: `6380`

PowerShell example:

```powershell
$env:REDIS_HOST_PORT="6380"
```

## 3. Start local infrastructure

Start PostgreSQL, Redis, and Coturn:

```bash
pnpm demo:infra
```

Equivalent direct command:

```bash
docker compose up -d postgres redis coturn
```

Docker Desktop must be running before this step.

PowerShell example with both overrides:

```powershell
$env:POSTGRES_HOST_PORT="5434"
$env:REDIS_HOST_PORT="6380"
pnpm.cmd demo:infra
```

## 4. Prepare the database

Push the Prisma schema and seed the placeholder local users:

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

The seed creates:

- signer user id: `user-signer-1`
- interpreter user id: `user-interpreter-1`
- interpreter user id: `user-interpreter-2`

Prisma schema location in this repo:

- `apps/api/src/db/prisma/schema.prisma`

## 5. Start the backend

Normal dev path:

```bash
pnpm demo:api
```

Direct fallback:

```bash
pnpm demo:api:direct
```

Built fallback with no `tsx`, no `esbuild`, and no watch mode:

```bash
pnpm build:api
pnpm demo:api:built
```

The API listens on:

- `http://localhost:3001`
- websocket signaling: `ws://localhost:3001/ws`

## 6. Start the web app

Normal dev path:

```bash
pnpm demo:web
```

Direct fallback:

```bash
pnpm demo:web:direct
```

Built fallback:

```bash
pnpm build:web
pnpm demo:web:built
```

The web app listens on:

- `http://localhost:3000`

## 7. Open two browser windows

Open:

- Browser A: `http://localhost:3000/queue`
- Browser B: `http://localhost:3000/interpreter`

Optional for reassignment or simultaneous-offer testing:

- Browser C: `http://localhost:3000/interpreter`

## Local test mode

Browser A

- role: signer
- page: `/queue`
- default actor id: `user-signer-1`

Browser B

- role: interpreter
- page: `/interpreter`
- default actor id: `user-interpreter-1`

Optional Browser C

- role: interpreter
- page: `/interpreter`
- alternate actor id: `user-interpreter-2`

Expected flow:

1. signer requests a call
2. interpreter receives an assignment offer
3. interpreter accepts
4. session is created
5. both browsers move to `/call/[sessionId]`
6. local and remote video should attach

## Camera note

Some browsers and operating systems do not allow the same physical camera to be opened in two tabs or two windows at the same time.

If camera access conflicts:

- use two different browsers, for example Chrome and Firefox
- use an external webcam for one browser
- use a virtual camera

## Network note

Local testing is easier because both peers are on the same machine or the same local network path.

Real network conditions may require STUN/TURN fallback for connectivity, especially when direct peer-to-peer paths are blocked.

## Windows startup options

Path A: normal local dev

1. `pnpm install`
2. if needed, set a free PostgreSQL host port, for example `$env:POSTGRES_HOST_PORT="5434"`
3. if needed, set a free Redis host port, for example `$env:REDIS_HOST_PORT="6380"`
4. make sure `LOCAL_DATABASE_URL` matches the chosen PostgreSQL host port
   - example: `$env:LOCAL_DATABASE_URL="postgresql://postgres:postgres@localhost:5434/vrs"`
5. `pnpm demo:infra`
6. `pnpm db:generate`
7. `pnpm db:push`
8. `pnpm db:seed`
9. terminal A: `pnpm demo:api:direct`
10. terminal B: `pnpm demo:web:direct`

Path B: built API fallback for `spawn EPERM`

1. `pnpm install`
2. if needed, set a free PostgreSQL host port, for example `$env:POSTGRES_HOST_PORT="5434"`
3. if needed, set a free Redis host port, for example `$env:REDIS_HOST_PORT="6380"`
4. make sure `LOCAL_DATABASE_URL` matches the chosen PostgreSQL host port
   - example: `$env:LOCAL_DATABASE_URL="postgresql://postgres:postgres@localhost:5434/vrs"`
5. `pnpm demo:infra`
6. `pnpm db:generate`
7. `pnpm db:push`
8. `pnpm build:api`
9. `pnpm db:seed`
10. terminal A: `pnpm demo:api:built`
11. `pnpm build:web`
12. terminal B: `pnpm demo:web:built`

Notes:

- `demo:api:built` still requires a successfully generated Prisma client from `pnpm db:generate`
- `demo:web:built` still depends on `pnpm build:web` succeeding on the machine
- if `next build` fails with machine-level `spawn EPERM`, that is outside normal repo wiring

If PowerShell blocks `pnpm`, use the same commands with `pnpm.cmd`.

## Prisma troubleshooting

If Prisma fails with engine or binary errors:

- API built start requires a generated Prisma client
- rerun `pnpm install`
- run commands from the API package context if you need to isolate the problem
- explicit Prisma checks:
  - `pnpm --dir apps/api prisma:generate`
  - `pnpm --dir apps/api prisma:push:local`
  - `pnpm --dir apps/api prisma:seed`
  - `pnpm --dir apps/api exec prisma -v`
- retry generation from the API package directory:
  - `cd apps/api`
  - `pnpm exec prisma generate`
- package-local diagnosis should be run from `apps/api`
- `pnpm.cmd exec prisma -v` from repo root is not the intended package-local diagnosis path
- exact root-level Prisma commands:
  - `pnpm.cmd db:generate`
  - `pnpm.cmd db:push`
  - `pnpm.cmd db:seed`
- expected success:
  - `pnpm.cmd db:generate` exits without engine download errors
  - `pnpm.cmd db:push` applies the schema to the database
  - `pnpm.cmd db:seed` completes and prints `Prisma seed scaffold completed`
- if `pnpm.cmd db:generate` fails, Prisma could not download or start its required engine binaries
- common causes are machine, firewall, antivirus, SSL inspection, or network policy blocking Prisma engine downloads
- if `demo:api:built` fails with `Cannot find module '.prisma/client/default'`, the Prisma client was not generated successfully
- if Prisma still cannot download or run engines, the machine, network, or security policy is blocking Prisma binaries

## Prisma diagnosis sequence

Use this order when diagnosing Prisma on Windows:

1. `pnpm.cmd db:generate`
2. `pnpm.cmd db:push`
3. `pnpm.cmd db:seed`
4. if `db:generate` fails, retry from the API package:
   - `cd apps/api`
   - `pnpm.cmd prisma:generate`
   - `pnpm.cmd exec prisma -v`
5. if Prisma binaries still fail, reinstall dependencies:
   - from repo root: `pnpm.cmd install`
6. if node_modules are corrupt, remove them and reinstall:
   - `Remove-Item -Recurse -Force .\node_modules`
   - `pnpm.cmd install`

Env assumptions for these commands:

- root helpers load the API package context automatically
- local Prisma commands prefer `LOCAL_DATABASE_URL` over the compose-network `DATABASE_URL`
- normal local API start paths prefer the root `.env`
- if `.env` is missing, the API start scripts fall back to the root `.env.example`
- Prisma commands use the explicit schema path `./src/db/prisma/schema.prisma` from `apps/api`

## Free-port troubleshooting

To find what is using a port on Windows:

```powershell
netstat -ano | findstr :5433
netstat -ano | findstr :6379
tasklist /FI "PID eq 12345"
```

## Troubleshooting matrix

| Symptom | Likely cause | Fix / fallback |
| --- | --- | --- |
| `docker compose up` fails to bind PostgreSQL | host port already in use | set `POSTGRES_HOST_PORT` to a free port such as `5434`, update `LOCAL_DATABASE_URL`, then rerun `pnpm demo:infra` |
| `docker compose up` fails to bind Redis | host port already in use | set `REDIS_HOST_PORT` to a free port such as `6380`, then rerun `pnpm demo:infra` |
| `pnpm db:generate` / `pnpm db:push` / `pnpm db:seed` fails with Prisma engine errors | Prisma engine download/build blocked by machine, network, or security policy | rerun `pnpm install`; use the API-local Prisma commands; if still blocked, fix machine/network policy |
| `pnpm demo:api:built` fails with `Cannot find module '.prisma/client/default'` | Prisma client was not generated | run `pnpm db:generate`; if that fails, fix the Prisma engine issue first |
| `pnpm demo:api` fails with `spawn EPERM` | Windows watch mode spawning is blocked | use `pnpm demo:api:direct` |
| `pnpm demo:api:direct` still fails with `spawn EPERM` | `tsx` / `esbuild` spawning is blocked | use `pnpm build:api` then `pnpm demo:api:built` |
| `pnpm demo:web` fails with `spawn EPERM` | Next.js dev child-process spawning is blocked | use `pnpm demo:web:direct` |
| `pnpm build:web` or `pnpm demo:web:direct` still fails with `spawn EPERM` | Next.js runtime spawning is still blocked on the machine | try `pnpm demo:web:built` only after a successful `pnpm build:web`; if that still fails, try Node 22 LTS |
| PowerShell blocks `pnpm` | execution policy | use `pnpm.cmd ...` commands |

## Useful demo URLs

- signer queue: `http://localhost:3000/queue`
- interpreter console: `http://localhost:3000/interpreter`
- role selector: `http://localhost:3000/`
- API base: `http://localhost:3001`
- websocket signaling: `ws://localhost:3001/ws`

## Shutdown

Stop infrastructure:

```bash
docker compose down
```

Stop the API and web servers with `Ctrl+C` in their terminals.
