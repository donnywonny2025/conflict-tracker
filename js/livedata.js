/* ═══════════════════════════════════════════
   WAR ROOM — Live Data Feeds
   GDELT API for real-time headlines, Polymarket live updates
   ═══════════════════════════════════════════ */

const liveData = (() => {
    const GDELT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc?query=iran%20israel%20war&mode=artlist&maxrecords=20&format=json&sort=datedesc';
    let gdeltHeadlines = [];
    let refreshInterval = null;

    // ── FETCH GDELT HEADLINES ──
    async function fetchGdeltHeadlines() {
        try {
            const res = await fetch(GDELT_URL);
            if (!res.ok) throw new Error(`GDELT ${res.status}`);
            const data = await res.json();

            if (data.articles && data.articles.length > 0) {
                gdeltHeadlines = data.articles.map(a => ({
                    title: a.title,
                    url: a.url,
                    source: a.domain || a.source || '',
                    date: a.seendate || '',
                    image: a.socialimage || '',
                }));
                console.log(`[GDELT] Loaded ${gdeltHeadlines.length} live headlines`);
                updateTicker();
                return gdeltHeadlines;
            }
        } catch (e) {
            console.warn('[GDELT] Failed to fetch:', e.message);
        }
        return [];
    }

    // ── UPDATE TICKER WITH LIVE HEADLINES ──
    function updateTicker() {
        const el = document.getElementById('ticker');
        if (!el) return;

        let items = CONFIG.ticker.map(h => `⚡ ${h}`);

        if (gdeltHeadlines.length > 0) {
            const liveItems = gdeltHeadlines.slice(0, 10).map(h =>
                `📰 ${h.title.toUpperCase()} [${h.source}]`
            );
            items = [...items, '  ·  🔴 LIVE HEADLINES  ·  ', ...liveItems];
        }

        const text = items.join('  ·  ');
        el.textContent = text + '          ' + text;

        // Dynamic speed: ~30px per second for readable scrolling
        const charCount = el.textContent.length;
        const duration = Math.max(120, charCount * 0.35);
        el.style.animationDuration = duration + 's';
    }

    // ── START POLLING ──
    function init() {
        fetchGdeltHeadlines();
        // Refresh every 2 minutes
        refreshInterval = setInterval(fetchGdeltHeadlines, 120000);
    }

    function getHeadlines() { return gdeltHeadlines; }

    return { init, fetchGdeltHeadlines, getHeadlines, updateTicker };
})();
