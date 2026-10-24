// tracker-log-dialog.js -- right-click a tracker card (Log or Dashboard) -> "✍️ Log" opens this small box to log a value for that tracker straight away:
// 1-10 buttons for a rating, one button for a yes/no, otherwise the quick "+N" buttons plus an amount box (and a note for money / counts), for the day
// shown in the Log view (or today). The "so far" line can be switched between Day / Week / Month (it opens on the card's own period). A rating that takes
// several readings a day (Enjoyment of life) also lists today's readings. Uses tkLog from tracker-data.js; closes on Esc, ✕ or a click outside, and re-draws the tracker view you were on.
// Plain script (not a module): shares one global scope with the other files; load it after tracker-tab.js.

let tklBox = null;
const tklClose = () => { if (tklBox) tklBox.style.display = 'none'; };

function tkLogDialog(m, period) {
  if (!tklBox) {
    tklBox = document.createElement('div');
    tklBox.id = 'tkl-overlay';
    document.body.appendChild(tklBox);
    tklBox.addEventListener('mousedown', (e) => { if (e.target === tklBox) tklClose(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && tklBox.style.display === 'flex') { e.preventDefault(); tklClose(); } });
  }
  const date = tkLogDate || tk.today;
  let g = ['d', 'w', 'm'].includes(period) ? period : (m.defaultPeriod || 'd');
  tklBox.innerHTML = `<div class="tkl-modal" style="--c:${tkColor(m)}"><button class="tkl-x" title="Close (Esc)">✕</button>
    <h3>${tkEsc(m.emoji)} ${tkEsc(m.name)}</h3>
    <div class="tkl-seg" role="radiogroup" aria-label="Period">${[['d', 'Day'], ['w', 'Week'], ['m', 'Month']].map(([k, l]) => `<button data-g="${k}">${l}</button>`).join('')}</div>
    <div class="tkl-sub"></div><div class="tkl-readings"></div>
    <div class="tkl-ctrl"></div></div>`;
  const paintSub = () => {
    tklBox.querySelectorAll('.tkl-seg button').forEach(b => b.classList.toggle('on', b.dataset.g === g));
    const v = tkPeriodValue(m, tkPeriodStart(date, g), g, date), t = tkTarget(m, g);
    tklBox.querySelector('.tkl-sub').innerHTML = `${m.rolling ? m.rolling + '-day average' : { d: 'Today', w: 'This week', m: 'This month' }[g] + ' so far'}: <b>${tkEsc(tkFmt(m, v))}</b>${t && m.type !== 'weight' ? ' / ' + tkEsc(tkFmt(m, t)) + ' target' : ''}${date !== tk.today ? ' · logging for <b>' + date + '</b>' : ''}`;
  };
  tklBox.querySelectorAll('.tkl-seg button').forEach(b => b.onclick = () => { g = b.dataset.g; paintSub(); });
  if (m.rolling) tklBox.querySelector('.tkl-seg').style.display = 'none';   // a rolling average reads the same at every scale
  paintSub();
  const todays = (m.type === 'rating' && m.multi ? [...(tk.byDay.get(m.id + '|' + date) || [])].sort((a, b) => a.at - b.at) : []);
  if (todays.length) tklBox.querySelector('.tkl-readings').innerHTML = `Readings ${date === tk.today ? 'today' : date}: ${todays.map(e => `<b>${tkEsc(tkFmt(m, e.value))}</b>`).join(' · ')}${todays.length > 1 ? ` <small>(average ${tkEsc(tkFmt(m, todays.reduce((t, e) => t + e.value, 0) / todays.length))})</small>` : ''}`;
  tklBox.style.display = 'flex';
  tklBox.querySelector('.tkl-x').onclick = tklClose;
  const ctrl = tklBox.querySelector('.tkl-ctrl');
  const log = async (val, note) => {
    try { await tkLog(m.id, val, date, note); tklClose(); ctxToast(`Logged ${tkFmt(m, val)} · ${m.name}`); tkShow(tkView); } catch (e) { alert(e.message); }
  };
  if (m.type === 'rating') {
    for (let i = 1; i <= 10; i++) { const b = document.createElement('button'); b.className = 'tk-rate'; b.textContent = i; b.onclick = () => log(i); ctrl.appendChild(b); }
  } else if (m.type === 'yesno') {
    const b = document.createElement('button'); b.className = 'ctl tkl-go'; b.textContent = '✓ Mark done'; b.onclick = () => log(1); ctrl.appendChild(b);
  } else {
    (m.quick || []).forEach(q => { const b = document.createElement('button'); b.className = 'ctl'; b.textContent = '+' + q; b.onclick = () => log(q); ctrl.appendChild(b); });
    const inp = document.createElement('input'); inp.type = 'number'; inp.step = m.type === 'weight' ? '0.1' : 'any'; inp.className = 'tk-num';
    inp.placeholder = m.type === 'weight' ? 'kg' : m.type === 'money' ? '$' : m.unit || 'amount';
    const note = document.createElement('input'); note.type = 'text'; note.className = 'tk-note'; note.placeholder = m.type === 'money' ? 'who / what' : 'note';
    const go = document.createElement('button'); go.className = 'ctl tkl-go'; go.textContent = 'Log';
    const submit = () => { const n = parseFloat(inp.value); if (!isNaN(n)) log(n, note.value.trim()); };
    go.onclick = submit;
    [inp, note].forEach(el => el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') submit(); }));
    ctrl.append(inp);
    if (m.type === 'money' || m.type === 'count') ctrl.append(note);
    ctrl.append(go);
    inp.focus();
  }
}
