# WebRTC Anti-Drift Rule

## Purpose

Prevent signaling code from becoming the owner of business logic.

## Dangerous Drift

The signaling server starts making application decisions.

Examples of forbidden behavior:
- assigning interpreters
- creating sessions
- changing session state
- deciding queue routing

This causes:
- business logic spreading into signaling
- race conditions
- unstable session behavior
- difficult debugging

## Correct Rule

Signaling transports messages.
Application services make decisions.

## Signaling Server Responsibilities

Allowed:
- receive message
- validate envelope
- authenticate connection
- route message

Examples:
- `signal.offer`
- `signal.answer`
- `signal.ice-candidate`

## Not Allowed in Signaling

Forbidden:
- interpreter assignment
- queue decisions
- session lifecycle ownership
- business-rule decisions

## Correct Ownership

Session Orchestrator owns:
- session lifecycle
- participant membership
- state transitions

Queue Routing owns:
- queue order
- interpreter selection
- fairness rules

Signaling owns:
- message transport
- envelope validation
- authenticated routing

## Architecture Rule

Control Plane != Media Plane

The signaling server is transport infrastructure inside the control path.
It must not become the application brain.

## Required Reminder

All future signaling changes must be checked against this rule:

“Is signaling only transporting messages, or is it making business decisions?”

If it is making business decisions, the change is architecturally invalid.
