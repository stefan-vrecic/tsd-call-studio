// notes-qa.js -- Q&A about the transcript, and the SPIN notes modal.
// Plain script (not a module): shares one global scope with the other files, so load order matters -- see the <script> tags in player.html.

// --- Q&A about the current transcript ---
function renderQaHistory(qa) {
  const history = document.getElementById('qa-history');
  history.innerHTML = '';
  qa.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'qa-entry';
    div.innerHTML = `<div class="qa-q">Reviewer Q: ${entry.question}</div><div class="qa-a">Claude Answer: ${entry.answer}</div>`;
    history.appendChild(div);
  });
}

async function askQuestion() {
  if (!current) return;
  const input = document.getElementById('qa-input');
  const question = input.value.trim();
  if (!question) return;
  const askBtn = document.getElementById('qa-ask');
  input.disabled = true;
  askBtn.disabled = true;

  const history = document.getElementById('qa-history');
  const div = document.createElement('div');
  div.className = 'qa-entry';
  div.innerHTML = `<div class="qa-q">Reviewer Q: ${question}</div><div class="qa-a pending">Claude Answer: thinking…</div>`;
  history.appendChild(div);
  input.value = '';

  try {
    const res = await fetch('/api/ask?person=' + encodeURIComponent(current.name), {
      method: 'POST', body: question,
    });
    const j = await res.json();
    const answer = j.answer || j.error || '(no answer)';
    div.querySelector('.qa-a').textContent = 'Claude Answer: ' + answer;
    div.querySelector('.qa-a').classList.remove('pending');
    current.qa = current.qa || [];
    current.qa.push({ question, answer });
  } catch (e) {
    div.querySelector('.qa-a').textContent = 'Claude Answer: (request failed — ' + e + ')';
    div.querySelector('.qa-a').classList.remove('pending');
  }
  input.disabled = false;
  askBtn.disabled = false;
  input.focus();
}
document.getElementById('qa-ask').onclick = askQuestion;
document.getElementById('qa-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') askQuestion(); });

// --- SPIN notes (freeform pre-call summary, pasted in) ---
function renderSpinNotes(text) {
  const trigger = document.getElementById('spin-notes-trigger');
  const display = document.getElementById('spin-notes-display');
  if (text) {
    trigger.innerHTML = '';
    display.style.display = 'block';
    display.innerHTML = `${text}<span class="edit">Edit SPIN notes</span>`;
    display.querySelector('.edit').onclick = openNotesModal;
  } else {
    display.style.display = 'none';
    trigger.innerHTML = `<span class="edit">+ SPIN notes</span>`;
    trigger.querySelector('.edit').onclick = openNotesModal;
  }
}
function openNotesModal() {
  document.getElementById('notes-textarea').value = (current && current.spinNotes) || '';
  document.getElementById('notes-modal-overlay').style.display = 'flex';
  document.getElementById('notes-textarea').focus();
}
document.getElementById('notes-cancel').onclick = () => {
  document.getElementById('notes-modal-overlay').style.display = 'none';
};
document.getElementById('notes-save').onclick = async () => {
  if (!current) return;
  const text = document.getElementById('notes-textarea').value;
  await fetch('/api/set-notes?person=' + encodeURIComponent(current.name), { method: 'POST', body: text });
  current.spinNotes = text;
  renderSpinNotes(text);
  document.getElementById('notes-modal-overlay').style.display = 'none';
};
