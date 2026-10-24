import { useMemo, useState } from 'react';
import { api } from '../api';
import { useRecord } from '../useRecord';

// ✈️ Travel (hidden tab, open it with ⌘⌘ or voice): a short list of rentals from any site (Airbnb, Booking, local agencies ...). Paste a
// link and it names itself and picks up the listing's picture (/api/link-title -> og:title / og:image); then fill in city, price, m²
// and notes, and when it's free: any time, or only some date ranges. Filter by city / price / size / a date it must be free on, sort by
// price, size or price per m². Saved as records "travel" (routes/records.py).
type Place = { id: string; url: string; title: string; image: string; city: string; price: string; per: string; currency: string; sqm: string; notes: string; fav: boolean; added: string; avail?: 'any' | 'dates'; ranges?: Array<{ from: string; to: string }> };
type Doc = { places: Place[] };
const PERS = ['month', 'night', 'week', 'total'];
const num = (v: string) => { const n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : NaN; };
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const fmtDay = (d: string) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '…');
// free on that day? (any time, or inside one of its ranges; an open end counts as open)
const freeOn = (p: Place, day: string) => p.avail !== 'dates' || (p.ranges || []).some(r => (!r.from || r.from <= day) && (!r.to || day <= r.to));
const guessCity = (title: string) => (/\bin ([A-Z][\p{L}' -]+?)(?:\s*[·,|(]|$)/u.exec(title)?.[1] || '').trim();

export function TravelPage() {
  const { doc, update, status } = useRecord<Doc>('travel', { places: [] });
  const [link, setLink] = useState(''), [adding, setAdding] = useState(false), [q, setQ] = useState(''), [city, setCity] = useState('');
  const [maxPrice, setMaxPrice] = useState(''), [minSqm, setMinSqm] = useState(''), [freeDay, setFreeDay] = useState(''), [per, setPer] = useState(''), [favOnly, setFavOnly] = useState(false), [sort, setSort] = useState('new');
  const places = doc?.places || [];
  const cities = useMemo(() => [...new Set(places.map(p => p.city.trim()).filter(Boolean))].sort(), [places]);
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = places.filter(p => (!city || p.city.trim() === city) && (!per || p.per === per) && (!favOnly || p.fav)
      && (!maxPrice || !(num(p.price) > num(maxPrice))) && (!minSqm || num(p.sqm) >= num(minSqm)) && (!freeDay || freeOn(p, freeDay))
      && words.every(w => `${p.title} ${p.city} ${p.notes} ${host(p.url)}`.toLowerCase().includes(w)));
    const key = (p: Place) => sort === 'price' ? num(p.price) : sort === 'pricedesc' ? -num(p.price) : sort === 'sqm' ? -num(p.sqm) : sort === 'persqm' ? num(p.price) / num(p.sqm) : -Date.parse(p.added || '0');
    return list.sort((a, b) => { const x = key(a), y = key(b); return (Number.isNaN(x) ? 1 : 0) - (Number.isNaN(y) ? 1 : 0) || (x - y) || 0; });
  }, [places, q, city, per, favOnly, maxPrice, minSqm, freeDay, sort]);
  const edit = (id: string, patch: Partial<Place>) => update(d => { const p = d.places.find(x => x.id === id); if (p) Object.assign(p, patch); return d; });
  const add = async () => {
    const url = link.trim();
    if (!/^https?:\/\//.test(url)) { alert('Paste a full link (starting with https://).'); return; }
    if (places.some(p => p.url === url) && !confirm('That link is already on the list. Add it again?')) return;
    setAdding(true);
    const info = await api<{ title?: string; image?: string }>(`/api/link-title?url=${encodeURIComponent(url)}`).catch(() => ({ title: '', image: '' }));
    const title = (info.title || '').replace(/\s+/g, ' ').trim();
    const last = places[0];
    update(d => { d.places.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), url, title: title || host(url), image: info.image || '', city: guessCity(title) || city,
      price: '', per: last?.per || 'month', currency: last?.currency || '€', sqm: '', notes: '', fav: false, added: new Date().toISOString() }); return d; });
    setLink(''); setAdding(false);
  };
  if (!doc) return <article className="selfdev-doc"><h2>✈️ Travel</h2><p>{status || 'Loading…'}</p></article>;
  return <article className="selfdev-doc tv-page">
    <h2>✈️ Travel <span className="tv-count">{places.length} place{places.length === 1 ? '' : 's'}</span>{status && <small className="tv-status">{status}</small>}
      <button className="ctl tc-back" onClick={() => document.getElementById('tab-travelcontacts')?.click()}>👥 Contacts</button></h2>
    <div className="tv-add"><input value={link} onChange={e => setLink(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add(); }} placeholder="Paste a rental link (Airbnb, Booking, any site)…" />
      <button className="ctl biz-primary" onClick={add} disabled={adding || !link.trim()}>{adding ? 'Looking it up…' : '＋ Add'}</button></div>
    <div className="tv-filters">
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title, notes…" />
      <select value={city} onChange={e => setCity(e.target.value)}><option value="">All cities</option>{cities.map(c => <option key={c}>{c}</option>)}</select>
      <select value={per} onChange={e => setPer(e.target.value)}><option value="">Any period</option>{PERS.map(p => <option key={p} value={p}>per {p}</option>)}</select>
      <label>max price <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} /></label>
      <label>min m² <input type="number" value={minSqm} onChange={e => setMinSqm(e.target.value)} /></label>
      <label title="Only places free on this day (any time, or a date range that includes it)">free on <input type="date" value={freeDay} onChange={e => setFreeDay(e.target.value)} /></label>
      <label><input type="checkbox" checked={favOnly} onChange={e => setFavOnly(e.target.checked)} /> ★ only</label>
      <select value={sort} onChange={e => setSort(e.target.value)}><option value="new">Newest first</option><option value="price">Price: low → high</option><option value="pricedesc">Price: high → low</option><option value="sqm">Biggest first</option><option value="persqm">Cheapest per m²</option></select>
    </div>
    {!places.length && <p className="tv-empty">Paste a link above to start your shortlist.</p>}
    {!!places.length && !shown.length && <p className="tv-empty">Nothing matches these filters.</p>}
    <div className="tv-grid">{shown.map(p => { const ppm = num(p.price) / num(p.sqm); return <section key={p.id} className={`tv-card${p.fav ? ' fav' : ''}`}>
      <a className="tv-thumb" href={p.url} target="_blank" rel="noopener noreferrer" title="Open the listing">
        {p.image ? <img src={p.image} alt="" referrerPolicy="no-referrer" loading="lazy" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : null}
        <span className="tv-site">{host(p.url)}</span></a>
      <div className="tv-body">
        <div className="tv-top"><input className="tv-title" value={p.title} onChange={e => edit(p.id, { title: e.target.value })} />
          <button className="tv-star" title={p.fav ? 'Unstar' : 'Star'} onClick={() => edit(p.id, { fav: !p.fav })}>{p.fav ? '★' : '☆'}</button>
          <button className="tv-x" title="Remove" onClick={() => { if (confirm(`Remove “${p.title}”?`)) update(d => { d.places = d.places.filter(x => x.id !== p.id); return d; }); }}>×</button></div>
        <div className="tv-fields">
          <label>City <input value={p.city} list="tv-cities" onChange={e => edit(p.id, { city: e.target.value })} /></label>
          <label>Price <span className="tv-price"><input className="tv-cur" value={p.currency} onChange={e => edit(p.id, { currency: e.target.value })} /><input value={p.price} inputMode="decimal" onChange={e => edit(p.id, { price: e.target.value })} />
            <select value={p.per} onChange={e => edit(p.id, { per: e.target.value })}>{PERS.map(x => <option key={x} value={x}>/ {x}</option>)}</select></span></label>
          <label>m² <input value={p.sqm} inputMode="decimal" onChange={e => edit(p.id, { sqm: e.target.value })} /></label>
          {Number.isFinite(ppm) && <span className="tv-ppm">{p.currency}{ppm.toFixed(ppm < 10 ? 1 : 0)} / m²</span>}
        </div>
        <div className="tv-avail">
          <span>📅</span>
          <select value={p.avail || 'any'} onChange={e => edit(p.id, e.target.value === 'dates' ? { avail: 'dates', ranges: p.ranges?.length ? p.ranges : [{ from: '', to: '' }] } : { avail: 'any' })}>
            <option value="any">Any time</option><option value="dates">Only these dates</option></select>
          {p.avail === 'dates' && <>
            {(p.ranges || []).map((r, i) => <span key={i} className="tv-range">
              <input type="date" value={r.from} onChange={e => edit(p.id, { ranges: (p.ranges || []).map((x, j) => j === i ? { ...x, from: e.target.value } : x) })} />–
              <input type="date" value={r.to} min={r.from || undefined} onChange={e => edit(p.id, { ranges: (p.ranges || []).map((x, j) => j === i ? { ...x, to: e.target.value } : x) })} />
              <button title="Remove these dates" onClick={() => edit(p.id, { ranges: (p.ranges || []).filter((_, j) => j !== i) })}>×</button></span>)}
            <button className="tv-addrange" onClick={() => edit(p.id, { ranges: [...(p.ranges || []), { from: '', to: '' }] })}>＋ dates</button>
          </>}
          {p.avail === 'dates' && !!(p.ranges || []).some(r => r.from || r.to) && <small className="tv-avail-sum">{(p.ranges || []).filter(r => r.from || r.to).map(r => `${fmtDay(r.from)} – ${fmtDay(r.to)}`).join(' · ')}</small>}
        </div>
        <textarea value={p.notes} placeholder="Notes: area, pros/cons, host replies…" onChange={e => edit(p.id, { notes: e.target.value })} />
        <details className="tv-more"><summary>Link &amp; picture</summary>
          <label>Link <input value={p.url} onChange={e => edit(p.id, { url: e.target.value })} /></label>
          <label>Picture URL <input value={p.image} placeholder="right-click the listing's photo → Copy image address" onChange={e => edit(p.id, { image: e.target.value })} /></label>
        </details>
      </div>
    </section>; })}</div>
    <datalist id="tv-cities">{cities.map(c => <option key={c} value={c} />)}</datalist>
  </article>;
}
