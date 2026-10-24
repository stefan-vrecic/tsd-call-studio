// content-ideas.js -- the Content tab's "Brainstorm" pad (right, free text). It saves itself to the server (live_docs/content-notes.json) a moment after you stop typing.
// The "Content ideas" list on the left is not text any more: each idea is an item with its own notepad, see content-items.js. The old bullet text still sits in
// content-notes.json as "ideas" (content-items.js turns it into items once); this file keeps writing it back unchanged so nothing is lost.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const ciView = document.getElementById('content-view');
const ciBrain = { box: document.getElementById('ci-brainstorm'), status: document.getElementById('ci-status-brainstorm') };
let ciLoaded = false, ciDirty = false, ciTimer = null, ciOldIdeasText = '';

const ciValues = () => ({ ideas: ciOldIdeasText, brainstorm: ciBrain.box.value });
const ciStatus = (text) => { ciBrain.status.textContent = text; };

async function ciSave() {
  clearTimeout(ciTimer);
  if (!ciDirty) return;
  ciStatus('Saving…');
  try {
    const res = await fetch('/api/content-notes', { method: 'POST', body: JSON.stringify(ciValues()), keepalive: true });
    if (!res.ok) throw new Error('save failed');
    ciDirty = false;
    ciStatus('Saved ✓');
    liveStore('contentNotesBackup', '');
  } catch (e) {
    liveStore('contentNotesBackup', JSON.stringify(ciValues()));   // the server isn't answering: keep a copy in this browser meanwhile
    ciStatus('⚠️ Not saved');
  }
}

async function ciLoad() {
  if (ciLoaded) return;
  ciLoaded = true;
  try {
    const data = await csJSON('/api/content-notes');
    ciOldIdeasText = data.ideas || '';
    ciBrain.box.value = data.brainstorm || '';
  } catch (e) { /* offline: start empty */ }
  const backup = liveStore('contentNotesBackup');
  if (backup) {
    try {
      const b = JSON.parse(backup);
      if (b.brainstorm !== ciBrain.box.value) { ciBrain.box.value = b.brainstorm || ''; ciDirty = true; ciSave(); }
    } catch (e) { /* bad backup: ignore */ }
  }
}

ciBrain.box.addEventListener('input', () => { ciDirty = true; ciStatus('Typing…'); clearTimeout(ciTimer); ciTimer = setTimeout(ciSave, 700); });
ciBrain.box.addEventListener('keydown', (e) => e.stopPropagation());   // the page's own shortcuts must not fire while typing
ciBrain.box.addEventListener('blur', ciSave);

// load when the tab is shown (also when the page reopens straight on it)
new MutationObserver(() => { if (ciView.style.display !== 'none') ciLoad(); }).observe(ciView, { attributes: true, attributeFilter: ['style'] });
if (ciView.style.display !== 'none') ciLoad();

const ciBrainFile = document.getElementById('ci-brain-file'), ciBrainGrid = document.getElementById('ci-brain-grid');
async function ciLoadImages() {
  try { const data = await csJSON('/api/brainstorm-images'); ciBrainGrid.innerHTML = data.items.map(item => `<a href="${item.url}" target="_blank" title="${item.name}"><img src="${item.url}" alt="${item.name}"></a>`).join(''); } catch (e) { /* optional image tray */ }
}
async function ciUploadImages(files) {
  for (const file of files.filter(f => f.type.startsWith('image/'))) await fetch('/api/brainstorm-image', { method: 'POST', body: file, headers: { 'Content-Type': file.type, 'X-Filename': encodeURIComponent(file.name || 'screenshot.png') } });
  ciLoadImages();
}
document.getElementById('ci-brain-add').onclick = () => ciBrainFile.click();
ciBrainFile.onchange = () => { ciUploadImages([...ciBrainFile.files]); ciBrainFile.value = ''; };
ciBrain.box.closest('.ci-col').addEventListener('dragover', e => { if ([...e.dataTransfer.files].some(f => f.type.startsWith('image/'))) e.preventDefault(); });
ciBrain.box.closest('.ci-col').addEventListener('drop', e => { const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/')); if (files.length) { e.preventDefault(); ciUploadImages(files); } });
document.addEventListener('paste', e => { if (!ciView || ciView.style.display === 'none') return; const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/')); if (files.length && (document.activeElement === ciBrain.box || document.activeElement === document.body)) { e.preventDefault(); ciUploadImages(files); } });
ciLoadImages();
