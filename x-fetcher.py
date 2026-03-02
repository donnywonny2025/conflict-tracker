#!/usr/bin/env python3
"""
X Feed Fetcher — Direct API, no browser, cookie-based auth.
Auto-backoff on rate limits, auto-cookie refresh.
Writes to x-tweets.json for the War Room server.
"""
import json, time, os, sys, random, subprocess

ACCOUNTS = [
    "sentdefender", "Osinttechnical", "Intel_Sky", "AJEnglish",
    "IranIntl_En", "Shayan86", "AuroraIntel", "GeoConfirmed",
    "BNONews", "DropSiteNews", "JoeTruzman", "michaelh992",
    "BBCBreaking", "Reuters", "IntelDoge", "Faytuks",
    "no_itsmyturn", "criticalthreats", "clabordeAJ", "IsraelRadar_",
]
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COOKIE_FILE = os.path.join(BASE_DIR, ".x-cookies.json")
OUTPUT_FILE = os.path.join(BASE_DIR, "x-tweets.json")
SESSION_DIR = os.path.join(BASE_DIR, ".x-session")

NORMAL_INTERVAL = 90       # seconds between fetches (not too aggressive)
BACKOFF_INTERVAL = 300     # 5 min backoff when rate-limited
MAX_BACKOFF = 600          # 10 min max
BATCH_SIZE = 5             # accounts per cycle (less aggressive)
CONSECUTIVE_FAILS_TO_REFRESH = 3


def load_cookies():
    with open(COOKIE_FILE) as f:
        c = json.load(f)
    return {"ct0": c["ct0"], "auth_token": c["auth_token"]}


def refresh_cookies():
    """Use Playwright to extract fresh cookies from the persistent session."""
    ts = time.strftime("%I:%M:%S %p")
    print(f"  🔑 [{ts}] Refreshing cookies via Playwright...")
    try:
        # Clear locks
        for lock in ["SingletonLock", "SingletonSocket", "SingletonCookie"]:
            try:
                os.unlink(os.path.join(SESSION_DIR, lock))
            except OSError:
                pass

        result = subprocess.run(
            ["node", "-e", """
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
    const ctx = await chromium.launchPersistentContext('%s', { 
        headless: true, channel: 'chrome',
        args: ['--window-position=9999,9999','--window-size=1,1']
    });
    const cookies = await ctx.cookies('https://x.com');
    const out = {};
    cookies.forEach(c => { out[c.name] = c.value; });
    fs.writeFileSync('%s', JSON.stringify(out, null, 2));
    console.log('OK');
    await ctx.close();
})();
""" % (SESSION_DIR.replace("'", "\\'"), COOKIE_FILE.replace("'", "\\'"))],
            capture_output=True, text=True, timeout=30,
            cwd=BASE_DIR
        )
        if "OK" in result.stdout:
            print(f"  ✅ Cookies refreshed successfully")
            return True
        else:
            print(f"  ❌ Cookie refresh failed: {result.stderr[:100]}")
            return False
    except Exception as e:
        print(f"  ❌ Cookie refresh error: {e}")
        return False


def extract_tweets(raw_data):
    """Parse tweets from twitter-api-client's nested timeline structure."""
    tweets = []
    for item in raw_data:
        instructions = (item.get("data", {}).get("user", {})
                        .get("result", {}).get("timeline_v2", {})
                        .get("timeline", {}).get("instructions", []))
        for instr in instructions:
            entries = instr.get("entries", [])
            if not entries and instr.get("entry"):
                entries = [instr["entry"]]
            for entry in entries:
                content = entry.get("content", {})
                tweet_result = (content.get("itemContent", {})
                                .get("tweet_results", {}).get("result", {}))
                if not tweet_result:
                    for sub in content.get("items", []):
                        tweet_result = (sub.get("item", {}).get("itemContent", {})
                                        .get("tweet_results", {}).get("result", {}))
                        if tweet_result:
                            break
                if not tweet_result:
                    continue

                legacy = tweet_result.get("legacy", {})
                user_legacy = (tweet_result.get("core", {}).get("user_results", {})
                               .get("result", {}).get("legacy", {}))

                tid = legacy.get("id_str", "")
                if not tid:
                    continue

                has_vid = False
                vid_url = ""
                thumb = ""
                has_img = False
                for m in legacy.get("extended_entities", {}).get("media", []):
                    if m.get("type") == "video":
                        has_vid = True
                        thumb = m.get("media_url_https", "")
                        best_bitrate = 0
                        for v in m.get("video_info", {}).get("variants", []):
                            if v.get("content_type") == "video/mp4":
                                br = v.get("bitrate", 0)
                                if br > best_bitrate:
                                    best_bitrate = br
                                    vid_url = v["url"]
                    elif m.get("type") == "photo":
                        has_img = True
                        if not thumb:
                            thumb = m.get("media_url_https", "")

                tweets.append({
                    "id": tid,
                    "text": legacy.get("full_text", "")[:300],
                    "author": user_legacy.get("screen_name", ""),
                    "time": legacy.get("created_at", ""),
                    "hasVideo": has_vid,
                    "hasImage": has_img,
                    "videoUrl": vid_url,
                    "thumbnail": thumb,
                    "likes": legacy.get("favorite_count", 0),
                    "retweets": legacy.get("retweet_count", 0),
                })
    return tweets


def save_tweets(new_tweets):
    """Merge new tweets with existing and save."""
    try:
        with open(OUTPUT_FILE) as f:
            existing = json.load(f).get("tweets", [])
    except Exception:
        existing = []

    seen = {t["id"] for t in new_tweets}
    merged = new_tweets + [t for t in existing if t["id"] not in seen]
    merged.sort(key=lambda t: t["id"], reverse=True)
    merged = merged[:300]

    authors = {}
    for t in merged:
        authors[t["author"]] = authors.get(t["author"], 0) + 1

    with open(OUTPUT_FILE, "w") as f:
        json.dump({
            "tweets": merged,
            "count": len(merged),
            "updated": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "stats": authors,
        }, f, indent=2)

    return len(merged), len(authors)


def main():
    print("🚀 X Feed Fetcher — Resilient Mode")
    print(f"   {len(ACCOUNTS)} accounts, {BATCH_SIZE}/cycle, every {NORMAL_INTERVAL}s")
    print("   Auto-backoff + auto-cookie-refresh")
    print("   Ctrl+C to stop.\n")

    from twitter.scraper import Scraper
    cookies = load_cookies()
    scraper = Scraper(cookies=cookies)

    # Resolve user IDs
    print("📋 Resolving user IDs...")
    users = scraper.users(ACCOUNTS)
    user_ids = []
    for u in users:
        try:
            uid = int(u["data"]["user"]["result"]["rest_id"])
            user_ids.append(uid)
        except Exception:
            pass
    print(f"   {len(user_ids)} accounts resolved\n")

    consecutive_fails = 0
    current_interval = NORMAL_INTERVAL

    while True:
        ts = time.strftime("%I:%M:%S %p")
        batch = random.sample(user_ids, min(BATCH_SIZE, len(user_ids)))

        try:
            print(f"🔍 [{ts}] Fetching {len(batch)} accounts...", end=" ", flush=True)
            raw = scraper.tweets(batch, limit=5)
            tweets = extract_tweets(raw)
            vid_count = sum(1 for t in tweets if t["hasVideo"])

            if len(tweets) > 0:
                total, authors = save_tweets(tweets)
                print(f"✅ {len(tweets)} tweets ({vid_count} vid) → {total} total, {authors} authors")
                consecutive_fails = 0
                current_interval = NORMAL_INTERVAL
            else:
                consecutive_fails += 1
                print(f"⚠️  0 tweets (fail #{consecutive_fails})")

                if consecutive_fails >= CONSECUTIVE_FAILS_TO_REFRESH:
                    print(f"  🔄 {consecutive_fails} consecutive fails — refreshing cookies...")
                    if refresh_cookies():
                        cookies = load_cookies()
                        scraper = Scraper(cookies=cookies)
                        # Re-resolve user IDs
                        users = scraper.users(ACCOUNTS[:5])  # just a few to test
                        test_ids = []
                        for u in users:
                            try:
                                test_ids.append(int(u["data"]["user"]["result"]["rest_id"]))
                            except:
                                pass
                        if test_ids:
                            print(f"  ✅ New session works ({len(test_ids)} accounts)")
                            consecutive_fails = 0
                            current_interval = NORMAL_INTERVAL
                        else:
                            print(f"  ⚠️  Still rate-limited, backing off...")
                            current_interval = min(current_interval * 2, MAX_BACKOFF)
                    else:
                        current_interval = min(current_interval * 2, MAX_BACKOFF)

                    consecutive_fails = 0  # Reset counter after refresh attempt

                elif consecutive_fails >= 2:
                    current_interval = BACKOFF_INTERVAL
                    print(f"  ⏳ Backing off to {current_interval}s")

        except KeyboardInterrupt:
            raise
        except Exception as e:
            err = str(e)[:80]
            consecutive_fails += 1
            print(f"❌ Error: {err} (fail #{consecutive_fails})")
            if consecutive_fails >= CONSECUTIVE_FAILS_TO_REFRESH:
                current_interval = BACKOFF_INTERVAL

        time.sleep(current_interval)


if __name__ == "__main__":
    main()
