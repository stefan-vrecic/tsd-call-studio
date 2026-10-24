import { useEffect, useState } from 'react';
import { useRecord } from '../useRecord';

// ▦ Kanban: boards of columns of cards, saved in the records store (live_docs/records/kanban.json, routes/records.py).
// Drag cards between and within columns; click a card to edit it (notes, label, due date); right-click a column or board to rename / move / delete.
type Card = { id: string; title: string; notes?: string; label?: string; due?: string; created: number };
type Column = { id: string; name: string; cards: Card[] };
type Board = { id: string; name: string; columns: Column[] };
type Doc = { boards: Board[]; active?: string };

const uid = () => Math.random().toString(36).slice(2, 10);
const LABELS = ['', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#64748b'];
const newBoard = (name = 'My board'): Board => ({ id: uid(), name, columns: ['To do', 'Doing', 'Done'].map(n => ({ id: uid(), name: n, cards: [] })) });
const today = () => new Date().toLocaleDateString('en-CA');

export function KanbanPage() {
  const { doc, update, status: error } = useRecord<Doc>('kanban', { boards: [] });
  const [adding, setAdding] = useState(''), [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<{ col: string; card: Card } | null>(null);
  const [drag, setDrag] = useState<{ card: string; from: string } | null>(null), [over, setOver] = useState<{ col: string; index: number } | null>(null);
  const [menu, setMenu] = useState<{ kind: 'column' | 'board'; id: string; x: number; y: number } | null>(null);
  // a first visit gets a starter board; a remembered board that's gone falls back to the first one
  useEffect(() => { if (doc && (!doc.boards.length || !doc.boards.some(b => b.id === doc.active))) update(d => { if (!d.boards.length) d.boards = [newBoard()]; d.active = d.boards[0].id; return d; }); }, [doc, update]);
  useEffect(() => { const close = () => setMenu(null); window.addEventListener('click', close); return () => window.removeEventListener('click', close); }, []);
  if (!doc || !doc.boards.length) return <main className="modern-page kanban-page"><p>{error || 'Loading…'}</p></main>;
  const board = doc.boards.find(b => b.id === doc.active) || doc.boards[0];
  const onBoard = (d: Doc) => d.boards.find(b => b.id === board.id)!;
  const col = (d: Doc, id: string) => onBoard(d).columns.find(c => c.id === id)!;

  const addCard = (colId: string) => {
    const lines = draft.split('\n').map(s => s.trim()).filter(Boolean);   // several lines = several cards
    if (!lines.length) { setAdding(''); return; }
    update(d => { col(d, colId).cards.push(...lines.map(title => ({ id: uid(), title, created: Date.now() / 1000 }))); return d; });
    setDraft('');
  };
  const drop = (colId: string, index: number) => {
    if (!drag) return;
    update(d => {
      const from = col(d, drag.from), i = from.cards.findIndex(c => c.id === drag.card); if (i < 0) return d;
      const [card] = from.cards.splice(i, 1), to = col(d, colId);
      to.cards.splice(drag.from === colId && i < index ? index - 1 : index, 0, card);
      return d;
    });
    setDrag(null); setOver(null);
  };
  const renameColumn = (id: string) => { const c = board.columns.find(x => x.id === id)!; const name = prompt('Column name', c.name)?.trim(); if (name) update(d => { col(d, id).name = name; return d; }); };
  const moveColumn = (id: string, by: number) => update(d => { const cs = onBoard(d).columns, i = cs.findIndex(c => c.id === id), j = i + by; if (j >= 0 && j < cs.length) [cs[i], cs[j]] = [cs[j], cs[i]]; return d; });
  const deleteColumn = (id: string) => { const c = board.columns.find(x => x.id === id)!; if (c.cards.length && !confirm(`Delete "${c.name}" and its ${c.cards.length} card${c.cards.length === 1 ? '' : 's'}?`)) return; update(d => { const b = onBoard(d); b.columns = b.columns.filter(x => x.id !== id); return d; }); };
  const renameBoard = (id: string) => { const b = doc.boards.find(x => x.id === id)!; const name = prompt('Board name', b.name)?.trim(); if (name) update(d => { d.boards.find(x => x.id === id)!.name = name; return d; }); };
  const deleteBoard = (id: string) => { const b = doc.boards.find(x => x.id === id)!; const n = b.columns.reduce((s, c) => s + c.cards.length, 0); if (doc.boards.length === 1) { alert('This is your only board.'); return; } if (!confirm(`Delete the board "${b.name}"${n ? ` and its ${n} cards` : ''}?`)) return; update(d => { d.boards = d.boards.filter(x => x.id !== id); if (d.active === id) d.active = d.boards[0].id; return d; }); };
  const saveCard = (colId: string, card: Card | null, moveTo?: string) => {
    update(d => {
      const from = col(d, colId), i = from.cards.findIndex(c => c.id === editing?.card.id); if (i < 0) return d;
      if (!card) { from.cards.splice(i, 1); return d; }
      if (moveTo && moveTo !== colId) { from.cards.splice(i, 1); col(d, moveTo).cards.unshift(card); } else from.cards[i] = card;
      return d;
    });
    setEditing(null);
  };

  return <main className="modern-page kanban-page">
    <header className="kb-head"><h1>▦ Kanban</h1>
      <nav className="kb-boards">{doc.boards.map(b => <button key={b.id} className={b.id === board.id ? 'on' : ''} onClick={() => update(d => { d.active = b.id; return d; })} onDoubleClick={() => renameBoard(b.id)} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setMenu({ kind: 'board', id: b.id, x: e.clientX, y: e.clientY }); }} title="Double-click to rename · right-click for more">{b.name}</button>)}
        <button className="kb-new" title="New board" onClick={() => { const name = prompt('New board name', 'New board')?.trim(); if (name) { const b = newBoard(name); update(d => { d.boards.push(b); d.active = b.id; return d; }); } }}>＋</button></nav>
      {error && error !== 'Saving…' && <span className="kb-err">⚠️ {error}</span>}</header>
    <div className="kb-columns">
      {board.columns.map(c => <section key={c.id} className={`kb-col${over?.col === c.id ? ' over' : ''}`} onDragOver={e => { if (!drag) return; e.preventDefault(); if (!(e.target as HTMLElement).closest('.kb-card')) setOver({ col: c.id, index: c.cards.length }); }} onDrop={e => { e.preventDefault(); drop(c.id, over?.col === c.id ? over.index : c.cards.length); }}>
        <header onDoubleClick={() => renameColumn(c.id)} onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setMenu({ kind: 'column', id: c.id, x: e.clientX, y: e.clientY }); }} title="Double-click to rename · right-click for more"><b>{c.name}</b><small>{c.cards.length}</small></header>
        <div className="kb-cards">
          {c.cards.map((card, i) => <div key={card.id} className={`kb-card${drag?.card === card.id ? ' dragging' : ''}${over?.col === c.id && over.index === i ? ' drop-before' : ''}`} draggable
            onDragStart={e => { setDrag({ card: card.id, from: c.id }); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', card.title); }} onDragEnd={() => { setDrag(null); setOver(null); }}
            onDragOver={e => { if (!drag) return; e.preventDefault(); e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setOver({ col: c.id, index: e.clientY > r.top + r.height / 2 ? i + 1 : i }); }}
            onClick={() => setEditing({ col: c.id, card })} style={card.label ? { borderLeftColor: card.label } : undefined}>
            <span>{card.title}</span>
            {(card.due || card.notes) && <div className="kb-meta">{card.due && <em className={card.due < today() ? 'late' : card.due === today() ? 'today' : ''}>📅 {new Date(`${card.due}T12:00:00`).toLocaleDateString([], { day: 'numeric', month: 'short' })}</em>}{card.notes && <i title={card.notes}>📝</i>}</div>}
          </div>)}
          {over?.col === c.id && over.index === c.cards.length && drag && <div className="kb-drop-end" />}
        </div>
        {adding === c.id
          ? <div className="kb-add"><textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)} placeholder="Card title… (several lines = several cards)" onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addCard(c.id); } if (e.key === 'Escape') { setAdding(''); setDraft(''); } }} onBlur={() => { if (draft.trim()) addCard(c.id); setAdding(''); }} /><small>Enter adds · ⇧Enter new line · Esc closes</small></div>
          : <button className="kb-add-btn" onClick={() => { setAdding(c.id); setDraft(''); }}>＋ Add card</button>}
      </section>)}
      <button className="kb-add-col" onClick={() => { const name = prompt('New column name')?.trim(); if (name) update(d => { onBoard(d).columns.push({ id: uid(), name, cards: [] }); return d; }); }}>＋ Add column</button>
    </div>
    {menu && <div className="modern-context-menu" style={{ left: Math.min(menu.x, window.innerWidth - 200), top: Math.min(menu.y, window.innerHeight - 160) }} onClick={e => e.stopPropagation()}>
      {menu.kind === 'column' ? <>
        <button onClick={() => { setMenu(null); renameColumn(menu.id); }}>✏️ Rename column</button>
        <button onClick={() => { setMenu(null); moveColumn(menu.id, -1); }}>← Move left</button>
        <button onClick={() => { setMenu(null); moveColumn(menu.id, 1); }}>→ Move right</button>
        <button onClick={() => { setMenu(null); deleteColumn(menu.id); }}>🗑 Delete column</button>
      </> : <>
        <button onClick={() => { setMenu(null); renameBoard(menu.id); }}>✏️ Rename board</button>
        <button onClick={() => { setMenu(null); deleteBoard(menu.id); }}>🗑 Delete board</button>
      </>}
    </div>}
    {editing && <CardEditor card={editing.card} columns={board.columns} col={editing.col} onClose={() => setEditing(null)} onSave={(card, moveTo) => saveCard(editing.col, card, moveTo)} onDelete={() => saveCard(editing.col, null)} />}
  </main>;
}

function CardEditor({ card, columns, col, onClose, onSave, onDelete }: { card: Card; columns: Column[]; col: string; onClose: () => void; onSave: (c: Card, moveTo?: string) => void; onDelete: () => void }) {
  const [c, setC] = useState(card), [to, setTo] = useState(col);
  const save = () => onSave({ ...c, title: c.title.trim() || card.title }, to);
  return <div className="modern-modal-backdrop kb-modal-bg" onMouseDown={e => { if (e.target === e.currentTarget) save(); }} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') onClose(); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save(); }}>
    <div className="kb-modal">
      <input className="kb-title" autoFocus value={c.title} onChange={e => setC(x => ({ ...x, title: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') save(); }} />
      <textarea value={c.notes || ''} onChange={e => setC(x => ({ ...x, notes: e.target.value }))} placeholder="Notes…" rows={6} />
      <div className="kb-row"><span>Label</span>{LABELS.map(l => <button key={l || 'none'} className={`kb-swatch${(c.label || '') === l ? ' on' : ''}`} style={{ background: l || 'transparent' }} title={l ? '' : 'No label'} onClick={() => setC(x => ({ ...x, label: l }))}>{l ? '' : '∅'}</button>)}</div>
      <div className="kb-row"><span>Due</span><input type="date" value={c.due || ''} onChange={e => setC(x => ({ ...x, due: e.target.value }))} />{c.due && <button className="kb-link" onClick={() => setC(x => ({ ...x, due: '' }))}>clear</button>}</div>
      <div className="kb-row"><span>Column</span><select value={to} onChange={e => setTo(e.target.value)}>{columns.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
      <footer><button className="kb-del" onClick={() => { if (confirm('Delete this card?')) onDelete(); }}>🗑 Delete</button><span /><button onClick={onClose}>Cancel</button><button className="primary" onClick={save}>Save</button></footer>
    </div>
  </div>;
}
