// tracker-charts.js -- the Tracker tab's drawings, all plain SVG (no chart library): a bar / line chart with an optional comparison
// series and target line, a sparkline, a progress ring and a calendar heat-map.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const TK_NS = 'http://www.w3.org/2000/svg';
const tkEsc = csEsc;   // (shared.js)

// A round-number scale for the axis: ~5 steps of 1 / 2 / 5 x 10^k (never a fraction when `integer`: counts, dollars, steps), the top one step above the data
// so the numbers printed on top of the bars have room. Returns {base, top, step}; a line chart with high values starts its axis at a round number below the lowest.
function tkNiceScale(lo, hi, integer) {
  const raw = Math.max((hi - lo) / 5, integer ? 1 : 1e-9), pow = Math.pow(10, Math.floor(Math.log10(raw)));
  let step = [1, 2, 5, 10].map(m => m * pow).find(c => c >= raw) || 10 * pow;
  if (integer) step = Math.max(1, Math.round(step));
  const base = lo > 0 ? Math.floor(lo / step) * step : 0;
  let top = Math.ceil(hi / step) * step;
  if (top - hi < step * 0.2) top += step;     // headroom for the labels
  return { base, top: Math.max(top, base + step), step };
}

// series: [{label, value}] ; compare: same length or shorter, drawn faint ; opts: {type, target, fmt, axisFmt (y labels), color, labels (numbers above the bars), labelFmt, integer (axis steps are whole numbers)}
function tkChart(series, opts = {}) {
  const W = 900, H = 300, L = 62, R = 14, T = 16, B = 46;
  const vals = series.map(p => p.value).concat((opts.compare || []).map(p => p.value)).filter(v => v !== null && v !== undefined);
  const dataMax = Math.max(1, ...vals, opts.target || 0);
  const lo = opts.type === 'line' && vals.length ? Math.min(...vals, opts.target != null ? opts.target : Infinity) : 0;
  const scale = tkNiceScale(opts.type === 'line' && lo > 0 ? lo : 0, dataMax, !!opts.integer);
  const top = scale.top, base = scale.base;
  const n = Math.max(1, series.length), bw = (W - L - R) / n;
  const y = (v) => T + (H - T - B) * (1 - (v - base) / (top - base || 1));
  const x = (i) => L + bw * i + bw / 2;
  const fmt = opts.fmt || ((v) => String(Math.round(v)));
  const labelFmt = opts.labelFmt || fmt;                      // opts.labels: print the value above every bar / point
  const color = opts.color || 'var(--accent)';
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="tk-chart" role="img">`;
  for (let v = base; v <= top + scale.step / 1000; v += scale.step) {   // grid + y labels, on round numbers (1, 2, 3 ... / 100, 200 ... / 5k, 10k ...)
    const yy = y(v);
    svg += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" class="tk-grid"/><text x="${L - 6}" y="${yy + 4}" class="tk-ylab">${tkEsc((opts.axisFmt || fmt)(v))}</text>`;
  }
  const step = Math.ceil(n / 14);                             // x labels, thinned out
  series.forEach((p, i) => { if (i % step === 0) svg += `<text x="${x(i)}" y="${H - B + 18}" class="tk-xlab">${tkEsc(p.label)}</text>`; });
  const cmp = opts.compare || [];
  if (opts.type === 'line') {
    const path = (arr) => arr.map((p, i) => p.value === null || p.value === undefined ? null : `${x(i)},${y(p.value)}`).filter(Boolean).join(' ');
    if (cmp.length) svg += `<polyline points="${path(cmp)}" class="tk-cmp-line"/>`;
    svg += `<polyline points="${path(series)}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>`;
    series.forEach((p, i) => { if (p.value !== null && p.value !== undefined) svg += `<circle cx="${x(i)}" cy="${y(p.value)}" r="4" fill="${color}"><title>${tkEsc(p.label)}: ${tkEsc(fmt(p.value))}</title></circle>`; });
    if (opts.labels) series.forEach((p, i) => { if (p.value !== null && p.value !== undefined) svg += `<text x="${x(i)}" y="${y(p.value) - 9}" class="tk-vlab">${tkEsc(labelFmt(p.value))}</text>`; });
  } else {
    const w = Math.max(2, bw * (cmp.length ? 0.38 : 0.7));
    series.forEach((p, i) => {
      if (cmp[i] && cmp[i].value) svg += `<rect x="${x(i) - w - 1}" y="${y(cmp[i].value)}" width="${w}" height="${y(base) - y(cmp[i].value)}" class="tk-cmp-bar"><title>${tkEsc(cmp[i].label)}: ${tkEsc(fmt(cmp[i].value))}</title></rect>`;
      if (p.value) svg += `<rect x="${cmp.length ? x(i) + 1 : x(i) - w / 2}" y="${y(p.value)}" width="${w}" height="${y(base) - y(p.value)}" rx="2" fill="${color}"><title>${tkEsc(p.label)}: ${tkEsc(fmt(p.value))}</title></rect>`;
      if (opts.labels && p.value) svg += `<text x="${x(i)}" y="${y(p.value) - 5}" class="tk-vlab">${tkEsc(labelFmt(p.value))}</text>`;   // the number on top of each bar
    });
  }
  if (opts.target != null) svg += `<line x1="${L}" x2="${W - R}" y1="${y(opts.target)}" y2="${y(opts.target)}" class="tk-target"/><text x="${W - R}" y="${y(opts.target) - 5}" class="tk-target-lab">target ${tkEsc(fmt(opts.target))}</text>`;
  return svg + '</svg>';
}

function tkSpark(values, color) {
  const W = 120, H = 30, v = values.map(x => x || 0), max = Math.max(1, ...v), bw = W / Math.max(1, v.length);
  return `<svg viewBox="0 0 ${W} ${H}" class="tk-spark">` + v.map((val, i) => `<rect x="${i * bw + 1}" y="${H - (val / max) * H}" width="${Math.max(1, bw - 2)}" height="${(val / max) * H}" rx="1" fill="${color || 'var(--accent)'}" opacity="${i === v.length - 1 ? 1 : 0.45}"/>`).join('') + '</svg>';
}

function tkRing(pct, color, label) {
  const r = 26, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct || 0));
  return `<svg viewBox="0 0 64 64" class="tk-ring"><circle cx="32" cy="32" r="${r}" class="tk-ring-bg"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c * p} ${c}" transform="rotate(-90 32 32)"/><text x="32" y="36" class="tk-ring-lab">${tkEsc(label)}</text></svg>`;
}

// days: [{date, value}] ; colour strength = value / scale (the daily target, or the best day)
function tkHeatmap(days, scale, color) {
  if (!days.length) return '';
  const first = tkMonday(days[0].date), cell = 15, gap = 3;
  const byDate = new Map(days.map(d => [d.date, d.value]));
  const weeks = Math.ceil((tkD(days[days.length - 1].date) - tkD(first)) / 86400000 / 7) + 1;
  let svg = `<svg viewBox="0 0 ${weeks * (cell + gap) + 30} ${7 * (cell + gap) + 4}" class="tk-heat">`;
  ['S', 'M', '', 'W', '', 'F', ''].forEach((l, i) => { if (l) svg += `<text x="0" y="${i * (cell + gap) + 12}" class="tk-ylab" text-anchor="start">${l}</text>`; });
  for (let w = 0; w < weeks; w++) for (let d = 0; d < 7; d++) {
    const date = tkAdd(first, w * 7 + d);
    if (date < days[0].date || date > days[days.length - 1].date) continue;
    const v = byDate.get(date);
    const a = v ? Math.max(0.18, Math.min(1, v / (scale || 1))) : 0;
    svg += `<rect x="${w * (cell + gap) + 22}" y="${d * (cell + gap)}" width="${cell}" height="${cell}" rx="3" fill="${v ? color : 'var(--border)'}" opacity="${v ? a : 0.45}"><title>${date}: ${v == null ? 'nothing' : v}</title></rect>`;
  }
  return svg + '</svg>';
}
