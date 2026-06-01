(() => {
  const KEY = 'domi_theme';
  const THEMES = ['default', 'neon-chaos', 'clean-brutal', 'street-internet', 'soft-flex'];

  function applyTheme(theme) {
    const safe = THEMES.includes(theme) ? theme : 'default';
    document.documentElement.setAttribute('data-theme', safe);
    localStorage.setItem(KEY, safe);
    document.querySelectorAll('.theme-option').forEach((btn) => {
      const on = btn.dataset.theme === safe;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  const stored = localStorage.getItem(KEY);
  applyTheme(stored || 'default');

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.theme-option');
    if (!btn) return;
    applyTheme(btn.dataset.theme);
  });
})();
