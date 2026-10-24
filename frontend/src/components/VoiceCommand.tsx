import { useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '../api';
import type { RouteKey } from '../types';

type Provider = 'chatgpt' | 'claude';
type VoiceFile = { name: string; path: string; url?: string };
type HistoryItem = { at: number; provider: string; prompt: string; status: string; action: string; answer: string };

const recorderType = () => ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type)) || '';

// answers can carry markdown links: [label](#tracker) = a page here, [label](/?person=X&t=90) = a call at a moment, [label](https://...) = outside
const LINK_RE = /\[([^\]]+)\]\(((?:#|\/|https?:\/\/)[^)\s]+)\)/g;
// **bold** inside a piece of text
function withBold(text: string, key: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, j) => /^\*\*[^*]+\*\*$/.test(part) ? <b key={key + j}>{part.slice(2, -2)}</b> : part);
}
// an answer laid out naturally: its own line breaks, "- " / "• " lines as bullets, **bold**, and [label](link) links
function withLinks(text: string, onPage: (hash: string) => void) {
  return text.replace(/\r/g, '').split('\n').map((line, n) => {
    const bullet = /^\s*(?:[-•*]|\d+[.)])\s+/.exec(line);
    const body = bullet ? line.slice(bullet[0].length) : line;
    return <div key={n} className={bullet ? 'voice-li' : 'voice-line'}>{inlineLinks(body, onPage, String(n))}</div>;
  });
}
function inlineLinks(text: string, onPage: (hash: string) => void, keyBase: string) {
  const out: ReactNode[] = []; let last = 0, m: RegExpExecArray | null, i = 0;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(text))) {
    if (m.index > last) out.push(...withBold(text.slice(last, m.index), keyBase + 'b' + i));
    const [, label, href] = m;
    const outside = /^https?:/.test(href);
    out.push(<a key={keyBase + 'a' + i++} className="voice-link" href={href} target={outside ? '_blank' : undefined} rel={outside ? 'noopener' : undefined}
      onClick={e => { e.stopPropagation(); if (href.startsWith('#')) { e.preventDefault(); onPage(href); } }}>{label}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(...withBold(text.slice(last), keyBase + 'end'));
  return out.length ? out : ['\u00a0'];
}

export function VoiceCommand({ onNavigate }: { onNavigate: (route: RouteKey) => void }) {
  const [provider, setProvider] = useState<Provider>(() => localStorage.getItem('voiceProvider') === 'claude' ? 'claude' : 'chatgpt');
  const [open, setOpen] = useState(false), [recording, setRecording] = useState(false), [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState(''), [answer, setAnswer] = useState(''), [status, setStatus] = useState('Hover to speak');
  const [attachments, setAttachments] = useState<VoiceFile[]>([]), [panel, setPanel] = useState<'history' | 'instructions' | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]), [instructions, setInstructions] = useState('');
  const fileInput = useRef<HTMLInputElement | null>(null);
  const recorder = useRef<MediaRecorder | null>(null), chunks = useRef<Blob[]>([]), stream = useRef<MediaStream | null>(null);
  const textBox = useRef<HTMLTextAreaElement | null>(null);
  // auto-send: after Fn is let go, wait for Wispr Flow's text, then send once it has sat still for 1 s (typing in the box or Esc cancels)
  const fnSession = useRef(false), autoTimer = useRef<number | null>(null), promptNow = useRef('');
  promptNow.current = prompt;
  const [toast, setToast] = useState<{ text: string; key: number; fading: boolean } | null>(null);
  // left (beside the side bar) or centre: Settings -> Voice command -> "Voice bar sits"
  const [dockPos, setDockPos] = useState<'left' | 'center'>(() => localStorage.getItem('voiceDockPosition') === 'center' ? 'center' : 'left');
  useEffect(() => {
    const apply = (p: string) => { const v = p === 'center' ? 'center' : 'left'; setDockPos(v); try { localStorage.setItem('voiceDockPosition', v); } catch { /* fine */ } };
    api<{ voiceDockPosition?: string }>('/api/settings').then(s => apply(s.voiceDockPosition || 'left')).catch(() => {});
    const onSet = (e: Event) => apply(String((e as CustomEvent).detail));
    window.addEventListener('callstudio:voice-position', onSet); return () => window.removeEventListener('callstudio:voice-position', onSet);
  }, []);
  const toastTimers = useRef<number[]>([]);
  const settingsNow = async () => { try { return await api<{ voiceAutoSend?: boolean; voiceToastSeconds?: number }>('/api/settings'); } catch { return {}; } };
  // push-to-talk from the keyboard: Karabiner turns "hold Fn" into F19 (start) and "let go" into F18 (stop). A very short hold can let
  // go before the microphone has started, so a stop that arrives while starting is remembered (stopSoon) and done once it's running.
  const starting = useRef(false), stopSoon = useRef(false), live = useRef({ recording: false, busy: false });
  live.current = { recording, busy };

  useEffect(() => { localStorage.setItem('voiceProvider', provider); }, [provider]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const key = event.key || event.code;
      if (key === 'F19' || event.code === 'F19') { event.preventDefault(); if (!live.current.recording && !live.current.busy && !starting.current) startRef.current(); return; }
      if (key === 'F18' || event.code === 'F18') { event.preventDefault(); if (starting.current) stopSoon.current = true; else if (live.current.recording) stopRef.current(); return; }
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'Space') {
        event.preventDefault();
        if (live.current.recording) stopRef.current(); else if (!live.current.busy && !starting.current) startRef.current();
      }
    };
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);
  useEffect(() => () => stream.current?.getTracks().forEach(track => track.stop()), []);
  const answerNow = useRef(''); answerNow.current = answer;
  const cancelAutoSend = (why?: string) => {
    if (autoTimer.current !== null) { window.clearInterval(autoTimer.current); autoTimer.current = null; if (why) setStatus(why); }
  };
  // Fn let go: Wispr Flow needs a moment to type. Watch the box; once there's text and it hasn't changed for 1 s, send it.
  // Nothing after 10 s (Wispr heard nothing / was cancelled) = give up quietly.
  const autoSendSoon = async () => {
    fnSession.current = false;
    if ((await settingsNow()).voiceAutoSend === false) return;
    cancelAutoSend();
    const began = Date.now();
    let last = promptNow.current, stableSince = Date.now();
    autoTimer.current = window.setInterval(() => {
      const now = promptNow.current;
      if (now !== last) { last = now; stableSince = Date.now(); }
      if (now.trim() && Date.now() - stableSince >= 1000) { cancelAutoSend(); sendRef.current(); return; }
      if (now.trim()) setStatus('Sending in a moment… (type or Esc to stop)');
      if (!now.trim() && Date.now() - began > 10000) cancelAutoSend('Hover to speak');
    }, 150);
  };
  const fadeToastIn = (key: number, ms: number) => {
    toastTimers.current.forEach(t => window.clearTimeout(t)); toastTimers.current = [];
    toastTimers.current.push(window.setTimeout(() => setToast(t => t && t.key === key ? { ...t, fading: true } : t), ms));
    toastTimers.current.push(window.setTimeout(() => setToast(t => t && t.key === key ? null : t), ms + 700));
  };
  const showToast = async (text: string) => {
    const secs = (await settingsNow()).voiceToastSeconds ?? 5;
    toastTimers.current.forEach(t => window.clearTimeout(t)); toastTimers.current = [];
    if (!text || secs <= 0) { setToast(null); return; }
    const key = Date.now();
    setToast({ text, key, fading: false });
    fadeToastIn(key, secs * 1000);
  };
  const goPage = (hash: string) => { window.location.hash = hash; setToast(null); };   // the app follows the #page

  // Fn pressed (Karabiner -> POST /api/voice-signal): open the dock with the cursor in the text box, so Wispr Flow (held Fn) types into it.
  // Only in the tab you're looking at, and not while you're already typing in some other box (Wispr should go there instead).
  useEffect(() => {
    let alive = true, seq = -1;
    const typingElsewhere = () => { const el = document.activeElement as HTMLElement | null; return !!el && el !== textBox.current && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)); };
    const loop = async () => {
      while (alive) {
        try {
          const d = await api<{ seq: number; at: number; kind: string }>(`/api/voice-wait?after=${seq}`);
          const fresh = seq >= 0 && d.seq > seq && Date.now() / 1000 - d.at < 3;
          seq = d.seq;
          if (fresh && d.kind === 'release') { if (fnSession.current) autoSendSoon(); continue; }
          if (fresh && document.visibilityState === 'visible' && document.hasFocus() && !typingElsewhere() && !live.current.recording && !live.current.busy) {
            cancelAutoSend();
            if (answerNow.current) { setPrompt(''); setAnswer(''); }   // a new hold after an answer = a new command
            fnSession.current = true;
            setOpen(true); setStatus('Speak — Wispr Flow types here');
            window.setTimeout(() => textBox.current?.focus(), 0);
          }
        } catch { await new Promise(r => window.setTimeout(r, 3000)); }   // server restarting: try again shortly
      }
    };
    loop();
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    const attach = (event: Event) => { const detail = (event as CustomEvent<VoiceFile>).detail; if (detail?.path) { setAttachments(old => old.some(x => x.path === detail.path) ? old : [...old, detail]); setOpen(true); setStatus('File attached'); } };
    window.addEventListener('callstudio:voice-attach', attach); return () => window.removeEventListener('callstudio:voice-attach', attach);
  }, []);

  const loadHistory = async () => { const d = await api<{ items: HistoryItem[] }>('/api/voice-history'); setHistory(d.items); setPanel('history'); };
  const loadInstructions = async () => { const d = await api<{ instructions: string }>('/api/voice-instructions'); setInstructions(d.instructions); setPanel('instructions'); };
  const uploadFiles = async (files: File[]) => { for (const file of files) { try { const item = await api<VoiceFile>('/api/voice-attachment', { method: 'POST', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name) } }); setAttachments(old => [...old, item]); } catch (e) { setStatus(e instanceof Error ? e.message : 'Attachment failed'); } } };

  const transcribe = async (blob: Blob) => {
    setBusy(true); setStatus('Transcribing locally…'); setAnswer('');
    try {
      const result = await api<{ text: string }>('/api/voice-transcribe', { method: 'POST', headers: { 'Content-Type': blob.type || 'audio/webm' }, body: blob });
      setPrompt(result.text); setStatus('Ready to send');
      window.setTimeout(() => { const box = textBox.current; if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); } }, 0);   // ⌘↵ sends straight away
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not transcribe'); }
    finally { setBusy(false); }
  };
  const stop = () => { if (recorder.current?.state === 'recording') recorder.current.stop(); };
  const start = async () => {
    setOpen(true); setAnswer('');
    starting.current = true; stopSoon.current = false;
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media; chunks.current = [];
      const type = recorderType(), next = new MediaRecorder(media, type ? { mimeType: type } : undefined);
      recorder.current = next;
      next.ondataavailable = event => { if (event.data.size) chunks.current.push(event.data); };
      next.onstop = () => {
        const blob = new Blob(chunks.current, { type: next.mimeType || 'audio/webm' });
        media.getTracks().forEach(track => track.stop()); stream.current = null; setRecording(false);
        if (blob.size) transcribe(blob);
      };
      next.start(); setRecording(true); setStatus('Listening… let go of Fn (or click ■) to stop');
      starting.current = false;
      if (stopSoon.current) { stopSoon.current = false; next.stop(); }
    } catch (error) { starting.current = false; setStatus(error instanceof Error ? error.message : 'Microphone access failed'); }
  };
  const sendRef = useRef<() => void>(() => {});
  const startRef = useRef(start), stopRef = useRef(stop);
  startRef.current = start; stopRef.current = stop;
  // open a page (and a section of it: workouts = Tracker -> Workouts)
  const goTo = (route: RouteKey, view?: string, metric?: string) => {
    if (view) { try { localStorage.setItem('tk-' + 'view', view); } catch { /* fine */ } }
    onNavigate(route);
    if (view && !metric) window.setTimeout(() => window.dispatchEvent(new CustomEvent('callstudio:tracker-view', { detail: view })), 50);
    if (metric) window.setTimeout(() => window.dispatchEvent(new CustomEvent('callstudio:tracker-focus', { detail: metric })), 150);
  };
  const send = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true); setAnswer(''); setStatus(`Asking ${provider === 'chatgpt' ? 'ChatGPT' : 'Claude'}…`);
    try {
      // "go to X tab" inside a longer command happens straight away (no AI); only the rest waits for the assistant
      let text = prompt;
      if (!attachments.length) {
        const split = await api<{ nav: { route: RouteKey; view?: string; metric?: string; answer: string } | null; rest: string }>('/api/voice-split', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) }).catch(() => null);
        if (split?.nav) {
          goTo(split.nav.route, split.nav.view, split.nav.metric);
          if (!split.rest.trim()) {   // it was only "go to X": done
            setPrompt(''); setAnswer(''); setPanel(null); setOpen(false); setStatus('Hover to speak'); textBox.current?.blur(); showToast(split.nav.answer);
            return;
          }
          text = split.rest; setStatus(`${split.nav.answer} Asking ${provider === 'chatgpt' ? 'ChatGPT' : 'Claude'}…`);
        }
      }
      const result = await api<{ answer: string; action?: string; route?: RouteKey; view?: string; url?: string; query?: string; section?: string; closer?: string }>('/api/voice-command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, prompt: text, attachments }) });
      setAnswer(result.answer); setStatus(result.action ? 'Done' : 'Answered');
      if (result.action === 'navigate' && result.route) goTo(result.route, result.view);
      if (result.action === 'tracker') window.dispatchEvent(new CustomEvent('callstudio:tracker-updated'));
      if (result.action === 'calendar') window.dispatchEvent(new CustomEvent('callstudio:calendar-updated'));
      if (result.action === 'todo') window.dispatchEvent(new CustomEvent('callstudio:todos-updated'));
      if (result.action === 'call_search') { onNavigate('studio'); window.setTimeout(() => window.dispatchEvent(new CustomEvent('callstudio:call-search', { detail: result })), 100); }
      if (result.action === 'download' && result.url) { const a = document.createElement('a'); a.href = result.url; a.click(); }
      api<{ items: HistoryItem[] }>('/api/voice-history').then(d => setHistory(d.items)).catch(() => {});   // keep the log fresh, but don't pop it open
      if (result.action) {   // a command was carried out: get out of the way. (A plain answer to a question, or an error, stays up to be read.)
        setPrompt(''); setAnswer(''); setAttachments([]); setPanel(null); setOpen(false); setStatus('Hover to speak');
        textBox.current?.blur();
        showToast(result.answer);   // a small note that fades (Settings -> Voice command)
      }
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Command failed'); }
    finally { setBusy(false); }
  };

  sendRef.current = send;

  return <>{toast && <div key={toast.key} className={`voice-toast pos-${dockPos} ${toast.fading ? 'fading' : ''}`} onClick={() => setToast(null)} title="Click to hide · stays while the mouse is on it"
    onMouseEnter={() => { toastTimers.current.forEach(t => window.clearTimeout(t)); toastTimers.current = []; setToast(t => t && { ...t, fading: false }); }}
    onMouseLeave={() => fadeToastIn(toast.key, 2000)}><span className="voice-tick">✓</span><div className="voice-toast-body">{withLinks(toast.text, goPage)}</div></div>}
  <div className={`voice-dock pos-${dockPos} ${open || recording || busy || prompt || answer ? 'open' : ''}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => { if (!recording && !busy && !prompt && !answer) setOpen(false); }}>
    <div className="voice-panel">
      <button className="voice-handle" type="button" onClick={() => setOpen(value => !value)} aria-label="Open voice commands"><span className={recording ? 'pulse' : ''}>●</span> Voice command <small>hold Fn · ⌘⇧Space</small></button>
      <div className="voice-body">
        <div className="voice-topline"><div className="voice-provider" aria-label="AI provider"><button className={provider === 'chatgpt' ? 'on' : ''} onClick={() => setProvider('chatgpt')}>ChatGPT</button><button className={provider === 'claude' ? 'on' : ''} onClick={() => setProvider('claude')}>Claude</button></div><div className="voice-tools"><button onClick={loadHistory}>History</button><button onClick={loadInstructions}>Instructions</button><button onClick={() => fileInput.current?.click()}>＋ File</button><input ref={fileInput} type="file" multiple hidden onChange={e => { uploadFiles([...(e.target.files || [])]); e.target.value = ''; }} /></div><button className="voice-close" onClick={() => { setOpen(false); setPrompt(''); setAnswer(''); setStatus('Hover to speak'); setPanel(null); }}>×</button></div>
        <div className="voice-compose" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); uploadFiles([...e.dataTransfer.files]); }}><button className={`voice-mic ${recording ? 'recording' : ''}`} onClick={recording ? stop : start} disabled={busy} title={recording ? 'Stop recording' : 'Start recording'}>{recording ? '■' : '🎙'}</button><textarea ref={textBox} value={prompt} onChange={event => setPrompt(event.target.value)} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { cancelAutoSend(); send(); return; } // only real typing stops an auto-send: Wispr Flow puts its text in with ⌘V, which must not count as you editing
          if (autoTimer.current !== null && !event.metaKey && !event.ctrlKey && (event.key.length === 1 || ['Backspace', 'Delete', 'Escape'].includes(event.key))) cancelAutoSend(event.key === 'Escape' ? 'Not sent (Esc)' : 'Not sent: you are editing — ⌘↵ to send'); }} placeholder="Speak, type, or drop files here…" rows={2} /><button className="voice-send" onClick={send} disabled={busy || !prompt.trim()}>Send</button></div>
        {!!attachments.length && <div className="voice-files">{attachments.map(file => <span key={file.path}>📎 {file.name}<button onClick={() => setAttachments(old => old.filter(x => x !== file))}>×</button></span>)}</div>}
        <div className="voice-status">{busy && <i />}<span>{status}</span><small>⌘↵ to send</small></div>
        {answer && <div className="voice-answer">{withLinks(answer, goPage)}</div>}
        {panel === 'history' && <div className="voice-subpanel"><header><b>Command log</b><button onClick={async () => { await api('/api/voice-history-clear', { method: 'POST' }); setHistory([]); }}>Clear</button></header>{history.length ? history.map((row, i) => <div className="voice-history-row" key={i}><time>{new Date(row.at * 1000).toLocaleString()}</time><b>{row.prompt}</b><span>{row.answer}</span></div>) : <p>No commands yet.</p>}</div>}
        {panel === 'instructions' && <div className="voice-subpanel"><header><b>Voice guide — one set of instructions for ChatGPT and Claude</b><button onClick={async () => { await api('/api/voice-instructions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instructions }) }); setStatus('Instructions saved'); }}>Save</button></header><textarea rows={14} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Examples: Use my swipe files as creative references. Keep answers concise. For call searches, prefer exact section names…" /></div>}
      </div>
    </div>
  </div></>;
}
