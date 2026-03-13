# Media Layer Status

## Current Status

The Media Layer is currently a working prototype, not a finished production-stable subsystem.

## What is working

- authenticated call entry works
- queue -> offer -> accept -> session -> call flow works
- WebRTC connection can be established
- signaling/auth/join sequencing is working
- basic reconnect handling has improved

## What is not yet considered fully stable

- remote peer departure UX is not fully polished
- frozen-last-frame / black-screen behavior still needs clearer user-facing handling
- TURN/relay behavior still needs stronger validation
- disconnect/recovery edge cases still need more hardening
- telecom-grade media resilience is not yet complete

## Engineering Decision

The Media Layer is stable enough to allow continued development of other platform areas.

However, Media Layer work is not finished.

Development may continue in parallel on:

- Deaf UI
- Interpreter UI improvements
- basic chat
- session workflow improvements
- bounded E2E coverage

A Media Stability Backlog must remain active.

## Deferred Media Stability Backlog

- TURN / relay verification
- remote participant left-call UX
- reconnect / session rejoin hardening
- media watchdog tuning
- transport failure classification improvements

## Rule

Treat the Media Layer as:

working enough to move forward,  
not complete enough to declare finished.
