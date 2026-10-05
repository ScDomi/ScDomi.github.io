/* scryx / mycelium swarm background
   Quiet agent-based network: branching mycelium graph + boids-like signal swarm.
   Integrated as background texture, not a content section. */
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 760px)').matches;
  if (reduce) return;
  const canvas = document.getElementById('mycelium-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha:true });
  if (!ctx) return;

  const root = document.documentElement;
  let w=1,h=1,dpr=1,mx=.55,my=.45,scroll=0,t0=performance.now();
  const nodeN = mobile ? 42 : 78;
  const boidN = mobile ? 34 : 72;

  function rnd(i){ const x = Math.sin(i*127.1+13.7)*43758.5453; return x-Math.floor(x); }
  const nodes = Array.from({length:nodeN},(_,i)=>{
    const layer = i / Math.max(1,nodeN-1);
    const arm = (i%7)/7*Math.PI*2;
    const radius = Math.pow(rnd(i+2),.55)*.48;
    return {
      x:.5 + Math.cos(arm+layer*2.6)*radius + (rnd(i+9)-.5)*.18,
      y:.52 + Math.sin(arm*.72+layer*3.1)*radius*.62 + (rnd(i+17)-.5)*.22,
      z:rnd(i+31),
      p:i>0?Math.max(0,Math.floor(i*rnd(i+44)*.72)):null,
      phase:rnd(i+71)*Math.PI*2,
      pulse:0
    };
  });
  const boids = Array.from({length:boidN},(_,i)=>({
    x:rnd(i+100), y:rnd(i+200), vx:(rnd(i+300)-.5)*.0012, vy:(rnd(i+400)-.5)*.0012, hue:rnd(i+500), phase:rnd(i+600)*6.28
  }));

  function resize(){
    dpr=Math.min(devicePixelRatio||1,mobile?1.1:1.45); w=innerWidth; h=innerHeight;
    canvas.width=Math.floor(w*dpr); canvas.height=Math.floor(h*dpr); canvas.style.width=w+'px'; canvas.style.height=h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function updateScroll(){
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    scroll=Math.min(1,Math.max(0,scrollY/max));
  }
  addEventListener('resize',resize,{passive:true});
  addEventListener('scroll',updateScroll,{passive:true});
  addEventListener('pointermove',e=>{mx=e.clientX/Math.max(1,w); my=e.clientY/Math.max(1,h);},{passive:true});
  resize(); updateScroll();

  function color(kind,a){
    if(kind==='cyan') return `rgba(127,243,255,${a})`;
    if(kind==='green') return `rgba(84,255,188,${a})`;
    return `rgba(185,101,255,${a})`;
  }

  function frame(now){
    const time=(now-t0)*.001;
    const zone=document.body.dataset.zone||'interface';
    const active = zone==='artifacts'||zone==='project-scroll'||zone==='map'||document.body.classList.contains('spine-muted');
    const alphaTarget = active ? .74 : .28;
    ctx.clearRect(0,0,w,h);
    ctx.globalCompositeOperation='lighter';

    const driftX = Math.sin(time*.055)*34 + (mx-.5)*28;
    const driftY = Math.cos(time*.047)*20 + (my-.5)*18;
    const zoom = 1 + scroll*.18;
    const cx=w*.54+driftX, cy=h*.50+driftY;

    // Mycelium threads: deterministic branching graph, breathing slowly.
    for (let i=1;i<nodes.length;i++){
      const n=nodes[i], p=nodes[n.p ?? 0];
      const nx=cx+(n.x-.5)*w*.92*zoom, ny=cy+(n.y-.5)*h*.82*zoom;
      const px=cx+(p.x-.5)*w*.92*zoom, py=cy+(p.y-.5)*h*.82*zoom;
      const pulse=(Math.sin(time*.75+n.phase+scroll*5)+1)*.5;
      n.pulse=pulse;
      const grad=ctx.createLinearGradient(px,py,nx,ny);
      grad.addColorStop(0,color('violet',.012*alphaTarget+.018*pulse));
      grad.addColorStop(.55,color('cyan',.018*alphaTarget+.030*pulse));
      grad.addColorStop(1,color('green',.010*alphaTarget+.020*pulse));
      ctx.strokeStyle=grad; ctx.lineWidth=(.45+n.z*1.15)*(active?1.15:.75);
      ctx.beginPath();
      const bow=Math.sin(n.phase+time*.21)*24*n.z;
      ctx.moveTo(px,py); ctx.quadraticCurveTo((px+nx)/2+bow,(py+ny)/2-bow*.45,nx,ny); ctx.stroke();
      if (pulse>.82 && active){
        ctx.fillStyle=color('cyan',(.05+.08*(pulse-.82)/.18)*alphaTarget);
        ctx.beginPath(); ctx.arc(nx,ny,1.4+n.z*2.2,0,Math.PI*2); ctx.fill();
      }
    }

    // Swarm intelligence: small boids attracted to network/mouse, with separation.
    for(let i=0;i<boids.length;i++){
      const b=boids[i];
      let ax=0, ay=0;
      const target=nodes[(i*5+Math.floor(time*.35))%nodes.length];
      ax+=(target.x-b.x)*.00020; ay+=(target.y-b.y)*.00020;
      ax+=(mx-b.x)*.000035; ay+=(my-b.y)*.000030;
      for(let j=i+1;j<Math.min(boids.length,i+8);j++){
        const q=boids[j], dx=b.x-q.x, dy=b.y-q.y, d2=dx*dx+dy*dy;
        if(d2<.004 && d2>0){ ax+=dx*.00010/d2; ay+=dy*.00010/d2; }
      }
      b.vx=(b.vx+ax)*.992; b.vy=(b.vy+ay)*.992;
      const sp=Math.hypot(b.vx,b.vy)||1; const max=.0018+(active?.0012:.0004);
      if(sp>max){ b.vx=b.vx/sp*max; b.vy=b.vy/sp*max; }
      b.x=(b.x+b.vx+1)%1; b.y=(b.y+b.vy+1)%1;
      const x=cx+(b.x-.5)*w*.95*zoom, y=cy+(b.y-.5)*h*.86*zoom;
      ctx.fillStyle=b.hue>.72?color('green',.12*alphaTarget):b.hue>.36?color('cyan',.15*alphaTarget):color('violet',.13*alphaTarget);
      ctx.beginPath(); ctx.arc(x,y,active?1.7:1.15,0,Math.PI*2); ctx.fill();
      if(active){
        ctx.strokeStyle=color('cyan',.025*alphaTarget); ctx.lineWidth=.55;
        ctx.beginPath(); ctx.moveTo(x-b.vx*12000,y-b.vy*12000); ctx.lineTo(x,y); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation='source-over';
    // subtle veil so it embeds into the page instead of sitting on top
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h)*.62);
    g.addColorStop(0,`rgba(185,101,255,${.035*alphaTarget})`); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
