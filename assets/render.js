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
          .map(
            (post, index) =>
              `<li class="${index === 0 ? 'is-newest' : ''}"><a href="${post.href}">${post.title}</a><span class="meta">${index === 0 ? '<strong>Newest</strong> ' : ''}${post.date}</span></li>`
          )
          .join('')
      : '<li><span class="meta">No public posts right now.</span></li>';
  }

  const now = document.getElementById('now-card');
  if (now && content.nowWidget) {
    now.innerHTML = `
      <p class="meta">Updated ${content.nowWidget.updated}</p>
      <p><strong>Building:</strong> ${content.nowWidget.building}</p>
      <p><strong>Signal:</strong> ${content.nowWidget.listening}</p>
      <p><strong>Question:</strong> ${content.nowWidget.learning}</p>
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

  const latest = document.getElementById('latest-drop');
  if (latest && content.latestDrop) {
    latest.innerHTML = `
      <div class="latest-drop-copy">
        <p class="latest-drop-label">${content.latestDrop.label}</p>
        <h2>${content.latestDrop.title}</h2>
        <p>${content.latestDrop.summary}</p>
      </div>
      <div class="latest-drop-side">
        <div class="latest-drop-meta">
          <span>${content.latestDrop.date}</span>
          <span>${content.latestDrop.mood}</span>
          <span>${content.latestDrop.readTime}</span>
        </div>
        <a class="latest-drop-link" href="${content.latestDrop.href}">${content.latestDrop.cta}</a>
      </div>
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

})();
