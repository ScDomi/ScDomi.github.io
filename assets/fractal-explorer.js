window.__mountFractalExplorer = () => {
  const canvas = document.getElementById('fractal-canvas');
  if (canvas && !canvas.dataset.fractalMounted) bootFractalExplorer(canvas);
};
window.__mountFractalExplorer();

function bootFractalExplorer(canvas) {
  canvas.dataset.fractalMounted = 'true';
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, powerPreference: 'high-performance' });
  const readout = document.getElementById('fractal-readout');
  const modeEl = document.getElementById('fractal-mode');
  const iterEl = document.getElementById('fractal-iterations');
  const detailEl = document.getElementById('fractal-detail');
  const juliaXEl = document.getElementById('fractal-julia-x');
  const juliaYEl = document.getElementById('fractal-julia-y');
  const resetBtn = document.getElementById('fractal-reset');
  const buttons = [...document.querySelectorAll('[data-fractal-preset]')];
  if (!gl) {
    if (readout) readout.textContent = 'WebGL unavailable — this browser cannot run the shader explorer.';
    return;
  }

  const vertexSrc = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
  `;
  const fragmentSrc = `
    precision highp float;
    varying vec2 vUv;
    uniform vec2 uResolution;
    uniform vec2 uCenter;
    uniform vec2 uJulia;
    uniform float uZoom;
    uniform float uTime;
    uniform int uMode;
    uniform int uIterations;
    uniform float uDetail;

    vec3 palette(float t){
      vec3 a = vec3(0.045, 0.035, 0.085);
      vec3 b = vec3(0.62, 0.34, 1.00);
      vec3 c = vec3(0.30, 0.94, 1.00);
      vec3 d = vec3(1.00, 0.80, 0.42);
      return mix(mix(a, b, smoothstep(0.0, .45, t)), mix(c, d, smoothstep(.45, 1.0, t)), smoothstep(.22, .86, t));
    }

    void main(){
      vec2 p = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
      vec2 c = uCenter + p / uZoom;
      vec2 z = uMode == 0 ? vec2(0.0) : c;
      vec2 k = uMode == 0 ? c : uJulia;
      float escape = 0.0;
      float trap = 10.0;
      for(int i=0; i<900; i++){
        if(i >= uIterations) break;
        float x = z.x*z.x - z.y*z.y + k.x;
        float y = 2.0*z.x*z.y + k.y;
        z = vec2(x,y);
        float m2 = dot(z,z);
        trap = min(trap, abs(z.x*z.y));
        if(m2 > 256.0){
          float fi = float(i) + 1.0 - log2(log2(max(m2, 2.0))) + uDetail * 0.08;
          escape = fi / float(uIterations);
          break;
        }
      }
      if(escape == 0.0){
        float core = 0.04 + 0.08*sin(uTime + trap*24.0);
        gl_FragColor = vec4(vec3(core, core*.82, core*1.8), 1.0);
      } else {
        float band = escape + 0.018*sin(36.0*escape + uTime*.5) + 0.04*sqrt(trap);
        vec3 col = palette(fract(band*1.55));
        col += vec3(0.10,0.25,0.30) * pow(1.0 - escape, 2.5);
        gl_FragColor = vec4(col, 1.0);
      }
    }
  `;

  const program = createProgram(vertexSrc, fragmentSrc);
  gl.useProgram(program);
  const pos = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pos);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = name => gl.getUniformLocation(program, name);
  const uniforms = {
    resolution: U('uResolution'), center: U('uCenter'), julia: U('uJulia'), zoom: U('uZoom'), time: U('uTime'), mode: U('uMode'), iterations: U('uIterations'), detail: U('uDetail')
  };

  const state = { mode: 0, centerX: -0.72, centerY: 0.02, zoom: 0.78, juliaX: -0.745, juliaY: 0.113, iterations: 260, detail: 1.2, dragging: false, px: 0, py: 0, visible: true };
  const presets = {
    seahorse: { mode: 0, centerX: -0.743643887, centerY: 0.131825904, zoom: 180, iterations: 520, detail: 3.6 },
    valley: { mode: 0, centerX: -0.10109636, centerY: 0.95628651, zoom: 90, iterations: 460, detail: 3.0 },
    dendrite: { mode: 1, centerX: 0, centerY: 0, zoom: 1.28, juliaX: -0.8, juliaY: 0.156, iterations: 380, detail: 2.2 },
    storm: { mode: 1, centerX: 0, centerY: 0, zoom: 1.08, juliaX: 0.285, juliaY: 0.01, iterations: 430, detail: 2.8 }
  };

  function applyPreset(name) {
    Object.assign(state, presets[name] || presets.seahorse);
    syncControls();
  }

  function syncControls() {
    if (modeEl) modeEl.value = state.mode ? 'julia' : 'mandelbrot';
    if (iterEl) iterEl.value = state.iterations;
    if (detailEl) detailEl.value = state.detail;
    if (juliaXEl) juliaXEl.value = state.juliaX;
    if (juliaYEl) juliaYEl.value = state.juliaY;
    updateControlLabels();
    updateReadout();
  }

  function updateFromControls() {
    state.mode = modeEl?.value === 'julia' ? 1 : 0;
    state.iterations = Number(iterEl?.value || state.iterations);
    state.detail = Number(detailEl?.value || state.detail);
    state.juliaX = Number(juliaXEl?.value || state.juliaX);
    state.juliaY = Number(juliaYEl?.value || state.juliaY);
    updateControlLabels();
    updateReadout();
  }

  function updateControlLabels() {
    document.querySelector('[data-fractal-label="iterations"]')?.replaceChildren(String(state.iterations));
    document.querySelector('[data-fractal-label="detail"]')?.replaceChildren(state.detail.toFixed(1));
  }

  [modeEl, iterEl, detailEl, juliaXEl, juliaYEl].forEach(el => el?.addEventListener('input', updateFromControls));
  buttons.forEach(btn => btn.addEventListener('click', () => applyPreset(btn.dataset.fractalPreset)));
  resetBtn?.addEventListener('click', () => { Object.assign(state, { mode: 0, centerX: -0.72, centerY: 0.02, zoom: 0.78, juliaX: -0.745, juliaY: 0.113, iterations: 260, detail: 1.2 }); syncControls(); });

  canvas.addEventListener('pointerdown', e => { state.dragging = true; state.px = e.clientX; state.py = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', () => { state.dragging = false; });
  canvas.addEventListener('pointermove', e => {
    if (!state.dragging) return;
    const r = canvas.getBoundingClientRect();
    const dx = (e.clientX - state.px) / r.height / state.zoom;
    const dy = (e.clientY - state.py) / r.height / state.zoom;
    state.centerX -= dx;
    state.centerY += dy;
    state.px = e.clientX;
    state.py = e.clientY;
    updateReadout();
  }, { passive: true });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0018);
    const r = canvas.getBoundingClientRect();
    const ax = ((e.clientX - r.left) / r.width - 0.5) * r.width / r.height;
    const ay = ((e.clientY - r.top) / r.height - 0.5);
    const beforeX = state.centerX + ax / state.zoom;
    const beforeY = state.centerY - ay / state.zoom;
    state.zoom *= factor;
    state.iterations = Math.min(820, Math.max(Number(iterEl?.value || 260), Math.floor(210 + Math.log2(Math.max(1, state.zoom)) * 34)));
    const afterX = state.centerX + ax / state.zoom;
    const afterY = state.centerY - ay / state.zoom;
    state.centerX += beforeX - afterX;
    state.centerY += beforeY - afterY;
    syncControls();
  }, { passive: false });

  const io = new IntersectionObserver(entries => { state.visible = entries[0]?.isIntersecting && !document.hidden; }, { threshold: 0.04 });
  io.observe(canvas.closest('.fractal-stage') || canvas);
  document.addEventListener('visibilitychange', () => { state.visible = !document.hidden; });

  function resize() {
    const r = (canvas.closest('.fractal-stage') || canvas).getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    const w = Math.max(360, Math.floor(r.width));
    const h = Math.max(500, Math.floor(r.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  new ResizeObserver(resize).observe(canvas.closest('.fractal-stage') || canvas);

  function updateReadout() {
    const depth = state.zoom >= 1 ? `${state.zoom.toExponential(2)}×` : `${state.zoom.toFixed(2)}×`;
    if (readout) readout.textContent = `${state.mode ? 'Julia' : 'Mandelbrot'} · zoom ${depth} · iterations ${state.iterations} · c=(${state.juliaX.toFixed(3)}, ${state.juliaY.toFixed(3)})`;
  }

  function frame(t) {
    resize();
    if (state.visible) {
      gl.useProgram(program);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.center, state.centerX, state.centerY);
      gl.uniform2f(uniforms.julia, state.juliaX, state.juliaY);
      gl.uniform1f(uniforms.zoom, state.zoom);
      gl.uniform1f(uniforms.time, t * 0.001);
      gl.uniform1i(uniforms.mode, state.mode);
      gl.uniform1i(uniforms.iterations, state.iterations);
      gl.uniform1f(uniforms.detail, state.detail);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    requestAnimationFrame(frame);
  }

  function createProgram(vs, fs) {
    const v = compile(gl.VERTEX_SHADER, vs);
    const f = compile(gl.FRAGMENT_SHADER, fs);
    const p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  function compile(type, src) {
    const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }

  resize();
  syncControls();
  requestAnimationFrame(frame);
}
