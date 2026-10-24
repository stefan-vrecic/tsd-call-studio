// tab-order.js -- drag the top tabs into any order; the order is remembered in this browser (localStorage "tabOrder").
// Right-click the tab bar -> "Reset tab order" puts them back as they are in player.html.
// Plain script (not a module): shares one global scope with the other files; load it after live-call.js.

const tabBar = document.getElementById('app-tabs');
const tabEls = () => [...tabBar.querySelectorAll(':scope > .app-tab')];   // only the tabs move; the spacer + tools stay at the end
const tabTrailing = [...tabBar.children].filter((el) => !el.classList.contains('app-tab'));
const tabDefaultOrder = tabEls().map((el) => el.id).filter(Boolean);
let tabDragged = null;

function tabOrderSave() {
  csStore('tabOrder', JSON.stringify(tabEls().map((el) => el.id).filter(Boolean)));
}

// Saved order first; a tab added to player.html since then keeps its spot next to the tab it followed there.
function tabOrderApply(order) {
  const els = Object.fromEntries(tabEls().filter((el) => el.id).map((el) => [el.id, el]));
  const known = order.filter((id) => els[id]);
  tabDefaultOrder.forEach((id, i) => {
    if (known.includes(id)) return;
    const prev = tabDefaultOrder.slice(0, i).reverse().find((p) => known.includes(p));
    known.splice(prev ? known.indexOf(prev) + 1 : 0, 0, id);
  });
  known.forEach((id) => tabBar.appendChild(els[id]));
  tabTrailing.forEach((el) => tabBar.appendChild(el));
  if (typeof appShellGroups === 'function') appShellGroups();
}

function tabOrderReset() {
  try { localStorage.removeItem('tabOrder'); } catch (e) {}
  tabOrderApply(tabDefaultOrder);
  window.dispatchEvent(new CustomEvent('app:preferences-changed'));
}

try {
  const saved = JSON.parse(localStorage.getItem('tabOrder') || 'null');
  if (Array.isArray(saved)) tabOrderApply(saved);
} catch (e) {}

tabEls().forEach((el) => {
  if (!el.id) return;
  el.draggable = true;
  el.addEventListener('dragstart', (e) => {
    tabDragged = el;
    el.classList.add('tab-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', el.id);
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('tab-dragging');
    tabBar.querySelectorAll('.tab-drop-before, .tab-drop-after').forEach((t) => t.classList.remove('tab-drop-before', 'tab-drop-after'));
    tabDragged = null;
  });
});

function tabDropTarget(e) {
  const t = e.target.closest('#app-tabs > .app-tab');
  if (!t || !tabDragged || t === tabDragged) return null;
  const r = t.getBoundingClientRect();
  const side = document.body.classList.contains('tabs-side');   // a side bar stacks the tabs, so before / after is decided by height
  return { t, after: side ? e.clientY > r.top + r.height / 2 : e.clientX > r.left + r.width / 2 };
}

tabBar.addEventListener('dragover', (e) => {
  if (!tabDragged) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  tabBar.querySelectorAll('.tab-drop-before, .tab-drop-after').forEach((t) => t.classList.remove('tab-drop-before', 'tab-drop-after'));
  const hit = tabDropTarget(e);
  if (hit) hit.t.classList.add(hit.after ? 'tab-drop-after' : 'tab-drop-before');
});

tabBar.addEventListener('drop', (e) => {
  const hit = tabDropTarget(e);
  if (!hit) return;
  e.preventDefault();
  hit.t.insertAdjacentElement(hit.after ? 'afterend' : 'beforebegin', tabDragged);
  tabOrderSave();
  if (typeof appShellGroups === 'function') appShellGroups();
});

// the item lives in the tab bar's right-click menu (built in live-call.js)
document.addEventListener('click', (e) => {
  if (!e.target.closest('#ctx-tab-reset')) return;
  tabOrderReset();
  ctxMenu.style.display = 'none';
}, true);
