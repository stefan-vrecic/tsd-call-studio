// tracker-tab.js -- the Tracker tab's screens: Questions (the list to keep top of mind + a one-line log box), Log (quick buttons for today or any day), Dashboard (every tracker for its day / week /
// month with target, pace and change), Charts & compare (any tracker over any dates, against another period) and Trackers (add / edit).
// Numbers come from tracker-data.js, drawings from tracker-charts.js.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const TK_COLORS = { Sales: '#2563eb', Money: '#16a34a', Social: '#db2777', Body: '#ea580c', Mind: '#7c3aed', Hobbies: '#0891b2', Skills: '#0891b2', Private: '#64748b', Other: '#475569' };
const tkColor = (m) => m.color || TK_COLORS[m.group] || TK_COLORS.Other;   // a tracker's own colour (set in 🎯 / Trackers) wins
const tkPref = (k, d) => { const v = liveStore('tk-' + k); return v === null || v === undefined || v === '' ? d : v; };
const tkSetPref = (k, v) => liveStore('tk-' + k, v);
let tkView = tkPref('view', 'quick');
let tkLogDate = null;
let tkLoaded = false;

async function tkOpen() {
  try { await tkFetch(); tkLoaded = true; } catch (e) { document.getElementById('tk-log').innerHTML = '<p class="trk-empty">Could not load the tracker.</p>'; return; }
  if (!tkLogDate) tkLogDate = tk.today;
  tkShow(tkView);
}

// Tracker updates can arrive outside this browser tab (for example from a
// chat command). Keep read-only Dashboard/Charts views live without making
// the user refresh, while leaving forms alone so typed input is never lost.
const tkEntriesKey = (entries) => JSON.stringify((entries || []).map(e => [e.id, e.value, e.date, e.at]));
async function tkRefreshExternal() {
  if (!tkLoaded || document.hidden || !['dash', 'charts', 'sheet'].includes(tkView) || (tkView === 'sheet' && document.activeElement && document.activeElement.closest('#tk-sheet')) || STATIC_VIEWS.tracker.style.display === 'none') return;
  try {
    const d = await csJSON('/api/tracker');
    if (tkEntriesKey(d.entries) === tkEntriesKey(tk.entries)) return;
    tk.metrics = d.metrics || [];
    tk.entries = d.entries || [];
    tk.today = d.today;
    tk.questions = d.questions || [];
    tkIndex();
    const wrap = document.querySelector('#tk-sheet .tk-sh-wrap'), left = wrap ? wrap.scrollLeft : 0, top = wrap ? wrap.scrollTop : 0, page = window.scrollY;
    tkShow(tkView);
    if (tkView === 'sheet') {   // re-drawing the sheet re-centres on today: put the scroll back where it was
      const w2 = document.querySelector('#tk-sheet .tk-sh-wrap');
      if (w2) { w2.scrollLeft = left; w2.scrollTop = top; }
      window.scrollTo(0, page);
    }
  } catch (e) { /* server busy/restarting: retry on the next tick */ }
}
setInterval(tkRefreshExternal, 5000);
document.addEventListener('visibilitychange', tkRefreshExternal);

function tkShow(view) {
  tkView = view; tkSetPref('view', view);
  document.querySelector('#tracker-view .tk-head').style.background = getComputedStyle(document.getElementById('tracker-view')).backgroundColor;   // the sticky header matches a page colour picked in Settings
  const captions = {
    quick: 'Log several numbers in one sentence.', log: 'Capture today quickly, one metric at a time.', history: 'Search everything you logged and jump back to any day.', dash: 'See what is moving and what needs attention.',
    sheet: 'Edit a whole month with spreadsheet speed.', charts: 'Compare periods and understand the trend.', workouts: 'Keep training beside the rest of your data.', manage: 'Control metrics, targets, groups and privacy.'
  };
  document.getElementById('tk-view-caption').textContent = captions[view] || 'Capture today without losing sight of the trend.';
  document.querySelectorAll('#tk-nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  ['quick', 'log', 'history', 'dash', 'sheet', 'charts', 'workouts', 'manage'].forEach(v => { document.getElementById('tk-' + v).style.display = v === view ? '' : 'none'; });
  ({ quick: tkRenderQuick, log: tkRenderLog, history: tkRenderHistory, dash: tkRenderDash, sheet: tkRenderSheet, charts: tkRenderCharts, workouts: tkRenderWorkouts, manage: tkRenderManage })[view]();
}
document.querySelectorAll('#tk-nav button').forEach(b => b.onclick = () => tkShow(b.dataset.view));

const tkGroups = (list) => { const g = new Map(); list.forEach(m => { if (!g.has(m.group)) g.set(m.group, []); g.get(m.group).push(m); }); return g; };
const tkPct = (m, v, t) => (t ? v / t : 0);
function tkStatusClass(m, v, t) {
  if (v == null || !t) return '';
  if (m.direction === 'limit') return v > t ? 'over' : v > t * 0.9 ? 'near' : '';
  if (m.direction === 'down') return v <= t ? 'done' : '';
  return v >= t ? 'done' : '';
}

// ---- hiding cards you don't track (Log + Dashboard): right-click a card -> Hide; "Show hidden" brings them back faded, right-click -> Unhide.
// Saved on the tracker itself (hidden: true), so it sticks on every device; Charts and the Questions list don't use it.
const tkShowHidden = () => tkPref('showHidden', '0') === '1';
const tkShown = () => tkVisible().filter(m => !m.hidden || tkShowHidden());
const tkHiddenBox = () => {
  const n = tkVisible().filter(m => m.hidden).length;
  return n ? `<label class="kind-box tk-hidden-box"><input type="checkbox" id="tk-show-hidden"${tkShowHidden() ? ' checked' : ''}> Show hidden (${n})</label>` : '';
};
function tkWireHiddenBox(pane, rerender) {
  const box = pane.querySelector('#tk-show-hidden');
  if (box) box.onchange = () => { tkSetPref('showHidden', box.checked ? '1' : '0'); rerender(); };
}
// a Dashboard card's own period (right-click -> Show by) wins over the "Show each tracker by" bar; otherwise the bar's choice, else the tracker's default
const tkCardPeriods = () => { try { return JSON.parse(tkPref('cardPeriods', '{}')) || {}; } catch (e) { return {}; } };
const tkCardPeriod = (m) => { const own = tkCardPeriods()[m.id]; if (own) return own; const mode = tkPref('dashMode', 'default'); return mode === 'default' ? m.defaultPeriod : mode; };
function tkSetCardPeriod(m, g) { const all = tkCardPeriods(); if (g) all[m.id] = g; else delete all[m.id]; tkSetPref('cardPeriods', JSON.stringify(all)); }
function tkHideable(card, m, rerender) {
  if (m.hidden) card.classList.add('tk-is-hidden');
  if (typeof tkDragCard === 'function') tkDragCard(card, m, rerender);   // re-order by dragging (tracker-layout.js)
  card.addEventListener('contextmenu', (e) => {
    if (e.target.closest('input, textarea')) return;   // keep the normal menu (paste) in the boxes
    e.preventDefault(); e.stopPropagation();
    const isDash = card.classList.contains('tk-dash-card'), cur = tkCardPeriod(m), own = tkCardPeriods()[m.id];
    const save = async (patch) => { try { await tkSaveMetric({ ...m, ...patch }); } catch (err) { alert(err.message); } rerender(); };
    const showBy = isDash && !m.rolling ? ['-', { label: 'Show by' }, ...[['d', 'Day'], ['w', 'Week'], ['m', 'Month']].map(([k, l]) => ({ text: (cur === k ? '' : '\u2007\u2007') + l, checked: cur === k, onClick: () => { tkSetCardPeriod(m, k); rerender(); } })),
      own && { text: '↺ Use the default', onClick: () => { tkSetCardPeriod(m, ''); rerender(); } }, '-'] : [];
    csMenu(e, [{ heading: m.emoji + ' ' + m.name },
      { text: '✍️ Log', onClick: () => tkLogDialog(m, isDash ? tkCardPeriod(m) : undefined) },   // tracker-log-dialog.js
      { text: m.starred ? '★ Remove from Key metrics' : '⭐ Star (Key metrics)', onClick: () => save({ starred: !m.starred }) },
      { text: '🎯 Set target', onClick: () => tkTargetEditor(card, m, rerender) },
      ...showBy,
      { text: m.hidden ? '👁 Unhide' : '🙈 Hide', onClick: () => save({ hidden: !m.hidden }) }]);
  });
  return card;
}

// Hidden trackers (when "Show hidden" is ticked) are not mixed into their groups: they go in one greyed-out "Hidden" section at the very bottom.
function tkHiddenSection(pane, hiddenList, makeCard, rerender) {
  if (!hiddenList.length) return;
  const h = document.createElement('h3'); h.className = 'tk-group tk-group-hidden'; h.textContent = `Hidden (${hiddenList.length})`;
  const grid = document.createElement('div'); grid.className = 'tk-grid tk-grid-hidden';
  hiddenList.forEach(m => grid.appendChild(tkHideable(makeCard(m), m, rerender)));
  pane.append(h, grid);
}

// ================= Questions: the list, word for word, with today's numbers; one box logs a whole line ("taken 3 closed 1 fu sleep 7")
let tkQuickLast = null;   // the last line logged here: {text, entries} for undo
const tkQuickPost = async (text, dry) => {
  const res = await fetch('/api/tracker-quick', { method: 'POST', body: JSON.stringify({ text, date: tkLogDate || tk.today, dry }) });
  const d = await res.json(); if (!res.ok) throw new Error(d.error || 'could not log'); return d;
};
const tkQuickItems = (items) => items.map(i => { const m = tk.metrics.find(x => x.id === i.metric);
  return m ? `<span class="tk-q-item">${tkEsc(m.emoji)} ${tkEsc(m.name)} <b>${i.value > 0 && m.agg === 'sum' ? '+' : ''}${tkEsc(tkFmt(m, i.value))}</b>${i.note ? ' <small>(' + tkEsc(i.note) + ')</small>' : ''}</span>` : ''; }).join('');

function tkRenderQuick() {
  const pane = document.getElementById('tk-quick');
  const date = tkLogDate || tk.today;
  const demo = typeof demoMode !== 'undefined' && demoMode;
  const byId = (id) => tk.metrics.find(m => m.id === id);
  const day = (id) => { const m = byId(id); return m ? tkDayValue(m, date) : null; };
  const val = (id) => { const m = byId(id), v = day(id); return m && v != null ? tkFmt(m, v) : '—'; };
  const chip = (word, target) => {
    let emoji = '', shown = '', extra = '';
    if (target === 'closed') { emoji = (byId('calls_closed') || {}).emoji; shown = val('calls_closed'); const a = day('one_call_closes'), b = day('followup_conversions'); if (a || b) extra = `1-call ${a || 0} · FU ${b || 0}`; }
    else if (target === 'meetings') { emoji = (byId('meetings_women_1to1') || {}).emoji; const a = day('meetings_women_1to1'), b = day('meetings_women_group'); shown = a == null && b == null ? '—' : String((a || 0) + (b || 0)); if (b) extra = `1-1 ${a || 0} · group ${b}`; }
    else { const m = byId(target); if (!m) return ''; emoji = m.emoji; shown = val(target); }
    return `<button class="tk-q-chip${shown !== '—' ? ' has' : ''}" data-word="${tkEsc(word)}"><span class="tk-q-emo">${tkEsc(emoji || '•')}</span>${tkEsc(word)}<b>${tkEsc(shown)}</b>${extra ? `<small>${tkEsc(extra)}</small>` : ''}</button>`;
  };
  pane.innerHTML = `<div class="tk-bar-row">Logging for <input type="date" id="tk-qdate" value="${date}">
      <button class="ctl" data-d="0">Today</button><button class="ctl" data-d="-1">Yesterday</button></div>
    <div class="tk-q-box"><input id="tk-q-in" autocomplete="off" spellcheck="false" placeholder="taken 3  closed 1  fu …  sleep 7  bw 79.2  rev 3000 (Sarah)"><button class="ctl" id="tk-q-go">Log</button></div>
    <div id="tk-q-prev" class="tk-q-prev"></div><div id="tk-q-res" class="tk-q-res"></div>
    <div class="tk-q-list">${tk.questions.filter(([g]) => !(demo && g === 'Private')).map(([g, items]) =>
      `<div class="tk-q-row"><div class="tk-q-group" style="color:${TK_COLORS[g] || TK_COLORS.Other}">${tkEsc(g)}:</div><div class="tk-q-items">${items.map(([w, t]) => chip(w, t)).filter(Boolean).join('<span class="tk-q-sep">/</span>')}</div></div>`).join('')}</div>
    <p class="tk-hint tk-q-help">Type a word then a number, as many as you like on one line. <b>closed</b> counts as a 1-call close; add <b>fu</b> after the number for a follow-up close.
      <b>meetings</b> is 1-1 unless you add <b>group</b>. <b>8k</b> = 8000. A note goes in brackets after the number: <b>rev 3000 (Sarah)</b>. Click a word to start typing it.</p>`;
  pane.querySelector('#tk-qdate').onchange = (e) => { tkLogDate = e.target.value || tk.today; tkRenderQuick(); };
  pane.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { tkLogDate = tkAdd(tk.today, +b.dataset.d); tkRenderQuick(); });
  const inp = pane.querySelector('#tk-q-in'), prev = pane.querySelector('#tk-q-prev');
  let timer = null;
  const preview = async () => {
    const text = inp.value.trim();
    if (!text) { prev.innerHTML = ''; return; }
    try { const d = await tkQuickPost(text, true); if (inp.value.trim() !== text) return;
      prev.innerHTML = (d.items.length ? 'Will log: ' + tkQuickItems(d.items) : '') + (d.problems.length ? `<span class="tk-q-bad">Not sure about: ${d.problems.map(tkEsc).join(', ')}</span>` : '');
    } catch (e) { prev.textContent = e.message; }
  };
  const go = async () => {
    const text = inp.value.trim(); if (!text) return;
    try {
      const d = await tkQuickPost(text, false);
      if (!d.entries.length) { prev.innerHTML = `<span class="tk-q-bad">Nothing logged. Not sure about: ${d.problems.map(tkEsc).join(', ')}</span>`; return; }
      tk.entries.push(...d.entries); tkIndex();
      tkQuickLast = { text, entries: d.entries, problems: d.problems };
      tkRenderQuick();
      document.getElementById('tk-q-in').focus();
    } catch (e) { alert(e.message); }
  };
  inp.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(preview, 200); });
  inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') go(); });
  pane.querySelector('#tk-q-go').onclick = go;
  pane.querySelectorAll('.tk-q-chip').forEach(b => b.onclick = () => {
    const w = b.dataset.word; inp.value = (inp.value.trim() ? inp.value.trim() + ' ' : '') + w + ' '; inp.focus(); preview();
  });
  if (tkQuickLast) {
    const res = pane.querySelector('#tk-q-res');
    res.innerHTML = `✓ Logged: ${tkQuickItems(tkQuickLast.entries)}${tkQuickLast.problems.length ? `<span class="tk-q-bad">Skipped: ${tkQuickLast.problems.map(tkEsc).join(', ')}</span>` : ''} <button class="ctl" id="tk-q-undo">↶ Undo</button>`;
    res.querySelector('#tk-q-undo').onclick = async () => {
      if (!confirm(`Undo "${tkQuickLast.text}"?`)) return;
      for (const e of tkQuickLast.entries) await tkDelete(e.id);
      tkQuickLast = null; tkRenderQuick();
    };
  }
}

// ================= Log
function tkRenderLog() {
  const pane = document.getElementById('tk-log');
  const date = tkLogDate || tk.today;
  pane.innerHTML = `<div class="tk-bar-row">Logging for <input type="date" id="tk-date" value="${date}">
    <button class="ctl" data-d="0">Today</button><button class="ctl" data-d="-1">Yesterday</button>
    <span class="tk-hint">${date === tk.today ? 'Today runs until 4am, like your calendar tracker.' : 'You are logging for an earlier day.'}</span>${tkHiddenBox()}</div>`;
  tkWireHiddenBox(pane, tkRenderLog);
  pane.querySelector('#tk-date').onchange = (e) => { tkLogDate = e.target.value || tk.today; tkRenderLog(); };
  pane.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { tkLogDate = tkAdd(tk.today, +b.dataset.d); tkRenderLog(); });
  tkKeySection(pane, m => tkLogCard(m, date), tkRenderLog);
  for (const [group, list] of tkGroups(tkShown().filter(m => !m.hidden && !m.starred))) {
    const h = document.createElement('h3'); h.className = 'tk-group'; h.textContent = group; h.style.color = TK_COLORS[group] || TK_COLORS.Other; tkDragGroup(h, group, tkRenderLog);
    const grid = document.createElement('div'); grid.className = 'tk-grid';
    list.forEach(m => grid.appendChild(tkHideable(tkLogCard(m, date), m, tkRenderLog)));
    pane.append(h, grid);
  }
  // the day's entries, newest first, each removable
  const day = tk.entries.filter(e => e.date === date && tkVisible().some(m => m.id === e.metric)).sort((a, b) => b.at - a.at);
  const box = document.createElement('div'); box.className = 'tk-daylog';
  box.innerHTML = `<h3 class="tk-group">Entries for ${tkD(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</h3>`;
  if (!day.length) box.innerHTML += '<p class="trk-empty">Nothing logged yet.</p>';
  day.forEach(e => {
    const m = tk.metrics.find(x => x.id === e.metric);
    const row = document.createElement('div'); row.className = 'tk-entry';
    const t = e.source === 'import' ? 'imported' : new Date(e.at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    row.innerHTML = `<span class="tk-entry-time"></span><span class="tk-entry-what"></span><span class="tk-entry-val"></span><span class="tk-entry-note"></span><button title="Remove this entry">✕</button>`;
    row.children[0].textContent = t; row.children[1].textContent = `${m.emoji} ${m.name}`;
    row.children[2].textContent = tkFmt(m, e.value); row.children[3].textContent = e.note || '';
    row.querySelector('button').onclick = async () => { if (!confirm(`Remove ${m.name} ${tkFmt(m, e.value)}${e.note ? ' (' + e.note + ')' : ''}?`)) return; await tkDelete(e.id); tkRenderLog(); };
    box.appendChild(row);
  });
  pane.appendChild(box);
  tkHiddenSection(pane, tkShown().filter(m => m.hidden), m => tkLogCard(m, date), tkRenderLog);
}

function tkLogCard(m, date) {
  const card = document.createElement('div'); card.className = 'tk-card' + (m.color ? ' tk-tinted' : ''); card.style.setProperty('--c', tkColor(m));
  card.dataset.metric = m.id;   // the voice bar's "tracker tab <metric>" scrolls here
  const v = tkDayValue(m, date), td = tkTarget(m, 'd');
  const g = m.defaultPeriod;
  const goal = m.goal != null ? `goal ${tkFmt(m, m.goal)}` : '';
  const periods = ['w', 'm'].filter(k => k === g || (m.targets || {})[k] != null)
    .map(k => `${k === 'w' ? 'Week' : 'Month'}: ${tkFmt(m, tkPeriodValue(m, tkPeriodStart(date, k), k, date))}${tkTarget(m, k) ? ' / ' + tkFmt(m, tkTarget(m, k)) : ''}`);
  card.innerHTML = `<div class="tk-card-top"><span class="tk-emo">${tkEsc(m.emoji)}</span><span class="tk-name">${tkEsc(m.name)}</span>
      <span class="tk-val">${tkFmt(m, v)}${td && m.type !== 'weight' ? ' / ' + tkFmt(m, td) : ''}</span></div>
    <div class="tk-pbar"><div class="tk-pfill ${tkStatusClass(m, v, td)}" style="width:${Math.min(100, tkPct(m, v || 0, td) * 100)}%"></div></div>
    <div class="tk-sub">${periods.concat(goal ? [goal] : []).join(' · ')}</div>
    <div class="tk-ctrl"></div>`;
  const ctrl = card.querySelector('.tk-ctrl');
  const log = async (val, note) => { try { await tkLog(m.id, val, date, note); tkRenderLog(); } catch (e) { alert(e.message); } };
  if (m.type === 'rating') {
    for (let i = 1; i <= 10; i++) { const b = document.createElement('button'); b.className = 'tk-rate' + (v === i ? ' on' : ''); b.textContent = i; b.onclick = () => log(i); ctrl.appendChild(b); }
  } else if (m.type === 'yesno') {
    const b = document.createElement('button'); b.className = 'ctl tk-yes' + (v ? ' on' : ''); b.textContent = v ? '✓ Done' : 'Mark done';
    b.onclick = async () => { if (v) { for (const e of tk.byDay.get(m.id + '|' + date) || []) await tkDelete(e.id); tkRenderLog(); } else log(1); };
    ctrl.appendChild(b);
  } else {
    (m.quick || []).forEach(q => { const b = document.createElement('button'); b.className = 'ctl'; b.textContent = '+' + q; b.onclick = () => log(q); ctrl.appendChild(b); });
    const inp = document.createElement('input'); inp.type = 'number'; inp.step = m.type === 'weight' ? '0.1' : 'any'; inp.className = 'tk-num';
    inp.placeholder = m.type === 'weight' ? 'kg' : m.type === 'money' ? '$' : m.unit || 'amount';
    const note = document.createElement('input'); note.type = 'text'; note.className = 'tk-note'; note.placeholder = m.type === 'money' ? 'who / what' : 'note';
    const add = document.createElement('button'); add.className = 'ctl'; add.textContent = m.type === 'weight' ? 'Log' : 'Add';
    const go = () => { const n = parseFloat(inp.value); if (!isNaN(n)) log(n, note.value.trim()); };
    add.onclick = go;
    [inp, note].forEach(el => el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') go(); }));
    ctrl.append(inp);
    if (m.type === 'money' || m.type === 'count') ctrl.append(note);
    ctrl.append(add);
    const mine = (tk.byDay.get(m.id + '|' + date) || []).filter(e => e.source !== 'import');
    if (mine.length) { const u = document.createElement('button'); u.className = 'ctl tk-undo'; u.title = 'Undo the last entry'; u.textContent = '↶'; u.onclick = async () => { const last = mine.sort((a, b) => a.at - b.at)[mine.length - 1]; if (!confirm(`Undo ${m.name} ${tkFmt(m, last.value)}${last.note ? ' (' + last.note + ')' : ''}?`)) return; await tkDelete(last.id); tkRenderLog(); }; ctrl.append(u); }
  }
  return card;
}

// ---- right-click a card -> 🎯 Set target: set its daily / weekly / monthly targets in place (blank = none; an empty week / month falls back to the daily one scaled up)
function tkTargetEditor(card, m, rerender) {
  const open = card.querySelector('.tk-tgt-edit');
  if (open) { open.remove(); return; }
  const t = m.targets || {};
  const auto = (k) => { const v = tkTarget({ ...m, targets: { d: t.d } }, k); return k !== 'd' && v != null ? 'auto ' + tkFmt(m, v) : 'none'; };
  const box = document.createElement('div'); box.className = 'tk-tgt-edit';
  box.innerHTML = ['d', 'w', 'm'].map(k => `<label>${{ d: 'Daily', w: 'Weekly', m: 'Monthly' }[k]}<input type="number" step="any" data-k="${k}" value="${t[k] == null ? '' : t[k]}" placeholder="${auto(k)}"></label>`).join('') +
    `<label>Show by<select data-k="p">${['d', 'w', 'm'].map(k => `<option value="${k}"${m.defaultPeriod === k ? ' selected' : ''}>${{ d: 'Day', w: 'Week', m: 'Month' }[k]}</option>`).join('')}</select></label>` +
    `<label>Colour<span class="tk-col-row"><input type="color" data-c="1" value="${m.color || tkColor(m)}"><button class="ctl" data-a="nocol" title="Back to the group's colour">✕</button></span></label>` +
    '<div class="tk-tgt-btns"><button class="ctl" data-a="save">Save</button><button class="ctl" data-a="cancel">Cancel</button></div>';
  let color = m.color || '';
  box.querySelector('[data-c]').oninput = (e) => { color = e.target.value; };
  box.querySelector('[data-a="nocol"]').onclick = () => { color = ''; box.querySelector('[data-c]').value = TK_COLORS[m.group] || TK_COLORS.Other; };
  const save = async () => {
    const targets = {};
    box.querySelectorAll('input[data-k]').forEach(i => { const v = parseFloat(i.value); if (i.value.trim() !== '' && !isNaN(v)) targets[i.dataset.k] = v; });
    try { await tkSaveMetric({ ...m, targets, defaultPeriod: box.querySelector('select').value, color }); rerender(); } catch (err) { alert(err.message); }
  };
  box.querySelectorAll('input, select').forEach(el => el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') save(); if (e.key === 'Escape') box.remove(); }));
  box.querySelector('[data-a="save"]').onclick = save;
  box.querySelector('[data-a="cancel"]').onclick = () => box.remove();
  box.onclick = (e) => e.stopPropagation();
  card.appendChild(box);
  box.querySelector('input').focus();
}

// ================= Dashboard
function tkRenderDash() {
  const pane = document.getElementById('tk-dash');
  const mode = tkPref('dashMode', 'default');
  pane.innerHTML = `<div class="tk-bar-row">Show each tracker by:
    ${['default', 'd', 'w', 'm'].map(k => `<button class="ctl tk-seg${mode === k ? ' on' : ''}" data-mode="${k}">${{ default: 'Its default', d: 'Day', w: 'Week', m: 'Month' }[k]}</button>`).join('')}
    <span class="tk-hint">Click a tracker to see its chart.</span>${tkHiddenBox()}</div>`;
  tkWireHiddenBox(pane, tkRenderDash);
  pane.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { tkSetPref('dashMode', b.dataset.mode); tkRenderDash(); });
  pane.appendChild(tkSalesSummary());
  const dashCard = (m) => tkDashCard(m, tkCardPeriod(m));   // each card's own period (right-click -> Show by), else the bar above
  tkKeySection(pane, dashCard, tkRenderDash);
  for (const [group, list] of tkGroups(tkShown().filter(m => !m.hidden && !m.starred))) {
    const h = document.createElement('h3'); h.className = 'tk-group'; h.textContent = group; h.style.color = TK_COLORS[group] || TK_COLORS.Other; tkDragGroup(h, group, tkRenderDash);
    const grid = document.createElement('div'); grid.className = 'tk-grid';
    list.forEach(m => grid.appendChild(tkHideable(dashCard(m), m, tkRenderDash)));
    pane.append(h, grid);
  }
  tkHiddenSection(pane, tkShown().filter(m => m.hidden), dashCard, tkRenderDash);
}

function tkDashCard(m, g) {
  const today = tk.today, start = tkPeriodStart(today, g);
  const v = tkPeriodValue(m, start, g, today), t = tkTarget(m, g);
  const prevStart = tkPrevPeriod(start, g);
  const prevSame = tkPeriodValue(m, prevStart, g, g === 'd' ? null : tkAdd(prevStart, Math.round((tkD(today) - tkD(start)) / 86400000)));   // last period up to the same point
  const color = tkColor(m), cls = tkStatusClass(m, v, t);
  let ringPct = t ? (v || 0) / t : 0, ringLab = t ? Math.round(ringPct * 100) + '%' : '';
  if (m.type === 'weight' && m.goal != null) { ringPct = 0; ringLab = v != null ? (v - m.goal > 0 ? '−' + (v - m.goal).toFixed(1) : '✓') : ''; }
  const label = m.rolling ? `${m.rolling}-day average` : { d: '(day)', w: '(week)', m: '(month)' }[g];
  let note = '';
  if (t && g !== 'd' && m.direction !== 'limit' && (m.agg === 'sum' || m.agg === 'any')) {
    const exp = Math.round(t * tkElapsed(g, today)); const diff = (v || 0) - exp;
    note = diff >= 0 ? `${tkFmt(m, diff)} ahead of pace` : `${tkFmt(m, -diff)} behind pace`;
  }
  let delta = '';
  if (v != null && prevSame != null && prevSame !== 0) {
    const pc = Math.round(((v - prevSame) / Math.abs(prevSame)) * 100);
    const good = m.direction === 'up' ? pc >= 0 : pc <= 0;
    delta = `<span class="tk-delta ${good ? 'good' : 'bad'}">${pc >= 0 ? '▲' : '▼'} ${Math.abs(pc)}%</span> vs last ${{ d: 'day', w: 'week', m: 'month' }[g]}`;
  }
  const spark = [];
  for (let s = start, i = 0; i < 8; i++, s = tkPrevPeriod(s, g)) spark.unshift(tkPeriodValue(m, s, g, s === start ? today : null));
  const card = document.createElement('div'); card.className = 'tk-card tk-dash-card' + (m.color ? ' tk-tinted' : ''); card.style.setProperty('--c', color);
  card.dataset.metric = m.id; card.dataset.period = g;   // read by tracker-hover.js (the chart that pops up after resting the mouse on a card)
  card.innerHTML = `<div class="tk-dash-main"><div>
      <div class="tk-card-top"><span class="tk-emo">${tkEsc(m.emoji)}</span><span class="tk-name">${tkEsc(m.name)}</span></div>
      <div class="tk-big ${cls}">${tkFmt(m, v)}<small>${t && m.type !== 'weight' ? ' / ' + tkFmt(m, t) : m.goal != null ? ' → ' + tkFmt(m, m.goal) : ''}</small></div>
      <div class="tk-sub">${label}${m.rolling && tkLatest(m, today) != null ? ' · latest ' + tkFmt(m, tkLatest(m, today)) : ''}${note ? ' · <span class="' + (note.includes('behind') ? 'tk-behind' : '') + '">' + note + '</span>' : ''}</div>
      <div class="tk-sub">${delta}</div></div>
      ${t || m.goal != null ? tkRing(ringPct, cls === 'over' ? '#dc2626' : cls === 'done' ? '#16a34a' : color, ringLab) : ''}</div>
    ${tkSpark(spark, color)}`;
  card.onclick = (e) => { if (e.target.closest('.tk-tgt-edit')) return; tkSetPref('chartMetric', m.id); tkSetPref('chartG', g === 'd' ? 'd' : g); tkShow('charts'); };
  return card;
}

// this month's sales in one box: calls, closes, close rate, how the closes came, revenue and commissions
function tkSalesSummary() {
  const get = (id) => tk.metrics.find(m => m.id === id);
  const start = tkMonthStart(tk.today), val = (id) => { const m = get(id); return m ? tkPeriodValue(m, start, 'm', tk.today) || 0 : 0; };
  const taken = val('calls_taken'), closed = val('calls_closed'), one = val('one_call_closes'), fu = val('followup_conversions');
  const box = document.createElement('div'); box.className = 'tk-summary';
  const cell = (k, v) => `<div><div class="tk-sum-k">${k}</div><div class="tk-sum-v">${v}</div></div>`;
  box.innerHTML = `<h3 class="tk-group" style="color:${TK_COLORS.Sales}">Sales pulse <small>This month</small></h3><div class="tk-sum-grid">` +
    cell('Calls taken', taken) + cell('Closed', closed) + cell('Close rate', taken ? Math.round(closed / taken * 100) + '%' : '—') +
    cell('1-call closes', one + (one + fu ? ` <small>(${Math.round(one / (one + fu) * 100)}%)</small>` : '')) +
    cell('Follow-up conversions', fu + (one + fu ? ` <small>(${Math.round(fu / (one + fu) * 100)}%)</small>` : '')) +
    cell('Deposits', val('deposits')) + cell('Revenue', '$' + Math.round(val('revenue')).toLocaleString()) + cell('Commissions', '$' + Math.round(val('commissions')).toLocaleString()) + cell('Cash collected', '$' + Math.round(val('cash_sales')).toLocaleString()) + '</div>';
  return box;
}

// ================= Charts & compare
const TK_RANGES = { '7': 'Last 7 days', '30': 'Last 30 days', '90': 'Last 90 days', week: 'This week', month: 'This month', lastmonth: 'Last month', year: 'This year', custom: 'Custom' };
function tkRange(key, today) {
  if (key === 'week') return [tkMonday(today), today];
  if (key === 'month') return [tkMonthStart(today), today];
  if (key === 'lastmonth') { const s = tkMonthStart(tkAdd(tkMonthStart(today), -1)); return [s, tkMonthEnd(s)]; }
  if (key === 'year') return [today.slice(0, 4) + '-01-01', today];
  if (key === 'custom') return [tkPref('from', tkAdd(today, -29)), tkPref('to', today)];
  return [tkAdd(today, -(+key - 1)), today];
}
function tkCompareRange(mode, from, to) {
  const len = Math.round((tkD(to) - tkD(from)) / 86400000);
  if (mode === 'prev') {
    if (from === tkMonthStart(from) && (to === tkMonthEnd(to) || to === tk.today) && from.slice(0, 7) === to.slice(0, 7)) { const s = tkMonthStart(tkAdd(from, -1)); return [s, tkMonthEnd(s)]; }
    return [tkAdd(from, -len - 1), tkAdd(from, -1)];
  }
  if (mode === 'year') return [String(+from.slice(0, 4) - 1) + from.slice(4), String(+to.slice(0, 4) - 1) + to.slice(4)];
  if (mode === 'custom') { const cf = tkPref('cfrom', tkAdd(from, -len - 1)); return [cf, tkAdd(cf, len)]; }
  return null;
}

function tkRenderCharts() {
  const pane = document.getElementById('tk-charts');
  const vis = tkVisible();
  const mid = vis.some(m => m.id === tkPref('chartMetric', '')) ? tkPref('chartMetric', '') : (vis[0] && vis[0].id);
  const m = vis.find(x => x.id === mid);
  if (!m) { pane.innerHTML = '<p class="trk-empty">No trackers yet.</p>'; return; }
  const g = tkPref('chartG', m.defaultPeriod), type = tkPref('chartType-' + m.id, m.chart), rk = tkPref('range', '30'), cmpMode = tkPref('cmp', 'none');
  const [from, to] = tkRange(rk, tk.today);
  pane.innerHTML = `<div class="tk-bar-row tk-chart-controls">
      <select id="tk-metric">${[...tkGroups(vis)].map(([grp, list]) => `<optgroup label="${tkEsc(grp)}">${list.map(x => `<option value="${x.id}"${x.id === m.id ? ' selected' : ''}>${tkEsc(x.emoji + ' ' + x.name)}</option>`).join('')}</optgroup>`).join('')}</select>
      ${['d', 'w', 'm'].map(k => `<button class="ctl tk-seg${g === k ? ' on' : ''}" data-g="${k}">${{ d: 'Daily', w: 'Weekly', m: 'Monthly' }[k]}</button>`).join('')}
      ${['bar', 'line'].map(k => `<button class="ctl tk-seg${type === k ? ' on' : ''}" data-type="${k}">${k === 'bar' ? '▮ Bars' : '⟋ Line'}</button>`).join('')}
    </div>
    <div class="tk-bar-row">Dates <select id="tk-range">${Object.entries(TK_RANGES).map(([k, l]) => `<option value="${k}"${k === rk ? ' selected' : ''}>${l}</option>`).join('')}</select>
      <span id="tk-custom" style="${rk === 'custom' ? '' : 'display:none'}"><input type="date" id="tk-from" value="${from}"> to <input type="date" id="tk-to" value="${to}"></span>
      &nbsp; Compare with <select id="tk-cmp">${Object.entries({ none: 'Nothing', prev: 'The period before', year: 'Same dates last year', custom: 'Dates starting…' }).map(([k, l]) => `<option value="${k}"${k === cmpMode ? ' selected' : ''}>${l}</option>`).join('')}</select>
      <span id="tk-cmp-custom" style="${cmpMode === 'custom' ? '' : 'display:none'}"><input type="date" id="tk-cfrom" value="${tkPref('cfrom', tkAdd(from, -30))}"></span></div>
    <div id="tk-stats" class="tk-sum-grid"></div><div id="tk-chart-box" class="tk-chart-box"></div><div id="tk-legend" class="tk-hint"></div>
    <h3 class="tk-group">Day by day</h3><div id="tk-heat"></div>
    <h3 class="tk-group">Notes</h3><div id="tk-notes"></div>`;
  pane.querySelector('#tk-metric').onchange = (e) => { tkSetPref('chartMetric', e.target.value); tkRenderCharts(); };
  pane.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { tkSetPref('chartG', b.dataset.g); tkRenderCharts(); });
  pane.querySelectorAll('[data-type]').forEach(b => b.onclick = () => { tkSetPref('chartType-' + m.id, b.dataset.type); tkRenderCharts(); });
  pane.querySelector('#tk-range').onchange = (e) => { tkSetPref('range', e.target.value); tkRenderCharts(); };
  pane.querySelector('#tk-cmp').onchange = (e) => { tkSetPref('cmp', e.target.value); tkRenderCharts(); };
  ['from', 'to', 'cfrom'].forEach(k => { const el = pane.querySelector('#tk-' + k); if (el) el.onchange = () => { tkSetPref(k, el.value); tkRenderCharts(); }; });

  const series = tkSeries(m, from, to, g);
  const cr = tkCompareRange(cmpMode, from, to);
  const cmp = cr ? tkSeries(m, cr[0], cr[1], g) : null;
  const fmt = (v) => tkFmt(m, v);
  const axisFmt = (v) => (m.type === 'money' ? '$' : '') + (Math.abs(v) >= 10000 ? Math.round(v / 1000) + 'k' : Math.abs(v) >= 1000 ? (Math.round(v / 100) / 10) + 'k' : Math.round(v * 10) / 10);
  pane.querySelector('#tk-chart-box').innerHTML = tkChart(series, { type, target: tkTarget(m, g), fmt, axisFmt, color: tkColor(m), compare: cmp, integer: !['weight', 'rating'].includes(m.type) });
  pane.querySelector('#tk-legend').textContent = cr ? `Solid: ${from} to ${to}.  Faint: ${cr[0]} to ${cr[1]}.` : '';
  // the numbers under the chart
  const summed = m.agg === 'sum' || m.agg === 'any';
  const total = (arr) => { const v = arr.map(p => p.value).filter(x => x != null); if (!v.length) return null; return summed ? v.reduce((a, b) => a + b, 0) : v.reduce((a, b) => a + b, 0) / v.length; };
  const tA = total(series), tB = cmp ? total(cmp) : null, t = tkTarget(m, g);
  const logged = series.filter(p => p.value != null);
  const high = m.direction !== 'down';   // "best" = highest, or lowest for weight-style trackers; for a limit (calories) show the highest instead
  const best = logged.length ? logged.reduce((a, b) => (high ? b.value > a.value : b.value < a.value) ? b : a) : null;
  const hit = t ? logged.filter(p => tkStatusClass(m, p.value, t) === 'done' || (m.direction === 'limit' && p.value <= t)).length : null;
  const cell = (k, v) => `<div><div class="tk-sum-k">${k}</div><div class="tk-sum-v">${v}</div></div>`;
  let change = '—';
  if (tA != null && tB) { const pc = Math.round((tA - tB) / Math.abs(tB) * 100); change = `<span class="tk-delta ${(m.direction === 'up') === (pc >= 0) ? 'good' : 'bad'}">${pc >= 0 ? '▲' : '▼'} ${Math.abs(pc)}%</span>`; }
  pane.querySelector('#tk-stats').innerHTML = cell(summed ? 'Total' : 'Average', fmt(tA)) +
    cell(`Average per ${{ d: 'day', w: 'week', m: 'month' }[g]}`, logged.length ? `${fmt(logged.reduce((a, b) => a + b.value, 0) / logged.length)} <small>${logged.length} logged</small>` : '—') +
    cell(m.direction === 'limit' ? 'Highest' : 'Best', best ? `${fmt(best.value)} <small>${best.label}</small>` : '—') +
    cell('Target hit', t ? `${hit} of ${series.length}` : '—') + (cr ? cell('Compared', fmt(tB)) + cell('Change', change) : '');
  // heat-map of the days (daily values, coloured against the daily target or the best day)
  const days = [];
  for (let s = from; s <= to && days.length < 400; s = tkAdd(s, 1)) days.push({ date: s, value: tkDayValue(m, s) });
  const scale = tkTarget(m, 'd') || Math.max(1, ...days.map(d => d.value || 0));
  pane.querySelector('#tk-heat').innerHTML = tkHeatmap(days, scale, tkColor(m));
  // every note you wrote on this tracker in the chosen dates (and in the compared dates), newest first; the automatic notes ("from the calendar tracker", "from the sales sheet") are left out
  const notesIn = (a, b) => tk.entries.filter(e => e.metric === m.id && e.note && e.source !== 'import' && e.source !== 'sheet' && e.date >= a && e.date <= b).sort((x, y) => y.date.localeCompare(x.date) || y.at - x.at);
  const noteRows = (list) => list.map(e => `<div class="tk-note-row"><span class="tk-note-date">${tkEsc(tkD(e.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }))}</span><b>${tkEsc(tkFmt(m, e.value))}</b><span>${tkEsc(e.note)}</span></div>`).join('');
  const mine = notesIn(from, to), other = cr ? notesIn(cr[0], cr[1]) : [];
  pane.querySelector('#tk-notes').innerHTML = (mine.length ? noteRows(mine) : '<p class="trk-empty">No notes on this tracker in these dates. Add one when you log it (right-click a card → Log → note).</p>') +
    (cr ? `<h4 class="tk-note-sub">Compared dates (${cr[0]} to ${cr[1]})</h4>` + (other.length ? noteRows(other) : '<p class="trk-empty">No notes.</p>') : '');
}

// ================= Trackers (add / edit)
function tkRenderManage() {
  const pane = document.getElementById('tk-manage');
  const showArchived = tkPref('showArchived', '0') === '1';
  pane.innerHTML = `<div class="tk-bar-row"><button class="ctl" id="tk-new">+ New tracker</button>
    <label class="kind-box"><input type="checkbox" id="tk-arch"${showArchived ? ' checked' : ''}> Show hidden trackers</label>
    <span class="tk-hint">Targets are optional: set any of day / week / month. A week with only a daily target uses 7× it.</span></div>
    <div class="tk-table-wrap"><table class="tk-table"><thead><tr><th></th><th>Name</th><th>Kind</th><th>Unit</th><th>Better when</th><th>Day</th><th>Week</th><th>Month</th><th>Goal</th><th>Show by</th><th>Chart</th><th>Quick buttons</th><th>Group</th><th>Private</th><th></th></tr></thead><tbody></tbody></table></div>`;
  pane.querySelector('#tk-arch').onchange = (e) => { tkSetPref('showArchived', e.target.checked ? '1' : '0'); tkRenderManage(); };
  pane.querySelector('#tk-new').onclick = () => tkEditRow(pane.querySelector('tbody'), { id: '', name: '', emoji: '📊', type: 'count', unit: '', direction: 'up', targets: {}, goal: null, defaultPeriod: 'd', chart: 'bar', quick: [1], group: 'Other', private: false }, true);
  const body = pane.querySelector('tbody');
  tk.metrics.filter(m => showArchived || !m.archived).forEach(m => tkEditRow(body, m, false));
}

function tkEditRow(body, m, isNew) {
  const tr = document.createElement('tr'); if (m.archived) tr.className = 'tk-archived';
  const sel = (name, opts, val) => `<select data-k="${name}">${Object.entries(opts).map(([k, l]) => `<option value="${k}"${k === val ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  const num = (k, v) => `<input data-k="${k}" type="number" step="any" value="${v == null ? '' : v}">`;
  tr.innerHTML = `<td><input data-k="emoji" class="tk-emoji-in" value="${tkEsc(m.emoji || '')}"></td><td><input data-k="name" value="${tkEsc(m.name)}" placeholder="New tracker"></td>
    <td>${sel('type', { count: 'Count', minutes: 'Minutes', amount: 'Amount', money: 'Money $', rating: 'Rating 1–10', yesno: 'Yes / no', weight: 'Weight' }, m.type)}</td>
    <td><input data-k="unit" value="${tkEsc(m.unit || '')}" class="tk-short"></td>
    <td>${sel('direction', { up: 'Higher', down: 'Lower', limit: 'Under a limit' }, m.direction)}</td>
    <td>${num('t_d', m.targets && m.targets.d)}</td><td>${num('t_w', m.targets && m.targets.w)}</td><td>${num('t_m', m.targets && m.targets.m)}</td><td>${num('goal', m.goal)}</td>
    <td>${sel('defaultPeriod', { d: 'Day', w: 'Week', m: 'Month' }, m.defaultPeriod)}</td><td>${sel('chart', { bar: 'Bars', line: 'Line' }, m.chart)}</td>
    <td><input data-k="quick" value="${(m.quick || []).join(', ')}" class="tk-short" placeholder="1, 5"></td><td><input data-k="group" value="${tkEsc(m.group || 'Other')}" class="tk-short"></td>
    <td><input data-k="private" type="checkbox"${m.private ? ' checked' : ''}></td>
    <td class="tk-row-btns"><button class="ctl" data-act="save">${isNew ? 'Add' : 'Save'}</button>${isNew ? '' : `<button class="ctl" data-act="arch">${m.archived ? 'Show' : 'Hide'}</button>`}</td>`;
  tr.querySelectorAll('input, select').forEach(el => el.addEventListener('keydown', (e) => e.stopPropagation()));
  const read = () => {
    const q = (k) => tr.querySelector(`[data-k="${k}"]`);
    const n = (k) => { const v = q(k).value.trim(); return v === '' ? null : parseFloat(v); };
    const targets = {}; ['d', 'w', 'm'].forEach(k => { const v = n('t_' + k); if (v != null) targets[k] = v; });
    return { ...m, agg: q('type').value === m.type ? m.agg : undefined, emoji: q('emoji').value.trim() || '📊', name: q('name').value.trim(), type: q('type').value, unit: q('unit').value.trim(), direction: q('direction').value,
      targets, goal: n('goal'), defaultPeriod: q('defaultPeriod').value, chart: q('chart').value, group: q('group').value.trim() || 'Other',
      quick: q('quick').value.split(',').map(x => parseFloat(x)).filter(x => !isNaN(x)), private: q('private').checked };
  };
  tr.querySelector('[data-act="save"]').onclick = async (e) => {
    const data = read();
    if (!data.name) { alert('Give the tracker a name.'); return; }
    if (isNew) delete data.id;
    try { await tkSaveMetric(data); e.target.textContent = '✓ Saved'; setTimeout(() => tkRenderManage(), 600); } catch (err) { alert(err.message); }
  };
  const arch = tr.querySelector('[data-act="arch"]');
  if (arch) arch.onclick = async () => { await tkSaveMetric({ ...m, archived: !m.archived }); tkRenderManage(); };
  if (isNew) body.prepend(tr); else body.appendChild(tr);
  if (isNew) tr.querySelector('[data-k="name"]').focus();
}

if (liveStore('appTab') === 'tracker') tkOpen();   // reopened on this tab
demoCheckbox.addEventListener('change', () => { if (tkLoaded) tkShow(tkView); });   // Demo mode hides / shows the private trackers
// the voice bar can open a section of the Tracker ("workouts tab" = Tracker -> Workouts)
window.addEventListener('callstudio:tracker-view', (e) => { if (!e.detail) return; tkView = e.detail; if (tkLoaded) tkShow(tkView); else if (typeof tkOpen === 'function') tkOpen(); });
// "tracker tab <metric>" from the voice bar: open Log, scroll to that metric's box and flash it (a hidden one is shown)
window.addEventListener('callstudio:tracker-focus', async (e) => {
  const id = e.detail; if (!id) return;
  if (!tkLoaded && typeof tkOpen === 'function') await tkOpen();
  // on the Sheet: scroll to that tracker's ROW and flash it; anywhere else: the Log's box
  if (tkView === 'sheet') {
    let row = document.querySelector(`#tk-sheet tr[data-metric="${CSS.escape(id)}"]`);
    if (!row) { tkSetPref('showHidden', '1'); tkShow('sheet'); row = document.querySelector(`#tk-sheet tr[data-metric="${CSS.escape(id)}"]`); }
    if (row) {
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
      row.classList.remove('tk-row-flash');
      setTimeout(() => { row.classList.add('tk-row-flash'); setTimeout(() => row.classList.remove('tk-row-flash'), 4100); }, 380);   // once the scroll has landed
      row.querySelector('td.today input, td input:not([disabled])')?.focus({ preventScroll: true });   // ready to type today's number
      return;
    }
  }
  if (tkView !== 'log') tkShow('log');
  let card = document.querySelector(`#tk-log .tk-card[data-metric="${CSS.escape(id)}"]`);
  if (!card) { tkSetPref('showHidden', '1'); tkShow('log'); card = document.querySelector(`#tk-log .tk-card[data-metric="${CSS.escape(id)}"]`); }
  if (!card) return;
  card.scrollIntoView({ block: 'center', behavior: 'smooth' });
  card.classList.remove('tk-flash');
  setTimeout(() => { card.classList.add('tk-flash'); setTimeout(() => card.classList.remove('tk-flash'), 3500); }, 380);   // once the scroll has landed
});
