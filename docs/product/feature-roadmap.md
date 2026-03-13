# Web VRS Feature Roadmap

## 1. Core System (already implemented or in progress)

### Two-party VRS call
Deaf user connects to an interpreter through video.

Flow:  
Deaf ↔ Interpreter

Capabilities:
- browser WebRTC call
- queue placement
- interpreter assignment
- session creation
- signaling server
- authenticated identities

---

## 2. Near-term Features (next development phase)

### Deaf User Interface
Primary UI for Deaf users.

Features:
- call button
- local video preview
- interpreter video display
- connection status
- text chat panel

### Interpreter Interface
Interpreter workspace.

Features:
- availability toggle
- waiting queue view
- accept / decline calls
- session controls
- end call

### Basic Chat
Simple message panel during the call using WebSocket messaging.

Purpose:
- fallback communication
- short text clarification

---

## 3. Mid-term Communication Features

### Three-party relay call
Interpreter connects a hearing participant.

Flow:  
Deaf ↔ Interpreter ↔ Hearing participant

Interpreter can:
- dial a participant
- invite participant

---

### Viewer / Observer mode
A third participant joins only to observe the interpreted session.

Flow:  
Deaf ↔ Interpreter  
           ↓  
        Viewer

Possible uses:
- support worker
- family member
- meeting participant

---

### Call History
List of previous calls.

Features:
- timestamp
- interpreter identity
- call duration
- call status

---

### User Settings
User configuration panel.

Examples:
- camera selection
- microphone selection
- preferred language
- notification preferences

---

## 4. Advanced Accessibility Features

### Real-Time Text (RTT)
Character-by-character text transmission during calls.

Purpose:
- accessibility compliance
- communication fallback

---

### Contact List
Saved contacts or preferred interpreters.

Possible features:
- favorites
- quick call

---

## 5. Telecommunication Integration

### SIP Address Support
Users can be addressed through SIP.

Example:  
`deaf123@vrs.example.com`

Purpose:
- enterprise video systems
- SIP softphones
- federation with other services

---

### Telephone Number Integration
Ability to call real telephone numbers through interpreter relay.

Flow:  
Deaf ↔ Interpreter ↔ PSTN phone

Requires:
- SIP/PSTN gateway
- telephony provider integration

Example providers:
- Twilio
- Telnyx

---

## 6. Administrative Platform

### Admin Console

Features:
- interpreter account management
- queue monitoring
- active session monitoring
- system metrics

---

## 7. Long-term Platform Goals

Possible future capabilities:

- multi-participant interpreted meetings
- interpreter scheduling
- interpreter skill matching
- automated interpreter routing
- analytics and reporting

---
