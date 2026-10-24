// ui.js -- the interface pieces every tab shares, defined once: the right-click menu (csMenu), the small message at the bottom
// (csToast) and a dialog box (csDialog). Loaded right after core.js.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const ctxMenu = document.getElementById('ctx-menu');   // the one right-click menu box (player.html); a click anywhere closes it

// Shows the menu at the pointer, nudged so it never runs off the edge of the window (a menu opened near the right or bottom edge slides back in).
function placeCtxMenu(x, y) {
  ctxMenu.style.display = 'block';
  const margin = 8;
  const left = Math.min(x, window.innerWidth - ctxMenu.offsetWidth - margin);
  const top = Math.min(y, window.innerHeight - ctxMenu.offsetHeight - margin);
  ctxMenu.style.left = Math.max(margin, left) + 'px';
  ctxMenu.style.top = Math.max(margin, top) + 'px';
}

/**
 * Opens the right-click menu at the pointer (`at` = the mouse event, or {clientX, clientY}). `items`, top to bottom (false / null are skipped):
 *   '-'                                   a divider line
 *   { heading: 'Anne Kadri' }             the bold title at the top
 *   { label: 'Closer' }                   a small grey section label
 *   { text, onClick, title, checked, disabled, href, keepOpen }   an option. checked puts ✓ in front; href makes it a link (new tab);
 *                                         keepOpen leaves the menu up after the click (onClick gets (event, theItemElement))
 * Text is shown as plain text, so names never need escaping.
 */
function csMenu(at, items) {
  ctxMenu.innerHTML = '';
  items.filter(Boolean).forEach(it => {
    let el;
    if (it === '-') { el = document.createElement('div'); el.className = 'ctx-divider'; }
    else if (it.heading != null) { el = document.createElement('div'); el.className = 'ctx-heading'; el.textContent = it.heading; }
    else if (it.label != null) { el = document.createElement('div'); el.className = 'ctx-label'; el.textContent = it.label; }
    else {
      el = document.createElement(it.href ? 'a' : 'div'); el.className = 'item';
      el.textContent = (it.checked ? '✓ ' : '') + it.text;
      if (it.title) el.title = it.title;
      if (it.href) { el.href = it.href; el.target = '_blank'; el.rel = 'noopener'; }
      if (it.disabled) { el.style.opacity = '.5'; el.style.cursor = 'not-allowed'; }
      el.addEventListener('click', (e) => {
        if (it.keepOpen) e.stopPropagation(); else ctxMenu.style.display = 'none';
        if (!it.disabled && it.onClick) it.onClick(e, el);
      });
    }
    ctxMenu.appendChild(el);
  });
  placeCtxMenu(at.clientX, at.clientY);
}

// Small message at the bottom of the page that fades by itself.
function csToast(text) {
  let t = document.getElementById('ctx-toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'ctx-toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#111;color:#fff;padding:9px 16px;border-radius:8px;font-size:14px;z-index:99999;box-shadow:0 2px 10px rgba(0,0,0,.35);transition:opacity .3s;pointer-events:none';
    document.body.appendChild(t);
  }
  t.textContent = text; t.style.opacity = '1';
  clearTimeout(t._timer); t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2600);
}
const ctxToast = csToast;   // (the name most files use)

/**
 * A dialog box over the page: csDialog({ title, body, buttons, className, onClose }) -> { box, card, close }.
 *   body     HTML text, or an element
 *   buttons  [{ text, primary, danger, onClick }] along the bottom; onClick(dialog) -- return false to keep it open
 * Esc, ✕ and a click outside close it (onClose runs then). Keys typed inside don't reach the page's shortcuts.
 */
function csDialog({ title = '', body = '', buttons = [], className = '', onClose } = {}) {
  const box = document.createElement('div'); box.className = 'cs-dialog-bg';
  box.innerHTML = `<div class="cs-dialog ${className}" role="dialog" aria-modal="true"><header><b></b><button class="ctl cs-dialog-x" title="Close (Esc)">✕</button></header><div class="cs-dialog-body"></div>${buttons.length ? '<footer></footer>' : ''}</div>`;
  const card = box.firstElementChild;
  card.querySelector('header b').textContent = title;
  const bodyEl = card.querySelector('.cs-dialog-body');
  if (body instanceof Node) bodyEl.appendChild(body); else bodyEl.innerHTML = body;
  let closed = false;
  const close = () => { if (closed) return; closed = true; box.remove(); document.removeEventListener('keydown', onKey, true); if (onClose) onClose(); };
  const dialog = { box, card, body: bodyEl, close };
  buttons.forEach(b => {
    const btn = document.createElement('button'); btn.className = 'ctl' + (b.primary ? ' cs-primary' : '') + (b.danger ? ' cs-danger' : '');
    btn.textContent = b.text;
    btn.onclick = async () => { if ((await (b.onClick ? b.onClick(dialog) : undefined)) !== false) close(); };
    card.querySelector('footer').appendChild(btn);
  });
  const onKey = (e) => { if (e.key === 'Escape' && document.body.lastElementChild === box) { e.preventDefault(); e.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey, true);
  box.addEventListener('keydown', (e) => e.stopPropagation());
  box.addEventListener('mousedown', (e) => { if (e.target === box) close(); });
  card.querySelector('.cs-dialog-x').onclick = close;
  document.body.appendChild(box);
  return dialog;
}
