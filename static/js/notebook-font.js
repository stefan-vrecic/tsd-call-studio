// notebook-font.js -- Settings -> Notebook pages -> Font: "mix" (sans-serif titles, handwritten answers; the default), "hand" (the
// Journal's handwriting) or "sans" (a clean sans-serif) for
// Identity Lab's notebook pages (frontend/src/pages/IdentityLabPage.tsx reads localStorage "notebookFont" and redraws on the event below).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.
(() => {
  const sel = document.getElementById('st-notebook-font'); if (!sel) return;
  try { const v = localStorage.getItem('notebookFont'); sel.value = v === 'sans' || v === 'hand' ? v : 'mix'; } catch (e) { /* storage blocked: mixed */ }
  sel.addEventListener('change', () => {
    try { localStorage.setItem('notebookFont', sel.value); } catch (e) { /* not remembered */ }
    window.dispatchEvent(new CustomEvent('callstudio:notebook-font', { detail: sel.value }));
  });
})();
