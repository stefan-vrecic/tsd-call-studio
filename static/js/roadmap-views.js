// roadmap-views.js -- two cleaner ways to look at the roadmap (roadmap.js), beside ▦ Boxes and 🧩 Diagram:
//   📈 Timeline: one row per area, every milestone placed at its real due date on one time axis, with a "Today" line. The axis is
//               stretched near today (square-root scale) so 7 / 14 / 30 days don't pile on top of each other. Click a dot for its text.
//   🗒 Agenda:  every milestone from every area in one list by due date ("Mon 26 Oct · in 7 days"), with a 📍 Today divider.
// Uses rmPlansFor / rmDue / rmDaysLeft / rmStartFor (roadmap.js) and RD_ROWS / RD_PALETTE (roadmap-diagram.js) -- only at run time.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const rvEsc = csEsc;   // (shared.js)
const rvDay = (d) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) });
const rvLabel = (day) => day === 365 ? '1 year' : day + ' days';

// every milestone: {area, name, colour, day, due (Date), left (days), text}
function rvMilestones() {
  return RD_ROWS.flatMap(([key, name, p]) => RM_DAYS.map(day => ({
    area: key, name, colour: RD_PALETTE[p][1], fill: RD_PALETTE[p][0], day, due: rmDue(key, day), left: rmDaysLeft(key, day),
    text: String(rmPlansFor(key)[day] || '').trim(),
  })));
}

// ---- 📈 Timeline
function rvTimeline(host) {
  const all = rvMilestones();
  const rows = RD_ROWS.filter(([key]) => all.some(m => m.area === key && m.text));   // areas you've written something in
  if (!rows.length) { host.innerHTML = '<p class="rv-empty">Nothing written yet. Add a goal in ▦ Boxes and it shows up here.</p>'; return; }
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const starts = rows.map(([k]) => new Date(rmStartFor(k) + 'T12:00:00'));
  const t0 = new Date(Math.min(today, ...starts)), t1 = new Date(Math.max(...all.filter(m => rows.some(([k]) => k === m.area)).map(m => m.due)));
  const span = Math.max(1, (t1 - t0) / 86400000);
  const W = Math.max(760, host.clientWidth || 1000), L = 150, R = 40, top = 56, rowH = 104, H = top + rows.length * rowH + 20;
  const x = (d) => L + (W - L - R) * Math.sqrt(Math.max(0, (d - t0) / 86400000) / span);
  let svg = `<svg class="rv-tl" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`;
  // month marks
  const m = new Date(t0.getFullYear(), t0.getMonth() + 1, 1, 12);
  for (; m <= t1; m.setMonth(m.getMonth() + 1)) {
    const xx = x(m);
    svg += `<line x1="${xx}" x2="${xx}" y1="${top - 14}" y2="${H - 10}" class="rv-grid"/><text x="${xx + 4}" y="${top - 20}" class="rv-month">${m.toLocaleDateString(undefined, { month: 'short' })}${m.getMonth() === 0 ? ' ' + m.getFullYear() : ''}</text>`;
  }
  rows.forEach(([key, name, p], r) => {
    const y = top + r * rowH + rowH / 2, col = RD_PALETTE[p][1];
    svg += `<rect x="8" y="${y - 22}" width="${L - 24}" height="44" rx="10" fill="${col}"/><text x="${(L - 16) / 2 + 8}" y="${y + 5}" class="rv-area">${rvEsc(name)}</text>`;
    const start = new Date(rmStartFor(key) + 'T12:00:00');
    svg += `<line x1="${x(start)}" x2="${x(all.find(mm => mm.area === key && mm.day === 365).due)}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="3" opacity=".35" stroke-linecap="round"/>`;
    svg += `<circle cx="${x(start)}" cy="${y}" r="4" fill="${col}"/>`;
    all.filter(mm => mm.area === key).forEach((mm, i) => {
      const xx = x(mm.due), past = mm.left < 0, up = i % 2 === 0;
      const label = mm.text ? mm.text.replace(/\s+/g, ' ').replace(/^[•\-*]\s*/, '') : '';
      svg += `<g class="rv-dot${mm.text ? '' : ' empty'}${past ? ' past' : ''}" data-area="${key}" data-day="${mm.day}">
        <circle cx="${xx}" cy="${y}" r="${mm.text ? 10 : 6}" fill="${mm.text ? (past ? '#cbd5e1' : col) : '#fff'}" stroke="${past ? '#94a3b8' : col}" stroke-width="2.5"><title>${rvEsc(rvLabel(mm.day))} · ${rvEsc(rvDay(mm.due))}${mm.text ? '\n' + rvEsc(mm.text) : ''}</title></circle>
        <text x="${xx}" y="${up ? y - 18 : y + 30}" class="rv-h">${mm.day === 365 ? '1y' : mm.day + 'd'}</text>
        ${label ? `<text x="${xx}" y="${up ? y - 32 : y + 44}" class="rv-txt">${rvEsc(label.length > 24 ? label.slice(0, 23) + '…' : label)}</text>` : ''}</g>`;
    });
  });
  const tx = x(today);
  svg += `<line x1="${tx}" x2="${tx}" y1="${top - 30}" y2="${H - 6}" class="rv-today"/><rect x="${tx - 44}" y="8" width="88" height="22" rx="11" class="rv-today-pill"/><text x="${tx}" y="23" class="rv-today-txt">📍 Today</text>`;
  host.innerHTML = `<div class="rv-tl-wrap">${svg}</svg></div><div class="rv-detail" id="rv-detail">Click a dot to read that goal. Near-term is spread out so the first weeks stay readable.</div>`;
  host.querySelectorAll('.rv-dot').forEach(g => g.onclick = () => {
    const mm = all.find(z => z.area === g.dataset.area && z.day === Number(g.dataset.day));
    host.querySelectorAll('.rv-dot.on').forEach(z => z.classList.remove('on')); g.classList.add('on');
    document.getElementById('rv-detail').innerHTML = `<b style="color:${mm.colour}">${rvEsc(mm.name)}</b> · ${rvEsc(rvLabel(mm.day))} · by <b>${rvEsc(rvDay(mm.due))}</b> (${mm.left > 0 ? mm.left + ' days left' : mm.left === 0 ? 'today' : 'passed'})<div class="rv-detail-text">${mm.text ? rvEsc(mm.text) : '<i>Nothing written for this one yet.</i>'}</div>`;
  });
}

// ---- 🗒 Agenda
function rvAgenda(host) {
  const items = rvMilestones().filter(m => m.text).sort((a, b) => a.due - b.due || a.area.localeCompare(b.area));
  if (!items.length) { host.innerHTML = '<p class="rv-empty">Nothing written yet. Add a goal in ▦ Boxes and it shows up here.</p>'; return; }
  let html = '', lastKey = '', todayDone = false;
  items.forEach(m => {
    if (!todayDone && m.left >= 0) { html += `<div class="rv-today-row">📍 Today · ${rvEsc(rvDay(new Date()))}</div>`; todayDone = true; }
    const key = m.due.toDateString();
    if (key !== lastKey) {
      html += `<div class="rv-when${m.left < 0 ? ' past' : ''}"><b>${rvEsc(rvDay(m.due))}</b><span>${m.left > 0 ? 'in ' + m.left + ' day' + (m.left === 1 ? '' : 's') : m.left === 0 ? 'today' : 'passed'}</span></div>`;
      lastKey = key;
    }
    html += `<div class="rv-item${m.left < 0 ? ' past' : ''}" style="--c:${m.colour};--f:${m.fill}"><span class="rv-chip">${rvEsc(m.name)}</span><span class="rv-hz">${rvEsc(rvLabel(m.day))}</span><div class="rv-text">${rvEsc(m.text)}</div></div>`;
  });
  if (!todayDone) html += `<div class="rv-today-row">📍 Today · ${rvEsc(rvDay(new Date()))} — everything above has passed</div>`;
  host.innerHTML = `<div class="rv-agenda">${html}</div>`;
}
