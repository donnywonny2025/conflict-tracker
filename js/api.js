/* ═══════════════════════════════════════════
   WAR ROOM — Backend API Client
   Syncs streams with the FastAPI backend
   ═══════════════════════════════════════════ */

const api = (() => {
    const BASE = 'http://localhost:8889/api';

    async function request(path, opts = {}) {
        try {
            const res = await fetch(`${BASE}${path}`, {
                headers: { 'Content-Type': 'application/json' },
                ...opts,
            });
            if (!res.ok) throw new Error(`API ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[API] ${path} failed:`, e.message);
            return null;
        }
    }

    // ── STREAMS ──
    async function getStreams(filters = {}) {
        let qs = '';
        if (filters.status) qs += `?status=${filters.status}`;
        if (filters.favorites) qs += `${qs ? '&' : '?'}favorites_only=true`;
        return request(`/streams${qs}`);
    }

    async function saveStream(stream) {
        return request('/streams', {
            method: 'POST',
            body: JSON.stringify(stream),
        });
    }

    async function bulkSave(streams) {
        return request('/streams/bulk', {
            method: 'POST',
            body: JSON.stringify({ streams }),
        });
    }

    async function updateStream(id, update) {
        return request(`/streams/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(update),
        });
    }

    async function deleteStream(id) {
        return request(`/streams/${encodeURIComponent(id)}`, { method: 'DELETE' });
    }

    // ── STATUS REPORTING ──
    async function reportLive(id) {
        return request(`/streams/${encodeURIComponent(id)}/report-live`, { method: 'POST' });
    }

    async function reportDown(id) {
        return request(`/streams/${encodeURIComponent(id)}/report-down`, { method: 'POST' });
    }

    async function toggleFavorite(id) {
        return request(`/streams/${encodeURIComponent(id)}/toggle-favorite`, { method: 'POST' });
    }

    async function getDownStreams() {
        return request('/streams/down');
    }

    async function getFavorites() {
        return request('/streams/favorites');
    }

    // ── HEALTH CHECK ──
    async function isAvailable() {
        try {
            const res = await fetch(`${BASE}/streams`, { method: 'GET' });
            return res.ok;
        } catch (e) {
            return false;
        }
    }

    return {
        getStreams, saveStream, bulkSave, updateStream, deleteStream,
        reportLive, reportDown, toggleFavorite, getDownStreams, getFavorites,
        isAvailable
    };
})();
