# Web VRS Development Roadmap

## Development Philosophy

The platform must be built bottom-up.

Priority order:

1. Platform foundation
2. Media reliability
3. Session orchestration
4. Call routing
5. Interpreter workflow
6. Deaf user accessibility
7. Telecommunication integration
8. Operational intelligence

Feature development must never bypass lower layers.

---

## Priority Phases

### PRIORITY 0 - Platform Foundation

Depends on:
- none

Responsibilities:
- repository structure
- configuration management
- authentication
- logging
- metrics
- database schema
- container deployment
- CI/CD pipelines

Why it comes first:
- every later subsystem depends on deterministic identity, persistence, configuration, and deploy/runtime behavior

---

### PRIORITY 1 - Media Layer

Depends on:
- platform foundation

Spec:
- `docs/specifications/media-layer.md`

Why it comes next:
- browser media, signaling reliability, STUN, TURN, and health monitoring must work before higher-level workflow expansion

---

### PRIORITY 2 - Session Orchestration

Depends on:
- platform foundation
- media layer

Spec:
- `docs/specifications/session-orchestration.md`

Why it comes next:
- lifecycle, membership, and reconnect rules must be deterministic before queue and workspace features scale

---

### PRIORITY 3 - Call Queue and Interpreter Routing

Depends on:
- platform foundation
- session orchestration

Spec:
- `docs/specifications/queue-routing.md`

Why it comes next:
- routing requires authoritative identities, persisted requests, and session creation rules

---

### PRIORITY 4 - Interpreter Workspace

Depends on:
- platform foundation
- session orchestration
- call queue and interpreter routing

Spec:
- `docs/specifications/interpreter-workspace.md`

Why it comes next:
- interpreter workflow depends on reliable offer delivery, session creation, and call entry

---

### PRIORITY 5 - Deaf User Interface

Depends on:
- platform foundation
- media layer
- session orchestration
- call queue and interpreter routing

Spec:
- `docs/specifications/deaf-ui.md`

Why it comes next:
- end-user experience should build on working queue, session, and call entry foundations

---

### PRIORITY 6 - Three-Party Relay Calls

Depends on:
- media layer
- session orchestration
- interpreter workspace

Spec:
- `docs/specifications/relay-calls.md`

Why it comes next:
- relay calls extend the stable two-party model and should not bypass it

---

### PRIORITY 7 - Telecommunication Integration

Depends on:
- relay calls
- session orchestration
- media layer

Spec:
- `docs/specifications/telephony-integration.md`

Why it comes next:
- SIP/PSTN integration adds external transport complexity and should build on a stable browser/session core

---

### PRIORITY 8 - Administrative Platform

Depends on:
- call queue and interpreter routing
- session orchestration
- interpreter workspace

Spec:
- `docs/specifications/admin-platform.md`

Why it comes next:
- administrative control is only useful once operational data and workflows exist

---

### PRIORITY 9 - Accessibility Enhancements

Depends on:
- Deaf user interface
- media layer

Spec:
- `docs/specifications/accessibility-features.md`

Why it comes next:
- advanced accessibility features should extend a stable core user experience

---

### PRIORITY 10 - Analytics and Reporting

Depends on:
- platform foundation
- session orchestration
- call queue and interpreter routing
- administrative platform

Spec:
- `docs/specifications/analytics-platform.md`

Why it comes last:
- analytics are only trustworthy after lower layers emit stable, auditable data

---

## Phase Dependency Rule

Higher-priority phases may depend on lower-priority phases.

Lower-priority phases must not be skipped by implementing user-facing features directly on incomplete foundations.

## Specification Index

- `docs/specifications/media-layer.md`
- `docs/specifications/session-orchestration.md`
- `docs/specifications/queue-routing.md`
- `docs/specifications/interpreter-workspace.md`
- `docs/specifications/deaf-ui.md`
- `docs/specifications/relay-calls.md`
- `docs/specifications/telephony-integration.md`
- `docs/specifications/admin-platform.md`
- `docs/specifications/accessibility-features.md`
- `docs/specifications/analytics-platform.md`
