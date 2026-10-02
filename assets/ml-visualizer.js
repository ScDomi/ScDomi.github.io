const sigmoid = z => 1 / (1 + Math.exp(-z));
const plane = document.getElementById('plane');
const ctx = plane.getContext('2d');
const lossCanvas = document.getElementById('lossCanvas');
const lctx = lossCanvas.getContext('2d');
const lossValue = document.getElementById('lossValue');
const accValue = document.getElementById('accValue');
const epochValue = document.getElementById('epochValue');
const trainBtn = document.getElementById('trainBtn');
const stepBtn = document.getElementById('stepBtn');
const resetBtn = document.getElementById('resetBtn');
const speed = document.getElementById('speed');
const compareCanvas = document.getElementById('compareCanvas');
const cctx = compareCanvas.getContext('2d');
const mathTitle = document.getElementById('mathTitle');
const mathFormula = document.getElementById('mathFormula');
const mathText = document.getElementById('mathText');
const tabs = [...document.querySelectorAll('.tab')];

let points, w, b, epoch, running, path, frame, compareMode = 'cluster';

function reset(){
  points = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for(let i=0;i<78;i++){
    const cls = i % 2;
    const cx = cls ? 1.25 : -1.1;
    const cy = cls ? .72 : -.65;
    points.push({
      x: cx + (rnd()-.5)*1.8 + (rnd()-.5)*.5,
      y: cy + (rnd()-.5)*1.5,
      label: cls
    });
  }
  w = {x:-.65,y:.38};
  b = -.12;
  epoch = 0;
  running = true;
  path = [];
  frame = 0;
  drawAll();
}

function model(p){ return sigmoid(w.x*p.x + w.y*p.y + b); }

function metrics(){
  let loss = 0, correct = 0;
  for(const p of points){
    const y = model(p);
    loss += -(p.label*Math.log(y+1e-8)+(1-p.label)*Math.log(1-y+1e-8));
    correct += (y>.5) === !!p.label ? 1 : 0;
  }
  return {loss: loss/points.length, acc: correct/points.length};
}

function trainStep(){
  let dwx=0,dwy=0,db=0;
  for(const p of points){
    const err = model(p)-p.label;
    dwx += err*p.x; dwy += err*p.y; db += err;
  }
  const lr = .18;
  w.x -= lr*dwx/points.length;
  w.y -= lr*dwy/points.length;
  b -= lr*db/points.length;
  epoch++;
  const m = metrics();
  path.push({x:w.x,y:w.y,loss:m.loss});
  if(path.length>220) path.shift();
  drawAll();
}

const mapX = x => plane.width*(.5 + x/5.2);
const mapY = y => plane.height*(.5 - y/4.0);

function drawPlane(){
  ctx.clearRect(0,0,plane.width,plane.height);
  const grd = ctx.createRadialGradient(plane.width*.55,plane.height*.34,20,plane.width*.55,plane.height*.34,plane.width*.75);
  grd.addColorStop(0,'rgba(143,77,255,.16)');grd.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = '#05030b'; ctx.fillRect(0,0,plane.width,plane.height); ctx.fillStyle = grd; ctx.fillRect(0,0,plane.width,plane.height);

  for(let x=0;x<plane.width;x+=18){ for(let y=0;y<plane.height;y+=18){
    const px = (x/plane.width-.5)*5.2;
    const py = (.5-y/plane.height)*4.0;
    const v = sigmoid(w.x*px+w.y*py+b);
    ctx.fillStyle = v>.5 ? `rgba(143,77,255,${.04+.11*v})` : `rgba(91,214,255,${.04+.11*(1-v)})`;
    ctx.fillRect(x,y,18,18);
  }}

  ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1;
  for(let x=0;x<plane.width;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,plane.height);ctx.stroke();}
  for(let y=0;y<plane.height;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(plane.width,y);ctx.stroke();}

  const x1=-2.6,x2=2.6;
  const y1=-(w.x*x1+b)/(w.y || 1e-6);
  const y2=-(w.x*x2+b)/(w.y || 1e-6);
  ctx.strokeStyle='rgba(247,239,255,.92)'; ctx.lineWidth=4; ctx.shadowColor='rgba(202,169,255,.8)'; ctx.shadowBlur=18;
  ctx.beginPath(); ctx.moveTo(mapX(x1),mapY(y1)); ctx.lineTo(mapX(x2),mapY(y2)); ctx.stroke(); ctx.shadowBlur=0;

  for(const p of points){
    const pred = model(p); const wrong = (pred>.5)!==!!p.label;
    const pulse = (Math.sin(frame*.08 + p.x*4 + p.y*3)+1)*.5;
    ctx.beginPath(); ctx.arc(mapX(p.x),mapY(p.y), (wrong?8:6)+pulse*1.8,0,Math.PI*2);
    ctx.fillStyle = p.label ? '#a673ff' : '#5bd6ff'; ctx.fill();
    ctx.strokeStyle = wrong ? '#ff6b9a' : 'rgba(255,255,255,.72)'; ctx.lineWidth= wrong?2.5:1.2; ctx.stroke();
  }
  const m=metrics();
  lossValue.textContent=m.loss.toFixed(3); accValue.textContent=Math.round(m.acc*100)+'%'; epochValue.textContent=epoch;
}

function lossAt(wx,wy){
  let sum=0;
  for(const p of points){const y=sigmoid(wx*p.x+wy*p.y+b); sum += -(p.label*Math.log(y+1e-8)+(1-p.label)*Math.log(1-y+1e-8));}
  return sum/points.length;
}
function drawLoss(){
  lctx.clearRect(0,0,lossCanvas.width,lossCanvas.height);
  lctx.fillStyle='#05030b'; lctx.fillRect(0,0,lossCanvas.width,lossCanvas.height);
  for(let x=0;x<lossCanvas.width;x+=12){for(let y=0;y<lossCanvas.height;y+=12){
    const wx=(x/lossCanvas.width-.5)*4;
    const wy=(.5-y/lossCanvas.height)*3;
    const L=Math.min(1.8,lossAt(wx,wy));
    const a=.05 + Math.max(0,1-L/1.8)*.28;
    lctx.fillStyle=`rgba(${70+Math.floor(110*(1-L/1.8))},${40+Math.floor(40*(1-L/1.8))},255,${a})`;
    lctx.fillRect(x,y,12,12);
  }}
  lctx.strokeStyle='rgba(255,255,255,.08)';lctx.lineWidth=1;
  for(let x=0;x<lossCanvas.width;x+=70){lctx.beginPath();lctx.moveTo(x,0);lctx.lineTo(x,lossCanvas.height);lctx.stroke();}
  for(let y=0;y<lossCanvas.height;y+=70){lctx.beginPath();lctx.moveTo(0,y);lctx.lineTo(lossCanvas.width,y);lctx.stroke();}
  const px = wx => lossCanvas.width*(.5+wx/4); const py = wy => lossCanvas.height*(.5-wy/3);
  lctx.strokeStyle='rgba(119,255,200,.88)'; lctx.lineWidth=3; lctx.shadowColor='rgba(119,255,200,.6)'; lctx.shadowBlur=14;
  lctx.beginPath(); path.forEach((p,i)=>{const x=px(p.x),y=py(p.y); if(i)lctx.lineTo(x,y); else lctx.moveTo(x,y);}); lctx.stroke();
  lctx.shadowBlur=0;
  const cur=path[path.length-1]||{x:w.x,y:w.y};
  lctx.strokeStyle=`rgba(119,255,200,${.18+.22*Math.sin(frame*.08)})`; lctx.lineWidth=2; lctx.beginPath(); lctx.arc(px(cur.x),py(cur.y),18+Math.sin(frame*.08)*6,0,Math.PI*2); lctx.stroke();
  lctx.fillStyle='#77ffc8'; lctx.beginPath(); lctx.arc(px(cur.x),py(cur.y),9,0,Math.PI*2); lctx.fill();
  lctx.fillStyle='rgba(243,236,255,.7)'; lctx.font='700 15px ui-monospace,Menlo,monospace'; lctx.fillText('loss landscape: every pixel is a possible model',24,36);
}

function drawNetwork(){
  const svg=document.getElementById('networkSvg');
  svg.innerHTML='';
  const layers=[[130,145,210,275],[450,90,150,210,270,330],[760,150,210,270]];
  const nodes=[];
  layers.forEach((arr,li)=>arr.slice(1).forEach((y,ni)=>nodes.push({li,ni,x:arr[0],y})));
  const byLayer=li=>nodes.filter(n=>n.li===li);
  for(const a of byLayer(0)) for(const c of byLayer(1)) edge(svg,a,c);
  for(const a of byLayer(1)) for(const c of byLayer(2)) edge(svg,a,c);
  nodes.forEach((n,i)=>node(svg,n,(i+epoch)%5===0));

  const forward=((epoch+frame*.35)%100)/100;
  const backward=1-forward;
  const fx=130 + forward*(760-130), fy=210 + Math.sin(forward*Math.PI*2+epoch*.04)*64;
  const bx=130 + backward*(760-130), by=246 + Math.cos(backward*Math.PI*2+epoch*.06)*48;
  const pulse=document.createElementNS('http://www.w3.org/2000/svg','circle'); pulse.setAttribute('class','pulse'); pulse.setAttribute('cx',fx); pulse.setAttribute('cy',fy); pulse.setAttribute('r',7); svg.appendChild(pulse);
  const back=document.createElementNS('http://www.w3.org/2000/svg','circle'); back.setAttribute('class','backpulse'); back.setAttribute('cx',bx); back.setAttribute('cy',by); back.setAttribute('r',6); svg.appendChild(back);
  label(svg,110,55,'input'); label(svg,425,55,'hidden layer folds space'); label(svg,735,55,'output');
}
function edge(svg,a,b){const l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('class',((a.ni+b.ni+epoch)%7===0)?'edge hot':'edge');l.setAttribute('x1',a.x);l.setAttribute('y1',a.y);l.setAttribute('x2',b.x);l.setAttribute('y2',b.y);svg.appendChild(l)}
function node(svg,n,hot){const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('class',hot?'node hot':'node');c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);c.setAttribute('r',28);svg.appendChild(c)}
function label(svg,x,y,text){const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('fill','rgba(244,234,255,.62)');t.setAttribute('font-size','14');t.setAttribute('font-family','ui-monospace, Menlo, monospace');t.setAttribute('font-weight','800');t.textContent=text;svg.appendChild(t)}
const compareInfo = {
  cluster:['k-means clustering','min Σᵢ ||xᵢ - μ_{cᵢ}||²','No labels. It moves centroids until nearby points agree on a cluster.'],
  linear:['linear regression','ŷ = w·x + b  //  min Σ(ŷ - y)²','Predicts a number. Best fit is the line that makes squared error small.'],
  logistic:['logistic regression','p(y=1|x)=σ(w·x+b)','Predicts probability. Same linear score, squeezed through sigmoid into 0…1.'],
  mlp:['multilayer perceptron','h=σ(W₁x+b₁),  ŷ=σ(W₂h+b₂)','Adds hidden layers, so the boundary can bend instead of pretending the world is linear.']
};
function drawCompare(){
  cctx.clearRect(0,0,compareCanvas.width,compareCanvas.height);
  cctx.fillStyle='#05030b'; cctx.fillRect(0,0,compareCanvas.width,compareCanvas.height);
  const W=compareCanvas.width,H=compareCanvas.height;
  const gx=x=>W*(.5+x/5.2), gy=y=>H*(.52-y/3.8);
  for(let x=0;x<W;x+=44){cctx.strokeStyle='rgba(255,255,255,.055)';cctx.beginPath();cctx.moveTo(x,0);cctx.lineTo(x,H);cctx.stroke();}
  for(let y=0;y<H;y+=44){cctx.strokeStyle='rgba(255,255,255,.055)';cctx.beginPath();cctx.moveTo(0,y);cctx.lineTo(W,y);cctx.stroke();}
  if(compareMode==='cluster'){
    const centers=[{x:-1.25,y:-.7,c:'#5bd6ff'},{x:1.2,y:.75,c:'#a673ff'}];
    centers.forEach((m,mi)=>{cctx.strokeStyle=m.c;cctx.lineWidth=2;cctx.setLineDash([8,10]);cctx.beginPath();cctx.arc(gx(m.x),gy(m.y),105+20*Math.sin(frame*.04+mi),0,Math.PI*2);cctx.stroke();cctx.setLineDash([]);cctx.fillStyle=m.c;cctx.beginPath();cctx.arc(gx(m.x),gy(m.y),14,0,Math.PI*2);cctx.fill();});
    points.forEach(p=>{const d0=(p.x+1.25)**2+(p.y+.7)**2,d1=(p.x-1.2)**2+(p.y-.75)**2; cctx.fillStyle=d0<d1?'#5bd6ff':'#a673ff'; cctx.beginPath();cctx.arc(gx(p.x),gy(p.y),6,0,Math.PI*2);cctx.fill();});
  } else if(compareMode==='linear'){
    points.forEach(p=>{const yy=p.x*.55 + (p.label?.65:-.35); cctx.fillStyle=p.label?'#a673ff':'#5bd6ff'; cctx.beginPath();cctx.arc(gx(p.x),gy(yy),6,0,Math.PI*2);cctx.fill();});
    cctx.strokeStyle='rgba(119,255,200,.95)';cctx.lineWidth=4;cctx.beginPath();cctx.moveTo(gx(-2.6),gy(-1.2));cctx.lineTo(gx(2.6),gy(1.2));cctx.stroke();
  } else if(compareMode==='logistic'){
    for(let x=0;x<W;x+=18){for(let y=0;y<H;y+=18){const px=(x/W-.5)*5.2,py=(.52-y/H)*3.8; const v=sigmoid(w.x*px+w.y*py+b); cctx.fillStyle=v>.5?`rgba(143,77,255,${.05+.13*v})`:`rgba(91,214,255,${.05+.13*(1-v)})`; cctx.fillRect(x,y,18,18)}}
    points.forEach(p=>{cctx.fillStyle=p.label?'#a673ff':'#5bd6ff';cctx.beginPath();cctx.arc(gx(p.x),gy(p.y),6,0,Math.PI*2);cctx.fill();});
    cctx.strokeStyle='rgba(255,255,255,.92)';cctx.lineWidth=4;cctx.beginPath();cctx.moveTo(gx(-2.6),gy(-(w.x*-2.6+b)/(w.y||1e-6)));cctx.lineTo(gx(2.6),gy(-(w.x*2.6+b)/(w.y||1e-6)));cctx.stroke();
  } else {
    for(let x=0;x<W;x+=16){for(let y=0;y<H;y+=16){const px=(x/W-.5)*5.2,py=(.52-y/H)*3.8; const curve=Math.sin(px*2.2+frame*.015)*.45 + Math.cos(px*.9)*.25; const v=py>curve; cctx.fillStyle=v?'rgba(143,77,255,.16)':'rgba(91,214,255,.14)'; cctx.fillRect(x,y,16,16)}}
    cctx.strokeStyle='rgba(119,255,200,.92)';cctx.lineWidth=4;cctx.beginPath();for(let i=0;i<=180;i++){const x=-2.6+i/180*5.2,y=Math.sin(x*2.2+frame*.015)*.45+Math.cos(x*.9)*.25; if(i)cctx.lineTo(gx(x),gy(y));else cctx.moveTo(gx(x),gy(y));}cctx.stroke();
    points.forEach(p=>{cctx.fillStyle=p.label?'#a673ff':'#5bd6ff';cctx.beginPath();cctx.arc(gx(p.x),gy(p.y),6,0,Math.PI*2);cctx.fill();});
  }
  const [title,formula,text]=compareInfo[compareMode]; mathTitle.textContent=title; mathFormula.textContent=formula; mathText.textContent=text;
}
function drawAll(){drawPlane();drawLoss();drawNetwork();drawCompare();}

function loop(){
  frame++;
  if(running){ for(let i=0;i<Number(speed.value);i++) trainStep(); }
  else { drawAll(); }
  requestAnimationFrame(loop);
}
trainBtn.onclick=()=>{running=!running;trainBtn.textContent=running?'pause realtime':'resume realtime'};
stepBtn.onclick=()=>trainStep();
resetBtn.onclick=()=>reset();
tabs.forEach(tab=>tab.onclick=()=>{compareMode=tab.dataset.mode;tabs.forEach(t=>t.classList.toggle('active',t===tab));drawCompare();});

function initScryxShell(){
  const orb=document.getElementById('cursor-orb');
  const pct=document.getElementById('scroll-percent');
  window.addEventListener('pointermove',e=>{
    if(!orb) return;
    document.documentElement.style.setProperty('--mx',`${e.clientX}px`);
    document.documentElement.style.setProperty('--my',`${e.clientY}px`);
    orb.style.transform=`translate(${e.clientX}px,${e.clientY}px)`;
  },{passive:true});
  const updateScroll=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight); if(pct)pct.textContent=String(Math.round(scrollY/max*100)).padStart(2,'0')};
  window.addEventListener('scroll',updateScroll,{passive:true}); updateScroll();

  const field=document.getElementById('field-canvas');
  const spark=document.getElementById('spark-canvas');
  const fctx=field?.getContext('2d');
  const sctx=spark?.getContext('2d');
  if(!fctx || !sctx) return;
  let W=0,H=0,dpr=1,t=0;
  const nodes=Array.from({length:54},(_,i)=>({x:(i*97)%1000/1000,y:(i*193)%1000/1000,r:.8+((i*37)%100)/100*1.8,p:i*.7}));
  const resize=()=>{dpr=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;[field,spark].forEach(c=>{c.width=W*dpr;c.height=H*dpr;c.style.width=W+'px';c.style.height=H+'px'});fctx.setTransform(dpr,0,0,dpr,0,0);sctx.setTransform(dpr,0,0,dpr,0,0)};
  window.addEventListener('resize',resize);resize();
  const render=()=>{
    t+=.006;fctx.clearRect(0,0,W,H);sctx.clearRect(0,0,W,H);
    const g=fctx.createRadialGradient(W*.68,H*.18,20,W*.68,H*.18,Math.max(W,H)*.78);g.addColorStop(0,'rgba(166,115,255,.18)');g.addColorStop(.45,'rgba(45,30,80,.12)');g.addColorStop(1,'rgba(0,0,0,0)');fctx.fillStyle=g;fctx.fillRect(0,0,W,H);
    for(let i=0;i<nodes.length;i++){
      const n=nodes[i],x=n.x*W+Math.sin(t*2+n.p)*28,y=n.y*H+Math.cos(t*1.7+n.p)*22;
      sctx.fillStyle=i%7===0?'rgba(255,207,122,.65)':'rgba(202,169,255,.42)';sctx.beginPath();sctx.arc(x,y,n.r,0,Math.PI*2);sctx.fill();
      for(let j=i+1;j<nodes.length;j+=9){const m=nodes[j],x2=m.x*W+Math.sin(t*2+m.p)*28,y2=m.y*H+Math.cos(t*1.7+m.p)*22,dist=Math.hypot(x-x2,y-y2);if(dist<170){sctx.strokeStyle=`rgba(202,169,255,${(1-dist/170)*.16})`;sctx.lineWidth=1;sctx.beginPath();sctx.moveTo(x,y);sctx.lineTo(x2,y2);sctx.stroke();}}
    }
    requestAnimationFrame(render);
  };
  render();
}

initScryxShell();
reset(); loop();
