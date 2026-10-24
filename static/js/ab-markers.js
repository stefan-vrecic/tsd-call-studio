// ab-markers.js -- A/B selection markers over a seek bar + time parsing/formatting. Loaded early because the main player builds its markers at page load.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

// End of a timeline row ("18:18–20:44" -> 1244); falls back to a minute after the start
function rowEndSeconds(r) {
  if (r.end_seconds != null) return r.end_seconds;
  const parts = String(r.ts || '').split(/\s*[–—-]\s*/);
  const e = parts.length >= 2 ? parseClock(parts[1]) : NaN;
  return isNaN(e) ? (r.seconds || 0) + 60 : e;
}

// A/B selection markers laid over a seek bar. Used by the main player and by every search
// result, so they behave identically. `sel` is updated in place (callers can keep a reference).
function initABMarkers({ audio, layer, region, hA, hB, readout, maxEnd, onUserChange, onSet, onRangePlayChange, labels = ['A', 'B'] }) {
  const MIN_LEN = 0.5;
  const sel = { a: 0, b: 0 };
  const known = () => (audio.duration && isFinite(audio.duration)) ? audio.duration : null;
  // real duration once loaded; until then (or if it never does) fall back so markers/export still work
  const dur = () => known() || Math.max(1, maxEnd());
  const round1 = (t) => Math.round(Math.min(dur(), Math.max(0, t)) * 10) / 10;
  function paint() {
    const d = dur();
    const pa = sel.a / d * 100, pb = sel.b / d * 100;
    hA.style.left = pa + '%';
    hB.style.left = pb + '%';
    region.style.left = pa + '%';
    region.style.width = Math.max(0, pb - pa) + '%';
    refreshReadout();
  }
  function set(a, b) { sel.a = a; sel.b = b; paint(); if (onSet) onSet(); }
  function drag(which, t) {
    t = round1(t);
    if (which === 'a') set(Math.min(t, sel.b - MIN_LEN), sel.b); else set(sel.a, Math.max(t, sel.a + MIN_LEN));
    if (known()) audio.currentTime = which === 'a' ? sel.a : sel.b; // hear/see where the cut lands
    if (onUserChange) onUserChange();
  }
  Object.entries({ a: hA, b: hB }).forEach(([which, h]) => {
    h.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { h.setPointerCapture(e.pointerId); } catch (_) { /* not every input source supports capture; the window listeners below cover it */ }
      const onMove = (ev) => {
        const r = layer.getBoundingClientRect();
        drag(which, Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)) * dur());
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    });
    h.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      drag(which, (which === 'a' ? sel.a : sel.b) + (e.shiftKey ? 10 : 1) * (e.key === 'ArrowRight' ? 1 : -1));
    });
  });
  // The readout is two always-visible time boxes: "A [0:00] -> B [46:55.5] . 46:55 long". Type m:ss, h:mm:ss or seconds and
  // press Enter (or click/Tab away) to apply; Esc puts the old time back. Dragging the markers updates the boxes live.
  // Typing a new A and leaving B alone moves B to the same time as A (the start of a fresh clip that the up-arrow then grows).
  readout.textContent = '';
  const lblA = document.createElement('span'), lblB = document.createElement('span'), lenEl = document.createElement('span');
  lblA.className = lblB.className = 'ab-l';
  lenEl.className = 'ab-len';
  const mkBox = (which) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ab-edit';
    input.setAttribute('aria-label', which === 'a' ? 'start time' : 'end time');
    input.title = 'Type a time (m:ss) and press Enter';
    input.addEventListener('focus', () => input.select());
    input.addEventListener('keydown', (e) => {
      e.stopPropagation(); // the page's own shortcuts (arrows, space) must not fire while typing
      if (e.key === 'Enter') { e.preventDefault(); commit(true); }
      else if (e.key === 'Escape') { e.preventDefault(); input.classList.remove('invalid'); refreshReadout(true); input.blur(); }
    });
    input.addEventListener('input', () => input.classList.remove('invalid'));
    input.addEventListener('blur', () => { setTimeout(() => { if (!readout.contains(document.activeElement)) commit(false); else commit(false, true); }, 0); });
    return input;
  };
  const boxA = mkBox('a'), boxB = mkBox('b');
  readout.append(lblA, ' ', boxA, '  →  ', lblB, ' ', boxB, lenEl);
  function refreshReadout(force) {
    lblA.textContent = labels[0];
    lblB.textContent = labels[1];
    // never overwrite a box that is being typed into (unless putting the old value back)
    if (force || document.activeElement !== boxA) boxA.value = fmtPrecise(sel.a);
    if (force || document.activeElement !== boxB) boxB.value = fmtPrecise(sel.b);
    lenEl.textContent = `  ·  ${fmtPrecise(sel.b - sel.a)} long`;
  }
  // Reads the boxes. `snap` = A was changed and B was left as it was.
  function read() {
    const a = parseClock(boxA.value);
    let b = parseClock(boxB.value);
    const snap = !isNaN(a) && !isNaN(b) && Math.abs(a - sel.a) > 0.05 && Math.abs(b - sel.b) < 0.05;
    if (snap) b = a;
    const badA = isNaN(a) || a < 0, badB = isNaN(b) || (!snap && b < a + MIN_LEN);
    return { a, b, badA, badB, ok: !badA && !badB, changed: Math.abs(a - sel.a) > 0.05 || Math.abs(b - sel.b) > 0.05 };
  }
  // enter = true: pressing Enter on something invalid keeps focus there so it can be fixed.
  // otherwise (clicked away): a valid entry is applied, an invalid one is dropped and the old time comes back.
  function commit(enter, stillInside) {
    const r = read();
    if (r.ok && r.changed) {
      set(round1(r.a), round1(Math.min(r.b, dur())));  // an end past the recording just clips to its end
      if (onUserChange) onUserChange();
    } else if (!r.ok) {
      if (enter) {
        boxA.classList.toggle('invalid', r.badA);
        boxB.classList.toggle('invalid', r.badB);
        (r.badA ? boxA : boxB).focus();
        return;
      }
      if (!stillInside) { boxA.classList.remove('invalid'); boxB.classList.remove('invalid'); refreshReadout(true); return; }
      return;
    }
    refreshReadout(true);
    const inside = document.activeElement;
    if (inside === boxA || inside === boxB) inside.select(); // moved on to the other box: its new value is selected, ready to type over
  }

  // Move B later (the up-arrow button): grows the clip a step at a time. While the range is playing it also moves the stop point.
  function extend(seconds) {
    set(sel.a, Math.max(sel.a, round1(Math.min(dur(), sel.b + seconds)))); // never before A, never past the end
    if (onUserChange) onUserChange();
  }

  // Play just A to B: starts at A and pauses at B. B is read live, so extending it mid-play keeps the audio going.
  // With no length yet (B still on A) it plays from A and waits for the up-arrow.
  let rangePlaying = false, ourSeek = false;
  const setRangePlaying = (v) => { if (rangePlaying !== v) { rangePlaying = v; if (onRangePlayChange) onRangePlayChange(v); } };
  function playRange() {
    if (rangePlaying) { audio.pause(); return; }
    ourSeek = true;
    audio.currentTime = sel.a;
    setRangePlaying(true);
    audio.play().catch(() => setRangePlaying(false));
  }
  audio.addEventListener('seeked', () => { ourSeek = false; });
  audio.addEventListener('seeking', () => { if (rangePlaying && !ourSeek) setRangePlaying(false); }); // you scrubbed: it's normal playback again
  audio.addEventListener('pause', () => { if (audio.paused) setRangePlaying(false); }); // (an old pause event arriving after play() restarted must not cancel it)
  audio.addEventListener('timeupdate', () => {
    if (!rangePlaying || sel.b - sel.a < MIN_LEN || audio.currentTime < sel.b) return;
    if (audio.currentTime - sel.b <= 2) { audio.pause(); audio.currentTime = sel.b; } // played up to B: stop there
    else setRangePlaying(false);                                                      // far past B means you scrubbed: normal playback
  });

  audio.addEventListener('loadedmetadata', paint); // markers rescale once the real duration is known
  audio.addEventListener('durationchange', paint);
  function destroy() {
    audio.removeEventListener('loadedmetadata', paint);
    audio.removeEventListener('durationchange', paint);
  }
  function setLabels(next) { labels = next; refreshReadout(); }
  return { sel, set, paint, duration: known, destroy, setLabels, extend, playRange };
}

// m:ss with one decimal only when needed (A/B can sit between whole seconds)
function fmtPrecise(s) {
  const t = Math.round(Math.max(0, s) * 10) / 10;
  const w = Math.floor(t), d = Math.round((t - w) * 10);
  return d ? `${fmt(w)}.${d}` : fmt(w);
}
// "18:18", "1:11:00", "18:18.5" or plain seconds "83" -> seconds (NaN if it isn't a time)
function parseClock(str) {
  str = String(str).trim();
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);
  const m = str.match(/^(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)$/);
  return m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : NaN;
}
