/* scryx / DL fly brain — real VFB mesh rendered in chapter 06 */
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';


const flySection = document.getElementById('flywire');
if (flySection && 'IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    document.body.classList.toggle('flywire-visible', entries.some(e => e.isIntersecting && e.intersectionRatio > 0.28));
  }, { threshold: [0, 0.28, 0.55] }).observe(flySection);
}

const canvas = document.getElementById('flyBrainCanvas');
if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  bootFlyBrain(canvas);
}

function bootFlyBrain(canvas) {
  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.05 : 1.45));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
  camera.position.set(0, 0.9, 8.6);

  scene.add(new THREE.AmbientLight(0x37284f, 2.4));
  const key = new THREE.PointLight(0xa673ff, 70, 18, 1.45);
  key.position.set(3.5, 3.8, 5.5);
  scene.add(key);
  const cyan = new THREE.PointLight(0x49e6ff, 45, 16, 1.7);
  cyan.position.set(-4.2, -1.6, 4.2);
  scene.add(cyan);

  const root = new THREE.Group();
  scene.add(root);

  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x7f5dff,
    emissive: 0x32186a,
    emissiveIntensity: 1.95,
    metalness: 0.22,
    roughness: 0.36,
    transparent: true,
    opacity: 0.58,
    side: THREE.DoubleSide
  });
  const wireMat = new THREE.LineBasicMaterial({ color: 0xe2c8ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
  const hotWireMat = new THREE.LineBasicMaterial({ color: 0x62f0ff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false });
  const loader = new OBJLoader();

  const status = document.getElementById('flyBrainStatus');
  const stat = document.getElementById('flyBrainStat');
  if (status) status.textContent = 'loading real VFB mesh…';

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

    addSurfaceNeurons(geo, scale, root);
    addRegionRings(root);

    if (status) status.textContent = 'real fly brain mesh active';
    if (stat) stat.textContent = 'VFB_00101567 · 17k-face web mesh · rotatable morphology';
    window.__dlFlyBrain = { root, shell, wire, scale };
  }, undefined, err => {
    console.warn('fly brain mesh failed', err);
    if (status) status.textContent = 'mesh failed to load';
  });

  function addSurfaceNeurons(geo, scale, target) {
    const pos = geo.getAttribute('position');
    const count = isMobile ? 240 : 520;
    const pts = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const vi = Math.floor(Math.random() * pos.count);
      pts[i*3] = pos.getX(vi);
      pts[i*3+1] = pos.getY(vi);
      pts[i*3+2] = pos.getZ(vi);
      seeds[i] = Math.random();
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    const pMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `attribute float aSeed; uniform float uTime; varying float vA;
        void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); float tw=.5+.5*sin(uTime*(1.6+aSeed*2.7)+aSeed*44.0); vA=.22+tw*.78; gl_PointSize=(2.0+aSeed*3.7)*clamp(8.0/max(.1,-mv.z),.7,4.4); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying float vA; void main(){ vec2 uv=gl_PointCoord-.5; float d=length(uv); float a=smoothstep(.5,0.0,d)*vA; vec3 col=mix(vec3(.65,.34,1.0),vec3(.30,.95,1.0),vA); gl_FragColor=vec4(col,a); }`
    });
    const points = new THREE.Points(pGeo, pMat);
    target.add(points);
    target.userData.points = points;
  }

  function addRegionRings(target) {
    const ringMat = new THREE.LineBasicMaterial({ color: 0xffcf7a, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 5; i++) {
      const r = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circlePoints(1.2 + i * 0.34, 96)), ringMat.clone());
      r.rotation.x = Math.PI / 2 + i * 0.17;
      r.rotation.y = i * 0.33;
      r.position.y = -0.9 + i * 0.42;
      target.add(r);
    }
  }
  function circlePoints(radius, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }

  let pointerX = 0, pointerY = 0;
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    pointerX = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointerY = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth || 900;
    const h = canvas.clientHeight || 520;
    if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  const clock = new THREE.Clock();
  function frame() {
    resize();
    const t = clock.getElapsedTime();
    root.rotation.y += 0.0045;
    root.rotation.x += ((-0.16 + pointerY * 0.10) - root.rotation.x) * 0.04;
    root.rotation.z += ((0.08 + pointerX * 0.08) - root.rotation.z) * 0.04;
    if (root.userData.points) root.userData.points.material.uniforms.uTime.value = t;
    shellMat.emissiveIntensity = 1.2 + Math.sin(t * 1.3) * 0.22;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
}
