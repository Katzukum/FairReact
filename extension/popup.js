document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');
    const createBtn = document.getElementById('create-room-btn');
    const joinBtn = document.getElementById('join-room-btn');
    const leaveBtn = document.getElementById('leave-room-btn'); // New button we might need to add to HTML
    const roomIdDisplay = document.getElementById('generated-room-id');
    const roomIdInput = document.getElementById('room-id-input');
    const statusDiv = document.getElementById('status');
    const activeRoomContainer = document.getElementById('active-room-container'); // Container for active state
    const setupContainer = document.getElementById('setup-container'); // Container for setup state

    // Connect to background script
    const port = chrome.runtime.connect({ name: "popup" });

    // Initial status check
    port.postMessage({ type: 'get_status' });

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    port.onMessage.addListener((msg) => {
        if (msg.type === 'status_update') {
            updateUI(msg.state);
        } else if (msg.type === 'room_created') {
            roomIdDisplay.textContent = msg.roomId;
            statusDiv.textContent = "Room created! Share the ID.";
            // Re-fetch status to update UI state
            port.postMessage({ type: 'get_status' });
        } else if (msg.type === 'joined_room') {
            statusDiv.textContent = `Joined room: ${msg.roomId}`;
            // Re-fetch status to update UI state
            port.postMessage({ type: 'get_status' });
        } else if (msg.type === 'left_room') {
            statusDiv.textContent = "Left room.";
            // Re-fetch status to update UI state
            port.postMessage({ type: 'get_status' });
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

    // We need to add a leave button to the HTML or handle it here if it existed
    if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
            port.postMessage({ type: 'leave_room' });
        });
    }

    function updateUI(state) {
        if (state.roomId) {
            // We are in a room
            // Hide setup, show active status
            // Note: We might need to adjust HTML to support this toggling better
            // For now, let's just update the status text and maybe pre-fill fields
            statusDiv.textContent = `Active: ${state.role} in Room ${state.roomId}`;
            if (state.role === 'host') {
                roomIdDisplay.textContent = state.roomId;
            } else {
                roomIdInput.value = state.roomId;
            }
        } else {
            statusDiv.textContent = "Not connected.";
        }
    }
});
