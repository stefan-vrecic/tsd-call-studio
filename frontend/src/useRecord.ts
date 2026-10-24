import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

/**
 * One saved document from the records store (live_docs/records/<name>.json, routes/records.py) for a React page:
 *   const { doc, update, status, reload } = useRecord('leadgen', { leads: [] });
 *   update(d => { d.leads.push(lead); return d; })   -- changes a copy, shows it at once, saves half a second after the last change
 * status is '' when saved, 'Saving…' while waiting, or an error message.
 */
export function useRecord<T extends object>(name: string, empty: T) {
  const [doc, setDoc] = useState<T | null>(null), [status, setStatus] = useState('');
  const timer = useRef<number>(), emptyRef = useRef(empty);
  const reload = useCallback(() => api<T>(`/api/records?name=${encodeURIComponent(name)}`)
    .then(d => setDoc({ ...emptyRef.current, ...d })).catch(e => setStatus(e instanceof Error ? e.message : 'could not load')), [name]);
  useEffect(() => { reload(); }, [reload]);
  const update = useCallback((fn: (d: T) => T) => setDoc(cur => {
    if (!cur) return cur;
    const next = fn(structuredClone(cur));
    setStatus('Saving…');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => fetch(`/api/records?name=${encodeURIComponent(name)}`, { method: 'POST', body: JSON.stringify(next) })
      .then(r => setStatus(r.ok ? '' : 'Not saved — is Call Studio running?')).catch(() => setStatus('Not saved — is Call Studio running?')), 500);
    return next;
  }), [name]);
  return { doc, update, status, reload };
}
