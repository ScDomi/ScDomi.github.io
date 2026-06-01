(() => {
  const KEY = 'domi_mood';
  const data = {
    chaos: {
      eyebrow: 'CHAOS CEO MODE',
      title: 'Domi: 50% Fokus, 50% Crashout, 100% Output.',
      lead: 'Denglisch vibes only. AI Student, Fashion brain, Meme timing und Rap/EDM im Hintergrund.',
      memeTop: 'me: "ich mach kurz pause"',
      memeMain: '10 Tabs später: ich baue ein neues System statt Pause zu machen.',
      memeBottom: 'classic domi crashout moment'
    },
    focus: {
      eyebrow: 'FOCUS ARC',
      title: 'Deep Work, klare Systeme, zero fake productivity.',
      lead: 'Bachelorarbeit, Tutorium und side builds mit Struktur statt Chaos-Overload.',
      memeTop: 'me: "nur ein quick fix"',
      memeMain: 'wird zu 2h Refactor, aber wenigstens clean.',
      memeBottom: 'painful but worth it'
    },
    night: {
      eyebrow: 'NIGHT VIBES',
      title: 'EDM x Rap x Ideen, die nachts plötzlich Sinn machen.',
      lead: 'Wenn alle pennen, starten die besten Builds. Loud taste, specific humor, full send.',
      memeTop: '2:03 AM',
      memeMain: 'eigentlich schlafen, stattdessen neues Projekt anfangen.',
      memeBottom: 'night shift energy'
    }
  };

  function applyMood(mood) {
    const safe = data[mood] ? mood : 'chaos';
    const d = data[safe];
    localStorage.setItem(KEY, safe);
    document.querySelectorAll('.mood-option').forEach((b) => b.setAttribute('aria-pressed', b.dataset.mood === safe ? 'true' : 'false'));
    document.getElementById('eyebrow').textContent = d.eyebrow;
    document.getElementById('hero-title').textContent = d.title;
    document.getElementById('hero-lead').textContent = d.lead;
    document.getElementById('meme-top').textContent = d.memeTop;
    document.getElementById('meme-main').textContent = d.memeMain;
    document.getElementById('meme-bottom').textContent = d.memeBottom;
  }

  applyMood(localStorage.getItem(KEY) || 'chaos');
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.mood-option');
    if (!btn) return;
    applyMood(btn.dataset.mood);
  });
})();
