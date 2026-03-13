# System Architecture Map — Web VRS Platform

## Purpose

This document provides a high-level architecture overview of the Web Video Relay Service platform.

It describes the relationships between major system layers and subsystems.

The goal is to ensure architectural clarity and prevent structural drift during development.

------------------------------------------------

# Platform Architecture Layers

The Web VRS platform is organized into five primary layers.

Client Layer  
Application Layer  
Media Layer  
Data Layer  
Infrastructure Layer

Each subsystem belongs to one of these layers.

------------------------------------------------

# Layer Overview

## Client Layer

Responsible for user-facing interfaces.

Components:

Deaf User Interface  
Interpreter Workspace  
Admin Console

Location:

`/apps/web`

Responsibilities:

user interaction  
video rendering  
local media capture  
WebSocket signaling connection  
displaying session state

The client layer must not implement business logic.

------------------------------------------------

## Application Layer

Responsible for control-plane logic.

Components:

Authentication Service  
Session Orchestrator  
Queue Routing Engine  
Interpreter Availability Service  
Assignment Engine  
REST API  
WebSocket Signaling Server

Location:

`/apps/api`

Responsibilities:

call lifecycle management  
interpreter routing  
session state management  
authentication  
signaling message routing

------------------------------------------------

## Media Layer

Responsible for real-time media transport.

Components:

WebRTC Peer Connection Manager  
ICE Negotiation  
STUN Discovery  
TURN Relay  
Media Health Monitoring

Locations:

`/apps/web/src/webrtc`  
`/media/turn`

Responsibilities:

video/audio transport  
NAT traversal  
connection health monitoring  
media relay fallback

------------------------------------------------

## Data Layer

Responsible for persistent and transient data storage.

Components:

User records  
Session records  
Call history  
Interpreter status

Technology:

PostgreSQL  
Redis (queue + ephemeral state)

Location:

`/apps/api/src/db`  
`/apps/api/src/repositories`  
`/apps/api/src/realtime`

Responsibilities:

data persistence  
queue storage  
session records  
presence and transient coordination

------------------------------------------------

## Infrastructure Layer

Responsible for platform infrastructure.

Components:

Docker orchestration  
TURN servers  
Redis  
PostgreSQL  
Nginx proxy

Location:

`/infra`  
`/media`

Responsibilities:

service deployment  
network routing  
media relay  
system scalability

------------------------------------------------

# Core System Interaction Flow

The core VRS call flow operates as follows:

1. Deaf user initiates call
2. Call enters queue
3. Queue routing assigns interpreter
4. Session orchestrator creates session
5. Both participants join signaling session
6. WebRTC negotiation begins
7. ICE candidates exchanged
8. Media connection established
9. Session remains active until call ends

------------------------------------------------

# VRS Communication Model

## Two-Party VRS Call

Deaf ↔ Interpreter

This is the minimum supported call configuration.

------------------------------------------------

## Three-Party Relay Call

Deaf ↔ Interpreter ↔ Hearing participant

Interpreter relays communication between participants.

------------------------------------------------

## Observer / Viewer Mode

Deaf ↔ Interpreter  
           ↓  
        Viewer

Viewer receives interpreted communication but does not participate.

------------------------------------------------

# Telecommunication Integration

Future extensions support telecom integration.

## SIP Addressing

Example:

`user@vrs.example.com`

Allows calls from SIP endpoints.

------------------------------------------------

## PSTN Telephone Integration

Example flow:

Deaf ↔ Interpreter ↔ Telephone number

Requires:

WebRTC ↔ SIP gateway  
PSTN provider integration

Examples:

Twilio  
Telnyx

------------------------------------------------

# Subsystem Dependency Map

The system must be built in dependency order.

Media Layer  
↓  
Session Orchestration  
↓  
Queue Routing  
↓  
Interpreter Workspace  
↓  
Deaf User Interface  
↓  
Relay Call Features  
↓  
Telephony Integration  
↓  
Administrative Platform

Subsystems higher in the stack depend on those below.

------------------------------------------------

# Repository Architecture Map

`/apps`  
&nbsp;&nbsp;`/web`  
&nbsp;&nbsp;&nbsp;&nbsp;Deaf UI  
&nbsp;&nbsp;&nbsp;&nbsp;Interpreter UI  
&nbsp;&nbsp;&nbsp;&nbsp;Admin UI  

&nbsp;&nbsp;`/api`  
&nbsp;&nbsp;&nbsp;&nbsp;REST API  
&nbsp;&nbsp;&nbsp;&nbsp;Signaling server  
&nbsp;&nbsp;&nbsp;&nbsp;Session services  
&nbsp;&nbsp;&nbsp;&nbsp;Queue services  

`/media`  
&nbsp;&nbsp;`/turn`  
&nbsp;&nbsp;&nbsp;&nbsp;TURN relay infrastructure  

`/database`  
&nbsp;&nbsp;PostgreSQL schema

`/infra`  
&nbsp;&nbsp;Docker configuration

`/docs`  
&nbsp;&nbsp;`/architecture`  
&nbsp;&nbsp;`/specifications`  
&nbsp;&nbsp;`/product`

------------------------------------------------

# Architecture Principles

The Web VRS platform follows these principles:

Layered architecture  
Control-plane / media-plane separation  
Specification-driven development  
Deterministic signaling protocols  
Real-time communication reliability

------------------------------------------------

# Evolution Path

The architecture is designed to support future capabilities.

Potential future extensions:

multi-party interpreted meetings  
interpreter scheduling  
skill-based routing  
advanced analytics  
automated interpreter routing
