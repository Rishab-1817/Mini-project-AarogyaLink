// telemedicine-call.js
// Provides startVideoCall(roomId, userName) and UI wiring for a simple Jitsi embed.

let api = null;

function startVideoCall(roomId, userName) {
  if (!window.JitsiMeetExternalAPI) {
    alert('Jitsi Meet API not loaded. Check your internet connection.');
    return null;
  }

  // Dispose existing session if any
  if (api) {
    try { api.dispose(); } catch (e) { /* ignore */ }
    api = null;
  }

  const domain = 'meet.jit.si';
  const options = {
    roomName: roomId,
    parentNode: document.getElementById('video-call'),
    userInfo: { displayName: userName || 'Guest' },
    configOverwrite: { prejoinPageEnabled: false },
    interfaceConfigOverwrite: {
      // Keep toolbar compact but include basic controls
      TOOLBAR_BUTTONS: [
        'microphone','camera','desktop','fullscreen','fodeviceselection','hangup','chat','tileview'
      ]
    }
  };

  api = new JitsiMeetExternalAPI(domain, options);

  // Enable UI control buttons
  setControlsEnabled(true);

  // When the meeting is readyToClose (user presses hangup), clean up
  api.addEventListener('readyToClose', () => {
    endCall();
  });

  return api;
}

function setControlsEnabled(enabled) {
  document.getElementById('toggleAudio').disabled = !enabled;
  document.getElementById('toggleVideo').disabled = !enabled;
  document.getElementById('leaveBtn').disabled = !enabled;
}

function toggleAudio() {
  if (!api) return;
  api.executeCommand('toggleAudio');
}

function toggleVideo() {
  if (!api) return;
  api.executeCommand('toggleVideo');
}

function endCall() {
  if (api) {
    try { api.executeCommand('hangup'); } catch (e) { /* ignore */ }
    try { api.dispose(); } catch (e) { /* ignore */ }
    api = null;
  }
  setControlsEnabled(false);
  document.getElementById('joinBtn').disabled = false;
  document.getElementById('leaveBtn').disabled = true;
}

// --- Wiring UI actions ---
document.addEventListener('DOMContentLoaded', () => {
  const genBtn = document.getElementById('genBtn');
  const copyBtn = document.getElementById('copyBtn');
  const joinBtn = document.getElementById('joinBtn');
  const leaveBtn = document.getElementById('leaveBtn');
  const toggleAudioBtn = document.getElementById('toggleAudio');
  const toggleVideoBtn = document.getElementById('toggleVideo');

  genBtn.addEventListener('click', () => {
    const docId = (document.getElementById('doctorId').value || '').trim();
    const patId = (document.getElementById('patientId').value || '').trim();
    if (!docId || !patId) {
      alert('Please enter both Doctor ID and Patient ID to generate a room.');
      return;
    }

    // Generate unique, hard-to-guess room ID
    const roomId = `doc_${sanitizeId(docId)}_pat_${sanitizeId(patId)}_${Date.now()}`;
    const roomText = document.getElementById('roomIdText');
    const roomLink = document.getElementById('roomLink');
    roomText.textContent = roomId;
    const url = `${location.origin}${location.pathname.replace(/\/[^\/]*$/, '')}/${'telemedicine-call.html'}?room=${encodeURIComponent(roomId)}`;
    // Use meet.jit.si direct link as well for sharing
    roomLink.href = `https://meet.jit.si/${encodeURIComponent(roomId)}`;
    roomLink.textContent = roomLink.href;
    copyBtn.disabled = false;
    joinBtn.disabled = false;
    // Put room into URL query for convenience
    history.replaceState(null, '', `?room=${encodeURIComponent(roomId)}`);
  });

  copyBtn.addEventListener('click', async () => {
    const roomLink = document.getElementById('roomLink').href;
    try {
      await navigator.clipboard.writeText(roomLink);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy Link'), 1500);
    } catch (e) {
      alert('Copy failed. Link: ' + roomLink);
    }
  });

  joinBtn.addEventListener('click', async () => {
    const roomText = document.getElementById('roomIdText').textContent;
    const name = (document.getElementById('yourName').value || '').trim() || 'Guest';
    if (!roomText || roomText === '—') {
      alert('Generate a room first or enter a room ID in the URL (query param `room`).');
      return;
    }

    // Ask for camera & microphone permission first
    const allowed = await ensureMediaPermissions();
    if (!allowed) {
      alert('Camera and microphone permissions are required to start the call.');
      return;
    }

    // Start the embedded call
    startVideoCall(roomText, name);
    joinBtn.disabled = true;
    leaveBtn.disabled = false;
  });

  leaveBtn.addEventListener('click', () => {
    endCall();
  });

  toggleAudioBtn.addEventListener('click', () => toggleAudio());
  toggleVideoBtn.addEventListener('click', () => toggleVideo());

  // If a room param is present in URL, prefill room and enable join
  const params = new URLSearchParams(location.search);
  const roomParam = params.get('room');
  if (roomParam) {
    const roomTextEl = document.getElementById('roomIdText');
    const roomLinkEl = document.getElementById('roomLink');
    roomTextEl.textContent = roomParam;
    roomLinkEl.href = `https://meet.jit.si/${encodeURIComponent(roomParam)}`;
    roomLinkEl.textContent = roomLinkEl.href;
    document.getElementById('copyBtn').disabled = false;
    document.getElementById('joinBtn').disabled = false;

    // Try to request permissions and auto-join if allowed
    (async () => {
      const allowed = await ensureMediaPermissions();
      if (allowed) {
        const name = (document.getElementById('yourName').value || '').trim() || 'Guest';
        startVideoCall(roomParam, name);
        document.getElementById('joinBtn').disabled = true;
        document.getElementById('leaveBtn').disabled = false;
      }
    })();
  }
});

// Request camera & microphone permissions. Returns true if granted.
async function ensureMediaPermissions() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    // stop acquired tracks immediately so Jitsi can acquire them when it initializes
    try { stream.getTracks().forEach(t => t.stop()); } catch (e) { /* ignore */ }
    return true;
  } catch (err) {
    return false;
  }
}

function sanitizeId(s) {
  return s.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
}

// Export for external usage
window.startVideoCall = startVideoCall;
window.endCall = endCall;