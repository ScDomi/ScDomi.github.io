# Contributing to scryx

> This is a long-term personal project that is emotionally important to me. Read this before opening a PR.

---

## What this project is

scryx is an interactive learning platform that visualizes the concepts behind artificial intelligence — from the mathematical foundations to state-of-the-art research — in a way that is aesthetically powerful, intellectually honest, and accessible to people without a deep technical background.

It is linked to my personal identity, my social media, and my professional presence. The visual design, the writing, and the architecture reflect how I think. That is intentional.

---

## Who can contribute

I work on this alone by default.

If you want to contribute, you need to genuinely understand the subject matter — not just implement code. That means:

- Statistics and probability theory
- Classical machine learning (regression, classification, clustering, gradient descent)
- Deep learning (backpropagation, CNNs, RNNs, attention, transformers)
- Natural language processing and large language models
- Reinforcement learning
- The mathematical intuitions behind all of the above

If you cannot explain why a residual connection helps with gradient flow, or what the attention mechanism in a transformer actually computes, this is probably not the right project for you.

If you can — and you understand what I am building here — I will respect your input.

**When in doubt, I would rather work alone.**

---

## How to propose a change

1. **Open an issue first.** Describe what you want to change and why. Do not open a PR without a prior discussion.
2. **Preserve the visual identity.** The design is not negotiable. No generic SaaS cleanup, no framework rewrites, no "modernization" of the aesthetic.
3. **Preserve the voice.** The writing on this site sounds like me. Do not normalize it into marketing copy.
4. **Be technically accurate.** Every simulation, equation, and explanation must be mathematically correct. A visually impressive but wrong demonstration is worse than nothing.
5. **Small, focused PRs.** One concern per PR. Do not bundle redesigns with bug fixes.

---

## What belongs here

- Interactive visualizations of AI/ML/DL/math concepts
- Bug fixes in existing modules
- Performance improvements that do not change visual output
- Accessibility improvements (keyboard nav, ARIA, reduced motion)
- New learning modules that follow the principle: **Intuition → Experiment → Mathematics → Code → Understanding**
- Documentation improvements

## What does not belong here

- New dependencies without discussion
- Framework migrations
- Redesigns of the visual identity
- Removal of existing interactive modules
- AI model training infrastructure (this is a visualization platform, not a training pipeline)
- Anything that dilutes the educational purpose

---

## Communication

If you are contributing, expect to communicate. This is a long-term project and I want collaborators who understand the direction, not just the current state of the code. Open issues, ask questions, explain your reasoning.

---

## Local setup

```bash
git clone https://github.com/ScDomi/ScDomi.github.io.git
cd ScDomi.github.io
python3 -m http.server 8080
# open http://localhost:8080
```

No build step. No bundler. A static HTTP server is required (ES module import maps do not work over `file://`).

---

## Code conventions

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture reference and coding conventions. Short version:

- Vanilla JS, no framework
- IIFE pattern for non-module scripts; ES modules only for Three.js scenes
- Cache-bust with `?v=<semantic-label>` on every changed script/style
- `innerHTML` only with hardcoded static strings — never user input
- Canvas modules fail silently — never throw to global
- `prefers-reduced-motion` respected in all animation modules

---

*scryx is a years-long project. If you contribute something, you are contributing to something I will maintain and build on for a long time. Treat it accordingly.*
