// clip-paste.js -- "Paste clips": paste a message with times ("Minute 16:30-18:00 - Finance objection") and turn it into clips.
// The server reads the text (clip_text.py: a quick pattern reader, or AI for messy text); this file shows what it found for
// checking and editing, and only then adds the clips to the basket (clips.js).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const pasteOverlay = document.getElementById('paste-overlay');
const pasteText = document.getElementById('paste-text');
const pasteCall = document.getElementById('paste-call');
const pasteAi = document.getElementById('paste-ai');
const pasteStatus = document.getElementById('paste-status');
const pastePreview = document.getElementById('paste-preview');
const pasteAdd = document.getElementById('paste-add');
const pasteRead = document.getElementById('paste-read');
let pasteRows = []; // [{include, call, a, b, title, warn, assumed}] as shown in the preview

function openPasteDialog() {
  pasteCall.innerHTML = '';
  (people || []).slice().sort((x, y) => x.name < y.name ? 1 : -1).forEach(p => {
    const o = document.createElement('option');
    o.value = p.name;
    o.textContent = displayName(p.name);
    pasteCall.appendChild(o);
  });
  if (current) pasteCall.value = current.name;
  pasteStatus.textContent = '';
  pasteStatus.className = '';
  pastePreview.innerHTML = '';
  pasteRows = [];
  refreshPasteAdd();
  pasteOverlay.style.display = 'flex';
  pasteText.focus();
}
function closePasteDialog() { pasteOverlay.style.display = 'none'; }

const pasteSetAb = document.getElementById('paste-set-ab');

function refreshPasteAdd() {
  const n = pasteRows.filter(r => r.include).length;
  pasteAdd.textContent = n ? `Add ${n} clip${n === 1 ? '' : 's'}` : 'Add to clips';
  pasteAdd.disabled = !n;
  const usable = pasteRows.filter(r => r.include && r.call && r.valid !== false).length;
  pasteSetAb.disabled = !usable;
  pasteSetAb.textContent = usable ? `Set as ${pairLetters(0).join('–')}${usable > 1 ? ', ' + pairLetters(1).join('–') : ''}${usable > 2 ? '…' : ''} (${usable})` : 'Set as A–B, C–D…';
}

// Puts the ticked clips on the player's slider as A–B, C–D, E–F... instead of in the clip basket.
// Ranges belong to ONE call, so only the clips for one call are placed: the open call's if it has any
// ticked clips, otherwise the first ticked clip's call (that call is opened first). Clips for other
// calls are left in the preview and the dialog stays open to say so. Titles aren't kept: a range has none.
function setPastedAsRanges() {
  const usable = pasteRows.filter(r => r.include && r.call && r.valid !== false);
  if (!usable.length) return;
  const target = (current && usable.some(r => r.call === current.name)) ? current.name : usable[0].call;
  const rows = usable.filter(r => r.call === target).slice(0, AB_MAX_PAIRS);
  const notPlaced = usable.length - rows.length;
  const switched = !current || current.name !== target;
  if (switched) selectPerson(target); // clears the old ranges and starts loading this call's audio
  resetExtraRanges();
  rows.forEach((r, i) => {
    const known = abMain.duration();
    const b = known ? Math.min(r.b, known) : r.b; // an end past the recording just clips to its end
    if (i === 0) abMain.set(r.a, b);
    else { addExtraRange(); abExtras[abExtras.length - 1].ab.set(r.a, b); }
  });
  abMainAtDefault = false; // keep the loaded duration from putting A–B back to the whole call
  const startAtA = () => { media.currentTime = rows[0].a; };
  if (switched) media.addEventListener('loadedmetadata', startAtA, { once: true }); else startAtA();
  if (notPlaced) {
    pasteStatus.className = 'err';
    pasteStatus.textContent = `Placed ${rows.length} range${rows.length === 1 ? '' : 's'} on ${displayName(target)}. ${notPlaced} other clip${notPlaced === 1 ? ' is' : 's are'} for a different call or over the ${AB_MAX_PAIRS}-range limit, so not placed.`;
  } else {
    closePasteDialog();
  }
}

function renderPastePreview() {
  pastePreview.innerHTML = '';
  pasteRows.forEach((r, i) => {
    const row = document.createElement('div');
    row.className = 'pp-row';
    const callOptions = (people || []).slice().sort((x, y) => x.name < y.name ? 1 : -1)
      .map(p => `<option value="${escapeHtml(p.name)}"${p.name === r.call ? ' selected' : ''}>${escapeHtml(displayName(p.name))}</option>`).join('');
    row.innerHTML = `
      <input type="checkbox" class="pp-inc"${r.include ? ' checked' : ''} title="Add this clip">
      <select class="pp-call"><option value=""${r.call ? '' : ' selected'}>Pick a call…</option>${callOptions}</select>
      <input type="text" class="pp-time pp-a" value="${fmtPrecise(r.a)}" title="Start (m:ss)">
      <span>–</span>
      <input type="text" class="pp-time pp-b" value="${fmtPrecise(r.b)}" title="End (m:ss)">
      <input type="text" class="pp-title" value="${escapeHtml(r.title)}" placeholder="Title">
      ${r.warn ? `<div class="pp-warn">${escapeHtml(r.warn)}</div>` : ''}
      ${r.assumed ? '<div class="pp-note">Only a start time was given, so the end is set to 1 minute later. Change it if needed.</div>' : ''}`;
    const inc = row.querySelector('.pp-inc'), call = row.querySelector('.pp-call');
    const ia = row.querySelector('.pp-a'), ib = row.querySelector('.pp-b'), title = row.querySelector('.pp-title');
    const sync = () => {
      const a = parseClock(ia.value), b = parseClock(ib.value);
      ia.classList.toggle('invalid', isNaN(a));
      ib.classList.toggle('invalid', isNaN(b) || (!isNaN(a) && b <= a));
      r.a = isNaN(a) ? r.a : a; r.b = isNaN(b) ? r.b : b;
      r.valid = !isNaN(a) && !isNaN(b) && b > a;
      refreshPasteAdd();
    };
    r.valid = true;
    inc.onchange = () => { r.include = inc.checked; refreshPasteAdd(); };
    call.onchange = () => { r.call = call.value; };
    ia.oninput = ib.oninput = sync;
    title.oninput = () => { r.title = title.value; };
    pastePreview.appendChild(row);
  });
  refreshPasteAdd();
}

async function readPastedText(forceAi) {
  const text = pasteText.value;
  if (!text.trim()) { pasteStatus.className = 'err'; pasteStatus.textContent = 'Paste some text first.'; return; }
  if (forceAi) pasteAi.checked = true;
  pasteRead.disabled = true;
  pasteStatus.className = '';
  pasteStatus.textContent = pasteAi.checked ? 'Asking the AI… (about 10 seconds)' : 'Reading…';
  try {
    const res = await fetch('/api/parse-clips', { method: 'POST', body: JSON.stringify({ text, call: pasteCall.value, ai: pasteAi.checked }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'could not read that');
    pasteRows = data.clips.map(c => ({ include: !!c.call, call: c.call || '', a: c.start, b: c.end, title: c.title || '', warn: c.warn, assumed: c.assumed }));
    renderPastePreview();
    const found = pasteRows.length;
    pasteStatus.textContent = found ? `Found ${found} clip${found === 1 ? '' : 's'}. Check them, then add.` : 'No clips found in that text.';
    if (data.skipped && data.skipped.length) {
      const note = document.createElement('span');
      note.textContent = ` Couldn't read ${data.skipped.length} line${data.skipped.length === 1 ? '' : 's'}: “${data.skipped.slice(0, 2).join('” “').slice(0, 120)}”`;
      pasteStatus.appendChild(note);
      if (data.source === 'quick') {
        const b = document.createElement('button');
        b.className = 'ctl';
        b.textContent = 'Try with AI';
        b.onclick = () => readPastedText(true);
        pasteStatus.appendChild(b);
      }
    } else if (!found && data.source === 'quick') {
      const b = document.createElement('button');
      b.className = 'ctl';
      b.textContent = 'Try with AI';
      b.onclick = () => readPastedText(true);
      pasteStatus.appendChild(b);
    }
  } catch (e) {
    pasteStatus.className = 'err';
    pasteStatus.textContent = String(e.message || e);
  }
  pasteRead.disabled = false;
}

function addPastedClips() {
  let added = 0, dup = 0, skipped = 0;
  pasteRows.filter(r => r.include).forEach(r => {
    if (!r.call || !r.valid) { skipped++; return; }
    if (addClip({ person: r.call, section: r.title.trim() || 'Clip', a: r.a, b: r.b })) added++; else dup++;
  });
  pasteStatus.className = skipped ? 'err' : '';
  pasteStatus.textContent = `✅ Added ${added} clip${added === 1 ? '' : 's'} (${clipBasket.length} in your basket)` +
    (dup ? `, ${dup} already there` : '') + (skipped ? `, ${skipped} skipped: pick a call and check the times` : '');
  if (!skipped) { pasteRows = []; pastePreview.innerHTML = ''; refreshPasteAdd(); }
}

document.getElementById('ab-paste').onclick = openPasteDialog;
document.getElementById('clips-paste').onclick = openPasteDialog;
document.getElementById('paste-close').onclick = closePasteDialog;
pasteRead.onclick = () => readPastedText(false);
pasteAdd.onclick = addPastedClips;
pasteSetAb.onclick = setPastedAsRanges;
pasteOverlay.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closePasteDialog(); }
  else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && e.target === pasteText) { e.preventDefault(); readPastedText(false); }
});
