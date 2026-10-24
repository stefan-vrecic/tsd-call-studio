// transcript-search.js -- "🔎 Search all transcripts": type a word or phrase, get every place it was said across all your calls (newest call first),
// with a little of the conversation around it. Click a result to open that call at that moment. Full text search done by the server
// (/api/transcript-search, see routes/transcript_search.py). Esc closes. Plain script (not a module); load after player.js.

const tsBtn = document.getElementById('ts-open');
let tsBox = null, tsTimer = null;

const tsEsc = csEsc;   // (shared.js)
const tsStamp = (s) => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s % 60).padStart(2, '0'); };
const tsMark = (text, q) => !q.trim() ? tsEsc(text) : tsEsc(text).replace(new RegExp(tsEsc(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'ig'), (m) => `<mark>${m}</mark>`);

function tsClose() { if (tsBox) tsBox.style.display = 'none'; }
function tsShow() {
  if (!tsBox) {
    tsBox = document.createElement('div');
    tsBox.id = 'ts-overlay';
    tsBox.innerHTML = `<div class="ts-panel"><div class="ts-head"><input id="ts-q" type="search" placeholder="Words or phrase (optional with section)" autocomplete="off"><button id="ts-x" title="Close (Esc)">✕</button></div><div class="ts-filters"><input id="ts-section" placeholder="Section, e.g. Discovery"><input id="ts-closer" placeholder="Closer name"><button class="ctl" id="ts-go">Search</button></div><div id="ts-meta" class="ts-meta"></div><div id="ts-results"></div></div>`;
    document.body.appendChild(tsBox);
    tsBox.addEventListener('mousedown', (e) => { if (e.target === tsBox) tsClose(); });
    tsBox.querySelector('#ts-x').onclick = tsClose;
    tsBox.querySelector('#ts-q').addEventListener('input', () => { clearTimeout(tsTimer); tsTimer = setTimeout(tsRun, 300); });
    tsBox.querySelector('#ts-go').onclick = tsRun;
    ['#ts-section', '#ts-closer'].forEach(sel => tsBox.querySelector(sel).addEventListener('keydown', e => { if (e.key === 'Enter') tsRun(); }));
  }
  tsBox.style.display = 'flex';
  const q = tsBox.querySelector('#ts-q'); q.focus(); q.select();
}

async function tsRun() {
  const q = tsBox.querySelector('#ts-q').value.trim(), section = tsBox.querySelector('#ts-section').value.trim(), closer = tsBox.querySelector('#ts-closer').value.trim(), meta = tsBox.querySelector('#ts-meta'), out = tsBox.querySelector('#ts-results');
  if (q.length < 2 && !section) { meta.textContent = 'Type at least 2 letters, or choose a section.'; out.innerHTML = ''; return; }
  meta.textContent = 'Searching…';
  let d;
  try { d = await csJSON('/api/transcript-search?' + new URLSearchParams({q, section, closer})); } catch (e) { meta.textContent = e instanceof TypeError ? 'Can\'t reach the server.' : '⚠️ ' + e.message; return; }
  if (tsBox.querySelector('#ts-q').value.trim() !== q) return;   // you've typed more since; a newer search is on its way
  meta.textContent = d.total ? `${d.total}${d.capped ? '+' : ''} mention${d.total === 1 ? '' : 's'} in ${d.calls.length} call${d.calls.length === 1 ? '' : 's'}` : 'Nothing found.';
  out.innerHTML = d.calls.map(c => `<section class="ts-call"><h4>${tsEsc(typeof displayName === 'function' ? displayName(c.person) : c.person)} <span>${c.count}</span></h4>${c.matches.map(m =>
    `<button class="ts-hit" data-person="${tsEsc(c.person)}" data-start="${m.start == null ? '' : m.start}">${m.start == null ? '' : `<b>${tsStamp(m.start)}</b>`}<span>${tsMark(m.text, q)}</span></button>`).join('')}${c.count > c.matches.length ? `<div class="ts-more">+ ${c.count - c.matches.length} more in this call</div>` : ''}</section>`).join('');
  out.querySelectorAll('.ts-hit').forEach(b => b.onclick = () => {
    if (!people.find(p => p.name === b.dataset.person)) { ctxToast('That call isn\'t in the list (not loaded yet?)'); return; }
    tsClose();
    if (typeof showTab === 'function') showTab('studio');
    selectPerson(b.dataset.person, b.dataset.start === '' ? undefined : +b.dataset.start);
  });
}

tsBtn.onclick = tsShow;
window.addEventListener('callstudio:call-search', e => { tsShow(); const d = e.detail || {}; tsBox.querySelector('#ts-q').value = d.query || ''; tsBox.querySelector('#ts-section').value = d.section || ''; tsBox.querySelector('#ts-closer').value = d.closer || ''; tsRun(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && tsBox && tsBox.style.display !== 'none') tsClose();
  else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); tsShow(); }   // Cmd/Ctrl+Shift+F
});
