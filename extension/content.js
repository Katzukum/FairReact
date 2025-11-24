let role = null;
let roomId = null;
let video = null;
let isSyncing = false;
let eventListenersAttached = false;

// Initialize
chrome.storage.local.get(['role', 'roomId'], (result) => {
    role = result.role;
    roomId = result.roomId;
    console.log('FairReact initialized. Role:', role, 'Room:', roomId);
    findVideo();

    // Check if we should show broadcast toast (Host only)
    checkBroadcast();
});

// Listen for storage changes from background script
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
        let roleChanged = false;
        let roomIdChanged = false;

        if (changes.role) {
            role = changes.role.newValue;
            roleChanged = true;
            console.log('Role updated to:', role);
        }

        if (changes.roomId) {
            roomId = changes.roomId.newValue;
            roomIdChanged = true;
            console.log('RoomId updated to:', roomId);
        }

        // If role or roomId changed, update listeners
        if (roleChanged || roomIdChanged) {
            setupListeners();

            // Show broadcast toast if we just became a host
            if (role === 'host' && roleChanged) {
                checkBroadcast();
            }
        }
    }
});

function findVideo() {
    const checkVideo = setInterval(() => {
        video = document.querySelector('video');
        if (video) {
            clearInterval(checkVideo);
            console.log('Video found');
            setupListeners();
        }
    }, 1000);
}

function checkBroadcast() {
    // Ask background if we are host and should broadcast
    chrome.runtime.sendMessage({ type: 'check_broadcast' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error checking broadcast:', chrome.runtime.lastError);
            return;
        }
        if (response && response.shouldBroadcast) {
            showBroadcastToast(response.roomId);
        }
    });
}

function showBroadcastToast(roomId) {
    // Create Shadow DOM for isolation
    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.top = '20px';
    host.style.right = '20px';
    host.style.zIndex = '999999';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    const container = document.createElement('div');
    container.style.background = '#333';
    container.style.color = '#fff';
    container.style.padding = '15px';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';

    const text = document.createElement('div');
    text.textContent = `Broadcast this video to Room ${roomId}?`;
    text.style.fontWeight = 'bold';

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '10px';

    const btnYes = document.createElement('button');
    btnYes.textContent = 'Broadcast';
    btnYes.style.background = '#4CAF50';
    btnYes.style.color = 'white';
    btnYes.style.border = 'none';
    btnYes.style.padding = '8px 16px';
    btnYes.style.borderRadius = '4px';
    btnYes.style.cursor = 'pointer';

    const btnNo = document.createElement('button');
    btnNo.textContent = 'Dismiss';
    btnNo.style.background = '#f44336';
    btnNo.style.color = 'white';
    btnNo.style.border = 'none';
    btnNo.style.padding = '8px 16px';
    btnNo.style.borderRadius = '4px';
    btnNo.style.cursor = 'pointer';

    btnYes.onclick = () => {
        chrome.runtime.sendMessage({ type: 'broadcast_url', url: window.location.href }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error broadcasting URL:', chrome.runtime.lastError);
            }
        });
        host.remove();
    };

    btnNo.onclick = () => {
        host.remove();
    };

    btnContainer.appendChild(btnYes);
    btnContainer.appendChild(btnNo);
    container.appendChild(text);
    container.appendChild(btnContainer);
    shadow.appendChild(container);
}

// Event handler functions that we can add/remove
const playHandler = () => sendAction('play');
const pauseHandler = () => sendAction('pause');
const seekedHandler = () => sendAction('seek');

function setupListeners() {
    if (!video) return; // Video not found yet

    // Remove existing listeners first to avoid duplicates
    video.removeEventListener('play', playHandler);
    video.removeEventListener('pause', pauseHandler);
    video.removeEventListener('seeked', seekedHandler);
    eventListenersAttached = false;

    // Host logic: Send actions
    if (role === 'host') {
        video.addEventListener('play', playHandler);
        video.addEventListener('pause', pauseHandler);
        video.addEventListener('seeked', seekedHandler);
        eventListenersAttached = true;
        console.log('Host event listeners attached');
    } else {
        console.log('Not host, event listeners removed');
    }
}

// Listen for messages from background (from server) - set up once
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'server_action') {
        handleServerAction(request.data);
    } else if (request.type === 'trigger_check_broadcast') {
        // Background detected tab switch or navigation
        if (role === 'host') {
            checkBroadcast();
        }
    }
});

// Handle YouTube SPA Navigation
document.addEventListener('yt-navigate-finish', () => {
    console.log('YouTube navigation detected');
    // Re-find video and re-attach listeners
    video = null;
    eventListenersAttached = false;
    findVideo();

    // Check if we should broadcast this new video
    if (role === 'host') {
        checkBroadcast();
    }
});

function sendAction(action) {
    if (isSyncing) return; // Avoid loops
    if (document.querySelector('.ad-showing')) return; // Ignore ads

    const data = {
        action: action,
        timestamp: video.currentTime,
        playbackRate: video.playbackRate
    };
    chrome.runtime.sendMessage({ type: 'host_action', data: data }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error sending action:', chrome.runtime.lastError);
        }
    });
}

function handleServerAction(data) {
    if (document.querySelector('.ad-showing')) return; // Ignore if ad is showing

    isSyncing = true;
    const { action, timestamp, playbackRate } = data;

    if (action === 'play') {
        if (Math.abs(video.currentTime - timestamp) > 0.5) {
            video.currentTime = timestamp;
        }
        video.play().catch(e => console.log('Autoplay blocked', e));
    } else if (action === 'pause') {
        video.pause();
        video.currentTime = timestamp;
    } else if (action === 'seek') {
        // Only seek if diff > 2s
        if (Math.abs(video.currentTime - timestamp) > 2) {
            video.currentTime = timestamp;
        }
    }

    if (playbackRate) {
        video.playbackRate = playbackRate;
    }

    setTimeout(() => { isSyncing = false; }, 500); // Debounce
}
