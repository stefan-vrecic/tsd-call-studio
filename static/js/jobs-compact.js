// jobs-compact.js -- the job boxes under the call list (upload.js pollJob) stay out of the way: one job shows as before, but with two or
// more the boxes fold into a single line -- "⏳ Transcribing BridgeenDonaldson 58% + 2 more" -- and hovering it pops up every box.
// pollJob keeps updating its own box wherever it sits, so the boxes are only MOVED into the pop-up (nothing about the jobs changes).
// Plain script (not a module): shares one global scope with the other files; load it after upload.js.
(() => {
  const jobs = document.getElementById('jobs');
  if (!jobs) return;
  const summary = document.createElement('div'); summary.className = 'jobs-summary';
  const pop = document.createElement('div'); pop.className = 'jobs-pop';
  jobs.append(summary, pop);
  const short = (t) => String(t || '').replace(/^\d{2}-\d{2}-/, '');   // "10-19-ShellyEvans" -> "ShellyEvans"
  function update() {
    const cards = [...pop.querySelectorAll(':scope > .job')];
    jobs.classList.toggle('jobs-stacked', cards.length > 1);
    if (cards.length <= 1) { summary.textContent = ''; return; }
    // lead with the one that's actually moving (not "Queued"), else the newest
    const busy = cards.find(c => !/queued|starting/i.test(c.querySelector('.stage')?.textContent || '')) || cards[0];
    const name = short(busy.firstElementChild?.textContent);
    const stage = (busy.querySelector('.stage')?.textContent || '').replace(busy.firstElementChild?.textContent + ':', '').trim();
    summary.innerHTML = `<span class="jobs-spin">⏳</span><span class="jobs-what"><b>${name.replace(/</g, '&lt;')}</b> ${stage.replace(/</g, '&lt;')}</span><span class="jobs-more">+ ${cards.length - 1} more</span>`;
  }
  // a box pollJob adds straight into #jobs moves into the pop-up
  new MutationObserver((list) => {
    list.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList.contains('job')) pop.prepend(n); }));
    update();
  }).observe(jobs, { childList: true });
  new MutationObserver(update).observe(pop, { childList: true, subtree: true, characterData: true });
  [...jobs.querySelectorAll(':scope > .job')].forEach(n => pop.append(n));
  update();
})();
