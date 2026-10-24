// mail.js -- the email notification box: pop-ups for new emails (Gmail is read by the server, see mail_watch.py), a ✉ button with a
// count, and the list behind it. HubSpot / OnceHub (and whatever else is in Settings) never get here: the server filters them out.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const MAIL_POLL_MS = 15000;
const MAIL_TOAST_MS = 15000;
const MAIL_MAX_TOASTS = 4;
const mailToasts = document.getElementById('mail-toasts');
const mailPanel = document.getElementById('mail-panel');
const mailBadge = document.getElementById('mail-badge');
let mailState = { connected: false, items: [], email: null };

const mailStore = csStore;   // (shared.js)
const mailNum = (key) => parseFloat(mailStore(key)) || 0;

function mailSenderName(from) { return (String(from).split('<')[0].trim().replace(/^"|"$/g, '') || from).trim(); }
function mailAgo(ms) {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 90) return 'now';
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}
function openMailItem(item) {
  const acct = mailState.email ? `?authuser=${encodeURIComponent(mailState.email)}` : '';
  window.open(`https://mail.google.com/mail/u/0/${acct}#inbox/${item.threadId || item.id}`, '_blank', 'noopener');
}

function showMailToast(item) {
  const el = document.createElement('div');
  el.className = 'mail-toast';
  el.innerHTML = `<button class="mt-x" title="Dismiss">✕</button>
    <div class="mt-from">${escapeHtml(mailSenderName(item.from))}</div>
    <div class="mt-subj">${escapeHtml(item.subject)}</div>
    <div class="mt-snip">${escapeHtml(item.snippet || '')}</div>`;
  const close = () => el.remove();
  el.querySelector('.mt-x').onclick = (e) => { e.stopPropagation(); close(); };
  el.onclick = () => { openMailItem(item); close(); };
  mailToasts.appendChild(el);
  setTimeout(close, MAIL_TOAST_MS);
  // never a wall of boxes: keep the newest few, older ones are still in the list behind the ✉ button
  while (mailToasts.querySelectorAll('.mail-toast:not(.more)').length > MAIL_MAX_TOASTS) mailToasts.querySelector('.mail-toast:not(.more)').remove();
}

function renderMailBadge() {
  const unread = mailState.items.filter(i => i.time > mailNum('mailSeenAt')).length;
  mailBadge.style.display = unread ? 'block' : 'none';
  mailBadge.textContent = unread > 9 ? '9+' : String(unread);
}

function renderMailPanel() {
  const list = document.getElementById('mail-panel-list');
  if (!mailState.connected) {
    list.innerHTML = '<div class="mail-empty">Gmail isn\'t connected yet. Open ⚙️ Settings and press <b>Connect Gmail</b>.</div>';
  } else if (!mailState.items.length) {
    list.innerHTML = '<div class="mail-empty">No new emails yet. HubSpot and OnceHub are left out.</div>';
  } else {
    list.innerHTML = '';
    mailState.items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'mail-item';
      row.innerHTML = `<div class="mi-top"><span class="mi-from">${escapeHtml(mailSenderName(item.from))}</span><span>${mailAgo(item.time)}</span></div>
        <div class="mi-subj">${escapeHtml(item.subject)}</div><div class="mi-snip">${escapeHtml(item.snippet || '')}</div>`;
      row.onclick = () => openMailItem(item);
      list.appendChild(row);
    });
  }
}

async function pollMail(firstLoad) {
  let data;
  try { data = await csJSON('/api/mail'); } catch (e) { return; }
  mailState = data;
  // pop up whatever arrived since the last pop-up; a reload never re-announces old mail
  const shownUpTo = mailNum('mailToastedAt');
  const fresh = data.items.filter(i => i.time > shownUpTo).sort((a, b) => a.time - b.time);
  if (data.items.length) mailStore('mailToastedAt', Math.max(shownUpTo, ...data.items.map(i => i.time)));
  if (!firstLoad || shownUpTo) fresh.forEach(showMailToast);
  if (firstLoad && !mailNum('mailSeenAt')) mailStore('mailSeenAt', Date.now());
  renderMailBadge();
  if (mailPanel.style.display === 'flex') renderMailPanel();
}

function toggleMailPanel() {
  if (mailPanel.style.display === 'flex') { mailPanel.style.display = 'none'; return; }
  const r = document.getElementById('mail-btn').getBoundingClientRect();
  mailPanel.style.top = (r.bottom + 6) + 'px';
  mailPanel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 368)) + 'px';
  renderMailPanel();
  mailPanel.style.display = 'flex';
  mailStore('mailSeenAt', Date.now());
  renderMailBadge();
}

document.getElementById('mail-btn').onclick = (e) => { e.stopPropagation(); toggleMailPanel(); };
document.getElementById('mail-clear').onclick = async () => {
  await fetch('/api/mail-clear', { method: 'POST' });
  mailState.items = [];
  renderMailPanel();
  renderMailBadge();
};
document.addEventListener('click', (e) => { if (!mailPanel.contains(e.target)) mailPanel.style.display = 'none'; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') mailPanel.style.display = 'none'; });
pollMail(true);
setInterval(() => pollMail(false), MAIL_POLL_MS);
