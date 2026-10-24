// day-plan.js -- the Today tab: today's calendar events (8am-midnight, sleep left out) as checkboxes, oldest first.
// Events already marked done (✅ / ✓ at the front of the title) show ticked; ticking one puts ✅ on the calendar event
// (through /api/day-tick), unticking takes the mark off again.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const dayList = document.getElementById('today-list');
const daySub = document.getElementById('today-sub');
let dayLoading = false;
let dayEvents = [];   // what's on screen, in order (rows point at it by index)
let dayOffset = 0;    // days from today shown (‹ › arrows); 0 = today

function dayDateStr(offset) {   // local YYYY-MM-DD, offset days from today
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dayTitle(offset) {
  if (offset === 0) return 'Today';
  if (offset === -1) return 'Yesterday';
  if (offset === 1) return 'Tomorrow';
  return new Date(dayDateStr(offset) + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long' });
}
function dayGo(offset) {
  dayOffset = offset;
  document.getElementById('day-title').textContent = dayTitle(offset);
  document.getElementById('day-today').style.display = offset === 0 ? 'none' : '';
  dayList.innerHTML = '';
  dayLoad();
  if (typeof alLoad === 'function') alLoad();   // the Aloware calls card follows the arrows too (aloware-today.js)
}

function daySay(text, isErr) { daySub.textContent = text; daySub.className = 'today-sub' + (isErr ? ' err' : ''); }

function dayRender(events, calls = []) {
  dayEvents = events;
  dayList.innerHTML = '';
  events.forEach((ev, i) => {
    const li = document.createElement('li');
    li.dataset.i = i;
    li.className = ev.checked ? 'done' : '';
    li.innerHTML = `<label><input type="checkbox"><span class="today-time"></span><span class="today-title"></span></label>`;
    const box = li.querySelector('input');
    box.checked = ev.checked;
    li.querySelector('.today-time').textContent = `${ev.start}–${ev.end}`;
    li.querySelector('.today-title').textContent = displayNamesInText(ev.label, calls.map(c => c.name));
    box.onchange = () => dayTick(ev, li, box);
    dayList.appendChild(li);
  });
  if (!events.length) daySay('Nothing on the calendar between 8am and midnight.');
}

async function dayTick(ev, li, box) {
  const want = box.checked;
  box.disabled = true;
  li.classList.add('busy');
  try {
    const res = await fetch(`/api/day-tick?id=${encodeURIComponent(ev.id)}&done=${want ? 1 : 0}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'calendar update failed');
    ev.checked = want;
    li.classList.toggle('done', want);
  } catch (e) {
    box.checked = !want;                 // the calendar didn't change, so put the box back
    daySay('⚠️ ' + String(e.message || e), true);
  }
  box.disabled = false;
  li.classList.remove('busy');
}

// ---- the calls card (under Body weight): that day's live Complimentary calls (cancelled ones left out), each with its Aloware
// link from the event description, and a tick when a matching recording is already in Call Studio (same name matching as
// the Follow up tab, followup-match.js).
let dayCallsShown = { calls: [], offset: 0 };
function dayCallsRender(calls, offset) {
  dayCallsShown = { calls, offset };
  const box = document.getElementById('today-calls');
  box.innerHTML = `<h3>${offset === 0 ? "Today's calls" : 'Calls · ' + dayTitle(offset)}</h3>`;
  if (!calls.length) { box.insertAdjacentHTML('beforeend', '<div class="tc-empty">No live calls booked.</div>'); return; }
  const done = calls.filter(c => fuMatchCalls({ name: c.name, start: c.start }).some(m => m.score >= 2)).length;
  box.insertAdjacentHTML('beforeend', `<div class="tc-sub">${done} of ${calls.length} in Call Studio</div>`);
  const ul = document.createElement('ul');
  ul.className = 'tc-list';
  calls.forEach(c => {
    const match = fuMatchCalls({ name: c.name, start: c.start }).find(m => m.score >= 2);
    const li = document.createElement('li');
    li.innerHTML = '<input type="checkbox" disabled><div class="tc-who"><div class="tc-name"></div><div class="tc-meta"></div></div>';
    li.querySelector('input').checked = !!match;
    li.querySelector('input').title = match ? 'Recording is in Call Studio' : 'Not run through Call Studio yet';
    li.querySelector('.tc-name').textContent = displayName(match ? match.name : c.name);
    const meta = li.querySelector('.tc-meta');
    meta.append(c.time + ' · ');
    if (c.aloware) { const a = document.createElement('a'); a.href = c.aloware; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Aloware ↗'; meta.appendChild(a); }
    else meta.append('no Aloware link');
    if (match) {
      const a = document.createElement('a');
      a.href = '/' + encodeURIComponent(match.name); a.className = 'tc-call'; a.textContent = '🎧'; a.title = 'Open ' + match.name;
      a.onclick = (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); fuOpenCall(match.name); };
      meta.append(' ', a);
    }
    if (match) li.classList.add('done');
    ul.appendChild(li);
  });
  box.appendChild(ul);
}

async function dayLoad() {
  if (dayLoading) return;
  dayLoading = true;
  const offset = dayOffset;
  daySay('Reading your calendar…');
  try {
    const res = await fetch('/api/day-events' + (offset ? '?date=' + dayDateStr(offset) : ''));
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'could not read the calendar');
    const d = new Date(data.date + 'T12:00:00');
    daySay(d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) + ' · 8am to midnight');
    dayRender(data.events, data.calls || []);
    if (offset === 0) trackerRender(data.tracker, data.date);
    dayCallsRender(data.calls || [], offset);   // the stats card beside the list (tracker-stats.js) -- always today's, even when the arrows show another day
  } catch (e) {
    dayList.innerHTML = '';
    daySay('⚠️ ' + String(e.message || e), true);
  }
  dayLoading = false;
  if (offset !== dayOffset) dayLoad();   // the arrows were clicked while this one was loading
}
document.getElementById('day-prev').onclick = () => dayGo(dayOffset - 1);
document.getElementById('day-next').onclick = () => dayGo(dayOffset + 1);
document.getElementById('day-today').onclick = () => dayGo(0);

// ---- right-click a Complimentary call -> "Add note": a banana note event one hour from the call's start (title n-<text>)
const noteOverlay = document.getElementById('note-overlay');
const noteText = document.getElementById('note-text');
const noteStatus = document.getElementById('note-status');
const noteSave = document.getElementById('note-save');
let noteFor = null;   // the call event the note is for

// ---- right-click the time -> edit it in place (two time boxes; Enter or ✓ saves, Esc or ✕ cancels). Moves the calendar event.
// "10:42", "1042", "10.42", "9:05", "9" -> "HH:MM" (24-hour); anything else -> null
function dayParseTime(text) {
  const m = String(text).trim().match(/^(\d{1,2})(?:[:.h ]?(\d{2}))?$/);
  if (!m) return null;
  const h = +m[1], min = m[2] ? +m[2] : 0;
  if (h > 23 || min > 59) return null;
  return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
}

function dayEditTime(ev, li) {
  const span = li.querySelector('.today-time');
  if (span.querySelector('input')) return;
  const label = li.querySelector('label');
  label.htmlFor = '';
  span.innerHTML = '<input type="text" class="tt-start" inputmode="numeric" placeholder="HH:MM" maxlength="7"> – <input type="text" class="tt-end" inputmode="numeric" placeholder="HH:MM" maxlength="7"> <button class="tt-ok" title="Save">✓</button><button class="tt-no" title="Cancel">✕</button>';
  span.classList.add('editing');
  const [a, b] = span.querySelectorAll('input');
  a.value = ev.start; b.value = ev.end;
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  span.addEventListener('click', stop);   // clicks in the editor mustn't tick the box
  const cancel = () => { span.removeEventListener('click', stop); span.classList.remove('editing'); span.textContent = `${ev.start}–${ev.end}`; };
  const save = async () => {
    const start = dayParseTime(a.value), end = dayParseTime(b.value);
    if (!start || !end) { daySay('⚠️ Type the times as 24-hour HH:MM, e.g. 10:42 or 14:30.', true); (start ? b : a).focus(); return; }
    if (start === ev.start && end === ev.end) { cancel(); return; }
    span.classList.add('busy');
    try {
      const res = await fetch('/api/day-time', { method: 'POST', body: JSON.stringify({ id: ev.id, date: ev.startIso.slice(0, 10), start, end }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'calendar update failed');
      ev.start = data.start; ev.end = data.end;
      daySay(new Date(ev.startIso.slice(0, 10) + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) + ' · 8am to midnight');
      cancel();
      dayLoad();   // re-read so the list is in time order again
    } catch (err) {
      span.classList.remove('busy');
      daySay('⚠️ ' + String(err.message || err), true);
    }
  };
  span.querySelector('.tt-ok').onclick = save;
  span.querySelector('.tt-no').onclick = cancel;
  [a, b].forEach(inp => inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') save(); else if (e.key === 'Escape') cancel(); }));
  a.focus(); a.select();
}

dayList.addEventListener('contextmenu', (e) => {
  const li = e.target.closest('li');
  const ev = li && dayEvents[+li.dataset.i];
  if (!ev) return;
  e.preventDefault();
  if (e.target.closest('.today-time')) { ctxMenu.style.display = 'none'; dayEditTime(ev, li); return; }
  const crossed = ev.label.startsWith('❌');
  csMenu(e, [
    /complimentary/i.test(ev.label) && { text: '📝 Add note', onClick: () => openNoteDialog(ev) },
    { text: '🗒 Edit description…', title: 'Read and change the notes on this calendar event', onClick: () => editDescription(ev) },
    { text: '✂ Split into two events', title: 'Cut this event into two halves you can name', onClick: () => openSplitDialog(ev) },
    crossed ? { text: '↩ Take the ❌ off', onClick: () => dayCross(ev, false, li) }
            : { text: '❌ Cancelled / couldn\'t make it', title: 'Cancelled, or you couldn\'t make it: puts a red ❌ at the start of the event title', onClick: () => dayCross(ev, true, li) },
  ]);
});

// ---- split an event in two at its halfway point (to the nearest 5 minutes); both halves can be renamed first
const splitOverlay = document.getElementById('split-overlay');
const splitName1 = document.getElementById('split-name1');
const splitName2 = document.getElementById('split-name2');
const splitStatus = document.getElementById('split-status');
const splitGo = document.getElementById('split-go');
let splitFor = null;

const hhmm = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
function halfway(ev) {
  const a = new Date(ev.startIso), b = new Date(ev.endIso);
  const mid = new Date((a.getTime() + b.getTime()) / 2);
  mid.setMinutes(Math.round((mid.getHours() * 60 + mid.getMinutes() + mid.getSeconds() / 60) / 5) * 5 - mid.getHours() * 60, 0, 0);
  return { a, mid, b };
}

function openSplitDialog(ev) {
  const { a, mid, b } = halfway(ev);
  if (!(a < mid && mid < b)) { daySay('⚠️ That event is too short to split.', true); return; }
  splitFor = ev;
  const plain = ev.label.replace(/^❌\s*/, '');
  document.getElementById('split-sub').textContent = `${plain} · ${hhmm(a)}–${hhmm(b)} is cut at ${hhmm(mid)}.`;
  document.getElementById('split-lab1').textContent = `First half · ${hhmm(a)}–${hhmm(mid)}`;
  document.getElementById('split-lab2').textContent = `Second half · ${hhmm(mid)}–${hhmm(b)}`;
  splitName1.value = plain;
  splitName2.value = plain;
  splitStatus.textContent = '';
  splitGo.disabled = false;
  splitOverlay.style.display = 'flex';
  splitName1.focus();
  splitName1.select();
}
function closeSplitDialog() { splitOverlay.style.display = 'none'; splitFor = null; }

async function runSplit() {
  const n1 = splitName1.value.trim(), n2 = splitName2.value.trim();
  if (!splitFor || !n1 || !n2) { splitStatus.textContent = 'Give both halves a name.'; return; }
  splitGo.disabled = true;
  splitStatus.textContent = 'Splitting on your calendar…';
  try {
    const res = await fetch('/api/day-split', { method: 'POST', body: JSON.stringify({ id: splitFor.id, name1: n1, name2: n2 }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'could not split');
    closeSplitDialog();
    daySay('✅ Split in two');
    dayLoad();
  } catch (e) {
    splitStatus.textContent = '⚠️ ' + String(e.message || e);
    splitGo.disabled = false;
  }
}
document.getElementById('split-cancel').onclick = closeSplitDialog;
splitGo.onclick = runSplit;
splitOverlay.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closeSplitDialog(); }
  else if (e.key === 'Enter') { e.preventDefault(); runSplit(); }
  e.stopPropagation();
});

// ❌ at the start of the event's title in Google Calendar (or off again), then the list is re-read
async function dayCross(ev, on, li) {
  li.classList.add('busy');
  try {
    const res = await fetch(`/api/day-tick?id=${encodeURIComponent(ev.id)}&done=0&cross=${on ? 1 : 0}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'calendar update failed');
    dayLoad();
  } catch (e) {
    li.classList.remove('busy');
    daySay('⚠️ ' + String(e.message || e), true);
  }
}

// right-click -> Edit description: the event's notes in a box, saved straight back to the calendar (routes/day.py day_desc)
async function editDescription(ev) {
  const box = document.createElement('div');
  box.innerHTML = '<p class="st-note" style="margin:0 0 8px">Loading the description…</p><textarea rows="10" style="width:100%;box-sizing:border-box;font:inherit;padding:10px;border:1px solid var(--border);border-radius:8px" disabled></textarea>';
  const note = box.querySelector('p'), area = box.querySelector('textarea');
  const dlg = csDialog({ title: `🗒 ${ev.label || 'Event'}`, body: box, buttons: [
    { text: 'Cancel' },
    { text: 'Save', primary: true, onClick: async () => {
      note.textContent = 'Saving…';
      try {
        const res = await fetch('/api/day-desc?id=' + encodeURIComponent(ev.id), { method: 'POST', body: JSON.stringify({ text: area.value }) });
        const d = await res.json(); if (!res.ok || d.error) throw new Error(d.error || 'not saved');
        dlg.close(); daySay('✅ Description saved');
      } catch (e) { note.textContent = '⚠️ ' + (e.message || 'not saved'); }
      return false;   // (the dialog closes itself once it's saved)
    } },
  ] });
  try {
    const d = await csJSON('/api/day-desc?id=' + encodeURIComponent(ev.id));
    area.value = d.description || ''; area.disabled = false; area.focus();
    note.textContent = d.description ? 'Edit and save. Line breaks are kept.' : 'No description yet: type one.';
  } catch (e) { note.textContent = '⚠️ Couldn’t load it: ' + (e.message || e); }
}

function openNoteDialog(ev) {
  noteFor = ev;
  document.getElementById('note-for').textContent = `${ev.start} call · saved as a banana note at ${ev.start}`;
  noteText.value = '';
  noteStatus.textContent = '';
  noteSave.disabled = false;
  noteOverlay.style.display = 'flex';
  noteText.focus();
}
function closeNoteDialog() { noteOverlay.style.display = 'none'; noteFor = null; }

async function saveNote() {
  const text = noteText.value.trim();
  if (!noteFor || !text) { noteStatus.textContent = 'Type a note first.'; return; }
  noteSave.disabled = true;
  noteStatus.textContent = 'Adding to your calendar…';
  try {
    const res = await fetch('/api/day-note', { method: 'POST', body: JSON.stringify({ start: noteFor.startIso, text }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'could not add the note');
    closeNoteDialog();
    daySay('✅ Note added to your calendar');
  } catch (e) {
    noteStatus.textContent = '⚠️ ' + String(e.message || e);
    noteSave.disabled = false;
  }
}
document.getElementById('note-cancel').onclick = closeNoteDialog;
noteSave.onclick = saveNote;
noteOverlay.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closeNoteDialog(); }
  else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveNote(); }
});

if (liveStore('appTab') === 'today') dayLoad();   // reopened on this tab
