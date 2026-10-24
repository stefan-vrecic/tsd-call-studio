// followup.js -- objections / follow-up box and the Add to gCal controls.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

function formatShortDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}` : (iso || '');
}

// The follow-up advice is an explanation for the closer plus (usually) a message to send. Newer reviews store them as
// followUpProcess + followUpMessage; older ones have one blob like: Text first, since ... Something like: "Hey Carol, ..."
// so the longest quoted passage is taken as the message and the rest as the explanation.
function splitFollowUp(p) {
  const text = (p.followUpProcess || '').trim();
  if (p.followUpMessage) return { explanation: text, message: p.followUpMessage.trim() };
  const m = text.match(/["“]([\s\S]{25,})["”]/);
  if (!m) return { explanation: text, message: '' };
  const before = text.slice(0, m.index).replace(/\s*(?:something like|for example|e\.g\.?|try|say|send|you could (?:send|say))?\s*[:,\-–—]?\s*$/i, '').trim();
  const after = text.slice(m.index + m[0].length).trim();
  return { explanation: [before, after].filter(Boolean).join(' '), message: m[1].trim() };
}

function renderObjectionBox(p) {
  const box = document.getElementById('objection-box');
  const isLoom = isLoomName(p.name);   // Loom reviews aren't prospects: no objections / follow-up box
  const hasAny = !isLoom && (p.saleClosed || p.primaryObjection || p.secondaryObjection || p.followUpDate || typeof p.followUpPriority === 'number' || p.height || p.weight);
  if (!hasAny) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }
  const field = (label, value) => `<div><div class="field-label">${label}</div><div class="field-value">${value || (p.saleClosed ? 'N/A' : '—')}</div></div>`;
  const priorityValue = p.saleClosed ? '✅ Sale closed' : (typeof p.followUpPriority === 'number' ? `${p.followUpPriority}/5` : '—');
  const showFollowUpControls = !p.saleClosed && typeof p.followUpPriority === 'number' && p.followUpPriority >= 3;

  const notesBits = [p.height && `Height: ${p.height}`, p.weight && `Weight: ${p.weight}`].filter(Boolean);
  const notesBlock = notesBits.length ? `<div class="objection-notes">${notesBits.join(' &nbsp;|&nbsp; ')}</div>` : '';

  const defaultFollowUpDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  };

  const eventList = (p.followUpEvents || []).map(ev =>
    `<a href="${ev.link}" target="_blank" rel="noopener">✓ ${formatShortDate(ev.date)}</a>`
  ).join(' &nbsp; ');

  const dateControls = showFollowUpControls ? `
    <div class="priority-left">
      <div><div class="field-label">Follow-up priority</div><div class="field-value">${priorityValue}</div></div>
      <input type="date" class="followup-date-input" id="followup-date-input" value="${p.followUpEventDate || defaultFollowUpDate()}">
      <button class="gcal-btn" id="followup-gcal-btn">+ Add to gCal</button>
      <span class="gcal-status" id="followup-gcal-status">${eventList}</span>
    </div>` : `
    <div class="priority-left">
      <div><div class="field-label">Follow-up priority</div><div class="field-value">${priorityValue}</div></div>
    </div>`;

  const fu = splitFollowUp(p);
  fu.explanation = fillCloser(fu.explanation);
  fu.message = fillCloser(fu.message);
  const processBlock = (fu.explanation || fu.message) ? `
    <div class="followup-message">
      ${fu.explanation ? `<div class="field-label">Recommended follow-up process</div><div class="field-value">${escapeHtml(fu.explanation)}</div>` : ''}
      ${fu.message ? `<div class="followup-draft">
        <div class="field-label">Message to send <span class="edit" id="followup-message-copy">copy</span></div>
        <div class="field-value draft-text">${escapeHtml(fu.message)}</div>
      </div>` : ''}
    </div>` : '';

  box.innerHTML =
    notesBlock +
    field('Primary objection', p.primaryObjection) +
    field('Secondary objection', p.secondaryObjection) +
    `<div class="objection-divider"></div>` +
    field('Recommended follow-up date', p.followUpDate) +
    `<div class="priority-cell">${dateControls}${processBlock}</div>`;
  box.style.display = 'grid';

  if (showFollowUpControls) {
    const dateInput = document.getElementById('followup-date-input');
    dateInput.onchange = () => setFollowUpDate(p.name, dateInput.value);
    document.getElementById('followup-gcal-btn').onclick = () => addFollowUpEventToGCal(p.name, dateInput.value);
  }
  if (fu.message) {
    // copies only the message; the explanation above it is just for reading
    document.getElementById('followup-message-copy').onclick = async (e) => {
      try {
        await navigator.clipboard.writeText(fu.message);
        e.target.textContent = 'copied!';
        setTimeout(() => { e.target.textContent = 'copy'; }, 1500);
      } catch {
        window.prompt('Copy this message:', fu.message);
      }
    };
  }
}

async function setFollowUpDate(name, date) {
  await fetch(`/api/set-followup-date?person=${encodeURIComponent(name)}&date=${encodeURIComponent(date)}`, { method: 'POST' });
  const p = people.find(x => x.name === name);
  if (p) p.followUpEventDate = date;
}

async function addFollowUpEventToGCal(name, date) {
  const statusEl = document.getElementById('followup-gcal-status');
  const btn = document.getElementById('followup-gcal-btn');
  if (!date) {
    statusEl.textContent = 'pick a date first';
    return;
  }
  if (btn.disabled) return; // already in flight -- avoid a double-click creating a duplicate event
  btn.disabled = true;
  statusEl.textContent = 'adding…';
  try {
    const res = await fetch(`/api/add-followup-gcal?person=${encodeURIComponent(name)}&date=${encodeURIComponent(date)}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'failed');
    const p = people.find(x => x.name === name);
    if (p) { p.followUpEventDate = date; p.followUpEvents = data.events || p.followUpEvents; }
    statusEl.innerHTML = (p.followUpEvents || []).map(ev =>
      `<a href="${ev.link}" target="_blank" rel="noopener">✓ ${formatShortDate(ev.date)}</a>`
    ).join(' &nbsp; ');
  } catch (e) {
    statusEl.textContent = `⚠️ ${e.message}`;
  } finally {
    btn.disabled = false;
  }
}
