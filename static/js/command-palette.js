// command-palette.js -- tap ⌘ twice (quickly, on its own) anywhere in Call Studio: a little search box opens; type part of a page's name
// ("jou", "tra", "work") and it jumps there as soon as you stop typing (0.6 s), or press Enter for the highlighted one now. ↑ ↓ pick
// another, Esc closes. Pages = every tab in the tab bar (with the names you've given them in Settings), plus Swipe Gallery and the
// Tracker's sections (Workouts, Sheet, Charts ...) and Learning's Books / Videos sections. Links like Stripe open in a new tab, as their buttons do.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.
(() => {
  const CP_DELAY_KEY = 'quickJumpDelay';
  const cpDelaySeconds = () => {
    const n = Number.parseFloat(localStorage.getItem(CP_DELAY_KEY));
    return Number.isFinite(n) ? Math.max(0.1, Math.min(5, n)) : 0.6;
  };
  const delayInput = document.getElementById('st-quick-jump-delay');
  if (delayInput) {
    delayInput.value = cpDelaySeconds();
    delayInput.addEventListener('change', () => {
      const n = Number.parseFloat(delayInput.value);
      const value = Number.isFinite(n) ? Math.max(0.1, Math.min(5, n)) : 0.6;
      delayInput.value = value; localStorage.setItem(CP_DELAY_KEY, value);
    });
  }
  // Settings -> Quick jump: your own extra names for pages (localStorage "quickJumpAliases" = {pageKey: "diary, notes"}) and which kinds of
  // results to include ("quickJumpInclude" = {sections, metrics, dates}: false = left out)
  const cpRead = (k) => csStoreJSON(k, {});
  let cpAliases = cpRead('quickJumpAliases'), cpInclude = cpRead('quickJumpInclude');
  const cpOn = (kind) => cpInclude[kind] !== false;
  const cpAliasList = (key) => String(cpAliases[key] || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const strip = (t) => String(t || '').replace(/↗/g, '').replace(/^[^\p{L}\p{N}]+/u, '').trim();   // "📓 Journal / Planner" -> "Journal / Planner"
  const TRACKER = [['quick', 'Tracker · Questions'], ['log', 'Tracker · Log'], ['history', 'Tracker · History of actions'], ['dash', 'Tracker · Dashboard'], ['sheet', 'Tracker · Sheet'], ['charts', 'Tracker · Charts'], ['workouts', 'Tracker · Workouts'], ['manage', 'Tracker · Manage']];
  const LEARNING = [['books', 'Learning · Books', 'learning-books-drop', '📖'], ['videos', 'Learning · Videos', 'learning-videos', '🎬']];
  const cpOpenRoute = (key, fallback) => {
    const modern = document.querySelector(`.modern-sidebar [data-route="${CSS.escape(key)}"]`);
    if (modern) modern.click();
    else if (fallback) fallback.click();
    else location.hash = '#' + key;
    // then make the tab you landed on obvious in the sidebar: scroll it into view there and pulse it
    setTimeout(() => {
      const tab = document.querySelector(`.modern-sidebar [data-route="${CSS.escape(key)}"]`); if (!tab) return;
      tab.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      tab.classList.remove('nav-jump'); void tab.offsetWidth; tab.classList.add('nav-jump');
      setTimeout(() => tab.classList.remove('nav-jump'), 1700);
    }, 120);
  };
  window.callStudioOpenRoute = cpOpenRoute;   // (Settings: right-click a tab -> Jump)
  // every tracker (Approaches, Calories, Steps ...) as its own entry: opens it in the Tracker and highlights it (tracker-tab.js 'callstudio:tracker-focus')
  let cpMetrics = [], cpHistoryDates = [];
  const CP_MONTHS = [
    ['jan', 'january'], ['feb', 'february'], ['mar', 'march'], ['apr', 'april'], ['may'], ['jun', 'june'],
    ['jul', 'july'], ['aug', 'august'], ['sep', 'sept', 'september'], ['oct', 'october'], ['nov', 'november'], ['dec', 'december']
  ];
  const cpDatePage = (date) => {
    const d = new Date(date + 'T12:00:00'), day = d.getDate(), months = CP_MONTHS[d.getMonth()] || [];
    return {
      key: 'tracker-history-' + date, label: `${day} ${months[0] || ''}`.trim(), sub: 'Tracker · History', icon: '🕘',
      aliases: months.flatMap(month => [`${day} ${month}`, `${month} ${day}`]),
      go: () => {
        cpOpenRoute('tracker', document.getElementById('tab-tracker'));
        setTimeout(() => window.dispatchEvent(new CustomEvent('callstudio:tracker-history-date', { detail: date })), 80);
      }
    };
  };
  const cpParseDateQuery = (text) => {
    const q = String(text || '').toLowerCase().trim().replace(/[,./-]+/g, ' '), words = q.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 3) return null;
    let day = Number(words.find(w => /^\d{1,2}$/.test(w))), month = -1;
    for (let i = 0; i < CP_MONTHS.length; i++) if (words.some(w => CP_MONTHS[i].includes(w))) { month = i; break; }
    if (!day || day > 31 || month < 0) return null;
    const yearWord = words.find(w => /^\d{4}$/.test(w)), year = yearWord ? Number(yearWord) : new Date().getFullYear();
    const d = new Date(year, month, day, 12);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
  };
  const cpNearestHistoryDate = (wanted) => cpHistoryDates.reduce((best, date) => {
    const distance = Math.abs(new Date(date + 'T12:00:00') - new Date(wanted + 'T12:00:00'));
    return !best || distance < best.distance || (distance === best.distance && date > best.date) ? { date, distance } : best;
  }, null)?.date || wanted;
  const cpRequestedDatePage = (wanted) => {
    const actual = cpNearestHistoryDate(wanted), request = cpDatePage(wanted), destination = cpDatePage(actual);
    return { ...request, label: actual === wanted ? request.label : `${request.label} → nearest ${destination.label}`, go: () => {
      cpOpenRoute('tracker', document.getElementById('tab-tracker'));
      setTimeout(() => window.dispatchEvent(new CustomEvent('callstudio:tracker-history-date', { detail: wanted })), 80);
    } };
  };
  const cpLoadMetrics = () => csJSON('/api/tracker').then(d => {
    cpMetrics = (d.metrics || []).filter(m => !m.archived);   // (private ones are left out at search time while Demo mode is on)
    const exampleDates = typeof TK_HISTORY_EXAMPLES !== 'undefined' ? TK_HISTORY_EXAMPLES.map(row => row[0]) : [];
    cpHistoryDates = [...new Set([...(d.entries || []).map(e => e.date), ...exampleDates].filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)))].sort().reverse();
  }).catch(() => {});
  cpLoadMetrics();
  function pages() {
    let names = {};
    names = csStoreJSON('tabNames', {});
    // Deliberately include hidden navigation buttons. Quick jump is also the escape hatch for opening a page
    // that the user removed from the visible tab/sidebar layout in Settings.
    const out = [...document.querySelectorAll('#app-tabs [id^="tab-"]')].map(b => {
      const key = b.id.slice(4), ownLabel = strip(names[b.id] || names[key] || b.textContent), outside = !!b.dataset.url;
      return { key, label: outside ? `Links · ${ownLabel}` : ownLabel, aliases: outside ? [ownLabel] : [], icon: (b.textContent.trim().match(/^[^\p{L}\p{N}\s]+/u) || [''])[0], go: () => cpOpenRoute(key, b), outside };
    }).filter(p => p.label);
    out.forEach(p => { const t = csTab(p.key); if (t) p.aliases = [...(p.aliases || []), t.label.toLowerCase(), ...(t.say || [])]; });   // the sidebar name + voice words find it too (tab-registry.js)
    if (cpOn('sections')) TRACKER.forEach(([view, label]) => out.push({ key: 'tracker-' + view, label, icon: '📈', go: () => {
      cpOpenRoute('tracker', document.getElementById('tab-tracker'));
      setTimeout(() => window.dispatchEvent(new CustomEvent('callstudio:tracker-view', { detail: view })), 60);
    } }));
    if (cpOn('sections')) LEARNING.forEach(([section, label, id, icon]) => out.push({ key: 'learning-' + section, label, icon, go: () => {
      cpOpenRoute('learning', document.getElementById('tab-learning'));
      setTimeout(() => {
        const target = document.getElementById(id); if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.remove('lrn-jump-flash'); void target.offsetWidth; target.classList.add('lrn-jump-flash');
        setTimeout(() => target.classList.remove('lrn-jump-flash'), 1800);
      }, 80);
    } }));
    if (cpOn('metrics')) cpMetrics.filter(m => !(typeof demoMode !== 'undefined' && demoMode && m.private)).forEach(m => out.push({ key: 'metric-' + m.id, label: m.name, sub: 'Tracker', icon: m.emoji || '📈', aliases: m.aliases || [], go: () => {
      const onTracker = document.getElementById('tracker-view')?.style.display !== 'none';
      if (!onTracker) cpOpenRoute('tracker', document.getElementById('tab-tracker'));
      setTimeout(() => window.dispatchEvent(new CustomEvent('callstudio:tracker-focus', { detail: m.id })), onTracker ? 0 : 250);
    } }));
    if (cpOn('dates')) cpHistoryDates.forEach(date => out.push(cpDatePage(date)));
    // Settings -> External links, with a new blank link ready to fill in (external-links.js)
    out.push({ key: 'action-addlink', label: 'Add link', sub: 'Settings · external links', icon: '🔗', aliases: ['add link', 'addlink', 'new link', 'external link', 'add external link'], go: () => {
      cpOpenRoute('settings', document.getElementById('tab-settings'));
      setTimeout(() => {
        const box = document.getElementById('st-external-links');
        box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('st-external-add')?.click();   // adds a blank row and puts the cursor in its name
      }, 150);
    } });
    // a switch, not a page: Demo mode on / off (core.js). Only acts when tapped or Enter -- never by itself when typing stops.
    if (typeof demoCheckbox !== 'undefined') {
      const on = !!demoCheckbox.checked;
      out.push({ key: 'action-demo', label: on ? 'Demo mode: turn OFF' : 'Demo mode: turn ON', sub: on ? 'on now' : 'off now', icon: '🎭', noAuto: true,
        aliases: ['demo', 'demo mode', 'toggle demo', on ? 'demo off' : 'demo on'], go: () => {
          demoCheckbox.checked = !on; demoCheckbox.dispatchEvent(new Event('change'));
          if (typeof csToast === 'function') csToast(on ? 'Demo mode off: real names are back' : '🎭 Demo mode on: names are hidden');
        } });
    }
    out.forEach(p => { const mine = cpAliasList(p.key); if (mine.length) { p.mine = mine; p.aliases = [...(p.aliases || []), ...mine]; } });
    return out;
  }
  // best first: starts with what you typed > a word starts with it > contains it > its letters in order
  function rank(list, q) {
    q = q.toLowerCase().trim();
    if (!q) return list.slice(0, 12);
    if (q === 'link' || q === 'links') return list.filter(p => p.label === 'Links' || p.label.startsWith('Links · '));
    const score = (p) => {
      const l = p.label.toLowerCase(), k = p.key.toLowerCase();
      if ((p.mine || []).includes(q)) return 6;                                                  // one of your own names, typed exactly
      if ((p.mine || []).some(a => a.startsWith(q))) return 5;
      if (l.startsWith(q) || k.startsWith(q) || (p.aliases || []).some(a => String(a).toLowerCase().startsWith(q))) return 4;
      if (l.split(/[\s/·-]+/).some(w => w.startsWith(q))) return 3;
      if (l.includes(q) || (p.mine || []).some(a => a.includes(q))) return 2;
      let i = 0; for (const ch of l) if (ch === q[i]) i++;
      return i === q.length ? 1 : 0;
    };
    return list.map(p => ({ p, s: score(p) })).filter(x => x.s).sort((a, b) => b.s - a.s || a.p.label.length - b.p.label.length).map(x => x.p).slice(0, 12);
  }

  let box = null, sel = 0, hits = [], timer = null;
  const cpMatched = (p) => { const q = box?.querySelector('.cp-input')?.value.toLowerCase().trim(); const a = q && !p.label.toLowerCase().includes(q) && (p.mine || []).find(x => x.includes(q)); return a ? ` <small>“${a.replace(/</g, '&lt;')}”</small>` : ''; };
  function close() { box?.remove(); box = null; clearTimeout(timer); }
  function go(p) { close(); if (p) p.go(); }
  function draw() {
    const list = box.querySelector('.cp-list');
    list.innerHTML = hits.length ? hits.map((p, i) => `<div class="cp-item${i === sel ? ' on' : ''}" data-i="${i}"><span class="cp-ico">${p.icon || '•'}</span>${p.label.replace(/</g, '&lt;')}${p.sub ? ` <small>${p.sub}</small>` : ''}${cpMatched(p)}${p.outside ? ' <small>↗ opens a new tab</small>' : ''}</div>`).join('')
      : '<div class="cp-none">No page matches.</div>';
    list.querySelectorAll('.cp-item').forEach(el => { el.onmousedown = (e) => { e.preventDefault(); go(hits[+el.dataset.i]); }; });
  }
  function open() {
    if (box) { close(); return; }
    cpLoadMetrics();   // (new trackers show up next time)
    const all = pages();
    box = document.createElement('div'); box.id = 'cp-box';
    box.innerHTML = `<div class="cp-card"><input class="cp-input" placeholder="Go to…  (type part of a page's name)" autocomplete="off" spellcheck="false"><div class="cp-list"></div>
      <div class="cp-hint">Stop typing to go · Enter = now · ↑ ↓ pick · Esc close</div></div>`;
    document.body.appendChild(box);
    const input = box.querySelector('.cp-input');
    hits = rank(all, ''); sel = 0; draw();
    input.addEventListener('input', () => {
      const requestedDate = cpParseDateQuery(input.value);
      const choices = requestedDate ? [cpRequestedDatePage(requestedDate), ...all.filter(p => !p.key.startsWith('tracker-history-'))] : all;
      hits = rank(choices, input.value); sel = 0; draw();
      clearTimeout(timer);
      if (input.value.trim().length >= 2 && hits.length && !hits[sel].noAuto) timer = setTimeout(() => go(hits[sel]), cpDelaySeconds() * 1000);   // stopped typing: go to the best match (not for a switch)
    });
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Enter') { e.preventDefault(); go(hits[sel]); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); clearTimeout(timer); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % Math.max(1, hits.length); draw(); }
    });
    box.addEventListener('mousedown', (e) => { if (e.target === box) close(); });
    input.focus();
  }

  // ---- the Settings editor (Settings -> Navigation -> Quick jump)
  document.querySelectorAll('[data-qj-include]').forEach(cb => {
    cb.checked = cpOn(cb.dataset.qjInclude);
    cb.onchange = () => { cpInclude[cb.dataset.qjInclude] = cb.checked; localStorage.setItem('quickJumpInclude', JSON.stringify(cpInclude)); };
  });
  const names = document.getElementById('st-qj-names');
  function cpNamesBuild() {
    if (!names) return;
    const rows = names.querySelector('.st-qj-rows'), f = names.querySelector('.st-qj-filter').value.toLowerCase().trim();
    const saveInclude = cpInclude; cpInclude = {};                     // list every page here, even kinds you've switched off for searching
    const list = pages().filter(p => !p.key.startsWith('metric-') && !p.key.startsWith('tracker-history-')); cpInclude = saveInclude;
    names.querySelector('summary small').textContent = Object.values(cpAliases).filter(Boolean).length ? `(${Object.values(cpAliases).filter(Boolean).length} set)` : '';
    rows.innerHTML = '';
    list.filter(p => !f || p.label.toLowerCase().includes(f) || String(cpAliases[p.key] || '').toLowerCase().includes(f)).forEach(p => {
      const row = document.createElement('label'); row.className = 'st-qj-row' + (cpAliases[p.key] ? ' set' : '');
      row.innerHTML = `<span>${p.icon || '•'} ${p.label.replace(/</g, '&lt;')}</span><input type="text" spellcheck="false" placeholder="other names, comma separated">`;
      const inp = row.querySelector('input'); inp.value = cpAliases[p.key] || '';
      inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); });
      inp.addEventListener('change', () => {
        const v = inp.value.split(',').map(s => s.trim()).filter(Boolean).join(', ');
        if (v) cpAliases[p.key] = v; else delete cpAliases[p.key];
        inp.value = v; row.classList.toggle('set', !!v); localStorage.setItem('quickJumpAliases', JSON.stringify(cpAliases));
        names.querySelector('summary small').textContent = Object.keys(cpAliases).length ? `(${Object.keys(cpAliases).length} set)` : '';
      });
      rows.appendChild(row);
    });
  }
  if (names) { names.addEventListener('toggle', () => names.open && cpNamesBuild()); names.querySelector('.st-qj-filter').addEventListener('input', cpNamesBuild); names.querySelector('.st-qj-filter').addEventListener('keydown', e => e.stopPropagation()); }

  // ⌘ tapped twice within 0.4 s, with no other key in between (so ⌘C, ⌘V, ⌘Tab ... never trigger it)
  let lastTap = 0, clean = false;
  document.addEventListener('keydown', (e) => { if (e.key === 'Meta') clean = true; else clean = false; }, true);
  document.addEventListener('keyup', (e) => {
    if (e.key !== 'Meta') return;
    if (!clean) { lastTap = 0; return; }
    const now = Date.now();
    if (now - lastTap < 400) { lastTap = 0; open(); } else lastTap = now;
  }, true);
  document.addEventListener('mousedown', () => { lastTap = 0; }, true);
  window.callStudioQuickJump = open;   // (for a button, or the voice bar, later)
})();
