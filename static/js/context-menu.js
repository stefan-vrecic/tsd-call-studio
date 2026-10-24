// context-menu.js -- right-click menus (section search; mine / favourite / highlight / closer).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

// (the menu box itself, placeCtxMenu, csMenu and the toast live in ui.js)

// --- right-click "search this section across all calls" ---

document.getElementById('table-wrap').addEventListener('contextmenu', (e) => {
  const cell = e.target.closest('td.section');
  if (!cell) return;
  e.preventDefault();
  const section = cell.dataset.section;
  csMenu(e, [{ text: `Search "${section}" across all calls`, onClick: () => runSectionSearch(section) }]);
});

// --- right-click "was this call mine or someone else's" / favourite / closer ---
const CLOSERS = [];
function addCloserName(name) {
  name = String(name || '').trim();
  if (name && !CLOSERS.includes(name)) {
    CLOSERS.push(name);
    if (typeof refreshPeopleCloserFilter === 'function') refreshPeopleCloserFilter();
  }
}
async function loadClosers() {
  try {
    const data = await csJSON('/api/closers');
    (data.closers || []).forEach(addCloserName);
  } catch (e) { /* call records still supply names when local defaults are unavailable */ }
}

document.getElementById('people-list').addEventListener('contextmenu', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  e.preventDefault();
  const name = li.dataset.person;
  const p = people.find(x => x.name === name);
  // a right-click on/off mark kept with the call (routes/calls.py _set_flag), then the list redraws
  const flag = async (key, on, toast) => { if (await markPerson(name, `/api/set-${key}?person=${encodeURIComponent(name)}&${key}=${on}`, { [key]: on ? Date.now() / 1000 : undefined })) ctxToast(toast); };
  csMenu(e, [
    ...(isLoomName(name) || (p && p.cpd) ? [{ text: p && p.reviewed ? '↩️ Mark as not reviewed' : '✅ Mark as reviewed', onClick: () => flag('reviewed', !(p && p.reviewed), p && p.reviewed ? 'Marked as not reviewed' : '✅ Marked as reviewed') }, '-'] : []),
    { text: 'Mark as mine', onClick: () => setMine(name, true) },
    { text: 'Mark as not mine', onClick: () => setMine(name, false) },
    { text: p && p.favourite ? '★ Remove favourite' : '☆ Add favourite', onClick: () => toggleFavourite(name, p && p.favourite) },
    { text: p && p.cpd ? '↩️ Remove CPD mark' : '🎓 Mark as CPD', onClick: () => flag('cpd', !(p && p.cpd), p && p.cpd ? 'CPD mark removed' : '🎓 Marked as CPD') },
    { text: '🔥 ' + (p && p.highlight ? 'Edit highlight…' : 'Add highlight…'), onClick: () => editHighlight(name) },
    { text: '🔄 Regenerate call review', title: "Write the call review again from this call's transcript (nothing is re-transcribed; your notes, links, closer and marks are kept)", onClick: () => regenerateReview(name) },
    { text: '📌 Save in note-tracker…', title: "Saves this call's link in the Content tab and asks for a note", onClick: () => saveInNoteTracker(name) },
    '-', { label: 'Closer' },
    ...CLOSERS.map(c => ({ text: c, checked: p && p.closer === c, onClick: () => setCloser(name, c) })),
    { text: '＋ Add closer…', onClick: () => { const closer = prompt('Closer name:', p && p.closer || ''); if (closer && closer.trim()) setCloser(name, closer.trim()); } },
  ]);
});


// Right-click a call -> "Save in note-tracker…": makes the call's direct link, asks for a note, and adds "note – Name link" to the Content ideas pad.
async function saveInNoteTracker(name) {
  const url = `${location.origin}/${encodeURIComponent(name)}`;
  const note = window.prompt(`Add a note for ${displayName(name)}?\n(the call's link is saved in the Content tab with your note; leave empty to save just the link)`, '');
  if (note === null) return;   // cancelled: nothing saved
  const line = `${note.trim() ? note.trim() + ' – ' : ''}${displayName(name)} ${url}`;
  try {
    await ciAppendIdea(line);
    ctxToast('Saved in note-tracker (Content tab)');
  } catch (e) {
    alert('Could not save to the note-tracker: ' + (e.message || e));
  }
}

// Writes the call review again from the transcript. Progress shows in the sidebar job box, the header line and the ⏳ queue.
async function regenerateReview(name) {
  const hasReview = !!(people.find(x => x.name === name) || {}).has_docx;
  if (hasReview && !confirm(`Write the call review for ${displayName(name)} again from its transcript?\n\nThe current review is replaced. The recording, transcript, notes, links, closer and marks are kept.`)) return;
  const params = new URLSearchParams({ person: name });
  if (selectedBaseScript) params.set('base_script', selectedBaseScript);
  const res = await fetch('/api/regenerate-review?' + params.toString(), { method: 'POST' });
  const data = await res.json();
  if (!res.ok) { alert(data.error || 'Could not start'); return; }
  pollBatchJob(data.job_id, `Regenerating review: ${displayName(name)}`);
}

async function setMine(name, mine) {   // (these marks redraw just their row: markPerson in people.js)
  await markPerson(name, `/api/set-mine?person=${encodeURIComponent(name)}&mine=${mine}`, { mine });
}

async function editHighlight(name) {
  const p = people.find(x => x.name === name);
  const text = window.prompt(`Highlight which section of ${displayName(name)}?\n(leave empty to remove the highlight)`, (p && p.highlight) || '');
  if (text === null) return; // cancelled
  await markPerson(name, `/api/set-highlight?person=${encodeURIComponent(name)}&text=${encodeURIComponent(text)}`, { highlight: text.trim().slice(0, 120) });
}

async function setCloser(name, closer) {
  if (await markPerson(name, `/api/set-closer?person=${encodeURIComponent(name)}&closer=${encodeURIComponent(closer)}`, { closer })) addCloserName(closer);
}

async function toggleFavourite(name, currentlyFavourite) {
  if (currentlyFavourite) {
    if (!window.confirm(`Remove ${displayName(name)} from favourites?`)) return;
  }
  await markPerson(name, `/api/set-favourite?person=${encodeURIComponent(name)}&favourite=${!currentlyFavourite}`, { favourite: !currentlyFavourite });
}
document.addEventListener('click', () => { ctxMenu.style.display = 'none'; });
