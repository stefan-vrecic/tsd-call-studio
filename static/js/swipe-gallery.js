// swipe-gallery.js -- the Content tab's swipe gallery: screenshots of other people's stories/posts (or links) you want to respond to,
// each with your own response written underneath. Add with "+ Image" / "+ Link", by pasting a screenshot (⌘V) or dropping images
// on the gallery. Clicking a picture opens a full-size viewer you can swipe / arrow through, with the response beside it.
// Two layouts (Gallery / Carousel, remembered in this browser): the gallery shows the first 8 cards and a "Show all" button (or ⤢) pops up a big
// window with every one; the carousel is one horizontal strip with ‹ › arrows. Cards are editable everywhere.
// An item can hold several pictures (a story's slides): the card shows the first with a count, hovering it pops up ALL of them side by side (hover-peek.js) and
// clicking opens the viewer with all of them in a row. (routes/swipe.py: "images".)
// VIDEOS: "+ Video" (or drop a video file on the gallery) saves one as its own item: the card shows its first frame with a ▶, hovering plays it in the pop-up (muted),
// clicking opens the viewer with controls and sound. A link to a reel / video you don't have yet is a placeholder ("waiting for the video"): right-click it ->
// "Attach video…" (or drop the file on that card) to fill it in later.
// Saved on the server (routes/swipe.py: live_docs/swipe.json + live_docs/swipe/).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const swView = document.getElementById('content-view');
const swSection = document.getElementById('sw-gallery');
const swGrid = document.getElementById('sw-grid');
const swStatusEl = document.getElementById('sw-status');
const swFile = document.getElementById('sw-file');
const swViewer = document.getElementById('sw-viewer');
const swMore = document.getElementById('sw-more');
const swAll = document.getElementById('sw-all');
const swAllGrid = document.getElementById('sw-all-grid');
let swItems = [];
let swLoaded = false;
const SW_LIMIT = 8;            // cards shown in the gallery before "Show all"
let swMode = liveStore('swMode') === 'carousel' ? 'carousel' : 'grid';
let swAt = -1;               // which item the viewer shows (-1 = closed)
const swTimers = {};
let swPollTimer = null;

const swImgUrl = (it) => '/swipe-img/' + encodeURIComponent(it.image);
const swAllUrls = (it) => (it.images && it.images.length > 1 ? it.images : [it.image]).map(n => '/swipe-img/' + encodeURIComponent(n));
const swHost = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; } };
function swStatus(t) { swStatusEl.textContent = t; }

async function swLoad(force) {
  if (swLoaded && !force) return;
  swLoaded = true;
  try { swItems = (await csJSON('/api/swipe')).items || []; } catch (e) { swStatus('⚠️ Couldn’t load'); }
  swRender();
}

const swDownloading = (it) => it.download && !['done', 'error'].includes(it.download.stage);
function swDownloadBox(it) {
  if (!it.download || it.download.stage === 'done') return null;
  const d = it.download, box = document.createElement('div');
  box.className = 'sw-download ' + d.stage;
  box.innerHTML = `<div class="sw-dl-line"><span>${escapeHtml(d.message || 'Preparing…')}</span><b>${d.stage === 'error' ? '' : Math.round(d.percent || 0) + '%'}</b></div><div class="sw-dl-bar"><i style="width:${Math.max(2, d.percent || 0)}%"></i></div>`;
  if (d.stage === 'error') {
    const retry = document.createElement('button'); retry.className = 'ctl'; retry.textContent = 'Retry download';
    retry.onclick = (e) => { e.stopPropagation(); swRetry(it); }; box.appendChild(retry);
  }
  return box;
}
function swPollPlan() {
  clearTimeout(swPollTimer);
  if (swItems.some(swDownloading)) swPollTimer = setTimeout(swPollDownloads, 900);
}
async function swPollDownloads() {
  try {
    const fresh = (await csJSON('/api/swipe')).items || [];
    const old = new Map(swItems.map(i => [i.id, i]));
    const structural = fresh.some(i => { const was = old.get(i.id); return was && (was.video !== i.video || was.download?.stage !== i.download?.stage); });
    swItems = fresh;
    if (structural) swRender();
    else fresh.forEach(it => {
      document.querySelectorAll(`.sw-card[data-swipe-id="${it.id}"] .sw-download`).forEach(box => {
        const d = it.download || {}; box.querySelector('.sw-dl-line span').textContent = d.message || 'Preparing…';
        const pct = box.querySelector('.sw-dl-line b'); if (pct) pct.textContent = Math.round(d.percent || 0) + '%';
        const bar = box.querySelector('.sw-dl-bar i'); if (bar) bar.style.width = Math.max(2, d.percent || 0) + '%';
      });
    });
  } catch (e) { /* server restart / network blip: keep polling */ }
  swPollPlan();
}

// a saved change to one item, a moment after you stop typing
function swSave(it, fields, statusEl) {
  Object.assign(it, fields);
  clearTimeout(swTimers[it.id]);
  (statusEl || swStatusEl).textContent = 'Typing…';
  swTimers[it.id] = setTimeout(async () => {
    try {
      const res = await fetch('/api/swipe-update', { method: 'POST', body: JSON.stringify({ id: it.id, ...fields }), keepalive: true });
      if (!res.ok) throw new Error();
      (statusEl || swStatusEl).textContent = 'Saved ✓';
    } catch (e) { (statusEl || swStatusEl).textContent = '⚠️ Not saved'; }
  }, 600);
}

const swVideoUrl = (it) => '/swipe-video/' + encodeURIComponent(it.video);
const SW_VIDEO_LINK = /instagram\.com\/(?:reel|reels|tv|p)\/|tiktok\.com|youtube\.com|youtu\.be|facebook\.com\/.*(?:reel|watch|videos)|fb\.watch/i;   // links that are normally videos

function swThumb(it) {
  if (it.video) {
    const wrap = document.createElement('div'); wrap.className = 'sw-vid';
    wrap.dataset.video = swVideoUrl(it);                                               // hover-peek.js plays it in the pop-up
    const v = document.createElement('video'); v.src = swVideoUrl(it) + '#t=0.1'; v.preload = 'metadata'; v.muted = true; v.playsInline = true;
    const play = document.createElement('span'); play.className = 'sw-play'; play.textContent = '▶';
    wrap.append(v, play);
    return wrap;
  }
  if (it.image) {
    const img = document.createElement('img');
    img.src = swImgUrl(it); img.alt = it.title || 'screenshot'; img.loading = 'lazy';
    const urls = swAllUrls(it);
    if (urls.length <= 1) return img;
    const wrap = document.createElement('div'); wrap.className = 'sw-multi';
    wrap.dataset.images = JSON.stringify(urls);          // hover-peek.js pops up all of them
    const badge = document.createElement('span'); badge.className = 'sw-count'; badge.textContent = '▤ ' + urls.length; badge.title = urls.length + ' pictures: hover or click to see them all';
    wrap.append(img, badge);
    return wrap;
  }
  const box = document.createElement('div');
  box.className = 'sw-linkbox' + (it.waiting ? ' waiting' : '');
  box.innerHTML = it.waiting ? '<b>🎬</b><span>Waiting for the video</span><small>right-click → Attach video…</small>' : '<b>🔗</b>';
  box.append(swHost(it.link));
  return box;
}

function swCard(it, i) {
  const card = document.createElement('div');
  card.className = 'sw-card';
  card.dataset.swipeId = it.id;
  const thumb = document.createElement('div');
  thumb.className = 'sw-thumb';
  thumb.appendChild(swThumb(it));
  thumb.onclick = () => swOpen(i);
  const title = document.createElement('input');
  title.className = 'sw-title'; title.placeholder = 'Title / who posted it'; title.value = it.title || '';
  title.oninput = () => swSave(it, { title: title.value });
  const resp = document.createElement('textarea');
  resp.className = 'sw-resp'; resp.placeholder = 'Your response…'; resp.value = it.response || '';
  resp.oninput = () => swSave(it, { response: resp.value });
  [title, resp].forEach((el) => el.addEventListener('keydown', (e) => e.stopPropagation()));   // page shortcuts stay quiet while typing
  const meta = document.createElement('div');
  meta.className = 'sw-meta';
  if (it.via === 'phone') {   // shared from the phone (Track Sync · Gallery)
    const v = document.createElement('span'); v.className = 'sw-via'; v.textContent = '📱 From phone';
    if (it.viaAt) v.title = 'Shared from your phone, ' + new Date(it.viaAt * 1000).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    meta.appendChild(v);
  }
  if (it.link) {
    const a = document.createElement('a');
    a.href = it.link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = swHost(it.link) + ' ↗';
    meta.appendChild(a);
  }
  if (it.source) { const by = document.createElement('span'); by.className = 'sw-source'; by.textContent = it.source; meta.appendChild(by); }
  meta.append(new Date(it.added * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));
  const del = document.createElement('button');
  del.className = 'sw-del'; del.title = 'Remove'; del.textContent = '🗑';
  del.onclick = () => swDelete(it);
  meta.appendChild(del);
  card.append(thumb);
  const dl = swDownloadBox(it); if (dl) card.append(dl);
  card.append(title, resp, meta);
  card.addEventListener('contextmenu', (e) => {
    if (e.target.closest('input, textarea')) return;                                   // keep the normal menu (paste) in the boxes
    e.preventDefault(); e.stopPropagation();
    const path = () => csJSON('/api/swipe-path?id=' + encodeURIComponent(it.id));   // throws "No local file" etc.
    csMenu(e, [{ heading: it.title || swHost(it.link || '') || 'Swipe item' },
      { text: '📂 Open file location', onClick: () => csJSON('/api/swipe-reveal?id=' + encodeURIComponent(it.id), { method: 'POST' }).catch(err => ctxToast(err.message || 'No local file')) },
      { text: '📋 Copy file path', onClick: () => path().then(async d => { await navigator.clipboard.writeText(d.path); ctxToast('File path copied'); }).catch(err => ctxToast(err.message || 'No local file')) },
      { text: '🎙 Attach to voice command', onClick: () => path().then(d => window.dispatchEvent(new CustomEvent('callstudio:voice-attach', { detail: { name: d.name, path: d.path } }))).catch(err => ctxToast(err.message || 'No local file')) },
      { text: '🎬 ' + (it.video ? 'Replace the video…' : 'Attach video…'), onClick: () => swPickVideo((f) => swAttachVideo(it, f)) },
      it.video && { text: '✂️ Remove the video', onClick: () => swRemoveVideo(it) },
      it.link && { text: '↗ Open the link', href: it.link }]);
  });
  card.addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); card.classList.add('sw-drop-card'); } });
  card.addEventListener('dragleave', () => card.classList.remove('sw-drop-card'));
  card.addEventListener('drop', (e) => {                                               // a video file dropped on THIS card attaches to it (the gallery's own drop makes a new item)
    const f = [...e.dataTransfer.files].find(swIsVideo);
    card.classList.remove('sw-drop-card');
    if (f) { e.preventDefault(); e.stopPropagation(); swAttachVideo(it, f); }
  });
  return card;
}

function swRender() {
  const vids = swItems.filter((it) => it.video).length, imgs = swItems.filter((it) => it.image && !it.video).length, links = swItems.length - imgs - vids;
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  document.getElementById('sw-total').textContent = swItems.length ? [imgs && plural(imgs, 'image'), vids && plural(vids, 'video'), links && plural(links, 'link')].filter(Boolean).join(' · ') : '';
  swGrid.innerHTML = '';
  swGrid.classList.toggle('sw-carousel', swMode === 'carousel');
  document.querySelectorAll('.sw-mode button').forEach((b) => b.classList.toggle('on', b.dataset.mode === swMode));
  document.querySelectorAll('.sw-arrow').forEach((b) => { b.hidden = swMode !== 'carousel'; });
  swMore.hidden = true;
  if (!swItems.length) {
    swGrid.innerHTML = '<div class="sw-empty">Nothing yet — paste a screenshot (⌘V) or drop one here.</div>';
  } else {
    const shown = swMode === 'carousel' ? swItems.length : Math.min(SW_LIMIT, swItems.length);
    swItems.slice(0, shown).forEach((it, i) => swGrid.appendChild(swCard(it, i)));
    if (swMode === 'grid' && swItems.length > SW_LIMIT) { swMore.hidden = false; swMore.textContent = `Show all ${swItems.length} ⤢`; }
  }
  if (!swAll.hidden) swFillAll();
  swPollPlan();
}

// ---- the pop-up with every item (cards stay editable; clicking a picture opens the full-size viewer on top)
function swFillAll() {
  swAllGrid.innerHTML = '';
  swItems.forEach((it, i) => swAllGrid.appendChild(swCard(it, i)));
  document.getElementById('sw-all-count').textContent = `${swItems.length} in your swipe gallery`;
}
function swOpenAll() { swAll.hidden = false; swFillAll(); }
function swCloseAll() { swAll.hidden = true; }

async function swDelete(it) {
  if (!confirm('Remove this from the swipe gallery?')) return;
  await fetch('/api/swipe-delete?id=' + encodeURIComponent(it.id), { method: 'POST' }).catch(() => {});
  swItems = swItems.filter((x) => x.id !== it.id);
  swRender();
}

async function swAddImages(files) {
  const imgs = [...files].filter((f) => f.type.startsWith('image/'));
  for (const [n, f] of imgs.entries()) {
    swStatus(`Adding ${n + 1} of ${imgs.length}…`);
    try {
      const res = await fetch('/api/swipe-add', { method: 'POST', body: f,
        headers: { 'Content-Type': f.type, 'X-Title': encodeURIComponent(/^image\.\w+$|^Screenshot/i.test(f.name) ? '' : f.name.replace(/\.\w+$/, '')) } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      swItems.unshift(data.item);
    } catch (e) { swStatus('⚠️ ' + (e.message || 'Couldn’t add')); return; }
  }
  swStatus(imgs.length ? 'Added ✓' : '');
  swRender();
}

async function swAddLink(url) {
  url = (url || '').trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  try {
    const automatic = SW_VIDEO_LINK.test(url);
    const res = await fetch(automatic ? '/api/swipe-download' : '/api/swipe-add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ link: url, waiting: automatic }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    const at = swItems.findIndex(i => i.id === data.item.id);
    if (at >= 0) swItems[at] = data.item; else swItems.unshift(data.item);
    swRender();
    swStatus(data.duplicate ? 'Already in your gallery ✓' : automatic ? 'Added — downloading…' : 'Added ✓');
    return data.item;
  } catch (e) { swStatus('⚠️ ' + (e.message || 'Couldn’t add the link')); return null; }
}

async function swRetry(it) {
  it.download = { stage: 'queued', percent: 0, message: 'Queued…' }; it.waiting = true; swRender();
  try {
    const res = await fetch('/api/swipe-download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id }) });
    const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Couldn’t restart');
    Object.assign(it, data.item); swStatus('Download restarted'); swRender();
  } catch (e) { it.download = { stage: 'error', percent: 0, message: e.message || 'Couldn’t restart' }; swRender(); }
}

// ---- videos: new item, or attach to an existing one (a placeholder)
const swIsVideo = (f) => f.type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(f.name);
const swVideoType = (f) => f.type.startsWith('video/') ? f.type : /\.webm$/i.test(f.name) ? 'video/webm' : /\.mov$/i.test(f.name) ? 'video/quicktime' : 'video/mp4';
async function swAddVideos(files) {
  const vids = [...files].filter(swIsVideo);
  for (const [n, f] of vids.entries()) {
    swStatus(`Uploading video ${n + 1} of ${vids.length} (${Math.round(f.size / 1048576)} MB)…`);
    try {
      const res = await fetch('/api/swipe-add', { method: 'POST', body: f, headers: { 'Content-Type': swVideoType(f), 'X-Title': encodeURIComponent(f.name.replace(/\.\w+$/, '')) } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      swItems.unshift(data.item);
    } catch (e) { swStatus('⚠️ ' + (e.message || 'Couldn’t upload the video')); return; }
  }
  swStatus(vids.length ? 'Added ✓' : '');
  swRender();
}
async function swAttachVideo(it, f) {
  swStatus(`Uploading video (${Math.round(f.size / 1048576)} MB)…`);
  try {
    const res = await fetch('/api/swipe-video?id=' + encodeURIComponent(it.id), { method: 'POST', body: f, headers: { 'Content-Type': swVideoType(f) } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'failed');
    Object.assign(it, data.item); delete it.waiting;
    swStatus('Video attached ✓'); swRender();
  } catch (e) { swStatus('⚠️ ' + (e.message || 'Couldn’t attach the video')); }
}
function swPickVideo(onPick) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'video/*,.mp4,.mov,.m4v,.webm';
  inp.onchange = () => { if (inp.files[0]) onPick(inp.files[0]); };
  inp.click();
}
async function swRemoveVideo(it) {
  if (!confirm('Take the video off this item?')) return;
  const res = await fetch('/api/swipe-video?id=' + encodeURIComponent(it.id) + '&remove=1', { method: 'POST' });
  if (res.ok) { Object.assign(it, (await res.json()).item); delete it.video; swRender(); }
}
document.getElementById('sw-add-video').onclick = () => swPickVideo((f) => swAddVideos([f]));

document.querySelectorAll('.sw-mode button').forEach((b) => b.onclick = () => { swMode = b.dataset.mode; liveStore('swMode', swMode); swRender(); });
document.getElementById('sw-prev-strip').onclick = () => swGrid.scrollBy({ left: -(swGrid.clientWidth * 0.8), behavior: 'smooth' });
document.getElementById('sw-next-strip').onclick = () => swGrid.scrollBy({ left: swGrid.clientWidth * 0.8, behavior: 'smooth' });
document.getElementById('sw-open-tab').onclick = () => document.querySelector('.modern-sidebar [data-route="swipe"]')?.click();
swMore.onclick = swOpenAll;
document.getElementById('sw-open-all').onclick = swOpenAll;
document.getElementById('sw-all-close').onclick = swCloseAll;
swAll.addEventListener('click', (e) => { if (e.target === swAll) swCloseAll(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !swAll.hidden && swViewer.hidden) { e.preventDefault(); swCloseAll(); } });
document.getElementById('sw-add-img').onclick = () => swFile.click();
swFile.onchange = () => { swAddImages(swFile.files); swFile.value = ''; };
document.getElementById('sw-add-link').onclick = () => swAddLink(prompt('Link to the post or story:'));

// paste a screenshot (or a link) anywhere on the Content tab -- but not into a text box, where paste means text
document.addEventListener('paste', (e) => {
  if (swView.style.display === 'none' || !swViewer.hidden) return;
  if (e.target.closest && e.target.closest('textarea, input')) return;
  const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
  if (files.length) { e.preventDefault(); swAddImages(files); return; }
  const text = e.clipboardData?.getData('text') || '';
  if (/^https?:\/\/\S+$/i.test(text.trim())) { e.preventDefault(); swAddLink(text); }
});

// drop images on the gallery
swSection.addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); swSection.classList.add('drop'); } });
swSection.addEventListener('dragleave', (e) => { if (!swSection.contains(e.relatedTarget)) swSection.classList.remove('drop'); });
swSection.addEventListener('drop', (e) => { e.preventDefault(); swSection.classList.remove('drop'); swAddImages(e.dataTransfer.files); swAddVideos(e.dataTransfer.files); });

// ---- full-size viewer: ← / → (or swipe) through the items, response beside the picture
const swStage = document.getElementById('sw-stage');
const swVTitle = document.getElementById('sw-v-title'), swVLink = document.getElementById('sw-v-link'), swVResp = document.getElementById('sw-v-resp');
const swVStatus = document.getElementById('sw-v-status');

function swOpen(i) {
  if (!swItems.length) return;
  swAt = (i + swItems.length) % swItems.length;
  const it = swItems[swAt];
  swStage.innerHTML = '';
  const urls = it.image ? swAllUrls(it) : [];
  if (it.video) {                                                                       // a video: controls, sound, starts playing
    const v = document.createElement('video'); v.src = swVideoUrl(it); v.controls = true; v.autoplay = true; v.playsInline = true; v.className = 'sw-bigvideo';
    swStage.appendChild(v);
  } else if (urls.length > 1) {                                  // a multi-picture item: every picture side by side
    const row = document.createElement('div'); row.className = 'sw-row';
    urls.forEach(u => { const im = document.createElement('img'); im.src = u; im.alt = it.title || 'screenshot'; row.appendChild(im); });
    swStage.appendChild(row);
    swViewer.hidden = false;                                                           // visible first, so the stage can be measured
    fitPictures(row, swStage.clientWidth - 24, swStage.clientHeight - 56);             // any number of pictures: shrunk / wrapped to fit (hover-peek.js)
  } else {
    const shown = swThumb(it);
    if (!it.image && it.link) { const a = document.createElement('a'); a.href = it.link; a.target = '_blank'; a.rel = 'noopener'; a.style.color = 'inherit'; a.appendChild(shown); swStage.appendChild(a); }
    else swStage.appendChild(shown);
  }
  document.getElementById('sw-count').textContent = `${swAt + 1} of ${swItems.length}`;
  swVTitle.value = it.title || ''; swVLink.value = it.link || ''; swVResp.value = it.response || '';
  swVStatus.textContent = '';
  swViewer.hidden = false;
}
function swClose() { swStage.querySelectorAll('video').forEach(v => v.pause()); swViewer.hidden = true; swAt = -1; swRender(); }   // redraw so edits made in the viewer show on the cards

swVTitle.oninput = () => swSave(swItems[swAt], { title: swVTitle.value }, swVStatus);
swVLink.oninput = () => swSave(swItems[swAt], { link: swVLink.value.trim() }, swVStatus);
swVResp.oninput = () => swSave(swItems[swAt], { response: swVResp.value }, swVStatus);
document.getElementById('sw-prev').onclick = () => swOpen(swAt - 1);
document.getElementById('sw-next').onclick = () => swOpen(swAt + 1);
document.getElementById('sw-close').onclick = swClose;
swViewer.addEventListener('click', (e) => { if (e.target === swViewer || e.target === swStage) swClose(); });
document.addEventListener('keydown', (e) => {
  if (swViewer.hidden) return;
  const typing = e.target.closest && e.target.closest('textarea, input');
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); swClose(); return; }
  if (typing) { e.stopPropagation(); return; }
  if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); swOpen(swAt - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); swOpen(swAt + 1); }
}, true);
let swTouchX = null;   // swipe on a touch screen / trackpad drag
swStage.addEventListener('pointerdown', (e) => { swTouchX = e.clientX; });
swStage.addEventListener('pointerup', (e) => {
  if (swTouchX === null) return;
  const dx = e.clientX - swTouchX; swTouchX = null;
  if (Math.abs(dx) > 60) swOpen(swAt + (dx < 0 ? 1 : -1));
});

// load when the Content tab is shown (also when the page reopens straight on it)
new MutationObserver(() => { if (swView.style.display !== 'none') swLoad(); }).observe(swView, { attributes: true, attributeFilter: ['style'] });
if (swView.style.display !== 'none') swLoad();
