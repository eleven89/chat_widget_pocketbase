# Chat Widget

A lightweight, drop-in chat widget that sends messages to PocketBase.

## Quick Start

Add this single line before `</body>` on any HTML page:

```html
<script src="https://your-cdn.com/chat-widget.js"></script>
```

That's it. A chat bubble appears in the bottom-right corner.

## Configuration

Customize the widget using data attributes:

```html
<script
  src="chat-widget.js"
  data-header="Need Help?"
  data-color="#6366f1"
  data-auto-open="true"
  data-auto-open-delay="10"
  data-auto-open-message="Have questions? We're here to help!"
  data-pulse="true"
></script>
```

## All Options

### Basic Options

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-pb` | `https://pocketbase.eleven89.org` | PocketBase server URL |
| `data-header` | `Chat with us` | Header text |
| `data-placeholder` | `Type a message...` | Input placeholder |
| `data-position` | `right` | Widget position: `left` or `right` |
| `data-greeting` | (none) | Greeting message shown when user opens chat manually |

### Appearance Options

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-color` | `#007bff` | Primary color (button, header, user messages) |
| `data-color-text` | `#ffffff` | Text color on primary backgrounds |
| `data-color-bg` | `#ffffff` | Panel background color |
| `data-color-assistant` | `#ffffff` | Assistant message bubble color |
| `data-color-assistant-text` | `#333333` | Assistant message text color |
| `data-button-size` | `60` | Toggle button size in pixels |
| `data-panel-width` | `350` | Panel width in pixels |
| `data-border-radius` | `16` | Border radius in pixels |
| `data-offset-x` | `20` | Horizontal offset from edge |
| `data-offset-y` | `20` | Vertical offset from bottom |
| `data-font-family` | System fonts | Custom font family |
| `data-shadow` | `medium` | Shadow: `none`, `small`, `medium`, `large` |
| `data-z-index` | `99999` | Z-index for the widget |

### Auto-Open Options

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-auto-open` | `false` | Automatically open chat after delay |
| `data-auto-open-delay` | `5` | Seconds to wait before auto-opening |
| `data-auto-open-once` | `true` | Only auto-open once per browser session |
| `data-auto-open-message` | (uses greeting) | Message shown when chat auto-opens |
| `data-start-open` | `false` | Start with chat panel already open |
| `data-cooldown` | `0` | Hours to wait before auto-opening again after dismiss |

### Trigger Options

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-open-on-scroll` | `0` | Open when user scrolls X% down the page (e.g., `50`) |
| `data-open-on-exit` | `false` | Open on exit intent (mouse leaves viewport). Desktop only. |

### Display Options

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-pulse` | `false` | Show pulse animation on toggle button |
| `data-mobile` | `true` | Show widget on mobile devices |

## Examples

### Minimal (just the widget)
```html
<script src="chat-widget.js"></script>
```

### Custom colors (purple theme)
```html
<script
  src="chat-widget.js"
  data-color="#7c3aed"
  data-color-assistant="#f3e8ff"
  data-color-assistant-text="#581c87"
></script>
```

### Dark mode
```html
<script
  src="chat-widget.js"
  data-color="#3b82f6"
  data-color-text="#ffffff"
  data-color-bg="#1a1a1a"
  data-color-assistant="#2a2a2a"
  data-color-assistant-text="#e5e5e5"
  data-shadow="large"
></script>
```

### Auto-open after 5 seconds
```html
<script
  src="chat-widget.js"
  data-auto-open="true"
  data-auto-open-delay="5"
  data-auto-open-message="Need help? We're here!"
  data-pulse="true"
></script>
```

### Open when user scrolls halfway
```html
<script
  src="chat-widget.js"
  data-open-on-scroll="50"
  data-auto-open-message="You've scrolled halfway! Any questions?"
></script>
```

### Exit intent with 24-hour cooldown
```html
<script
  src="chat-widget.js"
  data-open-on-exit="true"
  data-auto-open-message="Before you go - can we help?"
  data-cooldown="24"
></script>
```

### Full configuration
```html
<script
  src="chat-widget.js"
  data-pb="https://pocketbase.eleven89.org"
  data-header="Need Help?"
  data-placeholder="Ask us anything..."
  data-position="right"
  data-greeting="Hi! How can we help you today?"

  data-color="#7c3aed"
  data-color-text="#ffffff"
  data-color-bg="#ffffff"
  data-color-assistant="#f3f4f6"
  data-color-assistant-text="#1f2937"
  data-button-size="60"
  data-panel-width="380"
  data-border-radius="20"
  data-offset-x="24"
  data-offset-y="24"
  data-shadow="large"

  data-auto-open="true"
  data-auto-open-delay="10"
  data-auto-open-once="true"
  data-auto-open-message="Have questions? We're here to help!"
  data-cooldown="24"
  data-pulse="true"
  data-mobile="true"
></script>
```

## How It Works

1. Widget loads and checks for existing session in `sessionStorage`
2. If auto-open is enabled, waits for delay then opens (respecting cooldown/once settings)
3. On first message, creates a session in PocketBase
4. All messages are POSTed to PocketBase with the session ID
5. When user closes chat after auto-open, cooldown timer starts (if configured)
6. View all conversations in the PocketBase admin panel

## Storage

The widget uses browser storage to persist state:

| Key | Storage | Purpose |
|-----|---------|---------|
| `atw_chat_session_id` | sessionStorage | Current chat session ID |
| `atw_chat_auto_opened` | sessionStorage | Tracks if auto-open has fired this session |
| `atw_chat_dismissed` | localStorage | Timestamp of last dismissal (for cooldown) |

## Backend

The widget connects to PocketBase at `https://pocketbase.eleven89.org` by default.

**Collections:**
- `chat_sessions` - Stores conversation sessions with visitor metadata
- `chat_messages` - Stores individual messages linked to sessions

**Access Rules:**
- Sessions and messages are write-only from the client
- Admin access required to read/view conversations

**Automatic metadata capture:**
- Site hostname
- Origin URL
- IP address
- User agent

## Local Development

1. Serve the files locally:
   ```bash
   python3 -m http.server 8000
   ```

2. Open `http://localhost:8000/example.html`

3. To use a local PocketBase:
   ```html
   <script src="chat-widget.js" data-pb="http://localhost:8090"></script>
   ```

## Files

- `chat-widget.js` - The widget script (drop this into any site)
- `example.html` - Demo page showing all options
- `README.md` - This file

## Deployment

Host `chat-widget.js` on any CDN or static file server, then include it on your sites.

## Security

- All user input is escaped before rendering (XSS protection)
- Messages are write-only (users cannot read back data)
- IP addresses are captured server-side (cannot be spoofed)
- Session IDs are stored in `sessionStorage` (cleared when browser closes)
- Cooldown timestamps are stored in `localStorage` (persists across sessions)
