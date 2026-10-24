// core.js -- theme, shared state, formatting helpers, demo mode.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

// --- theme: explicit choice in localStorage wins, otherwise follows the OS ---
function effectiveTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyThemeIcon() {
  document.getElementById('theme-toggle').textContent = effectiveTheme() === 'dark' ? '☀️' : '🌙';
}
(function initTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') document.documentElement.dataset.theme = stored;
})();
document.getElementById('theme-toggle').onclick = () => {
  const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  document.documentElement.dataset.theme = next;
  applyThemeIcon();
};
applyThemeIcon();

let people = [];
let current = null; // manifest
const media = document.getElementById('media');
const playPauseBtn = document.getElementById('playpause');
const stopBtn = document.getElementById('stop');
const seekBar = document.getElementById('seek');
const timeLabel = document.getElementById('time');

function fmt(s) {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
}

// --- demo mode: obfuscate names/filenames for screen recordings ---
// (display-only — never touches real files, manifests, or the docx/CSV that
// "Open doc"/"Open CSV" launch in their native app)
const DEMO_NAMES = [
  "Jordan Reeves", "Casey Morgan", "Taylor Brooks", "Riley Sanders", "Avery Collins",
  "Morgan Ellis", "Quinn Foster", "Rowan Hale", "Skyler James", "Cameron Pierce",
  "Drew Sutton", "Reese Bennett", "Harper Lane", "Emerson Cole", "Sage Whitfield",
  "Blair Donovan", "Finley Marsh", "Kendall Reyes", "Marlowe Stone", "Peyton Vance",
];
// once those 20 are used up, made-up first + last pairs (rather than "Client 155", which looks off in a screenshot)
const DEMO_FIRST = ["Megan", "Chris", "Laura", "Daniel", "Sophie", "Mark", "Rachel", "Paul", "Emma", "Steven", "Hannah", "Gary",
  "Claire", "Andrew", "Natalie", "Kevin", "Amy", "Simon", "Louise", "Neil", "Joanne", "Craig", "Kirsty", "Lee", "Gemma", "Darren",
  "Nicola", "Ian", "Vicky", "Martin", "Helen", "Scott", "Donna", "Jason", "Karen", "Wayne", "Lisa", "Dean", "Tracy", "Adam"];
const DEMO_LAST = ["Walker", "Turner", "Hughes", "Parker", "Edwards", "Wright", "Hall", "Green", "Baker", "Harris", "Clarke", "Lewis",
  "Robinson", "Wood", "Thompson", "Cooper", "Ward", "Morris", "King", "Hill", "Shaw", "Price", "Webb", "Barker", "Fox", "Lloyd",
  "Dixon", "Holmes", "Mills", "Knight", "Spencer", "Grant", "Reid", "Hunt", "Palmer", "Lowe", "Burton", "Chapman", "Fletcher", "Day"];
function nextDemoName(used) {
  const pick = DEMO_NAMES.find(n => !used.has(n));
  if (pick) return pick;
  for (let k = 0; k < DEMO_FIRST.length * DEMO_LAST.length; k++) {
    const n = `${DEMO_FIRST[k % DEMO_FIRST.length]} ${DEMO_LAST[(k * 7 + Math.floor(k / DEMO_FIRST.length)) % DEMO_LAST.length]}`;
    if (!used.has(n)) return n;
  }
  return `Client ${used.size + 1}`;
}
try {   // swap any old "Client N" placeholders for proper made-up names
  const m = JSON.parse(localStorage.getItem('demoNameMap') || '{}'), used = new Set(Object.values(m));
  let changed = false;
  Object.keys(m).forEach(k => { if (/^Client \d+$/.test(m[k])) { m[k] = nextDemoName(used); used.add(m[k]); changed = true; } });
  if (changed) localStorage.setItem('demoNameMap', JSON.stringify(m));
} catch (e) { /* no storage: names are just worked out again */ }
let demoMode = localStorage.getItem('demoMode') === '1';
const demoCheckbox = document.getElementById('demo-mode');
demoCheckbox.checked = demoMode;

function demoMap() {
  try { return JSON.parse(localStorage.getItem('demoNameMap') || '{}'); }
  catch { return {}; }
}
function demoIdentityKey(name) {
  return String(name || '')
    .replace(/^\d{2}-\d{2}-/, '')
    .replace(/^LOOM_/i, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');
}
function displayName(realName) {
  if (!demoMode) return realName;
  const map = demoMap();
  // Calendar/follow-up names contain spaces while recording stems often do
  // not ("Jane Smith" vs "JaneSmith"). Treat those as one identity so the
  // same fake name appears everywhere.
  const identity = demoIdentityKey(realName);
  const existing = Object.keys(map).find(name => demoIdentityKey(name) === identity);
  if (existing) return map[existing];
  if (!map[realName]) {
    const used = new Set(Object.values(map));
    const next = nextDemoName(used);
    map[realName] = next;
    localStorage.setItem('demoNameMap', JSON.stringify(map));
  }
  return map[realName];
}
function displayNamesInText(text, extraNames = []) {
  if (!demoMode || !text) return text;
  const known = [
    ...Object.keys(demoMap()),
    ...people.map(p => p.name),
    ...(typeof fuItems !== 'undefined' ? fuItems.map(i => i.name) : []),
    ...(extraNames || []),
  ].filter(Boolean);
  const unique = [...new Map(known.map(name => [demoIdentityKey(name), String(name)])).values()]
    .sort((a, b) => b.length - a.length);
  let shown = String(text);
  unique.forEach(realName => {
    const spaced = realName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    const variants = [...new Set([realName, spaced])].sort((a, b) => b.length - a.length);
    const fake = displayName(realName);
    variants.forEach(variant => {
      if (variant.length < 3) return;
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      shown = shown.replace(new RegExp(`(^|[^A-Za-z0-9])${escaped}(?=$|[^A-Za-z0-9])`, 'gi'), (_, before) => before + fake);
    });
  });
  return shown;
}
function displayFile(realName) {
  return demoMode ? 'recording.mp3' : realName;
}

demoCheckbox.addEventListener('change', () => {
  demoMode = demoCheckbox.checked;
  localStorage.setItem('demoMode', demoMode ? '1' : '0');
  loadPeople().then(() => {
    if (current) selectPerson(current.name);
  });
  if (typeof fuRender === 'function' && typeof fuLoaded !== 'undefined' && fuLoaded) fuRender();
  if (typeof dayRender === 'function' && typeof dayEvents !== 'undefined' && dayEvents.length) {
    dayRender(dayEvents, typeof dayCallsShown !== 'undefined' ? dayCallsShown.calls : []);
    if (typeof dayCallsRender === 'function' && typeof dayCallsShown !== 'undefined') dayCallsRender(dayCallsShown.calls, dayCallsShown.offset);
  }
  if (typeof alLoad === 'function' && typeof alBusy !== 'undefined') { alBusy = false; alLoad(); }
  window.dispatchEvent(new CustomEvent('callstudio:demo-mode', { detail: { enabled: demoMode } }));
});

function fmtDate(epochSeconds) {
  if (!epochSeconds) return '';
  const d = new Date(epochSeconds * 1000);
  return `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
}

function escapeHtml(s) { return csEsc(s); }   // (shared.js)

// The closer's name (Settings dialog, saved server-side). Follow-up messages are drafted with a [closer] placeholder
// and this fills it in wherever they are shown or copied.
let closerName = 'Stefan';
function fillCloser(text) {
  return text ? String(text).replace(/\[\s*closer(?:\s*name)?\s*\]/gi, closerName) : text;
}
