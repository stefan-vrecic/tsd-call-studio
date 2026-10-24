// live-dock.js -- the window layout of the Live Call tab. Three panels (Script, Sales objections, Notes) sit in 1 to 3 side-by-side
// windows. Drag a panel's tab onto another window's tab strip to put them together as tabs, or onto a "New window" strip at the
// edges / between windows to give it a window of its own. Dividers between windows drag (or arrow keys); double-click = equal widths.
// The layout is remembered. Plain script (not a module): shares one global scope with the other files, so load order matters --
// see the <script> tags in player.html.

const liveGroupsEl = document.getElementById('live-groups');
const livePark = document.getElementById('live-panels');   // panels wait here while the windows are rebuilt
const LIVE_PANELS = { script: '📜 Script', objections: '🛡️ Sales objections', notes: '📝 Notes' };
const LIVE_MIN_SHARE = 12;                                  // a window never gets narrower than this % of its neighbours' width
const liveDefaultDock = () => ({ groups: [{ tabs: ['script'], active: 'script' }, { tabs: ['objections', 'notes'], active: 'objections' }], weights: [50, 50] });
let liveDock = liveLoadDock();
let liveDragPanel = null;

function liveLoadDock() {
  try {
    const d = JSON.parse(localStorage.getItem('liveDock'));
    const all = (d.groups || []).flatMap(g => g.tabs);
    const ok = d.groups.length >= 1 && d.groups.length <= 3 && all.length === 3 && Object.keys(LIVE_PANELS).every(p => all.filter(x => x === p).length === 1)
      && d.weights.length === d.groups.length && d.groups.every(g => g.tabs.length && g.tabs.includes(g.active));
    if (ok) return d;
  } catch (e) { /* nothing saved, or unreadable: use the default */ }
  return liveDefaultDock();
}
const liveSaveDock = () => liveStore('liveDock', JSON.stringify(liveDock));
const liveEqualWeights = () => { liveDock.weights = liveDock.groups.map(() => 100 / liveDock.groups.length); };
const livePanelEl = (id) => document.getElementById('live-panel-' + id);

function liveRenderDock() {
  liveSaveScrolls(); // moving a panel in the page resets its scroll position, so note it first
  Object.keys(LIVE_PANELS).forEach(id => livePark.appendChild(livePanelEl(id)));
  liveGroupsEl.innerHTML = '';
  liveDock.groups.forEach((g, gi) => {
    if (gi) liveGroupsEl.appendChild(liveMakeDivider(gi - 1));
    const sec = document.createElement('section');
    sec.className = 'live-group';
    sec.style.flex = `${liveDock.weights[gi]} 1 0`;
    const head = document.createElement('header');
    head.className = 'live-ghead';
    const tabs = document.createElement('div');
    tabs.className = 'live-tabs';
    g.tabs.forEach(id => {
      const b = document.createElement('button');
      b.className = 'live-tab' + (id === g.active ? ' active' : '');
      b.textContent = LIVE_PANELS[id];
      b.draggable = true;
      b.title = 'Click to show · drag to move it · double-click to pop it out / put it back';
      b.dataset.panel = id;
      b.onclick = () => liveActivate(gi, id);
      b.ondblclick = () => liveToggleSeparate(id);
      b.addEventListener('dragstart', (e) => {
        liveDragPanel = id;
        try { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; } catch (_) { /* synthetic events */ }
        liveView.classList.add('tab-dragging');
        liveShowDropzones();
        setTimeout(() => b.classList.add('dragging'), 0);
      });
      b.addEventListener('dragend', () => { liveDragPanel = null; liveView.classList.remove('tab-dragging'); liveClearDropzones(); b.classList.remove('dragging'); });
      // dropping on a tab puts the dragged one just before it
      b.addEventListener('dragover', (e) => { if (liveDragPanel) { e.preventDefault(); } });
      b.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); if (liveDragPanel) liveMovePanel(liveDragPanel, { toGroup: gi, before: id }); });
      tabs.appendChild(b);
    });
    head.appendChild(tabs);
    head.addEventListener('dblclick', (e) => { if (g.tabs.length === 1 && !e.target.closest('.live-tab')) liveToggleSeparate(g.tabs[0]); }); // the empty strip beside a lone tab works too
    head.addEventListener('dragover', (e) => { if (liveDragPanel) { e.preventDefault(); head.classList.add('drop-over'); } });
    head.addEventListener('dragleave', () => head.classList.remove('drop-over'));
    head.addEventListener('drop', (e) => { e.preventDefault(); head.classList.remove('drop-over'); if (liveDragPanel) liveMovePanel(liveDragPanel, { toGroup: gi }); });
    const body = document.createElement('div');
    body.className = 'live-gbody';
    g.tabs.forEach(id => { const p = livePanelEl(id); p.style.display = id === g.active ? '' : 'none'; body.appendChild(p); });
    sec.append(head, body);
    liveGroupsEl.appendChild(sec);
  });
  liveRestoreScrolls(['script', 'objections']);
}

function liveActivate(gi, id) {
  liveSaveScrolls();
  liveDock.groups[gi].active = id;
  liveSaveDock();
  const body = liveGroupsEl.querySelectorAll('.live-group')[gi];
  body.querySelectorAll('.live-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === id));
  liveDock.groups[gi].tabs.forEach(t => { livePanelEl(t).style.display = t === id ? '' : 'none'; });
  liveRestoreScrolls([id]);
}

// Double-click a tab (or the empty strip beside a lone tab): a tab in a shared window pops out into a window of its own; a panel
// that is already alone goes back to its partner's window. Who pairs with whom is fixed:
const LIVE_PARTNER = { notes: 'objections', objections: 'notes', script: 'objections' };
function liveToggleSeparate(id) {
  const gi = liveDock.groups.findIndex(g => g.tabs.includes(id));
  if (liveDock.groups[gi].tabs.length > 1) {
    const side = liveDock.side && liveDock.side[id];       // pops out on the side it was on before it was merged in (default: to the right)
    liveMovePanel(id, { newGroupAt: side === 'left' ? gi : gi + 1 });
  } else if (liveDock.groups.length > 1) {
    // back to its fixed partner's window: Notes always joins Objections (never the Script)
    let target = liveDock.groups.findIndex(g => g.tabs.includes(LIVE_PARTNER[id]));
    if (target < 0 || target === gi) target = gi > 0 ? gi - 1 : gi + 1;
    liveDock.side = { ...(liveDock.side || {}), [id]: target > gi ? 'left' : 'right' };   // remember which side of that window it was on
    liveMovePanel(id, { toGroup: target });
  }
}

// Moves a panel: into an existing window (as a tab, optionally before another tab) or into a brand new window at a position.
function liveMovePanel(id, t) {
  const d = liveDock;
  const from = d.groups.findIndex(g => g.tabs.includes(id));
  d.groups[from].tabs = d.groups[from].tabs.filter(x => x !== id);
  if (d.groups[from].active === id) d.groups[from].active = d.groups[from].tabs[0] || null;
  if (t.toGroup != null) {
    const g = d.groups[t.toGroup];
    const at = t.before ? g.tabs.indexOf(t.before) : -1;
    g.tabs.splice(at < 0 ? g.tabs.length : at, 0, id);
    g.active = id;
  } else {
    d.groups.splice(t.newGroupAt, 0, { tabs: [id], active: id });
  }
  d.groups = d.groups.filter(g => g.tabs.length);   // a window left with nothing goes away
  liveEqualWeights();
  liveSaveDock();
  liveRenderDock();
}

// ---- "New window" strips: shown only while a tab is being dragged, at the left edge, between windows, and the right edge
function liveShowDropzones() {
  liveClearDropzones();
  const groups = [...liveGroupsEl.querySelectorAll('.live-group')];
  const edges = [0, ...groups.slice(1).map(g => g.offsetLeft - 6), liveGroupsEl.clientWidth];
  edges.forEach((x, i) => {
    const z = document.createElement('div');
    z.className = 'live-dropzone';
    z.style.left = x + 'px';
    z.textContent = 'New window';
    z.addEventListener('dragover', (e) => { e.preventDefault(); z.classList.add('over'); });
    z.addEventListener('dragleave', () => z.classList.remove('over'));
    z.addEventListener('drop', (e) => { e.preventDefault(); if (liveDragPanel) liveMovePanel(liveDragPanel, { newGroupAt: i }); });
    liveGroupsEl.appendChild(z);
  });
}
function liveClearDropzones() { liveGroupsEl.querySelectorAll('.live-dropzone').forEach(z => z.remove()); }

// ---- the dividers between windows
function liveMakeDivider(i) {
  const div = document.createElement('div');
  div.className = 'live-divider';
  div.tabIndex = 0;
  div.setAttribute('role', 'separator');
  div.title = 'Drag to resize (double-click for equal widths)';
  div.innerHTML = '<span></span>';
  const pairWidths = () => {
    const gs = liveGroupsEl.querySelectorAll('.live-group');
    return { a: gs[i], b: gs[i + 1] };
  };
  const setPair = (aShare) => { // aShare = left window's share (0..1) of the two windows' combined weight
    const sum = liveDock.weights[i] + liveDock.weights[i + 1];
    const lo = LIVE_MIN_SHARE / 100;
    const share = Math.min(1 - lo, Math.max(lo, aShare));
    liveDock.weights[i] = sum * share;
    liveDock.weights[i + 1] = sum * (1 - share);
    const { a, b } = pairWidths();
    a.style.flex = `${liveDock.weights[i]} 1 0`;
    b.style.flex = `${liveDock.weights[i + 1]} 1 0`;
  };
  div.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    liveView.classList.add('dragging');
    try { div.setPointerCapture(e.pointerId); } catch (_) { /* the window listeners below cover it */ }
    const { a, b } = pairWidths();
    const left = a.getBoundingClientRect().left, total = a.getBoundingClientRect().width + b.getBoundingClientRect().width;
    const onMove = (ev) => setPair((ev.clientX - left) / total);
    const onUp = () => {
      liveView.classList.remove('dragging');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      liveSaveDock();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });
  div.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const sum = liveDock.weights[i] + liveDock.weights[i + 1];
    setPair((liveDock.weights[i] + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 0.1 : 0.02) * sum) / sum);
    liveSaveDock();
  });
  div.addEventListener('dblclick', () => { liveEqualWeights(); liveSaveDock(); liveRenderDock(); });
  return div;
}

function liveResetDock() { liveDock = liveDefaultDock(); liveSaveDock(); liveRenderDock(); }
document.getElementById('live-reset').onclick = liveResetDock;
