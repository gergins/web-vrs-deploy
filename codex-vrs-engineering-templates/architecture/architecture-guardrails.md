Follow these architecture guardrails.

RULES

Signaling is transport only.

Session authority belongs to the backend.

WebSocket event names must remain stable.

Session state vocabulary must remain unchanged.

Avoid adding new websocket events unless strictly required.

Media transport decisions must remain inside the media layer.

Queue logic must remain server authoritative.

Interpreter assignment must remain backend controlled.

Frontend must not assume session authority.

If a requested change violates these guardrails, explain the conflict instead of implementing it.
