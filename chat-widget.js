/**
 * Chat Widget for PocketBase
 *
 * Drop-in chat widget that sends messages to PocketBase.
 *
 * Usage:
 *   <script src="chat-widget.js"></script>
 *
 * Configuration (data attributes):
 *   data-pb              - PocketBase URL (default: https://pocketbase.eleven89.org)
 *   data-header          - Header text (default: "Chat with us")
 *   data-placeholder     - Input placeholder (default: "Type a message...")
 *   data-position        - Position: "right" or "left" (default: right)
 *   data-greeting        - Greeting message shown on first open
 *
 * Appearance options:
 *   data-color             - Primary color for button, header, user messages (default: #007bff)
 *   data-color-text        - Text color on primary backgrounds (default: #ffffff)
 *   data-color-bg          - Panel background color (default: #ffffff)
 *   data-color-assistant   - Assistant message bubble color (default: #ffffff)
 *   data-color-assistant-text - Assistant message text color (default: #333333)
 *   data-button-size       - Toggle button size in pixels (default: 60)
 *   data-panel-width       - Panel width in pixels (default: 350)
 *   data-border-radius     - Border radius in pixels (default: 16)
 *   data-offset-x          - Horizontal offset from edge in pixels (default: 20)
 *   data-offset-y          - Vertical offset from bottom in pixels (default: 20)
 *   data-font-family       - Custom font family (default: system fonts)
 *   data-shadow            - Shadow style: "none", "small", "medium", "large" (default: medium)
 *   data-z-index           - Z-index for the widget (default: 99999)
 *
 * Auto-open options:
 *   data-auto-open         - Auto-open chat after delay (default: false)
 *   data-auto-open-delay   - Seconds to wait before auto-opening (default: 5)
 *   data-auto-open-once    - Only auto-open once per session (default: true)
 *   data-auto-open-message - Message shown when auto-opening (uses greeting if not set)
 *   data-start-open        - Start with panel open immediately (default: false)
 *   data-cooldown          - Hours to wait before auto-opening again after dismiss (default: 0)
 *
 * Trigger options:
 *   data-open-on-scroll  - Open when user scrolls X% down the page (e.g., "50")
 *   data-open-on-exit    - Open on exit intent when mouse leaves viewport (default: false)
 *
 * Display options:
 *   data-pulse           - Show pulse animation on toggle button (default: false)
 *   data-mobile          - Show on mobile devices (default: true)
 */
(function() {
  'use strict';

  const script = document.currentScript;

  // Parse boolean attributes
  function parseBool(value, defaultValue) {
    if (value === undefined || value === null) return defaultValue;
    return value === 'true' || value === '1';
  }

  // Parse number attributes
  function parseNum(value, defaultValue) {
    if (value === undefined || value === null) return defaultValue;
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }

  // Shadow presets
  const shadows = {
    none: 'none',
    small: '0 2px 8px rgba(0,0,0,0.1)',
    medium: '0 5px 40px rgba(0,0,0,0.16)',
    large: '0 10px 60px rgba(0,0,0,0.25)'
  };

  const config = {
    // Basic options
    pbUrl: script.dataset.pb || 'https://pocketbase.eleven89.org',
    header: script.dataset.header || 'Chat with us',
    placeholder: script.dataset.placeholder || 'Type a message...',
    position: script.dataset.position || 'right',
    greeting: script.dataset.greeting || '',

    // Appearance options
    color: script.dataset.color || '#007bff',
    colorText: script.dataset.colorText || '#ffffff',
    colorBg: script.dataset.colorBg || '#ffffff',
    colorAssistant: script.dataset.colorAssistant || '#ffffff',
    colorAssistantText: script.dataset.colorAssistantText || '#333333',
    buttonSize: parseNum(script.dataset.buttonSize, 60),
    panelWidth: parseNum(script.dataset.panelWidth, 350),
    borderRadius: parseNum(script.dataset.borderRadius, 16),
    offsetX: parseNum(script.dataset.offsetX, 20),
    offsetY: parseNum(script.dataset.offsetY, 20),
    fontFamily: script.dataset.fontFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
    shadow: shadows[script.dataset.shadow] || shadows.medium,
    zIndex: parseNum(script.dataset.zIndex, 99999),

    // Auto-open options
    autoOpen: parseBool(script.dataset.autoOpen, false),
    autoOpenDelay: parseNum(script.dataset.autoOpenDelay, 5),
    autoOpenOnce: parseBool(script.dataset.autoOpenOnce, true),
    autoOpenMessage: script.dataset.autoOpenMessage || '',
    startOpen: parseBool(script.dataset.startOpen, false),
    cooldown: parseNum(script.dataset.cooldown, 0),

    // Trigger options
    openOnScroll: parseNum(script.dataset.openOnScroll, 0),
    openOnExit: parseBool(script.dataset.openOnExit, false),

    // Display options
    pulse: parseBool(script.dataset.pulse, false),
    mobile: parseBool(script.dataset.mobile, true)
  };

  const WIDGET_ID = 'atw-chat-widget';
  const STORAGE_KEY = 'atw_chat_session_id';
  const DISMISSED_KEY = 'atw_chat_dismissed';
  const AUTO_OPENED_KEY = 'atw_chat_auto_opened';

  // State
  let sessionId = null;
  let isOpen = false;
  let hasAutoOpened = false;
  let hasTriggeredScroll = false;
  let hasTriggeredExit = false;
  const messages = [];

  // Check if mobile device
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Check if within cooldown period
  function isInCooldown() {
    if (config.cooldown <= 0) return false;
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (!dismissed) return false;
      const dismissedTime = parseInt(dismissed, 10);
      const cooldownMs = config.cooldown * 60 * 60 * 1000;
      return Date.now() - dismissedTime < cooldownMs;
    } catch (e) {
      return false;
    }
  }

  // Record dismissal time
  function recordDismissal() {
    if (config.cooldown > 0) {
      try {
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
      } catch (e) {}
    }
  }

  // Check if already auto-opened this session
  function hasAutoOpenedThisSession() {
    if (!config.autoOpenOnce) return false;
    try {
      return sessionStorage.getItem(AUTO_OPENED_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  // Record that we auto-opened
  function recordAutoOpened() {
    try {
      sessionStorage.setItem(AUTO_OPENED_KEY, 'true');
    } catch (e) {}
  }

  // Inject styles
  function injectStyles() {
    const btnSize = config.buttonSize;
    const panelBottom = btnSize + 10;
    const iconSize = Math.round(btnSize * 0.47);
    const msgRadius = Math.max(config.borderRadius - 4, 8);

    const style = document.createElement('style');
    style.textContent = `
      #${WIDGET_ID} {
        position: fixed;
        bottom: ${config.offsetY}px;
        ${config.position}: ${config.offsetX}px;
        font-family: ${config.fontFamily};
        z-index: ${config.zIndex};
        line-height: 1.4;
      }
      #${WIDGET_ID} * {
        box-sizing: border-box;
      }
      #${WIDGET_ID}-toggle {
        width: ${btnSize}px;
        height: ${btnSize}px;
        border-radius: 50%;
        background: ${config.color};
        color: ${config.colorText};
        border: none;
        cursor: pointer;
        font-size: ${iconSize}px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #${WIDGET_ID}-toggle:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }
      #${WIDGET_ID}-toggle:active {
        transform: scale(0.95);
      }
      #${WIDGET_ID}-toggle.pulse {
        animation: ${WIDGET_ID}-pulse 2s infinite;
      }
      @keyframes ${WIDGET_ID}-pulse {
        0% { box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 0 0 ${config.color}66; }
        70% { box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 0 15px ${config.color}00; }
        100% { box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 0 0 ${config.color}00; }
      }
      #${WIDGET_ID}-panel {
        position: absolute;
        bottom: ${panelBottom}px;
        ${config.position}: 0;
        width: ${config.panelWidth}px;
        max-width: calc(100vw - ${config.offsetX * 2}px);
        background: ${config.colorBg};
        border-radius: ${config.borderRadius}px;
        box-shadow: ${config.shadow};
        overflow: hidden;
        display: none;
        flex-direction: column;
        max-height: 500px;
      }
      #${WIDGET_ID}-panel.open {
        display: flex;
        animation: ${WIDGET_ID}-slideUp 0.3s ease;
      }
      @keyframes ${WIDGET_ID}-slideUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #${WIDGET_ID}-header {
        background: ${config.color};
        color: ${config.colorText};
        padding: 16px 20px;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #${WIDGET_ID}-close {
        background: none;
        border: none;
        color: ${config.colorText};
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        opacity: 0.8;
      }
      #${WIDGET_ID}-close:hover {
        opacity: 1;
      }
      #${WIDGET_ID}-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        min-height: 250px;
        max-height: 350px;
        background: ${config.colorBg};
      }
      .${WIDGET_ID}-msg {
        margin-bottom: 12px;
        padding: 10px 14px;
        border-radius: ${msgRadius}px;
        max-width: 85%;
        word-wrap: break-word;
        font-size: 14px;
      }
      .${WIDGET_ID}-msg.user {
        background: ${config.color};
        color: ${config.colorText};
        margin-left: auto;
        border-bottom-right-radius: 4px;
      }
      .${WIDGET_ID}-msg.assistant {
        background: ${config.colorAssistant};
        color: ${config.colorAssistantText};
        border: 1px solid rgba(0,0,0,0.1);
        margin-right: auto;
        border-bottom-left-radius: 4px;
      }
      .${WIDGET_ID}-msg.system {
        background: transparent;
        color: #666;
        text-align: center;
        font-size: 13px;
        max-width: 100%;
      }
      #${WIDGET_ID}-input-area {
        display: flex;
        padding: 12px;
        border-top: 1px solid rgba(0,0,0,0.1);
        background: ${config.colorBg};
        gap: 8px;
      }
      #${WIDGET_ID}-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid rgba(0,0,0,0.15);
        border-radius: 24px;
        outline: none;
        font-size: 14px;
        font-family: inherit;
        background: ${config.colorBg};
        color: ${config.colorAssistantText};
        transition: border-color 0.2s;
      }
      #${WIDGET_ID}-input:focus {
        border-color: ${config.color};
      }
      #${WIDGET_ID}-input::placeholder {
        color: rgba(0,0,0,0.4);
      }
      #${WIDGET_ID}-send {
        padding: 12px 20px;
        background: ${config.color};
        color: ${config.colorText};
        border: none;
        border-radius: 24px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        font-family: inherit;
        transition: opacity 0.2s;
      }
      #${WIDGET_ID}-send:hover {
        opacity: 0.9;
      }
      #${WIDGET_ID}-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      @media (max-width: 480px) {
        #${WIDGET_ID}-panel {
          width: calc(100vw - ${config.offsetX * 2}px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Inject HTML
  function injectWidget() {
    const iconSize = Math.round(config.buttonSize * 0.47);
    const widget = document.createElement('div');
    widget.id = WIDGET_ID;
    widget.innerHTML = `
      <div id="${WIDGET_ID}-panel">
        <div id="${WIDGET_ID}-header">
          <span>${escapeHtml(config.header)}</span>
          <button id="${WIDGET_ID}-close" aria-label="Close chat">&times;</button>
        </div>
        <div id="${WIDGET_ID}-messages"></div>
        <div id="${WIDGET_ID}-input-area">
          <input id="${WIDGET_ID}-input" type="text" placeholder="${escapeHtml(config.placeholder)}" autocomplete="off">
          <button id="${WIDGET_ID}-send">Send</button>
        </div>
      </div>
      <button id="${WIDGET_ID}-toggle" aria-label="Open chat" class="${config.pulse ? 'pulse' : ''}">
        <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    `;
    document.body.appendChild(widget);
    return widget;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Create session
  async function createSession() {
    try {
      const res = await fetch(`${config.pbUrl}/api/collections/chat_sessions/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      sessionId = data.id;
      try {
        sessionStorage.setItem(STORAGE_KEY, sessionId);
      } catch (e) {}
      return sessionId;
    } catch (err) {
      console.error('[Chat Widget] Session creation failed:', err);
      return null;
    }
  }

  // Ensure session exists
  async function ensureSession() {
    if (sessionId) return sessionId;
    return await createSession();
  }

  // Restore session from storage
  function restoreSession() {
    try {
      sessionId = sessionStorage.getItem(STORAGE_KEY);
    } catch (e) {}
  }

  // Send message to PocketBase
  async function sendMessage(content) {
    content = content.trim();
    if (!content) return;

    const sid = await ensureSession();
    if (!sid) {
      addMessage('Unable to connect. Please try again.', 'system');
      return;
    }

    // Add to UI immediately
    addMessage(content, 'user');

    try {
      const res = await fetch(`${config.pbUrl}/api/collections/chat_messages/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: sid,
          content: content,
          role: 'user'
        })
      });
      if (!res.ok) throw new Error('Failed to send message');
    } catch (err) {
      console.error('[Chat Widget] Failed to send message:', err);
      addMessage('Message failed to send. Please try again.', 'system');
    }
  }

  // Add message to UI
  function addMessage(content, role) {
    messages.push({ content, role });
    renderMessages();
  }

  // Render messages
  function renderMessages() {
    const container = document.getElementById(`${WIDGET_ID}-messages`);
    if (!container) return;

    container.innerHTML = messages.map(m =>
      `<div class="${WIDGET_ID}-msg ${m.role}">${escapeHtml(m.content)}</div>`
    ).join('');
    container.scrollTop = container.scrollHeight;
  }

  // Open panel
  function openPanel(options = {}) {
    const panel = document.getElementById(`${WIDGET_ID}-panel`);
    const toggle = document.getElementById(`${WIDGET_ID}-toggle`);
    if (!panel || isOpen) return;

    isOpen = true;
    panel.classList.add('open');

    // Remove pulse when opened
    if (toggle) toggle.classList.remove('pulse');

    const input = document.getElementById(`${WIDGET_ID}-input`);
    if (input) input.focus();

    // Show message based on context
    if (messages.length === 0) {
      const message = options.message || config.autoOpenMessage || config.greeting;
      if (message) {
        addMessage(message, 'assistant');
      }
    }
  }

  // Close panel
  function closePanel(options = {}) {
    const panel = document.getElementById(`${WIDGET_ID}-panel`);
    if (!panel || !isOpen) return;

    isOpen = false;
    panel.classList.remove('open');

    // Record dismissal if it was an auto-open that got closed
    if (options.wasDismissed) {
      recordDismissal();
    }
  }

  // Toggle panel
  function togglePanel() {
    if (isOpen) {
      closePanel({ wasDismissed: true });
    } else {
      openPanel();
    }
  }

  // Auto-open handler
  function handleAutoOpen() {
    if (hasAutoOpened) return;
    if (hasAutoOpenedThisSession()) return;
    if (isInCooldown()) return;

    hasAutoOpened = true;
    recordAutoOpened();
    openPanel({ message: config.autoOpenMessage || config.greeting });
  }

  // Setup auto-open timer
  function setupAutoOpen() {
    if (!config.autoOpen) return;
    if (hasAutoOpenedThisSession()) return;
    if (isInCooldown()) return;

    setTimeout(() => {
      if (!isOpen) handleAutoOpen();
    }, config.autoOpenDelay * 1000);
  }

  // Setup scroll trigger
  function setupScrollTrigger() {
    if (config.openOnScroll <= 0) return;

    window.addEventListener('scroll', () => {
      if (hasTriggeredScroll || isOpen) return;
      if (hasAutoOpenedThisSession() && config.autoOpenOnce) return;
      if (isInCooldown()) return;

      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      if (scrollPercent >= config.openOnScroll) {
        hasTriggeredScroll = true;
        recordAutoOpened();
        openPanel({ message: config.autoOpenMessage || config.greeting });
      }
    }, { passive: true });
  }

  // Setup exit intent trigger
  function setupExitIntent() {
    if (!config.openOnExit) return;
    if (isMobile()) return; // Exit intent doesn't work well on mobile

    document.addEventListener('mouseleave', (e) => {
      if (hasTriggeredExit || isOpen) return;
      if (hasAutoOpenedThisSession() && config.autoOpenOnce) return;
      if (isInCooldown()) return;

      // Only trigger when mouse leaves from top of viewport
      if (e.clientY <= 0) {
        hasTriggeredExit = true;
        recordAutoOpened();
        openPanel({ message: config.autoOpenMessage || config.greeting });
      }
    });
  }

  // Initialize
  function init() {
    // Check mobile visibility
    if (!config.mobile && isMobile()) {
      return; // Don't show widget on mobile
    }

    if (document.getElementById(WIDGET_ID)) return; // Already initialized

    restoreSession();
    injectStyles();
    injectWidget();

    // Event listeners
    const toggle = document.getElementById(`${WIDGET_ID}-toggle`);
    const close = document.getElementById(`${WIDGET_ID}-close`);
    const input = document.getElementById(`${WIDGET_ID}-input`);
    const send = document.getElementById(`${WIDGET_ID}-send`);

    toggle.addEventListener('click', togglePanel);
    close.addEventListener('click', () => closePanel({ wasDismissed: true }));

    send.addEventListener('click', () => {
      sendMessage(input.value);
      input.value = '';
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value);
        input.value = '';
      }
    });

    // Start open if configured
    if (config.startOpen) {
      openPanel();
    }

    // Setup triggers
    setupAutoOpen();
    setupScrollTrigger();
    setupExitIntent();
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
