import type { RouteKey } from './types';

export type ExternalLink = { key: string; icon: string; label: string; url: string };
export const DEFAULT_EXTERNAL_LINKS: ExternalLink[] = [
  { key: 'sightreading', icon: '🎼', label: 'SightReading', url: 'https://sightreadingfactory.com/' },
  { key: 'stripe', icon: '💳', label: 'Stripe', url: 'https://dashboard.stripe.com/' },
  { key: 'calendar', icon: '📅', label: 'Calendar', url: 'https://calendar.google.com/' },
  { key: 'chanty', icon: '💬', label: 'Chanty', url: 'https://www.chanty.com/' },
];

export function readExternalLinks(): ExternalLink[] {
  try {
    const raw = localStorage.getItem('externalLinksV1');
    if (raw === null) return DEFAULT_EXTERNAL_LINKS;
    const saved = JSON.parse(raw) as unknown;
    if (!Array.isArray(saved)) return DEFAULT_EXTERNAL_LINKS;
    return saved.filter((item): item is ExternalLink => Boolean(item && typeof item === 'object' && 'key' in item && 'label' in item && 'url' in item && /^https?:\/\//i.test(String(item.url))));
  } catch { return DEFAULT_EXTERNAL_LINKS; }
}

import { TABS } from './tabs';
// the pages the React shell draws itself (kind "react" in tab-registry.js) -- plus Home, whose React dashboard sits over the old one
export const MODERN_ROUTES = new Set<RouteKey>(['home', ...TABS.filter(t => t.kind === 'react').map(t => t.key)]);

export function routeFromLocation(): RouteKey {
  const hash = location.hash.replace(/^#\/?/, '').split('/')[0] as RouteKey;
  if (hash) return hash;
  // Direct call links (/PersonName or ?person=PersonName) must reveal the legacy call workspace,
  // even if the last normal dashboard tab saved in this browser was Home.
  if (location.pathname.length > 1 || new URLSearchParams(location.search).has('person')) return 'studio';
  return (localStorage.getItem('appTab') as RouteKey) || 'home';
}

export function openLegacy(route: RouteKey) {
  const button = document.getElementById(`tab-${route}`) as HTMLButtonElement | null;
  if (button) button.click();
}

export function pushModernRoute(route: RouteKey) {
  localStorage.setItem('modernRoute', route);
  localStorage.setItem('appTab', route);   // the tab to reopen next time (the plain tabs save it in live-call.js showTab)
  const target = `/#${route}`;
  if (location.pathname + location.search + location.hash !== target) history.pushState(null, '', target);
}

export function readPreferences() {
  const parse = (key: string) => { try { return JSON.parse(localStorage.getItem(key) || '{}') as Record<string, string | boolean>; } catch { return {}; } };
  return { names: parse('tabNames') as Record<string, string>, hidden: parse('tabHidden') as Record<string, boolean>, colors: parse('tabButtonColors') as Record<string, string>, pageColors: parse('tabColors') as Record<string, string>, hotkeys: parse('tabHotkeys') as Record<string, string>, hotkeysEnabled: localStorage.getItem('tabHotkeysEnabled') !== '0' };
}
