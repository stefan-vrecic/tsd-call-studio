// settings-layout.js -- lays the Settings page out as clearly separate cards: every <h3> section of #settings-view (Tab bar, Live Call,
// Voice command, Hover previews, Tabs and links ...) is wrapped, with everything under it, in its own card with an icon, and a row of
// links at the top jumps to each one. It only MOVES the existing elements (their ids and the scripts on them keep working), so a section
// added to player.html later becomes a card by itself.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.
(() => {
  const doc = document.querySelector('#settings-view .st-doc');
  if (!doc || doc.dataset.laidOut) return;
  doc.dataset.laidOut = '1';
  const ICONS = { 'call studio': '🎧', 'tab bar': '🧭', 'quick jump': '🔎', 'live call': '📞', 'voice command': '🎙', 'hover previews': '🖱', 'external links': '🌐', 'tabs': '🧩' };
  const toc = document.createElement('nav'); toc.className = 'st-toc';
  const heads = [...doc.querySelectorAll(':scope > h3')];
  heads.forEach((h, i) => {
    const name = h.textContent.trim(), id = 'st-sec-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const card = document.createElement('section'); card.className = 'st-card'; card.id = id;
    h.before(card);
    // the heading and everything after it up to the next section heading
    let node = h;
    while (node && !(node !== h && node.nodeType === 1 && node.tagName === 'H3')) { const next = node.nextSibling; card.appendChild(node); node = next; }
    h.innerHTML = `<span class="st-ico">${ICONS[name.toLowerCase()] || '⚙️'}</span>${h.innerHTML}`;
    const a = document.createElement('a'); a.href = '#' + id; a.textContent = `${ICONS[name.toLowerCase()] || '⚙️'} ${name}`;
    a.onclick = (e) => { e.preventDefault(); card.scrollIntoView({ behavior: 'smooth', block: 'start' }); card.classList.remove('st-flash'); void card.offsetWidth; card.classList.add('st-flash'); };
    toc.appendChild(a);
  });
  const title = doc.querySelector(':scope > h2');
  (title || doc.firstChild).after(toc);
})();
