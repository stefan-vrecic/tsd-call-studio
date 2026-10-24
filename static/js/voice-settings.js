// voice-settings.js -- Settings page -> "Voice command": send by itself after Fn is let go, and how long the answer note stays.
// Kept in the server settings (settings.json: voiceAutoSend, voiceToastSeconds) that the voice bar reads (frontend VoiceCommand.tsx).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.
(() => {
  const auto = document.getElementById('st-voice-auto'), secs = document.getElementById('st-voice-toast'), status = document.getElementById('st-voice-status');
  if (!auto || !secs) return;
  const load = async () => {
    try { const s = await csJSON('/api/settings'); auto.checked = s.voiceAutoSend !== false; if (document.activeElement !== secs) secs.value = s.voiceToastSeconds ?? 5; } catch (e) { /* offline */ }
  };
  const save = async (query) => {
    status.textContent = 'Saving…';
    try { const r = await fetch('/api/settings?' + query, { method: 'POST' }); if (!r.ok) throw new Error(); status.textContent = 'Saved ✓'; setTimeout(() => { status.textContent = ''; }, 1500); }
    catch (e) { status.textContent = '⚠️ Not saved'; }
  };
  auto.onchange = () => save('voiceAutoSend=' + auto.checked);
  // where the voice bar sits: left (beside the side bar) or centre -- the bar itself (VoiceCommand.tsx) moves straight away
  const pos = document.getElementById('st-voice-pos');
  const showPos = (p) => pos && pos.querySelectorAll('[data-pos]').forEach(b => b.classList.toggle('on', b.dataset.pos === p));
  csJSON('/api/settings').then(s => showPos(s.voiceDockPosition || 'left')).catch(() => {});
  if (pos) pos.querySelectorAll('[data-pos]').forEach(b => b.onclick = async () => {
    showPos(b.dataset.pos);
    await save('voiceDockPosition=' + b.dataset.pos);
    window.dispatchEvent(new CustomEvent('callstudio:voice-position', { detail: b.dataset.pos }));
  });
  secs.onchange = () => { const n = Math.max(0, Math.min(60, Math.round(Number(secs.value) || 0))); secs.value = n; save('voiceToastSeconds=' + n); };
  secs.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') secs.blur(); });
  load();
  new MutationObserver(() => { const v = document.getElementById('settings-view'); if (v && v.style.display !== 'none') load(); })
    .observe(document.getElementById('settings-view'), { attributes: true, attributeFilter: ['style'] });
})();

// ---- 📖 Voice guide (live_docs/voice-guide.md): read it rendered, or edit the Markdown; saves itself a moment after you stop typing
(() => {
  const box = document.getElementById('st-guide'), read = document.getElementById('st-guide-read'), text = document.getElementById('st-guide-text');
  const status = document.getElementById('st-guide-status');
  if (!box) return;
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>').replace(/`([^`]+)`/g, '<code>$1</code>');
  function render(md) {   // the little Markdown a note needs: headings, bullets, numbered lists, bold, italics, code, paragraphs
    let html = '', list = '';
    const close = () => { if (list) { html += `</${list}>`; list = ''; } };
    md.split('\n').forEach(line => {
      let m;
      if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) { close(); html += `<h${m[1].length + 2}>${inline(m[2])}</h${m[1].length + 2}>`; }
      else if ((m = /^\s*[-*]\s+(.*)$/.exec(line))) { if (list !== 'ul') { close(); html += '<ul>'; list = 'ul'; } html += `<li>${inline(m[1])}</li>`; }
      else if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(line))) { if (list !== 'ol') { close(); html += '<ol>'; list = 'ol'; } html += `<li>${inline(m[1])}</li>`; }
      else if (!line.trim()) close();
      else { close(); html += `<p>${inline(line)}</p>`; }
    });
    close();
    return html || '<p class="st-note">The guide is empty. Switch to ✏️ Edit to write it.</p>';
  }
  let timer = null, saved = '';
  const mode = (m) => {
    box.querySelectorAll('[data-guide]').forEach(b => b.classList.toggle('on', b.dataset.guide === m));
    read.style.display = m === 'read' ? '' : 'none'; text.style.display = m === 'edit' ? '' : 'none';
    if (m === 'read') read.innerHTML = render(text.value); else text.focus();
  };
  const save = async () => {
    clearTimeout(timer);
    if (text.value === saved) return;
    status.textContent = 'Saving…';
    try { const r = await fetch('/api/voice-guide', { method: 'POST', body: text.value }); if (!r.ok) throw new Error(); saved = text.value; status.textContent = 'Saved ✓'; setTimeout(() => { if (status.textContent === 'Saved ✓') status.textContent = ''; }, 1500); }
    catch (e) { status.textContent = '⚠️ Not saved'; }
  };
  document.getElementById('st-guide-open').onclick = async () => {
    if (box.style.display !== 'none') { box.style.display = 'none'; return; }
    try { saved = text.value = (await csJSON('/api/voice-guide')).text || ''; } catch (e) { /* offline */ }
    box.style.display = ''; mode('read');
  };
  document.getElementById('st-guide-close').onclick = () => { save(); box.style.display = 'none'; };
  box.querySelectorAll('[data-guide]').forEach(b => b.onclick = () => { if (b.dataset.guide === 'read') save(); mode(b.dataset.guide); });
  text.addEventListener('input', () => { status.textContent = 'Typing…'; clearTimeout(timer); timer = setTimeout(save, 800); });
  text.addEventListener('keydown', (e) => { e.stopPropagation(); if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); } });
  text.addEventListener('blur', save);
})();

// ---- Live Call -> 📜 Live script ↗: its link lives in the server settings (liveScriptUrl); Settings -> Live Call edits it
(() => {
  const input = document.getElementById('st-live-script'), status = document.getElementById('st-live-script-status'), btn = document.getElementById('live-script-link');
  const apply = (url) => { if (btn) { btn.href = url || '#'; btn.style.display = url ? '' : 'none'; } };
  csJSON('/api/settings').then(s => { apply(s.liveScriptUrl || ''); if (input) input.value = s.liveScriptUrl || ''; }).catch(() => {});
  if (!input) return;
  input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') input.blur(); });
  input.addEventListener('change', async () => {
    const url = input.value.trim();
    status.textContent = 'Saving…';
    try {
      const r = await fetch('/api/settings?liveScriptUrl=' + encodeURIComponent(url), { method: 'POST' });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'not saved');
      apply(d.liveScriptUrl); status.textContent = 'Saved ✓'; setTimeout(() => { status.textContent = ''; }, 1500);
    } catch (e) { status.textContent = '⚠️ ' + e.message; }
  });
})();
