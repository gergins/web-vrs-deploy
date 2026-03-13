# Call Flow

This file describes the bounded backend flow that is implemented now.

## REST entry flow

1. client sends `POST /calls`
2. API creates a `CallRequest` in `requesting`
3. queue service moves the call request to `queued`
4. API emits `queue.updated` to the requester if that requester has a live websocket connection
5. assignment service selects the first available interpreter deterministically
6. if an interpreter is found:
   - an `AssignmentAttempt` is created with outcome `offered`
   - the call request moves to `offered`
   - the interpreter receives `assignment.offered`
7. if no interpreter is found:
   - the call remains `queued`

## Interpreter response flow

1. interpreter authenticates on websocket
2. interpreter receives `assignment.offered`
3. interpreter sends `client.assignment-response`

If the interpreter accepts:

1. assignment attempt outcome becomes `accepted`
2. call request state becomes `accepted`
3. API creates a `SessionRecord` in `session_created`
4. API emits:
   - `assignment.accepted`
   - `session.created`
5. session participants can then use `client.join-session`

If the interpreter declines:

1. assignment attempt outcome becomes `declined`
2. call request returns to `queued`
3. API emits `assignment.declined`
4. API may offer the next available interpreter
5. if no next interpreter exists, the requester remains queued and may receive `queue.updated`

## States used now

Current implemented control flow uses these canonical states:

- `requesting`
- `queued`
- `offered`
- `accepted`
- `session_created`
- `cancelled`
