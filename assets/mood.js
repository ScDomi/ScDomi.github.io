(() => {
  const KEY = 'domi_mood';
  const data = {
    chaos: {
      eyebrow: 'CHAOS CEO MODE',
      title: 'Domi: zu spät, aber mit Story.',
      lead: 'Denglisch vibes, Rap im Ohr, 0 oder 100 Mentality. 50:50 ist nicht nur ein Satz, ist ein Zustand.',
      memeTop: 'me: "bin gleich da"',
      memeMain: '6:00 Uhr morgens, ich komm rein und hab eine komplette Story vom Abend.',
      memeBottom: 'zu spät aber mit story'
    },
    focus: {
      eyebrow: 'FOCUS ARC',
      title: 'Wenn Fokus kickt: keine Ausreden, nur Output.',
      lead: 'Bachelorarbeit, Tutorium, Side Builds. Weniger reden, mehr liefern.',
      memeTop: 'me: "ich check nur kurz eine Sache"',
      memeMain: '3 Stunden später: kompletter Plan steht und alles ist in Ordnung gebracht.',
      memeBottom: '50:50 aber diesmal mit struktur'
    },
    night: {
      eyebrow: 'NIGHT RAP MODE',
      title: 'Rap laut, Kopf frei, Ideen on max.',
      lead: 'Spontane Nächte, spezieller Humor, 0 oder 100 Energie bis früh um 6.',
      memeTop: '02:47 AM',
      memeMain: 'eigentlich Feierabend, stattdessen neue Idee, neuer Move.',
      memeBottom: 'night shift domi'
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
