const sigmoid = z => 1 / (1 + Math.exp(-z));
const plane = document.getElementById('plane');
const ctx = plane ? plane.getContext('2d') : null;
const lossCanvas = document.getElementById('lossCanvas');
const lctx = lossCanvas ? lossCanvas.getContext('2d') : null;
const lossValue = document.getElementById('lossValue');
const accValue = document.getElementById('accValue');
const epochValue = document.getElementById('epochValue');
const trainBtn = document.getElementById('trainBtn');
const stepBtn = document.getElementById('stepBtn');
const resetBtn = document.getElementById('resetBtn');
const prevScene = document.getElementById('prevScene');
const nextScene = document.getElementById('nextScene');
const speed = document.getElementById('speed');
const compareCanvas = document.getElementById('compareCanvas');
const cctx = compareCanvas ? compareCanvas.getContext('2d') : null;
const mathTitle = document.getElementById('mathTitle');
const mathFormula = document.getElementById('mathFormula');
const mathText = document.getElementById('mathText');
const stepCount = document.getElementById('stepCount');
const stepTitle = document.getElementById('stepTitle');
const stepText = document.getElementById('stepText');
const tabs = [...document.querySelectorAll('.tab')];
const hasMlDom = !!(plane && lossCanvas && compareCanvas && trainBtn);

let points, w, b, epoch, running, path, frame, compareMode = 'cluster', stepIndex = 0, linW, linB, centroids, mlp, dockHold = 0;
const dockEpoch = document.getElementById('dockEpoch'), dockLoss = document.getElementById('dockLoss'), dockAcc = document.getElementById('dockAcc');
let seedBase = 7; const srnd = () => ((seedBase = (seedBase * 16807) % 2147483647) - 1) / 2147483646;

const compareInfo = {
  cluster:['k-means · online','assign → move μ → repeat','No labels. The centroids really move every epoch (fractional Lloyd steps); the dashed ring is the live mean distance of assigned points.'],
  linear:['linear regression · live GD','ŷ = wx + b  //  min Σ(ŷ - y)²','The gold line is trained right now on the same dots. The vertical bars are the current residuals — watch them shrink.'],
  logistic:['logistic regression · live GD','p(y=1|x)=σ(w·x+b)','Same weights as chapter 01, same live gradient. On crescents the best line keeps pink-ringed stragglers — that is the point.'],
  mlp:['mlp 2→6→1 · live backprop','h=tanh(W₁x+b₁),  ŷ=σ(W₂h+b₂)','A real network training on these dots. Every colored cell is a fresh forward pass; the white band is where the net is exactly unsure.']
};
const stepCopy = [
  ['Start with the points.','Two crescents no straight line can fully split. Every model on this page trains on them live, right now.'],
  ['Draw the model’s assumption.','Clustering moves centers, regression fits a line, logistic draws a probability split, the MLP bends a learned boundary — all real, all training.'],
  ['Show the mistake.','Residual bars, pink wrong-side rings, and live accuracy in the dock make the error visible instead of hiding it in a metric.'],
  ['Train / step live.','The dock at the bottom follows you while scrolling: pause everything, or advance exactly one epoch and watch the loss delta.']
];

function reset(){
  points = [];
  seedBase = 7;
  for(let i=0;i<84;i++){
    const cls = i % 2;
    const a = srnd()*Math.PI, r = 1.15 + srnd()*.3;
    const px = cls ? -Math.cos(a)*r + .55 : Math.cos(a)*r - .55;
    const py = cls ? -Math.sin(a)*.95 + .62 : Math.sin(a)*.95 - .62;
    points.push({ x: px + (srnd()-.5)*.3, y: py + (srnd()-.5)*.3, label: cls });
  }
  w = {x:0,y:0}; b = 0; epoch = 0; running = true; path = []; frame = 0;
  linW = .1; linB = .4;
  centroids = [{x:-1.7,y:.9,c:'#8fdcff'},{x:1.7,y:-.9,c:'#a673ff'}];
  mlp = { W1:Array.from({length:6},()=>[(srnd()-.5)*1.6,(srnd()-.5)*1.6]), B1:Array.from({length:6},()=>(srnd()-.5)*.5), W2:Array.from({length:6},()=>(srnd()-.5)*1.6), B2:(srnd()-.5)*.5 };
  dockHold = 0;
  if(trainBtn) trainBtn.textContent = 'pause realtime';
  drawAll();
}
function model(p){ return sigmoid(w.x*p.x + w.y*p.y + b); }
function metrics(){
  let loss = 0, correct = 0;
  for(const p of points){ const y = model(p); loss += -(p.label*Math.log(y+1e-8)+(1-p.label)*Math.log(1-y+1e-8)); correct += (y>.5) === !!p.label ? 1 : 0; }
  return {loss: loss/points.length, acc: correct/points.length};
}
function mlpFwd(x,y){
  const h = new Array(6);
  for(let i=0;i<6;i++) h[i] = Math.tanh(mlp.W1[i][0]*x + mlp.W1[i][1]*y + mlp.B1[i]);
  let s = mlp.B2;
  for(let i=0;i<6;i++) s += mlp.W2[i]*h[i];
  return {h, o: sigmoid(s)};
}
function mlpAcc(){ if(!mlp) return 0; let c=0; for(const p of points){ c += ((mlpFwd(p.x,p.y).o>.5)?1:0)===p.label ? 1 : 0; } return c/points.length; }
function mlpStep(){
  const n = points.length, lr = .25;
  const gW1 = Array.from({length:6},()=>[0,0]), gB1 = new Array(6).fill(0), gW2 = new Array(6).fill(0); let gB2 = 0;
  for(const p of points){
    const f = mlpFwd(p.x,p.y), err = f.o - p.label;
    for(let i=0;i<6;i++){
      gW2[i] += err*f.h[i];
      const d = err*mlp.W2[i]*(1-f.h[i]*f.h[i]);
      gW1[i][0] += d*p.x; gW1[i][1] += d*p.y; gB1[i] += d;
    }
    gB2 += err;
  }
  for(let i=0;i<6;i++){ mlp.W2[i] -= lr*gW2[i]/n; mlp.W1[i][0] -= lr*gW1[i][0]/n; mlp.W1[i][1] -= lr*gW1[i][1]/n; mlp.B1[i] -= lr*gB1[i]/n; }
  mlp.B2 -= lr*gB2/n;
}
function linStep(){
  const sample = points.slice(0,42).map((p,i)=>({x:p.x, y:p.x*.78+(p.label?.85:-.65)+Math.sin(i*1.7)*.26}));
  let gw=0, gb=0;
  for(const s of sample){ const e = (linW*s.x+linB) - s.y; gw += e*s.x; gb += e; }
  const lr = .06, n = sample.length; linW -= lr*gw/n; linB -= lr*gb/n;
}
function kmeansStep(){
  const sums = [{sx:0,sy:0,n:0},{sx:0,sy:0,n:0}];
  for(const p of points){
    const d0=(p.x-centroids[0].x)**2+(p.y-centroids[0].y)**2, d1=(p.x-centroids[1].x)**2+(p.y-centroids[1].y)**2, k=d0<d1?0:1;
    sums[k].sx+=p.x; sums[k].sy+=p.y; sums[k].n++;
  }
  const lr = .14;
  centroids.forEach((m,i)=>{ if(sums[i].n){ m.x += lr*(sums[i].sx/sums[i].n - m.x); m.y += lr*(sums[i].sy/sums[i].n - m.y); } });
}
function flashDock(delta){
  if(!dockLoss) return;
  dockHold = frame + 90;
  dockLoss.textContent = `epoch ${epoch} · Δloss ${delta>=0?'+':''}${delta.toFixed(4)} · mlp ${(mlpAcc()*100).toFixed(0)}%`;
  dockLoss.classList.remove('flash'); void dockLoss.offsetWidth; dockLoss.classList.add('flash');
}
function trainStep(){
  if(!hasMlDom) return;
  let dwx=0,dwy=0,db=0;
  for(const p of points){ const err = model(p)-p.label; dwx += err*p.x; dwy += err*p.y; db += err; }
  const lr = .6;
  w.x -= lr*dwx/points.length; w.y -= lr*dwy/points.length; b -= lr*db/points.length;
  linStep(); kmeansStep(); mlpStep();
  epoch++;
  const m = metrics(); path.push({x:w.x,y:w.y,loss:m.loss}); if(path.length>260) path.shift();
  drawAll();
}
const mapX = x => plane ? plane.width*(.5 + x/5.2) : 0;
const mapY = y => plane ? plane.height*(.5 - y/4.0) : 0;
function drawPlane(){
  if(!ctx) return;
  ctx.clearRect(0,0,plane.width,plane.height);
  const grd = ctx.createRadialGradient(plane.width*.55,plane.height*.34,20,plane.width*.55,plane.height*.34,plane.width*.75);
  grd.addColorStop(0,'rgba(143,77,255,.16)');grd.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = '#05030b'; ctx.fillRect(0,0,plane.width,plane.height); ctx.fillStyle = grd; ctx.fillRect(0,0,plane.width,plane.height);
  for(let x=0;x<plane.width;x+=20){ for(let y=0;y<plane.height;y+=20){ const px=(x/plane.width-.5)*5.2, py=(.5-y/plane.height)*4.0, v=sigmoid(w.x*px+w.y*py+b); ctx.fillStyle = v>.5 ? `rgba(143,77,255,${.04+.11*v})` : `rgba(91,214,255,${.04+.11*(1-v)})`; ctx.fillRect(x,y,20,20); }}
  drawGrid(ctx, plane.width, plane.height, 64);
  const x1=-2.6,x2=2.6,y1=-(w.x*x1+b)/(w.y || 1e-6),y2=-(w.x*x2+b)/(w.y || 1e-6);
  ctx.strokeStyle='rgba(247,239,255,.92)'; ctx.lineWidth=4; ctx.shadowColor='rgba(202,169,255,.8)'; ctx.shadowBlur=18; ctx.beginPath(); ctx.moveTo(mapX(x1),mapY(y1)); ctx.lineTo(mapX(x2),mapY(y2)); ctx.stroke(); ctx.shadowBlur=0;
  for(const p of points){ const pred = model(p), wrong = (pred>.5)!==!!p.label, pulse = (Math.sin(frame*.045 + p.x*4 + p.y*3)+1)*.5; ctx.beginPath(); ctx.arc(mapX(p.x),mapY(p.y), (wrong?8:6)+pulse*1.2,0,Math.PI*2); ctx.fillStyle = p.label ? '#a673ff' : '#8fdcff'; ctx.fill(); ctx.strokeStyle = wrong ? '#ff6b9a' : 'rgba(255,255,255,.72)'; ctx.lineWidth= wrong?2.5:1.2; ctx.stroke(); }
  const m=metrics(); lossValue.textContent=m.loss.toFixed(3); accValue.textContent=Math.round(m.acc*100)+'%'; epochValue.textContent=epoch;
  if(dockEpoch) dockEpoch.textContent = `epoch ${epoch}`;
  if(frame > dockHold){
    if(dockLoss) dockLoss.textContent = `loss ${m.loss.toFixed(3)}`;
    if(dockAcc) dockAcc.textContent = `line ${Math.round(m.acc*100)}% · mlp ${Math.round(mlpAcc()*100)}%`;
  }
}
function lossAt(wx,wy){ let sum=0; for(const p of points){const y=sigmoid(wx*p.x+wy*p.y+b); sum += -(p.label*Math.log(y+1e-8)+(1-p.label)*Math.log(1-y+1e-8));} return sum/points.length; }
function drawLoss(){
  if(!lctx) return;
  const W=lossCanvas.width,H=lossCanvas.height;
  lctx.clearRect(0,0,W,H); lctx.fillStyle='#05030b'; lctx.fillRect(0,0,W,H);
  drawGrid(lctx,W,H,60);
  const m=metrics();
  const history=path.length?path.map(p=>p.loss):[m.loss];
  const maxL=Math.max(.9,...history)*1.12, minL=Math.max(0,Math.min(...history)*.82);
  const left=90,right=W-54,top=70,bottom=H-90;
  lctx.fillStyle='rgba(244,234,255,.72)'; lctx.font='900 17px ui-monospace,Menlo,monospace'; lctx.fillText('loss curve: every dot is one training step',left,38);
  lctx.fillStyle='rgba(255,207,122,.95)'; lctx.font='900 46px ui-monospace,Menlo,monospace'; lctx.fillText(m.loss.toFixed(3),W-250,58);
  lctx.fillStyle='rgba(244,234,255,.42)'; lctx.font='800 12px ui-monospace,Menlo,monospace'; lctx.fillText('current L',W-250,82);
  const xAt=i=>left+(right-left)*(history.length<=1?0:i/(history.length-1));
  const yAt=v=>bottom-(bottom-top)*((v-minL)/(maxL-minL||1));
  lctx.strokeStyle='rgba(244,234,255,.22)'; lctx.lineWidth=2; lctx.beginPath(); lctx.moveTo(left,top); lctx.lineTo(left,bottom); lctx.lineTo(right,bottom); lctx.stroke();
  for(let i=0;i<=4;i++){const y=top+(bottom-top)*i/4, val=maxL-(maxL-minL)*i/4; lctx.strokeStyle='rgba(255,255,255,.07)';lctx.beginPath();lctx.moveTo(left,y);lctx.lineTo(right,y);lctx.stroke(); lctx.fillStyle='rgba(244,234,255,.45)';lctx.font='700 12px ui-monospace,Menlo,monospace';lctx.fillText(val.toFixed(2),22,y+4);}
  const grad=lctx.createLinearGradient(left,0,right,0); grad.addColorStop(0,'rgba(143,220,255,.88)'); grad.addColorStop(1,'rgba(255,207,122,.96)');
  lctx.strokeStyle=grad; lctx.lineWidth=5; lctx.shadowColor='rgba(255,207,122,.35)'; lctx.shadowBlur=16; lctx.beginPath(); history.forEach((v,i)=>{const x=xAt(i),y=yAt(v); if(i)lctx.lineTo(x,y); else lctx.moveTo(x,y);}); lctx.stroke(); lctx.shadowBlur=0;
  history.filter((_,i)=>i%Math.max(1,Math.floor(history.length/24))===0).forEach((v,ii)=>{const i=ii*Math.max(1,Math.floor(history.length/24)); lctx.fillStyle='rgba(166,115,255,.72)'; lctx.beginPath(); lctx.arc(xAt(i),yAt(history[i]),4,0,Math.PI*2); lctx.fill();});
  const curX=xAt(history.length-1), curY=yAt(history[history.length-1]); lctx.fillStyle='#ffcf7a'; lctx.strokeStyle='rgba(255,207,122,.35)'; lctx.lineWidth=18+Math.sin(frame*.06)*3; lctx.beginPath(); lctx.arc(curX,curY,12,0,Math.PI*2); lctx.stroke(); lctx.beginPath(); lctx.arc(curX,curY,10,0,Math.PI*2); lctx.fill();
  lctx.fillStyle='rgba(244,234,255,.68)'; lctx.font='800 14px ui-monospace,Menlo,monospace'; lctx.fillText('updates →',right-110,bottom+42); lctx.save(); lctx.translate(left-56,top+120); lctx.rotate(-Math.PI/2); lctx.fillText('mistake / loss',0,0); lctx.restore();
}
function drawNetwork(){
  const svg=document.getElementById('networkSvg'); if(!svg) return; svg.innerHTML='';
  const ins = [{x:130,y:160},{x:130,y:260}];
  const hid = Array.from({length:6},(_,i)=>({x:450,y:70+i*56}));
  const out = [{x:760,y:210}];
  const Wmax = 2.2;
  const wEdge = (a,c2,wv) => {
    const l=document.createElementNS('http://www.w3.org/2000/svg','line');
    const a2=Math.min(1,Math.abs(wv)/Wmax);
    l.setAttribute('x1',a.x); l.setAttribute('y1',a.y); l.setAttribute('x2',c2.x); l.setAttribute('y2',c2.y);
    l.setAttribute('stroke', wv>=0 ? `rgba(255,207,122,${.12+a2*.75})` : `rgba(143,220,255,${.12+a2*.75})`);
    l.setAttribute('stroke-width',(1+a2*5).toFixed(1));
    svg.appendChild(l);
  };
  if(mlp){ hid.forEach((h,i)=>{ ins.forEach((a,j)=>wEdge(a,h,mlp.W1[i][j])); wEdge(h,out[0],mlp.W2[i]); }); }
  [...ins,...hid,...out].forEach((n,i)=>node(svg,n,(i+Math.floor(epoch/3))%7===0));
  const forward=((epoch*.28+frame*.12)%100)/100, backward=1-forward;
  const pulse=document.createElementNS('http://www.w3.org/2000/svg','circle'); pulse.setAttribute('class','pulse'); pulse.setAttribute('cx',130 + forward*(760-130)); pulse.setAttribute('cy',210 + Math.sin(forward*Math.PI*2)*42); pulse.setAttribute('r',7); svg.appendChild(pulse);
  const back=document.createElementNS('http://www.w3.org/2000/svg','circle'); back.setAttribute('class','backpulse'); back.setAttribute('cx',130 + backward*(760-130)); back.setAttribute('cy',246 + Math.cos(backward*Math.PI*2)*35); back.setAttribute('r',6); svg.appendChild(back);
  label(svg,110,55,'input x, y'); label(svg,415,55,'6 live tanh bends'); label(svg,715,55,'p(violet)');
  label(svg,110,398,'edges = real trained weights · width ∝ |w| · gold + / blue −');
}
function edge(svg,a,b){const l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('class',((a.ni+b.ni+Math.floor(epoch/8))%7===0)?'edge hot':'edge');l.setAttribute('x1',a.x);l.setAttribute('y1',a.y);l.setAttribute('x2',b.x);l.setAttribute('y2',b.y);svg.appendChild(l)}
function node(svg,n,hot){const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('class',hot?'node hot':'node');c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);c.setAttribute('r',28);svg.appendChild(c)}
function label(svg,x,y,text){const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('fill','rgba(244,234,255,.62)');t.setAttribute('font-size','14');t.setAttribute('font-family','ui-monospace, Menlo, monospace');t.setAttribute('font-weight','800');t.textContent=text;svg.appendChild(t)}
function drawGrid(context,W,H,step){ context.strokeStyle='rgba(255,255,255,.065)'; context.lineWidth=1; for(let x=0;x<W;x+=step){context.beginPath();context.moveTo(x,0);context.lineTo(x,H);context.stroke();} for(let y=0;y<H;y+=step){context.beginPath();context.moveTo(0,y);context.lineTo(W,y);context.stroke();} }
function gxFactory(W){return x=>W*(.5+x/5.2)} function gyFactory(H){return y=>H*(.52-y/3.8)}
function drawPoint(context,x,y,color,r=7){context.fillStyle=color;context.beginPath();context.arc(x,y,r,0,Math.PI*2);context.fill();context.strokeStyle='rgba(255,255,255,.65)';context.lineWidth=1.2;context.stroke();}
function drawCompare(){
  if(!cctx) return;
  cctx.clearRect(0,0,compareCanvas.width,compareCanvas.height); cctx.fillStyle='#05030b'; cctx.fillRect(0,0,compareCanvas.width,compareCanvas.height);
  const W=compareCanvas.width,H=compareCanvas.height,gx=gxFactory(W),gy=gyFactory(H); drawGrid(cctx,W,H,56);
  if(compareMode==='cluster') drawCluster(gx,gy); else if(compareMode==='linear') drawLinear(gx,gy); else if(compareMode==='logistic') drawLogistic(gx,gy,W,H); else drawMlp(gx,gy,W,H);
  const [title,formula,text]=compareInfo[compareMode]; mathTitle.textContent=title; mathFormula.textContent=formula; mathText.textContent=text;
  const [sTitle,sText]=stepCopy[stepIndex]; stepCount.textContent=`${stepIndex+1} / ${stepCopy.length}`; stepTitle.textContent=sTitle; stepText.textContent=sText;
}
function drawCluster(gx,gy){
  const assign = p => ((p.x-centroids[0].x)**2+(p.y-centroids[0].y)**2) < ((p.x-centroids[1].x)**2+(p.y-centroids[1].y)**2) ? 0 : 1;
  centroids.forEach((m,mi)=>{
    if(stepIndex>0){
      const members = points.filter(p=>assign(p)===mi);
      const spread = members.length ? Math.sqrt(members.reduce((s,p)=>s+(p.x-m.x)**2+(p.y-m.y)**2,0)/members.length) : 0;
      cctx.strokeStyle=m.c; cctx.lineWidth=2; cctx.setLineDash([10,12]);
      cctx.beginPath(); cctx.arc(gx(m.x),gy(m.y),Math.max(24,spread*(compareCanvas.width/5.2)),0,Math.PI*2); cctx.stroke(); cctx.setLineDash([]);
    }
    if(stepIndex>1){ cctx.fillStyle=m.c; cctx.beginPath(); cctx.arc(gx(m.x),gy(m.y),15,0,Math.PI*2); cctx.fill(); cctx.strokeStyle='rgba(255,255,255,.85)'; cctx.lineWidth=2; cctx.stroke(); }
  });
  points.forEach(p=>{ const col = stepIndex>0 ? centroids[assign(p)].c : 'rgba(244,234,255,.75)'; drawPoint(cctx,gx(p.x),gy(p.y),col,7); });
}
function drawLinear(gx,gy){
  const sample = points.slice(0,42).map((p,i)=>({x:p.x, y:p.x*.78 + (p.label? .85:-.65) + Math.sin(i*1.7)*.26, label:p.label}));
  const fit = x => linW*x + linB;
  if(stepIndex>0){ cctx.strokeStyle='rgba(255,207,122,.96)'; cctx.lineWidth=5; cctx.shadowColor='rgba(255,207,122,.4)'; cctx.shadowBlur=10; cctx.beginPath(); cctx.moveTo(gx(-2.7),gy(fit(-2.7))); cctx.lineTo(gx(2.7),gy(fit(2.7))); cctx.stroke(); cctx.shadowBlur=0; }
  sample.forEach(p=>{ const x=gx(p.x), y=gy(p.y), yh=gy(fit(p.x)); if(stepIndex>1){ cctx.strokeStyle='rgba(255,207,122,.5)'; cctx.lineWidth=2; cctx.beginPath(); cctx.moveTo(x,y); cctx.lineTo(x,yh); cctx.stroke(); } drawPoint(cctx,x,y,p.label?'#a673ff':'#8fdcff',8); });
  cctx.fillStyle='rgba(244,234,255,.72)'; cctx.font='800 17px ui-monospace,Menlo,monospace'; cctx.fillText(`ŷ = ${linW.toFixed(2)}x + ${linB.toFixed(2)}   (trained live — gold bars are the current residuals)`,32,58);
}
function drawLogistic(gx,gy,W,H){
  if(stepIndex>0){ for(let x=0;x<W;x+=22){for(let y=0;y<H;y+=22){const px=(x/W-.5)*5.2,py=(.52-y/H)*3.8,v=sigmoid(w.x*px+w.y*py+b); cctx.fillStyle=v>.5?`rgba(143,77,255,${.04+.12*v})`:`rgba(143,220,255,${.04+.12*(1-v)})`; cctx.fillRect(x,y,22,22)}} }
  points.forEach(p=>{const pred=model(p), wrong=(pred>.5)!==!!p.label; drawPoint(cctx,gx(p.x),gy(p.y),p.label?'#a673ff':'#8fdcff',wrong&&stepIndex>1?9:7); if(wrong&&stepIndex>1){cctx.strokeStyle='#ff6b9a';cctx.lineWidth=3;cctx.beginPath();cctx.arc(gx(p.x),gy(p.y),13,0,Math.PI*2);cctx.stroke();}});
  if(stepIndex>0){cctx.strokeStyle='rgba(255,255,255,.92)';cctx.lineWidth=5;cctx.beginPath();cctx.moveTo(gx(-2.6),gy(-(w.x*-2.6+b)/(w.y||1e-6)));cctx.lineTo(gx(2.6),gy(-(w.x*2.6+b)/(w.y||1e-6)));cctx.stroke();}
}
function drawMlp(gx,gy,W,H){
  if(stepIndex>0){
    for(let x=0;x<W;x+=20){for(let y=0;y<H;y+=20){
      const px=(x/W-.5)*5.2, py=(.52-y/H)*3.8, v=mlpFwd(px,py).o;
      cctx.fillStyle = v>.5 ? `rgba(166,115,255,${.05+.15*v})` : `rgba(143,220,255,${.05+.13*(1-v)})`;
      cctx.fillRect(x,y,20,20);
      if(Math.abs(v-.5)<.055){ cctx.fillStyle='rgba(255,255,255,.75)'; cctx.fillRect(x+7,y+7,6,6); }
    }}
  }
  points.forEach(p=>{
    const pred = mlpFwd(p.x,p.y).o>.5?1:0, wrong = pred!==p.label;
    drawPoint(cctx,gx(p.x),gy(p.y),p.label?'#a673ff':'#8fdcff',wrong&&stepIndex>1?9:7);
    if(wrong&&stepIndex>1){ cctx.strokeStyle='#ff6b9a'; cctx.lineWidth=3; cctx.beginPath(); cctx.arc(gx(p.x),gy(p.y),13,0,Math.PI*2); cctx.stroke(); }
  });
  cctx.fillStyle='rgba(244,234,255,.72)'; cctx.font='800 17px ui-monospace,Menlo,monospace';
  cctx.fillText(`live 2→6→1 forward passes · net accuracy ${(mlpAcc()*100).toFixed(0)}%`,32,58);
}
function drawAll(){drawPlane();drawLoss();drawNetwork();drawCompare();}
function loop(){ frame++; if(running){ const steps = speed ? Math.max(1, Number(speed.value)) : 1; if(frame % 2 === 0){ for(let i=0;i<steps;i++) trainStep(); } else drawAll(); } else { drawAll(); } requestAnimationFrame(loop); }
if(trainBtn) trainBtn.onclick=()=>{running=!running;trainBtn.textContent=running?'pause realtime':'resume realtime'};
if(stepBtn) stepBtn.onclick=()=>{ running=false; if(trainBtn)trainBtn.textContent='resume realtime'; const before=metrics().loss; trainStep(); flashDock(metrics().loss-before); };
if(resetBtn) resetBtn.onclick=()=>reset();
if(prevScene) prevScene.onclick=()=>{stepIndex=(stepIndex+stepCopy.length-1)%stepCopy.length; drawCompare();};
if(nextScene) nextScene.onclick=()=>{stepIndex=(stepIndex+1)%stepCopy.length; drawCompare();};
tabs.forEach(tab=>tab.onclick=()=>{compareMode=tab.dataset.mode||compareMode;tabs.forEach(t=>t.classList.toggle('active',t===tab)); stepIndex=0; drawCompare();});

function initXorHero(){
  const cv=document.getElementById('xorCanvas'); if(!cv) return;
  const x=cv.getContext('2d'), W=cv.width, H=cv.height;
  // XOR points: same-colored pairs sit diagonally — no single line can split them
  const pts=[]; let seed=11; const rnd=()=>((seed=(seed*16807)%2147483647)-1)/2147483646;
  [[-1,-1,0],[1,1,0],[-1,1,1],[1,-1,1]].forEach(([cx,cy,l])=>{ for(let i=0;i<9;i++) pts.push({x:cx*.52+(rnd()-.5)*.5, y:cy*.55+(rnd()-.5)*.5, l}); });
  const mx=v=>W*(.5+v/2.6), my=v=>H*(.5-v/2.4);
  let t=0;
  (function render(){
    t+=.016; x.clearRect(0,0,W,H); x.fillStyle='#05030b'; x.fillRect(0,0,W,H);
    x.strokeStyle='rgba(255,255,255,.06)'; for(let g=0;g<W;g+=40){x.beginPath();x.moveTo(g,0);x.lineTo(g,H);x.stroke();} for(let g=0;g<H;g+=40){x.beginPath();x.moveTo(0,g);x.lineTo(W,g);x.stroke();}
    // the desperate line: sweeps every angle, best-case accuracy stays ~50%
    const bestA=-.35+.55*Math.sin(t*.9), ang=t*.5, wx=Math.cos(ang), wy=Math.sin(ang);
    let correct=0; pts.forEach(p=>{const pred=sigmoid((wx*p.x+wy*p.y+bestA)*4)>.5?1:0; if(pred===p.l)correct++;});
    const acc=Math.max(correct, pts.length-correct)/pts.length; // a line can also be flipped — same failure
    const nx=-wy, ny=wx; x.strokeStyle='rgba(255,107,154,.9)'; x.lineWidth=3.5; x.shadowColor='rgba(255,107,154,.55)'; x.shadowBlur=14;
    x.beginPath(); x.moveTo(mx(-bestA*wx-nx*2),my(-bestA*wy-ny*2)); x.lineTo(mx(-bestA*wx+nx*2),my(-bestA*wy+ny*2)); x.stroke(); x.shadowBlur=0;
    pts.forEach(p=>{const pred=sigmoid((wx*p.x+wy*p.y+bestA)*4)>.5?1:0, wrong=(pred!==p.l && Math.abs(pred-p.l)===1);
      x.beginPath(); x.arc(mx(p.x),my(p.y),6,0,Math.PI*2); x.fillStyle=p.l?'#a673ff':'#8fdcff'; x.fill();
      x.strokeStyle=wrong?'rgba(255,107,154,.95)':'rgba(255,255,255,.5)'; x.lineWidth=wrong?2.4:1; x.stroke();});
    x.fillStyle='rgba(255,207,122,.95)'; x.font='900 30px ui-monospace,Menlo,monospace'; x.fillText((acc*100).toFixed(0)+'%',W-96,44);
    x.fillStyle='rgba(244,234,255,.45)'; x.font='800 11px ui-monospace,Menlo,monospace'; x.fillText('best linear accuracy',W-190,44);
    x.fillText('line sweeping all angles — still stuck at coin-flip',24,H-20);
    requestAnimationFrame(render);
  })();
}

function initScryxShell(){
  const orb=document.getElementById('cursor-orb'), pct=document.getElementById('scroll-percent');
  window.addEventListener('pointermove',e=>{ if(!orb) return; document.documentElement.style.setProperty('--mx',`${e.clientX}px`); document.documentElement.style.setProperty('--my',`${e.clientY}px`); orb.style.transform=`translate(${e.clientX}px,${e.clientY}px)`; },{passive:true});
  const updateScroll=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight); if(pct)pct.textContent=String(Math.round(scrollY/max*100)).padStart(2,'0')}; window.addEventListener('scroll',updateScroll,{passive:true}); updateScroll();
  const field=document.getElementById('field-canvas'), spark=document.getElementById('spark-canvas'), fctx=field?.getContext('2d'), sctx=spark?.getContext('2d'); if(!fctx || !sctx) return;
  let W=0,H=0,dpr=1,t=0; const nodes=Array.from({length:54},(_,i)=>({x:(i*97)%1000/1000,y:(i*193)%1000/1000,r:.8+((i*37)%100)/100*1.8,p:i*.7}));
  const resize=()=>{dpr=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;[field,spark].forEach(c=>{c.width=W*dpr;c.height=H*dpr;c.style.width=W+'px';c.style.height=H+'px'});fctx.setTransform(dpr,0,0,dpr,0,0);sctx.setTransform(dpr,0,0,dpr,0,0)}; window.addEventListener('resize',resize);resize();
  const render=()=>{t+=.004;fctx.clearRect(0,0,W,H);sctx.clearRect(0,0,W,H); const g=fctx.createRadialGradient(W*.68,H*.18,20,W*.68,H*.18,Math.max(W,H)*.78);g.addColorStop(0,'rgba(166,115,255,.18)');g.addColorStop(.45,'rgba(45,30,80,.12)');g.addColorStop(1,'rgba(0,0,0,0)');fctx.fillStyle=g;fctx.fillRect(0,0,W,H); for(let i=0;i<nodes.length;i++){const n=nodes[i],x=n.x*W+Math.sin(t*2+n.p)*28,y=n.y*H+Math.cos(t*1.7+n.p)*22; sctx.fillStyle=i%7===0?'rgba(255,207,122,.65)':'rgba(202,169,255,.42)';sctx.beginPath();sctx.arc(x,y,n.r,0,Math.PI*2);sctx.fill(); for(let j=i+1;j<nodes.length;j+=9){const m=nodes[j],x2=m.x*W+Math.sin(t*2+m.p)*28,y2=m.y*H+Math.cos(t*1.7+m.p)*22,dist=Math.hypot(x-x2,y-y2);if(dist<170){sctx.strokeStyle=`rgba(202,169,255,${(1-dist/170)*.16})`;sctx.lineWidth=1;sctx.beginPath();sctx.moveTo(x,y);sctx.lineTo(x2,y2);sctx.stroke();}}} requestAnimationFrame(render);}; render();
}
initScryxShell(); initXorHero();
if(hasMlDom){ reset(); loop(); }
else { [trainBtn,stepBtn,resetBtn].forEach(btn=>{ if(btn){ btn.disabled = true; btn.style.opacity = .4; btn.style.cursor = 'not-allowed'; } }); }
