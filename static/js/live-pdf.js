// live-pdf.js -- the PDF viewers of the Live Call and SCP Onboarding tabs, drawn with PDF.js (static/vendor/pdfjs) as ONE endless
// vertical scroll: zoom / fit / search, remembered scroll position, and a heading outline for document-style PDFs.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

// ---- PDF.js (loaded the first time the tab opens): the two viewers
const liveViewers = {};   // slot -> { pdfViewer, container, doc, ... }
// SCP Onboarding reads like a Google Doc: a centred column at a natural reading size (never blown up to fill a wide window)
// with a clickable outline of its headings on the left. The two Live Call sides just fit their half of the window.
const LIVE_DOC_OPTS = { onboarding: { outline: true, maxScale: 1 } };
let livePdfLibs = null;
async function liveEnsureLibs() {
  if (livePdfLibs) return livePdfLibs;
  const lib = await import('/static/vendor/pdfjs/pdf.min.mjs');
  globalThis.pdfjsLib = lib; // pdf_viewer.mjs looks for it here
  lib.GlobalWorkerOptions.workerSrc = '/static/vendor/pdfjs/pdf.worker.min.mjs';
  const viewer = await import('/static/vendor/pdfjs/pdf_viewer.mjs');
  livePdfLibs = { lib, viewer };
  return livePdfLibs;
}

function liveSaveScrolls() {
  Object.entries(liveViewers).forEach(([slot, v]) => {
    if (v.container.clientHeight > 0 && v.container.scrollHeight > 0) {
      v.scrollFraction = v.container.scrollTop / v.container.scrollHeight;
      liveStore('liveScroll-' + slot, v.scrollFraction);
    }
  });
}
function liveRestoreScrolls(slots) {
  requestAnimationFrame(() => slots.map(sl => liveViewers[sl]).filter(Boolean).forEach(v => {
    if (v.pdfViewer.pagesCount && v.fit && v.container.clientWidth > 0) v.applyFit();
    if (v.scrollFraction != null) v.container.scrollTop = v.scrollFraction * v.container.scrollHeight;
  }));
}

async function liveOpenDoc(slot, url) {
  const host = document.getElementById('live-doc-' + slot);
  const old = liveViewers[slot];
  if (old) { old.resize.disconnect(); try { old.pdfViewer.setDocument(null); old.doc && old.doc.destroy(); } catch (e) { /* already gone */ } delete liveViewers[slot]; }
  host.innerHTML = `
    <div class="live-toolbar">
      <button class="ctl lt-btn" data-act="out" title="Zoom out">−</button>
      <button class="ctl lt-btn" data-act="in" title="Zoom in">+</button>
      <button class="ctl lt-btn" data-act="fit" title="Fit the page to the width of this side">Fit</button>
      <span class="lt-page">…</span>
      <span class="spacer"></span>
      <input class="lt-find" type="search" placeholder="Search…" title="Search this document (Enter = next, Shift+Enter = previous)">
      <button class="ctl lt-btn" data-act="prev" title="Previous match">↑</button>
      <button class="ctl lt-btn" data-act="next" title="Next match">↓</button>
      <span class="lt-count"></span>
    </div>
    <div class="live-main">
      <aside class="live-outline" style="display:none"><div class="lo-title">Document outline</div><div class="lo-list"></div></aside>
      <div class="live-scroll"><div class="live-container" tabindex="0"><div class="pdfViewer"></div></div></div>
    </div>`;
  const opts = LIVE_DOC_OPTS[slot] || {};
  host.classList.toggle('doc-style', !!opts.outline);
  const container = host.querySelector('.live-container');
  const find = host.querySelector('.lt-find');
  const count = host.querySelector('.lt-count');
  const pageLabel = host.querySelector('.lt-page');
  try {
    const { lib, viewer: V } = await liveEnsureLibs();
    const eventBus = new V.EventBus();
    const linkService = new V.PDFLinkService({ eventBus });
    const findController = new V.PDFFindController({ eventBus, linkService });
    const pdfViewer = new V.PDFViewer({ container, viewer: container.querySelector('.pdfViewer'), eventBus, linkService, findController, textLayerMode: 1 });
    linkService.setViewer(pdfViewer);   // (default scroll mode = vertical and continuous: every page one after another)
    const state = { pdfViewer, container, doc: null, fit: liveStore('liveFit-' + slot) !== 'false', scrollFraction: parseFloat(liveStore('liveScroll-' + slot)) || null };
    state.applyFit = () => {
      pdfViewer.currentScaleValue = 'page-width';
      if (opts.maxScale && pdfViewer.currentScale > opts.maxScale) pdfViewer.currentScale = opts.maxScale;
    };
    state.resize = new ResizeObserver(() => { // dragging the divider re-fits the page to the new width
      if (state.fit && container.clientWidth > 0 && pdfViewer.pagesCount) state.applyFit();
    });
    state.resize.observe(container);
    liveViewers[slot] = state;

    eventBus.on('pagesinit', () => {
      if (state.fit) state.applyFit(); else pdfViewer.currentScaleValue = liveStore('liveZoom-' + slot) || 'page-width';
      requestAnimationFrame(() => { if (state.scrollFraction != null) container.scrollTop = state.scrollFraction * container.scrollHeight; });
    });
    eventBus.on('pagechanging', (e) => { pageLabel.textContent = `${e.pageNumber} / ${pdfViewer.pagesCount}`; });
    eventBus.on('updatefindmatchescount', (e) => { count.textContent = e.matchesCount.total ? `${e.matchesCount.current}/${e.matchesCount.total}` : '0'; });
    eventBus.on('updatefindcontrolstate', (e) => { if (e.state === 3 /* not found */) count.textContent = '0'; });
    let saveTimer = null;
    container.addEventListener('scroll', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { if (container.clientHeight > 0) liveStore('liveScroll-' + slot, container.scrollTop / container.scrollHeight); }, 300);
    });

    const dispatchFind = (again, backwards) => eventBus.dispatch('find', {
      source: window, type: again ? 'again' : '', query: find.value, caseSensitive: false, entireWord: false,
      highlightAll: true, findPrevious: !!backwards, matchDiacritics: false, phraseSearch: true });
    find.addEventListener('input', () => { if (!find.value) count.textContent = ''; dispatchFind(false, false); });
    find.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); dispatchFind(true, e.shiftKey); } });
    host.addEventListener('keydown', (e) => { // Cmd/Ctrl-F inside a side searches that side's document
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); find.focus(); find.select(); }
    });
    const setZoom = (mode) => {
      state.fit = mode === 'fit';
      liveStore('liveFit-' + slot, state.fit);
      if (state.fit) state.applyFit();
      else liveStore('liveZoom-' + slot, pdfViewer.currentScale);
    };
    host.querySelector('[data-act="in"]').onclick = () => { pdfViewer.increaseScale(); setZoom('custom'); };
    host.querySelector('[data-act="out"]').onclick = () => { pdfViewer.decreaseScale(); setZoom('custom'); };
    host.querySelector('[data-act="fit"]').onclick = () => setZoom('fit');
    host.querySelector('[data-act="next"]').onclick = () => dispatchFind(true, false);
    host.querySelector('[data-act="prev"]').onclick = () => dispatchFind(true, true);

    state.doc = await lib.getDocument({ url }).promise;
    pdfViewer.setDocument(state.doc);
    linkService.setDocument(state.doc, null);
    if (opts.outline) liveBuildOutline(host, state.doc, pdfViewer, linkService, eventBus);
  } catch (e) {
    host.innerHTML = `<div class="live-msg">Couldn't open this PDF: ${escapeHtml(String(e.message || e))}</div>`;
  }
}

// The outline of headings on the left of a document-style PDF: the PDF's own bookmarks if it has any, otherwise the lines
// printed noticeably bigger than the body text (that is how Google Docs headings come out in a PDF).
async function liveBuildOutline(host, doc, pdfViewer, linkService, eventBus) {
  const aside = host.querySelector('.live-outline');
  const list = host.querySelector('.lo-list');
  let entries = [];
  try {
    const marks = await doc.getOutline();
    const flatten = (items, depth) => (items || []).forEach(it => {
      entries.push({ title: it.title, depth: Math.min(depth, 2), go: () => linkService.goToDestination(it.dest) });
      flatten(it.items, depth + 1);
    });
    flatten(marks, 0);
  } catch (e) { entries = []; }
  if (!entries.length) {
    const found = [];
    const sizes = new Map();
    const pages = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const content = await (await doc.getPage(n)).getTextContent();
      pages.push(content.items.filter(i => i.str && i.str.trim()));
      pages[n - 1].forEach(i => { const h = Math.round(Math.abs(i.transform[3]) * 2) / 2; sizes.set(h, (sizes.get(h) || 0) + i.str.length); });
    }
    let body = 0, bodyChars = 0;
    sizes.forEach((chars, h) => { if (chars > bodyChars) { body = h; bodyChars = chars; } });
    pages.forEach((items, idx) => {
      const lines = new Map(); // join the pieces of one heading line (same baseline)
      items.forEach(i => {
        const h = Math.abs(i.transform[3]);
        if (h < body * 1.3) return;
        const key = Math.round(i.transform[5]);
        const l = lines.get(key) || { text: '', h, y: i.transform[5], x: i.transform[4] };
        l.text += i.str; l.h = Math.max(l.h, h);
        lines.set(key, l);
      });
      [...lines.values()].sort((a, b) => b.y - a.y).forEach(l => {
        const text = l.text.replace(/\s+/g, ' ').trim();
        if (text.length < 3 || text.length > 110) return;
        found.push({ title: text, depth: l.h >= body * 1.7 ? 0 : 1,
          go: () => pdfViewer.scrollPageIntoView({ pageNumber: idx + 1, destArray: [null, { name: 'XYZ' }, l.x, l.y + l.h * 1.5, null] }),
          page: idx + 1 });
      });
    });
    entries = found;
  }
  entries = entries.filter(e => e.title && e.title.trim().length > 1);
  if (!entries.length) return;
  aside.style.display = '';
  list.innerHTML = '';
  entries.forEach(e => {
    const row = document.createElement('div');
    row.className = 'lo-item depth' + e.depth;
    row.textContent = e.title;
    row.title = e.title;
    row.onclick = () => e.go();
    list.appendChild(row);
  });
}

// a tab's PDFs load the first time it is opened (and again after a replace), not on every page load
// Demo mode switched on / off: the open Live Call / Onboarding panes swap to the other documents
window.addEventListener('callstudio:demo-mode', () => { const open = Object.keys(liveViewers); if (open.length) loadLiveDocs(open); });

async function loadLiveDocs(slots) {
  let info;
  const demo = typeof demoMode !== 'undefined' && demoMode ? '&demo=1' : '';   // Demo mode: the made-up script / objection sheets (live_docs/demo-*.pdf)
  try { info = await csJSON('/api/live-docs?x=1' + demo); } catch (e) { return; }
  slots.forEach(slot => {
    const label = document.getElementById('live-file-' + slot);
    const d = info[slot] || {};
    label.textContent = d.exists ? d.name : 'no file yet';
    if (d.exists) liveOpenDoc(slot, `/live-docs/${slot}.pdf?v=${d.version}${demo}`);
    else document.getElementById('live-doc-' + slot).innerHTML = '<div class="live-msg">No file yet. Press “Replace PDF” to add one.</div>';
  });
}
