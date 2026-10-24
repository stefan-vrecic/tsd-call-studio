// search.js -- cross-call section search: results, per-result players, A/B markers, per-section transcripts.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

let sectionObserver = null;

let searchFilter = 'all'; // all | mine | other -- stays as you left it while you run more searches
let searchClosers = new Set(); // ticked closers (none ticked = every closer); combines with the chips above
let searchResults = [];
let searchSection = '';

async function runSectionSearch(section) {
  media.pause(); // don't leave the main player running under the search overlay
  const res = await fetch('/api/search-section?q=' + encodeURIComponent(section));
  searchResults = await res.json();
  searchSection = section;
  renderSearchResults();
}

// Draws the current search's results, narrowed by the All / Mine / Not mine chips (no re-fetch needed).
// "Mine" / "Not mine" are the same marks as the sidebar's blue / amber; calls not marked either way
// only show under All.
function renderSearchResults() {
  const section = searchSection;
  const mineOf = (r) => { const p = people.find(x => x.name === r.person); return p ? p.mine : undefined; };
  const counts = {
    all: searchResults.length,
    mine: searchResults.filter(r => mineOf(r) === true).length,
    other: searchResults.filter(r => mineOf(r) === false).length,
  };
  const labels = { all: 'All', mine: 'Mine', other: 'Not mine' };
  document.querySelectorAll('#search-filter .sf-btn').forEach(b => {
    b.textContent = `${labels[b.dataset.filter]} (${counts[b.dataset.filter]})`;
    b.classList.toggle('active', b.dataset.filter === searchFilter);
  });
  const closerOf = (r) => { const p = people.find(x => x.name === r.person); return p ? (p.closer || '') : ''; };
  // closer checkboxes: one per named closer, with how many of this search's results are theirs
  const closerBox = document.getElementById('search-closers');
  closerBox.querySelectorAll('label').forEach(l => l.remove());
  CLOSERS.forEach(name => {
    const n = searchResults.filter(r => closerOf(r) === name).length;
    const label = document.createElement('label');
    label.className = 'sc-opt' + (n ? '' : ' sc-zero');
    label.innerHTML = `<input type="checkbox"> <span>${escapeHtml(name)} (${n})</span>`;
    const box = label.querySelector('input');
    box.checked = searchClosers.has(name);
    box.onchange = () => { if (box.checked) searchClosers.add(name); else searchClosers.delete(name); renderSearchResults(); };
    closerBox.appendChild(label);
  });
  const byChip = searchFilter === 'mine' ? searchResults.filter(r => mineOf(r) === true)
    : searchFilter === 'other' ? searchResults.filter(r => mineOf(r) === false)
    : searchResults;
  const results = searchClosers.size ? byChip.filter(r => searchClosers.has(closerOf(r))) : byChip;
  const total = searchResults.length;
  document.getElementById('search-title').textContent =
    `"${section}" across all calls (${results.length === total ? '' : results.length + ' of '}${total} match${total === 1 ? '' : 'es'})`;
  const container = document.getElementById('search-results');
  container.querySelectorAll('.result-block').forEach(b => b._unload && b._unload());
  container.innerHTML = '';
  container.scrollTop = 0;
  // Each section's transcript is fetched only when it scrolls near the viewport -- with 100+ results,
  // fetching them all up front would be 100+ requests for text nobody has looked at yet.
  if (sectionObserver) sectionObserver.disconnect();
  sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      sectionObserver.unobserve(en.target);
      if (en.target._load) en.target._load();
    });
  }, { root: container, rootMargin: '300px 0px' });

  if (!results.length) {
    updateAddAllButton();
    container.innerHTML = `<div id="search-empty">${total ? 'None of the matching calls fit those filters.' : 'No other calls have a section matching this.'}</div>`;
    document.getElementById('search-overlay').style.display = 'flex';
    return;
  }

  // one player per PERSON, not per match — multiple hits from the same call
  // share a single <audio> element (two elements loading the same file at
  // once is what caused playback to break) and just list extra timestamps.
  const byPerson = new Map();
  results.forEach(r => {
    if (!byPerson.has(r.person)) byPerson.set(r.person, { mp3: r.mp3, rows: [] });
    byPerson.get(r.person).rows.push(r);
  });

  byPerson.forEach((data, person) => {
    const block = document.createElement('div');
    const personInfo = people.find(x => x.name === person);
    const mineClass = personInfo && personInfo.mine === true ? ' mine-row-mine'
      : personInfo && personInfo.mine === false ? ' mine-row-other' : '';
    block.className = 'result-block' + mineClass;
    const maxEnd = Math.max(1, ...data.rows.map(rowEndSeconds));
    block.innerHTML = `
      <div class="result-header"><span class="rh-name"><a class="rh-link" href="/${encodeURIComponent(person)}" target="_blank" rel="noopener" title="Double-click to open this call in a new tab (or right-click / middle-click the link)">${displayName(person)}</a>${data.mp3.replace(/\.[^.]+$/, '') === person ? '' : ` <span class="rh-file">(${displayFile(data.mp3)})</span>`}</span><span class="ab-readout"></span></div>
      <div class="result-controls">
        <button class="rctl" data-act="play">▶</button>
        <button class="rctl" data-act="stop">■</button>
        <div class="seek-wrap">
          <input type="range" class="seek" min="0" max="100" step="any" value="0">
          <div class="ab-layer">
            <div class="ab-region"></div>
            <div class="ab-handle ab-a" data-which="a" tabindex="0" title="Drag to move the start (A). Arrow keys nudge it."><span>A</span></div>
            <div class="ab-handle ab-b" data-which="b" tabindex="0" title="Drag to move the end (B). Arrow keys nudge it."><span>B</span></div>
          </div>
        </div>
        <span class="rtime">0:00 / 0:00</span>
        <button class="rctl" data-act="export" title="Cut the A–B part out as its own mp3">✂ Export section</button>
        <button class="rctl" data-act="addclip" title="Put the A–B part in your clip basket, to export with clips from other calls">➕ Add to clips</button>
      </div>
      <div class="result-matches"></div>
    `;
    // The audio is NOT loaded up front. With hundreds of results that would be hundreds of
    // simultaneous file requests (it stopped playback working in Firefox). The file is attached the
    // first time you press play / click a section / drag the seek bar, and released again when another
    // result starts playing -- so only the result you're actually using ever holds a connection.
    const audio = document.createElement('audio');
    audio.preload = 'none';
    audio.style.display = 'none';
    block.appendChild(audio);
    let loaded = false;
    let resumeAt = null;        // where this result was when it was released, so ▶ picks up from there
    let pendingFraction = null; // seek-bar position picked before the file had loaded
    const safePlay = () => audio.play().catch(() => {}); // a play() cut short by switching results isn't an error

    const playBtn = block.querySelector('[data-act="play"]');
    const stopBtn = block.querySelector('[data-act="stop"]');
    const exportBtn = block.querySelector('[data-act="export"]');
    const seek = block.querySelector('input[type=range]');
    const timeLabel = block.querySelector('.rtime');
    const matchesDiv = block.querySelector('.result-matches');
    const abLayer = block.querySelector('.ab-layer');
    const abRegion = block.querySelector('.ab-region');
    const handles = { a: block.querySelector('.ab-a'), b: block.querySelector('.ab-b') };
    const readout = block.querySelector('.ab-readout');

    // ---- A/B selection: defaults to the matched section's own start/end ----
    const ab = initABMarkers({ audio, layer: abLayer, region: abRegion, hA: handles.a, hB: handles.b, readout, maxEnd: () => maxEnd });
    const sel = ab.sel;
    sel.row = null;

    // what the player shows while nothing is loaded: the playhead sits on A (or where it was released)
    function showIdle() {
      if (loaded) return;
      const at = resumeAt != null ? resumeAt : sel.a;
      seek.value = at / maxEnd * 100;
      seek.style.setProperty('--pct', seek.value + '%');
      timeLabel.textContent = fmt(at);
      playBtn.textContent = '▶';
    }
    function ensureLoaded() {
      if (loaded) return;
      loaded = true;
      audio.preload = 'auto';
      audio.src = '/media/' + encodeURIComponent(person);
      audio.currentTime = resumeAt != null ? resumeAt : sel.a; // applied as soon as the file's metadata arrives
    }
    function unload() {
      if (!loaded) return;
      resumeAt = audio.currentTime;
      audio.pause();
      audio.removeAttribute('src');
      audio.load(); // drops the connection to the server
      loaded = false;
      clearFollow();
      showIdle();
    }
    block._unload = unload;

    // The call name is a real link (so right-click / middle-click / copy-link all work), but a plain click
    // does nothing, so you can't lose your place in the results by accident. Double-click opens the call
    // in a new tab; Cmd/Ctrl/Shift-click is left to the browser.
    const nameLink = block.querySelector('.rh-link');
    nameLink.addEventListener('click', (e) => { if (!(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) e.preventDefault(); });
    nameLink.addEventListener('dblclick', (e) => { e.preventDefault(); window.open(nameLink.href, '_blank', 'noopener'); });

    const sectionScrollers = [];
    // keeps each section's scroller in step with the audio: highlights the line being spoken and scrolls to
    // it (unless the pointer is over that scroller -- then you're probably reading it)
    function followPlayback() {
      if (!loaded) return;
      const t = audio.currentTime;
      sectionScrollers.forEach(sc => {
        let active = null;
        sc.lines.forEach(l => { const on = t >= l.start && t < l.end; l.el.classList.toggle('playing', on); if (on) active = l.el; });
        if (active && active !== sc.active && !sc.scroller.matches(':hover')) {
          sc.scroller.scrollTop = active.offsetTop - sc.scroller.clientHeight / 2 + active.offsetHeight / 2;
        }
        sc.active = active;
      });
    }
    function clearFollow() { sectionScrollers.forEach(sc => { sc.lines.forEach(l => l.el.classList.remove('playing')); sc.active = null; }); }

    function makeSectionTranscript(r, rowEl) {
      const scroller = document.createElement('div');
      scroller.className = 'sec-transcript';
      scroller.innerHTML = '<div class="sec-empty">Transcript loads as you scroll to it…</div>';
      const entry = { scroller, lines: [], active: null };
      scroller._load = async () => {
        try {
          const res = await fetch(`/api/transcript?person=${encodeURIComponent(person)}&from=${r.seconds}&to=${rowEndSeconds(r)}`);
          if (!res.ok) throw new Error('not ready');
          const t = await res.json();
          scroller.innerHTML = '';
          if (!t.blocks.length) { scroller.innerHTML = '<div class="sec-empty">No transcript lines in this section.</div>'; return; }
          t.blocks.forEach(b => {
            const el = document.createElement('div');
            el.className = 'sec-line';
            el.innerHTML = `<span class="ts">${fmt(b.start)}</span>${b.speaker ? `<span class="speaker">${escapeHtml(b.speaker)}:</span>` : ''}<span class="line-text">${escapeHtml(b.text)}</span>`;
            el.onclick = () => { chooseRow(r, rowEl); ensureLoaded(); audio.currentTime = b.start; safePlay(); };
            scroller.appendChild(el);
            entry.lines.push({ el, start: b.start, end: b.end });
          });
          followPlayback();
        } catch (e) {
          scroller.innerHTML = '<div class="sec-empty">Transcript not available yet.</div>';
        }
      };
      sectionScrollers.push(entry);
      sectionObserver.observe(scroller);
      return scroller;
    }

    const rowEls = [];
    function chooseRow(r, rowEl) {
      sel.row = r;
      rowEls.forEach(([, el]) => el.classList.toggle('selected', el === rowEl));
      ab.set(r.seconds, rowEndSeconds(r));
      if (!loaded) { resumeAt = null; showIdle(); }
    }
    data.rows.forEach(r => {
      const row = document.createElement('div');
      row.className = 'result-desc';
      row.innerHTML = `<span class="ts">${r.ts}</span> — ${r.section}<div class="desc">${r.desc}</div>`;
      row.title = r.desc;
      if (r.seconds != null) {
        row.style.cursor = 'pointer';
        row.onclick = () => { chooseRow(r, row); ensureLoaded(); audio.currentTime = r.seconds; safePlay(); };
      }
      rowEls.push([r, row]);
      matchesDiv.appendChild(row);
      if (r.seconds != null) matchesDiv.appendChild(makeSectionTranscript(r, row));
    });
    const firstTimed = rowEls.find(([r]) => r.seconds != null);
    if (firstTimed) chooseRow(firstTimed[0], firstTimed[1]);
    else { sel.row = data.rows[0]; ab.set(0, Math.min(60, maxEnd)); showIdle(); }

    exportBtn.onclick = () => openExportDialog({
      person,
      section: (sel.row && sel.row.section) || 'Section',
      a: sel.a,
      b: sel.b,
      duration: ab.duration(),
      onChange: (a, b) => ab.set(a, b),
      onDone: (path) => {
        exportBtn.textContent = '✅ Exported';
        exportBtn.title = path;
        setTimeout(() => { exportBtn.textContent = '✂ Export section'; }, 2500);
      },
    });

    block._clip = () => ({ person, section: (sel.row && sel.row.section) || 'Section', a: sel.a, b: sel.b }); // for "Add all"
    block.querySelector('[data-act="addclip"]').onclick = (e) => addClipFromButton(e.currentTarget, block._clip());

    audio.addEventListener('loadedmetadata', () => {
      if (pendingFraction != null) { audio.currentTime = pendingFraction * audio.duration; pendingFraction = null; }
    });
    audio.addEventListener('timeupdate', () => {
      if (!loaded) return; // a late event from a just-released element must not overwrite the idle display
      if (!seek.dragging) seek.value = audio.duration ? (audio.currentTime / audio.duration * 100) : 0;
      seek.style.setProperty('--pct', seek.value + '%');
      timeLabel.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration || 0);
      followPlayback();
    });
    audio.addEventListener('play', () => {
      // one result at a time: release every other result's audio (frees its connection, remembers its place)
      container.querySelectorAll('.result-block').forEach(other => { if (other !== block && other._unload) other._unload(); });
      playBtn.textContent = '⏸';
    });
    audio.addEventListener('pause', () => playBtn.textContent = '▶');
    audio.addEventListener('error', () => {
      timeLabel.textContent = '⚠ file missing';
      timeLabel.style.color = 'var(--danger)';
      playBtn.disabled = true;
      stopBtn.disabled = true;
      seek.disabled = true;
    });

    playBtn.onclick = () => { ensureLoaded(); audio.paused ? safePlay() : audio.pause(); };
    stopBtn.onclick = () => { if (!loaded) return; audio.pause(); audio.currentTime = sel.a; };
    seek.addEventListener('input', () => {
      seek.dragging = true;
      seek.style.setProperty('--pct', seek.value + '%');
      if (!loaded) { resumeAt = null; ensureLoaded(); pendingFraction = seek.value / 100; return; }
      if (audio.duration) audio.currentTime = seek.value / 100 * audio.duration; else pendingFraction = seek.value / 100;
    });
    seek.addEventListener('change', () => { seek.dragging = false; });

    container.appendChild(block);
  });

  updateAddAllButton();
  document.getElementById('search-overlay').style.display = 'flex';
}

function updateAddAllButton() {
  const n = document.querySelectorAll('#search-results .result-block').length;
  const btn = document.getElementById('search-add-all');
  btn.textContent = `➕ Add all to clips (${n})`;
  btn.disabled = !n;
}
document.getElementById('search-add-all').onclick = (e) => {
  const blocks = [...document.querySelectorAll('#search-results .result-block')].filter(b => b._clip);
  if (!blocks.length) return;
  let added = 0;
  blocks.forEach(b => { if (addClip(b._clip())) added++; });
  const btn = e.currentTarget;
  btn.textContent = `✅ Added ${added}` + (added < blocks.length ? ` (${blocks.length - added} already in)` : '');
  setTimeout(updateAddAllButton, 2500);
};

document.querySelectorAll('#search-filter .sf-btn').forEach(b => {
  b.onclick = () => { searchFilter = b.dataset.filter; renderSearchResults(); };
});

document.getElementById('search-close').onclick = () => {
  document.querySelectorAll('#search-results .result-block').forEach(b => b._unload && b._unload());
  document.getElementById('search-overlay').style.display = 'none';
};
