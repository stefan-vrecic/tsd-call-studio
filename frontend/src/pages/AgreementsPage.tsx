import { useState } from 'react';
import { useRecord } from '../useRecord';

// 📄 Agreements: the client agreement links (fixed list below) and your own product agreements (records store "agreements";
// the voice agent's agreement_prepare / agreements_list read the same products). Each link can be opened or copied for a message.
type Product = { id: string; name: string; url: string; notes: string };
type Doc = { clientRegions: Region[]; products: Product[] };
type Region = { region: string; sections: Array<{ title: string; warn: string; links: Array<{ name: string; url: string }> }> };
const STARTER: Doc = { clientRegions: [], products: [1, 2, 3].map(n => ({ id: `product-${n}`, name: `Product Agreement ${n}`, url: '', notes: '' })) };
const goodUrl = (url: string) => /^https?:\/\/\S+$/i.test(String(url || '').trim());
const isYouTube = (url: string) => { try { return /(^|\.)(youtube\.com|youtu\.be)$/.test(new URL(url).hostname); } catch { return false; } };

function CopyButton({ url, className = 'ctl ag-copy', disabled }: { url: string; className?: string; disabled?: boolean }) {
  const [label, setLabel] = useState('Copy link');
  const copy = async () => { try { await navigator.clipboard.writeText(url.trim()); setLabel('✅ Copied'); } catch { setLabel('⚠️ Failed'); } window.setTimeout(() => setLabel('Copy link'), 1200); };
  return <button className={className} title="Copy this link" disabled={disabled} onClick={copy}>{label}</button>;
}

export function AgreementsPage() {
  const { doc, update, status } = useRecord<Doc>('agreements', STARTER);
  const [active, setActive] = useState('client');
  const products = (doc?.products || []).filter(p => p && p.id);
  const product = products.find(p => p.id === active);
  const setP = (patch: Partial<Product>) => update(d => { const p = d.products.find(x => x.id === active); if (p) Object.assign(p, patch); return d; });
  const add = () => { const p = { id: Math.random().toString(36).slice(2, 11), name: `Product Agreement ${products.length + 1}`, url: '', notes: '' }; update(d => { d.products.push(p); return d; }); setActive(p.id); };
  const remove = () => { if (!product || !confirm(`Delete “${product.name || 'Untitled product'}”?`)) return; update(d => { d.products = d.products.filter(x => x.id !== product.id); return d; }); setActive('client'); };
  return <div className="ag-workspace">
    <aside className="ag-sidebar" aria-label="Agreement library">
      <div className="ag-sidebar-title">Agreement library</div>
      <button className={`ag-nav${active === 'client' ? ' active' : ''}`} onClick={() => setActive('client')}><span>▤</span> Client agreements</button>
      <div className="ag-sidebar-label">My products</div>
      <div id="ag-product-nav">{products.map(p => <button key={p.id} className={`ag-nav${p.id === active ? ' active' : ''}`} onClick={() => setActive(p.id)}><span>◫</span><b>{p.name.trim() || 'Untitled product'}</b></button>)}</div>
      <button className="ag-add" onClick={add}>＋ Add product</button>
      <div className="ag-sidebar-status">{status === 'Saving…' ? 'Saving…' : status}</div>
    </aside>
    {!product ? <article className="selfdev-doc ag-page active">
      <div className="ag-page-kicker">CURRENT SALES LIBRARY</div>
      <h1 className="ag-page-title">Client agreements</h1>
      {doc && !doc.clientRegions?.length && <p>No client agreement links have been configured on this installation.</p>}
      {(doc?.clientRegions || []).map(r => <section key={r.region}><h2>{r.region}</h2>{r.sections.map((s, i) => <div key={i}>
        {s.title && <h3>{s.title}{s.warn && <> <span className="ag-warn">{s.warn}</span></>}</h3>}
        <div className="ag-list">{s.links.map(l => <div className="ag-row" key={l.url}>
          <a className="ag-link" href={l.url} target="_blank" rel="noopener noreferrer">{isYouTube(l.url) && <svg className="yt-icon" viewBox="0 0 28 20" aria-label="YouTube"><rect width="28" height="20" rx="5" fill="#ff0000" /><path d="M11 5.5v9l8-4.5z" fill="#fff" /></svg>}<span className="ag-name">{l.name}</span><span className="ag-open">↗</span></a>
          <CopyButton url={l.url} /></div>)}</div>
      </div>)}</section>)}
    </article> : <article className="selfdev-doc ag-page ag-product-page active">
      <div className="ag-page-kicker">MY PRODUCT</div>
      <div className="ag-product-head"><input className="ag-product-name" key={product.id + '-name'} defaultValue={product.name} placeholder="Product name" aria-label="Product name" onChange={e => setP({ name: e.target.value.slice(0, 100) })} onKeyDown={e => e.stopPropagation()} /><span className="ag-status">Edit details below</span></div>
      <label className="ag-field">AGREEMENT LINK<input key={product.id + '-url'} type="url" defaultValue={product.url} placeholder="https://form.pandadoc.com/…" autoComplete="off" onChange={e => setP({ url: e.target.value.slice(0, 2000) })} onKeyDown={e => e.stopPropagation()} /></label>
      <label className="ag-field">NOTES / VARIANTS<textarea key={product.id + '-notes'} defaultValue={product.notes} placeholder="Price, payment-plan variants, fulfilment terms, or anything to check before sending…" onChange={e => setP({ notes: e.target.value.slice(0, 20000) })} onKeyDown={e => e.stopPropagation()} /></label>
      <div className="ag-product-actions">
        <button className="ctl danger" onClick={remove}>Delete product</button>
        <CopyButton url={product.url} className="ctl" disabled={!goodUrl(product.url)} />
        <button className="ctl primary" disabled={!goodUrl(product.url)} onClick={() => window.open(product.url.trim(), '_blank', 'noopener')}>Open agreement ↗</button>
      </div>
    </article>}
  </div>;
}
