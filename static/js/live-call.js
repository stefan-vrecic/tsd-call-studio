// live-call.js -- the top tab bar (Call Studio | Live Call | SCP Onboarding | Pre-Call Checklist | Self Development | Purchase List | Agreement Links | Links | Stripe | Calendar | Chanty; the last four are right-click only) and the "Replace PDF" buttons.
// The pieces: live-pdf.js draws the PDFs, live-dock.js arranges the Live Call windows, live-notes.js is the notes pad.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const liveView = document.getElementById('live-view');
const liveLayout = document.getElementById('layout');
const onboardingView = document.getElementById('onboarding-view');
const STATIC_VIEWS = Object.fromEntries(CS_TABS.filter(t => t.kind === 'page').map(t => [t.key, document.getElementById(t.view)]));   // plain pages (tab-registry.js)
const staticScroll = {};
const LIVE_VIEW_SLOTS = { live: ['script', 'objections'], onboarding: ['onboarding'] }; // which PDFs each tab shows
const liveOpened = {};  // tabs whose content has been set up

function liveStore(key, value) {   // = csStore (shared.js); kept under this name, many files use it
  return csStore(key, value);
}

const LIVE_TAB_KEYS = CS_LEGACY_TABS.map(t => t.key);   // (tab-registry.js)
let liveFromUrl = false;
const liveTabFromUrl = () => { const k = location.hash.replace(/^#\/?/, '').split('/')[0]; return LIVE_TAB_KEYS.includes(k) ? k : null; };
const modernTabFromUrl = () => { const k = location.hash.replace(/^#\/?/, '').split('/')[0]; return CS_REACT_TABS.some(t => t.key === k) ? k : null; };
// the loaders some tabs run when they are opened (a click runs them too; the back button and a typed URL come through here)
function liveTabHook(t) { csRunOpen(t); }   // each tab's loaders are listed in tab-registry.js
window.addEventListener('popstate', () => { if (modernTabFromUrl()) return;   // Back / Forward onto a React page (Kanban, Weather ...): the React shell shows it; don't swap in Home
  const t = liveTabFromUrl() || 'studio'; liveFromUrl = true; try { showTab(t); liveTabHook(t); } finally { liveFromUrl = false; } });

function showTab(which) {
  liveSaveScrolls(); // a hidden box forgets its scroll position, so note where each PDF was
  Object.entries(STATIC_VIEWS).forEach(([k, v]) => { if (v.style.display !== 'none') staticScroll[k] = v.scrollTop; });
  liveLayout.style.display = which === 'studio' ? '' : 'none';
  liveView.style.display = which === 'live' ? 'flex' : 'none';
  onboardingView.style.display = which === 'onboarding' ? 'flex' : 'none';
  Object.entries(STATIC_VIEWS).forEach(([k, v]) => { v.style.display = which === k ? 'block' : 'none'; if (which === k) v.scrollTop = staticScroll[k] || 0; });
  document.getElementById('live-reset').style.display = which === 'live' ? '' : 'none';
  LIVE_TAB_KEYS.forEach(t => {
    const b = document.getElementById('tab-' + t);
    b.classList.toggle('active', t === which);
    b.setAttribute('aria-selected', String(t === which));
  });
  liveStore('appTab', which);
  if (typeof tabLayoutApply === 'function') tabLayoutApply(which);   // side bar: left, or right on Call Studio (tab-layout.js)
  // Non-call pages always live at /#tab. A selected person's /Name route belongs only to Call Studio,
  // otherwise the address bar misleadingly looks as though Purchases/Agreements/etc. belong to that client.
  const selectedCall = typeof current !== 'undefined' && current && current.name;
  const targetUrl = which === 'studio' ? (selectedCall ? '/' + encodeURIComponent(selectedCall) : '/#studio') : '/#' + which;
  const currentUrl = location.pathname + location.search + location.hash;
  if (!liveFromUrl && currentUrl !== targetUrl) history.pushState(null, '', targetUrl);
  else if (liveFromUrl && which !== 'studio' && currentUrl !== targetUrl) history.replaceState(null, '', targetUrl);
  // The React shell owns Home and Swipe Gallery. Tell it whenever older code (quick jump, hotkeys,
  // voice commands, or a legacy tab button) opens a legacy page so it removes any modern page on top.
  window.dispatchEvent(new CustomEvent('callstudio:legacy-route', { detail: which }));
  if (which in STATIC_VIEWS || which === 'studio' || csTab(which)?.kind === 'react') return;
  if (!liveOpened[which]) {
    liveOpened[which] = true;
    if (which === 'live') { liveRenderDock(); liveNotesLoad(); }
    loadLiveDocs(LIVE_VIEW_SLOTS[which]);
  } else {
    liveRestoreScrolls(LIVE_VIEW_SLOTS[which]);
  }
}

// ---- the tab bar wraps onto a second line when the window is too narrow: keep --tabs-h = its real height (the pages use 100vh - it)
new ResizeObserver(() => document.documentElement.style.setProperty('--tabs-h', document.body.classList.contains('tabs-side') ? '0px' : document.getElementById('app-tabs').offsetHeight + 'px')).observe(document.getElementById('app-tabs'));   // 0 when the tabs are a side bar (tab-layout.js)

// ---- replace a PDF with a newer one
let liveReplaceSlot = null;
const liveFileInput = document.getElementById('live-file-input');
document.querySelectorAll('[data-replace]').forEach(b => {
  b.onclick = () => { liveReplaceSlot = b.dataset.replace; liveFileInput.value = ''; liveFileInput.click(); };
});
liveFileInput.onchange = async () => {
  const file = liveFileInput.files[0];
  if (!file || !liveReplaceSlot) return;
  const label = document.getElementById('live-file-' + liveReplaceSlot);
  label.textContent = 'Uploading…';
  try {
    const res = await fetch('/api/live-doc-upload?slot=' + liveReplaceSlot, { method: 'POST', body: file, headers: { 'X-Filename': encodeURIComponent(file.name) } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'upload failed');
    await loadLiveDocs([liveReplaceSlot]);
  } catch (e) {
    label.textContent = '⚠️ ' + (e.message || e);
  }
};

// every (non-React) tab button: show its page, then run its loaders (tab-registry.js)
CS_LEGACY_TABS.forEach(t => { document.getElementById('tab-' + t.key).onclick = () => { showTab(t.key); csRunOpen(t.key); }; });
// A page opened for one call (/KarenDranfield, /?person=X -- e.g. a link opened in a new browser tab) always starts on Call Studio;
// otherwise (and on a refresh -- the address bar shows the open call's link then too) reopen on the tab you left it on.
const liveIsReload = (performance.getEntriesByType('navigation')[0] || {}).type === 'reload';
const liveOpenedForCall = !liveIsReload && (location.pathname.length > 1 || new URLSearchParams(location.search).has('person'));
const liveUrlTab = liveTabFromUrl();
const modernUrlTab = modernTabFromUrl();
if (modernUrlTab) { liveFromUrl = true; showTab('home'); liveFromUrl = false; history.replaceState(null, '', '#' + modernUrlTab); } // a lightweight legacy view stays behind the React-owned page
else if (liveUrlTab) { liveFromUrl = true; showTab(liveUrlTab); liveFromUrl = false; history.replaceState(null, '', location.hash); }   // a link / refresh with #tab opens that tab
else if (!liveOpenedForCall && LIVE_TAB_KEYS.includes(liveStore('appTab')) && liveStore('appTab') !== 'studio') showTab(liveStore('appTab'));
else if (!liveOpenedForCall && !liveStore('appTab')) showTab('home');

// ---- right-click the tab bar: a Links menu: the Google Docs behind the script, onboarding and objections PDFs, plus the Commissions sheet
let LIVE_LINKS = [
  ['✉️ Mail', 'https://mail.google.com/'],
  ['🎼 SightReading', 'https://sightreadingfactory.com/'],
];
fetch('/api/records?name=company-links').then(r => r.ok ? r.json() : null).then(doc => {
  if (Array.isArray(doc?.links) && doc.links.length) {
    LIVE_LINKS = doc.links.filter(item => Array.isArray(item) && item.length === 2 && String(item[1]).startsWith('https://'));
  }
}).catch(() => {});
document.getElementById('app-tabs').addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const site = e.target.closest('.app-site'); // Stripe / Calendar / Chanty: right-click gives a single "Open" item (a left click opens the site too)
  const tabBtn = e.target.closest('#app-tabs > .app-tab');
  // right-click ON a tab: "Hide this tab" (Settings can't be hidden: it's how you bring tabs back); handled in settings-tab.js
  const tabKey = tabBtn && tabBtn.id ? tabBtn.id.replace(/^tab-/, '') : '';
  const hideItem = tabKey && tabKey !== 'settings' ? `<div class="item" data-hide-tab="${tabKey}">🙈 Hide this tab</div>` : '';
  // "Tab colour…" opens the colour picker for this tab's button (settings-tab.js); "Reset" only shows when a colour is set
  const colorItem = tabKey ? `<div class="item" data-color-tab="${tabKey}">🎨 Tab colour…</div>` + (tabBtn.style.background ? `<div class="item" data-color-reset="${tabKey}">↺ Reset tab colour</div>` : '') : '';
  if (site) {
    const name = site.textContent.replace('↗', '').replace(/^[^A-Za-z]+/, '').trim(); // just the word, without the emoji
    ctxMenu.innerHTML = `<a class="item" href="${escapeHtml(site.dataset.url)}" target="_blank" rel="noopener">↗ Open ${escapeHtml(name)}</a>` + colorItem + hideItem;
  } else {
    ctxMenu.innerHTML = colorItem + hideItem + (hideItem || colorItem ? '<div class="ctx-divider"></div>' : '') + '<div class="ctx-heading">Links</div>' +
      LIVE_LINKS.map(([label, url]) => `<a class="item" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`).join('') +
      '<div class="item" id="ctx-tab-reset">↺ Reset tab order</div>' +
      `<div class="item" id="ctx-tab-layout">${document.body.classList.contains('tabs-side') ? '⬒ Move tabs to the top bar' : '◧ Move tabs to the side bar'}</div>`;   // handled in tab-order.js
  }
  placeCtxMenu(e.clientX, e.clientY);
});

// External links: delegated so links added in Settings work immediately without a reload.
document.getElementById('app-tabs').addEventListener('click', (e) => {
  const b = e.target.closest('.app-site'); if (!b) return;
  e.preventDefault();
  const a = document.createElement('a');   // a real link click: always opens a normal new tab (window.open can be treated as a pop-up)
  a.href = b.dataset.url; a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
});

// Left-clicking the Links tab opens the same menu just under the button (clicking it again, or anywhere else, closes it).
document.getElementById('tab-links').addEventListener('click', (e) => {
  e.stopPropagation();   // the page-wide click handler would close the menu straight away
  if (ctxMenu.style.display === 'block' && ctxMenu.querySelector('.ctx-heading') && ctxMenu.querySelector('.ctx-heading').textContent === 'Links') { ctxMenu.style.display = 'none'; return; }
  ctxMenu.innerHTML = '<div class="ctx-heading">Links</div>' +
    LIVE_LINKS.map(([label, url]) => `<a class="item" href="${escapeHtml(url)}" target="_blank" rel="noopener">${label}</a>`).join('');
  const r = e.currentTarget.getBoundingClientRect();
  placeCtxMenu(r.left, r.bottom + 2);
});

