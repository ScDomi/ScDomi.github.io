(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.querySelector('[data-site-nav]');
  if (!nav) return;

  const links = [...nav.querySelectorAll('a[data-nav]')];
  const indicator = nav.querySelector('[data-nav-indicator]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.getElementById('site-nav-menu');
  const routeRoot = document.querySelector('[data-route-root]');

  const normalize = href => {
    try {
      const url = new URL(href, location.origin);
      let path = url.pathname;
      if (path.endsWith('/index.html')) path = path.slice(0, -10) || '/';
      if (!path.endsWith('/') && !path.includes('.')) path += '/';
      return path || '/';
    } catch (_) {
      return href;
    }
  };

  function routeKey(path = location.pathname) {
    path = normalize(path);
    if (path === '/') return 'home';
    if (path.startsWith('/projects/')) return 'projects';
    if (path.startsWith('/maths/')) return 'maths';
    if (path.startsWith('/ml/')) return 'ml';
    if (path.startsWith('/dl/')) return 'dl';
    if (path.startsWith('/about')) return 'about';
    return '';
  }

  function moveIndicator(active) {
    if (!indicator || !active || active.offsetParent === null) return;
    const nr = nav.getBoundingClientRect();
    const ar = active.getBoundingClientRect();
    indicator.style.setProperty('--nav-x', `${(ar.left - nr.left).toFixed(1)}px`);
    indicator.style.setProperty('--nav-y', `${(ar.top - nr.top).toFixed(1)}px`);
    indicator.style.setProperty('--nav-w', `${ar.width.toFixed(1)}px`);
    indicator.style.setProperty('--nav-h', `${ar.height.toFixed(1)}px`);
    indicator.style.opacity = '1';
  }

  function setActive() {
    const key = routeKey();
    let active = null;
    for (const link of links) {
      const isActive = link.dataset.nav === key;
      link.classList.toggle('is-active', isActive);
      link.toggleAttribute('aria-current', isActive);
      if (isActive) active = link;
    }
    requestAnimationFrame(() => moveIndicator(active));
  }

  function closeMobile() {
    document.body.classList.remove('nav-open');
    toggle?.setAttribute('aria-expanded', 'false');
  }

  toggle?.addEventListener('click', () => {
    const open = !document.body.classList.contains('nav-open');
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  addEventListener('resize', setActive, { passive: true });
  addEventListener('popstate', () => softNavigate(location.href, false));

  async function mountRouteModules(path) {
    if (path.startsWith('/maths/') && document.getElementById('lorenz-canvas')) {
      if (window.__mountLorenzAttractor) window.__mountLorenzAttractor();
      else await import('/assets/lorenz-attractor.js?v=lorenz-real-1');
    }
  }

  async function softNavigate(href, push = true) {
    const url = new URL(href, location.origin);
    if (!routeRoot || reduceMotion && false) return false;
    if (url.origin !== location.origin) return false;
    if (url.hash && url.pathname === location.pathname) return false;
    const currentSoft = document.body.dataset.softRouter === 'true';
    const targetPath = normalize(url.pathname);
    const targetSoft = ['/projects/', '/maths/', '/about/'].includes(targetPath) || targetPath === '/about.html';
    if (!currentSoft && !targetSoft) return false;

    document.documentElement.classList.add('route-loading');
    try {
      const res = await fetch(url.href, { headers: { 'X-Requested-With': 'scryx-router' } });
      if (!res.ok) return false;
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const nextRoot = doc.querySelector('[data-route-root]');
      if (!nextRoot || doc.body.dataset.softRouter !== 'true') return false;

      routeRoot.classList.add('is-leaving');
      if (!reduceMotion) await new Promise(r => setTimeout(r, 150));
      document.title = doc.title;
      document.body.className = doc.body.className;
      document.body.dataset.softRouter = 'true';
      routeRoot.innerHTML = nextRoot.innerHTML;
      await mountRouteModules(targetPath);
      routeRoot.classList.remove('is-leaving');
      routeRoot.classList.add('is-entering');
      if (push) history.pushState({}, '', url.href);
      closeMobile();
      setActive();
      scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      setTimeout(() => routeRoot.classList.remove('is-entering'), reduceMotion ? 0 : 260);
      document.dispatchEvent(new CustomEvent('scryx:route', { detail: { path: location.pathname } }));
      return true;
    } catch (err) {
      console.warn('scryx soft navigation failed', err);
      return false;
    } finally {
      document.documentElement.classList.remove('route-loading');
    }
  }

  document.addEventListener('click', async e => {
    const a = e.target.closest?.('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    const ok = await softNavigate(url.href, true);
    if (ok) e.preventDefault();
  });

  setActive();
  setTimeout(setActive, 250);
})();
