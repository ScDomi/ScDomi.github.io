import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

window.__mountLorenzAttractor = () => {
  const canvas = document.getElementById('lorenz-canvas');
  if (canvas && !canvas.dataset.lorenzMounted) bootLorenz(canvas);
};
window.__mountLorenzAttractor();

function bootLorenz(canvas) {
  canvas.dataset.lorenzMounted = 'true';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const panel = canvas.closest('.lorenz-stage');
  const controlsForm = document.getElementById('lorenz-controls');
  const sigmaEl = document.getElementById('lorenz-sigma');
  const rhoEl = document.getElementById('lorenz-rho');
  const betaEl = document.getElementById('lorenz-beta');
  const speedEl = document.getElementById('lorenz-speed');
  const resetBtn = document.getElementById('lorenz-reset');
  const twinEl = document.getElementById('lorenz-twin');
  const readout = document.getElementById('lorenz-readout');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030304, 0.018);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 300);
  camera.position.set(0, 10, 78);
  const orbit = new OrbitControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.055;
  orbit.autoRotate = !reduceMotion;
  orbit.autoRotateSpeed = 0.28;
  orbit.minDistance = 25;
  orbit.maxDistance = 135;

  scene.add(new THREE.AmbientLight(0xd9c7ff, 1.1));
  const key = new THREE.PointLight(0x9b69ff, 45, 160, 1.4);
  key.position.set(28, 38, 32);
  scene.add(key);
  const cyan = new THREE.PointLight(0x7ff3ff, 24, 110, 1.8);
  cyan.position.set(-24, -8, 42);
  scene.add(cyan);

  const axisMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08 });
  const axis = new THREE.Group();
  axis.add(line([[-34,0,0],[34,0,0]], axisMat));
  axis.add(line([[0,-34,0],[0,34,0]], axisMat));
  axis.add(line([[0,0,-34],[0,0,34]], axisMat));
  scene.add(axis);

  let params, points, twinPoints, curveLine, twinLine, head, twinHead, trailLine, trailLine2;
  let idx = 0;
  const dt = 0.006;
  const N = 9000;
  const scale = 1.25;

  const mainMat = new THREE.LineBasicMaterial({ color: 0xd9c7ff, transparent: true, opacity: 0.76, blending: THREE.AdditiveBlending });
  const twinMat = new THREE.LineBasicMaterial({ color: 0x7ff3ff, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending });
  const trailMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending });
  const trailMat2 = new THREE.LineBasicMaterial({ color: 0x7ff3ff, transparent: true, opacity: 0.52, blending: THREE.AdditiveBlending });

  function lorenz(p, s, r, b) {
    return new THREE.Vector3(s * (p.y - p.x), p.x * (r - p.z) - p.y, p.x * p.y - b * p.z);
  }
  function rk4(p, h, s, r, b) {
    const k1 = lorenz(p, s, r, b);
    const k2 = lorenz(p.clone().addScaledVector(k1, h / 2), s, r, b);
    const k3 = lorenz(p.clone().addScaledVector(k2, h / 2), s, r, b);
    const k4 = lorenz(p.clone().addScaledVector(k3, h), s, r, b);
    return p.clone().addScaledVector(k1, h / 6).addScaledVector(k2, h / 3).addScaledVector(k3, h / 3).addScaledVector(k4, h / 6);
  }
  function integrate(start) {
    const out = [];
    let p = start.clone();
    for (let i = 0; i < N; i++) {
      p = rk4(p, dt, params.sigma, params.rho, params.beta);
      if (i > 80) out.push(new THREE.Vector3(p.x * scale, (p.z - 25) * scale, p.y * scale));
    }
    return out;
  }
  function line(arr, mat) {
    const pts = arr.map(v => Array.isArray(v) ? new THREE.Vector3(v[0], v[1], v[2]) : v);
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
  }
  function refresh() {
    params = {
      sigma: Number(sigmaEl.value),
      rho: Number(rhoEl.value),
      beta: Number(betaEl.value),
      speed: Number(speedEl.value),
      twin: twinEl.checked
    };
    points = integrate(new THREE.Vector3(0.01, 1, 1.05));
    twinPoints = integrate(new THREE.Vector3(0.0104, 1, 1.05));
    for (const obj of [curveLine, twinLine, head, twinHead, trailLine, trailLine2]) if (obj) scene.remove(obj);
    curveLine = line(points, mainMat);
    twinLine = line(twinPoints, twinMat);
    twinLine.visible = params.twin;
    head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    twinHead = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 12), new THREE.MeshBasicMaterial({ color: 0x7ff3ff, transparent: true, opacity: 0.86 }));
    twinHead.visible = params.twin;
    trailLine = line([], trailMat);
    trailLine2 = line([], trailMat2);
    trailLine2.visible = params.twin;
    scene.add(curveLine, twinLine, trailLine, trailLine2, head, twinHead);
    idx = 0;
    if (readout) readout.textContent = `σ=${params.sigma.toFixed(2)} · ρ=${params.rho.toFixed(2)} · β=${params.beta.toFixed(3)} · RK4 dt=${dt}`;
  }
  function syncLabels() {
    document.querySelectorAll('[data-lorenz-value]').forEach(el => {
      const input = document.getElementById(el.dataset.lorenzValue);
      if (input) el.textContent = Number(input.value).toFixed(input.step && input.step.includes('.') ? 2 : 0);
    });
  }
  controlsForm?.addEventListener('input', () => { syncLabels(); refresh(); });
  resetBtn?.addEventListener('click', () => {
    sigmaEl.value = 10; rhoEl.value = 28; betaEl.value = (8/3).toFixed(3); speedEl.value = 1; twinEl.checked = true;
    syncLabels(); refresh();
  });
  syncLabels(); refresh();

  const ro = new ResizeObserver(resize);
  ro.observe(panel || canvas);
  function resize() {
    const r = (panel || canvas).getBoundingClientRect();
    const w = Math.max(320, r.width);
    const h = Math.max(360, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  function frame() {
    const speed = reduceMotion ? 0.15 : Number(speedEl.value || 1);
    idx = (idx + speed * 5.2) % points.length;
    const i = Math.floor(idx);
    const trailStart = Math.max(0, i - 900);
    const trail = points.slice(trailStart, i + 1);
    const trail2 = twinPoints.slice(trailStart, i + 1);
    if (points[i]) head.position.copy(points[i]);
    if (twinPoints[i]) twinHead.position.copy(twinPoints[i]);
    trailLine.geometry.dispose(); trailLine.geometry = new THREE.BufferGeometry().setFromPoints(trail);
    trailLine2.geometry.dispose(); trailLine2.geometry = new THREE.BufferGeometry().setFromPoints(trail2);
    const sep = points[i] && twinPoints[i] ? points[i].distanceTo(twinPoints[i]) / scale : 0;
    if (readout) readout.textContent = `σ=${Number(sigmaEl.value).toFixed(2)} · ρ=${Number(rhoEl.value).toFixed(2)} · β=${Number(betaEl.value).toFixed(3)} · nearby separation ≈ ${sep.toFixed(3)}`;
    orbit.update();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
