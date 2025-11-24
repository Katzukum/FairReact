importScripts('socket.io.js');

const SERVER_URL = 'http://localhost:3000'; // Change this to your App Runner URL later
let socket = null;

// State
let state = {
    role: null, // 'host' | 'viewer' | null
    roomId: null,
    viewerWindowId: null,
    lastUrl: null
};

// Keep-Alive for Service Worker (Chrome)
const keepAliveInterval = setInterval(() => {
    // No-op to keep worker active
    // In a real production extension, you might use more robust keep-alive techniques
    // like opening a port to a dedicated offscreen document if this isn't enough.
    // For now, a simple interval + port communication usually helps.
}, 20000);

function connectSocket() {
    if (!socket) {
        socket = io(SERVER_URL, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true
        });

        socket.on('connect', () => {
            console.log('Connected to backend');
            // Re-join room if we were in one (handling service worker restarts)
            chrome.storage.local.get(['role', 'roomId'], (result) => {
                if (result.roomId) {
                    state.role = result.role;
                    state.roomId = result.roomId;
                    if (state.role === 'host') {
                        socket.emit('create_room', state.roomId);
                    } else if (state.role === 'viewer') {
                        socket.emit('join_room', state.roomId);
                    }
                }
            });
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from backend');
        });

        socket.on('receive_action', (data) => {
            // Forward to viewer window or active tab if we are a viewer
            if (state.role === 'viewer') {
                if (state.viewerWindowId) {
                    chrome.tabs.query({ windowId: state.viewerWindowId, active: true }, (tabs) => {
                        if (tabs[0]) {
                            chrome.tabs.sendMessage(tabs[0].id, { type: 'server_action', data: data });
                        }
                    });
                }
            }
        });

        socket.on('url_changed', (url) => {
            if (state.role === 'viewer') {
                openOrUpdateViewerWindow(url);
            }
        });
    }
}

connectSocket();

// Window Management for Viewer
function openOrUpdateViewerWindow(url) {
    if (state.viewerWindowId) {
        chrome.windows.get(state.viewerWindowId, (win) => {
            if (chrome.runtime.lastError || !win) {
                // Window was closed, create new
                createViewerWindow(url);
            } else {
                // Update existing
                chrome.tabs.query({ windowId: state.viewerWindowId, active: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.update(tabs[0].id, { url: url });
                    }
                });
            }
        });
    } else {
        createViewerWindow(url);
    }
}

function createViewerWindow(url) {
    chrome.windows.create({
        url: url,
        type: 'popup',
        focused: true,
        width: 1280,
        height: 720
    }, (win) => {
        state.viewerWindowId = win.id;
        // Mute the tab to allow autoplay (browser policy often blocks autoplay with sound)
        if (win.tabs && win.tabs[0]) {
            chrome.tabs.update(win.tabs[0].id, { muted: true });
        }
    });
}

// Clean up when viewer window is closed
chrome.windows.onRemoved.addListener((windowId) => {
    if (windowId === state.viewerWindowId) {
        state.viewerWindowId = null;
        // Optional: Leave room or just stay ready?
        // Let's stay in the room so if host changes URL again, it pops back up.
        // But if user wants to leave, they should use the popup.
    }
});

// Handle messages from Popup and Content Scripts
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "popup") {
        // Send current status immediately
        port.postMessage({ type: 'status_update', state: state });

        port.onMessage.addListener((msg) => {
            if (msg.type === 'create_room') {
                state.roomId = msg.roomId;
                state.role = 'host';
                socket.emit('create_room', msg.roomId);
                chrome.storage.local.set({ role: 'host', roomId: msg.roomId });
                port.postMessage({ type: 'room_created', roomId: msg.roomId });
            } else if (msg.type === 'join_room') {
                state.roomId = msg.roomId;
                state.role = 'viewer';
                socket.emit('join_room', msg.roomId);
                chrome.storage.local.set({ role: 'viewer', roomId: msg.roomId });
                port.postMessage({ type: 'joined_room', roomId: msg.roomId });
            } else if (msg.type === 'leave_room') {
                state.role = null;
                state.roomId = null;
                socket.emit('leave_room'); // Backend should handle this if implemented, or just stop listening
                chrome.storage.local.remove(['role', 'roomId']);
                port.postMessage({ type: 'left_room' });
            } else if (msg.type === 'get_status') {
                port.postMessage({ type: 'status_update', state: state });
            }
        });
    }
});

// Messages from Content Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'host_action') {
        if (state.role === 'host' && socket && state.roomId) {
            socket.emit('send_action', { ...request.data, roomId: state.roomId });
        }
    } else if (request.type === 'check_broadcast') {
        // Host is navigating, check if we should show toast
        if (state.role === 'host') {
            sendResponse({ shouldBroadcast: true, roomId: state.roomId });
        } else {
            sendResponse({ shouldBroadcast: false });
        }
    } else if (request.type === 'broadcast_url') {
        if (state.role === 'host' && socket && state.roomId) {
            socket.emit('url_changed', { roomId: state.roomId, url: request.url });
            state.lastUrl = request.url;
        }
    }
    return true; // Keep channel open for async response
});

// Monitor Tab Switching and Updates
chrome.tabs.onActivated.addListener((activeInfo) => {
    if (state.role === 'host') {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
            if (tab && tab.url && tab.url.includes('youtube.com/watch')) {
                chrome.tabs.sendMessage(activeInfo.tabId, { type: 'trigger_check_broadcast' });
            }
        });
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (state.role === 'host' && changeInfo.status === 'complete') {
        if (tab.url && tab.url.includes('youtube.com/watch')) {
            chrome.tabs.sendMessage(tabId, { type: 'trigger_check_broadcast' });
        }
    }
});
