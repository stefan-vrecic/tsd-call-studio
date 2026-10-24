// tracker-data.js -- the Tracker tab's data: loads the trackers + entries from /api/tracker and turns entries into numbers per day,
// week (Sunday to Saturday) and month, plus targets and pace. No drawing here (tracker-charts.js) and no page building (tracker-tab.js).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const tk = { metrics: [], entries: [], today: null, questions: [], byDay: new Map() };   // byDay: "metric|YYYY-MM-DD" -> [entries]

async function tkFetch() {
  const d = await csJSON('/api/tracker');
  tk.metrics = d.metrics || [];
  tk.entries = d.entries || [];
  tk.today = d.today;
  tk.questions = d.questions || [];
  tkIndex();
}

function tkIndex() {
  tk.byDay = new Map();
  tk.entries.forEach(e => {
    const k = e.metric + '|' + e.date;
    if (!tk.byDay.has(k)) tk.byDay.set(k, []);
    tk.byDay.get(k).push(e);
  });
}

async function tkLog(metricId, value, date, note) {
  const res = await fetch('/api/tracker-log', { method: 'POST', body: JSON.stringify({ metric: metricId, value, date, note }) });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || 'could not log');
  tk.entries.push(d.entry);
  tkIndex();
  return d.entry;
}

async function tkDelete(entryId) {
  await fetch('/api/tracker-delete', { method: 'POST', body: JSON.stringify({ id: entryId }) });
  tk.entries = tk.entries.filter(e => e.id !== entryId);
  tkIndex();
}

async function tkSaveMetric(m) {
  const res = await fetch('/api/tracker-metric', { method: 'POST', body: JSON.stringify(m) });
  const d = await res.json();
  if (!res.ok) throw new Error(d.error || 'could not save');
  const i = tk.metrics.findIndex(x => x.id === d.metric.id);
  if (i >= 0) tk.metrics[i] = { ...tk.metrics[i], ...d.metric }; else tk.metrics.push(d.metric);
  return d.metric;
}

// ---- dates (all as "YYYY-MM-DD" strings, local)
const tkD = (s) => new Date(s + 'T12:00:00');
const tkS = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const tkAdd = (s, n) => { const d = tkD(s); d.setDate(d.getDate() + n); return tkS(d); };
// weeks run Sunday -> Saturday (Oct 21 2026; were Monday -> Sunday). The name tkMonday is kept so callers don't change: it's the week's first day.
const tkMonday = csWeekStart;
const tkMonthStart = (s) => s.slice(0, 8) + '01';
const tkMonthEnd = (s) => { const d = tkD(tkMonthStart(s)); d.setMonth(d.getMonth() + 1); d.setDate(0); return tkS(d); };
const tkPeriodStart = (s, g) => g === 'w' ? tkMonday(s) : g === 'm' ? tkMonthStart(s) : s;
const tkPeriodEnd = (s, g) => g === 'w' ? tkAdd(tkMonday(s), 6) : g === 'm' ? tkMonthEnd(s) : s;
const tkNextPeriod = (s, g) => g === 'w' ? tkAdd(tkMonday(s), 7) : g === 'm' ? tkAdd(tkMonthEnd(s), 1) : tkAdd(s, 1);
const tkPrevPeriod = (s, g) => g === 'w' ? tkAdd(tkMonday(s), -7) : g === 'm' ? tkMonthStart(tkAdd(tkMonthStart(s), -1)) : tkAdd(s, -1);
function tkPeriodLabel(s, g) {
  const d = tkD(s);
  if (g === 'm') return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  if (g === 'w') return 'wk ' + d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// ---- numbers
function tkDayValue(m, date) {
  const list = tk.byDay.get(m.id + '|' + date);
  if (!list || !list.length) return null;
  const vals = [...list].sort((a, b) => a.at - b.at).map(e => e.value);
  if (m.agg === 'avg') return m.type === 'rating' && !m.multi ? vals[vals.length - 1] : vals.reduce((a, b) => a + b, 0) / vals.length;   // a rating: the day's latest, unless it takes several readings a day (multi): then their average
  if (m.agg === 'last') return vals[vals.length - 1];
  if (m.agg === 'any') return vals.some(v => v) ? 1 : 0;
  return vals.reduce((a, b) => a + b, 0);
}

// a tracker with `rolling: N` (Body weight: 7) is read as the average of the days logged in the N days up to and including `date`, so daily
// ups and downs wash out; days with no weigh-in are skipped. Day / week / month views and charts all show that average as of the period's last day.
function tkRolling(m, date) {
  const vals = [];
  for (let i = 0; i < m.rolling; i++) { const v = tkDayValue(m, tkAdd(date, -i)); if (v !== null) vals.push(v); }
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}
// the latest raw reading on or before `date` (within the rolling window), for "latest 79.4 kg" next to the average
function tkLatest(m, date) {
  for (let i = 0; i < Math.max(m.rolling || 1, 1); i++) { const v = tkDayValue(m, tkAdd(date, -i)); if (v !== null) return v; }
  return null;
}

// a whole period (day / week / month starting at `start`), up to `upto` (inclusive) if given
function tkPeriodValue(m, start, g, upto) {
  if (m.rolling) {
    const e = g === 'd' ? start : (upto && upto < tkPeriodEnd(start, g) ? upto : tkPeriodEnd(start, g));
    return tkRolling(m, e > tk.today ? tk.today : e);
  }
  if (g === 'd') return tkDayValue(m, start);
  const end = upto && upto < tkPeriodEnd(start, g) ? upto : tkPeriodEnd(start, g);
  const vals = [];
  for (let s = tkPeriodStart(start, g); s <= end; s = tkAdd(s, 1)) { const v = tkDayValue(m, s); if (v !== null) vals.push(v); }
  if (!vals.length) return null;
  if (m.agg === 'avg') return vals.reduce((a, b) => a + b, 0) / vals.length;    // average of the days logged
  if (m.agg === 'last') return vals[vals.length - 1];
  if (m.agg === 'any') return vals.filter(v => v).length;                        // days it was done
  return vals.reduce((a, b) => a + b, 0);
}

// buckets from `from` to `to` (inclusive) at granularity g: [{start, label, value}]
function tkSeries(m, from, to, g) {
  const out = [];
  for (let s = tkPeriodStart(from, g); s <= to; s = tkNextPeriod(s, g)) {
    out.push({ start: s, label: tkPeriodLabel(s, g), value: tkPeriodValue(m, s, g, to) });
    if (out.length > 800) break;
  }
  return out;
}

// how far through the current week / month today is (today counted as done), for pace
function tkElapsed(g, today) {
  if (g === 'w') return (tkD(today).getDay() + 1) / 7;   // Sunday = 1/7 ... Saturday = 7/7
  if (g === 'm') return tkD(today).getDate() / tkD(tkMonthEnd(today)).getDate();
  return 1;
}

// a period's target: a set target, or (for a week/month with only a daily target) the daily one scaled up
function tkTarget(m, g) {
  const t = m.targets || {};
  if (t[g] != null) return t[g];
  if (m.agg === 'avg' || m.agg === 'last') return t.d != null ? t.d : null;      // ratings / weight: the same number at every scale
  if (t.d != null && g === 'w') return t.d * 7;
  if (t.d != null && g === 'm') return t.d * tkD(tkMonthEnd(tk.today)).getDate();
  return null;
}

function tkFmt(m, v) {
  if (v === null || v === undefined) return '—';
  if (m.type === 'money') return '$' + Math.round(v).toLocaleString();
  if (m.type === 'rating' || m.type === 'weight') return (Math.round(v * 10) / 10).toLocaleString() + (m.unit && m.type === 'weight' ? ' ' + m.unit : '');
  if (m.type === 'yesno') return String(Math.round(v));
  return (Number.isInteger(v) ? v : Math.round(v * (Math.abs(v) < 100 ? 10 : 1)) / (Math.abs(v) < 100 ? 10 : 1)).toLocaleString() + (m.unit && m.unit !== '$' ? ' ' + m.unit : '');   // 1.5 h stays 1.5
}

// which trackers to show (private ones are hidden in Demo mode)
function tkVisible() {
  const demo = typeof demoMode !== 'undefined' && demoMode;
  return tk.metrics.filter(m => !m.archived && !(demo && m.private));
}
