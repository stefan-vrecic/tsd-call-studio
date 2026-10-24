// tracker-history.js -- a searchable, date-grouped audit of Tracker entries.
// Real entries come from /api/tracker. The ten September/October examples are display-only and clearly labelled.

const TK_HISTORY_EXAMPLES = [
  ['2026-09-03', [['08:05', 'bodyweight', 80.4, 'Morning weigh-in'], ['12:40', 'calories', 720, 'Chicken rice bowl'], ['18:15', 'training', 62, 'Push workout'], ['22:30', 'steps', 11240, 'Evening walk']]],
  ['2026-09-08', [['07:55', 'sleep_quality', 8, 'Slept through'], ['09:10', 'meditation', 20, 'Morning session'], ['13:25', 'calories', 890, 'Beef mince and noodles'], ['19:05', 'training', 45, 'Mobility and legs'], ['23:00', 'steps', 9860, 'Daily total']]],
  ['2026-09-12', [['09:20', 'bodyweight', 79.9, 'Morning weigh-in'], ['11:00', 'training', 75, 'Upper body'], ['14:10', 'calories', 640, 'Greek yoghurt, banana, oats'], ['21:50', 'steps', 13420, 'Daily total']]],
  ['2026-09-18', [['08:30', 'sleep_quality', 6, 'Late night'], ['12:05', 'calories', 1075, 'Beef mince 500g'], ['17:40', 'mobility', 8, 'Hips and shoulders'], ['20:10', 'training', 30, 'Recovery workout'], ['23:15', 'steps', 7640, 'Daily total']]],
  ['2026-09-23', [['07:45', 'bodyweight', 79.6, 'Morning weigh-in'], ['10:30', 'meditation', 15, 'Breathwork'], ['13:00', 'calories', 780, 'Chicken and potatoes'], ['18:50', 'training', 58, 'Pull workout'], ['22:45', 'steps', 10580, 'Daily total']]],
  ['2026-09-27', [['08:50', 'sleep_quality', 9, 'Strong recovery'], ['11:15', 'training', 90, 'Football'], ['15:35', 'calories', 920, 'Post-training meal'], ['21:40', 'guitar', 35, 'Sight-reading practice'], ['22:55', 'steps', 15120, 'Daily total']]],
  ['2026-10-02', [['08:10', 'bodyweight', 79.3, 'Morning weigh-in'], ['12:20', 'calories', 810, 'Rice noodles and mince'], ['17:25', 'training', 67, 'Chest and shoulders'], ['20:00', 'mobility', 9, 'Full routine'], ['23:05', 'steps', 12110, 'Daily total']]],
  ['2026-10-07', [['09:00', 'sleep_quality', 7, 'Woke once'], ['09:30', 'meditation', 20, 'Morning session'], ['13:15', 'calories', 690, 'Eggs, toast and yoghurt'], ['18:05', 'training', 50, 'Leg workout'], ['22:40', 'steps', 8940, 'Daily total']]],
  ['2026-10-14', [['09:20', 'bodyweight', 79.1, 'Morning weigh-in'], ['11:47', 'calories', 160, 'Dark chocolate'], ['13:38', 'calories', 290, 'Dried rice noodles 80g'], ['18:55', 'training', 55, 'Back and biceps'], ['21:47', 'calories', 200, 'Popcorn'], ['23:10', 'steps', 7800, 'Daily total']]],
  ['2026-10-19', [['08:25', 'sleep_quality', 8, 'Good recovery'], ['09:15', 'bodyweight', 78.9, 'Morning weigh-in'], ['12:50', 'calories', 740, 'Chicken and rice'], ['17:45', 'training', 72, 'Full body'], ['20:20', 'mobility', 8, 'Post-workout'], ['22:50', 'steps', 10850, 'Daily total']]],
];

const TK_HISTORY_MONTHS = [
  ['jan', 'january'], ['feb', 'february'], ['mar', 'march'], ['apr', 'april'], ['may'], ['jun', 'june'],
  ['jul', 'july'], ['aug', 'august'], ['sep', 'sept', 'september'], ['oct', 'october'], ['nov', 'november'], ['dec', 'december']
];
let tkHistoryJumpDate = '';

function tkHistoryNearestDate(wanted) {
  const dates = [...new Set([...tkHistoryRealDays(), ...tkHistoryExampleDays()].map(day => day.date))];
  return dates.reduce((best, date) => {
    const distance = Math.abs(tkD(date) - tkD(wanted));
    return !best || distance < best.distance || (distance === best.distance && date > best.date) ? { date, distance } : best;
  }, null)?.date || wanted;
}

function tkHistoryMetric(id) {
  return tk.metrics.find(m => m.id === id) || { id, name: id.replace(/_/g, ' '), emoji: '•', unit: '', type: 'amount' };
}

function tkHistoryRealDays() {
  const byDate = new Map();
  tk.entries.forEach(entry => {
    const metric = tk.metrics.find(m => m.id === entry.metric);
    if (!metric || metric.archived || (typeof demoMode !== 'undefined' && demoMode && metric.private)) return;
    if (!byDate.has(entry.date)) byDate.set(entry.date, []);
    const stamp = Number(entry.at || 0) * 1000;
    byDate.get(entry.date).push({
      time: stamp ? new Date(stamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '—',
      metric, value: entry.value, note: entry.note || '', source: entry.source || 'manual'
    });
  });
  return [...byDate].map(([date, actions]) => ({ date, actions: actions.sort((a, b) => b.time.localeCompare(a.time)), example: false }));
}

function tkHistoryExampleDays() {
  return TK_HISTORY_EXAMPLES.map(([date, rows]) => ({ date, example: true, actions: rows.map(([time, id, value, note]) => ({ time, metric: tkHistoryMetric(id), value, note, source: 'example' })) }));
}

function tkHistoryHaystack(day) {
  const dateText = tkD(day.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const d = tkD(day.date), n = d.getDate(), monthNames = TK_HISTORY_MONTHS[d.getMonth()] || [];
  const dateAliases = monthNames.flatMap(month => [`${n} ${month}`, `${month} ${n}`]);
  return [day.date, dateText, ...dateAliases, ...day.actions.flatMap(a => [a.metric.name, a.metric.group, a.metric.id, ...(a.metric.aliases || []), a.note, tkFmt(a.metric, a.value)])].join(' ').toLowerCase();
}

function tkRenderHistory() {
  const pane = document.getElementById('tk-history');
  const requestedJump = tkHistoryJumpDate;
  const jumpDate = requestedJump ? tkHistoryNearestDate(requestedJump) : '';
  tkHistoryJumpDate = '';
  pane.innerHTML = `<div class="tk-history-tools">
      <input id="tk-history-search" type="search" autocomplete="off" placeholder="Search calories, training, notes, September…" value="">
      <input id="tk-history-date" type="date" value="" title="Show one date">
      <span id="tk-history-count" class="tk-history-count"></span>
    </div>
    <p class="tk-history-note">Saved tracker activity appears first. Ten dashed cards are examples of how imported calendar and tracker actions will look.</p>
    <div id="tk-history-list" class="tk-history-list"></div>`;
  const search = pane.querySelector('#tk-history-search'), date = pane.querySelector('#tk-history-date'), list = pane.querySelector('#tk-history-list'), count = pane.querySelector('#tk-history-count');
  const draw = () => {
    const q = search.value.trim().toLowerCase(), chosen = date.value;
    const real = tkHistoryRealDays();
    // Keep all ten examples even when the user has real activity on the same date: they are separate dashed cards,
    // so the requested sample set remains complete without ever being mixed into or mistaken for saved data.
    const examples = tkHistoryExampleDays();
    const days = [...real, ...examples].filter(d => (!chosen || d.date === chosen) && (!q || tkHistoryHaystack(d).includes(q))).sort((a, b) => b.date.localeCompare(a.date));
    count.textContent = `${days.length} ${days.length === 1 ? 'day' : 'days'} · ${days.reduce((n, d) => n + d.actions.length, 0)} actions`;
    if (!days.length) { list.innerHTML = '<div class="tk-history-empty">No tracker actions match that search.</div>'; return; }
    list.innerHTML = days.map(day => {
      const label = tkD(day.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const sources = new Set(day.actions.map(a => a.source));
      return `<article class="tk-history-day${day.example ? ' is-example' : ''}" data-history-date="${day.date}">
        <header class="tk-history-head"><div class="tk-history-date"><b>${tkEsc(label)}</b><small>${tkEsc(day.date)}</small></div>
          ${day.example ? '<span class="tk-history-badge">(<span class="samples">Samples</span>/<span class="beta">Beta</span>)</span>' : ''}<span class="tk-history-summary">${day.actions.length} ${day.actions.length === 1 ? 'action' : 'actions'}${!day.example && sources.has('import') ? ' · includes calendar import' : ''}</span>
          ${day.example ? '' : `<button class="ctl tk-history-open" data-open-date="${day.date}">Open day in Log →</button>`}</header>
        <div class="tk-history-actions">${day.actions.map(a => `<div class="tk-history-action"><time>${tkEsc(a.time)}</time><span class="metric">${tkEsc(a.metric.emoji)} ${tkEsc(a.metric.name)}</span><span class="value">${tkEsc(tkFmt(a.metric, a.value))}</span><span class="note">${tkEsc(a.note || ({ import: 'From calendar tracker', quick: 'Questions box', sheet: 'Edited in Sheet' }[a.source] || 'Logged manually'))}</span></div>`).join('')}</div>
      </article>`;
    }).join('');
    list.querySelectorAll('[data-open-date]').forEach(button => button.onclick = () => { tkLogDate = button.dataset.openDate; tkShow('log'); });
  };
  search.oninput = draw; date.onchange = draw; draw();
  if (jumpDate) {
    const candidates = [...list.querySelectorAll(`.tk-history-day[data-history-date="${jumpDate}"]`)];
    const target = candidates.find(card => !card.classList.contains('is-example')) || candidates[0];
    if (target) {
      if (requestedJump !== jumpDate) {
        const message = document.createElement('span'); message.className = 'tk-history-nearest';
        message.textContent = `Nearest to ${tkD(requestedJump).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
        target.querySelector('.tk-history-head').appendChild(message);
      }
      target.classList.add('tk-history-jump');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => target.classList.remove('tk-history-jump'), 2200);
    }
  }
}

window.addEventListener('callstudio:tracker-history-date', (event) => {
  const date = String(event.detail || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  tkHistoryJumpDate = date;
  tkShow('history');
});
