// tracker-hover.js -- rest the mouse on a Dashboard card for 2 seconds (adjustable) and a chart pops up for what that card is showing:
//   * (day)   Calories -> what you ate today (each food from the calendar tracker, with its calories); other trackers -> today's entries as bars
//   * (week)  the 7 days of the week as bars with the number on top of each (steps, approaches ...)
//   * (month) every day of the month as bars with the numbers on top (commissions, calls ...); ratings and body weight draw a line instead
// Move the mouse off the card and it closes; the pop-up ignores the mouse. A click still opens the card's full chart. The Settings tab has a switch to turn
// it off and to change the delay (hover-prefs.js). Uses tkChart from tracker-charts.js and the tk helpers; plain script (not a module), load it after tracker-tab.js.

let tkhTimer = null, tkhCard = null, tkhBox = null, tkhToken = 0;

function tkhHide() {
  clearTimeout(tkhTimer); tkhTimer = null; tkhCard = null; tkhToken++;
  if (tkhBox) tkhBox.classList.remove('show');
}

// numbers on the axis and above the bars: whole numbers for counts / dollars / steps (1, 2, 3 ... not 0.6, 1.1), a decimal only for weight and ratings, 1.5k / 12k when big, $ for money
const tkhIntegerMetric = (m) => !['weight', 'rating'].includes(m.type);
const tkhCompact = (m) => (v) => {
  const sign = m.type === 'money' ? '$' : '';
  const a = Math.abs(v);
  return sign + (a >= 10000 ? Math.round(v / 1000) + 'k' : a >= 1000 ? (Math.round(v / 100) / 10) + 'k' : String(tkhIntegerMetric(m) ? Math.round(v) : Math.round(v * 10) / 10));
};

function tkhSeries(m, g) {
  const today = tk.today;
  if (m.rolling) {                                  // body weight: the rolling average over the last 14 days
    const out = []; for (let i = 13; i >= 0; i--) { const d = tkAdd(today, -i); out.push({ label: tkD(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), value: tkPeriodValue(m, d, 'd', null) }); }
    return { series: out, type: 'line', target: m.goal != null ? m.goal : null, title: `${m.rolling}-day average, last 14 days` };
  }
  if (g === 'd') {
    const list = [...(tk.byDay.get(m.id + '|' + today) || [])].sort((a, b) => a.at - b.at);
    return { series: list.map(e => ({ label: e.source === 'import' ? 'total' : new Date(e.at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), value: e.value })), type: 'bar', target: null, title: 'today, entry by entry' };
  }
  const start = tkPeriodStart(today, g), end = tkPeriodEnd(start, g), out = [];
  for (let d = start; d <= end && out.length < 62; d = tkAdd(d, 1)) {
    out.push({ label: g === 'w' ? tkD(d).toLocaleDateString(undefined, { weekday: 'short' }) : String(+d.slice(8)), value: d > today ? null : tkDayValue(m, d) });
  }
  return { series: out, type: m.type === 'rating' || m.type === 'weight' ? 'line' : (m.chart === 'line' ? 'line' : 'bar'), target: tkTarget(m, 'd'), title: g === 'w' ? 'this week, day by day' : 'this month, day by day' };
}

let tkhFoodTotal = null;   // the day's calories from the calendar tracker's food list, for the header
let tkhFoodReq = null;   // started the moment the mouse lands on the Calories card, so the food list (a calendar lookup, a couple of seconds) is ready when the 2 s are up
async function tkhFoodHtml(m) {
  let d; try { d = await (tkhFoodReq || (tkhFoodReq = csJSON('/api/food-today'))); } catch (e) { return null; } finally { tkhFoodReq = null; }
  if (!d || d.error) return null;
  const items = d.items || [], total = items.reduce((t, i) => t + i.cal, 0), max = Math.max(1, ...items.map(i => i.cal)), t = tkTarget(m, 'd');
  tkhFoodTotal = total;
  if (!items.length) return '<p class="tkh-empty">Nothing logged yet today.</p>';
  return `<div class="tkh-food">${items.map(i => `<div class="tkh-food-row"><span class="tkh-t">${tkEsc(i.time)}</span><span class="tkh-n">${tkEsc(i.name || 'food')}</span><span class="tkh-bar"><i style="width:${Math.round(i.cal / max * 100)}%"></i></span><b>${Math.round(i.cal).toLocaleString()}</b></div>`).join('')}</div>
    <p class="tkh-foot">Total <b>${Math.round(total).toLocaleString()} kcal</b>${t ? ` of ${Math.round(t).toLocaleString()} (${Math.round(total / t * 100)}%)` : ''}</p>`;
}

async function tkhShow(card) {
  const m = tk.metrics.find(x => x.id === card.dataset.metric), g = card.dataset.period;
  if (!m) return;
  const token = ++tkhToken;
  let body = null, title = ''; tkhFoodTotal = null;
  if (m.id === 'calories' && g === 'd') { body = await tkhFoodHtml(m); title = 'what you ate today'; }
  if (body == null) {
    const s = tkhSeries(m, g); title = s.title;
    const has = s.series.some(p => p.value != null && p.value !== 0);
    body = has ? tkChart(s.series, { type: s.type, target: s.target, fmt: (v) => tkFmt(m, v), axisFmt: tkhCompact(m), labels: true, labelFmt: s.series.length > 12 ? tkhCompact(m) : (v) => tkFmt(m, v), color: tkColor(m), integer: tkhIntegerMetric(m) }) : '<p class="tkh-empty">Nothing logged for this yet.</p>';
  }
  if (token !== tkhToken || tkhCard !== card) return;      // the mouse moved on while this was loading
  const v = tkPeriodValue(m, tkPeriodStart(tk.today, g), g, tk.today), t = tkTarget(m, g);
  if (!tkhBox) { tkhBox = document.createElement('div'); tkhBox.id = 'tk-hover-chart'; document.body.appendChild(tkhBox); }
  tkhBox.style.setProperty('--c', tkColor(m));
  tkhBox.innerHTML = `<h3>${tkEsc(m.emoji)} ${tkEsc(m.name)} <small>${tkEsc(title)}</small></h3><div class="tkh-sum"><b>${tkEsc(tkFmt(m, tkhFoodTotal != null ? tkhFoodTotal : v))}</b>${t && m.type !== 'weight' ? ' / ' + tkEsc(tkFmt(m, t)) : ''}</div>${body}`;
  tkhBox.classList.add('show');
}

document.addEventListener('mouseover', (e) => {
  const card = e.target.closest && e.target.closest('#tk-dash .tk-dash-card');
  if (!card || card === tkhCard) return;
  tkhHide();
  const ms = hoverDelayMs('tracker');
  if (ms == null || (typeof ctxMenu !== 'undefined' && ctxMenu.style.display === 'block')) return;   // off in Settings, or a menu is open
  tkhCard = card;
  if (card.dataset.metric === 'calories' && card.dataset.period === 'd') tkhFoodReq = csJSON('/api/food-today');
  tkhTimer = setTimeout(() => { if (tkhCard === card) tkhShow(card); }, ms);
});
document.addEventListener('mouseout', (e) => {
  if (!tkhCard) return;
  const to = e.relatedTarget;
  if (!to || !tkhCard.contains(to)) tkhHide();      // off the card's own outline
});
['click', 'contextmenu', 'wheel', 'blur'].forEach(ev => window.addEventListener(ev, tkhHide, true));
document.addEventListener('keydown', tkhHide, true);
