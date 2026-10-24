// queue-panel.js -- the ⏳ button in the sidebar header: a count of what Call Studio is working on, and a panel that lists it in order
// (what's running now with its progress, then what is waiting, with its place in line). Reads /api/queue.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const qpBtn = document.getElementById('queue-btn');
const qpBadge = document.getElementById('queue-badge');
const qpPanel = document.getElementById('queue-panel');
const qpList = document.getElementById('queue-panel-list');
const qpSub = document.getElementById('queue-sub');
let qpItems = [];

// everything shown: what the server reports, plus files this tab is still sending to it
function qpAll() {
  const sending = [...(typeof fileUploads !== 'undefined' ? fileUploads : new Map()).entries()].map(([id, f]) => ({
    id, kind: 'file', name: f.name, state: 'uploading', percent: f.percent, message: f.percent >= 100 ? 'Sent, starting…' : `Sending to Call Studio… ${f.percent}%`, stage: 'uploading' }));
  return [...qpItems, ...sending];
}

function qpRender() {
  const all = qpAll();
  qpBadge.textContent = all.length;
  qpBadge.style.display = all.length ? 'block' : 'none';
  qpBtn.title = all.length ? `${all.length} in the queue` : 'Nothing in the queue';
  const running = all.filter(i => i.state === 'running'), waiting = all.filter(i => i.state === 'waiting'), uploading = all.filter(i => i.state === 'uploading');
  qpSub.textContent = all.length ? [running.length && `${running.length} running`, waiting.length && `${waiting.length} waiting`, uploading.length && `${uploading.length} uploading`].filter(Boolean).join(' · ') : '';
  qpList.innerHTML = '';
  if (!all.length) { qpList.innerHTML = '<div class="q-empty">Nothing in the queue ✓</div>'; return; }
  [...running, ...waiting, ...uploading].forEach(it => {
    const row = document.createElement('div');
    row.className = 'q-row ' + it.state;
    const place = it.state === 'waiting' ? `#${waiting.indexOf(it) + 1} in line`
      : it.state === 'uploading' ? '☁️ uploading' : (it.kind === 'audiobook' ? '📖 audiobook' : 'running');
    const cancellable = it.kind !== 'sync' && it.kind !== 'file';   // the transcript copy and a file still being sent have nothing to cancel here
    const hasBar = it.state === 'running' || (it.state === 'uploading' && it.kind !== 'sync');
    row.innerHTML = '<div class="q-top"><span class="q-name"></span><span class="q-tag"></span>' + (cancellable ? '<button class="q-cancel" title="Cancel this">✕</button>' : '') + '</div><div class="q-msg"></div>' +
      (hasBar ? '<div class="q-bar"><div></div></div>' : '');
    row.querySelector('.q-name').textContent = displayName(it.name);   // honours Demo mode like the rest of the page
    row.querySelector('.q-tag').textContent = place;
    row.querySelector('.q-msg').textContent = it.message || it.stage;
    if (hasBar) row.querySelector('.q-bar > div').style.width = Math.min(100, it.percent || 0) + '%';
    if (cancellable) row.querySelector('.q-cancel').onclick = (e) => { e.stopPropagation(); qpCancel(it); };
    qpList.appendChild(row);
  });
}

// ✕ on a row: asks first, then stops it (a running job's programs are killed, a waiting one just leaves the line)
async function qpCancel(it) {
  const what = it.kind === 'audiobook' ? `the audiobook for ${displayName(it.name)}` : displayName(it.name);
  const detail = it.state === 'running'
    ? 'It is running now, so whatever it has done so far is thrown away.'
    : 'It has not started yet and will just be taken out of the line.';
  if (!confirm(`Cancel ${what}?\n\n${detail}`)) return;
  try {
    const res = await fetch('/api/cancel-job?id=' + encodeURIComponent(it.id), { method: 'POST' });
    if (!res.ok) alert((await res.json()).error || 'Could not cancel');
  } catch (e) { alert('Could not reach Call Studio'); }
  qpPoll();
}

async function qpPoll() {
  try { qpItems = (await csJSON('/api/queue')).items || []; } catch (e) { return; }   // transient: keep what we had
  qpRender();
  if (typeof cbnRender === 'function') cbnRender();   // the open call's status banner (player.js)
}

qpBtn.onclick = (e) => {
  e.stopPropagation();
  if (qpPanel.style.display === 'flex') { qpPanel.style.display = 'none'; return; }
  const r = qpBtn.getBoundingClientRect();
  qpPanel.style.top = (r.bottom + 6) + 'px';
  qpPanel.style.left = Math.max(8, Math.min(r.left - 280, window.innerWidth - 368)) + 'px';
  qpPanel.style.display = 'flex';
  qpPoll();
};
document.addEventListener('click', (e) => { if (!qpPanel.contains(e.target)) qpPanel.style.display = 'none'; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') qpPanel.style.display = 'none'; });
// quick refresh while it's open, a relaxed one for the badge otherwise
setInterval(() => { if (qpPanel.style.display === 'flex') qpPoll(); }, 1500);
setInterval(() => { if (qpPanel.style.display !== 'flex') qpPoll(); }, 5000);
qpPoll();
