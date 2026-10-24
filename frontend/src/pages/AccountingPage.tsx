import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { csv, download, money, monthOf, num, today, toast, uid } from '../biz';
import { useRecord } from '../useRecord';

// 💰 Accounting, with Excel-style sheets in sub-tabs:
//   📊 Summary    month totals, bridge-to-goal bar, breakdowns by category / how you were paid, subscriptions cost
//   ⬆ Incomings   a spreadsheet: Date | Amount | Client / source | What for | Paid via | Note
//   ⬇ Outgoings   a spreadsheet: Date | Amount | Vendor | Category | Paid with | Recurring | Note
// The sheets behave like a spreadsheet: click a cell and type (Enter ↓, Tab →, arrows move, Esc cancels, Delete clears, F2 / double-click edits),
// paste a block copied from Excel / Google Sheets, sort by clicking a column letter, the blank row at the bottom adds an entry, SUM row at the foot.
// Records store "accounting"; the sub-tab you were on is remembered in this browser (localStorage "acSub").
type Entry = { id: string; type: 'in' | 'out'; date: string; amount: number | string; category: string; method: string; party: string; note: string; recurring: string };
type Doc = { entries: Entry[]; customOut: string[]; customIn: string[]; customMethods: string[] };
type Col = { k: keyof Entry; l: string; t: 'date' | 'money' | 'list' | 'text'; w: number; list?: () => string[] };
const OUT = ['Subscriptions', 'Software & tools', 'Advertising', 'Team & contractors', 'Education & coaching', 'Equipment', 'Travel', 'Food & household', 'Rent & utilities', 'Taxes & fees', 'Health', 'Other'];
const IN = ['Coaching sale', 'Recurring payment', 'Commission', 'Content / sponsorship', 'Product / course', 'Other'];
const METHODS = ['Stripe', 'PayPal', 'Bank transfer', 'Wise', 'Cash', 'Crypto', 'Card', 'Other'];
const GOAL = 50000;   // the monthly goal: locked in, not editable
const SUBS = ['summary', 'incomings', 'outgoings'] as const;
const colName = (i: number) => String.fromCharCode(65 + i);
const store = (k: string, v?: string) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { /* blocked */ } return null; };
function parseDate(s: string): string | null {   // today / t, yesterday / y, 2026-10-16, or day first: 16/10, 16/10/26, 16.10.2026
  const t = String(s).trim().toLowerCase(); if (!t) return '';
  const d = new Date();
  if (t === 't' || t === 'today') return today();
  if (t === 'y' || t === 'yesterday') { d.setDate(d.getDate() - 1); return d.toLocaleDateString('en-CA'); }
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(t)) { const [y, m, dd] = t.split('-'); return `${y}-${m.padStart(2, '0')}-${dd.padStart(2, '0')}`; }
  const m = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/.exec(t);
  if (m) { const y = m[3] ? (m[3].length === 2 ? '20' + m[3] : m[3]) : String(d.getFullYear()); return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  return null;
}
const total = (list: Entry[], t: string) => list.filter(e => e.type === t).reduce((a, e) => a + num(e.amount), 0);
const cellText = (col: Col, v: unknown) => col.t === 'money' ? (v === '' || v == null ? '' : num(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : col.k === 'recurring' ? (v === 'monthly' ? 'Monthly' : v === 'yearly' ? 'Yearly' : String(v || '')) : String(v ?? '');

export function AccountingPage() {
  const { doc, update, status } = useRecord<Doc>('accounting', { entries: [], customOut: [], customIn: [], customMethods: [] });
  const [sub, setSubState] = useState<typeof SUBS[number]>(() => { const v = store('acSub'); return (SUBS as readonly string[]).includes(v || '') ? v as typeof SUBS[number] : 'summary'; });
  const [month, setMonth] = useState('all'), [clientNames, setClientNames] = useState<string[]>([]);
  useEffect(() => { api<{ clients?: Array<{ name: string }> }>('/api/records?name=clients').then(d => setClientNames((d.clients || []).map(c => c.name).filter(Boolean))).catch(() => {}); }, []);
  const setSub = (v: typeof SUBS[number]) => { setSubState(v); store('acSub', v); };
  if (!doc) return <article className="selfdev-doc biz-doc"><h2>💰 Accounting</h2><p className="biz-dim">{status || 'Loading…'}</p></article>;
  const months = [...new Set(doc.entries.map(e => monthOf(e.date)).filter(Boolean))].sort().reverse();
  const monthPicker = <label>Period <select value={month} onChange={e => setMonth(e.target.value)}><option value="all">All time</option>{months.map(m => <option key={m}>{m}</option>)}</select></label>;
  return <article className="selfdev-doc biz-doc">
    <h2>💰 Accounting <span className="bk-status">{status}</span></h2>
    <div className="ac-subtabs">{([['summary', '📊 Summary'], ['incomings', '⬆ Incomings'], ['outgoings', '⬇ Outgoings']] as const).map(([k, l]) => <button key={k} className={sub === k ? 'on' : ''} onClick={() => setSub(k)}>{l} {k !== 'summary' && <span className="biz-dim">{doc.entries.filter(e => e.type === (k === 'incomings' ? 'in' : 'out')).length}</span>}</button>)}</div>
    {sub === 'summary' ? <Summary doc={doc} month={month} picker={monthPicker} onRelog={e => { update(d => { d.entries.push({ ...e, id: uid(), date: today() }); return d; }); toast('Logged again, dated today'); }} />
      : <Sheet key={sub} type={sub === 'incomings' ? 'in' : 'out'} doc={doc} update={update} month={month} picker={monthPicker} clientNames={clientNames} />}
  </article>;
}

function subscriptions(doc: Doc) {
  const subs: Record<string, Entry> = {};
  doc.entries.filter(e => e.type === 'out' && (e.recurring === 'monthly' || e.recurring === 'yearly' || e.category === 'Subscriptions')).forEach(e => { const k = (e.party || e.note || e.category).toLowerCase().trim(); if (!subs[k] || e.date > subs[k].date) subs[k] = e; });
  return Object.values(subs).map(e => { const yearly = e.recurring === 'yearly', per = num(e.amount) / (yearly ? 12 : 1), d = new Date((e.date || today()) + 'T12:00:00'); if (yearly) d.setFullYear(d.getFullYear() + 1); else d.setMonth(d.getMonth() + 1); return { e, per, next: d.toLocaleDateString('en-CA') }; }).sort((a, b) => b.per - a.per);
}

function Summary({ doc, month, picker, onRelog }: { doc: Doc; month: string; picker: React.ReactNode; onRelog: (e: Entry) => void }) {
  const view = doc.entries.filter(e => month === 'all' || monthOf(e.date) === month);
  const inc = total(view, 'in'), out = total(view, 'out'), net = inc - out, monthIn = total(doc.entries.filter(e => monthOf(e.date) === today().slice(0, 7)), 'in');
  const subs = subscriptions(doc), burn = subs.reduce((a, s) => a + s.per, 0);
  const bars = (key: 'category' | 'method', type: string, fallback: string) => {
    const m: Record<string, number> = {}; view.filter(e => e.type === type).forEach(e => { const k = e[key] || fallback; m[k] = (m[k] || 0) + num(e.amount); });
    const tot = Object.values(m).reduce((a, b) => a + b, 0) || 1, rows = Object.entries(m).sort((a, b) => b[1] - a[1]);
    return rows.length ? rows.map(([k, v]) => <div className="biz-bar" key={k}><div className="biz-bar-head"><span>{k}</span><b>{money(v)}</b><span className="biz-dim">{Math.round(100 * v / tot)}%</span></div><div className="biz-bar-track"><div className={`biz-bar-fill ${type}`} style={{ width: `${Math.max(2, 100 * v / tot)}%` }} /></div></div>) : <p className="biz-dim">Nothing yet.</p>;
  };
  return <>
    <div className="biz-bar-top">{picker}</div>
    <div className="biz-cards"><div className="biz-card"><div className="biz-dim">Incomings</div><b className="biz-in">{money(inc)}</b></div><div className="biz-card"><div className="biz-dim">Outgoings</div><b className="biz-out">{money(out)}</b></div>
      <div className="biz-card"><div className="biz-dim">Net</div><b className={net >= 0 ? 'biz-in' : 'biz-out'}>{money(net)}</b></div><div className="biz-card"><div className="biz-dim">Subscriptions / month</div><b>{money(burn)}</b></div></div>
    <div className="biz-bridge"><div className="biz-bar-head"><span>Bridge to your goal (this month)</span><b>{money(monthIn)} of {money(GOAL)}</b></div>
      <div className="biz-bar-track big"><div className="biz-bar-fill in" style={{ width: `${Math.min(100, 100 * monthIn / GOAL)}%` }} /></div>
      <div className="biz-dim">{monthIn >= GOAL ? '🎯 Goal reached.' : `${money(GOAL - monthIn)} to go (${Math.round(100 * monthIn / GOAL)}%)`}</div></div>
    <div className="biz-two"><div><h3>Outgoings by category</h3>{bars('category', 'out', 'Uncategorised')}<h3>Incomings by how you were paid</h3>{bars('method', 'in', 'Not set')}</div>
      <div><h3>Subscriptions <span className="biz-dim">{money(burn)}/month</span></h3>
        {subs.length ? subs.map(s => <div className="biz-sub" key={s.e.id}><span>{s.e.party || s.e.note || s.e.category}</span><b>{money(s.per)}/mo</b><span className="biz-dim">next ~{s.next}</span><button className="ctl" title="Log this payment again, dated today" onClick={() => onRelog(s.e)}>＋ Log</button></div>) : <p className="biz-dim">Mark an outgoing Monthly or Yearly (or use the Subscriptions category) and it shows here.</p>}
        <button className="ctl" style={{ marginTop: 14 }} onClick={() => download('accounting.csv', csv([['Date', 'Type', 'Amount', 'Who', 'Category', 'Method', 'Recurring', 'Note'], ...doc.entries.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')).map(e => [e.date, e.type === 'in' ? 'Incoming' : 'Outgoing', e.amount, e.party, e.category, e.method, e.recurring || '', e.note])]))}>⬇ Export everything (CSV)</button></div></div>
  </>;
}

function Sheet({ type, doc, update, month, picker, clientNames }: { type: 'in' | 'out'; doc: Doc; update: (fn: (d: Doc) => Doc) => void; month: string; picker: React.ReactNode; clientNames: string[] }) {
  const [sort, setSort] = useState<{ k: keyof Entry; dir: number } | null>(null), [sel, setSel] = useState({ r: 0, c: 0 }), [editing, setEditing] = useState<{ r: number; c: number; start: string | null } | null>(null), [bad, setBad] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const outCats = [...OUT, ...(doc.customOut || [])], inCats = [...IN, ...(doc.customIn || [])], meth = [...METHODS, ...(doc.customMethods || [])];
  const cols: Col[] = useMemo(() => {
    const base: Col[] = [{ k: 'date', l: 'Date', t: 'date', w: 110 }, { k: 'amount', l: 'Amount', t: 'money', w: 110 }];
    return type === 'in'
      ? [...base, { k: 'party', l: 'Client / source', t: 'list', w: 190, list: () => clientNames }, { k: 'category', l: 'What for', t: 'list', w: 170, list: () => inCats }, { k: 'method', l: 'Paid via', t: 'list', w: 130, list: () => meth }, { k: 'note', l: 'Note', t: 'text', w: 260 }]
      : [...base, { k: 'party', l: 'Vendor', t: 'list', w: 170, list: () => [...new Set(doc.entries.filter(e => e.type === 'out').map(e => e.party).filter(Boolean))] }, { k: 'category', l: 'Category', t: 'list', w: 170, list: () => outCats }, { k: 'method', l: 'Paid with', t: 'list', w: 120, list: () => meth }, { k: 'recurring', l: 'Recurring', t: 'list', w: 100, list: () => ['One-off', 'Monthly', 'Yearly'] }, { k: 'note', l: 'Note', t: 'text', w: 220 }];
  }, [type, doc, clientNames]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = useMemo(() => {
    let r = doc.entries.filter(e => e.type === type && (month === 'all' || monthOf(e.date) === month));
    if (sort) r = r.slice().sort((a, b) => { const x = a[sort.k] ?? '', y = b[sort.k] ?? ''; return sort.dir * (sort.k === 'amount' ? num(x) - num(y) : String(x).localeCompare(String(y))); });
    return r;
  }, [doc, type, month, sort]);
  const nRows = rows.length + 1;   // + the blank row that adds an entry
  const select = (r: number, c: number) => setSel({ r: Math.max(0, Math.min(nRows - 1, r)), c: Math.max(0, Math.min(cols.length - 1, c)) });
  useEffect(() => { wrap.current?.querySelector('td.sel')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [sel]);
  // write one cell into a copy of the document; false if the value isn't valid (a date it can't read)
  const writeCell = (d: Doc, list: Entry[], r: number, c: number, raw: string): boolean => {
    const col = cols[c]; let v: string | number = raw.trim(); let e = list[r] ? d.entries.find(x => x.id === list[r].id) : undefined;
    if (col.t === 'date') { if (v !== '') { const p = parseDate(String(v)); if (p === null) return false; v = p; } }
    if (col.t === 'money') v = v === '' ? '' : num(v);
    if (col.k === 'recurring') v = /^m/i.test(String(v)) ? 'monthly' : /^y/i.test(String(v)) ? 'yearly' : '';
    if (col.k === 'category' && v && !(type === 'in' ? inCats : outCats).some(x => x.toLowerCase() === String(v).toLowerCase())) { const key = type === 'in' ? 'customIn' : 'customOut'; d[key] = [...(d[key] || []), String(v)]; }
    if (col.k === 'method' && v && !meth.some(x => x.toLowerCase() === String(v).toLowerCase())) d.customMethods = [...(d.customMethods || []), String(v)];
    if (!e) { if (v === '' || v === 0) return true; e = { id: uid(), type, date: today(), amount: '', category: '', method: '', party: '', note: '', recurring: '' }; d.entries.push(e); list.push(e); }
    (e as Record<string, unknown>)[col.k] = v;
    return true;
  };
  const commit = (r: number, c: number, raw: string) => { let ok = true; update(d => { ok = writeCell(d, rows.slice(), r, c, raw); return d; }); return ok; };
  const finishEdit = (value: string | null, dr: number, dc: number) => {
    if (!editing) return;
    const { r, c } = editing;
    if (value !== null) { const col = cols[c], e = rows[r]; const old = e ? (col.t === 'money' ? (e[col.k] === '' ? '' : String(e[col.k])) : col.k === 'recurring' ? cellText(col, e[col.k]) : String(e[col.k] ?? '')) : '';
      if (value !== old && col.t === 'date' && value.trim() && parseDate(value) === null) { setBad(true); return; }
      if (value !== old) commit(r, c, value); }
    setBad(false); setEditing(null); select(r + dr, c + dc); wrap.current?.focus();
  };
  const keys = (ev: React.KeyboardEvent) => {
    if ((ev.target as HTMLElement).classList.contains('ac-edit')) return;
    ev.stopPropagation();
    const { r, c } = sel, k = ev.key;
    if (k === 'ArrowDown' || k === 'Enter') { ev.preventDefault(); select(r + 1, c); } else if (k === 'ArrowUp') { ev.preventDefault(); select(r - 1, c); }
    else if (k === 'ArrowRight' || (k === 'Tab' && !ev.shiftKey)) { ev.preventDefault(); select(r, c + 1); } else if (k === 'ArrowLeft' || (k === 'Tab' && ev.shiftKey)) { ev.preventDefault(); select(r, c - 1); }
    else if (k === 'F2') { ev.preventDefault(); setEditing({ r, c, start: null }); }
    else if (k === 'Delete' || k === 'Backspace') { ev.preventDefault(); if (rows[r]) commit(r, c, ''); }
    else if (k.length === 1 && !ev.metaKey && !ev.ctrlKey && !ev.altKey) { ev.preventDefault(); setEditing({ r, c, start: k }); }
  };
  const paste = (ev: React.ClipboardEvent) => {   // a block copied from Excel / Google Sheets: tab-separated columns, one row per line
    if ((ev.target as HTMLElement).classList.contains('ac-edit')) return;
    const text = ev.clipboardData.getData('text'); if (!text) return; ev.preventDefault();
    const grid = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map(l => l.split('\t'));
    let skipped = 0;
    update(d => { const list = rows.slice(); grid.forEach((line, i) => line.forEach((val, j) => { const c = sel.c + j; if (c < cols.length && !writeCell(d, list, sel.r + i, c, val)) skipped++; })); return d; });
    toast(skipped ? `${skipped} cell${skipped === 1 ? '' : 's'} skipped (dates need YYYY-MM-DD or DD/MM/YYYY)` : `Pasted ${grid.length} row${grid.length === 1 ? '' : 's'}`);
  };
  const sum = rows.reduce((a, e) => a + num(e.amount), 0);
  return <>
    <div className="biz-bar-top">{picker}<span className="biz-dim">{rows.length} rows · click a cell and type · paste from Excel / Sheets works</span><span style={{ flex: 1 }} /><b className={type === 'in' ? 'biz-in' : 'biz-out'}>{type === 'in' ? 'Total in' : 'Total out'}: {money(sum)}</b></div>
    <div className="ac-sheet-wrap" tabIndex={0} ref={wrap} onKeyDown={keys} onPaste={paste}><table className="ac-sheet"><thead>
      <tr className="ac-letters"><th className="ac-corner" />{cols.map((c, i) => <th key={c.k} style={{ minWidth: c.w }} title="Click to sort" onClick={() => setSort(cur => !cur || cur.k !== c.k ? { k: c.k, dir: 1 } : cur.dir === 1 ? { k: c.k, dir: -1 } : null)}>{colName(i)}{sort && sort.k === c.k ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}</th>)}<th className="ac-corner" /></tr>
      <tr className="ac-names"><th className="ac-corner">#</th>{cols.map(c => <th key={c.k} className={c.t === 'money' ? 'r' : ''}>{c.l}</th>)}<th className="ac-corner" /></tr></thead>
      <tbody>{[...rows, null].map((e, r) => <tr key={e ? e.id : 'new'}><th className="ac-rn">{e ? r + 1 : '＊'}</th>
        {cols.map((col, c) => { const isSel = sel.r === r && sel.c === c, isEdit = editing && editing.r === r && editing.c === c;
          return <td key={col.k} className={`${col.t === 'money' ? 'r ' : ''}${col.t === 'money' && e ? (type === 'in' ? 'biz-in ' : 'biz-out ') : ''}${isSel ? 'sel' : ''}`}
            onClick={() => { if (!isEdit) select(r, c); }} onDoubleClick={() => setEditing({ r, c, start: null })}>
            {isEdit ? <CellEditor col={col} entry={e} start={editing.start} bad={bad} onDone={finishEdit} /> : e ? cellText(col, e[col.k]) : ''}</td>; })}
        <th className="ac-rn ac-x">{e && <button className="ac-delrow" title="Delete row" onClick={() => { if (confirm(`Delete this row (${money(num(e.amount))})?`)) update(d => { d.entries = d.entries.filter(x => x.id !== e.id); return d; }); }}>✕</button>}</th></tr>)}</tbody>
      <tfoot><tr className="ac-sumrow"><th className="ac-corner">Σ</th>{cols.map((c, i) => <td key={c.k} className={c.t === 'money' ? 'r' : ''}>{i === 0 ? 'SUM' : c.t === 'money' ? <b>{money(sum)}</b> : ''}</td>)}<th className="ac-corner" /></tr></tfoot></table></div>
  </>;
}

// a cell being typed into: Enter saves and moves down, Tab saves and moves across, Esc cancels, clicking away saves
function CellEditor({ col, entry, start, bad, onDone }: { col: Col; entry: Entry | null; start: string | null; bad: boolean; onDone: (v: string | null, dr: number, dc: number) => void }) {
  const ref = useRef<HTMLInputElement>(null), done = useRef(false);
  const old = entry ? (col.t === 'money' ? (entry[col.k] === '' ? '' : String(entry[col.k])) : col.k === 'recurring' ? cellText(col, entry[col.k]) : String(entry[col.k] ?? '')) : '';
  useEffect(() => { const el = ref.current; if (!el) return; el.focus(); if (start == null) el.select(); }, [start]);
  const finish = (v: string | null, dr: number, dc: number) => { if (done.current && !bad) return; done.current = true; onDone(v, dr, dc); setTimeout(() => { done.current = false; }, 0); };
  return <><input ref={ref} className={`ac-edit${bad ? ' bad' : ''}`} defaultValue={start != null ? start : old} list={col.t === 'list' ? 'ac-dl' : undefined} placeholder={col.t === 'date' ? 'YYYY-MM-DD' : undefined}
    onKeyDown={ev => { ev.stopPropagation(); const v = (ev.target as HTMLInputElement).value; if (ev.key === 'Enter') { ev.preventDefault(); finish(v, 1, 0); } else if (ev.key === 'Tab') { ev.preventDefault(); finish(v, 0, ev.shiftKey ? -1 : 1); } else if (ev.key === 'Escape') { ev.preventDefault(); finish(null, 0, 0); } }}
    onBlur={ev => finish(ev.target.value, 0, 0)} />
    {col.t === 'list' && <datalist id="ac-dl">{(col.list?.() || []).map(x => <option key={x} value={x} />)}</datalist>}</>;
}
