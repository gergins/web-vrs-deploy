# REST API

This document lists the currently implemented REST routes in the repo.

Implementation entry points:
- `apps/api/src/routes/auth-routes.ts`
- `apps/api/src/routes/call-routes.ts`
- `apps/api/src/routes/queue-routes.ts`
- `apps/api/src/routes/session-routes.ts`
- `apps/api/src/routes/interpreter-routes.ts`
- `apps/api/src/routes/turn-routes.ts`

This is a local authenticated prototype API. It does not implement production auth, public user management, or a broad admin API.

## `GET /health`

Health probe for the API process.

### Success response

```json
{
  "ok": true,
  "service": "api",
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

## `POST /auth/local`

Local seeded-user authentication only.

### Request body

- `userId: string`

### Success response

```json
{
  "ok": true,
  "identity": {
    "userId": "user-signer-1",
    "role": "signer"
  }
}
```

### Error responses

- `400 invalid_request`
- `404 user_not_found`

## `POST /calls`

Create a new call request and trigger the current queue/assignment workflow.

### Request input

The requester id may be provided by either:

- header: `x-user-id`
- JSON body: `requesterId`

### Success response

```json
{
  "ok": true,
  "callRequest": {
    "id": "call-request-id",
    "requesterId": "user-signer-1",
    "state": "queued",
    "assignedInterpreterId": null,
    "createdAt": "2026-03-14T12:00:00.000Z"
  }
}
```

### Notes

- the returned `callRequest.state` may be `queued` or `offered` depending on the assignment path reached before the response is returned
- queue and assignment websocket messages are separate from this REST response

### Error responses

- `400 invalid_request`
- `500 call_request_failed`
- `503 database_unavailable`

## `GET /queue/:callRequestId`

Return the current queue status for a call request.

### Success response

```json
{
  "ok": true,
  "queue": {
    "id": "call-request-id",
    "requesterId": "user-signer-1",
    "state": "queued",
    "assignedInterpreterId": null,
    "createdAt": "2026-03-14T12:00:00.000Z"
  }
}
```

### Error responses

- `404` when the call request is not found

## `DELETE /queue/:callRequestId`

Cancel a queued call request through the queue repository path.

### Success response

```json
{
  "ok": true,
  "callRequest": {
    "id": "call-request-id",
    "state": "cancelled"
  }
}
```

## `GET /sessions/:sessionId`

Return a persisted session record by id.

### Success response

```json
{
  "ok": true,
  "session": {
    "id": "session-id",
    "callRequestId": "call-request-id",
    "requesterId": "user-signer-1",
    "interpreterId": "interpreter-1",
    "state": "session_created",
    "createdAt": "2026-03-14T12:00:00.000Z",
    "endedAt": null
  }
}
```

### Error responses

- `404` when the session is not found

## `GET /interpreters`

Return the first currently available interpreter according to the repository lookup.

### Success response

```json
{
  "ok": true,
  "scope": "interpreters",
  "availableInterpreter": {
    "id": "interpreter-1",
    "userId": "user-interpreter-1",
    "status": "available",
    "createdAt": "2026-03-14T12:00:00.000Z"
  }
}
```

### Notes

- this is a narrow prototype/debug surface, not a full interpreter directory API

## `GET /interpreters/active-offer`

Return the currently active offered assignment for the authenticated interpreter, if one exists.

### Required header

- `x-user-id: string`

### Success response

```json
{
  "ok": true,
  "activeOffer": {
    "assignmentAttemptId": "assignment-attempt-id",
    "callRequestId": "call-request-id",
    "interpreterId": "interpreter-1"
  }
}
```

### Null response

```json
{
  "ok": true,
  "activeOffer": null
}
```

### Current implementation rule

The backend returns an offer only when:

- the requester authenticates as an interpreter
- the matching assignment attempt is still `offered`
- the call request is still `offered`
- the Deaf requester is currently present
- the offer age is within `QUEUE_OFFER_TIMEOUT_MS`

## `GET /interpreters/active-session`

Return the current active session for the authenticated interpreter, if one exists.

### Required header

- `x-user-id: string`

### Success response

```json
{
  "ok": true,
  "activeSession": {
    "sessionId": "session-id"
  }
}
```

### Null response

```json
{
  "ok": true,
  "activeSession": null
}
```

### Current implementation rule

The backend returns a session only when:

- the requester authenticates as an interpreter
- a `SessionRecord` exists for that interpreter
- `endedAt` is still `null`
- session state is not terminal (`completed`, `cancelled`, `failed`)

## `GET /turn/credentials`

Return browser-ready ICE server configuration using backend-generated TURN credentials.

### Success response

```json
{
  "ok": true,
  "turn": {
    "iceServers": [
      {
        "urls": "stun:localhost:3478"
      },
      {
        "urls": [
          "turn:localhost:3478?transport=udp",
          "turn:localhost:3478?transport=tcp"
        ],
        "username": "expires:web-vrs",
        "credential": "generated-secret"
      }
    ],
    "ttlSeconds": 3600,
    "expiresAt": "2026-03-14T13:00:00.000Z"
  }
}
```

## Notes

- implemented REST routes are intentionally narrow and prototype-oriented
- there is no password auth, signup, OAuth, user profile management, or production admin REST surface
- websocket signaling remains the canonical transport for assignment events, session join/leave, SDP, and ICE exchange
