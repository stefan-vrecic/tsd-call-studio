// settings.js -- the Settings dialog (the closer's name). Loaded from /api/settings at start-up and saved there too.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

const settingsOverlay = document.getElementById('settings-overlay');
const settingsCloserInput = document.getElementById('set-closer');
const settingsStatus = document.getElementById('set-status');
const mailConnectBtn = document.getElementById('set-mail-connect');
const mailDisconnectBtn = document.getElementById('set-mail-disconnect');
const mailOnBox = document.getElementById('set-mail-on');
const mailIgnoreInput = document.getElementById('set-mail-ignore');
const mailStatusLine = document.getElementById('set-mail-status');
let mailConnectTimer = null;

function applyCloserName(name) {
  closerName = name || 'Stefan';
  if (current) renderObjectionBox(current); // the follow-up message on screen picks up the new name straight away
}

async function loadAppSettings() {
  try {
    const s = await csJSON('/api/settings');
    if (s.closerName) applyCloserName(s.closerName);
  } catch (e) { /* keep the default */ }
}

// the Email notifications part of the dialog: connection state, connect / disconnect, on/off, ignore list
async function refreshMailSettings() {
  let m;
  try { m = await csJSON('/api/mail'); } catch (e) { return null; }
  mailOnBox.checked = m.enabled;
  if (document.activeElement !== mailIgnoreInput && !mailIgnoreInput.dataset.edited) mailIgnoreInput.value = (m.ignore || []).join(', ');
  mailConnectBtn.style.display = m.connected ? 'none' : '';
  mailConnectBtn.disabled = !!m.connecting;
  mailConnectBtn.textContent = m.connecting ? 'Waiting for you in the browser…' : 'Connect Gmail';
  mailDisconnectBtn.style.display = m.connected ? '' : 'none';
  if (m.error && /Gmail API isn't switched on/.test(m.error)) {
    mailStatusLine.innerHTML = `${escapeHtml(m.error)} <a href="${m.enableUrl}" target="_blank" rel="noopener">Switch it on</a>, then press Connect Gmail again.`;
  } else if (m.error) {
    mailStatusLine.textContent = '⚠️ ' + m.error;
  } else if (m.connecting) {
    mailStatusLine.textContent = 'A Google page opened in your browser. Choose the Gmail account and press Allow (read-only).';
  } else if (m.connected) {
    mailStatusLine.textContent = `✅ Connected${m.email ? ' as ' + m.email : ''}. New emails pop up here, checked every minute.`;
  } else {
    mailStatusLine.textContent = 'Not connected. Connect Gmail to get a pop-up for every new email.';
  }
  return m;
}
function watchMailConnection() {
  clearInterval(mailConnectTimer);
  mailConnectTimer = setInterval(async () => {
    const m = await refreshMailSettings();
    if (!m || !m.connecting) { clearInterval(mailConnectTimer); pollMail(false); }
  }, 2000);
}
mailConnectBtn.onclick = async () => { await fetch('/api/mail-connect', { method: 'POST' }); await refreshMailSettings(); watchMailConnection(); };
mailDisconnectBtn.onclick = async () => {
  if (!confirm('Disconnect Gmail? New emails will stop popping up (you can connect again any time).')) return;
  await fetch('/api/mail-disconnect', { method: 'POST' });
  await refreshMailSettings();
  pollMail(false);
};
mailIgnoreInput.addEventListener('input', () => { mailIgnoreInput.dataset.edited = '1'; });

const settingsLoomMode = document.getElementById('set-loom-mode');
const settingsVoiceAuto = document.getElementById('set-voice-auto'), settingsVoiceToast = document.getElementById('set-voice-toast');
async function loadLoomMode() {   // (also the Voice command switches: same settings file)
  try {
    const s = await csJSON('/api/settings');
    settingsLoomMode.value = s.loomMode || 'audio';
    settingsVoiceAuto.checked = s.voiceAutoSend !== false;
    settingsVoiceToast.value = s.voiceToastSeconds ?? 5;
  } catch (e) { /* keep what is shown */ }
}

function openSettings() {
  loadLoomMode();
  delete mailIgnoreInput.dataset.edited;
  refreshMailSettings();
  settingsCloserInput.value = closerName;
  settingsStatus.textContent = '';
  settingsOverlay.style.display = 'flex';
  settingsCloserInput.focus();
  settingsCloserInput.select();
}
function closeSettings() { settingsOverlay.style.display = 'none'; }

async function saveSettings() {
  const name = settingsCloserInput.value.trim();
  if (!name) { settingsStatus.textContent = 'Type the name to use for [closer].'; return; }
  try {
    const res = await fetch('/api/settings?closerName=' + encodeURIComponent(name) + '&mailEnabled=' + mailOnBox.checked +
      '&mailIgnore=' + encodeURIComponent(mailIgnoreInput.value) + '&loomMode=' + settingsLoomMode.value +
      '&voiceAutoSend=' + settingsVoiceAuto.checked + '&voiceToastSeconds=' + encodeURIComponent(settingsVoiceToast.value === '' ? 5 : settingsVoiceToast.value), { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'could not save');
    applyCloserName(data.closerName);
    closeSettings();
    pollMail(false);
  } catch (e) {
    settingsStatus.textContent = String(e.message || e);
  }
}

document.getElementById('settings-btn').onclick = openSettings;
document.getElementById('set-cancel').onclick = closeSettings;
document.getElementById('set-save').onclick = saveSettings;
settingsOverlay.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closeSettings(); }
  else if (e.key === 'Enter') { e.preventDefault(); saveSettings(); }
});
loadAppSettings();
