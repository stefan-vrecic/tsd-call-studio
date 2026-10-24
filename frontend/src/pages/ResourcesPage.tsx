import { useEffect, useMemo, useState } from 'react';
import { uid } from '../biz';
import { useRecord } from '../useRecord';

// 📚 Resources: the business library -- documents, videos, templates, tools, folders and links worth keeping close (records store "resources").
// Search / filter by type; ⋯ or a double-click edits a card. Archive tucks a card away (the Archived view brings it back).
type Item = { id: string; type: string; title: string; url: string; description: string; tags: string; added?: number; archived?: boolean };
type Doc = { items: Item[] };
const TYPES = ['Document', 'Video', 'Template', 'Tool', 'Folder', 'Link', 'Other'];
const ICONS: Record<string, string> = { Document: '📄', Video: '▶', Template: '▦', Tool: '⚙', Folder: '📁', Link: '↗', Other: '◇' };
const safeLink = (v: string) => { const url = String(v || '').trim(); return /^(https?:\/\/|\/)/i.test(url) && !/^\/\//.test(url) ? url : ''; };

export function ResourcesPage() {
  const { doc, update, status } = useRecord<Doc>('resources', { items: [] });
  const [q, setQ] = useState(''), [type, setType] = useState(''), [form, setForm] = useState<Item | null>(null), [showArchived, setShowArchived] = useState(false);
  const archivedCount = (doc?.items || []).filter(i => i.archived).length;
  const setArchived = (id: string, archived: boolean) => update(d => { const x = d.items.find(y => y.id === id); if (x) x.archived = archived; return d; });
  const items = useMemo(() => (doc?.items || []).filter(i => !!i.archived === showArchived && (!type || i.type === type) && (!q.trim() || `${i.title} ${i.type} ${i.description} ${i.tags}`.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => Number(b.added || 0) - Number(a.added || 0)), [doc, q, type, showArchived]);
  const blank = (): Item => ({ id: '', type: 'Document', title: '', url: '', description: '', tags: '' });
  return <main className="rl-wrap">
    <header className="rl-head"><div><span className="rl-kicker">BUSINESS LIBRARY</span><h1>Resources</h1><p>Documents, videos, templates, tools and anything worth keeping close.</p></div>
      <button className="ctl primary" type="button" onClick={() => setForm(blank())}>＋ Add resource</button></header>
    <div className="rl-tools"><label><span className="sr-only">Search resources</span><input type="search" placeholder="Search resources…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.stopPropagation()} /></label>
      <select aria-label="Filter resource type" value={type} onChange={e => setType(e.target.value)}><option value="">All types</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
      <div className="rl-view" role="group" aria-label="Show"><button type="button" className={showArchived ? '' : 'on'} onClick={() => setShowArchived(false)}>Active</button><button type="button" className={showArchived ? 'on' : ''} onClick={() => setShowArchived(true)}>🗄 Archived{archivedCount ? ` (${archivedCount})` : ''}</button></div>
      <span className="bk-status" aria-live="polite">{status === 'Saving…' ? '' : status}</span></div>
    <section className="rl-grid" aria-label="Business resources">
      {!doc ? null : !items.length ? <div className="rl-empty"><div>▥</div><h2>{q || type ? 'Nothing matches that search' : showArchived ? 'Nothing archived' : 'Build your business library'}</h2><p>{q || type ? 'Try another search or resource type.' : 'Save the documents, videos, templates, tools and links you use repeatedly.'}</p>{!(q || type) && <button className="ctl primary" type="button" onClick={() => setForm(blank())}>＋ Add your first resource</button>}</div>
        : items.map(i => { const link = safeLink(i.url), tags = String(i.tags || '').split(',').map(x => x.trim()).filter(Boolean);
          return <article className="rl-card" key={i.id} onDoubleClick={e => { if (!(e.target as HTMLElement).closest('a, button')) setForm(i); }}>
            <div className="rl-card-top"><span className={`rl-type-icon rl-type-${String(i.type || 'Other').toLowerCase()}`}>{ICONS[i.type] || ICONS.Other}</span><span className="rl-type-name">{i.type || 'Other'}</span><button type="button" className="rl-more" aria-label={`Edit ${i.title}`} onClick={() => setForm(i)}>⋯</button></div>
            <h2>{i.title}</h2><p>{i.description || 'No description added.'}</p>
            {tags.length > 0 && <div className="rl-tags">{tags.map(t => <span key={t}>{t}</span>)}</div>}
            <div className="rl-card-actions">{link ? <a className="ctl primary" href={link} target="_blank" rel="noopener noreferrer">Open <span>↗</span></a> : <span className="rl-no-link">Saved reference</span>}
              <button className="ctl" type="button" title={i.archived ? 'Back to the active list' : 'Tuck away (find it under Archived)'} onClick={() => setArchived(i.id, !i.archived)}>{i.archived ? '↩ Unarchive' : '🗄 Archive'}</button>
              <button className="ctl rl-delete" type="button" onClick={() => { if (confirm(`Remove "${i.title}" from Resources?`)) update(d => { d.items = d.items.filter(x => x.id !== i.id); return d; }); }}>Delete</button></div>
          </article>; })}
    </section>
    {form && <ResourceForm item={form} onClose={() => setForm(null)} onSave={v => { update(d => { if (form.id) { const x = d.items.find(y => y.id === form.id); if (x) Object.assign(x, v); } else d.items.unshift({ id: uid(), added: Date.now(), ...v }); return d; }); setForm(null); }} />}
  </main>;
}

function ResourceForm({ item, onClose, onSave }: { item: Item; onClose: () => void; onSave: (v: Omit<Item, 'id'>) => void }) {
  const [v, setV] = useState({ type: item.type || 'Document', title: item.title, url: item.url, description: item.description, tags: item.tags }), [error, setError] = useState('');
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV(x => ({ ...x, [k]: e.target.value }));
  useEffect(() => { const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', esc); return () => document.removeEventListener('keydown', esc); }, [onClose]);
  return <div className="sm-dialog" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><form className="sm-dialog-card" onKeyDown={e => e.stopPropagation()} onSubmit={e => {
    e.preventDefault();
    if (v.url.trim() && !safeLink(v.url)) { setError('Use an https:// link, an internal /link, or leave it blank.'); return; }
    onSave({ type: v.type, title: v.title.trim(), url: v.url.trim(), description: v.description.trim(), tags: v.tags.trim() });
  }}>
    <div className="sm-dialog-head"><div><span className="rl-kicker">RESOURCE</span><h2>{item.id ? 'Edit resource' : 'Add resource'}</h2></div><button className="sm-icon-btn" type="button" aria-label="Close" onClick={onClose}>×</button></div>
    <label>Type<select value={v.type} onChange={set('type')}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
    <label>Title<input required autoFocus placeholder="Resource name" value={v.title} onChange={set('title')} /></label>
    <label>Link<input placeholder="https://… or an internal /link" value={v.url} onChange={set('url')} /></label>
    <label>Description<textarea rows={3} placeholder="What this is and when to use it" value={v.description} onChange={set('description')} /></label>
    <label>Tags<input placeholder="sales, onboarding, scripts" value={v.tags} onChange={set('tags')} /></label>
    <p className="sm-form-error" role="alert">{error}</p>
    <div className="sm-dialog-actions"><button className="ctl" type="button" onClick={onClose}>Cancel</button><button className="ctl primary" type="submit">Save resource</button></div>
  </form></div>;
}
