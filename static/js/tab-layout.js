// tab-layout.js -- the tab bar as a TOP bar (default) or a SIDE bar. Switch from the tab bar's right-click menu ("Move tabs to the side bar / top bar") or from
// Settings > Tab bar. In side mode the bar sits on the left, except on the Call Studio tab (its own people list already takes the left), where it sits on the right;
// Settings can also pin it to the left or the right everywhere. Remembered in this browser: localStorage "tabBarMode" (top | side), "tabBarSide" (auto | left | right).
// The page below the bar is sized with --tabs-h (the bar's height): 0 in side mode, so everything fills the screen next to the bar (live-call.js sets it).
// Also: hold Cmd and hover a tab to open it (see the bottom). Plain script (not a module); load it after live-call.js and tab-order.js. showTab() in live-call.js calls tabLayoutApply(tab) on every tab change.

const tabLayoutMode = () => (liveStore('tabBarMode') === 'side' ? 'side' : 'top');
const tabLayoutSidePref = () => (['left', 'right'].includes(liveStore('tabBarSide')) ? liveStore('tabBarSide') : 'auto');

function tabLayoutApply(which) {
  const tab = which || liveStore('appTab') || 'studio';
  const side = tabLayoutMode() === 'side';
  const pref = tabLayoutSidePref();
  const where = pref === 'auto' ? (tab === 'studio' ? 'right' : 'left') : pref;   // Call Studio has its people list on the left, so auto puts the bar on the right there
  document.body.classList.toggle('tabs-side', side);
  document.body.classList.toggle('tabs-side-left', side && where === 'left');
  document.body.classList.toggle('tabs-side-right', side && where === 'right');
  document.documentElement.style.setProperty('--tabs-h', side ? '0px' : document.getElementById('app-tabs').offsetHeight + 'px');
  if (typeof tabLayoutPaintSettings === 'function') tabLayoutPaintSettings();
}

function tabLayoutSet(mode) { liveStore('tabBarMode', mode); tabLayoutApply(); window.dispatchEvent(new CustomEvent('app:preferences-changed')); }

// right-click menu item (built in live-call.js)
document.addEventListener('click', (e) => {
  if (!e.target.closest('#ctx-tab-layout')) return;
  ctxMenu.style.display = 'none';
  tabLayoutSet(tabLayoutMode() === 'side' ? 'top' : 'side');
}, true);

// Settings > Tab bar
const tlSeg = (id, opts, cur, onPick) => {
  const box = document.getElementById(id); if (!box) return;
  box.innerHTML = opts.map(([k, l]) => `<button data-k="${k}" class="${cur === k ? 'on' : ''}">${l}</button>`).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => onPick(b.dataset.k));
};
function tabLayoutPaintSettings() {
  tlSeg('st-tabbar-mode', [['top', 'Top bar'], ['side', 'Side bar']], tabLayoutMode(), tabLayoutSet);
  tlSeg('st-tabbar-side', [['auto', 'Auto'], ['left', 'Always left'], ['right', 'Always right']], tabLayoutSidePref(), (k) => { liveStore('tabBarSide', k); tabLayoutApply(); window.dispatchEvent(new CustomEvent('app:preferences-changed')); });
  const cmd = document.getElementById('st-tab-cmdhover'); if (cmd) { cmd.checked = tabCmdHoverOn(); cmd.onchange = () => { liveStore('tabCmdHover', cmd.checked ? '1' : '0'); window.dispatchEvent(new CustomEvent('app:preferences-changed')); }; }
  const sideRow = document.getElementById('st-tabbar-side-row'); if (sideRow) sideRow.style.display = tabLayoutMode() === 'side' ? '' : 'none';
}

// Hold Cmd and rest the pointer on a tab (or press Cmd while it's already on one) to open it, instead of clicking. Stripe / Calendar / Chanty / Links are left out
// (they open other sites or a menu). Switch off in Settings > Tab bar (localStorage "tabCmdHover" = "0").
const tabCmdHoverOn = () => liveStore('tabCmdHover') !== '0';
let tabUnderMouse = null;
const tabOpenable = (t) => t && !t.classList.contains('app-site') && t.id !== 'tab-links' && !t.classList.contains('active');
tabBar.addEventListener('mouseover', (e) => {
  tabUnderMouse = e.target.closest('#app-tabs > .app-tab');
  if (e.metaKey && !e.buttons && tabCmdHoverOn() && tabOpenable(tabUnderMouse)) tabUnderMouse.click();
});
tabBar.addEventListener('mouseleave', () => { tabUnderMouse = null; });
document.addEventListener('keydown', (e) => { if (e.key === 'Meta' && !e.repeat && tabCmdHoverOn() && tabOpenable(tabUnderMouse)) tabUnderMouse.click(); });

tabLayoutApply();
