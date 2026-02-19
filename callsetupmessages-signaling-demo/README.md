# WebRTC Signaling & Video Call Demo

## Overview

This project is a demo implementation of a peer-to-peer video calling system using **WebRTC** for media exchange and **WebSocket** for signaling.

It demonstrates how two users can:

- Connect to a signaling server
- Send and receive call setup messages
- Accept or reject incoming calls
- Perform SDP offer/answer exchange
- Exchange ICE candidates
- Establish a direct peer-to-peer media connection
- Cleanly terminate calls

The goal of this demo is to understand and implement the core signaling flow required for WebRTC communication and Call setup messages.

---

# callsetupessages-signaling-demo

## Project Structure
```
callsetupessages-signaling-demo/
├── call-demo/           → Angular frontend (WebRTC + UI + signaling logic)
└── call-setup-server/   → Node.js WebSocket signaling server
```

### Client
The frontend application:

- Handles user registration
- Manages call state transitions
- Creates and manages `RTCPeerConnection`
- Captures local media
- Renders local and remote video streams
- Performs signaling via secure WebSocket connection

### Server
The signaling server:

- Accepts WebSocket connections
- Tracks connected users
- Forwards signaling messages between peers

---

## Features Demonstrated

### 1. User Registration
Each user connects to the signaling server using a unique user ID.

### 2. Call Setup Flow
- User A initiates a call
- User B receives an incoming call
- User B can accept or reject

### 3. SDP Exchange
After call acceptance:

- Caller creates and sends an SDP offer
- Callee generates and returns an SDP answer

### 4. ICE Candidate Exchange
Both peers exchange ICE candidates to establish the optimal network path.

### 5. Peer-to-Peer Media
Once negotiation completes:

- A direct WebRTC connection is established
- Local and remote video streams are displayed


## Technologies Used

- Angular (Frontend UI & WebRTC handling)
- Node.js (Backend signaling server)
- WebSocket (Signaling channel + Call setup messages) 
- WebRTC API (Media transport)
- STUN server (Used stun:stun.l.google.com:19302 server for demo)
- HTTPS + WSS (Secure context for media access)

---

## Limitations

This is a demo implementation and does not include:

- TURN server for NAT relay fallback
- Authentication or authorization
- Call recording
- Group calls
- Production-grade scaling

---
