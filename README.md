<div align="center">
  <img src="./icon.png" alt="FairReact Logo" width="120" height="120" />
  <h1>FairReact</h1>
  <p><strong>React without the Strike.</strong></p>
  <p>The ethical, cross-browser synchronization engine for the Creator Economy.</p>

  <p>
    <a href="#features">Features</a> •
    <a href="#how-it-works">How It Works</a> •
    <a href="#installation">Installation</a> •
    <a href="#tech-stack">Tech Stack</a>
  </p>

  ![FairReact Banner](./banner.png)
</div>

---

## 🚀 Overview

**FairReact** is a browser extension and signaling server designed to solve the copyright crisis in "Reaction Content." It enables streamers to host **Watch Parties** where video synchronization happens via metadata, not screen sharing.

By triggering the video to load locally on every viewer’s browser, FairReact ensures the original content creator receives legitimate views, watch time, and ad revenue. This transforms reaction content from a legal liability into a mutually beneficial collaboration.

## ✨ Features

- **One-to-Many Sync**: A single Host controls playback for thousands of Viewers in real-time.
- **Cross-Browser Support**: Seamless synchronization between Chrome (Manifest V3) and Firefox users.
- **Smart Sync Algorithm**: Threshold-based syncing prevents audio jitter by only correcting drift > 2 seconds.
- **Ad-Awareness**: Intelligent detection of YouTube ads ensures viewers don't lose sync during ad breaks.
- **Persistent Connection**: Robust WebSocket handling keeps the connection alive even when tabs are backgrounded.
- **Privacy First**: No video data is ever proxied. Only timestamp and state metadata are transmitted.

## 🛠️ How It Works

1.  **Host (Streamer)**: Creates a room via the extension. A unique 6-character code is generated.
2.  **Viewer**: Enters the code to join the room.
3.  **Sync**: When the Host plays, pauses, or seeks, the action is broadcast to all Viewers.
4.  **Playback**: The video plays natively on the Viewer's machine. If the Host watches a YouTube video, the Viewer's extension automatically navigates to that same URL and syncs the time.

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- Google Chrome or Mozilla Firefox

### 1. Backend (Signaling Server)

The backend handles the WebSocket connections for room management.

```bash
# Clone the repository
git clone https://github.com/yourusername/fairreact.git
cd fairreact/backend

# Install dependencies
npm install

# Start the server
npm start
# Server runs on http://localhost:3000
```

### 2. Extension (Chrome)

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (top right toggle).
3.  Click **Load unpacked**.
4.  Select the `fairreact/extension` directory.

### 3. Extension (Firefox)

1.  Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2.  Click **Load Temporary Add-on...**.
3.  Select the `manifest.json` file inside the `fairreact/extension-firefox` directory.

## 💻 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (Manifest V3)
- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.io (WebSockets)
- **DevOps**: Docker support for containerized deployment

## 🛑 Project Status & Post-Mortem

This project was developed as a functional prototype to explore ethical reaction content. While the technology works, the project was not taken to production due to three critical product friction points identified during the feasibility study:

1.  **The "Streamer as IT Support" Problem**: If a streamer has to spend time explaining how to fix the extension to even a small percentage of viewers, the entertainment value ("the vibe") is lost.
2.  **The Mobile Wall**: With >50% of viewership on mobile devices, a browser-extension-only solution excludes half the audience immediately.
3.  **The Physics of Comedy**: The latency mismatch between the local video player and the streamer's broadcast delay makes real-time reacting nearly impossible. If the streamer laughs 10 seconds after the viewer sees the joke, the shared experience is broken.

**Conclusion**: The DMCA problem is real, but a client-side extension adds too much friction. The ideal solution requires native server-side integration by platforms (YouTube/Twitch) or a dedicated "Watch Party" API.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ for the Creator Economy.</sub>
</div>
