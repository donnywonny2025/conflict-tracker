var te=Object.defineProperty;var se=(s,e,t)=>e in s?te(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var O=(s,e,t)=>se(s,typeof e!="symbol"?e+"":e,t);import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css             */import{dZ as b,d_ as D,d$ as _,e0 as B,e1 as M,bM as H,e2 as k,e3 as E,e4 as ae,e5 as G,dG as ne,dW as ie,e6 as oe,dV as de,t as g,e7 as W,e8 as Y,e as u,cZ as x,e9 as N,ea as re,eb as le,ec as ce,bD as Z,aq as ge,ed as ve,bB as ue}from"./panels-B6Xz1LA5.js";import"./deck-stack-Chht7LXF.js";import"./d3-XmIvo93E.js";import"./i18n-VWbTNjcU.js";class fe{constructor(){O(this,"pendingSecrets",new Map);O(this,"validatedKeys",new Map);O(this,"validationMessages",new Map)}captureUnsavedInputs(e){e.querySelectorAll("input[data-secret]").forEach(a=>{var r;const o=a.dataset.secret;if(!o)return;const d=a.value.trim();if(!d||d===b)return;if(D.has(o)&&!this.pendingSecrets.has(o)){const c=((r=_().secrets[o])==null?void 0:r.value)||"";if(d===c)return}this.pendingSecrets.set(o,d);const l=B(o,d);l.valid||(this.validatedKeys.set(o,!1),this.validationMessages.set(o,l.hint||"Invalid format"))});const t=e.querySelector("select[data-model-select]"),i=e.querySelector("input[data-model-manual]"),n=(i&&!i.classList.contains("hidden-input")?i.value.trim():t==null?void 0:t.value)||"";n&&!this.pendingSecrets.has("OLLAMA_MODEL")&&(this.pendingSecrets.set("OLLAMA_MODEL",n),this.validatedKeys.set("OLLAMA_MODEL",!0))}hasPendingChanges(){return this.pendingSecrets.size>0}getMissingRequiredSecrets(){const e=[];for(const t of M){if(!H(t.id))continue;const i=k(t);if(i.some(a=>this.pendingSecrets.has(a)))for(const a of i)!E(a).valid&&!this.pendingSecrets.has(a)&&e.push(a)}return e}getValidationErrors(){const e=[];for(const[t,i]of this.pendingSecrets){const n=B(t,i);n.valid||e.push(`${t}: ${n.hint||"Invalid format"}`)}return e}async verifyPendingSecrets(){const e=[],t=Object.fromEntries(this.pendingSecrets.entries()),i=[];for(const[n,a]of this.pendingSecrets){const o=B(n,a);o.valid?i.push([n,a]):(this.validatedKeys.set(n,!1),this.validationMessages.set(n,o.hint||"Invalid format"),e.push(`${n}: ${o.hint||"Invalid format"}`))}if(i.length>0){const n=await Promise.race([Promise.all(i.map(async([a,o])=>{const d=await ae(a,o,t);return{key:a,result:d}})),new Promise(a=>setTimeout(()=>a(i.map(([o])=>({key:o,result:{valid:!0,message:"Saved (verification timed out)"}}))),15e3))]);for(const{key:a,result:o}of n)this.validatedKeys.set(a,o.valid),o.valid?this.validationMessages.delete(a):(this.validationMessages.set(a,o.message||"Verification failed"),e.push(`${a}: ${o.message||"Verification failed"}`))}return e}async commitVerifiedSecrets(){for(const[e,t]of this.pendingSecrets)this.validatedKeys.get(e)!==!1&&(await G(e,t),this.pendingSecrets.delete(e),this.validatedKeys.delete(e),this.validationMessages.delete(e))}setPending(e,t){this.pendingSecrets.set(e,t)}getPending(e){return this.pendingSecrets.get(e)}hasPending(e){return this.pendingSecrets.has(e)}deletePending(e){this.pendingSecrets.delete(e),this.validatedKeys.delete(e),this.validationMessages.delete(e)}setValidation(e,t,i){this.validatedKeys.set(e,t),i?this.validationMessages.set(e,i):this.validationMessages.delete(e)}getValidationState(e){return{validated:this.validatedKeys.get(e),message:this.validationMessages.get(e)}}destroy(){this.pendingSecrets.clear(),this.validatedKeys.clear(),this.validationMessages.clear()}}function K(s){if(typeof AbortSignal.timeout=="function")return AbortSignal.timeout(s);const e=new AbortController;return setTimeout(()=>e.abort(),s),e.signal}async function he(s){var e,t;if(!s)return[];try{const i=await fetch(new URL("/api/tags",s).toString(),{signal:K(5e3)});if(i.ok){const a=(((e=(await i.json()).models)==null?void 0:e.map(o=>o.name))||[]).filter(o=>!o.includes("embed"));if(a.length>0)return a}}catch{}try{const i=await fetch(new URL("/v1/models",s).toString(),{signal:K(5e3)});if(i.ok)return(((t=(await i.json()).data)==null?void 0:t.map(a=>a.id))||[]).filter(a=>!a.includes("embed"))}catch{}return[]}let L="overview",v,P=null;function $(s,e="ok"){const t=document.getElementById("settingsActionStatus");t&&(t.textContent=s,t.classList.remove("ok","error"),t.classList.add(e))}async function j(s,e){const t=await N(s);if(t){$(`${e}: ${t}`,"ok");return}$(g("modals.settingsWindow.invokeFail",{command:s}),"error")}function R(){N("close_settings_window").then(()=>{},()=>window.close())}function pe(){return ue()||""}let I=null;async function T(s,e){if(!I)try{I=await N("get_local_api_token")}catch{}const t=new Headers(e==null?void 0:e.headers);return I&&t.set("Authorization",`Bearer ${I}`),fetch(`${pe()}${s}`,{...e,headers:t})}const V={overview:'<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 014.33-3.56A15.65 15.65 0 008.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>',ai:'<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1s-2.73 7.08 0 9.79 7.15 2.71 9.88 0C18.32 15.65 19 14.08 19 12.1h2c0 1.98-.88 4.55-2.64 6.29-3.51 3.48-9.21 3.48-12.72 0-3.5-3.47-3.53-9.11-.02-12.58s9.14-3.49 12.65 0L21 3v7.12zM12.5 8v4.25l3.5 2.08-.72 1.21L11 13V8h1.5z"/></svg>',economy:'<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>',markets:'<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z"/></svg>',security:'<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>',tracking:'<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',debug:'<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/></svg>'};function J(s){let e=0;for(const t of s.features)x(t)&&e++;return{ready:e,total:s.features.length}}function X(){let s=0;for(const e of M)x(e.id)&&s++;return{ready:s,total:M.length}}function A(){const s=document.getElementById("sidebarNav");if(!s)return;const e=[],t=X(),i=t.ready===t.total?"dot-ok":t.ready>0?"dot-partial":"dot-warn";e.push(`
    <button class="settings-nav-item${L==="overview"?" active":""}" data-section="overview" role="tab" aria-selected="${L==="overview"}">
      ${V.overview}
      <span class="settings-nav-label">Overview</span>
      <span class="settings-nav-dot ${i}"></span>
    </button>
  `),e.push('<div class="settings-nav-sep"></div>');for(const n of W){const{ready:a,total:o}=J(n),d=a===o?"dot-ok":a>0?"dot-partial":"dot-warn";e.push(`
      <button class="settings-nav-item${L===n.id?" active":""}" data-section="${n.id}" role="tab" aria-selected="${L===n.id}">
        ${V[n.id]||""}
        <span class="settings-nav-label">${u(n.label)}</span>
        <span class="settings-nav-count">${a}/${o}</span>
        <span class="settings-nav-dot ${d}"></span>
      </button>
    `)}e.push('<div class="settings-nav-sep"></div>'),e.push(`
    <button class="settings-nav-item${L==="debug"?" active":""}" data-section="debug" role="tab" aria-selected="${L==="debug"}">
      ${V.debug}
      <span class="settings-nav-label">Debug &amp; Logs</span>
    </button>
  `),s.innerHTML=e.join("")}function C(s){const e=document.getElementById("contentArea");e&&(P&&(P(),P=null),L=s,A(),e.classList.add("fade-out"),e.classList.remove("fade-in"),requestAnimationFrame(()=>{if(s==="overview")me(e);else if(s==="debug")be(e);else{const t=W.find(i=>i.id===s);t&&ye(e,t)}requestAnimationFrame(()=>{e.classList.remove("fade-out"),e.classList.add("fade-in")})}))}function me(s){const{ready:e,total:t}=X(),i=t>0?e/t*100:0,n=2*Math.PI*40,a=n-i/100*n,o=e===t?"var(--settings-green)":e>0?"var(--settings-blue)":"var(--settings-yellow)",d=E("WORLDMONITOR_API_KEY"),l=d.present?"Active":"Not set",r=d.present?"ok":"warn",c=W.map(f=>{const{ready:p,total:h}=J(f);return`<button class="settings-ov-cat ${p===h?"ov-cat-ok":p>0?"ov-cat-partial":"ov-cat-warn"}" data-section="${f.id}">
      <span class="settings-ov-cat-label">${u(f.label)}</span>
      <span class="settings-ov-cat-count">${p}/${h} ready</span>
    </button>`}).join("");s.innerHTML=`
    <div class="settings-overview">
      <div class="settings-ov-progress">
        <svg class="settings-ov-ring" viewBox="0 0 100 100" width="120" height="120">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="${o}" stroke-width="8"
            stroke-linecap="round" stroke-dasharray="${n}" stroke-dashoffset="${a}"
            transform="rotate(-90 50 50)" style="transition:stroke-dashoffset 0.6s ease"/>
        </svg>
        <div class="settings-ov-ring-text">
          <span class="settings-ov-ring-num">${e}</span>
          <span class="settings-ov-ring-label">of ${t} ready</span>
        </div>
      </div>
      <div class="settings-ov-cats">${c}</div>
    </div>

    <div class="settings-ov-license">
      <section class="wm-section">
        <h2 class="wm-section-title">${g("modals.settingsWindow.worldMonitor.apiKey.title")}</h2>
        <p class="wm-section-desc">${g("modals.settingsWindow.worldMonitor.apiKey.description")}</p>
        <div class="wm-key-row">
          <div class="wm-input-wrap">
            <input type="password" class="wm-input" data-wm-key-input
              placeholder="${g("modals.settingsWindow.worldMonitor.apiKey.placeholder")}"
              autocomplete="off" spellcheck="false"
              ${d.present?`value="${b}"`:""} />
            <button type="button" class="wm-toggle-vis" data-wm-toggle title="Show/hide">&#x1f441;</button>
          </div>
          <span class="wm-badge ${r}">${l}</span>
        </div>
      </section>

      <div class="wm-divider"><span>${g("modals.settingsWindow.worldMonitor.dividerOr")}</span></div>

      <section class="wm-section">
        <h2 class="wm-section-title">${g("modals.settingsWindow.worldMonitor.register.title")}</h2>
        <p class="wm-section-desc">${g("modals.settingsWindow.worldMonitor.register.description")}</p>
        ${`
        <div class="wm-register-row">
          <input type="email" class="wm-input wm-email" data-wm-email
            placeholder="${g("modals.settingsWindow.worldMonitor.register.emailPlaceholder")}" />
          <button type="button" class="wm-submit-btn" data-wm-register>
            ${g("modals.settingsWindow.worldMonitor.register.submitBtn")}
          </button>
        </div>
        <p class="wm-reg-status" data-wm-reg-status></p>
        `}
      </section>
    </div>
  `,we(s)}function we(s){var e,t,i;(e=s.querySelector("[data-wm-toggle]"))==null||e.addEventListener("click",()=>{const n=s.querySelector("[data-wm-key-input]");n&&(n.type=n.type==="password"?"text":"password")}),(t=s.querySelector("[data-wm-key-input]"))==null||t.addEventListener("input",n=>{const a=n.target;a.value.startsWith(b)&&(a.value=a.value.slice(b.length))}),(i=s.querySelector("[data-wm-register]"))==null||i.addEventListener("click",async()=>{const n=s.querySelector("[data-wm-email]"),a=s.querySelector("[data-wm-reg-status]"),o=s.querySelector("[data-wm-register]");if(!n||!a||!o)return;const d=n.value.trim();if(!d||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d)){a.textContent=g("modals.settingsWindow.worldMonitor.register.invalidEmail"),a.className="wm-reg-status error";return}o.disabled=!0,o.textContent=g("modals.settingsWindow.worldMonitor.register.submitting");try{const l=Z()?ve():"",c=await(await fetch(`${l}/api/register-interest`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:d,source:"desktop-settings"})})).json();c.status==="already_registered"||c.status==="registered"?(localStorage.setItem("wm-waitlist-registered","1"),a.textContent=c.status==="already_registered"?g("modals.settingsWindow.worldMonitor.register.alreadyRegistered"):g("modals.settingsWindow.worldMonitor.register.success"),a.className="wm-reg-status ok"):(a.textContent=c.error||g("modals.settingsWindow.worldMonitor.register.error"),a.className="wm-reg-status error")}catch{a.textContent=g("modals.settingsWindow.worldMonitor.register.error"),a.className="wm-reg-status error"}finally{o.disabled=!1,o.textContent=g("modals.settingsWindow.worldMonitor.register.submitBtn")}}),s.querySelectorAll(".settings-ov-cat[data-section]").forEach(n=>{n.addEventListener("click",()=>{const a=n.dataset.section;a&&C(a)})})}function ye(s,e){const i=e.features.map(n=>M.find(a=>a.id===n)).filter(Boolean).map(n=>{const a=H(n.id),o=x(n.id),d=k(n),l=!o&&d.every(m=>E(m).valid||v.hasPending(m)&&v.getValidationState(m).validated!==!1),r=o?"ready":l?"staged":"needs",c=o?"ok":l?"staged":"warn",f=o?"Ready":l?"Staged":"Needs keys",p=d.map(m=>Q(m,n.id)).join(""),h=o||l?"":`<p class="settings-feat-fallback">${u(n.fallback)}</p>`;return`
      <div class="settings-feat ${r}" data-feature-id="${n.id}">
        <div class="settings-feat-header" data-feat-toggle-expand="${n.id}">
          <label class="settings-feat-toggle-label" data-click-stop>
            <div class="settings-feat-switch">
              <input type="checkbox" data-toggle="${n.id}" ${a?"checked":""} />
              <span class="settings-feat-slider"></span>
            </div>
          </label>
          <div class="settings-feat-info">
            <span class="settings-feat-name">${u(n.name)}</span>
            <span class="settings-feat-desc">${u(n.description)}</span>
          </div>
          <span class="settings-feat-pill ${c}">${f}</span>
          <span class="settings-feat-chevron">&#x25B8;</span>
        </div>
        <div class="settings-feat-body">
          ${p}
          ${h}
        </div>
      </div>
    `}).join("");s.innerHTML=`
    <div class="settings-section-header">
      <h2>${u(e.label)}</h2>
    </div>
    <div class="settings-feat-list">${i}</div>
  `,ee(s)}function Q(s,e){var y,w;const t=E(s),i=v.hasPending(s),{validated:n,message:a}=v.getValidationState(s),o=Y[s]||s,d=re[s],l=D.has(s),r=d&&!t.present&&!i,c=i?n===!1?"Invalid":"Staged":t.present?t.valid?"Valid":"Looks invalid":"Missing",f=i?n===!1?"warn":"staged":t.valid?"ok":"warn",p=i?n===!1?"invalid":"valid-staged":"",h=i&&n===!1?a||"Invalid value":null;if(s==="OLLAMA_MODEL"){const S=i?v.getPending(s)||"":((y=_().secrets[s])==null?void 0:y.value)||"";return`
      <div class="settings-secret-row">
        <div class="settings-secret-label">${u(o)}</div>
        <span class="settings-secret-status ${f}">${u(c)}</span>
        <select data-model-select data-feature="${e}" class="${p}">
          ${S?`<option value="${u(S)}" selected>${u(S)}</option>`:'<option value="" selected disabled>Loading models...</option>'}
        </select>
        <input type="text" data-model-manual data-feature="${e}" class="${p} hidden-input"
          placeholder="Or type model name" autocomplete="off"
          ${S?`value="${u(S)}"`:""}>
        ${h?`<span class="settings-secret-hint">${u(h)}</span>`:""}
      </div>
    `}const m=r?`<a href="#" data-signup-url="${d}" class="settings-secret-link">Get key</a>`:"";return`
    <div class="settings-secret-row">
      <div class="settings-secret-label">${u(o)}</div>
      <span class="settings-secret-status ${f}">${u(c)}</span>
      <div class="settings-input-wrapper${r?" has-suffix":""}">
        <input type="${l?"text":"password"}" data-secret="${s}" data-feature="${e}"
          placeholder="${i?"Staged":"Enter value..."}" autocomplete="off" class="${p}"
          ${i?`value="${l?u(v.getPending(s)||""):b}"`:l&&t.present?`value="${u(((w=_().secrets[s])==null?void 0:w.value)||"")}"`:""}>
        ${m}
      </div>
      ${h?`<span class="settings-secret-hint">${u(h)}</span>`:""}
    </div>
  `}function ee(s){s.querySelectorAll("[data-feat-toggle-expand]").forEach(t=>{t.addEventListener("click",i=>{if(i.target.closest("[data-click-stop]"))return;const n=t.closest(".settings-feat");n==null||n.classList.toggle("expanded")})}),s.querySelectorAll("input[data-toggle]").forEach(t=>{t.addEventListener("change",()=>{const i=t.dataset.toggle;i&&(le(i,t.checked),ce(i,t.checked),A())})}),s.querySelectorAll("input[data-secret]").forEach(t=>{t.addEventListener("input",()=>{var a;const i=t.dataset.secret;if(!i)return;v.hasPending(i)&&t.value.startsWith(b)&&(t.value=t.value.slice(b.length)),v.setValidation(i,!0),t.classList.remove("valid-staged","invalid");const n=(a=t.closest(".settings-secret-row"))==null?void 0:a.querySelector(".settings-secret-hint");n&&n.remove()}),t.addEventListener("blur",()=>{var r;const i=t.dataset.secret;if(!i)return;const n=t.value.trim();if(!n){v.hasPending(i)&&(v.deletePending(i),C(L));return}if(n===b)return;v.setPending(i,n);const a=B(i,n);a.valid?v.setValidation(i,!0):v.setValidation(i,!1,a.hint||"Invalid format"),D.has(i)?t.value=n:(t.type="password",t.value=b),t.classList.remove("valid-staged","invalid"),t.classList.add(a.valid?"valid-staged":"invalid");const o=(r=t.closest(".settings-secret-row"))==null?void 0:r.querySelector(".settings-secret-status");o&&(o.textContent=a.valid?"Staged":"Invalid",o.className=`settings-secret-status ${a.valid?"staged":"warn"}`);const d=t.closest(".settings-secret-row"),l=d==null?void 0:d.querySelector(".settings-secret-hint");if(l&&l.remove(),!a.valid&&a.hint){const c=document.createElement("span");c.className="settings-secret-hint",c.textContent=a.hint,d==null||d.appendChild(c)}if(q(t.dataset.feature),i==="OLLAMA_API_URL"&&a.valid){const c=s.querySelector("select[data-model-select]");c&&F(c)}A()})}),s.querySelectorAll("a[data-signup-url]").forEach(t=>{t.addEventListener("click",i=>{i.preventDefault();const n=t.dataset.signupUrl;n&&(Z()?ge("open_url",{url:n}).catch(()=>window.open(n,"_blank")):window.open(n,"_blank"))})});const e=s.querySelector("select[data-model-select]");e&&(e.addEventListener("change",()=>{const t=e.value;t&&(v.setPending("OLLAMA_MODEL",t),v.setValidation("OLLAMA_MODEL",!0),e.classList.remove("invalid"),e.classList.add("valid-staged"),q("aiOllama"),A())}),F(e))}function q(s){const e=document.querySelector(`.settings-feat[data-feature-id="${s}"]`);if(!e)return;const t=M.find(l=>l.id===s);if(!t)return;const i=x(s),n=k(t),a=!i&&n.every(l=>E(l).valid||v.hasPending(l)&&v.getValidationState(l).validated!==!1),o=e.classList.contains("expanded");e.className=`settings-feat ${i?"ready":a?"staged":"needs"}${o?" expanded":""}`;const d=e.querySelector(".settings-feat-pill");d&&(d.className=`settings-feat-pill ${i?"ok":a?"staged":"warn"}`,d.textContent=i?"Ready":a?"Staged":"Needs keys")}async function F(s){var o,d,l;const e=_(),t=v.getPending("OLLAMA_API_URL")||((o=e.secrets.OLLAMA_API_URL)==null?void 0:o.value)||"";if(!t){s.innerHTML='<option value="" disabled selected>Set Ollama URL first</option>';return}const i=v.getPending("OLLAMA_MODEL")||((d=e.secrets.OLLAMA_MODEL)==null?void 0:d.value)||"",n=await he(t);if(n.length===0){const r=(l=s.parentElement)==null?void 0:l.querySelector("input[data-model-manual]");r&&(s.style.display="none",r.classList.remove("hidden-input"),r.dataset.listenerAttached||(r.dataset.listenerAttached="1",r.addEventListener("blur",()=>{const c=r.value.trim();c&&(v.setPending("OLLAMA_MODEL",c),v.setValidation("OLLAMA_MODEL",!0),r.classList.remove("invalid"),r.classList.add("valid-staged"),q("aiOllama"),A())})));return}const a=i?"":'<option value="" selected disabled>Select a model...</option>';s.innerHTML=a+n.map(r=>`<option value="${u(r)}" ${r===i?"selected":""}>${u(r)}</option>`).join("")}function be(s){var e,t;s.innerHTML=`
    <div class="settings-section-header">
      <h2>Debug &amp; Logs</h2>
    </div>
    <div class="debug-actions">
      <button id="openLogsBtn" type="button">Open Logs Folder</button>
      <button id="openSidecarLogBtn" type="button">Open API Log</button>
    </div>
    <section class="settings-diagnostics" id="diagnosticsSection">
      <header class="diag-header">
        <h2>Diagnostics</h2>
        <div class="diag-toggles">
          <label><input type="checkbox" id="verboseApiLog"> Verbose Sidecar Log</label>
          <label><input type="checkbox" id="fetchDebugLog"> Frontend Fetch Debug</label>
        </div>
      </header>
      <div class="diag-traffic-bar">
        <h3>API Traffic <span id="trafficCount"></span></h3>
        <div class="diag-traffic-controls">
          <label><input type="checkbox" id="autoRefreshLog" checked> Auto</label>
          <button id="refreshLogBtn" type="button">Refresh</button>
          <button id="clearLogBtn" type="button">Clear</button>
        </div>
      </div>
      <div id="trafficLog" class="diag-traffic-log"></div>
    </section>
  `,(e=s.querySelector("#openLogsBtn"))==null||e.addEventListener("click",()=>{j("open_logs_folder",g("modals.settingsWindow.openLogs"))}),(t=s.querySelector("#openSidecarLogBtn"))==null||t.addEventListener("click",()=>{j("open_sidecar_log_file",g("modals.settingsWindow.openApiLog"))}),Le()}function Le(){const s=document.getElementById("verboseApiLog"),e=document.getElementById("fetchDebugLog"),t=document.getElementById("autoRefreshLog"),i=document.getElementById("refreshLogBtn"),n=document.getElementById("clearLogBtn"),a=document.getElementById("trafficLog"),o=document.getElementById("trafficCount");e&&(e.checked=localStorage.getItem("wm-debug-log")==="1",e.addEventListener("change",()=>{localStorage.setItem("wm-debug-log",e.checked?"1":"0")}));async function d(){if(s)try{const h=await(await T("/api/local-debug-toggle")).json();s.checked=h.verboseMode}catch{}}s==null||s.addEventListener("change",async()=>{try{const h=await(await T("/api/local-debug-toggle",{method:"POST"})).json();s&&(s.checked=h.verboseMode),$(h.verboseMode?g("modals.settingsWindow.verboseOn"):g("modals.settingsWindow.verboseOff"),"ok")}catch{$(g("modals.settingsWindow.sidecarError"),"error")}}),d();async function l(){if(a)try{const m=(await(await T("/api/local-traffic-log")).json()).entries||[];if(o&&(o.textContent=`(${m.length})`),m.length===0){a.innerHTML=`<p class="diag-empty">${g("modals.settingsWindow.noTraffic")}</p>`;return}const y=m.slice().reverse().map(w=>{var z;const S=((z=w.timestamp.split("T")[1])==null?void 0:z.replace("Z",""))||w.timestamp;return`<tr class="diag-${w.status<300?"ok":w.status<500?"warn":"err"}"><td>${u(S)}</td><td>${w.method}</td><td title="${u(w.path)}">${u(w.path)}</td><td>${w.status}</td><td>${w.durationMs}ms</td></tr>`}).join("");a.innerHTML=`<table class="diag-table"><thead><tr><th>${g("modals.settingsWindow.table.time")}</th><th>${g("modals.settingsWindow.table.method")}</th><th>${g("modals.settingsWindow.table.path")}</th><th>${g("modals.settingsWindow.table.status")}</th><th>${g("modals.settingsWindow.table.duration")}</th></tr></thead><tbody>${y}</tbody></table>`}catch{a.innerHTML=`<p class="diag-empty">${g("modals.settingsWindow.sidecarUnreachable")}</p>`}}i==null||i.addEventListener("click",()=>void l()),n==null||n.addEventListener("click",async()=>{try{await T("/api/local-traffic-log",{method:"DELETE"})}catch{}a&&(a.innerHTML=`<p class="diag-empty">${g("modals.settingsWindow.logCleared")}</p>`),o&&(o.textContent="(0)")});let r=null;function c(){f(),r=setInterval(()=>void l(),3e3)}function f(){r&&(clearInterval(r),r=null)}t==null||t.addEventListener("change",()=>{t.checked?c():f()}),l(),c(),P=f}function U(s,e){const t=u(s),i=u(e);if(!i)return t;const n=new RegExp(`(${i.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`,"gi");return t.replace(n,"<mark>$1</mark>")}function $e(s){const e=document.getElementById("contentArea");if(!e)return;if(!s.trim()){C(L);return}const t=s.toLowerCase(),i=[];for(const a of W)for(const o of a.features){const d=M.find(r=>r.id===o);if(!d)continue;[d.name,d.description,...k(d).map(r=>Y[r]||r)].join(" ").toLowerCase().includes(t)&&i.push({feature:d,catLabel:a.label})}if(i.length===0){e.innerHTML=`<div class="settings-search-empty"><p>No features match "${u(s)}"</p></div>`;return}const n=i.map(({feature:a,catLabel:o})=>{const d=H(a.id),l=x(a.id),r=k(a),c=!l&&r.every(y=>E(y).valid||v.hasPending(y)&&v.getValidationState(y).validated!==!1),f=l?"ready":c?"staged":"needs",p=l?"ok":c?"staged":"warn",h=l?"Ready":c?"Staged":"Needs keys",m=r.map(y=>Q(y,a.id)).join("");return`
      <div class="settings-feat ${f} expanded" data-feature-id="${a.id}">
        <div class="settings-feat-header" data-feat-toggle-expand="${a.id}">
          <label class="settings-feat-toggle-label" data-click-stop>
            <div class="settings-feat-switch">
              <input type="checkbox" data-toggle="${a.id}" ${d?"checked":""} />
              <span class="settings-feat-slider"></span>
            </div>
          </label>
          <div class="settings-feat-info">
            <span class="settings-feat-name">${U(a.name,s)}</span>
            <span class="settings-feat-desc">${U(a.description,s)}</span>
          </div>
          <span class="settings-feat-pill ${p}">${h}</span>
          <span class="settings-feat-chevron">&#x25B8;</span>
        </div>
        <div class="settings-feat-body">
          <div class="settings-feat-cat-tag">${u(o)}</div>
          ${m}
        </div>
      </div>
    `}).join("");e.innerHTML=`
    <div class="settings-section-header">
      <h2>Search results for "${u(s)}"</h2>
    </div>
    <div class="settings-feat-list">${n}</div>
  `,ee(e)}async function Se(){var t,i,n;await ne(),ie();try{await oe()}catch{}requestAnimationFrame(()=>{document.documentElement.classList.remove("no-transition")}),await de(),v=new fe,C("overview"),(t=document.getElementById("sidebarNav"))==null||t.addEventListener("click",a=>{const o=a.target.closest("[data-section]");o!=null&&o.dataset.section&&C(o.dataset.section)});const s=document.getElementById("settingsSearch");let e;s==null||s.addEventListener("input",()=>{clearTimeout(e),e=setTimeout(()=>$e(s.value),200)}),(i=document.getElementById("okBtn"))==null||i.addEventListener("click",()=>{(async()=>{try{const a=document.querySelector("[data-wm-key-input]"),o=a==null?void 0:a.value.trim(),d=!!(o&&o!==b&&o.length>0),l=document.getElementById("contentArea");l&&v.captureUnsavedInputs(l);const r=v.hasPendingChanges();if(!r&&!d){R();return}if(d&&o&&await G("WORLDMONITOR_API_KEY",o),r){$(g("modals.settingsWindow.validating"),"ok");const c=v.getMissingRequiredSecrets();if(c.length>0){$(`Missing required: ${c.join(", ")}`,"error");return}const f=await v.verifyPendingSecrets();if(f.length>0){$(g("modals.settingsWindow.verifyFailed",{errors:f.join(", ")}),"error");return}await v.commitVerifiedSecrets()}$(g("modals.settingsWindow.saved"),"ok"),R()}catch(a){console.error("[settings] save error:",a),$(g("modals.settingsWindow.failed",{error:String(a)}),"error")}})()}),(n=document.getElementById("cancelBtn"))==null||n.addEventListener("click",()=>{R()}),window.addEventListener("beforeunload",()=>{v.destroy()})}localStorage.setItem("wm-settings-open","1");window.addEventListener("beforeunload",()=>localStorage.removeItem("wm-settings-open"));Se();
