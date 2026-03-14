# Current System Status

## 1. Current maturity level

- locally runnable authenticated prototype

## 2. Working components

### Deterministic Development Ports

- component name: Deterministic Development Ports
- current status: working
- what is working:
  - web dev scripts bind to `http://localhost:3000`
  - API dev environment defaults bind to `http://localhost:3001`
  - docker compose exposes TURN on `3478`, PostgreSQL on `5433`, and Redis on `6379`
  - local developer URLs are documented with fixed ports
- last verified by: Codex
- verification type: `pnpm.cmd --dir apps/web typecheck`, `pnpm.cmd --dir apps/api typecheck`
- known limits:
  - a locally occupied fixed port will still block startup until that port is freed

### Login UI

- component name: Login UI
- current status: working
- what is working:
  - `/` is the single login entry surface
  - role-based login for Deaf user and interpreter
  - local seeded authentication
  - identity stored locally
  - redirect after login to `/queue` or `/interpreter`
  - web runtime API fallback now defaults to `http://localhost:3001` for local development
- last verified by: Codex
- verification type: `pnpm.cmd --dir apps/web typecheck`
- known limits:
  - local seeded auth only
  - not production hardened
  - local login should still be manually rechecked in-browser after the wrong-default-port fix

### Local API Host-Run Database Connectivity

- component name: Local API Host-Run Database Connectivity
- current status: working
- what is working:
  - `pnpm --dir apps/api dev` now uses the existing local env loader path
  - host-run API startup resolves PostgreSQL through `LOCAL_DATABASE_URL`
  - local API no longer depends on Docker-internal `postgres:5432` when started from the host
- last verified by: Codex
- verification type: `pnpm.cmd --dir apps/api typecheck`
- known limits:
  - manual API startup verification is still recommended to confirm live connectivity to `localhost:5433`

### Deaf UI

- component name: Deaf UI
- current status: working
- what is working:
  - `/queue` call request flow
  - queue waiting experience
  - queue progress status
  - queue primary action and status copy now reflect live call progress with `Calling...`, connected/opening-call feedback, and decline-then-continue-calling feedback using the existing queue and assignment events
- last verified by: Codex
- verification type: `pnpm.cmd --dir apps/web typecheck`
- known limits:
  - prototype queue UX only
  - no history or advanced retry controls
  - runtime verification is still required for signer queue flows covering active call request, interpreter accept, and interpreter decline copy transitions

### Queue Routing Mode Foundation

- component name: Queue Routing Mode Foundation
- current status: working
- what is working:
  - backend routing mode contract now exists with `sequential` and `simultaneous` mode values
  - API env parsing now accepts `ROUTING_MODE`
  - current assignment offer flow now branches through an explicit routing-mode extension point in `AssignmentService`
  - `sequential` preserves the existing single-interpreter offer behavior
  - unsupported `simultaneous` mode is rejected explicitly at API startup instead of silently changing runtime behavior
- last verified by: Codex
- verification type: `pnpm.cmd --dir apps/api typecheck`, `pnpm.cmd --dir apps/web typecheck`
- known limits:
  - only `sequential` routing is implemented
  - simultaneous multi-interpreter offers are not implemented yet
  - no admin routing-mode control exists yet; configuration is backend env only

### Interpreter UI

- component name: Interpreter UI
- current status: working
- what is working:
  - `/interpreter` workspace
  - authenticated identity display
  - incoming call offer panel
  - accept and decline controls
  - navigation to `/call/[sessionId]`
  - if the interpreter refreshes on `/interpreter` after winning but before live navigation completes, the workspace now restores the current active session through an interpreter-scoped active-session lookup and redirects back into `/call/[sessionId]`
  - interpreter workspace now restores a currently active offered assignment through an identity-scoped active-offer API lookup on load
  - active-offer recovery now returns offers only when the call request is still currently offered, the requester is still present, and the matching offered attempt for that interpreter is still within `QUEUE_OFFER_TIMEOUT_MS`
  - in simultaneous mode, when another interpreter wins the same call, non-winning interpreters now receive `assignment.cancelled` and their stale offer card is removed immediately without refresh
- last verified by: Codex
- verification type: `pnpm.cmd --dir apps/web typecheck`, `pnpm.cmd --dir apps/api typecheck`
- known limits:
  - no advanced workspace tooling
  - no analytics or supervisor features
  - live runtime verification is still required for interpreter refresh during an active offered assignment and for fresh entry with no active offer

### Call UI

- component name: Call UI
- current status: working
- what is working:
  - `/call/[sessionId]` active call layout
  - remote interpreter video
  - local preview
  - connection status diagnostics
  - call controls
  - chat placeholder panel
  - local hangup now stays in a local-ended UI state instead of showing remote-left messaging
  - pane labels and terminal overlays are role-aware for Deaf and Interpreter views
  - local-ended and remote-ended terminal messages now render on the correct pane
  - terminal pane messages auto-dismiss after a short delay while ended and departed call state remains correct
  - page-level terminal helper and guidance text on `/call/[sessionId]` now auto-dismiss after a short delay for local hangup and terminal remote departure while the underlying ended/departed state remains truthful
  - no-stream local and remote pane placeholders no longer repeat terminal text from `overlayMessage`, and terminal-state placeholder copy now dismisses on the same short delay as the pane terminal messaging
  - the persistent Status card description on `/call/[sessionId]` now uses generic call-state wording instead of terminal phrasing that could be mistaken for a stuck hangup/departure message
- last verified by: Codex
- verification type: `pnpm.cmd --dir apps/web typecheck`
- known limits:
  - text chat is placeholder only
  - no device settings UI
  - role-aware pane and page-level terminal auto-dismiss timing should still be manually rechecked in-browser for Deaf and Interpreter hangup flows
  - root cause: after the timed terminal overlay copy disappeared, the no-stream pane fallbacks still rendered persistent generic `Local preview unavailable` and `Remote peer unavailable` text during terminal end state, leaving a visible message on screen indefinitely
  - fix applied: `/call/[sessionId]` now suppresses those no-stream placeholder labels after the existing terminal overlay timeout while keeping the generic fallback text for non-terminal no-stream cases
  - expected behavior: after local hangup or terminal remote departure, pane terminal copy remains briefly, then both the overlay text and the pane placeholder text disappear while internal terminal state remains unchanged
  - verification status: `pnpm.cmd --dir apps/web typecheck` covers the bounded pane-rendering change; live browser verification is still required to confirm the post-timeout panes no longer show persistent fallback text after terminal end

### Media Layer

- component name: Media Layer
- current status: working
- what is working:
  - WebRTC peer connection establishment
  - ICE candidate exchange
  - STUN and TURN configuration
  - local and remote video streams
  - connection status diagnostics
  - production call flow now attempts backend-provided ICE server configuration before peer connection creation
  - production call flow falls back to env-based ICE configuration only if TURN credential fetch fails
- last verified by: Codex
- verification type: `pnpm.cmd --dir apps/web typecheck`
- known limits:
  - locally runnable prototype only
  - not production hardened
  - production call-path runtime validation with backend ICE configuration is still required

### Reconnect and Remote Departure UX

- component name: Reconnect and Remote Departure UX
- current status: working
- what is working:
  - temporary reconnect handling for disconnected state
  - terminal remote departure handling for failed or closed state
  - reconnecting overlay
  - remote-left overlay
- last verified by: Codex
- verification type: implementation status sync from current repo context
- known limits:
  - runtime behavior should continue to be validated as reconnect changes land

### Hangup Termination

- component name: Hangup Termination
- current status: working
- what is working:
  - explicit hangup sends canonical `client.leave-session`
  - backend fans out `session.ended`
  - both participants exit active call state
  - remote media is cleared
  - terminal ended or participant-left UI is shown
  - send and close race removed
- last verified by: Codex
- verification type: apps/web typecheck, apps/api typecheck, implementation review
- known limits:
  - full runtime validation should still be recorded when executed in-browser

### TURN Credential Service API

- component name: TURN Credential Service API
- current status: working
- what is working:
  - API env parsing includes TURN shared-secret settings and credential TTL
  - backend TURN credential generation returns short-lived shared-secret credentials
  - `GET /turn/credentials` returns browser-ready ICE server configuration
  - TURN route is registered in the API app
- last verified by: Codex
- verification type: `pnpm.cmd --dir apps/api typecheck`
- known limits:
  - client integration is not implemented in this task
  - endpoint runtime validation against live Coturn is still recommended

### TURN Verification Harness

- component name: TURN Verification Harness
- current status: working
- what is working:
  - `/turn-test` consumes the backend TURN credential API
  - relay-only mode produces relay candidates
  - local Coturn shared-secret auth works with backend-generated temporary credentials
  - the harness reports ICE gathering diagnostics for local TURN validation
- last verified by: user runtime validation with Codex sync
- verification type: manual runtime validation in `/turn-test` relay-only mode
- known limits:
  - full candidate and error summary should still be recorded when needed
  - local Docker relay address behavior should be reviewed before broader non-local testing

## 3. In-progress components

- Basic in-call text chat in `/call/[sessionId]`
- Client ICE configuration wiring in `/call/[sessionId]` pending runtime call-flow validation

## 4. Deferred backlog

- device settings UI
- call history
- multi-party relay
- SIP addressing
- PSTN integration
- admin and analytics tools
- RTT
- transcripts
- chat persistence or history

## 5. Next priority

- Implement basic in-call text chat inside `/call/[sessionId]`

## 6. Last update

- date: 2026-03-13
- task name: Terminal hangup messages should auto-dismiss after a short delay
- verification completed: `pnpm.cmd --dir apps/web typecheck`
