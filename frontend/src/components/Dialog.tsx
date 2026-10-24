import { useEffect } from 'react';

// The shared dialog box for React pages -- same look as the plain pages' csDialog (static/js/ui.js; .cs-dialog styles):
// a title, the body, and buttons along the bottom. Esc, ✕ and a click outside close it; keys typed inside don't reach the page shortcuts.
export function Dialog({ title, className = '', onClose, footer, children }: { title: string; className?: string; onClose: () => void; footer?: React.ReactNode; children: React.ReactNode }) {
  useEffect(() => { const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } }; document.addEventListener('keydown', esc, true); return () => document.removeEventListener('keydown', esc, true); }, [onClose]);
  return <div className="cs-dialog-bg" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={e => e.stopPropagation()}>
    <div className={`cs-dialog ${className}`} role="dialog" aria-modal="true">
      <header><b>{title}</b><button className="ctl cs-dialog-x" title="Close (Esc)" onClick={onClose}>✕</button></header>
      <div className="cs-dialog-body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </div>
  </div>;
}
