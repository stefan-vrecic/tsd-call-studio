import { useEffect, useState } from 'react';
import { Dialog } from '../components/Dialog';
import { today, uid } from '../biz';
import { useRecord } from '../useRecord';

// 🧑‍🏫 Rep Coaching: the sales reps you coach. Overview = a card per rep (days since you last coached them -- amber after 7, red after 14 --,
// sessions this month, close rate, open actions, weakest skill) + team totals + this week's accountability. Click a rep for their page:
// Sessions / Accountability (weekly habits vs targets) / Skills (1-5 scorecard with history) / Numbers (weekly calls, closes, cash) /
// Actions / Profile. Records store "coaching".
type Session = { id: string; date: string; type: string; minutes: string | number; call: string; worked: string; wins: string; improve: string; focus: string[] };
type Action = { id: string; text: string; due: string; done: boolean; doneAt?: string; session?: string };
type Habit = { key: string; label: string; unit: string; target: number };
type Rep = { id: string; name: string; role: string; start: string; goal: string; notes?: string; status: string; colour: string; sessions: Session[]; skills: Record<string, Array<{ date: string; score: number }>>;
  numbers: Array<{ week: string; calls: string; closes: string; cash: string }>; actions: Action[]; habits?: Habit[]; checkins?: Record<string, Record<string, number>> };
type Doc = { reps: Rep[] };
const SKILLS: Array<[string, string]> = [['prep', 'Pre-call prep'], ['rapport', 'Rapport'], ['discovery', 'Discovery'], ['tonality', 'Tonality'], ['script', 'Script'], ['objections', 'Objection handling'], ['closing', 'Closing'], ['followup', 'Follow-up']];
const TYPES = ['1-1', 'Call review', 'Role-play', 'Shadowing', 'Group'];
const HABITS: Habit[] = [{ key: 'training', label: 'Training', unit: 'h', target: 3 }, { key: 'roleplay', label: 'Role-plays', unit: '', target: 3 }, { key: 'submitted', label: 'Calls submitted', unit: '', target: 2 }, { key: 'listen', label: 'Call listen-backs', unit: '', target: 2 }, { key: 'drills', label: 'Script drills', unit: '', target: 5 }];
const COLOURS = ['#2563eb', '#16a34a', '#db2777', '#ea580c', '#7c3aed', '#0891b2', '#ca8a04', '#475569'];
const nice = (iso?: string) => iso ? new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : '';
const daysSince = (iso: string | null) => iso ? Math.round((new Date(today() + 'T12:00:00').getTime() - new Date(iso + 'T12:00:00').getTime()) / 86400000) : null;
// check-ins are keyed by the Monday of their week (kept on Mondays so the saved weeks still line up)
const monday = (iso: string) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toLocaleDateString('en-CA'); };
const weekOf = (n: number) => { const d = new Date(monday(today()) + 'T12:00:00'); d.setDate(d.getDate() - 7 * n); return d.toLocaleDateString('en-CA'); };
const initials = (name: string) => (name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const lastCoached = (r: Rep) => (r.sessions || []).map(s => s.date).sort().pop() || null;
const skillNow = (r: Rep, k: string) => { const h = (r.skills || {})[k] || []; return h.length ? h[h.length - 1].score : null; };
const weakest = (r: Rep) => { const s = SKILLS.map(([k, l]) => [l, skillNow(r, k)] as [string, number | null]).filter(([, v]) => v != null) as Array<[string, number]>; return s.length ? s.sort((a, b) => a[1] - b[1])[0] : null; };
const closeRate = (r: Rep, weeks = 4) => { const rows = (r.numbers || []).slice().sort((a, b) => b.week.localeCompare(a.week)).slice(0, weeks); const calls = rows.reduce((a, x) => a + (+x.calls || 0), 0), closes = rows.reduce((a, x) => a + (+x.closes || 0), 0); return calls ? Math.round(closes / calls * 100) : null; };
const openActions = (r: Rep) => (r.actions || []).filter(a => !a.done);
const monthSessions = (r: Rep) => (r.sessions || []).filter(s => s.date.slice(0, 7) === today().slice(0, 7)).length;
const habitsOf = (r: Rep) => (r.habits && r.habits.length ? r.habits : HABITS);
const weekHit = (r: Rep, week: string) => { const c = (r.checkins || {})[week] || {}, hs = habitsOf(r); return { hit: hs.filter(h => (+c[h.key] || 0) >= +h.target).length, total: hs.length, any: Object.keys(c).length > 0 }; };
const accScore = (r: Rep, weeks = 4) => { let hit = 0, total = 0; for (let n = 1; n <= weeks; n++) { const w = weekHit(r, weekOf(n)); hit += w.hit; total += w.total; } return total ? Math.round(hit / total * 100) : null; };   // this week isn't over yet: left out
const streak = (r: Rep) => { let k = 0; for (let n = 1; n < 60; n++) { const w = weekHit(r, weekOf(n)); if (!w.total || w.hit / w.total < 0.8) break; k++; } return k; };
const accClass = (p: number | null) => p == null ? '' : p >= 80 ? 'ok' : p >= 50 ? 'amber' : 'red';
const dueClass = (d: number | null) => d == null ? 'never' : d > 14 ? 'red' : d > 7 ? 'amber' : 'ok';
const coachedLabel = (d: number | null, prefix = '') => d == null ? 'never coached' : d === 0 ? 'coached today' : prefix + d + 'd ago';
const stop = (e: React.KeyboardEvent) => e.stopPropagation();
type Win = Window & { selectPerson?: (n: string) => void; people?: Array<{ name: string }>; displayName?: (n: string) => string; demoMode?: boolean };
const inDemo = () => { try { return localStorage.getItem('demoMode') === '1'; } catch { return false; } };
// Demo mode: reps get made-up names of their own (the client demo names are all used up by the calls), kept the same each time
// in localStorage "demoRepNames"; a linked call shows its usual demo name (core.js displayName)
const REP_DEMO = ['Jordan Price', 'Sam Carter', 'Alex Rivera', 'Jamie Brooks', 'Taylor Quinn', 'Morgan Reid', 'Chris Lane', 'Robin Hale', 'Casey Ward', 'Drew Fisher'];
function dn(name: string) {
  if (!inDemo() || !name) return name;
  let map: Record<string, string> = {};
  try { map = JSON.parse(localStorage.getItem('demoRepNames') || '{}') || {}; } catch { /* fresh */ }
  if (!map[name]) { const used = new Set(Object.values(map)); map[name] = REP_DEMO.find(n => !used.has(n)) || `Rep ${Object.keys(map).length + 1}`; try { localStorage.setItem('demoRepNames', JSON.stringify(map)); } catch { /* fine */ } }
  return map[name];
}
const dnCall = (name: string) => (window as Win).displayName?.(name) || name;

export function CoachingPage({ onNavigate }: { onNavigate: (route: string) => void }) {
  const { doc, update, status } = useRecord<Doc>('coaching', { reps: [] });
  const [, setDemoTick] = useState(0);
  useEffect(() => { const f = () => setDemoTick(n => n + 1); window.addEventListener('callstudio:demo-mode', f); return () => window.removeEventListener('callstudio:demo-mode', f); }, []);
  const [repId, setRepId] = useState<string | null>(null), [tab, setTab] = useState('sessions'), [form, setForm] = useState<null | { kind: 'rep' } | { kind: 'session'; s?: Session }>(null);
  if (!doc) return <article className="selfdev-doc biz-doc co-doc"><h2>🧑‍🏫 Rep Coaching</h2><p className="biz-dim">{status || 'Loading…'}</p></article>;
  const rep = doc.reps.find(r => r.id === repId) || null;
  const editRep = (fn: (r: Rep) => void) => update(d => { const r = d.reps.find(x => x.id === repId); if (r) fn(r); return d; });
  const openCall = (e: React.MouseEvent, name: string) => { const w = window as Win; if (e.metaKey || e.ctrlKey || !w.selectPerson) return; e.preventDefault(); onNavigate('studio'); w.selectPerson(name); };
  return <article className="selfdev-doc biz-doc co-doc"><h2>🧑‍🏫 Rep Coaching <span className="bk-status">{status}</span></h2>
    <div id="co-root">{rep ? <RepPage r={rep} tab={tab} setTab={setTab} back={() => setRepId(null)} edit={editRep} onLog={s => setForm({ kind: 'session', s })} openCall={openCall}
      onDelete={() => { if (confirm(`Delete ${dn(rep.name)} and all their sessions, scores and numbers? This can't be undone.`)) { update(d => { d.reps = d.reps.filter(x => x.id !== rep.id); return d; }); setRepId(null); } }} />
      : <Overview reps={doc.reps} onAdd={() => setForm({ kind: 'rep' })} onOpen={(id, t) => { setRepId(id); setTab(t); }} />}</div>
    {form?.kind === 'rep' && <RepForm onClose={() => setForm(null)} onSave={v => { const r: Rep = { id: uid(), ...v, status: 'active', colour: COLOURS[doc.reps.length % COLOURS.length], sessions: [], skills: {}, numbers: [], actions: [] }; update(d => { d.reps.push(r); return d; }); setRepId(r.id); setTab('sessions'); setForm(null); }} />}
    {form?.kind === 'session' && rep && <SessionForm r={rep} s={form.s} onClose={() => setForm(null)} onSave={(data, lines) => {
      editRep(r => {
        r.sessions ||= []; r.actions ||= [];
        let sess = form.s ? r.sessions.find(x => x.id === form.s!.id) : undefined;
        if (sess) Object.assign(sess, data); else { sess = { id: uid(), ...data }; r.sessions.push(sess); }
        // action items: keep the ticks of ones still listed, add new lines, drop removed ones
        const old = r.actions.filter(a => a.session === sess!.id);
        r.actions = r.actions.filter(a => a.session !== sess!.id).concat(lines.map(t => old.find(a => a.text === t) || { id: uid(), text: t, done: false, due: '', session: sess!.id }));
      });
      setForm(null);
    }} />}
  </article>;
}

function Overview({ reps, onAdd, onOpen }: { reps: Rep[]; onAdd: () => void; onOpen: (id: string, tab: string) => void }) {
  const active = reps.filter(r => r.status !== 'paused');
  const minutes = reps.reduce((a, r) => a + (r.sessions || []).filter(s => s.date.slice(0, 7) === today().slice(0, 7)).reduce((m, s) => m + (+s.minutes || 0), 0), 0);
  const due = active.filter(r => { const d = daysSince(lastCoached(r)); return d == null || d > 7; });
  const wk = weekOf(0);
  return <>
    <div className="co-bar"><button className="ctl co-primary" onClick={onAdd}>＋ Add rep</button><span className="co-hint">Click a rep for their sessions, skills, numbers and actions.</span></div>
    <div className="co-stats">
      <div><b>{active.length}</b><span>reps coached</span></div><div><b>{reps.reduce((a, r) => a + monthSessions(r), 0)}</b><span>sessions this month</span></div>
      <div><b>{Math.round(minutes / 6) / 10}</b><span>hours coached this month</span></div><div><b>{reps.reduce((a, r) => a + openActions(r).length, 0)}</b><span>open action items</span></div>
      <div className={due.length ? 'warn' : ''}><b>{due.length}</b><span>due a session (7+ days)</span></div></div>
    {reps.length ? <div className="co-grid">{reps.slice().sort((a, b) => Number(a.status === 'paused') - Number(b.status === 'paused') || (daysSince(lastCoached(b)) ?? 999) - (daysSince(lastCoached(a)) ?? 999)).map(r => {
      const d = daysSince(lastCoached(r)), weak = weakest(r), rate = closeRate(r), acc = accScore(r), st = streak(r);
      return <button key={r.id} className={`co-card${r.status === 'paused' ? ' paused' : ''}`} style={{ '--c': r.colour || COLOURS[0] } as React.CSSProperties} onClick={() => onOpen(r.id, 'sessions')}>
        <div className="co-card-top"><span className="co-avatar">{initials(dn(r.name))}</span><div><b>{dn(r.name)}</b><small>{r.role || ''}{r.status === 'paused' ? ' · paused' : ''}</small></div><span className={`co-due ${dueClass(d)}`}>{coachedLabel(d)}</span></div>
        <div className="co-card-nums"><span><b>{monthSessions(r)}</b> sessions this month</span><span><b>{rate == null ? '—' : rate + '%'}</b> close rate (4 wks)</span><span><b>{openActions(r).length}</b> open actions</span></div>
        <div className="co-card-acc">🔥 Accountability <b className={`co-acc ${accClass(acc)}`}>{acc == null ? '—' : acc + '%'}</b> <small>4 wks</small> · this week <b>{weekHit(r, wk).hit}/{habitsOf(r).length}</b>{st ? ` · ${st}-week streak` : ''}</div>
        <div className="co-card-skill">{weak ? <>Work on: <b>{weak[0]}</b> ({weak[1]}/5)</> : 'No skills scored yet'}</div></button>; })}</div>
      : <div className="co-empty"><h3>No reps yet</h3><p>Add the first sales rep you coach. Then log each session: what you worked on, their wins, what to improve and the actions you set.</p></div>}
    {active.length > 0 && <><h3 className="co-h3">🔥 This week's accountability <small>week of {nice(wk)} · click a rep to log it</small></h3>
      <table className="co-table co-acc-table"><thead><tr><th>Rep</th>{HABITS.map(h => <th key={h.key}>{h.label}</th>)}<th>4-week score</th></tr></thead><tbody>{active.map(r => { const c = (r.checkins || {})[wk] || {}, mine = habitsOf(r), acc = accScore(r);
        return <tr key={r.id} onClick={() => onOpen(r.id, 'accountability')}><td><b>{dn(r.name)}</b></td>{HABITS.map(h0 => { const h = mine.find(x => x.key === h0.key) || h0, v = +c[h.key] || 0; return <td key={h.key}><span className={`co-hab ${v >= +h.target ? 'ok' : v > 0 ? 'amber' : 'none'}`}>{v}{h.unit}/{h.target}{h.unit}</span></td>; })}<td><b className={`co-acc ${accClass(acc)}`}>{acc == null ? '—' : acc + '%'}</b></td></tr>; })}</tbody></table></>}
  </>;
}

function RepPage({ r, tab, setTab, back, edit, onLog, openCall, onDelete }: { r: Rep; tab: string; setTab: (t: string) => void; back: () => void; edit: (fn: (r: Rep) => void) => void; onLog: (s?: Session) => void; openCall: (e: React.MouseEvent, n: string) => void; onDelete: () => void }) {
  const d = daysSince(lastCoached(r)), first = dn(r.name).split(' ')[0];
  const TABS: Array<[string, string]> = [['sessions', '🗓 Sessions'], ['accountability', '🔥 Accountability'], ['skills', '🎯 Skills'], ['numbers', '📊 Numbers'], ['actions', '✅ Actions'], ['profile', '👤 Profile']];
  return <>
    <div className="co-bar"><button className="ctl" onClick={back}>‹ All reps</button><span className="co-avatar big" style={{ '--c': r.colour || COLOURS[0] } as React.CSSProperties}>{initials(dn(r.name))}</span>
      <div className="co-who"><b>{dn(r.name)}</b><small>{r.role || 'Sales rep'} · <span className={`co-due ${dueClass(d)}`}>{coachedLabel(d, 'last coached ')}</span></small></div>
      <button className="ctl co-primary" onClick={() => onLog()}>＋ Log session</button></div>
    <nav className="co-tabs">{TABS.map(([k, l]) => <button key={k} className={k === tab ? 'on' : ''} onClick={() => setTab(k)}>{l}{k === 'actions' && openActions(r).length > 0 && <> <i>{openActions(r).length}</i></>}</button>)}</nav>
    <div className="co-pane">
      {tab === 'sessions' && <Sessions r={r} edit={edit} onEdit={onLog} openCall={openCall} />}
      {tab === 'accountability' && <Accountability r={r} edit={edit} first={first} />}
      {tab === 'skills' && <Skills r={r} edit={edit} first={first} />}
      {tab === 'numbers' && <Numbers r={r} edit={edit} />}
      {tab === 'actions' && <Actions r={r} edit={edit} first={first} />}
      {tab === 'profile' && <Profile r={r} edit={edit} onDelete={onDelete} />}
    </div>
  </>;
}

function Sessions({ r, edit, onEdit, openCall }: { r: Rep; edit: (fn: (r: Rep) => void) => void; onEdit: (s: Session) => void; openCall: (e: React.MouseEvent, n: string) => void }) {
  const list = (r.sessions || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  if (!list.length) return <p className="co-empty-line">No sessions yet. Log your first one with ＋ Log session.</p>;
  return <>{list.map(s => { const acts = (r.actions || []).filter(a => a.session === s.id);
    return <div className="co-session" key={s.id}>
      <div className="co-s-head"><b>{nice(s.date)}</b><span className="co-tag">{s.type}</span>{s.minutes ? <span className="co-muted">{s.minutes} min</span> : null}
        {(s.focus || []).map(k => <span key={k} className="co-skill-chip">{(SKILLS.find(x => x[0] === k) || [k, k])[1]}</span>)}
        {s.call && <a className="co-call" href={`/?person=${encodeURIComponent(s.call)}`} title="Open the call in Call Studio" onClick={e => openCall(e, s.call)}>🎧 {dnCall(s.call)}</a>}
        <span className="co-s-acts"><button className="ctl" onClick={() => onEdit(s)}>Edit</button><button className="ctl" onClick={() => { if (confirm('Delete this session (and the action items set in it)?')) edit(x => { x.sessions = x.sessions.filter(y => y.id !== s.id); x.actions = (x.actions || []).filter(a => a.session !== s.id); }); }}>🗑</button></span></div>
      {s.worked && <div className="co-s-row"><span>Worked on</span><p>{s.worked}</p></div>}
      {s.wins && <div className="co-s-row good"><span>Wins</span><p>{s.wins}</p></div>}
      {s.improve && <div className="co-s-row work"><span>To improve</span><p>{s.improve}</p></div>}
      {acts.length > 0 && <div className="co-s-row"><span>Actions</span><p>{acts.map((a, i) => <span key={a.id}>{i > 0 && <br />}{a.done ? '✅' : '⬜'} {a.text}</span>)}</p></div>}
    </div>; })}</>;
}

function Skills({ r, edit, first }: { r: Rep; edit: (fn: (r: Rep) => void) => void; first: string }) {
  const score = (k: string, n: number) => edit(x => { x.skills ||= {}; const h = (x.skills[k] ||= []); if (h.length && h[h.length - 1].date === today()) h[h.length - 1].score = n; else h.push({ date: today(), score: n }); });   // one score per skill per day
  return <><p className="co-hint">Tap a score to rate {first} today (1 = needs a lot of work, 5 = excellent). The dots are the history, oldest first.</p>
    <div className="co-skills">{SKILLS.map(([k, l]) => { const h = (r.skills || {})[k] || [], cur = h.length ? h[h.length - 1].score : null, firstScore = h.length ? h[0].score : null;
      return <div className="co-skill-row" key={k}><b>{l}</b>
        <span className="co-scores">{[1, 2, 3, 4, 5].map(n => <button key={n} className={cur === n ? 'on' : ''} onClick={() => score(k, n)}>{n}</button>)}</span>
        <span className="co-hist">{h.slice(-12).map((x, i) => <i key={i} title={`${nice(x.date)}: ${x.score}/5`} style={{ '--h': `${x.score * 20}%` } as React.CSSProperties} />)}</span>
        <span className="co-delta">{h.length > 1 && cur != null && firstScore != null ? (cur - firstScore > 0 ? `▲ ${cur - firstScore}` : cur - firstScore < 0 ? `▼ ${firstScore - cur}` : '＝') : ''}</span></div>; })}</div></>;
}

function Numbers({ r, edit }: { r: Rep; edit: (fn: (r: Rep) => void) => void }) {
  const [v, setV] = useState({ week: monday(today()), calls: '', closes: '', cash: '' });
  const rows = (r.numbers || []).slice().sort((a, b) => b.week.localeCompare(a.week)), max = Math.max(1, ...rows.map(x => +x.calls || 0));
  const save = () => { const week = monday(v.week || today()); edit(x => { x.numbers = (x.numbers || []).filter(y => y.week !== week).concat({ week, calls: v.calls, closes: v.closes, cash: v.cash }); }); };
  const inp = (k: keyof typeof v, type = 'number') => <input type={type} min="0" value={v[k]} onChange={e => setV(x => ({ ...x, [k]: e.target.value }))} onKeyDown={stop} />;
  return <><div className="co-num-add">Week of {inp('week', 'date')} Calls {inp('calls')} Closes {inp('closes')} Cash $ {inp('cash')}<button className="ctl co-primary" onClick={save}>Save week</button></div>
    {rows.length ? <table className="co-table"><thead><tr><th>Week of</th><th>Calls</th><th>Closes</th><th>Close rate</th><th>Cash</th><th /></tr></thead><tbody>{rows.map(x => { const rate = +x.calls ? Math.round(+x.closes / +x.calls * 100) : null;
      return <tr key={x.week}><td>{nice(x.week)}</td><td><span className="co-bar-cell" style={{ '--w': `${(+x.calls || 0) / max * 100}%` } as React.CSSProperties}>{x.calls || 0}</span></td><td>{x.closes || 0}</td><td><b>{rate == null ? '—' : rate + '%'}</b></td><td>{x.cash ? '$' + Number(x.cash).toLocaleString() : '—'}</td>
        <td><button className="ctl" onClick={() => { if (confirm('Delete that week?')) edit(y => { y.numbers = y.numbers.filter(z => z.week !== x.week); }); }}>🗑</button></td></tr>; })}</tbody></table>
      : <p className="co-empty-line">No weeks logged yet. Add their calls, closes and cash each week to see if the coaching is moving the numbers.</p>}</>;
}

function Actions({ r, edit, first }: { r: Rep; edit: (fn: (r: Rep) => void) => void; first: string }) {
  const [text, setText] = useState(''), [due, setDue] = useState('');
  const list = (r.actions || []).slice().sort((a, b) => Number(a.done) - Number(b.done) || (a.due || '9').localeCompare(b.due || '9'));
  const add = () => { if (!text.trim()) return; edit(x => { (x.actions ||= []).push({ id: uid(), text: text.trim(), due, done: false }); }); setText(''); setDue(''); };
  return <><div className="co-num-add"><input placeholder={`An action for ${first}…  (Enter)`} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { stop(e); if (e.key === 'Enter') add(); }} /> due <input type="date" value={due} onChange={e => setDue(e.target.value)} onKeyDown={stop} /><button className="ctl co-primary" onClick={add}>Add</button></div>
    {list.length ? list.map(a => <label key={a.id} className={`co-action${a.done ? ' done' : ''}${!a.done && a.due && a.due < today() ? ' late' : ''}`}>
      <input type="checkbox" checked={a.done} onChange={e => edit(x => { const y = x.actions.find(z => z.id === a.id); if (y) { y.done = e.target.checked; y.doneAt = e.target.checked ? today() : ''; } })} />
      <span>{a.text}</span><small>{a.due ? 'due ' + nice(a.due) : ''}{a.done && a.doneAt ? ' · done ' + nice(a.doneAt) : ''}</small>
      <button className="co-x" title="Delete" onClick={e => { e.preventDefault(); if (confirm('Delete this action?')) edit(x => { x.actions = x.actions.filter(z => z.id !== a.id); }); }}>✕</button></label>)
      : <p className="co-empty-line">No actions yet. Add them here, or in a session.</p>}</>;
}

function Accountability({ r, edit, first }: { r: Rep; edit: (fn: (r: Rep) => void) => void; first: string }) {
  const hs = habitsOf(r), wk = weekOf(0), cur = (r.checkins || {})[wk] || {}, score = accScore(r), st = streak(r), weeks = Array.from({ length: 8 }, (_, n) => weekOf(n));
  const setCheck = (week: string, k: string, v: number | null) => edit(x => { x.checkins ||= {}; const c = (x.checkins[week] ||= {}); if (v == null) delete c[k]; else c[k] = Math.max(0, v); });
  return <>
    <div className="co-acc-head"><div><b className={`co-acc big ${accClass(score)}`}>{score == null ? '—' : score + '%'}</b><span>of targets hit, last 4 weeks</span></div>
      <div><b className="big">{st}</b><span>week{st === 1 ? '' : 's'} in a row at 80%+</span></div><div><b className="big">{weekHit(r, wk).hit}/{hs.length}</b><span>on target so far this week</span></div></div>
    <h3 className="co-h3">This week <small>week of {nice(wk)} · what {first} has actually done</small></h3>
    <div className="co-habits">{hs.map(h => { const v = +cur[h.key] || 0, pct = Math.min(100, v / (+h.target || 1) * 100);
      return <div key={h.key} className={`co-habit ${v >= +h.target ? 'done' : ''}`}><div className="co-habit-top"><b>{h.label}</b><span>{v}{h.unit} / {h.target}{h.unit}</span></div>
        <div className="co-habit-bar"><i style={{ width: `${pct}%` }} /></div>
        <div className="co-habit-btns"><button className="ctl" onClick={() => setCheck(wk, h.key, v - 1)}>−</button><button className="ctl" onClick={() => setCheck(wk, h.key, v + 1)}>＋{h.unit === 'h' ? ' 1h' : ''}</button>{h.unit === 'h' && <button className="ctl" onClick={() => setCheck(wk, h.key, v + 0.5)}>＋½h</button>}</div></div>; })}</div>
    <h3 className="co-h3">Week by week <small>edit any number; green = target hit</small></h3>
    <div className="co-table-wrap"><table className="co-table co-acc-hist"><thead><tr><th>Week of</th>{hs.map(h => <th key={h.key}>{h.label}<br /><small>target {h.target}{h.unit}</small></th>)}<th>Hit</th></tr></thead><tbody>{weeks.map(w => { const c = (r.checkins || {})[w] || {}, hit = weekHit(r, w);
      return <tr key={w}><td>{nice(w)}{w === wk && <> <small>(now)</small></>}</td>{hs.map(h => { const v = c[h.key] ?? ''; return <td key={h.key} className={v === '' ? '' : +v >= +h.target ? 'ok' : 'miss'}><input type="number" min="0" step={h.unit === 'h' ? '0.5' : '1'} defaultValue={v} key={`${w}-${h.key}-${v}`} onKeyDown={stop} onBlur={e => { if (e.target.value !== String(v)) setCheck(w, h.key, e.target.value === '' ? null : Number(e.target.value)); }} /></td>; })}
        <td><b className={`co-acc ${hit.any ? accClass(hit.hit / hit.total * 100) : ''}`}>{hit.any ? `${hit.hit}/${hit.total}` : '—'}</b></td></tr>; })}</tbody></table></div>
    <details className="co-targets"><summary>🎯 {first}'s weekly targets</summary><div className="co-num-add">{hs.map((h, i) => <label key={h.key}>{h.label} <input type="number" min="0" step="0.5" defaultValue={h.target} onKeyDown={stop} onBlur={e => edit(x => { x.habits = habitsOf(x).map((y, k) => k === i ? { ...y, target: Math.max(0, Number(e.target.value) || 0) } : y); })} /></label>)}</div></details>
  </>;
}

function Profile({ r, edit, onDelete }: { r: Rep; edit: (fn: (r: Rep) => void) => void; onDelete: () => void }) {
  const set = (k: keyof Rep) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement> | React.ChangeEvent<HTMLSelectElement>) => { const v = e.target.value.trim(); edit(x => { (x as Record<string, unknown>)[k] = v; }); };
  return <div className="co-form">
    <label>Name{inDemo() ? <input value={dn(r.name)} readOnly title="Demo mode is on: switch it off to rename" /> : <input defaultValue={r.name} onBlur={set('name')} onKeyDown={stop} />}</label>
    <label>Role<input defaultValue={r.role || ''} placeholder="e.g. Closer, Setter, New hire" onBlur={set('role')} onKeyDown={stop} /></label>
    <label>Started<input type="date" defaultValue={r.start || ''} onBlur={set('start')} onKeyDown={stop} /></label>
    <label>Status<select value={r.status === 'paused' ? 'paused' : 'active'} onChange={set('status')}><option value="active">Active</option><option value="paused">Paused</option></select></label>
    <label className="wide">Goals<textarea rows={3} defaultValue={r.goal || ''} placeholder="What are they working towards? e.g. 25% close rate by December" onBlur={set('goal')} onKeyDown={stop} /></label>
    <label className="wide">Notes<textarea rows={5} defaultValue={r.notes || ''} placeholder="Personality, how they like feedback, what motivates them…" onBlur={set('notes')} onKeyDown={stop} /></label>
    <div className="wide co-colours">Colour {COLOURS.map(c => <button key={c} style={{ background: c }} className={(r.colour || COLOURS[0]) === c ? 'on' : ''} onClick={() => edit(x => { x.colour = c; })} />)}</div>
    <div className="wide"><button className="ctl co-danger" onClick={onDelete}>Delete {dn(r.name)}</button></div></div>;
}

function RepForm({ onClose, onSave }: { onClose: () => void; onSave: (v: { name: string; role: string; start: string; goal: string }) => void }) {
  const [v, setV] = useState({ name: '', role: '', start: today(), goal: '' });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV(x => ({ ...x, [k]: e.target.value }));
  const save = () => { if (!v.name.trim()) { alert('Give them a name.'); return; } onSave({ name: v.name.trim(), role: v.role.trim(), start: v.start, goal: v.goal.trim() }); };
  return <Dialog title="＋ Add a rep" className="co-modal-card" onClose={onClose} footer={<><button className="ctl" onClick={onClose}>Cancel</button><button className="ctl cs-primary" onClick={save}>Save</button></>}>
    <div className="co-form"><label>Name<input autoFocus placeholder="e.g. Jordan Price" value={v.name} onChange={set('name')} /></label><label>Role<input placeholder="Closer, Setter, New hire…" value={v.role} onChange={set('role')} /></label>
      <label>Started<input type="date" value={v.start} onChange={set('start')} /></label><label className="wide">Goals<textarea rows={3} placeholder="What are they working towards?" value={v.goal} onChange={set('goal')} /></label></div>
  </Dialog>;
}

function SessionForm({ r, s, onClose, onSave }: { r: Rep; s?: Session; onClose: () => void; onSave: (data: Omit<Session, 'id'>, actionLines: string[]) => void }) {
  const calls = ((window as Win).people || []).map(p => p.name);
  const [v, setV] = useState({ date: s?.date || today(), type: s?.type || '1-1', minutes: String(s?.minutes ?? 30), call: s?.call || '', worked: s?.worked || '', wins: s?.wins || '', improve: s?.improve || '',
    actions: s ? (r.actions || []).filter(a => a.session === s.id).map(a => a.text).join('\n') : '' });
  const [focus, setFocus] = useState<string[]>(s?.focus || []);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV(x => ({ ...x, [k]: e.target.value }));
  const save = () => onSave({ date: v.date || today(), type: v.type, minutes: v.minutes, call: v.call.trim(), worked: v.worked.trim(), wins: v.wins.trim(), improve: v.improve.trim(), focus }, v.actions.split('\n').map(x => x.trim()).filter(Boolean));
  return <Dialog title={s ? 'Edit session' : `＋ Session with ${dn(r.name)}`} className="co-modal-card" onClose={onClose} footer={<><button className="ctl" onClick={onClose}>Cancel</button><button className="ctl cs-primary" onClick={save}>Save</button></>}>
    <div className="co-form">
      <label>Date<input type="date" value={v.date} onChange={set('date')} /></label>
      <label>Type<select value={v.type} onChange={set('type')}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
      <label>Minutes<input type="number" min="0" value={v.minutes} onChange={set('minutes')} /></label>
      <label>Call reviewed (optional)<input list="co-calls" placeholder="a call in Call Studio" value={v.call} onChange={set('call')} /><datalist id="co-calls">{calls.map(c => <option key={c} value={c} />)}</datalist></label>
      <div className="wide co-focus">Focus {SKILLS.map(([k, l]) => <label key={k} className="co-chip"><input type="checkbox" checked={focus.includes(k)} onChange={e => setFocus(f => e.target.checked ? [...f, k] : f.filter(x => x !== k))} /> {l}</label>)}</div>
      <label className="wide">What we worked on<textarea rows={3} value={v.worked} onChange={set('worked')} /></label>
      <label>Wins<textarea rows={3} value={v.wins} onChange={set('wins')} /></label>
      <label>To improve<textarea rows={3} value={v.improve} onChange={set('improve')} /></label>
      <label className="wide">Action items <small>(one per line)</small><textarea rows={3} placeholder={"Role-play the price objection 3x\nListen back to Tuesday's call"} value={v.actions} onChange={set('actions')} /></label>
    </div>
  </Dialog>;
}
