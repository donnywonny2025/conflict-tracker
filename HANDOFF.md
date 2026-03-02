# War Room — Complete Handoff Document
> Last updated: 2026-03-02 02:06 EST
> Previous conversation was getting stuck with zombie terminal processes. All code is saved on disk.

---

## 🚀 Quick Start
```bash
# Kill any zombie processes first
killall -9 node python3 2>/dev/null

# Start War Room
cd "/Volumes/WORK 2TB/WORK 2026/SCENE BUILDER/warroom"
./stop.sh    # Clean shutdown
./start.sh   # Start server (port 8888) + X scraper daemon

# Dashboard: http://localhost:8888
```

---

## 📁 Project Location
```
/Volumes/WORK 2TB/WORK 2026/SCENE BUILDER/warroom/
```
This is INSIDE the SCENE BUILDER workspace. Do NOT overwrite or move this folder.

---

## ✅ What Was Built (All Completed)

### 1. Save Tweet ❤ Feature
- Heart icon (🤍/❤️) on each X feed card in `index.html`
- Click toggles save/unsave via `localStorage`
- "❤️ Saved" filter button in X feed controls shows only saved tweets
- Functions: `saveTweet()`, `unsaveTweet()`, `isSaved()`, `toggleSave()`, `showSavedTweets()`, `getSavedTweets()`

### 2. X Scraper Reliability (`x-scraper.js`)
- **Merge Logic**: New tweets merged with existing `x-tweets.json` — never overwrites good data with empty scrapes
- **Auto-Recovery**: `try/catch` in daemon loop with exponential backoff retry
- **Graceful Shutdown**: `SIGINT` handler cleans up `SingletonLock`, `SingletonSocket`, `SingletonCookie`
- **Uncaught Exception Handler**: Prevents silent crashes
- **9 OSINT Accounts** (reduced from 15 to avoid rate limiting):
  - `@sentdefender`, `@Osinttechnical`, `@DropSiteNews`, `@AJEnglish`
  - `@michaelh992`, `@AuroraIntel`, `@Intel_Sky`, `@GeoConfirmed`, `@criticalthreats`

### 3. Process Management Scripts
- **`start.sh`**: Kills old processes, clears lock files, checks dependencies (Node, Python, Playwright), starts server + scraper, verifies health, prints dashboard URL
- **`stop.sh`**: Kills server + scraper processes, cleans lock files

### 4. Server Enhancements (`server.py`)
- **`/api/scraper-status`**: Returns tweet count, last updated time, age in seconds, account list
- **`/api/health`**: Basic health check
- **Tweet sorting fix**: Video-first, then newest (fixed double-sort bug)
- **FxTwitter enrichment**: Reads tweet IDs from `x-tweets.json`, fetches full metadata (video URLs, thumbnails, text) via `api.fxtwitter.com/i/status/{id}`
- **45-second cache** on `/api/xfeed` responses

### 5. 67 Live Streams (`data/streams.js`)
Added these new streams on top of the original ~47:

**🇮🇷 Iran (4 HLS — permanent URLs, never expire)**:
| Stream | URL |
|--------|-----|
| Press TV (English) | `https://live.presstv.ir/hls/presstv.m3u8` |
| Al Alam (Arabic) | `https://live2.alalam.ir/alalam.m3u8` |
| Iran Press | `https://live.presstv.ir/hls/presstv_5_482/index.m3u8` |
| SNN Iran News | `https://live2.snn.ir/hls/snn2_hd720/index.m3u8` |

**🇮🇱 Israel (4 HLS)**:
| Stream | URL |
|--------|-----|
| KAN 11 (main public TV) | `https://kan11w.media.kan.org.il/hls/live/2105694/2105694/master.m3u8` |
| i24 News Hebrew | `https://bcovlive-a.akamaihd.net/d89ede8094c741b7924120b27764153c/...` |
| Knesset Channel | `https://contact.gostreaming.tv/Knesset/myStream/playlist.m3u8` |
| Reshet 13 | `https://d2xg1g9o5vns8m.cloudfront.net/out/v1/.../index.m3u8` |

**📹 Live Cameras (8 YouTube — new `cam` continent category)**:
| Camera | YouTube ID | Location |
|--------|-----------|----------|
| Western Wall 24/7 | `UMJGcSB1VvI` | Jerusalem |
| ISS Earth View | `DDU-rZs-Ic4` | Space |
| Jerusalem Skyline | `LsUGWzMeXOI` | Israel |
| Tel Aviv Skyline | `4K_E_GSFM8Q` | Israel |
| Haifa Port View | `iFKzOjVDBaw` | Israel |
| Kyiv Skyline | `86YLFOog4GM` | Ukraine |
| Dubai Skyline | `kVVk-F4Qfew` | UAE |
| Beirut Panorama | `2lCgiwnPrD4` | Lebanon |

**Region filters** now include `📹 Cameras` in the World Drawer.

### 6. Documentation
- **`README.md`**: Full project docs (architecture diagram, setup, X accounts, keyboard shortcuts, API reference, troubleshooting, roadmap)

---

## 🏗️ Architecture

```
warroom/
├── index.html          # Main dashboard UI (video wall + X feed sidebar)
│                       #   - 3×3 video grid with HLS.js players
│                       #   - X Live Feed panel (right sidebar)
│                       #   - Save tweet ❤ with localStorage
│                       #   - World Drawer for browsing all 67 streams
│                       #   - Region filters, grid controls, fullscreen
├── server.py           # FastAPI backend (uvicorn, port 8888)
│                       #   - /api/xfeed — tweet fetching via FxTwitter
│                       #   - /api/proxy — HLS stream proxy with CORS
│                       #   - /api/xvideo — Twitter video CDN proxy
│                       #   - /api/news — Google News RSS
│                       #   - /api/scraper-status — health monitoring
│                       #   - /api/health — liveness check
├── x-scraper.js        # Playwright headless Chrome scraper
│                       #   - Visits 9 X accounts every 60 seconds
│                       #   - Extracts tweet IDs from DOM
│                       #   - Merges with existing data (never overwrites)
│                       #   - Saves to x-tweets.json
│                       #   - Auto-recovery on errors
├── x-tweets.json       # Scraped tweet IDs (auto-managed)
├── data/
│   └── streams.js      # 67-stream database with regions/continents
├── start.sh            # Start server + scraper
├── stop.sh             # Stop everything
├── README.md           # Full documentation
├── HANDOFF.md          # This file
└── .x-session/         # Persistent X/Twitter login state (Playwright)
```

### How X Feed Pipeline Works
```
x-scraper.js (Playwright) → visits x.com/@account
    ↓ extracts tweet IDs from article[data-testid="tweet"]
    ↓ merges with existing x-tweets.json
    ↓ saves to disk
    
server.py reads x-tweets.json
    ↓ for each tweet ID → GET api.fxtwitter.com/i/status/{id}
    ↓ extracts: text, author, video_url, thumbnail, likes, retweets
    ↓ sorts: video-first, then newest
    ↓ caches 45 seconds
    ↓ returns JSON to frontend

index.html polls /api/xfeed every 30s
    ↓ renders tweet cards with video thumbnails
    ↓ heart icon for save/unsave
```

### Key API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/xfeed?count=15` | X feed (video-first sorted) |
| GET | `/api/scraper-status` | Tweet count, age, accounts |
| GET | `/api/health` | Server liveness |
| GET | `/api/xvideo?url=...` | Twitter video proxy |
| GET | `/api/proxy?url=...` | HLS stream proxy (CORS) |
| GET | `/api/news` | Google News RSS |
| GET | `/api/streams` | Stream database |

---

## 🎯 NEXT STEPS (What User Wants)

### Priority 1: Clone & Study World Monitor
```bash
cd "/Volumes/WORK 2TB/WORK 2026/SCENE BUILDER"
git clone --depth 1 https://github.com/koala73/worldmonitor.git worldmonitor
```

**What it is**: [github.com/koala73/worldmonitor](https://github.com/koala73/worldmonitor) — open-source Palantir-like intelligence dashboard. Live at [worldmonitor.app](https://worldmonitor.app).

**What user loves about it** (see screenshot reference):
- **LIVE WEBCAMS panel** with tabs: `IRAN ATTACKS | ALL | MIDEAST | EUROPE | AMERICAS | ASIA`
- **Multi-camera grids per city**: Tehran shows 6 different camera angles in one tile
- **2×2 grid view** + single expanded view modes
- **Region-filtered tabs** for quick switching
- Lazy-loaded iframes, auto-pause after 5 min inactivity

**Key World Monitor features to study**:
- 22 YouTube live streams from geopolitical hotspots
- Interactive 3D globe with 40+ data layers
- 150+ RSS feeds aggregated server-side
- AI summarization via local LLM (Ollama)
- Country Instability Index, threat classification
- Desktop app via Tauri

### Priority 2: Build "Live View" Panel in War Room
User wants a dedicated webcam surveillance grid integrated into the War Room:
- Region tabs (IRAN / ISRAEL / MIDEAST / EUROPE / ALL)
- Multi-cam grids per location (Tehran 6-cam, Tel Aviv 4-cam, etc.)
- **Animation capability for live broadcast** — cameras that can transition/move
- Grid view + single expanded view

### Priority 3: Keep X Feed Fresh
- Scraper was working (20-min-old tweets!) but X rate limits after many cycles
- If tweets go stale: run `node x-scraper.js login` to refresh session
- Merge logic ensures data persists through rate limit periods

### Priority 4: AI Features (User Requested)
- AI summarization of breaking tweets
- Sentiment analysis
- Smart alerts
- Content curation

---

## ⚠️ Known Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| Zombie terminal processes | Long-running commands that never completed | `killall -9 node python3` |
| X scraper returns 0 tweets | Rate limited by X | Wait 15-30 min, then `node x-scraper.js login` |
| YouTube camera shows "unavailable" | Live stream ID expired | Replace ID in `data/streams.js` |
| Server won't start on :8888 | Port already in use | `lsof -ti:8888 \| xargs kill -9` |
| `SingletonLock` error | Crashed Chrome left lock files | `rm .x-session/Singleton*` |

---

## 📦 Dependencies
```bash
# Python
pip install fastapi uvicorn httpx

# Node.js
cd warroom && npm install playwright
npx playwright install chromium

# First-time X login
node x-scraper.js login
# This opens Chrome, you log in manually, session persists in .x-session/
```

---

## 🔗 External Resources
- **IPTV-org streams**: `https://github.com/iptv-org/iptv` (Iran: `streams/ir.m3u`, Israel: `streams/il.m3u`)
- **FxTwitter API**: `https://api.fxtwitter.com/i/status/{tweet_id}` (no auth needed, returns tweet data + video URLs)
- **World Monitor**: `https://github.com/koala73/worldmonitor` (clone this!)
- **World Monitor Live**: `https://worldmonitor.app`

---

## 💬 Prompt for New Chat
Copy this to start the next conversation:

> Read the handoff document at `/Volumes/WORK 2TB/WORK 2026/SCENE BUILDER/warroom/HANDOFF.md` — it has the complete state of the War Room project. My next priorities are:
> 1. Clone the World Monitor repo (`github.com/koala73/worldmonitor`) to `/Volumes/WORK 2TB/WORK 2026/SCENE BUILDER/worldmonitor`
> 2. Study their LIVE WEBCAMS implementation — the IRAN ATTACKS tab with multi-camera grids per city
> 3. Build a similar "Live View" webcam surveillance panel into our War Room dashboard
> 4. It needs to support animation/transitions for use in live broadcast production
