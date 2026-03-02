/* ═══════════════════════════════════════════
   WAR ROOM — App Controller
   Clock, keyboard shortcuts, fullscreen, init
   ═══════════════════════════════════════════ */

const app = (() => {

    // ── CLOCK ──
    function updateClock() {
        const now = new Date();
        const clockEl = document.getElementById('clock');
        const dateEl = document.getElementById('dateDisplay');
        if (clockEl) {
            clockEl.textContent = now.toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: true, timeZoneName: 'short'
            });
        }
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            }).toUpperCase();
        }
    }

    // ── FULLSCREEN ──
    function toggleFullscreen() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    }

    // ── KEYBOARD SHORTCUTS ──
    function initKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Ignore if modal is open
            if (document.getElementById('editModal').classList.contains('active')) return;
            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            if (e.key >= '1' && e.key <= '9') feeds.selectCell(parseInt(e.key) - 1);
            if (e.key === 'Escape') { feeds.muteAll(); feeds.exitSolo(); }
            if (e.key === 'f' || e.key === 'F') toggleFullscreen();
            if (e.key === 'e' || e.key === 'E') feeds.openEditor();
            if (e.key === 's' || e.key === 'S') {
                const ai = feeds.getActiveIndex();
                if (ai >= 0) feeds.soloCell(ai);
            }
        });
    }

    // ── FULLSCREEN CHANGE HANDLER ──
    function initFullscreenHandler() {
        document.addEventListener('fullscreenchange', () => {
            document.querySelectorAll('.cell-btn').forEach(btn => {
                if (btn.textContent.includes('Full') || btn.textContent.includes('Exit')) {
                    const cell = btn.closest('.video-cell');
                    btn.textContent = document.fullscreenElement === cell ? '✕ Exit' : '⛶ Full';
                }
            });
        });
    }

    // ── INIT ──
    function init() {
        updateClock();
        setInterval(updateClock, 1000);
        initKeyboard();
        initFullscreenHandler();
        widgets.init();

        // Start light control panel
        if (typeof lights !== 'undefined') {
            lights.init();
        }

        // Start live data polling (GDELT headlines)
        if (typeof liveData !== 'undefined') {
            liveData.init();
        }

        // Sync stream status from backend
        if (typeof feeds !== 'undefined' && feeds.syncFromBackend) {
            feeds.syncFromBackend();
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { toggleFullscreen };
})();
