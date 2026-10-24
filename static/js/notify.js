// notify.js -- Call Studio's notifications as browser notifications (server feed: notifications.py, GET /api/notifications).
// Clicking one brings this tab forward and opens that call's page. While a tab is polling, the server skips the old
// macOS notifications (those can't be clicked). Browser permission is asked on your first click anywhere on the page.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

let ntAfter = null;   // newest id already seen; null until the first poll (old ones are not replayed on page load)

function ntShow(n) {
  // several Call Studio tabs open: only the first one to see an id shows it
  const key = 'notifShown:' + n.id;
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (e) { /* storage blocked */ }
  const note = new Notification(n.title || 'Call Studio', { body: n.message, tag: 'cs-' + n.id });
  note.onclick = () => {
    window.focus();
    if (n.person && people.some(p => p.name === n.person)) {
      showTab('studio');
      selectPerson(n.person);
      document.querySelector(`#people-list li[data-person="${CSS.escape(n.person)}"]`)?.scrollIntoView({ block: 'nearest' });
    } else if (n.title === 'New email' && typeof toggleMailPanel === 'function') {
      toggleMailPanel();
    }
    note.close();
  };
}

async function ntPoll() {
  try {
    const d = await csJSON('/api/notifications?after=' + (ntAfter ?? 0));
    if (ntAfter !== null && 'Notification' in window && Notification.permission === 'granted') {
      if (d.items.some(n => n.person && !people.some(p => p.name === n.person))) await loadPeople();   // a call this tab hasn't seen yet
      d.items.forEach(ntShow);
    }
    ntAfter = d.latest;
  } catch (e) { /* server restarting: try again next time */ }
}

if ('Notification' in window && Notification.permission === 'default') {
  document.addEventListener('click', () => { if (Notification.permission === 'default') Notification.requestPermission(); }, { once: true });
}
ntPoll();
setInterval(ntPoll, 5000);
