// loom.js -- the "Download Loom" button: paste one Loom link or many (one per line, or a whole message with links in it) and they join a
// queue that downloads them one after another (the server runs yt-dlp; each is saved as LOOM_<title>.mp3 and added to the call list).
// Keep adding links while it works. Progress is polled from /api/jobs/<id>; each running download also shows in the ⏳ queue.
// The dialog can be closed any time: the queue carries on, the Download Loom button shows how far it is, and a message pops up as each
// one finishes. Links still waiting are remembered in this browser (localStorage "loomQueue"), so a page refresh doesn't lose them.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const loomOverlay = document.getElementById('loom-overlay');
const loomUrl = document.getElementById('loom-url');
const loomStatus = document.getElementById('loom-status');
const loomGo = document.getElementById('loom-go');
const loomList = document.getElementById('loom-queue');
const loomBtn = document.getElementById('open-loom');
const loomBtnIdle = loomBtn.innerHTML;
let loomQ = [];          // [{id, url, state: 'waiting' | 'running' | 'done' | 'error', job, percent, message}]
let loomWorking = false;
loomQ = [].concat(csStoreJSON('loomQueue', [])).filter(i => i && i.state !== 'done');
const loomKeep = () => { csStore('loomQueue', JSON.stringify(loomQ.filter(i => i.state !== 'done'))); };
const loomEsc = csEsc;   // (shared.js)

function loomSay(text, cls) { loomStatus.textContent = text; loomStatus.className = cls || ''; }

async function showLoomKind() {   // the dialog says which kind (set in Settings) will be downloaded
  let mode = 'audio';
  try { mode = (await csJSON('/api/settings')).loomMode || 'audio'; } catch (e) { /* default */ }
  document.getElementById('loom-kind').textContent = mode === 'video' ? 'a video (smallest version)' : 'an mp3 (audio only)';
}

function loomRender() {
  const open = loomQ.filter(i => i.state === 'waiting' || i.state === 'running'), run = loomQ.find(i => i.state === 'running');
  const doneCount = loomQ.filter(i => i.state === 'done').length;
  loomBtn.innerHTML = open.length ? `⬇️<br>Loom ${doneCount + 1}/${doneCount + open.length}<br>${run ? Math.round(run.percent || 0) + '%' : '…'}` : loomBtnIdle;
  loomList.innerHTML = loomQ.map((i, n) => {
    const what = i.state === 'running' ? `<span class="lq-bar"><i style="width:${Math.min(100, i.percent || 0)}%"></i></span>${loomEsc(i.message || 'Starting…')}`
      : i.state === 'waiting' ? 'waiting' : i.state === 'done' ? '✅ ' + loomEsc(i.message) : '⚠️ ' + loomEsc(i.message);
    const act = i.state === 'waiting' ? `<button class="ctl" data-lq-x="${n}" title="Take it out of the queue">✕</button>`
      : i.state === 'error' ? `<button class="ctl" data-lq-retry="${n}" title="Try again">↻</button><button class="ctl" data-lq-x="${n}" title="Remove">✕</button>`
      : i.state === 'done' ? `<button class="ctl" data-lq-x="${n}" title="Clear from this list">✕</button>` : '';
    return `<li class="lq-${i.state}"><b>${n + 1}.</b><span class="lq-main"><a href="${loomEsc(i.url)}" target="_blank" rel="noopener">${loomEsc(i.url.replace(/^https?:\/\/(www\.)?/, ''))}</a><small>${what}</small></span>${act}</li>`;
  }).join('');
  loomList.style.display = loomQ.length ? '' : 'none';
  loomList.querySelectorAll('[data-lq-x]').forEach(b => b.onclick = () => { loomQ.splice(+b.dataset.lqX, 1); loomKeep(); loomRender(); });
  loomList.querySelectorAll('[data-lq-retry]').forEach(b => b.onclick = () => { Object.assign(loomQ[+b.dataset.lqRetry], { state: 'waiting', job: null, percent: 0, message: '' }); loomKeep(); loomRender(); loomWork(); });
}

function openLoomDialog() {
  showLoomKind(); loomSay(''); loomRender();
  loomOverlay.style.display = 'flex';
  loomUrl.focus(); loomUrl.select();
}
function closeLoomDialog() { loomOverlay.style.display = 'none'; }   // the queue carries on (see the ⏳ queue)

// paste box -> the Loom links in it join the queue (duplicates of ones already waiting are skipped)
function loomAdd() {
  const links = [...new Set((loomUrl.value.match(/https?:\/\/[^\s<>"')]+/g) || []).map(u => u.replace(/[.,;]+$/, '')))];
  if (!links.length) { loomSay('Paste a link first (one per line for several).', 'err'); return; }
  const queued = new Set(loomQ.filter(i => i.state === 'waiting' || i.state === 'running').map(i => i.url));
  const fresh = links.filter(u => !queued.has(u));
  fresh.forEach(url => loomQ.push({ id: csId(), url, state: 'waiting', percent: 0, message: '' }));
  loomUrl.value = '';
  loomSay(fresh.length ? `Added ${fresh.length} to the queue${links.length > fresh.length ? ` (${links.length - fresh.length} already in it)` : ''}.` : 'Already in the queue.', 'ok');
  loomKeep(); loomRender(); loomWork();
}

// one at a time, oldest first
async function loomWork() {
  if (loomWorking) return;
  loomWorking = true;
  try {
    for (let item; (item = loomQ.find(i => i.state === 'running') || loomQ.find(i => i.state === 'waiting'));) {
      try {
        if (!item.job) {   // (an item that was already running before a refresh just carries on being watched)
          item.state = 'running'; item.message = 'Starting…'; loomRender();
          const res = await fetch('/api/loom-download', { method: 'POST', body: JSON.stringify({ url: item.url, base_script: (typeof selectedBaseScript !== 'undefined' && selectedBaseScript) || null }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'could not start');
          item.job = data.job_id; loomKeep();
        }
        for (;;) {
          await new Promise(r => setTimeout(r, 1000));
          const r = await fetch('/api/jobs/' + item.job);
          if (!r.ok) throw new Error('the download was lost (Call Studio restarted?) — press ↻ to try again');
          const job = await r.json();
          if (!loomQ.includes(item)) break;   // removed meanwhile
          item.percent = job.percent || 0; item.message = job.message || 'Working…';
          if (job.stage === 'error') throw new Error(job.message || 'download failed');
          if (job.stage === 'done') {
            item.state = 'done';
            if (loomOverlay.style.display !== 'flex') ctxToast('✅ Loom downloaded: ' + (job.message || ''));
            if (typeof loadPeople === 'function') loadPeople();
            break;
          }
          loomRender();
        }
      } catch (e) {
        item.state = 'error'; item.message = String(e.message || e);
        if (loomOverlay.style.display !== 'flex') ctxToast('⚠️ Loom download failed: ' + item.message);
      }
      loomKeep(); loomRender();
    }
  } finally { loomWorking = false; loomRender(); }
}

document.getElementById('open-loom').onclick = openLoomDialog;
document.getElementById('loom-close').onclick = closeLoomDialog;
loomGo.onclick = loomAdd;
loomUrl.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); loomAdd(); } });
loomOverlay.addEventListener('mousedown', (e) => { if (e.target === loomOverlay) closeLoomDialog(); });   // a click outside the box closes it
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && loomOverlay.style.display === 'flex') { e.preventDefault(); closeLoomDialog(); } });
loomRender();
if (loomQ.some(i => i.state === 'waiting' || i.state === 'running')) loomWork();   // pick up where a refresh left off
