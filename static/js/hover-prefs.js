// hover-prefs.js -- how long to rest the mouse on something before its pop-up appears, and whether it appears at all, per place (Settings tab > Hover previews).
// Saved in this browser (localStorage "hover-<name>" = {"on": true, "secs": 0.7}). hover-peek.js (journal / swipe pictures) and tracker-hover.js (tracker cards) ask
// hoverDelayMs(name): the delay in milliseconds, or null when that pop-up is switched off. Plain script (not a module); load it after live-call.js (liveStore).

const HOVER_PLACES = {   // name -> label shown in Settings, default seconds
  journal: { label: 'Journal pages', secs: 0.7 },
  swipe: { label: 'Swipe gallery pictures', secs: 1.5 },
  tracker: { label: 'Tracker cards (chart)', secs: 2 },
};

function hoverGet(name) {
  const def = HOVER_PLACES[name];
  let saved = {};
  try { saved = JSON.parse(liveStore('hover-' + name) || '{}') || {}; } catch (e) { /* use the defaults */ }
  const secs = Number(saved.secs);
  return { on: saved.on !== false, secs: Number.isFinite(secs) && secs >= 0.1 ? Math.min(secs, 10) : def.secs };
}
function hoverSet(name, patch) { liveStore('hover-' + name, JSON.stringify({ ...hoverGet(name), ...patch })); }
function hoverDelayMs(name) { const h = hoverGet(name); return h.on ? Math.round(h.secs * 1000) : null; }
