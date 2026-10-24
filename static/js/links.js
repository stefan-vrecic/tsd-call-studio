// links.js -- the link row under the call title (direct / transcript / file path / recording / CRM / notes).
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

function renderDirectLink(name) {
  const el = document.getElementById('link-direct');
  const url = `${location.origin}/${encodeURIComponent(name)}`;
  el.innerHTML = `<a href="${url}">Direct link</a> <span class="edit" id="copy-direct-link">copy</span>`;
  el.querySelector('#copy-direct-link').onclick = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(url);
      e.target.textContent = 'copied!';
      setTimeout(() => { e.target.textContent = 'copy'; }, 1500);
    } catch {
      window.prompt('Copy this link:', url);
    }
  };
}

function renderCopyTranscriptLink(name, hasTranscript) {
  const el = document.getElementById('link-copy-transcript');
  if (!hasTranscript) { el.innerHTML = ''; return; }
  const url = `${location.origin}/${encodeURIComponent(name)}?copy=transcript`;
  el.innerHTML = `<a href="${url}">Copy-transcript link</a> <span class="edit" id="copy-transcript-link">copy</span>`;
  el.querySelector('#copy-transcript-link').onclick = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(url);
      e.target.textContent = 'copied!';
      setTimeout(() => { e.target.textContent = 'copy'; }, 1500);
    } catch {
      window.prompt('Copy this link:', url);
    }
  };
}

function renderCopyPathLink(audioPath) {
  const el = document.getElementById('link-copy-path');
  if (!audioPath) { el.innerHTML = ''; return; }
  el.innerHTML = `<span class="edit" id="copy-audio-path">Copy file path</span>`;
  el.querySelector('#copy-audio-path').onclick = async (e) => {
    try {
      await navigator.clipboard.writeText(audioPath);
      e.target.textContent = 'copied!';
      setTimeout(() => { e.target.textContent = 'Copy file path'; }, 1500);
    } catch {
      window.prompt('Copy this file path:', audioPath);
    }
  };
}

function renderExtLink(elId, label, kind, personName, url) {
  const el = document.getElementById(elId);
  if (url) {
    el.innerHTML = `<a href="${url}" target="_blank" rel="noopener">${label}</a> <span class="edit">edit</span>`;
    el.querySelector('.edit').onclick = () => setExtLink(elId, label, kind, personName, url);
  } else {
    el.innerHTML = `<span class="edit">+ ${label}</span>`;
    el.querySelector('.edit').onclick = () => setExtLink(elId, label, kind, personName, '');
  }
}
async function setExtLink(elId, label, kind, personName, current) {
  const url = window.prompt(`${label} for ${displayName(personName)}:`, current || '');
  if (url === null) return; // cancelled
  await fetch(`/api/set-link?person=${encodeURIComponent(personName)}&type=${kind}&url=${encodeURIComponent(url)}`, { method: 'POST' });
  if (current !== undefined) {
    const p = people.find(x => x.name === personName);
    if (p) p[kind + 'Link'] = url;
  }
  renderExtLink(elId, label, kind, personName, url);
}
