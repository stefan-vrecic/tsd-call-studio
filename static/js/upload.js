// upload.js -- drag & drop upload, job polling, base scripts, batch re-runs.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

// --- drag & drop / upload ---
const drop = document.getElementById('drop');
const fileInput = document.getElementById('file-input');
fileInput.onchange = () => { handleDroppedFiles(Array.from(fileInput.files)); fileInput.value = ''; };
// the sidebar box, plus the copy on the right of the Follow up tab -- both do exactly the same thing
[drop, document.getElementById('fu-drop'), document.getElementById('studio-empty-drop')].filter(Boolean).forEach(zone => {   // + the big box on the empty Call Studio page
  zone.onclick = () => fileInput.click();
  ['dragenter','dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('hover'); }));
  ['dragleave','drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('hover'); }));
  zone.addEventListener('drop', e => { handleDroppedFiles(Array.from(e.dataTransfer.files)); });
});

// ---- "Combine dropped files into one call": a tickbox next to each drop zone (the two are kept in step). Ticked + two or more recordings
// = they are sent as a group, joined by the server (combine.py, in file-name order) and transcribed as ONE call. It is always off when
// the page opens, and switches itself off again after every upload.
const combineChecks = [...document.querySelectorAll('.combine-check')];
combineChecks.forEach(c => c.addEventListener('change', () => combineChecks.forEach(o => { o.checked = c.checked; })));
const combineOn = () => combineChecks.some(c => c.checked);
const combineOff = () => combineChecks.forEach(c => { c.checked = false; });
const MEDIA_EXT_RE = /\.(mp3|m4a|wav|aac|ogg|opus|flac|mp4|mov|m4v|webm|mkv)$/i;

function handleDroppedFiles(files) {
  const combine = combineOn();
  combineOff();                                           // off again for next time, whatever happens below
  if (!files.length) return;
  const audio = files.filter(f => MEDIA_EXT_RE.test(f.name));
  if (combine && audio.length >= 2) {
    uploadCombined(audio.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
    files.filter(f => !audio.includes(f)).forEach(uploadFile);   // anything else dropped with them (a transcript) goes up on its own
  } else {
    files.forEach(uploadFile);
  }
}

async function uploadCombined(files) {
  const group = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const label = `Joining ${files.length} files`;
  let job = null;
  for (let i = 0; i < files.length; i++) {
    const headers = { 'X-Filename': encodeURIComponent(files[i].name), 'X-Combine-Group': group, 'X-Combine-Index': String(i), 'X-Combine-Total': String(files.length) };
    if (selectedBaseScript) headers['X-Base-Script'] = encodeURIComponent(selectedBaseScript);
    const id = 'f' + (++fileUploadSeq);
    fileUploads.set(id, { name: `${files[i].name} (${i + 1} of ${files.length} to join)`, percent: 0 });
    if (typeof qpRender === 'function') qpRender();
    try {
      const res = await postFile(files[i], headers, id);
      if (res.job_id) job = res.job_id;
    } catch (e) {
      alert(`Couldn't send ${files[i].name}, so the files were not joined. Try again.`);
      return;
    } finally {
      fileUploads.delete(id);
      if (typeof qpRender === 'function') qpRender();
    }
  }
  if (job) { displayedJobs.add(job); pollJob(job, label); }
}

const fileUploads = new Map();   // files this tab is sending to the server right now (shown in the ⏳ queue panel): id -> {name, percent}
let fileUploadSeq = 0;

// Sends the file with progress. (A file only becomes a queued job once it has fully arrived, so until then the queue panel
// shows it as uploading from here.)
function postFile(file, headers, id) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) fileUploads.get(id).percent = Math.round(e.loaded / e.total * 100);
      if (typeof qpRender === 'function') qpRender();
    };
    xhr.onload = () => { try { resolve(JSON.parse(xhr.responseText)); } catch (e) { reject(new Error('upload failed')); } };
    xhr.onerror = () => reject(new Error('upload failed'));
    xhr.send(file);
  });
}

async function uploadFile(file) {
  const headers = { 'X-Filename': encodeURIComponent(file.name) };
  if (selectedBaseScript) headers['X-Base-Script'] = encodeURIComponent(selectedBaseScript);
  const id = 'f' + (++fileUploadSeq);
  fileUploads.set(id, { name: file.name, percent: 0 });
  if (typeof qpRender === 'function') qpRender();
  try {
    const { job_id } = await postFile(file, headers, id);
    displayedJobs.add(job_id);
    pollJob(job_id, file.name);
  } finally {
    fileUploads.delete(id);
    if (typeof qpRender === 'function') qpRender();
  }
}

// Jobs started outside the browser (e.g. the Aloware watcher renaming +
// uploading straight to the server) never call uploadFile(), so this tab
// would never know to show them. Poll for every job the server knows about
// and pick up any this tab hasn't rendered yet.
const displayedJobs = new Set();
async function pollAllJobs() {
  let jobs;
  try {
    jobs = await csJSON('/api/jobs');
  } catch (e) {
    return; // transient network hiccup -- just try again next tick
  }
  jobs.forEach(j => {
    if (displayedJobs.has(j.job_id)) return;
    if (j.stage === 'done' || j.stage === 'error') return; // don't resurrect old finished jobs on load
    displayedJobs.add(j.job_id);
    pollJob(j.job_id, j.person || 'New recording');
  });
}
setInterval(pollAllJobs, 3000);
pollAllJobs();

// --- base scripts --- (selection persists as the default across reloads)
let selectedBaseScript = localStorage.getItem('selectedBaseScript') || null;
function setSelectedBaseScript(name) {
  selectedBaseScript = name;
  if (name) localStorage.setItem('selectedBaseScript', name);
  else localStorage.removeItem('selectedBaseScript');
}

async function loadBaseScripts() {
  const res = await fetch('/api/base-scripts');
  const scripts = await res.json();
  const list = document.getElementById('bs-list');
  list.innerHTML = '';

  const noneRow = document.createElement('label');
  noneRow.className = 'bs-option';
  noneRow.innerHTML = `<input type="radio" name="bs" value="" ${selectedBaseScript ? '' : 'checked'}> None`;
  noneRow.querySelector('input').onchange = () => setSelectedBaseScript(null);
  list.appendChild(noneRow);

  scripts.forEach(s => {
    const row = document.createElement('label');
    row.className = 'bs-option';
    const checked = selectedBaseScript === s.name ? 'checked' : '';
    row.innerHTML = `<input type="radio" name="bs" value="${s.name}" ${checked}> ${s.name}`;
    row.querySelector('input').onchange = () => setSelectedBaseScript(s.name);
    list.appendChild(row);
  });

  if (selectedBaseScript && !scripts.find(s => s.name === selectedBaseScript)) selectedBaseScript = null;
}

document.getElementById('bs-add').onclick = () => document.getElementById('bs-file-input').click();
document.getElementById('bs-file-input').onchange = async () => {
  const f = document.getElementById('bs-file-input').files[0];
  if (!f) return;
  const statusEl = document.getElementById('bs-status');
  statusEl.textContent = 'Uploading & extracting text…';
  const res = await fetch('/api/base-scripts/upload', {
    method: 'POST',
    headers: { 'X-Filename': encodeURIComponent(f.name) },
    body: f,
  });
  const j = await res.json();
  if (j.error) {
    statusEl.textContent = 'Error: ' + j.error;
  } else {
    statusEl.textContent = 'Added "' + j.name + '".';
    setSelectedBaseScript(j.name);
    await loadBaseScripts();
    setTimeout(() => statusEl.textContent = '', 4000);
  }
  document.getElementById('bs-file-input').value = '';
};

// The small status line under the "Call Studio" title: "<name>: transcribing… 29%" for whatever is running
// (several jobs -> the newest one plus "+N more"). The progress boxes in the sidebar stay as they were.
const headerJobs = new Map(); // jobId -> status text, insertion order = start order
function setHeaderJob(jobId, text) {
  if (text == null) headerJobs.delete(jobId); else headerJobs.set(jobId, text);
  const el = document.getElementById('header-status');
  const texts = [...headerJobs.values()];
  el.textContent = texts.length ? texts[texts.length - 1] + (texts.length > 1 ? `  (+${texts.length - 1} more)` : '') : '';
}

function pollJob(jobId, filename) {
  const jobsDiv = document.getElementById('jobs');
  const el = document.createElement('div');
  el.className = 'job';
  el.innerHTML = `<div>${filename}</div><div class="stage">starting…</div><div class="bar"><div></div></div>`;
  jobsDiv.prepend(el);

  let lastStage = null;
  const iv = setInterval(async () => {
    const res = await fetch('/api/jobs/' + jobId);
    const j = await res.json();
    el.querySelector('.stage').textContent = j.message || j.stage;
    el.querySelector('.bar > div').style.width = (j.percent || 0) + '%';
    setHeaderJob(jobId, j.stage === 'error' || j.stage === 'done' ? null : (j.message || `${filename}: ${j.stage}`));

    const stageChanged = j.stage !== lastStage;
    lastStage = j.stage;
    if (stageChanged && j.person) {
      // has_transcript (and has_docx/has_csv) can flip mid-job -- e.g. the
      // transcript is ready well before Claude's analysis finishes -- so
      // refresh on every stage change, not just once the whole job is
      // 'done', so an already-open detail view picks that up right away.
      await loadPeople();
      if (current && current.name === j.person) selectPerson(j.person);
    } else if (j.person && current && current.name === j.person && j.stage === 'transcribing') {
      // whisper's own live percent updates within the same "transcribing"
      // stage -- a stage change alone would miss these, so patch the
      // banner text directly every tick instead of waiting for selectPerson.
      const banner = document.getElementById('status-banner');
      banner.textContent = j.message || 'Currently transcribing…';
      banner.style.display = 'block';
    }

    if (j.stage === 'error') {
      el.classList.add('error');
      clearInterval(iv);
    } else if (j.stage === 'done') {
      el.querySelector('.stage').textContent = 'Done — added ' + j.person;
      clearInterval(iv);
      selectPerson(j.person);
      setTimeout(() => el.remove(), 6000);
    }
  }, 1000);
}

function pollBatchJob(jobId, label) {
  const jobsDiv = document.getElementById('jobs');
  const el = document.createElement('div');
  el.className = 'job';
  el.innerHTML = `<div>${label}</div><div class="stage">starting…</div><div class="bar"><div></div></div>`;
  jobsDiv.prepend(el);

  const iv = setInterval(async () => {
    const res = await fetch('/api/jobs/' + jobId);
    const j = await res.json();
    el.querySelector('.stage').textContent = j.message || j.stage;
    el.querySelector('.bar > div').style.width = (j.percent || 0) + '%';
    setHeaderJob(jobId, j.stage === 'error' || j.stage === 'done' ? null : (j.message || `${label}: ${j.stage}`));
    if (j.stage === 'error') {
      el.classList.add('error');
      clearInterval(iv);
    } else if (j.stage === 'done') {
      el.querySelector('.stage').textContent = j.message;
      clearInterval(iv);
      await loadPeople();
      if (j.person && current && current.name === j.person) selectPerson(j.person);   // an open call shows its new review straight away
      setTimeout(() => el.remove(), 8000);
    }
  }, 1000);
}

document.getElementById('fill-gaps').onclick = async () => {
  const params = new URLSearchParams();
  if (selectedBaseScript) params.set('base_script', selectedBaseScript);
  const res = await fetch('/api/scan-gaps?' + params.toString(), { method: 'POST' });
  const { job_id } = await res.json();
  pollBatchJob(job_id, 'Scanning for gaps…');
};

document.getElementById('renormalize').onclick = async () => {
  if (!selectedBaseScript) {
    alert('Select a base script first (left sidebar) — re-running needs one to normalize section names against.');
    return;
  }
  if (!confirm(`Regenerate every call's follow-along doc using "${selectedBaseScript}" for section names? This re-runs Claude for every call that already has a transcript (not the transcription itself).`)) return;
  const params = new URLSearchParams({ base_script: selectedBaseScript, force: '1' });
  const res = await fetch('/api/scan-gaps?' + params.toString(), { method: 'POST' });
  const { job_id } = await res.json();
  pollBatchJob(job_id, `Re-running all calls with "${selectedBaseScript}"…`);
};
// (keyboard: Enter / Space on the big empty-page drop box opens the file picker too)
document.getElementById('studio-empty-drop')?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
