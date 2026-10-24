// hover-peek.js -- rest the mouse on a picture for a moment and a big preview pops up in the middle of the screen. Move the mouse off the picture's own
// outline (the thumbnail where it was) and the preview closes again; the preview itself ignores the mouse, so it never gets in the way. Click the picture
// and it opens the normal full-size viewer instead (journal pages: arrows, move, delete; swipe gallery: the response box), where the mouse can go anywhere.
// Works on the Journal thumbnails (.jr-thumb), Learning Notes buttons (.bk-typed-notes), and the Swipe gallery pictures (.sw-thumb; an item with
// several pictures pops up all of them side by side, a video item plays). Learning pages use the Journal hover preference because they share its page style.

const PEEK_SELECTOR = '.jr-thumb, .bk-typed-notes, .sw-thumb';
const PEEK_PLACES = { '.jr-thumb': 'journal', '.bk-typed-notes': 'journal', '.sw-thumb': 'swipe' };   // selector -> its entry in hover-prefs.js
let peekTimer = null, peekOn = null, peekBox = null;

// Lays several pictures out as a grid that fits W x H: tries 1, 2, 3 ... rows and keeps the arrangement with the biggest pictures, so 5 slides sit in one row and
// 12 wrap into 2-3 rows instead of becoming slivers. Sets each picture's width and the box's width; used by the hover pop-up and the Swipe viewer (swipe-gallery.js).
function fitPictures(box, W, H, gap = 8) {
  const imgs = [...box.querySelectorAll('img, canvas')], n = imgs.length;
  if (!n) return;
  const first = imgs[0], ratio = first.naturalWidth ? first.naturalWidth / first.naturalHeight : first.width ? first.width / first.height : 0.45;   // phone screenshots are about 9:20 until the first one has loaded
  let best = { w: 0, cols: n };
  for (let rows = 1; rows <= Math.min(n, 4); rows++) {
    const cols = Math.ceil(n / rows);
    const w = Math.min((W - gap * (cols - 1)) / cols, ((H - gap * (rows - 1)) / rows) * ratio);
    if (w > best.w) best = { w, cols };
  }
  imgs.forEach(im => { im.style.width = Math.floor(best.w) + 'px'; im.style.height = 'auto'; im.style.maxWidth = 'none'; im.style.maxHeight = 'none'; im.style.flex = 'none'; });
  box.style.boxSizing = 'content-box';   // the box's padding must not eat the width we computed (the last picture would wrap)
  box.style.display = 'flex'; box.style.flexWrap = 'wrap'; box.style.justifyContent = 'center'; box.style.alignContent = 'center'; box.style.gap = gap + 'px';
  box.style.width = Math.ceil(best.cols * Math.floor(best.w) + gap * (best.cols - 1)) + 'px';
  if (!first.naturalWidth) first.addEventListener('load', () => fitPictures(box, W, H, gap), { once: true });   // re-fit with the real proportions
}

function peekHide() {
  clearTimeout(peekTimer); peekTimer = null;
  if (peekBox) { peekBox.classList.remove('show'); peekBox.querySelectorAll('video').forEach(v => v.pause()); }   // a playing video stops with the pop-up
  peekOn = null;
}

function peekShow(el) {
  if (el.matches('.bk-typed-notes') && el._bkTypedPages?.length) {
    if (!peekBox) { peekBox = document.createElement('div'); peekBox.id = 'hover-peek'; document.body.appendChild(peekBox); }
    const pages = el._bkTypedPages.flatMap(p => jtPages(p.text || '', p.date || bkTypedToday()));
    peekBox.innerHTML = '';
    pages.forEach(x => { x.canvas.className = 'bk-typed-preview'; peekBox.appendChild(x.canvas); });
    peekBox.classList.toggle('multi', pages.length > 1); peekBox.style.width = ''; peekBox.style.display = '';
    if (pages.length > 1) fitPictures(peekBox, innerWidth * 0.92 - 16, innerHeight * 0.88 - 16);
    peekBox.classList.add('show');
    return;
  }
  const vid = el.querySelector('[data-video]');
  if (vid) {                                                                           // a video item: plays (muted, looping) in the pop-up
    if (!peekBox) { peekBox = document.createElement('div'); peekBox.id = 'hover-peek'; document.body.appendChild(peekBox); }
    peekBox.innerHTML = `<video src="${vid.dataset.video}" autoplay muted loop playsinline></video>`;
    peekBox.classList.remove('multi'); peekBox.style.width = ''; peekBox.style.display = '';
    peekBox.classList.add('show');
    return;
  }
  const multi = el.querySelector('[data-images]');
  const urls = multi ? JSON.parse(multi.dataset.images) : [(el.querySelector('img') || {}).src].filter(Boolean);
  if (!urls.length) return;
  if (!peekBox) { peekBox = document.createElement('div'); peekBox.id = 'hover-peek'; document.body.appendChild(peekBox); }
  peekBox.innerHTML = urls.map(u => `<img src="${u}" alt="">`).join('');
  peekBox.classList.toggle('multi', urls.length > 1);
  peekBox.style.width = ''; peekBox.style.display = '';
  if (urls.length > 1) fitPictures(peekBox, innerWidth * 0.92 - 16, innerHeight * 0.88 - 16);   // as many pictures as you like: shrunk (and wrapped onto rows) to fit the screen
  peekBox.classList.add('show');
}

document.addEventListener('mouseover', (e) => {
  const el = e.target.closest && e.target.closest(PEEK_SELECTOR);
  if (!el || el === peekOn) return;
  peekHide();
  peekOn = el;
  const place = Object.entries(PEEK_PLACES).find(([sel]) => el.matches(sel));
  const ms = place ? hoverDelayMs(place[1]) : null;
  if (ms == null) return;                      // switched off in Settings
  peekTimer = setTimeout(() => { if (peekOn === el) peekShow(el); }, ms);
});
document.addEventListener('mouseout', (e) => {
  if (!peekOn) return;
  const to = e.relatedTarget;
  if (!to || !peekOn.contains(to)) peekHide();   // the pointer left the thumbnail's own outline
});
['click', 'wheel', 'blur'].forEach(ev => window.addEventListener(ev, peekHide, true));   // a click hands over to the normal viewer
document.addEventListener('keydown', peekHide, true);
