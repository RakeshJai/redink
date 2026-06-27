document.addEventListener('DOMContentLoaded', async () => {
  const toggleBtn = document.getElementById('toggle-btn');
  const statusDiv = document.getElementById('status');

  // Hardcode credentials in local storage automatically (ponytail: frictionless hackathon setup)
  await chrome.storage.local.set({
    deepgram_key: 'cfd40e8fbbffb716dad232d552ad2315fd8bfcdc',
    featherless_key: 'rc_3c90c882aac9f563f974a7e1c58496991bf23c2d8a17e9094eab8a93db346d0a',
    model_name: 'Qwen/Qwen2.5-3B-Instruct'
  });

  const res = await chrome.storage.local.get(['session_active']);
  let sessionActive = !!res.session_active;
  updateUI(sessionActive);

  // Sync popup status dynamically when session_active changes in local storage
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.session_active) {
      sessionActive = !!changes.session_active.newValue;
      updateUI(sessionActive);
    }
  });

  // Toggle session
  toggleBtn.addEventListener('click', async () => {
    if (!sessionActive) {

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
          alert('No active tab found.');
          return;
        }

        const url = tab.url || '';
        if (
          url.startsWith('chrome://') ||
          url.startsWith('chrome-extension://') ||
          url.startsWith('https://chrome.google.com/webstore') ||
          url.startsWith('https://chromewebstore.google.com')
        ) {
          alert('Recording is restricted on this tab.');
          return;
        }

        // Request stream ID (must be inside user gesture)
        chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, (streamId) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            alert('Failed to capture tab audio: ' + chrome.runtime.lastError.message);
            return;
          }

          if (!streamId) {
            alert('Failed to get stream ID.');
            return;
          }

          // Clear logs and verdicts in local storage first (ponytail: state initialization)
          chrome.storage.local.set({ session_logs: [], session_verdicts: [] }, () => {
            // Send message to background.js to start offscreen capturing
            chrome.runtime.sendMessage({
              action: 'startSession',
              streamId: streamId,
              tabId: tab.id
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                alert('Service worker is unresponsive or the action failed: ' + chrome.runtime.lastError.message);
                return;
              }
              if (response && response.success) {
                sessionActive = true;
                chrome.storage.local.set({ session_active: true });
                updateUI(true);
              } else {
                alert('Failed to start session: ' + (response?.error || 'Unknown error'));
              }
            });
          });
        });
      } catch (err) {
        console.error(err);
        alert('Error starting session: ' + err.message);
      }
    } else {
      // Send message to background.js to stop capturing
      chrome.runtime.sendMessage({ action: 'stopSession' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          alert('Service worker is unresponsive or the action failed: ' + chrome.runtime.lastError.message);
          return;
        }
        if (response && response.success) {
          sessionActive = false;
          chrome.storage.local.set({ session_active: false });
          updateUI(false);
        } else {
          alert('Failed to stop session: ' + (response?.error || 'Unknown error'));
        }
      });
    }
  });

  function updateUI(active) {
    if (active) {
      toggleBtn.textContent = 'Stop Session';
      toggleBtn.classList.add('active');
      statusDiv.textContent = 'Status: Live Fact-Checking Active';
      statusDiv.className = 'status active';
    } else {
      toggleBtn.textContent = 'Start Session';
      toggleBtn.classList.remove('active');
      statusDiv.textContent = 'Status: Idle';
      statusDiv.className = 'status idle';
    }
  }
});
