window.__mountDoublePendulum = () => {
  const canvas = document.getElementById('pendulum-canvas');
  if (canvas && !canvas.dataset.pendulumMounted) bootDoublePendulum(canvas);
};
window.__mountDoublePendulum();

function bootDoublePendulum(canvas) {
  canvas.dataset.pendulumMounted = 'true';
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = canvas.closest('.pendulum-stage') || canvas;
  const readout = document.getElementById('pendulum-readout');
  const thetaEl = document.getElementById('pendulum-theta');
  const deltaEl = document.getElementById('pendulum-delta');
  const energyEl = document.getElementById('pendulum-energy');
  const speedEl = document.getElementById('pendulum-speed');
  const resetBtn = document.getElementById('pendulum-reset');
  const labels = document.querySelectorAll('[data-pendulum-value]');

  const g = 9.81;
  const dt = 0.006;
  const base = { m1: 1, m2: 1, l1: 1, l2: 1 };
  let width = 900;
  let height = 640;
  let dpr = 1;
  let t = 0;
  let state;
  let twin;
  let initialDelta = 1e-4;
  let history = [];
  let twinHistory = [];
  let phaseA = [];
  let phaseB = [];
  let running = true;

  function deriv(s, p) {
    const [a1, w1, a2, w2] = s;
    const { m1, m2, l1, l2 } = p;
    const sin = Math.sin;
    const cos = Math.cos;
    const d = a1 - a2;
    const denom1 = l1 * (2 * m1 + m2 - m2 * cos(2 * d));
    const denom2 = l2 * (2 * m1 + m2 - m2 * cos(2 * d));
    const dw1 = (-g * (2 * m1 + m2) * sin(a1) - m2 * g * sin(a1 - 2 * a2) - 2 * sin(d) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * cos(d))) / denom1;
    const dw2 = (2 * sin(d) * (w1 * w1 * l1 * (m1 + m2) + g * (m1 + m2) * cos(a1) + w2 * w2 * l2 * m2 * cos(d))) / denom2;
    return [w1, dw1, w2, dw2];
  }

  function rk4(s, h, p) {
    const k1 = deriv(s, p);
    const k2 = deriv(addScaled(s, k1, h / 2), p);
    const k3 = deriv(addScaled(s, k2, h / 2), p);
    const k4 = deriv(addScaled(s, k3, h), p);
    return s.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }

  function addScaled(s, k, h) {
    return s.map((v, i) => v + k[i] * h);
  }

  function syncLabels() {
    labels.forEach(label => {
      const input = document.getElementById(label.dataset.pendulumValue);
      if (!input) return;
      const n = Number(input.value);
      label.textContent = input.id === 'pendulum-delta' ? n.toExponential(0) : n.toFixed(input.step?.includes('.') ? 2 : 0);
    });
  }

  function reset() {
    syncLabels();
    const theta = Number(thetaEl?.value || 122) * Math.PI / 180;
    const energy = Number(energyEl?.value || 1);
    initialDelta = Number(deltaEl?.value || 1e-4);
    state = [theta, 0, theta * 0.72, 0.34 * energy];
    twin = [theta + initialDelta, 0, theta * 0.72, 0.34 * energy];
    t = 0;
    history = [];
    twinHistory = [];
    phaseA = [];
    phaseB = [];
    render();
  }

  function coords(s) {
    const scale = Math.min(width, height) * 0.17;
    const ox = width * 0.22;
    const oy = height * 0.52;
    const x1 = ox + Math.sin(s[0]) * scale;
    const y1 = oy + Math.cos(s[0]) * scale;
    const x2 = x1 + Math.sin(s[2]) * scale;
    const y2 = y1 + Math.cos(s[2]) * scale;
    return { ox, oy, x1, y1, x2, y2, scale };
  }

  function distance(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]);
  }

  function lyapunov() {
    const d = Math.max(distance(state, twin), 1e-12);
    return t > 0 ? Math.log(d / initialDelta) / t : 0;
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.7);
    width = Math.max(320, Math.floor(r.width));
    height = Math.max(460, Math.floor(r.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function step() {
    const speed = reduceMotion ? 0.35 : Number(speedEl?.value || 1);
    const loops = Math.max(1, Math.round(speed * 8));
    for (let i = 0; i < loops; i++) {
      state = rk4(state, dt, base);
      twin = rk4(twin, dt, base);
      t += dt;
      const c = coords(state);
      const ct = coords(twin);
      history.push([c.x2, c.y2]);
      twinHistory.push([ct.x2, ct.y2]);
      phaseA.push([state[0], state[1]]);
      phaseB.push([state[2], state[3]]);
      if (history.length > 760) history.shift();
      if (twinHistory.length > 760) twinHistory.shift();
      if (phaseA.length > 900) phaseA.shift();
      if (phaseB.length > 900) phaseB.shift();
    }
  }

  function drawTrail(points, color, alpha = 1) {
    if (points.length < 2) return;
    ctx.save();
    ctx.lineWidth = 1.35;
    for (let i = 1; i < points.length; i++) {
      const a = i / points.length;
      ctx.strokeStyle = color.replace('ALPHA', String(alpha * a * 0.62));
      ctx.beginPath();
      ctx.moveTo(points[i - 1][0], points[i - 1][1]);
      ctx.lineTo(points[i][0], points[i][1]);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPendulum(s, color, ghost = false) {
    const c = coords(s);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = ghost ? 1.4 : 2.4;
    ctx.shadowColor = color;
    ctx.shadowBlur = ghost ? 9 : 18;
    ctx.beginPath();
    ctx.moveTo(c.ox, c.oy);
    ctx.lineTo(c.x1, c.y1);
    ctx.lineTo(c.x2, c.y2);
    ctx.stroke();
    ctx.fillStyle = color;
    circle(c.ox, c.oy, 4);
    circle(c.x1, c.y1, ghost ? 5 : 7);
    circle(c.x2, c.y2, ghost ? 6 : 9);
    ctx.restore();
  }

  function circle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPhase(points, x, y, w, h, color, label) {
    ctx.save();
    ctx.strokeStyle = 'rgba(244,241,234,.13)';
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(244,241,234,.58)';
    ctx.font = '700 10px ui-monospace, Menlo, monospace';
    ctx.fillText(label, x + 10, y + 17);
    ctx.strokeStyle = 'rgba(244,241,234,.08)';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 24); ctx.lineTo(x + w / 2, y + h - 8);
    ctx.moveTo(x + 8, y + h / 2); ctx.lineTo(x + w - 8, y + h / 2);
    ctx.stroke();
    if (points.length > 2) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      points.forEach((p, i) => {
        const px = x + w / 2 + (wrapAngle(p[0]) / Math.PI) * (w * 0.42);
        const py = y + h / 2 - Math.max(-6, Math.min(6, p[1])) / 6 * (h * 0.36);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
    ctx.restore();
  }

  function wrapAngle(a) {
    return Math.atan2(Math.sin(a), Math.cos(a));
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    const grad = ctx.createRadialGradient(width * .28, height * .35, 10, width * .42, height * .45, height * .72);
    grad.addColorStop(0, 'rgba(185,101,255,.16)');
    grad.addColorStop(1, 'rgba(3,3,4,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    drawTrail(history, 'rgba(217,199,255,ALPHA)', 1);
    drawTrail(twinHistory, 'rgba(127,243,255,ALPHA)', .85);
    drawPendulum(twin, 'rgba(127,243,255,.78)', true);
    drawPendulum(state, 'rgba(244,241,234,.94)');

    const sideX = width * 0.61;
    const boxW = Math.max(210, width * 0.31);
    drawPhase(phaseA, sideX, height * 0.18, boxW, height * 0.24, 'rgba(217,199,255,.72)', 'phase: θ₁ × ω₁');
    drawPhase(phaseB, sideX, height * 0.50, boxW, height * 0.24, 'rgba(127,243,255,.66)', 'phase: θ₂ × ω₂');

    const sep = distance(state, twin);
    const lambda = lyapunov();
    if (readout) readout.textContent = `Δ=${sep.toExponential(2)} · λ≈${lambda.toFixed(3)} s⁻¹ · t=${t.toFixed(1)}s · RK4 dt=${dt}`;
  }

  function frame() {
    const r = stage.getBoundingClientRect();
    running = !document.hidden && r.bottom > 0 && r.top < window.innerHeight;
    if (running) {
      step();
      render();
    }
    requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) render();
  });
  [thetaEl, deltaEl, energyEl, speedEl].forEach(input => input?.addEventListener('input', reset));
  resetBtn?.addEventListener('click', () => {
    if (thetaEl) thetaEl.value = 122;
    if (deltaEl) deltaEl.value = 0.0001;
    if (energyEl) energyEl.value = 1;
    if (speedEl) speedEl.value = 1;
    reset();
  });
  new ResizeObserver(resize).observe(stage);
  resize();
  reset();
  requestAnimationFrame(frame);
}
