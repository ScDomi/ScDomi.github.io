/* scryx / deep learning visualizer — real math, no scripted animations */
(function(){
const tanh = Math.tanh;
const sig = z => 1/(1+Math.exp(-z));
let paused = false;
const dlPauseBtn = document.getElementById('dlPauseBtn');
if(dlPauseBtn) dlPauseBtn.onclick = () => { paused = !paused; dlPauseBtn.textContent = paused ? 'resume training' : 'pause training'; };
function drawGridInto(c,W,H,step){ c.strokeStyle='rgba(255,255,255,.065)'; c.lineWidth=1; for(let x=0;x<W;x+=step){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();} for(let y=0;y<H;y+=step){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();} }
const mono = (s,w)=>`${w||800} ${s}px ui-monospace,Menlo,monospace`;

/* ---------- chapter 00: real 2-2-1 backprop on XOR ---------- */
function initDlXor(){
  const cv=document.getElementById('dlXorCanvas'); if(!cv) return;
  const c=cv.getContext('2d'), W=cv.width, H=cv.height;
  const epEl=document.getElementById('dlXorEpoch'), lossEl=document.getElementById('dlXorLoss');
  const X=[[-1,-1],[1,1],[-1,1],[1,-1]], Y=[0,0,1,1];
  // extra jittered samples around the four corners for a denser picture
  let seed=5; const rnd=()=>((seed=(seed*16807)%2147483647)-1)/2147483646;
  const PX=[],PY=[];
  for(let k=0;k<4;k++) for(let i=0;i<24;i++){ PX.push([X[k][0]*.62+(rnd()-.5)*.42, X[k][1]*.62+(rnd()-.5)*.42]); PY.push(Y[k]); }
  let W1=[[rnd()-.5,rnd()-.5],[rnd()-.5,rnd()-.5]].map(r=>r.map(v=>v*1.6)),
      B1=[rnd()-.5,rnd()-.5], W2=[rnd()-.5,rnd()-.5].map(v=>v*1.6), B2=rnd()-.5;
  let epoch=0, lossHist=[], lastLoss=null;
  const dockXor=document.getElementById('dlDockState');
  function forward(x,y){
    const h0=tanh(W1[0][0]*x+W1[0][1]*y+B1[0]), h1=tanh(W1[1][0]*x+W1[1][1]*y+B1[1]);
    return {o:sig(W2[0]*h0+W2[1]*h1+B2), h0, h1};
  }
  function step(){
    const lr=.5, n=PX.length;
    let gW1=[[0,0],[0,0]], gB1=[0,0], gW2=[0,0], gB2=0, loss=0;
    for(let i=0;i<n;i++){
      const x=PX[i][0], y=PX[i][1], t=PY[i], f=forward(x,y), err=f.o-t;
      loss+=-(t*Math.log(f.o+1e-9)+(1-t)*Math.log(1-f.o+1e-9));
      gW2[0]+=err*f.h0; gW2[1]+=err*f.h1; gB2+=err;
      const d0=err*W2[0]*(1-f.h0*f.h0), d1=err*W2[1]*(1-f.h1*f.h1);
      gW1[0][0]+=d0*x; gW1[0][1]+=d0*y; gB1[0]+=d0;
      gW1[1][0]+=d1*x; gW1[1][1]+=d1*y; gB1[1]+=d1;
    }
    W2[0]-=lr*gW2[0]/n; W2[1]-=lr*gW2[1]/n; B2-=lr*gB2/n;
    W1[0][0]-=lr*gW1[0][0]/n; W1[0][1]-=lr*gW1[0][1]/n; B1[0]-=lr*gB1[0]/n;
    W1[1][0]-=lr*gW1[1][0]/n; W1[1][1]-=lr*gW1[1][1]/n; B1[1]-=lr*gB1[1]/n;
    epoch++; const l=loss/n; lossHist.push(l); if(lossHist.length>320) lossHist.shift();
    return l;
  }
  const mx=v=>W*(.5+v/2.5), my=v=>H*(.52-v/2.3);
  function draw(loss){
    c.clearRect(0,0,W,H); c.fillStyle='#05030b'; c.fillRect(0,0,W,H);
    // probability field
    const cell=16;
    for(let px=0;px<W;px+=cell) for(let py=0;py<H*.72;py+=cell){
      const x=(px/W-.5)*2.5, y=(.52-py/H)*2.3, v=forward(x,y).o;
      c.fillStyle=v>.5?`rgba(166,115,255,${.05+.16*v})`:`rgba(143,220,255,${.05+.14*(1-v)})`;
      c.fillRect(px,py,cell,cell);
    }
    drawGridInto(c,W,H,64);
    // uncertainty contour: |o-.5| minimal per column
    c.strokeStyle='rgba(255,255,255,.92)'; c.lineWidth=3.5; c.shadowColor='rgba(255,255,255,.5)'; c.shadowBlur=10; c.beginPath();
    let first=true;
    for(let ix=0;ix<=180;ix++){
      const x=-1.25+ix/180*2.5; let bestY=null,best=9;
      for(let iy=0;iy<=120;iy++){ const y=-1.15+iy/120*2.3, a=Math.abs(forward(x,y).o-.5); if(a<best){best=a;bestY=y;} }
      if(bestY!==null&&best<.13){ if(first){c.moveTo(mx(x),my(bestY));first=false;} else c.lineTo(mx(x),my(bestY)); }
    }
    c.stroke(); c.shadowBlur=0;
    // data points
    for(let i=0;i<PX.length;i++){
      const x=PX[i][0],y=PX[i][1],p=forward(x,y).o,wrong=(p>.5?1:0)!==PY[i];
      c.beginPath(); c.arc(mx(x),my(y),5,0,Math.PI*2);
      c.fillStyle=PY[i]?'#a673ff':'#8fdcff'; c.fill();
      c.strokeStyle=wrong?'rgba(255,107,154,.95)':'rgba(255,255,255,.45)'; c.lineWidth=wrong?2:1; c.stroke();
    }
    // mini loss curve, bottom strip
    const top=H-118, bot=H-28, left=64, right=W-64;
    c.strokeStyle='rgba(244,234,255,.22)'; c.lineWidth=1.5; c.beginPath(); c.moveTo(left,top); c.lineTo(left,bot); c.lineTo(right,bot); c.stroke();
    if(lossHist.length>1){
      const maxL=Math.max(...lossHist)*1.1;
      const g=c.createLinearGradient(left,0,right,0); g.addColorStop(0,'rgba(143,220,255,.9)'); g.addColorStop(1,'rgba(255,207,122,.95)');
      c.strokeStyle=g; c.lineWidth=3; c.beginPath();
      lossHist.forEach((v,i)=>{ const x=left+(right-left)*i/(lossHist.length-1), y=bot-(bot-top)*(v/maxL); i?c.lineTo(x,y):c.moveTo(x,y); });
      c.stroke();
    }
    c.fillStyle='rgba(244,234,255,.55)'; c.font=mono(12); c.fillText('loss ↓ (live, real backprop)',left,H-8);
  }
  function frame(){
    if(!paused){
      const l=step(); lastLoss=l;
      if(epoch%3===0){
        draw(l);
        if(epEl)epEl.textContent=`epoch ${epoch}`;
        if(lossEl)lossEl.textContent=`loss: ${l.toFixed(4)}${l<.05?'  // solved':l<.25?'  // folding…':'  // still stuck'}`;
        if(dockXor)dockXor.textContent=`xor epoch ${epoch} · loss ${l.toFixed(3)}`;
      }
    }
    requestAnimationFrame(frame);
  }
  frame();
}

/* ---------- chapter 01: activation + gradient ---------- */
function initActivation(){
  const cv=document.getElementById('actCanvas'); if(!cv) return;
  const c=cv.getContext('2d'), W=cv.width, H=cv.height;
  const gradEl=document.getElementById('actGrad'), deadEl=document.getElementById('actDead');
  const fns={
    relu:{f:z=>Math.max(0,z), d:z=>z>0?1:0, max:'1.0', dead:'z < 0 → gradient 0 (half the real line)', note:'chops, cheap, dominant'},
    sigmoid:{f:sig, d:z=>sig(z)*(1-sig(z)), max:'0.25', dead:'|z| > 4 → gradient ≈ 0 (both tails)', note:'squishes to (0,1), kills gradients'},
    tanh:{f:tanh, d:z=>1-tanh(z)**2, max:'1.0', dead:'|z| > 3 → gradient ≈ 0 (both tails)', note:'symmetric squash, still saturates'}
  };
  let mode='relu', t=0;
  const tabs=[...document.querySelectorAll('.tab[data-act]')];
  tabs.forEach(tb=>tb.onclick=()=>{mode=tb.dataset.act; tabs.forEach(o=>o.classList.toggle('active',o===tb));});
  const px=v=>W*(.5+v/8), py=v=>H*(.55-v/2.6);
  function draw(){
    t+=.02; const {f,d,max,dead,note}=fns[mode];
    c.clearRect(0,0,W,H); c.fillStyle='#05030b'; c.fillRect(0,0,W,H); drawGridInto(c,W,H,56);
    c.strokeStyle='rgba(244,234,255,.3)'; c.lineWidth=1.5;
    c.beginPath(); c.moveTo(0,py(0)); c.lineTo(W,py(0)); c.stroke();
    c.beginPath(); c.moveTo(px(0),0); c.lineTo(px(0),H); c.stroke();
    // gradient (dashed, danger color where it dies)
    c.setLineDash([8,8]); c.lineWidth=3; c.beginPath();
    for(let i=0;i<=240;i++){ const z=-4+i/240*8, x=px(z), y=py(d(z)*1.6); i?c.lineTo(x,y):c.moveTo(x,y); }
    c.strokeStyle='rgba(255,107,154,.85)'; c.stroke(); c.setLineDash([]);
    // function
    c.lineWidth=5; c.shadowColor='rgba(166,115,255,.5)'; c.shadowBlur=12; c.beginPath();
    for(let i=0;i<=240;i++){ const z=-4+i/240*8, x=px(z), y=py(f(z)); i?c.lineTo(x,y):c.moveTo(x,y); }
    const g=c.createLinearGradient(0,0,W,0); g.addColorStop(0,'#8fdcff'); g.addColorStop(1,'#a673ff');
    c.strokeStyle=g; c.stroke(); c.shadowBlur=0;
    // wandering probe point
    const z=Math.sin(t)*3.4, fv=f(z), dv=d(z);
    c.beginPath(); c.arc(px(z),py(fv),9,0,Math.PI*2); c.fillStyle='#ffcf7a'; c.fill();
    c.strokeStyle='rgba(255,207,122,.4)'; c.lineWidth=14; c.stroke();
    c.beginPath(); c.arc(px(z),py(dv*1.6),6,0,Math.PI*2); c.fillStyle='rgba(255,107,154,.9)'; c.fill();
    // dead-zone shading
    c.fillStyle='rgba(255,107,154,.06)';
    if(mode==='relu') c.fillRect(0,0,px(0),H);
    else { c.fillRect(0,0,px(-3.2),H); c.fillRect(px(3.2),0,W-px(3.2),H); }
    c.fillStyle='rgba(244,234,255,.8)'; c.font=mono(16,900); c.fillText(`${mode}  //  ${note}`,28,36);
    c.fillStyle='rgba(255,107,154,.75)'; c.font=mono(12); c.fillText('dashed = gradient ∂/∂z  (scaled ×1.6)',28,H-24);
    if(gradEl)gradEl.textContent=max; if(deadEl)deadEl.textContent=dead;
    requestAnimationFrame(draw);
  }
  draw();
}

/* ---------- chapter 02: convolution walk ---------- */
function initCnn(){
  const cv=document.getElementById('cnnCanvas'); if(!cv) return;
  const c=cv.getContext('2d'), W=cv.width, H=cv.height;
  const N=12, K=3;
  // synthetic image: a diagonal edge + noise
  let seed=3; const rnd=()=>((seed=(seed*16807)%2147483647)-1)/2147483646;
  const img=Array.from({length:N},(_,y)=>Array.from({length:N},(_,x)=>Math.max(0,Math.min(1,(y>x?.85:.12)+rnd()*.14))));
  // Sobel-ish vertical edge kernel
  const kern=[[-1,0,1],[-2,0,2],[-1,0,1]];
  let pos={x:0,y:0}, dir=1, frame=0;
  const out=Array.from({length:N-K+1},()=>Array(N-K+1).fill(null));
  function convAt(cx,cy){ let s=0; for(let ky=0;ky<K;ky++)for(let kx=0;kx<K;kx++) s+=img[cy+ky][cx+kx]*kern[ky][kx]; return s/4; }
  function cellSize(){ return Math.min((W*.42)/N, (H-150)/N); }
  function draw(){
    frame++;
    if(frame%6===0){
      out[pos.y][pos.x]=convAt(pos.x,pos.y);
      pos.x+=dir;
      if(pos.x>N-K){pos.x=N-K; pos.y++; dir=-1;} else if(pos.x<0){pos.x=0; pos.y++; dir=1;}
      if(pos.y>N-K){ pos={x:0,y:0}; for(const r of out) r.fill(null); }
    }
    c.clearRect(0,0,W,H); c.fillStyle='#05030b'; c.fillRect(0,0,W,H); drawGridInto(c,W,H,54);
    const s=cellSize(), ix=40, iy=70;
    // input image
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const v=img[y][x]; c.fillStyle=`rgba(143,220,255,${.08+v*.75})`; c.fillRect(ix+x*s,iy+y*s,s-1,s-1); }
    // kernel window
    c.strokeStyle='#ffcf7a'; c.lineWidth=3; c.shadowColor='rgba(255,207,122,.6)'; c.shadowBlur=10;
    c.strokeRect(ix+pos.x*s,iy+pos.y*s,K*s,K*s); c.shadowBlur=0;
    c.fillStyle='rgba(244,234,255,.8)'; c.font=mono(13,900); c.fillText('input 12×12 (a diagonal edge)',ix,iy-14);
    // kernel values
    const kx0=W*.5, ky0=iy;
    for(let y=0;y<K;y++)for(let x=0;x<K;x++){ const v=kern[y][x];
      c.fillStyle=v>0?'rgba(255,207,122,.85)':v<0?'rgba(255,107,154,.85)':'rgba(244,234,255,.35)';
      c.font=mono(15,900); c.fillText(String(v),kx0+x*44,ky0+y*40); }
    c.fillStyle='rgba(244,234,255,.6)'; c.font=mono(12); c.fillText('3×3 kernel — same weights everywhere',kx0,ky0+K*40+8);
    // feature map
    const ox=W*.5, oy=ky0+K*40+52, os=Math.min(s,(H-oy-90)/(N-K+1));
    for(let y=0;y<=N-K;y++)for(let x=0;x<=N-K;x++){ const v=out[y][x];
      if(v===null){ c.fillStyle='rgba(255,255,255,.04)'; }
      else { const a=Math.min(1,Math.abs(v)); c.fillStyle=v>=0?`rgba(255,207,122,${.12+a*.85})`:`rgba(255,107,154,${.12+a*.85})`; }
      c.fillRect(ox+x*os,oy+y*os,os-1,os-1); }
    c.fillStyle='rgba(244,234,255,.6)'; c.font=mono(12); c.fillText('feature map — fills as the kernel walks',ox,oy+(N-K+1)*os+22);
    const cur=out[pos.y]&&out[pos.y][pos.x];
    c.fillStyle='rgba(255,207,122,.9)'; c.font=mono(14,900);
    c.fillText(`current patch response: ${cur===null||cur===undefined?'…':cur.toFixed(2)}`,40,H-28);
    requestAnimationFrame(draw);
  }
  draw();
}

/* ---------- chapter 03: attention matrix ---------- */
function initAttention(){
  const cv=document.getElementById('attnCanvas'); if(!cv) return;
  const c=cv.getContext('2d'), W=cv.width, H=cv.height;
  const tEl=document.getElementById('attnTitle'), fEl=document.getElementById('attnFormula'), xEl=document.getElementById('attnText');
  const tokens=['the','rule','is','just','a','default','.','fork','it'];
  const n=tokens.length;
  // hand-shaped query/key affinities that read sensibly: verbs↔objects, "it"→"rule"
  const base=[
    [ 2, 1, 0, 0, 1, 1, 0, 0, 0],   // the
    [ 1, 3, 1, 0, 0, 1, 0, 0, 1],   // rule
    [ 0, 2, 2, 0, 0, 1, 1, 0, 0],   // is
    [ 0, 1, 1, 2, 1, 2, 0, 0, 0],   // just
    [ 1, 0, 0, 1, 2, 1, 0, 0, 0],   // a
    [ 0, 2, 1, 1, 1, 3, 1, 0, 1],   // default
    [ 0, 0, 0, 0, 0, 0, 1, 0, 0],   // .
    [ 0, 1, 0, 0, 0, 1, 0, 3, 2],   // fork
    [ 0, 3, 1, 0, 0, 1, 0, 2, 2],   // it
  ];
  const scaled=base.map(r=>r.map(v=>v/Math.sqrt(8)+((v*37)%10)*.05));
  const attn=scaled.map(row=>{ const m=Math.max(...row), e=row.map(v=>Math.exp(v-m)), s=e.reduce((a,b)=>a+b,0); return e.map(v=>v/s); });
  let hover=null;
  cv.addEventListener('pointermove',e=>{
    const r=cv.getBoundingClientRect(), gx=(e.clientX-r.left)/r.width*W, gy=(e.clientY-r.top)/r.height*H;
    const {x0,y0,cs}=gridGeom();
    const cx=Math.floor((gx-x0)/cs)-0, cy=Math.floor((gy-y0)/cs)-0;
    hover=(cx>=0&&cx<n&&cy>=0&&cy<n)?{x:cx,y:cy}:null;
  });
  cv.addEventListener('pointerleave',()=>hover=null);
  function gridGeom(){ const cs=Math.min(64,(W-520)/n); return {x0:(W-cs*n)/2+90, y0:120, cs}; }
  let t=0;
  function draw(){
    t+=.016; c.clearRect(0,0,W,H); c.fillStyle='#05030b'; c.fillRect(0,0,W,H); drawGridInto(c,W,H,64);
    const {x0,y0,cs}=gridGeom();
    c.font=mono(13,900);
    tokens.forEach((tk,i)=>{
      c.fillStyle=hover&&(hover.x===i)?'#ffcf7a':'rgba(244,234,255,.6)';
      c.fillText(tk,x0+i*cs+cs*.1,y0-14);
      c.save(); c.translate(x0-16,y0+i*cs+cs*.62); c.rotate(-0); c.textAlign='end';
      c.fillStyle=hover&&(hover.y===i)?'#ffcf7a':'rgba(244,234,255,.6)';
      c.fillText(tk,0,4); c.restore(); c.textAlign='start';
    });
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const v=attn[y][x], hov=hover&&hover.x===x&&hover.y===y, inRow=hover&&hover.y===y;
      const boost=hov?1:inRow?.75:0;
      c.fillStyle=`rgba(${v>.22?'255,207,122':'166,115,255'},${.06+v*.8+boost*.1})`;
      c.fillRect(x0+x*cs,y0+y*cs,cs-2,cs-2);
      if(hov){ c.strokeStyle='#ffcf7a'; c.lineWidth=3; c.strokeRect(x0+x*cs,y0+y*cs,cs-2,cs-2); }
      if(cs>44&&v>.14){ c.fillStyle=`rgba(5,3,11,${.5+v*.4})`; c.font=mono(11,800); c.fillText(v.toFixed(2),x0+x*cs+5,y0+y*cs+cs*.6); c.font=mono(13,900); }
    }
    const pulse=Math.floor(t*1.4)%n;
    c.strokeStyle='rgba(143,220,255,.35)'; c.lineWidth=1.5;
    c.strokeRect(x0-3,y0+pulse*cs-3,cs*n+6,cs+6);
    c.fillStyle='rgba(244,234,255,.7)'; c.font=mono(13,800);
    c.fillText('row = who listens   /   column = who is heard',x0,y0+n*cs+30);
    if(tEl&&fEl&&xEl){
      if(hover){ const q=tokens[hover.y], k=tokens[hover.x];
        tEl.textContent=`“${q}” attends to “${k}”`;
        fEl.textContent=`raw Q·Kᵀ = ${scaled[hover.y][hover.x].toFixed(2)}  →  softmax weight ${(attn[hover.y][hover.x]*100).toFixed(1)}%`;
        xEl.textContent=`Of everything “${q}” could listen to, “${k}” gets ${(attn[hover.y][hover.x]*100).toFixed(1)}% of its attention budget.`;
      } else {
        tEl.textContent='hover the matrix';
        fEl.textContent='softmax(Q·Kᵀ / √d) · V';
        xEl.textContent='Each cell is how much the row-token listens to the column-token. Raw score first, softmax after — the difference between opinion and attention.';
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ---------- chapter 04: loss landscape, two learning rates ---------- */
function initLandscape(){
  const cv=document.getElementById('landCanvas'); if(!cv) return;
  const c=cv.getContext('2d'), W=cv.width, H=cv.height;
  const sEl=document.getElementById('lrSmallLoss'), bEl=document.getElementById('lrBigLoss');
  // ravine-shaped loss: steep in y, gentle curve in x
  const L=(x,y)=> (x*x)*.18 + (y - Math.sin(x*1.6)*1.2)**2*1.15 + .12*Math.cos(x*3)*Math.sin(y*2);
  const grad=(x,y)=>{ const e=1e-4; return [ (L(x+e,y)-L(x-e,y))/(2*e), (L(x,y+e)-L(x,y-e))/(2*e) ]; };
  let small={x:-2.2,y:1.9,path:[]}, big={x:-2.2,y:1.9,path:[]};
  let frame=0;
  const mx=v=>W*(.5+v/5.4), my=v=>H*(.5-v/4.4);
  function step(){
    [[small,.045],[big,.34]].forEach(([p,lr])=>{
      const [gx,gy]=grad(p.x,p.y); p.x-=lr*gx; p.y-=lr*gy;
      if(Math.abs(p.x)>2.6)p.x=Math.sign(p.x)*2.6; if(Math.abs(p.y)>2.1)p.y=Math.sign(p.y)*2.1;
      p.path.push({x:p.x,y:p.y}); if(p.path.length>220)p.path.shift();
    });
    frame++;
    if(frame>1400){ small={x:-2.2,y:1.9,path:[]}; big={x:-2.2,y:1.9,path:[]}; frame=0; }
  }
  function draw(){
    c.clearRect(0,0,W,H); c.fillStyle='#05030b'; c.fillRect(0,0,W,H);
    // loss heat field
    const cell=14;
    let mn=1e9,mxL=-1e9;
    for(let px=0;px<W;px+=cell)for(let py=0;py<H;py+=cell){ const x=(px/W-.5)*5.4, y=(.5-py/H)*4.4, v=L(x,y); if(v<mn)mn=v; if(v>mxL)mxL=v; }
    for(let px=0;px<W;px+=cell)for(let py=0;py<H;py+=cell){
      const x=(px/W-.5)*5.4, y=(.5-py/H)*4.4, v=(L(x,y)-mn)/(mxL-mn);
      c.fillStyle=`rgba(${Math.round(143+v*112)},${Math.round(220-v*120)},${Math.round(255-v*80)},${.05+v*.3})`;
      c.fillRect(px,py,cell,cell);
    }
    drawGridInto(c,W,H,64);
    // contour rings around the minimum
    c.strokeStyle='rgba(255,255,255,.14)'; c.lineWidth=1;
    for(let r=1;r<=5;r++){ c.beginPath(); c.ellipse(mx(0),my(0),r*54,r*26,0,0,Math.PI*2); c.stroke(); }
    function path(p,color,glow){
      if(p.path.length<2)return;
      c.strokeStyle=color; c.lineWidth=3; c.shadowColor=glow; c.shadowBlur=10; c.beginPath();
      p.path.forEach((q,i)=>{ i?c.lineTo(mx(q.x),my(q.y)):c.moveTo(mx(q.x),my(q.y)); });
      c.stroke(); c.shadowBlur=0;
      const q=p.path[p.path.length-1];
      c.beginPath(); c.arc(mx(q.x),my(q.y),8,0,Math.PI*2); c.fillStyle=color; c.fill();
      c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=2; c.stroke();
    }
    path(small,'#8fdcff','rgba(143,220,255,.5)');
    path(big,'#ffcf7a','rgba(255,207,122,.5)');
    c.fillStyle='rgba(143,220,255,.9)'; c.font=mono(13,900); c.fillText(`● careful η=0.045 → L=${L(small.x,small.y).toFixed(3)}`,28,34);
    c.fillStyle='rgba(255,207,122,.9)'; c.fillText(`● bold η=0.34 → L=${L(big.x,big.y).toFixed(3)}`,28,56);
    c.fillStyle='rgba(244,234,255,.5)'; c.font=mono(12); c.fillText('ravine loss: L(x,y) = 0.18x² + 1.15(y − sin(1.6x)·1.2)² + ripple',28,H-22);
    if(sEl)sEl.textContent=L(small.x,small.y).toFixed(3);
    if(bEl)bEl.textContent=L(big.x,big.y).toFixed(3);
  }
  function loop(){ if(!paused) step(); if(paused || frame%2===0) draw(); requestAnimationFrame(loop); }
  loop();
}

/* ---------- chapter 05: real digit recognizer — linear softmax trained live in this tab ---------- */
function initDigits(){
  const dc=document.getElementById('dlDigitCanvas'), tc=document.getElementById('dlThinkCanvas'), predEl=document.getElementById('dlDigitPrediction');
  const confEl=document.getElementById('dlDigitConfusion'), statusEl=document.getElementById('digStatus'), lossEl=document.getElementById('digLoss'), accEl=document.getElementById('digAcc');
  const clearBtn=document.getElementById('dlClearDigit'), demoBtn=document.getElementById('dlDemoDigit');
  const dockDig=document.getElementById('dlDockDigits'), retrainBtn=document.getElementById('dlRetrainBtn');
  if(!dc||!tc) return;
  const dctx=dc.getContext('2d'), tctx=tc.getContext('2d');
  const N=32, D=N*N, K=10, cell=dc.width/N;
  let pixels=new Float32Array(D), drawing=false, Wt=null, Bt=null, trained=false, training=false;
  const off=document.createElement('canvas'); off.width=off.height=N; const octx=off.getContext('2d');
  function renderGlyph(d, aug){
    octx.clearRect(0,0,N,N); octx.fillStyle='#000'; octx.fillRect(0,0,N,N);
    octx.fillStyle='#fff';
    const size = aug ? 24+Math.random()*6 : 27;
    octx.font=`900 ${size}px ui-monospace, Menlo, monospace`;
    octx.textAlign='center'; octx.textBaseline='middle';
    octx.save(); octx.translate(N/2,N/2);
    if(aug){ octx.rotate((Math.random()-.5)*.3); octx.translate((Math.random()-.5)*4,(Math.random()-.5)*4); }
    octx.fillText(String(d),0,2); octx.restore();
    const data=octx.getImageData(0,0,N,N).data, out=new Float32Array(D);
    for(let i=0;i<D;i++){ let v=data[i*4]/255; if(aug&&Math.random()<.05) v=Math.max(0,v-Math.random()*.5); out[i]=v; }
    return out;
  }
  let trainSet=[], testSet=[];
  function buildSets(){ trainSet=[]; testSet=[]; for(let d=0;d<K;d++){ for(let i=0;i<13;i++) trainSet.push({x:renderGlyph(d,true), y:d}); for(let i=0;i<6;i++) testSet.push({x:renderGlyph(d,true), y:d}); } }
  function softmaxOut(x){ const z=new Array(K); for(let k=0;k<K;k++){ let s=Bt[k]; for(let i=0;i<D;i++) s+=Wt[k][i]*x[i]; z[k]=s; } const m=Math.max(...z), e=z.map(v=>Math.exp(v-m)), sum=e.reduce((a,b)=>a+b,0); return e.map(v=>v/sum); }
  function epoch(){
    const lr=.35, n=trainSet.length;
    const gW=Array.from({length:K},()=>new Float32Array(D)), gB=new Float32Array(K); let loss=0;
    for(const s of trainSet){
      const p=softmaxOut(s.x); loss+=-Math.log(p[s.y]+1e-9);
      for(let k=0;k<K;k++){ const e=p[k]-(k===s.y?1:0); gB[k]+=e; const row=gW[k]; for(let i=0;i<D;i++) if(s.x[i]) row[i]+=e*s.x[i]; }
    }
    for(let k=0;k<K;k++){ Bt[k]-=lr*gB[k]/n; const row=Wt[k], gr=gW[k]; for(let i=0;i<D;i++) row[i]-=lr*gr[i]/n; }
    return loss/n;
  }
  function testAcc(){ let c=0; for(const s of testSet){ const p=softmaxOut(s.x); if(p.indexOf(Math.max(...p))===s.y)c++; } return c/testSet.length; }
  function train(){
    training=true; trained=false; buildSets();
    Wt=Array.from({length:K},()=>new Float32Array(D)); Bt=new Float32Array(K);
    let e=0; const total=80;
    const tick=()=>{
      let l=0; for(let i=0;i<10;i++){ l=epoch(); e++; }
      const msg=`training… ${Math.min(100,Math.round(e/total*100))}% · loss ${l.toFixed(3)}`;
      if(statusEl)statusEl.textContent=msg; if(dockDig)dockDig.textContent=`digits: ${msg}`;
      if(e<total){ setTimeout(tick,0); }
      else{
        training=false; trained=true; const a=testAcc();
        if(statusEl)statusEl.textContent=`trained · ${total} epochs · ready`;
        if(lossEl)lossEl.textContent=l.toFixed(3); if(accEl)accEl.textContent=(a*100).toFixed(0)+'%';
        if(dockDig)dockDig.textContent=`digits: ready · synthetic test ${(a*100).toFixed(0)}%`;
        think();
      }
    };
    tick();
  }
  function drawPad(){
    dctx.fillStyle='#05030b'; dctx.fillRect(0,0,dc.width,dc.height);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const v=pixels[y*N+x]; if(v>.01){ dctx.fillStyle=`rgba(255,207,122,${.06+v*.9})`; dctx.fillRect(x*cell+1,y*cell+1,cell-2,cell-2); } }
    dctx.strokeStyle='rgba(255,255,255,.09)'; dctx.lineWidth=1;
    for(let i=0;i<=N;i++){ dctx.beginPath(); dctx.moveTo(i*cell,0); dctx.lineTo(i*cell,dc.height); dctx.stroke(); dctx.beginPath(); dctx.moveTo(0,i*cell); dctx.lineTo(dc.width,i*cell); dctx.stroke(); }
  }
  function put(e){
    const r=dc.getBoundingClientRect(), fx=(e.clientX-r.left)/r.width*N, fy=(e.clientY-r.top)/r.height*N;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const d=Math.hypot(x+.5-fx,y+.5-fy); if(d<3.2){ const idx=y*N+x; pixels[idx]=Math.min(1,pixels[idx]+.6*Math.exp(-d*d/2.6)); } }
    drawPad(); think();
  }
  dc.addEventListener('pointerdown',e=>{drawing=true;dc.setPointerCapture(e.pointerId);put(e)});
  dc.addEventListener('pointermove',e=>{if(drawing)put(e)});
  dc.addEventListener('pointerup',()=>drawing=false); dc.addEventListener('pointerleave',()=>drawing=false);
  if(clearBtn)clearBtn.onclick=()=>{pixels=new Float32Array(D);drawPad();think()};
  if(demoBtn)demoBtn.onclick=()=>{pixels=renderGlyph(5,false);drawPad();think()};
  function think(){
    if(!trained){ if(predEl)predEl.textContent='…'; return; }
    const p=softmaxOut(pixels), best=p.indexOf(Math.max(...p));
    let hasInk=false; for(let i=0;i<D;i++) if(pixels[i]>.05){hasInk=true;break;}
    if(predEl)predEl.textContent=hasInk?best:'—';
    if(confEl){
      if(!hasInk){ confEl.textContent='draw a digit — a real trained readout layer will judge it'; confEl.classList.remove('hot'); }
      else{
        const order=[...p.keys()].sort((a,b)=>p[b]-p[a]), gap=p[best]-p[order[1]], unsure=gap<.15;
        confEl.textContent=unsure
          ? `torn: ${best} vs ${order[1]} — ${(gap*100).toFixed(0)}pt apart. honest indecision.`
          : `runner-up ${order[1]} at ${(p[order[1]]*100).toFixed(0)}% · margin ${(gap*100).toFixed(0)}pt`;
        confEl.classList.toggle('hot',unsure);
      }
    }
    tctx.clearRect(0,0,tc.width,tc.height); tctx.fillStyle='#05030b'; tctx.fillRect(0,0,tc.width,tc.height); drawGridInto(tctx,tc.width,tc.height,54);
    tctx.fillStyle='rgba(244,234,255,.7)'; tctx.font=mono(14,800);
    tctx.fillText('neural path: your pixels → learned weights → 10 scores → softmax',28,30);
    const cols=5, cw=(tc.width-56)/cols, mapS=Math.min(cw-24,110)/N;
    for(let k=0;k<K;k++){
      const x=28+(k%cols)*cw, y=52+Math.floor(k/cols)*176;
      tctx.fillStyle='rgba(255,255,255,.75)'; tctx.font=mono(18,900); tctx.fillText(String(k),x,y+4);
      for(let i=0;i<D;i++){
        const cc=Wt[k][i]*pixels[i]; if(Math.abs(cc)<.02) continue;
        tctx.fillStyle=cc>0?`rgba(255,207,122,${Math.min(1,Math.abs(cc)*4)})`:`rgba(255,107,154,${Math.min(1,Math.abs(cc)*4)})`;
        tctx.fillRect(x+(i%N)*mapS,y+10+Math.floor(i/N)*mapS,mapS-.4,mapS-.4);
      }
      const barW=Math.min(1,p[k])*92;
      tctx.fillStyle=k===best&&hasInk?'#ffcf7a':'rgba(166,115,255,.55)'; tctx.fillRect(x,y+10+N*mapS+6,barW,8);
      tctx.strokeStyle='rgba(255,255,255,.16)'; tctx.strokeRect(x,y+10+N*mapS+6,92,8);
      tctx.fillStyle='rgba(244,234,255,.6)'; tctx.font=mono(10,700); tctx.fillText(`${(p[k]*100).toFixed(0)}%`,x+98,y+10+N*mapS+14);
    }
    // neural path overlay: strongest pixel->class evidence lines for the winning class
    if(hasInk){
      const ev=[]; for(let i=0;i<D;i++){ const v=Wt[best][i]*pixels[i]; if(v>.05) ev.push([i,v]); }
      ev.sort((a,b)=>b[1]-a[1]);
      const kx=28+(best%cols)*cw, ky=52+Math.floor(best/cols)*176;
      tctx.strokeStyle='rgba(255,207,122,.5)'; tctx.lineWidth=1;
      for(const [i,v] of ev.slice(0,40)){
        const sx=28+((i%N)/N)*dc.width*0+0; // source on pad handled below
      }
      // caption
      tctx.fillStyle='rgba(255,207,122,.85)'; tctx.font=mono(11,800);
      tctx.fillText(`strongest ${ev.length} evidence pixels → class ${best}`,28,tc.height-14);
    }
  }
  drawPad(); train();
  if(retrainBtn) retrainBtn.onclick=()=>{ if(!training) train(); };
}

/* ---------- chapter 06: FlyWire real connectome neuropil matrix ---------- */
function initFlywire(){
  const cv=document.getElementById('flyCanvas'); if(!cv) return;
  const c=cv.getContext('2d'), W=cv.width, H=cv.height;
  const tEl=document.getElementById('flyTitle'), xEl=document.getElementById('flyText');
  const cardT=document.getElementById('flyCardTitle'), cardS=document.getElementById('flyCardStat'), cardX=document.getElementById('flyCardText');
  let data=null, hover=null, maxLog=1;
  fetch('assets/flywire_neuropil.json').then(r=>r.json()).then(d=>{
    data=d;
    const M=d.syn, n=d.regions.length;
    for(let i=0;i<n;i++)for(let j=0;j<n;j++) if(M[i][j]>0) maxLog=Math.max(maxLog, Math.log10(M[i][j]+1));
    draw();
  }).catch(()=>{ if(xEl)xEl.textContent='flywire_neuropil.json failed to load — check assets/'; });
  function geom(){ const n=data?data.regions.length:28; const cs=Math.min((H-190)/n,(W-560)/n); return {x0:(W-cs*n)/2+60, y0:96, cs, n}; }
  cv.addEventListener('pointermove',e=>{
    if(!data) return;
    const r=cv.getBoundingClientRect(), gx=(e.clientX-r.left)/r.width*W, gy=(e.clientY-r.top)/r.height*H;
    const {x0,y0,cs,n}=geom();
    const cx=Math.floor((gx-x0)/cs), cy=Math.floor((gy-y0)/cs);
    const h=(cx>=0&&cx<n&&cy>=0&&cy<n)?{x:cx,y:cy}:null;
    if((h&&h.x)!==(hover&&hover.x)||(h&&h.y)!==(hover&&hover.y)){ hover=h; draw(); }
  });
  cv.addEventListener('pointerleave',()=>{hover=null;draw();});
  function draw(){
    c.clearRect(0,0,W,H); c.fillStyle='#05030b'; c.fillRect(0,0,W,H); drawGridInto(c,W,H,64);
    if(!data){ c.fillStyle='rgba(244,234,255,.6)'; c.font=mono(14,800); c.fillText('loading FlyWire neuropil matrix…',40,H/2); return; }
    const {x0,y0,cs,n}=geom(), M=data.syn, R=data.regions, NT=data.nt;
    // labels
    c.font=mono(11,800);
    for(let i=0;i<n;i++){
      const hot=hover&&(hover.x===i||hover.y===i);
      c.fillStyle=hot?'#ffcf7a':'rgba(244,234,255,.55)';
      c.save(); c.translate(x0+i*cs+cs*.5, y0-10); c.rotate(-Math.PI/2); c.fillText(R[i],0,3); c.restore();
      c.save(); c.translate(x0-12, y0+i*cs+cs*.68); c.textAlign='end'; c.fillText(R[i],0,0); c.restore(); c.textAlign='start';
    }
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const v=M[y][x]; if(v<=0){ c.fillStyle='rgba(255,255,255,.02)'; c.fillRect(x0+x*cs,y0+y*cs,cs-1,cs-1); continue; }
      const lv=Math.log10(v+1)/maxLog, self=x===y;
      const rC=self?255:Math.round(143+lv*112), gC=self?207:Math.round(220-lv*120), bC=self?122:255;
      c.fillStyle=`rgba(${rC},${gC},${bC},${.08+lv*.85})`;
      c.fillRect(x0+x*cs,y0+y*cs,cs-1,cs-1);
    }
    if(hover){
      c.strokeStyle='#ffcf7a'; c.lineWidth=2.5; c.strokeRect(x0+hover.x*cs,y0+hover.y*cs,cs-1,cs-1);
      c.strokeStyle='rgba(255,207,122,.25)'; c.lineWidth=1; c.strokeRect(x0,y0+hover.y*cs,cs*n,cs-1); c.strokeRect(x0+hover.x*cs,y0,cs-1,cs*n);
    }
    c.fillStyle='rgba(244,234,255,.6)'; c.font=mono(12,800);
    c.fillText('row = presynaptic (sends)  /  column = postsynaptic (receives)  ·  log brightness',x0,y0+n*cs+24);
    // card / readout
    if(hover){
      const i=hover.y, j=hover.x, v=M[i][j], nt=NT[i][j]||{g:0,a:0,l:0}, tot=nt.g+nt.a+nt.l||1;
      if(tEl)tEl.textContent=`${R[i]} → ${R[j]}`;
      if(xEl)xEl.textContent=v>0?`${v.toLocaleString('en-US')} synapses. ${i===j?'Mostly self-talk — regions are internally dense.':'Cross-region cable.'}`:'No direct proofread connection in this aggregate.';
      if(cardT)cardT.textContent=`${R[i]} → ${R[j]}`;
      if(cardS)cardS.textContent=`${v.toLocaleString('en-US')} synapses · gaba ${(nt.g/tot*100).toFixed(0)}% / ach ${(nt.a/tot*100).toFixed(0)}% / glut ${(nt.l/tot*100).toFixed(0)}%`;
      if(cardX)cardX.textContent='Real proofread connections from the FlyWire adult female brain (v783). Neurotransmitter share = weighted mean per edge.';
    } else {
      if(tEl)tEl.textContent='hover the matrix';
      if(cardT)cardT.textContent='Drosophila melanogaster · adult female';
      if(cardS)cardS.textContent='48.9M synapses mapped · 28 regions';
      if(cardX)cardX.textContent='Source: FlyWire Consortium, proofread_connections_783 (Zenodo 10676866). gaba / ach / glut = dominant neurotransmitter share per edge.';
    }
  }
}


/* ---------- chapter 08: Connectome Explorer 2.0 ---------- */
function initConnectomeExplorer(){
  const cv=document.getElementById('connectomeCanvas'); if(!cv) return;
  const section=document.getElementById('connectome-explorer');
  if(section && 'IntersectionObserver' in window){
    new IntersectionObserver(entries=>{
      document.body.classList.toggle('connectome-visible', entries.some(e=>e.isIntersecting && e.intersectionRatio>.22));
    },{threshold:[0,.22,.5]}).observe(section);
  }
  const c=cv.getContext('2d'), W=cv.width, H=cv.height;
  const buttons=[...document.querySelectorAll('[data-connectome-mode]')];
  const modeEl=document.getElementById('connectomeModeLabel'), titleEl=document.getElementById('connectomeTitle'), textEl=document.getElementById('connectomeText');
  const selectedEl=document.getElementById('connectomeSelected'), pathEl=document.getElementById('connectomePath'), hubEl=document.getElementById('connectomeHub');
  const modes={isolate:'isolate regions',paths:'synapse paths',centrality:'centrality',compare:'bio vs artificial'};
  let data=null, nodes=[], edges=[], mode='isolate', selected=0, hover=null, pulse=0;
  fetch('assets/flywire_neuropil.json').then(r=>r.json()).then(d=>{ data=d; buildGraph(); draw(); requestAnimationFrame(loop); }).catch(()=>{ if(textEl) textEl.textContent='flywire_neuropil.json failed to load.'; });
  buttons.forEach(btn=>btn.addEventListener('click',()=>{ mode=btn.dataset.connectomeMode; buttons.forEach(b=>b.classList.toggle('active',b===btn)); draw(); }));
  cv.addEventListener('pointermove',e=>{ if(!nodes.length) return; const r=cv.getBoundingClientRect(), x=(e.clientX-r.left)/r.width*W, y=(e.clientY-r.top)/r.height*H; let best=null, bd=1e9; nodes.forEach((n,i)=>{ const d=Math.hypot(x-n.x,y-n.y); if(d<bd){bd=d;best=i;} }); hover=bd<38?best:null; if(hover!==null) selected=hover; draw(); },{passive:true});
  cv.addEventListener('pointerleave',()=>{hover=null;draw();});
  cv.addEventListener('click',()=>{ if(hover!==null){ selected=hover; draw(); }});
  function buildGraph(){
    const R=data.regions, M=data.syn, n=R.length;
    const cx=W*.42, cy=H*.52, rx=W*.30, ry=H*.34;
    nodes=R.map((name,i)=>{ const a=-Math.PI/2+i/n*Math.PI*2; return {name,i,x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry,out:0,in:0,total:0,cent:0}; });
    edges=[];
    let max=1;
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){ const v=M[i][j]; if(v>0){ nodes[i].out+=v; nodes[j].in+=v; max=Math.max(max,v); if(i!==j) edges.push({i,j,v}); }}
    nodes.forEach(nd=>{ nd.total=nd.in+nd.out; });
    const maxTotal=Math.max(...nodes.map(n=>n.total)); nodes.forEach(nd=>{ nd.cent=nd.total/maxTotal; });
    edges.sort((a,b)=>b.v-a.v); edges=edges.slice(0,110); edges.max=max;
  }
  function strongestPath(start){
    const M=data.syn, R=data.regions, seen=new Set([start]); let cur=start, path=[start], strength=Infinity;
    for(let k=0;k<4;k++){
      let best=-1,bv=0; for(let j=0;j<R.length;j++){ if(!seen.has(j) && M[cur][j]>bv){best=j;bv=M[cur][j];} }
      if(best<0||bv===0) break; path.push(best); seen.add(best); strength=Math.min(strength,bv); cur=best;
    }
    return {path,strength:strength===Infinity?0:strength};
  }
  function draw(){
    c.clearRect(0,0,W,H); c.fillStyle='#05030b'; c.fillRect(0,0,W,H); drawGridInto(c,W,H,72);
    if(!data){ c.fillStyle='rgba(244,234,255,.62)'; c.font=mono(16,800); c.fillText('loading Connectome Explorer 2.0…',48,H/2); return; }
    const sel=nodes[selected]||nodes[0], path=strongestPath(selected), pathSet=new Set(path.path), hub=[...nodes].sort((a,b)=>b.cent-a.cent)[0];
    drawLegend();
    if(mode==='compare') drawArtificialNet();
    edges.forEach(e=>drawEdge(e, sel, pathSet));
    nodes.forEach((n,i)=>drawNode(n,i===selected,i===hover,pathSet.has(i),hub.i===i));
    updateReadout(sel,path,hub);
  }
  function drawLegend(){
    c.fillStyle='rgba(244,234,255,.72)'; c.font=mono(12,900); c.fillText('FlyWire region graph · edge weight = log synapse count · node size = in+out centrality',48,52);
    c.fillStyle='rgba(244,234,255,.42)'; c.font=mono(10,800); c.fillText('Click / hover a region. The same biological wiring above becomes a graph here.',48,72);
  }
  function drawEdge(e, sel, pathSet){
    const a=nodes[e.i], b=nodes[e.j], lv=Math.log10(e.v+1)/Math.log10(edges.max+1);
    const related=e.i===sel.i||e.j===sel.i, inPath=mode==='paths'&&pathSet.has(e.i)&&pathSet.has(e.j);
    let alpha=.045+lv*.16, color='166,115,255';
    if(mode==='isolate'&&!related) alpha*=.18;
    if(mode==='centrality') alpha=.035+lv*.1;
    if(inPath){ alpha=.78; color='255,207,122'; }
    if(mode==='compare') { alpha*=.55; color='143,220,255'; }
    c.strokeStyle=`rgba(${color},${alpha})`; c.lineWidth=inPath?4:Math.max(1,lv*3.2);
    const mx=(a.x+b.x)/2, my=(a.y+b.y)/2-50*Math.sin((e.i-e.j)*.7);
    c.beginPath(); c.moveTo(a.x,a.y); c.quadraticCurveTo(mx,my,b.x,b.y); c.stroke();
    if(inPath){ const t=(pulse%1), x=(1-t)*(1-t)*a.x+2*(1-t)*t*mx+t*t*b.x, y=(1-t)*(1-t)*a.y+2*(1-t)*t*my+t*t*b.y; c.fillStyle='rgba(255,207,122,.95)'; c.beginPath(); c.arc(x,y,7,0,Math.PI*2); c.fill(); }
  }
  function drawNode(n,isSel,isHover,inPath,isHub){
    let r=9+n.cent*25; if(mode==='centrality') r=10+n.cent*38; if(isSel||isHover) r+=7;
    const muted=mode==='isolate' && !(isSel||n.i===selected||edges.some(e=>(e.i===selected&&e.j===n.i)||(e.j===selected&&e.i===n.i)));
    const col=isHub&&mode==='centrality'?'255,207,122':inPath?'255,207,122':'166,115,255';
    c.fillStyle=`rgba(${col},${muted?.18:.82})`; c.strokeStyle=`rgba(244,234,255,${isSel? .9:.22})`; c.lineWidth=isSel?3:1;
    c.beginPath(); c.arc(n.x,n.y,r,0,Math.PI*2); c.fill(); c.stroke();
    c.fillStyle=muted?'rgba(244,234,255,.22)':'rgba(244,234,255,.82)'; c.font=mono(isSel?13:10,900); c.textAlign='center'; c.fillText(n.name,n.x,n.y-r-9); c.textAlign='start';
  }
  function drawArtificialNet(){
    const x0=W*.72, y0=H*.22, layers=[4,6,5,3], dx=92, dy=52;
    c.fillStyle='rgba(244,234,255,.72)'; c.font=mono(12,900); c.fillText('artificial net: layered, optimized, tidy',x0-48,y0-52);
    c.fillStyle='rgba(244,234,255,.42)'; c.font=mono(10,800); c.fillText('brain graph: recurrent, hub-heavy, grown',x0-48,y0-32);
    const pts=[]; layers.forEach((m,l)=>{ pts[l]=[]; for(let i=0;i<m;i++) pts[l].push({x:x0+l*dx,y:y0+(i-(m-1)/2)*dy+120}); });
    c.strokeStyle='rgba(143,220,255,.16)'; c.lineWidth=1; for(let l=0;l<pts.length-1;l++) pts[l].forEach(a=>pts[l+1].forEach(b=>{c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}));
    pts.flat().forEach((p,i)=>{ c.fillStyle=i%3?'rgba(143,220,255,.72)':'rgba(255,207,122,.78)'; c.beginPath(); c.arc(p.x,p.y,9,0,Math.PI*2); c.fill(); });
  }
  function updateReadout(sel,path,hub){
    const pathNames=path.path.map(i=>nodes[i].name);
    if(modeEl) modeEl.textContent=modes[mode]||mode;
    if(titleEl) titleEl.textContent=mode==='centrality'?`${hub.name} is the current hub`:mode==='paths'?`${pathNames.join(' → ')}`:mode==='compare'?'grown graph vs trained layers':`${sel.name} isolated`;
    if(textEl) textEl.textContent=mode==='compare'?'Artificial networks usually start as clean layered DAGs. The fly connectome is recurrent, uneven, and hub-heavy — closer to a city than a pipeline.':mode==='centrality'?`Centrality here is weighted in+out synapse traffic. ${hub.name} dominates this aggregate because many high-weight edges pass through it.`:mode==='paths'?`Greedy strongest outgoing path from ${sel.name}; not “thought”, just the heaviest local route through the region graph.`:`Showing ${sel.name}, its incoming/outgoing neighbors, and the wiring pressure around that region.`;
    if(selectedEl) selectedEl.textContent=`${sel.name} · ${(sel.total/1e6).toFixed(2)}M traffic`;
    if(pathEl) pathEl.textContent=`${pathNames.slice(0,4).join(' → ')}`;
    if(hubEl) hubEl.textContent=`${hub.name} · ${(hub.cent*100).toFixed(0)}%`;
  }
  function loop(){ pulse=(pulse+.012)%1; if(mode==='paths') draw(); requestAnimationFrame(loop); }
}

initDlXor(); initActivation(); initCnn(); initAttention(); initLandscape(); initDigits(); initFlywire(); initConnectomeExplorer();
})();
