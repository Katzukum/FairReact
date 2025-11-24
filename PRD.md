This is a comprehensive **Product Requirements Document (PRD)** designed specifically to be fed into an AI Coder (like Cursor, GitHub Copilot, or Windsurf).

It prioritizes **simplicity**, **Manifest V3 compliance**, and **AWS hosting** while solving the specific edge cases of video synchronization.

***

# Product Requirements Document (PRD): FairReact

## 1. Executive Summary
**FairReact** is a Chrome Browser Extension that enables "Ethical Reaction Content." It allows a **Host** (Streamer) to control the video playback of **Viewers** in real-time. The video loads locally on every Viewer’s browser, ensuring the original content creator receives legitimate views and ad impressions.

## 2. Core User Flows

### 2.1 The Host (Streamer)
1.  Installs FairReact extension.
2.  Navigates to a supported site (e.g., YouTube).
3.  Opens extension popup and clicks **"Create Room."**
4.  Extension generates a 6-character Room Code (e.g., `XY9-2BB`).
5.  Host shares code in stream chat.
6.  Host controls the video (Play, Pause, Seek, Change URL); all connected Viewers sync automatically.

### 2.2 The Viewer
1.  Installs FairReact extension.
2.  Opens extension popup and clicks **"Join Room."**
3.  Enters the Room Code provided by the streamer.
4.  If the URL matches the Host, the video syncs.
5.  If the URL differs, the extension redirects the Viewer to the Host's current video URL automatically.

## 3. Functional Requirements

### 3.1 Extension Frontend (Manifest V3)
*   **Platform:** Chromium (Chrome, Edge, Brave).
*   **Popup UI:**
    *   **Tab 1 (Join):** Input field for Room ID, "Join" button, Status indicator (Connected/Disconnected).
    *   **Tab 2 (Host):** "Generate Room" button, Copy to Clipboard button, Viewer Counter.
*   **Content Script (The "Driver"):**
    *   **Host Mode:** Listens for DOM events (`play`, `pause`, `seeked`) on the HTML5 `<video>` element and emits them via WebSocket.
    *   **Viewer Mode:** Listens for WebSocket events and applies them to the DOM.
    *   **Ad Detection (YouTube Specific):**
        *   Detect if an ad is playing (check for `.ad-showing` or similar classes).
        *   **Logic:** If Ad is playing $\to$ Mute Sync $\to$ When Ad ends $\to$ Force Seek to Host's current time (Catch up).

### 3.2 Backend (Signaling Server)
*   **Tech Stack:** Node.js + Socket.io.
*   **Logic:** Stateless broadcasting. The server does not store video data, only Room IDs and temporary State.
*   **Events:**
    *   `join_room`: Adds socket to a room.
    *   `sync_event`: Broadcasts `{ action: 'play/pause/seek', timestamp: 120.5 }`.
    *   `url_change`: Broadcasts `{ newUrl: 'youtube.com/watch?v=...' }`.
    *   `room_info`: Returns current viewer count to Host.

## 4. Technical Architecture & Stack

### Frontend
*   **Framework:** Vanilla JS or React (Preact recommended for extension size).
*   **Communication:** WebSocket (Socket.io-client).
*   **Manifest Permissions:**
    *   `activeTab`: To access the current URL.
    *   `scripting`: To inject the sync logic.
    *   `storage`: To save the user's last Room ID.
    *   `host_permissions`: `*://*.youtube.com/*` (MVP), `*://*.netflix.com/*` (Post-MVP).

### Backend
*   **Runtime:** Node.js.
*   **Library:** Socket.io (handles reconnection and heartbeats automatically).
*   **Hosting (AWS):**
    *   **Service:** AWS App Runner (easiest for containerized Node apps) OR AWS Lightsail (cheapest fixed cost).
    *   **Why:** We need a persistent WebSocket connection, which works better on a running container than serverless Lambda functions.

## 5. Synchronization Logic (The "Algo")

To prevent "jitter" (video speeding up/slowing down constantly), we will use a **Threshold Approach**:

1.  **Host** sends heartbeat every 5 seconds OR on any state change (Pause/Seek).
2.  **Viewer** receives heartbeat `{ hostTime: 100, state: 'playing' }`.
3.  **Viewer Logic:**
    *   `diff = Math.abs(viewerVideo.currentTime - hostTime)`
    *   **If `diff` < 2 seconds:** Do nothing (Smooth experience).
    *   **If `diff` > 2 seconds:** `viewerVideo.currentTime = hostTime` (Hard sync).
    *   **If `hostState` != `viewerState`:** Force state change (e.g., if Host is paused, Viewer must pause).

## 6. Edge Cases to Handle
1.  **The Ad-block Dilemma:** If the Host has YouTube Premium (no ads) and Viewer has Free (ads).
    *   *Solution:* Viewer extension detects Ad. It effectively "pauses" sync listening. Once the Ad element disappears, it requests a `get_current_state` from the server and snaps to the Host's live location.
2.  **Buffering:**
    *   If Viewer buffers, they fall behind. The next heartbeat (5s later) will catch the >2s drift and snap them forward.
3.  **Tab Sleeping:**
    *   Browser puts background tabs to sleep.
    *   *Solution:* Use the `background.js` Service Worker to keep the WebSocket alive.

## 7. Development Phases

*   **Phase 1 (MVP):** YouTube Only. Play/Pause/Seek sync. Room Codes.
*   **Phase 2:** Netflix Support (Requires custom DOM selectors due to custom UI).
*   **Phase 3:** Chat integration or React Emoji overlays.

***

## 8. Prompt for AI Coder
*Copy and paste the following block into your AI coding tool to start the project:*

```text
Project: FairReact Browser Extension
Goal: Create a Chrome Extension (Manifest V3) for syncing YouTube video playback between a Host and multiple Viewers via WebSockets.

Tech Stack:
- Frontend: HTML/CSS/JS (Vanilla)
- Backend: Node.js with Socket.io
- Hosting Target: AWS App Runner (Dockerfile required)

Requirements:
1. Backend:
   - Create a simple Node.js server using Socket.io.
   - Handle events: 'join_room', 'create_room', 'send_action' (play, pause, seek), 'change_url'.
   - Broadcast actions to all users in the specific room ID (exclude sender).

2. Frontend (Extension):
   - manifest.json: V3, permissions for youtube.com.
   - popup.html: Two tabs (Host / Join). Host generates a random 6-char string. Join takes input.
   - background.js: Manage the Socket.io connection to ensure it persists.
   - content.js:
     - Identify the <video> element on YouTube.
     - IF HOST: Add event listeners to the video (play, pause, seeked) and emit to server.
     - IF VIEWER: Listen for server events.
     - SYNC LOGIC: Only seek the video if the time difference is > 2 seconds to prevent stuttering.
     - AD LOGIC: Check if '.ad-showing' exists. If true, ignore sync events. When ad clears, request current timestamp.

3. Structure:
   - Provide the file structure.
   - Provide the code for server.js, manifest.json, popup.html, popup.js, content.js, and background.js.
   - Provide a Dockerfile for the backend.

Constraint: Do not proxy video data. Only sync state and timestamps.
```This is a comprehensive **Product Requirements Document (PRD)** designed specifically to be fed into an AI Coder (like Cursor, GitHub Copilot, or Windsurf).

It prioritizes **simplicity**, **Manifest V3 compliance**, and **AWS hosting** while solving the specific edge cases of video synchronization.

***

# Product Requirements Document (PRD): FairReact

## 1. Executive Summary
**FairReact** is a Chrome Browser Extension that enables "Ethical Reaction Content." It allows a **Host** (Streamer) to control the video playback of **Viewers** in real-time. The video loads locally on every Viewer’s browser, ensuring the original content creator receives legitimate views and ad impressions.

## 2. Core User Flows

### 2.1 The Host (Streamer)
1.  Installs FairReact extension.
2.  Navigates to a supported site (e.g., YouTube).
3.  Opens extension popup and clicks **"Create Room."**
4.  Extension generates a 6-character Room Code (e.g., `XY9-2BB`).
5.  Host shares code in stream chat.
6.  Host controls the video (Play, Pause, Seek, Change URL); all connected Viewers sync automatically.

### 2.2 The Viewer
1.  Installs FairReact extension.
2.  Opens extension popup and clicks **"Join Room."**
3.  Enters the Room Code provided by the streamer.
4.  If the URL matches the Host, the video syncs.
5.  If the URL differs, the extension redirects the Viewer to the Host's current video URL automatically.

## 3. Functional Requirements

### 3.1 Extension Frontend (Manifest V3)
*   **Platform:** Chromium (Chrome, Edge, Brave).
*   **Popup UI:**
    *   **Tab 1 (Join):** Input field for Room ID, "Join" button, Status indicator (Connected/Disconnected).
    *   **Tab 2 (Host):** "Generate Room" button, Copy to Clipboard button, Viewer Counter.
*   **Content Script (The "Driver"):**
    *   **Host Mode:** Listens for DOM events (`play`, `pause`, `seeked`) on the HTML5 `<video>` element and emits them via WebSocket.
    *   **Viewer Mode:** Listens for WebSocket events and applies them to the DOM.
    *   **Ad Detection (YouTube Specific):**
        *   Detect if an ad is playing (check for `.ad-showing` or similar classes).
        *   **Logic:** If Ad is playing $\to$ Mute Sync $\to$ When Ad ends $\to$ Force Seek to Host's current time (Catch up).

### 3.2 Backend (Signaling Server)
*   **Tech Stack:** Node.js + Socket.io.
*   **Logic:** Stateless broadcasting. The server does not store video data, only Room IDs and temporary State.
*   **Events:**
    *   `join_room`: Adds socket to a room.
    *   `sync_event`: Broadcasts `{ action: 'play/pause/seek', timestamp: 120.5 }`.
    *   `url_change`: Broadcasts `{ newUrl: 'youtube.com/watch?v=...' }`.
    *   `room_info`: Returns current viewer count to Host.

## 4. Technical Architecture & Stack

### Frontend
*   **Framework:** Vanilla JS or React (Preact recommended for extension size).
*   **Communication:** WebSocket (Socket.io-client).
*   **Manifest Permissions:**
    *   `activeTab`: To access the current URL.
    *   `scripting`: To inject the sync logic.
    *   `storage`: To save the user's last Room ID.
    *   `host_permissions`: `*://*.youtube.com/*` (MVP), `*://*.netflix.com/*` (Post-MVP).

### Backend
*   **Runtime:** Node.js.
*   **Library:** Socket.io (handles reconnection and heartbeats automatically).
*   **Hosting (AWS):**
    *   **Service:** AWS App Runner (easiest for containerized Node apps) OR AWS Lightsail (cheapest fixed cost).
    *   **Why:** We need a persistent WebSocket connection, which works better on a running container than serverless Lambda functions.

## 5. Synchronization Logic (The "Algo")

To prevent "jitter" (video speeding up/slowing down constantly), we will use a **Threshold Approach**:

1.  **Host** sends heartbeat every 5 seconds OR on any state change (Pause/Seek).
2.  **Viewer** receives heartbeat `{ hostTime: 100, state: 'playing' }`.
3.  **Viewer Logic:**
    *   `diff = Math.abs(viewerVideo.currentTime - hostTime)`
    *   **If `diff` < 2 seconds:** Do nothing (Smooth experience).
    *   **If `diff` > 2 seconds:** `viewerVideo.currentTime = hostTime` (Hard sync).
    *   **If `hostState` != `viewerState`:** Force state change (e.g., if Host is paused, Viewer must pause).

## 6. Edge Cases to Handle
1.  **The Ad-block Dilemma:** If the Host has YouTube Premium (no ads) and Viewer has Free (ads).
    *   *Solution:* Viewer extension detects Ad. It effectively "pauses" sync listening. Once the Ad element disappears, it requests a `get_current_state` from the server and snaps to the Host's live location.
2.  **Buffering:**
    *   If Viewer buffers, they fall behind. The next heartbeat (5s later) will catch the >2s drift and snap them forward.
3.  **Tab Sleeping:**
    *   Browser puts background tabs to sleep.
    *   *Solution:* Use the `background.js` Service Worker to keep the WebSocket alive.

## 7. Development Phases

*   **Phase 1 (MVP):** YouTube Only. Play/Pause/Seek sync. Room Codes.
*   **Phase 2:** Netflix Support (Requires custom DOM selectors due to custom UI).
*   **Phase 3:** Chat integration or React Emoji overlays.

***