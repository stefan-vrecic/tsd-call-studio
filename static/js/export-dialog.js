// export-dialog.js -- the Export section dialog (name + editable A/B times).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

// --- "Export section" dialog: pre-filled from the A/B markers, times editable by hand ---
const esOverlay = document.getElementById('export-section-overlay');
const esName = document.getElementById('es-name');
const esStart = document.getElementById('es-start');
const esEnd = document.getElementById('es-end');
const esLen = document.getElementById('es-len');
const esError = document.getElementById('es-error');
const esGo = document.getElementById('es-go');
let esCtx = null;

function readEsTimes() {
  const a = parseClock(esStart.value), b = parseClock(esEnd.value);
  if (isNaN(a) || isNaN(b)) return { error: 'Times look like 18:18 or 1:02:30 (or just seconds).' };
  if (b <= a) return { error: 'End (B) has to be after start (A).' };
  if (esCtx && esCtx.duration && b > esCtx.duration + 0.5) return { error: `End is past the end of the recording (${fmt(esCtx.duration)}).` };
  return { a, b };
}
function refreshEsTimes() {
  const t = readEsTimes();
  esError.textContent = t.error || '';
  esLen.textContent = t.error ? '' : `Length ${fmtPrecise(t.b - t.a)}`;
  if (!t.error && esCtx) esCtx.onChange(t.a, t.b); // keep the A/B markers in step with what's typed
}
function openExportDialog(ctx) {
  esCtx = ctx;
  document.getElementById('es-call').textContent = displayName(ctx.person);
  esName.value = `${ctx.section}–${displayName(ctx.person)}`; // SECTION–CALLNAME
  esStart.value = fmtPrecise(ctx.a);
  esEnd.value = fmtPrecise(ctx.b);
  esGo.disabled = false;
  esGo.textContent = 'Export';
  refreshEsTimes();
  esOverlay.style.display = 'flex';
  esName.focus();
  esName.select();
}
function closeExportDialog() { esOverlay.style.display = 'none'; esCtx = null; }
async function runExportSection() {
  const t = readEsTimes();
  if (t.error) { esError.textContent = t.error; return; }
  const ctx = esCtx;
  esGo.disabled = true;
  esGo.textContent = 'Exporting…';
  try {
    const res = await fetch(`/api/export-section?person=${encodeURIComponent(ctx.person)}&start=${t.a}&end=${t.b}&name=${encodeURIComponent(esName.value)}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'export failed');
    closeExportDialog();
    ctx.onDone(data.path);
  } catch (e) {
    esError.textContent = String(e.message || e);
    esGo.disabled = false;
    esGo.textContent = 'Export';
  }
}
esStart.addEventListener('input', refreshEsTimes);
esEnd.addEventListener('input', refreshEsTimes);
document.getElementById('es-cancel').onclick = closeExportDialog;
esGo.onclick = runExportSection;
esOverlay.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closeExportDialog(); }
  else if (e.key === 'Enter') { e.preventDefault(); runExportSection(); }
});
