/* scryx / data spine — real CT-derived vertebrae (Three.js)
   Bone meshes: BodyParts3D / Anatomography 4.3, © DBCLS — CC BY-SA 2.1 JP.
   12 real vertebrae (C3–L5) in their natural anatomical curve, threaded by
   a glowing data core, helix traces hugging the actual bone radii, side
   connector nodes and HTML panels. Camera descends the column on scroll. */
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 760px)').matches;
const lowPower = reduceMotion || isMobile || (navigator.hardwareConcurrency || 8) <= 4;

const canvas = document.getElementById('spine-canvas');

// top → bottom anatomical order
const VERTEBRAE = ['c3', 'c5', 'c7', 't2', 't4', 't6', 't8', 't10', 't12', 'l1', 'l3', 'l5'];

if (!canvas || reduceMotion) {
  // leave the existing GLSL core canvas as the visual fallback
} else {
  boot();
}

function boot() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1 : 1.4));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x030304, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  window.__spineBooted = true;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030304, 0.03);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 160);
  camera.position.set(0, 1.2, 10);
  window.__spineCamera = camera;

  scene.add(new THREE.AmbientLight(0x35304a, 2.1));
  const coreLight = new THREE.PointLight(0x35d8ff, 30, 18, 1.8);
  scene.add(coreLight);
  const rimLight = new THREE.PointLight(0x8f4dff, 70, 60, 1.5);
  rimLight.position.set(7, 9, 8);
  scene.add(rimLight);
  const backLight = new THREE.DirectionalLight(0x4a3a70, 1.0);
  backLight.position.set(-5, -6, -8);
  scene.add(backLight);

  // ---------- particle field (independent of mesh loading) ----------
  const SPINE_H = 56;
  const COUNT = lowPower ? 1600 : 4200;
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 6 + Math.random() * 26;
    const th = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * SPINE_H * 1.2;
    pos[i * 3] = Math.cos(th) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(th) * r;
    seed[i * 3] = Math.random(); seed[i * 3 + 1] = Math.random(); seed[i * 3 + 2] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2(9, 9) },
      uPixelRatio: { value: renderer.getPixelRatio() }
    },
    vertexShader: `
      attribute vec3 aSeed; uniform float uTime,uScroll,uPixelRatio; uniform vec2 uMouse;
      varying float vA; varying float vMix;
      void main(){
        vec3 p = position;
        float t = uTime * (0.12 + aSeed.x * 0.22);
        p.x += sin(t + aSeed.y * 6.283) * 0.55;
        p.y += cos(t * 0.8 + aSeed.z * 6.283) * 0.55 + uScroll * -6.0;
        p.z += sin(t * 0.6 + aSeed.x * 6.283) * 0.55;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vec4 clip = projectionMatrix * mv;
        vec2 ndc = clip.xy / clip.w;
        vec2 d = ndc - uMouse;
        float dist = length(d);
        float push = smoothstep(0.35, 0.0, dist);
        ndc += normalize(d + 1e-4) * push * 0.12;
        vA = 0.34 + aSeed.z * 0.5 + push * 0.4;
        vMix = aSeed.y;
        gl_Position = vec4(ndc * clip.w, clip.z, clip.w);
        gl_PointSize = (1.6 + aSeed.x * 2.8 + push * 2.4) * uPixelRatio * clamp(6.0 / max(0.1, -mv.z), 0.6, 3.2);
      }`,
    fragmentShader: `
      varying float vA; varying float vMix;
      void main(){
        vec2 uv = gl_PointCoord - 0.5; float d = length(uv);
        float a = smoothstep(0.5, 0.0, d) * vA;
        vec3 cyan = vec3(0.286, 0.902, 1.0);
        vec3 violet = vec3(0.651, 0.451, 1.0);
        gl_FragColor = vec4(mix(cyan, violet, vMix), a);
      }`
  });
  scene.add(new THREE.Points(pGeo, pMat));

  // ---------- shared state ----------
  const mouse = new THREE.Vector2(9, 9);
  addEventListener('pointermove', e => {
    mouse.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
  }, { passive: true });

  let scroll = 0;
  const onScroll = () => { const max = Math.max(1, document.documentElement.scrollHeight - innerHeight); scroll = Math.min(1, Math.max(0, scrollY / max)); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  const clock = new THREE.Clock();
  const camTarget = new THREE.Vector3();
  const focusPt = new THREE.Vector3();
  const proj = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  let frameCount = 0;
  window.__spineFocus = -1;

  // ---------- load real vertebra meshes, then build the scene ----------
  const loader = new OBJLoader();
  const baseUrl = 'assets/models/spine/';
  Promise.all(VERTEBRAE.map(name =>
    new Promise((res, rej) => loader.load(`${baseUrl}${name}.obj`, res, undefined, rej))
  )).then(objects => buildSpine(objects)).catch(err => console.warn('spine meshes failed, particles only', err));

  function buildSpine(objects) {
    const spine = new THREE.Group();
    scene.add(spine);

    // anatomical data: Z-up, millimeters → rotate to Y-up, scale to world
    const boneMatBase = new THREE.MeshStandardMaterial({ color: 0x2b3550, metalness: 0.82, roughness: 0.26, emissive: 0x0b1626, emissiveIntensity: 1 });
    const wireMat = new THREE.LineBasicMaterial({ color: 0x49e6ff, transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false });
    const fresnelMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
      vertexShader: `varying vec3 vN; varying vec3 vV;
        void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vN; varying vec3 vV;
        void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.4); gl_FragColor = vec4(vec3(0.29, 0.9, 1.0), f * 0.4); }`
    });
    const ringFocusMat = new THREE.MeshBasicMaterial({ color: 0x49e6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const discMat = new THREE.MeshBasicMaterial({ color: 0x2fd6ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

    // raw centroids in anatomical mm space define the shared frame
    const rawGeos = objects.map(obj => {
      let g = null;
      obj.traverse(c => { if (c.isMesh && !g) g = c.geometry; });
      g.computeBoundingBox();
      return g;
    });
    const rawCenters = rawGeos.map(g => g.boundingBox.getCenter(new THREE.Vector3()));
    const mid = rawCenters.reduce((a, c) => a.add(c), new THREE.Vector3()).multiplyScalar(1 / rawCenters.length);
    const topC = rawCenters[0];
    const S = SPINE_H / Math.abs(topC.z - rawCenters[rawCenters.length - 1].z); // mm → world

    // normalized holders at world-space centroids, anatomical orientation kept
    const vertebrae = [];
    const centers = [];
    const qFix = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); // Z-up → Y-up
    const focusColor = new THREE.Color(0x2fd6ff);
    for (let i = 0; i < objects.length; i++) {
      const geo = rawGeos[i];
      const c = rawCenters[i];
      const mat = boneMatBase.clone();
      mat.emissive = new THREE.Color(0x0a1420);
      const local = geo.clone().translate(-c.x, -c.y, -c.z);
      const inner = new THREE.Group();
      inner.add(new THREE.Mesh(local, mat), new THREE.Mesh(local, fresnelMat), new THREE.LineSegments(new THREE.WireframeGeometry(local), wireMat));
      const focusRing = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 6, 40), ringFocusMat.clone());
      focusRing.rotation.x = Math.PI / 2;
      inner.add(focusRing);
      inner.quaternion.copy(qFix);
      inner.scale.setScalar(S);
      inner.rotation.z = Math.sin(i * 7.3) * 0.02; // micro variation, ±~1°
      const holder = new THREE.Group();
      holder.add(inner);
      const world = new THREE.Vector3(
        (c.x - mid.x) * S,
        (topC.z - c.z) * S - SPINE_H / 2,
        -(c.y - mid.y) * S
      );
      holder.position.copy(world);
      spine.add(holder);
      holder.userData = { geo, mat, inner, focusRing, center: world, phase: i * 1.7, focusK: 0 };
      centers.push(world);
      vertebrae.push(holder);
    }

    // the real spinal curve through the actual centroids
    const spineCurve = new THREE.CatmullRomCurve3(centers, false, 'centripetal', 0.5);

    // sampled frames + local bone radius profile (traces hug the anatomy)
    const SAMPLES = 256;
    const frames = spineCurve.computeFrenetFrames(SAMPLES, false);
    const P = [], Nf = [], Bf = [], R = [];
    for (let i = 0; i <= SAMPLES; i++) {
      P.push(spineCurve.getPointAt(i / SAMPLES));
      Nf.push(frames.normals[Math.min(i, SAMPLES - 1)]);
      Bf.push(frames.binormals[Math.min(i, SAMPLES - 1)]);
      R.push(2.4);
    }
    // radius profile from real bounding boxes
    const tOf = [];
    for (let i = 0; i < vertebrae.length; i++) {
      const geo = vertebrae[i].userData.geo;
      const bb = geo.boundingBox;
      const hx = (bb.max.x - bb.min.x) * S * 0.5;
      const hz = (bb.max.y - bb.min.y) * S * 0.5; // anatomical Y → world Z
      const rBone = Math.max(hx, hz) * 0.82;
      // find curve parameter closest to this centroid
      let best = 0, bestD = 1e9;
      for (let k = 0; k <= SAMPLES; k++) {
        const d = P[k].distanceToSquared(centers[i]);
        if (d < bestD) { bestD = d; best = k; }
      }
      tOf.push(best / SAMPLES);
      for (let k = 0; k <= SAMPLES; k++) {
        const w = Math.max(0, 1 - Math.abs(k / SAMPLES - best / SAMPLES) * vertebrae.length * 0.55);
        R[k] = Math.max(R[k], 2.4 + (rBone - 2.4) * w);
      }
      vertebrae[i].userData.t = best / SAMPLES;
      vertebrae[i].userData.rBone = rBone;
    }

    // intervertebral glow discs between real neighbours
    const up = new THREE.Vector3(0, 1, 0);
    const discGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.08, 14, 1);
    for (let i = 0; i < vertebrae.length - 1; i++) {
      const tMid = (tOf[i] + tOf[i + 1]) / 2;
      const idx = Math.round(tMid * SAMPLES);
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.position.copy(P[idx]);
      disc.quaternion.setFromUnitVectors(up, frames.tangents[Math.min(idx, SAMPLES - 1)]);
      const r = (vertebrae[i].userData.rBone + vertebrae[i + 1].userData.rBone) * 0.32;
      disc.scale.set(r, 1, r);
      spine.add(disc);
    }

    // ---------- glowing core threading the vertebral canal ----------
    const core = new THREE.Mesh(
      new THREE.TubeGeometry(spineCurve, 160, 0.045, 8, false),
      new THREE.MeshBasicMaterial({ color: 0x54e9ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    const coreGlow = new THREE.Mesh(
      new THREE.TubeGeometry(spineCurve, 80, 0.2, 8, false),
      new THREE.MeshBasicMaterial({ color: 0x1fb9e6, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    spine.add(core, coreGlow);
    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xbdf6ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    spine.add(pulse);

    // ---------- helix traces hugging the real bone radii ----------
    const traceDefs = [
      { off: 0.55, winds: 6.0, phase: 0, dir: 1, color: 0x6fe7ff, op: 0.32 },
      { off: 1.0, winds: 4.2, phase: 2.1, dir: -1, color: 0xb98cff, op: 0.22 },
      { off: 0.3, winds: 8.0, phase: 4.2, dir: 1, color: 0xdff7ff, op: 0.15 }
    ];
    const sampleFrame = (t, out, nOut, bOut) => {
      const f = Math.min(0.9999, Math.max(0, t)) * SAMPLES;
      const i0 = Math.floor(f), i1 = Math.min(SAMPLES, i0 + 1), k = f - i0;
      out.lerpVectors(P[i0], P[i1], k);
      if (nOut) nOut.lerpVectors(Nf[i0], Nf[i1], k).normalize();
      if (bOut) bOut.lerpVectors(Bf[i0], Bf[i1], k).normalize();
      return (R[i0] || 3) * (1 - k) + (R[i1] || 3) * k;
    };
    const nTmp = new THREE.Vector3(), bTmp = new THREE.Vector3();
    const tracePoint = (def, t, out = new THREE.Vector3()) => {
      const r = sampleFrame(t, out, nTmp, bTmp) + def.off;
      const a = t * Math.PI * 2 * def.winds * def.dir + def.phase;
      return out.addScaledVector(nTmp, Math.cos(a) * r).addScaledVector(bTmp, Math.sin(a) * r);
    };
    for (const def of traceDefs) {
      const pts = [];
      for (let i = 0; i <= 280; i++) pts.push(tracePoint(def, i / 280, new THREE.Vector3()));
      spine.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: def.color, transparent: true, opacity: def.op, blending: THREE.AdditiveBlending, depthWrite: false })
      ));
    }
    const PACKET_N = lowPower ? 12 : 22;
    const packetPos = new Float32Array(PACKET_N * 3);
    const packets = Array.from({ length: PACKET_N }, (_, i) => ({ def: traceDefs[i % traceDefs.length], t: Math.random(), v: 0.02 + Math.random() * 0.05 }));
    const packetGeo = new THREE.BufferGeometry();
    packetGeo.setAttribute('position', new THREE.BufferAttribute(packetPos, 3));
    spine.add(new THREE.Points(packetGeo, new THREE.PointsMaterial({ color: 0x9df1ff, size: 0.15, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })));

    // flying 3D screen panels orbiting the spine (active-theory style)
    // per screen: [key, name, kind, poster image, ambient video loop (optional)]
    const screens = [];
    const projectScreens = [
      ['gesture', '01 gesture vision', 'cv / yolo', 'assets/projects/gesture/gesture-1.jpg', 'assets/videos/gesture-loop.mp4'],
      ['squad', '02 squad qa', 'nlp / qa', 'assets/projects/nlp/finetuning-large-language-models.pdf.png', null],
      ['rl', '03 dqn racing', 'rl / vision', 'assets/projects/DQN-Car.png', 'assets/videos/rl-loop.mp4'],
      ['emotion', '04 emotion stream', 'realtime cv', null, null],
      ['ubique', '05 ubiquepulse', 'iot / systems', 'assets/projects/IOT.png', null],
      ['alpaca', '06 alpaca markets', 'markets / agent', 'assets/projects/stocks.png', null],
      ['foundations', '07 foundations', 'math / cs', 'assets/projects/foundations/turmites.png', null]
    ];
    // wires a looping video onto a screen mesh; canvas poster stays as fallback
    function attachVideo(screenMesh, url) {
      if (!url || !screenMesh) return;
      const vid = document.createElement('video');
      vid.muted = true; vid.loop = true; vid.playsInline = true; vid.autoplay = true;
      vid.preload = 'metadata';
      vid.style.display = 'none';
      document.body.appendChild(vid);
      let swapped = false;
      const swap = () => {
        if (swapped || vid.readyState < 2 || !vid.videoWidth) return;
        swapped = true;
        const vt = new THREE.VideoTexture(vid);
        vt.colorSpace = THREE.SRGBColorSpace;
        screenMesh.material.map = vt;
        screenMesh.material.needsUpdate = true;
        vid.play().catch(() => {});
      };
      vid.addEventListener('error', () => { vid.remove(); }, { once: true });
      vid.addEventListener('loadeddata', swap, { once: true });
      vid.src = url;
      // safety retry for slow loads
      const iv = setInterval(() => { if (swapped) { clearInterval(iv); return; } swap(); }, 1500);
    }
    const texLoader = new THREE.TextureLoader();
    const screenGeo = new THREE.PlaneGeometry(1.72, 1.09);
    const frameGeo = new THREE.PlaneGeometry(1.82, 1.2);
    function makeScreenTexture(name, kind, imgUrl, idx) {
      const cv = document.createElement('canvas');
      cv.width = 512; cv.height = 324;
      const g = cv.getContext('2d');
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const draw = img => {
        g.fillStyle = '#05070c';
        g.fillRect(0, 0, 512, 324);
        if (img) {
          const s = Math.max(512 / img.width, 248 / img.height);
          const w = img.width * s, h = img.height * s;
          g.globalAlpha = 0.92;
          g.drawImage(img, (512 - w) / 2, (248 - h) / 2, w, h);
          g.globalAlpha = 1;
          g.fillStyle = 'rgba(5,7,12,.28)';
          g.fillRect(0, 0, 512, 248);
        } else {
          // typographic fallback panel (no photo yet)
          g.strokeStyle = 'rgba(73,230,255,.35)';
          g.lineWidth = 1.5;
          for (let r = 0; r < 5; r++) {
            g.beginPath();
            g.arc(256, 124, 26 + r * 18, r * 0.7, r * 0.7 + 4.4);
            g.stroke();
          }
          g.fillStyle = 'rgba(73,230,255,.8)';
          g.font = '700 13px ui-monospace, Menlo, monospace';
          g.textAlign = 'center';
          g.fillText('SIGNAL RECOVERY PENDING', 256, 128);
        }
        const grad = g.createLinearGradient(0, 220, 0, 324);
        grad.addColorStop(0, 'rgba(5,7,12,0)');
        grad.addColorStop(0.35, '#05070c');
        g.fillStyle = grad;
        g.fillRect(0, 210, 512, 114);
        g.fillStyle = '#49e6ff';
        g.fillRect(22, 262, 26, 2);
        g.textAlign = 'left';
        g.font = '800 21px ui-monospace, Menlo, monospace';
        g.fillStyle = '#eaf6ff';
        g.fillText(name.toUpperCase(), 22, 292);
        g.font = '700 13px ui-monospace, Menlo, monospace';
        g.fillStyle = 'rgba(157,148,181,.9)';
        g.fillText(kind.toUpperCase(), 22, 312);
        g.textAlign = 'right';
        g.fillStyle = 'rgba(73,230,255,.75)';
        g.fillText(String(idx + 1).padStart(2, '0') + ' / ' + String(projectScreens.length).padStart(2, '0'), 490, 312);
        tex.needsUpdate = true;
      };
      if (imgUrl) {
        const im = new Image();
        im.onload = () => draw(im);
        im.onerror = () => draw(null);
        im.src = imgUrl;
      } else draw(null);
      return tex;
    }
    if (!isMobile) {
      projectScreens.forEach(([key, name, kind, img, vid], i) => {
        const grp = new THREE.Group();
        const frame = new THREE.Mesh(frameGeo, new THREE.MeshBasicMaterial({ color: 0x0b1420, transparent: true, opacity: 0.92 }));
        frame.position.z = -0.012;
        const edge = new THREE.Mesh(new THREE.PlaneGeometry(1.82, 1.2), new THREE.MeshBasicMaterial({ color: 0x2fd6ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));
        edge.position.z = -0.02;
        edge.scale.setScalar(1.02);
        const screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: makeScreenTexture(name, kind, img, i), transparent: true }));
        if (vid) attachVideo(screen, vid);
        grp.add(frame, edge, screen);
        const vi = Math.min(i * 2, vertebrae.length - 1);
        spine.add(grp);
        screens.push({
          key, grp, screen, frame, edge,
          tHome: 0.06 + (i / (projectScreens.length - 1)) * 0.88,
          tOff: Math.sin(i * 3.7) * 0.04,
          radius: 2.5 + (i % 3) * 0.6,
          speed: (i % 2 ? -1 : 1) * (0.2 + (i % 3) * 0.06),
          phase: i * 2.13,
          vertIdx: vi,
          hoverK: 0,
          line: null
        });
      });
      const screenLineMat = new THREE.LineBasicMaterial({ color: 0x6fe7ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });
      for (const s of screens) {
        const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        s.line = new THREE.Line(g, screenLineMat);
        spine.add(s.line);
      }
      window.__spineScreens = screens;
    }

    // ---------- branch nodes + HTML panels ----------
    const panelRoot = document.getElementById('spine-panels');
    const anchors = [];
    const nodeLineMat = new THREE.LineBasicMaterial({ color: 0x8fdcff, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false });
    const tipGeo = new THREE.OctahedronGeometry(0.085, 0);
    const cyanMat = new THREE.MeshBasicMaterial({ color: 0x49e6ff });
    const violetMat = new THREE.MeshBasicMaterial({ color: 0xa673ff });
    const nearestVert = t => {
      let best = 0, bd = 9;
      for (let i = 0; i < tOf.length; i++) { const d = Math.abs(tOf[i] - t); if (d < bd) { bd = d; best = i; } }
      return best;
    };

    function addAnchor(t, side, lift, label, kind, onClick) {
      const p = new THREE.Vector3();
      const r = sampleFrame(t, p, nTmp, bTmp);
      const base = p.clone().addScaledVector(nTmp, side * r * 0.55);
      const world = p.clone()
        .addScaledVector(nTmp, side * (r + (kind === 'prime' ? 1.7 : 1.25)))
        .addScaledVector(bTmp, lift);
      spine.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([base, world]), nodeLineMat));
      const isPrime = kind === 'prime';
      const node = new THREE.Mesh(isPrime ? new THREE.IcosahedronGeometry(0.22, 0) : tipGeo, isPrime || side > 0 ? cyanMat : violetMat);
      node.position.copy(world);
      spine.add(node);
      const entry = { node, el: null, sideL: side < 0, halo: null };
      if (isPrime) {
        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(0.42, 0.02, 6, 40),
          new THREE.MeshBasicMaterial({ color: 0x49e6ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        halo.position.copy(world);
        spine.add(halo);
        entry.halo = halo;
      }
      if (panelRoot && !isMobile) {
        let el;
        if (onClick) {
          el = document.createElement('button');
          el.type = 'button';
          el.addEventListener('click', onClick);
          const vi = nearestVert(t);
          el.addEventListener('pointerenter', () => { window.__spineFocus = vi; });
          el.addEventListener('pointerleave', () => { if (window.__spineFocus === vi) window.__spineFocus = -1; });
        } else {
          el = document.createElement('span');
        }
        el.className = kind === 'chip' ? 'spine-chip' : `spine-node ${kind}`;
        el.dataset.side = side > 0 ? 'r' : 'l';
        el.innerHTML = `<i></i><em>${label}</em>`;
        panelRoot.appendChild(el);
        entry.el = el;
      }
      anchors.push(entry);
    }

    // concept chain from the sketch: surface ─ trace ─ evidence ─ signal ─ pattern
    addAnchor(0.03, -1, 0.35, 'surface', 'node');
    addAnchor(0.21, 1, 0.05, 'trace', 'node');
    addAnchor(0.5, 1, 0, 'project / evidence', 'prime');
    addAnchor(0.77, -1, -0.05, 'signal', 'node');
    addAnchor(0.97, -1, -0.35, 'pattern', 'node');

    const screenWorld = new THREE.Vector3();

    // ---------- satellite swarm: small flying things around the column ----------
    const satGeos = [new THREE.TetrahedronGeometry(0.09), new THREE.OctahedronGeometry(0.08), new THREE.BoxGeometry(0.11, 0.11, 0.11)];
    const satMats = [cyanMat, violetMat, new THREE.MeshBasicMaterial({ color: 0xdff7ff })];
    const sats = [];
    const SAT_N = lowPower ? 8 : 14;
    for (let i = 0; i < SAT_N; i++) {
      const m = new THREE.Mesh(satGeos[i % 3], satMats[i % 3]);
      spine.add(m);
      sats.push({ m, t: Math.random(), v: (0.008 + Math.random() * 0.02) * (i % 2 ? 1 : -1), r: 1.6 + Math.random() * 2.6, sp: (Math.random() * 0.7 + 0.3) * (i % 2 ? 1 : -1), ph: Math.random() * Math.PI * 2 });
    }

    // ---------- click ripples ----------
    const ripples = [];
    const rippleGeo = new THREE.TorusGeometry(0.5, 0.02, 6, 48);
    const zAxis = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(rippleGeo, new THREE.MeshBasicMaterial({ color: 0x6fe7ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.visible = false;
      spine.add(m);
      ripples.push({ m, t0: -9 });
    }
    let rippleIdx = 0;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    addEventListener('pointerdown', e => {
      if (e.target.closest('button, a, dialog, .spine-chip, input, textarea')) return;
      ndc.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
      raycaster.setFromCamera(ndc, camera);
      let best = 0, bestD = 1e9;
      for (let i = 0; i <= 64; i++) {
        const d = raycaster.ray.distanceToPoint(spineCurve.getPointAt(i / 64, tmpV));
        if (d < bestD) { bestD = d; best = i / 64; }
      }
      if (bestD > 6) return;
      const r = ripples[rippleIdx++ % ripples.length];
      r.t0 = clock.elapsedTime;
      r.m.position.copy(spineCurve.getPointAt(best, tmpV));
      const idx = Math.round(best * (SAMPLES - 1));
      r.m.quaternion.setFromUnitVectors(zAxis, frames.tangents[idx]);
      r.m.visible = true;
    });

    // hover + click on the flying 3D screens
    let hoverScreen = null;
    const screenMeshes = [];
    for (const s of screens) { screenMeshes.push(s.screen); s.screen.userData.owner = s; s.frame.userData.owner = s; screenMeshes.push(s.frame); }
    addEventListener('pointermove', e => {
      if (!screens.length) return;
      ndc.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(screenMeshes, false)[0];
      const s = hit ? hit.object.userData.owner : null;
      if (s !== hoverScreen) {
        hoverScreen = s;
        window.__spineFocus = s ? s.vertIdx : -1;
        window.__spineHoverLabel = s ? 'open' : '';
        document.dispatchEvent(new CustomEvent('spine-hover'));
      }
    }, { passive: true });
    addEventListener('pointerdown', e => {
      if (hoverScreen && !e.target.closest('dialog')) {
        window.openProject?.(hoverScreen.key);
      }
    });

    function updatePanels() {
      if (!panelRoot) return;
      spine.updateMatrixWorld();
      for (const a of anchors) {
        if (!a.el) continue;
        proj.copy(a.node.position).applyMatrix4(spine.matrixWorld).project(camera);
        const behind = proj.z > 1 || proj.z < -1;
        const x = (proj.x * 0.5 + 0.5) * innerWidth;
        const y = (-proj.y * 0.5 + 0.5) * innerHeight;
        const off = behind || x < -90 || x > innerWidth + 90 || y < -50 || y > innerHeight + 50;
        a.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(${a.sideL ? '-100%' : '0'}, -50%)`;
        a.el.classList.toggle('off', off);
      }
    }

    (function frame() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      frameCount++;
      pMat.uniforms.uTime.value = t;
      pMat.uniforms.uScroll.value = scroll;
      pMat.uniforms.uMouse.value.lerp(mouse, 0.1);

      // data pulse riding the core, cyan light follows
      const pt = (t * 0.05) % 1;
      spineCurve.getPointAt(pt, tmpV);
      pulse.position.copy(tmpV);
      coreLight.position.copy(tmpV);
      coreLight.intensity = 20 + Math.sin(t * 5.2) * 7;
      discMat.opacity = 0.4 + Math.sin(t * 2) * 0.14;

      // packets on the traces
      for (let i = 0; i < PACKET_N; i++) {
        const pk = packets[i];
        pk.t = (pk.t + dt * pk.v) % 1;
        tracePoint(pk.def, pk.t, tmpV);
        packetPos[i * 3] = tmpV.x; packetPos[i * 3 + 1] = tmpV.y; packetPos[i * 3 + 2] = tmpV.z;
      }
      packetGeo.attributes.position.needsUpdate = true;

      // vertebrae: subtle breathing + focus glow from chip hover
      const focus = window.__spineFocus;
      for (let i = 0; i < vertebrae.length; i++) {
        const h = vertebrae[i], u = h.userData;
        const target = focus === i ? 1 : 0;
        u.focusK += (target - u.focusK) * 0.12;
        u.mat.emissive.setHex(0x0a1420).lerp(focusColor, u.focusK * 0.5);
        u.mat.emissiveIntensity = 1 + u.focusK * 5;
        u.focusRing.material.opacity = u.focusK * 0.85;
        u.focusRing.scale.setScalar(1 + u.focusK * 0.4);
        u.focusRing.rotation.z = t * 1.2;
        const s = 1 + Math.sin(t * 1.4 + u.phase) * 0.008 + u.focusK * 0.05;
        u.inner.scale.setScalar(S * s);
        u.inner.rotation.y = Math.sin(t * 0.5 + u.phase) * 0.012;
      }

      // flying screens orbit the column as real 3D planes, tethered to their vertebra
      for (const s of screens) {
        const ts = Math.min(0.995, Math.max(0.005, s.tHome + Math.sin(t * 0.12 + s.phase) * 0.02 + s.tOff));
        const baseR = sampleFrame(ts, screenWorld, nTmp, bTmp); // spine space
        const a = s.phase + t * s.speed;
        screenWorld.addScaledVector(nTmp, Math.cos(a) * (baseR + s.radius))
                   .addScaledVector(bTmp, Math.sin(a) * (baseR + s.radius) * 0.8)
                   .addScaledVector(frames.tangents[Math.min(SAMPLES - 1, Math.round(ts * SAMPLES))], Math.sin(t * 0.6 + s.phase) * 0.3);
        s.grp.position.copy(screenWorld);
        s.grp.lookAt(camera.position);          // soft billboard, keeps real depth/parallax
        s.grp.rotateZ(Math.sin(t * 0.4 + s.phase) * 0.05); // gentle screen tilt
        s.hoverK += ((hoverScreen === s ? 1 : 0) - s.hoverK) * 0.15;
        s.grp.scale.setScalar(1 + s.hoverK * 0.14);
        s.edge.material.opacity = 0.12 + s.hoverK * 0.75;
        const lp = s.line.geometry.attributes.position;
        lp.setXYZ(0, centers[s.vertIdx].x, centers[s.vertIdx].y, centers[s.vertIdx].z);
        lp.setXYZ(1, screenWorld.x, screenWorld.y, screenWorld.z);
        lp.needsUpdate = true;
        s.line.material.opacity = 0.16 + s.hoverK * 0.5;
      }

      // satellites swarm
      for (const sat of sats) {
        sat.t = (sat.t + dt * sat.v + 1) % 1;
        const r0 = sampleFrame(sat.t, tmpV, nTmp, bTmp);
        const sa = sat.ph + t * sat.sp;
        tmpV.addScaledVector(nTmp, Math.cos(sa) * (r0 + sat.r)).addScaledVector(bTmp, Math.sin(sa) * (r0 + sat.r));
        sat.m.position.copy(tmpV);
        sat.m.rotation.x += dt * 1.4; sat.m.rotation.y += dt * 0.9;
      }

      // branch nodes
      for (const a of anchors) {
        a.node.rotation.y += dt * 0.9;
        a.node.rotation.x += dt * 0.35;
        if (a.halo) { a.halo.rotation.y = t * 0.7; a.halo.rotation.x = Math.sin(t * 0.6) * 0.6; }
      }

      // ripples
      for (const r of ripples) {
        if (!r.m.visible) continue;
        const k = (t - r.t0) / 1.1;
        if (k >= 1) { r.m.visible = false; continue; }
        r.m.scale.setScalar(0.5 + k * 5.4);
        r.m.material.opacity = (1 - k) * 0.75;
      }

      // gentle whole-column sway
      spine.rotation.y = Math.sin(t * 0.09) * 0.04 + mouse.x * 0.02;

      // camera descends the real curve with a slow orbit — close, AT-style
      const path = Math.min(0.94, scroll * 0.94);
      spineCurve.getPointAt(Math.min(1, path + 0.04), focusPt);
      const ang = scroll * Math.PI * 1.7 + t * 0.045 + mouse.x * 0.3;
      const rad = 6.1 + Math.sin(scroll * Math.PI * 2.4) * 1.1;
      camera.position.set(
        focusPt.x + Math.cos(ang) * rad,
        focusPt.y + 2.1 + Math.sin(t * 0.3) * 0.25 + mouse.y * 0.7,
        focusPt.z + Math.sin(ang) * rad
      );
      camTarget.copy(focusPt);
      camTarget.y -= 0.4;
      camera.lookAt(camTarget);
      rimLight.position.set(camera.position.x + 4, camera.position.y + 5, camera.position.z + 5);

      if (frameCount % 2 === 0) updatePanels();
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    })();
  }
}
