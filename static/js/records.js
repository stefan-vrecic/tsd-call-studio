// records.js -- shared helpers for the business tabs (Clients, Accounting, Delegation): a small document store on the server
// (GET/POST /api/records?name=...) that saves the whole document a moment after each change, plus escaping / money / date helpers.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const recEsc = csEsc;   // (shared.js)
const recId = () => csId(9);
const recToday = csToday;   // YYYY-MM-DD in local time (shared.js)
const recMoney = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const recNum = (v) => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : 0; };
const recMonth = (d) => String(d || '').slice(0, 7);
const recDaysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
const recCsv = (rows) => rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\n');
function recDownload(filename, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

// a document that loads once and saves itself:  const S = recStore('clients', 'cl-status', {clients: []});  S.doc.clients ...  S.save()
function recStore(name, statusId, starter) {
  const S = { doc: JSON.parse(JSON.stringify(starter)), loaded: false, timer: null, onLoad: null };
  const status = () => document.getElementById(statusId);
  S.load = async () => {
    if (S.loaded) return;
    try { const d = await csJSON('/api/records?name=' + name); if (d && typeof d === 'object' && !d.error) S.doc = Object.assign(S.doc, d); } catch (e) { /* offline: start empty */ }
    S.loaded = true;
    if (S.onLoad) S.onLoad();
  };
  S.save = () => {
    clearTimeout(S.timer);
    status().textContent = 'Saving…';
    S.timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/records?name=' + name, { method: 'POST', body: JSON.stringify(S.doc), keepalive: true });
        if (!res.ok) throw new Error('not saved');
        status().textContent = 'Saved ✓'; setTimeout(() => { if (status().textContent === 'Saved ✓') status().textContent = ''; }, 1500);
      } catch (e) { status().textContent = '⚠️ Not saved'; }
    }, 500);
  };
  return S;
}
