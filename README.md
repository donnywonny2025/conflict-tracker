# War Room — Intelligence Command Center

Real-time multi-source intelligence dashboard showing live video streams from global news networks alongside a scrolling X/Twitter feed of OSINT and conflict reporters.

## Quick Start

```bash
cd warroom
./start.sh          # Launches server + X scraper
# Open http://localhost:8888
./stop.sh           # Kills everything
```

## First-Time Setup

```bash
# 1. Install dependencies
npm install          # Installs Playwright
pip install fastapi uvicorn httpx  # Python server

# 2. Log into X (one-time)
node x-scraper.js login
# Your Chrome opens → Log into X → Close browser when done
# Session saves to .x-session/ for persistent access

# 3. Start everything
./start.sh
```

## Architecture

```
┌──────────────────────────────────────────────────┐
│  Browser — localhost:8888                        │
│  ┌──────────────────────┐ ┌────────────────────┐ │
│  │  Video Wall (9 grid) │ │  X Live Feed       │ │
│  │  YouTube + HLS       │ │  Scrollable cards  │ │
│  │  50+ channels        │ │  15 OSINT accounts │ │
│  └──────────────────────┘ └────────────────────┘ │
└──────────────────┬───────────────┬───────────────┘
                   │               │
         ┌─────────▼──────┐  ┌─────▼──────────────┐
         │  server.py     │  │  x-scraper.js      │
         │  FastAPI :8888 │  │  Playwright daemon  │
         │  - Streams API │  │  - 15 X accounts   │
         │  - News RSS    │  │  - 1-min polling    │
         │  - Video proxy │  │  - Anti-bot         │
         │  - WiZ lights  │  │  → x-tweets.json   │
         └────────────────┘  └────────────────────┘
```

## File Structure

| File | Purpose |
|------|---------|
| `server.py` | FastAPI backend — streams, feeds, proxy, lights |
| `index.html` | Main dashboard page |
| `x-scraper.js` | Playwright-based X/Twitter scraper |
| `data/streams.js` | 50+ live channel database |
| `js/feeds.js` | Video wall grid logic |
| `js/app.js` | App initialization, keyboard shortcuts |
| `js/config.js` | Configure modal, presets |
| `js/lights.js` | WiZ smart light controls |
| `js/widgets.js` | News feed, Polymarket widgets |
| `js/livedata.js` | Live data polling |
| `js/world-drawer.js` | World Monitor drawer |
| `css/styles.css` | Full dark design system |
| `start.sh` / `stop.sh` | Process management |

## X Scraper — 15 Premier Accounts

| Account | Type |
|---------|------|
| @sentdefender | Top OSINT, fast breaking |
| @Osinttechnical | Military OSINT |
| @DropSiteNews | Investigative journalism |
| @AJEnglish | Al Jazeera video |
| @michaelh992 | Conflict reporter, raw video |
| @Archer83Able | Raw conflict footage |
| @Osint613 | Aggregated Middle East video |
| @IranIntl_En | Iran International, on-ground |
| @IsraelWarRoom | Israeli side footage |
| @WarMonitors | War footage compilations |
| @no_itsmyturn | Ground-level footage |
| @AuroraIntel | Breaking OSINT |
| @Intel_Sky | Military aviation |
| @GeoConfirmed | Geolocated footage |
| @criticalthreats | Analysis with evidence |

**To add accounts:** Edit `ACCOUNTS` array in `x-scraper.js`, restart daemon.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-9` | Toggle audio on stream 1-9 |
| `S` | Solo currently hovered stream |
| `ESC` | Mute all streams |
| `F` | Toggle fullscreen |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Server health check |
| `/api/streams` | GET | List all configured streams |
| `/api/xfeed` | GET | Get X feed tweets (from scraper) |
| `/api/xvideo` | GET | Proxy Twitter video (bypass CDN) |
| `/api/tweets` | GET | News RSS feed |
| `/api/proxy` | GET | CORS proxy for HLS streams |
| `/api/light/*` | Various | WiZ smart light control |

## Troubleshooting

**X feed shows old data:**
```bash
tail -f /tmp/warroom-scraper.log  # Check scraper health
```

**Video wall blank:**
- Hard refresh: `Cmd+Shift+R`
- Check server: `curl http://localhost:8888/api/health`

**Scraper "SingletonLock" error:**
```bash
rm -f .x-session/SingletonLock
./start.sh
```

**X session expired:**
```bash
node x-scraper.js login  # Re-authenticate
```

## Roadmap

- [ ] **AI Analysis**: Gemini-powered tweet summarization and breaking news detection
- [ ] **Auto-categorization**: ML classification of content types
- [ ] **Alerts**: Push notifications for breaking developments
- [ ] **Multi-monitor**: Independent feeds on separate displays
- [ ] **Recording**: Capture and archive significant moments
