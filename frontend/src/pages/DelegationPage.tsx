import { useState } from 'react';
import { useRecord } from '../useRecord';

// 🧭 Delegation: a task board (To do / Doing / Waiting on someone / Done) with an assignee and due date on every task, the people tasks can
// go to (VA, editor, closers ... plus you), and an SOP library (step-by-step checklists that turn into a task in one click). Records store "delegation".
type Task = { id: string; title: string; assignee: string; due: string; priority: string; status: string; notes: string; created?: string; doneAt?: string; sop?: string };
type Person = { id: string; name: string; role: string };
type Sop = { id: string; title: string; owner: string; steps: string; updated?: string };
type Doc = { tasks: Task[]; sops: Sop[]; people: Person[] };
const COLS: Array<[string, string]> = [['todo', 'To do'], ['doing', 'Doing'], ['waiting', 'Waiting on someone'], ['done', 'Done']];
const STARTERS: Array<Omit<Sop, 'id'>> = [
  { title: 'Delegation brief (use for every handover)', owner: 'Me', steps: 'What exactly needs doing (one sentence)\nWhy it matters / what it unlocks\nWhat "done" looks like (link an example)\nDeadline\nWho approves it, and how (Loom / message / call)\nWhere the files and logins live\nWhat they can decide without asking me' },
  { title: 'New client onboarding', owner: 'Me', steps: 'Agreement signed and saved\nFirst payment received (add it in Clients)\nCreate the client folder in Drive\nAdd the client to the Clients tab with goal and timezone\nSend the welcome message and booking link\nSchedule the kickoff call and first check-in\nAdd them to the community / resources' },
  { title: 'Weekly content batch', owner: 'Me', steps: 'Pick 5 ideas from Content ideas\nWrite hooks and scripts\nRecord in one sitting\nHand clips to the editor with the brief\nApprove edits\nSchedule posts\nLog results next week' },
  { title: 'After every sales call', owner: 'Me', steps: 'Tick the call and set its colour\nDownload the recording\nWrite the quick note while it is fresh\nSend the follow-up message\nSchedule the follow-up reminder\nUpdate the Clients tab if they signed' },
];
const uid = () => Math.random().toString(36).slice(2, 11);
const today = () => new Date().toLocaleDateString('en-CA');
const stop = (e: React.KeyboardEvent) => e.stopPropagation();
const checklist = (steps: string) => steps.split('\n').filter(x => x.trim()).map(x => '☐ ' + x.trim()).join('\n');

export function DelegationPage() {
  const { doc, update, status } = useRecord<Doc>('delegation', { tasks: [], sops: [], people: [] });
  const [filter, setFilter] = useState(''), [openTask, setOpenTask] = useState<string | null>(null), [openSop, setOpenSop] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: '', assignee: 'Me', due: '', priority: 'normal' }), [person, setPerson] = useState({ name: '', role: '' }), [sopTitle, setSopTitle] = useState('');
  if (!doc) return <article className="selfdev-doc biz-doc"><h2>🧭 Delegation</h2><p className="biz-dim">{status || 'Loading…'}</p></article>;
  const people = ['Me', ...doc.people.map(p => p.name)];
  const isDue = (t: Task) => Boolean(t.due) && t.status !== 'done' && t.due < today();
  const open = doc.tasks.filter(t => t.status !== 'done'), weekAgo = new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-CA');
  const tasks = doc.tasks.filter(t => !filter || (t.assignee || 'Me') === filter);
  const prio: Record<string, number> = { high: 0, normal: 1 };
  const setTask = (id: string, patch: Partial<Task>) => update(d => { const t = d.tasks.find(x => x.id === id); if (t) Object.assign(t, patch); return d; });
  const setSop = (id: string, patch: Partial<Sop>) => update(d => { const s = d.sops.find(x => x.id === id); if (s) Object.assign(s, patch, { updated: today() }); return d; });
  const addTask = () => { if (!draft.title.trim()) return; update(d => { d.tasks.push({ id: uid(), ...draft, title: draft.title.trim(), status: 'todo', notes: '', created: today() }); return d; }); setDraft(x => ({ ...x, title: '', due: '' })); };
  const move = (t: Task, by: number) => { const s = COLS[COLS.findIndex(c => c[0] === t.status) + by][0]; setTask(t.id, { status: s, doneAt: s === 'done' ? today() : '' }); };
  const addPerson = () => { if (!person.name.trim()) return; update(d => { d.people.push({ id: uid(), name: person.name.trim(), role: person.role.trim() }); return d; }); setPerson({ name: '', role: '' }); };
  const addSop = () => { if (!sopTitle.trim()) return; const s = { id: uid(), title: sopTitle.trim(), owner: 'Me', steps: '', updated: today() }; update(d => { d.sops.push(s); return d; }); setOpenSop(s.id); setSopTitle(''); };
  return <article className="selfdev-doc biz-doc">
    <h2>🧭 Delegation <span className="bk-status">{status}</span></h2>
    <div className="biz-cards">
      <div className="biz-card"><div className="biz-dim">Open tasks</div><b>{open.length}</b></div>
      <div className="biz-card"><div className="biz-dim">Overdue</div><b className={open.filter(isDue).length ? 'biz-out' : ''}>{open.filter(isDue).length}</b></div>
      <div className="biz-card"><div className="biz-dim">Waiting on others</div><b>{doc.tasks.filter(t => t.status === 'waiting').length}</b></div>
      <div className="biz-card"><div className="biz-dim">Done this week</div><b className="biz-in">{doc.tasks.filter(t => t.status === 'done' && (t.doneAt || '') >= weekAgo).length}</b></div></div>
    <div className="biz-form"><input placeholder="New task, e.g. Edit Tuesday's reel" style={{ flex: 1, minWidth: 220 }} value={draft.title} onChange={e => setDraft(x => ({ ...x, title: e.target.value }))} onKeyDown={e => { stop(e); if (e.key === 'Enter') addTask(); }} />
      <select value={draft.assignee} onChange={e => setDraft(x => ({ ...x, assignee: e.target.value }))}>{people.map(p => <option key={p}>{p}</option>)}</select>
      <input type="date" value={draft.due} onChange={e => setDraft(x => ({ ...x, due: e.target.value }))} onKeyDown={stop} />
      <select value={draft.priority} onChange={e => setDraft(x => ({ ...x, priority: e.target.value }))}><option value="normal">Normal</option><option value="high">High priority</option></select>
      <button className="ctl biz-primary" onClick={addTask}>＋ Add task</button></div>
    <div className="biz-bar-top"><span className="biz-dim">Show</span><select value={filter} onChange={e => setFilter(e.target.value)}><option value="">Everyone</option>{people.map(p => <option key={p}>{p}</option>)}</select></div>
    <div className="dg-board">{COLS.map(([k, label], ci) => { const col = tasks.filter(t => t.status === k).sort((a, b) => (prio[a.priority] ?? 1) - (prio[b.priority] ?? 1) || (a.due || '9999').localeCompare(b.due || '9999'));
      return <div className="dg-col" key={k}><div className="dg-col-head">{label} <span className="biz-dim">{col.length}</span></div>
        {col.length ? col.map(t => <div key={t.id} className={`dg-card${t.priority === 'high' ? ' high' : ''}`}><div className="dg-title">{t.title}</div>
          <div className="dg-meta"><span className="biz-pill">{t.assignee || 'Me'}</span>{t.due && <span className={isDue(t) ? 'biz-out' : 'biz-dim'}>{isDue(t) ? '⚠ ' : ''}{t.due}</span>}{t.priority === 'high' && <span className="biz-warn">● high</span>}{t.sop && <span className="biz-dim">SOP</span>}</div>
          <div className="dg-acts">{ci > 0 && <button className="ctl" title="Move back" onClick={() => move(t, -1)}>←</button>}{ci < 3 && <button className="ctl" title="Move forward" onClick={() => move(t, 1)}>→</button>}<button className="ctl" title="Edit" onClick={() => setOpenTask(openTask === t.id ? null : t.id)}>✎</button><button className="ctl" title="Delete" onClick={() => { if (confirm(`Delete "${t.title}"?`)) update(d => { d.tasks = d.tasks.filter(x => x.id !== t.id); return d; }); }}>✕</button></div>
          {openTask === t.id ? <div className="dg-editor"><input defaultValue={t.title} onBlur={e => e.target.value.trim() && setTask(t.id, { title: e.target.value.trim() })} onKeyDown={stop} />
            <div className="cl-row2"><select value={t.assignee || 'Me'} onChange={e => setTask(t.id, { assignee: e.target.value })}>{people.map(p => <option key={p}>{p}</option>)}</select><input type="date" value={t.due} onChange={e => setTask(t.id, { due: e.target.value })} onKeyDown={stop} /></div>
            <select value={t.priority} onChange={e => setTask(t.id, { priority: e.target.value })}><option value="normal">Normal</option><option value="high">High priority</option></select>
            <textarea rows={3} placeholder="Notes / brief / links" defaultValue={t.notes} onBlur={e => setTask(t.id, { notes: e.target.value })} onKeyDown={stop} /></div>
            : t.notes && <div className="dg-note">{t.notes.slice(0, 140)}</div>}
        </div>) : <div className="biz-dim dg-empty">Nothing here</div>}</div>; })}</div>
    <div className="biz-two">
      <div><h3>People <span className="biz-dim">who tasks can go to</span></h3>
        {doc.people.length ? doc.people.map(p => <div className="biz-sub" key={p.id}><b>{p.name}</b><span className="biz-dim">{p.role}</span><span style={{ flex: 1 }} /><span className="biz-dim">{doc.tasks.filter(t => t.assignee === p.name && t.status !== 'done').length} open</span><button className="ctl" onClick={() => { if (confirm(`Remove ${p.name}? Their tasks keep the name.`)) update(d => { d.people = d.people.filter(x => x.id !== p.id); return d; }); }}>✕</button></div>) : <p className="biz-dim">Add your VA, editor, setters or closers here.</p>}
        <div className="biz-form"><input placeholder="Name" style={{ width: 140 }} value={person.name} onChange={e => setPerson(x => ({ ...x, name: e.target.value }))} onKeyDown={e => { stop(e); if (e.key === 'Enter') addPerson(); }} /><input placeholder="Role (VA, editor…)" style={{ flex: 1, minWidth: 120 }} value={person.role} onChange={e => setPerson(x => ({ ...x, role: e.target.value }))} onKeyDown={e => { stop(e); if (e.key === 'Enter') addPerson(); }} /><button className="ctl" onClick={addPerson}>＋ Add person</button></div></div>
      <div><h3>SOP library <span className="biz-dim">{doc.sops.length}</span></h3>
        {doc.sops.length ? doc.sops.map(s => <Sop key={s.id} s={s} open={openSop === s.id} onToggle={() => setOpenSop(openSop === s.id ? null : s.id)} onSet={patch => setSop(s.id, patch)}
          onTask={() => update(d => { d.tasks.push({ id: uid(), title: s.title, assignee: 'Me', due: '', priority: 'normal', status: 'todo', notes: checklist(s.steps), sop: s.id, created: today() }); return d; })}
          onDelete={() => { if (confirm(`Delete the SOP "${s.title}"?`)) { update(d => { d.sops = d.sops.filter(x => x.id !== s.id); return d; }); setOpenSop(null); } }} />) : <p className="biz-dim">Write each repeatable job as steps once, then hand it over with one click.</p>}
        <div className="biz-form"><input placeholder="New SOP title" style={{ flex: 1, minWidth: 160 }} value={sopTitle} onChange={e => setSopTitle(e.target.value)} onKeyDown={e => { stop(e); if (e.key === 'Enter') addSop(); }} /><button className="ctl" onClick={addSop}>＋ Add SOP</button>
          {!doc.sops.length && <button className="ctl" onClick={() => update(d => { STARTERS.forEach(s => d.sops.push({ id: uid(), ...s, updated: today() })); return d; })}>✨ Add 4 starter SOPs</button>}</div></div>
    </div>
  </article>;
}

function Sop({ s, open, onToggle, onSet, onTask, onDelete }: { s: Sop; open: boolean; onToggle: () => void; onSet: (p: Partial<Sop>) => void; onTask: () => void; onDelete: () => void }) {
  const [copied, setCopied] = useState('📋 Copy as checklist');
  const steps = s.steps.split('\n').map(x => x.trim()).filter(Boolean);
  return <div className="dg-sop"><div className="biz-sub dg-sop-head"><b>{s.title}</b><span className="biz-dim">{steps.length} steps · {s.owner || ''}</span><span style={{ flex: 1 }} /><button className="ctl" title="Create a task from this SOP" onClick={onTask}>→ Task</button><button className="ctl" onClick={onToggle}>{open ? 'Close' : 'Open'}</button></div>
    {open && <div className="dg-editor"><input defaultValue={s.title} onBlur={e => e.target.value.trim() && onSet({ title: e.target.value.trim() })} onKeyDown={stop} /><input defaultValue={s.owner} placeholder="Owner (who runs it)" onBlur={e => onSet({ owner: e.target.value })} onKeyDown={stop} />
      <textarea rows={9} placeholder="One step per line" defaultValue={s.steps} onBlur={e => onSet({ steps: e.target.value })} onKeyDown={stop} />
      <div className="dg-acts"><button className="ctl" onClick={async () => { try { await navigator.clipboard.writeText(s.title + '\n' + checklist(s.steps)); setCopied('✓ Copied'); } catch { setCopied('⚠ Failed'); } }}>{copied}</button><button className="ctl" style={{ color: '#dc2626' }} onClick={onDelete}>🗑 Delete</button></div></div>}
  </div>;
}
