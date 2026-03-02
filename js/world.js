// ══════════════════════════════════════════════════
//  WORLD MONITOR — Controller
//  Supports: YouTube embeds + HLS via CORS proxy
//  Depends on: data/streams.js (STREAMS, REGIONS)
// ══════════════════════════════════════════════════

(function () {
    'use strict';

    let activeFilter = 'all';
    const $ = id => document.getElementById(id);

    // ── BUILD FILTER BUTTONS ──
    function buildFilters() {
        const bar = $('flt');
        bar.innerHTML = '';
        for (const [key, val] of Object.entries(REGIONS)) {
            const count = STREAMS.filter(val.filter).length;
            const btn = document.createElement('button');
            btn.className = 'fbtn' + (key === activeFilter ? ' on' : '');
            btn.textContent = `${val.label} (${count})`;
            btn.onclick = () => { activeFilter = key; buildFilters(); render(); };
            bar.appendChild(btn);
        }
    }

    // ── RENDER GRID ──
    function render() {
        const grid = $('grid');
        grid.innerHTML = '';
        const list = STREAMS.filter(REGIONS[activeFilter].filter);
        const frag = document.createDocumentFragment();

        list.forEach((s, i) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.idx = i;

            // Thumbnail — YouTube gets real thumbnails, HLS gets branded gradient
            const img = document.createElement('img');
            img.className = 'cell__img';
            if (s.type === 'yt') {
                img.src = `https://img.youtube.com/vi/${s.id}/hqdefault.jpg`;
            } else {
                // For HLS: use a 1x1 transparent pixel, let CSS gradient handle it
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                img.style.opacity = '0';
                cell.style.background = `linear-gradient(135deg, 
          hsl(${(i * 47) % 360}, 50%, 15%) 0%, 
          hsl(${(i * 47 + 40) % 360}, 40%, 10%) 100%)`;
            }
            img.alt = s.label;
            img.loading = (i < 16) ? 'eager' : 'lazy';
            img.decoding = 'async';
            // Handle broken thumbnails — show gradient instead of grey
            img.onerror = () => {
                img.style.opacity = '0';
                cell.style.background = `linear-gradient(135deg, 
          hsl(${(i * 47) % 360}, 50%, 15%) 0%, 
          hsl(${(i * 47 + 40) % 360}, 40%, 10%) 100%)`;
            };
            cell.appendChild(img);

            // Play overlay
            const play = document.createElement('div');
            play.className = 'cell__play';
            play.innerHTML = '<div class="cell__play-icon"></div>';
            cell.appendChild(play);

            // Type badge
            const typeBadge = document.createElement('div');
            typeBadge.className = `cell__src ${s.type === 'yt' ? 's-yt' : 's-hls'}`;
            typeBadge.textContent = s.type === 'yt' ? '▶ YT' : '📡 HLS';
            cell.appendChild(typeBadge);

            // Label
            const lbl = document.createElement('div');
            lbl.className = 'cell__label';
            lbl.textContent = `${s.flag} ${s.label}`;
            cell.appendChild(lbl);

            // Region badge
            const badge = document.createElement('div');
            badge.className = `cell__region r-${s.continent}`;
            badge.textContent = s.region;
            cell.appendChild(badge);

            // Click to activate
            cell.onclick = () => activate(cell, s);

            frag.appendChild(cell);
        });

        grid.appendChild(frag);
        $('cnt').textContent = `${list.length} streams`;
        $('fcnt').textContent = list.length;
    }

    // ── ACTIVATE STREAM ──
    function activate(cell, stream) {
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

            // Use CORS proxy to bypass browser restrictions
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(stream.url)}`;

            if (Hls.isSupported()) {
                const hls = new Hls({
                    maxBufferLength: 10,
                    maxMaxBufferLength: 30,
                    startFragPrefetch: true,
                    lowLatencyMode: true,
                });
                hls.loadSource(proxyUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.ERROR, (e, d) => {
                    if (d.fatal) {
                        showError(cell, stream.label, 'Stream offline');
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari native HLS
                video.src = proxyUrl;
            }
        }
    }

    function showError(cell, label, msg) {
        const err = document.createElement('div');
        err.className = 'cell__err';
        err.innerHTML = `⚠️ ${msg}<br><span style="font-size:8px;opacity:.4">${label}</span>`;
        cell.appendChild(err);
    }

    // ── PLAY ALL ──
    window.playAll = function () {
        const cells = document.querySelectorAll('.cell:not(.live)');
        cells.forEach((cell, i) => {
            setTimeout(() => {
                const idx = parseInt(cell.dataset.idx);
                const list = STREAMS.filter(REGIONS[activeFilter].filter);
                if (list[idx]) activate(cell, list[idx]);
            }, i * 200);
        });
    };

    // ── GRID SIZE ──
    window.setGrid = function (n) { $('grid').className = 'grid c' + n; };

    // ── RESET ──
    window.resetGrid = function () { render(); };

    // ── CLOCK ──
    function tick() {
        $('clk').textContent = new Date().toLocaleTimeString('en-US', {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
        }) + ' EST';
    }

    // ── INIT ──
    buildFilters();
    render();
    tick();
    setInterval(tick, 1000);
})();
