// Visual shell for the legacy Call Studio workspace. It only connects new presentation controls
// to the established upload/search actions; processing, selection and storage remain untouched.

['studio-upload', 'studio-empty-upload'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => document.getElementById('file-input').click());
});
document.getElementById('studio-empty-search')?.addEventListener('click', () => document.getElementById('ts-open').click());
