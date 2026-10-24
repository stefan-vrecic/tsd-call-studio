// roadmap-diagram.js -- Roadmap -> 🧩 Diagram: the roadmap as a small draw.io-style map you can look at (View) or change (Edit).
// It starts as a copy of the boxes: a coloured row per area (General, Fitness ... Other), 7 days -> 1 year, joined by arrows. Day boxes
// stay linked to the text boxes (typing in one changes the other); everything else is free: move, resize, recolour, add boxes / text /
// sections (the wide row backgrounds) / arrows, delete, undo. Saved inside the roadmap record as `diagram` (roadmap.js).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const RD_GRID = 10;
const RD_PALETTE = [   // [light fill, colour]
  ['#eef4ff', '#2563eb'], ['#dcfce7', '#16a34a'], ['#ffe4e6', '#e11d48'], ['#e0f2fe', '#0284c7'],
  ['#ede9fe', '#7c3aed'], ['#fef3c7', '#d97706'], ['#f1f5f9', '#64748b'], ['#ffffff', '#172033'],
];
const RD_ROWS = [['general', 'General', 0], ['fitness', 'Fitness', 1], ['relationships', 'Relationships', 2], ['travel', 'Travel', 3], ['career', 'Career', 4], ['other', 'Other', 5]];
let rdMode = (csStore('rdMode') === 'edit' ? 'edit' : 'view');
let rdSel = null;            // {type: 'shape' | 'edge', id}
let rdTool = null;           // 'arrow' while picking the two ends of a new arrow
let rdArrowFrom = null;
let rdZoom = 1;
let rdHost = null;
const rdUndo = [], rdRedo = [];
const rdId = () => 's' + csId(7);
const rdSnap = (v) => Math.round(v / RD_GRID) * RD_GRID;

// ---- the diagram document
function rdDayLabel(day) { return day === 365 ? '1 year' : day + ' days'; }
// layout 2 (Oct 19 2026): bigger boxes (270 x 150) with more room between them (60 px across, 80 px between rows)
const RD_GEO = { col0: 220, colStep: 330, boxW: 270, boxH: 150, row0: 140, rowStep: 230, headW: 170 };
function rdGeo(id) {   // where a built-in shape sits in layout 2 (null for shapes you added yourself)
  const g = RD_GEO, width = g.col0 + 7 * g.colStep;
  if (id === 'title') return { x: Math.round(width / 2 - 260), y: 24, w: 520, h: 70 };
  const m = /^(lane|head|d)-([a-z]+)(?:-(\d+))?$/.exec(id); if (!m) return null;
  const row = RD_ROWS.findIndex(([k]) => k === m[2]); if (row < 0) return null;
  const y = g.row0 + row * g.rowStep;
  if (m[1] === 'lane') return { x: 10, y: y - 25, w: width - 10, h: g.boxH + 50 };
  if (m[1] === 'head') return { x: 24, y, w: g.headW, h: g.boxH };
  const c = RM_DAYS.indexOf(Number(m[3])); return c < 0 ? null : { x: g.col0 + c * g.colStep, y, w: g.boxW, h: g.boxH };
}
function rdBuild() {
  const shapes = [], edges = [];
  shapes.push({ id: 'title', kind: 'box', ...rdGeo('title'), text: 'Personal Timeline Roadmap', fill: '#172033', stroke: '#172033', font: '#ffffff', bold: true, size: 22, align: 'center' });
  RD_ROWS.forEach(([key, name, p], row) => {
    const [fill, col] = RD_PALETTE[p];
    shapes.push({ id: 'lane-' + key, kind: 'section', ...rdGeo('lane-' + key), text: '', fill: fill, stroke: col });
    shapes.push({ id: 'head-' + key, kind: 'box', ...rdGeo('head-' + key), text: name, fill: col, stroke: col, font: '#ffffff', bold: true, size: 17, align: 'center' });
    let prev = 'head-' + key;
    RM_DAYS.forEach((day, c) => {
      const id = `d-${key}-${day}`;
      shapes.push({ id, kind: 'box', ...rdGeo(id), title: rdDayLabel(day), bind: { area: key, day }, fill, stroke: col, font: '#1f2937', size: 14, align: 'left' });
      edges.push({ id: 'e-' + id, from: prev, to: id, color: col });
      prev = id;
    });
  });
  return { shapes, edges, layout: 2 };
}
function rdDoc() {
  const d = rmStore.doc;
  if (!d.diagram || !Array.isArray(d.diagram.shapes)) d.diagram = rdBuild();
  d.diagram.edges ||= [];
  if (d.diagram.layout !== 2) {   // a diagram made with the first, tighter layout: move the built-in shapes to the roomier spots (text, colours, arrows and your own shapes stay)
    d.diagram.shapes.forEach(s => { const g = rdGeo(s.id); if (g) { Object.assign(s, g); if (s.bind) s.size = Math.max(s.size || 13, 14); if (s.id.startsWith('head-')) s.size = 17; if (s.id === 'title') s.size = 22; } });
    d.diagram.layout = 2;
    rmStore.save();
  }
  return d.diagram;
}
const rdFind = (id) => rdDoc().shapes.find(s => s.id === id);
const rdBoundText = (s) => String(rmPlansFor(s.bind.area)[s.bind.day] || '');
function rdChange(fn) {   // every edit goes through here: undo snapshot, apply, save, redraw
  rdUndo.push(JSON.stringify(rdDoc())); if (rdUndo.length > 80) rdUndo.shift(); rdRedo.length = 0;
  fn(rdDoc());
  rmStore.save();
  rdDraw();
}
function rdStep(from, to) {
  if (!from.length) return;
  to.push(JSON.stringify(rdDoc()));
  rmStore.doc.diagram = JSON.parse(from.pop());
  rdSel = null; rmStore.save(); rdDraw();
}

// ---- page
function rdShow(host) {
  rdHost = host;
  const edit = rdMode === 'edit';
  host.innerHTML = `<div class="rd-bar">
      <div class="rm-mode rd-mode"><button type="button" data-rd-mode="view" class="${!edit ? 'active' : ''}">👁 View</button><button type="button" data-rd-mode="edit" class="${edit ? 'active' : ''}">✏️ Edit</button></div>
      <button type="button" class="ctl rd-full" data-rd-full title="Full screen (Esc to leave)">${document.fullscreenElement === host ? '🗗 Exit full screen' : '⛶ Full screen'}</button>
      ${edit ? `<div class="rd-tools">
        <button type="button" class="ctl" data-rd-add="box" title="Add a box">＋ Box</button>
        <button type="button" class="ctl" data-rd-add="text" title="Add plain text">＋ Text</button>
        <button type="button" class="ctl" data-rd-add="section" title="Add a section (a wide coloured row that sits behind boxes)">＋ Section</button>
        <button type="button" class="ctl ${rdTool === 'arrow' ? 'on' : ''}" data-rd-arrow title="Click a box, then the box it points to">↗ Arrow</button>
        <span class="rd-sep"></span>
        <span class="rd-swatches" title="Colour of the selected item · Shift-click = solid">${RD_PALETTE.map(([f, c], i) => `<button type="button" class="rd-swatch" data-rd-color="${i}" style="background:${f};border-color:${c}"><i style="background:${c}"></i></button>`).join('')}</span>
        <span class="rd-sep"></span>
        <button type="button" class="ctl" data-rd-act="undo" title="Undo (⌘Z)">↶</button><button type="button" class="ctl" data-rd-act="redo" title="Redo (⇧⌘Z)">↷</button>
        <button type="button" class="ctl" data-rd-act="del" title="Delete the selected item (Delete)">🗑</button>
        <span class="rd-sep"></span>
        <button type="button" class="ctl" data-rd-act="zoomout" title="Zoom out">−</button><button type="button" class="ctl rd-zoom" data-rd-act="fit" title="Fit to width">${Math.round(rdZoom * 100)}%</button><button type="button" class="ctl" data-rd-act="zoomin" title="Zoom in">＋</button>
        <button type="button" class="ctl" data-rd-act="rebuild" title="Start the diagram again from the boxes">↻ Rebuild</button>
      </div><div class="rd-hint" id="rd-hint">Drag to move · drag the corner to resize · double-click to type · Delete removes · arrow keys nudge</div>` : `<div class="rd-hint">Switch to ✏️ Edit to change the diagram.</div>`}
    </div>
    <div class="rd-viewport ${edit ? 'editing' : ''}" id="rd-viewport"><div class="rd-stage" id="rd-stage"></div></div>`;
  host.querySelectorAll('[data-rd-mode]').forEach(b => b.onclick = () => { rdMode = b.dataset.rdMode; csStore('rdMode', rdMode); rdSel = null; rdTool = null; rdShow(host); });
  host.querySelectorAll('[data-rd-add]').forEach(b => b.onclick = () => rdAdd(b.dataset.rdAdd));
  host.querySelector('[data-rd-full]').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else host.requestFullscreen().catch(() => {}); };
  const arrow = host.querySelector('[data-rd-arrow]');
  if (arrow) arrow.onclick = () => { rdTool = rdTool === 'arrow' ? null : 'arrow'; rdArrowFrom = null; rdShow(host); rdHint(rdTool ? 'Arrow: click the box it starts from…' : null); };
  host.querySelectorAll('[data-rd-color]').forEach(b => b.onclick = (e) => rdColour(RD_PALETTE[+b.dataset.rdColor], e.shiftKey));
  host.querySelectorAll('[data-rd-act]').forEach(b => b.onclick = () => rdAct(b.dataset.rdAct));
  const vp = host.querySelector('#rd-viewport');
  vp.addEventListener('pointerdown', (e) => { if (e.target === vp || e.target.id === 'rd-stage' || e.target.closest('svg') === host.querySelector('svg.rd-edges') && !e.target.closest('.rd-edge')) { rdSel = null; rdDraw(); } });
  if (!edit) rdZoom = 0;   // view: fit to width
  rdDraw();
}
function rdHint(text) { const h = document.getElementById('rd-hint'); if (h) h.textContent = text || 'Drag to move · drag the corner to resize · double-click to type · Delete removes · arrow keys nudge'; }

function rdDraw() {
  const stage = document.getElementById('rd-stage'), vp = document.getElementById('rd-viewport');
  if (!stage || !vp) return;
  const doc = rdDoc(), edit = rdMode === 'edit';
  const W = Math.max(1000, ...doc.shapes.map(s => s.x + s.w)) + 40, H = Math.max(500, ...doc.shapes.map(s => s.y + s.h)) + 40;
  const full = document.fullscreenElement === rdHost;
  const fit = Math.min(1.2, (vp.clientWidth - 4) / W, full ? (window.innerHeight - 90) / H : 9);
  const zoom = rdZoom || (full ? fit : Math.max(0.75, fit));   // fit the width, but never so small it can't be read (scroll sideways instead)
  stage.style.width = W + 'px'; stage.style.height = H + 'px';
  stage.style.transform = `scale(${zoom})`;
  vp.style.height = (full ? window.innerHeight - (vp.getBoundingClientRect().top - rdHost.getBoundingClientRect().top) - 16 : Math.min(H * zoom + 8, Math.max(380, window.innerHeight - 220))) + 'px';
  const z = document.querySelector('.rd-zoom'); if (z) z.textContent = Math.round(zoom * 100) + '%';
  stage.innerHTML = '';
  // sections first (behind), then the arrows, then boxes and text
  const order = [...doc.shapes.filter(s => s.kind === 'section'), ...doc.shapes.filter(s => s.kind !== 'section')];
  order.filter(s => s.kind === 'section').forEach(s => stage.appendChild(rdShapeEl(s, edit)));
  stage.appendChild(rdEdgesEl(doc, W, H, edit));
  order.filter(s => s.kind !== 'section').forEach(s => stage.appendChild(rdShapeEl(s, edit)));
  const today = document.createElement('div'); today.className = 'rd-today';   // for reference: today's date, top left
  today.textContent = '📍 Today · ' + new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  stage.appendChild(today);
}
// a day box's place in time: 'past' (its date has gone), 'next' (the first one still ahead in its row) or ''
function rdWhen(s) {
  if (!s.bind || typeof rmDaysLeft !== 'function') return '';
  const left = rmDaysLeft(s.bind.area, s.bind.day);
  if (left < 0) return 'past';
  const next = RM_DAYS.find(d => rmDaysLeft(s.bind.area, d) >= 0);
  return next === s.bind.day ? 'next' : '';
}

function rdShapeEl(s, edit) {
  const el = document.createElement('div');
  const when = rdWhen(s);
  el.className = `rd-shape rd-k-${s.kind}` + (when ? ' rd-' + when : '') + (rdSel && rdSel.type === 'shape' && rdSel.id === s.id ? ' sel' : '') + (rdArrowFrom === s.id ? ' arrow-from' : '');
  Object.assign(el.style, { left: s.x + 'px', top: s.y + 'px', width: s.w + 'px', height: s.h + 'px', textAlign: s.align || 'left', fontSize: (s.size || 13) + 'px', color: s.font || '#1f2937', fontWeight: s.bold ? '700' : '400' });
  if (s.kind !== 'text') { el.style.background = s.kind === 'section' ? s.fill + 'aa' : s.fill; el.style.borderColor = s.stroke; }
  const body = document.createElement('div'); body.className = 'rd-text';
  if (s.bind) {
    const t = document.createElement('b'); t.className = 'rd-title'; t.textContent = (s.title || '') + (typeof rmDueLabel === 'function' ? ' · ' + rmDueLabel(s.bind.area, s.bind.day) : '');
    body.appendChild(t);
    const p = document.createElement('div'); p.className = 'rd-body'; p.textContent = rdBoundText(s) || (edit ? '' : '—'); p.dataset.ph = 'What will be achieved by then?';
    body.appendChild(p);
  } else {
    const p = document.createElement('div'); p.className = 'rd-body'; p.textContent = s.text || ''; p.dataset.ph = s.kind === 'section' ? '' : 'Text';
    body.appendChild(p);
  }
  if (s.kind === 'section' && s.text) el.title = s.text;
  el.appendChild(body);
  if (!edit) return el;
  ['se', 'e', 's'].forEach(dir => { const h = document.createElement('span'); h.className = 'rd-handle rd-h-' + dir; h.dataset.dir = dir; el.appendChild(h); });
  el.addEventListener('pointerdown', (e) => rdPointer(e, s, el));
  el.addEventListener('dblclick', (e) => { e.stopPropagation(); rdEditText(s, el); });
  return el;
}

function rdEdgesEl(doc, W, H, edit) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'rd-edges'); svg.setAttribute('width', W); svg.setAttribute('height', H);
  doc.edges.forEach(e => {
    const a = rdFind(e.from), b = rdFind(e.to);
    if (!a || !b) return;
    const pts = rdRoute(a, b), d = 'M' + pts.map(p => p.join(' ')).join(' L');
    const [x2, y2] = pts[pts.length - 1], [x1, y1] = pts[pts.length - 2];
    const ang = Math.atan2(y2 - y1, x2 - x1), L = 11;
    const head = `M${x2} ${y2} L${x2 - L * Math.cos(ang - 0.45)} ${y2 - L * Math.sin(ang - 0.45)} L${x2 - L * Math.cos(ang + 0.45)} ${y2 - L * Math.sin(ang + 0.45)} Z`;
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'rd-edge' + (rdSel && rdSel.type === 'edge' && rdSel.id === e.id ? ' sel' : ''));
    g.innerHTML = `<path d="${d}" class="rd-edge-hit"/><path d="${d}" fill="none" stroke="${e.color || '#475569'}" stroke-width="2.2" stroke-linejoin="round"/><path d="${head}" fill="${e.color || '#475569'}"/>`;
    if (edit) g.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); rdSel = { type: 'edge', id: e.id }; rdDraw(); });
    svg.appendChild(g);
  });
  return svg;
}
// an elbow arrow from the side of `a` that faces `b` to the facing side of `b`
function rdRoute(a, b) {
  const ac = [a.x + a.w / 2, a.y + a.h / 2], bc = [b.x + b.w / 2, b.y + b.h / 2];
  const dx = bc[0] - ac[0], dy = bc[1] - ac[1];
  if (Math.abs(dx) >= Math.abs(dy)) {
    const x1 = dx > 0 ? a.x + a.w : a.x, x2 = dx > 0 ? b.x : b.x + b.w, mx = (x1 + x2) / 2;
    return [[x1, ac[1]], [mx, ac[1]], [mx, bc[1]], [x2, bc[1]]];
  }
  const y1 = dy > 0 ? a.y + a.h : a.y, y2 = dy > 0 ? b.y : b.y + b.h, my = (y1 + y2) / 2;
  return [[ac[0], y1], [ac[0], my], [bc[0], my], [bc[0], y2]];
}

// ---- editing
function rdPointer(e, s, el) {
  if (e.button !== 0 || el.querySelector('[contenteditable="true"]')) return;
  e.stopPropagation();
  if (rdTool === 'arrow') {
    if (!rdArrowFrom) { rdArrowFrom = s.id; rdHint('Arrow: now click the box it points to… (Esc cancels)'); rdDraw(); return; }
    if (rdArrowFrom !== s.id) { const from = rdArrowFrom; rdChange(d => d.edges.push({ id: rdId(), from, to: s.id, color: (rdFind(from) || {}).stroke || '#475569' })); }
    rdArrowFrom = null; rdTool = null; rdShow(rdHost); return;
  }
  rdSel = { type: 'shape', id: s.id };
  const dir = e.target.dataset && e.target.dataset.dir;
  const zoom = parseFloat((document.getElementById('rd-stage').style.transform.match(/scale\(([\d.]+)\)/) || [0, 1])[1]);
  const start = { x: e.clientX, y: e.clientY, sx: s.x, sy: s.y, sw: s.w, sh: s.h };
  const before = JSON.stringify(rdDoc());
  let moved = false;
  document.querySelectorAll('.rd-shape.sel').forEach(x => x.classList.remove('sel')); el.classList.add('sel');
  const move = (ev) => {
    const dx = (ev.clientX - start.x) / zoom, dy = (ev.clientY - start.y) / zoom;
    if (!moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    moved = true;
    if (dir) {
      if (dir !== 's') s.w = Math.max(40, rdSnap(start.sw + dx));
      if (dir !== 'e') s.h = Math.max(30, rdSnap(start.sh + dy));
    } else { s.x = Math.max(0, rdSnap(start.sx + dx)); s.y = Math.max(0, rdSnap(start.sy + dy)); }
    rdDraw();
  };
  const up = () => {
    document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
    if (moved) { rdUndo.push(before); rdRedo.length = 0; rmStore.save(); }
    rdDraw();
  };
  document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
}

function rdEditText(s, el) {
  const body = el.querySelector('.rd-body');
  if (s.bind && !rdBoundText(s)) body.textContent = '';
  body.contentEditable = 'true'; body.focus();
  const r = document.createRange(); r.selectNodeContents(body); r.collapse(false); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
  body.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') body.blur(); });
  body.addEventListener('blur', () => {
    const text = body.innerText.replace(/\n$/, '');
    body.contentEditable = 'false';
    if (s.bind) {
      if (text !== rdBoundText(s)) { rmPlansFor(s.bind.area)[s.bind.day] = text; rmStore.save(); }   // the same text as the box in ▦ Boxes
      rdDraw();
    } else if (text !== (s.text || '')) rdChange(() => { s.text = text; });
    else rdDraw();
  }, { once: true });
}

function rdAdd(kind) {
  const vp = document.getElementById('rd-viewport'), zoom = rdZoom || 1;
  const cx = rdSnap((vp.scrollLeft + vp.clientWidth / 2) / zoom), cy = rdSnap((vp.scrollTop + vp.clientHeight / 2) / zoom);
  const [fill, col] = RD_PALETTE[0];
  const s = kind === 'section' ? { id: rdId(), kind, x: 10, y: cy - 65, w: 1960, h: 130, text: '', fill, stroke: col }
    : kind === 'text' ? { id: rdId(), kind, x: cx - 80, y: cy - 20, w: 160, h: 40, text: 'Text', font: '#1f2937', size: 16, align: 'left' }
    : { id: rdId(), kind: 'box', x: cx - 110, y: cy - 50, w: 220, h: 100, text: 'New box', fill, stroke: col, font: '#1f2937', size: 13, align: 'left' };
  rdChange(d => d.shapes.push(s));
  rdSel = { type: 'shape', id: s.id }; rdDraw();
}

function rdColour([fill, col], solid) {
  if (!rdSel) { rdHint('Select a box, a section or an arrow first, then pick its colour.'); return; }
  rdChange(d => {
    if (rdSel.type === 'edge') { const e = d.edges.find(x => x.id === rdSel.id); if (e) e.color = col; return; }
    const s = d.shapes.find(x => x.id === rdSel.id); if (!s) return;
    if (s.kind === 'text') { s.font = col; return; }
    s.fill = solid ? col : fill; s.stroke = col; s.font = solid ? '#ffffff' : (col === '#172033' ? '#172033' : '#1f2937');
  });
}

function rdDelete() {
  if (!rdSel) return;
  const sel = rdSel; rdSel = null;
  rdChange(d => {
    if (sel.type === 'edge') d.edges = d.edges.filter(e => e.id !== sel.id);
    else { d.shapes = d.shapes.filter(s => s.id !== sel.id); d.edges = d.edges.filter(e => e.from !== sel.id && e.to !== sel.id); }
  });
}

function rdAct(a) {
  const vp = document.getElementById('rd-viewport');
  const cur = rdZoom || parseFloat((document.getElementById('rd-stage').style.transform.match(/scale\(([\d.]+)\)/) || [0, 1])[1]);
  if (a === 'undo') rdStep(rdUndo, rdRedo);
  if (a === 'redo') rdStep(rdRedo, rdUndo);
  if (a === 'del') rdDelete();
  if (a === 'zoomin') { rdZoom = Math.min(2, Math.round((cur + 0.1) * 10) / 10); rdDraw(); }
  if (a === 'zoomout') { rdZoom = Math.max(0.3, Math.round((cur - 0.1) * 10) / 10); rdDraw(); }
  if (a === 'fit') { rdZoom = 0; rdDraw(); if (vp) vp.scrollLeft = 0; }
  if (a === 'rebuild' && confirm('Start the diagram again from the boxes? Boxes, colours and arrows you changed here are replaced (your box text is kept). You can undo this.')) {
    rdSel = null; rdChange(d => { const fresh = rdBuild(); d.shapes = fresh.shapes; d.edges = fresh.edges; });
  }
}

document.addEventListener('keydown', (e) => {
  if (rdMode !== 'edit' || !rdHost || !document.getElementById('rd-stage') || !document.getElementById('rd-stage').offsetParent) return;
  const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  const meta = e.metaKey || e.ctrlKey;
  if (meta && e.key.toLowerCase() === 'z') { e.preventDefault(); e.stopPropagation(); rdStep(e.shiftKey ? rdRedo : rdUndo, e.shiftKey ? rdUndo : rdRedo); return; }
  if (e.key === 'Escape') { rdTool = null; rdArrowFrom = null; rdSel = null; rdShow(rdHost); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && rdSel) { e.preventDefault(); e.stopPropagation(); rdDelete(); return; }
  const nudge = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (nudge && rdSel && rdSel.type === 'shape') {
    e.preventDefault(); e.stopPropagation();
    const step = e.shiftKey ? 1 : RD_GRID;
    rdChange(d => { const s = d.shapes.find(x => x.id === rdSel.id); if (s) { s.x = Math.max(0, s.x + nudge[0] * step); s.y = Math.max(0, s.y + nudge[1] * step); } });
  }
}, true);
window.addEventListener('resize', () => { if (rdHost && document.getElementById('rd-stage') && !rdZoom) rdDraw(); });

// full screen in and out: redraw so the map fits the screen (and goes back to the page size after Esc)
document.addEventListener('fullscreenchange', () => { if (rdHost && document.getElementById('rd-stage')) { rdZoom = 0; rdShow(rdHost); } });
