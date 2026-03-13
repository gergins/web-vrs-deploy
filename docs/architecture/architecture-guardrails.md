# Architecture Guardrails for Web VRS Platform

## Purpose

This document defines architectural guardrails for the Web Video Relay Service platform.

Guardrails prevent architectural drift and ensure that implementation changes maintain the intended system structure.

These guardrails apply to:

- human developers
- automated development agents
- code generation systems

All implementation must comply with these rules.

------------------------------------------------

# Guardrail 1 — Layer Separation

The platform architecture must maintain strict layer separation.

Allowed architecture layers:

Client Layer  
Application Layer  
Media Layer  
Data Layer  
Infrastructure Layer

Each module must belong to exactly one layer.

Modules must not mix responsibilities across layers.

Examples:

Allowed:

Client UI → Application API

Application Service → Data Repository

Not allowed:

Client UI directly accessing database.

Media subsystem implementing business logic.

------------------------------------------------

# Guardrail 2 — Control Plane vs Media Plane

The system must maintain separation between:

Control Plane  
Media Plane

Control Plane responsibilities:

authentication  
call queue  
session orchestration  
interpreter assignment  
signaling routing

Media Plane responsibilities:

WebRTC peer connections  
ICE negotiation  
media track transport  
TURN relay

Control plane code must not manipulate WebRTC transport state.

Media layer must not implement business rules.

------------------------------------------------

# Guardrail 3 — Session Lifecycle Ownership

The Session Orchestration subsystem is the only component responsible for session lifecycle management.

Session states are:

REQUESTED  
QUEUED  
OFFERED  
ACCEPTED  
SESSION_CREATED  
ACTIVE  
ENDED

Only the session orchestrator may change session state.

Client code and signaling handlers must not directly change session state.

------------------------------------------------

# Guardrail 4 — Queue Ownership

Call queue behavior must be implemented only inside the Queue Routing subsystem.

Client applications must never implement queue logic.

Queue responsibilities include:

call ordering  
interpreter assignment  
priority routing

Queue logic must not exist in UI code.

------------------------------------------------

# Guardrail 5 — Signaling Protocol Stability

WebSocket signaling message types are canonical.

Allowed signaling message types include:

client.auth  
client.join-session  
signal.offer  
signal.answer  
signal.ice-candidate  
session.joined  
session.left  
session.ended

These message types must not be renamed without updating the signaling specification.

Protocol changes require specification updates.

------------------------------------------------

# Guardrail 6 — Repository Structure Integrity

Subsystem directories must remain stable.

Allowed locations:

`/apps/web`  
`/apps/api`  
`/packages`  
`/media`  
`/database`  
`/docs`

Media infrastructure must remain under:

`/media`

TURN infrastructure must remain under:

`/media/turn`

Signaling server must remain under:

`/apps/api/src/signaling`

------------------------------------------------

# Guardrail 7 — Deterministic Documentation

All major subsystems must have specifications located in:

`/docs/specifications`

Code must align with specification definitions.

Specifications are authoritative.

Implementation must not introduce new subsystems without specification updates.

------------------------------------------------

# Guardrail 8 — Authentication Authority

Authentication must be implemented in the Application Layer.

The Media Layer must never perform authentication logic.

Authentication identity must propagate through:

REST API  
WebSocket signaling

Media negotiation must only occur after successful authentication.

------------------------------------------------

# Guardrail 9 — Infrastructure Isolation

Infrastructure components must remain isolated from application logic.

Infrastructure includes:

TURN servers  
database  
Redis  
Docker infrastructure

Application logic must interact with infrastructure through defined services.

------------------------------------------------

# Guardrail 10 — Secure-by-Design Principle

Security must be integrated at the architecture level.

Examples:

authentication required before session join  
restricted signaling access  
minimal attack surface

Security controls must not be added only as external patches.

------------------------------------------------

# Guardrail 11 — Observability Requirements

All major subsystems must expose metrics and logging.

Examples:

session lifecycle events  
queue metrics  
media connection health  
TURN relay usage

Observability data must feed operational monitoring tools.

------------------------------------------------

# Guardrail 12 — Backward-Compatible Protocol Evolution

Protocol evolution must preserve backward compatibility where possible.

Breaking protocol changes require:

specification update  
migration strategy  
documentation update

------------------------------------------------

# Guardrail 13 — Specification Precedence

Implementation must follow specification documents located in:

`/docs/specifications`

When code and documentation conflict, the specification must be updated before implementation changes.

------------------------------------------------

# Guardrail 14 — Architecture Decision Records

All major architecture decisions must be recorded.

Location:

`/docs/architecture/adr`

Each ADR must include:

decision  
context  
alternatives considered  
rationale

------------------------------------------------

# Guardrail 15 — System Evolution

New major capabilities must extend existing architecture.

Examples:

viewer mode  
SIP integration  
PSTN integration

These must integrate through the Session Orchestration layer rather than bypassing existing architecture.
