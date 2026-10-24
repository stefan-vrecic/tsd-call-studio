import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { Dialog } from '../components/Dialog';

// 🔁 CalendarSync: keep up to 4 Google calendars in step (CalendarBridge-style). Pick the calendars, switch on each direction you want
// (A→B, B→A ...) with its privacy level, preview, then switch the sync on. The syncing itself is calendar-auto-buffer/calendar_sync.py
// (run by the poller every couple of minutes); this page edits its setup through /api/calsync (routes/calendar_sync.py).
type Cal = { key?: string; id: string; label: string };
type Rule = { on: boolean; mode: 'busy' | 'title' | 'full'; busyTitle: string; color?: string; demo?: boolean };
type Config = { enabled: boolean; everySeconds: number; calendars: Cal[]; rules: Record<string, Rule>; options: { days: number; allDay: boolean; free: boolean; buffers: boolean; prefix: boolean; reminders: boolean; lookalikes: boolean; skipCounters: boolean; skipWords: string[]; skipColors: string[] } };
type Gcal = { id: string; name: string; role: string; primary: boolean };
type Result = { at?: string; dry?: boolean; planned?: Record<string, number>; done?: Record<string, number>; errors?: string[]; more?: number; skipped?: string; error?: string; sample?: Array<{ op: string; calendar: string; title: string; start: string }> };
type LogLine = { at: string; op: string; calendar: string; from?: string; title?: string; reason?: string; changes?: Record<string, [unknown, unknown]> };
type History = { counts: Record<string, { active: number; deleted: number; missing: number }>; log: LogLine[] };
const OP_TEXT: Record<string, string> = { create: '＋ copied', update: '✎ updated', delete: '− removed', missing: '⚠ went missing', note: '✎ source changed' };
const show = (v: unknown) => typeof v === 'object' && v ? ((v as { dateTime?: string; date?: string }).dateTime || (v as { date?: string }).date || JSON.stringify(v)) : String(v ?? '');
const EMPTY: Config = { enabled: false, everySeconds: 120, calendars: [], rules: {}, options: { days: 30, allDay: false, free: false, buffers: false, prefix: true, reminders: false, lookalikes: true, skipCounters: true, skipWords: [], skipColors: [] } };
const KEYS = ['A', 'B', 'C', 'D'];
const GCOLORS: Array<[string, string, string]> = [['1', 'Lavender', '#7986cb'], ['2', 'Sage', '#33b679'], ['3', 'Grape', '#8e24aa'], ['4', 'Flamingo', '#e67c73'], ['5', 'Banana', '#f6bf26'], ['6', 'Tangerine', '#f4511e'], ['7', 'Peacock', '#039be5'], ['8', 'Graphite', '#616161'], ['9', 'Blueberry', '#3f51b5'], ['10', 'Basil', '#0b8043'], ['11', 'Tomato', '#d50000']];
const MODE_TEXT = { busy: 'Busy only', title: 'Title only', full: 'Full details' };
const ROLE_TEXT: Record<string, string> = { owner: 'yours', writer: 'can edit', reader: 'read only', freeBusyReader: 'free/busy only' };
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const sum = (r?: Record<string, number>) => r ? `${r.create || 0} new · ${r.update || 0} updated · ${r.delete || 0} removed` : '';

export function CalendarSyncPage() {
  const [cfg, setCfg] = useState<Config>(EMPTY), [last, setLast] = useState<Result | null>(null), [gcals, setGcals] = useState<Gcal[] | null>(null);
  const [busy, setBusy] = useState(''), [result, setResult] = useState<Result | null>(null), [error, setError] = useState(''), [addEmail, setAddEmail] = useState('');
  const timer = useRef<number | undefined>(undefined);
  const [hist, setHist] = useState<History | null>(null), [histOpen, setHistOpen] = useState(false);
  const [info, setInfo] = useState<keyof typeof INFO | null>(null), [addOpen, setAddOpen] = useState(false);
  const loadHist = useCallback(() => api<History>('/api/calsync-history').then(setHist).catch(() => {}), []);
  const loadCals = useCallback((fresh = false) => api<{ calendars: Gcal[] }>(`/api/calsync-calendars${fresh ? '?fresh=1' : ''}`).then(d => setGcals(d.calendars)).catch(e => setError(e instanceof Error ? e.message : "Couldn't list your calendars")), []);
  useEffect(() => {
    api<{ config: Partial<Config>; lastRun: Result | null }>('/api/calsync').then(d => { setCfg({ ...EMPTY, ...d.config, options: { ...EMPTY.options, ...(d.config.options || {}) } } as Config); setLast(d.lastRun); }).catch(() => setError("Can't reach the server."));
    loadCals(); loadHist();
    const t = setInterval(() => { if (!document.hidden) api<{ lastRun: Result | null }>('/api/calsync').then(d => setLast(d.lastRun)).catch(() => {}); }, 30000);
    return () => clearInterval(t);
  }, [loadCals]);
  const save = (next: Config, now = false) => {
    setCfg(next);
    window.clearTimeout(timer.current);
    const go = () => api<{ config: Config }>('/api/calsync', { method: 'POST', body: JSON.stringify(next) }).then(d => { setCfg(c => ({ ...c, calendars: d.config.calendars })); setError(''); }).catch(e => setError(e instanceof Error ? e.message : 'Not saved'));
    if (now) return go();
    timer.current = window.setTimeout(go, 500);
    return Promise.resolve();
  };
  const cals = cfg.calendars.map((c, i) => ({ ...c, key: KEYS[i] }));
  const name = (c: Cal) => c.label || gcals?.find(g => g.id === c.id)?.name || c.id;
  const role = (id: string) => gcals?.find(g => g.id === id)?.role || '';
  const pairs = cals.flatMap(a => cals.filter(b => b.key !== a.key).map(b => [a, b] as const));
  const rule = (k: string): Rule => cfg.rules[k] || { on: false, mode: 'busy', busyTitle: 'Busy' };
  const setRule = (k: string, patch: Partial<Rule>) => save({ ...cfg, rules: { ...cfg.rules, [k]: { ...rule(k), ...patch } } });
  const setCal = (i: number, patch: Partial<Cal>) => { const next = cfg.calendars.slice(); next[i] = { ...next[i], ...patch }; save({ ...cfg, calendars: next }); };
  const removeCal = (i: number) => {
    if (!confirm(`Take ${name(cfg.calendars[i])} out of the sync? Its copies (and the copies made from it) are removed on the next sync. Directions are re-lettered.`)) return;
    save({ ...cfg, calendars: cfg.calendars.filter((_, j) => j !== i), rules: {} }, true);   // letters shift, so the directions start over
  };
  const tickAll = (on: boolean) => save({ ...cfg, rules: Object.fromEntries(pairs.map(([a, b]) => [`${a.key}>${b.key}`, { ...rule(`${a.key}>${b.key}`), on }])) });
  const runNow = async (dry: boolean) => {
    setBusy(dry ? 'Working out what would change…' : 'Syncing…'); setResult(null);
    await save(cfg, true);
    try { const r = await api<Result>(`/api/calsync-run${dry ? '?dry=1' : ''}`, { method: 'POST' }); setResult(r); if (!dry) setLast(r); } catch (e) { setResult({ error: e instanceof Error ? e.message : 'failed' }); }
    setBusy(''); if (!dry) loadHist();
  };
  const toggleEnabled = async () => {
    if (!cfg.enabled) {
      if (!Object.values(cfg.rules).some(r => r.on)) { alert('Switch on at least one direction first.'); return; }
      setBusy('Checking what the first sync will do…');
      await save(cfg, true);
      const r = await api<Result>('/api/calsync-run?dry=1', { method: 'POST' }).catch(() => null);
      setBusy(''); if (r) setResult(r);
      if (!confirm(`Switch CalendarSync on?\n\nThe first sync will make ${sum(r?.planned) || 'some changes'} across your calendars, then it keeps them in step every ${Math.round(cfg.everySeconds / 60)} min.`)) return;
    }
    save({ ...cfg, enabled: !cfg.enabled }, true);
  };
  const cleanup = async () => {
    setBusy('Counting synced copies…');
    const d = await api<Result>('/api/calsync-cleanup?dry=1', { method: 'POST' }).catch(() => null); setBusy('');
    const n = d?.planned?.delete || 0;
    if (!n) { alert('There are no synced copies on any calendar.'); return; }
    if (!confirm(`Delete all ${n} synced copies from every calendar? Your own events aren't touched.${cfg.enabled ? '\n\nThe sync is ON, so it will make them again: switch it off first if you want them gone for good.' : ''}`)) return;
    setBusy('Removing synced copies…');
    const r = await api<Result>('/api/calsync-cleanup', { method: 'POST' }).catch(e => ({ error: String(e) })); setBusy(''); setResult(r);
  };
  const addShared = async () => {
    try { await api('/api/calsync-add', { method: 'POST', body: JSON.stringify({ email: addEmail }) }); setAddEmail(''); loadCals(true); } catch (e) { alert(e instanceof Error ? e.message : 'Not added'); }
  };
  const shown = result || last;
  const opt = (k: keyof Config['options'], v: unknown) => save({ ...cfg, options: { ...cfg.options, [k]: v } });
  const Toggle = ({ k, label, tip }: { k: 'prefix' | 'lookalikes' | 'skipCounters' | 'allDay' | 'free' | 'buffers' | 'reminders'; label: string; tip: string }) =>
    <label className="cs-toggle" title={tip}><input type="checkbox" checked={!!cfg.options[k]} onChange={e => opt(k, e.target.checked)} /><span>{label}</span></label>;
  const Info = ({ topic }: { topic: keyof typeof INFO }) => <button className="cs-info" title="What's this?" onClick={() => setInfo(topic)}>i</button>;
  const unused = (gcals || []).filter(g => !cals.some(c => c.id === g.id));
  const filters = cfg.options.skipWords.filter(Boolean).length + cfg.options.skipColors.length;
  return <article className="selfdev-doc biz-doc cs-sync">
    <header className="cs-head">
      <div><h2>🔁 CalendarSync <span className={`cs-pill ${cfg.enabled ? 'on' : ''}`}>{cfg.enabled ? `ON · every ${Math.round(cfg.everySeconds / 60)} min` : 'OFF'}</span> <Info topic="how" /></h2>
        <p className="cs-sub">Keep up to 4 calendars in step, with a privacy level for each direction.</p></div>
      <div className="cs-actions">
        <button className="ctl" onClick={() => runNow(true)} disabled={!!busy || !cals.length}>👀 Preview</button>
        <button className="ctl" onClick={() => runNow(false)} disabled={!!busy || !Object.values(cfg.rules).some(r => r.on)}>↻ Sync now</button>
        <button className={`ctl ${cfg.enabled ? '' : 'biz-primary'}`} onClick={toggleEnabled} disabled={!!busy}>{cfg.enabled ? 'Switch off' : 'Switch on'}</button>
      </div>
    </header>
    {error && <p className="cs-err">⚠️ {error}</p>}
    {(busy || shown) && <div className="cs-result">
      {busy ? <span>{busy}</span> : shown && <>
        <b>{shown.error ? '⚠️ ' + shown.error : shown.skipped ? shown.skipped : shown.dry ? `Preview: ${sum(shown.planned)}` : `Last sync ${when(shown.at)}: ${sum(shown.done || shown.planned)}`}</b>
        {!!shown.more && <span> · {shown.more} more next run</span>}
        {(shown.errors || []).map((e, i) => <p key={i} className="cs-err">⚠️ {e}</p>)}
        {shown.dry && !!shown.sample?.length && <details><summary>See the changes</summary><table className="cs-plan"><tbody>{shown.sample.map((x, i) => <tr key={i}><td>{x.op === 'create' ? '＋' : x.op === 'update' ? '✎' : '−'}</td><td>{x.calendar}</td><td>{x.title}</td><td>{when(x.start)}</td></tr>)}</tbody></table></details>}
      </>}
    </div>}

    <section className="cs-card">
      <h3>Calendars <Info topic="calendars" /></h3>
      {cals.map((c, i) => <div key={i} className="cs-cal">
        <span className="cs-letter">{c.key}</span>
        <input className="cs-label" value={c.label} placeholder="Name" title="Short name, shown in front of copied titles" onChange={e => setCal(i, { label: e.target.value })} />
        <select value={c.id} onChange={e => setCal(i, { id: e.target.value })}>
          {!gcals?.some(g => g.id === c.id) && <option value={c.id}>{c.id}</option>}
          {(gcals || []).map(g => <option key={g.id} value={g.id} disabled={cals.some(o => o.id === g.id && o.key !== c.key)}>{g.name}{g.primary ? ' (main)' : ''} · {ROLE_TEXT[g.role] || g.role}</option>)}
        </select>
        {role(c.id) && !['owner', 'writer'].includes(role(c.id)) && <small className="cs-warn" title="It can send events, not receive copies">source only</small>}
        <button className="cs-x" title="Take out of the sync" onClick={() => removeCal(i)}>×</button>
      </div>)}
      {cals.length < 4 && <button className="ctl" onClick={() => setAddOpen(true)}>＋ Add calendar</button>}
    </section>

    {cals.length >= 2 && <section className="cs-card">
      <h3>Directions <Info topic="directions" /><span className="cs-links"><button onClick={() => tickAll(true)}>Tick all</button> · <button onClick={() => tickAll(false)}>Untick all</button></span></h3>
      <div className="cs-rules">{pairs.map(([a, b]) => { const k = `${a.key}>${b.key}`, r = rule(k), canWrite = !role(b.id) || ['owner', 'writer'].includes(role(b.id)); return <div key={k} className={`cs-rule ${r.on ? 'on' : ''}`}>
        <label className="cs-pair"><input type="checkbox" checked={r.on} disabled={!canWrite} onChange={e => setRule(k, { on: e.target.checked })} /> {name(a)} <span className="cs-arrow">→</span> {name(b)}</label>
        {!canWrite ? <small className="cs-warn">{name(b)} is read only</small> : r.on && <div className="cs-rule-opts">
          <div className="cs-seg">{(Object.keys(MODE_TEXT) as Rule['mode'][]).map(m => <button key={m} className={r.mode === m ? 'on' : ''} onClick={() => setRule(k, { mode: m })}>{MODE_TEXT[m]}</button>)}</div>
          {r.mode === 'busy' && <input className="cs-busy" value={r.busyTitle} onChange={e => setRule(k, { busyTitle: e.target.value })} title="What the copies are called" />}
          {r.mode !== 'busy' && <label className="cs-demo" title="Every copy becomes “Demo • …” and phone numbers become random US ones"><input type="checkbox" checked={!!r.demo} onChange={e => setRule(k, { demo: e.target.checked })} /> 🎭 Demo</label>}
        </div>}
      </div>; })}</div>
    </section>}

    <section className="cs-card">
      <h3>Options <Info topic="options" /></h3>
      <div className="cs-toggles">
        <label className="cs-toggle">Sync the next <input type="number" min={1} max={90} value={cfg.options.days} onChange={e => opt('days', Number(e.target.value) || 30)} /> days</label>
        <Toggle k="prefix" label="Name in front (TSD • …)" tip="The source calendar's name in front of copied titles. Never on Busy copies." />
        <Toggle k="lookalikes" label="Skip lookalikes" tip="Don't copy an event if the target already has one with the same title and time." />
        <Toggle k="skipCounters" label="Skip counters & trackers" tip="Titles like “4/8 Calls Sched.” or “5.5/20 SALES”." />
        <Toggle k="buffers" label="Include buffers & call limits" tip="Call Studio's own aBuffers and call-limit blocks." />
        <Toggle k="allDay" label="Include all-day events" tip="All-day events are skipped unless this is on." />
        <Toggle k="free" label="Include “free” events" tip="Events marked as free time are skipped unless this is on." />
        <Toggle k="reminders" label="Reminders on copies" tip="Off: copies never notify you." />
      </div>
      <details className="cs-filters"><summary>Filters{filters ? ` (${filters})` : ''}: skip by word or colour</summary>
        <label className="cs-col">Skip events whose title contains (one per line)
          <textarea rows={3} value={cfg.options.skipWords.join('\n')} placeholder={'e.g.\nCall Maxxing'} onChange={e => opt('skipWords', e.target.value.split('\n'))} /></label>
        <div className="cs-colors"><span>Skip events coloured</span>{GCOLORS.map(([id, nm, hex]) => { const on = cfg.options.skipColors.includes(id); return <button key={id} className={on ? 'on' : ''} title={nm} style={{ background: hex }}
          onClick={() => opt('skipColors', on ? cfg.options.skipColors.filter(x => x !== id) : [...cfg.options.skipColors, id])}>{on ? '✕' : ''}</button>; })}</div>
      </details>
    </section>

    <section className="cs-card">
      <h3>History <Info topic="history" /></h3>
      {hist && Object.keys(hist.counts).length > 0 ? <div className="cs-counts">{Object.entries(hist.counts).map(([cal, c]) => <span key={cal} className="cs-chip"><b>{cal}</b> {c.active} synced{c.missing ? ` · ${c.missing} missing` : ''}{c.deleted ? ` · ${c.deleted} removed` : ''}</span>)}</div> : <p className="cs-sub">Nothing synced yet.</p>}
      <div className="cs-actions">
        <button className="ctl" onClick={() => { setHistOpen(o => !o); loadHist(); }}>{histOpen ? 'Hide changes' : 'Recent changes'}</button>
        <a className="ctl" href="/api/calsync-ledger" download>⬇ Download record</a>
        <button className="ctl cs-danger" onClick={cleanup} disabled={!!busy} title="Deletes every synced copy from every calendar. Your own events are never touched.">🧹 Remove all copies</button>
      </div>
      {histOpen && !!hist?.log.length && <table className="cs-plan cs-log"><tbody>{hist.log.map((l, i) => <tr key={i} className={l.op === 'missing' ? 'warn' : ''}>
        <td>{when(l.at)}</td><td>{OP_TEXT[l.op] || l.op}</td><td>{l.calendar}{l.from ? <small> from {l.from}</small> : null}</td>
        <td>{l.title}{l.reason && <small><br />{l.reason}</small>}{l.changes && <small>{Object.entries(l.changes).map(([k, [a, b]]) => <span key={k}><br />{k}: {show(a)} → {show(b)}</span>)}</small>}</td></tr>)}</tbody></table>}
    </section>

    {info && <Dialog title={INFO[info].title} onClose={() => setInfo(null)}>{INFO[info].body}</Dialog>}
    {addOpen && <Dialog title="＋ Add calendar" onClose={() => setAddOpen(false)}>
      {unused.length > 0 && <><p className="cs-sub">Calendars your Google account can already see:</p>
        <div className="cs-pick">{unused.map(g => <button key={g.id} className="ctl" onClick={() => { save({ ...cfg, calendars: [...cfg.calendars, { id: g.id, label: '' }] }); setAddOpen(false); }}>
          {g.name}{g.primary ? ' (main)' : ''} <small>{ROLE_TEXT[g.role] || g.role}</small></button>)}</div></>}
      <p className="cs-sub"><b>Not listed?</b> In that account's Google Calendar: Settings → the calendar → <i>Share with specific people</i> → add your signed-in email with <i>Make changes to events</i> (or <i>See only free/busy</i> if it only sends). Then add it here:</p>
      <div className="cs-actions"><input value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="its email, e.g. you@otheroffer.com" onKeyDown={e => { if (e.key === 'Enter') addShared(); }} />
        <button className="ctl" onClick={addShared} disabled={!addEmail.trim()}>Add</button><button className="ctl" onClick={() => loadCals(true)} title="Look again">↻</button></div>
    </Dialog>}
  </article>;
}

const INFO = {
  how: { title: 'How CalendarSync works', body: <ul className="cs-how">
    <li><b>No duplicates or loops.</b> Copies are marked and never copied again, so A→B plus B→A can't ping-pong.</li>
    <li><b>One copy per meeting.</b> The same meeting on two calendars is copied once. If the target already has it, it isn't copied.</li>
    <li><b>Changes follow.</b> Moving, renaming or deleting an event updates its copies. A hand-edited copy is put back.</li>
    <li><b>Safe.</b> Only its own copies are ever changed or deleted. If a calendar can't be read, its copies are left alone.</li>
    <li><b>Automatic</b> every couple of minutes while it's ON; Sync now runs it straight away.</li></ul> },
  calendars: { title: 'Calendars', body: <ul className="cs-how">
    <li>Up to 4, e.g. one per company, offer or your personal one.</li>
    <li>The <b>name</b> (e.g. TSD) goes in front of copied titles: “TSD • …”.</li>
    <li>A calendar shared with you as read only can <b>send</b> events but can't receive copies.</li>
    <li>Taking a calendar out removes the copies it received and the copies made from it.</li></ul> },
  directions: { title: 'Directions and privacy', body: <ul className="cs-how">
    <li><b>Busy only</b>: just the time, titled “Busy” (or your word). No title, notes, location, guests or links.</li>
    <li><b>Title only</b>: time and title.</li>
    <li><b>Full details</b>: title, notes, location and meeting link. Guests are never copied, so nobody gets invites.</li>
    <li><b>🎭 Demo</b>: every copy is titled “Demo • …” and every phone number in it becomes a random US one.</li>
    <li>Unticking a direction removes its copies on the next sync. To pause but keep them, switch the sync off.</li></ul> },
  options: { title: 'Options', body: <ul className="cs-how">
    <li>Each sync covers 24 hours back to the number of days ahead you set.</li>
    <li><b>Skip lookalikes</b>: a block you typed into both calendars isn't copied again.</li>
    <li><b>Skip counters</b>: tracker events like “4/8 Calls Sched.” stay put.</li>
    <li><b>Filters</b> skip events by a word in the title or by colour.</li>
    <li>Declined meetings are never copied.</li></ul> },
  history: { title: 'History', body: <ul className="cs-how">
    <li>Every copy is recorded on this Mac only (never on a calendar): where it is, which event it came from, and that event's details at the last sync.</li>
    <li>So a changed or lost original can be traced and rebuilt from the record.</li>
    <li>Removed copies stay on record for 180 days. A copy that vanishes is logged and recreated.</li>
    <li>Heads-up: copies are created by your signed-in Google account, which people with full access to the target can see.</li></ul> },
};
