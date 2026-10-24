// tracker-sheet.js -- the Tracker's 🗓 Sheet: one month as a spreadsheet (a row per tracker under its group heading, a column per day,
// 1..end of month) where any day back to 1 January of this year can be typed over. A cell is that day's total: typing a number sets it
// (replacing that day's entries with one), emptying it clears the day. Saved with POST /api/tracker-set.
// Uses tracker-data.js (numbers) and tracker-tab.js (tkPref, tkShown, hidden box) -- only at run time, so it can load before tracker-tab.js.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const tkSheetMin = () => tk.today.slice(0, 4) + '-01';
function tkSheetMonth() {
  const m = tkPref('sheetMonth', ''), cur = tk.today.slice(0, 7);
  return m && m >= tkSheetMin() && m <= cur ? m : cur;
}
const tkSheetLast = () => { const cal = tkS(new Date()); return cal > tk.today ? cal : tk.today; };   // after midnight (before the 4am roll-over) the calendar day is open too
const tkCell = (m, v) => v == null ? '' : String(Number.isInteger(v) ? v : Math.round(v * 10) / 10);   // plain number, no units (narrow columns)
const TK_SHEET_CONFIRM_MUTE = 'tkSheetConfirmMuteUntil';

function tkSheetConfirm(message) {
  if (Number(localStorage.getItem(TK_SHEET_CONFIRM_MUTE) || 0) > Date.now()) return Promise.resolve(true);
  return new Promise(resolve => {
    const overlay = document.createElement('div'); overlay.className = 'tk-sh-confirm-backdrop';
    overlay.innerHTML = `<div class="tk-sh-confirm" role="dialog" aria-modal="true" aria-labelledby="tk-sh-confirm-title">
      <h3 id="tk-sh-confirm-title">Replace tracker entries?</h3><p></p>
      <label><input type="checkbox"> Don’t ask again for 2 minutes</label>
      <div><button class="ctl cancel">Cancel</button><button class="ctl ok">OK</button></div></div>`;
    overlay.querySelector('p').textContent = message;
    const finish = (accepted) => {
      if (accepted && overlay.querySelector('input').checked) localStorage.setItem(TK_SHEET_CONFIRM_MUTE, String(Date.now() + 120000));
      document.removeEventListener('keydown', key); overlay.remove(); resolve(accepted);
    };
    const key = e => { if (e.key === 'Escape') finish(false); if (e.key === 'Enter') finish(true); };
    overlay.querySelector('.cancel').onclick = () => finish(false);
    overlay.querySelector('.ok').onclick = () => finish(true);
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) finish(false); });
    document.addEventListener('keydown', key); document.body.appendChild(overlay); overlay.querySelector('.ok').focus();
  });
}

// zoom: − / 100% / ＋ on the bar (60 %–160 %), remembered; the sheet's text, cells and name column all scale with --sh-z
const tkSheetZoom = () => { const z = parseFloat(tkPref('sheetZoom', '1')); return z >= 0.6 && z <= 1.6 ? z : 1; };
function tkSheetSetZoom(step) {
  const z = step === 0 ? 1 : Math.round(Math.min(1.6, Math.max(0.6, tkSheetZoom() + step * 0.1)) * 10) / 10;
  tkSetPref('sheetZoom', String(z));
  const pane = document.getElementById('tk-sheet');
  pane.querySelector('.tk-sh-wrap')?.style.setProperty('--sh-z', z);
  const v = pane.querySelector('.tk-sh-zval'); if (v) v.textContent = Math.round(z * 100) + '%';
  tkSheetCentreToday();
}
// keep today's column in the middle of the view (after a zoom the columns change size, so it would drift off)
function tkSheetCentreToday() {
  const pane = document.getElementById('tk-sheet'), wrap = pane.querySelector('.tk-sh-wrap'), th = pane.querySelector('thead th.today');
  const name = pane.querySelector('thead th.tk-sh-name'), tot = pane.querySelector('thead th.tk-sh-tot');
  if (wrap && th) requestAnimationFrame(() => {   // the names (left) and the Month totals (right) stay put, so centre in the gap between them
    const left = name ? name.offsetWidth : 0, right = tot ? tot.offsetWidth : 0, vis = wrap.clientWidth - left - right;
    const x = th.getBoundingClientRect().left - wrap.querySelector('table').getBoundingClientRect().left;   // (offsetLeft counts the page margin: the sticky header has no positioned parent)
    wrap.scrollLeft = Math.max(0, x + th.offsetWidth / 2 - left - vis / 2);
  });
}

function tkRenderSheet() {
  const pane = document.getElementById('tk-sheet');
  const month = tkSheetMonth(), cur = tk.today.slice(0, 7);
  const first = month + '-01', last = tkMonthEnd(first);
  const days = []; for (let d = first; d <= last; d = tkAdd(d, 1)) days.push(d);
  const go = (delta) => { const d = tkD(first); d.setMonth(d.getMonth() + delta); tkSetPref('sheetMonth', tkS(d).slice(0, 7)); tkRenderSheet(); };
  pane.innerHTML = `<div class="tk-bar-row">
      <button class="ctl" id="tk-sh-prev"${month <= tkSheetMin() ? ' disabled' : ''}>‹</button>
      <b class="tk-sh-month">${tkD(first).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b>
      <button class="ctl" id="tk-sh-next"${month >= cur ? ' disabled' : ''}>›</button>
      ${month !== cur ? '<button class="ctl" id="tk-sh-now">This month</button>' : ''}
      <span class="tk-hint">Type a day's total, then Enter. Arrow keys and Tab move around. Empty a cell to clear the day.</span>
      <span class="tk-sh-zoom" title="Zoom the sheet"><button class="ctl" data-z="-1" title="Smaller">−</button><button class="ctl tk-sh-zval" data-z="0" title="Back to 100%">${Math.round(tkSheetZoom() * 100)}%</button><button class="ctl" data-z="1" title="Bigger">＋</button></span>${tkHiddenBox()}</div>
    <div class="tk-sh-wrap"><table class="tk-sheet"><thead><tr><th class="tk-sh-name">Tracker</th>${days.map(d => {
      const wd = tkD(d).getDay();
      return `<th class="${wd === 0 || wd === 6 ? 'we' : ''}${d === tk.today ? ' today' : ''}"><small>${'SMTWTFS'[wd]}</small>${+d.slice(8)}</th>`;
    }).join('')}<th class="tk-sh-tot">Month</th></tr></thead><tbody></tbody></table></div>`;
  pane.querySelector('#tk-sh-prev').onclick = () => go(-1);
  pane.querySelectorAll('.tk-sh-zoom [data-z]').forEach(b => b.onclick = () => tkSheetSetZoom(Number(b.dataset.z)));
  pane.querySelector('.tk-sh-wrap').style.setProperty('--sh-z', tkSheetZoom());
  pane.querySelector('#tk-sh-next').onclick = () => go(1);
  const now = pane.querySelector('#tk-sh-now'); if (now) now.onclick = () => { tkSetPref('sheetMonth', cur); tkRenderSheet(); };
  tkWireHiddenBox(pane, tkRenderSheet);

  const body = pane.querySelector('tbody');
  const grid = [];   // grid[row][col] = input, for moving with the arrow keys
  for (const [group, list] of tkGroups(tkShown())) {
    const h = document.createElement('tr'); h.className = 'tk-sh-group'; h.style.setProperty('--group-color', TK_COLORS[group] || TK_COLORS.Other);
    h.innerHTML = `<th class="tk-sh-name">${tkEsc(group)}</th><td colspan="${days.length + 1}"></td>`;
    body.appendChild(h);
    list.forEach(m => {
      const tr = document.createElement('tr'); if (m.hidden) tr.className = 'tk-is-hidden';
      tr.dataset.metric = m.id;   // (⌘⌘ / voice "tracker tab <metric>" scroll here and flash the row)
      tr.innerHTML = `<th class="tk-sh-name" style="--c:${tkColor(m)}"><span>${tkEsc(m.emoji)} ${tkEsc(m.name)}</span>${m.unit && m.unit !== '$' ? `<small>${tkEsc(m.unit)}</small>` : m.type === 'money' ? '<small>$</small>' : ''}</th>` +
        days.map(d => {
          const wd = tkD(d).getDay(), future = d > tkSheetLast();
          return `<td class="${wd === 0 || wd === 6 ? 'we' : ''}${d === tk.today ? ' today' : ''}"><input data-d="${d}" inputmode="decimal" autocomplete="off"${future ? ' disabled' : ''}></td>`;
        }).join('') + '<td class="tk-sh-tot"></td>';
      const row = [...tr.querySelectorAll('input')];
      row.forEach(inp => tkSheetFill(m, inp));
      tkSheetTotal(m, tr, first, last);
      row.forEach((inp, c) => tkSheetWire(m, inp, tr, first, last, grid, grid.length, c));
      grid.push(row);
      body.appendChild(tr);
    });
  }
  // start scrolled so today (or the month's end) is in view
  const wrap = pane.querySelector('.tk-sh-wrap'), th = pane.querySelector('thead th.today');
  if (th) wrap.scrollLeft = Math.max(0, th.offsetLeft - wrap.clientWidth / 2);
  else if (month < cur) wrap.scrollLeft = 0;
}

// a cell's number and its tooltip (what's behind it: each entry, note and where it came from)
function tkSheetFill(m, inp) {
  const d = inp.dataset.d, list = tk.byDay.get(m.id + '|' + d) || [];
  inp.value = tkCell(m, tkDayValue(m, d));
  inp.dataset.was = inp.value;
  inp.title = list.length ? list.map(e => `${tkFmt(m, e.value)} — ${e.note || { import: 'from the calendar tracker', sheet: 'typed in the sheet', quick: 'Questions box' }[e.source] || 'logged'}`).join('\n') : '';
  inp.classList.toggle('has', list.length > 0);
  inp.classList.toggle('many', list.length > 1);
}

function tkSheetTotal(m, tr, first, last) {
  const v = tkPeriodValue(m, first, 'm', last < tk.today ? last : tk.today), t = tkTarget(m, 'm');
  const cell = tr.querySelector('.tk-sh-tot');
  cell.textContent = v == null ? '' : tkFmt(m, v);
  cell.title = t ? 'Month target ' + tkFmt(m, t) : '';
  cell.className = 'tk-sh-tot ' + tkStatusClass(m, v, t);
}

function tkSheetWire(m, inp, tr, first, last, grid, r, c) {
  inp.addEventListener('focus', () => inp.select());
  inp.addEventListener('keydown', (e) => {
    e.stopPropagation();                       // the page's own shortcuts (space = play etc.) stay out of the sheet
    const move = { ArrowUp: [-1, 0], ArrowDown: [1, 0], Enter: [e.shiftKey ? -1 : 1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (e.key === 'Escape') { inp.value = inp.dataset.was; inp.blur(); return; }
    if (!move) return;
    e.preventDefault();
    tkSheetSave(m, inp, tr, first, last);
    for (let rr = r + move[0], cc = c + move[1]; grid[rr] && grid[rr][cc]; rr += move[0], cc += move[1]) {
      if (!grid[rr][cc].disabled) { grid[rr][cc].focus(); break; }
      if (!move[0] && !move[1]) break;
    }
  });
  inp.addEventListener('blur', () => tkSheetSave(m, inp, tr, first, last));
}

async function tkSheetSave(m, inp, tr, first, last) {
  if (inp.dataset.saving === '1') return;
  const raw = inp.value.trim().replace(/,/g, '');
  if (raw === inp.dataset.was) return;
  const k = /^(-?\d+(?:\.\d+)?)k$/i.exec(raw);
  const value = raw === '' ? null : k ? parseFloat(k[1]) * 1000 : Number(raw);
  if (value !== null && !isFinite(value)) { inp.classList.add('bad'); setTimeout(() => inp.classList.remove('bad'), 900); inp.value = inp.dataset.was; return; }
  const d = inp.dataset.d, list = tk.byDay.get(m.id + '|' + d) || [];
  const notes = list.filter(e => e.note);
  inp.dataset.saving = '1';
  if (notes.length && !await tkSheetConfirm(`${m.name}, ${d}: this replaces ${list.length} entr${list.length === 1 ? 'y' : 'ies'} with notes (${notes.map(e => e.note).join('; ')}). Go ahead?`)) { inp.value = inp.dataset.was; delete inp.dataset.saving; return; }
  inp.dataset.was = raw;                       // so a blur right after Enter doesn't save twice
  try {
    const res = await fetch('/api/tracker-set', { method: 'POST', body: JSON.stringify({ metric: m.id, date: d, value }) });
    const out = await res.json(); if (!res.ok) throw new Error(out.error || 'could not save');
    tk.entries = tk.entries.filter(e => !out.removed.includes(e.id));
    if (out.entry) tk.entries.push(out.entry);
    tkIndex();
    tkSheetFill(m, inp); tkSheetTotal(m, tr, first, last);
    inp.classList.add('saved'); setTimeout(() => inp.classList.remove('saved'), 700);
  } catch (e) { inp.value = list.length ? tkCell(m, tkDayValue(m, d)) : ''; inp.dataset.was = inp.value; alert(e.message); }
  finally { delete inp.dataset.saving; }
}
