// The tab list, from static/js/tab-registry.js (a plain script that loads before this bundle, so window.CS_TABS is already there).
// The sidebar, the modern routes and navigation all read it here -- add a tab in tab-registry.js, not in this shell.
export type TabDef = { key: string; label: string; icon: string; group: string; button?: string; kind: 'page' | 'studio' | 'pdf' | 'react'; view?: string; open?: string[]; scroll?: boolean; say?: string[] };
export const TABS: TabDef[] = (window as Window & { CS_TABS?: TabDef[] }).CS_TABS || [];

/** The sidebar sections in order: [group name, its tabs], the System section last. */
export function tabGroups(): Array<[string, TabDef[]]> {
  const groups: Array<[string, TabDef[]]> = [];
  TABS.forEach(t => { let g = groups.find(x => x[0] === t.group); if (!g) groups.push(g = [t.group, []]); g[1].push(t); });
  return groups;
}
