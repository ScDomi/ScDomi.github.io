# scryx / ScDomi

> **inside, made visible.**

An interactive learning and experimentation platform for mathematics, machine learning, deep learning, and computational neuroscience — built from scratch with vanilla JavaScript, WebGL, and Three.js.

**Live:** [scdomi.github.io](https://scdomi.github.io)

---

## What is scryx?

scryx is evolving from a personal technical portfolio into a hands-on learning platform. Every concept is demonstrated through a real interactive experiment — not a screenshot or a canned animation.

**Leitprinzip:** Intuition → Experiment → Mathematics → Code → Understanding

**For:** Researchers, engineers, and technically curious people who want to understand how things actually work, not just what they're called.

---

## Learning Areas

| Area | Route | What's there |
|---|---|---|
| **Mathematics** | `/maths/` | Lorenz attractor, double pendulum chaos, fractal explorer (GPU Mandelbrot/Julia), gradient descent lab |
| **Machine Learning** | `/ml/` | Live multi-model trainer: K-Means, linear regression, logistic regression, MLP — comparing behavior on the same dataset in real time |
| **Deep Learning** | `/dl/` | XOR/linear separability, backprop intuition, convolution kernels, attention scores, residual learning — all interactive |
| **Computational Neuroscience** | `/dl/` | 3D Drosophila fly brain neuropil rendered from real FlyWire connectome data |
| **Projects** | `/projects/` | Public ML/DL/RL/analytics projects with source links |

---

## Screenshots

| Homepage | Deep Learning | Maths Lab |
|---|---|---|
| ![Homepage — 3D brain/spine scene with terminal interface](assets/brand/scryx-lockup.jpg) | Interactive DL visualizer with live backprop | Fractal explorer + Lorenz system |

*Full screenshots: [scdomi.github.io](https://scdomi.github.io) — visit the live site.*

---

## Interactive Modules (14)

| Module | Route | Description |
|---|---|---|
| 3D brain + spine scene | `/` | WebGL Three.js scene: CT-derived spine vertebrae + brain mesh, real-time |
| Mycelium particle swarm | `/` | Organic particle background system |
| Custom reticle cursor | all routes | Desktop-only reticle + ring cursor with hover states and coordinates |
| Brain simulation demo | `/` | Switchable cortex modes: idle / active / spike |
| Command palette | all routes | ⌘/ modal with navigation and easter eggs |
| ML multi-model trainer | `/ml/` | Runs logistic regression, linear regression, k-means, and a 2→6→1 MLP simultaneously on a synthetic dataset — real gradient descent, live loss curves |
| DL chapter visualizer | `/dl/` | XOR backprop (real 2→2→1 network), activation functions, convolution, attention scores, loss landscape — all interactive |
| Residual learning highway | `/dl/` | Skip connection visualizer with live weight flow |
| 3D fly brain | `/dl/` | Drosophila neuropil mesh from real FlyWire connectome data |
| Gradient descent lab | `/maths/` | Manipulable loss surface with live step trace |
| Lorenz attractor | `/maths/` | Real Lorenz ODE system with tunable σ, ρ, β |
| Double pendulum | `/maths/` | Chaotic double pendulum, real equations |
| Fractal explorer | `/maths/` | GPU-accelerated Mandelbrot + Julia set with zoom and parameter control |
| Soft SPA router | all routes | Custom client-side navigation — no framework, no page reload |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Rendering | Vanilla JS + WebGL (custom GLSL shaders) |
| 3D | Three.js 0.160 / 0.164 via ES module importmap |
| Animation | GSAP 3.12 + ScrollTrigger, Lenis 1.0 |
| Math rendering | MathJax 3 (LaTeX, dl/ route only) |
| Styling | Single `assets/style.css` — no preprocessor, no framework |
| Navigation | Custom soft SPA router in `navigation.js` — no framework |
| Hosting | GitHub Pages, `.nojekyll`, branch `main` |
| CI | GitHub Actions — JS syntax, private endpoint scan, analytics check |
| Analytics | **Disabled** — see `assets/analytics.js` |

No build step. No bundler. No framework. Clone and serve.

---

## Architecture

```
scdomi.github.io/
├── index.html              # Root surface — homepage
├── dl/index.html           # Deep Learning route
├── ml/index.html           # ML route
├── maths/index.html        # Mathematics Lab route
├── projects/index.html     # Projects (soft-nav target)
├── about/index.html        # About (soft-nav target)
├── contact.html            # Contact
│
├── assets/
│   ├── style.css                # Full-site stylesheet
│   ├── navigation.js            # Soft SPA router + active nav indicator
│   ├── premium-interaction.js   # Custom reticle cursor + interaction layer
│   ├── spine-scene.js           # Three.js 3D spine/brain scene
│   ├── dl-flybrain-3d.js        # Three.js Drosophila brain neuropil
│   ├── dl-visualizer.js         # DL chapter modules
│   ├── ml-visualizer.js         # ML concept visualizations
│   ├── ml-visualizer.css        # ML/DL-specific styles
│   ├── gradient-field.js        # Gradient descent lab
│   ├── residual-highway.js      # Residual learning interactive
│   ├── lorenz-attractor.js      # Lorenz attractor simulation
│   ├── double-pendulum.js       # Double pendulum simulation
│   ├── fractal-explorer.js      # GPU fractal explorer
│   ├── mycelium-swarm.js        # Particle organism background
│   ├── living-organism.js       # Reactive particle field
│   ├── analytics.js             # DISABLED — no active tracking
│   ├── brand/                   # scryx identity: sigil, wordmark, favicons
│   ├── models/                  # 3D assets: brain, spine vertebrae, fly brain
│   ├── flywire_neuropil.json    # FlyWire connectome data (neuropil regions)
│   ├── projects/                # Project card images
│   └── videos/                  # Background videos
│
├── CLAUDE.md               # AI coding session context
├── ROADMAP.md              # Planned future work (~40h)
├── ATTRIBUTION.md          # Third-party asset credits and licenses
└── LICENSE                 # MIT (original code only)
```

---

## Running Locally

```bash
git clone https://github.com/ScDomi/ScDomi.github.io.git
cd ScDomi.github.io

# Any static HTTP server works
python3 -m http.server 8080
# or: npx serve .

# Open http://localhost:8080
```

> **Important:** Opening `index.html` via `file://` will not work — ES module import maps and `fetch()` in the soft router require HTTP.

**Prerequisites:** A modern browser (Chrome/Firefox/Safari, 2023+). WebGL required for 3D scenes.

---

## Privacy & Analytics

Visitor tracking is disabled. `assets/analytics.js` contains no active code. See the file for rationale and re-enable conditions.

---

## Note on In-Browser ML Training

The `/ml/` and `/dl/` routes implement real machine-learning algorithms that run entirely in the user's browser:

- **`/ml/`** — Simultaneously trains logistic regression, linear regression, k-means clustering, and a small MLP (2→6→1) using gradient descent and backpropagation on a hardcoded 84-point synthetic dataset
- **`/dl/`** — Trains a 2→2→1 network on the XOR problem using real backpropagation; also renders loss landscapes, activation functions, attention score computation, and convolution visualizations

**Purpose:** These are educational demonstrations of classic ML algorithms — the kind you'd find in an interactive ML textbook. The algorithms are implemented from scratch in vanilla JavaScript. No external model is loaded, no model artifact is stored, no API is called. The trained weights are ephemeral browser state.

**Distinction from production ML infrastructure:** This is not model training infrastructure, not a fine-tuning pipeline, and not a serving/inference system. It's a live algorithm demonstration where the "training" is a browser-side animation that teaches how gradient descent works.

---

## License & Attribution

- **Original code:** MIT — see `LICENSE`
- **Third-party 3D models and data:** See `ATTRIBUTION.md` for full provenance and license details
- BodyParts3D spine models: CC BY 4.0 (DBCLS/JST)
- FlyWire connectome data: CC BY-NC 4.0 (FlyWire Consortium)

---

## Roadmap

See [ROADMAP.md](./ROADMAP.md) — approximately 40 hours of planned future work: testing infrastructure, accessibility, new learning modules, performance, CI expansion.
