/**
 * X/Twitter Scraper — Playwright + YOUR Chrome + Full Stealth
 * 
 * Usage:
 *   node x-scraper.js login     — Opens YOUR Chrome, you log in, saves session
 *   node x-scraper.js scrape    — Uses saved session to fetch fresh tweets
 *   node x-scraper.js daemon    — Continuous loop: scrape every 1 minute
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SESSION_DIR = path.join(__dirname, '.x-session');
const OUTPUT_FILE = path.join(__dirname, 'x-tweets.json');

const ACCOUNTS = [
    'sentdefender', 'Osinttechnical', 'Intel_Sky', 'GeoConfirmed',
    'AJEnglish', 'BBCBreaking', 'Reuters', 'IranIntl_En', 'IsraelRadar_',
    'michaelh992', 'AuroraIntel', 'DropSiteNews', 'Shayan86',
    'JoeTruzman', 'BNONews', 'Faytuks', 'clabordeAJ',
    'no_itsmyturn', 'criticalthreats', 'IntelDoge',
];

const POLL_INTERVAL = 60 * 1000;

// ── STEALTH: Human-like browser fingerprint ──
const STEALTH_SCRIPTS = `
    // Remove webdriver flag
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    delete navigator.__proto__.webdriver;

    // Fake plugins (real Chrome has plugins)
    Object.defineProperty(navigator, 'plugins', {
        get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
            { name: 'Native Client', filename: 'internal-nacl-plugin' },
        ]
    });

    // Fake languages
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

    // Fix chrome.runtime (missing in automation)
    window.chrome = { runtime: {}, loadTimes: () => ({}) };

    // Fake permissions query
    const origQuery = window.navigator.permissions?.query;
    if (origQuery) {
        window.navigator.permissions.query = (params) =>
            params.name === 'notifications'
                ? Promise.resolve({ state: Notification.permission })
                : origQuery(params);
    }

    // Hide automation indicators
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(param) {
        if (param === 37445) return 'Intel Inc.';
        if (param === 37446) return 'Intel Iris OpenGL Engine';
        return getParameter.call(this, param);
    };
`;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function humanDelay() { return 2000 + Math.random() * 3000; } // 2-5 seconds
function scrollDelay() { return 600 + Math.random() * 800; }

async function login() {
    console.log('🔐 Opening YOUR Chrome for X login...');
    const context = await chromium.launchPersistentContext(SESSION_DIR, {
        headless: false,
        channel: 'chrome',
        viewport: { width: 1280, height: 900 },
        locale: 'en-US',
        timezoneId: 'America/New_York',
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-first-run', '--no-default-browser-check',
        ],
        ignoreDefaultArgs: ['--enable-automation'],
    });
    const page = await context.newPage();
    await page.addInitScript(STEALTH_SCRIPTS);
    await page.goto('https://x.com/login', { waitUntil: 'domcontentloaded' });
    console.log('\n  ✅ Chrome opened. Log in to X, then CLOSE the window.\n');
    await new Promise(resolve => context.on('close', resolve));
    console.log('✅ Session saved! Run: node x-scraper.js daemon');
}

async function scrape() {
    if (!fs.existsSync(SESSION_DIR)) {
        console.error('❌ No session. Run: node x-scraper.js login');
        process.exit(1);
    }

    const ts = new Date().toLocaleTimeString();
    console.log(`\n🔍 [${ts}] Scraping ${ACCOUNTS.length} accounts...`);

    let context;
    try {
        context = await chromium.launchPersistentContext(SESSION_DIR, {
            headless: true,
            channel: 'chrome',
            viewport: { width: 1280, height: 900 },
            locale: 'en-US',
            timezoneId: 'America/New_York',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-first-run', '--no-default-browser-check',
                '--disable-dev-shm-usage',
            ],
            ignoreDefaultArgs: ['--enable-automation'],
        });
    } catch (err) {
        console.log('  ⚠ Lock conflict, clearing...');
        clearLocks();
        await sleep(1000);
        context = await chromium.launchPersistentContext(SESSION_DIR, {
            headless: true, channel: 'chrome',
            viewport: { width: 1280, height: 900 },
            locale: 'en-US', timezoneId: 'America/New_York',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            args: ['--disable-blink-features=AutomationControlled', '--no-first-run'],
            ignoreDefaultArgs: ['--enable-automation'],
        });
    }

    const allTweets = [];

    // ── LIVE SEARCH: scrape X search for latest video content ──
    const SEARCH_QUERIES = [
        'iran video',
        'iran attack',
        'israel strike footage',
        'tehran breaking',
        'iran war',
    ];
    // Pick 2 random queries each cycle
    const queries = SEARCH_QUERIES.sort(() => Math.random() - 0.5).slice(0, 2);
    for (const query of queries) {
        try {
            const searchTweets = await scrapeSearch(context, query);
            allTweets.push(...searchTweets);
            console.log(`  🔍 "${query}": ${searchTweets.length} tweets (${searchTweets.filter(t => t.hasVideo).length} vid)`);
            await sleep(2000 + Math.random() * 2000);
        } catch (err) {
            console.error(`  🔍 "${query}": ✗ ${err.message.substring(0, 50)}`);
        }
    }

    // ── ACCOUNT SCRAPING: top accounts for depth ──
    // Pick 8 random accounts per cycle for speed
    const accountBatch = ACCOUNTS.sort(() => Math.random() - 0.5).slice(0, 8);
    const batchSize = 3;
    for (let b = 0; b < accountBatch.length; b += batchSize) {
        const batch = accountBatch.slice(b, b + batchSize);
        const results = await Promise.allSettled(
            batch.map(acct => scrapeAccount(context, acct))
        );
        for (const r of results) {
            if (r.status === 'fulfilled' && r.value) allTweets.push(...r.value);
        }
        if (b + batchSize < accountBatch.length) {
            await sleep(1500 + Math.random() * 2000);
        }
    }

    await context.close();
    clearLocks();

    // Sort newest first
    allTweets.sort((a, b) => (a.id > b.id ? -1 : a.id < b.id ? 1 : 0));

    // MERGE with existing
    let existing = [];
    try {
        const prev = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        existing = prev.tweets || [];
    } catch { }

    const seenIds = new Set(allTweets.map(t => t.id));
    const merged = [...allTweets, ...existing.filter(t => !seenIds.has(t.id))];
    merged.sort((a, b) => (a.id > b.id ? -1 : a.id < b.id ? 1 : 0));
    const final = merged.slice(0, 300);

    const authorStats = {};
    final.forEach(t => { authorStats[t.author] = (authorStats[t.author] || 0) + 1; });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
        tweets: final, count: final.length,
        updated: new Date().toISOString(),
        accounts: ACCOUNTS, stats: authorStats,
    }, null, 2));

    const newVids = allTweets.filter(t => t.hasVideo).length;
    const newImgs = allTweets.filter(t => t.hasImage).length;
    console.log(`  ✅ ${allTweets.length} new (${newVids} vid, ${newImgs} img) → ${final.length} total`);
    console.log(`  📊 ${Object.keys(authorStats).length} unique authors`);
}

async function scrapeSearch(context, query) {
    const tweets = [];
    let page;
    try {
        page = await context.newPage();
        await page.addInitScript(STEALTH_SCRIPTS);

        // Search X with video filter, sorted by Latest
        const searchUrl = `https://x.com/search?q=${encodeURIComponent(query)}&f=live`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await sleep(humanDelay());

        // Check not redirected to login
        if (page.url().includes('/login') || page.url().includes('/i/flow')) {
            await page.close();
            return tweets;
        }

        // Scroll to load more
        for (let i = 0; i < 3; i++) {
            await page.evaluate((amt) => window.scrollBy({ top: amt, behavior: 'smooth' }), 800 + Math.random() * 600);
            await sleep(scrollDelay());
        }

        // Extract tweets from search results
        const extracted = await page.evaluate(() => {
            const results = [];
            const seenIds = new Set();
            const articles = document.querySelectorAll('article[data-testid="tweet"]');
            articles.forEach(article => {
                const links = article.querySelectorAll('a[href*="/status/"]');
                let tweetId = null, author = 'unknown';
                for (const link of links) {
                    const match = link.href.match(/\/([^\/]+)\/status\/(\d+)/);
                    if (match) { author = match[1]; tweetId = match[2]; break; }
                }
                if (!tweetId || seenIds.has(tweetId)) return;
                seenIds.add(tweetId);
                const textEl = article.querySelector('[data-testid="tweetText"]');
                const text = textEl ? textEl.textContent.substring(0, 200) : '';
                const timeEl = article.querySelector('time');
                const time = timeEl ? (timeEl.getAttribute('datetime') || timeEl.textContent) : '';
                const hasVideo = !!article.querySelector('video, [data-testid="videoPlayer"], [data-testid="videoComponent"]');
                const hasImage = !!article.querySelector('[data-testid="tweetPhoto"] img, img[src*="pbs.twimg.com/media"]');
                results.push({ id: tweetId, author, text, time, hasVideo, hasImage });
            });
            return results;
        });

        tweets.push(...extracted);
        await page.close();
    } catch (err) {
        if (page) try { await page.close(); } catch { }
        throw err;
    }
    return tweets;
}

async function scrapeAccount(context, account) {
    const tweets = [];
    let page;
    try {
        page = await context.newPage();

        // Inject stealth BEFORE navigation
        await page.addInitScript(STEALTH_SCRIPTS);

        // Human-like: vary the approach  
        await page.goto(`https://x.com/${account}`, {
            waitUntil: 'domcontentloaded',
            timeout: 20000
        });

        // Human-like wait for page to load
        await sleep(humanDelay());

        // Check if we got redirected to login
        const url = page.url();
        if (url.includes('/login') || url.includes('/i/flow')) {
            console.log(`  @${account}: ⚠ Redirected to login — session expired?`);
            await page.close();
            return tweets;
        }

        // Human-like scrolling: slow, variable
        for (let i = 0; i < 5; i++) {
            const scrollAmt = 800 + Math.random() * 600;
            await page.evaluate((amt) => window.scrollBy({ top: amt, behavior: 'smooth' }), scrollAmt);
            await sleep(scrollDelay());
        }

        // Extract tweets
        const extracted = await page.evaluate((acct) => {
            const results = [];
            const seenIds = new Set();
            const articles = document.querySelectorAll('article[data-testid="tweet"]');

            articles.forEach(article => {
                const links = article.querySelectorAll('a[href*="/status/"]');
                let tweetId = null;
                for (const link of links) {
                    const match = link.href.match(/\/status\/(\d+)/);
                    if (match) { tweetId = match[1]; break; }
                }
                if (!tweetId || seenIds.has(tweetId)) return;
                seenIds.add(tweetId);

                const textEl = article.querySelector('[data-testid="tweetText"]');
                const text = textEl ? textEl.textContent.substring(0, 200) : '';
                const timeEl = article.querySelector('time');
                const time = timeEl ? (timeEl.getAttribute('datetime') || timeEl.textContent) : '';
                const hasVideo = !!article.querySelector('video, [data-testid="videoPlayer"], [data-testid="videoComponent"]');
                const hasImage = !!article.querySelector('[data-testid="tweetPhoto"] img, img[src*="pbs.twimg.com/media"]');

                results.push({ id: tweetId, author: acct, text, time, hasVideo, hasImage });
            });
            return results;
        }, account);

        const vids = extracted.filter(t => t.hasVideo).length;
        const imgs = extracted.filter(t => t.hasImage).length;
        console.log(`  @${account}: ${extracted.length} tweets (${vids} vid, ${imgs} img)`);
        tweets.push(...extracted);
        await page.close();
    } catch (err) {
        console.error(`  @${account}: ✗ ${err.message.substring(0, 50)}`);
        if (page) try { await page.close(); } catch { }
    }
    return tweets;
}

function clearLocks() {
    ['SingletonLock', 'SingletonSocket', 'SingletonCookie'].forEach(f => {
        try { fs.unlinkSync(path.join(SESSION_DIR, f)); } catch { }
    });
}

async function daemon() {
    if (!fs.existsSync(SESSION_DIR)) {
        console.error('❌ No session. Run: node x-scraper.js login');
        process.exit(1);
    }

    console.log('🔄 X Scraper Daemon — persistent browser, every 60s');
    console.log(`   ${ACCOUNTS.length} accounts + live search`);
    console.log('   Ctrl+C to stop.\n');

    // Open browser ONCE and keep it alive
    clearLocks();
    await sleep(500);
    const context = await chromium.launchPersistentContext(SESSION_DIR, {
        headless: false,  // Real browser — X can't tell it's automated
        channel: 'chrome',
        viewport: { width: 1280, height: 900 },
        locale: 'en-US',
        timezoneId: 'America/New_York',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        args: [
            '--disable-blink-features=AutomationControlled',
            '--no-first-run', '--no-default-browser-check',
            '--window-position=2000,2000',  // Offscreen so it doesn't bother you
            '--window-size=400,300',
        ],
        ignoreDefaultArgs: ['--enable-automation'],
    });

    async function daemonCycle() {
        const ts = new Date().toLocaleTimeString();
        console.log(`\n🔍 [${ts}] Cycle: search + ${ACCOUNTS.length} tracked accounts`);
        const allTweets = [];

        // ── LIVE SEARCH ──
        const SEARCH_QUERIES = ['iran video', 'iran attack', 'israel strike footage', 'tehran breaking', 'iran war'];
        const queries = SEARCH_QUERIES.sort(() => Math.random() - 0.5).slice(0, 2);
        for (const query of queries) {
            try {
                const searchTweets = await scrapeSearch(context, query);
                allTweets.push(...searchTweets);
                console.log(`  🔍 "${query}": ${searchTweets.length} tweets (${searchTweets.filter(t => t.hasVideo).length} vid)`);
                await sleep(2000 + Math.random() * 2000);
            } catch (err) {
                console.error(`  🔍 "${query}": ✗ ${err.message.substring(0, 50)}`);
            }
        }

        // ── ACCOUNT SCRAPING (random 6 per cycle) ──
        const accountBatch = ACCOUNTS.sort(() => Math.random() - 0.5).slice(0, 6);
        for (const acct of accountBatch) {
            try {
                const tweets = await scrapeAccount(context, acct);
                allTweets.push(...tweets);
            } catch (err) {
                console.error(`  @${acct}: ✗ ${err.message.substring(0, 40)}`);
            }
            await sleep(1500 + Math.random() * 1500);
        }

        // Sort & merge
        allTweets.sort((a, b) => (a.id > b.id ? -1 : a.id < b.id ? 1 : 0));
        let existing = [];
        try { existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8')).tweets || []; } catch { }
        const seenIds = new Set(allTweets.map(t => t.id));
        const merged = [...allTweets, ...existing.filter(t => !seenIds.has(t.id))];
        merged.sort((a, b) => (a.id > b.id ? -1 : a.id < b.id ? 1 : 0));
        const final = merged.slice(0, 300);
        const authorStats = {};
        final.forEach(t => { authorStats[t.author] = (authorStats[t.author] || 0) + 1; });
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
            tweets: final, count: final.length,
            updated: new Date().toISOString(),
            accounts: ACCOUNTS, stats: authorStats,
        }, null, 2));
        const nv = allTweets.filter(t => t.hasVideo).length;
        console.log(`  ✅ ${allTweets.length} new (${nv} vid) → ${final.length} total, ${Object.keys(authorStats).length} authors`);
    }

    // Initial scrape
    try { await daemonCycle(); } catch (e) { console.error('Initial:', e.message); }

    // Loop every 60s — browser stays open
    setInterval(async () => {
        try { await daemonCycle(); }
        catch (e) { console.error(`❌ ${e.message}`); }
    }, POLL_INTERVAL);

    // Keep alive
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await context.close();
        clearLocks();
        process.exit(0);
    });
}

process.on('SIGINT', () => { console.log('\n🛑 Stopping...'); clearLocks(); process.exit(0); });
process.on('uncaughtException', (err) => { console.error('💥', err.message); clearLocks(); });

const cmd = process.argv[2] || 'help';
if (cmd === 'login') login().catch(console.error);
else if (cmd === 'scrape') scrape().catch(console.error);
else if (cmd === 'daemon') daemon().catch(console.error);
else {
    console.log('Usage:');
    console.log('  node x-scraper.js login   — Log in to X (saves session)');
    console.log('  node x-scraper.js scrape  — Scrape once');
    console.log('  node x-scraper.js daemon  — Auto-scrape every 60s');
}
