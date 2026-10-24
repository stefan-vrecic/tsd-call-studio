// live-notes.js -- the Notes panel of the Live Call tab: an editable pad that saves itself to the server (live_docs/notes.txt).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const liveNotesBox = document.getElementById('live-notes');
const liveNotesText = document.getElementById('live-notes-text');
const liveNotesStatus = document.getElementById('live-notes-status');
let liveNotesLoaded = false, liveNotesTimer = null, liveNotesDirty = false;
let lnEl = liveNotesText;   // the box being typed in: this pad, or the pop-out window's
let lnPopup = null;         // the pop-out window while there is one
let lnLast = '';            // the latest text typed there (so closing the window can't lose it)

// the status line lives on the pad and, while it is open, in the pop-out window too
function lnStatus(text) {
  liveNotesStatus.textContent = text;
  if (lnPopup && !lnPopup.closed) { const el = lnPopup.document.getElementById('ln-pop-status'); if (el) el.textContent = text; }
}

async function liveNotesSave() {
  clearTimeout(liveNotesTimer);
  if (!liveNotesDirty) return;
  lnStatus('Saving…');
  const text = lnEl.value;
  try {
    const res = await fetch('/api/live-notes', { method: 'POST', body: text, keepalive: true });
    if (!res.ok) throw new Error('save failed');
    if (lnEl.value === text) liveNotesDirty = false;
    lnStatus('Saved ✓');
    liveStore('liveNotesBackup', '');
  } catch (e) {
    liveStore('liveNotesBackup', text); // the server isn't answering: keep a copy in this browser meanwhile
    lnStatus('⚠️ Not saved');
  }
}

async function liveNotesLoad() {
  if (liveNotesLoaded) return;
  liveNotesLoaded = true;
  try { liveNotesText.value = (await csJSON('/api/live-notes')).text || ''; } catch (e) { /* offline: start empty */ }
  const backup = liveStore('liveNotesBackup');
  if (backup && backup !== liveNotesText.value) { liveNotesText.value = backup; liveNotesDirty = true; liveNotesSave(); } // unsaved text from an earlier moment
}

function lnBindEditor(box) {
  box.addEventListener('input', () => {
    lnLast = box.value;
    liveNotesDirty = true;
    lnStatus('Typing…');
    clearTimeout(liveNotesTimer);
    liveNotesTimer = setTimeout(liveNotesSave, 700);
  });
  box.addEventListener('keydown', (e) => e.stopPropagation()); // the page's own shortcuts must not fire while typing
  box.addEventListener('blur', liveNotesSave);
}
lnBindEditor(liveNotesText);

// ⧉ pop the notes out into their own window (handy on a second screen). The pad here shows the same text, read-only, until it closes.
function liveNotesPopOut() {
  if (lnPopup && !lnPopup.closed) { lnPopup.focus(); return; }
  const w = window.open('', 'live-notes-window', 'popup=yes,width=520,height=760');
  if (!w) { alert('Your browser blocked the pop-up window. Allow pop-ups for Call Studio and try again.'); return; }
  w.document.open();
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Call notes</title>
<style>
  html, body { height: 100%; margin: 0; }
  body { display: flex; flex-direction: column; font: 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fff; color: #1f2430; }
  #h { display: flex; align-items: center; gap: 10px; padding: 8px 14px; border-bottom: 1px solid #dde1e8; }
  #h b { flex: 1; }
  #ln-pop-status { font-size: 11px; color: #667; }
  button { font: inherit; padding: 4px 10px; border: 1px solid #ccd1da; border-radius: 6px; background: #fff; cursor: pointer; }
  textarea { flex: 1; border: 0; outline: none; resize: none; padding: 16px 20px; font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  @media (prefers-color-scheme: dark) { body, textarea, button { background: #1b1e26; color: #e8eaf0; } #h { border-color: #343947; } button { border-color: #3b4150; } }
</style>
<div id="h"><b>📝 Notes</b><span id="ln-pop-status"></span><button id="ln-pop-copy">Copy</button></div>
<textarea id="ln-pop-text" spellcheck="true" placeholder="Notes for this call… (saved automatically)"></textarea>`);
  w.document.close();
  lnPopup = w;
  w.addEventListener('pagehide', () => { liveNotesDirty = true; liveNotesSave(); });     // closing the window saves first
  const box = w.document.getElementById('ln-pop-text');
  box.value = liveNotesText.value;                  // carry on with what is already written
  lnLast = box.value;
  lnBindEditor(box);
  box.addEventListener('input', () => { liveNotesText.value = box.value; });          // keep the pad here showing the same text
  w.document.getElementById('ln-pop-copy').onclick = async (e) => {
    const b = e.currentTarget, was = b.textContent;
    try { await w.navigator.clipboard.writeText(box.value); b.textContent = 'Copied ✓'; } catch (err) { b.textContent = 'Failed'; }
    setTimeout(() => { b.textContent = was; }, 1200);
  };
  lnEl = box;
  liveNotesText.readOnly = true;
  liveNotesText.placeholder = 'The notes are open in their own window…';
  document.getElementById('live-notes-pop').classList.add('active');
  box.focus();
  const watch = setInterval(() => {
    if (!lnPopup || lnPopup.closed) {               // window closed: the notes come back to the pad (after a last save)
      clearInterval(watch);
      lnEl = liveNotesText;
      liveNotesText.value = lnLast;
      liveNotesText.readOnly = false;
      liveNotesText.placeholder = 'Notes for this call… (saved automatically)';
      lnPopup = null;
      document.getElementById('live-notes-pop').classList.remove('active');
      liveNotesDirty = true;
      liveNotesSave();
    }
  }, 500);
}
document.getElementById('live-notes-pop').onclick = liveNotesPopOut;
document.addEventListener('visibilitychange', () => { if (document.hidden) liveNotesSave(); });
window.addEventListener('pagehide', liveNotesSave);
document.getElementById('live-notes-copy').onclick = async (e) => {
  const b = e.currentTarget, was = b.textContent;
  try { await navigator.clipboard.writeText(lnEl.value); b.textContent = '✅ Copied'; } catch (err) { b.textContent = '⚠️ Failed'; }
  setTimeout(() => { b.textContent = was; }, 1200);
};
document.getElementById('live-notes-clear').onclick = () => {
  if (!liveNotesText.value.trim() || confirm('Clear all the notes? This starts a fresh page.')) {
    liveNotesText.value = '';
    if (lnEl !== liveNotesText) { lnEl.value = ''; lnLast = ''; }
    liveNotesDirty = true;
    liveNotesSave();
  }
};
