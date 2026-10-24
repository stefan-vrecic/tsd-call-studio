// shared.js -- the small helpers every page script needs, defined ONCE (loaded first, before core.js). Each tab's script used to carry
// its own copy (an escape function in 17 files, an id maker in 11, a date formatter in 9 ...); those names are now just aliases of these.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

/** Text -> safe to put inside HTML (and inside a "quoted" attribute). null / undefined -> ''. */
const csEsc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** A Date -> "2026-10-21" in local time. */
const csIso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Today as "2026-10-21" (local time; midnight is the change of day -- Journal and the tracker have their own later cut-offs). */
const csToday = () => csIso(new Date());
/** The Sunday that starts the week "2026-10-21" is in (weeks run Sunday -> Saturday). */
const csWeekStart = (iso) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - d.getDay()); return csIso(d); };

/** A short random id, e.g. "k3f9x0aq" (unique enough for items in one list). */
const csId = (n = 8) => Array.from({ length: n }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');

/** fetch + JSON in one go. Throws an Error with the server's own "error" message when the request fails. */
async function csJSON(url, opts) {
  const r = await fetch(url, opts);
  let d = null; try { d = await r.json(); } catch (e) { /* not JSON */ }
  if (!r.ok) throw new Error((d && d.error) || `request failed (${r.status})`);
  return d;
}
/** POST a value as JSON and get the JSON answer back. */
const csPost = (url, body) => csJSON(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/** Polls a background job's progress URL once a second until it's done (returns the job) or failed (throws its message).
 *  onProgress(job) runs on every in-between check -- for "Working… 40%" lines. */
async function csPollJob(url, onProgress, every = 1000) {
  for (;;) {
    await new Promise(r => setTimeout(r, every));
    const job = await csJSON(url);
    if (job.stage === 'error') throw new Error(job.message || 'job failed');
    if (job.stage === 'done') return job;
    if (onProgress) onProgress(job);
  }
}

/** localStorage that never throws (private window, blocked storage): csStore(key) reads, csStore(key, value) writes. */
function csStore(key, value) {
  try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, String(value)); } catch (e) { /* storage blocked */ }
  return value === undefined ? null : undefined;
}
/** A JSON value kept in localStorage, or the fallback when it's missing or unreadable. */
const csStoreJSON = (key, fallback) => { try { const v = JSON.parse(csStore(key) || 'null'); return v ?? fallback; } catch (e) { return fallback; } };
