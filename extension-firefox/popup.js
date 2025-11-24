document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');
    const createBtn = document.getElementById('create-room-btn');
    const joinBtn = document.getElementById('join-room-btn');
    const roomIdDisplay = document.getElementById('generated-room-id');
    const roomIdInput = document.getElementById('room-id-input');
    const statusDiv = document.getElementById('status');

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    // Connect to background script
    const port = chrome.runtime.connect({ name: "popup" });

    port.onMessage.addListener((msg) => {
        if (msg.type === 'status') {
            statusDiv.textContent = msg.text;
        } else if (msg.type === 'room_created') {
            roomIdDisplay.textContent = msg.roomId;
            statusDiv.textContent = "Room created! Share the ID.";
        } else if (msg.type === 'joined_room') {
            statusDiv.textContent = `Joined room: ${msg.roomId}`;
        }
    });

    createBtn.addEventListener('click', () => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        port.postMessage({ type: 'create_room', roomId: roomId });
    });

    joinBtn.addEventListener('click', () => {
        const roomId = roomIdInput.value.trim();
        if (roomId) {
            port.postMessage({ type: 'join_room', roomId: roomId });
        }
    });
});
