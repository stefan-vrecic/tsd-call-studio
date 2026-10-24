import { useEffect, useRef, useState } from 'react';
import { uid } from '../biz';
import { useRecord } from '../useRecord';

// ♫ Music: a link-based PDF gallery of sheet music (records store "sheetmusic"). Links point at a Call Studio route (an uploaded PDF,
// /api/sheet-music-upload) or any https URL; drop PDFs anywhere on the page to upload and add them.
type Piece = { id: string; title: string; composer: string; url: string; notes: string; added?: number; uploaded?: boolean };
type Doc = { items: Piece[] };
const validUrl = (v: string) => { const url = String(v || '').trim(); return /^(https?:\/\/|\/)/i.test(url) && !/^\/\//.test(url); };
const openLink = (url: string) => { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); };

export function MusicPage() {
  const { doc, update, status } = useRecord<Doc>('sheetmusic', { items: [] });
  const [form, setForm] = useState<Piece | null>(null), [msg, setMsg] = useState(''), [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const items = doc?.items || [];
  const upload = async (files: FileList) => {
    const pdfs = [...files].filter(f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
    if (!pdfs.length) { setMsg('⚠️ Drop PDF files only'); return; }
    const added: Piece[] = [];
    for (let i = 0; i < pdfs.length; i++) {
      const f = pdfs[i]; setMsg(`Uploading ${i + 1} of ${pdfs.length}…`);
      try {
        const r = await fetch('/api/sheet-music-upload', { method: 'POST', body: f, headers: { 'X-Filename': encodeURIComponent(f.name) } });
        const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Upload failed');
        added.push({ id: uid(), title: f.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled score', composer: '', url: d.url, notes: '', added: Date.now(), uploaded: true });
      } catch (e) { setMsg(`⚠️ ${f.name}: ${e instanceof Error ? e.message : e}`); break; }
    }
    if (added.length) { update(d => { d.items.unshift(...added.reverse()); return d; }); setMsg(`${added.length} PDF${added.length === 1 ? '' : 's'} added ✓`); setTimeout(() => setMsg(m => /added/.test(m) ? '' : m), 1800); }
  };
  // id music-view: the page's own styles and the drop-PDFs overlay (static/styles.css)
  return <div id="music-view" className={dragging ? 'sm-dragging' : ''} style={{ minHeight: '100%' }}
    onDragEnter={e => { e.preventDefault(); depth.current++; setDragging(true); }} onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
    onDragLeave={e => { e.preventDefault(); depth.current--; if (depth.current <= 0) { depth.current = 0; setDragging(false); } }}
    onDrop={e => { e.preventDefault(); depth.current = 0; setDragging(false); upload(e.dataTransfer.files); }}>
    <main className="sm-wrap">
      <header className="sm-hero"><div><span className="sm-kicker">PERSONAL · MUSIC</span><h1>Sheet music</h1><p>Your PDF library for practice, rehearsal and sight-reading.</p></div>
        <div className="sm-hero-actions"><a className="ctl sm-sightreading" href="https://sightreadingfactory.com/" target="_blank" rel="noopener noreferrer">♫ Sight Reading Factory <span>↗</span></a>
          <button className="ctl primary" type="button" onClick={() => setForm({ id: '', title: '', composer: '', url: '', notes: '' })}>＋ Add PDF</button></div></header>
      <div className="sm-toolbar"><strong>{items.length} {items.length === 1 ? 'piece' : 'pieces'}</strong><span className="bk-status" aria-live="polite">{msg || (status === 'Saving…' ? '' : status)}</span></div>
      <section className="sm-gallery" aria-label="Sheet music PDF gallery">
        {!doc ? null : !items.length ? <div className="sm-empty"><div className="sm-empty-mark">♫</div><h2>Your sheet music will live here</h2><p>Drop PDFs here, or add the internal PDF links when you have them. Each piece will appear as a visual card you can open in one click.</p><button className="ctl primary" type="button" onClick={() => setForm({ id: '', title: '', composer: '', url: '', notes: '' })}>＋ Add your first PDF</button></div>
          : items.map((p, i) => <article className="sm-card" key={p.id}>
            <button className="sm-cover" type="button" aria-label={`Open ${p.title}`} onClick={() => openLink(p.url)}><span className="sm-cover-number">{String(i + 1).padStart(2, '0')}</span><span className="sm-clef">𝄞</span><span className="sm-cover-title">{p.title}</span><span className="sm-cover-composer">{p.composer || 'Sheet music'}</span></button>
            <div className="sm-card-info"><div><h2>{p.title}</h2><p>{p.composer || 'No composer added'}</p></div><button className="sm-card-more" type="button" aria-label={`Edit ${p.title}`} onClick={() => setForm(p)}>⋯</button></div>
            {p.notes && <p className="sm-card-notes">{p.notes}</p>}
            <div className="sm-card-actions"><button className="ctl" type="button" onClick={() => openLink(p.url)}>Open PDF <span>↗</span></button>
              <button className="ctl sm-delete" type="button" onClick={() => { if (confirm(`Remove "${p.title}" from the gallery?\n\nThe original PDF will not be deleted.`)) update(d => { d.items = d.items.filter(x => x.id !== p.id); return d; }); }}>Delete</button></div>
          </article>)}
      </section>
      <p className="sm-drop-hint">Drop PDF files anywhere on this page to add them</p>
    </main>
    {form && <PieceForm piece={form} onClose={() => setForm(null)} onSave={v => { update(d => { if (form.id) { const x = d.items.find(y => y.id === form.id); if (x) Object.assign(x, v); } else d.items.unshift({ id: uid(), added: Date.now(), ...v }); return d; }); setForm(null); }} />}
  </div>;
}

function PieceForm({ piece, onClose, onSave }: { piece: Piece; onClose: () => void; onSave: (v: { title: string; composer: string; url: string; notes: string }) => void }) {
  const [v, setV] = useState({ title: piece.title, composer: piece.composer, url: piece.url, notes: piece.notes }), [error, setError] = useState('');
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV(x => ({ ...x, [k]: e.target.value }));
  useEffect(() => { const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', esc); return () => document.removeEventListener('keydown', esc); }, [onClose]);
  return <div className="sm-dialog" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><form className="sm-dialog-card" onKeyDown={e => e.stopPropagation()} onSubmit={e => {
    e.preventDefault(); if (!validUrl(v.url)) { setError('Use an https:// link or an internal link beginning with /.'); return; }
    onSave({ title: v.title.trim(), composer: v.composer.trim(), url: v.url.trim(), notes: v.notes.trim() });
  }}>
    <div className="sm-dialog-head"><div><span className="sm-kicker">SHEET MUSIC</span><h2>{piece.id ? 'Edit sheet music' : 'Add a PDF'}</h2></div><button className="sm-icon-btn" type="button" aria-label="Close" onClick={onClose}>×</button></div>
    <label>Title<input required autoFocus placeholder="e.g. Clair de Lune" value={v.title} onChange={set('title')} /></label>
    <label>Composer or collection <input placeholder="Optional" value={v.composer} onChange={set('composer')} /></label>
    <label>PDF link <input required placeholder="Paste an internal or https:// link" value={v.url} onChange={set('url')} /></label>
    <label>Notes <textarea rows={3} placeholder="Key, level, fingering notes…" value={v.notes} onChange={set('notes')} /></label>
    <p className="sm-form-error" role="alert">{error}</p>
    <div className="sm-dialog-actions"><button className="ctl" type="button" onClick={onClose}>Cancel</button><button className="ctl primary" type="submit">Save to gallery</button></div>
  </form></div>;
}
