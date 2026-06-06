(() => {
  const endpoint = 'https://mac-mini-von-dominik.tail591247.ts.net:8443/track';
  const payload = {
    path: window.location.pathname,
    title: document.title,
    referrer: document.referrer,
    language: navigator.language || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen: `${window.screen.width}x${window.screen.height}`
  };
  const body = JSON.stringify(payload);

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
})();
