(() => {
  const endpoint = 'https://mac-mini-von-dominik.tail591247.ts.net:8443/track';
  const startedAt = Date.now();
  const sessionKey = 'domilog_analytics_session';
  const makeId = () => (
    crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
  const session = sessionStorage.getItem(sessionKey) || makeId();
  sessionStorage.setItem(sessionKey, session);
  let maxScrollDepth = 0;
  let lastHeartbeatAt = 0;

  const scrollDepth = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const viewport = window.innerHeight || document.documentElement.clientHeight || 1;
    const fullHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      viewport
    );
    return Math.min(100, Math.round(((scrollTop + viewport) / fullHeight) * 100));
  };

  const durationSeconds = () => Math.max(0, Math.round((Date.now() - startedAt) / 1000));

  const basePayload = (event) => ({
    event,
    session,
    path: window.location.pathname,
    title: document.title,
    referrer: document.referrer,
    language: navigator.language || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen: `${window.screen.width}x${window.screen.height}`,
    durationSeconds: durationSeconds(),
    scrollDepth: maxScrollDepth
  });

  const send = (event, extra = {}) => {
    maxScrollDepth = Math.max(maxScrollDepth, scrollDepth());
    const body = JSON.stringify({ ...basePayload(event), ...extra });

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
      return;
    }

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      mode: 'cors'
    }).catch(() => {});
  };

  send('view');

  window.addEventListener('scroll', () => {
    maxScrollDepth = Math.max(maxScrollDepth, scrollDepth());
    const now = Date.now();
    if (now - lastHeartbeatAt > 15000) {
      lastHeartbeatAt = now;
      send('heartbeat');
    }
  }, { passive: true });

  window.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    send('click', {
      target: link.href,
      linkText: (link.textContent || '').trim().slice(0, 120)
    });
  }, { capture: true });

  setInterval(() => send('heartbeat'), 15000);
  window.addEventListener('pagehide', () => send('end'));
})();
