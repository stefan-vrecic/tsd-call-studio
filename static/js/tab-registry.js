// tab-registry.js -- THE list of Call Studio's tabs. Everything else reads it: the sidebar (React, frontend/src/components/Sidebar.tsx),
// tab switching + URLs + loaders (live-call.js), Settings' tab list (settings-tab.js), the ⌘⌘ quick jump (command-palette.js), the
// voice commands (routes/voice.py reads the JSON between the TABS markers below) and the full-height page style. A new tab = one line here
// (+ its page markup in player.html, or its React page in frontend/src/main.tsx).
//
// Fields: key (the #tab / URL name) · label + icon (sidebar) · group (sidebar section) · button (the label in the old tab bar, which
// Settings and quick jump show) · kind: "page" (a plain page, view = its element id), "studio" (the call workspace), "pdf" (Live Call /
// Onboarding), "react" (a page drawn by the React shell) · open: global functions to run each time it's opened (they can load later) ·
// scroll: the page scrolls inside its own full-height box · say: extra words the voice commands / quick jump accept.
// Keep the part between the markers plain JSON (double quotes, no trailing commas): Python parses it.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.
const CS_TABS = /*TABS*/[
  {"key": "home", "label": "Home", "icon": "⌂", "group": "Workspace", "button": "⌂ Home", "kind": "react"},
  {"key": "kanban", "label": "Kanban", "icon": "▦", "group": "Workspace", "button": "▦ Kanban", "kind": "react", "say": ["board", "boards"]},
  {"key": "studio", "label": "Call Studio", "icon": "◉", "group": "Calls", "button": "Call Studio", "kind": "studio", "view": "layout", "say": ["calls"]},
  {"key": "live", "label": "Live Call", "icon": "☎", "group": "Calls", "button": "📞 Live Call", "kind": "pdf", "view": "live-view"},
  {"key": "today", "label": "Today", "icon": "☀", "group": "Calls", "button": "☀️ Today", "kind": "page", "view": "today-view", "open": ["dayLoad"], "scroll": true, "say": ["day"]},
  {"key": "followup", "label": "Follow up", "icon": "↗", "group": "Calls", "button": "📞 Follow up", "kind": "page", "view": "followup-view", "open": ["fuLoad"], "scroll": true, "say": ["follow ups"]},
  {"key": "sessions", "label": "Sessions", "icon": "▤", "group": "Calls", "button": "📅 Sessions", "kind": "react", "say": ["session", "complimentary sessions"]},
  {"key": "leadgen", "label": "Lead Gen", "icon": "◇", "group": "Calls", "button": "💎 Lead Gen", "kind": "react"},
  {"key": "onboarding", "label": "Onboarding", "icon": "▣", "group": "Calls", "button": "📋 Onboarding", "kind": "pdf", "view": "onboarding-view"},
  {"key": "precall", "label": "Checklist", "icon": "✓", "group": "Calls", "button": "✅ Checklist", "kind": "page", "view": "precall-view", "scroll": true, "say": ["pre call", "pre call checklist", "precall checklist", "checklists"]},
  {"key": "identitylab", "label": "Identity Lab", "icon": "◈", "group": "Calls", "button": "🧠 Identity Lab", "kind": "react", "say": ["identity lab", "sentence completion", "identity", "self esteem", "stems"]},
  {"key": "clients", "label": "Clients", "icon": "♟", "group": "Business", "button": "👥 Clients", "kind": "react"},
  {"key": "coaching", "label": "Rep Coaching", "icon": "◎", "group": "Business", "button": "🧑‍🏫 Rep Coaching", "kind": "react", "say": ["reps"]},
  {"key": "accounting", "label": "Accounting", "icon": "$", "group": "Business", "button": "💰 Accounting", "kind": "react"},
  {"key": "delegation", "label": "Delegation", "icon": "◇", "group": "Business", "button": "🧭 Delegation", "kind": "react"},
  {"key": "agreements", "label": "Agreements", "icon": "▤", "group": "Business", "button": "📄 Agreements", "kind": "react"},
  {"key": "resources", "label": "Resources", "icon": "▥", "group": "Business", "button": "📚 Resources", "kind": "react"},
  {"key": "buffers", "label": "Buffers", "icon": "▦", "group": "Business", "button": "🧱 Buffers", "kind": "react"},
  {"key": "calsync", "label": "CalendarSync", "icon": "⇄", "group": "Business", "button": "🔁 CalendarSync", "kind": "react", "say": ["calendar sync", "sync calendars", "calendar bridge", "calendarbridge", "sync"]},
  {"key": "statementbox", "label": "Statement Box", "icon": "“", "group": "Business", "button": "🗣️ Statement Box", "kind": "react"},
  {"key": "swipe", "label": "Swipe Gallery", "icon": "◫", "group": "Content", "button": "◫ Swipe Gallery", "kind": "react"},
  {"key": "content", "label": "Content workspace", "icon": "✦", "group": "Content", "button": "💡 Content", "kind": "page", "view": "content-view", "open": ["ciLoad"], "scroll": true},
  {"key": "messaging", "label": "Messaging", "icon": "✉", "group": "Content", "button": "📨 Integrated messaging", "kind": "react"},
  {"key": "tracker", "label": "Tracker", "icon": "⌁", "group": "Personal", "button": "📈 Tracker", "kind": "page", "view": "tracker-view", "open": ["tkOpen"], "scroll": true},
  {"key": "journal", "label": "Journal / Planner", "icon": "▱", "group": "Personal", "button": "📓 Journal / Planner", "kind": "page", "view": "journal-view", "open": ["jrOpen", "jpOpen"], "say": ["journal", "planner"]},
  {"key": "roadmap", "label": "Roadmap", "icon": "⌁", "group": "Personal", "button": "🗺 Roadmap", "kind": "page", "view": "roadmap-view", "open": ["rmOpen"]},
  {"key": "selfdev", "label": "Development", "icon": "♧", "group": "Personal", "button": "🌱 Development", "kind": "react", "say": ["self development"]},
  {"key": "travel", "label": "Travel", "icon": "✈", "group": "Personal", "button": "✈️ Travel", "kind": "react", "hidden": true, "say": ["travel", "rentals", "airbnb", "apartments", "places to stay"]},
  {"key": "travelcontacts", "label": "Travel Contacts", "icon": "☺", "group": "Personal", "button": "👥 Travel Contacts", "kind": "react", "hidden": true, "say": ["travel contacts", "travel assistants", "contacts", "cleaner", "chef", "driver", "assistant"]},
  {"key": "purchase", "label": "Purchases", "icon": "◌", "group": "Personal", "button": "🛒 Purchases", "kind": "react", "say": ["purchase list"]},
  {"key": "music", "label": "Music", "icon": "♫", "group": "Personal", "button": "🎼 Music", "kind": "react"},
  {"key": "learning", "label": "Learning", "icon": "▥", "group": "Personal", "button": "🎓 Learning", "kind": "page", "view": "learning-view", "scroll": true},
  {"key": "weather", "label": "Weather", "icon": "☁", "group": "Personal", "button": "🌤 Weather", "kind": "react", "say": ["forecast", "rain"]},
  {"key": "settings", "label": "Settings", "icon": "⚙", "group": "System", "button": "⚙️ Settings", "kind": "page", "view": "settings-view", "scroll": true}
]/*END*/;

window.CS_TABS = CS_TABS;   // (a top-level const isn't a window property; the React shell reads it from window)
// "hidden": true = starts hidden from the sidebar (still in ⌘⌘ quick jump and voice). Applied once per tab, so un-hiding it in
// Settings (or right-click -> show) sticks.
try {
  const hid = JSON.parse(localStorage.getItem('tabHidden') || '{}') || {}, done = JSON.parse(localStorage.getItem('tabHiddenDefaults') || '[]') || [];
  const fresh = CS_TABS.filter(t => t.hidden && !done.includes(t.key));
  if (fresh.length) {
    fresh.forEach(t => { if (!(t.key in hid)) hid[t.key] = true; done.push(t.key); });
    localStorage.setItem('tabHidden', JSON.stringify(hid)); localStorage.setItem('tabHiddenDefaults', JSON.stringify(done));
  }
} catch (e) { /* no storage: shown */ }
const csTab = (key) => CS_TABS.find(t => t.key === key) || null;
const CS_LEGACY_TABS = CS_TABS.filter(t => t.kind !== 'react');            // drawn by the plain scripts (player.html)
const CS_REACT_TABS = CS_TABS.filter(t => t.kind === 'react');             // drawn by the React shell
/** Runs a tab's "open" loaders (each only if that script has loaded). */
function csRunOpen(key) { (csTab(key)?.open || []).forEach(fn => { if (typeof window[fn] === 'function') window[fn](); else { try { const f = (0, eval)(fn); if (typeof f === 'function') f(); } catch (e) { /* not loaded */ } } }); }

// every tab gets a (hidden, under the sidebar) button in the old tab bar: tab switching, hotkeys, Settings and quick jump all go through
// these. Buttons missing from player.html are made here; a React page's button asks the React shell to show it.
(() => {
  const bar = document.getElementById('app-tabs');
  if (!bar) return;
  const before = document.getElementById('tab-links');
  CS_TABS.forEach(t => {
    let b = document.getElementById('tab-' + t.key);
    if (!b) {
      b = document.createElement('button'); b.className = 'app-tab'; b.id = 'tab-' + t.key; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', 'false');
      b.textContent = t.button || t.label;
      bar.insertBefore(b, before || null);
    }
    if (t.kind === 'react') b.onclick = () => window.dispatchEvent(new CustomEvent('callstudio:open-route', { detail: t.key }));
    if (t.scroll && t.view) document.getElementById(t.view)?.classList.add('cs-scroll-page');
  });
})();
