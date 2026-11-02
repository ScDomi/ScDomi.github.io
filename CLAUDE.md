# CLAUDE.md — scryx / ScDomi.github.io

Project-specific context for AI coding sessions. Read this before writing or modifying any code.

---

## 1. Project Identity

**scryx** is evolving from a personal technical portfolio into an **interactive learning and experimentation platform** for mathematics, machine learning, deep learning, computational neuroscience, and scientific computing.

**Leitprinzip:** Intuition → Experiment → Mathematics → Code → Understanding

**Positioning:** Not a SaaS tool. Not a blog. A navigable, artifact-first surface that makes complex technical concepts tangible through real interactive experiments — not decorative animations.

**Visual identity:** Dark interface, terminal/HUD aesthetic, custom reticle cursor, WebGL 3D scenes, particle systems. The visual identity is intentional and personal. Do not genericize it.

**Key phrases to preserve:** `inside, made visible.` · `rules are defaults, not truth.` · `no gods, no defaults`

**Live URL:** https://scdomi.github.io  
**Repo:** https://github.com/ScDomi/ScDomi.github.io  
**Local path:** `/Users/domiai/Documents/workspace/github-audit/ScDomi.github.io`

---

## 2. Architecture

### Directory structure

```
/
├── index.html              # Root surface (~822 lines) — main interactive homepage
├── dl/index.html           # Deep Learning route (~389 lines)
├── ml/index.html           # Machine Learning route (~200 lines)
├── maths/index.html        # Mathematics Lab route (~198 lines)
├── projects/index.html     # Projects route (~54 lines, soft-nav target)
├── about/index.html        # About route (~94 lines, soft-nav target)
├── about.html              # Legacy flat-file (same content as about/)
├── contact.html            # Contact page (~74 lines)
│
├── assets/
│   ├── style.css               # Single site-wide stylesheet (no preprocessor)
│   ├── navigation.js           # Soft SPA router + active-nav indicator
│   ├── premium-interaction.js  # Custom reticle cursor + interaction layer
│   ├── theme.js                # Removed; comment stub only
│   ├── spine-scene.js          # Three.js 3D spine/brain scene (homepage)
│   ├── dl-flybrain-3d.js       # Three.js fly brain neuropil renderer (dl/)
│   ├── dl-visualizer.js        # DL chapter modules: XOR, backprop, convolution
│   ├── ml-visualizer.js        # ML: clustering, regression, MLP training
│   ├── ml-visualizer.css       # ML/DL-specific styles
│   ├── gradient-field.js       # Gradient descent lab (maths/)
│   ├── residual-highway.js     # Residual learning interactive (dl/)
│   ├── lorenz-attractor.js     # Lorenz attractor sim (maths/)
│   ├── double-pendulum.js      # Double pendulum chaos sim (maths/)
│   ├── fractal-explorer.js     # Mandelbrot/Julia fractal GPU explorer (maths/)
│   ├── mycelium-swarm.js       # Particle organism background (homepage)
│   ├── living-organism.js      # Reactive neural particle field (homepage)
│   ├── analytics.js            # DISABLED — no active tracking code
│   │
│   ├── brand/                  # scryx visual identity: sigil, wordmark, favicons
│   ├── models/                 # 3D assets: brain.obj, spine/*.obj, fly brain OBJ
│   ├── flywire_neuropil.json   # FlyWire connectome neuropil data (dl/ fly brain)
│   ├── projects/               # Project card images and PDFs
│   └── videos/                 # Background video assets
│
├── scryx/index.html        # Local WIP page — NOT in git, NOT live (404)
├── CLAUDE.md               # This file
├── README.md               # Project documentation
├── ROADMAP.md              # Planned future work
├── ATTRIBUTION.md          # Third-party asset credits and licenses
└── LICENSE                 # MIT (own code only — not third-party 3D models)
```

### Deployment

- GitHub Pages, branch `main`, `.nojekyll` present
- No build step, no bundler, no preprocessor
- Push to `main` → auto-deploys (Pages workflow runs ~30–60s)

### External CDN dependencies

- **Three.js 0.160** (homepage) / **0.164** (dl/) via jsDelivr — ES module importmap
- **GSAP 3.12.5** + ScrollTrigger — homepage spine scene
- **Lenis 1.0.42** — smooth scroll on homepage
- **MathJax 3** (tex-mml-chtml) — dl/ route only, deferred

### Routing

- **Soft SPA router** in `navigation.js`: intercepts same-origin link clicks, fetches HTML, swaps `[data-route-root]` innerHTML, updates title + `<body>` classes
- Soft nav only active for routes with `data-soft-router="true"` on `<body>`: `/projects/`, `/maths/`, `/about/`
- Route-specific interactive modules are mounted via `mountRouteModules(path)` after each soft navigation
- `dl/` and `ml/` are **not** soft-nav targets — they are full page loads with their own heavier script bundles

---

## 3. Development Conventions

### JavaScript

- Vanilla ES2020+, no framework, no build tool
- Non-module scripts: IIFE pattern `(() => { ... })()` or plain function scope
- ES modules: used for Three.js scenes only (`type="module"` on the HTML tag)
- `defer` on heavy scripts that don't need to block parsing
- Cache-bust with `?v=<semantic-label>` query strings on script and link tags — update on each meaningful change
- Error handling: canvas modules should fail silently (catch and return, never throw to global)
- No `document.write()`. `innerHTML` is used only with hardcoded static strings, never with user-supplied input

### CSS

- Single `assets/style.css` — no preprocessor, no utility framework
- CSS custom properties (`--mx`, `--my`, etc.) for cursor state, shared across JS and CSS
- Mobile-first responsive; coarse-pointer media queries gate desktop-only effects
- `prefers-reduced-motion` respected in animation modules

### Canvas / WebGL lifecycle

- Each interactive module exposes a mount function `window.__mount<Name>()` registered globally
- Canvas is sized from its bounding box at mount time; use `IntersectionObserver` for off-screen canvases
- Background scenes (field, spark, matrix, spine) are initialized on page load
- Route-specific modules are lazy-loaded on soft-nav arrival

### Animation performance

- Particle counts capped on mobile/coarse-pointer
- `requestAnimationFrame` loops cancelled (`cancelAnimationFrame`) when canvas is off-screen
- 3D spine scene uses `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))`

### DOM safety

- `innerHTML` used only with hardcoded static strings (project card media templates, cursor DOM)
- No `eval()`, no `new Function()`, no dynamic script injection
- Dialog elements use native `<dialog>` API

### Accessibility

- `aria-hidden="true"` on all decorative canvases and HUD elements
- Interactive controls use `<button>` or `<a>` with proper labels
- Custom cursor degrades gracefully on coarse-pointer devices
- `prefers-reduced-motion` respected

---

## 4. Interactive Modules

| Module | File | Route | Mount Pattern |
|---|---|---|---|
| 3D brain/spine scene | `spine-scene.js` | `/` | ES module, auto-runs |
| Mycelium swarm | `mycelium-swarm.js` | `/` | IIFE, deferred |
| Custom cursor/reticle | `premium-interaction.js` | all | IIFE, deferred |
| ML multi-model trainer | `ml-visualizer.js` | `/ml/` | IIFE, auto-runs |
| DL chapter visualizer | `dl-visualizer.js` | `/dl/` | IIFE, auto-runs |
| Residual highway | `residual-highway.js` | `/dl/` | IIFE, auto-runs |
| 3D fly brain | `dl-flybrain-3d.js` | `/dl/` | ES module, auto-runs |
| Fractal explorer | `fractal-explorer.js` | `/maths/` | IIFE, `__mountFractalExplorer` |
| Lorenz attractor | `lorenz-attractor.js` | `/maths/` | IIFE, `__mountLorenzAttractor` |
| Double pendulum | `double-pendulum.js` | `/maths/` | IIFE, `__mountDoublePendulum` |
| Gradient descent lab | `gradient-field.js` | `/maths/` | IIFE, `__mountGradientField` |
| Brain simulation demo | inline in `index.html` | `/` | inline script |
| Command palette | inline in `index.html` | `/` | inline script |
| Navigation system | `navigation.js` | all | IIFE, synchronous |

---

## 5. Educational Design Principles

**Intuition before formalism.** Start with the failure, the surprising result, or the question — then introduce the mechanism, then the mathematics.

**Experiments over explanations.** Every concept should be demonstrable through a live interactive state. Controls must recompute the underlying model — not play a canned animation.

**Mathematical honesty.** Simulations use real equations (Lorenz ODEs, gradient descent on real loss surfaces). Do not fake the math with scripted-looking visuals.

**Legible parameters.** Variable names and on-screen readouts should use the standard notation for the domain. Document units and ranges inline.

**Causal stories.** For each DL/ML concept, explain the original problem/failure → the reframing → the mechanism → the demonstration. No pasted history essays.

**MathJax notation.** Inline: `\\( … \\)`. Display: `\\[ … \\]`. Render on dl/ only (deferred). Verify rendered equations on narrow screens.

---

## 6. Verification Checklist

Before committing any change:

```
HTML syntax: node --check is not for HTML; validate with htmlhint or Nu checker
JS syntax:   node --check assets/<changed>.js
Routes OK:   /, /ml/, /dl/, /maths/, /projects/, /about/, /contact.html
Mobile:      viewport 375px, no horizontal overflow
Console:     zero JS errors on load for each changed route
Links:       no dead nav links, all external links open correctly
```

### Safe git workflow

```bash
# Status first
git status && git diff --stat HEAD

# Stage and review
git add <files>
git diff --staged

# Commit with semantic message
git commit -m "type(scope): short description"

# Only push after owner confirmation
# git push origin main
```

### Running locally

```bash
cd /Users/domiai/Documents/workspace/github-audit/ScDomi.github.io
python3 -m http.server 8080
# Open http://localhost:8080
```

> `file://` will not work — ES module import maps and fetch() require HTTP.

---

## 7. Hard Rules

- **No history rewrites** without owner approval
- **No push** without explicit owner sign-off  
- **No large new features** — new interactive modules are roadmap items
- **No design overrides** — preserve the visual identity and identity-anchor phrases
- **No fake data** in README, ROADMAP, or any public documentation
- **No external dependencies** added without reviewing license compatibility
- **analytics.js stays disabled** until privacy review is complete
- **scryx/ directory** is untracked WIP — do not add to git without owner decision
