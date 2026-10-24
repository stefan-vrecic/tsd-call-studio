// networking.js -- the "Collab & networking" list beside the Swipe gallery on the Content tab: people to reach out to and talk ideas through.
// One row per person: name, where to find them (handle or link), what to discuss, and a status (To reach out / Messaged / Talked). Click a
// status to cycle it. Right-click a person: ✏️ Edit (name / handle), ➕ New line (the discussion notes can run to several lines), 🗑 Delete. Saved with records.js ("networking"), so it is stored on this Mac like the other business tabs.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const NW_STATES = [['todo', 'To reach out'], ['sent', 'Messaged'], ['talked', 'Talked']];
const nwStore = recStore('networking', 'nw-status', { people: [] });
const nwRoot = document.getElementById('nw-root');
let nwEditId = null;   // the person whose name / handle are being edited (right-click > Edit)

async function nwOpen() { await nwStore.load(); nwRender(); }

function nwRender() {
  const people = nwStore.doc.people;
  const order = { todo: 0, sent: 1, talked: 2 };
  const shown = people.map((p, i) => [p, i]).sort((a, b) => order[a[0].status || 'todo'] - order[b[0].status || 'todo'] || a[1] - b[1]).map(x => x[0]);
  const link = (t) => /^https?:\/\//i.test(t) ? t : /^@?[\w.]+$/.test(t) && t ? 'https://instagram.com/' + t.replace(/^@/, '') : '';
  nwRoot.innerHTML = `<form class="nw-add"><input name="name" placeholder="Name" required><input name="where" placeholder="@handle or link"><input name="topic" placeholder="What to discuss"><button class="ctl">Add</button></form>` +
    (shown.length ? `<div class="nw-list">${shown.map(p => {
      const st = p.status || 'todo', href = link(p.where || '');
      const editing = p.id === nwEditId;
      return `<div class="nw-row nw-${st}" data-id="${p.id}"><button class="nw-state" title="Click to change status">${NW_STATES.find(s => s[0] === st)[1]}</button>
        <div class="nw-main">${editing ? `<input class="nw-edit-name" value="${recEsc(p.name)}" placeholder="Name"> <input class="nw-edit-where" value="${recEsc(p.where || '')}" placeholder="@handle or link">`
          : `<b>${recEsc(p.name)}</b>${p.where ? ` <span class="nw-where">${href ? `<a href="${recEsc(href)}" target="_blank" rel="noopener">${recEsc(p.where)}</a>` : recEsc(p.where)}</span>` : ''}`}
        <textarea class="nw-topic" rows="1" placeholder="What to discuss…">${recEsc(p.topic || '')}</textarea></div><button class="nw-del" title="Remove">🗑</button></div>`;
    }).join('')}</div>` : '<p class="sw-empty">Nobody here yet. Add the people you want to collaborate with or learn from.</p>');
  nwRoot.querySelector('.nw-add').onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target), name = String(f.get('name')).trim();
    if (!name) return;
    people.unshift({ id: recId(), name, where: String(f.get('where')).trim(), topic: String(f.get('topic')).trim(), status: 'todo', added: recToday() });
    nwStore.save(); nwRender();
  };
  const grow = (ta) => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };   // the notes box grows with its lines
  nwRoot.querySelectorAll('.nw-row').forEach(row => {
    const p = people.find(x => x.id === row.dataset.id);
    const ta = row.querySelector('.nw-topic'); grow(ta);
    row.querySelector('.nw-state').onclick = () => { const i = NW_STATES.findIndex(s => s[0] === (p.status || 'todo')); p.status = NW_STATES[(i + 1) % NW_STATES.length][0]; nwStore.save(); nwRender(); };
    ta.oninput = () => grow(ta);
    ta.onchange = () => { p.topic = ta.value.replace(/\s+$/, ''); nwStore.save(); };
    ta.addEventListener('keydown', (e) => e.stopPropagation());   // Enter makes a new line; page shortcuts stay quiet while typing
    row.querySelector('.nw-del').onclick = () => nwDelete(p);
    row.addEventListener('contextmenu', (e) => {
      if (e.target.closest('input, textarea')) return;   // keep the normal menu (paste) inside the boxes
      e.preventDefault(); e.stopPropagation();
      csMenu(e, [{ heading: p.name },
        { text: '✏️ Edit name / handle', onClick: () => { nwEditId = p.id; nwRender(); const n = nwRoot.querySelector('.nw-edit-name'); if (n) { n.focus(); n.select(); } } },
        { text: '➕ New line', onClick: () => {   // a fresh line at the end of the notes, cursor on it
          ta.value = ta.value ? ta.value.replace(/\s+$/, '') + '\n' : ''; grow(ta); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
        } },
        { text: '🗑 Delete', onClick: () => nwDelete(p) }]);
    });
    if (p.id === nwEditId) {
      const nameIn = row.querySelector('.nw-edit-name'), whereIn = row.querySelector('.nw-edit-where');
      let done = false;
      const finish = (save) => {
        if (done) return; done = true;
        if (save && nameIn.value.trim()) { p.name = nameIn.value.trim(); p.where = whereIn.value.trim(); nwStore.save(); }
        nwEditId = null; nwRender();
      };
      [nameIn, whereIn].forEach(el => {
        el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); finish(true); } else if (e.key === 'Escape') { e.preventDefault(); finish(false); } });
        el.addEventListener('blur', () => setTimeout(() => { if (!row.contains(document.activeElement)) finish(true); }, 0));   // leaving both boxes saves
      });
    }
  });
}

function nwDelete(p) {
  if (!window.confirm('Remove ' + p.name + ' from the list?')) return;
  nwStore.doc.people = nwStore.doc.people.filter(x => x !== p); nwStore.save(); nwRender();
}

nwOpen();

const nwRecordingFile = document.getElementById('nw-recording-file');
const nwRecordings = document.getElementById('nw-recordings');
async function nwLoadRecordings() {
  try {
    const data = await csJSON('/api/networking-recordings');
    nwRecordings.innerHTML = data.items.length ? data.items.map(item => `<article><b>${recEsc(item.name)}</b>${/\.(mp4|mov|webm)$/i.test(item.file) ? `<video controls preload="metadata" src="${item.url}"></video>` : `<audio controls preload="metadata" src="${item.url}"></audio>`}<button class="ctl" data-path="${recEsc(item.path)}">Copy path</button></article>`).join('') : '<p class="sw-empty">No sales recordings added yet.</p>';
    nwRecordings.querySelectorAll('[data-path]').forEach(button => button.onclick = async () => { await navigator.clipboard.writeText(button.dataset.path); ctxToast('Recording path copied'); });
  } catch (e) { nwRecordings.innerHTML = '<p class="sw-empty">Could not load recordings.</p>'; }
}
document.getElementById('nw-recording-add').onclick = () => nwRecordingFile.click();
nwRecordingFile.onchange = async () => {
  const file = nwRecordingFile.files[0]; if (!file) return;
  document.getElementById('nw-status').textContent = 'Uploading recording…';
  const res = await fetch('/api/networking-recording', { method: 'POST', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name) } });
  document.getElementById('nw-status').textContent = res.ok ? 'Saved ✓' : '⚠ Upload failed'; nwRecordingFile.value = ''; nwLoadRecordings();
};
nwLoadRecordings();
