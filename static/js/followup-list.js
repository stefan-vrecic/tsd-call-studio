// followup-list.js -- the Follow up tab: the sessions to chase = every flamingo-coloured Complimentary calendar call since 23 August,
// read live from the calendar each time the tab opens (routes/files.py followups_get), each with its Aloware link, a "followed up"
// tickbox and a note (kept per calendar event in live_docs/followups.json). Recolour a call away from flamingo and it leaves the
// list; newest session first. You can add or remove people by hand too.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const fuList = document.getElementById('fu-list');
const fuSub = document.getElementById('fu-sub');
const fuHideDone = document.getElementById('fu-hide-done');
let fuItems = [];
let fuLoaded = false;
let fuSaveTimer = null;
// which list: "flamingo" (default) = the flamingo calls on the calendar, live; "saved" = the list you built, the calendar not consulted
let fuMode = (() => { try { return localStorage.getItem('fuMode') === 'saved' ? 'saved' : 'flamingo'; } catch (e) { return 'flamingo'; } })();

function fuSave() {
  clearTimeout(fuSaveTimer);
  fuSaveTimer = setTimeout(() => {
    fetch('/api/followups?mode=' + fuMode, { method: 'POST', body: JSON.stringify({ items: fuItems }), keepalive: true }).catch(() => {});
  }, 400);
}

function fuWhen(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fuRender() {
  const total = fuItems.length, done = fuItems.filter(i => i.done).length;
  fuSub.textContent = `${total - done} to follow up · ${done} done · ${total} sessions`;
  fuList.innerHTML = '';
  const shown = [...fuItems].sort((a, b) => (b.start || '').localeCompare(a.start || '')).filter(i => !(fuHideDone.checked && i.done));
  shown.forEach(it => {
    const li = document.createElement('li');
    li.className = 'fu-row' + (it.done ? ' done' : '');
    li.innerHTML = '<input type="checkbox" title="Followed up"><div class="fu-who"><div class="fu-name"></div><div class="fu-when"></div></div>' +
      '<div class="fu-link"></div><input type="text" class="fu-note" placeholder="Note…"><button class="fu-del" title="Remove from the list">✕</button>';
    const name = li.querySelector('.fu-name');
    name.textContent = displayName(it.name);
    if (it.tag) { const t = document.createElement('span'); t.className = 'fu-tag'; t.textContent = it.tag; t.title = 'The prefix on the calendar event'; name.appendChild(t); }
    const copy = document.createElement('button');
    copy.className = 'fu-copy'; copy.textContent = '📋'; copy.title = 'Copy name';
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(displayName(it.name)); copy.textContent = '✓'; } catch (e) { copy.textContent = '⚠️'; }
      setTimeout(() => { copy.textContent = '📋'; }, 1200);
    };
    name.appendChild(copy);
    li.querySelector('.fu-when').textContent = fuWhen(it.start);
    fuRenderCalls(li.querySelector('.fu-who'), it);
    const link = li.querySelector('.fu-link');
    if (it.aloware) {
      const a = document.createElement('a');
      a.href = it.aloware; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Aloware ↗';
      link.appendChild(a);
    } else { link.innerHTML = '<span class="fu-nolink">no Aloware link</span>'; }
    const box = li.querySelector('input[type=checkbox]');
    box.checked = it.done;
    box.onchange = () => { it.done = box.checked; li.classList.toggle('done', it.done); fuSave(); if (fuHideDone.checked) fuRender(); else fuCount(); };
    const note = li.querySelector('.fu-note');
    note.value = it.note || '';
    note.addEventListener('input', () => { it.note = note.value; fuSave(); });
    note.addEventListener('keydown', (e) => e.stopPropagation());
    li.querySelector('.fu-del').onclick = () => { if (confirm(`Remove ${displayName(it.name)} from the follow up list?`)) { fuItems = fuItems.filter(x => x !== it); fuSave(); fuRender(); } };
    fuList.appendChild(li);
  });
  if (!shown.length) fuList.innerHTML = '<li class="trk-empty" style="padding:18px 0">Nothing here.</li>';
}
// The matching Call Studio calls under the name: click = open it here, Cmd/Ctrl/middle-click = new browser tab, ↗ = new tab.
function fuRenderCalls(who, it) {
  const calls = fuMatchCalls(it);
  if (!calls.length) return;
  const box = document.createElement('div');
  box.className = 'fu-calls';
  calls.forEach(c => {
    const a = document.createElement('a');
    a.className = 'fu-call' + (c.score < 3 ? ' fu-call-maybe' : '');
    a.href = '/' + encodeURIComponent(c.name);
    a.textContent = '🎧 ' + displayName(c.name);
    a.title = (c.score < 3 ? 'Probably this call (name is not an exact match). ' : '') + 'Click to open here · Cmd/Ctrl-click for a new tab';
    a.onclick = (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); fuOpenCall(c.name); };
    const ext = document.createElement('a');
    ext.className = 'fu-call-ext'; ext.href = a.href; ext.target = '_blank'; ext.rel = 'noopener'; ext.textContent = '↗'; ext.title = 'Open in a new tab';
    box.append(a, ext);
    const hasTranscript = (people.find(p => p.name === c.name) || {}).has_transcript;
    if (hasTranscript) {
      const cp = document.createElement('button');
      cp.className = 'fu-call-copy'; cp.textContent = '📋 Transcript'; cp.title = "Copy this call's transcript to the clipboard";
      cp.onclick = () => fuCopyTranscript(c.name, cp, it);
      box.appendChild(cp);
    }
  });
  who.appendChild(box);
}

// Same as the "Copy transcript" button on a call, without opening it. The fetch is handed to the clipboard as a promise so
// Safari still counts it as part of the click.
// Starts with who and when (from the Follow up row), so a pasted transcript says which call it is.
async function fuCopyTranscript(name, btn, it) {
  const header = it ? `Sales call – ${displayName(it.name)}\n${fuWhen(it.start)}\n\n` : '';
  const text = fetch('/api/transcript-raw?person=' + encodeURIComponent(name)).then(r => { if (!r.ok) throw new Error('fetch failed'); return r.text(); }).then(t => header + t);
  try {
    try { await navigator.clipboard.write([new ClipboardItem({ 'text/plain': text.then(t => new Blob([t], { type: 'text/plain' })) })]); }
    catch (e) { await navigator.clipboard.writeText(await text); }
    btn.textContent = '✅ Copied!';
  } catch (e) { btn.textContent = '⚠️ Copy failed'; }
  setTimeout(() => { btn.textContent = '📋 Transcript'; }, 1500);
}

function fuCount() {
  const done = fuItems.filter(i => i.done).length;
  fuSub.textContent = `${fuItems.length - done} to follow up · ${done} done · ${fuItems.length} sessions`;
}

async function fuLoad() {
  document.querySelectorAll('#fu-mode button').forEach(b => b.classList.toggle('on', b.dataset.mode === fuMode));
  try { fuItems = (await csJSON('/api/followups?mode=' + fuMode)).items || []; fuLoaded = true; } catch (e) { /* keep what is shown */ }
  fuRender();
}

// Plain-text progress summary for a Google Calendar event description (so the manager can see where follow-ups stand).
function fuProgressText() {
  const total = fuItems.length, done = fuItems.filter(i => i.done);
  const todo = fuItems.filter(i => !i.done).sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  const pct = total ? Math.round(done.length / total * 100) : 0;
  const bar = '▓'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
  const day = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); };
  const line = (i) => '• ' + displayName(i.name) + (i.start ? ` (session ${day(i.start)})` : '') + (i.note ? ' – ' + displayNamesInText(i.note) : '');
  return [
    `Follow-up progress – ${day(new Date().toISOString())}`,
    `${bar} ${pct}%`,
    `✅ ${done.length} done · ⏳ ${todo.length} to follow up · ${total} sessions`,
    '',
    `Done (${done.length}):`, ...done.sort((a, b) => (b.start || '').localeCompare(a.start || '')).map(line),
    '',
    `Still to follow up (${todo.length}):`, ...todo.map(line),
  ].join('\n');
}
document.getElementById('fu-copy-progress').onclick = async (e) => {
  const btn = e.currentTarget;
  try { await navigator.clipboard.writeText(fuProgressText()); btn.textContent = '✅ Copied!'; } catch (err) { btn.textContent = '⚠️ Copy failed'; }
  setTimeout(() => { btn.textContent = '📋 Copy progress'; }, 1500);
};

fuHideDone.addEventListener('change', fuRender);
document.querySelectorAll('#fu-mode button').forEach(b => b.onclick = () => {
  if (b.dataset.mode === fuMode) return;
  clearTimeout(fuSaveTimer);   // (a pending save belongs to the list being left)
  fuMode = b.dataset.mode;
  try { localStorage.setItem('fuMode', fuMode); } catch (e) { /* not remembered */ }
  fuLoad();
});
document.getElementById('fu-add-go').onclick = () => {
  const nameEl = document.getElementById('fu-add-name'), linkEl = document.getElementById('fu-add-link');
  const name = nameEl.value.trim();
  if (!name) { nameEl.focus(); return; }
  const link = linkEl.value.trim();
  fuItems.push({ id: 'manual-' + Date.now(), name, start: new Date().toISOString(), tag: '', aloware: /^https?:\/\//.test(link) ? link : '', done: false, note: '' });
  nameEl.value = ''; linkEl.value = '';
  fuSave(); fuRender();
};
document.querySelectorAll('#fu-add input').forEach(i => i.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') document.getElementById('fu-add-go').click(); }));
if (liveStore('appTab') === 'followup') fuLoad();   // reopened on this tab

// Calls that arrive without this page knowing (the Drive "Aloware Calls" inbox, another browser tab) only reach `people` when
// the list is re-fetched. While the Follow up tab is open, check every 30 s and redraw if a call was added, renamed or
// finished transcribing, so its 🎧 / 📋 Transcript links show up on their own.
function fuCallsKey(list) { return list.map(p => p.name + (p.has_transcript ? '+' : '-')).sort().join('|'); }
async function fuCheckCalls() {
  if (document.hidden || STATIC_VIEWS.followup.style.display === 'none') return;
  try {
    const fresh = await csJSON('/api/people');
    if (fuCallsKey(fresh) !== fuCallsKey(people)) await loadPeople();   // loadPeople redraws this tab too
  } catch (e) { /* server busy or restarting: try again next time */ }
}
setInterval(fuCheckCalls, 30000);
document.getElementById('tab-followup').addEventListener('click', fuCheckCalls);
document.addEventListener('visibilitychange', fuCheckCalls);   // coming back to this browser tab
