import{t as o,dA as u,bD as v,e as r,aP as w,b0 as f,aQ as g}from"./panels-2FfOmxb9.js";import"./deck-stack-BPZ27_H4.js";import"./d3-XmIvo93E.js";import"./i18n-VWbTNjcU.js";function E(t,n){if(t==="runtime-config")return o("modals.runtimeConfig.title");const s=`panels.${t.replace(/-([a-z])/g,(m,l)=>l.toUpperCase())}`,i=o(s);return i===s?n:i}function k(){var i;const t=document.getElementById("app");if(!t)return;document.title=`${o("header.settings")} - World Monitor`;let n=u(g.panels,f);const p=v();function s(){const l=Object.entries(n).filter(([e])=>e!=="runtime-config"||p).map(([e,a])=>`
        <div class="panel-toggle-item ${a.enabled?"active":""}" data-panel="${e}">
          <div class="panel-toggle-checkbox">${a.enabled?"✓":""}</div>
          <span class="panel-toggle-label">${E(e,a.name)}</span>
        </div>
      `).join(""),d=document.getElementById("panelToggles");d&&(d.innerHTML=l,d.querySelectorAll(".panel-toggle-item").forEach(e=>{e.addEventListener("click",()=>{const a=e.dataset.panel,c=n[a];c&&(c.enabled=!c.enabled,w(g.panels,n),s())})}))}t.innerHTML=`
    <div class="settings-window-shell">
      <div class="settings-window-header">
        <div class="settings-window-header-text">
          <span class="settings-window-title">${r(o("header.settings"))}</span>
          <p class="settings-window-caption">${r(o("header.panelDisplayCaption"))}</p>
        </div>
        <button type="button" class="modal-close" id="settingsWindowClose">×</button>
      </div>
      <div class="panel-toggle-grid" id="panelToggles"></div>
    </div>
  `,(i=document.getElementById("settingsWindowClose"))==null||i.addEventListener("click",()=>{window.close()}),s()}export{k as initSettingsWindow};
