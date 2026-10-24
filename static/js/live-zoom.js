// live-zoom.js -- Cmd/Ctrl + and Cmd/Ctrl - on the Live Call and Onboarding tabs make just the section you are pointing at bigger or smaller
// (the section under the mouse; if the mouse isn't over one, the one that has the keyboard focus) instead of zooming the whole page.
// A PDF side presses its own "+" / "−" buttons (so it behaves just like clicking them); the Notes pad changes its text size, remembered.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

let lzLastTarget = null;   // whatever the mouse was last over
document.addEventListener('mousemove', (e) => { lzLastTarget = e.target; }, { passive: true });

const LZ_NOTES_MIN = 11, LZ_NOTES_MAX = 44;
function lzApplyNotesSize(px) { liveNotesText.style.fontSize = px + 'px'; }
{
  const saved = parseFloat(liveStore('liveNotesFont'));
  if (saved >= LZ_NOTES_MIN && saved <= LZ_NOTES_MAX) lzApplyNotesSize(saved);
}

// the zoomable section an element belongs to: a PDF side (#live-doc-…) or the Notes pad
const lzPaneOf = (el) => (el && el.closest) ? el.closest('[id^="live-doc-"], #live-notes') : null;

document.addEventListener('keydown', (e) => {
  if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
  const plus = e.key === '+' || e.key === '=', minus = e.key === '-' || e.key === '_';
  if (!plus && !minus) return;
  const onLive = liveView.style.display !== 'none', onOnboarding = onboardingView.style.display !== 'none';
  if (!onLive && !onboardingView.contains(document.activeElement) && !onOnboarding) return;
  // the section under the mouse first; failing that, the one with focus
  const pane = lzPaneOf(lzLastTarget && lzLastTarget.isConnected && lzLastTarget.getBoundingClientRect().width ? lzLastTarget : null) || lzPaneOf(document.activeElement);
  if (!pane) return;                       // not over / in any section: leave the browser's own page zoom alone
  e.preventDefault();
  e.stopPropagation();
  if (pane.id === 'live-notes') {
    const cur = parseFloat(getComputedStyle(liveNotesText).fontSize) || 15;
    const next = Math.min(LZ_NOTES_MAX, Math.max(LZ_NOTES_MIN, Math.round(cur * (plus ? 1.1 : 1 / 1.1) * 10) / 10));
    lzApplyNotesSize(next);
    liveStore('liveNotesFont', next);
  } else {
    const btn = pane.querySelector(plus ? '[data-act="in"]' : '[data-act="out"]');
    if (btn) btn.click();
  }
}, true);
