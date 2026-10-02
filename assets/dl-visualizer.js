/* scryx / deep learning visualizer — real math, no scripted animations */
(function(){
const tanh = Math.tanh;
const sig = z => 1/(1+Math.exp(-z));
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
  let epoch=0, lossHist=[];
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
    const l=step();
    if(epoch%3===0){ draw(l); if(epEl)epEl.textContent=`epoch ${epoch}`; if(lossEl)lossEl.textContent=`loss: ${l.toFixed(4)}${l<.05?'  // solved':l<.25?'  // folding…':'  // still stuck'}`; }
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
  function loop(){ step(); if(frame%2===0)draw(); requestAnimationFrame(loop); }
  loop();
}

initDlXor(); initActivation(); initCnn(); initAttention(); initLandscape();
})();
