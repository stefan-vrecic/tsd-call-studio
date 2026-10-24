import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';

// 📅 Sessions: every Complimentary session on the calendar (GET /api/sessions, routes/sessions.py), newest first, with the prospect's
// Aloware link, the outcome from the event colour, and whether its recording is in Call Studio (🎧 opens it) or still missing.
type Session = { id: string; date: string; time: string; name: string; tag?: string; outcome?: string; cancelled: boolean; done?: boolean; aloware?: string; url: string; inStudio: boolean; upcoming: boolean; expected: boolean; calls: Array<{ name: string; link: string }> };
type Data = { items: Session[]; counts: { sessions: number; inStudio: number; missing: number; upcoming: number; cancelled: number; noShow: number } };

const FILTERS: Array<[string, string]> = [['all', 'All'], ['in', '✅ In Call Studio'], ['missing', '❌ Missing'], ['upcoming', '🗓 Upcoming']];
const OUTCOME_COLOURS: Record<string, string> = { 'Closed won': '#16a34a', 'Closed lost': '#dc2626', 'No show': '#ea580c', 'No offer / bad fit': '#2563eb', 'Follow up': '#ec4899', Cancelled: '#8b5cf6', 'N/A': '#64748b', Notes: '#ca8a04' };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const inTwoWeeks = () => { const d = new Date(); d.setDate(d.getDate() + 14); return iso(d); };
const store = (key: string, value?: string) => { try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, value); } catch { /* storage blocked */ } return null; };
type Win = Window & { selectPerson?: (name: string) => void; displayName?: (name: string) => string };

export function SessionsPage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [data, setData] = useState<Data | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const [since, setSince] = useState('2026-08-23'), [until, setUntil] = useState(inTwoWeeks);
  const [filter, setFilterState] = useState(() => store('seFilter') || 'all'), [hideCancelled, setHideCancelled] = useState(true), [q, setQ] = useState('');
  const setFilter = (f: string) => { setFilterState(f); store('seFilter', f); };
  const load = useCallback(async (refresh = false) => {
    setLoading(true); setError('');
    try { setData(await api<Data>(`/api/sessions?since=${since}&until=${until}${refresh ? '&refresh=1' : ''}`)); }
    catch (e) { setError(e instanceof Error ? e.message : 'could not read the calendar'); }
    finally { setLoading(false); }
  }, [since, until]);
  useEffect(() => { load(); }, [load]);
  const rows = useMemo(() => (data?.items || []).filter(i => (!hideCancelled || !i.cancelled) && (!q.trim() || i.name.toLowerCase().includes(q.trim().toLowerCase())) &&
    (filter === 'all' || (filter === 'in' && i.inStudio) || (filter === 'missing' && i.expected && !i.inStudio) || (filter === 'upcoming' && i.upcoming))), [data, hideCancelled, q, filter]);
  // a call link opens it in Call Studio here; Cmd-click still opens a new browser tab
  const openCall = (e: React.MouseEvent, name: string) => {
    const w = window as Win;
    if (e.metaKey || e.ctrlKey || !w.selectPerson) return;
    e.preventDefault(); onNavigate('studio'); w.selectPerson(name);
  };
  const c = data?.counts;
  let lastDay = '';
  return <main className="modern-page sessions-page">
    <header className="page-hero compact"><div><small>CALLS</small><h1>📅 Sessions</h1><p>Every complimentary session on your calendar, with its Aloware link, and whether its recording is in Call Studio.</p></div>
      <button onClick={() => load(true)} disabled={loading} title="Read the calendar again now">{loading ? 'Reading…' : '↻ Refresh'}</button></header>
    <section className="ss-card">
      <div className="ss-tools">
        <label>From <input type="date" value={since} onChange={e => e.target.value && setSince(e.target.value)} /></label>
        <label>to <input type="date" value={until} onChange={e => e.target.value && setUntil(e.target.value)} /></label>
        <div className="ss-seg">{FILTERS.map(([k, l]) => <button key={k} className={k === filter ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>)}</div>
        <label className="ss-check"><input type="checkbox" checked={hideCancelled} onChange={e => setHideCancelled(e.target.checked)} /> Hide cancelled</label>
        <input type="search" className="ss-search" placeholder="Search a name…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.stopPropagation()} />
      </div>
      {c && <div className="ss-counts"><span><b>{c.sessions}</b> sessions</span><span>✅ <b>{c.inStudio}</b> in Call Studio</span><span>❌ <b>{c.missing}</b> missing</span><span>🗓 {c.upcoming} upcoming</span><span className="ss-muted">{c.cancelled} cancelled · {c.noShow} no-shows (no recording expected)</span></div>}
      {error ? <p className="ss-empty">⚠️ {error}</p> : !data ? <p className="ss-empty">Reading your calendar…</p> : !rows.length ? <p className="ss-empty">Nothing matches.</p>
        : <div className="ss-list">{rows.map(i => {
          const day = new Date(`${i.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
          const head = day !== lastDay ? <div className="ss-day">{day}</div> : null; lastDay = day;
          const name = (window as Win).displayName?.(i.name) || i.name;
          return <div key={i.id}>{head}<div className={`ss-row${i.cancelled ? ' cancelled' : ''}`}>
            <span className="ss-time">{i.time}</span>
            <span className="ss-name">{i.done ? '✅ ' : ''}{name || '(no name)'}{i.tag && <small className="ss-tag">{i.tag}</small>}</span>
            <span>{i.outcome && <span className="ss-outcome" style={{ '--oc': OUTCOME_COLOURS[i.outcome] || '#64748b' } as React.CSSProperties}>{i.outcome}</span>}</span>
            <span className="ss-links">{i.aloware ? <a className="ss-al" href={i.aloware} target="_blank" rel="noopener noreferrer">Aloware ↗</a> : <span className="ss-muted">no Aloware link</span>}<a className="ss-ev" href={i.url} target="_blank" rel="noopener noreferrer" title="Open the calendar event">📅</a></span>
            <span className="ss-studio">{i.inStudio ? i.calls.map(call => <a key={call.name} className="ss-call" href={call.link} onClick={e => openCall(e, call.name)} title="Open this call in Call Studio">🎧 {(window as Win).displayName?.(call.name) || call.name}</a>)
              : i.upcoming ? <span className="ss-muted">to come</span> : i.expected ? <span className="ss-missing">❌ not in Call Studio</span> : <span className="ss-muted">no recording expected</span>}</span>
          </div></div>;
        })}</div>}
    </section>
  </main>;
}
