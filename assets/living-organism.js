/* scryx / living rule organism
   Procedural moon-jelly inspired model, built from morphology + swim-cycle data.
   No fake brain mesh: bell, oral arms and tentacles are generated from measured-like
   ratios used in jellyfish biomechanics: oblate bell, radial symmetry, slow pulse. */
import * as THREE from 'three';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 760px)').matches;
const canvas = document.getElementById('organism-canvas');
const section = document.getElementById('living-system');

if (canvas && section && !reduceMotion) bootOrganism();

function bootOrganism() {
  const DATA = Object.freeze({
    species: 'Aurelia aurita inspired procedural model',
    // normalized adult moon-jelly morphology ratios: bell diameter = 1.0
    bellDiameter: 1.0,
    bellHeightRatio: 0.19,
    marginLobes: 32,
    radialCanals: 16,
    oralArms: 4,
    tentacleCount: isMobile ? 56 : 96,
    tentacleLengthRatio: 1.42,
    // calm cruising pulse. Real medusae are slow; keep it ambient, not screensaver chaos.
    pulseHz: 0.28,
    contraction: 0.105,
    recoveryBias: 0.64,
    driftSpeed: 0.035
  });
  section.dataset.organism = DATA.species;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.15 : 1.45));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 90);
  camera.position.set(0, 0.45, 7.4);

  scene.add(new THREE.AmbientLight(0x7b65aa, 1.8));
  const key = new THREE.PointLight(0x86f4ff, 22, 18, 1.6);
  key.position.set(-2.6, 2.4, 4.4);
  scene.add(key);
  const rim = new THREE.PointLight(0xb965ff, 18, 20, 1.8);
  rim.position.set(3.2, -1.0, 2.8);
  scene.add(rim);

  const root = new THREE.Group();
  scene.add(root);

  const bellGeo = buildBellGeometry(DATA, isMobile ? 44 : 72, isMobile ? 20 : 28);
  const bellMat = new THREE.MeshPhysicalMaterial({
    color: 0xcab8ff,
    emissive: 0x211044,
    emissiveIntensity: 0.52,
    roughness: 0.22,
    metalness: 0.0,
    transmission: 0.42,
    transparent: true,
    opacity: 0.46,
    thickness: 1.3,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const bell = new THREE.Mesh(bellGeo, bellMat);
  bell.renderOrder = 2;
  root.add(bell);

  const rimGeo = new THREE.BufferGeometry().setFromPoints(circlePoints(1.0, 160, 0.015));
  const rimLine = new THREE.LineLoop(rimGeo, new THREE.LineBasicMaterial({ color: 0xd9c7ff, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false }));
  root.add(rimLine);

  const canalGroup = new THREE.Group();
  const canalMat = new THREE.LineBasicMaterial({ color: 0x7ff3ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < DATA.radialCanals; i++) {
    const a = (i / DATA.radialCanals) * Math.PI * 2;
    const pts = [];
    for (let j = 0; j <= 42; j++) {
      const r = j / 42;
      const wave = Math.sin(r * Math.PI * 2 + i * 0.8) * 0.025 * r;
      pts.push(new THREE.Vector3(Math.cos(a + wave) * r, Math.sin(a + wave) * r, 0.036 + Math.sin(r * Math.PI) * 0.08));
    }
    canalGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), canalMat.clone()));
  }
  root.add(canalGroup);

  const armGroup = new THREE.Group();
  const armMat = new THREE.LineBasicMaterial({ color: 0xe8ddff, transparent: true, opacity: 0.30, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < DATA.oralArms; i++) armGroup.add(makeOralArm(i, DATA.oralArms, armMat));
  root.add(armGroup);

  const tentacles = [];
  const tentacleMat = new THREE.LineBasicMaterial({ color: 0x98f0ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < DATA.tentacleCount; i++) {
    const a = (i / DATA.tentacleCount) * Math.PI * 2;
    const line = new THREE.Line(new THREE.BufferGeometry(), tentacleMat.clone());
    line.userData = {
      a,
      len: DATA.tentacleLengthRatio * (0.72 + pseudo(i * 19.17) * 0.62),
      phase: pseudo(i * 7.31) * Math.PI * 2,
      curl: 0.08 + pseudo(i * 3.7) * 0.18,
      pts: Array.from({ length: isMobile ? 14 : 20 }, () => new THREE.Vector3())
    };
    tentacles.push(line);
    root.add(line);
  }

  const moteCount = isMobile ? 90 : 170;
  const motePos = new Float32Array(moteCount * 3);
  const moteSeed = new Float32Array(moteCount);
  for (let i = 0; i < moteCount; i++) moteSeed[i] = pseudo(i * 11.11);
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const moteMat = new THREE.PointsMaterial({ color: 0x8ff4ff, size: isMobile ? 0.018 : 0.024, transparent: true, opacity: 0.50, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  const motes = new THREE.Points(moteGeo, moteMat);
  root.add(motes);

  let w = 1, h = 1, mouseX = 0, scrollLocal = 0;
  function resize() {
    const r = section.getBoundingClientRect();
    w = Math.max(1, Math.floor(r.width));
    h = Math.max(1, Math.floor(Math.min(innerHeight * 0.92, Math.max(520, r.height))));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize, { passive: true });
  addEventListener('pointermove', e => { mouseX = (e.clientX / Math.max(1, innerWidth) - 0.5) * 2; }, { passive: true });
  resize();

  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    const rect = section.getBoundingClientRect();
    const visible = rect.bottom > -160 && rect.top < innerHeight + 160;
    if (visible) {
      const span = Math.max(1, rect.height + innerHeight);
      scrollLocal = THREE.MathUtils.clamp((innerHeight - rect.top) / span, 0, 1);
      const beat = pulseShape(t * DATA.pulseHz, DATA.recoveryBias);
      const contract = 1 - DATA.contraction * beat;
      const lift = Math.sin(t * DATA.driftSpeed + scrollLocal * 1.7) * 0.13;

      root.position.set(0.15 + Math.sin(t * 0.045) * 0.16, -0.06 + lift, 0);
      root.rotation.set(-0.58 + Math.sin(t * 0.05) * 0.035, t * 0.035 + mouseX * 0.045, Math.sin(t * 0.037) * 0.04);
      root.scale.set(2.18 * contract, 2.18 * (1 + beat * 0.045), 2.18);
      bellMat.opacity = 0.40 + beat * 0.10;
      bellMat.emissiveIntensity = 0.42 + beat * 0.30;
      rimLine.scale.setScalar(1 + beat * 0.055);
      canalGroup.scale.setScalar(1 + beat * 0.035);

      for (const line of tentacles) updateTentacle(line, t, beat);
      for (let i = 0; i < moteCount; i++) {
        const s = moteSeed[i];
        const a = s * Math.PI * 2 + t * (0.025 + s * 0.03);
        const rr = 0.18 + (pseudo(i * 5.37) ** 0.55) * 1.22;
        motePos[i * 3] = Math.cos(a) * rr;
        motePos[i * 3 + 1] = -0.14 + Math.sin(a * 1.9 + t * 0.08) * 0.18;
        motePos[i * 3 + 2] = Math.sin(a) * rr * 0.62 + Math.cos(t * 0.1 + s * 6) * 0.18;
      }
      moteGeo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function buildBellGeometry(data, seg, rings) {
  const pos = [], idx = [];
  for (let r = 0; r <= rings; r++) {
    const v = r / rings;
    const radius = Math.sin(v * Math.PI * 0.5);
    const z = Math.cos(v * Math.PI * 0.5) * data.bellHeightRatio;
    for (let s = 0; s < seg; s++) {
      const a = (s / seg) * Math.PI * 2;
      const lobes = 1 + Math.sin(a * data.marginLobes) * 0.012 * v * v;
      const x = Math.cos(a) * radius * lobes;
      const y = Math.sin(a) * radius * lobes;
      pos.push(x, y, z - 0.02 * v);
    }
  }
  for (let r = 0; r < rings; r++) for (let s = 0; s < seg; s++) {
    const a = r * seg + s, b = r * seg + (s + 1) % seg, c = (r + 1) * seg + s, d = (r + 1) * seg + (s + 1) % seg;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function makeOralArm(i, n, mat) {
  const a = (i / n) * Math.PI * 2 + Math.PI / 4;
  const pts = [];
  for (let k = 0; k < 56; k++) {
    const u = k / 55;
    pts.push(new THREE.Vector3(Math.cos(a + Math.sin(u * 6) * 0.06) * (0.12 + u * 0.12), Math.sin(a + Math.cos(u * 5) * 0.06) * (0.12 + u * 0.12), -u * 0.82 - Math.sin(u * Math.PI) * 0.08));
  }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat.clone());
}

function updateTentacle(line, t, beat) {
  const { a, len, phase, curl, pts } = line.userData;
  const baseR = 1.0 + beat * 0.045;
  const side = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
  const tangent = new THREE.Vector3(-Math.sin(a), Math.cos(a), 0);
  for (let k = 0; k < pts.length; k++) {
    const u = k / (pts.length - 1);
    const wave = Math.sin(t * 0.72 + phase + u * 6.2) * curl * u;
    const slow = Math.sin(t * 0.18 + phase * 0.7 + u * 2.1) * 0.07 * u;
    pts[k].copy(side).multiplyScalar(baseR - u * 0.05).addScaledVector(tangent, wave).addScaledVector(side, slow);
    pts[k].z = -u * len - 0.04 * Math.sin(u * Math.PI + phase);
  }
  line.geometry.setFromPoints(pts);
  line.material.opacity = 0.12 + 0.14 * (1 - beat * 0.35);
}

function circlePoints(r, n, z = 0) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z);
  });
}
function pulseShape(x, bias) {
  const p = x - Math.floor(x);
  return p < bias ? Math.sin((p / bias) * Math.PI) ** 1.7 : Math.sin(((1 - p) / (1 - bias)) * Math.PI * 0.5) ** 2;
}
function pseudo(x) { return (Math.sin(x * 127.1) * 43758.5453123) % 1 + ((Math.sin(x * 127.1) * 43758.5453123) % 1 < 0 ? 1 : 0); }
