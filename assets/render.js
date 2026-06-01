(() => {
  const content = window.SITE_CONTENT;
  if (!content) return;

  const badges = document.getElementById('hero-badges');
  if (badges && Array.isArray(content.heroBadges)) {
    badges.innerHTML = content.heroBadges.map((b) => `<span class="badge">${b}</span>`).join('');
  }

  const posts = document.getElementById('post-list');
  if (posts && Array.isArray(content.posts)) {
    posts.innerHTML = content.posts
      .map((post) => `<li><a href="${post.href}">${post.title}</a><span class="meta">${post.date}</span></li>`)
      .join('');
  }

  const now = document.getElementById('now-card');
  if (now && content.nowWidget) {
    now.innerHTML = `
      <p class="meta">Updated ${content.nowWidget.updated}</p>
      <p><strong>Building:</strong> ${content.nowWidget.building}</p>
      <p><strong>Listening:</strong> ${content.nowWidget.listening}</p>
      <p><strong>Learning:</strong> ${content.nowWidget.learning}</p>
    `;
  }

  const daily = document.getElementById('daily-log-list');
  if (daily && Array.isArray(content.dailyLog)) {
    daily.innerHTML = content.dailyLog
      .map((entry) => {
        const items = entry.items.map((i) => `<li>${i}</li>`).join('');
        return `<li class="daily-log-entry"><p class="meta">${entry.date}</p><ul>${items}</ul></li>`;
      })
      .join('');
  }
})();
