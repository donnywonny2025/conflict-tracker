"""
WAR ROOM — Stream Manager Backend
Lightweight FastAPI server for stream persistence, status tracking, and favorites.
"""
import json
import time
import os
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, quote
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response, FileResponse, HTMLResponse
from pydantic import BaseModel
import httpx

# ── DATA FILE ──
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
STREAMS_FILE = DATA_DIR / "streams.json"

# ── MODELS ──
class Stream(BaseModel):
    id: str                          # YouTube ID, Twitch channel, etc.
    type: str = "youtube"            # youtube | twitch | kick | rumble
    label: str = ""
    region: str = ""
    url: Optional[str] = None       # Original URL if provided
    status: str = "unknown"          # live | offline | error | unknown
    favorite: bool = False
    last_checked: Optional[float] = None
    last_live: Optional[float] = None
    added_at: Optional[float] = None
    notes: Optional[str] = None
    tags: list[str] = []

class StreamUpdate(BaseModel):
    status: Optional[str] = None
    favorite: Optional[bool] = None
    label: Optional[str] = None
    region: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[list[str]] = None

class StreamList(BaseModel):
    streams: list[Stream]

# ── PERSISTENCE ──
def load_streams() -> dict[str, Stream]:
    if STREAMS_FILE.exists():
        try:
            data = json.loads(STREAMS_FILE.read_text())
            return {k: Stream(**v) for k, v in data.items()}
        except Exception:
            return {}
    return {}

def save_streams(streams: dict[str, Stream]):
    STREAMS_FILE.write_text(
        json.dumps({k: v.model_dump() for k, v in streams.items()}, indent=2)
    )

# ── APP ──
app = FastAPI(title="War Room Stream Manager", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── ROUTES ──

@app.get("/api/streams")
def get_streams(status: Optional[str] = None, favorites_only: bool = False):
    """Get all streams, optionally filtered by status or favorites."""
    streams = load_streams()
    result = list(streams.values())

    if status:
        result = [s for s in result if s.status == status]
    if favorites_only:
        result = [s for s in result if s.favorite]

    # Sort: favorites first, then by label
    result.sort(key=lambda s: (not s.favorite, s.label.lower()))
    return {"streams": [s.model_dump() for s in result], "total": len(result)}


@app.post("/api/streams")
def add_stream(stream: Stream):
    """Add or update a single stream."""
    streams = load_streams()
    stream.added_at = stream.added_at or time.time()
    streams[stream.id] = stream
    save_streams(streams)
    return {"ok": True, "stream": stream.model_dump()}


@app.post("/api/streams/bulk")
def bulk_add_streams(payload: StreamList):
    """Add or update multiple streams at once."""
    streams = load_streams()
    now = time.time()
    for s in payload.streams:
        s.added_at = s.added_at or now
        streams[s.id] = s
    save_streams(streams)
    return {"ok": True, "count": len(payload.streams)}


@app.put("/api/streams/{stream_id}")
def update_stream(stream_id: str, update: StreamUpdate):
    """Update a stream's status, favorite, label, etc."""
    streams = load_streams()
    if stream_id not in streams:
        raise HTTPException(404, f"Stream {stream_id} not found")

    s = streams[stream_id]
    if update.status is not None:
        s.status = update.status
        s.last_checked = time.time()
        if update.status == "live":
            s.last_live = time.time()
    if update.favorite is not None:
        s.favorite = update.favorite
    if update.label is not None:
        s.label = update.label
    if update.region is not None:
        s.region = update.region
    if update.notes is not None:
        s.notes = update.notes
    if update.tags is not None:
        s.tags = update.tags

    streams[stream_id] = s
    save_streams(streams)
    return {"ok": True, "stream": s.model_dump()}


@app.delete("/api/streams/{stream_id}")
def delete_stream(stream_id: str):
    """Remove a stream."""
    streams = load_streams()
    if stream_id in streams:
        del streams[stream_id]
        save_streams(streams)
    return {"ok": True}

@app.get("/api/streams/down")
def get_down_streams():
    """Get streams that were marked as offline or errored."""
    streams = load_streams()
    down = [s.model_dump() for s in streams.values() if s.status in ("offline", "error")]
    return {"streams": down, "total": len(down)}


# ── AUTO-RESOLVE: Channel Handle → Current Live Video ID ──
import re
_resolve_cache = {}  # { handle: { video_id, timestamp } }
RESOLVE_CACHE_TTL = 600  # 10 minutes

@app.get("/api/resolve-live")
async def resolve_live_streams(handles: str = Query(..., description="Comma-separated YouTube channel handles")):
    """Resolve YouTube channel handles to current LIVE video IDs (embeddable only)."""
    handle_list = [h.strip() for h in handles.split(",") if h.strip()]
    results = {}
    now = time.time()

    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        for handle in handle_list:
            # Check cache first
            cached = _resolve_cache.get(handle)
            if cached and (now - cached["timestamp"]) < RESOLVE_CACHE_TTL:
                results[handle] = cached["video_id"]
                continue

            try:
                clean = handle.lstrip("@")
                url = f"https://www.youtube.com/@{clean}/live"
                resp = await client.get(url, headers={
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    "Accept-Language": "en-US,en;q=0.9",
                })
                if resp.status_code == 200:
                    text = resp.text
                    # Only extract if the page confirms a LIVE broadcast
                    is_live = '"isLive":true' in text or '"isLiveBroadcast":true' in text or '"isLiveContent":true' in text
                    if is_live:
                        # Get the canonical video ID from the live page
                        m = re.search(r'<link rel="canonical" href="https://www\.youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})"', text)
                        if not m:
                            m = re.search(r'"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"', text)
                        if m:
                            vid = m.group(1)
                            # Check embeddability — skip if playabilityStatus says unplayable
                            if '"playableInEmbed":false' not in text:
                                results[handle] = vid
                                _resolve_cache[handle] = {"video_id": vid, "timestamp": now}
                                print(f"[resolve] {handle} → {vid} (LIVE)")
                            else:
                                print(f"[resolve] {handle} → {vid} (not embeddable, skipping)")
                                results[handle] = None
                        else:
                            results[handle] = None
                    else:
                        # Channel not live - return None so client keeps existing ID
                        print(f"[resolve] {handle} — not currently live")
                        results[handle] = None
                else:
                    results[handle] = None
            except Exception as e:
                print(f"[resolve] Error for {handle}: {e}")
                results[handle] = None

    return {"resolved": results}

@app.get("/api/streams/favorites")
def get_favorites():
    """Get favorite streams."""
    streams = load_streams()
    favs = [s.model_dump() for s in streams.values() if s.favorite]
    favs.sort(key=lambda s: s["label"].lower())
    return {"streams": favs, "total": len(favs)}


@app.post("/api/streams/{stream_id}/report-down")
def report_down(stream_id: str):
    """Quick endpoint to mark a stream as offline."""
    streams = load_streams()
    if stream_id not in streams:
        # Auto-create entry
        streams[stream_id] = Stream(id=stream_id, status="offline", last_checked=time.time())
    else:
        streams[stream_id].status = "offline"
        streams[stream_id].last_checked = time.time()
    save_streams(streams)
    return {"ok": True}


@app.post("/api/streams/{stream_id}/report-live")
def report_live(stream_id: str):
    """Quick endpoint to mark a stream as live."""
    streams = load_streams()
    now = time.time()
    if stream_id not in streams:
        streams[stream_id] = Stream(id=stream_id, status="live", last_checked=now, last_live=now)
    else:
        streams[stream_id].status = "live"
        streams[stream_id].last_checked = now
        streams[stream_id].last_live = now
    save_streams(streams)
    return {"ok": True}


@app.post("/api/streams/{stream_id}/toggle-favorite")
def toggle_favorite(stream_id: str):
    """Toggle favorite status."""
    streams = load_streams()
    if stream_id not in streams:
        raise HTTPException(404, f"Stream {stream_id} not found")
    streams[stream_id].favorite = not streams[stream_id].favorite
    save_streams(streams)
    return {"ok": True, "favorite": streams[stream_id].favorite}


# ── WiZ LIGHT CONTROL ──
LIGHT_IP = os.environ.get("WIZ_LIGHT_IP", "192.168.12.142")

# Try to import pywizlight (may not be in this venv)
try:
    from pywizlight import wizlight, PilotBuilder
    WIZ_AVAILABLE = True
except ImportError:
    WIZ_AVAILABLE = False
    print("⚠️  pywizlight not installed — using raw UDP fallback")

import socket as _socket

def _send_udp(ip: str, payload: dict):
    """Raw UDP send — works without pywizlight."""
    sock = _socket.socket(_socket.AF_INET, _socket.SOCK_DGRAM)
    sock.settimeout(2)
    msg = json.dumps(payload).encode()
    sock.sendto(msg, (ip, 38899))
    try:
        resp, _ = sock.recvfrom(1024)
        return json.loads(resp.decode())
    except _socket.timeout:
        return {"error": "timeout"}
    finally:
        sock.close()


class LightCommand(BaseModel):
    r: Optional[int] = None
    g: Optional[int] = None
    b: Optional[int] = None
    brightness: Optional[int] = 255
    colortemp: Optional[int] = None


@app.get("/api/lights/status")
def light_status():
    """Get light status."""
    resp = _send_udp(LIGHT_IP, {"method": "getPilot"})
    return {"ip": LIGHT_IP, "available": WIZ_AVAILABLE, "response": resp}


@app.post("/api/lights/on")
def light_on():
    """Turn light on."""
    resp = _send_udp(LIGHT_IP, {"method": "setPilot", "params": {"state": True}})
    return {"ok": True, "response": resp}


@app.post("/api/lights/off")
def light_off():
    """Turn light off."""
    resp = _send_udp(LIGHT_IP, {"method": "setPilot", "params": {"state": False}})
    return {"ok": True, "response": resp}


@app.post("/api/lights/color")
def light_color(cmd: LightCommand):
    """Set light to RGB color."""
    params = {"state": True, "r": cmd.r or 0, "g": cmd.g or 0, "b": cmd.b or 0}
    if cmd.brightness:
        params["dimming"] = max(10, min(100, int(cmd.brightness / 2.55)))
    resp = _send_udp(LIGHT_IP, {"method": "setPilot", "params": params})
    return {"ok": True, "response": resp}


@app.post("/api/lights/white")
def light_white(cmd: LightCommand):
    """Set light to white temperature."""
    params = {"state": True, "temp": cmd.colortemp or 4000}
    if cmd.brightness:
        params["dimming"] = max(10, min(100, int(cmd.brightness / 2.55)))
    resp = _send_udp(LIGHT_IP, {"method": "setPilot", "params": params})
    return {"ok": True, "response": resp}


# ── CORS PROXY FOR HLS STREAMS ──
# Proxies .m3u8 and .ts requests through the server so browsers can play
# HLS streams that don't set CORS headers (like most iptv-org streams).

_http_client = httpx.AsyncClient(timeout=15.0, follow_redirects=True)

from fastapi import Request
from starlette.responses import StreamingResponse

@app.get("/api/proxy")
async def proxy_stream(url: str = Query(..., description="URL to proxy")):
    """Proxy HLS stream content, adding CORS headers."""
    try:
        resp = await _http_client.get(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Referer": url,
        })
        content = resp.content
        content_type = resp.headers.get("content-type", "application/octet-stream")

        # If it's an m3u8 playlist, rewrite relative URLs to also go through proxy
        if url.endswith(".m3u8") or "mpegurl" in content_type.lower():
            text = content.decode("utf-8", errors="replace")
            lines = text.split("\n")
            rewritten = []
            for line in lines:
                line = line.strip()
                if line and not line.startswith("#"):
                    # It's a URL — make it absolute and wrap in proxy
                    abs_url = urljoin(url, line)
                    line = f"/api/proxy?url={quote(abs_url, safe='')}"
                rewritten.append(line)
            content = "\n".join(rewritten).encode("utf-8")
            content_type = "application/vnd.apple.mpegurl"

        return Response(
            content=content,
            media_type=content_type,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-cache",
            }
        )
    except Exception as e:
        raise HTTPException(502, f"Proxy error: {str(e)}")


# ── LIVE NEWS FEED (Google News RSS) ──
# Fetches real-time Iran/war news from Google News RSS.
# No API key required. Cached for 90 seconds.

_news_cache: dict = {}

@app.get("/api/tweets")
async def get_news_feed(handle: str = Query("iran"), count: int = Query(20)):
    """Fetch latest news articles from Google News RSS."""
    import re
    from xml.etree import ElementTree

    now = time.time()
    cache_key = f"{handle}:{count}"

    if cache_key in _news_cache and now - _news_cache[cache_key]["ts"] < 90:
        return _news_cache[cache_key]["data"]

    # Map handles to search queries (when:1h = last hour for freshness)
    queries = {
        "iran": "iran+war+israel+when:1h",
        "breaking": "iran+OR+israel+OR+war+when:1h",
        "IranIntl": "iran+war+breaking+when:1h",
        "DropSiteNews": "iran+independent+media+when:1d",
        "BreakingPoints": "iran+trump+war+military+when:1h",
        "TheGrayzoneNews": "iran+war+analysis+when:1d",
        "sentdefender": "iran+OSINT+intelligence+when:1h",
        "Osint613": "israel+iran+military+strikes+when:1h",
        "IsraelWarRoom": "israel+IDF+iran+attack+when:1h",
        "jeremyscahill": "iran+war+civilian+when:1d",
    }
    q = queries.get(handle, handle.replace(" ", "+"))

    try:
        url = f"https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en"
        resp = await _http_client.get(url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; WarRoom/1.0)",
        })

        if resp.status_code != 200:
            return {"handle": handle, "tweets": [], "count": 0, "error": f"Status {resp.status_code}"}

        root = ElementTree.fromstring(resp.text)
        items = root.findall(".//item")
        tweets = []

        for item in items[:count]:
            title = item.findtext("title", "")
            link = item.findtext("link", "")
            pub_date = item.findtext("pubDate", "")
            source_el = item.find("source")
            source = source_el.text if source_el is not None else ""

            # Parse time
            time_str = ""
            if pub_date:
                try:
                    from email.utils import parsedate_to_datetime
                    dt = parsedate_to_datetime(pub_date)
                    time_str = dt.strftime("%H:%M")
                except Exception:
                    time_str = ""

            # Clean title (remove " - Source" suffix)
            clean_title = re.sub(r'\s*-\s*[^-]+$', '', title) if " - " in title else title

            tweets.append({
                "id": str(len(tweets)),
                "text": clean_title,
                "url": link,
                "source": source,
                "time": time_str,
            })

        result = {"handle": handle, "tweets": tweets, "count": len(tweets)}
        _news_cache[cache_key] = {"data": result, "ts": now}
        return result

    except Exception as e:
        return {"handle": handle, "tweets": [], "count": 0, "error": str(e)}


# ── X/TWITTER VIDEO FEED (FxTwitter API) ──
# Uses FxTwitter (free, no API key) to fetch tweet data.
# Seed IDs discovered via Firecrawl search + curated OSINT accounts.

_xfeed_cache: dict = {"data": None, "ts": 0}

# Fresh seed tweet IDs — OSINT & independent sources (updated live via Firecrawl)
_SEED_TWEETS = {
    "iran war video": [
        "2028282660133486966",  # sentdefender - Pentagon briefing Iran not planning strikes
        "2028256555838124127",  # sentdefender - explosions in Tehran, IAF strikes
        "2028221714732065009",  # sentdefender - UK PM allows US aircraft strike Iran
        "2028205705002451046",  # Osinttechnical - UK/France/Germany strikes on Iran
        "2028170577324683771",  # Osinttechnical - RAF Typhoons combat patrols
        "2028156923216876028",  # Osinttechnical - Israel eliminates Iran axis leadership
        "2028187632044568803",  # Shayan86 - verified war videos thread Mar 1
        "2028077630235222176",  # sentdefender - IAF targeting F-4 Phantoms
        "2028044550434869278",  # Osinttechnical - F-15I Ra'ams striking Iran
        "2028018568072183874",  # Osinttechnical - Iran strikes Oman first time
    ],
    "iran OSINT strikes": [
        "2028256555838124127",  # sentdefender - IAF strikes wave
        "2028170577324683771",  # Osinttechnical - RAF combat patrols
        "2028044550434869278",  # Osinttechnical - F-15I strikes
        "2028077630235222176",  # sentdefender - IAF F-4 targeting
        "2028018568072183874",  # Osinttechnical - Iran strikes Oman
    ],
    "CENTCOM iran military": [
        "2028282660133486966",  # sentdefender - Pentagon briefing
        "2028205705002451046",  # Osinttechnical - European strikes
        "2028288355671367850",  # WIONews - CENTCOM strike footage
        "2028301677371994230",  # AboDantee - CENTCOM Su-22 strikes
        "2028123103793230047",  # TheStudyofWar - interactive map
    ],
    "iran missile drone": [
        "2028018568072183874",  # Osinttechnical - Iran strikes Oman drones
        "2028170577324683771",  # Osinttechnical - RAF shoots down drones
        "2027896980777693426",  # worldmonitorapp - Shahed drone
        "2027681011455209692",  # sentdefender - missile on US 5th Fleet
        "2028292934517633024",  # WIONews - B-2 claims
    ],
}

# ── LIVE VIDEO FEED (YouTube RSS) ──
_video_cache: dict = {"data": None, "ts": 0}
_VIDEO_CHANNELS = {
    "Al Jazeera": "UCNye-wNBqNL5ZzHSJj3l8Bg",
    "Iran Intl": "UCYkoXR0EiF5wLPDjk3cWsjA",
    "WION": "UC_gUM8rL-Lrg6O3adPW9K1g",
    "Sky News": "UCoMdktPbSTixAyNGwb-UYkQ",
    "TRT World": "UC7fWeaHhqgM4Lba7jesQPGQ",
    "DW News": "UCknLrEdhRCp1aegoMqRaCZg",
}

@app.get("/api/videos")
async def get_videos(count: int = Query(15)):
    """Fetch latest video uploads from Iran news YouTube channels."""
    from xml.etree import ElementTree
    import asyncio

    now = time.time()
    if _video_cache["data"] and now - _video_cache["ts"] < 120:
        return _video_cache["data"]

    ns = {'yt': 'http://www.youtube.com/xml/schemas/2015', 'atom': 'http://www.w3.org/2005/Atom'}
    all_videos = []

    async def fetch_channel(name, channel_id):
        try:
            url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
            resp = await _http_client.get(url, timeout=6.0)
            if resp.status_code != 200:
                return []
            root = ElementTree.fromstring(resp.text)
            videos = []
            for entry in root.findall('atom:entry', ns)[:5]:
                vid_el = entry.find('yt:videoId', ns)
                title_el = entry.find('atom:title', ns)
                pub_el = entry.find('atom:published', ns)
                if vid_el is not None:
                    pub = pub_el.text if pub_el is not None else ""
                    videos.append({
                        "id": vid_el.text, "title": title_el.text if title_el is not None else "",
                        "source": name, "published": pub, "time": pub[11:16] if len(pub) > 16 else "",
                    })
            return videos
        except Exception:
            return []

    results = await asyncio.gather(*[fetch_channel(n, c) for n, c in _VIDEO_CHANNELS.items()])
    for vids in results:
        all_videos.extend(vids)
    all_videos.sort(key=lambda v: v.get("published", ""), reverse=True)
    all_videos = all_videos[:count]

    result = {"videos": all_videos, "count": len(all_videos)}
    _video_cache["data"] = result
    _video_cache["ts"] = now
    return result


_XFEED_ACCOUNTS = [
    'sentdefender', 'Osinttechnical', 'DropSiteNews', 'AJEnglish', 'AJENews',
    'michaelh992', 'AuroraIntel', 'Intel_Sky', 'GeoConfirmed', 'criticalthreats',
    'Shayan86', 'Posht_Parde', 'IranIntl_En', 'IsraelRadar_',
    'clabordeAJ', 'JoeTruzman', 'no_itsmyturn', 'BBCWorld', 'Reuters', 'AP',
]
# ═══════════════════════════════════════════════════════════════
#  X FEED — Built-in Live Fetcher (no external scraper needed)
#  Pulls fresh timelines every 60s from Nitter + FxTwitter
# ═══════════════════════════════════════════════════════════════

_XFEED_ACCOUNTS = [
    'sentdefender', 'Osinttechnical', 'Intel_Sky', 'AJEnglish',
    'michaelh992', 'AuroraIntel', 'DropSiteNews', 'IranIntl_En',
    'BNONews', 'IsraelRadar_', 'GeoConfirmed', 'Faytuks',
    'JoeTruzman', 'Shayan86', 'BBCBreaking', 'clabordeAJ',
]
_NITTER_MIRRORS = [
    'https://nitter.privacydev.net',
    'https://nitter.poast.org',
    'https://nitter.1d4.us',
    'https://xcancel.com',
]
_SOURCE_GROUPS = {
    'AJEnglish': 'aljazeera', 'AJENews': 'aljazeera', 'AJELive': 'aljazeera',
    'BBCBreaking': 'bbc', 'BBCWorld': 'bbc',
}
_xfeed_live_cache = {"tweets": [], "ts": 0, "sources": []}


def _get_source_group(author):
    return _SOURCE_GROUPS.get(author, author)


async def _fetch_account_nitter(username):
    """Fetch recent tweets from a Nitter mirror — parse HTML for tweet data."""
    import re
    tweets = []
    for mirror in _NITTER_MIRRORS:
        try:
            r = await _http_client.get(
                f"{mirror}/{username}",
                headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"},
                timeout=6.0, follow_redirects=True,
            )
            if r.status_code != 200:
                continue
            html = r.text
            # Extract tweet IDs from timeline links
            tid_matches = re.findall(
                r'/' + re.escape(username) + r'/status/(\d+)', html, re.IGNORECASE
            )
            if not tid_matches:
                # Try generic status pattern
                tid_matches = re.findall(r'/[^/]+/status/(\d+)', html)
            seen = set()
            for tid in tid_matches:
                if tid in seen:
                    continue
                seen.add(tid)
                tweets.append({"id": tid, "author": username})
            if tweets:
                break
        except Exception:
            continue
    return tweets[:15]


async def _enrich_tweet(tid, fallback_author=""):
    """Enrich a tweet ID via FxTwitter to get text, media, video."""
    try:
        r = await _http_client.get(
            f"https://api.fxtwitter.com/i/status/{tid}",
            headers={"User-Agent": "WarRoom/1.0"}, timeout=5.0,
        )
        if r.status_code != 200:
            return None
        data = r.json()
        t = data.get("tweet", {})
        media = t.get("media", {})
        videos = media.get("videos", [])
        photos = media.get("photos", [])
        vid = next((v for v in videos if v.get("url")), None)
        has_video = vid is not None
        video_url = vid.get("url", "") if vid else ""
        thumb = ""
        if vid:
            thumb = vid.get("thumbnail_url", "")
        if not thumb and photos:
            thumb = photos[0].get("url", "")
        if not has_video and not photos:
            return None
        return {
            "id": tid,
            "text": t.get("text", "")[:200],
            "author": t.get("author", {}).get("screen_name", fallback_author),
            "author_name": t.get("author", {}).get("name", ""),
            "has_video": has_video,
            "video_url": video_url,
            "thumbnail": thumb,
            "created": t.get("created_at", ""),
            "likes": t.get("likes", 0),
            "retweets": t.get("retweets", 0),
        }
    except Exception:
        return None


async def _refresh_xfeed():
    """Background task: fetch fresh video tweets every 60s from multiple sources."""
    import asyncio, random, json as _json, os as _os, re
    from datetime import datetime, timedelta

    def _build_searches():
        """Build search queries — broad coverage for constant updates."""
        today = datetime.utcnow().strftime('%Y-%m-%d')
        return [
            f'iran filter:videos since:{today}',
            f'iran attack filter:videos since:{today}',
            f'tehran filter:videos since:{today}',
            f'iran war filter:videos',
            f'israel strike filter:videos',
            f'iran footage filter:videos',
            f'iran breaking filter:media since:{today}',
            f'ایران filter:videos since:{today}',
            # Broader breaking news
            f'breaking news iran filter:media since:{today}',
            f'missile iran filter:videos',
            f'airstrike filter:videos since:{today}',
            f'OSINT iran filter:media since:{today}',
            f'middle east breaking filter:videos since:{today}',
            f'israel iran filter:videos since:{today}',
            f'IDF filter:videos since:{today}',
            f'IRGC filter:videos since:{today}',
        ]

    async def _search_nitter(query):
        """Search Nitter for latest tweets matching a keyword."""
        tweets = []
        for mirror in _NITTER_MIRRORS:
            try:
                url = f"{mirror}/search?f=tweets&q={query}"
                r = await _http_client.get(url,
                    headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"},
                    timeout=6.0, follow_redirects=True)
                if r.status_code != 200:
                    continue
                tid_matches = re.findall(r'/[^/]+/status/(\d+)', r.text)
                seen = set()
                for tid in tid_matches:
                    if tid not in seen:
                        seen.add(tid)
                        tweets.append({"id": tid, "author": "search"})
                if tweets:
                    break
            except Exception:
                continue
        return tweets[:20]

    while True:
        try:
            all_raw = []

            # Source 1: Read latest from x-tweets.json (Playwright scraper output)
            live_file = _os.path.join(_os.path.dirname(__file__), "x-tweets.json")
            if _os.path.exists(live_file):
                try:
                    with open(live_file) as f:
                        file_data = _json.load(f)
                    file_tweets = file_data.get("tweets", [])
                    # Only use video tweets, sorted newest first
                    file_tweets.sort(key=lambda t: t.get("id", "0"), reverse=True)
                    for t in file_tweets[:30]:
                        if t.get("hasVideo") or t.get("has_video"):
                            all_raw.append({"id": t["id"], "author": t.get("author", "")})
                except Exception:
                    pass

            # Source 2: Nitter keyword search — 3 random queries in parallel
            searches = _build_searches()
            search_queries = random.sample(searches, min(3, len(searches)))
            search_tasks = [_search_nitter(q) for q in search_queries]

            # Source 3: Nitter account timelines — 6 random accounts in parallel
            accounts = random.sample(_XFEED_ACCOUNTS, min(6, len(_XFEED_ACCOUNTS)))
            account_tasks = [_fetch_account_nitter(a) for a in accounts]

            # Run all in parallel for speed
            results = await asyncio.gather(*search_tasks, *account_tasks, return_exceptions=True)
            for r in results:
                if isinstance(r, list):
                    all_raw.extend(r)

            # Dedupe by ID
            seen_ids = set()
            deduped = []
            for t in all_raw:
                if t["id"] not in seen_ids:
                    seen_ids.add(t["id"])
                    deduped.append(t)
            random.shuffle(deduped)

            # Enrich top 30 via FxTwitter for media (video URL, thumbnail)
            enriched = await asyncio.gather(
                *[_enrich_tweet(t["id"], t["author"]) for t in deduped[:30]]
            )
            new_tweets = [t for t in enriched if t]

            if new_tweets:
                existing_ids = {t["id"] for t in new_tweets}
                merged = new_tweets + [t for t in _xfeed_live_cache["tweets"]
                                       if t["id"] not in existing_ids]
                merged.sort(key=lambda t: -int(t.get("id", "0")))
                _xfeed_live_cache["tweets"] = merged[:60]
                _xfeed_live_cache["ts"] = time.time()
                _xfeed_live_cache["sources"] = list(set(t["author"] for t in merged[:60]))
                vid_count = sum(1 for t in new_tweets if t.get("has_video"))
                print(f"[X FEED] {len(new_tweets)} tweets ({vid_count} vid) from {len(_xfeed_live_cache['sources'])} sources")
        except Exception as e:
            print(f"[X FEED] Error: {e}")
        await asyncio.sleep(60)


@app.on_event("startup")
async def _start_xfeed_refresh():
    import asyncio
    asyncio.create_task(_refresh_xfeed())


@app.get("/api/xfeed")
async def get_xfeed(q: str = Query("iran war video"), count: int = Query(15), offset: int = Query(0)):
    """Serve live X feed — merges live cache + scraper file, rotates each call."""
    import json as _json, os as _os, random
    from collections import defaultdict

    all_tweets = []
    seen_ids = set()

    # Source 1: Live cache (Nitter + FxTwitter background fetcher)
    for t in _xfeed_live_cache.get("tweets", []):
        if t["id"] not in seen_ids:
            seen_ids.add(t["id"])
            all_tweets.append(t)

    # Source 2: ALWAYS read x-tweets.json for scraper data
    live_file = _os.path.join(_os.path.dirname(__file__), "x-tweets.json")
    if _os.path.exists(live_file):
        try:
            with open(live_file) as f:
                file_tweets = _json.load(f).get("tweets", [])
            for t in file_tweets:
                tid = t.get("id", "")
                if tid and tid not in seen_ids and (t.get("hasVideo") or t.get("has_video")):
                    seen_ids.add(tid)
                    all_tweets.append({
                        "id": tid,
                        "text": t.get("text", "")[:200],
                        "author": t.get("author", ""),
                        "author_name": t.get("author", ""),
                        "has_video": True,
                        "video_url": t.get("videoUrl", "") or t.get("video_url", ""),
                        "thumbnail": t.get("thumbnail", ""),
                        "created": t.get("time", ""),
                        "likes": t.get("likes", 0), "retweets": t.get("retweets", 0),
                    })
        except Exception:
            pass

    # Sort newest first
    all_tweets.sort(key=lambda t: -int(t.get("id", "0")))

    # If paginating (offset > 0), skip shuffle — just return next slice
    if offset > 0:
        page = all_tweets[offset:offset + count]
        # Enrich missing video URLs
        import asyncio
        to_enrich = [t for t in page if not t.get("video_url") and t.get("has_video")]
        if to_enrich:
            enriched = await asyncio.gather(
                *[_enrich_tweet(t["id"], t.get("author", "")) for t in to_enrich[:10]]
            )
            enrich_map = {t["id"]: t for t in enriched if t}
            for i, tw in enumerate(page):
                if tw["id"] in enrich_map:
                    page[i] = enrich_map[tw["id"]]
        return {
            "tweets": page,
            "count": len(page),
            "query": q,
            "sources": list(set(tw.get("author", "") for tw in page)),
            "live": bool(_xfeed_live_cache.get("tweets")),
            "last_refresh": _xfeed_live_cache.get("ts", 0),
            "pool_size": len(all_tweets),
        }

    # ── DIVERSITY: shuffle within recency tiers, max 2 per source ──
    group_counts = defaultdict(int)
    diverse = []

    # Tier 1: newest 30 tweets — shuffle for variety each refresh
    top = all_tweets[:30]
    random.shuffle(top)
    for tw in top:
        grp = _get_source_group(tw.get("author", ""))
        if group_counts[grp] < 2:
            diverse.append(tw)
            group_counts[grp] += 1
        if len(diverse) >= count:
            break

    # Tier 2: fill from rest if needed
    if len(diverse) < count:
        rest = all_tweets[30:]
        random.shuffle(rest)
        for tw in rest:
            if tw["id"] in {d["id"] for d in diverse}:
                continue
            grp = _get_source_group(tw.get("author", ""))
            if group_counts[grp] < 3:
                diverse.append(tw)
                group_counts[grp] += 1
            if len(diverse) >= count:
                break

    # Enrich any tweets missing video_url (from scraper file)
    import asyncio
    to_enrich = [t for t in diverse if not t.get("video_url") and t.get("has_video")]
    if to_enrich:
        enriched = await asyncio.gather(
            *[_enrich_tweet(t["id"], t.get("author", "")) for t in to_enrich[:10]]
        )
        enrich_map = {t["id"]: t for t in enriched if t}
        for i, tw in enumerate(diverse):
            if tw["id"] in enrich_map:
                diverse[i] = enrich_map[tw["id"]]

    return {
        "tweets": diverse,
        "count": len(diverse),
        "query": q,
        "sources": list(set(tw.get("author", "") for tw in diverse)),
        "live": bool(_xfeed_live_cache.get("tweets")),
        "last_refresh": _xfeed_live_cache.get("ts", 0),
        "pool_size": len(all_tweets),
    }


@app.get("/api/xvideo")
async def proxy_x_video(url: str = Query(...)):
    """Proxy Twitter video to bypass CDN hotlink protection."""
    from starlette.responses import StreamingResponse
    if "twimg.com" not in url and "video.twimg.com" not in url:
        return {"error": "only twimg.com URLs allowed"}
    try:
        resp = await _http_client.get(url, headers={
            "Referer": "https://x.com/",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        }, follow_redirects=True, timeout=15.0)
        return StreamingResponse(
            iter([resp.content]),
            media_type=resp.headers.get("content-type", "video/mp4"),
            headers={"Cache-Control": "public, max-age=3600"},
        )
    except Exception:
        return {"error": "video fetch failed"}

# ── YOUTUBE LIVE DETECTION ──
# Scrapes @handle/live to find current live video ID + HLS manifest.
# Same approach as WorldMonitor. Cached 5 min.

import re as _re

_yt_live_cache: dict = {}

@app.get("/api/youtube/live")
async def youtube_live_detect(channel: str = Query(None), videoId: str = Query(None)):
    """Detect live stream video ID from a YouTube channel handle."""
    now = time.time()
    cache_key = channel or videoId or ""

    # Check cache (5 min TTL)
    if cache_key in _yt_live_cache and now - _yt_live_cache[cache_key]["ts"] < 300:
        return _yt_live_cache[cache_key]["data"]

    # If videoId provided, just validate via oembed
    if videoId and _re.match(r'^[A-Za-z0-9_-]{11}$', videoId):
        try:
            resp = await _http_client.get(
                f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={videoId}&format=json",
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
                timeout=6.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                result = {"channelName": data.get("author_name"), "title": data.get("title"), "videoId": videoId}
                _yt_live_cache[cache_key] = {"data": result, "ts": now}
                return result
        except Exception:
            pass
        return {"channelName": None, "title": None, "videoId": videoId}

    if not channel:
        return {"error": "Missing channel or videoId parameter"}

    # Scrape @handle/live page
    try:
        handle = channel if channel.startswith("@") else f"@{channel}"
        resp = await _http_client.get(
            f"https://www.youtube.com/{handle}/live",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
            follow_redirects=True,
            timeout=10.0,
        )
        if resp.status_code != 200:
            return {"videoId": None, "channelExists": False}

        html = resp.text
        channel_exists = '"channelId"' in html or 'og:url' in html

        # Extract channel name
        channel_name = None
        owner_match = _re.search(r'"ownerChannelName"\s*:\s*"([^"]+)"', html)
        if owner_match:
            channel_name = owner_match.group(1)
        else:
            author_match = _re.search(r'"author"\s*:\s*"([^"]+)"', html)
            if author_match:
                channel_name = author_match.group(1)

        # Extract video ID from videoDetails
        video_id = None
        details_idx = html.find('"videoDetails"')
        if details_idx != -1:
            block = html[details_idx:details_idx + 5000]
            vid_match = _re.search(r'"videoId":"([a-zA-Z0-9_-]{11})"', block)
            live_match = _re.search(r'"isLive"\s*:\s*true', block)
            if vid_match and live_match:
                video_id = vid_match.group(1)

        # Extract HLS URL
        hls_url = None
        hls_match = _re.search(r'"hlsManifestUrl"\s*:\s*"([^"]+)"', html)
        if hls_match and video_id:
            hls_url = hls_match.group(1).replace("\\u0026", "&")

        result = {
            "videoId": video_id,
            "isLive": video_id is not None,
            "channelExists": channel_exists,
            "channelName": channel_name,
            "hlsUrl": hls_url,
        }
        _yt_live_cache[cache_key] = {"data": result, "ts": now}
        return result

    except Exception as e:
        return {"videoId": None, "error": f"Failed to fetch channel data: {str(e)}"}


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "warroom"}


@app.get("/api/scraper-status")
def scraper_status():
    """Check X scraper health — is x-tweets.json fresh?"""
    tweets_file = Path(__file__).parent / "x-tweets.json"
    if not tweets_file.exists():
        return {"status": "no_data", "message": "x-tweets.json not found"}
    try:
        data = json.loads(tweets_file.read_text())
        from datetime import datetime
        updated = data.get("updated", "")
        age_s = (datetime.utcnow() - datetime.fromisoformat(updated.replace("Z", ""))).total_seconds()
        return {
            "status": "healthy" if age_s < 180 else "stale",
            "tweet_count": data.get("count", 0),
            "last_updated": updated,
            "age_seconds": int(age_s),
            "accounts": data.get("accounts", []),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}



# ── SERVE STATIC FILES (fallback to frontend) ──
# Add no-cache middleware so browser always gets fresh JS/CSS
from starlette.middleware.base import BaseHTTPMiddleware

class NoCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        path = request.url.path
        if path.endswith(('.js', '.css', '.html')) or path == '/':
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

app.add_middleware(NoCacheMiddleware)

STATIC_DIR = Path(__file__).parent

@app.get("/live")
async def live_page():
    return FileResponse(str(STATIC_DIR / "live.html"))

@app.get("/director")
async def director_page():
    p = STATIC_DIR / "director.html"
    if p.exists():
        return FileResponse(str(p))
    return HTMLResponse("<h1>Director page coming soon</h1>")

app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    print("🔴 WAR ROOM — Stream Manager starting on http://localhost:8889")
    uvicorn.run(app, host="0.0.0.0", port=8888, log_level="info")
