(() => {
  const content = window.SITE_CONTENT;
  if (!content) return;

  const badges = document.getElementById('hero-badges');
  if (badges && Array.isArray(content.heroBadges)) {
    badges.innerHTML = content.heroBadges.map((b) => `<span class="badge">${b}</span>`).join('');
  }

  const posts = document.getElementById('post-list');
  if (posts && Array.isArray(content.posts)) {
    posts.innerHTML = content.posts.length
      ? content.posts
          .map((post) => `<li><a href="${post.href}">${post.title}</a><span class="meta">${post.date}</span></li>`)
          .join('')
      : '<li><span class="meta">No public posts right now.</span></li>';
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

  const featured = document.getElementById('featured-post');
  if (featured && content.featuredPost) {
    const stats = Array.isArray(content.featuredPost.stats)
      ? content.featuredPost.stats.map((stat) => `<span>${stat}</span>`).join('')
      : '';
    featured.innerHTML = `
      <div class="feature-copy">
        <p class="feature-kicker">${content.featuredPost.kicker}</p>
        <h2>${content.featuredPost.title}</h2>
        <p>${content.featuredPost.summary}</p>
        <div class="feature-stats">${stats}</div>
      </div>
      <a class="feature-link" href="${content.featuredPost.href}">${content.featuredPost.cta}</a>
    `;
  }

  const concepts = document.getElementById('concept-grid');
  if (concepts && Array.isArray(content.conceptCards)) {
    concepts.innerHTML = content.conceptCards
      .map(
        (concept) => `
          <a class="concept-card" href="${concept.href}">
            <span>${concept.label}</span>
            <h3>${concept.title}</h3>
            <p>${concept.text}</p>
          </a>
        `
      )
      .join('');
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
