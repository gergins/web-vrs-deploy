# Signaling Flow

This file explains the current implemented signaling flow.

Contract truth lives in:
- `docs/contracts/websocket-events.md`
- `docs/contracts/signaling-message-schema.md`

Implementation entry points:
- `apps/api/src/signaling/signaling-gateway.ts`
- `apps/api/src/signaling/signaling-router.ts`
- `apps/web/src/signaling/signaling-client.ts`

## Transport

- signaling uses WebSocket only
- gateway path: `/ws`
- all SDP offer/answer exchange passes through signaling
- all ICE candidate exchange passes through signaling

## Envelope model

Every signaling message uses the documented envelope shape:

- `messageId`
- `correlationId`
- `type`
- `timestamp`
- `sessionId`
- `actorId`
- `payload`

## Current inbound flow

1. client opens a WebSocket connection to `/ws`
2. client sends `client.auth`
3. backend validates and authenticates the actor
4. backend registers the live connection by `userId`
5. backend replies with `server.authenticated`

After authentication, the connection may send:

- `client.join-session`
- `client.leave-session`
- `client.call-request`
- `client.assignment-response`
- `client.heartbeat`
- `client.reconnect`
- `signal.offer`
- `signal.answer`
- `signal.ice-candidate`

## Session join flow

1. client authenticates
2. client sends `client.join-session`
3. backend authorizes the actor against the persisted session record
4. backend adds the connection to the transient session registry
5. backend emits `session.joined`
6. peers can then exchange `signal.offer`, `signal.answer`, and `signal.ice-candidate`

## Session leave flow

1. client sends `client.leave-session`
2. backend removes the connection from transient session membership
3. backend marks the persisted `SessionRecord` as `completed`
4. backend sets `endedAt`
5. backend emits `session.ended` to the peer side

## Queue and assignment signaling flow

Queue and assignment events share the signaling channel with SDP and ICE relay.

Current outbound events used by the queue and assignment flow:

- `queue.updated`
- `assignment.offered`
- `assignment.accepted`
- `assignment.cancelled`
- `assignment.declined`
- `session.created`

Current behavior:

1. signer creates a call request through REST
2. API may emit `queue.updated` to the signer if a live websocket connection exists
3. assignment service emits `assignment.offered` to one or more targeted interpreters according to the configured routing mode
4. interpreter responds with `client.assignment-response`
5. on accept:
   - backend claims the call
   - backend emits `assignment.accepted`
   - backend emits `session.created`
   - in simultaneous mode, backend also emits `assignment.cancelled` to losing interpreters
6. on decline:
   - backend emits `assignment.declined`
   - backend may re-offer or leave the call queued

## Reconnect flow

The current implementation supports bounded signaling reconnect:

1. client reconnects and sends `client.reconnect`
2. backend re-authenticates the actor
3. backend restores connection identity
4. client may rejoin the session with `client.join-session`

Transient session membership and disconnect grace are handled in the signaling gateway and registries. Durable active-session recovery is handled separately by HTTP lookup paths such as `/interpreters/active-session`.

## Error handling

- invalid or unauthorized signaling messages are rejected with `server.error`
- backend validates inbound message shape before routing
- websocket delivery failures are logged and treated as non-fatal for backend control-plane state changes

## Current limits

- signaling is implemented for the local authenticated prototype
- there is no guaranteed-delivery or retry queue for missed websocket messages
- session recovery and queue recovery rely on authoritative persisted lookup paths rather than historical websocket replay
