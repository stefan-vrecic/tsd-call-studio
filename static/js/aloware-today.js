// aloware-today.js -- Today tab -> "Aloware calls" card: the booked calls of the day the arrows are on (day-plan.js dayOffset; today by default) with where each one stands (in Call Studio / waiting for its recording / no
// recording), and one button that copies a ready-to-paste "download today's Aloware calls" request for Claude (it skips anything already in the library,
// and a no-show or cancellation with no recording is fine). Server side: aloware_today.py + routes/aloware.py.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const alView = document.getElementById('today-view');
const alCard = document.createElement('aside'); alCard.id = 'today-aloware'; alCard.className = 'today-stats';
alView.querySelector('.today-side2').prepend(alCard);
// the "text to move it forward" marker's status (cal_day.py moveup-*): shown next to the call, click to change it
const AL_MU = { pending: ['?? MVFWD', 'mu-pending'], texted: ['texted MVFWD', 'mu-texted'], accepted: ['yes MVFWD', 'mu-accepted'], declined: ['no MVFWD', 'mu-declined'], na: ['NA MVFWD', 'mu-na'] };
const AL_LABEL = { in_library: ['✓ In Call Studio', 'ok'], downloaded: ['✓ Downloaded', 'ok'], upcoming: ['Later today', ''], in_progress: ['Happening now', ''], no_recording: ['No recording', 'none'], no_link: ['No Aloware link', 'none'], pending: ['Needs download', 'pending'] };
let alBusy = false;

async function alLoad() {
  if (alBusy) return; alBusy = true;
  const offset = typeof dayOffset === 'number' ? dayOffset : 0;
  const which = offset === 0 ? 'today' : dayTitle(offset).toLowerCase(), title = '📥 Calls' + (offset === 0 ? '' : ' · ' + dayTitle(offset));
  alCard.innerHTML = `<h3 style="margin:0 0 6px">${title}</h3><p class="biz-dim">Checking ${which}’s calls…</p>`;
  try {
    const d = await csJSON('/api/aloware-today' + (offset ? '?date=' + dayDateStr(offset) : ''));
    if (d.error) throw new Error(d.error);
    const pending = d.calls.filter(c => c.status === 'pending');
    alCard.innerHTML = `<h3 style="margin:0 0 6px">${title} <button class="ctl" id="al-refresh" title="Check again" style="float:right;font-size:12px;padding:1px 8px">↻</button></h3>
      ${d.calls.map(c => { const [t, cls] = c.status === 'upcoming' && offset > 0 ? ['Upcoming', ''] : AL_LABEL[c.status] || [c.status, '']; return `<div class="al-row"><span class="t">${recEsc(c.time)}</span><span class="n">${c.aloware ? `<a href="${recEsc(c.aloware)}" target="_blank" rel="noopener" title="Open in Aloware">${recEsc(displayName(c.name))}</a>` : recEsc(displayName(c.name))}</span>${c.moveUp ? `<button class="al-mu ${AL_MU[c.moveUp][1]}" data-mu="${recEsc(c.id)}" title="Text to move it forward: click to change">${AL_MU[c.moveUp][0]}</button>` : `<button class="al-mu mu-none" data-mu="${recEsc(c.id)}" title="Add a 'text them to move it forward' marker">＋</button>`}${c.call ? `<a class="al-chip ${cls}" href="/${encodeURIComponent(c.call)}" data-call="${recEsc(c.call)}" title="Open the call">${t}</a>` : `<span class="al-chip ${cls}">${t}</span>`}</div>`; }).join('') || `<p class="biz-dim">No booked calls ${which}.</p>`}
      <div style="margin-top:8px"><button class="ctl biz-primary" id="al-copy"${pending.length ? '' : ' disabled'} style="width:100%">${pending.length ? `⬇ Download ${which}’s calls (${pending.length})` : 'Nothing new to download'}</button></div>
      <p class="biz-dim" style="margin:6px 0 0">Copies a request to paste to Claude, which downloads the new ones one by one (already-downloaded calls are skipped; no-shows and cancellations are fine).</p>`;
    alCard.querySelectorAll('button[data-mu]').forEach(b => { b.onclick = (e) => {
      e.stopPropagation();   // (the page-wide click that closes menus would shut this one straight away)
      const id = b.dataset.mu, set = async (status) => {
        b.textContent = '…';
        const c = d.calls.find(x => x.id === id) || {};
        try { await csPost('/api/move-up?id=' + encodeURIComponent(id) + '&status=' + status + '&name=' + encodeURIComponent(c.name || '') + '&date=' + encodeURIComponent((c.start || '').slice(0, 10)), {}); } catch (err) { ctxToast('⚠️ ' + (err.message || 'not changed')); }
        alBusy = false; alLoad();
      };
      csMenu(e, [{ heading: 'Move it forward?' }, { text: '?? MVFWD: not texted yet', onClick: () => set('pending') }, { text: 'texted MVFWD', onClick: () => set('texted') },
        { text: 'yes MVFWD: accepted', onClick: () => set('accepted') }, { text: 'no MVFWD: declined', onClick: () => set('declined') },
        { text: 'NA MVFWD: doesn’t apply', onClick: () => set('na') }, '-', { text: 'Remove the marker', onClick: () => set('none') }]);
    }; });
    alCard.querySelectorAll('a[data-call]').forEach(a => { a.onclick = (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); fuOpenCall(a.dataset.call); }; });
    document.getElementById('al-refresh').onclick = () => { alBusy = false; alLoad(); };
    const btn = document.getElementById('al-copy');
    if (pending.length) btn.onclick = async () => {
      try { await navigator.clipboard.writeText(d.request); ctxToast('Copied. Paste it to Claude in your chat.'); btn.textContent = '✓ Copied: paste it to Claude'; } catch (e) { window.prompt('Copy this and paste it to Claude:', d.request); }
    };
  } catch (e) { alCard.innerHTML = `<h3 style="margin:0 0 6px">${title}</h3><p class="biz-out">⚠️ ${recEsc(e.message || e)}</p>`; }
  alBusy = false;
  if (typeof dayOffset === 'number' && dayOffset !== offset) alLoad();   // the arrows moved while this was loading
}
new MutationObserver(() => { if (alView.style.display !== 'none') alLoad(); }).observe(alView, { attributes: true, attributeFilter: ['style'] });
if (alView.style.display !== 'none') alLoad();
