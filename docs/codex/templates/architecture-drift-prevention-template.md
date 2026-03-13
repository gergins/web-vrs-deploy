TEMPLATE TYPE
codex-workflow-template

TEMPLATE NAME
architecture-drift-prevention

PURPOSE
Prevent unintended architecture changes when implementing features in the Web VRS platform.

TEMPLATE ACTION
When this template appears in a prompt, Codex must treat it as an architecture guardrail and verify that the requested implementation does not violate core system design.

CONTEXT
The system is a WebRTC-based Video Relay Service platform with:

- signaling server
- session authority in backend
- Deaf user UI
- interpreter UI
- WebRTC media transport
- queue-based call assignment

ARCHITECTURE RULES

Signaling is transport only.

Backend is session authority.

WebSocket event names must remain stable.

Session state vocabulary must remain unchanged.

Queue and interpreter assignment must remain backend-controlled.

Frontend must not assume session authority.

Media transport must remain WebRTC peer-based.

Reconnect logic must remain separate from explicit termination.

WHEN IMPLEMENTING FEATURES

Before implementing a change, Codex must verify:

1. No websocket event contracts are changed unintentionally.
2. No session state vocabulary is modified.
3. Backend remains authoritative for session lifecycle.
4. Media transport logic is not moved into signaling.
5. Queue assignment logic is not moved to frontend.

IF A REQUEST WOULD CAUSE ARCHITECTURE DRIFT

Codex must:

1. explain which architecture rule would be violated
2. propose a bounded alternative
3. avoid implementing the unsafe change

OUTPUT FORMAT

# Architecture Guardrail Check

## 1 Requested change

## 2 Guardrail analysis

## 3 Safe implementation approach
