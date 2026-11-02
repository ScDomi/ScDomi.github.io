# ATTRIBUTION.md — Third-Party Assets

This file documents the origin, license, and attribution requirements for third-party assets used in ScDomi/ScDomi.github.io.

The MIT license in `LICENSE` covers **original code only** and does not extend to the assets listed below.

---

## 3D Models

### Spine Vertebrae (`assets/models/spine/`)

**Files:** `c3.obj`, `c5.obj`, `c7.obj`, `l1.obj`, `l3.obj`, `l5.obj`, `t2.obj`, `t4.obj`, `t6.obj`, `t8.obj`, `t10.obj`, `t12.obj`

**Source:** BodyParts3D / Anatomography  
**Producer:** Database Center for Life Science (DBCLS), Research Organization of Information and Systems (ROIS), Japan  
**Dataset URL:** https://dbarchive.biosciencedbc.jp/en/bodyparts3d/  
**Anatomography URL:** https://lifesciencedb.jp/bp3d/  
**Evidence:** OBJ file headers contain `# Compatibility version : 4.3` and FJ-series identifiers, consistent with BodyParts3D CT-derived anatomy models

**License:** Creative Commons Attribution 4.0 International (CC BY 4.0)  
**License URL:** https://creativecommons.org/licenses/by/4.0/  
**Notes:** The legacy OBJ file comments cite "CC BY-SA 2.1 Japan" (the original license), but the official BodyParts3D database license was updated to CC BY 4.0. CC BY 4.0 allows redistribution and adaptation with attribution; no ShareAlike obligation applies under the current license.

**Attribution required:**
> BodyParts3D, © 2008 Database Center for Life Science, licensed under CC Attribution 4.0 International.

---

### Human Brain Model (`assets/models/brain.obj`)

**Source:** UNVERIFIED  
**License:** UNKNOWN  
**Status:** ⚠️ Origin not confirmed. The model is used as a decorative WebGL background mesh. Before redistribution or commercial use, the source and license must be confirmed.

**Action required:** Identify source (possible candidates: BodyParts3D, Sketchfab CC0/CC BY, or custom mesh). Document in this file once confirmed.

---

### Fly Brain (`assets/models/fly-brain-vfb-00101567-lite.obj`)

**Source:** Virtual Fly Brain (VFB), https://virtualflybrain.org  
**Dataset identifier:** VFB_00101567 (Drosophila melanogaster brain neuropil mesh)  
**Derived from:** Published VFB dataset; the `-lite` suffix indicates mesh was simplified for web rendering  
**Producer:** VFB is maintained by the University of Edinburgh, MRC Laboratory of Molecular Biology, and collaborating institutions

**License:** ⚠️ Per VFB documentation: *"Licence terms differ per dataset and are set by the original producer, not by VFB. Absence of a stated licence on VFB is not a grant of permission."*  
The specific license for VFB_00101567 must be confirmed on its Term Info page:  
https://v2.virtualflybrain.org/org.geppetto.frontend/geppetto (search VFB_00101567)

**Status:** PARTIALLY VERIFIED — source identified, specific license requires confirmation via VFB Term Info page.

**Required citation (VFB platform):**  
> Court R et al. (2023). Virtual Fly Brain — An interactive atlas of the Drosophila nervous system. *Front. Physiol.* doi:10.3389/fphys.2023.1076533

---

### FlyWire Neuropil Connectivity Data (`assets/flywire_neuropil.json`)

**Source:** FlyWire Connectome Project, https://flywire.ai  
**Content:** Aggregated synapse counts between Drosophila brain neuropil regions, used for the DL fly-brain visualization  
**Producer:** FlyWire Consortium (Princeton University, Allen Institute, and community contributors)

**License:** ⚠️ CC BY-NC 4.0 (Non-Commercial) — per https://flywire.ai/guidelines  
*"FlyWire's public release data is made available under license CC BY-NC 4.0"*

**Non-Commercial restriction:** The CC BY-NC 4.0 license prohibits use "primarily intended for or directed toward commercial advantage or monetary compensation." This site is a non-commercial personal/educational project; use appears compliant. However, if the site or this codebase is used in a commercial context, this file must be reviewed or replaced.

**Required citation:**  
> Dorkenwald S et al. (2024). Neuronal wiring diagram of an adult brain. *Nature* doi:10.1038/s41586-024-07558-y  
> FlyWire Consortium. Public release v783. https://flywire.ai/guidelines

---

### Jellyfish Model (`assets/models/ambient/jellyfish.obj`)

**Source:** UNVERIFIED  
**License:** UNKNOWN  
**Status:** ⚠️ Origin not confirmed. Used as an ambient background 3D element.

**Action required:** Identify source and confirm license before redistribution.

---

## JavaScript Libraries (CDN)

These are loaded from CDN at runtime and are not bundled in the repository.

| Library | Version | License | CDN |
|---|---|---|---|
| Three.js | 0.160 / 0.164 | MIT | jsDelivr |
| GSAP | 3.12.5 | Standard GSAP License (free for personal/non-commercial) | jsDelivr |
| ScrollTrigger | 3.12.5 | Standard GSAP License | jsDelivr |
| Lenis | 1.0.42 | MIT (Studio Freight) | jsDelivr |
| MathJax | 3 (tex-mml-chtml) | Apache 2.0 | jsDelivr |

**GSAP licensing note:** The GSAP Standard License covers personal and non-commercial use for free. Commercial use requires a paid license. This site is non-commercial; current usage is compliant. Verify before commercial deployment.

---

## Fonts

No custom fonts are loaded. The site uses system font stacks only.

---

## Images and SVGs

All images and SVGs in `assets/brand/`, `assets/projects/`, and `assets/about-*.svg` are original works by ScDomi, unless otherwise noted. No attribution required.

---

## Summary Table

| Asset | Status | License | Action Needed |
|---|---|---|---|
| Spine OBJs (12 files) | ✅ Verified | CC BY 4.0 | Add attribution text |
| brain.obj | ⚠️ Unverified | Unknown | Identify source |
| fly-brain-vfb-...obj | ⚠️ Partial | Unknown (VFB per-dataset) | Check VFB Term Info |
| flywire_neuropil.json | ⚠️ NC restriction | CC BY-NC 4.0 | OK for non-commercial; note for future commercial use |
| jellyfish.obj | ⚠️ Unverified | Unknown | Identify source |
| Three.js | ✅ | MIT | None |
| GSAP | ✅ Non-commercial | GSAP Standard | Verify if commercial |
| Lenis | ✅ | MIT | None |
| MathJax | ✅ | Apache 2.0 | None |

---

*Last updated: 2026-11-02*
