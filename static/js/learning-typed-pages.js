// learning-typed-pages.js -- notebook-style typed pages attached to each Learning book or video.
// The editor and previews reuse journal-typed.js' jtPages renderer, while the source text is stored on the shelf item in books.json/videos.json.

const bkTypedToday = csToday;

// The whole of a book's typed notes as one text: each note's own full text (kept on its first page as "source"), or -- for pages saved
// before that existed -- its pages joined back up (lines the page layout had wrapped are re-joined when the next one carries on mid-sentence).
function bkTypedWholeText(b) {
  const parts = [];
  for (let i = 0; i < b.typedPages.length;) {
    const p = b.typedPages[i], g = p.group;
    let j = i + 1;   // one note = its group; older pages (no group) of the same day are read as one note
    while (j < b.typedPages.length && (g ? b.typedPages[j].group === g : !b.typedPages[j].group && b.typedPages[j].date === p.date)) j++;
    if (p.source) parts.push(p.source);
    else {
      // where one page ends and the next carries on mid-sentence, join them with a space instead of a line break
      const joined = b.typedPages.slice(i, j).map(x => x.text || '').reduce((acc, t) => {
        if (!acc) return t;
        const a = acc.replace(/\s+$/, ''), n = t.replace(/^\s+/, '');
        return a + (/^[a-z0-9(]/.test(n) && !/[.!?:]$/.test(a) ? ' ' : '\n') + n;
      }, '');
      const lines = joined.split('\n');
      parts.push(lines.reduce((out, line) => (out.length && line && /^[a-z0-9(]/.test(line) && out[out.length - 1] ? (out[out.length - 1] += ' ' + line, out) : (out.push(line), out)), []).join('\n'));
    }
    i = j;
  }
  return parts.join('\n\n');
}

function bkTypedPageOpen(b, S, cfg, pageIndex = -1) {   // pageIndex: -1 = a new note, 'all' = the whole notes, n = that page
  const whole = pageIndex === 'all' && b.typedPages.length > 0;
  const editing = whole || (pageIndex >= 0 && b.typedPages[pageIndex]), old = whole ? b.typedPages[0] : editing ? b.typedPages[pageIndex] : null;
  jtEditor({   // journal-typed.js
    heading: whole ? '✏️ Edit notes' : editing ? '✏️ Edit typed note' : '✍️ Type a note',
    date: old?.date || bkTypedToday(),
    source: `${cfg.icon} <b>${bkEsc(b.title)}</b>`,
    text: whole ? bkTypedWholeText(b) : old?.text || '', placeholder: 'Write your notes…  Start a line with - for a bullet.',
    saveLabel: editing ? 'Save changes' : 'Add page',
    deleteLabel: editing ? (whole ? 'Delete all notes' : 'Delete page') : '',
    onSave: async (raw, day) => {
      const text = raw.trim(), rendered = jtPages(text, day), group = bkId();
      const pages = rendered.map((p, k) => ({
        id: editing && k === 0 ? old.id : bkId(),
        date: day,
        text: rendered.length === 1 ? text : p.text,
        group, source: k === 0 && rendered.length > 1 ? text : ''   // the whole note stays with it, so editing it later shows all of it
      }));
      if (whole) b.typedPages.splice(0, b.typedPages.length, ...pages);
      else if (editing) b.typedPages.splice(pageIndex, 1, ...pages); else b.typedPages.push(...pages);
      S.save(); S.render();
      ctxToast(`${pages.length} typed page${pages.length === 1 ? '' : 's'} saved`);
    },
    onDelete: () => {
      if (!confirm(whole ? `Delete all the typed notes for "${b.title}"?` : `Delete this typed page from "${b.title}"?`)) return false;
      if (whole) b.typedPages.splice(0); else b.typedPages.splice(pageIndex, 1);
      S.save(); S.render(); return true;
    },
  });
}

function bkTypedPagesMount(holder, b, S, cfg) {
  holder.innerHTML = '';
  const notes = holder.closest('.bk-head')?.querySelector('.bk-typed-notes');
  if (notes) {
    notes._bkTypedPages = b.typedPages;
    notes.classList.toggle('has', b.typedPages.length > 0);
    notes.title = b.typedPages.length ? `${b.typedPages.length} typed page${b.typedPages.length === 1 ? '' : 's'} · hover to preview · click to edit them all` : 'No typed notes yet · use ＋ to add one';
    notes.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (b.typedPages.length) bkTypedPageOpen(b, S, cfg, 'all');
    };
  }
  const add = document.createElement('button');
  add.type = 'button'; add.className = 'bk-typed-add'; add.textContent = '＋'; add.title = 'Add a typed notebook page';
  add.onclick = (e) => { e.preventDefault(); e.stopPropagation(); bkTypedPageOpen(b, S, cfg); };
  holder.appendChild(add);
}

// shelf.js can render before this file loads; remount once so its placeholders gain their controls.
if (typeof bkBooks !== 'undefined') bkBooks.render();
if (typeof bkVideos !== 'undefined') bkVideos.render();
