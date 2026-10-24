// planner.js -- Journal / Planner tab -> right-hand "Planner / Strategy" column: areas with a sub-heading, each one either free text,
// an A/B split (a T-chart: two headed columns) or 4 quadrants (to compare options). Saved as records "planner" (records.js).
const jpStore = recStore('planner', 'jp-status', { sections: [] });
const jpRoot = document.getElementById('jp-root');
const JP_CELLS = { split: ['Option A', 'Option B'], quad: ['Option 1', 'Option 2', 'Option 3', 'Option 4'] };   // kind -> placeholder headings
async function jpOpen() { await jpStore.load(); jpRender(); }
function jpBody(s) {
  if (!JP_CELLS[s.kind]) return `<textarea placeholder="Write out your thoughts, decisions, and next steps…">${recEsc(s.text || '')}</textarea>`;
  return `<div class="jp-${s.kind}">${JP_CELLS[s.kind].map((ph, c) => `<div class="jp-cell" data-c="${c}"><input class="jp-head" value="${recEsc((s.cells[c] || {}).head || '')}" placeholder="${ph}"><textarea placeholder="…">${recEsc((s.cells[c] || {}).text || '')}</textarea></div>`).join('')}</div>`;
}
function jpRender() {
  jpRoot.innerHTML = jpStore.doc.sections.length ? jpStore.doc.sections.map((s, i) => `<section class="jp-section" data-i="${i}"><div><input class="jp-title" value="${recEsc(s.title || '')}" placeholder="${JP_CELLS[s.kind] ? 'What are you comparing?' : 'Area of life / sub-heading'}"><button title="Delete">×</button></div>${jpBody(s)}</section>`).join('') : '<p class="jr-hint">No strategy areas yet.</p>';
  jpRoot.querySelectorAll('.jp-section').forEach(el => {
    const s = jpStore.doc.sections[+el.dataset.i], title = el.querySelector('.jp-title');
    title.onchange = () => { s.title = title.value.trim(); jpStore.save(); };
    el.querySelector('div > button').onclick = () => { if (confirm('Delete this strategy area?')) { jpStore.doc.sections.splice(+el.dataset.i, 1); jpStore.save(); jpRender(); } };
    if (!JP_CELLS[s.kind]) { const text = el.querySelector('textarea'); text.oninput = () => { s.text = text.value; jpStore.save(); }; return; }
    el.querySelectorAll('.jp-cell').forEach(cell => {
      const c = s.cells[+cell.dataset.c] || (s.cells[+cell.dataset.c] = { head: '', text: '' }), head = cell.querySelector('input'), text = cell.querySelector('textarea');
      head.oninput = () => { c.head = head.value; jpStore.save(); };
      text.oninput = () => { c.text = text.value; jpStore.save(); };
    });
  });
}
function jpAdd(kind) {
  jpStore.doc.sections.push(JP_CELLS[kind] ? { id: recId(), kind, title: '', cells: JP_CELLS[kind].map(() => ({ head: '', text: '' })) } : { id: recId(), title: '', text: '' });
  jpStore.save(); jpRender(); jpRoot.querySelector('.jp-section:last-child input').focus();
}
document.getElementById('jp-add').onclick = () => jpAdd('text');
document.getElementById('jp-add-split').onclick = () => jpAdd('split');
document.getElementById('jp-add-quad').onclick = () => jpAdd('quad');
jpOpen();
