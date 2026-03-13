# Signaling Architecture

The signaling server is the control plane for browser peer setup.

## Responsibilities

- authenticate websocket clients
- bind live websocket connections to authenticated users
- let users join authorized sessions
- relay SDP offer messages
- relay SDP answer messages
- relay ICE candidate messages
- propagate queue and assignment events
- manage heartbeat and stale connection detection
- support reconnect within grace windows
- emit audit and metrics hooks

## Non-responsibilities

- media relay
- direct video transport
- persistent authoritative history
- peer discovery outside session authorization

## Core components

- signaling-gateway.ts
- signaling-router.ts
- signaling-session-registry.ts
- signaling-connection-registry.ts
- signaling-auth.ts
- signaling-heartbeat.ts
- signaling-message-validator.ts

## Flow

1. client authenticates websocket
2. gateway maps websocket connection to user
3. client joins authorized session
4. gateway relays offer/answer/ice messages by session
5. session service updates lifecycle state
6. disconnects trigger reconnect grace logic
