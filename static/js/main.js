// main.js -- page start-up -- must stay the LAST script.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

// auto-select if this page was opened from either a docx timestamp link
// (/?person=X&t=123) or a direct link to one call (/09-03-LouiseThompson --
// the server only serves the page for that path if a manifest for that
// name actually exists, so finding it here should always succeed).
(async function init() {
  initPeopleFilter();
  initClips();
  await loadPeople();
  await loadBaseScripts();
  const params = new URLSearchParams(location.search);
  let person = params.get('person');
  const t = params.get('t');
  if (!person && location.pathname.length > 1) {
    person = decodeURIComponent(location.pathname.slice(1));
  }
  if (person) {
    selectPerson(person, t != null ? parseFloat(t) : null);
    if (params.get('copy') === 'transcript') {
      // reuse the exact same button (and its Copied!/failed feedback) --
      // note some browsers only allow a clipboard write during a genuine
      // click, so a page load alone (even from clicking a link) can be
      // silently denied permission depending on the browser; the button
      // stays visible and clickable either way as a one-tap fallback.
      document.getElementById('copy-srt').click();
    }
  }
})();
