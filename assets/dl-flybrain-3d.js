/* scryx / DL fly brain — real VFB mesh, interactively explained */
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const flySection = document.getElementById('flywire');
if (flySection && 'IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    document.body.classList.toggle('flywire-visible', entries.some(e => e.isIntersecting && e.intersectionRatio > 0.28));
  }, { threshold: [0, 0.28, 0.55] }).observe(flySection);
}

const canvas = document.getElementById('flyBrainCanvas');
if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) bootFlyBrain(canvas);

function bootFlyBrain(canvas) {
  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.05 : 1.45));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
  camera.position.set(0, 0.9, 8.6);

  scene.add(new THREE.AmbientLight(0x37284f, 2.4));
  const key = new THREE.PointLight(0xa673ff, 70, 18, 1.45);
  key.position.set(3.5, 3.8, 5.5); scene.add(key);
  const cyan = new THREE.PointLight(0x49e6ff, 45, 16, 1.7);
  cyan.position.set(-4.2, -1.6, 4.2); scene.add(cyan);

  const root = new THREE.Group(); scene.add(root);
  const signalGroup = new THREE.Group(); root.add(signalGroup);
  const regionGroup = new THREE.Group(); root.add(regionGroup);

  const state = { mode: 'activity', paused: false, speed: 0.58, lesson: 0 };
  const status = document.getElementById('flyBrainStatus');
  const stat = document.getElementById('flyBrainStat');
  const label = document.getElementById('flyBrainModeLabel');
  const pauseBtn = document.getElementById('flyBrainPause');
  const speedInput = document.getElementById('flyBrainSpeed');
  const modeButtons = [...document.querySelectorAll('[data-fly-mode]')];
  const lessonButtons = [...document.querySelectorAll('[data-fly-lesson]')];

  const lessons = [
    { mode:'activity', label:'shape first', title:'real fly brain mesh active', text:'This is the actual VFB morphology mesh. The glow points are sampled from its surface so your eye reads the 3D structure, not a flat matrix.' },
    { mode:'activity', label:'signal flow', title:'signals ride paths through the brain', text:'Yellow packets move along curved routes: that is the idea of activation propagation — local units passing evidence forward instead of one magic answer appearing.' },
    { mode:'regions', label:'regions', title:'regions are lenses, not boxes', text:'Gold rings slice the morphology into teaching regions. In real neuroscience the borders are anatomical/functional; here they make “which part talks?” visible.' },
    { mode:'wiring', label:'connectome link', title:'matrix = wiring, mesh = place', text:'The matrix below is who talks to whom. The 3D brain above is where that wiring lives. Same lesson: structure shapes computation.' }
  ];

  if (status) status.textContent = 'loading real VFB mesh…';
  if (speedInput) speedInput.addEventListener('input', () => { state.speed = Number(speedInput.value) / 100; updateLessonText(); });
  if (pauseBtn) pauseBtn.addEventListener('click', () => { state.paused = !state.paused; pauseBtn.textContent = state.paused ? 'play' : 'pause'; updateLessonText(); });
  modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.flyMode)));
  lessonButtons.forEach(btn => btn.addEventListener('click', () => setLesson(Number(btn.dataset.flyLesson))));

  const shellMat = new THREE.MeshStandardMaterial({ color: 0x7f5dff, emissive: 0x32186a, emissiveIntensity: 1.95, metalness: 0.22, roughness: 0.36, transparent: true, opacity: 0.58, side: THREE.DoubleSide });
  const wireMat = new THREE.LineBasicMaterial({ color: 0xe2c8ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
  const hotWireMat = new THREE.LineBasicMaterial({ color: 0x62f0ff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false });
  const loader = new OBJLoader();

  loader.load('assets/models/fly-brain-vfb-00101567-lite.obj', obj => {
    let sourceGeo = null;
    obj.traverse(child => { if (child.isMesh && !sourceGeo) sourceGeo = child.geometry; });
    if (!sourceGeo) throw new Error('no mesh in fly brain obj');

    sourceGeo.computeBoundingBox();
    const box = sourceGeo.boundingBox;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const geo = sourceGeo.clone().translate(-center.x, -center.y, -center.z);
    const scale = 6.35 / Math.max(size.x, size.y, size.z);

    const shell = new THREE.Mesh(geo, shellMat);
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), wireMat);
    const hotWire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), hotWireMat);
    hotWire.scale.setScalar(1.012);
    root.add(shell, wire, hotWire);
    root.scale.setScalar(scale);
    root.position.y = 2.25;
    root.rotation.x = -0.18;
    root.rotation.z = 0.09;

    addSurfaceNeurons(geo, root);
    addRegionRings(regionGroup);
    addSignalPaths(signalGroup);
    setLesson(0);
    window.__dlFlyBrain = { root, shell, wire, signalGroup, regionGroup, setMode, setLesson, state };
  }, undefined, err => {
    console.warn('fly brain mesh failed', err);
    if (status) status.textContent = 'mesh failed to load';
  });

  function setMode(mode) {
    state.mode = mode;
    modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.flyMode === mode));
    signalGroup.visible = mode !== 'regions';
    regionGroup.visible = mode !== 'wiring';
    shellMat.opacity = mode === 'wiring' ? 0.34 : mode === 'regions' ? 0.48 : 0.58;
    wireMat.opacity = mode === 'wiring' ? 0.32 : 0.18;
    hotWireMat.opacity = mode === 'wiring' ? 0.18 : 0.08;
    updateLessonText();
  }

  function setLesson(i) {
    state.lesson = Math.max(0, Math.min(lessons.length - 1, i));
    lessonButtons.forEach(btn => btn.classList.toggle('active', Number(btn.dataset.flyLesson) === state.lesson));
    setMode(lessons[state.lesson].mode);
  }

  function updateLessonText() {
    const l = lessons[state.lesson] || lessons[0];
    if (label) label.textContent = state.mode === 'activity' ? l.label : state.mode;
    if (status) status.textContent = state.paused ? `${l.title} · paused` : l.title;
    if (stat) stat.textContent = `${l.text} speed ${(state.speed * 100).toFixed(0)}%.`;
  }

  function addSurfaceNeurons(geo, target) {
    const pos = geo.getAttribute('position');
    const count = isMobile ? 260 : 680;
    const pts = new Float32Array(count * 3), seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const vi = Math.floor(Math.random() * pos.count);
      pts[i*3] = pos.getX(vi); pts[i*3+1] = pos.getY(vi); pts[i*3+2] = pos.getZ(vi); seeds[i] = Math.random();
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    const pMat = new THREE.ShaderMaterial({ transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, uniforms:{uTime:{value:0}, uBoost:{value:1}}, vertexShader:`attribute float aSeed; uniform float uTime,uBoost; varying float vA; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); float tw=.5+.5*sin(uTime*(1.6+aSeed*2.7)+aSeed*44.0); vA=(.16+tw*.84)*uBoost; gl_PointSize=(2.0+aSeed*3.7)*clamp(8.0/max(.1,-mv.z),.7,4.6); gl_Position=projectionMatrix*mv; }`, fragmentShader:`varying float vA; void main(){ vec2 uv=gl_PointCoord-.5; float d=length(uv); float a=smoothstep(.5,0.0,d)*vA; vec3 col=mix(vec3(.65,.34,1.0),vec3(.30,.95,1.0),vA); gl_FragColor=vec4(col,a); }` });
    const points = new THREE.Points(pGeo, pMat); target.add(points); target.userData.points = points;
  }

  function addRegionRings(target) {
    const colors = [0xffcf7a,0x62f0ff,0xa673ff,0x9dffd0,0xff6b9a];
    for (let i = 0; i < 5; i++) {
      const mat = new THREE.LineBasicMaterial({ color: colors[i], transparent: true, opacity: 0.30, blending: THREE.AdditiveBlending, depthWrite: false });
      const r = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circlePoints(1.18 + i * 0.35, 128)), mat);
      r.rotation.x = Math.PI / 2 + i * 0.17; r.rotation.y = i * 0.33; r.position.y = -0.9 + i * 0.42;
      target.add(r);
    }
  }

  function addSignalPaths(target) {
    const defs = [
      [[-1.9,-.9,.2],[-.9,.9,.7],[.35,1.55,-.35],[1.7,.55,.25]],
      [[1.8,-.65,-.25],[.8,.55,-.9],[-.45,1.35,.65],[-1.55,.4,.12]],
      [[-1.2,-1.0,-.65],[-.15,.1,.9],[.95,1.25,.4],[1.35,1.85,-.4]],
      [[.1,-1.15,.75],[-.7,.35,-.6],[.15,1.2,-.9],[.9,1.75,.65]]
    ];
    const mat = new THREE.LineBasicMaterial({ color: 0xffcf7a, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false });
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xffcf7a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const packets = [];
    defs.forEach((pts, i) => {
      const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal', 0.5);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)), mat.clone());
      target.add(line);
      for (let k = 0; k < 3; k++) {
        const packet = new THREE.Mesh(new THREE.SphereGeometry(0.055 + k*.012, 14, 14), packetMat.clone());
        target.add(packet); packets.push({ packet, curve, phase:(i*.23+k*.31)%1, speed:.06+i*.012+k*.008 });
      }
    });
    target.userData.packets = packets;
  }

  function circlePoints(radius, n) {
    const pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius)); }
    return pts;
  }

  let pointerX = 0, pointerY = 0;
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect(); pointerX = ((e.clientX - r.left) / r.width - 0.5) * 2; pointerY = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth || 900, h = canvas.clientHeight || 520, dpr = renderer.getPixelRatio();
    if (canvas.width !== Math.floor(w*dpr) || canvas.height !== Math.floor(h*dpr)) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  }

  const clock = new THREE.Clock();
  function frame() {
    resize();
    const t = clock.getElapsedTime();
    const run = state.paused ? 0 : 1;
    root.rotation.y += 0.002 + run * (0.002 + state.speed * 0.006);
    root.rotation.x += ((-0.16 + pointerY * 0.10) - root.rotation.x) * 0.04;
    root.rotation.z += ((0.08 + pointerX * 0.08) - root.rotation.z) * 0.04;
    if (root.userData.points) {
      root.userData.points.material.uniforms.uTime.value = t * (0.6 + state.speed * 1.8);
      root.userData.points.material.uniforms.uBoost.value = state.mode === 'activity' ? 1.2 : 0.65;
    }
    const packets = signalGroup.userData.packets || [];
    packets.forEach(p => {
      if (!state.paused) p.phase = (p.phase + p.speed * (0.25 + state.speed * 2.2)) % 1;
      p.curve.getPointAt(p.phase, p.packet.position);
      p.packet.material.opacity = state.mode === 'regions' ? 0.12 : 0.65 + Math.sin(t*5+p.phase*9)*0.25;
      p.packet.scale.setScalar(state.mode === 'activity' ? 1.3 : 0.8);
    });
    regionGroup.children.forEach((r,i) => { r.material.opacity = state.mode === 'regions' ? 0.34 + Math.sin(t*1.6+i)*0.08 : 0.16; r.rotation.z += run * (0.0015 + i*0.0005); });
    shellMat.emissiveIntensity = 1.35 + Math.sin(t * (1.0 + state.speed)) * 0.28;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
}
