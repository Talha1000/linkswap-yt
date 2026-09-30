# ⚡ LinkSwap YT

> **Tactile, Luxury-Tier Chrome Extension (Manifest V3) for YouTube Studio**  
> Find and batch-replace affiliate, sponsor, and campaign links across your entire video catalog with interactive visual Git diffs and spring physics.

![LinkSwap YT Logo](src/assets/logo.svg)

---

## ✨ Features & Architecture

- **🕹️ Tactile "Clutch" Physics:** Built with `framer-motion` (`stiffness: 400, damping: 28`) for an ultra-responsive, mechanical feel inspired by Linear and Raycast.
- **🎨 Luxury Aesthetic:** Pure OLED Obsidian (`#08090a`), glass surfaces with 20px backdrops (`bg-zinc-900/60 backdrop-blur-xl`), Electric Emerald (`#10b981`), and Cyber Amber (`#f59e0b`) ambient glows.
- **🔍 Git-Style Visual Diff Engine:**
  - Red strikethrough tokens for replaced links (`#f43f5e`)
  - Glowing Electric Emerald tokens for new links (`#10b981`)
  - Side-by-side split diff and unified inline diff modes
  - Dynamic character count Delta indicator (`+14 chars Δ`)
- **🛡️ 5,000 Character YouTube Safety Guard:** Automatic threshold check against YouTube's 5,000-character description limit to prevent API rejections or truncated text.
- **🚀 Studio Trigger Launcher:** Subtle, tactile floating clutch button injected directly into `studio.youtube.com` with instant side-panel drawer activation.
- **⚡ Safe Rate-Limited Batch Runner:** 250ms spacing between YouTube Data API v3 calls with animated striped progress execution and spring percentage counter.
- **💎 1-Video Free Trial & Pro Licensing:**
  - **Free tier:** Strictly 1 video free trial. Free users can test link swapping on a single video. Upon execution, the trial is exhausted.
  - Multi-video selections (2+) or second swaps are blocked by the high-converting spring `PaywallModal`.
  - Gumroad API v2 license verification with instant Pro activation and Gold badge unlocks.

---

## 📂 Project Architecture

```
linkswap-yt/
├── manifest.json              # Chrome Manifest V3 configuration & OAuth2 mapping
├── package.json               # Dependencies (React, framer-motion, lucide-react, Tailwind)
├── vite.config.ts             # Vite multi-entry build pipeline for Chrome Extension
├── tsconfig.json              # Strict TypeScript configuration
├── tailwind.config.js         # Obsidian & Emerald design token extensions
├── postcss.config.js          # PostCSS processing
├── src/
│   ├── background/
│   │   └── service-worker.ts  # OAuth2 token manager via chrome.identity & side panel router
│   ├── content/
│   │   ├── content.ts         # Injected floating clutch launcher for studio.youtube.com
│   │   └── content.css        # Tactile launcher styles and pulse keyframes
│   ├── popup/
│   │   ├── index.html         # Extension popup HTML entry
│   │   ├── main.tsx           # React root mounter
│   │   └── App.tsx            # Compact status card with 1-click Studio launcher
│   ├── panel/                 # Main Side Panel Workspace
│   │   ├── index.html         # Side panel workspace HTML entry
│   │   ├── main.tsx           # React root mounter
│   │   ├── App.tsx            # Master orchestration workspace
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Channel avatar, quota meter, Pro/Trial pill
│   │   │   ├── CommandBar.tsx     # Tactile Find & Replace inputs + Regex & Case toggles
│   │   │   ├── VideoTable.tsx     # Checkbox table with thumbnails & match chips
│   │   │   ├── DiffPreview.tsx    # Git-style before/after modal with split-diff rendering
│   │   │   ├── ProgressModal.tsx  # Kinetic multi-step batch progress execution modal
│   │   │   └── PaywallModal.tsx   # Glassmorphic Gumroad upgrade & license activation dialog
│   │   └── styles/
│   │       └── globals.css        # Luxury obsidian tokens, tactile scrollbars, animated stripes
│   ├── lib/
│   │   ├── youtube.ts         # YouTube Data API v3 client (channels, playlistItems, videos.update)
│   │   ├── diffEngine.ts      # Token diff engine & 5,000 char threshold validator
│   │   ├── licensing.ts       # 1-video trial counter + Gumroad license validation
│   │   └── storage.ts         # Type-safe chrome.storage.sync/local adapter
│   └── assets/
│       ├── icon-16.png        # Generated 16x16 icon
│       ├── icon-48.png        # Generated 48x48 icon
│       ├── icon-128.png       # Generated 128x128 icon
│       └── logo.svg           # High-resolution vector logo
└── README.md
```

---

## 🛠️ Build & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Build for Production
```bash
npm run build
```
This compiles TypeScript, bundles React with Vite, processes Tailwind CSS, and outputs the production Chrome Extension into the `/dist` directory.

### 3. Load into Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the upper-right corner.
3. Click **Load unpacked**.
4. Select the `linkswap-yt/dist` folder.
5. Navigate to [studio.youtube.com](https://studio.youtube.com). You will see the tactile floating clutch trigger on the bottom right and can open the Side Panel workspace at any time.

---

## 🔑 Google Cloud OAuth2 Configuration

To connect live YouTube channels with real Google Accounts:
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **YouTube Data API v3**.
3. Under **APIs & Services > Credentials**, create an **OAuth 2.0 Client ID**:
   - Application Type: **Chrome Extension**
   - Extension ID: Obtain your ID from `chrome://extensions` after loading unpacked
4. In `manifest.json`, replace `"client_id"`:
   ```json
   "oauth2": {
     "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
     "scopes": [
       "https://www.googleapis.com/auth/youtube.force-ssl",
       "https://www.googleapis.com/auth/userinfo.profile"
     ]
   }
   ```
> **Note:** LinkSwap YT includes high-fidelity mock data fallback out of the box, allowing you to preview and test all tactile interactions, regex toggles, visual diffs, and paywalls immediately before wiring OAuth credentials.

---

## 💳 Licensing & Gumroad Integration

- **Trial Rules:**
  - 1 video free trial is granted by default.
  - If a free user attempts to select $\ge 2$ videos or performs a 2nd swap, the animated `PaywallModal` blocks the action.
- **Gumroad Verification:**
  - Verifies user license keys via `https://api.gumroad.com/v2/licenses/verify`.
  - For testing/demo purposes, key `PRO-PREVIEW-2026` or `LINKSWAP-VIP-LIFETIME` immediately activates Pro status.

---

## 📄 License
MIT © Talha
