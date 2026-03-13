# VRS Development Priority Order

## Current Context

The Media Layer is implemented and functional enough to support live WebRTC calls.

Core flow currently working:

queue -> offer -> accept -> session -> call

Because the core call path is operational, development may now proceed to user-facing functionality.

This follows standard structured software development practice where architecture and core infrastructure are built before higher-level user features.

## Next Development Priority

The next major feature focus is the **Deaf User Interface**.

The Deaf UI represents the primary entry point for the service and must be implemented before login systems and other secondary features.

## Development Order

The next phases of platform development should follow this order:

1. Deaf User Interface

Implement the primary Deaf user interface for initiating and participating in VRS calls.

Features:

- call button
- video preview
- interpreter video display
- connection status indicator
- basic text chat

Goal:

Provide a simple, accessible interface allowing Deaf users to initiate and participate in relay calls.

2. Login / Authentication

After the Deaf UI exists, introduce user authentication.

Responsibilities:

- persistent user identity
- session authentication
- account management
- support for future features such as contacts and call history

Important:

Authentication must integrate with existing signaling identity rules.

3. Interpreter Workspace Improvements

Enhance the interpreter interface.

Features:

- availability toggle
- queue visibility
- incoming call notifications
- accept / decline call
- session controls

4. User Features Layer

Once both user interfaces exist:

Add features such as:

- user settings
- contact list
- call history
- accessibility options

5. Telecommunication Integration

Later development phases may include:

- SIP addressing
- telephone number support
- PSTN relay calling
- external participant dialing

6. Administrative Platform

Operational control system:

- active call monitoring
- queue monitoring
- interpreter management
- system health metrics

## Rule

The development sequence must remain:

Infrastructure → Core User Interface → Identity → Workflow → External Integrations.

The next engineering task after current media work is therefore:

Implement the Deaf User Interface.
