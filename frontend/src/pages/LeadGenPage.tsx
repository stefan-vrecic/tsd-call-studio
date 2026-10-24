import { useEffect, useMemo, useRef, useState } from 'react';
import { useRecord } from '../useRecord';

// 💎 Lead Gen: a small personal outreach pipeline (records store "leadgen"; the voice agent's leadgen_* tools edit the same list).
// Leads whose follow-up time has passed come first, highlighted. Click a cell to edit it there; ✎ or a double-click opens the full form.
type Lead = { id: string; source: string; name: string; link: string; lastContact: string; followUp: string; added?: number };
type Doc = { leads: Lead[] };
type Field = 'source' | 'name' | 'link' | 'lastContact' | 'followUp';
const SOURCES = ['Facebook', 'Instagram', 'WhatsApp', 'Skool', 'Other'];
const uid = () => Math.random().toString(36).slice(2, 11);
const isDue = (l: Lead) => Boolean(l.followUp) && new Date(l.followUp).getTime() <= Date.now();
const safeLink = (v: string) => { const url = String(v || '').trim(); return /^(https?:\/\/|\/)/i.test(url) && !/^\/\//.test(url) ? url : ''; };
// a datetime-local value ("2026-10-21T14:35") for now + some days, to the nearest 5 minutes
const localStamp = (days = 0) => { const d = new Date(Date.now() + days * 86400000); d.setMinutes(Math.round(d.getMinutes() / 5) * 5, 0, 0); const p = (x: number) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
const when = (v: string) => { if (!v) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(d); };

export function LeadGenPage() {
  const { doc, update, status } = useRecord<Doc>('leadgen', { leads: [] });
  const [q, setQ] = useState(''), [source, setSource] = useState(''), [, setTick] = useState(0);
  const [form, setForm] = useState<Lead | null>(null), [editing, setEditing] = useState<{ id: string; f: Field } | null>(null);
  useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 30000); return () => clearInterval(t); }, []);   // "due now" moves on by itself
  const all = doc?.leads || [];
  const leads = useMemo(() => all.filter(l => (!source || l.source === source) && (!q.trim() || `${l.name} ${l.source}`.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => Number(isDue(b)) - Number(isDue(a)) || (a.followUp || '9999').localeCompare(b.followUp || '9999') || a.name.localeCompare(b.name)), [all, q, source]);
  const setField = (id: string, f: Field, v: string) => update(d => { const l = d.leads.find(x => x.id === id); if (l) l[f] = v; return d; });
  const remove = (l: Lead) => { if (confirm(`Remove ${l.name} from Lead Gen?`)) update(d => { d.leads = d.leads.filter(x => x.id !== l.id); return d; }); };
  const cell = (l: Lead, f: Field, shown: React.ReactNode) => <td data-label={{ source: 'Source', name: 'Name', link: 'Link', lastContact: 'Last contact', followUp: 'Follow up' }[f]} className="lg-cell"
    onClick={e => { if (!(e.target as HTMLElement).closest('a, button, .lg-inline')) setEditing({ id: l.id, f }); }}>
    {editing?.id === l.id && editing.f === f ? <InlineEdit lead={l} f={f} onDone={(v) => { setEditing(null); if (v === null) return; if (f === 'name' && !v) return; if (f === 'link' && v && !safeLink(v)) { alert('Use an https:// link, or leave it empty.'); return; } if (v !== (l[f] || '')) setField(l.id, f, v); }} /> : shown}</td>;
  return <main className="lg-wrap">
    <header className="lg-head">
      <div><span className="lg-kicker">PERSONAL PIPELINE</span><h1>Lead Gen</h1><p>Keep conversations warm and know exactly who needs a follow-up.</p></div>
      <button className="ctl primary" type="button" onClick={() => setForm({ id: '', source: 'Facebook', name: '', link: '', lastContact: '', followUp: '' })}>＋ Add lead</button>
    </header>
    <section className="lg-summary" aria-label="Lead summary">
      <div><span>Total leads</span><strong>{all.length}</strong></div><div className="lg-summary-due"><span>Due now</span><strong>{all.filter(isDue).length}</strong></div><div><span>Scheduled</span><strong>{all.filter(l => l.followUp && !isDue(l)).length}</strong></div>
    </section>
    <div className="lg-tools"><label><span className="sr-only">Search leads</span><input type="search" placeholder="Search leads…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.stopPropagation()} /></label>
      <select aria-label="Filter by source" value={source} onChange={e => setSource(e.target.value)}><option value="">All sources</option>{SOURCES.map(s => <option key={s}>{s}</option>)}</select>
      <span className="bk-status" aria-live="polite">{status === 'Saving…' ? '' : status}</span></div>
    <div className="lg-table-wrap"><table className="lg-table"><thead><tr><th>Source</th><th>Name</th><th>Link</th><th>Last contact</th><th>Time to follow up</th><th><span className="sr-only">Actions</span></th></tr></thead>
      <tbody id="lg-body">{!doc ? <tr><td colSpan={6} className="lg-no-results">Loading…</td></tr> : !leads.length ? <tr><td colSpan={6} className="lg-no-results">No leads match this view.</td></tr> : leads.map(l => {
        const due = isDue(l), link = safeLink(l.link);
        return <tr key={l.id} data-id={l.id} className={due ? 'lg-is-due' : ''} onDoubleClick={e => { if (!(e.target as HTMLElement).closest('a, button, input, select')) setForm(l); }}>
          {cell(l, 'source', <span className={`lg-source lg-source-${String(l.source).toLowerCase()}`}>{l.source || 'Other'}</span>)}
          {cell(l, 'name', <><strong>{l.name}</strong>{due && <span className="lg-due-label">Follow up now</span>}</>)}
          {cell(l, 'link', link ? <a className="lg-open" href={link} target="_blank" rel="noopener noreferrer">Open ↗</a> : <span className="lg-empty-value">No link</span>)}
          {cell(l, 'lastContact', when(l.lastContact) || <span className="lg-empty-value">Not set</span>)}
          {cell(l, 'followUp', <span className="lg-follow-time">{when(l.followUp) || <span className="lg-empty-value">Not set</span>}</span>)}
          <td className="lg-row-actions"><button type="button" aria-label={`Edit ${l.name}`} onClick={() => setForm(l)}>✎</button><button type="button" aria-label={`Delete ${l.name}`} onClick={() => remove(l)}>×</button></td>
        </tr>;
      })}</tbody></table></div>
    {form && <LeadForm lead={form} onClose={() => setForm(null)} onSave={(v) => { update(d => { if (form.id) { const l = d.leads.find(x => x.id === form.id); if (l) Object.assign(l, v); } else d.leads.push({ id: uid(), added: Date.now(), ...v }); return d; }); setForm(null); }} />}
  </main>;
}

// a cell being edited: text for name / link, a date-time picker for the two times, a dropdown for the source. Enter / clicking away saves, Esc cancels.
function InlineEdit({ lead, f, onDone }: { lead: Lead; f: Field; onDone: (v: string | null) => void }) {
  const ref = useRef<HTMLInputElement & HTMLSelectElement>(null), done = useRef(false);
  const finish = (v: string | null) => { if (done.current) return; done.current = true; onDone(v); };
  useEffect(() => { ref.current?.focus(); if (ref.current?.type === 'text') ref.current.select(); }, []);
  const keys = (e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); finish((e.target as HTMLInputElement).value.trim()); } if (e.key === 'Escape') { e.preventDefault(); finish(null); } };
  if (f === 'source') return <select ref={ref} className="lg-inline" defaultValue={lead.source} onKeyDown={keys} onChange={e => finish(e.target.value)} onBlur={e => finish(e.target.value)}>{SOURCES.map(s => <option key={s}>{s}</option>)}</select>;
  return <input ref={ref} className="lg-inline" type={f === 'lastContact' || f === 'followUp' ? 'datetime-local' : 'text'} placeholder={f === 'link' ? 'https://…' : undefined} defaultValue={lead[f] || ''} onKeyDown={keys} onBlur={e => finish(e.target.value.trim())} />;
}

function LeadForm({ lead, onClose, onSave }: { lead: Lead; onClose: () => void; onSave: (v: Omit<Lead, 'id'>) => void }) {
  // a new lead's last contact starts as now (you're adding it because you just spoke)
  const [v, setV] = useState({ source: lead.source || 'Facebook', name: lead.name, link: lead.link, lastContact: lead.id ? lead.lastContact : localStamp(), followUp: lead.followUp }), [error, setError] = useState('');
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV(x => ({ ...x, [k]: e.target.value }));
  useEffect(() => { const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', esc); return () => document.removeEventListener('keydown', esc); }, [onClose]);
  return <div className="sm-dialog" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><form className="sm-dialog-card" onKeyDown={e => e.stopPropagation()} onSubmit={e => {
    e.preventDefault();
    if (v.link.trim() && !safeLink(v.link)) { setError('Use an https:// link or leave the link blank.'); return; }
    onSave({ ...v, name: v.name.trim(), link: v.link.trim() });
  }}>
    <div className="sm-dialog-head"><div><span className="lg-kicker">LEAD</span><h2>{lead.id ? 'Edit lead' : 'Add lead'}</h2></div><button className="sm-icon-btn" type="button" aria-label="Close" onClick={onClose}>×</button></div>
    <label>Source<select value={v.source} onChange={set('source')}>{SOURCES.map(s => <option key={s}>{s}</option>)}</select></label>
    <label>Name<input required autoFocus placeholder="Lead name" value={v.name} onChange={set('name')} /></label>
    <label>Link<input placeholder="https://… (optional)" value={v.link} onChange={set('link')} /></label>
    <div className="lg-date-pair"><label>Last contact<input type="datetime-local" value={v.lastContact} onChange={set('lastContact')} /></label><label>Time to follow up<input type="datetime-local" value={v.followUp} onChange={set('followUp')} />
      <span className="lg-quick">{[1, 2, 4, 7].map(d => <button key={d} type="button" className="ctl" title={`Follow up in ${d} day${d === 1 ? '' : 's'}`} onClick={() => setV(x => ({ ...x, followUp: localStamp(d) }))}>+{d}d</button>)}</span></label></div>
    <p className="sm-form-error" role="alert">{error}</p>
    <div className="sm-dialog-actions"><button className="ctl" type="button" onClick={onClose}>Cancel</button><button className="ctl primary" type="submit">Save lead</button></div>
  </form></div>;
}
