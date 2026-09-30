/**
 * LinkSwap YT - Service Worker (Manifest V3)
 * Manages OAuth2 token lifecycles, background execution, and side panel routing.
 */

// Handle installation and updates
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[LinkSwap YT] Extension installed or updated:', details.reason);

  // Initialize default storage if not present
  const current = await chrome.storage.sync.get(['isPro', 'freeTrialUsed']);
  if (current.isPro === undefined) {
    await chrome.storage.sync.set({ isPro: false, freeTrialUsed: false });
  }

  // Configure side panel behavior if supported
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    try {
      // Keep popup as primary action, sidepanel openable on demand or from Studio
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    } catch (e) {
      console.warn('Could not setPanelBehavior:', e);
    }
  }
});

// Listen for messages from content scripts, popup, or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG', time: Date.now() });
    return true;
  }

  // Open side panel triggered from YouTube Studio content script or popup
  if (message.type === 'OPEN_SIDE_PANEL') {
    (async () => {
      try {
        let windowId = sender.tab?.windowId;
        if (!windowId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          windowId = activeTab?.windowId;
        }

        if (windowId && chrome.sidePanel && chrome.sidePanel.open) {
          await chrome.sidePanel.open({ windowId });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'SidePanel API not supported or window not found' });
        }
      } catch (err: any) {
        console.error('Error opening side panel:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep message channel open for async response
  }

  // Get OAuth token via identity API
  if (message.type === 'GET_OAUTH_TOKEN') {
    (async () => {
      try {
        chrome.identity.getAuthToken({ interactive: message.interactive ?? true }, (token) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true, token });
          }
        });
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // Invalidate cached OAuth token
  if (message.type === 'REVOKE_OAUTH_TOKEN' && message.token) {
    (async () => {
      try {
        chrome.identity.removeCachedAuthToken({ token: message.token }, () => {
          sendResponse({ success: true });
        });
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  return false;
});
