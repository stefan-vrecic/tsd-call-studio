// ab-ranges.js -- the A/B range rows of the main player: the buttons on every row (export / add to clips), and extra
// ranges (C-D, E-F, ...) with their own markers on the slider.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.
// Needs abMain/mainSeekWrap (player.js), openExportDialog (export-dialog.js) and addClipFromButton (clips.js).

const AB_MAX_PAIRS = 13; // A-B ... Y-Z
// marker colours per pair (start, end), cycling; the first pair keeps the original green / red from the stylesheet
const AB_PALETTE = [['#16a34a', '#dc2626'], ['#7c3aed', '#ea580c'], ['#0891b2', '#db2777'], ['#65a30d', '#9333ea'], ['#ca8a04', '#475569'], ['#0d9488', '#be123c']];
const abLayer = mainSeekWrap.querySelector('.ab-layer');
const abExtraRows = document.getElementById('ab-extra-rows');
const abAddRangeBtn = document.getElementById('ab-add-range');
const abExtras = []; // [{ ab, row, region, hA, hB }] in letter order after the main pair
const abMaxEnd = () => (current && current.rows && current.rows.length) ? Math.max(...current.rows.map(rowEndSeconds)) : 60;

function pairLetters(i) { return [String.fromCharCode(65 + 2 * i), String.fromCharCode(66 + 2 * i)]; }

// The section the range starts in (the last timeline row that has started by A) and its A/B, for naming exports/clips.
function rangeContext(ab) {
  const at = (current.rows || []).filter(r => r.seconds != null && r.seconds <= ab.sel.a + 0.5).pop();
  const d = ab.duration();
  const wholeCall = d && ab.sel.a <= 0.5 && ab.sel.b >= d - 1;
  return { section: wholeCall ? 'Full call' : (at ? at.section : 'Section'), a: ab.sel.a, b: ab.sel.b, duration: d };
}

// Export / add-to-clips buttons of one range row. `touched` is called when the range is changed by hand.
function wireRangeButtons(exportBtn, clipBtn, ab, touched) {
  exportBtn.onclick = () => {
    if (!current) return;
    const ctx = rangeContext(ab);
    openExportDialog({
      person: current.name, section: ctx.section, a: ctx.a, b: ctx.b, duration: ctx.duration,
      onChange: (a, b) => { touched(); ab.set(a, b); },
      onDone: (path) => {
        exportBtn.textContent = '✅ Exported';
        exportBtn.title = path;
        setTimeout(() => { exportBtn.textContent = '✂ Export section'; }, 2500);
      },
    });
  };
  clipBtn.onclick = (e) => {
    if (!current) return;
    const ctx = rangeContext(ab);
    addClipFromButton(e.currentTarget, { person: current.name, section: ctx.section, a: ctx.a, b: ctx.b });
  };
}

// Play (just this range) and the up-arrow (B 30 seconds later) of one row.
function wireRangeNudge(playBtn, extendBtn, ab, touched) {
  extendBtn.onclick = () => { ab.extend(30); touched(); };
  playBtn.onclick = () => {
    if (!current) return;
    const starting = playBtn.textContent.trim() === '▶';   // (it shows ⏸ while the range is playing, and then this click pauses)
    ab.playRange();
    if (starting) scrollTranscriptTo(ab.sel.a);            // bring the transcript to where the range starts
  };
}
function showRangePlaying(btn, playing) {
  btn.textContent = playing ? '⏸' : '▶';
  btn.title = playing ? 'Pause' : 'Play this range (from the first marker to the second)';
}

// the first pair (A-B) already has its markup and its own "I moved it" flag in player.js
wireRangeButtons(document.getElementById('ab-export'), document.getElementById('ab-add-clip'), abMain, () => { abMainAtDefault = false; });
wireRangeNudge(document.getElementById('ab-play'), document.getElementById('ab-extend'), abMain, () => { abMainAtDefault = false; });

function relabelExtras() {
  abExtras.forEach((x, k) => {
    const i = k + 1;
    const [la, lb] = pairLetters(i);
    const [ca, cb] = AB_PALETTE[i % AB_PALETTE.length];
    x.hA.querySelector('span').textContent = la;
    x.hB.querySelector('span').textContent = lb;
    x.hA.style.setProperty('--ab-color', ca);
    x.hB.style.setProperty('--ab-color', cb);
    x.region.style.background = ca + '47';
    x.row.querySelector('.ab-dot').style.background = ca;
    x.ab.setLabels([la, lb]);
  });
  abAddRangeBtn.disabled = abExtras.length + 1 >= AB_MAX_PAIRS;
}

function addExtraRange() {
  if (abExtras.length + 1 >= AB_MAX_PAIRS) return;
  const region = document.createElement('div');
  region.className = 'ab-region';
  const mkHandle = (which) => {
    const h = document.createElement('div');
    h.className = `ab-handle ab-${which}`;
    h.dataset.which = which;
    h.tabIndex = 0;
    h.title = which === 'a' ? 'Drag to move the start. Arrow keys nudge it.' : 'Drag to move the end. Arrow keys nudge it.';
    h.innerHTML = '<span></span>';
    return h;
  };
  const hA = mkHandle('a'), hB = mkHandle('b');
  abLayer.append(region, hA, hB);
  const row = document.createElement('div');
  row.className = 'ab-row ab-extra';
  row.innerHTML = `<span class="ab-dot"></span><span class="ab-readout"></span>
    <button class="ctl" data-act="extend" title="Move the second marker 30 seconds later">▲ 30s</button>
    <button class="ctl" data-act="play" title="Play this range (from the first marker to the second)">▶</button>
    <button class="ctl" data-act="export" title="Cut this range out as its own mp3">✂ Export section</button>
    <button class="ctl" data-act="clip" title="Put this range in your clip basket">➕ Add to clips</button>
    <button class="ctl" data-act="remove" title="Remove this range">✕</button>`;
  abExtraRows.appendChild(row);

  const ab = initABMarkers({ audio: media, layer: abLayer, region, hA, hB, readout: row.querySelector('.ab-readout'), maxEnd: abMaxEnd, labels: ['?', '?'],
    onSet: abPersist, onRangePlayChange: (v) => showRangePlaying(row.querySelector('[data-act="play"]'), v) });
  const entry = { ab, row, region, hA, hB };
  abExtras.push(entry);
  wireRangeNudge(row.querySelector('[data-act="play"]'), row.querySelector('[data-act="extend"]'), ab, () => {});
  wireRangeButtons(row.querySelector('[data-act="export"]'), row.querySelector('[data-act="clip"]'), ab, () => {});
  row.querySelector('[data-act="remove"]').onclick = () => {
    ab.destroy();
    region.remove(); hA.remove(); hB.remove(); row.remove();
    abExtras.splice(abExtras.indexOf(entry), 1);
    relabelExtras();
    abPersist();
  };

  // start where the previous range ends (a minute long); if that is the end of the call, just before the previous one instead
  const prev = abExtras.length > 1 ? abExtras[abExtras.length - 2].ab : abMain;
  const d = ab.duration() || abMaxEnd();
  if (prev.sel.b + 5 < d) ab.set(prev.sel.b, Math.min(prev.sel.b + 60, d));
  else if (prev.sel.a > 5) ab.set(Math.max(0, prev.sel.a - 60), prev.sel.a);
  else ab.set(0, Math.min(60, d));
  relabelExtras();
}

// ---- remembered per call: the markers you set (A-B, C-D ...) are saved in this browser and come back next time you open the call
const abKey = (name) => 'abRanges:' + name;
function abPersist() {
  abLabels();
  if (!abPersistFor || !current || current.name !== abPersistFor) return;
  try {
    const main = abMainAtDefault ? null : [abMain.sel.a, abMain.sel.b];   // untouched A-B = the whole call, nothing to remember
    const extras = abExtras.map(x => [x.ab.sel.a, x.ab.sel.b]);
    if (!main && !extras.length) localStorage.removeItem(abKey(abPersistFor));
    else localStorage.setItem(abKey(abPersistFor), JSON.stringify({ main, extras }));
  } catch (e) { /* storage blocked: the markers just aren't remembered */ }
}
// markers handed over by the server (markers/<call>.json, e.g. times pasted in chat): used the first time the call is opened, when this
// browser has nothing saved for it yet; their titles show next to any range that still sits exactly on one
const abMarkers = () => (current && Array.isArray(current.markers) ? current.markers : []).filter(m => isFinite(m.a) && isFinite(m.b) && m.b > m.a);
function abLabels() {
  const label = (sel) => { const m = abMarkers().find(x => Math.abs(x.a - sel.a) < 1 && Math.abs(x.b - sel.b) < 1); return m ? m.label || '' : ''; };
  const put = (row, text) => {
    if (!row) return;
    let el = row.querySelector('.ab-label');
    if (!el) { el = document.createElement('span'); el.className = 'ab-label'; row.querySelector('.ab-readout').after(el); }
    el.textContent = text; el.title = text; el.style.display = text ? '' : 'none';
  };
  put(document.getElementById('ab-bar'), abMainAtDefault ? '' : label(abMain.sel));
  abExtras.forEach(x => put(x.row, label(x.ab.sel)));
}
function abRestore(name) {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(abKey(name)) || 'null'); } catch (e) { /* none */ }
  if (!saved && abMarkers().length) saved = { main: [abMarkers()[0].a, abMarkers()[0].b], extras: abMarkers().slice(1, AB_MAX_PAIRS).map(m => [m.a, m.b]) };
  if (saved) {
    const ok = (r) => Array.isArray(r) && r.length === 2 && isFinite(r[0]) && isFinite(r[1]) && r[1] > r[0] && r[0] >= 0;
    if (ok(saved.main)) { abMainAtDefault = false; abMain.set(saved.main[0], saved.main[1]); }
    (saved.extras || []).filter(ok).forEach(r => { addExtraRange(); abExtras[abExtras.length - 1].ab.set(r[0], r[1]); });
  }
  abPersistFor = name;   // from here on, changes are saved
  abLabels();
  if (abMarkers().length) abPersist();      // so markers from the server stay once you start moving them
}

function resetExtraRanges() {
  while (abExtras.length) {
    const x = abExtras.pop();
    x.ab.destroy();
    x.region.remove(); x.hA.remove(); x.hB.remove(); x.row.remove();
  }
  abAddRangeBtn.disabled = false;
}

abAddRangeBtn.onclick = () => { if (current) addExtraRange(); };
