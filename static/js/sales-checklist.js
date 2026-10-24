// sales-checklist.js -- the "Sales Checklist" card on the Checklist tab: add people by name, the sale's date, the £ collected
// and a short note (the £ total is under the title).
// Saved on the server (live_docs/sales-checklist.json), newest at the top.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const scList = document.getElementById('sc-list');
const scName = document.getElementById('sc-name');
const scSub = document.getElementById('sc-sub');
let scItems = [];
let scSaveTimer = null;

function scSave() {
  clearTimeout(scSaveTimer);
  scSaveTimer = setTimeout(() => {
    fetch('/api/sales-checklist', { method: 'POST', body: JSON.stringify({ items: scItems }), keepalive: true }).catch(() => {});
  }, 400);
}

function scCount() {
  const total = scItems.reduce((a, i) => a + (parseFloat(String(i.amount || '').replace(/[£,\s]/g, '')) || 0), 0);
  scSub.textContent = scItems.length ? `${scItems.length} sale${scItems.length === 1 ? '' : 's'}${total ? ` · £${total.toLocaleString(undefined, { maximumFractionDigits: 2 })} collected` : ''}` : 'Type a name and press Enter to add someone';   // (ticking is switched off for now: "done" is still saved, just not shown)
}

function scRender() {
  scList.innerHTML = '';
  scItems.forEach(it => {
    const li = document.createElement('li');
    li.className = 'sc-row';
    li.innerHTML = '<div class="sc-name"></div><input type="date" class="sc-date" title="Date of the sale"><label class="sc-amt" title="Amount collected"><span>£</span><input type="text" inputmode="decimal" placeholder="0"></label><input type="text" class="sc-note" placeholder="Note…"><button class="sc-del" title="Remove">✕</button>';
    li.querySelector('.sc-name').textContent = it.name;
    const note = li.querySelector('.sc-note');
    note.value = it.note || '';
    note.addEventListener('input', () => { it.note = note.value; scSave(); });
    note.addEventListener('keydown', (e) => e.stopPropagation());
    const date = li.querySelector('.sc-date'), amt = li.querySelector('.sc-amt input');
    date.value = it.date || '';
    date.addEventListener('change', () => { it.date = date.value; scSave(); });
    amt.value = it.amount || '';
    amt.addEventListener('input', () => { it.amount = amt.value.trim(); scCount(); scSave(); });
    [date, amt].forEach(el => el.addEventListener('keydown', (e) => e.stopPropagation()));
    li.querySelector('.sc-del').onclick = () => { if (confirm(`Remove ${it.name} from the Sales Checklist?`)) { scItems = scItems.filter(x => x !== it); scSave(); scRender(); } };
    scList.appendChild(li);
  });
  scCount();
}

function scAdd() {
  const name = scName.value.replace(/\s+/g, ' ').trim();
  if (!name) { scName.focus(); return; }
  scItems.unshift({ id: 's' + Date.now().toString(36), name, done: false, note: '', date: new Date().toISOString().slice(0, 10), amount: '', added: new Date().toISOString() });
  scName.value = '';
  scSave(); scRender(); scName.focus();
}
document.getElementById('sc-add-go').onclick = scAdd;
scName.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') scAdd(); });

scRender();
csJSON('/api/sales-checklist').then(d => { scItems = d.items || []; scRender(); }).catch(() => { /* offline: empty */ });
