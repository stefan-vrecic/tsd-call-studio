import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import type { RouteKey } from '../types';
import { DEFAULT_EXTERNAL_LINKS, readExternalLinks, readPreferences } from '../navigation';
import { tabGroups } from '../tabs';

type Item = { key: RouteKey; label: string; icon: string } | { key: string; label: string; icon: string; url: string };
// the sections and their tabs come from the one tab list (static/js/tab-registry.js, via ../tabs)
const registryGroups = tabGroups().map(([name, tabs]) => [name, tabs.map(t => ({ key: t.key, label: t.label, icon: t.icon }))] as [string, Item[]]);
const fixedGroups: Array<[string, Item[]]> = registryGroups.filter(([name]) => name !== 'System');
const systemGroup: [string, Item[]] = registryGroups.find(([name]) => name === 'System') || ['System', [{ key: 'settings', label: 'Settings', icon: '⚙' }]];
const defaultOrder = [...fixedGroups, ['Links', DEFAULT_EXTERNAL_LINKS] as [string, Item[]], systemGroup].flatMap(([, items]) => items.map(item => `tab-${item.key}`));
const readOrder = () => { try { const saved = JSON.parse(localStorage.getItem('tabOrder') || 'null'); return Array.isArray(saved) ? saved as string[] : defaultOrder; } catch { return defaultOrder; } };
const readStarred = () => { try { const saved = JSON.parse(localStorage.getItem('tabStarred') || '[]'); return Array.isArray(saved) ? saved.filter(key => typeof key === 'string') as string[] : []; } catch { return []; } };
const hotkeyLabel = (value?: string) => value ? value.replace('Meta+', '⌘').replace('Ctrl+', '⌃').replace('Alt+', '⌥').replace('Shift+', '⇧') : '';

export function Sidebar({ active, onNavigate, onAdd }: { active: RouteKey; onNavigate: (key: RouteKey) => void; onAdd: () => void }) {
  const [prefs, setPrefs] = useState(readPreferences);
  const [externalLinks, setExternalLinks] = useState(readExternalLinks);
  const [order, setOrder] = useState(readOrder);
  const [starred, setStarred] = useState(readStarred);
  const [layoutRevision, setLayoutRevision] = useState(0);
  const [menu, setMenu] = useState<{ key: string; label: string; starable: boolean; x: number; y: number } | null>(null);
  const [dragged, setDragged] = useState<{ key: string; group: string } | null>(null);
  const [dropAt, setDropAt] = useState<{ key: string; after: boolean } | null>(null);
  const hovered = useRef<RouteKey | null>(null);
  const cmdHoverOn = () => localStorage.getItem('tabCmdHover') !== '0';
  useEffect(() => {
    const close = () => setMenu(null), refresh = () => { setPrefs(readPreferences()); setExternalLinks(readExternalLinks()); setOrder(readOrder()); setStarred(readStarred()); setLayoutRevision(n => n + 1); };
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Meta' && !event.repeat && hovered.current && hovered.current !== active && cmdHoverOn()) onNavigate(hovered.current); };
    window.addEventListener('click', close); window.addEventListener('blur', close); window.addEventListener('resize', close); window.addEventListener('app:tab-visibility', refresh); window.addEventListener('app:preferences-changed', refresh); document.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('click', close); window.removeEventListener('blur', close); window.removeEventListener('resize', close); window.removeEventListener('app:tab-visibility', refresh); window.removeEventListener('app:preferences-changed', refresh); document.removeEventListener('keydown', keydown); };
  }, [active, onNavigate]);
  useEffect(() => {
    const mode = localStorage.getItem('tabBarMode') === 'top' ? 'top' : 'side';
    const pref = localStorage.getItem('tabBarSide') || 'auto';
    const right = mode === 'side' && (pref === 'right' || (pref === 'auto' && active === 'studio'));
    document.body.classList.toggle('modern-nav-top', mode === 'top');
    document.body.classList.toggle('modern-nav-right', right);
    document.body.classList.toggle('modern-studio-active', active === 'studio');
    document.documentElement.style.setProperty('--modern-page-color', prefs.pageColors[active] || '');
  }, [active, layoutRevision, prefs.pageColors]);
  const openTabMenu = (event: MouseEvent, key: string, label: string, starable: boolean) => {
    if (key === 'settings') return;
    event.preventDefault(); event.stopPropagation();
    setMenu({ key, label, starable, x: Math.min(event.clientX, window.innerWidth - 190), y: Math.min(event.clientY, window.innerHeight - (starable ? 104 : 58)) });
  };
  const toggleStar = () => {
    if (!menu || !menu.starable) return;
    const next = starred.includes(menu.key) ? starred.filter(key => key !== menu.key) : [...starred, menu.key];
    localStorage.setItem('tabStarred', JSON.stringify(next));
    setStarred(next); setMenu(null);
    window.dispatchEvent(new CustomEvent('app:preferences-changed'));
  };
  const hideTab = () => {
    if (!menu) return;
    const hidden = { ...prefs.hidden, [menu.key]: true };
    localStorage.setItem('tabHidden', JSON.stringify(hidden));
    const legacy = document.getElementById(`tab-${menu.key}`); if (legacy) legacy.style.display = 'none';
    setPrefs({ ...prefs, hidden }); setMenu(null);
    window.dispatchEvent(new CustomEvent('app:tab-visibility', { detail: { key: menu.key, hidden: true } }));
    if (active === menu.key) onNavigate('home');
  };
  const ordered = (items: Item[]) => [...items].sort((a, b) => {
    const ai = order.indexOf(`tab-${a.key}`), bi = order.indexOf(`tab-${b.key}`);
    return (ai < 0 ? 10000 + items.indexOf(a) : ai) - (bi < 0 ? 10000 + items.indexOf(b) : bi);
  });
  const finishDrag = () => { setDragged(null); setDropAt(null); };
  const dropItem = (targetKey: string, after: boolean, group: string) => {
    if (!dragged || dragged.group !== group || dragged.key === targetKey) { finishDrag(); return; }
    const from = `tab-${dragged.key}`, target = `tab-${targetKey}`;
    const next = [...order];
    defaultOrder.forEach(id => { if (!next.includes(id)) next.push(id); });
    const without = next.filter(id => id !== from), targetIndex = without.indexOf(target);
    without.splice(targetIndex < 0 ? without.length : targetIndex + (after ? 1 : 0), 0, from);
    localStorage.setItem('tabOrder', JSON.stringify(without)); setOrder(without); finishDrag();
    window.dispatchEvent(new CustomEvent('app:preferences-changed'));
  };
  const groups: Array<[string, Item[]]> = [...fixedGroups, ['Links', externalLinks], systemGroup];
  const allItems = groups.flatMap(([, items]) => items);
  const starredItems = starred.map(key => allItems.find(item => item.key === key)).filter((item): item is Item => Boolean(item));
  const starredKeys = new Set(starredItems.map(item => item.key));
  const visibleGroups = groups.map(([name, items]) => [name, name === 'Workspace' ? [...items, ...starredItems] : items.filter(item => !starredKeys.has(item.key))] as [string, Item[]]);
  return <aside className="modern-sidebar">
    <div className="modern-brand"><span>CS</span><div><b>Call Studio</b><small>Your operating system</small></div></div>
    <button className="modern-add" onClick={onAdd}><span>＋</span> Add something <kbd>⌘K</kbd></button>
    <nav>
      {visibleGroups.map(([name, items]) => <section key={name} data-group={name.toLowerCase()}><h2>{name}</h2>{ordered(items).map((item) => {
        const color = prefs.colors[item.key];
        const shortcut = hotkeyLabel(prefs.hotkeys[item.key]);
        const coloredStyle = color ? ({ '--custom-tab': color, background: color, color: parseInt(color.slice(1, 3), 16) * .299 + parseInt(color.slice(3, 5), 16) * .587 + parseInt(color.slice(5, 7), 16) * .114 > 155 ? '#172033' : '#fff' } as CSSProperties) : undefined;
        const dragClass = `${dragged?.key === item.key ? 'dragging' : ''} ${dropAt?.key === item.key ? (dropAt.after ? 'drop-after' : 'drop-before') : ''}`.trim();
        const dragProps = {
          draggable: true,
          onDragStart: (event: React.DragEvent) => { setDragged({ key: item.key, group: name }); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', item.key); },
          onDragEnd: finishDrag,
          onDragOver: (event: React.DragEvent) => { if (!dragged || dragged.group !== name || dragged.key === item.key) return; event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); const after = document.body.classList.contains('modern-nav-top') ? event.clientX > rect.left + rect.width / 2 : event.clientY > rect.top + rect.height / 2; setDropAt({ key: item.key, after }); },
          onDrop: (event: React.DragEvent) => { event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); const after = document.body.classList.contains('modern-nav-top') ? event.clientX > rect.left + rect.width / 2 : event.clientY > rect.top + rect.height / 2; dropItem(item.key, after, name); },
        };
        if ('url' in item) {   // an outside link: right-click hides it too (bring it back in Settings -> Links)
          if (prefs.hidden[item.key]) return null;
          return <a key={item.key} href={item.url} target="_blank" rel="noreferrer" className={dragClass} style={coloredStyle} onContextMenu={(event) => openTabMenu(event, item.key, item.label, false)} {...dragProps}><i>{item.icon}</i>{item.label}<em>↗</em></a>;
        }
        if (prefs.hidden[item.key] && item.key !== 'settings') return null;
        const label = prefs.names[item.key] || item.label;
        return <button key={item.key} data-route={item.key} className={`${active === item.key ? 'active ' : ''}${dragClass}`.trim()} style={coloredStyle} onClick={() => onNavigate(item.key)} onContextMenu={(event) => openTabMenu(event, item.key, label, item.key !== 'home')} onMouseEnter={(event) => { hovered.current = item.key; if (event.metaKey && !event.buttons && cmdHoverOn() && active !== item.key) onNavigate(item.key); }} onMouseLeave={() => { if (hovered.current === item.key) hovered.current = null; }} {...dragProps}><i>{item.icon}</i>{label}{starredKeys.has(item.key) && <span className="modern-tab-star" aria-label="Starred" title="Starred">★</span>}{shortcut && <kbd className={!prefs.hotkeysEnabled ? 'disabled' : ''}>{shortcut}</kbd>}</button>;
      })}</section>)}
    </nav>
    <div className="modern-version">React foundation · Phase 1</div>
    {menu && <div className="modern-context-menu" style={{ left: menu.x, top: menu.y }} onClick={(event) => event.stopPropagation()} role="menu">
      {menu.starable && <button type="button" onClick={toggleStar} role="menuitem">{starred.includes(menu.key) ? '★ Unstar tab' : '☆ Star tab'}</button>}
      <button type="button" onClick={hideTab} role="menuitem">🙈 Hide {menu.label}</button>
      <small>{allItems.some(i => i.key === menu.key && 'url' in i) ? 'Show it again in Settings → Links' : 'Unhide it in Settings'}</small>
    </div>}
  </aside>;
}
