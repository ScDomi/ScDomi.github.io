/* scryx / premium interaction layer — high-detail polish without replacing the site */
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const isMobile = matchMedia('(max-width: 760px)').matches;
  const root = document.documentElement;
  const body = document.body;

  // Keep the real pointer visible. The custom reticle becomes an enhancement, not a hostage situation.
  body.classList.add('cursor-safe');

  let mx = innerWidth * .5, my = innerHeight * .5, vx = 0, vy = 0;
  addEventListener('pointermove', e => {
    vx = e.clientX - mx; vy = e.clientY - my; mx = e.clientX; my = e.clientY;
    root.style.setProperty('--mx', `${mx}px`);
    root.style.setProperty('--my', `${my}px`);
    root.style.setProperty('--mvx', `${Math.max(-1, Math.min(1, vx / 80)).toFixed(3)}`);
    root.style.setProperty('--mvy', `${Math.max(-1, Math.min(1, vy / 80)).toFixed(3)}`);
  }, { passive:true });

  // Section intelligence: body knows where you are, so particles/HUD/cards react coherently.
  const sections = ['interface','artifacts','project-scroll','map'];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      let best = null;
      for (const e of entries) if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
      if (!best) return;
      body.dataset.zone = best.target.id || 'surface';
    }, { threshold:[.18,.32,.55,.72] });
    sections.map(id => document.getElementById(id)).filter(Boolean).forEach(el => io.observe(el));
  }

  // Premium particle canvas: layered motes + connective fibers + mouse shockwave.
  const canvas = document.createElement('canvas');
  canvas.className = 'premium-particles';
  canvas.setAttribute('aria-hidden','true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const count = reduce ? 0 : (isMobile ? 54 : 120);
  const nodes = Array.from({length: count}, (_, i) => ({
    x: Math.random(), y: Math.random(), z: Math.random(),
    px: Math.random(), py: Math.random(),
    a: Math.random() * Math.PI * 2,
    v: .00035 + Math.random() * .0009,
    r: .6 + Math.random() * 2.2,
    hue: i % 7 === 0 ? 'cyan' : i % 5 === 0 ? 'gold' : 'violet'
  }));
  let w = 0, h = 0, dpr = 1, t0 = performance.now();
  function resize(){
    dpr = Math.min(devicePixelRatio || 1, isMobile ? 1.15 : 1.5);
    w = innerWidth; h = innerHeight;
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize', resize, { passive:true }); resize();
  function color(kind, alpha){
    if (kind === 'cyan') return `rgba(73,230,255,${alpha})`;
    if (kind === 'gold') return `rgba(255,207,122,${alpha})`;
    return `rgba(185,101,255,${alpha})`;
  }
  function frame(now){
    if (!ctx) return;
    const t = (now - t0) * .001;
    ctx.clearRect(0,0,w,h);
    const zone = body.dataset.zone || 'interface';
    const zoneBoost = zone === 'artifacts' ? 1.28 : zone === 'project-scroll' ? 1.55 : zone === 'map' ? 1.12 : 1;
    for (let i=0;i<nodes.length;i++) {
      const p = nodes[i];
      p.px = p.x; p.py = p.y;
      const swirl = Math.sin(t * (.22 + p.v*140) + p.a) * .0016 * zoneBoost;
      const pullX = (mx / Math.max(1,w) - p.x) * (.00018 + p.z * .00032);
      const pullY = (my / Math.max(1,h) - p.y) * (.00012 + p.z * .00020);
      p.x = (p.x + Math.cos(p.a + t*.18) * p.v + swirl + pullX + 1) % 1;
      p.y = (p.y + Math.sin(p.a * 1.7 + t*.14) * p.v * .72 + pullY + 1) % 1;
      const x = p.x*w, y = p.y*h;
      const dx = x-mx, dy = y-my, md = Math.hypot(dx,dy);
      const hot = Math.max(0, 1 - md / 320);
      const rr = p.r * (1 + hot * 2.2) * (0.75 + p.z * 1.4);
      const grad = ctx.createRadialGradient(x,y,0,x,y,rr*7);
      grad.addColorStop(0, color(p.hue, .24 + hot*.38));
      grad.addColorStop(.35, color(p.hue, .07 + hot*.14));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x,y,rr*7,0,Math.PI*2); ctx.fill();
      if (i % 3 === 0) {
        for (let j=i+1;j<Math.min(nodes.length,i+11);j++) {
          const q = nodes[j], qx=q.x*w, qy=q.y*h, dist=Math.hypot(x-qx,y-qy);
          if (dist < 150) {
            ctx.strokeStyle = color(p.hue, (1-dist/150) * (.055 + hot*.045));
            ctx.lineWidth = .65;
            ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(qx,qy); ctx.stroke();
          }
        }
      }
    }
    requestAnimationFrame(frame);
  }
  if (!reduce) requestAnimationFrame(frame);

  // Project-card micro intelligence: cards tilt toward pointer and reveal a scan node.
  const cards = [...document.querySelectorAll('.project-card, .lab-panel, .signal-card')];
  cards.forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--card-x', `${(x*100).toFixed(1)}%`);
      card.style.setProperty('--card-y', `${(y*100).toFixed(1)}%`);
      if (!reduce && !coarse) {
        card.style.transform = `perspective(900px) rotateX(${(0.5-y)*5.5}deg) rotateY(${(x-0.5)*7}deg) translateY(-4px)`;
      }
    }, { passive:true });
    card.addEventListener('pointerleave', () => { card.style.transform=''; }, { passive:true });
  });

  // A tiny “intelligence meter” that is useless, but exactly the kind of unnecessary detail that feels alive.
  const hud = document.createElement('div');
  hud.className = 'micro-intel-hud';
  hud.setAttribute('aria-hidden','true');
  hud.innerHTML = '<span>micro-intel</span><b>000</b><i>details tracking</i>';
  document.body.appendChild(hud);
  const hVal = hud.querySelector('b');
  function hudLoop(){
    const scrollMax = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const s = scrollY / scrollMax;
    const motion = Math.min(1, Math.hypot(vx,vy)/120);
    const val = Math.round((s*.62 + motion*.38) * 999);
    if (hVal) hVal.textContent = String(val).padStart(3,'0');
    requestAnimationFrame(hudLoop);
  }
  if (!isMobile) requestAnimationFrame(hudLoop);
})();
