/* ═══════════════════════════════════════════
   WAR ROOM — WiZ Light Control Panel
   On/Off, color swatches, white presets
   ═══════════════════════════════════════════ */

const lights = (() => {
    const API = 'http://localhost:8889/api/lights';
    let isOn = true;
    let panelOpen = false;

    // ── COLOR PRESETS ──
    const colors = [
        { name: 'War Red', r: 255, g: 0, b: 0 },
        { name: 'Alert Amber', r: 255, g: 80, b: 0 },
        { name: 'Deep Purple', r: 80, g: 0, b: 80 },
        { name: 'Storm Blue', r: 0, g: 20, b: 100 },
        { name: 'Teal', r: 0, g: 80, b: 80 },
        { name: 'Jungle Green', r: 10, g: 100, b: 20 },
        { name: 'Hot Pink', r: 255, g: 20, b: 100 },
        { name: 'Pure White', r: 255, g: 255, b: 255 },
    ];

    const whites = [
        { name: 'Warm', temp: 2700 },
        { name: 'Neutral', temp: 4000 },
        { name: 'Cool', temp: 6500 },
    ];

    // ── API CALLS ──
    async function send(endpoint, data) {
        try {
            const opts = data
                ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
                : { method: 'POST' };
            const res = await fetch(`${API}/${endpoint}`, opts);
            return await res.json();
        } catch (e) {
            console.warn('[LIGHTS]', e.message);
            return { error: e.message };
        }
    }

    function turnOn() { isOn = true; updateToggle(); return send('on'); }
    function turnOff() { isOn = false; updateToggle(); return send('off'); }

    function setColor(r, g, b) {
        isOn = true;
        updateToggle();
        return send('color', { r, g, b, brightness: 255 });
    }

    function setWhite(temp) {
        isOn = true;
        updateToggle();
        return send('white', { colortemp: temp, brightness: 200 });
    }

    function toggle() {
        if (isOn) turnOff();
        else turnOn();
    }

    // ── UI ──
    function updateToggle() {
        const btn = document.getElementById('lightToggle');
        if (btn) {
            btn.textContent = isOn ? '💡' : '🌑';
            btn.title = isOn ? 'Light ON — click to turn off' : 'Light OFF — click to turn on';
        }
    }

    function togglePanel() {
        panelOpen = !panelOpen;
        const panel = document.getElementById('lightPanel');
        if (panel) panel.style.display = panelOpen ? 'flex' : 'none';
    }

    function render() {
        // Insert light button into header controls
        const controls = document.querySelector('.header__controls');
        if (!controls) return;

        // Toggle button (goes before Configure)
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'nav-btn';
        toggleBtn.id = 'lightToggle';
        toggleBtn.textContent = '💡';
        toggleBtn.title = 'Toggle WiZ Light';
        toggleBtn.style.cssText = 'font-size:16px;cursor:pointer;';
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanel();
        });
        controls.insertBefore(toggleBtn, controls.firstChild);

        // Dropdown panel
        const panel = document.createElement('div');
        panel.id = 'lightPanel';
        panel.style.cssText = `
            display: none;
            position: fixed;
            top: 44px;
            right: 12px;
            z-index: 9999;
            background: rgba(10,10,14,0.95);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px;
            flex-direction: column;
            gap: 8px;
            min-width: 200px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            backdrop-filter: blur(12px);
        `;

        // Power row
        const powerRow = document.createElement('div');
        powerRow.style.cssText = 'display:flex;gap:6px;align-items:center;';
        powerRow.innerHTML = `
            <span style="font-size:10px;color:var(--text-secondary);flex:1;text-transform:uppercase;letter-spacing:1px;">WiZ Light</span>
            <button class="cell-btn" onclick="lights.turnOn()" style="flex:1">ON</button>
            <button class="cell-btn" onclick="lights.turnOff()" style="flex:1">OFF</button>
        `;
        panel.appendChild(powerRow);

        // Divider
        const div1 = document.createElement('div');
        div1.style.cssText = 'border-top:1px solid var(--border);margin:4px 0;';
        panel.appendChild(div1);

        // Label
        const colorLabel = document.createElement('div');
        colorLabel.style.cssText = 'font-size:9px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;';
        colorLabel.textContent = 'Colors';
        panel.appendChild(colorLabel);

        // Color swatches
        const swatchRow = document.createElement('div');
        swatchRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';
        colors.forEach(c => {
            const swatch = document.createElement('button');
            swatch.style.cssText = `
                width: 28px; height: 28px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.15);
                background: rgb(${c.r},${c.g},${c.b});
                cursor: pointer;
                transition: transform 0.15s, border-color 0.15s;
            `;
            swatch.title = c.name;
            swatch.addEventListener('mouseenter', () => { swatch.style.transform = 'scale(1.2)'; swatch.style.borderColor = 'rgba(255,255,255,0.6)'; });
            swatch.addEventListener('mouseleave', () => { swatch.style.transform = 'scale(1)'; swatch.style.borderColor = 'rgba(255,255,255,0.15)'; });
            swatch.addEventListener('click', () => setColor(c.r, c.g, c.b));
            swatchRow.appendChild(swatch);
        });
        panel.appendChild(swatchRow);

        // Divider
        const div2 = document.createElement('div');
        div2.style.cssText = 'border-top:1px solid var(--border);margin:4px 0;';
        panel.appendChild(div2);

        // White presets label
        const whiteLabel = document.createElement('div');
        whiteLabel.style.cssText = 'font-size:9px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;';
        whiteLabel.textContent = 'White Presets';
        panel.appendChild(whiteLabel);

        // White preset buttons
        const whiteRow = document.createElement('div');
        whiteRow.style.cssText = 'display:flex;gap:6px;';
        whites.forEach(w => {
            const btn = document.createElement('button');
            btn.className = 'cell-btn';
            btn.style.cssText = 'flex:1;font-size:10px;';
            btn.textContent = `${w.name}`;
            btn.addEventListener('click', () => setWhite(w.temp));
            whiteRow.appendChild(btn);
        });
        panel.appendChild(whiteRow);

        document.body.appendChild(panel);

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (panelOpen && !panel.contains(e.target) && e.target.id !== 'lightToggle') {
                panelOpen = false;
                panel.style.display = 'none';
            }
        });
    }

    function init() {
        render();
    }

    return { init, toggle, turnOn, turnOff, setColor, setWhite, togglePanel };
})();
