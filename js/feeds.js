/* ═══════════════════════════════════════════
   WAR ROOM — Video Feed Manager
   YouTube IFrame API, multi-platform, solo mode
   ═══════════════════════════════════════════ */

const feeds = (() => {
    // Page system: maps page numbers to preset keys
    const PAGE_MAP = { 1: 'iran', 2: 'iran2' };
    let currentPage = 1;
    let streams = [...CONFIG.presets.iran];
    let players = [];
    let playersReady = [];
    let activeIndex = -1;
    let soloIndex = -1;
    let favorites = {}; // { streamId: true }

    // Always use fresh config (no localStorage cache — prevents stale IDs)

    // Load saved favorites
    const savedFavs = localStorage.getItem('warRoomFavorites');
    if (savedFavs) { try { favorites = JSON.parse(savedFavs); } catch (e) { } }

    // ── UTILS ──
    function extractYouTubeId(input) {
        if (!input) return null;
        if (/^[\w-]{11}$/.test(input)) return input;
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([\w-]{11})/,
            /youtube\.com\/.*[?&]v=([\w-]{11})/
        ];
        for (const p of patterns) {
            const m = input.match(p);
            if (m) return m[1];
        }
        return input;
    }

    function getGridCols(count) {
        if (count <= 2) return 'repeat(2, 1fr)';
        if (count <= 4) return 'repeat(2, 1fr)';
        if (count <= 6) return 'repeat(3, 1fr)';
        if (count <= 9) return 'repeat(3, 1fr)';
        return 'repeat(4, 1fr)';
    }

    function updateBadge(i, live) {
        const b = document.getElementById(`badge-${i}`);
        if (!b) return;
        b.innerHTML = live
            ? '<span class="material-symbols-outlined">volume_up</span>LIVE'
            : '<span class="material-symbols-outlined">volume_off</span>MUTED';
    }

    // ── PAGE SWITCHING ──
    function destroyPlayers() {
        for (let i = 0; i < players.length; i++) {
            if (players[i] && typeof players[i].destroy === 'function') {
                try { players[i].destroy(); } catch (e) { }
            }
        }
        players = [];
        playersReady = [];
        activeIndex = -1;
    }

    function setPage(page) {
        const preset = PAGE_MAP[page];
        if (!preset || !CONFIG.presets[preset]) return;
        destroyPlayers();
        currentPage = page;
        streams = [...CONFIG.presets[preset]];
        buildWall();
    }

    function renderPaginator() {
        const wall = document.getElementById('videoWall');
        if (!wall) return;
        let nav = document.getElementById('wallPaginator');
        if (!nav) {
            nav = document.createElement('div');
            nav.id = 'wallPaginator';
            nav.className = 'wall-paginator';
            wall.parentElement.appendChild(nav);
        }
        const totalPages = Object.keys(PAGE_MAP).length;
        let html = '';
        for (let p = 1; p <= totalPages; p++) {
            html += `<span class="page-dot ${p === currentPage ? 'active' : ''}" onclick="feeds.setPage(${p})" title="Page ${p}">${p}</span>`;
        }
        nav.innerHTML = html;
    }

    // ── BUILD WALL ──
    function buildWall() {
        const wall = document.getElementById('videoWall');
        if (!wall) return;
        wall.innerHTML = '';
        wall.classList.remove('solo-mode');
        soloIndex = -1;
        const exitBtn = document.getElementById('soloExitBtn');
        if (exitBtn) exitBtn.style.display = 'none';
        players = [];
        playersReady = [];

        const activeStreams = streams.filter(s => s.id);
        wall.style.gridTemplateColumns = getGridCols(activeStreams.length);
        const feedCountEl = document.getElementById('feedCount');
        if (feedCountEl) feedCountEl.textContent = activeStreams.length;

        streams.forEach((stream, i) => {
            const cell = document.createElement('div');
            cell.className = 'video-cell';
            cell.id = `cell-${i}`;

            const ytId = extractYouTubeId(stream.id);

            if (ytId && stream.type === 'youtube') {
                cell.innerHTML = `
                    ${stream.region ? `<span class="region-tag">${stream.region}</span>` : ''}
                    <div id="player-${i}" style="width:100%;height:100%;position:absolute;top:0;left:0;"></div>
                    <div class="click-overlay" onclick="feeds.selectCell(${i})" ondblclick="feeds.soloCell(${i})"></div>
                    <span class="label">${stream.label || 'Stream ' + (i + 1)}</span>
                    <span class="live-badge">
                        <span class="live-dot-green"></span>LIVE
                    </span>
                    <span class="audio-badge" id="badge-${i}" style="top:auto;bottom:20px;right:4px;">
                        <span class="material-symbols-outlined">volume_off</span>MUTED
                    </span>
                    <a class="ext-link" id="link-${i}" href="https://www.youtube.com/watch?v=${ytId}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Open in YouTube">↗</a>
                    <div class="cell-controls">
                        <button class="cell-btn cell-btn--fav ${favorites[stream.id] ? 'is-fav' : ''}" id="fav-${i}" onclick="event.stopPropagation(); feeds.toggleFavorite(${i})" title="Favorite">${favorites[stream.id] ? '❤️' : '🤍'}</button>
                        <button class="cell-btn cell-btn--solo" onclick="event.stopPropagation(); feeds.soloCell(${i})">◉ Solo</button>
                        <button class="cell-btn" onclick="event.stopPropagation(); feeds.fullscreenCell(${i})">⛶ Full</button>
                    </div>
                `;
                wall.appendChild(cell);
                playersReady[i] = false;

                // Async fetch live ID
                (async () => {
                    let finalYtId = ytId;
                    if (stream.handle) {
                        try {
                            const params = new URLSearchParams({ channel: stream.handle });
                            const res = await fetch(`/api/youtube/live?${params.toString()}`);
                            if (res.ok) {
                                const data = await res.json();
                                if (data.videoId) {
                                    finalYtId = data.videoId;
                                    // Update external link
                                    const linkEl = document.getElementById(`link-${i}`);
                                    if (linkEl) linkEl.href = `https://www.youtube.com/watch?v=${finalYtId}`;
                                }
                            }
                        } catch (e) {
                            console.warn(`[Live Resolve] Failed for ${stream.handle}`, e);
                        }
                    }
                    
                    // Use YouTube IFrame API for proper mute/unmute without reload
                    players[i] = new YT.Player(`player-${i}`, {
                        videoId: finalYtId,
                        playerVars: { autoplay: 1, mute: 1, controls: 0, modestbranding: 1, rel: 0, iv_load_policy: 3, playsinline: 1 },
                        events: {
                            onReady: () => { playersReady[i] = true; },
                            onError: () => { playersReady[i] = false; }
                        }
                    });
                })();
            } else if (stream.id && ['twitch', 'kick', 'rumble'].includes(stream.type)) {
                let url = '';
                if (stream.type === 'twitch') {
                    const ch = stream.id.includes('twitch.tv/') ? stream.id.split('twitch.tv/')[1].split(/[?\/]/)[0] : stream.id;
                    url = `https://player.twitch.tv/?channel=${ch}&parent=${location.hostname || 'localhost'}&muted=true`;
                } else if (stream.type === 'kick') {
                    const ch = stream.id.includes('kick.com/') ? stream.id.split('kick.com/')[1].split(/[?\/]/)[0] : stream.id;
                    url = `https://player.kick.com/${ch}?muted=true`;
                } else if (stream.type === 'rumble') {
                    const ch = stream.id.includes('rumble.com/') ? stream.id.split('rumble.com/')[1].split(/[?\/]/)[0] : stream.id;
                    url = `https://rumble.com/embed/live/${ch}/?pub=4`;
                }
                cell.innerHTML = `
                    ${stream.region ? `<span class="region-tag">${stream.region}</span>` : ''}
                    <iframe src="${url}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen style="width:100%;height:100%;border:none;"></iframe>
                    <div class="click-overlay" onclick="feeds.selectCell(${i})" ondblclick="feeds.soloCell(${i})"></div>
                    <span class="label">${stream.label || 'Stream ' + (i + 1)}</span>
                    <span class="audio-badge" id="badge-${i}">
                        <span class="material-symbols-outlined">volume_off</span>MUTED
                    </span>
                    <a class="ext-link" href="${stream.id}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Open source">↗</a>
                    <div class="cell-controls">
                        <button class="cell-btn cell-btn--fav ${favorites[stream.id] ? 'is-fav' : ''}" id="fav-${i}" onclick="event.stopPropagation(); feeds.toggleFavorite(${i})" title="Favorite">${favorites[stream.id] ? '❤️' : '🤍'}</button>
                        <button class="cell-btn cell-btn--solo" onclick="event.stopPropagation(); feeds.soloCell(${i})">◉ Solo</button>
                        <button class="cell-btn" onclick="event.stopPropagation(); feeds.fullscreenCell(${i})">⛶ Full</button>
                    </div>
                `;
                wall.appendChild(cell);
                players[i] = null;
                playersReady[i] = false;
            } else if (stream.type === 'hls' && stream.url) {
                // HLS stream — use proxied HLS via video element
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(stream.url)}`;
                cell.innerHTML = `
                    ${stream.region ? `<span class="region-tag">${stream.region}</span>` : ''}
                    <video src="${proxyUrl}" autoplay muted playsinline style="width:100%;height:100%;position:absolute;top:0;left:0;object-fit:cover;"></video>
                    <div class="click-overlay" onclick="feeds.selectCell(${i})" ondblclick="feeds.soloCell(${i})"></div>
                    <span class="label">${stream.label || 'Stream ' + (i + 1)}</span>
                    <span class="live-badge"><span class="live-dot-green"></span>LIVE</span>
                    <span class="audio-badge" id="badge-${i}" style="top:auto;bottom:20px;right:4px;">
                        <span class="material-symbols-outlined">volume_off</span>MUTED
                    </span>
                    <a class="ext-link" href="${stream.url}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Open source">↗</a>
                    <div class="cell-controls">
                        <button class="cell-btn cell-btn--fav ${favorites[stream.id] ? 'is-fav' : ''}" id="fav-${i}" onclick="event.stopPropagation(); feeds.toggleFavorite(${i})" title="Favorite">${favorites[stream.id] ? '❤️' : '🤍'}</button>
                        <button class="cell-btn cell-btn--solo" onclick="event.stopPropagation(); feeds.soloCell(${i})">◉ Solo</button>
                        <button class="cell-btn" onclick="event.stopPropagation(); feeds.fullscreenCell(${i})">⛶ Full</button>
                    </div>
                `;
                wall.appendChild(cell);
                players[i] = null;
                playersReady[i] = false;
            } else {
                cell.innerHTML = `
                    <div class="placeholder" onclick="feeds.openEditor()">
                        <span class="material-symbols-outlined" style="font-size:1.6rem;opacity:0.2">live_tv</span>
                        <span>Slot ${i + 1}</span>
                        <span style="font-size:0.45rem;opacity:0.3">Click to configure</span>
                    </div>
                `;
                wall.appendChild(cell);
                players[i] = null;
                playersReady[i] = false;
            }
        });
        renderPaginator();
    }

    // ── AUDIO SELECT ──
    function selectCell(index) {
        if (!streams[index]?.id) return;
        if (activeIndex === index) {
            // Mute active cell
            if (players[index] && playersReady[index]) {
                try { players[index].mute(); } catch (e) { }
            }
            document.getElementById(`cell-${index}`)?.classList.remove('active');
            updateBadge(index, false);
            activeIndex = -1;
            return;
        }
        muteAll();
        activeIndex = index;
        // Unmute selected cell
        if (players[index] && playersReady[index]) {
            try { players[index].unMute(); players[index].setVolume(100); } catch (e) { }
        }
        document.getElementById(`cell-${index}`)?.classList.add('active');
        updateBadge(index, true);
    }

    function muteAll() {
        streams.forEach((s, i) => {
            if (players[i] && playersReady[i]) {
                try { players[i].mute(); } catch (e) { }
            }
            document.getElementById(`cell-${i}`)?.classList.remove('active');
            updateBadge(i, false);
        });
        activeIndex = -1;
    }

    // ── SOLO MODE ──
    function soloCell(index) {
        if (!streams[index]?.id) return;
        const wall = document.getElementById('videoWall');
        if (soloIndex === index) { exitSolo(); return; }

        soloIndex = index;
        wall.classList.add('solo-mode');
        const exitBtn = document.getElementById('soloExitBtn');
        if (exitBtn) exitBtn.style.display = '';
        document.querySelectorAll('.video-cell').forEach(c => c.classList.remove('solo-main', 'solo-side'));

        const mainCell = document.getElementById(`cell-${index}`);
        if (mainCell) mainCell.classList.add('solo-main');

        let sideCount = 0;
        streams.forEach((s, i) => {
            if (i !== index && s.id && sideCount < 3) {
                const c = document.getElementById(`cell-${i}`);
                if (c) { c.classList.add('solo-side'); sideCount++; }
            }
        });
        selectCell(index);
    }

    function exitSolo() {
        soloIndex = -1;
        const wall = document.getElementById('videoWall');
        if (wall) wall.classList.remove('solo-mode');
        const exitBtn = document.getElementById('soloExitBtn');
        if (exitBtn) exitBtn.style.display = 'none';
        document.querySelectorAll('.video-cell').forEach(c => {
            c.classList.remove('solo-main', 'solo-side');
            c.style.display = '';
        });
    }

    // ── FULLSCREEN ──
    function fullscreenCell(index) {
        const cell = document.getElementById(`cell-${index}`);
        if (!cell) return;
        if (document.fullscreenElement === cell) { document.exitFullscreen(); return; }
        (cell.requestFullscreen || cell.webkitRequestFullscreen).call(cell);
    }

    // ── EDITOR ──
    function openEditor() {
        const c = document.getElementById('streamInputs');
        if (!c) return;
        c.innerHTML = '';
        streams.forEach((s, i) => {
            c.innerHTML += `
                <div class="stream-input" id="row-${i}">
                    <span class="slot-num">${i + 1}</span>
                    <select id="type${i}">
                        <option value="youtube" ${s.type === 'youtube' ? 'selected' : ''}>YouTube</option>
                        <option value="twitch" ${s.type === 'twitch' ? 'selected' : ''}>Twitch</option>
                        <option value="kick" ${s.type === 'kick' ? 'selected' : ''}>Kick</option>
                        <option value="rumble" ${s.type === 'rumble' ? 'selected' : ''}>Rumble</option>
                    </select>
                    <input type="text" id="id${i}" placeholder="URL or ID" value="${s.id || ''}">
                    <input type="text" id="label${i}" placeholder="Label" value="${s.label || ''}" class="label-input">
                    <input type="text" id="region${i}" placeholder="Region" value="${s.region || ''}" class="region-input">
                    <button class="remove-btn" onclick="feeds.removeStream(${i})">✕</button>
                </div>`;
        });
        document.getElementById('editModal')?.classList.add('active');
    }

    function closeEditor() { document.getElementById('editModal')?.classList.remove('active'); }

    function addStream() {
        streams.push({ type: 'youtube', id: '', label: '', region: '' });
        openEditor();
    }

    function removeStream(index) {
        streams.splice(index, 1);
        openEditor();
    }

    function loadPreset(name, skipEditor = false) {
        streams = [...(CONFIG.presets[name] || CONFIG.presets.all)];
        if (skipEditor) {
            activeIndex = -1;
            buildWall();
        } else {
            openEditor();
        }
    }

    function saveStreams() {
        const rows = document.querySelectorAll('.stream-input');
        streams = Array.from(rows).map((_, i) => ({
            type: document.getElementById(`type${i}`)?.value || 'youtube',
            id: document.getElementById(`id${i}`)?.value.trim() || '',
            label: document.getElementById(`label${i}`)?.value.trim() || '',
            region: document.getElementById(`region${i}`)?.value.trim().toUpperCase() || '',
        })).filter(s => s.id);
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(streams));
        closeEditor();
        activeIndex = -1;
        buildWall();

        // Sync to backend
        if (window.api && api.bulkSave) {
            api.bulkSave(streams.map(s => ({
                id: s.id, type: s.type, label: s.label, region: s.region
            }))).then(r => r && console.log('[SYNC] Streams saved to backend'));
        }
    }

    function getActiveIndex() { return activeIndex; }

    // ── BACKEND SYNC: Load saved streams on init ──
    async function syncFromBackend() {
        if (!window.api || !api.getStreams) return;
        const result = await api.getStreams();
        if (result && result.streams && result.streams.length > 0) {
            console.log(`[SYNC] Loaded ${result.streams.length} streams from backend`);
            const backendMap = {};
            result.streams.forEach(s => { backendMap[s.id] = s; });
            streams.forEach(s => {
                if (backendMap[s.id]) {
                    s.favorite = backendMap[s.id].favorite;
                    s.status = backendMap[s.id].status;
                }
            });
        }
    }

    // ── FAVORITES ──
    function toggleFavorite(index) {
        const stream = streams[index];
        if (!stream || !stream.id) return;

        const isFav = !favorites[stream.id];
        if (isFav) {
            favorites[stream.id] = true;
        } else {
            delete favorites[stream.id];
        }

        const btn = document.getElementById(`fav-${index}`);
        if (btn) {
            btn.textContent = isFav ? '❤️' : '🤍';
            btn.classList.toggle('is-fav', isFav);
        }

        localStorage.setItem('warRoomFavorites', JSON.stringify(favorites));

        if (window.api && api.toggleFavorite) {
            api.toggleFavorite(stream.id).then(r => {
                if (r) console.log(`[FAV] ${stream.label} ${isFav ? 'favorited' : 'unfavorited'}`);
            });
        }
    }

    function getFavorites() {
        return streams.filter(s => favorites[s.id]);
    }

    function loadFavorites() {
        const favStreams = getFavorites();
        if (favStreams.length === 0) {
            console.warn('[FAV] No favorites saved yet — heart some streams first!');
            return;
        }
        streams = [...favStreams];
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(streams));
        activeIndex = -1;
        buildWall();
    }

    // ── LIVE TABS SWITCHING ──
    function switchLiveTab(tabId) {
        document.querySelectorAll('.live-tab').forEach(t => t.classList.remove('active'));
        const tabBtn = document.querySelector(`.live-tab[onclick*="${tabId}"]`);
        if (tabBtn) tabBtn.classList.add('active');

        if (document.startViewTransition) {
            document.startViewTransition(() => {
                loadPreset(tabId, true);
            });
        } else {
            loadPreset(tabId, true);
        }
    }
    // ── Auto-resolve channel handles to fresh video IDs ──
    async function resolveAndBuild() {
        // Collect handles from current streams
        const handles = streams.filter(s => s.handle).map(s => s.handle);
        if (handles.length > 0) {
            try {
                const resp = await fetch('/api/resolve-live?handles=' + encodeURIComponent(handles.join(',')));
                const data = await resp.json();
                if (data.resolved) {
                    let updated = 0;
                    streams.forEach(s => {
                        if (s.handle && data.resolved[s.handle]) {
                            const freshId = data.resolved[s.handle];
                            if (freshId !== s.id) {
                                console.log(`[Resolve] ${s.label}: ${s.id} → ${freshId}`);
                                s.id = freshId;
                                updated++;
                            }
                        }
                    });
                    if (updated > 0) {
                        console.log(`[Resolve] Updated ${updated} stream IDs`);
                        saveStreams();
                    }
                }
            } catch (e) {
                console.warn('[Resolve] Failed, using cached IDs:', e.message);
            }
        }
        buildWall();
    }

    // Public API
    return {
        buildWall, selectCell, muteAll, soloCell, exitSolo, fullscreenCell,
        openEditor, closeEditor, addStream, removeStream, loadPreset, saveStreams, syncFromBackend,
        getActiveIndex, toggleFavorite, getFavorites, loadFavorites, switchLiveTab, resolveAndBuild,
        setPage, renderPaginator
    };
})();

// YouTube API callback — this is the primary trigger
function onYouTubeIframeAPIReady() {
    feeds.buildWall();
}

// Fallback: if YT API takes too long (blocked/slow), build after 5s
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (document.querySelectorAll('.video-cell').length === 0) {
            console.warn('[Feeds] YT API slow, building wall without it');
            feeds.buildWall();
        }
    }, 5000);
});
