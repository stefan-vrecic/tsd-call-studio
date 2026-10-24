// calendar-accounts.js -- Settings -> Calendar account: pick which Google account's calendar everything uses, or add another one
// (routes/calendar_accounts.py; the sign-ins live in the calendar-auto-buffer folder). Adding opens Google's own sign-in page in the
// browser -- you sign in and allow access there yourself; this list picks the new account up when that's done.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.
(() => {
  const box = document.getElementById('st-cal-accounts'); if (!box) return;
  let polling = null;
  async function draw() {
    let d; try { d = await csJSON('/api/calendar-accounts'); } catch (e) { box.innerHTML = `<p class="st-note">⚠️ ${csEsc(e.message)}</p>`; return; }
    const s = await csJSON('/api/settings').catch(() => ({}));
    const others = d.accounts.filter(a => a !== d.active);
    box.innerHTML = `<div class="st-cal-list">${d.accounts.map(a => `<label class="st-cal-row${a === d.active ? ' on' : ''}"><input type="radio" name="st-cal" value="${csEsc(a)}"${a === d.active ? ' checked' : ''}> <b>${csEsc(a)}</b>${a === d.active ? ' <small>in use</small>' : ''}</label>`).join('')}</div>
      <div class="st-cal-actions"><button class="ctl" id="st-cal-add"${d.adding ? ' disabled' : ''}>${d.adding ? 'Waiting for you to sign in in the browser…' : '＋ Add another Google account'}</button><span class="bk-status" id="st-cal-msg"></span></div>
      <h4 class="st-cal-h">🎭 Demo calendar <small>shown instead of your real one while Demo mode is on</small></h4>
      <div class="st-cal-actions"><select id="st-cal-demo"><option value="">None — Demo mode shows your real calendar</option>${[...new Set([...others, ...(s.demoCalendar ? [s.demoCalendar] : [])])].map(a => `<option${a === s.demoCalendar ? ' selected' : ''}>${csEsc(a)}</option>`).join('')}<option value="__shared">＋ A calendar shared with ${csEsc(d.active)}…</option></select>
        <button class="ctl" id="st-cal-build"${s.demoCalendar ? '' : ' disabled'} title="Copies the last 2 weeks and next 2 weeks of your real calendar into it, with made-up US clients, phone numbers and names">🎭 Build demo events from my calendar</button><span class="bk-status" id="st-cal-build-msg"></span></div>
      <p class="st-note">The demo calendar can be another signed-in account, or any calendar shared with ${csEsc(d.active)}: in Google Calendar (signed in as the other account) open Settings → that calendar → <i>Share with specific people</i> → add ${csEsc(d.active)} with <i>Make changes to events</i>, then pick “A calendar shared with…” here and type its email.</p>`;
    document.getElementById('st-cal-demo').onchange = async (e) => {
      let v = e.target.value;
      if (v === '__shared') { v = (prompt('Email of the calendar shared with ' + d.active + ':', '') || '').trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { draw(); return; } }
      await fetch('/api/settings?demoCalendar=' + encodeURIComponent(v), { method: 'POST' }); draw();
    };
    document.getElementById('st-cal-build').onclick = async () => {
      if (!confirm(`Copy your calendar's events (2 weeks back to 2 weeks ahead) into ${s.demoCalendar} with every client and colleague renamed?\n\nOnly the copies it made before are replaced; nothing in your real calendar changes.`)) return;
      const msg = document.getElementById('st-cal-build-msg'); msg.textContent = 'Building…';
      try { await csPost('/api/demo-calendar', {}); } catch (err) { msg.textContent = '⚠️ ' + err.message; return; }
      const t = setInterval(async () => { const r = await csJSON('/api/demo-calendar').catch(() => null); if (r && !r.running) { clearInterval(t); let o = {}; try { o = JSON.parse(r.result); } catch (e2) { o = { error: r.result }; } msg.textContent = o.error ? '⚠️ ' + o.error : o.written != null ? `✓ ${o.written} demo events written` : '⚠️ ' + (r.result || 'failed'); } }, 2000);
    };
    box.querySelectorAll('input[name="st-cal"]').forEach(r => r.onchange = async () => {
      if (!confirm(`Use ${r.value}'s calendar for Today, Sessions, follow-ups, the tracker and buffers?`)) { draw(); return; }
      const msg = document.getElementById('st-cal-msg'); msg.textContent = 'Switching…';
      try { await csPost('/api/calendar-accounts?use=' + encodeURIComponent(r.value), {}); ctxToast('Calendar: ' + r.value); } catch (e) { alert("Couldn't switch: " + e.message); }
      draw();
    });
    document.getElementById('st-cal-add').onclick = async () => {
      await csPost('/api/calendar-accounts?add=1', {}).catch(e => alert(e.message));
      ctxToast("Google's sign-in opened in your browser — pick the account and allow access");
      clearInterval(polling); polling = setInterval(async () => { const n = await csJSON('/api/calendar-accounts').catch(() => null); if (n && !n.adding) { clearInterval(polling); draw(); } }, 2000);
      draw();
    };
  }
  draw();
  // the server reads the demo calendar while Demo mode is on in this page (routes/day.py)
  const tell = () => fetch('/api/settings?demoActive=' + (demoMode ? '1' : '0'), { method: 'POST' }).then(() => { if (typeof dayLoad === 'function' && STATIC_VIEWS.today && STATIC_VIEWS.today.style.display !== 'none') dayLoad(); }).catch(() => {});
  tell();
  window.addEventListener('callstudio:demo-mode', tell);
})();
