// roadmap.js -- Personal -> 🗺 Roadmap: what you want done by 7 days ... 1 year, for General and each life area (one row of tabs).
// "▦ Boxes" is the text boxes; "🧩 Diagram" (roadmap-diagram.js) is the same plan as an editable draw.io-style map.
// Saved as the "roadmap" record: {plans: {7: text...} (General), sections: {fitness: {...}, ...}, diagram: {...}}.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.
const RM_DAYS = [7, 14, 30, 60, 90, 180, 365];
const RM_SECTIONS = [
  ['fitness', '🏃 Fitness'],
  ['relationships', '❤️ Relationships'],
  ['travel', '✈️ Travel'],
  ['career', '💼 Career'],
  ['other', '✨ Other'],
];
const rmStore = recStore('roadmap', 'rm-status', { mode: 'general', plans: {}, sections: {} });
const rmRoot = document.getElementById('rm-root');
const rmOpenLink = document.getElementById('rm-open-link');
const RM_OPEN_URL_KEY = 'roadmapOpenUrl';
const RM_DEFAULT_OPEN_URL = 'https://app.diagrams.net/';
let rmActiveSection = (csStore('rmTab') || 'general');   // 'general' or a life area
let rmView = (() => { try { const v = localStorage.getItem('rmView'); return ['diagram', 'timeline', 'agenda'].includes(v) ? v : 'boxes'; } catch (e) { return 'boxes'; } })();
const rmRemember = (k, v) => { csStore(k, v); };
let rmLinkEditor = null;

function rmLoadOpenUrl() {
  try { return localStorage.getItem(RM_OPEN_URL_KEY) || RM_DEFAULT_OPEN_URL; }
  catch (e) { return RM_DEFAULT_OPEN_URL; }
}

function rmInitOpenLink() {
  if (!rmOpenLink) return;
  rmOpenLink.href = rmLoadOpenUrl();
  rmOpenLink.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    rmShowLinkEditor(event.clientX, event.clientY);
  });
}

function rmCloseLinkEditor() {
  if (!rmLinkEditor) return;
  rmLinkEditor.remove();
  rmLinkEditor = null;
}

function rmShowLinkEditor(x, y) {
  rmCloseLinkEditor();
  const editor = document.createElement('form');
  editor.className = 'rm-link-editor';
  editor.innerHTML = '<label for="rm-link-url">Open link</label><input id="rm-link-url" type="url" required><span class="rm-link-error" aria-live="polite"></span><div><button type="button" class="ctl rm-link-cancel">Cancel</button><button type="submit" class="ctl primary">Save</button></div>';
  const input = editor.querySelector('input');
  const error = editor.querySelector('.rm-link-error');
  input.value = rmOpenLink.href;
  editor.querySelector('.rm-link-cancel').onclick = rmCloseLinkEditor;
  editor.onsubmit = (event) => {
    event.preventDefault();
    const url = input.value.trim();
    if (!/^https?:\/\//i.test(url)) {
      error.textContent = 'Use a full http:// or https:// link.';
      input.focus();
      return;
    }
    rmOpenLink.href = url;
    csStore(RM_OPEN_URL_KEY, url);
    rmCloseLinkEditor();
    if (typeof ctxToast === 'function') ctxToast('Roadmap link updated.');
  };
  rmLinkEditor = editor;
  document.body.appendChild(editor);
  const bounds = editor.getBoundingClientRect();
  editor.style.left = `${Math.max(12, Math.min(x, window.innerWidth - bounds.width - 12))}px`;
  editor.style.top = `${Math.max(12, Math.min(y, window.innerHeight - bounds.height - 12))}px`;
  input.focus();
  input.select();
}

document.addEventListener('pointerdown', (event) => {
  if (rmLinkEditor && !rmLinkEditor.contains(event.target)) rmCloseLinkEditor();
}, true);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') rmCloseLinkEditor();
});

async function rmOpen() {
  await rmStore.load();
  rmStore.doc.plans ||= {};
  rmStore.doc.sections ||= {};
  RM_SECTIONS.forEach(([key]) => { rmStore.doc.sections[key] ||= {}; });
  // a tab written in before start dates existed (Oct 19 2026) starts the day it's first opened since: the day it was written
  const starts = (rmStore.doc.starts ||= {});
  let added = false;
  ['general', ...RM_SECTIONS.map(([k]) => k)].forEach(k => { if (!starts[k] && Object.values(rmPlansFor(k)).some(v => String(v || '').trim())) { starts[k] = rmToday(); added = true; } });
  if (added) rmStore.save();
  rmRender();
}

// ---- each tab has a starting date (doc.starts[key], YYYY-MM-DD); every horizon box shows the date it's due
const rmIso = csIso, rmToday = csToday;   // (shared.js)
function rmStartFor(key) { return (rmStore.doc.starts ||= {})[key] || rmToday(); }
function rmDue(key, day) { const d = new Date(rmStartFor(key) + 'T12:00:00'); d.setDate(d.getDate() + Number(day)); return d; }
function rmDueLabel(key, day) {   // "Mon 26 Oct" (with the year when it isn't this year)
  const d = rmDue(key, day), opts = { weekday: 'short', day: 'numeric', month: 'short' };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString(undefined, opts);
}
function rmDaysLeft(key, day) { return Math.round((rmDue(key, day) - new Date(rmToday() + 'T12:00:00')) / 86400000); }

// the plans of one tab: 'general' or a life area key
function rmPlansFor(key) { return key === 'general' ? rmStore.doc.plans : (rmStore.doc.sections[key] ||= {}); }
function rmCurrentPlans() { return rmPlansFor(rmActiveSection); }

function rmRender() {
  if (rmActiveSection !== 'general' && !RM_SECTIONS.some(([k]) => k === rmActiveSection)) rmActiveSection = 'general';
  const tabs = [['general', '🧭 General'], ...RM_SECTIONS];
  const viewSwitch = `<div class="rm-mode rm-view-switch" aria-label="Roadmap view">${[['boxes', '▦ Boxes'], ['timeline', '📈 Timeline'], ['agenda', '🗒 Agenda'], ['diagram', '🧩 Diagram']].map(([k, l]) => `<button type="button" data-rm-view="${k}" class="${rmView === k ? 'active' : ''}">${l}</button>`).join('')}</div>`;
  const sectionTabs = rmView === 'boxes' ? `<div class="rm-section-tabs" role="tablist" aria-label="Roadmap section">${tabs.map(([key, label]) => `<button type="button" class="${key === rmActiveSection ? 'active' : ''}" data-rm-section="${key}">${label}</button>`).join('')}</div>` : '';
  const plans = rmCurrentPlans();
  const body = rmView === 'diagram' ? '<div id="rd-host"></div>' : rmView === 'timeline' || rmView === 'agenda' ? '<div id="rv-host" class="rv-host"></div>' :
    `<div class="rm-start"><label>${(rmStore.doc.starts || {})[rmActiveSection] ? 'Started' : 'Starts'} <input type="date" id="rm-start" value="${rmStartFor(rmActiveSection)}"></label>
      <button type="button" class="ctl" id="rm-start-today" title="Start this roadmap today">Today</button>
      <span class="rm-start-note">${(rmStore.doc.starts || {})[rmActiveSection] ? '' : 'Starts the day you write the first thing. '}📍 Today is <b>${new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</b> · 1 year ends <b>${rmDueLabel(rmActiveSection, 365)}</b></span></div>
    <div class="rm-line">${RM_DAYS.map(day => { const left = rmDaysLeft(rmActiveSection, day);
      return `<section class="${left < 0 ? 'rm-passed' : ''}"><span>${day}</span><h3>${day === 365 ? '1 year' : day + ' days'}</h3>
      <div class="rm-due">by <b>${rmDueLabel(rmActiveSection, day)}</b> · ${left > 0 ? left + ' day' + (left === 1 ? '' : 's') + ' left' : left === 0 ? 'today' : 'passed'}</div><textarea data-day="${day}" placeholder="What will be achieved by then?">${recEsc(plans[day] || '')}</textarea></section>`; }).join('')}</div>`;
  rmRoot.innerHTML = `<div class="rm-toolbar rm-toolbar-row">${sectionTabs}${viewSwitch}</div>${body}`;

  rmRoot.querySelectorAll('[data-rm-view]').forEach(button => button.onclick = () => {
    rmView = button.dataset.rmView; rmRemember('rmView', rmView);
    rmRender();
  });
  rmRoot.querySelectorAll('[data-rm-section]').forEach(button => button.onclick = () => {
    rmActiveSection = button.dataset.rmSection; rmRemember('rmTab', rmActiveSection);
    rmRender();
  });
  if (rmView === 'diagram' && typeof rdShow === 'function') rdShow(document.getElementById('rd-host'));
  if (rmView === 'timeline' && typeof rvTimeline === 'function') rvTimeline(document.getElementById('rv-host'));
  if (rmView === 'agenda' && typeof rvAgenda === 'function') rvAgenda(document.getElementById('rv-host'));
  const setStart = (v) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return; (rmStore.doc.starts ||= {})[rmActiveSection] = v; rmStore.save(); rmRender(); };
  const startBox = rmRoot.querySelector('#rm-start');
  if (startBox) { startBox.onchange = () => setStart(startBox.value); rmRoot.querySelector('#rm-start-today').onclick = () => setStart(rmToday()); }
  rmRoot.querySelectorAll('textarea').forEach(textarea => textarea.oninput = () => {
    rmCurrentPlans()[textarea.dataset.day] = textarea.value;
    (rmStore.doc.starts ||= {})[rmActiveSection] ||= rmToday();   // the first thing written fixes the start date
    rmStore.save();
  });
}
rmInitOpenLink();
rmOpen();
