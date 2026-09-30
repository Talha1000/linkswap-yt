/**
 * LinkSwap YT - Injected Content Script for YouTube Studio (studio.youtube.com)
 * Renders a tactile floating clutch trigger launcher that activates the side panel workspace.
 */

function initLinkSwapLauncher(): void {
  // Guard against duplicate injections
  if (document.getElementById('linkswap-yt-root')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'linkswap-yt-root';

  const triggerButton = document.createElement('button');
  triggerButton.className = 'linkswap-trigger-btn';
  triggerButton.setAttribute('title', 'Open LinkSwap YT Workspace');

  triggerButton.innerHTML = `
    <div class="linkswap-icon-container">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
    </div>
    <span class="linkswap-text">LinkSwap</span>
    <span class="linkswap-badge">Studio</span>
    <div class="linkswap-pulse-dot"></div>
  `;

  // Click handler to open the side panel
  triggerButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Haptic bounce feeling
    triggerButton.style.transform = 'scale(0.92)';
    setTimeout(() => {
      triggerButton.style.transform = '';
    }, 150);

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' }, (res) => {
          if (chrome.runtime.lastError) {
            console.log('[LinkSwap YT] Fallback notification:', chrome.runtime.lastError.message);
          }
        });
      }
    } catch (err) {
      console.error('[LinkSwap YT] Error messaging background:', err);
    }
  });

  // Make draggable or position adjustable if needed
  container.appendChild(triggerButton);
  document.body.appendChild(container);
  console.log('[LinkSwap YT] Studio Clutch Launcher loaded successfully.');
}

// Initialise on idle or navigation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLinkSwapLauncher);
} else {
  initLinkSwapLauncher();
}

// Observe dynamic SPA navigation within YouTube Studio
let currentUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    initLinkSwapLauncher();
  }
});
observer.observe(document.body || document.documentElement, { subtree: true, childList: true });
