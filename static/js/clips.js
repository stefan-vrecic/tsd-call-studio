// clips.js -- the clip basket: collect A-B sections from any calls, then export them as solo mp3s
// and/or ONE chaptered audiobook (each clip = a chapter named after its title).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.
// Loaded before search.js / main.js, which call addClip() and initClips().

let clipBasket = [];   // [{id, person, a, b, title, section}] in export order; saved on the server (clips.json)
let clipsSaveTimer = null;

const clipsOverlay = document.getElementById('clips-overlay');
const clipsList = document.getElementById('clips-list');
const clipsStatus = document.getElementById('clips-status');
const clipsGo = document.getElementById('clips-go');
const clipsBookTitle = document.getElementById('clips-book-title');
const clipsOptBook = document.getElementById('clips-opt-book');
const clipsOptSolo = document.getElementById('clips-opt-solo');
const clipsOptDrive = document.getElementById('clips-opt-drive');
let clipsExporting = false;

function clipSaveSoon() {
  clearTimeout(clipsSaveTimer);
  clipsSaveTimer = setTimeout(() => {
    fetch('/api/clips', { method: 'POST', body: JSON.stringify({ clips: clipBasket }) }).catch(() => {});
  }, 400);
}

function updateClipButtons() {
  document.querySelectorAll('.clips-btn').forEach(b => { b.textContent = `🎞 Clips (${clipBasket.length})`; });
}

// Adds a section to the basket. Returns false if the very same section (same call, same A/B) is already there.
function addClip({ person, section, a, b }) {
  if (clipBasket.some(c => c.person === person && Math.abs(c.a - a) < 0.05 && Math.abs(c.b - b) < 0.05)) return false;
  clipBasket.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    person, a, b, section: section || 'Section',
    title: `${section || 'Section'}–${displayName(person)}`, // same default as the single-section export
  });
  updateClipButtons();
  clipSaveSoon();
  return true;
}

// Shared by every "➕ Add to clips" button: adds, flashes the result on the button itself.
function addClipFromButton(btn, clip) {
  const original = btn.dataset.label || (btn.dataset.label = btn.textContent);
  const added = addClip(clip);
  btn.textContent = added ? `✅ Added (${clipBasket.length})` : 'Already in clips';
  setTimeout(() => { btn.textContent = original; }, 1800);
}

// ---- preview: one shared audio element, plays a clip from A and stops at B
const clipPreview = new Audio();
let clipPreviewId = null;
clipPreview.addEventListener('timeupdate', () => {
  const c = clipBasket.find(x => x.id === clipPreviewId);
  if (c && clipPreview.currentTime >= c.b) stopClipPreview();
});
function stopClipPreview() {
  clipPreview.pause();
  clipPreviewId = null;
  clipsList.querySelectorAll('.clip-play').forEach(b => { b.textContent = '▶'; });
}
function playClipPreview(c, btn) {
  if (clipPreviewId === c.id) { stopClipPreview(); return; }
  stopClipPreview();
  clipPreviewId = c.id;
  btn.textContent = '■';
  clipPreview.src = '/media/' + encodeURIComponent(c.person);
  clipPreview.addEventListener('loadedmetadata', () => { clipPreview.currentTime = c.a; clipPreview.play().catch(() => {}); }, { once: true });
}

// ---- the dialog
function clipSeconds(c) { return Math.max(0, c.b - c.a); }
function fmtClipLen(s) { return fmt(Math.round(s)); }

function renderClips() {
  clipsList.innerHTML = '';
  if (!clipBasket.length) {
    clipsList.innerHTML = '<div class="clips-empty">No clips yet. Use <b>➕ Add to clips</b> on the player (for the A–B part) or on any search result.</div>';
  }
  clipBasket.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'clip-row';
    row.draggable = false;
    row.dataset.id = c.id;
    row.innerHTML = `
      <span class="clip-grip" title="Drag to reorder">⠿</span>
      <span class="clip-num">${i + 1}</span>
      <div class="clip-main">
        <input type="text" class="clip-title" autocomplete="off">
        <div class="clip-meta">${escapeHtml(displayName(c.person))} · ${fmtPrecise(c.a)}–${fmtPrecise(c.b)} · ${fmtClipLen(clipSeconds(c))}</div>
      </div>
      <button class="clip-btn clip-play" title="Play this clip">▶</button>
      <button class="clip-btn" data-act="up" title="Move up">▲</button>
      <button class="clip-btn" data-act="down" title="Move down">▼</button>
      <button class="clip-btn" data-act="remove" title="Remove from clips">✕</button>`;
    const input = row.querySelector('.clip-title');
    input.value = c.title;
    input.oninput = () => { c.title = input.value; clipSaveSoon(); };
    row.querySelector('.clip-play').onclick = (e) => playClipPreview(c, e.currentTarget);
    row.querySelector('[data-act="up"]').onclick = () => moveClip(i, i - 1);
    row.querySelector('[data-act="down"]').onclick = () => moveClip(i, i + 1);
    row.querySelector('[data-act="remove"]').onclick = () => { stopClipPreview(); clipBasket.splice(i, 1); clipsChanged(); };
    // drag to reorder: only the grip starts a drag, so the title box stays selectable
    const grip = row.querySelector('.clip-grip');
    grip.onmousedown = () => { row.draggable = true; };
    row.addEventListener('dragend', () => { row.draggable = false; row.classList.remove('dragging'); });
    row.addEventListener('dragstart', (e) => { row.classList.add('dragging'); e.dataTransfer.setData('text/plain', String(i)); e.dataTransfer.effectAllowed = 'move'; });
    row.addEventListener('dragover', (e) => { e.preventDefault(); row.classList.add('drop-target'); });
    row.addEventListener('dragleave', () => row.classList.remove('drop-target'));
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.classList.remove('drop-target');
      const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (!isNaN(from)) moveClip(from, i);
    });
    clipsList.appendChild(row);
  });
  const total = clipBasket.reduce((t, c) => t + clipSeconds(c), 0);
  document.getElementById('clips-total').textContent = clipBasket.length
    ? `${clipBasket.length} clip${clipBasket.length === 1 ? '' : 's'} · ${fmtClipLen(total)}` : '';
  document.getElementById('clips-clear').disabled = !clipBasket.length;
  refreshClipsOptions();
}

function moveClip(from, to) {
  if (to < 0 || to >= clipBasket.length || from === to) return;
  const [c] = clipBasket.splice(from, 1);
  clipBasket.splice(to, 0, c);
  clipsChanged();
}
function clipsChanged() { updateClipButtons(); clipSaveSoon(); renderClips(); }

function refreshClipsOptions() {
  document.getElementById('clips-drive-row').style.display = clipsOptBook.checked ? '' : 'none';
  clipsGo.disabled = clipsExporting || !clipBasket.length || !(clipsOptBook.checked || clipsOptSolo.checked);
}
clipsOptBook.onchange = clipsOptSolo.onchange = refreshClipsOptions;

function openClipsDialog() {
  if (!clipsExporting) clipsStatus.textContent = '';
  clipsStatus.className = '';
  if (!clipsBookTitle.value) clipsBookTitle.value = 'Clips ' + new Date().toISOString().slice(0, 10);
  renderClips();
  clipsOverlay.style.display = 'flex';
}
function closeClipsDialog() { stopClipPreview(); clipsOverlay.style.display = 'none'; }

async function runClipsExport() {
  if (clipsExporting || !clipBasket.length) return;
  stopClipPreview();
  clipsExporting = true;
  clipsGo.disabled = true;
  clipsStatus.className = '';
  clipsStatus.textContent = 'Starting…';
  const fmtEta = (s) => s == null ? '' : s >= 60 ? ` · ~${Math.ceil(s / 60)} min left` : ` · ~${Math.max(1, s)}s left`;
  try {
    const body = {
      clips: clipBasket.map(({ person, a, b, title }) => ({ person, a, b, title })),
      solo: clipsOptSolo.checked,
      audiobook: clipsOptBook.checked,
      drive: clipsOptBook.checked && clipsOptDrive.checked,
      zip: document.getElementById('clips-opt-zip').checked,
      title: clipsBookTitle.value,
    };
    const data = await csPost('/api/export-clips', body);
    const job = await csPollJob('/api/audiobook-progress?id=' + encodeURIComponent(data.jobId),
      (j) => { clipsStatus.textContent = `${j.message || 'Working…'} · ${Math.floor(j.percent)}%${fmtEta(j.eta_seconds)}`; });
    clipsStatus.className = 'ok';
    clipsStatus.textContent = '✅ Done. ' + (job.drivePath ? 'The audiobook is in your Drive folder (syncing). ' : '') + 'Saved in: ' + (job.zipPath || job.folder);
  } catch (e) {
    clipsStatus.className = 'err';
    clipsStatus.textContent = '⚠️ ' + String(e.message || e);
  }
  clipsExporting = false;
  refreshClipsOptions();
}

// The Clips buttons are right-click only (left-click does nothing, on purpose): right-click shows one "Open clips" item.
document.querySelectorAll('.clips-btn').forEach(b => {
  b.title = 'Right-click to open';
  b.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    csMenu(e, [{ text: '🎞 Open clips', onClick: openClipsDialog }]);
  });
});
document.getElementById('clips-close').onclick = closeClipsDialog;
document.getElementById('clips-clear').onclick = () => {
  if (!clipBasket.length || !confirm(`Remove all ${clipBasket.length} clips from the basket?`)) return;
  stopClipPreview();
  clipBasket = [];
  clipsChanged();
};
clipsGo.onclick = runClipsExport;
clipsOverlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); closeClipsDialog(); } });

async function initClips() {
  try {
    const res = await fetch('/api/clips');
    if (res.ok) clipBasket = await res.json();
  } catch (e) { /* offline server: start with an empty basket */ }
  updateClipButtons();
}
