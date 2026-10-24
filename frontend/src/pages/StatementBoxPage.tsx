import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useRecord } from '../useRecord';

// 🗣️ Statement Box: each statement / objection from the "Statement box" PDF as a heading (click it to open the scripted response
// underneath), with a "Drilled 20 times?" tickbox. Which ones are ticked is saved on the server (GET / POST /api/statement-box).
type Section = { title: string; ask: string | null; items: Array<{ t: string; b?: string }> };

export function StatementBoxPage() {
  const { doc, status } = useRecord<{ sections: Section[] }>('statement-content', { sections: [] });
  const sections = doc?.sections || [];
  const total = sections.reduce((n, s) => n + s.items.length, 0);
  const [ticked, setTicked] = useState<Set<string>>(new Set()), [open, setOpen] = useState<Set<string>>(new Set());
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => { api<{ ticked?: string[] }>('/api/statement-box').then(d => setTicked(new Set(d.ticked || []))).catch(() => { /* offline: nothing ticked */ }); }, []);
  const tick = (id: string, on: boolean) => setTicked(cur => {
    const next = new Set(cur); if (on) next.add(id); else next.delete(id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => fetch('/api/statement-box', { method: 'POST', body: JSON.stringify({ ticked: [...next] }), keepalive: true }).catch(() => {}), 400);
    return next;
  });
  const toggle = (id: string) => setOpen(cur => { const next = new Set(cur); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  return <article className="selfdev-doc" id="sb-doc">
    <div className="sb-count">{ticked.size} of {total} drilled 20 times</div>
    {status && <p role="alert">Could not load statement content: {status}</p>}
    {doc && !sections.length && <p>No statement content has been configured on this installation.</p>}
    {sections.map((sec, si) => <section key={si}>
      <h2>{sec.title}</h2>
      {sec.ask && <div className="sb-ask">{sec.ask}</div>}
      {sec.items.map((item, ii) => { const id = `${si}-${ii}`, done = ticked.has(id);
        return <div className="sb-item" key={id}>
          <div className={`sb-row${done ? ' done' : ''}${item.b ? ' has-body' : ''}${open.has(id) ? ' open' : ''}`} onClick={() => item.b && toggle(id)}>
            <span className="sb-arrow">▸</span><span className="sb-title">{item.t}</span>
            <label className="sb-drill" onClick={e => e.stopPropagation()}><input type="checkbox" checked={done} onChange={e => tick(id, e.target.checked)} /> Drilled 20 times?</label>
          </div>
          {item.b && <div className="sb-body">{item.b}</div>}
        </div>; })}
    </section>)}
  </article>;
}

// 📨 Messaging: a placeholder for one inbox across Facebook, Instagram and WhatsApp.
export function MessagingPage() {
  return <article className="selfdev-doc biz-doc"><h2>📨 Integrated messaging</h2><div className="msg-soon"><h3>Coming soon</h3><div className="msg-chips"><span title="Facebook">FB</span><span title="Instagram">IG</span><span title="WhatsApp">WPP</span></div></div></article>;
}
