# Call Flow

This file describes the bounded backend flow that is implemented now.

Current routing mode support:
- `sequential` is implemented
- `simultaneous` is implemented for bounded multi-interpreter offer fanout

## REST entry flow

1. client sends `POST /calls`
2. API creates a `CallRequest` in `requesting`
3. queue service moves the call request to `queued`
4. API emits `queue.updated` to the requester if that requester has a live websocket connection
5. assignment service reads the configured routing mode
6. in `sequential` mode, assignment service selects the first available interpreter deterministically
7. in `simultaneous` mode, assignment service selects a bounded set of available interpreters
8. if one or more interpreters are found:
   - one or more `AssignmentAttempt` rows are created with outcome `offered`
   - the call request moves to `offered`
   - in `sequential` mode, `assignedInterpreterId` records the current offered interpreter
   - each targeted interpreter receives `assignment.offered`
9. if no interpreter is found:
   - the call remains `queued`

## Interpreter response flow

1. interpreter authenticates on websocket
2. interpreter receives `assignment.offered`
3. interpreter sends `client.assignment-response`

If the interpreter accepts:

1. API claims the call for acceptance only if it is still in `offered` for that interpreter
2. API marks the matching offered assignment attempt as accepted
3. assignment attempt outcome becomes `accepted`
4. call request state becomes `accepted`
5. the accepted assignment attempt becomes the winning interpreter record
6. any other still-offered assignment attempts for that call are cancelled
7. API emits `assignment.cancelled` to non-winning interpreters for those cancelled attempts
8. API creates a `SessionRecord` in `session_created`
9. API emits:
   - `assignment.accepted`
   - `session.created`
10. session participants can then use `client.join-session`

When a participant later leaves through `client.leave-session`:

1. API removes the live connection from transient session registries
2. API marks the persisted `SessionRecord` as `completed`
3. API sets `endedAt`
4. API emits `session.ended`

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
