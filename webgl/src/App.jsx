import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html, Line, MeshTransmissionMaterial, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import Lenis from 'lenis';
import './style.css';

const projects = [
  ['GESTURE', 'computer vision', 'bounding boxes / hand signs / visual proof', '#24ffba'],
  ['SQUAD', 'question answering', 'context windows / answer extraction / eval', '#b965ff'],
  ['DQN', 'reinforcement learning', 'pixels in / reward trace / control out', '#66ccff'],
  ['EMOTION', 'realtime cv', 'face signal / webcam loop / archive hunt', '#ff5da2'],
  ['UBIQUE', 'iot systems', 'sensor pings / node graph / physical world', '#ffd166'],
  ['ALPACA', 'market agent', 'risk envelope / order flow / paper first', '#24ffba'],
  ['FOUNDATIONS', 'math + cs', 'logic graph / search tree / rules moving', '#d8c7ff'],
];

function ScryxCore({ scroll }) {
  const group = useRef();
  const inner = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    group.current.rotation.y = t * 0.18 + scroll.current * 2.8;
    group.current.rotation.x = Math.sin(t * 0.4) * 0.16 + scroll.current * .35;
    inner.current.rotation.z = -t * 0.35;
    group.current.position.z = -scroll.current * 3.5;
  });
  return (
    <group ref={group}>
      <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.45}>
        <mesh scale={[1.35, 1.35, .22]} rotation={[0.6, 0.15, Math.PI / 4]}>
          <torusKnotGeometry args={[1, .19, 180, 16, 2, 5]} />
          <MeshTransmissionMaterial color="#180821" transmission={0.65} roughness={0.2} thickness={1.2} chromaticAberration={0.08} anisotropy={0.2} distortion={0.42} distortionScale={0.45} temporalDistortion={0.12} />
        </mesh>
      </Float>
      <group ref={inner}>
        <mesh scale={[2.55, .08, .08]}><boxGeometry /><meshStandardMaterial color="#24ffba" emissive="#24ffba" emissiveIntensity={1.8} /></mesh>
        <mesh scale={[.08, 2.55, .08]}><boxGeometry /><meshStandardMaterial color="#b965ff" emissive="#b965ff" emissiveIntensity={1.4} /></mesh>
      </group>
    </group>
  );
}

function ParticleField({ scroll }) {
  const points = useRef();
  const { positions, colors } = useMemo(() => {
    const count = 1250;
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    const ca = new THREE.Color('#24ffba');
    const cb = new THREE.Color('#b965ff');
    for (let i = 0; i < count; i++) {
      const r = 2 + Math.random() * 10;
      const a = Math.random() * Math.PI * 2;
      p[i * 3] = Math.cos(a) * r;
      p[i * 3 + 1] = (Math.random() - .5) * 7;
      p[i * 3 + 2] = Math.sin(a) * r - Math.random() * 18;
      const col = ca.clone().lerp(cb, Math.random());
      c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
    }
    return { positions: p, colors: c };
  }, []);
  useFrame((state) => {
    points.current.rotation.y = state.clock.elapsedTime * 0.025 + scroll.current * .5;
    points.current.position.z = scroll.current * 4;
  });
  return <points ref={points}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /><bufferAttribute attach="attributes-color" args={[colors, 3]} /></bufferGeometry><pointsMaterial size={0.026} vertexColors transparent opacity={0.75} depthWrite={false} /></points>;
}

function ProjectConstellation({ scroll, setActive }) {
  const group = useRef();
  useFrame(() => {
    const idx = Math.min(projects.length - 1, Math.max(0, Math.floor(scroll.current * projects.length)));
    setActive(idx);
    group.current.rotation.y = -scroll.current * 1.8;
  });
  const nodes = projects.map((p, i) => {
    const a = (i / projects.length) * Math.PI * 2;
    const pos = [Math.cos(a) * 4.2, Math.sin(i * 1.7) * 1.45, Math.sin(a) * 4.2 - 4];
    return { p, pos, i };
  });
  return <group ref={group}>{nodes.map(({ p, pos, i }) => <Float key={p[0]} speed={1 + i * .06} floatIntensity={0.35}><mesh position={pos}><icosahedronGeometry args={[.16, 1]} /><meshStandardMaterial color={p[3]} emissive={p[3]} emissiveIntensity={1.4} /></mesh><Html position={[pos[0] + .28, pos[1] + .05, pos[2]]} className="node-label"><b>./{p[0]}</b><span>{p[1]}</span></Html></Float>)}<Line points={nodes.map(n => n.pos)} color="#7347ff" transparent opacity={0.35} lineWidth={1} /></group>;
}

function Scene({ scroll, setActive }) {
  return <Canvas camera={{ position: [0, 0, 8], fov: 55 }} dpr={[1, 1.55]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={['#020104']} />
    <fog attach="fog" args={['#05020a', 6, 24]} />
    <ambientLight intensity={0.35} />
    <pointLight position={[4, 3, 4]} color="#b965ff" intensity={8} />
    <pointLight position={[-5, -2, 2]} color="#24ffba" intensity={4} />
    <Suspense fallback={null}>
      <Stars radius={60} depth={22} count={1200} factor={2.1} fade speed={0.5} />
      <ParticleField scroll={scroll} />
      <ScryxCore scroll={scroll} />
      <ProjectConstellation scroll={scroll} setActive={setActive} />
      <Text position={[0, -2.6, 0]} fontSize={0.22} color="#d8c7ff" anchorX="center">hold signal // scroll camera // decrypt artifacts</Text>
    </Suspense>
  </Canvas>;
}

function App() {
  const scroll = useRef(0);
  const [active, setActive] = useState(0);
  const [cmd, setCmd] = useState(false);
  useEffect(() => {
    const lenis = new Lenis({ duration: 0.95, lerp: 0.11 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      scroll.current = max > 0 ? scrollY / max : 0;
      document.documentElement.style.setProperty('--p', scroll.current.toFixed(3));
    };
    addEventListener('scroll', update, { passive: true }); update();
    const key = e => { if ((e.metaKey || e.ctrlKey) && e.key === '/') { e.preventDefault(); setCmd(v => !v); } };
    addEventListener('keydown', key);
    return () => { removeEventListener('scroll', update); removeEventListener('keydown', key); lenis.destroy(); };
  }, []);
  const p = projects[active];
  return <>
    <div className="webgl"><Scene scroll={scroll} setActive={setActive} /></div>
    <main className="ui">
      <header><b>scryxOS</b><nav><a href="#core">core</a><a href="#artifacts">artifacts</a><button onClick={() => setCmd(true)}>⌘/</button></nav></header>
      <section id="core" className="chapter hero"><p className="kicker">WEBGL INTERFACE</p><h1>rules are defaults, not truth.</h1><p>A static GitHub Pages site pretending to be a private hacker operating system. WebGL core, artifact constellation, project decrypt stream.</p><div className="chips"><span>R3F</span><span>Three.js</span><span>Lenis</span><span>GitHub Pages</span></div></section>
      <section className="chapter split"><div><p className="kicker">BLACKBOX</p><h2>scroll moves the camera now.</h2></div><p>The page is no longer just animated HTML. The scene behind it is real WebGL: particles, refractive core, depth constellation, live scroll state.</p></section>
      <section id="artifacts" className="chapter project"><p className="kicker">ACTIVE ARTIFACT</p><h2>./{p[0]}</h2><p>{p[2]}</p><small>{String(active + 1).padStart(2, '0')} / {projects.length.toString().padStart(2, '0')}</small></section>
      <section className="chapter cards">{projects.map(x => <article key={x[0]} style={{'--a': x[3]}}><b>./{x[0]}</b><span>{x[1]}</span><p>{x[2]}</p></article>)}</section>
      <section className="chapter end"><p className="kicker">DEPLOY MODE</p><h2>static files. illegal energy.</h2><p>No backend needed. Just frontend violence hosted on GitHub Pages.</p></section>
    </main>
    <aside className="hud"><span>root@scryx</span><b>{p[0]}</b><i>signal:{Math.round((active + 1) / projects.length * 100)}%</i></aside>
    {cmd && <div className="cmd" onClick={() => setCmd(false)}><div onClick={e => e.stopPropagation()}><b>command palette</b>{['open artifacts','decrypt alpaca','trace constellation','fork default'].map(x => <button key={x}>{x}<span>↵</span></button>)}</div></div>}
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
