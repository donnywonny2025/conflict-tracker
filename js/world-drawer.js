// ══════════════════════════════════════════════════
//  WORLD MONITOR — Drawer + News + OSINT Popout
//  Renders inside the War Room slide-out drawer
//  Depends on: data/streams.js, hls.js
// ══════════════════════════════════════════════════

(function () {
    'use strict';

    let activeFilter = 'all';
    let drawerOpen = false;

    // ══════════════════════════════════════
    //  OSINT POPOUT TOGGLE
    // ══════════════════════════════════════
    window.toggleOsintPopout = function () {
        const el = document.getElementById('osintPopout');
        if (el) el.classList.toggle('open');
    };

    // ══════════════════════════════════════
    //  WORLD MONITOR DRAWER
    // ══════════════════════════════════════
    window.toggleWorldDrawer = function () {
        const drawer = document.getElementById('worldDrawer');
        const overlay = document.getElementById('drawerOverlay');
        drawerOpen = !drawerOpen;
        drawer.classList.toggle('open', drawerOpen);
        overlay.classList.toggle('open', drawerOpen);
        if (drawerOpen && !drawer.dataset.init) {
            drawer.dataset.init = '1';
            buildDrawerFilters();
            renderDrawer();
        }
    };

    function buildDrawerFilters() {
        const bar = document.getElementById('drawerFlt');
        if (!bar) return;
        bar.innerHTML = '';
        for (const [key, val] of Object.entries(REGIONS)) {
            const count = STREAMS.filter(val.filter).length;
            const btn = document.createElement('button');
            btn.className = 'fbtn' + (key === activeFilter ? ' on' : '');
            btn.textContent = `${val.label} (${count})`;
            btn.onclick = () => { activeFilter = key; buildDrawerFilters(); renderDrawer(); };
            bar.appendChild(btn);
        }
    }

    function renderDrawer() {
        const grid = document.getElementById('drawerGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const list = STREAMS.filter(REGIONS[activeFilter].filter);
        const frag = document.createDocumentFragment();

        list.forEach((s, i) => {
            const cell = document.createElement('div');
            cell.className = 'dcell';
            cell.dataset.idx = i;

            if (s.type === 'yt') {
                const img = document.createElement('img');
                img.className = 'dcell__img';
                img.src = `https://img.youtube.com/vi/${s.id}/hqdefault.jpg`;
                img.alt = s.label;
                img.loading = (i < 12) ? 'eager' : 'lazy';
                img.decoding = 'async';
                img.onerror = () => {
                    img.style.opacity = '0';
                    cell.style.background = `linear-gradient(135deg, hsl(${(i * 47) % 360},50%,15%), hsl(${(i * 47 + 40) % 360},40%,10%))`;
                };
                cell.appendChild(img);
            } else {
                cell.style.background = `linear-gradient(135deg, hsl(${(i * 47) % 360},50%,15%), hsl(${(i * 47 + 40) % 360},40%,10%))`;
            }

            // Play button overlay
            const play = document.createElement('div');
            play.className = 'dcell__play';
            play.innerHTML = '<div class="dcell__play-icon"></div>';
            cell.appendChild(play);

            // Source badge (hidden when live)
            const src = document.createElement('div');
            src.className = `dcell__src ${s.type === 'yt' ? 's-yt' : 's-hls'}`;
            src.textContent = s.type === 'yt' ? '▶ YT' : '📡 HLS';
            cell.appendChild(src);

            // LIVE badge (shown when playing)
            const liveBadge = document.createElement('div');
            liveBadge.className = 'dcell__live';
            liveBadge.innerHTML = '<span class="dcell__live-dot"></span>LIVE';
            cell.appendChild(liveBadge);

            // Label
            const lbl = document.createElement('div');
            lbl.className = 'dcell__label';
            lbl.textContent = `${s.flag} ${s.label}`;
            cell.appendChild(lbl);

            // Region badge
            const badge = document.createElement('div');
            badge.className = `dcell__region r-${s.continent}`;
            badge.textContent = s.region;
            cell.appendChild(badge);

            cell.onclick = () => activateDrawerCell(cell, s);
            frag.appendChild(cell);
        });

        grid.appendChild(frag);
        const cnt = document.getElementById('drawerCnt');
        if (cnt) cnt.textContent = `${list.length} streams`;
    }

    function activateDrawerCell(cell, stream) {
        if (cell.classList.contains('live')) return;
        cell.classList.add('live');

        if (stream.type === 'yt') {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${stream.id}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&playsinline=1`;
            iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
            iframe.allowFullscreen = true;
            cell.appendChild(iframe);
        } else if (stream.type === 'hls') {
            const video = document.createElement('video');
            video.muted = true;
            video.autoplay = true;
            video.playsInline = true;
            video.controls = true;
            cell.appendChild(video);

            const proxyUrl = `/api/proxy?url=${encodeURIComponent(stream.url)}`;
            if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                const hls = new Hls({ maxBufferLength: 10, lowLatencyMode: true });
                hls.loadSource(proxyUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.ERROR, (e, d) => {
                    if (d.fatal) {
                        const err = document.createElement('div');
                        err.className = 'dcell__err';
                        err.innerHTML = `⚠️ Offline<br><span style="font-size:7px;opacity:.4">${stream.label}</span>`;
                        cell.appendChild(err);
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = proxyUrl;
            }
        }
    }

    window.playAllDrawer = function () {
        document.querySelectorAll('#drawerGrid .dcell:not(.live)').forEach((cell, i) => {
            setTimeout(() => {
                const idx = parseInt(cell.dataset.idx);
                const list = STREAMS.filter(REGIONS[activeFilter].filter);
                if (list[idx]) activateDrawerCell(cell, list[idx]);
            }, i * 200);
        });
    };

    window.setDrawerGrid = function (n) {
        const el = document.getElementById('drawerGrid');
        if (el) el.className = 'drawer__grid c' + n;
    };

    // ══════════════════════════════════════
    //  BREAKING NEWS FEED (GDELT)
    // ══════════════════════════════════════
    async function loadBreakingNews() {
        const body = document.getElementById('newsBody');
        const timeEl = document.getElementById('newsTime');
        if (!body) return;

        try {
            const resp = await fetch('/api/tweets?handle=breaking&count=25');
            const data = await resp.json();
            const articles = data.tweets || [];

            if (articles.length === 0) {
                body.innerHTML = '<div style="padding:10px;color:var(--text-muted);font-size:9px;">No articles found</div>';
                return;
            }

            if (timeEl) {
                timeEl.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            }

            body.innerHTML = '';
            articles.forEach(a => {
                const item = document.createElement('a');
                item.className = 'news-item';
                item.href = a.url || '#';
                item.target = '_blank';
                item.rel = 'noopener';

                const time = document.createElement('span');
                time.className = 'news-item__time';
                time.textContent = a.time || '—';

                const title = document.createElement('span');
                title.className = 'news-item__title';
                title.textContent = a.text || 'Untitled';

                const source = document.createElement('span');
                source.className = 'news-item__source';
                source.textContent = a.source || '';

                item.appendChild(time);
                item.appendChild(title);
                item.appendChild(source);
                body.appendChild(item);
            });
        } catch (e) {
            body.innerHTML = '<div style="padding:10px;color:var(--text-muted);font-size:9px;">⚡ Retrying...</div>';
            setTimeout(loadBreakingNews, 5000);
        }
    }

    // Load news on startup, refresh every 90s
    setTimeout(loadBreakingNews, 500);
    setInterval(loadBreakingNews, 90000);
})();
