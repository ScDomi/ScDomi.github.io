window.__mountGradientField = () => {
  const canvas = document.getElementById('gradient-canvas');
  if (canvas && !canvas.dataset.gradientMounted) bootGradientField(canvas);
};
window.__mountGradientField();

function bootGradientField(canvas) {
  canvas.dataset.gradientMounted = 'true';
  const ctx = canvas.getContext('2d');
  const stage = canvas.closest('.gradient-stage') || canvas;
  const readout = document.getElementById('gradient-readout');
  const functionEl = document.getElementById('gradient-function');
  const rateEl = document.getElementById('gradient-learning-rate');
  const momentumEl = document.getElementById('gradient-momentum');
  const stepsEl = document.getElementById('gradient-steps');
  const toggle = document.getElementById('gradient-toggle');
  const randomBtn = document.getElementById('gradient-random');
  const resetBtn = document.getElementById('gradient-reset');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 900, height = 620, dpr = 1, running = !reduceMotion;
  let state = { x: -3.6, y: -3.0, vx: 0, vy: 0, step: 0, trail: [] };
  let terrain = null;

  const landscapes = {
    himmelblau: {
      name: 'Himmelblau', range: [-5, 5],
      value(x, y) { return (x * x + y - 11) ** 2 + (x + y * y - 7) ** 2; },
      grad(x, y) { return [4 * x * (x * x + y - 11) + 2 * (x + y * y - 7), 2 * (x * x + y - 11) + 4 * y * (x + y * y - 7)]; }
    },
    rosenbrock: {
      name: 'Rosenbrock', range: [-2.2, 2.2],
      value(x, y) { return (1 - x) ** 2 + 100 * (y - x * x) ** 2; },
      grad(x, y) { return [-2 * (1 - x) - 400 * x * (y - x * x), 200 * (y - x * x)]; }
    },
    doublewell: {
      name: 'Double well', range: [-2.3, 2.3],
      value(x, y) { return (x * x - 1) ** 2 + 0.65 * y * y + 0.18 * x * y; },
      grad(x, y) { return [4 * x * (x * x - 1) + 0.18 * y, 1.3 * y + 0.18 * x]; }
    }
  };

  const active = () => landscapes[functionEl?.value || 'himmelblau'];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const fmt = n => Number.isFinite(n) ? n.toFixed(Math.abs(n) < 10 ? 3 : 1) : '∞';

  function syncLabels() {
    document.querySelectorAll('[data-gradient-value]').forEach(label => {
      const input = document.getElementById(label.dataset.gradientValue);
      if (!input) return;
      label.textContent = input.id === 'gradient-steps' ? input.value : Number(input.value).toFixed(input.id === 'gradient-learning-rate' ? 3 : 2);
    });
  }

  function worldToScreen(x, y) {
    const [min, max] = active().range;
    return { x: (x - min) / (max - min) * width, y: (max - y) / (max - min) * height };
  }

  function screenToWorld(x, y) {
    const [min, max] = active().range;
    return { x: min + x / width * (max - min), y: max - y / height * (max - min) };
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = Math.max(320, Math.round(rect.width));
    height = Math.max(380, Math.round(rect.height));
    dpr = Math.min(devicePixelRatio || 1, 1.8);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildTerrain();
  }

  function buildTerrain() {
    const fn = active();
    const cols = Math.max(80, Math.min(180, Math.round(width / 5)));
    const rows = Math.max(70, Math.min(150, Math.round(height / 5)));
    const samples = [];
    let maxLog = -Infinity;
    for (let j = 0; j <= rows; j++) {
      for (let i = 0; i <= cols; i++) {
        const p = screenToWorld(i / cols * width, j / rows * height);
        const v = fn.value(p.x, p.y);
        const logged = Math.log1p(Math.max(0, v));
        samples.push(logged); maxLog = Math.max(maxLog, logged);
      }
    }
    terrain = { cols, rows, samples, maxLog: Math.max(maxLog, 1) };
  }

  function colour(t) {
    const hue = 252 - 188 * t;
    const light = 8 + 48 * Math.pow(t, .72);
    return `hsl(${hue} 82% ${light}%)`;
  }

  function drawTerrain() {
    if (!terrain) return;
    const { cols, rows, samples, maxLog } = terrain;
    const cw = width / cols, ch = height / rows;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const t = clamp(samples[j * (cols + 1) + i] / maxLog, 0, 1);
        ctx.fillStyle = colour(t);
        ctx.fillRect(i * cw, j * ch, Math.ceil(cw + .4), Math.ceil(ch + .4));
      }
    }
    ctx.fillStyle = 'rgba(1,2,5,.20)';
    ctx.fillRect(0, 0, width, height);
  }

  function drawVectors() {
    const fn = active();
    const spacing = Math.max(54, Math.min(84, width / 11));
    ctx.save();
    ctx.strokeStyle = 'rgba(224,244,255,.25)';
    ctx.fillStyle = 'rgba(224,244,255,.38)';
    ctx.lineWidth = 1;
    for (let sy = spacing * .5; sy < height; sy += spacing) {
      for (let sx = spacing * .5; sx < width; sx += spacing) {
        const p = screenToWorld(sx, sy);
        const [gx, gy] = fn.grad(p.x, p.y);
        const mag = Math.hypot(gx, gy) || 1;
        const dx = -gx / mag, dy = gy / mag;
        const len = Math.min(19, 8 + Math.log1p(mag) * 2.2);
        const ex = sx + dx * len, ey = sy + dy * len;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        const a = Math.atan2(dy, dx);
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 4 * Math.cos(a - .55), ey - 4 * Math.sin(a - .55)); ctx.lineTo(ex - 4 * Math.cos(a + .55), ey - 4 * Math.sin(a + .55)); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawTrail() {
    if (!state.trail.length) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(245,243,255,.88)';
    ctx.lineWidth = 1.7;
    ctx.shadowColor = 'rgba(127,243,255,.55)'; ctx.shadowBlur = 13;
    ctx.beginPath();
    state.trail.forEach((p, index) => {
      const q = worldToScreen(p.x, p.y);
      if (index) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y);
    });
    ctx.stroke();
    const q = worldToScreen(state.x, state.y);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q.x, q.y, 5.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7ff3ff'; ctx.beginPath(); ctx.arc(q.x, q.y, 10, 0, Math.PI * 2); ctx.globalAlpha = .22; ctx.fill();
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    drawTerrain(); drawVectors(); drawTrail();
    const fn = active(); const [gx, gy] = fn.grad(state.x, state.y);
    const value = fn.value(state.x, state.y);
    if (readout) readout.innerHTML = `<span>${fn.name.toUpperCase()}</span> · step ${state.step} · f(x,y) ${fmt(value)}<br><span>x</span> ${fmt(state.x)} · <span>y</span> ${fmt(state.y)} · <span>|∇f|</span> ${fmt(Math.hypot(gx, gy))}`;
  }

  function reset(random = false) {
    const [min, max] = active().range;
    const x = random ? min + Math.random() * (max - min) : (active().name === 'Rosenbrock' ? -1.6 : -3.6);
    const y = random ? min + Math.random() * (max - min) : (active().name === 'Rosenbrock' ? 1.7 : -3.0);
    state = { x, y, vx: 0, vy: 0, step: 0, trail: [{ x, y }] };
    buildTerrain(); render();
  }

  function descend() {
    const fn = active();
    const rate = Number(rateEl?.value || .018);
    const momentum = Number(momentumEl?.value || .72);
    const steps = Number(stepsEl?.value || 2);
    const [min, max] = fn.range;
    for (let i = 0; i < steps; i++) {
      const [gx, gy] = fn.grad(state.x, state.y);
      const norm = Math.hypot(gx, gy);
      if (!Number.isFinite(norm) || norm > 1e7) { reset(true); return; }
      state.vx = momentum * state.vx - rate * gx;
      state.vy = momentum * state.vy - rate * gy;
      state.x = clamp(state.x + state.vx, min, max);
      state.y = clamp(state.y + state.vy, min, max);
      state.step++;
      state.trail.push({ x: state.x, y: state.y });
      if (state.trail.length > 460) state.trail.shift();
    }
  }

  function tick() {
    if (running) descend();
    render();
    requestAnimationFrame(tick);
  }

  function setPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const p = screenToWorld(event.clientX - rect.left, event.clientY - rect.top);
    state = { x: p.x, y: p.y, vx: 0, vy: 0, step: 0, trail: [{ x: p.x, y: p.y }] };
    render();
  }

  [rateEl, momentumEl, stepsEl].forEach(input => input?.addEventListener('input', () => { syncLabels(); render(); }));
  functionEl?.addEventListener('change', () => reset(false));
  toggle?.addEventListener('click', () => { running = !running; toggle.textContent = running ? 'pause descent' : 'resume descent'; });
  randomBtn?.addEventListener('click', () => reset(true));
  resetBtn?.addEventListener('click', () => reset(false));
  canvas.addEventListener('pointerdown', setPoint);
  new ResizeObserver(resize).observe(stage);
  syncLabels(); resize(); reset(false); tick();
}
