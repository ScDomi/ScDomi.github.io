# ROADMAP — scryx / ScDomi

> Interactive learning platform — planned future work. Approximately **40 hours** of genuine software development across 6 phases.

**Legend:** ✅ Done · 🔲 Planned (not started) · ⚠️ Partially done

---

## Foundation work completed (this submission session)

✅ `analytics.js` — tracking disabled, private endpoint removed from served code  
✅ `README.md` — complete project documentation  
✅ `ATTRIBUTION.md` — third-party asset provenance and licenses  
✅ `CLAUDE.md` — AI coding session context derived from actual architecture  
✅ `.github/workflows/quality-gate.yml` — basic CI: JS syntax, private endpoint scan, analytics check

---

## Phase 1 — Testing & CI Expansion (~7h remaining)

### 1.1 HTML Validation in CI (~1h)
**Current state:** No HTML validation in CI.  
**Task:** Add Nu HTML Checker or htmlhint to the quality-gate workflow; fail on errors in all route HTML files.  
**Technical challenge:** Nu checker requires Java or a Docker step; htmlhint is simpler for CI.  
**Acceptance criteria:** CI fails on malformed HTML in any of the 8 route files. Existing code passes with zero errors.  
**Dependencies:** None.  
**Estimate:** ~1h

### 1.2 Smoke Tests with Playwright (~4h)
**Current state:** No automated browser tests.  
**Task:** Add Playwright smoke tests covering:
- Each route loads (/, /ml/, /dl/, /maths/, /about/, /projects/)
- Zero JS console errors per route
- Canvas elements exist and are non-zero-size
- Nav links resolve correctly (no 404s for internal links)
- Analytics.js makes no network requests
**Technical challenge:** Playwright needs a static server; use `npx serve` in CI. Canvas non-blank check requires pixel sampling.  
**Acceptance criteria:** All 6 routes pass, CI runs in <2 minutes.  
**Dependencies:** Node.js CI environment already set up.  
**Estimate:** ~4h

### 1.3 Analytics Replacement (~2h — post legal review)
**Current state:** Analytics disabled; no privacy policy exists.  
**Task:** 
1. Choose compliant provider (Plausible self-hosted or Fathom)
2. Wire to existing cookie-consent UI (`#cookie-consent`) in index.html
3. Write `/privacy/` page (minimum: what is collected, who processes it, opt-out)
4. Optionally: request git history rewrite to remove the Tailscale hostname from old commits
**Technical challenge:** GDPR compliance requires understanding of server-side data processing.  
**Acceptance criteria:** `window.scryxConsent === 'essential'` → zero tracking requests. Consent persists across page reload.  
**Dependencies:** Privacy/legal review (owner decision).  
**Estimate:** ~2h (implementation only, excluding review)

---

## Phase 2 — Accessibility (~6h)

### 2.1 Keyboard Navigation Audit (~2h)
**Current state:** Custom cursor and command palette may not be fully keyboard-navigable.  
**Task:**
- Tab through every interactive control on each route
- Fix command palette (⌘/) so it opens via keyboard (e.g. Ctrl+K) and traps focus correctly
- Ensure all simulation controls (sliders, buttons) are reachable by Tab + activated by Enter/Space
- Verify mobile nav toggle (`aria-expanded`) is correct
**Acceptance criteria:** Complete Tab cycle reaches every interactive element. Escape closes all modals/dialogs.  
**Estimate:** ~2h

### 2.2 Screen Reader Compatibility (~2h)
**Current state:** Decorative canvases have `aria-hidden="true"` (correct). No text alternatives for simulations.  
**Task:**
- Add `<p class="sr-only">` descriptions for each interactive simulation (what it shows, what the controls do)
- Verify focus management in `<dialog>` elements (project dialog, command palette)
- Check `aria-live` regions for simulation readouts
**Acceptance criteria:** VoiceOver/NVDA can navigate and understand each route without seeing the canvas.  
**Estimate:** ~2h

### 2.3 Reduced Motion & Contrast (~2h)
**Current state:** `prefers-reduced-motion` is read in navigation.js but not systematically enforced in all modules.  
**Task:**
- Audit each of the 14 modules for `prefers-reduced-motion` compliance
- Disable or freeze particle systems and 3D rotation under reduced-motion
- Run axe-core automated contrast check; fix WCAG AA failures in terminal overlays
**Acceptance criteria:** Zero axe-core critical errors. Reduced-motion: no autoplay animation on any route.  
**Estimate:** ~2h

---

## Phase 3 — Performance (~5h)

### 3.1 3D Model Compression (~2h)
**Current state:** `.obj` files are plain text; no compression. Spine + brain = several MB.  
**Task:**
- Convert OBJs to Draco-compressed `.glb` via Three.js `GLTFExporter` + `DRACOLoader`
- Measure load time before/after on a throttled connection
**Technical challenge:** Must verify model display is identical after conversion. Requires CLI tools (gltf-transform or Blender export).  
**Acceptance criteria:** 3D asset payload reduced by ≥60%. Visual output unchanged. Fallback for browsers without Draco support.  
**Estimate:** ~2h

### 3.2 Loading UX (~1h)
**Current state:** Boot overlay simulates loading; actual load progress not reflected.  
**Task:**
- Replace simulated boot log with events tied to actual resource loading (Three.js `LoadingManager`)
- Add `<link rel="preload">` for `style.css` and critical scripts
**Acceptance criteria:** Boot overlay completes within 500ms of 3D scene actually being ready. Preload reduces LCP on fast connections.  
**Estimate:** ~1h

### 3.3 Lighthouse Budget & Mobile Profile (~2h)
**Current state:** No performance budget defined.  
**Task:**
- Run Lighthouse on `/`, `/ml/`, `/dl/`, `/maths/` in CI (Lighthouse CI)
- Set performance score ≥70 as a non-blocking warning gate
- Profile on a mid-range Android profile; document per-module frame budget
**Acceptance criteria:** Lighthouse CI report attached to each PR. Score regressions >10 points flag a warning.  
**Estimate:** ~2h

---

## Phase 4 — New Interactive Learning Modules (~12h)

### 4.1 Fourier Series Visualizer (~3h)
**Current state:** Not implemented.  
**Task:** Interactive canvas where the user draws a curve; the site decomposes it into Fourier series in real time, showing individual harmonics and their sum.  
**Technical challenge:** Real FFT implementation in JS (or Web Audio AnalyserNode). Rendering N harmonic circles as animated vectors.  
**Acceptance criteria:** Up to 16 harmonics, live parameter update, `prefers-reduced-motion` safe.  
**Route:** `/maths/`  
**Estimate:** ~3h

### 4.2 Decision Boundary Explorer (~3h)
**Current state:** ml-visualizer.js trains models but doesn't show decision boundaries interactively.  
**Task:** User draws labeled points on a 2D canvas; site classifies the grid and shows the decision boundary for k-NN, logistic regression, and MLP — updating live as points are added.  
**Technical challenge:** Grid classification is O(n²) per update; must be debounced or run in a Worker.  
**Acceptance criteria:** Boundary updates within 200ms of adding a point. Supports ≥3 classifiers simultaneously.  
**Route:** `/ml/`  
**Estimate:** ~3h

### 4.3 Attention Mechanism Visualizer (~3h)
**Current state:** dl-visualizer.js has attention scores but they are static.  
**Task:** User enters a short sentence; site shows token-to-token attention weights as an animated heatmap and computes a simplified scaled dot-product attention with visible Q/K/V matrices.  
**Technical challenge:** Tokenization in the browser; keeping the math honest without a real model.  
**Acceptance criteria:** Weight matrix updates on token change. Math display uses MathJax. No external API calls.  
**Route:** `/dl/`  
**Estimate:** ~3h

### 4.4 Bias-Variance Interactive (~3h)
**Current state:** Not implemented.  
**Task:** User controls polynomial degree; site fits a polynomial to a noisy dataset and shows training/test error curves live, demonstrating the bias-variance tradeoff.  
**Technical challenge:** Polynomial regression in JS (least squares); generating reproducible train/test splits from a seed.  
**Acceptance criteria:** Degree 1–12 selectable with a slider. Error curves update in real time. Overfitting / underfitting regime clearly labeled.  
**Route:** `/ml/`  
**Estimate:** ~3h

---

## Phase 5 — UX & Navigation (~4h)

### 5.1 Custom 404 Page (~1h)
**Current state:** GitHub Pages returns a default 404.  
**Task:** Create `404.html` in scryx visual style with a clear navigation back to root.  
**Acceptance criteria:** Navigating to a non-existent URL shows the custom 404. No JavaScript errors. Returns to homepage in one click.  
**Estimate:** ~1h

### 5.2 scryx/ Route Decision (~1h)
**Current state:** `scryx/index.html` is a full 687-line page that exists locally but is untracked and 404s live. It appears to be a development variant of the homepage.  
**Task (owner decision required first):**
- **Option A:** Add to git and publish as a dedicated `/scryx/` route; fix `<base href>` and update nav links
- **Option B:** Remove the untracked copy; the root `/` remains the canonical scryx surface
**Acceptance criteria:** No 404 on any linked URL. No circular navigation loops.  
**Estimate:** ~1h after owner decision

### 5.3 Open Graph Images per Route (~2h)
**Current state:** `og:image` on root is set; sub-routes have no per-route OG images.  
**Task:** Add per-route `<meta property="og:image">` to dl/, ml/, maths/ using route-appropriate screenshots.  
**Acceptance criteria:** Each route shows a distinct preview image when shared on social/Slack/Discord.  
**Estimate:** ~2h

---

## Phase 6 — Documentation & Licensing (~4h)

### 6.1 Confirm Unverified 3D Model Origins (~2h)
**Current state:** `brain.obj` and `jellyfish.obj` have unknown origin. `fly-brain-vfb-00101567-lite.obj` source is identified but specific license not confirmed.  
**Task:**
- Trace origin of `brain.obj` (check BodyParts3D catalog, Sketchfab, or original commit message context)
- Trace origin of `jellyfish.obj`
- Verify VFB_00101567 license via VFB Term Info page
- Update `ATTRIBUTION.md` with confirmed entries
**Acceptance criteria:** Zero "UNKNOWN" or "UNVERIFIED" entries in ATTRIBUTION.md.  
**Estimate:** ~2h

### 6.2 Developer Documentation (~2h)
**Current state:** CLAUDE.md covers architecture. No inline API documentation.  
**Task:**
- Add JSDoc to `navigation.js` (soft router API: `softNavigate`, `mountRouteModules`)
- Document the interactive module mount protocol in CLAUDE.md
- Write a short "how to add a new route" guide in CLAUDE.md
**Acceptance criteria:** A new contributor can add a new interactive route without reading existing source code first.  
**Estimate:** ~2h

---

## Estimated Hours

| Phase | Status | Hours |
|---|---|---|
| Foundation / CI basic | ✅ Done | ~3h |
| 1 — Testing & CI expansion | 🔲 Planned | ~7h |
| 2 — Accessibility | 🔲 Planned | ~6h |
| 3 — Performance | 🔲 Planned | ~5h |
| 4 — New learning modules (4 modules) | 🔲 Planned | ~12h |
| 5 — UX & Navigation | 🔲 Planned | ~4h |
| 6 — Documentation & Licensing | 🔲 Planned | ~4h |
| **Remaining total** | | **~38h** |

---

*Features in Phase 4 are the core of the learning platform vision. They are not implemented yet — each is a genuine multi-hour engineering task with real algorithms, live state, and verified correctness.*
