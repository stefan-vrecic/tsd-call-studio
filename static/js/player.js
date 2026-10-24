// player.js -- selectPerson (draws one call) plus the main player controls, A/B markers and Export section button.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

// ---- the status banner under the call's name: what's still happening to this call, and (on a second line) its audiobook.
// Uses the ⏳ queue (qpItems, refreshed every few seconds by queue-panel.js), so calls added by the Drive inbox update too.
const CBN_STAGES = {
  queued: 'Waiting in the queue…',
  transcribing: 'Currently transcribing…',
  writing_doc: 'Transcript ready — writing the call review…',
  review_error: 'Transcript ready — AI review could not be generated. Your recording and transcript are safe.'
};
let cbnHadJob = false;   // this call was in the queue last time: when it leaves, reload so the finished review shows
function cbnRender() {
  const banner = document.getElementById('status-banner');
  const p = current;
  if (!p) { banner.style.display = 'none'; return; }
  const items = typeof qpItems !== 'undefined' ? qpItems : [];
  const callJob = items.find(i => i.kind === 'call' && i.name === p.name);
  const abJob = items.find(i => i.kind === 'audiobook' && i.name === p.name);
  let top = '';
  if (callJob) top = callJob.stage === 'transcribing' && callJob.message ? callJob.message.replace(/^[^:]+:\s*/, 'Currently ') : (CBN_STAGES[callJob.stage] || callJob.message || 'Processing…');
  else if (p.status && CBN_STAGES[p.status]) top = CBN_STAGES[p.status];
  let ab = '';
  if (abJob) ab = abJob.state === 'waiting' ? '🎧 Audiobook queued: it starts as soon as the one before it is done' : '🎧 Audiobook: ' + (abJob.message || 'building…');
  else if (top && p.audiobookAuto && !p.has_audiobook) ab = '🎧 The audiobook is queued to build automatically once the review is done';
  banner.innerHTML = '';
  [top, ab].filter(Boolean).forEach((t, k) => { const d = document.createElement('div'); d.textContent = t; if (k || !top) d.className = 'cbn-ab'; banner.appendChild(d); });
  banner.style.display = top || ab ? 'block' : 'none';
  if (cbnHadJob && !callJob && !abJob) { cbnHadJob = false; loadPeople().then(() => { if (current && current.name === p.name) selectPerson(p.name); }); }
  else cbnHadJob = !!(callJob || abJob);
}

function selectPerson(name, autoSeconds) {
  const p = people.find(x => x.name === name);
  if (!p) return;
  current = p;
  document.querySelectorAll('#people-list li').forEach(li => li.classList.toggle('active', li.dataset.person === name));

  // Keep the address bar itself showing this call's direct link at all
  // times, not just when opened via one -- clicking anyone in the sidebar
  // makes their link immediately visible (and copyable) with no extra step.
  const directPath = '/' + encodeURIComponent(name);
  if (location.pathname !== directPath) {
    history.replaceState(null, '', directPath);
  }

  document.getElementById('empty').style.display = 'none';
  document.getElementById('player-bar').style.display = 'block';
  document.getElementById('now-playing').textContent = displayName(name) + '  (' + displayFile(p.mp3) + ')';

  cbnRender();

  const docBtn = document.getElementById('open-doc');
  const csvBtn = document.getElementById('open-csv');
  const srtBtn = document.getElementById('open-srt');
  docBtn.disabled = !p.has_docx;
  docBtn.title = p.has_docx ? '' : p.status === 'review_error' ? 'AI review failed; the transcript is still available' : 'Not ready yet — still writing the call review';
  csvBtn.disabled = !p.has_csv;
  csvBtn.title = p.has_csv ? '' : p.status === 'review_error' ? 'AI review failed; no timestamp summary was generated' : 'Not ready yet — still writing the call review';
  srtBtn.disabled = !p.has_transcript;
  srtBtn.title = p.has_transcript ? 'Jump to the transcript below' : 'Not ready yet — still transcribing';
  docBtn.onclick = () => { if (p.has_docx) fetch('/api/open-file?person=' + encodeURIComponent(name) + '&type=docx'); };
  csvBtn.onclick = () => { if (p.has_csv) fetch('/api/open-file?person=' + encodeURIComponent(name) + '&type=csv'); };
  srtBtn.onclick = () => {
    if (!p.has_transcript) return;
    document.getElementById('transcript-heading').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const copyBtn = document.getElementById('copy-srt');
  copyBtn.disabled = !p.has_transcript;
  copyBtn.title = p.has_transcript ? 'Copy the whole .srt file to your clipboard' : 'Not ready yet — still transcribing';
  copyBtn.onclick = async () => {
    if (!p.has_transcript) return;
    const original = copyBtn.textContent;
    try {
      const res = await fetch('/api/transcript-raw?person=' + encodeURIComponent(name));
      if (!res.ok) throw new Error('fetch failed');
      const text = await res.text();
      // the call's name on top, so a pasted transcript says whose it is ("name: AnneJones", then the .srt)
      await navigator.clipboard.writeText(`name: ${typeof displayName === 'function' ? displayName(name) : name}\n\n${text}`);
      copyBtn.textContent = '✅ Copied!';
    } catch (e) {
      copyBtn.textContent = '⚠️ Copy failed';
    }
    setTimeout(() => { copyBtn.textContent = original; }, 1500);
  };
  // Export chapters (the timeline as CSV on the clipboard) lives on the right-click menu of the Export audiobook button
  const hasRows = !!(p.rows && p.rows.length);
  document.getElementById('export-audiobook').oncontextmenu = (e) => {
    e.preventDefault();
    csMenu(e, [
      { text: '🧩 Export chapters (copy as CSV)', title: 'Copy the timeline (timestamp + section) as CSV to your clipboard', disabled: !hasRows, keepOpen: true,   // stays up a moment so the result shows
        onClick: async (ev, item) => {
          const csvEscape = (s) => `"${String(s).replace(/"/g, '""')}"`;
          const csv = ['Timestamp,Section', ...p.rows.map(r => `${csvEscape(r.ts)},${csvEscape(r.section)}`)].join('\n');
          try { await navigator.clipboard.writeText(csv); item.textContent = '✅ Copied!'; } catch (err) { item.textContent = '⚠️ Copy failed'; }
          setTimeout(() => { ctxMenu.style.display = 'none'; }, 800);
        } },
      { text: '💾 Download audiobook locally', title: 'Build the chaptered .m4b on this Mac only, without sending it to Drive (shows it in Finder if it already exists)', disabled: !hasRows, onClick: () => runAudiobook(true) },
    ]);
  };
  const audiobookBtn = document.getElementById('export-audiobook');
  const hasChapters = !!(p.rows && p.rows.length);
  const audiobookLabel = () =>
    p.has_audiobook && p.audiobookDrivePath ? '📖 Reveal audiobook'
    : p.has_audiobook ? '📖 Send audiobook to Drive'
    : '📖 Export audiobook';
  const audiobookTip = () =>
    !hasChapters ? 'Not ready yet — no timeline rows'
    : p.has_audiobook && p.audiobookDrivePath ? 'Already generated and in your Drive folder — click to reveal it in Finder'
    : p.has_audiobook ? 'Saved locally but not in your Drive folder yet — click to copy it there'
    : 'Create a chaptered .m4b audiobook and put it in your Drive folder';
  audiobookBtn.disabled = !hasChapters;
  audiobookBtn.textContent = audiobookLabel();
  audiobookBtn.title = audiobookTip();
  // localOnly = right-click "Download audiobook locally": build it on this Mac and skip the Drive copy
  const runAudiobook = async (localOnly) => {
    if (!hasChapters) return;
    audiobookBtn.disabled = true;
    audiobookBtn.textContent = 'Starting…';
    const fmtEta = (s) => s == null ? '' : s >= 60 ? ` · ~${Math.ceil(s / 60)} min left` : ` · ~${Math.max(1, s)}s left`;
    try {
      const res = await fetch('/api/export-audiobook?person=' + encodeURIComponent(name) + (localOnly ? '&drive=0' : ''), { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      if (data.alreadyExisted) {
        audiobookBtn.textContent = '✅ Revealed in Finder';
      } else {
        // poll the background job (encode, then upload) for a live percentage / time estimate
        for (;;) {
          await new Promise(r => setTimeout(r, 1000));
          const pr = await fetch('/api/audiobook-progress?id=' + encodeURIComponent(data.jobId));
          const job = await pr.json();
          if (!pr.ok) throw new Error(job.error || 'lost track of the job');
          if (job.path) { p.has_audiobook = true; p.audiobookPath = job.path; }
          if (job.stage === 'error') throw new Error(job.message || 'job failed');
          if (job.stage === 'done') {
            if (!localOnly) p.audiobookDrivePath = job.drivePath;
            audiobookBtn.textContent = localOnly ? '✅ Saved on this Mac' : '✅ In your Drive folder (syncing)';
            break;
          }
          if (job.stage === 'queued') { audiobookBtn.textContent = 'Queued…'; continue; }
          const verb = job.stage === 'uploading' ? 'Copying to Drive…' : 'Generating…';
          audiobookBtn.textContent = `${verb} ${Math.floor(job.percent)}%${fmtEta(job.eta_seconds)}`;
        }
      }
    } catch (e) {
      audiobookBtn.textContent = '⚠️ Failed';
      audiobookBtn.title = String(e.message || e);
      console.error('export-audiobook failed:', e);
    }
    setTimeout(() => { audiobookBtn.disabled = !hasChapters; audiobookBtn.textContent = audiobookLabel(); }, 3000);
  };
  audiobookBtn.onclick = () => runAudiobook(false);
  renderDirectLink(name);
  renderCopyTranscriptLink(name, p.has_transcript);
  renderCopyPathLink(p.audioPath);
  renderExtLink('link-recording', 'Recording link', 'recording', name, p.recordingLink);
  renderExtLink('link-crm', 'CRM link', 'crm', name, p.crmLink);
  renderExtLink('link-notes', 'Notes/Gcal link', 'notes', name, p.notesLink);
  const isVideo = /\.(mp4|mov|m4v)$/i.test(p.mp3);
  media.style.display = isVideo ? 'block' : 'none';
  media.src = '/media/' + encodeURIComponent(name);
  media.load();

  renderObjectionBox(p);

  const table = document.getElementById('timeline');
  const tbody = document.getElementById('timeline-body');
  tbody.innerHTML = '';
  (p.rows || []).forEach(r => {
    const tr = document.createElement('tr');
    tr.className = 'row';
    tr.innerHTML = `<td class="ts">${r.ts}</td><td class="section" data-section="${r.section}">${r.section}</td><td>${r.desc}</td>`;
    if (r.seconds != null) {
      tr.onclick = () => { media.currentTime = r.seconds; media.play(); scrollTranscriptTo(r.seconds); abMainAtDefault = false; abMain.set(r.seconds, rowEndSeconds(r)); };
      tr.dataset.seconds = r.seconds;
    }
    tbody.appendChild(tr);
  });
  table.style.display = 'table';
  // new call -> markers back to the whole call (the exact end is filled in once the audio's duration loads)
  abPersistFor = null; // (nothing is saved while the markers are being put back)
  resetExtraRanges(); // C-D, E-F ... belong to the call they were made on
  abMainAtDefault = true;
  abMain.set(0, abMain.duration() || ((p.rows && p.rows.length) ? Math.max(...p.rows.map(rowEndSeconds)) : 60));
  abRestore(p.name); // ...then the A-B / C-D ... you left on this call last time come back
  loadTranscriptPanel(p);

  const skippedHeading = document.getElementById('skipped-heading');
  const skippedTable = document.getElementById('skipped-table');
  const skippedBody = document.getElementById('skipped-body');
  skippedBody.innerHTML = '';
  if (Array.isArray(p.skippedSections) && p.skippedSections.length) {
    p.skippedSections.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="section">${s.section}</td><td>${s.status}</td>`;
      skippedBody.appendChild(tr);
    });
    skippedHeading.style.display = 'block';
    skippedTable.style.display = 'table';
  } else {
    skippedHeading.style.display = 'none';
    skippedTable.style.display = 'none';
  }

  const recsHeading = document.getElementById('recs-heading');
  const recsList = document.getElementById('recs-list');
  recsList.innerHTML = '';
  if (Array.isArray(p.recommendations) && p.recommendations.length) {
    p.recommendations.forEach(rec => {
      const li = document.createElement('li');
      li.style.marginBottom = '8px';
      li.textContent = rec;
      recsList.appendChild(li);
    });
    recsHeading.style.display = 'block';
    recsList.style.display = 'block';
  } else {
    recsHeading.style.display = 'none';
    recsList.style.display = 'none';
  }

  document.getElementById('qa-section').style.display = 'block';
  renderQaHistory(p.qa || []);

  renderSpinNotes(p.spinNotes);

  if (autoSeconds != null) {
    media.addEventListener('loadedmetadata', function once() {
      media.currentTime = autoSeconds;
      media.play();
      media.removeEventListener('loadedmetadata', once);
    });
  }
}

playPauseBtn.onclick = () => media.paused ? media.play() : media.pause();
stopBtn.onclick = () => { media.pause(); media.currentTime = 0; };
media.addEventListener('play', () => playPauseBtn.textContent = '⏸');
media.addEventListener('pause', () => playPauseBtn.textContent = '▶');
media.addEventListener('timeupdate', () => {
  if (!seekBar.dragging) seekBar.value = media.duration ? (media.currentTime / media.duration * 100) : 0;
  seekBar.style.setProperty('--pct', seekBar.value + '%');
  timeLabel.textContent = fmt(media.currentTime) + ' / ' + fmt(media.duration || 0);
  document.querySelectorAll('#timeline tr.row').forEach(tr => {
    const s = tr.dataset.seconds;
    tr.classList.toggle('playing', s != null && media.currentTime >= +s && media.currentTime < +s + 90 && Math.abs(media.currentTime - +s) < 45);
  });
  document.querySelectorAll('#transcript-panel .transcript-line').forEach(el => {
    el.classList.toggle('playing', media.currentTime >= +el.dataset.start && media.currentTime < +el.dataset.end);
  });
  if (!media.paused) scrollTranscriptTo(media.currentTime, { auto: true });
});
seekBar.addEventListener('input', () => {
  seekBar.dragging = true;
  seekBar.style.setProperty('--pct', seekBar.value + '%');
  if (media.duration) media.currentTime = seekBar.value / 100 * media.duration;
  scrollTranscriptTo(media.currentTime);
});
seekBar.addEventListener('change', () => { seekBar.dragging = false; });

// --- A/B markers + "Export section" on the main player ---
// Defaults to the whole call (A = 0:00, B = the end). Stays that way until you move a marker or click a
// timeline row, so a late-arriving duration can fill in the true end without overriding your choice.
let abMainAtDefault = true;
let abPersistFor = null; // the call whose markers are being remembered (see ab-ranges.js); null while one is loading
const mainSeekWrap = document.querySelector('#controls .seek-wrap');
const abMain = initABMarkers({
  audio: media,
  layer: mainSeekWrap.querySelector('.ab-layer'),
  region: mainSeekWrap.querySelector('.ab-region'),
  hA: mainSeekWrap.querySelector('.ab-a'),
  hB: mainSeekWrap.querySelector('.ab-b'),
  readout: document.getElementById('ab-readout'),
  maxEnd: () => (current && current.rows && current.rows.length) ? Math.max(...current.rows.map(rowEndSeconds)) : 60,
  onUserChange: () => { abMainAtDefault = false; },
  onSet: () => { if (typeof abPersist === 'function') abPersist(); },
  onRangePlayChange: (v) => showRangePlaying(document.getElementById('ab-play'), v),
});
media.addEventListener('loadedmetadata', () => { if (abMainAtDefault) abMain.set(0, media.duration); });
document.querySelectorAll('button.speed').forEach(b => {
  b.onclick = () => {
    media.playbackRate = parseFloat(b.dataset.rate);
    document.querySelectorAll('button.speed').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  };
});

// "Open ▾": the follow-along doc, the timestamp CSV and the transcript in one menu (the three items keep their old ids,
// so selectPerson still enables/disables them and sets what they do)
(function initOpenMenu() {
  const wrap = document.getElementById('open-menu');
  const btn = document.getElementById('open-menu-btn');
  const list = wrap.querySelector('.dd-list');
  const close = () => { list.style.display = 'none'; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const opening = list.style.display !== 'block';
    list.style.display = opening ? 'block' : 'none';
    btn.setAttribute('aria-expanded', String(opening));
  });
  list.addEventListener('click', close); // choosing an item closes the menu (the item's own action has already run)
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();
