/* scryx / premium interaction layer — global reticle + high-detail spatial polish */
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const isMobile = matchMedia('(max-width: 760px)').matches;
  const root = document.documentElement;
  const body = document.body;
  setTimeout(() => document.querySelector('.boot-overlay')?.classList.add('done'), 2200);

  // The reticle is the cursor. Create it on every page, reuse the homepage markup if present.
  body.classList.add('reticle-cursor');
  let sys = document.getElementById('cursor-system');
  if (!sys && !coarse && !isMobile) {
    sys = document.createElement('div');
    sys.id = 'cursor-system';
    sys.className = 'cursor-system universal-reticle';
    sys.setAttribute('aria-hidden','true');
    sys.innerHTML = '<div class="cursor-ring" id="cursor-ring"></div><div class="cursor-reticle" id="cursor-reticle"><i class="c-dot"></i><i class="c-arm n"></i><i class="c-arm e"></i><i class="c-arm s"></i><i class="c-arm w"></i><div class="cursor-meta"><span id="cursor-label"></span><b id="cursor-coords">0000/0000</b></div></div>';
    document.body.appendChild(sys);
  }
  const ring = document.getElementById('cursor-ring');
  const ret = document.getElementById('cursor-reticle');
  const label = document.getElementById('cursor-label');
  const coords = document.getElementById('cursor-coords');
  let mx = innerWidth * .5, my = innerHeight * .5, vx = 0, vy = 0, rx = mx, ry = my;
  function labelFor(hit){
    if (!hit) return '';
    if (hit.dataset?.cursor) return hit.dataset.cursor;
    if (hit.classList?.contains('project-card')) return 'inspect';
    if (hit.tagName === 'A') return 'jump';
    if (hit.tagName === 'BUTTON') return 'exec';
    return 'focus';
  }
  addEventListener('pointermove', e => {
    vx = e.clientX - mx; vy = e.clientY - my; mx = e.clientX; my = e.clientY;
    root.style.setProperty('--mx', `${mx}px`);
    root.style.setProperty('--my', `${my}px`);
    root.style.setProperty('--mvx', `${Math.max(-1, Math.min(1, vx / 80)).toFixed(3)}`);
    root.style.setProperty('--mvy', `${Math.max(-1, Math.min(1, vy / 80)).toFixed(3)}`);
    if (sys) {
      sys.classList.add('on');
      const hit = e.target.closest?.('a,button,.project-card,.lab-panel,.spine-chip,[data-cursor]');
      sys.classList.toggle('is-hover', !!hit || !!window.__spineHoverLabel);
      if (label) label.textContent = window.__spineHoverLabel || labelFor(hit);
      if (coords) coords.textContent = `${String(Math.round(mx)).padStart(4,'0')}/${String(Math.round(my)).padStart(4,'0')}`;
    }
  }, { passive:true });
  addEventListener('pointerdown', () => sys?.classList.add('is-down'));
  addEventListener('pointerup', () => sys?.classList.remove('is-down'));
  document.documentElement.addEventListener('mouseleave', () => sys?.classList.remove('on'));
  if (sys && ret && ring && !coarse && !isMobile) {
    (function chase(){
      rx += (mx - rx) * (reduce ? 1 : .17); ry += (my - ry) * (reduce ? 1 : .17);
      ret.style.transform = `translate(${mx}px, ${my}px)`;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(chase);
    })();
  }

  // Section intelligence: body knows where you are, so particles/HUD/cards react coherently.
  const sections = ['interface','artifacts','project-scroll','map','flywire','xor','attention'];
  const zoneEls = sections.map(id => document.getElementById(id)).filter(Boolean);
  function updateZone(){
    if (!zoneEls.length) return;
    const mid = innerHeight * 0.48;
    let best = zoneEls[0], bestDist = Infinity;
    for (const el of zoneEls) {
      const r = el.getBoundingClientRect();
      const d = Math.abs((r.top + Math.min(r.height, innerHeight) * .5) - mid);
      if (r.bottom > 0 && r.top < innerHeight && d < bestDist) { best = el; bestDist = d; }
    }
    body.dataset.zone = best.id || 'surface';
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      let best = null;
      for (const e of entries) if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
      if (best) body.dataset.zone = best.target.id || 'surface';
    }, { threshold:[.18,.32,.55,.72] });
    zoneEls.forEach(el => io.observe(el));
  }
  addEventListener('scroll', updateZone, { passive:true });
  addEventListener('resize', updateZone, { passive:true });
  updateZone();

  // Premium particle canvas: layered motes + connective fibers + mouse shockwave.
  const canvas = document.createElement('canvas');
  canvas.className = 'premium-particles';
  canvas.setAttribute('aria-hidden','true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  // Global particles were a second full-screen animation layer on top of the
  // WebGL spine + mycelium. Nice in screenshots, brutal in real scrolling.
  const count = 0;
  if (!count && canvas) canvas.remove();
  const nodes = Array.from({length: count}, (_, i) => ({
    x: Math.random(), y: Math.random(), z: Math.random(), a: Math.random()*Math.PI*2,
    v: .00035 + Math.random()*.00105, r: .6 + Math.random()*2.3,
    hue: i % 7 === 0 ? 'cyan' : i % 5 === 0 ? 'gold' : 'violet'
  }));
  let w=0,h=0,dpr=1,t0=performance.now();
  function resize(){
    dpr = Math.min(devicePixelRatio || 1, isMobile ? 1.15 : 1.5);
    w = innerWidth; h = innerHeight;
    canvas.width = Math.floor(w*dpr); canvas.height = Math.floor(h*dpr);
    canvas.style.width = w+'px'; canvas.style.height = h+'px';
    ctx?.setTransform(dpr,0,0,dpr,0,0);
  }
  addEventListener('resize', resize, { passive:true }); resize();
  const color = (kind,a) => kind==='cyan' ? `rgba(73,230,255,${a})` : kind==='gold' ? `rgba(255,207,122,${a})` : `rgba(185,101,255,${a})`;
  function frame(now){
    if (!ctx) return;
    const t = (now-t0)*.001;
    ctx.clearRect(0,0,w,h);
    const zone = body.dataset.zone || 'interface';
    const zoneBoost = zone === 'artifacts' ? 1.35 : zone === 'project-scroll' ? 1.65 : zone === 'map' ? 1.15 : 1;
    for (let i=0;i<nodes.length;i++) {
      const p=nodes[i];
      const swirl = Math.sin(t*(.22+p.v*140)+p.a)*.0018*zoneBoost;
      const pullX=(mx/Math.max(1,w)-p.x)*(.00018+p.z*.00034), pullY=(my/Math.max(1,h)-p.y)*(.00012+p.z*.00022);
      p.x=(p.x+Math.cos(p.a+t*.18)*p.v+swirl+pullX+1)%1;
      p.y=(p.y+Math.sin(p.a*1.7+t*.14)*p.v*.72+pullY+1)%1;
      const x=p.x*w,y=p.y*h,hot=Math.max(0,1-Math.hypot(x-mx,y-my)/320),rr=p.r*(1+hot*2.4)*(0.75+p.z*1.4);
      const grad=ctx.createRadialGradient(x,y,0,x,y,rr*7);
      grad.addColorStop(0,color(p.hue,.24+hot*.42)); grad.addColorStop(.35,color(p.hue,.07+hot*.15)); grad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(x,y,rr*7,0,Math.PI*2); ctx.fill();
      if(i%3===0) for(let j=i+1;j<Math.min(nodes.length,i+11);j++){
        const q=nodes[j],qx=q.x*w,qy=q.y*h,dist=Math.hypot(x-qx,y-qy);
        if(dist<155){ctx.strokeStyle=color(p.hue,(1-dist/155)*(.06+hot*.05));ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(qx,qy);ctx.stroke();}
      }
    }
    if (!document.hidden) requestAnimationFrame(frame);
  }
  if (!reduce && count) requestAnimationFrame(frame);

  // Project-card micro intelligence: cards tilt toward pointer and reveal a scan node.
  const cards = [...document.querySelectorAll('.project-card, .lab-panel, .signal-card')];
  cards.forEach(card => {
    card.addEventListener('pointermove', e => {
      const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
      card.style.setProperty('--card-x', `${(x*100).toFixed(1)}%`); card.style.setProperty('--card-y', `${(y*100).toFixed(1)}%`);
      if(!reduce && !coarse) card.style.transform=`perspective(900px) rotateX(${(0.5-y)*5.5}deg) rotateY(${(x-0.5)*7}deg) translateY(-4px)`;
    }, { passive:true });
    card.addEventListener('pointerleave',()=>{card.style.transform='';},{passive:true});
  });

  const hud=document.createElement('div'); hud.className='micro-intel-hud'; hud.setAttribute('aria-hidden','true'); hud.innerHTML='<span>micro-intel</span><b>000</b><i>details tracking</i>'; document.body.appendChild(hud);
  const hVal=hud.querySelector('b');
  function hudLoop(){const max=Math.max(1,document.documentElement.scrollHeight-innerHeight),s=scrollY/max,motion=Math.min(1,Math.hypot(vx,vy)/120),val=Math.round((s*.62+motion*.38)*999); if(hVal)hVal.textContent=String(val).padStart(3,'0'); if(!document.hidden) requestAnimationFrame(hudLoop);}
  if(!isMobile) requestAnimationFrame(hudLoop);
})();
