// Configurable navigation shortcuts. Settings owns the recorder UI; this file
// owns storage, normalisation and the global key handler.
(function () {
  const STORE = 'tabHotkeys';
  const load = () => { try { return JSON.parse(liveStore(STORE) || '{}') || {}; } catch (_) { return {}; } };
  const save = (map) => liveStore(STORE, JSON.stringify(map));
  const enabled = () => liveStore('tabHotkeysEnabled') !== '0';
  const modifier = (key) => ['Meta', 'Control', 'Alt', 'Shift'].includes(key);
  const cleanKey = (key) => key === ' ' ? 'Space' : key.length === 1 ? key.toUpperCase() : key;
  const canonical = (event) => {
    if (modifier(event.key)) return '';
    const parts = [];
    if (event.metaKey) parts.push('Meta');
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    parts.push(cleanKey(event.key));
    return parts.join('+');
  };
  const label = (value) => value ? value.replace('Meta+', '⌘').replace('Ctrl+', '⌃').replace('Alt+', '⌥').replace('Shift+', '⇧') : 'Set hotkey';
  const reserved = new Set([
    'Meta+H', 'Meta+Q', 'Meta+W', 'Meta+T', 'Meta+N', 'Meta+R', 'Meta+L',
    'Meta+K', 'Meta+F', 'Meta+Shift+F', 'Meta+1', 'Meta+2', 'Meta+3',
    'Meta+4', 'Meta+5', 'Meta+6', 'Meta+7', 'Meta+8', 'Meta+9',
    'Meta+C', 'Meta+V', 'Meta+X', 'Meta+A', 'Meta+Z', 'Meta+Shift+Z'   // copy / paste / cut / select all / undo / redo: never a tab shortcut
  ]);
  const isReserved = (value) => reserved.has(value);
  // A useful first shortcut without overwriting anything the user has already assigned.
  const initial = load();
  Object.keys(initial).forEach(k => { if (reserved.has(initial[k])) delete initial[k]; });   // drops one saved before it was reserved (e.g. ⌘C -> Live Call)
  save(initial);
  if (!initial.studio && !Object.values(initial).includes('Meta+S')) { initial.studio = 'Meta+S'; save(initial); }
  window.TabHotkeys = { load, save, enabled, canonical, label, isReserved };

  document.addEventListener('keydown', (event) => {
    if (!enabled() || event.defaultPrevented || event.repeat || document.body.classList.contains('recording-hotkey')) return;
    const target = event.target;
    if (target && target.matches && (target.matches('input, textarea, select') || target.isContentEditable)) return;
    const value = canonical(event);
    if (!value || reserved.has(value)) return;
    const match = Object.entries(load()).find(([, hotkey]) => hotkey === value);
    if (!match) return;
    const button = document.getElementById('tab-' + match[0]);
    if (!button || button.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    button.click();
  }, true);
})();
