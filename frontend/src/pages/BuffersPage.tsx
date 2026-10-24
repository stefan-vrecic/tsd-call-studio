import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

// 🧱 Buffers: whether the calendar auto-buffer (~/Desktop/calendar-auto-buffer) is adding buffer events around your calls, and how many
// calls in a row it allows (Off / 2 / 3 / 4, via /api/buffers and /api/buffers-set). Below: worked examples drawn by running the
// poller's real rules on made-up days (/api/buffer-diagrams). Refreshes every 30 s while open.
// Also "Max calls per day" for today + the next 6 days (/api/day-limits): Off, or a max and the name of the 9am-9pm banner event.
type State = { on: boolean; paused: boolean; paused_since?: string; mode: string; max_in_a_row: number };
type Case = { title: string; calls: number[]; blocked: number[]; notes: string[] };
type Diagrams = { first: number; last: number; sections: Array<{ title: string; blurb: string; cases: Case[] }> };
type DayLimit = { date: string; max: number | null; title: string };
const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '');

function DayLimits() {
  const [days, setDays] = useState<DayLimit[] | null>(null), [error, setError] = useState('');
  const load = useCallback(() => api<{ days: DayLimit[] }>('/api/day-limits').then(r => setDays(r.days)).catch(() => setError("Can't reach the server.")), []);
  useEffect(() => { load(); }, [load]);
  const save = async (date: string, max: number | null, title: string) => {
    try { setDays((await api<{ days: DayLimit[] }>('/api/day-limits', { method: 'POST', body: JSON.stringify({ date, max, title }) })).days); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Not saved'); load(); }
  };
  const edit = (date: string, patch: Partial<DayLimit>) => setDays(ds => ds && ds.map(x => x.date === date ? { ...x, ...patch } : x));
  return <section className="bf-limits"><h3>Max calls per day</h3>
    <p className="bf-note">On a day that's On, a 9am–9pm event with your name goes on the calendar. It shows as free time while you're under the max, and turns busy once the max is booked, so nothing more gets booked that day.</p>
    {error && <p className="bf-note">⚠️ {error}</p>}
    {!days ? <p className="bf-note">Loading…</p> : days.map(x => <div key={x.date} className={`bf-day ${x.max ? 'on' : ''}`}>
      <b>{dayLabel(x.date)}</b>
      <div className="bf-seg"><button className={x.max ? '' : 'on'} onClick={() => x.max && save(x.date, null, '')}>Off</button><button className={x.max ? 'on' : ''} onClick={() => !x.max && save(x.date, 5, '')}>On</button></div>
      {x.max ? <>
        <label>max <input type="number" min={1} max={30} value={x.max} onChange={e => edit(x.date, { max: Number(e.target.value) || 1 })} onBlur={e => { const n = Math.min(30, Math.max(1, Number(e.target.value) || 1)); save(x.date, n, /^\d+ Call Limit$/.test(x.title) ? '' : x.title); }} /> calls</label>
        <input className="bf-day-title" value={x.title} placeholder="Event name" onChange={e => edit(x.date, { title: e.target.value })} onBlur={() => save(x.date, x.max, x.title)} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
      </> : <span className="bf-day-off">No limit</span>}
    </div>)}
  </section>;
}

const hour = (h: number) => `${(h - 1) % 12 + 1}${h < 12 ? 'am' : 'pm'}`;

export function BuffersPage() {
  const [d, setD] = useState<State | null>(null), [error, setError] = useState(''), [n, setN] = useState(0), [diag, setDiag] = useState<Diagrams | null>(null);
  const load = useCallback(() => api<State>('/api/buffers').then(s => { setD(s); setError(''); }).catch(() => setError("Can't reach the server.")), []);
  useEffect(() => { load(); const t = setInterval(() => { if (!document.hidden) load(); }, 30000); return () => clearInterval(t); }, [load]);
  const shownN = n || d?.max_in_a_row || 3;
  useEffect(() => { if (d) api<Diagrams>(`/api/buffer-diagrams?n=${shownN}`).then(setDiag).catch(() => {}); }, [shownN, d]);
  const pick = async (m: string) => {
    if (!d || m === d.mode) return;
    if (d.paused && m !== 'off' && !confirm(`Turn auto-buffering ON with up to ${m} calls in a row? Within a minute buffers will start being added to your calendar.`)) return;
    try { await api(`/api/buffers-set?mode=${m}`, { method: 'POST' }); } catch { alert("Couldn't change it: server not answering"); }
    load();
  };
  const since = d?.paused_since ? new Date(d.paused_since).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  const k = d?.max_in_a_row || 0;
  const why = !d ? '' : d.on ? `Up to ${k} calls in a row are allowed. ${k === 2 ? 'Any back-to-back pair is walled in by buffers, and a lone open hour between two calls is blocked.' : `Once ${k} calls are back-to-back, buffers go before and after them; an open hour between calls is blocked only if booking it would make ${k + 1} or more in a row.`}`
    : d.paused ? `Paused on purpose${since ? ' since ' + since : ''}. No buffers are being added to the calendar.` : "The auto-buffer poller isn't running, so no buffers are being added.";
  const hours = diag ? Array.from({ length: diag.last - diag.first + 1 }, (_, i) => diag.first + i) : [];
  return <article className="selfdev-doc biz-doc">
    <h2>🧱 Buffers {d && <span>{d.mode === 'off' ? '(OFF)' : `(${d.mode})`}</span>}</h2>
    {error ? <p className="bf-note">{error}</p> : !d ? <p className="bf-note">Loading…</p> : <>
      <div className={`bf-card ${d.on ? 'on' : 'off'}`}><div className="bf-state">{d.on ? 'ON' : 'OFF'}</div><div className="bf-label">Auto-buffering{d.on ? ` · ${k} in a row` : ''}</div></div>
      <div className="bf-seg-wrap"><div className="bf-seg" role="radiogroup" aria-label="Calls in a row">{[['off', 'Off'], ['2', '2'], ['3', '3'], ['4', '4']].map(([m, label]) => <button key={m} className={d.mode === m ? 'on' : ''} onClick={() => pick(m)}>{label}</button>)}</div><span className="bf-switch-label">calls in a row before a buffer</span></div>
      <p className="bf-note">{why}</p>
      <DayLimits />
      {diag && <section className="bf-diagrams"><h3>See how it works</h3>
        <div className="bf-seg-wrap"><div className="bf-seg">{[2, 3, 4].map(x => <button key={x} className={x === shownN ? 'on' : ''} onClick={() => setN(x)}>{x} in a row</button>)}</div></div>
        <div className="bf-legend"><span className="bf-key call"><i />call</span><span className="bf-key block"><i />blocked by a buffer</span><span className="bf-key open"><i />open: can still be booked</span></div>
        {diag.sections.map(sec => <section key={sec.title} className="bf-section"><h4 className="bf-sec-title">{sec.title}</h4><p className="bf-sec-blurb">{sec.blurb}</p>
          <div className="bf-cases">{sec.cases.map(c => <article key={c.title} className={`bf-case ${c.blocked.length ? 'blocks' : 'free'}`}>
            <h5>{c.title}<span className={`bf-badge ${c.blocked.length ? 'blocks' : 'free'}`}>{c.blocked.length ? 'Blocks ' + c.blocked.map(hour).join(', ') : 'Nothing blocked'}</span></h5>
            <div className="bf-strip">{hours.map(h => { const kind = c.calls.includes(h) ? 'call' : c.blocked.includes(h) ? 'block' : 'open'; return <div key={h} className={`bf-slot ${kind}`}><span className="bf-t">{hour(h)}</span><span className="bf-k">{kind === 'call' ? 'CALL' : kind === 'block' ? 'BLOCKED' : 'open'}</span></div>; })}</div>
            <p>{c.notes.map((t, i) => <span key={i}>{i > 0 && <br />}{t}</span>)}</p></article>)}</div></section>)}
        <p className="bf-note">Drawn by running the real buffer rules on made-up one-hour calls, so this always matches what the poller does. A buffer never goes on top of an existing call.</p>
      </section>}
    </>}
  </article>;
}
