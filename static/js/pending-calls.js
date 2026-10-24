// pending-calls.js -- Call Studio's call list, top: "📅 From your calendar — not transcribed". Every complimentary call booked in the
// calendar in the last N days (settings pendingCallDays, default 7) plus today's still to come, that has no recording in Call Studio yet,
// in a dark colour (settings pendingCallColor, default dark red) with its Aloware link and calendar event. Data: GET /api/sessions
// (routes/sessions.py: calendar + name matching). A call leaves this group by itself once its recording arrives. Settings -> Call Studio
// changes the colour / days (also wired here). It re-reads after every loadPeople() (new uploads, renames).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const PC_DEFAULT_COLOR = '#7f1d1d', PC_PROCESSING_COLOR = '#b45309';   // not transcribed (dark red) / being transcribed (amber)
let pcQueue = [];   // the processing queue (/api/queue): a red call whose recording is already uploaded shows amber
let pcItems = [], pcArchived = [], pcSettings = { color: PC_DEFAULT_COLOR, days: 7 };
let pcArchiveOpen = csStore('pcArchiveOpen') === '1';
let pcOpen = csStore('pendingCallsOpen') !== '0';
const pcEsc = csEsc;   // (shared.js)
const pcIso = csIso;

async function pcLoad() {
  try {
    const s = await csJSON('/api/settings');
    pcSettings = { color: s.pendingCallColor || PC_DEFAULT_COLOR, days: Number.isFinite(+s.pendingCallDays) ? +s.pendingCallDays : 7 };
    document.documentElement.style.setProperty('--processing-call', s.processingCallColor || PC_PROCESSING_COLOR);
  } catch (e) { /* defaults */ }
  const since = new Date(); since.setDate(since.getDate() - pcSettings.days);
  try {
    const d = await csJSON(`/api/sessions?since=${pcIso(since)}&until=${pcIso(new Date())}`);
    // held calls with no recording yet, and today's calls still to come; not cancelled / no-shows
    pcItems = (d.items || []).filter(i => !i.inStudio && !i.cancelled && i.outcome !== 'Closed won' && (i.expected || i.upcoming));
    // 🗄 Archived calls: the ones marked no show / cancelled / closed (right-click below, or in the calendar)
    pcArchived = (d.items || []).filter(i => !i.inStudio && (i.cancelled || i.outcome === 'No show' || i.outcome === 'Closed won'));
  } catch (e) { pcItems = []; pcArchived = []; }
  await pcLoadQueue();
  pcRender();
}

async function pcLoadQueue() {
  try { pcQueue = ((await csJSON('/api/queue')).items || []).filter(q => q.kind === 'call'); } catch (e) { pcQueue = []; }
}
// the queue entry for a calendar call: same "MM-DD-Name" stem, or a name that matches
const pcQueued = (i) => pcQueue.find(q => q.name === pcStem(i) || (typeof fmScore === 'function' && i.name && fmScore(i.name, q.name) >= 2));

// the name to show: a made-up one in demo mode (core.js displayName); the real one is still used for matching files and copying
const pcShow = (i, fallback) => (i.name ? (typeof displayName === 'function' ? displayName(i.name) : i.name) : fallback);
const pcShowText = i => (typeof displayNamesInText === 'function' ? displayNamesInText(i.title, [i.name]) : i.title);

function pcRender() {
  // the calendar calls go IN the call list, as ordinary rows at the very top (dark colour = not transcribed yet)
  const ul = document.getElementById('people-list');
  if (!ul) return;
  document.documentElement.style.setProperty('--pending-call', pcSettings.color);
  ul.querySelectorAll('li.pending-row, li.pc-archive-head, li.pc-archived').forEach(li => li.remove());
  const today = pcIso(new Date());
  [...pcItems].reverse().forEach(i => {   // newest ends up first
    const d = new Date(i.date + 'T12:00:00');
    const when = (i.date === today ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })) + ' · ' + i.time;
    const li = document.createElement('li');
    const q = pcQueued(i);
    li.className = 'pending-row' + (q ? ' processing-row' : '');
    li.dataset.person = '';                 // not a call in Call Studio: nothing to select, rename or export
    li.dataset.pendingName = i.name || '';
    li.title = `${pcShowText(i)}\nNot transcribed yet — click to drop its recording in`;
    li.innerHTML = `<span class="person-name"><span class="pn-title">${pcEsc(pcShow(i, '(no name)'))}${i.tag ? ` <small class="pc-tag">${pcEsc(i.tag)}</small>` : ''}</span>
      <div class="pn-meta">${pcEsc(when)} · ${q ? (q.stage === 'queued' ? 'in the queue' : pcEsc(q.stage === 'transcribing' ? 'transcribing' + (q.percent ? ' ' + q.percent + '%' : '') : 'processing')) : i.upcoming ? 'still to come' : 'not transcribed'}${i.outcome ? ' · ' + pcEsc(i.outcome) : ''}</div></span>
      ${i.aloware ? `<a href="${pcEsc(i.aloware)}" target="_blank" rel="noopener" class="pc-al" title="Open in Aloware (to download the recording)">Aloware ↗</a>` : '<span class="pc-none">no Aloware</span>'}
      <a href="${pcEsc(i.url)}" target="_blank" rel="noopener" class="pc-ev" title="Open the calendar event">📅</a>`;
    li.onclick = (e) => { if (e.target.closest('a')) return; pcSlot(i); };   // opens the drop slot for this call
    li.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); pcMenu(e, i, false); }, true);
    ul.prepend(li);
  });
  // 🗄 Archived calls, folded at the bottom of the list
  if (pcArchived.length) {
    const head = document.createElement('li'); head.className = 'pc-archive-head'; head.dataset.person = '';
    head.innerHTML = `${pcArchiveOpen ? '▾' : '▸'} 🗄 Archived calls <b>${pcArchived.length}</b> <small>no-shows, cancellations and closed calls from the calendar</small>`;
    head.onclick = () => { pcArchiveOpen = !pcArchiveOpen; csStore('pcArchiveOpen', pcArchiveOpen ? '1' : '0'); pcRender(); };
    head.addEventListener('contextmenu', (e) => e.stopPropagation(), true);
    ul.appendChild(head);
    if (pcArchiveOpen) pcArchived.forEach(i => {
      const d = new Date(i.date + 'T12:00:00');
      const li = document.createElement('li'); li.className = 'pc-archived'; li.dataset.person = ''; li.dataset.pendingName = i.name || '';
      li.title = pcShowText(i) + '\nClick to drop its recording in · right-click to restore';
      li.onclick = (e) => { if (e.target.closest('a')) return; pcSlot(i); };   // (a closed call can still be transcribed)
      li.innerHTML = `<span class="person-name"><span class="pn-title">${pcEsc(pcShow(i, '(no name)'))}</span><div class="pn-meta">${pcEsc(d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }))} · ${pcEsc(i.time)} · ${pcEsc(i.cancelled ? 'Cancelled' : i.outcome === 'Closed won' ? '🟢 Closed' : 'No show')}</div></span>
        ${i.aloware ? `<a href="${pcEsc(i.aloware)}" target="_blank" rel="noopener" class="pc-al" title="Open in Aloware">Aloware ↗</a>` : ''}`;
      li.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); pcMenu(e, i, true); }, true);
      ul.appendChild(li);
    });
  }
  if (typeof applyPeopleSearch === 'function') applyPeopleSearch();
}

// right-click a red (not transcribed) call: mark it no show / cancelled -> it recolours the calendar event and moves to Archived calls.
// Right-click an archived one: Restore (clears the colour, so it's a normal not-transcribed call again).
function pcMenu(e, i, archived) {
  const mark = async (m) => {
    try {
      await csPost('/api/session-mark', { id: i.id, mark: m });
      ctxToast(m === 'clear' ? `${pcShow(i)} restored` : `${pcShow(i)} → ${({ noshow: 'no show', cancelled: 'cancelled', closed: 'closed 🟢' })[m]} (archived)`);
      pcLoad();
    } catch (err) { alert("Couldn't change the calendar: " + err.message); }
  };
  csMenu(e, [{ heading: pcShow(i, 'Calendar call') },
    ...(archived ? [{ text: '↩️ Restore (back to not transcribed)', onClick: () => mark('clear') }]
                 : [{ text: '🟠 Mark as no show', onClick: () => mark('noshow') }, { text: '🟣 Mark as cancelled', onClick: () => mark('cancelled') }, { text: '🟢 Mark as closed', onClick: () => mark('closed') }]),
    i.aloware && { text: '↗ Open in Aloware', href: i.aloware },
    { text: '📅 Open the calendar event', href: i.url }]);
}

// follow the call list: after it reloads (new upload, rename, finished transcription) the pending group is re-checked
if (typeof loadPeople === 'function') {
  const pcOrigLoadPeople = loadPeople;
  loadPeople = async function () { const r = await pcOrigLoadPeople.apply(this, arguments); pcLoad(); return r; };   // eslint-disable-line no-global-assign
}
pcLoad();

// ---- Settings -> Call Studio: the colour and how many days back
(() => {
  const color = document.getElementById('st-pending-color'), days = document.getElementById('st-pending-days'), status = document.getElementById('st-pending-status');
  if (!color || !days) return;
  csJSON('/api/settings').then(s => { color.value = s.pendingCallColor || PC_DEFAULT_COLOR; days.value = s.pendingCallDays ?? 7; }).catch(() => {});
  const save = async (q) => {
    status.textContent = 'Saving…';
    try { const r = await fetch('/api/settings?' + q, { method: 'POST' }); if (!r.ok) throw new Error(); status.textContent = 'Saved ✓'; setTimeout(() => { status.textContent = ''; }, 1500); pcLoad(); }
    catch (e) { status.textContent = '⚠️ Not saved'; }
  };
  color.addEventListener('input', () => document.documentElement.style.setProperty('--pending-call', color.value));   // preview while picking
  color.addEventListener('change', () => save('pendingCallColor=' + encodeURIComponent(color.value)));
  const proc = document.getElementById('st-processing-color');
  if (proc) {
    csJSON('/api/settings').then(s => { proc.value = s.processingCallColor || PC_PROCESSING_COLOR; }).catch(() => {});
    proc.addEventListener('input', () => document.documentElement.style.setProperty('--processing-call', proc.value));
    proc.addEventListener('change', () => save('processingCallColor=' + encodeURIComponent(proc.value)));
    document.getElementById('st-processing-color-reset').onclick = () => { proc.value = PC_PROCESSING_COLOR; save('processingCallColor=' + encodeURIComponent(PC_PROCESSING_COLOR)); };
  }
  document.getElementById('st-pending-color-reset').onclick = () => { color.value = PC_DEFAULT_COLOR; save('pendingCallColor=' + encodeURIComponent(PC_DEFAULT_COLOR)); };
  days.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') days.blur(); });
  days.addEventListener('change', () => { const n = Math.max(0, Math.min(60, Math.round(Number(days.value) || 0))); days.value = n; save('pendingCallDays=' + n); });
})();


// ---- click a red call: a slot over the call area to drop its recording into. The file name is checked against the person's name
// (fmScore, followup-match.js -- the Follow up tab's matching), then it's uploaded as "MM-DD-FirstLast" (the call's date) and marked as
// your call, so it lands in Call Studio under the right name and the red row goes away by itself.
const pcStem = (i) => {   // "Tracy Musgrove" on 2026-10-19 -> "10-19-TracyMusgrove"
  const words = String(i.name || 'Call').normalize('NFD').replace(/[^A-Za-z\s-]/g, '').split(/[\s-]+/).filter(Boolean);
  return i.date.slice(5) + '-' + (words.map(w => w[0].toUpperCase() + w.slice(1)).join('') || 'Call');
};
function pcSlotClose() { document.getElementById('pc-slot')?.remove(); }
function pcSlot(i) {
  pcSlotClose();
  const right = document.getElementById('right'); if (!right) return;
  const d = new Date(i.date + 'T12:00:00');
  const when = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + i.time;
  const slot = document.createElement('div'); slot.id = 'pc-slot';
  slot.innerHTML = `<div class="pc-slot-card">
      <button class="pc-slot-x" title="Close (Esc)">✕</button>
      <p class="pc-slot-kicker">NOT TRANSCRIBED YET</p>
      <h2>${pcEsc(pcShow(i, 'Calendar call'))}${i.tag ? ` <small>${pcEsc(i.tag)}</small>` : ''}${i.name ? '<button class="pc-copy-name" title="Copy the name">⧉</button>' : ''}</h2>
      <p class="pc-slot-when">${pcEsc(when)}${i.outcome ? ' · <b>' + pcEsc(i.outcome) + '</b>' : ''}</p>
      <div class="pc-slot-links">${i.aloware ? `<a class="ctl" href="${pcEsc(i.aloware)}" target="_blank" rel="noopener">Aloware ↗ <small>download the recording</small></a>` : '<span class="pc-none-dark">no Aloware link on the booking</span>'}
        <a class="ctl" href="${pcEsc(i.url)}" target="_blank" rel="noopener">📅 Calendar event</a></div>
      <label class="pc-drop" tabindex="0"><input type="file" accept="audio/*,video/*,.mp3,.m4a,.wav,.mp4,.mov,.mkv" hidden>
        <span class="pc-drop-big">⬇ Drop ${pcEsc(pcShow(i, 'the').split(' ')[0])}'s recording here</span>
        <span class="pc-drop-small">or click to choose it · it's saved as <b>${pcEsc(pcStem(i))}</b> and transcribed</span></label>
      <p class="pc-slot-msg" id="pc-slot-msg"></p></div>`;
  right.appendChild(slot);
  const drop = slot.querySelector('.pc-drop'), input = drop.querySelector('input');
  slot.querySelector('.pc-slot-x').onclick = pcSlotClose;
  const copyName = slot.querySelector('.pc-copy-name');   // ⧉ next to the name: copies it (to search Aloware / name the file)
  if (copyName) copyName.onclick = async () => {
    try { await navigator.clipboard.writeText(i.name); copyName.textContent = '✓'; copyName.classList.add('done'); } catch (e) { copyName.textContent = '⚠'; }
    setTimeout(() => { copyName.textContent = '⧉'; copyName.classList.remove('done'); }, 1200);
  };
  ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.add('hover'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); drop.classList.remove('hover'); }));
  drop.addEventListener('drop', (e) => pcTake(i, [...e.dataTransfer.files]));
  input.onchange = () => pcTake(i, [...input.files]);
}
function pcTake(i, files) {
  const msg = document.getElementById('pc-slot-msg');
  const media = files.filter(f => /\.(mp3|m4a|wav|mp4|mov|mkv|aac|ogg|webm)$/i.test(f.name) || /^(audio|video)\//.test(f.type));
  if (!media.length) { msg.textContent = '⚠️ That isn\'t a recording (mp3, m4a, wav, mp4, mov…).'; return; }
  if (media.length > 1) { msg.textContent = '⚠️ Drop one recording here. For a call in several parts, tick "Combine dropped files into one call" on the left and drop them there.'; return; }
  const f = media[0], base = f.name.replace(/\.[^.]+$/, '');
  // does the file name look like this person? (Aloware's own downloads have random names like 61c609b4-…: nothing to check)
  const random = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(base) || !/[a-z]{3,}/i.test(base.replace(/[0-9a-f]{4,}/gi, ''));
  const score = typeof fmScore === 'function' && !random ? fmScore(i.name || '', base) : 0;
  if (random && !confirm(`"${f.name}" has no name in it to check (an Aloware download?).\n\nUpload it as ${i.name}'s call (${pcStem(i)})?`)) return;
  if (!random && score < 1.5 && !confirm(`"${f.name}" doesn't look like ${i.name}.\n\nUpload it as ${i.name}'s call (${pcStem(i)}) anyway?`)) return;
  pcUpload(i, f);
}
async function pcUpload(i, f) {
  const msg = document.getElementById('pc-slot-msg');
  const ext = (f.name.match(/\.[^.]+$/) || ['.mp3'])[0].toLowerCase();
  const name = pcStem(i) + ext;
  const headers = { 'X-Filename': encodeURIComponent(name), 'X-Mine': 'true' };   // his calendar = his call
  if (typeof selectedBaseScript !== 'undefined' && selectedBaseScript) headers['X-Base-Script'] = encodeURIComponent(selectedBaseScript);
  const id = 'f' + (++fileUploadSeq);
  fileUploads.set(id, { name, percent: 0 });
  if (typeof qpRender === 'function') qpRender();
  if (msg) msg.textContent = `Uploading as ${name}…`;
  try {
    const { job_id } = await postFile(f, headers, id);
    displayedJobs.add(job_id);
    pollJob(job_id, name);
    if (typeof ctxToast === 'function') ctxToast(`${i.name}: uploading and transcribing as ${pcStem(i)}`);
    pcSlotClose();
  } catch (e) { if (msg) msg.textContent = '⚠️ ' + e.message; }
  finally { fileUploads.delete(id); if (typeof qpRender === 'function') qpRender(); }
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('pc-slot')) pcSlotClose(); });
// picking a real call closes the slot
document.getElementById('people-list')?.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li && !li.classList.contains('pending-row')) pcSlotClose(); });

// keep the queue colours current while things are processing (every 10 s, only while something is in the queue)
setInterval(async () => { if (!pcItems.length) return; const had = pcQueue.length; await pcLoadQueue(); if (pcQueue.length || had) pcRender(); }, 10000);

window.addEventListener('callstudio:demo-mode', () => pcRender());   // swap the shown names straight away
