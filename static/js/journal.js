// journal.js -- the Journal tab: pictures of your journal pages, shown day by day (newest day first). Add pages with the button, by dragging pictures
// onto the page, or by pasting (Cmd+V). They go on the day in the date box (today by default; before 5am counts as the day before), or on each
// photo's own date if you tick "use each photo's date". Click a picture to see it big (arrow keys; Esc or a click on the black area closes it), move it to another day, or delete it.
// The Page box (top right of the big view) re-orders the pages within their day. Stored only on this Mac (live_docs/journal/<day>/), never uploaded anywhere. See routes/journal.py.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const jrRoot = document.getElementById('jr-root');
let jrDays = [];
let jrFlat = [];      // every picture in display order, for the big viewer's prev/next
let jrView = -1;      // index in jrFlat of the picture shown big, -1 = closed
let jrDate = '';      // the day new pictures go on

const jrToday = () => { const d = new Date(Date.now() - 5 * 3600 * 1000); return d.toLocaleDateString('en-CA'); };   // before 5am = still yesterday
const jrNice = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const jrEsc = csEsc;   // (shared.js)

async function jrOpen() {
  if (!jrDate) jrDate = jrToday();
  try { jrDays = (await csJSON('/api/journal')).days || []; } catch (e) { jrRoot.innerHTML = '<p class="jr-note">Can\'t reach the server.</p>'; return; }
  jrFlat = jrDays.flatMap(d => d.images.map(im => ({ ...im, date: d.date })));
  jrRender();
}

function jrRender() {
  const total = jrFlat.length;
  jrRoot.innerHTML = `<div class="jr-bar">
      <button class="jr-add">＋ Add pages</button><button class="jr-type" title="Write a page instead of photographing one">✍️ Type a page</button>
      <label>Day <input type="date" class="jr-date" value="${jrDate}"></label>
      <label class="jr-own"><input type="checkbox" class="jr-useown"> use each photo's own date</label>
      <span class="jr-count">${total} page${total === 1 ? '' : 's'} on ${jrDays.length} day${jrDays.length === 1 ? '' : 's'}</span>
      <input type="search" class="jr-search" placeholder="🔍 Search what you wrote…" title="Searches the text of every typed page">
      <input type="file" class="jr-file" accept="image/*" multiple hidden>
    </div>
    <p class="jr-hint">Drag pictures anywhere on this page, or paste them. Saved only on this Mac.</p><div class="jr-results"></div>` +
    (jrDays.length ? jrDays.map(d => `<section class="jr-day"><h3>${jrEsc(jrNice(d.date))} <span>${d.images.length} page${d.images.length === 1 ? '' : 's'}</span></h3>
      <div class="jr-grid">${d.images.map(im => `<button class="jr-thumb" data-i="${jrFlat.findIndex(f => f.id === im.id)}"><img src="${im.url}" loading="lazy" alt="Journal page"></button>`).join('')}</div></section>`).join('')
      : '<p class="jr-note">No journal pages yet. Add your first one above.</p>');
  const file = jrRoot.querySelector('.jr-file');
  jrRoot.querySelector('.jr-add').onclick = () => file.click();
  jrRoot.querySelector('.jr-type').onclick = () => jrTypeOpen();   // journal-typed.js
  file.onchange = () => { jrUpload([...file.files], jrRoot.querySelector('.jr-useown').checked); file.value = ''; };
  jrRoot.querySelector('.jr-date').onchange = (e) => { if (e.target.value) jrDate = e.target.value; };
  jrRoot.querySelectorAll('.jr-thumb').forEach(b => b.onclick = () => jrShow(+b.dataset.i));
  const search = jrRoot.querySelector('.jr-search');
  search.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { search.value = ''; jrSearch(''); } });
  search.addEventListener('input', () => jrSearch(search.value));
}

// 🔍 search: every typed page's text (photographed pages have no text to search), newest first; each hit shows its day and the words
// around the match -- click it to open that page
function jrSearch(q) {
  const box = jrRoot.querySelector('.jr-results'); if (!box) return;
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) { box.innerHTML = ''; return; }
  const hits = jrFlat.map((p, i) => ({ p, i })).filter(({ p }) => p.text && words.every(w => p.text.toLowerCase().includes(w)));
  const snippet = (text) => {
    const flat = text.replace(/\s+/g, ' '), at = flat.toLowerCase().indexOf(words[0]), from = Math.max(0, at - 60);
    let s = jrEsc((from ? '…' : '') + flat.slice(from, at + 140) + (at + 140 < flat.length ? '…' : ''));
    words.forEach(w => { s = s.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`); });
    return s;
  };
  box.innerHTML = hits.length ? `<div class="jr-results-head">${hits.length} page${hits.length === 1 ? '' : 's'} mention “${jrEsc(q.trim())}”</div>` +
    hits.map(({ p, i }) => `<button class="jr-hit" data-i="${i}"><b>${jrEsc(jrNice(p.date))}</b><span>${snippet(p.text)}</span></button>`).join('')
    : `<div class="jr-results-head">Nothing typed mentions “${jrEsc(q.trim())}”. <small>(Photographed pages can't be searched.)</small></div>`;
  box.querySelectorAll('.jr-hit').forEach(b => b.onclick = () => jrShow(+b.dataset.i));
}

async function jrUpload(files, useOwn) {
  const pics = files.filter(f => f.type.startsWith('image/'));
  if (!pics.length) return;
  const dateBox = jrRoot.querySelector('.jr-date');
  if (dateBox && dateBox.value) jrDate = dateBox.value;
  let ok = 0, bad = 0;
  for (const f of pics) {
    const day = useOwn && f.lastModified ? new Date(f.lastModified).toLocaleDateString('en-CA') : jrDate;
    try {
      const r = await fetch('/api/journal-add?date=' + day, { method: 'POST', headers: { 'Content-Type': f.type }, body: f });
      if (r.ok) ok++; else bad++;
    } catch (e) { bad++; }
  }
  ctxToast(`${ok} page${ok === 1 ? '' : 's'} added${bad ? `, ${bad} failed (too big or not a picture)` : ''}`);
  jrOpen();
}

// drag-and-drop and paste, only while the Journal tab is the one showing
const jrActive = () => typeof STATIC_VIEWS !== 'undefined' && STATIC_VIEWS.journal.style.display !== 'none';
document.addEventListener('dragover', (e) => { if (jrActive() && [...(e.dataTransfer?.types || [])].includes('Files')) e.preventDefault(); });
document.addEventListener('drop', (e) => { if (!jrActive() || !e.dataTransfer?.files?.length) return; e.preventDefault(); jrUpload([...e.dataTransfer.files], false); });
document.addEventListener('paste', (e) => { if (!jrActive()) return; const files = [...(e.clipboardData?.files || [])]; if (files.length) { e.preventDefault(); jrUpload(files, false); } });

// ---- the big viewer
function jrShow(i) {
  jrView = i;
  let box = document.getElementById('jr-viewer');
  if (!box) {
    box = document.createElement('div'); box.id = 'jr-viewer'; document.body.appendChild(box);
    box.addEventListener('click', (e) => { if (!e.target.closest('img, button, input')) jrClose(); });   // a click on the black area closes it
  }
  const im = jrFlat[i];
  const dayPics = jrFlat.filter(f => f.date === im.date), pageNo = dayPics.findIndex(f => f.id === im.id) + 1;
  box.innerHTML = `<div class="jr-v-top"><span>${jrEsc(jrNice(im.date))} · ${i + 1} of ${jrFlat.length}</span>
      <span><label class="jr-v-page" title="Page number within this day: change it to re-order">Page <input type="number" class="jr-v-pos" min="1" max="${dayPics.length}" value="${pageNo}"> of ${dayPics.length}</label><input type="date" class="jr-v-date" value="${im.date}" title="Move this page to another day"><button class="jr-v-move">Move</button>${im.typed ? '<button class="jr-v-edit">✏️ Edit text</button>' : ''}<button class="jr-v-del">Delete</button><button class="jr-v-close">✕</button></span></div>
    <button class="jr-v-prev"${i === 0 ? ' disabled' : ''}>‹</button><img src="${im.url}" alt="Journal page"><button class="jr-v-next"${i === jrFlat.length - 1 ? ' disabled' : ''}>›</button>`;
  box.style.display = 'flex';
  box.querySelector('.jr-v-close').onclick = jrClose;
  const pos = box.querySelector('.jr-v-pos');
  const reorder = async () => {   // Enter or leaving the box: put this page at that number, then show it again where it landed
    const n = Math.min(Math.max(parseInt(pos.value, 10) || pageNo, 1), dayPics.length);
    if (n === pageNo) { pos.value = pageNo; return; }
    await fetch(`/api/journal-order?date=${im.date}&id=${im.id}&pos=${n}`, { method: 'POST' });
    await jrOpen();
    jrShow(jrFlat.findIndex(f => f.id === im.id));
  };
  pos.onchange = reorder;
  pos.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); reorder(); } };
  box.querySelector('.jr-v-prev').onclick = () => jrShow(i - 1);
  box.querySelector('.jr-v-next').onclick = () => jrShow(i + 1);
  box.querySelector('.jr-v-move').onclick = async () => {
    const to = box.querySelector('.jr-v-date').value;
    if (!to || to === im.date) return;
    await fetch(`/api/journal-move?date=${im.date}&id=${im.id}&to=${to}`, { method: 'POST' });
    jrClose(); ctxToast('Moved to ' + to); jrOpen();
  };
  const edit = box.querySelector('.jr-v-edit');
  if (edit) edit.onclick = () => jrTypeOpen({ id: im.id, date: im.date, text: im.text || '' });
  box.querySelector('.jr-v-del').onclick = async () => {
    if (!window.confirm('Delete this journal page? This can\'t be undone.')) return;
    await fetch(`/api/journal-delete?date=${im.date}&id=${im.id}`, { method: 'POST' });
    jrClose(); jrOpen();
  };
}
function jrClose() { const box = document.getElementById('jr-viewer'); if (box) box.style.display = 'none'; jrView = -1; }
document.addEventListener('keydown', (e) => {
  if (jrView < 0 || e.target.tagName === 'INPUT') return;   // typing in the page / date boxes
  if (e.key === 'Escape') jrClose();
  else if (e.key === 'ArrowLeft' && jrView > 0) jrShow(jrView - 1);
  else if (e.key === 'ArrowRight' && jrView < jrFlat.length - 1) jrShow(jrView + 1);
});

if (liveStore('appTab') === 'journal') jrOpen();   // reopened on this tab
