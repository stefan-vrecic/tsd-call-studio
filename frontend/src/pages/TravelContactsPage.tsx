import { useMemo, useState } from 'react';
import { useRecord } from '../useRecord';

// 👥 Travel Contacts (hidden tab, next to ✈️ Travel; ⌘⌘ / voice "travel contacts"): the people you use or might use on a trip -- cleaner,
// chef, assistant, driver, networking, or your own category -- with phone, Facebook, Instagram, price per hour and notes. Laid out like
// Lead Gen (a table; ✎ or a double-click edits a row in a dialog), with no outreach dates. Saved as records "travelcontacts".
type Contact = { id: string; name: string; category: string; other: string; city: string; phone: string; fb: string; ig: string; price: string; currency: string; notes: string; added: string };
type Doc = { contacts: Contact[] };
const CATS = ['cleaner', 'chef', 'assistant', 'driver', 'networking', 'other'];
const ICON: Record<string, string> = { cleaner: '🧹', chef: '👨‍🍳', assistant: '🗂️', driver: '🚗', networking: '🤝', other: '✳️' };
const cat = (c: Contact) => (c.category === 'other' ? c.other.trim() || 'other' : c.category);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const link = (v: string, site: 'fb' | 'ig') => {
  const t = v.trim();
  if (!t) return '';
  if (/^https?:\/\//.test(t)) return t;
  const handle = t.replace(/^@/, '');
  return site === 'ig' ? `https://instagram.com/${handle}` : `https://facebook.com/${handle}`;
};
const blank = (): Contact => ({ id: '', name: '', category: 'cleaner', other: '', city: '', phone: '', fb: '', ig: '', price: '', currency: '€', notes: '', added: '' });

export function TravelContactsPage() {
  const { doc, update, status } = useRecord<Doc>('travelcontacts', { contacts: [] });
  const [q, setQ] = useState(''), [fcat, setFcat] = useState(''), [fcity, setFcity] = useState(''), [sort, setSort] = useState('new'), [form, setForm] = useState<Contact | null>(null);
  const all = doc?.contacts || [];
  const cats = useMemo(() => [...new Set(all.map(cat))].sort(), [all]);
  const cities = useMemo(() => [...new Set(all.map(c => c.city.trim()).filter(Boolean))].sort(), [all]);
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = all.filter(c => (!fcat || cat(c) === fcat) && (!fcity || c.city.trim() === fcity)
      && words.every(w => `${c.name} ${cat(c)} ${c.city} ${c.notes} ${c.phone} ${c.ig} ${c.fb}`.toLowerCase().includes(w)));
    const price = (c: Contact) => { const n = parseFloat(c.price.replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : Infinity; };
    return list.sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'cat' ? cat(a).localeCompare(cat(b)) || a.name.localeCompare(b.name)
      : sort === 'price' ? price(a) - price(b) : (b.added || '').localeCompare(a.added || ''));
  }, [all, q, fcat, fcity, sort]);
  const save = (v: Contact) => {
    update(d => {
      if (v.id) { const x = d.contacts.find(y => y.id === v.id); if (x) Object.assign(x, v); }
      else d.contacts.unshift({ ...v, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), added: new Date().toISOString() });
      return d;
    });
    setForm(null);
  };
  const remove = (c: Contact) => { if (confirm(`Remove ${c.name}?`)) update(d => { d.contacts = d.contacts.filter(x => x.id !== c.id); return d; }); };
  const empty = <span className="lg-empty-value">—</span>;
  return <main className="lg-wrap tc2">
    <header className="lg-head">
      <div><span className="lg-kicker">TRAVEL</span><h1>Travel Contacts</h1><p>Cleaners, chefs, assistants, drivers and people worth knowing wherever you're staying.</p></div>
      <div className="tc2-head-actions"><button className="ctl" type="button" onClick={() => document.getElementById('tab-travel')?.click()}>✈️ Travel</button>
        <button className="ctl primary" type="button" onClick={() => setForm({ ...blank(), city: fcity, category: fcat && CATS.includes(fcat) ? fcat : 'cleaner' })}>＋ Add contact</button></div>
    </header>
    <section className="lg-summary" aria-label="Contacts summary">
      <div><span>Contacts</span><strong>{all.length}</strong></div>
      {CATS.filter(k => all.some(c => c.category === k)).slice(0, 4).map(k => <div key={k}><span>{ICON[k]} {cap(k)}s</span><strong>{all.filter(c => c.category === k).length}</strong></div>)}
    </section>
    <div className="lg-tools"><label><span className="sr-only">Search contacts</span><input type="search" placeholder="Search contacts…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.stopPropagation()} /></label>
      <select aria-label="Category" value={fcat} onChange={e => setFcat(e.target.value)}><option value="">All categories</option>{cats.map(c => <option key={c} value={c}>{cap(c)}</option>)}</select>
      <select aria-label="City" value={fcity} onChange={e => setFcity(e.target.value)}><option value="">All cities</option>{cities.map(c => <option key={c}>{c}</option>)}</select>
      <select aria-label="Sort" value={sort} onChange={e => setSort(e.target.value)}><option value="new">Newest first</option><option value="name">Name A–Z</option><option value="cat">By category</option><option value="price">Cheapest per hour</option></select>
      <span className="bk-status" aria-live="polite">{status === 'Saving…' ? '' : status}</span></div>
    <div className="lg-table-wrap"><table className="lg-table"><thead><tr><th>Category</th><th>Name</th><th>City</th><th>Phone</th><th>Socials</th><th>Price / hour</th><th>Notes</th><th><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{!doc ? <tr><td colSpan={8} className="lg-no-results">Loading…</td></tr> : !shown.length ? <tr><td colSpan={8} className="lg-no-results">{all.length ? 'Nobody matches this view.' : 'No contacts yet: ＋ Add contact.'}</td></tr> : shown.map(c => {
        const fb = link(c.fb, 'fb'), ig = link(c.ig, 'ig');
        return <tr key={c.id} onDoubleClick={e => { if (!(e.target as HTMLElement).closest('a, button')) setForm(c); }}>
          <td data-label="Category"><span className={`tc2-cat tc2-cat-${c.category}`}>{ICON[c.category] || '✳️'} {cap(cat(c))}</span></td>
          <td data-label="Name"><strong>{c.name}</strong></td>
          <td data-label="City">{c.city || empty}</td>
          <td data-label="Phone">{c.phone ? <a className="lg-open" href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>{c.phone}</a> : empty}</td>
          <td data-label="Socials">{fb || ig ? <span className="tc2-socials">{fb && <a className="lg-open" href={fb} target="_blank" rel="noopener noreferrer">Facebook ↗</a>}{ig && <a className="lg-open" href={ig} target="_blank" rel="noopener noreferrer">Instagram ↗</a>}</span> : empty}</td>
          <td data-label="Price / hour">{c.price ? `${c.currency}${c.price}` : empty}</td>
          <td data-label="Notes" className="tc2-notes" title={c.notes}>{c.notes || empty}</td>
          <td className="lg-row-actions"><button type="button" aria-label={`Edit ${c.name}`} onClick={() => setForm(c)}>✎</button><button type="button" aria-label={`Remove ${c.name}`} onClick={() => remove(c)}>×</button></td>
        </tr>;
      })}</tbody></table></div>
    <datalist id="tc2-cities">{cities.map(c => <option key={c} value={c} />)}</datalist>
    {form && <ContactForm contact={form} onClose={() => setForm(null)} onSave={save} />}
  </main>;
}

function ContactForm({ contact, onClose, onSave }: { contact: Contact; onClose: () => void; onSave: (v: Contact) => void }) {
  const [v, setV] = useState(contact), [error, setError] = useState('');
  const set = (k: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV(x => ({ ...x, [k]: e.target.value }));
  return <div className="sm-dialog" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><form className="sm-dialog-card" onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') onClose(); }} onSubmit={e => {
    e.preventDefault();
    if (!v.name.trim()) { setError('Give them a name.'); return; }
    onSave({ ...v, name: v.name.trim() });
  }}>
    <div className="sm-dialog-head"><div><span className="lg-kicker">CONTACT</span><h2>{contact.id ? 'Edit contact' : 'Add contact'}</h2></div><button className="sm-icon-btn" type="button" aria-label="Close" onClick={onClose}>×</button></div>
    <div className="tc2-form">
      <label>Name<input autoFocus value={v.name} onChange={set('name')} placeholder="e.g. Ana" /></label>
      <label>Category<select value={v.category} onChange={set('category')}>{CATS.map(c => <option key={c} value={c}>{ICON[c]} {cap(c)}</option>)}</select></label>
      {v.category === 'other' && <label>What do they do?<input value={v.other} onChange={set('other')} placeholder="e.g. barber, translator" /></label>}
      <label>City<input value={v.city} onChange={set('city')} list="tc2-cities" placeholder="e.g. Belgrade" /></label>
      <label>Phone<input value={v.phone} onChange={set('phone')} inputMode="tel" placeholder="+381 …" /></label>
      <label>Facebook<input value={v.fb} onChange={set('fb')} placeholder="profile link or name" /></label>
      <label>Instagram<input value={v.ig} onChange={set('ig')} placeholder="@handle" /></label>
      <label>Price per hour<span className="tc2-price"><input value={v.currency} onChange={set('currency')} className="tc2-cur" /><input value={v.price} onChange={set('price')} inputMode="decimal" placeholder="e.g. 15" /></span></label>
      <label className="tc2-wide">Notes<textarea value={v.notes} onChange={set('notes')} rows={3} placeholder="Availability, languages, who recommended them…" /></label>
    </div>
    <p className="sm-form-error" role="alert">{error}</p>
    <div className="sm-dialog-actions"><button className="ctl" type="button" onClick={onClose}>Cancel</button><button className="ctl primary" type="submit">Save contact</button></div>
  </form></div>;
}
