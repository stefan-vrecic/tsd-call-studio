// workouts.js -- the Tracker's 🏋️ Workouts section: log what you lifted / did, see it day by day, and track progress per exercise.
// One entry = one exercise on one day: sets × reps at a weight (kg), optional minutes (cardio) and a note. Typing an exercise you've done before
// pre-fills its last sets / reps / weight, so repeating a session is two taps. ↻ on a row logs the same thing again today; ✎ edits; 🗑 deletes.
// Left: the log by day (newest first) with each day's volume. Right: this week's totals and a progress table per exercise (click one for its chart).
// Saved with records.js ("workouts"), so it lives on this Mac like the other business tabs.
// Plain script (not a module): shares one global scope with the other files; it uses tk.today / tkOpen from the tracker files, only at run time.

const wkStore = recStore('workouts', 'wk-status', { entries: [] });
const WK_COMMON = ['Bench press', 'Flat DB press', 'Incline DB press', 'Squat', 'Deadlift', 'Overhead press', 'Pull-ups', 'Weighted pull-up', 'Weighted chin-up', 'Barbell row', 'Dips', 'Lunges', 'Push-ups', 'Neck Curl', 'Plank', 'Running', 'Cycling', 'Walking'];   // suggestions in the Exercise box; anything you type is remembered too
let wkDate = '', wkEditId = null, wkChart = '';   // wkChart = the exercise whose chart is open

const wkNum = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : 0; };
const wkDay = (iso) => new Date(iso + 'T12:00:00');
const wkNice = (iso) => wkDay(iso).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' });
const wkKg = (n) => (Math.round(n * 10) / 10).toLocaleString();
const wkVolume = (e) => wkNum(e.sets) * wkNum(e.reps) * wkNum(e.weight);                                  // kg lifted: sets × reps × weight
const wk1rm = (e) => (wkNum(e.weight) && wkNum(e.reps) ? wkNum(e.weight) * (1 + wkNum(e.reps) / 30) : 0);   // estimated one-rep max (Epley)
const wkKey = (name) => String(name || '').trim().toLowerCase();
const wkToday = () => (typeof tk !== 'undefined' && tk.today) || recToday();
const wkMonday = csWeekStart;   // the week's first day: Sunday (shared.js)

function wkLine(e) {   // "3 × 8 @ 60 kg", "30 min", ...
  const parts = [];
  if (wkNum(e.sets) || wkNum(e.reps)) parts.push(`${wkNum(e.sets) || 1} × ${wkNum(e.reps) || '?'}`);
  if (wkNum(e.weight)) parts.push(`@ ${wkKg(wkNum(e.weight))} kg`);
  if (wkNum(e.minutes)) parts.push(`${wkKg(wkNum(e.minutes))} min`);
  return parts.join(' ') || '—';
}

async function wkOpen() { await wkStore.load(); wkRender(); }
function tkRenderWorkouts() { wkOpen(); }   // called by the tracker's section switcher (tracker-tab.js)

function wkLast(name) {   // the most recent entry of that exercise (entries are stored newest-added first)
  const k = wkKey(name);
  return wkStore.doc.entries.filter(e => wkKey(e.exercise) === k).sort((a, b) => b.date.localeCompare(a.date) || (b.added || 0) - (a.added || 0))[0];
}

function wkSummaries() {
  const map = new Map();
  for (const e of wkStore.doc.entries) {
    const k = wkKey(e.exercise); if (!k) continue;
    if (!map.has(k)) map.set(k, { name: e.exercise.trim(), entries: [] });
    map.get(k).entries.push(e);
  }
  return [...map.values()].map(s => {
    s.entries.sort((a, b) => a.date.localeCompare(b.date) || (a.added || 0) - (b.added || 0));
    const dates = [...new Set(s.entries.map(e => e.date))];
    const byDate = dates.map(d => { const es = s.entries.filter(e => e.date === d); return { date: d, top: Math.max(...es.map(wk1rm), 0), heavy: Math.max(...es.map(e => wkNum(e.weight)), 0), vol: es.reduce((t, e) => t + wkVolume(e), 0), minutes: es.reduce((t, e) => t + wkNum(e.minutes), 0) }; });
    const best = s.entries.reduce((b, e) => (wk1rm(e) > wk1rm(b) ? e : b), s.entries[0]);
    return { ...s, dates, byDate, last: s.entries[s.entries.length - 1], best, sessions: dates.length };
  }).sort((a, b) => b.last.date.localeCompare(a.last.date));
}

function wkChartSvg(s) {   // estimated 1RM per session; for exercises without a weight, the minutes per session
  const useMin = !s.byDate.some(p => p.top);
  const pts = s.byDate.slice(-14).map(p => ({ d: p.date, v: useMin ? p.minutes : p.top }));
  if (pts.length < 2) return '<p class="wk-note">Log this exercise on at least two days to see a chart.</p>';
  const W = 320, H = 96, pad = 6, max = Math.max(...pts.map(p => p.v)), min = Math.min(...pts.map(p => p.v)), span = max - min || 1;
  const x = (i) => pad + (i * (W - 2 * pad)) / (pts.length - 1), y = (v) => H - pad - ((v - min) / span) * (H - 2 * pad);
  const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const gain = pts[pts.length - 1].v - pts[0].v;
  return `<svg class="wk-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Progress chart"><polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="3.5" fill="var(--accent)"><title>${wkNice(p.d)}: ${wkKg(p.v)}${useMin ? ' min' : ' kg est. 1RM'}</title></circle>`).join('')}</svg>
    <p class="wk-note">${useMin ? 'Minutes' : 'Estimated 1RM'} per session, ${wkNice(pts[0].d)} → ${wkNice(pts[pts.length - 1].d)}: <b>${gain >= 0 ? '+' : ''}${wkKg(gain)}${useMin ? ' min' : ' kg'}</b></p>`;
}

function wkRender() {
  const pane = document.getElementById('tk-workouts');
  const d = wkStore.doc, today = wkToday();
  if (!wkDate) wkDate = today;
  const edit = wkEditId && d.entries.find(e => e.id === wkEditId);
  const names = [...new Set([...d.entries.map(e => e.exercise.trim()), ...WK_COMMON])];
  const f = edit || { exercise: '', sets: '', reps: '', weight: '', minutes: '', note: '' };
  if (edit) wkDate = edit.date;

  // this week
  const monday = wkMonday(today), weekEntries = d.entries.filter(e => e.date >= monday && e.date <= today);
  const weekDays = new Set(weekEntries.map(e => e.date)).size, weekSets = weekEntries.reduce((t, e) => t + (wkNum(e.sets) || 1), 0), weekVol = weekEntries.reduce((t, e) => t + wkVolume(e), 0);

  // log grouped by day
  const days = [...new Set(d.entries.map(e => e.date))].sort().reverse();
  const logHtml = days.length ? days.map(day => {
    const es = d.entries.filter(e => e.date === day).sort((a, b) => (a.added || 0) - (b.added || 0));
    const vol = es.reduce((t, e) => t + wkVolume(e), 0);
    return `<section class="wk-day"><h4>${recEsc(wkNice(day))}${day === today ? ' <i>today</i>' : ''}<span>${es.length} exercise${es.length === 1 ? '' : 's'}${vol ? ' · ' + wkKg(vol) + ' kg volume' : ''}</span></h4>
      ${es.map(e => `<div class="wk-row${e.id === wkEditId ? ' editing' : ''}" data-id="${e.id}"><div class="wk-main"><b>${recEsc(e.exercise)}</b><span>${recEsc(wkLine(e))}</span>${e.note ? `<em>${recEsc(e.note)}</em>` : ''}</div>
        <button class="wk-btn" data-act="again" title="Log this again, dated ${recEsc(wkNice(wkDate === day ? today : wkDate))}">↻</button><button class="wk-btn" data-act="edit" title="Edit">✎</button><button class="wk-btn" data-act="del" title="Delete">🗑</button></div>`).join('')}</section>`;
  }).join('') : '<p class="wk-note">No workouts logged yet. Add your first exercise above.</p>';

  // progress per exercise
  const sums = wkSummaries();
  const progHtml = sums.length ? `<table class="wk-table"><thead><tr><th>Exercise</th><th>Last</th><th>Best</th><th>Sessions</th></tr></thead><tbody>${sums.map(s => {
    const hasW = wkNum(s.best.weight) > 0;
    return `<tr class="wk-sum${wkChart === wkKey(s.name) ? ' open' : ''}" data-k="${recEsc(wkKey(s.name))}"><td><b>${recEsc(s.name)}</b></td><td>${recEsc(wkLine(s.last))}<small>${recEsc(wkNice(s.last.date))}</small></td>
      <td>${hasW ? `${recEsc(wkLine({ sets: 1, reps: s.best.reps, weight: s.best.weight }))}<small>est. 1RM ${wkKg(wk1rm(s.best))} kg</small>` : recEsc(wkLine(s.last))}</td><td>${s.sessions}</td></tr>${wkChart === wkKey(s.name) ? `<tr class="wk-chartrow"><td colspan="4">${wkChartSvg(s)}</td></tr>` : ''}`;
  }).join('')}</tbody></table>` : '<p class="wk-note">Progress per exercise shows up here once you have logged some.</p>';

  pane.innerHTML = `<div class="wk-head"><h3>🏋️ Workouts <span class="ci-status" id="wk-status"></span></h3></div>
    <form class="wk-form"><label class="wk-f wk-f-date">Day<input type="date" name="date" value="${wkDate}" required></label>
      <label class="wk-f wk-f-ex">Exercise<input name="exercise" list="wk-names" placeholder="e.g. Bench press" value="${recEsc(f.exercise)}" required autocomplete="off"></label>
      <label class="wk-f wk-f-n">Sets<input name="sets" inputmode="numeric" placeholder="3" value="${recEsc(f.sets)}"></label>
      <label class="wk-f wk-f-n">Reps<input name="reps" inputmode="numeric" placeholder="8" value="${recEsc(f.reps)}"></label>
      <label class="wk-f wk-f-n">kg<input name="weight" inputmode="decimal" placeholder="60" value="${recEsc(f.weight)}"></label>
      <label class="wk-f wk-f-n">Min<input name="minutes" inputmode="numeric" placeholder="—" value="${recEsc(f.minutes)}"></label>
      <label class="wk-f wk-f-note">Note<input name="note" placeholder="optional" value="${recEsc(f.note)}"></label>
      <button class="ctl wk-submit">${edit ? 'Save changes' : '＋ Add'}</button>${edit ? '<button type="button" class="ctl wk-cancel">Cancel</button>' : ''}
      <datalist id="wk-names">${names.map(n => `<option value="${recEsc(n)}">`).join('')}</datalist></form>
    <div class="wk-cols"><div class="wk-log">${logHtml}</div>
      <aside class="wk-side"><div class="wk-week"><div><b>${weekDays}</b><span>days trained this week</span></div><div><b>${weekSets}</b><span>sets</span></div><div><b>${weekVol ? wkKg(weekVol) : 0}</b><span>kg volume</span></div></div>
        <h4>Progress</h4>${progHtml}</aside></div>`;

  const form = pane.querySelector('.wk-form');
  form.date.onchange = () => { if (form.date.value) wkDate = form.date.value; };
  form.exercise.addEventListener('change', () => {   // an exercise you've done before: bring back what you did last time
    if (wkEditId) return;
    const last = wkLast(form.exercise.value);
    if (last && !form.sets.value && !form.reps.value && !form.weight.value && !form.minutes.value) { form.sets.value = last.sets || ''; form.reps.value = last.reps || ''; form.weight.value = last.weight || ''; form.minutes.value = last.minutes || ''; }
  });
  form.onsubmit = (ev) => {
    ev.preventDefault();
    const row = { date: form.date.value || wkDate, exercise: form.exercise.value.trim(), sets: form.sets.value.trim(), reps: form.reps.value.trim(), weight: form.weight.value.trim(), minutes: form.minutes.value.trim(), note: form.note.value.trim() };
    if (!row.exercise) return;
    if (edit) Object.assign(edit, row); else d.entries.unshift({ id: recId(), ...row, added: Date.now() });
    wkDate = row.date; wkEditId = null; wkStore.save(); wkRender();
    pane.querySelector('[name=exercise]').focus();   // ready for the next one
  };
  const cancel = pane.querySelector('.wk-cancel'); if (cancel) cancel.onclick = () => { wkEditId = null; wkRender(); };
  pane.querySelectorAll('.wk-row .wk-btn').forEach(b => b.onclick = () => {
    const e = d.entries.find(x => x.id === b.closest('.wk-row').dataset.id); if (!e) return;
    if (b.dataset.act === 'edit') { wkEditId = e.id; wkRender(); pane.querySelector('[name=exercise]').focus(); }
    else if (b.dataset.act === 'del') { if (window.confirm(`Delete ${e.exercise} (${wkNice(e.date)})?`)) { d.entries = d.entries.filter(x => x !== e); if (wkEditId === e.id) wkEditId = null; wkStore.save(); wkRender(); } }
    else { d.entries.unshift({ ...e, id: recId(), date: wkDate === e.date ? today : wkDate, added: Date.now() }); wkStore.save(); wkRender(); ctxToast('Logged again'); }
  });
  pane.querySelectorAll('.wk-sum').forEach(r => r.onclick = () => { wkChart = wkChart === r.dataset.k ? '' : r.dataset.k; wkRender(); });
}
