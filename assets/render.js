(() => {
  const content = window.SITE_CONTENT;
  if (!content) return;

  const badges = document.getElementById('hero-badges');
  if (badges && Array.isArray(content.heroBadges)) {
    badges.innerHTML = content.heroBadges.map((b) => `<span class="badge">${b}</span>`).join('');
  }

  const about = document.getElementById('about-list');
  if (about && Array.isArray(content.aboutItems)) {
    about.innerHTML = content.aboutItems.map((item) => `<li><strong>${item.label}:</strong> ${item.value}</li>`).join('');
  }

  const posts = document.getElementById('post-list');
  if (posts && Array.isArray(content.posts)) {
    posts.innerHTML = content.posts.map((post) => `<li><a href="${post.href}">${post.title}</a><span class="meta">${post.date}</span></li>`).join('');
  }
})();
