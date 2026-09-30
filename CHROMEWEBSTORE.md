# Chrome Web Store Listing — LinkSwap YT

> Last Updated: 2026-09-30

## Store Listing

**Extension Name** [REQUIRED]  
LinkSwap YT — YouTube Studio Link Replacer

**Short Description** [REQUIRED]  
Find and batch-replace affiliate and sponsor links across YouTube video descriptions with interactive visual Git diffs.

**Detailed Description** [REQUIRED]  
LinkSwap YT is a dedicated workspace for YouTube creators to batch-replace affiliate, sponsor, and campaign links across video descriptions in seconds.

Managing affiliate links across hundreds of YouTube videos is tedious and error-prone. When a sponsor contract changes, an affiliate program migrates, or a link breaks, manually opening and updating each video description in YouTube Studio takes hours. LinkSwap YT eliminates this hassle with a tactile, automated link swapping workspace.

Key Features:
- Channel-Wide Link Search: Scan video descriptions for outdated URLs, affiliate codes, or custom strings.
- Interactive Git-Style Diffs: Preview character-by-character replacements with red strikethrough deletions and green highlighted additions before saving.
- YouTube 5,000-Character Threshold Guard: Real-time length calculation prevents description overflow and ensures compliance with YouTube API character limits.
- YouTube Studio Integration: Launch directly from YouTube Studio with a floating action launcher or open the dedicated side panel workspace.
- Safe Rate-Limited Execution: Spaced API updates safeguard your channel and preserve existing titles, tags, and category metadata.

How to Use:
1. Open YouTube Studio or click the LinkSwap YT extension icon.
2. Enter the existing link or keyword to find.
3. Enter your new replacement link.
4. Preview the visual diff to inspect the changes.
5. Select target videos and execute the batch update.

Privacy & Safety:
LinkSwap YT operates directly in your browser. All authentication is handled securely through Google's official OAuth identity service. Your descriptions and account details are never stored on third-party servers.

Support & Feedback:
For inquiries, assistance, or feature requests, contact support@linkswap.app.

**Category** [REQUIRED]  
Productivity

**Single Purpose** [REQUIRED]  
Find and batch-replace URLs and text strings across YouTube video descriptions.

**Primary Language** [REQUIRED]  
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `src/assets/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | ⬜ To capture | Side panel workspace in YouTube Studio |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ⬜ To capture | Git-style visual diff modal |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ⬜ To capture | Live batch progress execution |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ To capture | Promotional hero graphic |

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `identity` | permissions | Required to securely authenticate the creator via Google OAuth2 and connect with the YouTube Data API. |
| `storage` | permissions | Used to persist creator preferences (case sensitivity, regex toggles) and license status locally across browser sessions. |
| `sidePanel` | permissions | Provides the primary side-panel workspace UI next to YouTube Studio. |
| `activeTab` | permissions | Allows the extension to detect if the current active tab is YouTube Studio to launch the side panel workspace. |
| `scripting` | permissions | Required to inject the clutch trigger launcher button into YouTube Studio pages. |
| `https://*.googleapis.com/*` | host_permissions | Communicates with the YouTube Data API v3 to read video descriptions and save updated descriptions. |
| `https://studio.youtube.com/*` | host_permissions | Allows the content script to display the workspace launch trigger inside YouTube Studio. |
| `https://api.gumroad.com/*` | host_permissions | Verifies Gumroad Pro license keys to unlock unlimited video batch swapping. |

---

## Privacy & Data Use

### Data Collection
- Account Information: User's YouTube channel ID and channel title (read via YouTube API and cached in local extension storage; never sent to external servers).
- Website Content: Video descriptions (retrieved and updated solely for user-requested link replacement).

### Data Usage
- Data is strictly used to perform user-initiated find and replace operations on video descriptions.
- No user data is sold, rented, or transferred to third-party data brokers.

---

## Version History

- **v1.0.0 (2026-09-30)**: Initial production release.
  - Tactile side panel workspace with spring physics
  - Git-style visual diff engine
  - YouTube 5,000 char threshold check
  - 1-video free trial enforcement & Gumroad license validation
