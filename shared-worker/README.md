# Shared Worker + IndexedDB + WebAssembly Demo

## Overview

This demo showcases a browser-based architecture using:

- **Shared Worker** for cross-tab synchronization
- **IndexedDB** for persistent client-side storage
- **WebAssembly (WASM)** for message encryption
- Centralized data management logic inside the Shared Worker

The goal of this demo is to demonstrate:

- Cross-tab state synchronization
- Centralized IndexedDB access
- Asynchronous, non-blocking architecture
- WebAssembly integration inside a Shared Worker
- Clean separation of concerns between UI and data layer

---


## Key Concepts

### 1. Shared Worker

- All browser tabs connect to a single Shared Worker instance.
- The worker acts as a centralized controller.
- It manages:
  - Message processing
  - Encryption
  - IndexedDB operations
  - Broadcasting updates to all connected tabs

This ensures:
- No duplicated database connections
- Consistent state across tabs
- Centralized logic

---

### 2. IndexedDB Integration

The Shared Worker is the **only layer** that interacts with IndexedDB.

Responsibilities:
- Open database
- Manage object stores
- Insert messages
- Retrieve messages
- Delete messages (if needed)
- Broadcast updates to connected tabs

Client tabs do not directly interact with IndexedDB.

This ensures:
- Controlled access
- Cleaner architecture
- Reduced race conditions
- Better async handling

---

### 3. WebAssembly (WASM) Integration

To demonstrate WASM integration:

- The Shared Worker loads a WebAssembly module.
- The WASM module performs encryption on message content.
- Before storing messages in IndexedDB, the worker encrypts the content.
- Decryption logic can also be handled centrally if required.

This demonstrates:
- WASM running inside a Shared Worker
- Performance-oriented processing layer
- Isolation of computational logic

---

## Data Flow

1. A client tab sends a message to the Shared Worker.
2. The Shared Worker:
   - Encrypts the message using WASM
   - Stores it in IndexedDB
3. The Shared Worker broadcasts the updated state to all connected tabs.
4. Tabs receive:
   - `msg_id`
   - `msg_content`
5. UI updates accordingly.

All database and encryption logic stays outside the UI layer.

---

## Why This Architecture?

### Centralized Control
Only one entity (Shared Worker) handles:
- Storage
- Encryption
- Synchronization

### Asynchronous by Design
- IndexedDB is async
- Worker runs in separate thread
- UI thread remains non-blocked

### Cross-Tab Synchronization
- Shared Worker enables real-time updates between multiple tabs.

### Clean Separation of Concerns

| Layer | Responsibility |
|-------|----------------|
| Client Tab | UI Rendering |
| Shared Worker | Business Logic + Storage |
| WASM | Encryption |
| IndexedDB | Persistence |

---
