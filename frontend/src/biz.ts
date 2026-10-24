// Small money / date / CSV helpers for the business pages (Clients, Accounting) -- the React twins of static/js/records.js.
export const money = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
export const num = (v: unknown) => { const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : 0; };
export const today = () => new Date().toLocaleDateString('en-CA');
export const monthOf = (d: string) => String(d || '').slice(0, 7);
export const daysBetween = (a: string, b: string) => Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000);
export const uid = () => Math.random().toString(36).slice(2, 11);
export const csv = (rows: unknown[][]) => rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\n');
export function download(filename: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}
export const toast = (text: string) => (window as Window & { csToast?: (t: string) => void }).csToast?.(text);
