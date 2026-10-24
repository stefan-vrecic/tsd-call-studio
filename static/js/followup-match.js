// followup-match.js -- finds the Call Studio calls that belong to a Follow up row by name ("Louise Thompson" ->
// 09-03-LouiseThompson). Call names are loose (date prefixes, camelCase, typos like ZainahYahaya, suffixes like -mobile),
// so this scores each call and keeps the good ones. Used by followup-list.js; reads the global `people` list.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

function fmLetters(s) { return (s || '').normalize('NFD').replace(/[^a-zA-Z]/g, '').toLowerCase(); }

// "09-12-DFPetrinaNoyes-mobile" -> ['df', 'petrina', 'noyes', 'mobile'] (date prefix dropped, camelCase split)
function fmCallTokens(callName) {
  const bare = callName.replace(/^\d{1,2}-\d{1,2}-/, '');
  return bare.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^a-zA-Z]+/).map(t => t.toLowerCase()).filter(Boolean);
}

function fmEditDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

function fmClose(a, b) { return a === b || (a.length >= 4 && b.length >= 4 && fmEditDistance(a, b) <= (a.length >= 6 ? 2 : 1)); }

// 0 = no match; higher = better. 3 = full name, 2 = full name with a typo, 1-1.5 = only a first name to go on.
function fmScore(fuName, callName) {
  const words = fuName.split(/[\s-]+/).map(fmLetters).filter(Boolean);   // "Bonner-Cooke" -> two surname words
  if (!words.length) return 0;
  const tokens = fmCallTokens(callName);
  const callKey = tokens.join('');
  const first = words[0], lasts = words.slice(1);
  // a call saved under just the first name ("Claire", "JeanAnn"): possible, but not certain
  const rest = tokens.filter(t => t !== 'mobile' && t !== 'full');
  const firstOnly = rest.join('') === first;
  if (lasts.length) {
    if (callKey.includes(words.join(''))) return 3;
    const hasLast = lasts.some(l => tokens.includes(l) || (l.length >= 5 && callKey.includes(l)));
    if (hasLast && tokens.includes(first)) return 3;
    const hasFirst = tokens.some(t => fmClose(t, first));
    if ((hasLast && hasFirst) || (lasts.some(l => tokens.some(t => fmClose(t, l))) && tokens.includes(first))) return 2;
    return firstOnly ? 1 : 0;
  }
  // single name ("Claire"): only calls named just that person, or that person + a surname
  if (!tokens.includes(first) && !callKey.startsWith(first)) return 0;
  return firstOnly ? 1.5 : 1;
}

// Call's date as month*100+day (from the "MM-DD-" prefix, else when it was added), to rank calls near the session first.
function fmCallDay(p) {
  const m = p.name.match(/^(\d{1,2})-(\d{1,2})-/);
  if (m) return +m[1] * 100 + +m[2];
  if (p.addedDate) { const d = new Date(p.addedDate * 1000); return (d.getMonth() + 1) * 100 + d.getDate(); }
  return null;
}

/** The calls that look like this follow-up's person, best first: [{ name, score }]. */
function fuMatchCalls(it) {
  if (!Array.isArray(people) || !people.length) return [];
  const s = new Date(it.start);
  const sessionDay = isNaN(s) ? null : (s.getMonth() + 1) * 100 + s.getDate();
  const found = [];
  people.forEach(p => {
    const score = fmScore(it.name, p.name);
    if (!score) return;
    const day = fmCallDay(p);
    found.push({ name: p.name, score, gap: sessionDay != null && day != null ? Math.abs(day - sessionDay) : 9999 });
  });
  const best = Math.max(0, ...found.map(f => f.score));
  return found.filter(f => f.score >= Math.min(best, 2)).sort((a, b) => b.score - a.score || a.gap - b.gap).slice(0, 4);
}

/** Opens a call in the Call Studio tab (same page). Cmd/Ctrl/middle-click on the link opens it in a new browser tab instead. */
function fuOpenCall(name) {
  showTab('studio');
  selectPerson(name);
  document.querySelector(`#people-list li[data-person="${CSS.escape(name)}"]`)?.scrollIntoView({ block: 'nearest' });
}
