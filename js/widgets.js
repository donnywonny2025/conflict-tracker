/* ═══════════════════════════════════════════
   WAR ROOM — Intelligence Widgets
   X Video Player (iframe), Polymarket, OSINT links, Ticker
   ═══════════════════════════════════════════ */

const widgets = (() => {
    let xCurrentIndex = 0;
    let xPaused = false;
    let xAutoTimer = null;

    // ── POLYMARKET (shows answer + odds) ──
    function renderPolymarket() {
        const body = document.getElementById('polymarketBody');
        if (!body) return;

        const sorted = [...CONFIG.polymarket].sort((a, b) => parseInt(b.odds) - parseInt(a.odds));

        body.innerHTML = sorted.map(item => {
            const pct = parseInt(item.odds);
            let oddsClass = 'poly-item__odds--low';
            if (pct >= 60) oddsClass = 'poly-item__odds--high';
            else if (pct >= 30) oddsClass = 'poly-item__odds--mid';

            return `
                <div class="poly-item">
                    <span class="poly-item__title">
                        <a href="${item.url}" target="_blank" title="${item.title}">${item.title}</a>
                    </span>
                    <span class="poly-item__odds ${oddsClass}" title="${item.answer}">
                        ${item.answer} ${item.odds}
                    </span>
                </div>
            `;
        }).join('');
    }

    // ── X VIDEO PLAYER (simple iframe — no YT API conflict) ──
    function initXVideoPlayer() {
        if (!CONFIG.xVideos || CONFIG.xVideos.length === 0) return;
        updateXCount();
        loadXVideo(0);
    }

    function loadXVideo(index) {
        xCurrentIndex = index;
        const vid = CONFIG.xVideos[index];
        if (!vid) return;

        updateXCount();
        updateXCaption(vid);

        const container = document.getElementById('xVideoPlayer');
        if (!container) return;

        // Use a simple iframe embed — independent of YT API player limit
        container.innerHTML = `<iframe
            src="https://www.youtube.com/embed/${vid.id}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=0"
            style="width:100%;height:100%;border:none;"
            allow="autoplay; encrypted-media; fullscreen"
            allowfullscreen></iframe>`;

        // Auto-advance after 45 seconds if not paused
        clearTimeout(xAutoTimer);
        if (!xPaused) {
            xAutoTimer = setTimeout(() => nextXVideo(), 45000);
        }
    }

    function nextXVideo() {
        clearTimeout(xAutoTimer);
        const next = (xCurrentIndex + 1) % CONFIG.xVideos.length;
        loadXVideo(next);
    }

    function prevXVideo() {
        clearTimeout(xAutoTimer);
        const prev = (xCurrentIndex - 1 + CONFIG.xVideos.length) % CONFIG.xVideos.length;
        loadXVideo(prev);
    }

    function toggleXPause() {
        xPaused = !xPaused;
        const btn = document.getElementById('xPauseBtn');
        if (xPaused) {
            clearTimeout(xAutoTimer);
            if (btn) btn.textContent = '▶ Play';
        } else {
            xAutoTimer = setTimeout(() => nextXVideo(), 45000);
            if (btn) btn.textContent = '⏸ Pause';
        }
    }

    function updateXCount() {
        const el = document.getElementById('xVideoCount');
        if (el) el.textContent = `${xCurrentIndex + 1} / ${CONFIG.xVideos.length}`;
    }

    function updateXCaption(vid) {
        const el = document.getElementById('xVideoCaption');
        if (el) el.innerHTML = `<strong>${vid.source}</strong> · ${vid.caption}`;
    }

    // ── OSINT LINKS ──
    function renderOsint() {
        const body = document.getElementById('osintBody');
        if (!body) return;
        body.innerHTML = `<div class="osint-grid">${CONFIG.osint.map(link => `
                <a class="osint-link" href="${link.url}" target="_blank" title="${link.name}">
                    <span class="osint-link__icon">${link.icon}</span>
                    <span class="osint-link__name">${link.name}</span>
                </a>
            `).join('')
            }</div>`;
    }

    // ── NEWS TICKER ──
    function renderTicker() {
        const el = document.getElementById('ticker');
        if (!el) return;
        const text = CONFIG.ticker.map(h => `⚡ ${h}`).join('  ·  ');
        el.textContent = text + '          ' + text;
        // Set a comfortable reading speed
        const charCount = el.textContent.length;
        const duration = Math.max(120, charCount * 0.35);
        el.style.animationDuration = duration + 's';
    }

    // ── INIT ALL ──
    function init() {
        renderPolymarket();
        renderOsint();
        renderTicker();
    }

    return {
        init, renderPolymarket, renderOsint, renderTicker,
        initXVideoPlayer, nextXVideo, prevXVideo, toggleXPause
    };
})();
