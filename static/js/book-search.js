// book-search.js -- Resources -> Books: upload a PDF / EPUB / TXT for a book, search inside it, and open a match on its own page.
//   * inside each open book: "Upload book" + a "Search this book" box; matches list right under it (with the chapter / page)
//   * above the list: "Search all books" -- matches grouped by book
//   * click a match: the page opens in the reader pane on the right (prev / next, highlighted words); "↗ Open page" opens it in a new
//     browser tab instead (a PDF opens at that page in the browser's own viewer); "＋ Note" saves the passage in that book's notes.
// Server side: routes/booksearch.py + book_index.py. Reads the book shelf (bkBooks) from shelf.js.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const bsEsc = csEsc;   // (shared.js)
const bsInfo = {};          // book id -> {ext, name, units, needs_ocr, progress} for books that have a file
let bsPoll = null;

function bsTerms(q) {
  const t = []; q.replace(/"([^"]+)"/g, (_, p) => { t.push(p.trim()); return ' '; }).split(/\s+/).forEach(w => { if (w) t.push(w); });
  return t;
}
function bsMark(text, q) {
  const terms = [...new Set(bsTerms(q))].sort((a, b) => b.length - a.length).map(t => bsEsc(t).split(/\s+/).filter(Boolean).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\-\\u2010-\\u2014]*'));
  const esc = bsEsc(text);
  return terms.length ? esc.replace(new RegExp('(' + terms.join('|') + ')', 'gi'), '<mark>$1</mark>') : esc;
}
const bsPageUrl = (h, q) => h.ext === 'pdf' && h.page ? `/book-file/${h.book}.pdf#page=${h.page}` : `/book-read?book=${h.book}&unit=${h.unit}&q=${encodeURIComponent(q)}`;

async function bsRefreshInfo() {
  try {
    const d = await csJSON('/api/book-files');
    Object.keys(bsInfo).forEach(k => delete bsInfo[k]); Object.assign(bsInfo, d);
  } catch (e) { /* offline */ }
  bsDecorate();
  const busy = Object.values(bsInfo).some(i => i.progress);
  clearTimeout(bsPoll);
  if (busy) bsPoll = setTimeout(bsRefreshInfo, 3000);   // a scanned PDF is being OCR'd: keep the progress fresh
}

// ---- one hit
function bsHitHtml(h, q, showTitle) {
  const ext = (bsInfo[h.book] || {}).ext;
  return `<div class="bs-hit" data-book="${bsEsc(h.book)}" data-unit="${h.unit}">
    <span class="bs-chip">${bsEsc(h.label)}</span>${showTitle && h.title ? `<span class="bs-from">${bsEsc(h.title)}</span>` : ''}
    <span class="bs-snip">${bsMark(h.snippet, q)}</span>
    <span class="bs-acts"><button class="ctl bs-open">Open here</button><a class="ctl bs-tab" target="_blank" rel="noopener" href="${bsPageUrl({ ...h, ext }, q)}">↗ Open page</a><button class="ctl bs-note">＋ Note</button></span></div>`;
}
function bsWireHits(root, hits, q) {
  root.querySelectorAll('.bs-hit').forEach((el, i) => {
    const h = hits[i];
    el.querySelector('.bs-snip').onclick = el.querySelector('.bs-open').onclick = () => bsOpenReader(h.book, h.unit, q);
    el.querySelector('.bs-note').onclick = (e) => bsAddNote(h, e.target);
  });
}
function bsAddNote(h, btn) {
  const b = bkBooks.data.books.find(x => x.id === h.book);
  if (!b) return;
  b.notes.push({ id: bkId(), text: h.snippet.replace(/^…|…$/g, '').trim(), page: h.page ? String(h.page) : '' });
  bkBooks.save();
  btn.textContent = '✓ Added'; btn.disabled = true;
}

// ---- search (one book, or all)
async function bsRun(which, q) {
  const r = await fetch(`/api/book-search?book=${encodeURIComponent(which)}&q=${encodeURIComponent(q)}`);
  return r.json();
}
// the "N matches" line with a Clear button; clearing empties the results and the search box (Esc and emptying the box do the same)
const bsCountHead = (text) => `<div class="bs-counthead"><span class="bs-count">${text}</span><button class="ctl bs-clear" title="Clear the results (Esc)">✕ Clear</button></div>`;
function bsClear(box) {
  box.querySelector('.bs-results').innerHTML = '';
  const q = box.querySelector('.bs-q'); if (q) q.value = '';
}
function bsWireClear(box) { const b = box.querySelector('.bs-clear'); if (b) b.onclick = () => { bsClear(box); box.querySelector('.bs-q').focus(); }; }
function bsRenderOne(box, d, q) {
  const out = box.querySelector('.bs-results');
  if (!d.hits.length) { out.innerHTML = `<p class="bs-none">No matches for “${bsEsc(q)}”.</p>`; return; }
  const shown = d.hits.slice(0, 12);
  out.innerHTML = bsCountHead(`${d.hits.length}${d.hits.length >= 120 ? '+' : ''} match${d.hits.length === 1 ? '' : 'es'} in this book`) + shown.map(h => bsHitHtml(h, q, false)).join('') +
    (d.hits.length > shown.length ? `<button class="ctl bs-more">Show ${d.hits.length - shown.length} more ⌄</button>` : '');
  bsWireHits(out, shown, q); bsWireClear(box);
  const more = out.querySelector('.bs-more');
  if (more) more.onclick = () => { out.innerHTML = bsCountHead(`${d.hits.length} matches in this book`) + d.hits.map(h => bsHitHtml(h, q, false)).join(''); bsWireHits(out, d.hits, q); bsWireClear(box); };
}
function bsRenderAll(d, q) {
  const out = document.querySelector('#bs-all .bs-results');
  if (!d.hits.length) { out.innerHTML = `<p class="bs-none">No matches for “${bsEsc(q)}” in any book.</p>`; return; }
  out.innerHTML = bsCountHead(`${d.matched} page${d.matched === 1 ? '' : 's'} match in ${d.books.length} book${d.books.length === 1 ? '' : 's'}`);
  bsWireClear(document.getElementById('bs-all'));
  d.books.forEach(bk => {
    const hits = d.hits.filter(h => h.book === bk.book), shown = hits.slice(0, 4);
    const g = document.createElement('div'); g.className = 'bs-group';
    g.innerHTML = `<div class="bs-group-head">📖 <b>${bsEsc(bk.title || bsInfo[bk.book]?.name || 'Book')}</b><span class="bs-count">${bk.matches} page${bk.matches === 1 ? '' : 's'}</span></div>` + shown.map(h => bsHitHtml(h, q, false)).join('') +
      (hits.length > shown.length ? `<button class="ctl bs-more">Show ${hits.length - shown.length} more ⌄</button>` : '');
    out.appendChild(g); bsWireHits(g, shown, q);
    const more = g.querySelector('.bs-more');
    if (more) more.onclick = () => { g.querySelectorAll('.bs-hit, .bs-more').forEach(x => x.remove()); g.insertAdjacentHTML('beforeend', hits.map(h => bsHitHtml(h, q, false)).join('')); bsWireHits(g, hits, q); };
  });
}

// ---- the reader pane
const bsReader = document.getElementById('bs-reader');
let bsCur = null;   // {book, unit, q}
async function bsOpenReader(book, unit, q) {
  const r = await fetch(`/api/book-unit?book=${encodeURIComponent(book)}&unit=${unit}`);
  if (!r.ok) return;
  const u = await r.json();
  bsCur = { book, unit, q, count: u.count };
  const title = (bkBooks.data.books.find(x => x.id === book) || {}).title || u.name;
  document.getElementById('bs-reader-title').innerHTML = `<b>${bsEsc(title)}</b><span>${bsEsc(u.label)}</span>`;
  document.getElementById('bs-reader-body').innerHTML = u.text.split(/\n\s*\n/).filter(p => p.trim()).map(p => `<p>${bsMark(p, q)}</p>`).join('');
  document.getElementById('bs-reader-tab').href = bsPageUrl({ book, unit, page: u.page, ext: u.ext }, q);
  document.getElementById('bs-reader-prev').disabled = unit <= 0;
  document.getElementById('bs-reader-next').disabled = unit >= u.count - 1;
  bsReader.style.display = 'flex';
  document.getElementById('learning-view')?.classList.add('bs-reader-open');   // (the books live on the Learning tab)
  const m = document.querySelector('#bs-reader-body mark');
  if (m) m.scrollIntoView({ block: 'center' }); else document.getElementById('bs-reader-body').scrollTop = 0;
}
function bsCloseReader() { bsReader.style.display = 'none'; document.getElementById('learning-view')?.classList.remove('bs-reader-open'); }
document.getElementById('bs-reader-close').onclick = bsCloseReader;
document.getElementById('bs-reader-prev').onclick = () => bsCur && bsOpenReader(bsCur.book, bsCur.unit - 1, bsCur.q);
document.getElementById('bs-reader-next').onclick = () => bsCur && bsOpenReader(bsCur.book, bsCur.unit + 1, bsCur.q);
bsReader.addEventListener('keydown', (e) => e.stopPropagation());

// ---- upload / remove (right-click a book -> "Upload book…"; nothing about it is shown until a book has a file)
async function bsUploadFile(book, f) {
  if (!f) return;
  ctxToast('Reading the book…');
  try {
    const res = await fetch(`/api/book-upload?book=${encodeURIComponent(book.id)}&name=${encodeURIComponent(f.name)}`, { method: 'POST', body: f });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'upload failed');
    ctxToast(d.progress || d.needs_ocr ? 'Scanned PDF: reading the pages, search will work when it finishes' : `Ready: ${d.units} ${d.ext === 'pdf' ? 'pages' : 'sections'} to search`);
  } catch (e) { alert('Could not add that file: ' + (e.message || e)); return; }
  await bsRefreshInfo();
  bkBooks.render();
  const el = document.querySelector(`#bk-list .bk-book[data-book-id="${book.id}"]`);
  if (el && !book.open) el.querySelector('.bk-head').click();
}
function bsPickFile(book) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.pdf,.epub,.txt,application/pdf,application/epub+zip,text/plain';
  inp.onchange = () => bsUploadFile(book, inp.files[0]);
  inp.click();
}
async function bsRemoveFile(book) {
  if (!confirm(`Remove the uploaded file for "${book.title}"? (Your notes stay.)`)) return;
  await fetch(`/api/book-file-delete?book=${encodeURIComponent(book.id)}`, { method: 'POST' });
  bsRefreshInfo();
}

// ---- controls inside each book: only for books that have a file
function bsDecorate() {
  const any = Object.keys(bsInfo).length > 0;
  const all = document.getElementById('bs-all'); if (all) all.style.display = any ? '' : 'none';
  document.querySelectorAll('#bk-list .bk-book').forEach(el => {
    const id = el.dataset.bookId, body = el.querySelector('.bk-body');
    if (!id || !body) return;
    let box = body.querySelector('.bs-box');
    const info = bsInfo[id];
    if (!info) { if (box) box.remove(); return; }
    if (!box) {
      box = document.createElement('div'); box.className = 'bs-box';
      box.innerHTML = '<div class="bs-file"><span class="bs-fstat"></span></div><div class="bs-searchrow"><input class="bs-q" placeholder="Search this book…" autocomplete="off"><button class="ctl bs-go">🔎 Search book</button></div><div class="bs-results"></div>';
      body.insertBefore(box, body.firstChild);
      const q = box.querySelector('.bs-q');
      const go = async () => { const v = q.value.trim(); if (!v) return; box.querySelector('.bs-results').innerHTML = '<p class="bs-none">Searching…</p>'; bsRenderOne(box, await bsRun(id, v), v); };
      box.querySelector('.bs-go').onclick = go;
      q.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') go(); if (e.key === 'Escape') bsClear(box); });
      q.addEventListener('input', () => { if (!q.value.trim()) bsClear(box); });
    }
    box.querySelector('.bs-fstat').textContent =
      info.progress ? `Scanned PDF: reading the pages (${info.progress.done}/${info.progress.total})… search works when it's done.` :
      info.needs_ocr ? `${info.name} · no text found in this PDF (it looks scanned and OCR isn't available).` :
      `${info.name} · ${info.units} ${info.ext === 'pdf' ? 'pages' : 'sections'} ready to search`;
    box.querySelector('.bs-searchrow').style.display = info.needs_ocr && !info.progress ? 'none' : '';
  });
}

// ---- search all books (above the list)
(function bsBuildAll() {
  const host = document.getElementById('bs-all');
  host.innerHTML = `<div class="bs-searchrow"><input class="bs-q" placeholder="Search all your books…" autocomplete="off"><button class="ctl bs-go">🔎 Search all books</button></div><div class="bs-results"></div>`;
  const q = host.querySelector('.bs-q');
  const go = async () => { const v = q.value.trim(); if (!v) return; host.querySelector('.bs-results').innerHTML = '<p class="bs-none">Searching…</p>'; bsRenderAll(await bsRun('all', v), v); };
  host.querySelector('.bs-go').onclick = go;
  q.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') go(); if (e.key === 'Escape') bsClear(host); });
  q.addEventListener('input', () => { if (!q.value.trim()) bsClear(host); });
})();

// the shelf re-renders its list after every change: put the controls back each time
new MutationObserver(() => bsDecorate()).observe(document.getElementById('bk-list'), { childList: true });
bsRefreshInfo();

// Drop a document on Learning: make the shelf entry and index it in one move.
const bsDrop = document.getElementById('learning-books-drop');
bsDrop.addEventListener('dragover', e => { if ([...e.dataTransfer.files].some(f => /\.(pdf|epub|txt)$/i.test(f.name))) { e.preventDefault(); bsDrop.classList.add('book-drop'); } });
bsDrop.addEventListener('dragleave', () => bsDrop.classList.remove('book-drop'));
bsDrop.addEventListener('drop', async e => {
  const files = [...e.dataTransfer.files].filter(f => /\.(pdf|epub|txt)$/i.test(f.name));
  if (!files.length) return;
  e.preventDefault(); bsDrop.classList.remove('book-drop');
  for (const f of files) {
    const book = { id: bkId(), title: f.name.replace(/\.(pdf|epub|txt)$/i, '').replace(/[_-]+/g, ' '), open: true, notes: [] };
    bkBooks.data.books.push(book); bkBooks.save(); bkBooks.render(); await bsUploadFile(book, f);
  }
});
