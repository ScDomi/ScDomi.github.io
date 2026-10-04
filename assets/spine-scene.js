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

// portrait / narrow viewports need a wider orbit so the column fits the frame
const aspectRadius = () => {
  const a = innerWidth / Math.max(1, innerHeight);
  return THREE.MathUtils.clamp(1.0 / Math.max(0.55, a / 1.4), 1.0, 2.1);
};

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

  // ---------- particle field: dense organic swarm (active-theory style) ----------
  // thousands of motes forming a swirling cloud that gathers around the column
  const SPINE_H = 46;
  const COUNT = lowPower ? 1600 : (isMobile ? 2400 : 9000);
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT * 4); // x,y,z,w = random seeds
  for (let i = 0; i < COUNT; i++) {
    // concentrate near the column axis, taper off with radius
    const rr = Math.pow(Math.random(), 0.6);          // bias toward center
    const r = 1.2 + rr * 24;
    const th = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * SPINE_H * 1.3;
    pos[i * 3] = Math.cos(th) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = Math.sin(th) * r;
    seed[i * 4] = Math.random(); seed[i * 4 + 1] = Math.random(); seed[i * 4 + 2] = Math.random(); seed[i * 4 + 3] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2(9, 9) },
      uFocusY: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() }
    },
    vertexShader: `
      attribute vec4 aSeed; uniform float uTime,uScroll,uPixelRatio,uFocusY; uniform vec2 uMouse;
      varying float vA; varying float vMix;
      // cheap curl-ish swirl around the column axis
      void main(){
        vec3 p = position;
        float t = uTime * (0.10 + aSeed.x * 0.24);
        // orbital swirl around Y axis (the column)
        float ang = t * (0.4 + aSeed.y*0.5) + aSeed.z * 6.283;
        float ca = cos(ang*0.15), sa = sin(ang*0.15);
        p.xz = mat2(ca,-sa,sa,ca) * p.xz;
        // gentle bob + turbulence
        p.x += sin(t*1.3 + aSeed.y*6.283) * (0.5 + aSeed.w*0.7);
        p.y += cos(t*0.9 + aSeed.z*6.283) * (0.5 + aSeed.x*0.7) + uScroll * -6.0;
        p.z += sin(t*1.1 + aSeed.x*6.283) * (0.5 + aSeed.y*0.7);
        // attract toward the focus height (forms a denser band near camera focus)
        float gather = exp(-abs(p.y - uFocusY) * 0.05);
        p.y = mix(p.y, uFocusY + sin(aSeed.x*6.283)*4.0, gather*0.35);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vec4 clip = projectionMatrix * mv;
        vec2 ndc = clip.xy / clip.w;
        // mouse repel
        vec2 d = ndc - uMouse;
        float dist = length(d);
        float push = smoothstep(0.4, 0.0, dist);
        ndc += normalize(d + 1e-4) * push * 0.14;
        vA = 0.30 + aSeed.z * 0.5 + push * 0.5;
        vMix = aSeed.y;
        gl_Position = vec4(ndc * clip.w, clip.z, clip.w);
        gl_PointSize = (1.3 + aSeed.x * 3.0 + push * 2.6) * uPixelRatio * clamp(7.0 / max(0.1, -mv.z), 0.5, 3.4);
      }`,
    fragmentShader: `
      varying float vA; varying float vMix;
      void main(){
        vec2 uv = gl_PointCoord - 0.5; float d = length(uv);
        float a = smoothstep(0.5, 0.05, d) * vA;
        vec3 cyan = vec3(0.286, 0.902, 1.0);
        vec3 violet = vec3(0.651, 0.451, 1.0);
        vec3 white = vec3(0.95, 0.98, 1.0);
        vec3 col = mix(cyan, violet, vMix);
        col = mix(col, white, smoothstep(0.85, 1.0, vMix) * 0.6); // few bright sparks
        gl_FragColor = vec4(col, a);
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
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1 : 1.4));
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
  const spineLoad = Promise.all(VERTEBRAE.map(name =>
    new Promise((res, rej) => loader.load(`${baseUrl}${name}.obj`, res, undefined, rej))
  ));
  // Real Drosophila brain mesh from Virtual Fly Brain (VFB_00101567), loaded as OBJ.
  const brainLoad = new Promise((res, rej) => loader.load('assets/models/fly-brain-vfb-00101567-lite.obj', res, undefined, rej)).catch(() => null);
  const jellyLoad = new Promise((res, rej) => loader.load('assets/models/ambient/jellyfish.obj', res, undefined, rej)).catch(() => null);
  Promise.all([spineLoad, brainLoad, jellyLoad]).then(([objects, brain, jelly]) => buildSpine(objects, brain, jelly)).catch(err => console.warn('spine meshes failed, particles only', err));

  function buildSpine(objects, brainObj, jellyObj) {
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

    // ---------- the brain: floating cortex above the spinal column ----------
    // Keep the column visually underneath the brain; the old medulla-fit made vertebrae read like they were sitting on top.
    let brain = null, brainCoreMat = null, brainPulsePts = null;
    const BRAIN_FLOAT_GAP = SPINE_H * 0.18;
    if (brainObj) {
      let bg = null;
      brainObj.traverse(c => { if (c.isMesh && !bg) bg = c.geometry; });
      if (bg) {
        bg.computeBoundingBox();
        const bc = bg.boundingBox.getCenter(new THREE.Vector3());
        const local = bg.clone().translate(-bc.x, -bc.y, -bc.z);
        const brainMat = new THREE.MeshStandardMaterial({ color: 0x6f5bb0, metalness: 0.28, roughness: 0.38, emissive: 0x2b1a52, emissiveIntensity: 1.55, transparent: true, opacity: 0.54 });
        const brainWireMat = new THREE.LineBasicMaterial({ color: 0xd8c7ff, transparent: true, opacity: 0.20, blending: THREE.AdditiveBlending, depthWrite: false });
        const brainWire = new THREE.LineSegments(new THREE.WireframeGeometry(local), brainWireMat);
        const brainInnerWire = new THREE.LineSegments(new THREE.WireframeGeometry(local), new THREE.LineBasicMaterial({ color: 0x49e6ff, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false }));
        brainInnerWire.scale.setScalar(0.985);
        const brainSolid = new THREE.Mesh(local, brainMat);
        const brainFresnel = new THREE.Mesh(local, fresnelMat.clone());
        brainFresnel.material.fragmentShader = fresnelMat.fragmentShader.replace('0.29, 0.9, 1.0', '0.78, 0.55, 1.0'); // visible violet cortex rim
        const bInner = new THREE.Group();
        bInner.add(brainSolid, brainWire, brainInnerWire, brainFresnel);
        bInner.quaternion.copy(qFix);            // anatomical Z-up → Y-up
        const brainHeight = Math.max(1, bg.boundingBox.max.z - bg.boundingBox.min.z);
        const brainScale = (SPINE_H * 0.42) / brainHeight;
        bInner.scale.setScalar(brainScale);
        // position: centroid over the spinal column top, brainstem (low Z of mesh) faces down into C3
        const colTop = centers[0]; // C3 centroid (world)
        bInner.position.set(colTop.x, 0, colTop.z);
        // Float the brain clearly above C3 so the spine reads as hanging below it.
        bInner.position.y = colTop.y + BRAIN_FLOAT_GAP;
        brain = new THREE.Group();
        brain.add(bInner);
        spine.add(brain);
        brain.userData = { inner: bInner, mat: brainMat, phase: 0.0, focusK: 0, solid: brainSolid, brainScale };
        window.__spineBrain = brain;
        window.__spineCenters = centers;
        window.__spineS = S;

        // glowing "neural core" tube running up from the spinal cord into the cortex
        const colTopW = new THREE.Vector3(colTop.x, colTop.y, colTop.z);
        const brainC = new THREE.Vector3().copy(bInner.position);
        const upPath = new THREE.CatmullRomCurve3([
          new THREE.Vector3(colTopW.x, colTopW.y - 0.4, colTopW.z),
          new THREE.Vector3(colTopW.x, colTopW.y + 0.8, colTopW.z),
          new THREE.Vector3(brainC.x, brainC.y - 0.5, brainC.z),
          new THREE.Vector3(brainC.x, brainC.y + 0.9, brainC.z)
        ]);
        brainCoreMat = new THREE.MeshBasicMaterial({ color: 0x8f7bff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
        const brainCore = new THREE.Mesh(new THREE.TubeGeometry(upPath, 40, 0.05, 8, false), brainCoreMat);
        const brainCoreGlow = new THREE.Mesh(new THREE.TubeGeometry(upPath, 20, 0.22, 8, false), new THREE.MeshBasicMaterial({ color: 0x6a4dff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
        spine.add(brainCore, brainCoreGlow);

        // cortical pulse points shimmering over the brain surface
        const bpCount = lowPower ? 120 : 260;
        const bp = new Float32Array(bpCount * 3);
        const bseed = new Float32Array(bpCount);
        // scatter points on the brain bounding surface (approx via random vertices)
        const posAttr = local.getAttribute('position');
        for (let i = 0; i < bpCount; i++) {
          const vi = Math.floor(Math.random() * posAttr.count);
          bp[i*3] = posAttr.getX(vi); bp[i*3+1] = posAttr.getY(vi); bp[i*3+2] = posAttr.getZ(vi);
          bseed[i] = Math.random();
        }
        const bpGeo = new THREE.BufferGeometry();
        bpGeo.setAttribute('position', new THREE.BufferAttribute(bp, 3));
        bpGeo.setAttribute('aSeed', new THREE.BufferAttribute(bseed, 1));
        brainPulsePts = new THREE.Points(bpGeo, new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uTime: { value: 0 } },
          vertexShader: `attribute float aSeed; uniform float uTime; varying float vA;
            void main(){ vec3 p=position; vec4 mv=modelViewMatrix*vec4(p,1.0);
              float tw = 0.5 + 0.5*sin(uTime*(1.5+aSeed*3.0)+aSeed*40.0);
              vA = 0.15 + tw*0.75;
              gl_PointSize = (2.8 + aSeed*4.2) * clamp(7.0/max(0.1,-mv.z),0.75,3.8);
              gl_Position = projectionMatrix*mv; }`,
          fragmentShader: `varying float vA;
            void main(){ vec2 uv=gl_PointCoord-0.5; float d=length(uv);
              float a=smoothstep(0.5,0.0,d)*vA;
              gl_FragColor=vec4(mix(vec3(0.56,0.35,1.0),vec3(0.4,0.9,1.0),vA), a); }`
        }));
        brainPulsePts.quaternion.copy(qFix);
        brainPulsePts.scale.setScalar(brainScale);
        brainPulsePts.position.copy(bInner.position);
        spine.add(brainPulsePts);
      }
    }

    // ---------- ambient "neural jellyfish" drifting in the deep background ----------
    // real CT data: cerebral ventricles + choroid plexus + optic chiasm merged —
    // an organic branching creature that reads like a jellyfish / signal organism.
    let jelly = null, jellyPulsePts = null;
    if (jellyObj) {
      let jg = null;
      jellyObj.traverse(c => { if (c.isMesh && !jg) jg = c.geometry; });
      if (jg) {
        jg.computeBoundingBox();
        const jc = jg.boundingBox.getCenter(new THREE.Vector3());
        const jLocal = jg.clone().translate(-jc.x, -jc.y, -jc.z);
        const jellyMat = new THREE.MeshStandardMaterial({ color: 0x3a2f58, metalness: 0.4, roughness: 0.55, emissive: 0x1c1038, emissiveIntensity: 1.3, transparent: true, opacity: 0.9 });
        const jellyWire = new THREE.LineSegments(new THREE.WireframeGeometry(jLocal), new THREE.LineBasicMaterial({ color: 0x49e6ff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }));
        const jellyFresnel = new THREE.Mesh(jLocal, fresnelMat.clone());
        jellyFresnel.material.fragmentShader = fresnelMat.fragmentShader.replace('0.29, 0.9, 1.0', '0.5, 0.75, 1.0');
        const jInner = new THREE.Group();
        jInner.add(new THREE.Mesh(jLocal, jellyMat), jellyWire, jellyFresnel);
        jInner.quaternion.copy(qFix);
        // world size: about as tall as ~5 vertebrae
        const jHeightMM = jg.boundingBox.max.z - jg.boundingBox.min.z;
        const jScale = (SPINE_H * 0.28) / jHeightMM;
        jInner.scale.setScalar(jScale);
        jelly = new THREE.Group();
        jelly.add(jInner);
        scene.add(jelly); // NOT a child of spine — free-floating in world space
        jelly.userData = { inner: jInner, mat: jellyMat, jScale };
        window.__spineJelly = jelly;

        // shimmering motes across its surface
        const jpCount = lowPower ? 40 : 90;
        const jp = new Float32Array(jpCount * 3);
        const jseed = new Float32Array(jpCount);
        const jposAttr = jLocal.getAttribute('position');
        for (let i = 0; i < jpCount; i++) {
          const vi = Math.floor(Math.random() * jposAttr.count);
          jp[i*3] = jposAttr.getX(vi); jp[i*3+1] = jposAttr.getY(vi); jp[i*3+2] = jposAttr.getZ(vi);
          jseed[i] = Math.random();
        }
        const jpGeo = new THREE.BufferGeometry();
        jpGeo.setAttribute('position', new THREE.BufferAttribute(jp, 3));
        jpGeo.setAttribute('aSeed', new THREE.BufferAttribute(jseed, 1));
        jellyPulsePts = new THREE.Points(jpGeo, brainPulsePts ? brainPulsePts.material.clone() : new THREE.PointsMaterial({ color: 0x9df1ff, size: 0.1, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
        if (jellyPulsePts.material.uniforms) jellyPulsePts.material.uniforms.uTime = { value: 0 };
        jellyPulsePts.quaternion.copy(qFix);
        jellyPulsePts.scale.setScalar(jScale);
        jelly.add(jellyPulsePts);
      }
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

    // (flying screens removed — the project panels live in the artifact grid below;
    //  the spine scene stays a pure atmosphere of particles + traces + the swarm)

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

    // (screens removed — hover/click on them is gone; the artifact grid below
    //  remains the project entry point via window.openProject on the cards)

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

      // brain: slow breathing + cortical shimmer
      if (brain) {
        const bu = brain.userData;
        bu.mat.emissiveIntensity = 1.0 + Math.sin(t * 1.1) * 0.25;
        bu.inner.scale.setScalar(bu.brainScale * (1 + Math.sin(t * 0.9) * 0.01));
        bu.inner.rotation.y = Math.sin(t * 0.22) * 0.03;
        if (brainCoreMat) brainCoreMat.opacity = 0.6 + Math.sin(t * 3.1) * 0.25;
        if (brainPulsePts) brainPulsePts.material.uniforms.uTime.value = t;
      }

      // ambient jellyfish: slow autonomous drift + pulse, parallax off the spine
      if (jelly) {
        const ju = jelly.userData;
        const jt = t * 0.05;
        // hover near the camera focus, gently bobbing — stays loosely in frame
        jelly.position.set(
          focusPt.x - 4.2 + Math.sin(jt * 0.8) * 1.4,
          focusPt.y + 1.2 + Math.sin(jt * 1.1) * 1.6,
          focusPt.z - 2.6 + Math.cos(jt * 0.6) * 1.1
        );
        jelly.rotation.y = jt * 0.5;
        jelly.rotation.z = Math.sin(jt * 0.9) * 0.12;
        const jpulse = 1 + Math.sin(t * 1.6) * 0.05;
        ju.inner.scale.setScalar(ju.jScale * jpulse * 1.2);
        ju.mat.emissiveIntensity = 1.25 + Math.sin(t * 1.6) * 0.45;
        if (jellyPulsePts && jellyPulsePts.material.uniforms) jellyPulsePts.material.uniforms.uTime.value = t;
      }

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

      // camera descends from the brain (top) down the real curve with a slow orbit
      // scroll 0 = brain/hero, scroll 1 = bottom of the column
      const path = Math.min(0.94, scroll * 0.94);
      spineCurve.getPointAt(Math.min(1, path + 0.04), focusPt);
      const ang = scroll * Math.PI * 1.7 + t * 0.045 + mouse.x * 0.3;
      const topness3 = brain ? (1 - Math.min(1, scroll / 0.18)) : 0;
      const rad = (9.5 + Math.sin(scroll * Math.PI * 2.4) * 1.25 + topness3 * 3.2) * aspectRadius();
      camera.position.set(
        focusPt.x + Math.cos(ang) * rad,
        focusPt.y + 3.0 + Math.sin(t * 0.3) * 0.25 + mouse.y * 0.7,
        focusPt.z + Math.sin(ang) * rad
      );
      // look at the column; near the top tilt the gaze up so the brain enters the upper frame
      camTarget.copy(focusPt);
      camTarget.y = focusPt.y - 0.4;
      if (brain) {
        const topness = 1 - Math.min(1, scroll / 0.18);
        camTarget.y = focusPt.y - 0.4 + topness * 1.4; // gentle tilt up, brain sits comfortably in upper frame
      }
      camera.lookAt(camTarget);
      rimLight.position.set(camera.position.x + 4, camera.position.y + 5, camera.position.z + 5);

      if (frameCount % 2 === 0) updatePanels();
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    })();
  }
}
