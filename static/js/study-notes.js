// study-notes.js -- the "📝 Study notes" button in a call's toolbar: a notes dialog docked on the right, one set of notes per call.
// Saved on the server (live_docs/study_notes/<call>.txt) a moment after you stop typing. It can be minimised or closed, and it
// follows you as you switch calls (it shows the notes of whichever call is open).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const snPanel = document.getElementById('sn-panel');
const snText = document.getElementById('sn-text');
const snStatus = document.getElementById('sn-status');
const snCall = document.getElementById('sn-call');
let snEl = snText;         // the box being typed in: the docked panel's, or the pop-out window's
let snPopup = null;        // the pop-out window, while there is one
let snLast = '';            // the latest text typed (kept so a closing pop-out window can't lose it)
let snFor = null;          // the call whose notes are in the box
let snDirty = false, snTimer = null;

// the status / call label live in the docked panel, and in the pop-out window while it is open
function snSet(which, text) {
  (which === 'status' ? snStatus : snCall).textContent = text;
  if (snPopup && !snPopup.closed) { const el = snPopup.document.getElementById('sn-pop-' + which); if (el) el.textContent = text; }
}

async function snSave() {
  clearTimeout(snTimer);
  if (!snDirty || !snFor) return;
  const name = snFor, text = snEl.value;
  snSet('status', 'Saving…');
  try {
    const res = await fetch('/api/study-notes?person=' + encodeURIComponent(name), { method: 'POST', body: text, keepalive: true });
    if (!res.ok) throw new Error('save failed');
    if (snFor === name && snEl.value === text) snDirty = false;
    snSet('status', 'Saved ✓');
    liveStore('studyNotesBackup:' + name, '');
  } catch (e) {
    liveStore('studyNotesBackup:' + name, text);    // the server isn't answering: keep a copy in this browser meanwhile
    snSet('status', '⚠️ Not saved');
  }
}

// show the notes of the call that is open now (saving the previous call's first)
async function snLoadFor(name) {
  if (snFor === name) return;
  await snSave();
  snFor = name;
  snDirty = false;
  snEl.value = '';
  snSet('status', '');
  snSet('call', displayName(name));
  if (!name) return;
  try { snEl.value = (await csJSON('/api/study-notes?person=' + encodeURIComponent(name))).text || ''; } catch (e) { /* offline */ }
  const backup = liveStore('studyNotesBackup:' + name);
  if (backup && backup !== snEl.value) { snEl.value = backup; snDirty = true; snSave(); }
}

function snOpen(open) {
  snPanel.classList.toggle('open', open);
  liveStore('studyNotesOpen', open ? '1' : '0');
  document.getElementById('study-notes-btn').classList.toggle('active', open);
  if (open) { snLoadFor(current ? current.name : null); snText.focus(); } else snSave();
}

document.getElementById('study-notes-btn').onclick = () => { if (snPopup && !snPopup.closed) { snPopup.focus(); return; } snOpen(!snPanel.classList.contains('open')); };
document.getElementById('sn-close').onclick = () => snOpen(false);
document.getElementById('sn-min').onclick = () => {
  const min = snPanel.classList.toggle('min');
  document.getElementById('sn-min').textContent = min ? '+' : '–';
  liveStore('studyNotesMin', min ? '1' : '0');
};
function snBindEditor(box) {
  box.addEventListener('input', () => { snLast = box.value; snDirty = true; snSet('status', 'Typing…'); clearTimeout(snTimer); snTimer = setTimeout(snSave, 700); });
  box.addEventListener('keydown', (e) => e.stopPropagation());   // the page's own shortcuts must not fire while typing
  box.addEventListener('blur', snSave);
}
snBindEditor(snText);

// ⧉ pop the notes out into their own small window (it keeps following whichever call is open here)
function snPopOut() {
  if (snPopup && !snPopup.closed) { snPopup.focus(); return; }
  const w = window.open('', 'study-notes-window', 'popup=yes,width=440,height=620');
  if (!w) { alert('Your browser blocked the pop-up window. Allow pop-ups for Call Studio and try again.'); return; }
  w.document.open();
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Study notes</title>
<style>
  html, body { height: 100%; margin: 0; }
  body { display: flex; flex-direction: column; font: 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fff; color: #1f2430; }
  #h { display: flex; align-items: baseline; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #dde1e8; }
  #sn-pop-call { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #667; font-size: 12px; }
  #sn-pop-status { font-size: 11px; color: #667; }
  textarea { flex: 1; border: 0; outline: none; resize: none; padding: 14px; font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  @media (prefers-color-scheme: dark) { body, textarea { background: #1b1e26; color: #e8eaf0; } #h { border-color: #343947; } }
</style>
<div id="h"><b>📝 Study notes</b><span id="sn-pop-call"></span><span id="sn-pop-status"></span></div>
<textarea id="sn-pop-text" spellcheck="true" placeholder="What are you taking from this call?"></textarea>`);
  w.document.close();
  snPopup = w;
  w.addEventListener('pagehide', () => { snDirty = snDirty || snLast !== ''; snSave(); });   // closing the window saves first
  const box = w.document.getElementById('sn-pop-text');
  box.value = snEl.value;                 // carry on with what is already typed
  snLast = box.value;
  snBindEditor(box);
  snEl = box;
  snPanel.classList.remove('open');       // the docked panel steps aside while the window is open
  snSet('call', snCall.textContent);
  box.focus();
  const watch = setInterval(() => {
    if (!snPopup || snPopup.closed) {     // window closed: the notes go back to the docked panel (still closed) after a final save
      clearInterval(watch);
      snEl = snText;
      snText.value = snLast;
      snSave();
      snPopup = null;
      document.getElementById('study-notes-btn').classList.remove('active');
      liveStore('studyNotesOpen', '0');
    }
  }, 500);
}
document.getElementById('sn-pop').onclick = snPopOut;

// follow the open call (selectPerson changes `current`); a light check is enough
setInterval(() => { if ((snPanel.classList.contains('open') || (snPopup && !snPopup.closed)) && current && current.name !== snFor) snLoadFor(current.name); }, 600);

if (liveStore('studyNotesMin') === '1') { snPanel.classList.add('min'); document.getElementById('sn-min').textContent = '+'; }
if (liveStore('studyNotesOpen') === '1') setTimeout(() => snOpen(true), 800);   // reopen if it was open
