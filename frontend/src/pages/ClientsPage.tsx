import { useMemo, useState } from 'react';
import { api } from '../api';
import { csv, daysBetween, download, money, num, today, toast, uid } from '../biz';
import { useRecord } from '../useRecord';

// 👥 Clients: one row per client with pipeline status, payment status, revenue, cash collected, outstanding, next payment due, engagement,
// goal, contact details, timezone (with their local time), dates and notes. Click a row to edit it in the side panel. "💰 Add payment"
// adds the money to cash collected AND records an incoming in Accounting (records "accounting"). Records store "clients".
type Client = { id: string; name: string; status: string; pay: string; revenue: number | string; cash: number | string; phone: string; email: string; nextDue: string; nextAmount: number | string; signed: string; timezone: string; engagement: number; goal: string; program: string; source: string; lastContact: string; nextCheckin: string; renewal: string; notes: string; link: string; acctLogged?: number; acctDeclined?: number };
type Doc = { clients: Client[] };
const STATUS = ['Lead', 'Call booked', 'Follow up', 'Signed', 'Active', 'Paused', 'Completed', 'Churned'];
const PAY = ['Unpaid', 'Deposit paid', 'Payment plan', 'PAID', 'Overdue', 'Refunded'];
// time zones: the everyday abbreviations people say (EST, PST, GMT, BST, CET ...) AND full names (Europe/London). An abbreviation means the whole
// region, so "EST" and "EDT" both give Eastern time as it is right now.
const ABBR: Record<string, [string, string]> = {
  EST: ['America/New_York', 'Eastern US'], EDT: ['America/New_York', 'Eastern US'], ET: ['America/New_York', 'Eastern US'],
  CST: ['America/Chicago', 'Central US'], CDT: ['America/Chicago', 'Central US'], CT: ['America/Chicago', 'Central US'],
  MST: ['America/Denver', 'Mountain US'], MDT: ['America/Denver', 'Mountain US'], MT: ['America/Denver', 'Mountain US'],
  PST: ['America/Los_Angeles', 'Pacific US'], PDT: ['America/Los_Angeles', 'Pacific US'], PT: ['America/Los_Angeles', 'Pacific US'],
  AKST: ['America/Anchorage', 'Alaska'], AKDT: ['America/Anchorage', 'Alaska'], HST: ['Pacific/Honolulu', 'Hawaii'],
  AST: ['America/Halifax', 'Atlantic Canada'], ADT: ['America/Halifax', 'Atlantic Canada'], NST: ['America/St_Johns', 'Newfoundland'], NDT: ['America/St_Johns', 'Newfoundland'],
  GMT: ['Europe/London', 'UK / Ireland winter'], BST: ['Europe/London', 'UK summer'], UK: ['Europe/London', 'United Kingdom'], UTC: ['UTC', 'Universal'],
  CET: ['Europe/Paris', 'Central Europe'], CEST: ['Europe/Paris', 'Central Europe'], EET: ['Europe/Athens', 'Eastern Europe'], EEST: ['Europe/Athens', 'Eastern Europe'], WET: ['Europe/Lisbon', 'Western Europe'],
  IST: ['Asia/Kolkata', 'India'], GST: ['Asia/Dubai', 'Gulf / Dubai'], SGT: ['Asia/Singapore', 'Singapore'], HKT: ['Asia/Hong_Kong', 'Hong Kong'], JST: ['Asia/Tokyo', 'Japan'], KST: ['Asia/Seoul', 'Korea'],
  AEST: ['Australia/Sydney', 'Sydney / Melbourne'], AEDT: ['Australia/Sydney', 'Sydney / Melbourne'], ACST: ['Australia/Adelaide', 'Adelaide'], ACDT: ['Australia/Adelaide', 'Adelaide'], AWST: ['Australia/Perth', 'Perth'],
  NZST: ['Pacific/Auckland', 'New Zealand'], NZDT: ['Pacific/Auckland', 'New Zealand'], SAST: ['Africa/Johannesburg', 'South Africa'], EAT: ['Africa/Nairobi', 'East Africa'], WAT: ['Africa/Lagos', 'West Africa'],
};
const ZONES = ['Europe/London', 'Europe/Dublin', 'Europe/Belgrade', 'Europe/Paris', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'Australia/Sydney', 'Australia/Perth', 'Pacific/Auckland', 'Asia/Dubai', 'Asia/Singapore'];
function zoneOf(z: string) {   // what was typed -> a real time zone name, or '' if it isn't one
  const t = String(z || '').trim(); if (!t) return '';
  const m = /^(?:UTC|GMT)\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i.exec(t);   // "UTC+2", "GMT-5" (Etc/GMT zones have the sign reversed)
  if (m) { const h = +m[2]; return h <= 14 ? 'Etc/GMT' + (m[1] === '+' ? '-' : '+') + h : ''; }
  const a = ABBR[t.toUpperCase().replace(/[^A-Z]/g, '')]; if (a) return a[0];
  try { new Intl.DateTimeFormat([], { timeZone: t }); return t; } catch { return ''; }
}
function localTime(zone: string) {   // "14:32 EDT" -- their time right now, with today's abbreviation
  const z = zoneOf(zone); if (!z) return '';
  try {
    const fmt = (loc: string) => new Intl.DateTimeFormat(loc, { timeZone: z, hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' }).format(new Date());
    let t = fmt('en-US');
    if (/GMT[+-]/.test(t)) { const g = fmt('en-GB'); if (!/GMT[+-]/.test(g) || /BST|CES?T|EES?T/.test(g)) t = g; }
    return t.replace(/^24:/, '00:');
  } catch { return ''; }
}
const blank = (): Client => ({ id: uid(), name: '', status: 'Lead', pay: 'Unpaid', revenue: 0, cash: 0, phone: '', email: '', nextDue: '', nextAmount: '', signed: '', timezone: '', engagement: 0, goal: '', program: '', source: '', lastContact: '', nextCheckin: '', renewal: '', notes: '', link: '' });
const owed = (c: Client) => Math.max(0, num(c.revenue) - num(c.cash));
const isOverdue = (c: Client) => Boolean(c.nextDue) && c.nextDue < today() && c.pay !== 'PAID' && c.status !== 'Churned' && c.status !== 'Completed' && owed(c) > 0;
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);
const dueClass = (c: Client) => { if (!c.nextDue || c.pay === 'PAID') return ''; const dd = daysBetween(today(), c.nextDue); return dd < 0 ? 'biz-out' : dd <= 7 ? 'biz-warn' : ''; };
const stop = (e: React.KeyboardEvent) => e.stopPropagation();
const SORTS: Record<string, [string, (a: Client, b: Client) => number]> = {
  due: ['Sort: next payment due', (a, b) => (a.nextDue || '9999').localeCompare(b.nextDue || '9999')], owed: ['Sort: most owed', (a, b) => owed(b) - owed(a)],
  revenue: ['Sort: revenue', (a, b) => num(b.revenue) - num(a.revenue)], signed: ['Sort: newest signed', (a, b) => (b.signed || '').localeCompare(a.signed || '')],
  engagement: ['Sort: engagement', (a, b) => (b.engagement || 0) - (a.engagement || 0)], name: ['Sort: name', (a, b) => a.name.localeCompare(b.name)],
};

// one incoming written into Accounting's saved data
async function recordIncoming(c: Client, amount: number, when: string, method: string) {
  const d = await api<{ entries?: unknown[] }>('/api/records?name=accounting');
  const entries = [...(d.entries || []), { id: uid(), type: 'in', date: when, amount: num(amount), category: c.pay === 'PAID' ? 'Coaching sale' : 'Recurring payment', method, party: c.name, note: 'from Clients tab', recurring: '' }];
  await api('/api/records?name=accounting', { method: 'POST', body: JSON.stringify({ ...d, entries }) });
}

export function ClientsPage() {
  const { doc, update, status } = useRecord<Doc>('clients', { clients: [] });
  const [q, setQ] = useState(''), [filter, setFilter] = useState('All'), [payFilter, setPayFilter] = useState(''), [sort, setSort] = useState('due'), [openId, setOpenId] = useState<string | null>(null);
  const all = doc?.clients || [];
  const list = useMemo(() => all.filter(c => (filter === 'All' || c.status === filter) && (!payFilter || c.pay === payFilter) && (!q || [c.name, c.email, c.phone, c.goal, c.notes, c.program].join(' ').toLowerCase().includes(q.toLowerCase()))).sort(SORTS[sort][1]), [all, filter, payFilter, q, sort]);
  const setC = (id: string, patch: Partial<Client>) => update(d => { const c = d.clients.find(x => x.id === id); if (c) Object.assign(c, patch); return d; });
  // closing (or leaving) a client whose cash collected isn't all in Accounting yet: offer to add the difference
  const offerAccounting = async (c: Client) => {
    const diff = num(c.cash) - num(c.acctLogged) - num(c.acctDeclined);
    if (!c.name || diff <= 0) return;
    if (!confirm(`Add ${money(diff)} from ${c.name} to Accounting as an incoming?\n\nOK = add it (you'll pick the date and how they paid)\nCancel = not now`)) { setC(c.id, { acctDeclined: num(c.acctDeclined) + diff }); return; }
    const when = prompt('Date received (YYYY-MM-DD):', c.signed || today()); if (!when) return;
    const method = prompt('How were you paid? (Stripe, PayPal, Bank transfer, Wise, Cash…):', 'Stripe') || '';
    try { await recordIncoming(c, diff, when, method); setC(c.id, { acctLogged: num(c.acctLogged) + diff }); toast(`Added ${money(diff)} to Accounting`); }
    catch (e) { alert('Could not add it to Accounting: ' + (e instanceof Error ? e.message : e)); }
  };
  const openPanel = (id: string | null) => { const prev = all.find(x => x.id === openId); setOpenId(id); if (prev && prev.id !== id) setTimeout(() => offerAccounting(prev), 50); };
  const addPayment = async (c: Client) => {
    const a = prompt(`Payment received from ${c.name || 'this client'} ($):`, String(c.nextAmount || '')); if (a === null || !num(a)) return;
    const when = prompt('Date received (YYYY-MM-DD):', today()); if (!when) return;
    const method = prompt('How were you paid? (Stripe, PayPal, Bank transfer, Wise, Cash…):', 'Stripe') || '';
    const next = prompt('Next payment due date (YYYY-MM-DD) — leave empty if none:', '');
    const patch: Partial<Client> = { cash: num(c.cash) + num(a), lastContact: c.lastContact || when };
    if (owed({ ...c, ...patch } as Client) <= 0 && num(c.revenue) > 0) Object.assign(patch, { pay: 'PAID', nextDue: '', nextAmount: '' });
    else { if (c.pay === 'Unpaid' || c.pay === 'Overdue') patch.pay = 'Deposit paid'; if (next) patch.nextDue = next; }
    setC(c.id, patch);
    try { await recordIncoming({ ...c, ...patch } as Client, num(a), when, method); setC(c.id, { acctLogged: num(c.acctLogged) + num(a) }); }
    catch (e) { alert('Saved on the client, but could not add it to Accounting: ' + (e instanceof Error ? e.message : e)); }
  };
  if (!doc) return <article className="selfdev-doc biz-doc"><h2>👥 Clients</h2><p className="biz-dim">{status || 'Loading…'}</p></article>;
  const active = all.filter(c => ['Signed', 'Active'].includes(c.status)), revenue = all.reduce((a, c) => a + num(c.revenue), 0), cash = all.reduce((a, c) => a + num(c.cash), 0);
  const overdue = all.filter(isOverdue), due7 = all.filter(c => c.nextDue && c.pay !== 'PAID' && daysBetween(today(), c.nextDue) >= 0 && daysBetween(today(), c.nextDue) <= 7);
  const open = all.find(c => c.id === openId);
  return <div className={open ? 'cl-panel-open' : ''}><article className="selfdev-doc biz-doc">
    <h2>👥 Clients <span className="bk-status">{status}</span></h2>
    <div className="biz-cards">
      <div className="biz-card"><div className="biz-dim">Active clients</div><b>{active.length}</b></div>
      <div className="biz-card"><div className="biz-dim">Total revenue sold</div><b>{money(revenue)}</b></div>
      <div className="biz-card"><div className="biz-dim">Cash collected</div><b className="biz-in">{money(cash)}</b></div>
      <div className="biz-card"><div className="biz-dim">Still to collect</div><b className={revenue - cash > 0 ? 'biz-warn' : ''}>{money(Math.max(0, revenue - cash))}</b></div>
      <div className="biz-card"><div className="biz-dim">Overdue</div><b className={overdue.length ? 'biz-out' : ''}>{overdue.length} · {money(overdue.reduce((a, c) => a + (num(c.nextAmount) || owed(c)), 0))}</b></div>
      <div className="biz-card"><div className="biz-dim">Due in 7 days</div><b>{due7.length}</b></div></div>
    <div className="biz-bar-top"><input placeholder="Search name, email, phone, goal, notes…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={stop} style={{ flex: 1, minWidth: 200 }} />
      <select value={payFilter} onChange={e => setPayFilter(e.target.value)}><option value="">Any payment status</option>{PAY.map(p => <option key={p}>{p}</option>)}</select>
      <select value={sort} onChange={e => setSort(e.target.value)}>{Object.entries(SORTS).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}</select>
      <button className="ctl biz-primary" onClick={() => { const c = blank(); update(d => { d.clients.unshift(c); return d; }); openPanel(c.id); }}>＋ Add client</button>
      <button className="ctl" onClick={() => download('clients.csv', csv([['Name', 'Status', 'Payment', 'Revenue', 'Cash collected', 'Owed', 'Next due', 'Next amount', 'Phone', 'Email', 'Timezone', 'Signed', 'Engagement', 'Goal', 'Program', 'Source', 'Notes'], ...all.map(c => [c.name, c.status, c.pay, c.revenue, c.cash, owed(c), c.nextDue, c.nextAmount, c.phone, c.email, c.timezone, c.signed, c.engagement, c.goal, c.program, c.source, c.notes])]))}>⬇ CSV</button></div>
    <div className="biz-chips"><button className={filter === 'All' ? 'on' : ''} onClick={() => setFilter('All')}>All {all.length}</button>{STATUS.map(s => <button key={s} className={filter === s ? 'on' : ''} onClick={() => setFilter(s)}>{s} {all.filter(c => c.status === s).length}</button>)}</div>
    <div className="biz-scroll"><table className="biz-table biz-click"><thead><tr><th>Client</th><th>Status</th><th>Payment</th><th className="r">Revenue</th><th className="r">Cash</th><th className="r">Owed</th><th>Next due</th><th>Engagement</th><th>Goal</th></tr></thead><tbody>
      {list.length ? list.map(c => <tr key={c.id} onClick={() => openPanel(c.id)}><td><b>{c.name || '(no name)'}</b>{c.timezone && <> <span className="biz-dim">{localTime(c.timezone)}</span></>}</td><td><span className="biz-pill">{c.status}</span></td>
        <td><span className={`biz-pill ${c.pay === 'PAID' ? 'ok' : c.pay === 'Overdue' ? 'bad' : ''}`}>{c.pay}</span></td><td className="r">{money(num(c.revenue))}</td><td className="r biz-in">{money(num(c.cash))}</td><td className="r">{money(owed(c))}</td>
        <td className={dueClass(c)}>{c.nextDue}{c.nextAmount ? <> <span className="biz-dim">{money(num(c.nextAmount))}</span></> : null}</td><td><span className="biz-stars">{stars(c.engagement || 0)}</span></td><td className="biz-trunc">{c.goal}</td></tr>)
        : <tr><td colSpan={9} className="biz-dim">No clients match. Add one with “＋ Add client”.</td></tr>}
    </tbody></table></div>
  </article>
    {open && <Panel key={`${open.id}-${open.cash}-${open.pay}-${open.nextDue}-${open.nextAmount}`} c={open} onSet={patch => setC(open.id, patch)} onClose={() => openPanel(null)} onPay={() => addPayment(open)}
      onDelete={() => { if (confirm(`Delete ${open.name || 'this client'}? This can't be undone.`)) { update(d => { d.clients = d.clients.filter(x => x.id !== open.id); return d; }); setOpenId(null); } }} />}
  </div>;
}

function Panel({ c, onSet, onClose, onPay, onDelete }: { c: Client; onSet: (p: Partial<Client>) => void; onClose: () => void; onPay: () => void; onDelete: () => void }) {
  const NUMERIC = ['revenue', 'cash', 'nextAmount'];
  const save = (k: keyof Client, v: string) => onSet({ [k]: NUMERIC.includes(k) ? (v === '' ? '' : num(v)) : v } as Partial<Client>);
  const f = (label: string, k: keyof Client, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => <label className="cl-f"><span>{label}</span><input defaultValue={String(c[k] ?? '')} onBlur={e => e.target.value !== String(c[k] ?? '') && save(k, e.target.value)} onKeyDown={stop} {...extra} /></label>;
  const sel = (label: string, k: keyof Client, opts: string[]) => <label className="cl-f"><span>{label}</span><select value={String(c[k])} onChange={e => save(k, e.target.value)}>{opts.map(o => <option key={o}>{o}</option>)}</select></label>;
  const digits = String(c.phone || '').replace(/[^0-9]/g, ''), lt = c.timezone ? localTime(c.timezone) : '';
  return <aside id="cl-panel" style={{ display: 'flex' }}>
    <div className="cl-panel-head"><b>{c.name || 'New client'}</b><span style={{ flex: 1 }} /><button className="ctl" title="Close" onClick={onClose}>✕</button></div>
    <div className="cl-panel-body">
      {f('Name', 'name')}{sel('Pipeline status', 'status', STATUS)}{sel('Payment status', 'pay', PAY)}
      <div className="cl-row2">{f('Revenue (contract) $', 'revenue', { inputMode: 'decimal' })}{f('Cash collected $', 'cash', { inputMode: 'decimal' })}</div>
      <div className="cl-row2">{f('Next payment due', 'nextDue', { type: 'date' })}{f('Next amount $', 'nextAmount', { inputMode: 'decimal' })}</div>
      <div className="cl-owed">Still to collect: <b>{money(owed(c))}</b><button className="ctl biz-primary" onClick={onPay}>💰 Add payment</button></div>
      <div className="cl-row2">{f('Phone', 'phone', { type: 'tel' })}{f('Email', 'email', { type: 'email' })}</div>
      <div className="cl-links">{c.phone && <a className="ctl" href={`tel:${c.phone}`}>📞 Call</a>}{digits && <a className="ctl" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${digits}`}>WhatsApp ↗</a>}{c.email && <a className="ctl" href={`mailto:${c.email}`}>✉ Email</a>}{c.link && <a className="ctl" target="_blank" rel="noopener noreferrer" href={c.link}>CRM / Aloware ↗</a>}</div>
      <label className="cl-f"><span>Timezone {c.timezone && lt ? `· now ${lt} there` : c.timezone ? '· not recognised' : ''}</span><input list="cl-zones" defaultValue={c.timezone} placeholder="EST, PST, GMT, CET, Europe/London…" onBlur={e => e.target.value !== c.timezone && save('timezone', e.target.value)} onKeyDown={stop} /></label>
      <datalist id="cl-zones">{Object.entries(ABBR).map(([k, v]) => <option key={k} value={k} label={v[1]} />)}{ZONES.map(z => <option key={z} value={z} />)}</datalist>
      <div className="cl-row2">{f('Date signed', 'signed', { type: 'date' })}{f('Renewal / end date', 'renewal', { type: 'date' })}</div>
      <div className="cl-row2">{f('Last contact', 'lastContact', { type: 'date' })}{f('Next check-in', 'nextCheckin', { type: 'date' })}</div>
      <label className="cl-f"><span>Engagement</span><span className="biz-stars cl-stars">{[1, 2, 3, 4, 5].map(n => <b key={n} className={n <= (c.engagement || 0) ? 'on' : ''} onClick={e => { e.preventDefault(); onSet({ engagement: c.engagement === n ? 0 : n }); }}>★</b>)}</span></label>
      <label className="cl-f"><span>Goal</span><textarea rows={2} defaultValue={c.goal} onBlur={e => e.target.value !== c.goal && save('goal', e.target.value)} onKeyDown={stop} /></label>
      <div className="cl-row2">{f('Program / offer', 'program')}{f('Source', 'source', { placeholder: 'content, ad, referral…' })}</div>
      {f('CRM / Aloware / folder link', 'link', { placeholder: 'https://…' })}
      <label className="cl-f"><span>Notes</span><textarea rows={5} defaultValue={c.notes} onBlur={e => e.target.value !== c.notes && save('notes', e.target.value)} onKeyDown={stop} /></label>
      <button className="ctl" style={{ color: '#dc2626' }} onClick={onDelete}>🗑 Delete client</button>
    </div>
  </aside>;
}
