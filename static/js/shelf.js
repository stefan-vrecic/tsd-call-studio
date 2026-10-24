// shelf.js -- Resources tab -> 📖 Books and 🎬 Videos, the same "shelf" twice: a list of titles; click one to open / close its bullet-point
// notes, each with an optional page # (books) or time (videos -- a ▶ next to the time opens the video there). Right-click a title to mark it
// read / watched (green tick), rename it, change its link (videos), move it, delete it or give it a mini cover image (pick a file, paste one, or
// drop one on the title -- shrunk to emoji size; none = 📖, or the YouTube icon / 🎬 for a video). Videos also keep ↗ open and Copy link.
// Saved to live_docs/books.json and videos.json (routes/books.py), the whole list at once, a moment after each change.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const bkId = () => csId(10);
const bkEsc = csEsc;   // (shared.js)
const BK_YT_ICON = '<svg class="bk-cover bk-yt" viewBox="0 0 28 20" aria-label="YouTube"><rect width="28" height="20" rx="5" fill="#ff0000"/><path d="M11 5.5v9l8-4.5z" fill="#fff"/></svg>';
const bkIsYouTube = (url) => { try { return /(^|\.)(youtube\.com|youtu\.be)$/.test(new URL(url).hostname); } catch (e) { return false; } };
const bkIsFathom = (url) => { try { return /(^|\.)fathom\.video$/.test(new URL(url).hostname); } catch (e) { return false; } };
const bkVideoCategory = (b) => ['general', 'sales'].includes(b.category) ? b.category : (bkIsFathom(b.url) ? 'sales' : 'general');
// "12:30" / "1:02:03" -> seconds (null if it isn't a time)
const bkSeconds = (t) => { const m = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(String(t).trim()); return m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) : null; };
function bkAtTime(url, secs) {
  try { const u = new URL(url); if (u.hostname === 'youtu.be' || /youtube\.com$/.test(u.hostname)) { u.searchParams.set('t', secs + 's'); return u.toString(); } } catch (e) { /* not a link */ }
  return url;
}

// a link's real title (YouTube's own, via the server: routes/link_title.py), '' if it can't be had
async function bkLinkTitle(url) {
  try { const d = await csJSON('/api/link-title?url=' + encodeURIComponent(url)); return (d.title || '').trim(); } catch (e) { return ''; }
}
const bkLooksLikeLink = (t) => /^https?:\/\//i.test(String(t || '').trim());

function bkShelf(cfg) {
  const S = { cfg, data: { [cfg.key]: [] }, timer: null };
  const items = () => S.data[cfg.key];
  const listEl = document.getElementById(cfg.list), status = document.getElementById(cfg.status);
  const filterEl = cfg.filter ? document.getElementById(cfg.filter) : null;
  let activeCategory = 'general';

  S.save = () => {
    clearTimeout(S.timer);
    S.timer = setTimeout(async () => {
      try {
        const res = await fetch(cfg.api, { method: 'POST', body: JSON.stringify(S.data) });
        if (!res.ok) throw new Error((await res.json()).error || 'not saved');
        status.textContent = 'Saved'; setTimeout(() => { status.textContent = ''; }, 1200);
      } catch (e) { status.textContent = '⚠️ ' + e.message; }
    }, 350);
  };

  S.render = () => {
    listEl.innerHTML = '';
    const visible = filterEl ? items().filter(b => bkVideoCategory(b) === activeCategory) : items();
    if (!visible.length) listEl.innerHTML = `<p class="bk-empty">No ${filterEl && activeCategory === 'sales' ? 'sales recordings' : cfg.noun + 's'} yet. Add one below.</p>`;
    visible.forEach(b => listEl.appendChild(item(b)));
    if (filterEl) filterEl.querySelectorAll('[data-category]').forEach(button => {
      const selected = button.dataset.category === activeCategory;
      button.classList.toggle('on', selected); button.setAttribute('aria-selected', String(selected));
      button.querySelector('span').textContent = items().filter(b => bkVideoCategory(b) === button.dataset.category).length;
    });
  };

  if (filterEl) filterEl.querySelectorAll('[data-category]').forEach(button => button.onclick = () => {
    activeCategory = button.dataset.category; S.render();
  });

  const icon = (b) => b.cover ? `<img class="bk-cover" src="${bkEsc(b.cover)}" alt="">` : cfg.hasUrl && bkIsYouTube(b.url) ? BK_YT_ICON : `<span class="bk-cover bk-cover-emoji">${cfg.icon}</span>`;

  function item(b) {
    const el = document.createElement('div'); el.className = 'bk-book' + (b.open ? ' open' : '');
    el.dataset.bookId = b.id;   // book-search.js adds its upload / search controls to each book by this id
    const shareUrl = cfg.hasUrl ? (b.url || '') : (typeof bsInfo !== 'undefined' && bsInfo[b.id] ? `${location.origin}/book-file/${b.id}.${bsInfo[b.id].ext}` : '');
    const links = shareUrl ? `<a class="bk-open" href="${bkEsc(shareUrl)}" target="_blank" rel="noopener" title="Open">↗</a><button class="ctl bk-copy" title="Copy this link">Copy link</button>` : '';
    // videos: ⬇ MP3 and 📝 Transcribe (routes/video_media.py; the audio and the transcript stay on this Mac)
    const media = cfg.hasUrl && /^https?:\/\//.test(b.url || '') ? `<button class="ctl bk-take bk-mp3" title="Download the audio as an MP3">⬇ MP3</button><button class="ctl bk-take bk-tx" title="Transcribe it on this Mac">📝 Transcribe</button>` : '';
    if (!Array.isArray(b.typedPages)) b.typedPages = [];
    el.innerHTML = `<div class="bk-head" title="Click to open / close the notes · right-click for more"><span class="bk-caret">▸</span>${icon(b)}<span class="bk-title">${bkEsc(b.title)}</span>${b.read ? `<span class="bk-read" title="${cfg.readWord}">✓</span>` : ''}
        <span class="bk-count">${b.notes.length ? b.notes.length + ' note' + (b.notes.length === 1 ? '' : 's') : ''}</span>${links}${media}<button class="ctl bk-take bk-typed-notes" title="Hover to preview typed notes">📝 Notes</button><span class="bk-typed-pages"></span></div>
      <div class="bk-body"><ul class="bk-notes"></ul>
        <div class="bk-new"><input class="bk-new-text" placeholder="Add a note… (Enter)"><input class="bk-page bk-new-page" placeholder="${cfg.pagePh}" inputmode="${cfg.hasUrl ? 'text' : 'numeric'}"><button class="ctl">Add</button></div></div>`;
    const head = el.querySelector('.bk-head');
    head.onclick = (e) => {
      if (e.target.closest('.bk-open, .bk-copy, .bk-email, .bk-take, .bk-typed-pages, .bk-mp3, .bk-tx')) return;
      b.open = !b.open; el.classList.toggle('open', b.open); S.save(); if (b.open) el.querySelector('.bk-new-text').focus();
    };
    if (typeof bkTypedPagesMount === 'function') bkTypedPagesMount(el.querySelector('.bk-typed-pages'), b, S, cfg);
    const copy = el.querySelector('.bk-copy');
    if (copy) copy.onclick = async () => {
      try { await navigator.clipboard.writeText(shareUrl); copy.textContent = '✅ Copied'; } catch (e) { copy.textContent = '⚠️ Failed'; }
      setTimeout(() => { copy.textContent = 'Copy link'; }, 1200);
    };
    if (media) bkMediaWire(el, b);
    head.addEventListener('contextmenu', (e) => menu(e, b));
    head.addEventListener('dragover', (e) => { if ([...e.dataTransfer.items].some(i => i.type.startsWith('image/'))) { e.preventDefault(); head.classList.add('bk-drop'); } });
    head.addEventListener('dragleave', () => head.classList.remove('bk-drop'));
    head.addEventListener('drop', (e) => { const f = [...e.dataTransfer.files].find(x => x.type.startsWith('image/')); head.classList.remove('bk-drop'); if (f) { e.preventDefault(); setCover(b, f); } });
    const ul = el.querySelector('.bk-notes');
    b.notes.forEach(n => ul.appendChild(note(b, n)));
    const text = el.querySelector('.bk-new-text'), page = el.querySelector('.bk-new-page');
    const add = () => {
      if (!text.value.trim()) return;
      b.notes.push({ id: bkId(), text: text.value.trim(), page: page.value.trim() });
      S.save(); S.render();
      listEl.querySelector(`.bk-book[data-book-id="${CSS.escape(b.id)}"] .bk-new-text`)?.focus();   // keep typing notes
    };
    el.querySelector('.bk-new .ctl').onclick = add;
    [text, page].forEach(inp => inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') add(); }));
    return el;
  }

  function note(b, n) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="bk-text" contenteditable="plaintext-only" spellcheck="true"></span><input class="bk-page" placeholder="${cfg.pageShort}" inputmode="${cfg.hasUrl ? 'text' : 'numeric'}" title="${cfg.pageTitle}"><a class="bk-jump" target="_blank" rel="noopener" title="Open the video at this time">▶</a><button class="bk-del" title="Delete this note">✕</button>`;
    const t = li.querySelector('.bk-text'), p = li.querySelector('.bk-page'), jump = li.querySelector('.bk-jump');
    t.textContent = n.text; p.value = n.page || '';
    const tidy = () => {
      p.classList.toggle('empty', !n.page);
      const secs = cfg.hasUrl && b.url ? bkSeconds(n.page) : null;
      jump.style.display = secs === null ? 'none' : '';
      if (secs !== null) jump.href = bkAtTime(b.url, secs);
    };
    tidy();
    t.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); t.blur(); } if (e.key === 'Escape') { t.textContent = n.text; t.blur(); } });
    t.addEventListener('blur', () => { const v = t.textContent.trim(); if (v && v !== n.text) { n.text = v; S.save(); } else if (!v) t.textContent = n.text; });
    p.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') p.blur(); });
    p.addEventListener('change', () => { n.page = p.value.trim(); tidy(); S.save(); });
    li.querySelector('.bk-del').onclick = () => {
      if (!confirm(`Delete this note?\n\n${n.text.slice(0, 200)}`)) return;
      b.notes = b.notes.filter(x => x !== n); S.save(); S.render();
    };
    return li;
  }

  function menu(e, b) {
    e.preventDefault(); e.stopPropagation();
    const list = items(), i = list.indexOf(b);
    const hasFile = typeof bsInfo !== 'undefined' && bsInfo[b.id];
    const opt = (a, text, extra) => ({ text, onClick: () => act(a), ...extra });
    csMenu(e, [{ heading: b.title },
      opt('read', b.read ? '↩️ Mark as not ' + cfg.readWord.toLowerCase() : '✅ Mark as ' + cfg.readWord.toLowerCase()),
      opt('rename', '✏️ Rename'),
      cfg.hasUrl && opt('link', '🔗 Change link'), cfg.hasUrl && b.url && opt('fetchtitle', '🔄 Get title from the link'),
      ...(cfg.hasUrl ? ['-', { label: 'Video category' }, opt('category-general', 'YouTube / General', { checked: bkVideoCategory(b) === 'general' }), opt('category-sales', 'Sales Recordings', { checked: bkVideoCategory(b) === 'sales' }), '-'] : []),
      i > 0 && opt('up', '⬆️ Move up'), i < list.length - 1 && opt('down', '⬇️ Move down'),
      cfg.key === 'books' && opt('bookfile', '📎 ' + (hasFile ? 'Replace book file…' : 'Upload book (PDF / EPUB / TXT)…')), cfg.key === 'books' && hasFile && opt('rmfile', '✕ Remove book file'),
      opt('cover', '🖼 Set cover image…'), opt('paste', '📋 Paste cover image'), b.cover && opt('nocover', '✕ Remove cover'),
      opt('del', `🗑 Delete ${cfg.noun}`)]);
    function act(a) {
      if (a === 'cover') { const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.onchange = () => f.files[0] && setCover(b, f.files[0]); f.click(); return; }
      if (a === 'paste') { pasteCover(b); return; }
      if (a === 'bookfile') { bsPickFile(b); return; }
      if (a === 'rmfile') { bsRemoveFile(b); return; }
      if (a === 'read') b.read = !b.read;
      if (a === 'nocover') b.cover = '';
      if (a === 'rename') { const t = prompt(cfg.renamePrompt, b.title); if (!t || !t.trim()) return; b.title = t.trim(); }
      if (a === 'fetchtitle') { status.textContent = 'Getting the title…'; bkLinkTitle(b.url).then(t => { if (t) { b.title = t; S.save(); S.render(); } else status.textContent = "⚠️ Couldn't get a title for that link"; }); return; }
      if (a === 'link') { const u = prompt('Link:', b.url || ''); if (u === null) return; if (u.trim() && !/^https?:\/\//.test(u.trim())) { alert('That needs to be a web link (https://…).'); return; } b.url = u.trim(); b.category = bkIsFathom(b.url) ? 'sales' : 'general'; }
      if (a === 'category-general' || a === 'category-sales') b.category = a === 'category-sales' ? 'sales' : 'general';
      if (a === 'up' || a === 'down') { const j = a === 'up' ? i - 1 : i + 1; [list[i], list[j]] = [list[j], list[i]]; }
      if (a === 'del' && !confirm(`Delete "${b.title}"${b.notes.length ? ` and its ${b.notes.length} note${b.notes.length === 1 ? '' : 's'}` : ''}?`)) return;
      if (a === 'del') list.splice(i, 1);
      S.save(); S.render();
    }
  }

  // a cover image shrunk to 64 px tall (shown at emoji size, sharp on a retina screen), stored as a small data: URL
  async function setCover(b, blob) {
    try {
      const img = await createImageBitmap(blob);
      const h = 64, w = Math.max(1, Math.round(img.width * h / img.height));
      const c = document.createElement('canvas'); c.width = Math.min(w, 128); c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, c.width, h);
      let url = c.toDataURL('image/webp', 0.85);
      if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/jpeg', 0.85);
      b.cover = url; S.save(); S.render();
    } catch (e) { alert("Couldn't read that image."); }
  }
  async function pasteCover(b) {
    try {
      for (const it of await navigator.clipboard.read()) {
        const type = it.types.find(t => t.startsWith('image/'));
        if (type) { setCover(b, await it.getType(type)); return; }
      }
      alert('No image on the clipboard. Copy an image first (right-click it → Copy Image).');
    } catch (e) { alert("Couldn't read the clipboard: " + e.message); }
  }

  // the add row at the bottom
  const title = document.getElementById(cfg.newTitle), url = cfg.newUrl ? document.getElementById(cfg.newUrl) : null;
  const add = () => {
    const t = title.value.trim(), u = url ? url.value.trim() : '';
    if (!t && !u) return;
    if (u && !/^https?:\/\//.test(u)) { alert('The link needs to start with https://'); return; }
    const item = { id: bkId(), title: t || u, url: u, open: !cfg.hasUrl, notes: [], typedPages: [] };
    if (cfg.hasUrl) { item.category = bkVideoCategory(item); activeCategory = item.category; }
    items().push(item);
    if (cfg.hasUrl && u && (!t || t === u)) bkLinkTitle(u).then(real => { if (real && bkLooksLikeLink(item.title)) { item.title = real; S.save(); S.render(); } });   // no title typed: use the video's own
    title.value = ''; if (url) url.value = '';
    S.save(); S.render();
  };
  document.getElementById(cfg.addBtn).onclick = add;
  [title, url].filter(Boolean).forEach(el => el.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') add(); }));

  if (url) url.addEventListener('change', async () => {   // paste a link with the title box empty: the title fills itself
    const u = url.value.trim();
    if (!/^https?:\/\//.test(u) || title.value.trim()) return;
    title.placeholder = 'Getting the title…';
    const real = await bkLinkTitle(u);
    if (real && !title.value.trim()) title.value = real;
    title.placeholder = 'Video title';
  });
  csJSON(cfg.api).then(d => {
    S.data = d; if (!Array.isArray(S.data[cfg.key])) S.data[cfg.key] = []; S.render();
    // anything still titled with its own link gets its real title (once found, it's saved)
    if (cfg.hasUrl) items().filter(b => b.url && bkLooksLikeLink(b.title)).forEach(b => bkLinkTitle(b.url).then(real => { if (real) { b.title = real; S.save(); S.render(); } }));
  }).catch(() => {});
  return S;
}

const bkBooks = bkShelf({ key: 'books', api: '/api/books', list: 'bk-list', status: 'bk-status', newTitle: 'bk-new-book', addBtn: 'bk-add',
  noun: 'book', icon: '📖', readWord: 'Read', pagePh: 'p. #', pageShort: 'p.', pageTitle: 'Page number (optional)', renamePrompt: 'Book title (Author – Title):' });
const bkVideos = bkShelf({ key: 'videos', api: '/api/videos', list: 'vd-list', status: 'vd-status', newTitle: 'vd-new-title', newUrl: 'vd-new-url', addBtn: 'vd-add',
  filter: 'vd-filter', noun: 'video', icon: '🎬', readWord: 'Watched', hasUrl: true, pagePh: 'time', pageShort: 'time', pageTitle: 'Time in the video, like 12:30 (optional)', renamePrompt: 'Video title:' });

// ---- 🎬 Videos: ⬇ MP3 / 📝 Transcribe (routes/video_media.py). Both buttons show progress while the server works, then:
// MP3 -> the browser downloads it (named after the video); Transcribe -> the transcript in a box with Copy.
const bkMediaBusy = new Set();   // video ids whose MP3 was clicked and is still being fetched (so a redrawn list still downloads it)
function bkMediaWire(el, b) {
  const mp3 = el.querySelector('.bk-mp3'), tx = el.querySelector('.bk-tx');
  const st = () => csJSON('/api/video-media?id=' + encodeURIComponent(b.id));
  const label = (s) => {
    mp3.textContent = s.mp3 === 'working' ? `⏳ ${s.percent ? s.percent + '%' : 'MP3…'}` : s.mp3 === 'ready' ? '⬇ MP3 ✓' : s.mp3 === 'error' ? '⬇ MP3 ⚠️' : '⬇ MP3';
    tx.textContent = s.transcript === 'working' ? `⏳ ${s.queued ? 'queued' : s.percent ? s.percent + '%' : 'transcribing…'}` : s.transcript === 'ready' ? '📝 Transcript' : s.transcript === 'error' ? '📝 Transcribe ⚠️' : '📝 Transcribe';
    mp3.title = s.mp3 === 'error' || s.transcript === 'error' ? (s.message || 'failed') : mp3.title;
  };
  const watch = async (want) => {   // poll until the thing we asked for is done
    for (let i = 0; i < 2400; i++) {
      let s; try { s = await st(); } catch (e) { return; }
      label(s);
      if (s[want] === 'ready') return s;
      if (s[want] === 'error') { ctxToast('⚠️ ' + (s.message || 'failed')); return s; }
      await new Promise(r => setTimeout(r, 1500));
    }
  };
  const save = () => {   // the browser's own download (an <a download>, so the page never navigates)
    const a = document.createElement('a'); a.href = '/api/video-mp3-file?id=' + encodeURIComponent(b.id); a.download = ''; document.body.appendChild(a); a.click(); a.remove();
    ctxToast('✅ “' + b.title.slice(0, 40) + '” MP3 saved to your Downloads');
  };
  const fetchThenSave = async () => {
    bkMediaBusy.add(b.id);
    const s = await watch('mp3');
    bkMediaBusy.delete(b.id);
    if (s && s.mp3 === 'ready') save();
  };
  st().then(s => { label(s); if (s.mp3 === 'working' && bkMediaBusy.has(b.id)) fetchThenSave(); }).catch(() => {});   // the list was redrawn mid-fetch: carry on
  mp3.onclick = async (e) => {
    e.stopPropagation();
    mp3.textContent = '⏳ MP3…';
    let s = await st().catch(() => ({}));
    if (s.mp3 === 'ready') { label(s); save(); return; }
    if (s.mp3 !== 'working') {
      try { await csPost('/api/video-mp3?id=' + encodeURIComponent(b.id), {}); } catch (err) { ctxToast('⚠️ ' + err.message); label(s); return; }
    }
    ctxToast('⏳ Fetching the audio. Long videos take a minute or two; it downloads by itself when it\'s ready.');
    fetchThenSave();
  };
  tx.onclick = async (e) => {
    e.stopPropagation();
    let s = await st().catch(() => ({}));
    if (s.transcript !== 'ready') {
      if (s.transcript !== 'working') await csPost('/api/video-transcribe?id=' + encodeURIComponent(b.id), {}).catch(err => ctxToast('⚠️ ' + err.message));
      ctxToast('📝 Transcribing "' + b.title.slice(0, 40) + '" on this Mac: you can keep working');
      s = await watch('transcript');
      if (!s || s.transcript !== 'ready') return;
    }
    const d = await csJSON('/api/video-transcript?id=' + encodeURIComponent(b.id)).catch(() => ({ text: '' }));
    const body = document.createElement('div');
    body.innerHTML = '<textarea readonly rows="18" style="width:100%;box-sizing:border-box;font:inherit;line-height:1.5;padding:10px;border:1px solid var(--border);border-radius:8px"></textarea>';
    body.querySelector('textarea').value = d.text || '(empty)';
    csDialog({ title: '📝 ' + b.title, body, buttons: [{ text: 'Copy', primary: true, onClick: async () => { await navigator.clipboard.writeText(d.text || ''); ctxToast('Copied'); return false; } }, { text: 'Close' }] });
  };
}
