import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { RouteKey, SwipeItem } from '../types';
import { loadWeather, weatherLook, type Weather } from './WeatherPage';

type CardData = { day: Array<Record<string, unknown>>; dayCalls: Array<Record<string, unknown>>; dayError: string; queue: Array<Record<string, unknown>>; followups: Array<Record<string, unknown>>; swipe: SwipeItem[]; tracker: { metrics?: Array<Record<string, unknown>>; entries?: Array<Record<string, unknown>>; today?: string } };
const initial: CardData = { day: [], dayCalls: [], dayError: '', queue: [], followups: [], swipe: [], tracker: {} };
const safe = async <T,>(url: string, fallback: T) => { try { return await api<T>(url); } catch { return fallback; } };
type DemoWindow = Window & { displayName?: (name: string) => string; displayNamesInText?: (text: string, names?: string[]) => string };
const demoName = (name: unknown) => (window as DemoWindow).displayName?.(String(name || '')) || String(name || '');
const demoText = (value: unknown, names: string[] = []) => (window as DemoWindow).displayNamesInText?.(String(value || ''), names) || String(value || '');

const dayString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const trackerCardValue = (metric: Record<string, unknown>, entries: Array<Record<string, unknown>>, today?: string) => {
  if (!today) return { value: null, label: '' };
  const end = new Date(`${today}T12:00:00`), start = new Date(end);
  const rolling = Number(metric.rolling || 0);
  const period = metric.id === 'steps' ? 'w' : metric.id === 'commissions' ? 'm' : String(metric.defaultPeriod || 'd');
  if (rolling) start.setDate(start.getDate() - rolling + 1);
  else if (period === 'm') start.setDate(1);
  else if (period === 'w') start.setDate(start.getDate() - start.getDay());   // weeks start on Sunday
  const dates = new Set<string>();
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) dates.add(dayString(date));
  const byDay = new Map<string, Array<Record<string, unknown>>>();
  entries.filter(entry => entry.metric === metric.id && dates.has(String(entry.date || ''))).forEach(entry => {
    const date = String(entry.date), list = byDay.get(date) || []; list.push(entry); byDay.set(date, list);
  });
  const values = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, list]) => {
    const sorted = [...list].sort((a, b) => Number(a.at || 0) - Number(b.at || 0));
    const numbers = sorted.map(entry => Number(entry.value)).filter(Number.isFinite);
    if (!numbers.length) return null;
    if (metric.agg === 'avg') return metric.type === 'rating' && !metric.multi ? numbers[numbers.length - 1] : numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
    if (metric.agg === 'last') return numbers[numbers.length - 1];
    if (metric.agg === 'any') return numbers.some(Boolean) ? 1 : 0;
    return numbers.reduce((sum, value) => sum + value, 0);
  }).filter((value): value is number => value !== null);
  const label = rolling ? `${rolling}-day avg` : period === 'm' ? 'month to date' : period === 'w' ? 'week to date' : 'today';
  if (!values.length) return { value: null, label };
  const value = rolling || metric.agg === 'avg' ? values.reduce((sum, item) => sum + item, 0) / values.length
    : metric.agg === 'last' ? values[values.length - 1] : values.reduce((sum, item) => sum + item, 0);
  return { value, label };
};
const formatTrackerValue = (metric: Record<string, unknown>, value: number | null) => {
  if (value === null) return '—';
  if (metric.type === 'money') return `$${Math.round(value).toLocaleString()}`;
  const rounded = metric.type === 'rating' || metric.type === 'weight' || Math.abs(value) < 100 ? Math.round(value * 10) / 10 : Math.round(value);
  const unit = String(metric.unit || '');
  return `${rounded.toLocaleString()}${unit ? `${metric.type === 'weight' ? ' ' : ''}${unit}` : ''}`;
};

export function HomePage({ onNavigate, onAdd }: { onNavigate: (r: RouteKey) => void; onAdd: (kind?: 'swipe' | 'idea' | 'tracker') => void }) {
  const [data, setData] = useState<CardData>(initial), [loading, setLoading] = useState(true), [, setDemoVersion] = useState(0);
  useEffect(() => { const refresh = () => setDemoVersion(v => v + 1); window.addEventListener('callstudio:demo-mode', refresh); return () => window.removeEventListener('callstudio:demo-mode', refresh); }, []);
  useEffect(() => { const refresh = () => safe<CardData['tracker']>('/api/tracker', {}).then(tracker => setData(current => ({ ...current, tracker }))); window.addEventListener('callstudio:tracker-updated', refresh); return () => window.removeEventListener('callstudio:tracker-updated', refresh); }, []);
  useEffect(() => { let live = true; Promise.all([
    safe<{ events?: CardData['day']; calls?: CardData['dayCalls']; error?: string }>('/api/day-events', {}), safe<{ items?: CardData['queue'] }>('/api/queue', {}), safe<{ items?: CardData['followups'] }>('/api/followups', {}), safe<{ items?: SwipeItem[] }>('/api/swipe', {}), safe<CardData['tracker']>('/api/tracker', {}),
  ]).then(([day, queue, followups, swipe, tracker]) => { if (live) { setData({ day: day.events || [], dayCalls: day.calls || [], dayError: day.error || '', queue: queue.items || [], followups: followups.items || [], swipe: swipe.items || [], tracker }); setLoading(false); } }); return () => { live = false; }; }, []);
  const [usage, setUsage] = useState<{ claude?: UsageSide; codex?: UsageSide }>({});
  useEffect(() => { const load = () => safe<typeof usage>('/api/ai-usage', {}).then(setUsage); load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, []);
  const now = new Date(), greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const activeDownloads = data.swipe.filter(i => i.download && !['done', 'error'].includes(i.download.stage));
  const metrics = (data.tracker.metrics || []).filter(m => m.starred && !m.archived).slice(0, 5);
  return <main className="modern-page home-page">
    <header className="page-hero"><div><small>{now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()} · CALL STUDIO</small><h1>{greeting}, Stefan.</h1><p>Your work, priorities, and ideas in one place.</p></div><WeatherChip onOpen={() => onNavigate('weather')} /><div className="usage-chips"><UsageRow name="Claude" side={usage.claude} /><UsageRow name="ChatGPT" side={usage.codex} /></div><button className="primary" onClick={() => onAdd()}>＋ Add something</button></header>
    <div className="dashboard-grid">
      <DashboardCard title="Today" action="Open day" onAction={() => onNavigate('today')} wide>{loading ? <Skeleton /> : data.day.length ? data.day.slice(0, 5).map((e, i) => <div className="dashboard-row" key={i}><time>{String(e.start || e.time || e.startLabel || '')}</time><span>{demoText(e.label || e.title || e.summary || '', data.dayCalls.map(c => String(c.name || '')))}</span>{Boolean(e.done || e.checked) && <b>✓</b>}</div>) : <Empty>{data.dayError || 'Nothing scheduled today.'}</Empty>}</DashboardCard>
      <DashboardCard title="Call processing" action="Open calls" onAction={() => onNavigate('studio')}>{loading ? <Skeleton /> : data.queue.length ? data.queue.slice(0, 4).map((j, i) => <div className="job-row" key={i}><span><b>{demoName(j.name || 'Call')}</b><small>{demoText(j.message || j.stage || '', [String(j.name || '')])}</small></span><strong>{Math.round(Number(j.percent) || 0)}%</strong></div>) : <Empty>Nothing is processing ✓</Empty>}</DashboardCard>
      <DashboardCard title="Follow-ups" action="View all" onAction={() => onNavigate('followup')}><div className="big-stat">{data.followups.filter(i => !i.done).length}</div><Empty>People still needing attention</Empty></DashboardCard>
      <DashboardCard title="Swipe gallery" action="Open gallery" onAction={() => onNavigate('swipe')}><div className="stat-line"><strong>{data.swipe.length}</strong><span>saved ideas</span></div><p className={activeDownloads.length ? 'activity live' : 'activity'}><i />{activeDownloads.length ? `${activeDownloads.length} download${activeDownloads.length === 1 ? '' : 's'} in progress` : 'No downloads in progress'}</p></DashboardCard>
      <DashboardCard title="Tracker" action="Open tracker" onAction={() => onNavigate('tracker')}>{metrics.length ? metrics.map((m, i) => { const summary = trackerCardValue(m, data.tracker.entries || [], data.tracker.today); return <div className="dashboard-row" key={i}><span>{String(m.emoji || '📊')} {String(m.name || '')} <small className="tracker-period">{summary.label}</small></span><b>{formatTrackerValue(m, summary.value)}</b></div>; }) : <Empty>Star metrics in Tracker to see them here.</Empty>}</DashboardCard>
      <DashboardCard title="Quick capture"><div className="capture-grid"><button onClick={() => (document.getElementById('file-input') as HTMLInputElement)?.click()}>🎙 Upload call</button><button onClick={() => onAdd('swipe')}>📲 Save social link</button><button onClick={() => onAdd('idea')}>💡 Content idea</button><button onClick={() => onAdd('tracker')}>📈 Log tracker</button></div></DashboardCard>
      <TodoCard />
    </div>
  </main>;
}

// the small weather on Home: now + today's high/low; the server only looks it up again every 4 hours, so checking hourly here is free
function WeatherChip({ onOpen }: { onOpen: () => void }) {
  const [w, setW] = useState<Weather | null>(null);
  useEffect(() => { const load = () => loadWeather().then(setW).catch(() => {}); load(); const t = setInterval(load, 3600000); window.addEventListener('callstudio:weather-updated', load); return () => { clearInterval(t); window.removeEventListener('callstudio:weather-updated', load); }; }, []);
  if (!w?.current) return null;
  const [icon, word] = weatherLook(w.current.code, w.current.day), today = w.days?.[0];
  return <button className="weather-chip" onClick={onOpen} title={`${word} in ${w.place} — open the 5-day forecast`}><span>{icon}</span><b>{Math.round(w.current.temp)}°</b><small>{today ? `${Math.round(today.max)}° / ${Math.round(today.min)}°` : word}<br />{w.place.split(',')[0]}</small></button>;
}

type Window5 = { used?: number | null; resets_at?: number | null };
type UsageSide = { five_hour?: Window5; weekly?: Window5; saved_at?: number } | null;
const resetIn = (epoch?: number | null) => { if (!epoch) return ''; const s = epoch - Date.now() / 1000; if (s <= 0) return 'resets now'; const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60); return 'resets in ' + (d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`); };
function UsageRow({ name, side }: { name: string; side: UsageSide | undefined }) {
  const week = side?.weekly, five = side?.five_hour, stale = side?.saved_at ? Date.now() / 1000 - side.saved_at > 6 * 3600 : false;
  if (!five || five.used == null) return <div className="usage-row"><b>{name}</b><div className="usage-bar" /><span>no data yet</span></div>;
  const left = Math.max(0, Math.round(100 - five.used)), weeklyLeft = week?.used == null ? null : Math.max(0, Math.round(100 - week.used));
  const tone = left <= 10 ? 'low' : left <= 30 ? 'mid' : '';
  return <div className={`usage-row ${tone}`} tabIndex={0} aria-label={`${name} session limit: ${left}% left, ${resetIn(five.resets_at)}${weeklyLeft == null ? '' : `. Weekly limit: ${weeklyLeft}% left, ${resetIn(week?.resets_at)}`}${stale ? '. Data last seen a while ago' : ''}`}>
    <b>{name}</b><div className="usage-bar"><i style={{ width: `${left}%` }} /></div><span>{left}% left{stale ? '*' : ''} · {resetIn(five.resets_at)}</span>
    {weeklyLeft != null && <div className="usage-tooltip" role="tooltip"><strong>Weekly limit</strong><span>{weeklyLeft}% left · {resetIn(week?.resets_at)}</span></div>}
  </div>;
}

function DashboardCard({ title, action, onAction, wide, children }: { title: string; action?: string; onAction?: () => void; wide?: boolean; children: React.ReactNode }) { return <section className={`dashboard-card${wide ? ' wide' : ''}`}><header><h2>{title}</h2>{action && <button onClick={onAction}>{action} →</button>}</header><div className="card-body">{children}</div></section>; }
function Empty({ children }: { children: React.ReactNode }) { return <p className="empty">{children}</p>; }
function Skeleton() { return <div className="skeleton"><i /><i /><i /></div>; }

type Todo = { id: string; text: string; done: boolean; created: number };
function TodoCard() {
  const [items, setItems] = useState<Todo[]>([]), [text, setText] = useState('');
  const [copied, setCopied] = useState('');   // the task whose ⧉ copy just worked (shows ✓ for a moment)
  const copy = async (item: Todo) => {   // to paste the task into Claude later
    try { await navigator.clipboard.writeText(item.text); setCopied(item.id); window.setTimeout(() => setCopied(c => c === item.id ? '' : c), 1200); } catch { /* clipboard blocked */ }
  };
  const load = useCallback(() => safe<{ items?: Todo[] }>('/api/records?name=todos', {}).then(d => setItems(d.items || [])), []);
  useEffect(() => { load(); window.addEventListener('callstudio:todos-updated', load); return () => window.removeEventListener('callstudio:todos-updated', load); }, [load]);
  const save = async (next: Todo[]) => { setItems(next); await fetch('/api/records?name=todos', { method: 'POST', body: JSON.stringify({ items: next }) }); };
  const add = () => { if (!text.trim()) return; save([{ id: crypto.randomUUID(), text: text.trim(), done: false, created: Date.now() / 1000 }, ...items]); setText(''); };
  const [editing, setEditing] = useState('');   // the task being edited in place (click its text; Enter / clicking away saves, Esc cancels, ⇧Enter = new line)
  const finishEdit = (item: Todo, value: string | null) => { setEditing(''); const v = value?.trim(); if (v && v !== item.text) save(items.map(x => x.id === item.id ? { ...x, text: v } : x)); };
  // ticked tasks sit at the bottom; ticking one moves it there, unticking puts it back at the end of the open ones
  const ordered = [...items.filter(x => !x.done), ...items.filter(x => x.done)];
  const toggle = (item: Todo) => { const rest = ordered.filter(x => x.id !== item.id), flipped = { ...item, done: !item.done }; save([...rest.filter(x => !x.done), flipped, ...rest.filter(x => x.done)]); };
  const grow = (el: HTMLTextAreaElement | null) => { if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; } };
  return <DashboardCard title="General to-do" wide><div className="todo-add"><input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Something to do that isn't a calendar event…"/><button onClick={add}>Add</button></div><div className="todo-list">{items.length ? ordered.map((item, n) => <div key={item.id} className={`todo-item${item.done ? ' done' : ''}`}><input type="checkbox" checked={item.done} onChange={() => toggle(item)}/><span className="todo-num">{n + 1}.</span>{editing === item.id
    ? <textarea className="todo-edit" autoFocus defaultValue={item.text} ref={grow} onInput={e => grow(e.currentTarget)} onFocus={e => { const el = e.currentTarget; el.setSelectionRange(el.value.length, el.value.length); }} onBlur={e => finishEdit(item, e.currentTarget.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishEdit(item, e.currentTarget.value); } if (e.key === 'Escape') finishEdit(item, null); }} />
    : <span className="todo-text" title="Click to edit" onClick={() => setEditing(item.id)}>{item.text}</span>}<button className="todo-copy" title="Copy this task" onClick={e => { e.preventDefault(); e.stopPropagation(); copy(item); }}>{copied === item.id ? '✓' : '⧉'}</button><button onClick={() => save(items.filter(x => x.id !== item.id))}>×</button></div>) : <Empty>No general tasks yet.</Empty>}</div></DashboardCard>;
}
