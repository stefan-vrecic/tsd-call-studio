// transcript.js -- the transcript panel: render, follow playback, up/down stepping, search within it.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

// The transcript panel has a native drag handle (CSS `resize: vertical`).
// Remember whatever size the reviewer drags it to, so switching between
// people doesn't keep snapping it back to the half-timeline-height default.
let userTranscriptHeight = null;
// Loom downloads (LOOM_…) have no sales-call timeline to read alongside, so the transcript is the main thing: it opens tall,
// and remembers its own dragged size separately from the calls' size.
let userLoomTranscriptHeight = null;
let transcriptIsLoom = false;
new ResizeObserver(() => {
  const h = document.getElementById('transcript-panel').offsetHeight;
  if (h > 0) { if (transcriptIsLoom) userLoomTranscriptHeight = h; else userTranscriptHeight = h; }
}).observe(document.getElementById('transcript-panel'));

// Copying a selection from the transcript leaves out the timestamps: just the words (and the speaker, if there is one), as one line
document.addEventListener('copy', (e) => {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || sel.isCollapsed) return;
  const range = sel.getRangeAt(0), panel = document.getElementById('transcript-panel');
  if (!panel || !panel.contains(range.commonAncestorContainer)) return;
  const frag = range.cloneContents();
  if (!frag.querySelector('.ts')) return;                                   // nothing with a timestamp in it: copy normally
  frag.querySelectorAll('.ts').forEach(t => t.remove());
  const rows = [...frag.querySelectorAll('.transcript-line')];
  const text = (rows.length ? rows.map(r => r.textContent.replace(/\s+/g, ' ').trim()) : [frag.textContent.replace(/\s+/g, ' ').trim()]).filter(Boolean).join(' ');   // one line: the rows are just where the transcriber broke the sentence
  e.clipboardData.setData('text/plain', text);
  e.preventDefault();
});

function makeTranscriptLine(b) {
  const div = document.createElement('div');
  div.className = 'transcript-line';
  div.dataset.start = b.start;
  div.dataset.end = b.end;
  div.dataset.rawText = b.text;
  const speakerHtml = b.speaker ? `<span class="speaker">${escapeHtml(b.speaker)}:</span>` : '';
  div.innerHTML = `<span class="ts">${fmt(b.start)}</span>${speakerHtml}<span class="line-text">${escapeHtml(b.text)}</span>`;
  div.onclick = () => { media.currentTime = b.start; media.play(); };
  div.oncontextmenu = (e) => {
    e.preventDefault();
    const on = trFlagged().some(f => Math.abs(f.start - b.start) < 0.01);
    csMenu(e, [{ heading: fmt(b.start) },
      { text: on ? 'Remove flag' : '🚩 Flag / bookmark this line', onClick: () => trToggleFlag(b) },
      { text: 'Copy line', onClick: () => navigator.clipboard.writeText(b.text.trim()).then(() => csToast('Copied')) }]);
  };
  return div;
}

// --- flags: right-click a line -> 🚩, kept per call on the server (records "transcript-flags") ---
let trFlags = null;   // {calls: {name: [{start, text, at}]}}
let trFlagPos = -1;
async function trLoadFlags() {
  if (trFlags) return trFlags;
  try { trFlags = await csJSON('/api/records?name=transcript-flags'); } catch (e) { trFlags = null; return { calls: {} }; }
  if (!trFlags.calls) trFlags.calls = {};
  return trFlags;
}
const trFlagged = () => (current && trFlags && trFlags.calls[current.name]) || [];
function trShowFlags() {
  const list = trFlagged(), btn = document.getElementById('transcript-flag-next');
  document.querySelectorAll('#transcript-panel .transcript-line').forEach(el => el.classList.toggle('flagged', list.some(f => Math.abs(f.start - +el.dataset.start) < 0.01)));
  btn.style.display = list.length ? '' : 'none';
  btn.textContent = `🚩 ${list.length}`;
}
async function trToggleFlag(b) {
  if (!current) return;
  const name = current.name, d = await trLoadFlags(), list = d.calls[name] || [];
  const i = list.findIndex(f => Math.abs(f.start - b.start) < 0.01);
  if (i >= 0) list.splice(i, 1); else list.push({ start: b.start, text: b.text.trim().slice(0, 300), at: new Date().toISOString() });
  list.sort((x, y) => x.start - y.start);
  if (list.length) d.calls[name] = list; else delete d.calls[name];
  trShowFlags();
  try { await csPost('/api/records?name=transcript-flags', d); csToast(i >= 0 ? 'Flag removed' : '🚩 Flagged'); }
  catch (e) { csToast('⚠️ Flag not saved'); }
}
document.getElementById('transcript-flag-next').onclick = () => {   // cycle through the flags
  const list = trFlagged();
  if (!list.length) return;
  const now = media.currentTime || 0, next = list.find(f => f.start > now + 0.5) || list[0];
  media.currentTime = next.start;
  scrollTranscriptTo(next.start);
};

// default height = half the timeline table's own rendered height (varies call to call), unless the reviewer has manually dragged the
// panel's resize handle already -- then keep using their chosen size instead. Loom items open tall.
function applyTranscriptHeight(p, panel) {
  transcriptIsLoom = isLoomName(p.name);
  if (transcriptIsLoom) {
    panel.style.height = (userLoomTranscriptHeight || Math.round(window.innerHeight * 0.72)) + 'px';
  } else if (userTranscriptHeight) {
    panel.style.height = userTranscriptHeight + 'px';
  } else {
    const timelineHeight = document.getElementById('timeline').offsetHeight;
    panel.style.height = Math.max(120, timelineHeight / 2) + 'px';
  }
}

// ---- a call that is still being transcribed: its lines appear as whisper produces them (about every 30 s of audio), instead of
// nothing until the transcript is finished. The page asks /api/transcript-live for just the new lines every 2 s.
let liveTranscriptTimer = null;
function stopLiveTranscript() { clearInterval(liveTranscriptTimer); liveTranscriptTimer = null; }

function startLiveTranscript(p, heading, panel, searchBar) {
  let count = 0, quietPolls = 0;
  const started = Date.now();
  panel.innerHTML = '';
  heading.style.display = 'block';
  panel.style.display = 'block';
  searchBar.style.display = 'flex';
  applyTranscriptHeight(p, panel);
  const tick = async () => {
    if (!current || current.name !== p.name || Date.now() - started > 3 * 3600 * 1000) { stopLiveTranscript(); return; }
    let data;
    try { data = await csJSON(`/api/transcript-live?person=${encodeURIComponent(p.name)}&since=${count}`); } catch (e) { return; }
    if (!current || current.name !== p.name) return;
    if (data.blocks.length) {
      const nearBottom = panel.scrollHeight - panel.scrollTop - panel.clientHeight < 80;   // following the end unless you scrolled up
      data.blocks.forEach(b => panel.appendChild(makeTranscriptLine(b)));
      count = data.total;
      if (nearBottom) panel.scrollTop = panel.scrollHeight;
    }
    // not live any more and we got lines = whisper is done; the finished transcript replaces this when the page notices (stage change)
    if (!data.live && count > 0 && ++quietPolls >= 3) stopLiveTranscript();
  };
  stopLiveTranscript();
  liveTranscriptTimer = setInterval(tick, 2000);
  tick();
}

async function loadTranscriptPanel(p) {
  const heading = document.getElementById('transcript-heading');
  const panel = document.getElementById('transcript-panel');
  const searchBar = document.getElementById('transcript-search-bar');
  resetTranscriptSearch();
  stopLiveTranscript();
  if (!p.has_transcript && p.status === 'transcribing') { startLiveTranscript(p, heading, panel, searchBar); return; }
  if (!p.has_transcript) {
    heading.style.display = 'none';
    panel.style.display = 'none';
    searchBar.style.display = 'none';
    panel.innerHTML = '';
    return;
  }
  let data;
  try {
    const res = await fetch('/api/transcript?person=' + encodeURIComponent(p.name));
    if (!res.ok) throw new Error('not ready');
    data = await res.json();
  } catch (e) {
    heading.style.display = 'none';
    panel.style.display = 'none';
    searchBar.style.display = 'none';
    return;
  }
  if (!current || current.name !== p.name) return; // user picked someone else while this was loading

  panel.innerHTML = '';
  data.blocks.forEach(b => panel.appendChild(makeTranscriptLine(b)));
  trLoadFlags().then(trShowFlags);
  heading.style.display = 'block';
  panel.style.display = 'block';
  searchBar.style.display = 'flex';
  applyTranscriptHeight(p, panel);
}

// Auto-follow during playback pauses for 24s after the reviewer manually
// scrolls the transcript themselves (e.g. to read ahead/back) -- otherwise
// it'd yank them back to the live position mid-read. Clicking a timeline
// row / transcript line / dragging the seek bar always jumps immediately
// though, regardless of this grace period -- those are deliberate seeks,
// not passive following.
let lastManualScrollAt = 0;
let programmaticTranscriptScroll = false;
let lastAutoScrolledLine = null;

document.getElementById('transcript-panel').addEventListener('scroll', () => {
  if (programmaticTranscriptScroll) return;
  lastManualScrollAt = Date.now();
});

function scrollTranscriptTo(seconds, opts = {}) {
  const lines = Array.from(document.querySelectorAll('#transcript-panel .transcript-line'));
  if (!lines.length) return;
  const target = lines.find(el => seconds < +el.dataset.end) || lines[lines.length - 1];
  if (opts.auto) {
    if (Date.now() - lastManualScrollAt < 24000) return; // reviewer scrolled recently, leave them be
    if (target === lastAutoScrolledLine) return; // already there, avoid redundant scroll churn
    lastAutoScrolledLine = target;
  }
  programmaticTranscriptScroll = true;
  target.scrollIntoView({ block: 'center', behavior: 'instant' });
  setTimeout(() => { programmaticTranscriptScroll = false; }, 50);
}

// Keyboard stepping: while the mouse is over the transcript, ↓ jumps two lines down
// and ↑ two lines up (same as clicking that line, but without
// reaching for the mouse). Only when the pointer is over the panel, so the
// arrow keys keep their normal job (page scroll, seek bar, typing) everywhere else.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' && t.type !== 'range' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  const panel = document.getElementById('transcript-panel');
  if (!panel || panel.style.display === 'none' || !panel.matches(':hover')) return;
  const lines = Array.from(panel.querySelectorAll('.transcript-line'));
  if (!lines.length) return;
  e.preventDefault();
  // current line = last one that has started (small epsilon: seeking to exactly
  // a line's start can land a hair before it, which would otherwise leave us
  // "on" the previous line and make ↓ appear stuck)
  let idx = -1;
  lines.forEach((el, i) => { if (+el.dataset.start <= media.currentTime + 0.05) idx = i; });
  const TRANSCRIPT_KEY_STEP = 2; // lines skipped per press
  const next = lines[Math.min(lines.length - 1, Math.max(0, idx + (e.key === 'ArrowDown' ? TRANSCRIPT_KEY_STEP : -TRANSCRIPT_KEY_STEP)))];
  media.currentTime = +next.dataset.start;
  scrollTranscriptTo(+next.dataset.start);
});

// ← / → on the Call Studio page: 10 seconds back / forward in the open call (also on the seek bar itself, instead of its tiny native
// steps). Not while typing, and not when an A–B handle has the focus (its arrows move the handle) or another page is on top.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' && t.type !== 'range' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (t && t.closest && t.closest('.ab-handle, [role="slider"]:not(#seek)')) return;
  if (document.getElementById('layout').style.display === 'none' || document.querySelector('.modern-content, #pc-slot, .cs-dialog-bg')) return;
  if (!media || !media.src || !Number.isFinite(media.duration)) return;
  e.preventDefault();
  media.currentTime = Math.max(0, Math.min(media.duration, media.currentTime + (e.key === 'ArrowRight' ? 10 : -10)));
});

// --- search within the currently-open transcript ---
let transcriptMatches = [];
let transcriptMatchIndex = -1;

function resetTranscriptSearch() {
  document.getElementById('transcript-search-input').value = '';
  transcriptMatches = [];
  transcriptMatchIndex = -1;
  document.getElementById('transcript-search-count').textContent = '';
  document.querySelectorAll('#transcript-panel .transcript-line').forEach(el => {
    el.classList.remove('current-match');
    const textSpan = el.querySelector('.line-text');
    if (textSpan) textSpan.innerHTML = escapeHtml(el.dataset.rawText || '');
  });
}

function runTranscriptSearch() {
  const query = document.getElementById('transcript-search-input').value.trim();
  const countEl = document.getElementById('transcript-search-count');
  const lines = Array.from(document.querySelectorAll('#transcript-panel .transcript-line'));
  transcriptMatches = [];
  transcriptMatchIndex = -1;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const queryRe = query ? new RegExp(escapedQuery, 'ig') : null;

  lines.forEach(el => {
    el.classList.remove('current-match');
    const raw = el.dataset.rawText || '';
    const textSpan = el.querySelector('.line-text');
    if (queryRe && raw.toLowerCase().includes(query.toLowerCase())) {
      transcriptMatches.push(el);
      if (textSpan) textSpan.innerHTML = escapeHtml(raw).replace(
        new RegExp(escapedQuery.replace(/\\(.)/g, '$1'), 'ig'),
        m => `<mark>${escapeHtml(m)}</mark>`
      );
    } else if (textSpan) {
      textSpan.innerHTML = escapeHtml(raw);
    }
  });

  if (!query) {
    countEl.textContent = '';
    return;
  }
  countEl.textContent = transcriptMatches.length ? `1/${transcriptMatches.length}` : '0/0';
  if (transcriptMatches.length) goToTranscriptMatch(0);
}

function goToTranscriptMatch(index) {
  if (!transcriptMatches.length) return;
  transcriptMatches.forEach(el => el.classList.remove('current-match'));
  transcriptMatchIndex = (index + transcriptMatches.length) % transcriptMatches.length;
  const el = transcriptMatches[transcriptMatchIndex];
  el.classList.add('current-match');
  el.scrollIntoView({ block: 'center', behavior: 'instant' });
  document.getElementById('transcript-search-count').textContent = `${transcriptMatchIndex + 1}/${transcriptMatches.length}`;
}

document.getElementById('transcript-search-input').addEventListener('input', runTranscriptSearch);
document.getElementById('transcript-search-input').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  if (e.shiftKey) goToTranscriptMatch(transcriptMatchIndex - 1);
  else goToTranscriptMatch(transcriptMatchIndex + 1);
});
document.getElementById('transcript-search-next').onclick = () => goToTranscriptMatch(transcriptMatchIndex + 1);
document.getElementById('transcript-search-prev').onclick = () => goToTranscriptMatch(transcriptMatchIndex - 1);
