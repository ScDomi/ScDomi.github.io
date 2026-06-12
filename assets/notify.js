(() => {
  const content = window.SITE_CONTENT || {};
  const config = content.notify || {};
  const form = document.getElementById('notify-form');
  if (!form) return;

  const emailInput = document.getElementById('notify-email');
  const trapInput = document.getElementById('notify-website');
  const status = document.getElementById('notify-status');
  const submit = form.querySelector('button[type="submit"]');
  const latestPost = Array.isArray(content.posts) ? content.posts[0] : null;
  const storageKey = 'domilog.notify.intent';

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el && value) el.textContent = value;
  };

  setText('notify-kicker', config.eyebrow);
  setText('notify-title', config.title);
  setText('notify-lead', config.lead);

  const writeStatus = (message, state = '') => {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
  };

  const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

  const digest = async (value) => {
    if (!window.crypto?.subtle) return value.toLowerCase();
    const data = new TextEncoder().encode(value.toLowerCase());
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const saveIntent = async (email) => {
    const payload = {
      emailHash: await digest(email),
      source: 'homepage-notify-card',
      feedHref: config.feedHref || 'feed.xml',
      latestPost: latestPost ? { title: latestPost.title, href: latestPost.href, date: latestPost.date } : null,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    return payload;
  };

  const postSignup = async (email, localIntent) => {
    const endpoint = String(config.endpoint || '').trim();
    if (!endpoint) return { queued: true };

    const body = {
      email,
      emailHash: localIntent.emailHash,
      source: localIntent.source,
      feedHref: localIntent.feedHref,
      latestPost: localIntent.latestPost,
      createdAt: localIntent.createdAt,
      consent: 'new-post-notifications'
    };

    const response = await fetch(endpoint, {
      method: config.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`Signup failed with ${response.status}`);
    return { queued: false };
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();

    if (trapInput.value) return;
    if (!isEmail(email)) {
      writeStatus('Drop a real email first.', 'error');
      emailInput.focus();
      return;
    }

    submit.disabled = true;
    writeStatus('Locking the signal...', '');

    try {
      const localIntent = await saveIntent(email);
      const result = await postSignup(email, localIntent);
      emailInput.value = '';
      writeStatus(result.queued ? config.pendingMessage : config.successMessage, 'ok');
    } catch (error) {
      writeStatus('Could not connect the signup endpoint. Try again later.', 'error');
    } finally {
      submit.disabled = false;
    }
  });
})();
