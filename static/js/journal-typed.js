// journal-typed.js -- Journal -> ✍️ Type a page: write a page instead of photographing one. It's drawn as a picture in the style of the
// photographed pages (lined notebook paper, spiral rings down the side, blue handwriting-style ink, the date at the top like "19th Oct")
// and saved like a photo (POST /api/journal-typed, routes/journal.py), with its text kept beside it so ✏️ Edit text redraws it.
// Text that doesn't fit one page carries on over as many pages as it needs. Lines starting "- " or "• " become bullets, like the notebook.
// Plain script (not a module): shares one global scope with the other files; it uses jrDate / jrOpen / jrEsc (journal.js) at run time.

const JT_W = 1100, JT_H = 1500;                    // a portrait notebook page
const JT_TOP = 230, JT_LINE = 70, JT_LEFT = 90, JT_RIGHT = JT_W - 170;   // ruled lines every 70 px; the rings sit down the right edge
const JT_FONT = '"Bradley Hand", "Noteworthy", "Segoe Print", "Comic Sans MS", cursive';
const JT_INK = '#2b3a9e';

function jtOrdinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function jtDateLabel(iso) { const d = new Date(iso + 'T12:00:00'); return `${jtOrdinal(d.getDate())} ${d.toLocaleDateString('en-GB', { month: 'short' })}`; }

// text -> the lines that go on the ruled lines, wrapped to the page width ({text, bullet, indent})
function jtLayout(ctx, text) {
  const out = [];
  ctx.font = `46px ${JT_FONT}`;
  String(text || '').replace(/\r/g, '').split('\n').forEach(raw => {
    const m = /^\s*(?:[-•*]|\d+[.)])\s+/.exec(raw);
    const bullet = !!m, body = m ? raw.slice(m[0].length) : raw;
    const indent = bullet ? 50 : 0, max = JT_RIGHT - JT_LEFT - indent;
    if (!body.trim()) { out.push({ text: '', bullet: false, indent: 0 }); return; }
    let line = '', first = true;
    body.split(/\s+/).forEach(word => {
      const trial = line ? line + ' ' + word : word;
      if (ctx.measureText(trial).width <= max || !line) line = trial;
      else { out.push({ text: line, bullet: bullet && first, indent }); first = false; line = word; }
    });
    out.push({ text: line, bullet: bullet && first, indent });
  });
  return out;
}
const jtPerPage = Math.floor((JT_H - JT_TOP - 110) / JT_LINE);

// one page as a canvas: paper, ruled lines, rings, the date, then its lines of text
function jtDrawPage(lines, dateIso, pageNo, pages) {
  const c = document.createElement('canvas'); c.width = JT_W; c.height = JT_H;
  const g = c.getContext('2d');
  g.fillStyle = '#ece8df'; g.fillRect(0, 0, JT_W, JT_H);                                     // the desk behind the page
  const r = 34, px = 26, py = 26, pw = JT_W - 52, ph = JT_H - 52;
  g.save(); g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 24; g.shadowOffsetY = 6;
  g.beginPath(); g.roundRect(px, py, pw, ph, r); g.fillStyle = '#fbfaf6'; g.fill(); g.restore();
  g.strokeStyle = '#c9ccd3'; g.lineWidth = 2; g.beginPath(); g.roundRect(px + 22, py + 22, pw - 44, ph - 44, 24); g.stroke();   // the printed border
  g.strokeStyle = '#cfd6e2'; g.lineWidth = 2;
  for (let y = JT_TOP; y < JT_H - 80; y += JT_LINE) { g.beginPath(); g.moveTo(px + 30, y); g.lineTo(JT_RIGHT + 40, y); g.stroke(); }
  // spiral rings down the right edge
  for (let y = 90; y < JT_H - 60; y += 62) {
    g.fillStyle = '#d6d2c8'; g.beginPath(); g.arc(JT_W - 95, y + 6, 11, 0, Math.PI * 2); g.fill();          // the punched hole
    g.strokeStyle = '#3f3f46'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.ellipse(JT_W - 62, y, 40, 15, -0.18, Math.PI * 0.55, Math.PI * 1.95); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.beginPath(); g.ellipse(JT_W - 62, y - 3, 36, 11, -0.18, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
  }
  // the date, underlined, like the notebook
  g.fillStyle = JT_INK; g.strokeStyle = JT_INK; g.font = `56px ${JT_FONT}`; g.textBaseline = 'alphabetic';
  const label = jtDateLabel(dateIso) + (pages > 1 ? `  (${pageNo}/${pages})` : '');
  g.fillText(label, JT_LEFT, JT_TOP - 70);
  g.lineWidth = 2.5; g.beginPath(); g.moveTo(JT_LEFT - 6, JT_TOP - 52); g.lineTo(JT_LEFT + g.measureText(label).width + 40, JT_TOP - 56); g.stroke();
  // the writing, sitting just above each ruled line
  g.font = `46px ${JT_FONT}`;
  lines.forEach((ln, k) => {
    const y = JT_TOP + JT_LINE * (k + 1) - 14;
    if (ln.bullet) { g.beginPath(); g.arc(JT_LEFT + 14, y - 14, 5.5, 0, Math.PI * 2); g.fill(); }
    g.fillText(ln.text, JT_LEFT + ln.indent, y);
  });
  return c;
}

// the whole text -> as many pages as it needs
function jtPages(text, dateIso) {
  const probe = document.createElement('canvas').getContext('2d');
  const lines = jtLayout(probe, text);
  const chunks = [];
  for (let k = 0; k < Math.max(1, lines.length); k += jtPerPage) chunks.push(lines.slice(k, k + jtPerPage));
  return chunks.map((ls, k) => ({ canvas: jtDrawPage(ls, dateIso, k + 1, chunks.length), text: ls.map(l => (l.bullet ? '- ' : '') + l.text).join('\n') }));
}

// the preview shows ONE page at a time, with ‹ › to flip through when the text runs over several (the page you're on is kept while you type)
function jtShowPages(prev, pages) {
  const n = pages.length, at = Math.min(prev._jtPage || 0, n - 1);
  prev._jtPage = at;
  prev.innerHTML = '';
  if (n > 1) {
    const bar = document.createElement('div'); bar.className = 'jt-pager';
    bar.innerHTML = `<button class="ctl" data-p="-1" ${at === 0 ? 'disabled' : ''} title="Previous page">‹</button><span>Page ${at + 1} of ${n}</span><button class="ctl" data-p="1" ${at === n - 1 ? 'disabled' : ''} title="Next page">›</button>`;
    bar.querySelectorAll('button').forEach(b => b.onclick = () => { prev._jtPage = Math.max(0, Math.min(n - 1, at + Number(b.dataset.p))); jtShowPages(prev, pages); });
    prev.appendChild(bar);
  }
  pages[at].canvas.className = 'jt-canvas';
  prev.appendChild(pages[at].canvas);
}

// ---- the typed-page editor: a date, the text, a live preview of the notebook pages (‹ › to flip). Used by Journal (below) and by
// Learning's typed notes (learning-typed-pages.js). opts: { heading, date, dateLocked (a reason it can't change), source (HTML line under
// the heading), text, placeholder, saveLabel, deleteLabel, onSave(text, day) -> Promise (throw to show the error), onDelete() -> true to close }
function jtEditor(opts) {
  document.getElementById('jt-editor')?.remove();
  const box = document.createElement('div'); box.id = 'jt-editor';
  box.innerHTML = `<div class="jt-card">
      <div class="jt-head"><b></b><label>Day <input type="date" class="jt-date"></label><span class="jt-pages"></span><button class="ctl jt-x" title="Close (Esc)">✕</button></div>
      ${opts.source ? `<div class="bk-jt-source">${opts.source}</div>` : ''}
      <div class="jt-body"><textarea class="jt-text" spellcheck="true"></textarea><div class="jt-preview"></div></div>
      <div class="jt-foot">${opts.deleteLabel ? '<button class="ctl bk-jt-delete" data-a="delete"></button>' : ''}<span class="jt-msg"></span><button class="ctl" data-a="cancel">Cancel</button><button class="ctl jt-save" data-a="save"></button></div></div>`;
  document.body.appendChild(box);
  const ta = box.querySelector('.jt-text'), dateBox = box.querySelector('.jt-date'), prev = box.querySelector('.jt-preview'), msg = box.querySelector('.jt-msg'), saveBtn = box.querySelector('.jt-save');
  box.querySelector('.jt-head b').textContent = opts.heading;
  dateBox.value = opts.date; if (opts.dateLocked) { dateBox.disabled = true; dateBox.title = opts.dateLocked; }
  ta.placeholder = opts.placeholder || 'Write…  Start a line with - for a bullet.';
  ta.value = opts.text || '';
  saveBtn.textContent = opts.saveLabel || 'Save';
  let timer = null;
  const draw = () => {
    const pages = jtPages(ta.value, dateBox.value || opts.date);
    jtShowPages(prev, pages);
    box.querySelector('.jt-pages').textContent = pages.length > 1 ? `${pages.length} pages` : '';
  };
  ta.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(draw, 250); });
  dateBox.addEventListener('change', draw);
  const close = () => box.remove();
  const save = async () => {
    if (!ta.value.trim()) { msg.textContent = 'Write something first.'; return; }
    saveBtn.disabled = true; msg.textContent = 'Saving…';
    try { await opts.onSave(ta.value, dateBox.value || opts.date); close(); }
    catch (e) { msg.textContent = '⚠️ ' + e.message; saveBtn.disabled = false; }
  };
  box.querySelector('.jt-x').onclick = close; box.querySelector('[data-a="cancel"]').onclick = close; saveBtn.onclick = save;
  const del = box.querySelector('[data-a="delete"]');
  if (del) { del.textContent = opts.deleteLabel; del.onclick = () => { if (opts.onDelete()) close(); }; }
  box.addEventListener('mousedown', (e) => { if (e.target === box) close(); });
  box.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') close(); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save(); });
  draw(); ta.focus();
}

// Journal -> ✍️ Type a page / ✏️ Edit text: each page is drawn and saved like a photographed one (POST /api/journal-typed)
function jrTypeOpen(edit) {   // edit = {id, date, text} for "✏️ Edit text" on a typed page
  jtEditor({
    heading: edit ? '✏️ Edit typed page' : '✍️ Type a page',
    date: edit ? edit.date : (document.querySelector('#jr-root .jr-date')?.value || jrDate || csToday()),
    dateLocked: edit ? 'Move it to another day from the page viewer' : '',
    text: edit ? edit.text : '', placeholder: 'Write your page…  Start a line with - for a bullet.',
    saveLabel: edit ? 'Save changes' : 'Add page',
    onSave: async (text, day) => {
      const pages = jtPages(text, day);
      for (let k = 0; k < pages.length; k++) {
        const id = edit && k === 0 ? `&id=${encodeURIComponent(edit.id)}` : '';   // editing: the first page replaces the old one, any extra are added
        await csJSON(`/api/journal-typed?date=${day}${id}`, { method: 'POST', body: JSON.stringify({ text: pages.length > 1 ? pages[k].text : text, image: pages[k].canvas.toDataURL('image/png') }) });
      }
      ctxToast(edit ? 'Page updated' : `${pages.length} typed page${pages.length === 1 ? '' : 's'} added`);
      if (typeof jrClose === 'function' && edit) jrClose();
      jrOpen();
    },
  });
}
