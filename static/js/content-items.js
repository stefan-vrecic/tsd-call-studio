// content-items.js -- the Content tab's "Content ideas" list. Every idea is an ITEM (not a bullet): a one-line title you add with the box on top, a checkbox for
// "posted" (it records when you ticked it: "posted Fri 16 Oct, 14:20", and the time can be changed in the notepad), and a little NOTEPAD that opens when you double-click
// the item, for writing the idea out properly (title + notes, saved as you type, plus Delete). Posted items drop to the bottom, greyed out.
// Saved with records.js ("contentideas"). The first time it loads, the old bullet text from content-notes.json is turned into items (empty "Call –" placeholders skipped).
// ciAppendIdea(line) -- used by the call right-click "Save in note-tracker" -- adds an item too.
// Plain script (not a module): shares one global scope with the other files; load it after records.js (recStore).

const ciStore = recStore('contentideas', 'ci-status-ideas', { items: [], migrated: false });
const ciListEl = document.getElementById('ci-items');
const ciCountEl = document.getElementById('ci-count');
let ciItemsReady = false, ciNotepadId = null, ciNoteTimer = null;

const ciNice = (iso) => iso ? new Date(iso).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
const ciLocalInput = (iso) => { const d = new Date(iso || Date.now()), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

function ciNewItem(title, body = '') { return { id: recId(), title: title.trim(), body, posted: false, postedAt: null, created: new Date().toISOString() }; }

async function ciItemsLoad() {
  if (ciItemsReady) return;
  await ciStore.load();
  if (!ciStore.doc.migrated && !ciStore.doc.items.length) {   // once: the old bullet text becomes items
    try {
      const old = (await csJSON('/api/content-notes')).ideas || '';
      old.split('\n').map(l => l.replace(/^\s*[•\-*]\s*/, '').trim()).filter(t => t && !/^call\s*[–-]\s*$/i.test(t)).forEach(t => ciStore.doc.items.push(ciNewItem(t)));
    } catch (e) { /* offline: try again next time */ return; }
    ciStore.doc.migrated = true;
    ciStore.save();
  }
  ciItemsReady = true;
  ciItemsRender();
}

function ciItemsRender() {
  const items = ciStore.doc.items;
  const open = items.filter(i => !i.posted), done = items.filter(i => i.posted).sort((a, b) => (b.postedAt || '').localeCompare(a.postedAt || ''));
  ciCountEl.textContent = items.length ? `${open.length} to post · ${done.length} posted` : '';
  // ideas number themselves (1, 2, 3 ... in list order; posted ones keep counting on below the "Posted" line)
  const row = (i, n) => `<div class="ci-item${i.posted ? ' posted' : ''}" data-id="${i.id}"><input type="checkbox" class="ci-post" ${i.posted ? 'checked' : ''} title="${i.posted ? 'Posted: click to undo' : 'Tick when you have posted it'}">
    <span class="ci-num">${n}.</span><div class="ci-item-main"><span class="ci-title">${recEsc(i.title)}</span>${i.body ? '<span class="ci-has-note" title="Has notes: double-click to open">📝</span>' : ''}${i.posted ? `<span class="ci-when">posted ${recEsc(ciNice(i.postedAt))}</span>` : ''}</div></div>`;
  ciListEl.innerHTML = (items.length ? open.map((it, k) => row(it, k + 1)).join('') + (done.length ? `<div class="ci-sep">Posted</div>` + done.map((it, k) => row(it, open.length + k + 1)).join('') : '') : '<p class="ci-empty">No ideas yet. Type one above and press Enter.</p>');
  ciListEl.querySelectorAll('.ci-item').forEach(el => {
    const it = items.find(x => x.id === el.dataset.id);
    el.querySelector('.ci-post').onchange = (e) => { it.posted = e.target.checked; it.postedAt = it.posted ? new Date().toISOString() : null; ciStore.save(); ciItemsRender(); };
    el.ondblclick = (e) => { if (!e.target.closest('input')) ciNotepadOpen(it.id); };
    el.oncontextmenu = (e) => {   // right-click an idea: open it, or delete it (asks first)
      e.preventDefault(); e.stopPropagation();
      csMenu(e, [{ heading: it.title.slice(0, 60) },
        { text: '📝 Open notes', onClick: () => ciNotepadOpen(it.id) },
        { text: '🗑 Delete idea', onClick: () => {
          if (!window.confirm(`Delete this idea?\n\n${it.title}${it.body ? '\n\n(its notes go too)' : ''}`)) return;
          ciStore.doc.items = ciStore.doc.items.filter(x => x !== it); ciStore.save();
          if (ciNotepadId === it.id) ciNotepadClose(); else ciItemsRender();
        } }]);
    };
  });
}

// ---- add box
const ciNewBox = document.getElementById('ci-new');
ciNewBox.addEventListener('keydown', async (e) => {
  e.stopPropagation();
  if (e.key !== 'Enter' || !ciNewBox.value.trim()) return;
  e.preventDefault();
  await ciItemsLoad();
  ciStore.doc.items.push(ciNewItem(ciNewBox.value));
  ciNewBox.value = '';
  ciStore.save(); ciItemsRender();
  ciListEl.scrollTop = 0;
});

// ---- the little notepad
function ciNotepad() {
  let box = document.getElementById('ci-notepad');
  if (box) return box;
  box = document.createElement('div'); box.id = 'ci-notepad';
  box.innerHTML = `<div class="ci-pad"><div class="ci-pad-top"><span>📝 Content idea</span><button class="ci-pad-x" title="Close (Esc)">✕</button></div>
    <input class="ci-pad-title" placeholder="Title"><textarea class="ci-pad-body" placeholder="Write the idea out here: the hook, the points, the call to action…" spellcheck="true"></textarea>
    <div class="ci-pad-foot"><label class="ci-pad-posted"><input type="checkbox"> Posted</label><input type="datetime-local" class="ci-pad-when"><span class="ci-pad-saved"></span><span class="spacer"></span><button class="ctl ci-pad-del">Delete</button></div></div>`;
  document.body.appendChild(box);
  box.addEventListener('mousedown', (e) => { if (e.target === box) ciNotepadClose(); });
  box.querySelector('.ci-pad-x').onclick = ciNotepadClose;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.style.display === 'flex') { e.preventDefault(); ciNotepadClose(); } });
  box.querySelectorAll('input, textarea').forEach(el => el.addEventListener('keydown', (e) => e.stopPropagation()));
  const cur = () => ciStore.doc.items.find(x => x.id === ciNotepadId);
  const saved = (t) => { box.querySelector('.ci-pad-saved').textContent = t; };
  const queue = () => { saved('Typing…'); clearTimeout(ciNoteTimer); ciNoteTimer = setTimeout(() => { ciStore.save(); saved('Saved ✓'); }, 500); };
  box.querySelector('.ci-pad-title').oninput = (e) => { const it = cur(); if (it) { it.title = e.target.value; queue(); } };
  box.querySelector('.ci-pad-body').oninput = (e) => { const it = cur(); if (it) { it.body = e.target.value; queue(); } };
  const postedBox = box.querySelector('.ci-pad-posted input'), whenBox = box.querySelector('.ci-pad-when');
  postedBox.onchange = () => { const it = cur(); if (!it) return; it.posted = postedBox.checked; it.postedAt = it.posted ? new Date().toISOString() : null; whenBox.value = it.posted ? ciLocalInput(it.postedAt) : ''; whenBox.style.display = it.posted ? '' : 'none'; queue(); };
  whenBox.onchange = () => { const it = cur(); if (it && it.posted && whenBox.value) { it.postedAt = new Date(whenBox.value).toISOString(); queue(); } };
  box.querySelector('.ci-pad-del').onclick = () => {
    const it = cur(); if (!it) return;
    if (!window.confirm(`Delete this idea?\n\n${it.title}`)) return;
    ciStore.doc.items = ciStore.doc.items.filter(x => x !== it); ciStore.save(); ciNotepadClose();
  };
  return box;
}
function ciNotepadOpen(id) {
  const it = ciStore.doc.items.find(x => x.id === id); if (!it) return;
  ciNotepadId = id;
  const box = ciNotepad();
  box.querySelector('.ci-pad-title').value = it.title; box.querySelector('.ci-pad-body').value = it.body || '';
  box.querySelector('.ci-pad-posted input').checked = !!it.posted;
  const w = box.querySelector('.ci-pad-when'); w.value = it.posted ? ciLocalInput(it.postedAt) : ''; w.style.display = it.posted ? '' : 'none';
  box.querySelector('.ci-pad-saved').textContent = '';
  box.style.display = 'flex';
  box.querySelector('.ci-pad-body').focus();
}
function ciNotepadClose() {
  const box = document.getElementById('ci-notepad'); if (!box) return;
  clearTimeout(ciNoteTimer);
  const it = ciStore.doc.items.find(x => x.id === ciNotepadId);
  if (it) { if (!it.title.trim()) it.title = '(untitled)'; ciStore.save(); }
  box.style.display = 'none'; ciNotepadId = null; ciItemsRender();
}

// ---- adding from elsewhere ("Save in note-tracker" on a call): a new item. Works whether or not the Content tab has been opened.
async function ciAppendIdea(line) {
  await ciItemsLoad();
  ciStore.doc.items.push(ciNewItem(line));
  ciStore.save();
  ciItemsRender();
}

new MutationObserver(() => { if (ciView.style.display !== 'none') ciItemsLoad(); }).observe(ciView, { attributes: true, attributeFilter: ['style'] });
if (ciView.style.display !== 'none') ciItemsLoad();
