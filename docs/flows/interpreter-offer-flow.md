# Interpreter Offer Flow

This file describes the bounded interpreter-offer behavior implemented now.

Current routing mode support:
- `sequential` is implemented
- `simultaneous` is implemented for bounded multi-interpreter offer fanout

## Initial offer delivery

1. signer creates a call request
2. backend selects one or more available interpreters according to the configured routing mode
3. backend creates one or more `AssignmentAttempt` rows with outcome `offered`
4. backend updates the call request to `offered`
5. in `sequential` mode, backend records the current offered target on `assignedInterpreterId`
6. backend emits `assignment.offered` to each targeted interpreter

## Interpreter refresh flow

1. interpreter workspace first requests the current active session from `/interpreters/active-session`
2. if a joinable session already exists for that interpreter, the workspace redirects into `/call/[sessionId]`
3. otherwise, if the interpreter refreshes the page during an offered state, the workspace requests the current active offer from `/interpreters/active-offer`
4. backend returns an offer only when:
   - there is a current call request still in `offered` state
   - the Deaf requester is still currently present
   - the matching assignment attempt for that call request and interpreter is still `offered`
   - the assignment offer age is still within `QUEUE_OFFER_TIMEOUT_MS`
5. workspace restores the offer card only from that authoritative response
6. if an interpreter previously left a completed call through `client.leave-session`, that session is no longer returned by `/interpreters/active-session` because the backend marks it `completed` and sets `endedAt`

This preserves the existing queue/assignment flow and avoids replaying stale backend offers on a fresh interpreter login.

## Interpreter response flow

If the interpreter accepts:

1. backend first claims the offered call for that interpreter
2. backend records the matching offered assignment attempt as `accepted`
3. call request becomes `accepted`
4. the accepted assignment attempt becomes the winner record for that call
5. backend cancels the other still-offered assignment attempts for that call
6. backend emits `assignment.cancelled` to each non-winning targeted interpreter
7. backend creates a session
8. backend emits `assignment.accepted`
9. backend emits `session.created`

Non-winning interpreter behavior:

1. if another interpreter wins acceptance first
2. backend changes the losing offered attempts to `cancelled`
3. backend emits `assignment.cancelled` to those interpreters
4. interpreter workspace removes only the matching stale offer card in real time

If the interpreter declines:

1. backend records the assignment attempt as `declined`
2. call request returns to `queued`
3. backend emits `assignment.declined` to the signer
4. backend immediately attempts the next interpreter offer if one is available
5. if no next interpreter is available, backend emits `queue.updated` with `queued`
