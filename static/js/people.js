// people.js -- sidebar: sorting, search, ticking calls for export, rename, the Auto audiobook switch.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const exportSelection = new Set();

function updateExportButton() {
  const btn = document.getElementById('export-selected');
  btn.textContent = `📦 Export selected (${exportSelection.size})`;
  btn.disabled = exportSelection.size === 0;
  const srtBtn = document.getElementById('export-srt-only');
  srtBtn.textContent = `📜 Export SRT only (${exportSelection.size})`;
  srtBtn.disabled = exportSelection.size === 0;
  const combineBtn = document.getElementById('combine-transcripts');
  combineBtn.textContent = `🧾 Combine selected transcripts (${exportSelection.size})`;
  combineBtn.disabled = exportSelection.size === 0;
}

// --- sidebar sort (date / follow-up priority), persists across reloads ---
let sortField = localStorage.getItem('sortField') || 'date'; // 'date' | 'priority'
let sortDir = localStorage.getItem('sortDir') || 'desc'; // 'asc' | 'desc'

function applySortToPeople() {
  const dir = sortDir === 'asc' ? 1 : -1;
  if (sortField === 'priority') {
    // no-priority-yet calls sink to the bottom regardless of direction --
    // an unscored call isn't "low priority", it's just not analyzed yet.
    people.sort((a, b) => {
      const av = typeof a.followUpPriority === 'number' ? a.followUpPriority : null;
      const bv = typeof b.followUpPriority === 'number' ? b.followUpPriority : null;
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av - bv) * dir;
    });
  } else {
    people.sort((a, b) => ((a.addedDate || 0) - (b.addedDate || 0)) * dir);
  }
}

function updateSortButtons() {
  document.querySelectorAll('.sort-btn').forEach(b => {
    const active = b.dataset.sort === sortField;
    b.classList.toggle('active', active);
    const base = b.dataset.sort === 'date' ? 'Date' : 'Follow-up priority';
    b.textContent = active ? `${base} ${sortDir === 'asc' ? '↑' : '↓'}` : base;
  });
}

document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.onclick = () => {
    const field = btn.dataset.sort;
    if (sortField === field) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDir = 'desc'; // most-recent / highest-priority first by default on a fresh switch
    }
    localStorage.setItem('sortField', sortField);
    localStorage.setItem('sortDir', sortDir);
    loadPeople();
  };
});

async function loadPeople() {
  const res = await fetch('/api/people');
  people = await res.json();
  const studioCount = document.getElementById('studio-call-count');
  if (studioCount) studioCount.textContent = people.length;
  applySortToPeople();
  updateSortButtons();
  // drop selections for people that no longer exist (e.g. renamed away)
  const stillHere = new Set(people.map(p => p.name));
  Array.from(exportSelection).forEach(n => { if (!stillHere.has(n)) exportSelection.delete(n); });
  const ul = document.getElementById('people-list');
  ul.innerHTML = '';
  people.forEach(p => ul.appendChild(personRow(p)));
  updateExportButton();
  applyPeopleSearch();
  if (typeof fuLoaded !== 'undefined' && fuLoaded) fuRender();   // Follow up tab's call links follow the calls list (new uploads, renames)
}

// one call's row in the list (also used to redraw a single row in place after a right-click mark -- see markPerson)
function personRow(p) {
    const li = document.createElement('li');
    li.dataset.person = p.name;
    if (p.reviewed) li.classList.add('reviewed-row');
    if (p.mine === true) li.classList.add('mine-row-mine');
    else if (p.mine === false) li.classList.add('mine-row-other');
    const mineState = p.mine === true ? 'mine' : p.mine === false ? 'other' : 'unset';
    const mineLabels = { mine: 'This was your call', other: 'Closed by another closer', unset: 'Not marked yet' };
    const mineIcon = `<span class="status-icon mine-badge mine-${mineState}" title="${mineLabels[mineState]} — right-click to change">●</span>`;
    const favIcon = `<span class="status-icon fav-badge ${p.favourite ? 'fav-on' : 'fav-off'}" title="${p.favourite ? 'Favourite' : 'Not a favourite'} — right-click to change">${p.favourite ? '★' : '☆'}</span>`;
    const dateStr = fmtDate(p.addedDate);
    const statusLabels = {
      transcribing: ' (transcribing…)',
      writing_doc: ' (writing call review…)',
      review_error: ' (transcript ready · AI review pending)'
    };
    const statusLabel = statusLabels[p.status] || '';
    const inProgress = p.status === 'transcribing' || p.status === 'writing_doc';
    if (inProgress) li.classList.add('processing-row');   // in the queue / being processed: its own colour (Settings -> Call Studio)
    const hasPriority = typeof p.followUpPriority === 'number';
    const priorityBadge = p.saleClosed
      ? `<b class="priority-badge" title="Sale closed — no follow-up needed">✅</b>`
      : hasPriority
      ? `<b class="priority-badge" title="Follow-up priority: ${p.followUpPriority}/5">${p.followUpPriority}</b>`
      : '';
    li.innerHTML = `<input type="checkbox" class="export-check" ${exportSelection.has(p.name) ? 'checked' : ''}>` +
      `<span class="person-name"><span class="pn-title">${p.reviewed ? '<span class="reviewed-tick" title="Reviewed — right-click to undo">✅</span> ' : ''}${displayName(p.name)}${p.cpd ? ' <span class="cpd-badge" title="Marked as CPD — right-click to remove">CPD</span>' : ''}</span><div class="pn-meta">${[dateStr + (p.duration ? ' · ' + fmt(p.duration) : ''), p.closer].filter(x => x && x.trim()).join(' – ')}<span class="status-label">${statusLabel}</span></div>${p.highlight ? `<div class="highlight-line">🔥 – ${escapeHtml(p.highlight)}</div>` : ''}</span>` +
      priorityBadge +
      (inProgress ? '' : `<span class="rename-icon" title="Rename (renames the file everywhere)">✏️</span>`) +
      ` ${favIcon}${mineIcon}`;
    li.dataset.highlight = p.highlight || '';
    li.dataset.cpd = p.cpd ? '1' : '';
    li.dataset.mine = p.mine === true ? 'true' : p.mine === false ? 'false' : '';
    li.dataset.closer = p.closer || '';
    li.onclick = () => selectPerson(p.name);
    li.querySelector('.export-check').onclick = (e) => {
      e.stopPropagation();
      if (e.target.checked) exportSelection.add(p.name); else exportSelection.delete(p.name);
      updateExportButton();
    };
    const renameIcon = li.querySelector('.rename-icon');
    if (renameIcon) renameIcon.onclick = (e) => {
      e.stopPropagation();
      renamePerson(p.name);
    };
    if (current && current.name === p.name) li.classList.add('active');
    return li;
}

// a right-click mark (mine, favourite, CPD, reviewed, closer, highlight): saved on the server, then only that row is redrawn --
// the list isn't rebuilt, so it doesn't jump, re-sort or lose its scroll position
async function markPerson(name, url, patch) {
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) { await loadPeople(); return false; }   // something's off: fall back to a full reload
  const p = people.find(x => x.name === name); if (!p) return true;
  Object.assign(p, patch);
  const old = document.querySelector(`#people-list li[data-person="${CSS.escape(name)}"]`);
  if (old) { const li = personRow(p); li.style.display = old.style.display; old.replaceWith(li); }
  applyPeopleSearch();   // (a filter such as "Mine" or "CPD only" may now include or hide it)
  if (current && current.name === name) Object.assign(current, patch);
  return true;
}

let peopleSearchQuery = '';
// Closer filter: '' = no filter, 'mine' / 'other' = the blue / amber marks, 'closer:<name>' = a named closer.
// Calls not marked either way only show with no filter (same rule as the search results' chips).
let peopleFilter = '';
peopleFilter = csStore('peopleFilter') || '';
// Loom downloads are the calls named LOOM_… : the Calls / Loom boxes next to the filter show or hide each kind
const isLoomName = (name) => /^(?:\d{2}-\d{2}-)?LOOM_/i.test(name || '');
let showCalls = true, showLoom = true;
showCalls = csStore('showCalls') !== '0'; showLoom = csStore('showLoom') !== '0';
// "CPD only": just the calls marked as CPD (right-click -> 🎓 Mark as CPD); overrides the Calls / Loom boxes, works with the closer filter and search
let onlyCpd = false;
onlyCpd = csStore('onlyCpd') === '1';
function passesKindFilter(li) { if (onlyCpd) return li.dataset.cpd === '1'; return isLoomName(li.dataset.person) ? showLoom : showCalls; }   // CPD only = every CPD call or Loom, whatever the Calls / Loom boxes say
function passesPeopleFilter(li) {
  if (!passesKindFilter(li)) return false;
  if (!peopleFilter) return true;
  if (peopleFilter === 'mine') return li.dataset.mine === 'true';
  if (peopleFilter === 'other') return li.dataset.mine === 'false';
  return li.dataset.closer === peopleFilter.slice('closer:'.length);
}
function applyPeopleSearch() {
  const q = peopleSearchQuery.trim().toLowerCase();
  let shown = 0, total = 0;
  document.querySelectorAll('#people-list li').forEach(li => {
    const name = li.dataset.person || '';
    const match = (!q || displayName(name).toLowerCase().includes(q) || name.toLowerCase().includes(q) || (li.dataset.pendingName || '').toLowerCase().includes(q)   // (pending-calls.js rows)
      || (li.dataset.highlight || '').toLowerCase().includes(q)) && passesPeopleFilter(li);
    li.style.display = match ? '' : 'none';
    total++; if (match) shown++;
  });
  const count = document.getElementById('people-filter-count');
  if (count) count.textContent = (peopleFilter || q || !showCalls || !showLoom || onlyCpd) ? `${shown} of ${total}` : '';
}
// Named closers come from the same list as the right-click menu (CLOSERS, defined in context-menu.js --
// which loads after this file, so the dropdown is filled in at start-up rather than here)
function initPeopleFilter() {
  const select = document.getElementById('closer-filter');
  const group = document.createElement('optgroup');
  group.label = 'By closer';
  CLOSERS.forEach(name => { const o = document.createElement('option'); o.value = 'closer:' + name; o.textContent = name; group.appendChild(o); });
  select.appendChild(group);
  select.value = peopleFilter;
  if (select.value !== peopleFilter) { peopleFilter = ''; select.value = ''; } // a saved closer that no longer exists
  select.addEventListener('change', () => {
    peopleFilter = select.value;
    csStore('peopleFilter', peopleFilter);
    applyPeopleSearch();
  });
}
['show-calls', 'show-loom'].forEach(id => {
  const box = document.getElementById(id);
  box.checked = id === 'show-calls' ? showCalls : showLoom;
  box.addEventListener('change', () => {
    if (id === 'show-calls') showCalls = box.checked; else showLoom = box.checked;
    csStore(id === 'show-calls' ? 'showCalls' : 'showLoom', box.checked ? '1' : '0');
    applyPeopleSearch();
  });
});
(() => {
  const box = document.getElementById('only-cpd');
  box.checked = onlyCpd; document.body.classList.toggle('cpd-only', onlyCpd);
  box.addEventListener('change', () => { onlyCpd = box.checked; document.body.classList.toggle('cpd-only', onlyCpd); csStore('onlyCpd', onlyCpd ? '1' : '0'); applyPeopleSearch(); });
})();
document.getElementById('people-search').addEventListener('input', (e) => {
  peopleSearchQuery = e.target.value;
  applyPeopleSearch();
});

// "Auto audiobook" switch -- stored server-side (default off) so it also applies to calls that
// arrive with no browser tab open, e.g. from the Aloware watcher
(async function initAutoAudiobook() {
  const box = document.getElementById('auto-audiobook');
  try {
    const res = await fetch('/api/settings');
    box.checked = !!(await res.json()).autoAudiobook;
  } catch (e) { /* leave unticked */ }
  box.addEventListener('change', async () => {
    const wanted = box.checked;
    try {
      const res = await fetch('/api/settings?autoAudiobook=' + wanted, { method: 'POST' });
      if (!res.ok) throw new Error('save failed');
      box.checked = !!(await res.json()).autoAudiobook;
    } catch (e) {
      box.checked = !wanted; // couldn't save -- show the real state, not the one that didn't stick
    }
  });
})();

async function renamePerson(oldName) {
  const newName = window.prompt(`Rename ${displayName(oldName)} to:`, oldName);
  if (newName === null) return; // cancelled
  const trimmed = newName.trim();
  if (!trimmed || trimmed === oldName) return;
  const res = await fetch(`/api/rename-person?person=${encodeURIComponent(oldName)}`, { method: 'POST', body: trimmed });
  const result = await res.json();
  if (!res.ok) {
    alert(`Rename failed: ${result.error || 'unknown error'}`);
    return;
  }
  const wasCurrent = current && current.name === oldName;
  await loadPeople();
  initClips(); // the server moved this call's clips to its new name
  if (wasCurrent) selectPerson(result.name);
}

async function runExport(btnId, labelPrefix, kinds) {
  const names = Array.from(exportSelection);
  if (!names.length) return;
  const btn = document.getElementById(btnId);
  btn.disabled = true;
  btn.textContent = `${labelPrefix} Exporting ${names.length}…`;
  try {
    const res = await fetch('/api/export-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ people: names, kinds }),
    });
    const result = await res.json();
    if (!res.ok) {
      alert(`Export failed: ${result.error || 'unknown error'}`);
    } else {
      let msg = result.exported.length
        ? `Exported ${result.exported.length} to:\n${result.folder}`
        : `Nothing to export.`;
      if (result.skipped.length) msg += `\n\nSkipped:\n${result.skipped.join('\n')}`;
      alert(msg);
    }
  } finally {
    updateExportButton();
  }
}

document.getElementById('export-selected').onclick = () => runExport('export-selected', '📦', ['docx', 'csv', 'srt']);
document.getElementById('export-srt-only').onclick = () => runExport('export-srt-only', '📜', ['srt']);

document.getElementById('select-mine').onclick = () => {
  const mineNames = people.filter(p => p.mine === true).map(p => p.name);
  // toggle: if every "mine" call is already selected, a second click clears
  // them back out instead of being a one-way, always-adds button.
  const allAlreadySelected = mineNames.length > 0 && mineNames.every(n => exportSelection.has(n));
  if (allAlreadySelected) {
    mineNames.forEach(n => exportSelection.delete(n));
  } else {
    mineNames.forEach(n => exportSelection.add(n));
  }
  loadPeople();
};

document.getElementById('combine-transcripts').onclick = async () => {
  const names = Array.from(exportSelection);
  if (!names.length) return;
  const btn = document.getElementById('combine-transcripts');
  btn.disabled = true;
  btn.textContent = `🧾 Combining ${names.length}…`;
  try {
    const res = await fetch('/api/export-combined-transcripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ people: names }),
    });
    const result = await res.json();
    if (!res.ok) {
      alert(`Combine failed: ${result.error || 'unknown error'}`);
    } else {
      let msg = result.file
        ? `Combined ${result.included.length} transcript(s) into:\n${result.file}`
        : `Nothing to combine.`;
      if (result.skipped.length) msg += `\n\nSkipped:\n${result.skipped.join('\n')}`;
      alert(msg);
    }
  } finally {
    updateExportButton();
  }
};
