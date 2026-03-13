# Signaling Message Schema

Every websocket message uses an envelope.

## Envelope

- messageId: string
- correlationId: string
- type: string
- timestamp: string
- sessionId: string | null
- actorId: string
- payload: object

## Inbound message types

- client.auth
- client.join-session
- client.leave-session
- client.call-request
- client.assignment-response
- signal.offer
- signal.answer
- signal.ice-candidate
- client.heartbeat
- client.reconnect

## Outbound message types

- server.authenticated
- server.error
- queue.updated
- assignment.offered
- assignment.accepted
- assignment.declined
- session.created
- session.joined
- signal.offer
- signal.answer
- signal.ice-candidate
- session.connecting
- session.connected
- session.reconnecting
- session.degraded
- session.failed
- session.ended
