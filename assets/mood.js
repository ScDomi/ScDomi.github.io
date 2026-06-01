(() => {
  const KEY = 'domi_mood';
  const moods = window.SITE_CONTENT?.moods || {};

  function applyMood(mood) {
    const safe = moods[mood] ? mood : 'research';
    const d = moods[safe];
    if (!d) return;

    localStorage.setItem(KEY, safe);
    document.querySelectorAll('.mood-option').forEach((b) => {
      b.setAttribute('aria-pressed', b.dataset.mood === safe ? 'true' : 'false');
    });

    document.getElementById('eyebrow').textContent = d.eyebrow;
    document.getElementById('hero-title').textContent = d.title;
    document.getElementById('hero-lead').textContent = d.lead;
    document.getElementById('meme-top').textContent = d.memeTop;
    document.getElementById('meme-main').textContent = d.memeMain;
    document.getElementById('meme-bottom').textContent = d.memeBottom;
  }

  applyMood(localStorage.getItem(KEY) || 'research');
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.mood-option');
    if (!btn) return;
    applyMood(btn.dataset.mood);
  });
})();
