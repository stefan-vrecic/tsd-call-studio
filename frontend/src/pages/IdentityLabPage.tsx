import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRecord } from '../useRecord';

// 🧠 Identity Lab: daily sentence completion for salespeople (the exercise format Nathaniel Branden used in The Six Pillars of
// Self-Esteem; the stems here are Call Studio's own, written for sales). Each session: 5 stems from six categories, 6-10 quick
// endings each (Enter = next ending, ⌘/Ctrl+Enter = next stem), then ONE concrete behaviour to practise on the next call, which the
// following session asks about. Saved as records "identitylab" (routes/records.py):
//   { target, sessions: [{ id, date, target, stems: [{ id, category, text, endings[], suggested? }], commitment, practised, reflection, done }],
//     suggestions: [{ id, category, text, reason?, source?, used? }] }
// `suggestions` is the hook for call analysis: anything that writes a stem there (e.g. after a review finds rushed closes) gets used
// first in the next session, marked "from your calls". Nothing writes to it yet.
type Cat = 'identity' | 'efficacy' | 'standards' | 'emotion' | 'mastery' | 'beliefs';
type Stem = { id: string; category: Cat; text: string; endings: string[]; suggested?: boolean; reason?: string };
type Session = { id: string; date: string; target: string; stems: Stem[]; commitment: string; practised?: '' | 'yes' | 'partly' | 'no'; reflection?: string; done?: boolean; createdAt: string; updatedAt?: string };
type Suggestion = { id: string; category: Cat; text: string; reason?: string; source?: string; used?: boolean };
// (updatedAt / targetAt / deleted let the server merge two open tabs instead of the last save winning: routes/records.py)
type Doc = { target: string; targetAt?: string; sessions: Session[]; suggestions: Suggestion[]; deleted?: string[] };

const CATS: Array<[Cat, string, string]> = [
  ['identity', 'Professional identity', 'Who you are when you sell'],
  ['efficacy', 'Self-efficacy', 'Evidence that you can do it'],
  ['standards', 'Standards & discipline', 'What you do when nobody checks'],
  ['emotion', 'Emotional regulation', 'Staying steady under pressure'],
  ['mastery', 'Sales mastery', 'The craft itself'],
  ['beliefs', 'Limiting beliefs & resistance', 'What gets in your own way'],
];
const CAT_LABEL = Object.fromEntries(CATS.map(([k, l]) => [k, l])) as Record<Cat, string>;
// {t} = the identity target, e.g. "a $20K/month closer"
const STEMS: Record<Cat, string[]> = {
  identity: ['The closer I am becoming would never…', 'As {t}, I walk into every call…', 'Prospects trust me when I…', 'The way I want a client to describe me after a call is…', 'Being {t} means I…', 'What separates me from an average closer is…'],
  efficacy: ['A call I handled well recently showed me that I…', 'When a call gets hard, I can count on myself to…', 'I know I can close because…', 'Something I can do on calls now that I couldn’t a year ago is…', 'The skill I’ve proven to myself this month is…', 'When I trust my preparation, I…'],
  standards: ['My non-negotiable before every call is…', 'If I held myself to the standard of {t} this week, I would…', 'The habit that costs me the most deals is…', 'When nobody is checking my numbers, I…', 'Doing the work properly today looks like…', 'The corner I am tempted to cut is…'],
  emotion: ['When a prospect pushes back on price, I feel… and I can…', 'After a no, the first thing I do is…', 'When I notice tension on a call, I…', 'When a call goes off-script, I steady myself by…', 'The emotion that shows up before a big call is…', 'If I stay calm in silence after the price, I…'],
  mastery: ['The part of my calls I most want to sharpen is…', 'A question I could ask more often is…', 'When I really listen, I notice…', 'A great close sounds like…', 'The objection I handle best is… because…', 'If I slowed my discovery down, I would…'],
  beliefs: ['The story I tell myself after a lost deal is…', 'Part of me hesitates to ask for the money because…', 'If I stopped needing every prospect to like me…', 'Something I avoid on calls is… because…', 'I sometimes doubt I am {t} because…', 'The excuse I reach for most often is…'],
};
const TARGETS = ['$10K/month closer', '$20K/month closer', '$50K/month closer'];
const MIN = 6, MAX = 10, PER_SESSION = 5;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fill = (text: string, target: string) => text.replace(/\{t\}/g, `a ${target}`);
const nice = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

/** Today's stems: suggestions from calls first, then 5 of the 6 categories (rotating by day, so all six come round), avoiding stems used in the last 3 sessions. */
function pickStems(doc: Doc): { stems: Stem[]; used: string[] } {
  const recent = new Set(doc.sessions.slice(0, 3).flatMap(s => s.stems.map(x => x.text)));
  const day = Math.floor(Date.now() / 86400000);
  const skip = CATS[day % CATS.length][0];
  const cats = CATS.map(c => c[0]).filter(c => c !== skip);
  const sugg = doc.suggestions.filter(s => !s.used);
  const used: string[] = [];
  const stems = cats.slice(0, PER_SESSION).map((cat, i) => {
    const s = sugg.find(x => x.category === cat && !used.includes(x.id));
    if (s) { used.push(s.id); return { id: uid(), category: cat, text: s.text, endings: [], suggested: true, reason: s.reason }; }
    const pool = STEMS[cat].filter(t => !recent.has(t));
    const list = pool.length ? pool : STEMS[cat];
    return { id: uid(), category: cat, text: list[(day + i) % list.length], endings: [] };
  });
  return { stems, used };
}

// A session as notebook pages: the Journal's own paper, rings and date (static/js/journal-typed.js jtDrawPage) with the writing drawn on
// top here -- drawn when shown, never saved, so the sessions stay small text. Every stem starts a new page: the stem in bold dark ink,
// a blank ruled line, then the endings as blue bullets. The action commitment gets the last page. The font is a setting
// (Settings -> Notebook pages, localStorage "notebookFont": "mix" = clean sans-serif date and stems with your answers in handwriting
// (the default), "hand" = all handwriting like the Journal, "sans" = all sans-serif).
const PG = { top: 230, line: 70, left: 90, right: 930, h: 1500, ink: '#2b3a9e' };
const FAMILY = { hand: '"Bradley Hand", "Noteworthy", "Segoe Print", "Comic Sans MS", cursive', sans: '"Avenir Next", "Helvetica Neue", Arial, sans-serif' };
type FontKey = 'hand' | 'sans' | 'mix';
const readFont = (): FontKey => { try { const v = localStorage.getItem('notebookFont'); return v === 'sans' || v === 'hand' ? v : 'mix'; } catch { return 'mix'; } };
const PER_PAGE = Math.floor((PG.h - PG.top - 110) / PG.line);
type Ln = { text: string; kind: 'stem' | 'gap' | 'end'; bullet?: boolean; indent?: number };
let FONTS = { stem: '', gap: '', end: '' };
const useFont = (f: FontKey) => {
  const stem = f === 'hand' ? `bold 48px ${FAMILY.hand}` : `600 42px ${FAMILY.sans}`;   // the stem: sans-serif unless it's all handwriting
  const end = f === 'sans' ? `40px ${FAMILY.sans}` : `46px ${FAMILY.hand}`;               // what you wrote: handwriting unless it's all sans-serif
  FONTS = { stem, gap: end, end };
};
function wrap(ctx: CanvasRenderingContext2D, text: string, kind: Ln['kind'], indent = 0, bullet = false): Ln[] {
  ctx.font = FONTS[kind];
  const max = PG.right - PG.left - indent, out: Ln[] = [];
  let line = '', first = true;
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const trial = line ? line + ' ' + w : w;
    if (ctx.measureText(trial).width <= max || !line) line = trial;
    else { out.push({ text: line, kind, bullet: bullet && first, indent }); first = false; line = w; }
  }
  out.push({ text: line, kind, bullet: bullet && first, indent });
  return out;
}
function sessionBlocks(s: Session, ctx: CanvasRenderingContext2D): Ln[][] {
  const blocks = s.stems.filter(x => x.endings.some(e => e.trim())).map(x => [
    ...wrap(ctx, fill(x.text, s.target), 'stem'),
    { text: '', kind: 'gap' as const },
    ...x.endings.filter(e => e.trim()).flatMap(e => wrap(ctx, e.trim(), 'end', 50, true)),
  ]);
  if (s.commitment.trim()) blocks.push([...wrap(ctx, 'On my next call, I will…', 'stem'), { text: '', kind: 'gap' }, ...wrap(ctx, s.commitment.trim(), 'end', 50, true)]);
  return blocks;
}
function drawSession(s: Session, font: FontKey): string[] {
  useFont(font);
  const jt = (window as unknown as { jtDrawPage?: (lines: unknown[], date: string, n: number, of: number) => HTMLCanvasElement }).jtDrawPage;
  if (!jt) return [];
  const probe = document.createElement('canvas').getContext('2d')!;
  const chunks = sessionBlocks(s, probe).flatMap(b => { const c: Ln[][] = []; for (let i = 0; i < b.length; i += PER_PAGE) c.push(b.slice(i, i + PER_PAGE)); return c; });
  return chunks.map((lines, k) => {
    const c = jt([], s.date, k + 1, chunks.length), g = c.getContext('2d')!;   // paper, rings and "23rd Oct (k/n)"
    if (font !== 'hand') {   // the painter writes the date in handwriting: paint over it and write it again in sans-serif
      g.fillStyle = '#fbfaf6'; g.fillRect(60, 92, 840, 128);
      const d = new Date(`${s.date}T12:00:00`), label = `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}${chunks.length > 1 ? `  (${k + 1}/${chunks.length})` : ''}`;
      g.fillStyle = PG.ink; g.strokeStyle = PG.ink; g.font = `600 48px ${FAMILY.sans}`; g.fillText(label, PG.left, PG.top - 70);
      g.lineWidth = 2.5; g.beginPath(); g.moveTo(PG.left - 6, PG.top - 52); g.lineTo(PG.left + g.measureText(label).width + 30, PG.top - 52); g.stroke();
    }
    lines.forEach((ln, i) => {
      if (ln.kind === 'gap') return;
      const y = PG.top + PG.line * (i + 1) - 14;
      g.font = FONTS[ln.kind];
      g.fillStyle = ln.kind === 'stem' ? '#1f2937' : PG.ink;
      if (ln.bullet) { g.beginPath(); g.arc(PG.left + 14, y - 14, 5.5, 0, Math.PI * 2); g.fill(); }
      g.fillText(ln.text, PG.left + (ln.indent || 0), y);
    });
    return c.toDataURL('image/png');
  });
}
function NotebookPages({ session }: { session: Session }) {
  const [font, setFont] = useState<FontKey>(readFont);
  useEffect(() => { const on = () => setFont(readFont()); window.addEventListener('callstudio:notebook-font', on); window.addEventListener('storage', on); return () => { window.removeEventListener('callstudio:notebook-font', on); window.removeEventListener('storage', on); }; }, []);
  const urls = useMemo(() => drawSession(session, font), [session, font]);
  const [at, setAt] = useState<number | null>(null);
  useEffect(() => {
    if (at === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAt(null);
      else if (e.key === 'ArrowRight') setAt(i => i === null ? i : (i + 1) % urls.length);
      else if (e.key === 'ArrowLeft') setAt(i => i === null ? i : (i - 1 + urls.length) % urls.length);
      else return;
      e.preventDefault(); e.stopPropagation();
    };
    document.addEventListener('keydown', key, true);
    return () => document.removeEventListener('keydown', key, true);
  }, [at, urls.length]);
  if (!urls.length) return <p className="il-hint">The notebook pages need the Journal's page painter, which hasn't loaded.</p>;
  return <>
    <div className="il-pages">{urls.map((u, i) => <button key={i} className="il-sheet" title="Click to open the gallery" onClick={() => setAt(i)}><img src={u} alt={`Page ${i + 1} of ${urls.length}`} /></button>)}</div>
    {at !== null && createPortal(<div className="il-gallery" onClick={e => { if (e.target === e.currentTarget) setAt(null); }}>
      <button className="il-g-nav prev" aria-label="Previous page" onClick={() => setAt((at - 1 + urls.length) % urls.length)}>‹</button>
      <img src={urls[at]} alt={`Page ${at + 1} of ${urls.length}`} />
      <button className="il-g-nav next" aria-label="Next page" onClick={() => setAt((at + 1) % urls.length)}>›</button>
      <div className="il-g-bar"><span>{at + 1} / {urls.length}</span><span>← → to flip · Esc to close</span><button onClick={() => setAt(null)}>✕ Close</button></div>
    </div>, document.body)}
  </>;
}

export function IdentityLabPage() {
  const { doc, update, status, reload } = useRecord<Doc>('identitylab', { target: TARGETS[1], sessions: [], suggestions: [] });
  const [active, setActive] = useState<string | null>(null), [step, setStep] = useState(0), [open, setOpen] = useState<string | null>(null), [custom, setCustom] = useState(false);
  const [book, setBook] = useState(() => { try { return localStorage.getItem('identityLabView') === 'book'; } catch { return false; } });
  const setView = (b: boolean) => { setBook(b); try { localStorage.setItem('identityLabView', b ? 'book' : 'list'); } catch { /* not remembered */ } };
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const focusAt = useRef<number | null>(null);
  const sessions = doc?.sessions || [];
  const todays = sessions.find(s => s.date === today());
  const session = sessions.find(s => s.id === active) || null;
  const toReview = useMemo(() => sessions.find(s => s.done && s.commitment.trim() && !s.practised && s.date !== today()), [sessions]);
  useEffect(() => { if (focusAt.current != null) { inputs.current[focusAt.current]?.focus(); focusAt.current = null; } });
  // coming back to this tab: pick up what another tab saved (not while writing, so the page doesn't jump under you)
  useEffect(() => {
    const back = () => { if (!document.hidden && !active) reload(); };
    document.addEventListener('visibilitychange', back); window.addEventListener('focus', back);
    return () => { document.removeEventListener('visibilitychange', back); window.removeEventListener('focus', back); };
  }, [reload, active]);
  if (!doc) return <article className="selfdev-doc il-page"><h2>🧠 Identity Lab</h2><p>{status || 'Loading…'}</p></article>;

  const stamp = () => new Date().toISOString();
  const edit = (fn: (s: Session) => void) => update(d => { const s = d.sessions.find(x => x.id === active); if (s) { fn(s); s.updatedAt = stamp(); } return d; });
  const editById = (id: string, fn: (s: Session) => void) => update(d => { const s = d.sessions.find(x => x.id === id); if (s) { fn(s); s.updatedAt = stamp(); } return d; });
  const setTarget = (t: string) => update(d => { d.target = t; d.targetAt = stamp(); return d; });
  const start = () => {
    if (todays) { setActive(todays.id); setStep(todays.done ? todays.stems.length : 0); return; }
    const { stems, used } = pickStems(doc);
    const s: Session = { id: uid(), date: today(), target: doc.target, stems, commitment: '', practised: '', createdAt: stamp(), updatedAt: stamp() };
    update(d => { d.sessions.unshift(s); d.suggestions.forEach(x => { if (used.includes(x.id)) x.used = true; }); return d; });
    setActive(s.id); setStep(0); focusAt.current = 0;
  };
  const go = (n: number) => { setStep(n); focusAt.current = 0; };

  // ---- writing a session ----
  if (session) {
    const stem = session.stems[step];
    if (!stem) {   // last step: the commitment
      return <article className="selfdev-doc il-page il-focus">
        <div className="il-top"><button className="ctl" onClick={() => go(session.stems.length - 1)}>← Back</button><span className="il-progress">{session.stems.map((s, i) => <i key={s.id} className={s.endings.filter(Boolean).length >= MIN ? 'full' : s.endings.some(Boolean) ? 'some' : ''} onClick={() => go(i)} />)}<i className="now" /></span><button className="ctl" onClick={() => setActive(null)}>Close</button></div>
        <h2 className="il-stem"><span className="il-stem-cat">Action commitment</span><span className="il-dash">—</span><span className="il-stem-text">On my next sales call, I will…</span></h2>
        <p className="il-hint">One concrete, observable behaviour. Not “be confident”, but e.g. “stay silent for five seconds after I give the price”.</p>
        <textarea className="il-commit" autoFocus rows={3} value={session.commitment} placeholder="e.g. ask two more follow-up questions before I present the offer"
          onChange={e => edit(s => { s.commitment = e.target.value; })}
          onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); edit(s => { s.done = true; }); setActive(null); } }} />
        <div className="il-actions"><span className="il-keys">⌘↵ finish</span><button className="ctl biz-primary" onClick={() => { edit(s => { s.done = true; }); setActive(null); }}>Finish session</button></div>
      </article>;
    }
    const endings = stem.endings.length ? stem.endings : [''];
    const filled = stem.endings.filter(x => x.trim()).length;
    const setEnding = (i: number, v: string) => edit(s => { const st = s.stems[step]; const list = st.endings.length ? st.endings : ['']; list[i] = v; st.endings = list; });
    const key = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const v = e.currentTarget.value;
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); go(step + 1); return; }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!v.trim() && filled >= MIN) { go(step + 1); return; }   // an empty Enter after enough endings moves on
        if (i === endings.length - 1 && endings.length < MAX && v.trim()) edit(s => { s.stems[step].endings = [...endings, '']; });
        focusAt.current = Math.min(i + 1, MAX - 1);
        if (i < endings.length - 1) inputs.current[i + 1]?.focus();
      } else if (e.key === 'Backspace' && !v && i > 0) {
        e.preventDefault();
        edit(s => { s.stems[step].endings = endings.filter((_, j) => j !== i); });
        focusAt.current = i - 1;
      } else if (e.key === 'ArrowDown' && i < endings.length - 1) { e.preventDefault(); inputs.current[i + 1]?.focus(); }
      else if (e.key === 'ArrowUp' && i > 0) { e.preventDefault(); inputs.current[i - 1]?.focus(); }
    };
    return <article className="selfdev-doc il-page il-focus">
      <div className="il-top"><button className="ctl" disabled={step === 0} onClick={() => go(step - 1)}>← Back</button>
        <span className="il-progress">{session.stems.map((s, i) => <i key={s.id} title={CAT_LABEL[s.category]} className={`${i === step ? 'now ' : ''}${s.endings.filter(Boolean).length >= MIN ? 'full' : s.endings.some(Boolean) ? 'some' : ''}`} onClick={() => go(i)} />)}<i title="Action commitment" onClick={() => go(session.stems.length)} /></span>
        <button className="ctl" onClick={() => setActive(null)}>Close</button></div>
      <h2 className="il-stem"><span className="il-stem-cat">{CAT_LABEL[stem.category]}</span><span className="il-dash">—</span><span className="il-stem-text">{fill(stem.text, session.target)}</span>
        {stem.suggested && <span className="il-from" title={stem.reason || ''}>from your calls</span>}</h2>
      <ol className="il-endings">{endings.map((v, i) => <li key={i}><input ref={el => { inputs.current[i] = el; }} value={v} autoFocus={i === 0 && !v}
        placeholder={i === 0 ? 'First thing that comes to mind…' : ''} onChange={e => setEnding(i, e.target.value)} onKeyDown={key(i)} /></li>)}</ol>
      <div className="il-actions">
        <span className={`il-count ${filled >= MIN ? 'ok' : ''}`}>{filled} / {MIN}–{MAX} endings</span>
        <span className="il-keys">↵ next ending · ⌘↵ next stem</span>
        <button className="ctl biz-primary" onClick={() => go(step + 1)}>{step === session.stems.length - 1 ? 'Commitment →' : 'Next stem →'}</button>
      </div>
      <p className="il-hint">Write fast and don’t edit. Some endings will be obvious, some surprising: the surprising ones are worth a second look.</p>
    </article>;
  }

  // ---- home ----
  const streak = (() => { let n = 0; const d = new Date(); for (;;) { const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; if (sessions.some(s => s.date === iso && s.done)) { n++; d.setDate(d.getDate() - 1); } else if (n === 0 && iso === today()) d.setDate(d.getDate() - 1); else return n; } })();
  return <article className="selfdev-doc il-page">
    <header className="il-head">
      <div><h2>🧠 Identity Lab</h2><p className="il-sub">Sentence completion for closers: a few minutes of fast, honest writing, then one behaviour to practise on your next call.</p></div>
      <div className="il-stats"><span><b>{sessions.filter(s => s.done).length}</b> sessions</span><span><b>{streak}</b> day streak</span></div>
    </header>

    <div className="il-target">
      <span>Identity target</span>
      {TARGETS.map(t => <button key={t} className={doc.target === t && !custom ? 'on' : ''} onClick={() => { setCustom(false); setTarget(t); }}>{t.replace(' closer', '')}</button>)}
      {custom || !TARGETS.includes(doc.target)
        ? <input autoFocus={custom} value={doc.target} placeholder="e.g. top closer on my team" onChange={e => setTarget(e.target.value)} onKeyDown={e => e.stopPropagation()} />
        : <button onClick={() => setCustom(true)}>Custom…</button>}
    </div>

    {toReview && <section className="il-review">
      <p className="il-cat">Last commitment · {nice(toReview.date)}</p>
      <p className="il-commit-text">“{toReview.commitment}”</p>
      <p>Did you practise it on a call?</p>
      <div className="il-choices">{(['yes', 'partly', 'no'] as const).map(v => <button key={v} className="ctl" onClick={() => editById(toReview.id, s => { s.practised = v; })}>{v === 'yes' ? '✅ Yes' : v === 'partly' ? '◐ Partly' : '✕ Not yet'}</button>)}</div>
    </section>}

    <section className="il-start">
      {todays?.done ? <><p>✅ Today’s session is done. Commitment: <b>{todays.commitment || '—'}</b></p><button className="ctl" onClick={start}>Review / edit today</button></>
        : <><p>{todays ? 'You started today’s session.' : `${PER_SESSION} stems · about 10 minutes · as a ${doc.target}`}</p><button className="ctl biz-primary il-go" onClick={start}>{todays ? 'Continue today’s session →' : 'Start today’s session →'}</button></>}
    </section>

    <div className="il-h3row"><h3 className="il-h3">Previous sessions</h3>
      <div className="rl-view il-viewswitch" role="group" aria-label="Show sessions as"><button type="button" className={book ? '' : 'on'} onClick={() => setView(false)}>List</button><button type="button" className={book ? 'on' : ''} onClick={() => setView(true)}>📓 Notebook</button></div></div>
    {!sessions.length && <p className="il-hint">Nothing yet. Your sessions will show up here.</p>}
    {book ? <div className="il-book">{sessions.map(s => <section key={s.id} className="il-book-day">
      <h4>{new Date(`${s.date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} <span>{s.target}{s.practised ? ` · ${s.practised === 'yes' ? 'practised' : s.practised === 'partly' ? 'partly practised' : 'not practised yet'}` : ''}</span></h4>
      <NotebookPages session={s} />
    </section>)}</div>
    : <div className="il-history">{sessions.map(s => {
      const n = s.stems.reduce((a, x) => a + x.endings.filter(Boolean).length, 0);
      return <div key={s.id} className="il-past">
        <button className="il-past-head" onClick={() => setOpen(o => o === s.id ? null : s.id)}>
          <b>{nice(s.date)}</b><span>{s.target}</span><span>{n} endings</span>
          {s.commitment && <span className="il-past-commit">→ {s.commitment}</span>}
          {s.practised && <span className={`il-badge ${s.practised}`}>{s.practised === 'yes' ? 'practised' : s.practised === 'partly' ? 'partly' : 'not yet'}</span>}
          {!s.done && <span className="il-badge">unfinished</span>}
        </button>
        {open === s.id && <div className="il-past-body">
          {s.stems.map(x => <div key={x.id}><p className="il-stem il-past-stem"><span className="il-stem-cat">{CAT_LABEL[x.category]}</span><span className="il-dash">—</span><span className="il-stem-text">{fill(x.text, s.target)}</span></p>
            <ul>{x.endings.filter(Boolean).map((e, i) => <li key={i}>{e}</li>)}</ul></div>)}
          {s.done && s.practised && <textarea rows={2} className="il-reflect" placeholder="What happened when you tried it? (optional)" value={s.reflection || ''}
            onChange={e => editById(s.id, t => { t.reflection = e.target.value; })} onKeyDown={e => e.stopPropagation()} />}
          <button className="ctl il-del" onClick={() => { if (confirm(`Delete the session from ${nice(s.date)}?`)) update(d => { d.sessions = d.sessions.filter(y => y.id !== s.id); d.deleted = [...(d.deleted || []), s.id]; return d; }); }}>Delete session</button>
        </div>}
      </div>;
    })}</div>}
    <p className="il-note">A reflection practice: it helps you notice how you think about selling. The change comes from acting on it, call by call.</p>
    {status && status !== 'Saving…' && <p className="il-hint">⚠️ {status}</p>}
  </article>;
}
