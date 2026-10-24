// checklist.js -- the Checklist tab is a little book: one card (page) at a time, with Prev / Next buttons and the left / right arrow keys.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const clPages = [...document.querySelectorAll('#precall-view .precall-doc')];
let clIndex = 0;   // always opens on the Pre-Call page

// left-hand menu: one button per card, named after the card's heading
const clMenu = document.querySelector('#precall-view .cl-menu');
const clMenuBtns = clPages.map((p, k) => {
  const b = document.createElement('button');
  b.className = 'cl-menu-item';
  b.textContent = p.querySelector('h2').textContent;
  b.onclick = () => clShow(k);
  clMenu.appendChild(b);
  return b;
});

function clShow(i) {
  clIndex = Math.min(Math.max(i, 0), clPages.length - 1);
  clMenuBtns.forEach((b, k) => b.classList.toggle('active', k === clIndex));
  clPages.forEach((p, k) => {
    p.classList.toggle('active', k === clIndex);
    p.querySelector('.cl-count').textContent = `${k + 1} / ${clPages.length}`;
    p.querySelector('.cl-prev').disabled = k === 0;
    p.querySelector('.cl-next').disabled = k === clPages.length - 1;
  });
}

clPages.forEach(p => {
  p.querySelector('.cl-prev').onclick = () => clShow(clIndex - 1);
  p.querySelector('.cl-next').onclick = () => clShow(clIndex + 1);
});
document.getElementById('tab-precall').addEventListener('click', () => clShow(0));   // every time the tab is opened, start at Pre-Call
document.addEventListener('keydown', (e) => {
  if (document.getElementById('precall-view').style.display === 'none') return;
  if ((e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'ArrowRight') clShow(clIndex + 1);
  else if (e.key === 'ArrowLeft') clShow(clIndex - 1);
});
clShow(clIndex);

// ---- editing: each card's bullets can be added, changed and removed (plain text only). Saved on the server (live_docs/checklists.json).
const clCards = {};   // card key -> { el, ul, items: [text, ...], saveTimer }
clPages.filter(p => p.dataset.card !== 'sales').forEach(p => {   // (the Sales Checklist card is people, not bullets: sales-checklist.js)
  const ul = p.querySelector('ul');
  clCards[p.dataset.card] = { el: p, ul, items: [...ul.querySelectorAll('li')].map(li => li.textContent.trim()), saveTimer: null };
});

function clRenderView(card) {
  card.ul.innerHTML = '';
  card.items.forEach(t => { const li = document.createElement('li'); li.textContent = t; card.ul.appendChild(li); });
}

function clSave(key) {
  const card = clCards[key];
  clearTimeout(card.saveTimer);
  card.saveTimer = setTimeout(() => {
    fetch('/api/checklists', { method: 'POST', body: JSON.stringify({ [key]: card.items.filter(t => t.trim()) }), keepalive: true }).catch(() => {});
  }, 500);
}

function clFit(ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }

function clRenderEdit(key, focusIndex) {
  const card = clCards[key];
  card.ul.innerHTML = '';
  const sync = () => { card.items = [...card.ul.querySelectorAll('textarea')].map(t => t.value); clSave(key); };
  const addRow = (text, at) => {
    const li = document.createElement('li');
    li.className = 'cl-row';
    li.innerHTML = '<textarea rows="1" spellcheck="true"></textarea><button title="Remove this bullet">✕</button>';
    const ta = li.querySelector('textarea');
    ta.value = text;
    ta.addEventListener('input', () => { clFit(ta); sync(); });
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {            // Enter: a new bullet under this one
        e.preventDefault();
        const row = addRow('', li.nextSibling);
        row.querySelector('textarea').focus();
        sync();
      } else if (e.key === 'Backspace' && !ta.value && card.ul.querySelectorAll('.cl-row').length > 1) {   // Backspace on an empty bullet removes it
        e.preventDefault();
        const prev = li.previousSibling && li.previousSibling.querySelector ? li.previousSibling.querySelector('textarea') : null;
        li.remove(); sync();
        if (prev) { prev.focus(); prev.setSelectionRange(prev.value.length, prev.value.length); }
      }
    });
    li.querySelector('button').onclick = () => { li.remove(); sync(); };
    card.ul.insertBefore(li, at || card.ul.querySelector('.cl-addrow'));
    clFit(ta);
    return li;
  };
  const addLi = document.createElement('li');
  addLi.className = 'cl-addrow';
  addLi.style.listStyle = 'none';
  addLi.innerHTML = '<button class="ctl cl-add">+ Add bullet</button>';
  card.ul.appendChild(addLi);
  card.items.forEach(t => addRow(t));
  addLi.querySelector('button').onclick = () => { const row = addRow(''); row.querySelector('textarea').focus(); sync(); };
  card.ul.querySelectorAll('textarea').forEach(clFit);
  if (focusIndex != null) { const t = card.ul.querySelectorAll('textarea')[focusIndex]; if (t) t.focus(); }
}

Object.entries(clCards).forEach(([key, card]) => {
  card.el.querySelector('.cl-edit').onclick = (e) => {
    const editing = card.el.classList.toggle('editing');
    e.currentTarget.textContent = editing ? '✓ Done' : '✎ Edit';
    if (editing) { clRenderEdit(key); }
    else { card.items = card.items.map(t => t.trim()).filter(Boolean); clRenderView(card); clSave(key); }
  };
});

csJSON('/api/checklists').then(saved => {   // lists you edited before replace the built-in ones
  Object.entries(saved).forEach(([key, items]) => {
    if (clCards[key] && Array.isArray(items)) { clCards[key].items = items; if (!clCards[key].el.classList.contains('editing')) clRenderView(clCards[key]); }
  });
}).catch(() => { /* offline: the built-in lists stay */ });

// ---- two-finger swipe on the trackpad turns the page: swipe left = next, swipe right = back (one page per swipe)
// A horizontal two-finger swipe arrives as wheel events with deltaX. They're added up until they pass a threshold, then nothing more
// happens until the swipe ends (no wheel events for 300 ms), so one swipe = one page. preventDefault stops the browser's own
// "swipe = back / forward a web page" from kicking in here.
(() => {
  const view = document.getElementById('precall-view');
  let sum = 0, locked = false, quiet = null;
  view.addEventListener('wheel', (e) => {
    if (view.style.display === 'none' || e.ctrlKey) return;            // (ctrl+wheel = pinch zoom: leave it alone)
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;              // mostly up/down: normal scrolling
    if (e.target.closest('textarea, input, [contenteditable="true"]')) return;
    e.preventDefault();
    clearTimeout(quiet); quiet = setTimeout(() => { sum = 0; locked = false; }, 300);
    if (locked) return;
    sum += e.deltaX;
    if (Math.abs(sum) < 60) return;
    const step = sum > 0 ? 1 : -1;
    locked = true; sum = 0;
    const before = clIndex;
    clShow(clIndex + step);
    if (clIndex !== before) {
      const page = clPages[clIndex];
      page.classList.remove('cl-swipe-next', 'cl-swipe-prev'); void page.offsetWidth;
      page.classList.add(step > 0 ? 'cl-swipe-next' : 'cl-swipe-prev');
    }
  }, { passive: false });
})();
