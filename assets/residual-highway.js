/* scryx / residual highway — real forward + backward signal comparison */
(() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rms = v => Math.sqrt(v.reduce((s, x) => s + x * x, 0) / v.length);
  const dot = (m, v) => m.map(row => row.reduce((s, x, i) => s + x * v[i], 0));
  const tanh = x => Math.tanh(x);
  const tanhGrad = x => 1 - Math.tanh(x) ** 2;
  const transpose = m => m[0].map((_, i) => m.map(row => row[i]));
  const add = (a, b) => a.map((x, i) => x + b[i]);
  const scale = (a, s) => a.map(x => x * s);

  function mulMat(a, b) {
    return a.map(row => b[0].map((_, j) => row.reduce((s, v, k) => s + v * b[k][j], 0)));
  }
  function identity(n) { return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 0)); }
  function matrixVecT(m, v) { return dot(transpose(m), v); }

  function init() {
    const canvas = document.getElementById('residualCanvas');
    if (!canvas || canvas.dataset.mounted === 'true') return;
    canvas.dataset.mounted = 'true';
    const depthInput = document.getElementById('resDepth');
    const scaleInput = document.getElementById('resScale');
    const reseed = document.getElementById('resReseed');
    const depthOut = document.getElementById('resDepthOut');
    const scaleOut = document.getElementById('resScaleOut');
    const plainOut = document.getElementById('resPlainGrad');
    const residualOut = document.getElementById('resSkipGrad');
    const verdict = document.getElementById('resVerdict');
    if (!depthInput || !scaleInput || !reseed || !depthOut || !scaleOut || !plainOut || !residualOut || !verdict) return;

    const ctx = canvas.getContext('2d');
    const n = 6;
    let seed = 9137;
    let matrices = [];

    function random() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    function build() {
      const total = 32;
      matrices = Array.from({ length: total }, () => Array.from({ length: n }, () => Array.from({ length: n }, () => (random() * 2 - 1) * 0.56)));
    }
    function forward(kind, depth, amount) {
      let x = [0.72, -0.22, 0.51, -0.63, 0.17, 0.38];
      const states = [x.slice()];
      const jacobians = [];
      for (let layer = 0; layer < depth; layer++) {
        const z = dot(matrices[layer], x);
        const grad = z.map(tanhGrad);
        const local = matrices[layer].map((row, r) => row.map(v => v * grad[r]));
        if (kind === 'plain') {
          x = z.map(tanh);
          jacobians.push(local);
        } else {
          x = add(x, scale(z.map(tanh), amount));
          jacobians.push(local.map((row, r) => row.map((v, c) => (r === c ? 1 : 0) + amount * v)));
        }
        states.push(x.slice());
      }
      let back = Array(n).fill(1 / Math.sqrt(n));
      for (let layer = jacobians.length - 1; layer >= 0; layer--) back = matrixVecT(jacobians[layer], back);
      return { states, grad: rms(back), signal: rms(x) };
    }

    function fit() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: r.width, h: r.height };
    }
    function color(v, alpha = 1) {
      const x = clamp(Math.abs(v), 0, 1.4);
      const hue = v >= 0 ? 270 - x * 70 : 185 + x * 20;
      return `hsla(${hue}, 92%, ${38 + x * 38}%, ${alpha})`;
    }
    function drawColumn(result, x0, width, label, residual, w, h) {
      const top = 72, bottom = h - 64, depth = result.states.length - 1;
      const usable = bottom - top;
      const compact = width < 160;
      ctx.fillStyle = 'rgba(244,234,255,.92)'; ctx.font = compact ? '800 9px ui-monospace, monospace' : '800 12px ui-monospace, monospace';
      ctx.fillText(compact ? (residual ? 'residual / skip' : 'plain / no bypass') : label, x0, 28);
      ctx.fillStyle = 'rgba(244,234,255,.46)'; ctx.font = compact ? '700 8px ui-monospace, monospace' : '700 10px ui-monospace, monospace';
      ctx.fillText(residual ? 'xₗ₊₁ = xₗ + α·F(xₗ)' : 'xₗ₊₁ = F(xₗ)', x0, 45);
      const layersToDraw = Math.min(depth, 16);
      const stride = depth / layersToDraw;
      for (let shown = 0; shown <= layersToDraw; shown++) {
        const actual = Math.min(depth, Math.round(shown * stride));
        const y = top + usable * (shown / layersToDraw);
        const state = result.states[actual];
        if (residual && shown < layersToDraw) {
          const y2 = top + usable * ((shown + 1) / layersToDraw);
          ctx.strokeStyle = 'rgba(255,207,122,.34)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
          ctx.beginPath(); ctx.moveTo(x0 + width + 4, y + 3); ctx.bezierCurveTo(x0 + width + 38, y + 12, x0 + width + 38, y2 - 12, x0 + width + 4, y2 - 3); ctx.stroke(); ctx.setLineDash([]);
        }
        state.forEach((v, i) => {
          const cellW = width / n - 5; const px = x0 + i * width / n;
          ctx.fillStyle = color(v, .9); ctx.fillRect(px, y - 7, cellW, 14);
          ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(px, y - 7, cellW, 1);
        });
        if (shown === 0 || shown === layersToDraw || shown % 4 === 0) {
          ctx.fillStyle = 'rgba(244,234,255,.37)'; ctx.font = '700 9px ui-monospace, monospace';
          ctx.fillText(shown === 0 ? 'input' : (shown === layersToDraw ? `layer ${depth}` : `+${actual}`), x0, y - 12);
        }
      }
      ctx.fillStyle = 'rgba(244,234,255,.56)'; ctx.font = '700 10px ui-monospace, monospace';
      ctx.fillText(`forward signal ${result.signal.toFixed(2)}`, x0, h - 29);
      ctx.fillStyle = residual ? 'rgba(157,255,208,.92)' : 'rgba(255,155,184,.88)';
      ctx.fillText(`backward gradient ${result.grad.toExponential(2)}`, x0, h - 13);
    }
    function render() {
      const { w, h } = fit();
      const depth = Number(depthInput.value); const amount = Number(scaleInput.value) / 100;
      const plain = forward('plain', depth, amount); const residual = forward('residual', depth, amount);
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createRadialGradient(w * .5, h * .35, 0, w * .5, h * .4, Math.max(w, h));
      bg.addColorStop(0, 'rgba(166,115,255,.13)'); bg.addColorStop(1, 'rgba(3,3,6,0)'); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(202,169,255,.13)'; ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 42) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 42) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      const gap = Math.max(18, w * .04); const colW = Math.min(270, Math.max(112, (w - gap - 44) / 2));
      drawColumn(plain, Math.max(22, w / 2 - gap / 2 - colW), colW, 'plain stack / no bypass', false, w, h);
      drawColumn(residual, Math.min(w - colW - 22, w / 2 + gap / 2), colW, 'residual stack / identity highway', true, w, h);
      if (w >= 480) { ctx.fillStyle = 'rgba(255,207,122,.82)'; ctx.font = '800 10px ui-monospace, monospace'; ctx.fillText('skip connection', w / 2 + gap / 2 + colW + 10, h * .48); }
      depthOut.textContent = String(depth); scaleOut.textContent = amount.toFixed(2);
      plainOut.textContent = plain.grad.toExponential(2); residualOut.textContent = residual.grad.toExponential(2);
      const ratio = residual.grad / Math.max(plain.grad, 1e-12);
      verdict.textContent = ratio > 10 ? `the skip path keeps ${ratio.toFixed(0)}× more gradient alive.` : 'this seed is unusually kind to the plain stack. hit reseed.';
    }
    build(); render(); requestAnimationFrame(render); setTimeout(render, 120);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { requestAnimationFrame(render); observer.disconnect(); }
      }, { threshold: .04 });
      observer.observe(canvas);
    }
    depthInput.addEventListener('input', render); scaleInput.addEventListener('input', render);
    reseed.addEventListener('click', () => { seed = (Date.now() >>> 0) || 1; build(); render(); });
    addEventListener('resize', render, { passive: true });
  }
  window.__mountResidualHighway = init;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
