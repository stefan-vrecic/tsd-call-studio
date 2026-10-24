// tracker-layout.js -- arranging the Tracker's cards (Log and Dashboard):
//   * drag a card to a new place WITHIN its section (Key metrics, a group, or Hidden); drag a section's heading onto another heading to re-order the sections
//   * right-click a card -> ⭐ Star: starred cards move up into a "Key metrics" section at the very top; "Clear all" there (with a confirmation) un-stars them all,
//     and the section disappears when nothing is starred
// The order is saved on the server (POST /api/tracker-order: the tracker list's own order; sections appear in the order of their first tracker), the star on the tracker
// (starred: true), so both stick on every device. Plain script (not a module); load it after tracker-tab.js (it uses tkHideable, tkGroups, tkShown at run time).

let tklDrag = null;   // {kind: 'card', id, scope} | {kind: 'group', name}

const tklScope = (m) => (m.hidden ? 'hidden' : m.starred ? 'key' : 'g:' + m.group);
const tklClear = () => document.querySelectorAll('.tkl-before, .tkl-after').forEach(el => el.classList.remove('tkl-before', 'tkl-after'));

async function tkPostOrder(metrics) {
  tk.metrics = metrics;
  await fetch('/api/tracker-order', { method: 'POST', body: JSON.stringify({ ids: metrics.map(m => m.id) }) });
}

// a card can be dragged by anything except its inputs / buttons (those keep working normally)
function tkDragCard(card, m, rerender) {
  card.addEventListener('mousedown', (e) => { card.draggable = !e.target.closest('input, textarea, button, select, a'); });
  card.addEventListener('dragstart', (e) => { tklDrag = { kind: 'card', id: m.id, scope: tklScope(m) }; card.classList.add('tkl-dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', m.id); });
  card.addEventListener('dragend', () => { card.classList.remove('tkl-dragging'); tklDrag = null; tklClear(); });
  card.addEventListener('dragover', (e) => {
    if (!tklDrag || tklDrag.kind !== 'card' || tklDrag.id === m.id || tklDrag.scope !== tklScope(m)) return;   // only within the same section
    e.preventDefault(); e.stopPropagation(); tklClear();
    const r = card.getBoundingClientRect();
    card.classList.add(e.clientX > r.left + r.width / 2 ? 'tkl-after' : 'tkl-before');
  });
  card.addEventListener('drop', async (e) => {
    if (!tklDrag || tklDrag.kind !== 'card' || tklDrag.id === m.id || tklDrag.scope !== tklScope(m)) return;
    e.preventDefault(); e.stopPropagation();
    const after = card.classList.contains('tkl-after'), dragId = tklDrag.id; tklClear(); tklDrag = null;
    const list = tk.metrics.filter(x => x.id !== dragId), moved = tk.metrics.find(x => x.id === dragId);
    list.splice(list.findIndex(x => x.id === m.id) + (after ? 1 : 0), 0, moved);
    await tkPostOrder(list); rerender();
  });
}

// a section heading drags the whole section
function tkDragGroup(h, group, rerender) {
  h.draggable = true; h.title = 'Drag to re-order the sections'; h.classList.add('tkl-group-handle');
  h.addEventListener('dragstart', (e) => { tklDrag = { kind: 'group', name: group }; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', group); });
  h.addEventListener('dragend', () => { tklDrag = null; tklClear(); });
  h.addEventListener('dragover', (e) => {
    if (!tklDrag || tklDrag.kind !== 'group' || tklDrag.name === group) return;
    e.preventDefault(); tklClear();
    const r = h.getBoundingClientRect(); h.classList.add(e.clientY > r.top + r.height / 2 ? 'tkl-after' : 'tkl-before');
  });
  h.addEventListener('drop', async (e) => {
    if (!tklDrag || tklDrag.kind !== 'group' || tklDrag.name === group) return;
    e.preventDefault();
    const after = h.classList.contains('tkl-after'), dragged = tklDrag.name; tklClear(); tklDrag = null;
    // the new section order, then the trackers regrouped in that order (each section keeps its own tracker order)
    const names = [...new Set(tk.metrics.map(x => x.group))].filter(n => n !== dragged);
    names.splice(names.indexOf(group) + (after ? 1 : 0), 0, dragged);
    await tkPostOrder(names.flatMap(n => tk.metrics.filter(x => x.group === n))); rerender();
  });
}

// ⭐ Key metrics: starred trackers at the very top (nothing starred = no section)
function tkKeySection(pane, makeCard, rerender) {
  const list = tkShown().filter(m => m.starred && !m.hidden);
  if (!list.length) return;
  const h = document.createElement('h3'); h.className = 'tk-group tk-group-key';
  h.innerHTML = '<span>⭐ Key metrics</span><button class="ctl tkl-clear">Clear all</button>';
  h.querySelector('button').onclick = async () => {
    if (!window.confirm(`Remove all ${list.length} key metric${list.length === 1 ? '' : 's'}? The trackers and their numbers stay; they go back to their own sections.`)) return;
    for (const m of list) await tkSaveMetric({ ...m, starred: false });
    rerender();
  };
  const grid = document.createElement('div'); grid.className = 'tk-grid tk-grid-key';
  list.forEach(m => grid.appendChild(tkHideable(makeCard(m), m, rerender)));
  pane.append(h, grid);
}
