/* scryx / presence layer — the site notices you */
(function () {
  'use strict';

  /* ── 1. Session start ──────────────────────────────────────── */
  const SESSION_START = Date.now();
  const PAGE_TITLE    = document.title;

  /* ── 2. Return awareness ───────────────────────────────────── */
  const hasVisited = sessionStorage.getItem('scryx_visit');
  if (!hasVisited) {
    sessionStorage.setItem('scryx_visit', '1');
  }
  const isReturn = hasVisited === '1';

  if (isReturn) {
    // Inject "still here." ghost text into hero headline if on homepage
    document.addEventListener('DOMContentLoaded', function () {
      const h1 = document.querySelector('.brain-copy h1, .page-title, .lab-index-hero h1, .projects-hero h1');
      if (h1 && !document.getElementById('still-here-ghost')) {
        const ghost = document.createElement('span');
        ghost.id = 'still-here-ghost';
        ghost.className = 'still-here-ghost';
        ghost.textContent = 'still here.';
        ghost.setAttribute('aria-hidden', 'true');
        h1.appendChild(ghost);
        // Fade in after short delay
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { ghost.classList.add('visible'); });
        });
        // Fade out after 4s
        setTimeout(() => ghost.classList.remove('visible'), 4200);
        setTimeout(() => ghost.remove(), 5000);
      }
    });
  }

  /* ── 3. Tab title awareness ─────────────────────────────────── */
  let titleTimer = null;
  document.addEventListener('visibilitychange', function () {
    clearTimeout(titleTimer);
    if (document.hidden) {
      document.title = '... still running';
    } else {
      document.title = 'you came back.';
      titleTimer = setTimeout(() => { document.title = PAGE_TITLE; }, 1800);
    }
  });

  /* ── 4. beforeunload signal ─────────────────────────────────── */
  let leaving = false;
  window.addEventListener('beforeunload', function () {
    if (leaving) return;
    leaving = true;
    document.title = 'session ended.';
    // Subtle page dim — no blocking dialog
    const veil = document.createElement('div');
    veil.id = 'leave-veil';
    veil.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999',
      'background:rgba(0,0,0,0)', 'pointer-events:none',
      'transition:background .4s ease'
    ].join(';');
    document.body.appendChild(veil);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        veil.style.background = 'rgba(0,0,0,.38)';
      });
    });
  });

  /* ── 5. Session pulse dot in footer ─────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    const footerRow = document.querySelector('.footer-row');
    if (footerRow && !document.getElementById('presence-pulse-wrap')) {
      const wrap = document.createElement('span');
      wrap.id = 'presence-pulse-wrap';
      wrap.className = 'presence-pulse-wrap';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.innerHTML = '<span class="presence-pulse"></span>';
      footerRow.appendChild(wrap);
    }

    /* ── 6. Session duration counter on about page ─────────────── */
    const isAbout = /\/about\/?$/.test(location.pathname);
    const noteEl  = document.querySelector('.about-note');
    if (isAbout && noteEl && !document.getElementById('session-counter')) {
      const ctr = document.createElement('p');
      ctr.id = 'session-counter';
      ctr.className = 'session-counter';
      ctr.setAttribute('aria-label', 'Session duration');
      noteEl.insertBefore(ctr, noteEl.querySelector('p'));

      function fmt(ms) {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        if (h)   return `${h}h ${m % 60}m ${s % 60}s`;
        if (m)   return `${m}m ${s % 60}s`;
        return `${s}s`;
      }

      function tick() {
        const elapsed = fmt(Date.now() - SESSION_START);
        ctr.innerHTML = `<span class="session-counter-label">session</span><span class="session-counter-value">${elapsed}</span>`;
      }
      tick();
      setInterval(tick, 1000);
    }
  });

})();
