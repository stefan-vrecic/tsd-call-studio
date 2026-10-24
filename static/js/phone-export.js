// phone-export.js -- "Export for phone": packs calls into one zip for the Call Studio phone app (see phone_bundle.py).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const pmOverlay = document.getElementById('phone-overlay');
const pmStatus = document.getElementById('pm-status');
const pmGo = document.getElementById('pm-go');
let pmRunning = false;

async function openPhoneExport() {
  const n = exportSelection.size;
  const selRadio = document.getElementById('pm-scope-sel');
  selRadio.disabled = n === 0;
  document.getElementById('pm-scope-sel-text').textContent = `Selected calls (${n}) - tick them in the list on the left`;
  document.getElementById('pm-scope-all').checked = n === 0;
  selRadio.checked = n > 0;
  document.getElementById('pm-scope-all-text').textContent = 'All calls';
  if (!pmRunning) { pmStatus.textContent = ''; pmStatus.className = ''; }
  pmOverlay.style.display = 'flex';
  try {
    const info = await csJSON('/api/phone-info');
    document.getElementById('pm-scope-all-text').textContent =
      `All calls (${info.calls} calls, ${(info.audioBytes / 1e9).toFixed(1)} GB of audio)`;
  } catch (e) { /* the size is only a hint */ }
}

async function runPhoneExport() {
  if (pmRunning) return;
  pmRunning = true;
  pmGo.disabled = true;
  pmStatus.className = '';
  pmStatus.textContent = 'Starting...';
  const fmtEta = (s) => s == null ? '' : s >= 60 ? ` - about ${Math.ceil(s / 60)} min left` : ` - about ${Math.max(1, s)}s left`;
  try {
    const body = { audio: document.getElementById('pm-audio').checked };
    if (document.getElementById('pm-scope-sel').checked) body.people = [...exportSelection];
    const data = await csPost('/api/export-phone', body);
    const job = await csPollJob('/api/audiobook-progress?id=' + encodeURIComponent(data.jobId),
      (j) => { pmStatus.textContent = `${j.message || 'Working...'} - ${Math.floor(j.percent)}%${fmtEta(j.eta_seconds)}`; });
    pmStatus.className = 'ok';
    pmStatus.textContent = `Done (${(job.size / 1e6).toFixed(0)} MB). Saved as: ${job.path}`;
  } catch (e) {
    pmStatus.className = 'err';
    pmStatus.textContent = String(e.message || e);
  }
  pmRunning = false;
  pmGo.disabled = false;
}

document.getElementById('open-phone-export').onclick = openPhoneExport;
document.getElementById('pm-close').onclick = () => { pmOverlay.style.display = 'none'; };
pmGo.onclick = runPhoneExport;
pmOverlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); pmOverlay.style.display = 'none'; } });
