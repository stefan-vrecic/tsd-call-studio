// external-links.js -- editable sidebar / quick-jump links, stored in this browser.
// Loaded before live-call.js so its delegated external-link click handler also covers custom links.
(() => {
  const KEY = 'externalLinksV1';
  const DEFAULTS = [
    { key: 'sightreading', icon: '🎼', label: 'SightReading', url: 'https://sightreadingfactory.com/' },
    { key: 'stripe', icon: '💳', label: 'Stripe', url: 'https://dashboard.stripe.com/' },
    { key: 'calendar', icon: '📅', label: 'Calendar', url: 'https://calendar.google.com/' },
    { key: 'chanty', icon: '💬', label: 'Chanty', url: 'https://www.chanty.com/' },
  ];
  const esc = (value) => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const valid = (item) => item && /^[a-z0-9-]+$/.test(String(item.key || '')) && String(item.label || '').trim() && /^https?:\/\//i.test(String(item.url || '').trim());
  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === null) return DEFAULTS.map(item => ({ ...item }));
      const saved = JSON.parse(raw);
      return Array.isArray(saved) ? saved.filter(valid).map(item => ({ key: String(item.key), icon: String(item.icon || '🔗').slice(0, 12), label: String(item.label).trim().slice(0, 80), url: String(item.url).trim().slice(0, 2000) })) : DEFAULTS.map(item => ({ ...item }));
    } catch (e) { return DEFAULTS.map(item => ({ ...item })); }
  }
  function syncLegacy(items) {
    const bar = document.getElementById('app-tabs'); if (!bar) return;
    bar.querySelectorAll('.app-site').forEach(button => button.remove());
    const before = document.getElementById('tab-today');
    items.forEach(item => {
      const button = document.createElement('button');
      button.className = 'app-tab app-menu app-site'; button.id = 'tab-' + item.key;
      button.dataset.url = item.url; button.title = `Open ${item.label} in a new tab`;
      button.textContent = `${item.icon || '🔗'} ${item.label} ↗`;
      bar.insertBefore(button, before);
    });
  }
  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    syncLegacy(items);
    window.dispatchEvent(new CustomEvent('app:external-links-changed', { detail: items }));
    window.dispatchEvent(new CustomEvent('app:preferences-changed'));
  }
  window.callStudioExternalLinks = { read, save };
  syncLegacy(read());
  // On an existing installation, restore its private link destinations from the ignored local record.
  // Never overwrite links the person has already edited in this browser.
  fetch('/api/records?name=company-links').then(r => r.ok ? r.json() : null).then(doc => {
    if (localStorage.getItem(KEY) !== null || !Array.isArray(doc?.externalLinks)) return;
    const items = doc.externalLinks.filter(valid);
    if (items.length) save(items);
  }).catch(() => {});

  const root = document.getElementById('st-external-links'), add = document.getElementById('st-external-add'), status = document.getElementById('st-external-status');
  if (!root || !add) return;
  const newKey = () => 'custom-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  // hidden from the sidebar (right-click a link there -> Hide): the same "tabHidden" list the tabs use; the eye here brings it back
  const hiddenMap = () => { try { return JSON.parse(localStorage.getItem('tabHidden') || '{}') || {}; } catch (e) { return {}; } };
  function setHidden(key, hidden) {
    const m = hiddenMap(); if (hidden) m[key] = true; else delete m[key];
    localStorage.setItem('tabHidden', JSON.stringify(m));
    window.dispatchEvent(new CustomEvent('app:tab-visibility', { detail: { key, hidden } }));   // settings-tab.js keeps its copy in step
    window.dispatchEvent(new CustomEvent('app:preferences-changed'));
  }
  function row(item) {
    const hid = !!hiddenMap()[item.key];
    return `<div class="st-external-row${hid ? ' st-external-hidden' : ''}" data-key="${esc(item.key)}"><button class="ctl st-external-eye" type="button" title="${hid ? 'Hidden from the sidebar: click to show it' : 'Showing in the sidebar: click to hide it'}">${hid ? '🙈' : '👁'}</button><input class="st-external-icon" value="${esc(item.icon || '🔗')}" maxlength="12" aria-label="Link icon"><input class="st-external-label" value="${esc(item.label)}" placeholder="Name" aria-label="Link name"><input class="st-external-url" value="${esc(item.url)}" placeholder="https://…" aria-label="Link URL"><button class="ctl st-external-save" type="button">Save</button><button class="ctl st-external-remove" type="button">Remove</button><span class="st-external-error"></span></div>`;
  }
  function render(items = read()) {
    root.innerHTML = `<div class="st-external-list">${items.map(row).join('')}</div>`;
    wire();
  }
  function collect() {
    const items = [], rows = [...root.querySelectorAll('.st-external-row')]; let okay = true;
    rows.forEach(el => {
      const label = el.querySelector('.st-external-label').value.trim(), url = el.querySelector('.st-external-url').value.trim(), error = el.querySelector('.st-external-error');
      error.textContent = '';
      if (!label) { error.textContent = 'Add a name.'; okay = false; }
      else if (!/^https?:\/\//i.test(url)) { error.textContent = 'Use a full http:// or https:// URL.'; okay = false; }
      items.push({ key: el.dataset.key, icon: el.querySelector('.st-external-icon').value.trim() || '🔗', label, url });
    });
    return okay ? items : null;
  }
  function wire() {
    root.querySelectorAll('.st-external-eye').forEach(button => button.onclick = () => {
      const key = button.closest('.st-external-row').dataset.key;
      setHidden(key, !hiddenMap()[key]); render();
    });
    root.querySelectorAll('.st-external-save').forEach(button => button.onclick = () => {
      const items = collect(); if (!items) return;
      save(items); status.textContent = 'Saved'; setTimeout(() => { status.textContent = ''; }, 1200);
    });
    root.querySelectorAll('.st-external-remove').forEach(button => button.onclick = () => {
      const el = button.closest('.st-external-row'), label = el.querySelector('.st-external-label').value.trim() || 'this link';
      if (!confirm(`Remove ${label}?`)) return;
      el.remove(); const items = collect(); if (items) { save(items); status.textContent = 'Removed'; }
    });
  }
  add.onclick = () => {
    const list = root.querySelector('.st-external-list');
    list.insertAdjacentHTML('beforeend', row({ key: newKey(), icon: '🔗', label: '', url: '' }));
    wire(); list.lastElementChild.querySelector('.st-external-label').focus();
  };
  render();
  window.addEventListener('app:tab-visibility', () => render());   // hidden from the sidebar's right-click menu: the eye follows
})();
