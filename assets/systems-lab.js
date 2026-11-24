/* Gray–Scott reaction diffusion. Computed locally in-browser. */
(function(){
  const canvas=document.getElementById('rd-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d',{alpha:false});
  const feedEl=document.getElementById('feed'),killEl=document.getElementById('kill');
  const feedOut=document.getElementById('feed-out'),killOut=document.getElementById('kill-out');
  const pauseBtn=document.getElementById('rd-pause'),resetBtn=document.getElementById('rd-reset'),stateEl=document.getElementById('rd-state');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W=reduced?120:180,H=reduced?75:112,N=W*H;
  let a=new Float32Array(N),b=new Float32Array(N),na=new Float32Array(N),nb=new Float32Array(N);
  let paused=reduced,frame=0,drawing=false;
  const image=ctx.createImageData(W,H),px=image.data;
  canvas.width=W;canvas.height=H;
  function seed(){a.fill(1);b.fill(0);let s=12;for(let y=H/2-s;y<H/2+s;y++)for(let x=W/2-s;x<W/2+s;x++){const i=(y|0)*W+(x|0);b[i]=.86+(Math.sin(x*12.9898+y*78.233)*.5+.5)*.12;a[i]=1-b[i]*.5}frame=0;render()}
  function lap(arr,x,y){const xm=x?x-1:W-1,xp=x===W-1?0:x+1,ym=y?y-1:H-1,yp=y===H-1?0:y+1;return -arr[y*W+x]+.2*(arr[y*W+xm]+arr[y*W+xp]+arr[ym*W+x]+arr[yp*W+x])+.05*(arr[ym*W+xm]+arr[ym*W+xp]+arr[yp*W+xm]+arr[yp*W+xp])}
  function step(){const f=+feedEl.value,k=+killEl.value,da=1,db=.5;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,av=a[i],bv=b[i],r=av*bv*bv;na[i]=Math.max(0,Math.min(1,av+(da*lap(a,x,y)-r+f*(1-av))));nb[i]=Math.max(0,Math.min(1,bv+(db*lap(b,x,y)+r-(k+f)*bv)))}[a,na]=[na,a];[b,nb]=[nb,b]}
  function render(){for(let i=0;i<N;i++){const v=Math.max(0,Math.min(1,(a[i]-b[i]+.1)*1.15)),edge=Math.max(0,Math.min(1,b[i]*2.2));const p=i*4;px[p]=10+edge*135;px[p+1]=8+v*48+edge*15;px[p+2]=14+v*70+edge*130;px[p+3]=255}ctx.putImageData(image,0,0)}
  function loop(){if(!paused){for(let i=0;i<5;i++)step();if(frame++%2===0)render()}requestAnimationFrame(loop)}
  function inject(ev){const r=canvas.getBoundingClientRect(),x=Math.floor((ev.clientX-r.left)/r.width*W),y=Math.floor((ev.clientY-r.top)/r.height*H);for(let yy=-4;yy<=4;yy++)for(let xx=-4;xx<=4;xx++){const X=(x+xx+W)%W,Y=(y+yy+H)%H,i=Y*W+X;if(xx*xx+yy*yy<18){b[i]=1;a[i]=0}}render()}
  canvas.addEventListener('pointerdown',e=>{drawing=true;canvas.setPointerCapture(e.pointerId);inject(e)});canvas.addEventListener('pointermove',e=>{if(drawing)inject(e)});canvas.addEventListener('pointerup',()=>drawing=false);canvas.addEventListener('pointercancel',()=>drawing=false);
  function sync(){feedOut.textContent=(+feedEl.value).toFixed(4);killOut.textContent=(+killEl.value).toFixed(4)}
  feedEl.addEventListener('input',sync);killEl.addEventListener('input',sync);
  pauseBtn.addEventListener('click',()=>{paused=!paused;pauseBtn.textContent=paused?'resume':'pause';stateEl.textContent=paused?'PAUSED':'RUNNING'});
  resetBtn.addEventListener('click',seed);
  if(reduced){pauseBtn.textContent='resume';stateEl.textContent='PAUSED'}
  sync();seed();loop();
})();

/* Synthetic multi-agent world: portfolio-specific, deterministic and public. */
(function(){
  const cv=document.getElementById('civ-canvas'); if(!cv) return; const cx=cv.getContext('2d');
  const popEl=document.getElementById('civ-pop'),coopEl=document.getElementById('civ-coop'),pressureEl=document.getElementById('civ-pressure');
  const popOut=document.getElementById('civ-pop-out'),coopOut=document.getElementById('civ-coop-out'),pressureOut=document.getElementById('civ-pressure-out'),generationOut=document.getElementById('civ-generation');
  let agents=[],resources=[],seedValue=173,generation=0,last=0; const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rand(){seedValue=(seedValue*1664525+1013904223)>>>0;return seedValue/4294967296}
  function reset(){seedValue=(seedValue+7919)>>>0;generation=0;agents=[];resources=[];for(let i=0;i<+popEl.value;i++)agents.push({x:rand()*cv.width,y:rand()*cv.height,vx:(rand()-.5)*1.2,vy:(rand()-.5)*1.2,e:.45+rand()*.55,tribe:i%4});for(let i=0;i<44;i++)resources.push({x:rand()*cv.width,y:rand()*cv.height,r:2+rand()*5});sync()}
  function sync(){popOut.textContent=popEl.value;coopOut.textContent=(+coopEl.value).toFixed(2);pressureOut.textContent=(+pressureEl.value).toFixed(2);generationOut.textContent=generation}
  function tick(){const coop=+coopEl.value,pressure=+pressureEl.value;generation++;for(const a of agents){let target=null,dist=1e9;for(const r of resources){const dx=r.x-a.x,dy=r.y-a.y,d=dx*dx+dy*dy;if(d<dist){dist=d;target=r}}if(target){a.vx+=(target.x-a.x)*.00008;a.vy+=(target.y-a.y)*.00008}for(const o of agents){if(o===a||o.tribe!==a.tribe)continue;const dx=o.x-a.x,dy=o.y-a.y,d=dx*dx+dy*dy;if(d<900){a.vx+=dx*.00002*coop;a.vy+=dy*.00002*coop}}a.vx+=(rand()-.5)*.08*(1+pressure);a.vy+=(rand()-.5)*.08*(1+pressure);const speed=Math.hypot(a.vx,a.vy)||1,max=1.7-pressure*.5;if(speed>max){a.vx=a.vx/speed*max;a.vy=a.vy/speed*max}a.x=(a.x+a.vx+cv.width)%cv.width;a.y=(a.y+a.vy+cv.height)%cv.height;a.e=Math.max(.1,Math.min(1,a.e+.001*(coop-pressure)+(rand()-.5)*.008))}if(generation%180===0)resources[Math.floor(rand()*resources.length)]={x:rand()*cv.width,y:rand()*cv.height,r:3+rand()*5};sync()}
  function draw(){cx.fillStyle='#050407';cx.fillRect(0,0,cv.width,cv.height);cx.globalCompositeOperation='lighter';for(const r of resources){cx.fillStyle='rgba(196,168,255,.18)';cx.beginPath();cx.arc(r.x,r.y,r.r*3,0,7);cx.fill()}const colors=['#9d62ff','#55cfe5','#d6c8e2','#b45b7b'];for(const a of agents){cx.fillStyle=colors[a.tribe];cx.globalAlpha=.28+a.e*.7;cx.fillRect(a.x-1.3,a.y-1.3,2.6,2.6)}cx.globalAlpha=1;cx.globalCompositeOperation='source-over'}
  function loop(t){if(!reduced&&t-last>24){tick();draw();last=t}else if(reduced&&generation===0){draw()}requestAnimationFrame(loop)}
  [popEl,coopEl,pressureEl].forEach(el=>el.addEventListener('input',()=>{sync();if(el===popEl)reset()}));document.getElementById('civ-reset').addEventListener('click',reset);reset();loop(0);
})();

/* Information theory and cryptographic diffusion. */
(function(){
  const input=document.getElementById('entropy-input'); if(!input) return;
  const value=document.getElementById('entropy-value'),unique=document.getElementById('entropy-unique'),fill=document.getElementById('entropy-fill');
  function entropy(){const bytes=new TextEncoder().encode(input.value),counts=new Map();for(const b of bytes)counts.set(b,(counts.get(b)||0)+1);let h=0;for(const n of counts.values()){const p=n/Math.max(1,bytes.length);h-=p*Math.log2(p)}value.textContent=h.toFixed(2);unique.textContent=`${counts.size} unique symbols`;fill.style.width=`${Math.min(100,h/8*100)}%`}
  input.addEventListener('input',entropy);entropy();
  const ha=document.getElementById('hash-a'),hb=document.getElementById('hash-b'),distance=document.getElementById('hash-distance');
  async function digest(text){return new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))}
  function paint(canvas,data){const c=canvas.getContext('2d');c.fillStyle='#050407';c.fillRect(0,0,256,32);for(let i=0;i<256;i++){const bit=(data[i>>3]>>(7-(i&7)))&1;c.fillStyle=bit?'#b77cff':'#17131d';c.fillRect(i,0,1,32)}}
  async function hashes(){if(!crypto.subtle){distance.textContent='unavailable';return}const [a,b]=await Promise.all([digest(ha.value),digest(hb.value)]);paint(document.getElementById('hash-canvas-a'),a);paint(document.getElementById('hash-canvas-b'),b);let d=0;for(let i=0;i<a.length;i++){let x=a[i]^b[i];while(x){d+=x&1;x>>=1}}distance.textContent=d}
  ha.addEventListener('input',hashes);hb.addEventListener('input',hashes);hashes();
})();

/* Interactive public concept graph. */
(function(){
  const cv=document.getElementById('concept-canvas'); if(!cv) return; const c=cv.getContext('2d');
  const nodes=[['Systems',.5,.5,'Systems connect rules, state, interaction and change.'],['Mathematics',.18,.22,'Mathematics provides structures that can be tested, transformed and computed.'],['Intelligence',.76,.2,'Intelligence is treated as adaptation, inference and decision under constraints.'],['Emergence',.79,.62,'Emergence asks how local interactions produce global organization.'],['Evolution',.57,.82,'Evolution links variation, selection, history and artificial life.'],['Information',.2,.72,'Information connects uncertainty, representation, communication and computation.'],['Agency',.52,.22,'Agency concerns state, goals, action and consequences without assuming consciousness.'],['Creativity',.28,.48,'Creative technology makes formal processes perceptible and explorable.']];
  const edges=[[0,1],[0,2],[0,3],[0,5],[1,3],[1,5],[2,6],[2,5],[3,4],[3,7],[4,6],[5,6],[1,7]];let selected=0;
  function draw(){const w=cv.width,h=cv.height;c.fillStyle='#050407';c.fillRect(0,0,w,h);for(const [a,b] of edges){c.strokeStyle=a===selected||b===selected?'rgba(166,112,255,.6)':'rgba(255,255,255,.09)';c.lineWidth=a===selected||b===selected?1.6:1;c.beginPath();c.moveTo(nodes[a][1]*w,nodes[a][2]*h);c.lineTo(nodes[b][1]*w,nodes[b][2]*h);c.stroke()}nodes.forEach((n,i)=>{const x=n[1]*w,y=n[2]*h;c.beginPath();c.arc(x,y,i===selected?8:4,0,7);c.fillStyle=i===selected?'#c49aff':'#766682';c.fill();c.font=`${i===selected?'700':'500'} 14px monospace`;c.fillStyle=i===selected?'#f2ebf6':'#8f8497';c.fillText(n[0],x+12,y+5)});cv.parentElement.style.backgroundImage=`url(${cv.toDataURL('image/png')})`;cv.parentElement.style.backgroundSize='100% 100%'}
  function choose(i){selected=i;const d=document.getElementById('graph-detail');d.innerHTML=`<span>SELECTED / ${nodes[i][0].toUpperCase()}</span><strong>${nodes[i][3]}</strong>`;draw()}
  cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*cv.width,y=(e.clientY-r.top)/r.height*cv.height;let best=0,bd=1e9;nodes.forEach((n,i)=>{const d=(n[1]*cv.width-x)**2+(n[2]*cv.height-y)**2;if(d<bd){bd=d;best=i}});choose(best)});cv.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowDown')choose((selected+1)%nodes.length);if(e.key==='ArrowLeft'||e.key==='ArrowUp')choose((selected-1+nodes.length)%nodes.length)});draw();
})();

/* Browser command index — navigation only, never a shell. */
(function(){
  const trigger=document.getElementById('systems-command-trigger'),dialog=document.getElementById('systems-command'),input=document.getElementById('systems-command-input'),out=document.getElementById('systems-command-output');if(!trigger) return;
  const commands={help:'help · explore · simulate · math · intelligence · consciousness · graph · theme · clear',explore:'#concepts',simulate:'#civilizations',math:'/maths/',intelligence:'#concepts',consciousness:'#concepts',graph:'#graph',theme:'The visual system is fixed to the current scryx experimental theme.'};
  function run(raw){const cmd=raw.trim().toLowerCase();if(cmd==='clear'){out.textContent='';return}const dest=commands[cmd];if(!dest){out.textContent=`unknown command: ${cmd}\n${commands.help}`;return}if(dest.startsWith('#')){dialog.close();document.querySelector(dest)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});return}if(dest.startsWith('/')){location.href=dest;return}out.textContent=dest}
  trigger.addEventListener('click',()=>{dialog.showModal();setTimeout(()=>input.focus(),20)});input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run(input.value);input.select()}});addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='/'){e.preventDefault();dialog.open?dialog.close():trigger.click()}});
})();
