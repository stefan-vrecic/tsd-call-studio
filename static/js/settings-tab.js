// settings-tab.js -- the Settings tab: for each tab you can HIDE / SHOW it (eye icon; Settings itself can't be hidden), RENAME it (click its name, type, Enter; empty = the original name) and pick (all optional; a tab you leave alone keeps the normal look)
//   * a TAB colour  -- the background of its button in the top bar (text switches to white/dark so it stays readable)
//   * a PAGE colour -- the background of the page that tab shows
// Stored in this browser (localStorage "tabButtonColors" and "tabColors" = {tabKey: "#rrggbb"}) and applied straight away.
// Plain script (not a module): shares one global scope with the other files; load it after live-call.js.

// tab key -> the element that is that tab's page (from tab-registry.js; a React page has none, the sidebar colours it)
const stViews = Object.fromEntries(CS_TABS.map(t => [t.key, t.view || '']));
const stRows = document.getElementById('st-rows');
const stNotifyPreferences = () => window.dispatchEvent(new CustomEvent('app:preferences-changed'));
const stButtons = () => [...document.querySelectorAll('#app-tabs > .app-tab[id^="tab-"]:not(.app-site)')];   // page tabs and the Links menu; external destinations have their own editor
const stLoad = (key) => { try { return JSON.parse(liveStore(key) || '{}') || {}; } catch (e) { return {}; } };
let stPage = stLoad('tabColors');          // page backgrounds
let stBtn = stLoad('tabButtonColors');     // top-bar button backgrounds
const STORE = { page: 'tabColors', btn: 'tabButtonColors' };
// tab names: localStorage "tabNames" = {tabKey: "new label"}; the original label is remembered on the button (data-default-label)
let stNames = stLoad('tabNames');
let stHotkeys = window.TabHotkeys.load();
const stHotkeysEnabled = document.getElementById('st-hotkeys-enabled');
stHotkeysEnabled.checked = window.TabHotkeys.enabled();
stHotkeysEnabled.onchange = () => { liveStore('tabHotkeysEnabled', stHotkeysEnabled.checked ? '1' : '0'); stNotifyPreferences(); };
stButtons().forEach(btn => { btn.dataset.defaultLabel = btn.textContent.trim(); });
function stApplyName(key) {
  const btn = document.getElementById('tab-' + key);
  if (btn) btn.textContent = (stNames[key] || btn.dataset.defaultLabel) + (btn.dataset.suffix ? ' ' + btn.dataset.suffix : '');   // a tab can carry a live suffix, e.g. Buffers (3)
}
function stSaveNames() { liveStore('tabNames', JSON.stringify(stNames)); stNotifyPreferences(); }
// hidden tabs: localStorage "tabHidden" = {tabKey: true}; a hidden tab's button is just not shown (its page and data are untouched)
let stHidden = stLoad('tabHidden');
function stApplyHidden(key) { const btn = document.getElementById('tab-' + key); if (btn) btn.style.display = stHidden[key] ? 'none' : ''; }
function stSaveHidden() { liveStore('tabHidden', JSON.stringify(stHidden)); stNotifyPreferences(); }
const ST_EYE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const ST_EYE_OFF = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/></svg>';
// One-off: the first version of this tab saved the colours you picked as PAGE colours, but they were meant for the tab buttons --
// move whatever was picked then over to the Tab column (the Page column starts empty).
if (liveStore('tabColorsMigrated') !== '1') {
  if (Object.keys(stPage).length && !Object.keys(stBtn).length) { stBtn = stPage; stPage = {}; liveStore('tabButtonColors', JSON.stringify(stBtn)); liveStore('tabColors', '{}'); }
  liveStore('tabColorsMigrated', '1');
}
const stColorsOf = (kind) => (kind === 'btn' ? stBtn : stPage);

function stReadableText(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#111' : '#fff';
}
function stApply(kind, key) {
  const color = stColorsOf(kind)[key] || '';
  if (kind === 'page') {
    const el = document.getElementById(stViews[key]);
    if (el) el.style.background = color;                    // '' puts the normal look back
  } else {
    const btn = document.getElementById('tab-' + key);
    if (btn) { btn.style.background = color; btn.style.color = color ? stReadableText(color) : ''; }
  }
}
const stSave = (kind) => { liveStore(STORE[kind], JSON.stringify(stColorsOf(kind))); stNotifyPreferences(); };

function stSwatch(kind, key, row, label) {
  const wrap = document.createElement('label'); wrap.className = 'st-swatch'; wrap.title = label;
  const cap = document.createElement('span'); cap.textContent = label;
  const input = document.createElement('input'); input.type = 'color';
  const set = () => { input.value = stColorsOf(kind)[key] || '#dce4ef'; input.classList.toggle('st-swatch-off', !stColorsOf(kind)[key]); };
  set();
  input.addEventListener('input', () => { stColorsOf(kind)[key] = input.value; input.classList.remove('st-swatch-off'); row.classList.add('st-on'); stApply(kind, key); stSave(kind); });
  wrap.append(cap, input);
  wrap._refresh = set;
  return wrap;
}

function stBuild() {
  stRows.innerHTML = '';
  const head = document.createElement('div'); head.className = 'st-row st-head';
  head.innerHTML = '<span class="st-eye-spacer"></span><span class="st-name"></span><span class="st-colhead">Tab (top bar)</span><span class="st-colhead">Page</span><span class="st-hotkey-head">Hotkey</span><span class="st-reset-spacer"></span>';
  stRows.appendChild(head);
  const stMakeRow = (btn) => {
    const key = btn.id.replace(/^tab-/, '');
    const hasPage = key in stViews;   // Links / Stripe / Calendar / Chanty open a menu or another site: no page colour for them
    const row = document.createElement('div');
    row.className = 'st-row' + (stBtn[key] || stPage[key] || stNames[key] || stHidden[key] || stHotkeys[key] ? ' st-on' : '');
    const def = btn.dataset.defaultLabel;
    const name = document.createElement('input'); name.type = 'text'; name.className = 'st-name st-nameinput'; name.value = stNames[key] || def; name.placeholder = def;
    name.title = 'Click to rename this tab (emoji welcome). Empty puts the original name back.'; name.spellcheck = false;
    const commit = () => {   // Enter, clicking away and the browser's own "change" all end up here (saving twice is harmless)
      const v = name.value.trim();
      if (!v || v === def) { delete stNames[key]; name.value = def; } else { stNames[key] = v; }
      stApplyName(key); stSaveNames(); row.classList.toggle('st-on', !!(stBtn[key] || stPage[key] || stNames[key] || stHidden[key] || stHotkeys[key]));
    };
    name.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { commit(); name.blur(); } if (e.key === 'Escape') { name.value = stNames[key] || def; name.blur(); } });
    name.addEventListener('blur', commit);
    name.addEventListener('change', commit);
    const eye = document.createElement('button'); eye.className = 'st-eye';
    const paintEye = () => {
      const hid = !!stHidden[key];
      eye.innerHTML = hid ? ST_EYE_OFF : ST_EYE; row.classList.toggle('st-hidden', hid);
      eye.title = key === 'settings' ? "The Settings tab can't be hidden (it's how you bring tabs back)" : hid ? 'Hidden from the top bar: click to show this tab' : 'Showing in the top bar: click to hide this tab';
      eye.setAttribute('aria-label', eye.title); eye.setAttribute('aria-pressed', String(hid));
    };
    if (key === 'settings') eye.disabled = true;
    eye.onclick = () => { if (key === 'settings') return; if (stHidden[key]) delete stHidden[key]; else stHidden[key] = true; stApplyHidden(key); stSaveHidden(); stBuild(); };   // (rebuild: it moves to / out of Hidden)
    paintEye();
    const tabSw = stSwatch('btn', key, row, 'Tab');
    const pageSw = hasPage ? stSwatch('page', key, row, 'Page') : Object.assign(document.createElement('span'), { className: 'st-swatch-none', title: 'This one has no page of its own', _refresh() {} });
    const hotkey = document.createElement('button'); hotkey.type = 'button'; hotkey.className = 'ctl st-hotkey';
    const paintHotkey = () => { hotkey.textContent = window.TabHotkeys.label(stHotkeys[key]); hotkey.classList.toggle('set', !!stHotkeys[key]); hotkey.title = stHotkeys[key] ? 'Click to replace. Backspace clears it.' : 'Click, then press a keyboard shortcut.'; };
    paintHotkey();
    hotkey.onclick = () => {
      if (hotkey.classList.contains('recording')) return;
      const previous = stHotkeys[key] || '';
      document.body.classList.add('recording-hotkey'); hotkey.classList.add('recording'); hotkey.textContent = 'Press keys…';
      const finish = () => { document.body.classList.remove('recording-hotkey'); hotkey.classList.remove('recording'); paintHotkey(); document.removeEventListener('keydown', record, true); };
      const record = (event) => {
        event.preventDefault(); event.stopPropagation();
        if (event.key === 'Escape') { finish(); return; }
        if (event.key === 'Backspace' || event.key === 'Delete') { delete stHotkeys[key]; window.TabHotkeys.save(stHotkeys); finish(); stBuild(); return; }
        const value = window.TabHotkeys.canonical(event);
        if (!value) return;
        if (!/(Meta|Ctrl|Alt)\+/.test(value) && !/^F\d{1,2}$/.test(value)) { hotkey.textContent = 'Add ⌘/⌃/⌥'; return; }
        if (window.TabHotkeys.isReserved(value)) { hotkey.textContent = 'System shortcut'; hotkey.title = 'macOS or the browser owns this shortcut. Try Option + a letter.'; return; }
        const conflict = Object.entries(stHotkeys).find(([other, assigned]) => other !== key && assigned === value);
        if (conflict) { const other = document.getElementById('tab-' + conflict[0]); hotkey.textContent = 'Already: ' + (other ? other.textContent.trim() : conflict[0]); return; }
        stHotkeys[key] = value; window.TabHotkeys.save(stHotkeys); finish(); stBuild();
      };
      document.addEventListener('keydown', record, true);
      setTimeout(() => { if (hotkey.classList.contains('recording') && (stHotkeys[key] || '') === previous) hotkey.title = 'Press a shortcut. Escape cancels; Backspace clears.'; }, 0);
    };
    const reset = document.createElement('button'); reset.className = 'ctl st-reset'; reset.textContent = 'Reset'; reset.title = 'Reset this tab\'s name, visibility, colours and hotkey';
    reset.onclick = () => {
      ['btn', 'page'].forEach(k => { delete stColorsOf(k)[key]; stApply(k, key); stSave(k); });
      delete stNames[key]; stApplyName(key); stSaveNames(); name.value = def;
      delete stHidden[key]; stApplyHidden(key); stSaveHidden(); paintEye();
      delete stHotkeys[key]; window.TabHotkeys.save(stHotkeys); paintHotkey();
      tabSw._refresh(); pageSw._refresh(); row.classList.remove('st-on');
    };
    row.append(eye, name, tabSw, pageSw, hotkey, reset);
    row.dataset.tab = key;
    row.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); stRowMenu(e, key, stNames[key] || def); });
    return row;
  };
  // grouped like the sidebar (Workspace, Calls, Business ...), with every hidden tab together at the bottom
  const groupOf = Object.fromEntries(CS_TABS.map(t => [t.key, t.group])), order = ['Workspace', 'Calls', 'Business', 'Content', 'Personal', 'Links', 'System', 'Other', 'Hidden'];
  const groups = {};
  stButtons().forEach(btn => {
    const key = btn.id.replace(/^tab-/, ''), g = stHidden[key] && key !== 'settings' ? 'Hidden' : groupOf[key] || (key === 'links' ? 'Links' : 'Other');
    (groups[g] = groups[g] || []).push(btn);
  });
  order.filter(g => groups[g]).forEach(g => {
    const h = document.createElement('div'); h.className = 'st-group' + (g === 'Hidden' ? ' st-group-hidden' : ''); h.dataset.group = g.toLowerCase();
    h.innerHTML = `<span>${g === 'Hidden' ? '🙈 Hidden' : g}</span><small>${groups[g].length}</small>`;
    stRows.appendChild(h);
    groups[g].forEach(btn => stRows.appendChild(stMakeRow(btn)));
  });
}
// right-click a tab's row: ↗ Jump to it (or show / hide it)
function stRowMenu(e, key, label) {
  csMenu(e, [{ heading: label },
    { text: '↗ Jump to ' + label, onClick: () => { if (typeof window.callStudioOpenRoute === 'function') window.callStudioOpenRoute(key, document.getElementById('tab-' + key)); else document.getElementById('tab-' + key)?.click(); } },
    key !== 'settings' && { text: stHidden[key] ? '👁 Show this tab' : '🙈 Hide this tab', onClick: () => { if (stHidden[key]) delete stHidden[key]; else stHidden[key] = true; stApplyHidden(key); stSaveHidden(); stBuild(); } }]);
}

document.getElementById('st-reset-all').onclick = () => {
  ['btn', 'page'].forEach(k => { Object.keys(stColorsOf(k)).forEach(key => { delete stColorsOf(k)[key]; stApply(k, key); }); stSave(k); });
  Object.keys(stNames).forEach(key => { delete stNames[key]; stApplyName(key); }); stSaveNames();
  Object.keys(stHidden).forEach(key => { delete stHidden[key]; stApplyHidden(key); }); stSaveHidden();
  stHotkeys = {}; window.TabHotkeys.save(stHotkeys);
  stBuild();
};
Object.keys(stNames).forEach(stApplyName);
Object.keys(stHidden).forEach(stApplyHidden);
Object.keys(stBtn).forEach(k => stApply('btn', k));
Object.keys(stPage).forEach(k => stApply('page', k));
stBuild();
window.addEventListener('load', stBuild);   // again once the sidebar (a module, run later) has said which group each tab is in

// The visible React shell can also hide a tab. Pull that change into this legacy Settings model
// so its eye icon can immediately bring the tab back without a reload.
window.addEventListener('app:tab-visibility', (event) => {
  const key = event.detail && event.detail.key;
  if (!key || key === 'settings') return;
  if (event.detail.hidden) stHidden[key] = true; else delete stHidden[key];
  stApplyHidden(key); liveStore('tabHidden', JSON.stringify(stHidden)); stBuild();
});

// right-click a tab in the top bar -> "Hide this tab" (the menu item is built in live-call.js): same hiding as the eye icons above
document.addEventListener('click', (e) => {
  const item = e.target.closest('[data-hide-tab]');
  if (!item) return;
  const key = item.dataset.hideTab;
  if (key === 'settings') return;
  stHidden[key] = true; stApplyHidden(key); stSaveHidden(); stBuild();   // stBuild redraws the Settings list so its eye icon shows "hidden"
  ctxMenu.style.display = 'none';
  if (liveStore('appTab') === key) showTab('studio');   // don't leave the page of a tab you just hid on screen
  ctxToast('Tab hidden. Bring it back with the eye icon in Settings.');
}, true);

// right-click a tab -> "🎨 Tab colour…" opens the browser's colour picker for that tab's button, applied as you pick (same colour as the Settings tab's Tab swatch);
// "↺ Reset tab colour" puts the normal look back. The menu items are built in live-call.js.
document.addEventListener('click', (e) => {
  const reset = e.target.closest('[data-color-reset]'), pick = e.target.closest('[data-color-tab]');
  if (!reset && !pick) return;
  const key = (reset || pick).dataset.colorReset || (reset || pick).dataset.colorTab;
  const r = ctxMenu.getBoundingClientRect();
  ctxMenu.style.display = 'none';
  if (reset) { delete stBtn[key]; stApply('btn', key); stSave('btn'); stBuild(); return; }
  let inp = document.getElementById('st-color-pop');
  if (!inp) { inp = document.createElement('input'); inp.type = 'color'; inp.id = 'st-color-pop'; inp.style.cssText = 'position:fixed;width:2px;height:2px;opacity:0;border:0;padding:0;z-index:3500'; document.body.appendChild(inp); }
  inp.style.left = r.left + 'px'; inp.style.top = r.top + 'px';   // the picker opens beside where the menu was
  inp.value = stBtn[key] || '#dce4ef';
  inp.oninput = () => { stBtn[key] = inp.value; stApply('btn', key); stSave('btn'); stBuild(); };
  inp.click();
}, true);

// Hover previews: per place, an on/off box and the seconds to rest the mouse before the pop-up shows (stored by hover-prefs.js)
(function stHoverRows() {
  const box = document.getElementById('st-hover-rows');
  Object.entries(HOVER_PLACES).forEach(([name, place]) => {
    const h = hoverGet(name), row = document.createElement('label'); row.className = 'st-hover-row';
    row.innerHTML = `<input type="checkbox"${h.on ? ' checked' : ''}><span class="st-hover-name">${place.label}</span><input type="number" min="0.1" max="10" step="0.1" value="${h.secs}"><span>seconds</span>`;
    const [on, secs] = row.querySelectorAll('input');
    const sync = () => { secs.disabled = !on.checked; row.classList.toggle('off', !on.checked); };
    on.onchange = () => { hoverSet(name, { on: on.checked }); sync(); };
    secs.onchange = () => { const v = parseFloat(secs.value); if (Number.isFinite(v) && v >= 0.1) hoverSet(name, { secs: Math.min(v, 10) }); secs.value = hoverGet(name).secs; };
    secs.addEventListener('keydown', (e) => e.stopPropagation());
    sync(); box.appendChild(row);
  });
})();
