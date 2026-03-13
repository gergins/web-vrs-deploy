# Session State Machine

Canonical states:

- idle
- requesting
- queued
- offered
- accepted
- session_created
- connecting
- connected
- reconnecting
- degraded
- failed
- completed
- cancelled

## Required transitions

- idle -> requesting
- requesting -> queued
- queued -> offered
- offered -> accepted
- offered -> queued
- accepted -> session_created
- session_created -> connecting
- connecting -> connected
- connecting -> failed
- connected -> reconnecting
- reconnecting -> connected
- reconnecting -> degraded
- reconnecting -> failed
- connected -> completed
- queued -> cancelled
- offered -> cancelled
