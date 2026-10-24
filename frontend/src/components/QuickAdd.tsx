import { useEffect, useRef, useState } from 'react';
import { api, downloadSwipe } from '../api';
import type { RouteKey } from '../types';

type Kind = 'swipe' | 'idea' | 'tracker' | null;

export function QuickAdd({ open, initial, onClose, onNavigate, onSwipeAdded }: { open: boolean; initial?: Kind; onClose: () => void; onNavigate: (r: RouteKey) => void; onSwipeAdded: () => void }) {
  const [kind, setKind] = useState<Kind>(initial || null), [value, setValue] = useState(''), [status, setStatus] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setKind(initial || null); setStatus(''); setTimeout(() => input.current?.focus(), 0); } }, [open, initial]);
  useEffect(() => { if (!open) return; const key = (event: KeyboardEvent) => event.key === 'Escape' && onClose(); document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [open, onClose]);
  if (!open) return null;
  const chooseCall = () => { onClose(); (document.getElementById('file-input') as HTMLInputElement | null)?.click(); };
  const save = async () => {
    if (!kind || !value.trim()) return input.current?.focus();
    setStatus('Saving…');
    try {
      if (kind === 'swipe') { const result = await downloadSwipe({ link: value.trim() }); setStatus(result.duplicate ? 'Already saved ✓' : 'Download started ✓'); onSwipeAdded(); }
      if (kind === 'tracker') { const result = await api<{ entries?: unknown[]; problems?: string[] }>('/api/tracker-quick', { method: 'POST', body: JSON.stringify({ text: value.trim() }) }); if (!result.entries?.length) throw new Error(result.problems?.join(', ') || 'Nothing was recognised'); setStatus(`Logged ${result.entries.length} tracker ${result.entries.length === 1 ? 'entry' : 'entries'} ✓`); }
      if (kind === 'idea') { const fn = (window as unknown as { ciAppendIdea?: (text: string) => Promise<void> }).ciAppendIdea; if (!fn) throw new Error('Content workspace is still loading'); await fn(value.trim()); setStatus('Content idea saved ✓'); }
      setValue('');
    } catch (error) { setStatus(`⚠ ${error instanceof Error ? error.message : 'Could not save'}`); }
  };
  return <div className="modern-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="quick-modal" role="dialog" aria-modal="true" aria-label="Add something">
      <header><div><small>QUICK CAPTURE</small><h2>Add something</h2></div><button onClick={onClose}>×</button></header>
      <div className="quick-kinds">
        <button onClick={chooseCall}><b>🎙</b><span>Call recording</span></button>
        <button className={kind === 'swipe' ? 'on' : ''} onClick={() => setKind('swipe')}><b>📲</b><span>Swipe link</span></button>
        <button className={kind === 'idea' ? 'on' : ''} onClick={() => setKind('idea')}><b>💡</b><span>Content idea</span></button>
        <button className={kind === 'tracker' ? 'on' : ''} onClick={() => setKind('tracker')}><b>📈</b><span>Tracker entry</span></button>
      </div>
      {kind && <div className="quick-entry"><label>{kind === 'swipe' ? 'Instagram, TikTok, YouTube or Facebook link' : kind === 'idea' ? 'What do you want to make?' : 'Quick tracker shorthand'}</label><div><input ref={input} value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} placeholder={kind === 'swipe' ? 'Paste a social link…' : kind === 'idea' ? 'Capture the idea…' : 'taken 3 closed 1 guitar 30…'} /><button onClick={save}>{kind === 'swipe' ? 'Download' : 'Save'}</button></div></div>}
      <p className="quick-status">{status}</p>
      <footer><span>Open another area</span>{(['clients', 'accounting', 'delegation', 'journal'] as RouteKey[]).map(r => <button key={r} onClick={() => { onClose(); onNavigate(r); }}>{r[0].toUpperCase() + r.slice(1)}</button>)}</footer>
    </div>
  </div>;
}
