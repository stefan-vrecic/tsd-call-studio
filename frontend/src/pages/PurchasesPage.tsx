import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import SEEDS from '../data/purchase-seeds.json';

// 🛒 Purchases: your purchase list -- click 1-4 stars for priority (the list sorts itself by stars, 4 first; drag a row by its ⠿ grip to
// re-order rows with the same stars), double-click an item's text to edit it, right-click a row to pick its associations (Time, Joy,
// Status ...: they show as the (Tag/Tag) in front). The built-in items are data/purchase-seeds.json ("p0", "p1" ...); your own ones,
// the order, stars, re-wordings, associations and the title are saved on the server (/api/purchase-list; the voice agent reads it too).
// On the right: a notes pad (/api/purchase-notes) that adds up every $ amount you write, and can be minimised.
type Saved = { title?: string; items?: Array<{ id: string; text: string }>; order?: string[]; stars?: Record<string, number>; texts?: Record<string, string>; tags?: Record<string, string[]> };
const DEFAULT_TITLE = 'Purchase List';
const TAGS = ['Time', 'Wealth', 'Freedom', 'Joy', 'Status', 'Comfort', 'Necessity', 'Family'];
const TAG_IDEAS = ['Health', 'Growth', 'Skill', 'Sleep', 'Fun'];
const split = (t: string) => { const m = /^\(([^)]+)\)\s*(.*)$/.exec(t); return m ? { tags: m[1].split('/').map(x => x.trim()).filter(Boolean), body: m[2] } : { tags: [] as string[], body: t }; };
// the sum: one-off amounts add up (a range adds its low end to the low total and its high end to the high total); "$200 a month" / "$80/month"
// add up separately; bracketed notes like "(450 USD in NZ)" are ignored, except an extra cost like "(+ $300)"
const MONEY = /\$\s?(\d[\d,]*(?:\.\d+)?)(?:\s*[–-]\s*\$?\s?(\d[\d,]*(?:\.\d+)?))?\+?(\s*(?:\/\s*month|a month|per month|\/\s*mo\b))?/gi;
const n = (t: string) => parseFloat(String(t).replace(/,/g, ''));
const fmt = (x: number) => '$' + Math.round(x).toLocaleString();
const store = (k: string, v?: string) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { /* blocked */ } return null; };

function Tagged({ text }: { text: string }) { const m = /^\(([^)]+)\)\s*(.*)$/.exec(text); return m ? <><span className="pl-tag">({m[1]})</span> {m[2]}</> : <>{text}</>; }

export function PurchasesPage() {
  const [s, setS] = useState<Required<Saved>>({ title: DEFAULT_TITLE, items: [], order: SEEDS.map(x => x.id), stars: {}, texts: {}, tags: {} });
  const [editing, setEditing] = useState<string | null>(null), [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null), [drag, setDrag] = useState<string | null>(null), [over, setOver] = useState<string | null>(null);
  const timer = useRef<number>();
  useEffect(() => { api<Saved>('/api/purchase-list').then(saved => {
    const items = (saved.items || []).filter(i => i && i.id && i.text).map(i => ({ id: String(i.id), text: String(i.text) }));
    const known = new Set([...SEEDS.map(x => x.id), ...items.map(i => i.id)]);
    const order = (saved.order || []).filter(id => known.has(id)); known.forEach(id => { if (!order.includes(id)) order.push(id); });   // items added since the last save go at the end
    setS({ title: String(saved.title || DEFAULT_TITLE).replace(/\s+/g, ' ').trim() || DEFAULT_TITLE, items, order, stars: saved.stars || {}, texts: saved.texts || {}, tags: saved.tags || {} });
  }).catch(() => { /* offline: the original order, no stars */ }); }, []);
  const change = useCallback((fn: (d: Required<Saved>) => Required<Saved>) => setS(cur => {
    const next = fn(structuredClone(cur));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => fetch('/api/purchase-list', { method: 'POST', body: JSON.stringify(next), keepalive: true }).catch(() => {}), 400);
    return next;
  }), []);
  const base = (id: string) => s.texts[id] || (s.items.find(i => i.id === id) || SEEDS.find(x => x.id === id))?.text || '';
  const tagsOf = (id: string) => s.tags[id] || split(base(id)).tags;
  const plain = (id: string) => { if (!s.tags[id]) return base(id); const t = s.tags[id]; return (t.length ? `(${t.join('/')}) ` : '') + split(base(id)).body; };
  const shown = [...s.order].sort((a, b) => (s.stars[b] || 0) - (s.stars[a] || 0));   // more stars = higher up; same stars keep your dragged order
  let lo = 0, hi = 0, monthly = 0, counted = 0;
  s.order.forEach(id => { let any = false; for (const m of plain(id).replace(/^\([^)]*\)\s*/, '').replace(/\((?!\s*\+)[^)]*\)/g, '').matchAll(MONEY)) { const a = n(m[1]), b = m[2] ? n(m[2]) : a; if (m[3]) monthly += Math.min(a, b); else { lo += Math.min(a, b); hi += Math.max(a, b); } any = true; } if (any) counted++; });
  const toggleTag = (id: string, tag: string) => change(d => { const cur = (d.tags[id] || split(d.texts[id] || (d.items.find(i => i.id === id) || SEEDS.find(x => x.id === id))?.text || '').tags).slice(); const at = cur.findIndex(t => t.toLowerCase() === tag.toLowerCase()); if (at >= 0) cur.splice(at, 1); else cur.push(tag); d.tags[id] = cur; return d; });
  const [notesMin, setNotesMin] = useState(() => store('purchaseNotesMin') === '1');
  return <div id="purchase-view" className={`pn-shown${notesMin ? '' : ' pn-open'}`}>
    <NotesPad min={notesMin} setMin={m => { setNotesMin(m); store('purchaseNotesMin', m ? '1' : '0'); }} />
    <article className="selfdev-doc">
      <div className="pl-heading-row">
        <h2 id="pl-title" contentEditable suppressContentEditableWarning spellCheck={false} role="textbox" aria-label="Purchase list title" title="Click to edit · Enter to save · Escape to cancel" key={s.title}
          onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } else if (e.key === 'Escape') { e.preventDefault(); e.currentTarget.textContent = s.title; e.currentTarget.blur(); } }}
          onBlur={e => { const t = (e.currentTarget.textContent || '').replace(/\s+/g, ' ').trim() || DEFAULT_TITLE; e.currentTarget.textContent = t; if (t !== s.title) change(d => { d.title = t; return d; }); }}
          onPaste={e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); }}>{s.title}</h2>
        <button className="ctl" id="pl-add-item" onClick={() => { const text = (prompt('New purchase item (you can include a tag and price):', '(Joy) ') || '').replace(/\s+/g, ' ').trim(); if (!text || text === '(Joy)') return; const id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); change(d => { d.items.push({ id, text }); d.order.push(id); return d; }); }}>＋ Add purchase</button>
      </div>
      <div id="pl-sum" title="One-off amounts added up (a range counts its low and high end). Amounts per month are added separately. Notes in brackets are ignored.">
        <span className="pl-sum-main"><b>Total</b> {hi > lo ? `${fmt(lo)} – ${fmt(hi)}` : fmt(lo)}</span>{monthly > 0 && <span className="pl-sum-part">+ {fmt(monthly)}/month</span>}<span className="pl-sum-part">{counted} of {s.order.length} items priced</span></div>
      <ol className="purchase-list pl-live">{shown.map((id, idx) => { const custom = s.items.some(i => i.id === id), stars = s.stars[id] || 0;
        return <li key={id} className={`pl-row${drag === id ? ' dragging' : ''}${over === id ? ' drop-target' : ''}`} draggable={drag === id}
          onContextMenu={e => { e.preventDefault(); setMenu({ id, x: e.clientX, y: e.clientY }); }}
          onDragStart={e => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => { setDrag(null); setOver(null); }}
          onDragOver={e => { if (drag && drag !== id) { e.preventDefault(); setOver(id); } }} onDragLeave={() => setOver(o => o === id ? null : o)}
          onDrop={e => { e.preventDefault(); setOver(null); if (!drag || drag === id) return; const from = drag; change(d => { d.order = d.order.filter(x => x !== from); d.order.splice(d.order.indexOf(id), 0, from); return d; }); setDrag(null); }}>
          <span className="pl-grip" title="Drag to re-order" onMouseDown={() => setDrag(id)}>⠿</span><span className="pl-num">{idx + 1}.</span>
          <span className="pl-text" title="Double-click to edit · right-click to pick associations" onDoubleClick={() => setEditing(id)}>
            {editing === id ? <ItemEditor value={plain(id)} onDone={v => { setEditing(null); if (v && v !== plain(id)) change(d => { d.texts[id] = v; if (d.tags[id]) d.tags[id] = split(v).tags; return d; }); }} />
              : <Tagged text={plain(id)} />}</span>
          <span className="pl-stars">{[1, 2, 3, 4].map(k => <button key={k} className={`pl-star${k <= stars ? ' on' : ''}`} title={`Priority ${k} of 4${k === 4 ? ' (highest)' : ''}`} onClick={() => change(d => { if ((d.stars[id] || 0) === k) delete d.stars[id]; else d.stars[id] = k; return d; })}>★</button>)}</span>
          {custom && <button className="pl-delete" aria-label="Remove this custom purchase" title="Remove this custom item" onClick={() => { if (confirm(`Delete “${plain(id)}”?`)) change(d => { d.items = d.items.filter(x => x.id !== id); d.order = d.order.filter(x => x !== id); delete d.stars[id]; delete d.texts[id]; delete d.tags[id]; return d; }); }}>×</button>}
        </li>; })}</ol>
    </article>
    {menu && <TagMenu x={menu.x} y={menu.y} on={tagsOf(menu.id)} used={[...new Set(s.order.flatMap(tagsOf))]} onToggle={t => toggleTag(menu.id, t)} onClear={() => change(d => { d.tags[menu.id] = []; return d; })} onClose={() => setMenu(null)} />}
  </div>;
}

// double-click an item's text: Enter / clicking away saves, Esc cancels
function ItemEditor({ value, onDone }: { value: string; onDone: (v: string | null) => void }) {
  const done = useRef(false), finish = (v: string | null) => { if (done.current) return; done.current = true; onDone(v === null ? null : v.replace(/\s+/g, ' ').trim()); };
  return <input type="text" className="pl-edit" autoFocus defaultValue={value} onFocus={e => e.currentTarget.select()} onBlur={e => finish(e.currentTarget.value)}
    onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); finish(e.currentTarget.value); } else if (e.key === 'Escape') { e.preventDefault(); finish(null); } }} />;
}

// right-click a row: tick the associations that fit (several allowed); "+ New" adds one of your own
function TagMenu({ x, y, on, used, onToggle, onClear, onClose }: { x: number; y: number; on: string[]; used: string[]; onToggle: (t: string) => void; onClear: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null), [pos, setPos] = useState({ left: x, top: y });
  useEffect(() => { const r = ref.current?.getBoundingClientRect(); if (r) setPos({ left: Math.max(8, Math.min(x, window.innerWidth - r.width - 8)), top: Math.max(8, Math.min(y, window.innerHeight - r.height - 8)) }); }, [x, y]);
  useEffect(() => { const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); }; const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', down); document.addEventListener('keydown', esc); document.addEventListener('scroll', onClose, true);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', esc); document.removeEventListener('scroll', onClose, true); }; }, [onClose]);
  const lower = on.map(t => t.toLowerCase()), extra = used.filter(t => !TAGS.includes(t) && !TAG_IDEAS.includes(t));
  const row = (t: string) => <label className="pl-menu-row" key={t}><input type="checkbox" checked={lower.includes(t.toLowerCase())} onChange={() => onToggle(t)} /> {t}</label>;
  return <div className="pl-menu" ref={ref} style={pos}>
    <div className="pl-menu-h">Associations</div>{[...TAGS, ...extra].map(row)}<div className="pl-menu-h">Ideas</div>{TAG_IDEAS.map(row)}
    <div className="pl-menu-foot"><button onClick={() => { const v = (prompt('New association (one word works best):') || '').replace(/[()/]/g, '').trim(); if (v) onToggle(v); }}>+ New…</button><button onClick={onClear}>Clear</button></div>
  </div>;
}

// the notes pad: saves itself 0.7 s after you stop typing (and when you click away); if the server isn't answering it keeps a copy in this browser
function NotesPad({ min, setMin }: { min: boolean; setMin: (m: boolean) => void }) {
  const [text, setText] = useState(''), [status, setStatus] = useState(''), timer = useRef<number>(), dirty = useRef(false), latest = useRef('');
  const save = useCallback(async () => {
    window.clearTimeout(timer.current); if (!dirty.current) return;
    setStatus('Saving…');
    try { const r = await fetch('/api/purchase-notes', { method: 'POST', body: latest.current, keepalive: true }); if (!r.ok) throw new Error(); dirty.current = false; setStatus('Saved ✓'); store('purchaseNotesBackup', ''); }
    catch { store('purchaseNotesBackup', latest.current); setStatus('⚠️ Not saved'); }
  }, []);
  useEffect(() => { api<{ text?: string }>('/api/purchase-notes').then(d => {
    let t = d.text || ''; const backup = store('purchaseNotesBackup');
    if (backup && backup !== t) { t = backup; dirty.current = true; }
    latest.current = t; setText(t); if (dirty.current) save();
  }).catch(() => {}); }, [save]);
  const nums = (text.match(/\$\s?\d[\d,]*(?:\.\d+)?/g) || []).map(m => parseFloat(m.replace(/[$,\s]/g, ''))), sum = nums.reduce((a, b) => a + b, 0);
  return <aside id="pn-panel" className={min ? 'min' : ''} aria-label="Purchase notes">
    <div id="pn-head"><b>🧮 Notes</b><span id="pn-status">{status}</span><button id="pn-min" className="ctl" title={min ? 'Open the notes' : 'Minimise'} onClick={() => setMin(!min)}>{min ? '+' : '–'}</button></div>
    <textarea id="pn-text" spellCheck={false} placeholder={'Work out your purchases here, e.g.\nGuitar $700\nPhone $500'} value={text} onKeyDown={e => e.stopPropagation()} onBlur={save}
      onChange={e => { setText(e.target.value); latest.current = e.target.value; dirty.current = true; setStatus('Typing…'); window.clearTimeout(timer.current); timer.current = window.setTimeout(save, 700); }} />
    <div id="pn-total">{nums.length ? <>Total of {nums.length} $ amount{nums.length === 1 ? '' : 's'}: <b>${sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b></> : 'Write amounts like $300 and they add up here'}</div>
  </aside>;
}
