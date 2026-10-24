// tracker-stats.js -- the stats card on the right of the Today tab: the counters in the daily tracker calendar event's title
// ("mCalls 17/90 | dG 0/90 | dC 1633/2400 | ..."), read by cal_day.py and sent along with /api/day-events.
// The d / w / m prefix is the counter's period (day / week / month); week and month counters also show whether they're on pace.
// Plain script (not a module): shares one global scope with the other files; load it before day-plan.js.

const trkBox = document.getElementById('today-stats');
const trkWeightBox = document.getElementById('today-weight');   // body weight gets its own card, right of the tracker

// friendly names for the tracker's short labels (anything else is shown as written, camelCase split into words)
const TRK_NAMES = { calls: 'Calls', g: 'Guitar (mins)', c: 'Calories', cal: 'Calories', cals: 'Calories', affirms: 'Affirmations',
  affirmations: 'Affirmations', 'app.': 'Approaches', app: 'Approaches', a: 'Approaches', churchvisits: 'Church visits', steps: 'Steps' };
const TRK_LIMITS = new Set(['c', 'cal', 'cals', 'calories']);   // a ceiling, not a goal: going over is bad
// Goals set here win over the ones written in the calendar title (the recurring event is risky to edit: an
// "all events" edit wipes every day's numbers). Keyed by period + ":" + the title's label, lowercase.
const TRK_GOALS = { 'w:app.': 40, 'w:app': 40, 'w:affirms': 1000, 'd:steps': 10000, 'w:steps': 70000 };
// daily counters that also get a "This week" row (Sunday to today, summed by cal_day.py) when the title has no
// weekly counter of its own for them: label -> weekly goal
// TEMPORARY display-only numbers (the calendar keeps the real ones). Empty this to go back to the real values.
const TRK_SHOW_TEMP = { 'm:calls': 36 };
const TRK_WEEKLY = { steps: 70000 };
const TRK_PERIODS = [['d', 'Today'], ['w', 'This week'], ['m', 'This month'], ['', 'Other']];

function trkName(label) {
  return TRK_NAMES[label.toLowerCase()] || label.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

// how far through the week (Sun-Sat) or month we are, counting today as done -- for the pace marker
function trkElapsed(period, dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  if (period === 'w') return (d.getDay() + 1) / 7;
  if (period === 'm') return d.getDate() / new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return null;
}

function trkRow(s, dateStr) {
  const row = document.createElement('div');
  row.className = 'trk-row';
  const name = document.createElement('div');
  name.className = 'trk-name';
  name.textContent = trkName(s.label);
  const val = document.createElement('div');
  val.className = 'trk-val';
  row.append(name, val);
  if ('done' in s) {                       // a ✅ / ❌ toggle
    val.textContent = s.done ? '✅' : '❌';
    return row;
  }
  const fmt = (n) => n.toLocaleString();
  val.textContent = s.goal ? `${fmt(s.value)} / ${fmt(s.goal)}` : fmt(s.value);
  if (!s.goal) return row;
  const limit = TRK_LIMITS.has(s.label.toLowerCase());
  const pct = s.value / s.goal;
  const bar = document.createElement('div');
  bar.className = 'trk-bar';
  const fill = document.createElement('div');
  fill.className = 'trk-fill' + (limit ? (pct > 1 ? ' over' : pct > 0.9 ? ' near' : '') : pct >= 1 ? ' done' : '');
  fill.style.width = Math.min(100, pct * 100) + '%';
  bar.appendChild(fill);
  const note = document.createElement('div');
  note.className = 'trk-note';
  const elapsed = trkElapsed(s.period, dateStr);
  if (elapsed !== null && !limit && pct < 1) {
    const expected = Math.round(s.goal * elapsed);
    const tick = document.createElement('div');
    tick.className = 'trk-pace';
    tick.style.left = Math.min(100, elapsed * 100) + '%';
    tick.title = `on pace = ${fmt(expected)} by today`;
    bar.appendChild(tick);
    const diff = s.value - expected;
    note.textContent = diff >= 0 ? `${fmt(diff)} ahead of pace` : `${fmt(-diff)} behind pace (${fmt(expected)} by today)`;
    note.classList.toggle('behind', diff < 0);
  } else if (limit) {
    note.textContent = pct > 1 ? `${fmt(s.value - s.goal)} over` : `${fmt(s.goal - s.value)} left`;
    note.classList.toggle('behind', pct > 1);
  } else if (pct >= 1) {
    note.textContent = 'goal reached';
  } else {
    note.textContent = `${fmt(s.goal - s.value)} to go`;
  }
  row.append(bar, note);
  return row;
}

// ---- Commissions: a bar from $0 to $8,000 USD for the month that you drag to set how much you've made. Saved on the server per month
// (live_docs/commissions.json), so it is still there after a refresh, and a new month starts again at $0.
const TRK_COMM_GOAL = 8000, TRK_COMM_STEP = 50;
let trkComm = null;        // { "2026-10": 3200, ... } once loaded from the server
let trkCommLoading = false;

function trkCommSave(month, value) {
  fetch('/api/commissions', { method: 'POST', body: JSON.stringify({ month, value }), keepalive: true }).catch(() => {});
}

function trkCommissionsRow(dateStr) {
  const month = dateStr.slice(0, 7);
  const money = (n) => '$' + Math.round(n).toLocaleString();
  const row = document.createElement('div');
  row.className = 'trk-row trk-comm';
  row.innerHTML = '<div class="trk-name">💰 Commissions</div><div class="trk-val" title="Double-click to type an amount"></div>' +
    '<div class="trk-bar trk-drag" title="Drag to set this month\'s commissions"><div class="trk-fill"></div><div class="trk-thumb"></div></div><div class="trk-note"></div>';
  const val = row.querySelector('.trk-val'), bar = row.querySelector('.trk-bar'), fill = row.querySelector('.trk-fill');
  const thumb = row.querySelector('.trk-thumb'), note = row.querySelector('.trk-note');
  const elapsed = trkElapsed('m', dateStr);
  const expected = Math.round(TRK_COMM_GOAL * elapsed);
  const tick = document.createElement('div');
  tick.className = 'trk-pace';
  tick.style.left = Math.min(100, elapsed * 100) + '%';
  tick.title = `on pace = ${money(expected)} by today`;
  bar.appendChild(tick);
  const paint = () => {
    const v = (trkComm && trkComm[month]) || 0;
    const pct = Math.min(1, v / TRK_COMM_GOAL);
    val.textContent = `${money(v)} / ${money(TRK_COMM_GOAL)} USD`;
    fill.style.width = pct * 100 + '%';
    fill.classList.toggle('done', pct >= 1);
    thumb.style.left = pct * 100 + '%';
    const diff = v - expected;
    note.textContent = pct >= 1 ? 'goal reached' : (diff >= 0 ? `${money(diff)} ahead of pace` : `${money(-diff)} behind pace (${money(expected)} by today)`);
    note.classList.toggle('behind', pct < 1 && diff < 0);
  };
  const setFrom = (e) => {
    const r = bar.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    trkComm = trkComm || {};
    trkComm[month] = Math.round(frac * TRK_COMM_GOAL / TRK_COMM_STEP) * TRK_COMM_STEP;
    paint();
  };
  let dragging = false;
  bar.addEventListener('pointerdown', (e) => { e.preventDefault(); dragging = true; bar.setPointerCapture(e.pointerId); setFrom(e); });
  bar.addEventListener('pointermove', (e) => { if (dragging) setFrom(e); });
  const end = () => { if (dragging) { dragging = false; trkCommSave(month, trkComm[month] || 0); } };
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
  val.addEventListener('dblclick', () => {            // type an exact amount instead
    const input = document.createElement('input');
    input.type = 'number'; input.min = 0; input.step = TRK_COMM_STEP; input.className = 'trk-comm-input';
    input.value = (trkComm && trkComm[month]) || 0;
    val.textContent = ''; val.appendChild(input); input.focus(); input.select();
    let done = false;
    const finish = (save) => {
      if (done) return; done = true;
      if (save) { const n = Math.max(0, Math.min(1e7, parseFloat(input.value) || 0)); trkComm = trkComm || {}; trkComm[month] = n; trkCommSave(month, n); }
      paint();
    };
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') finish(true); else if (e.key === 'Escape') finish(false); });
    input.addEventListener('blur', () => finish(true));
  });
  paint();
  return row;
}

// ---- Body weight goal: target 78.0 kg. You log your weight (double-click the number, or the pencil) and the bar shows how far you've come
// from your first logged weight down to the target. Weigh-ins are saved on the server per day (live_docs/bodyweight.json).
const TRK_WEIGHT_TARGET = 78.0;
let trkWeights = null;       // { "2026-10-11": 81.6, ... } once loaded
let trkWeightsLoading = false;

function trkWeightSave(date, kg) {
  fetch('/api/bodyweight', { method: 'POST', body: JSON.stringify({ date, kg }), keepalive: true }).catch(() => {});
}

function trkWeightSection(dateStr) {
  const sec = document.createElement('div');
  sec.className = 'trk-section trk-p-b';
  sec.innerHTML = '<div class="trk-group">Body weight goal</div><div class="trk-row trk-weight"><div class="trk-name">⚖️ Weight</div>' +
    '<div class="trk-val" title="Double-click to log today\'s weight"></div><div class="trk-bar"><div class="trk-fill"></div></div><div class="trk-note"></div></div>';
  const val = sec.querySelector('.trk-val'), fill = sec.querySelector('.trk-fill'), note = sec.querySelector('.trk-note');
  const kg = (n) => n.toFixed(1) + ' kg';
  const paint = () => {
    const dates = Object.keys(trkWeights || {}).filter((d) => d <= dateStr).sort();
    if (!dates.length) {
      val.textContent = `— / ${kg(TRK_WEIGHT_TARGET)}`;
      fill.style.width = '0%';
      note.textContent = 'Double-click to log your weight';
      note.classList.remove('behind');
      return;
    }
    const cur = trkWeights[dates[dates.length - 1]], start = trkWeights[dates[0]];
    val.textContent = `${kg(cur)} / ${kg(TRK_WEIGHT_TARGET)}`;
    const total = start - TRK_WEIGHT_TARGET;                       // how far there was to go on day one
    const pct = total > 0 ? Math.min(1, Math.max(0, (start - cur) / total)) : (cur <= TRK_WEIGHT_TARGET ? 1 : 0);
    fill.style.width = pct * 100 + '%';
    fill.classList.toggle('done', cur <= TRK_WEIGHT_TARGET);
    const prev = dates.length > 1 ? trkWeights[dates[dates.length - 2]] : null;
    const change = prev === null ? '' : ` · ${cur - prev <= 0 ? '' : '+'}${(cur - prev).toFixed(1)} kg since ${dates[dates.length - 2].slice(5)}`;
    note.textContent = (cur <= TRK_WEIGHT_TARGET ? 'goal reached' : `${(cur - TRK_WEIGHT_TARGET).toFixed(1)} kg to go`) + change;
    note.classList.toggle('behind', false);
  };
  val.addEventListener('dblclick', () => {
    const dates = Object.keys(trkWeights || {}).sort();
    const input = document.createElement('input');
    input.type = 'number'; input.step = 0.1; input.min = 0; input.className = 'trk-comm-input';
    input.placeholder = 'kg';
    input.value = (trkWeights && trkWeights[dateStr]) || (dates.length ? trkWeights[dates[dates.length - 1]] : '');
    val.textContent = ''; val.appendChild(input); input.focus(); input.select();
    let done = false;
    const finish = (save) => {
      if (done) return; done = true;
      if (save) {
        const n = parseFloat(input.value);
        trkWeights = trkWeights || {};
        if (n > 0 && n < 500) { trkWeights[dateStr] = Math.round(n * 10) / 10; trkWeightSave(dateStr, n); }
        else if (input.value === '') { delete trkWeights[dateStr]; trkWeightSave(dateStr, 0); }
      }
      paint();
    };
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') finish(true); else if (e.key === 'Escape') finish(false); });
    input.addEventListener('blur', () => finish(true));
  });
  paint();
  return sec;
}

function trkWeightRender(dateStr) {
  trkWeightBox.innerHTML = '<h3>Body weight</h3>';
  trkWeightBox.appendChild(trkWeightSection(dateStr));
}

function trackerRender(tracker, dateStr) {
  if (trkWeights === null && !trkWeightsLoading) {     // body weight weigh-ins: fetch once, then draw again with them
    trkWeightsLoading = true;
    csJSON('/api/bodyweight').then(d => { trkWeights = d.entries || {}; }).catch(() => { trkWeights = {}; })
      .then(() => { trkWeightsLoading = false; trackerRender(tracker, dateStr); });
  }
  if (trkComm === null && !trkCommLoading) {           // first time: fetch what was saved, then draw again with it
    trkCommLoading = true;
    csJSON('/api/commissions').then(d => { trkComm = d.values || {}; }).catch(() => { trkComm = {}; })
      .then(() => { trkCommLoading = false; trackerRender(tracker, dateStr); });
  }
  trkBox.innerHTML = '<h3>Tracker<button class="trk-refresh" title="Read the calendar again">↻</button></h3>' +
    `<div class="trk-updated">updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>`;
  if (!tracker || !tracker.stats.length) {
    const p = document.createElement('p');
    p.className = 'trk-empty';
    p.textContent = "No tracker event on today's calendar.";
    trkBox.appendChild(p);
    const sec = document.createElement('div');
    sec.className = 'trk-section trk-p-m';
    sec.innerHTML = '<div class="trk-group">This month</div>';
    sec.appendChild(trkCommissionsRow(dateStr));
    trkBox.appendChild(sec);
    trkWeightRender(dateStr);
    return;
  }
  const stats = tracker.stats.map((s) => {
    const goal = TRK_GOALS[(s.period || '') + ':' + s.label.toLowerCase()];
    return goal && 'value' in s ? { ...s, goal } : s;
  }).map((s) => (TRK_SHOW_TEMP[(s.period || '') + ':' + s.label.toLowerCase()] !== undefined
    ? { ...s, value: TRK_SHOW_TEMP[(s.period || '') + ':' + s.label.toLowerCase()] } : s));
  for (const s of tracker.stats) {
    const weekGoal = TRK_WEEKLY[s.label.toLowerCase()];
    const hasOwnWeekly = tracker.stats.some((o) => o.period === 'w' && o.label.toLowerCase() === s.label.toLowerCase());
    if (s.period === 'd' && weekGoal && !hasOwnWeekly && tracker.week && s.label in tracker.week) {
      stats.push({ period: 'w', label: s.label, value: tracker.week[s.label], goal: weekGoal });
    }
  }
  // each period is its own coloured block (today = blue, this week = purple, this month = orange) so they can't blur together
  for (const [period, heading] of TRK_PERIODS) {
    const group = stats.filter((s) => (s.period || '') === period);
    if (!group.length && period !== 'm') continue;        // (this month always shows: it holds the commissions bar)
    const sec = document.createElement('div');
    sec.className = 'trk-section trk-p-' + (period || 'x');
    const h = document.createElement('div');
    h.className = 'trk-group';
    h.textContent = heading;
    sec.appendChild(h);
    group.forEach((s) => sec.appendChild(trkRow(s, dateStr)));
    if (period === 'm') sec.appendChild(trkCommissionsRow(dateStr));
    trkBox.appendChild(sec);
  }
  trkWeightRender(dateStr);
}

// ---- refresh: the ↻ in the Tracker heading re-reads the calendar (dayLoad in day-plan.js), and the Today tab also
// re-reads it by itself every 2 minutes while it's the tab on screen
trkBox.addEventListener('click', (e) => {
  const b = e.target.closest('.trk-refresh');
  if (!b) return;
  b.classList.add('spinning');
  dayLoad().finally(() => b.classList.remove('spinning'));   // (on success the card is redrawn anyway)
});
setInterval(() => {
  const view = document.getElementById('today-view');
  if (!document.hidden && view && view.style.display !== 'none') dayLoad();
}, 2 * 60 * 1000);
