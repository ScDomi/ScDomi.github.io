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
**Evidence:** OBJ file headers contain `# Compatibility version : 4.3` and FJ-series identifiers, consistent with BodyParts3D CT-derived anatomy models

**License:** Creative Commons Attribution 4.0 International (CC BY 4.0)  
**License URL:** https://creativecommons.org/licenses/by/4.0/  
**Source page last updated:** 2025/02/27 (confirmed from dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)  
**Notes:** OBJ file comments cite the original "CC BY-SA 2.1 Japan" license. The official BodyParts3D database license has since been updated to CC BY 4.0, which allows redistribution and adaptation with attribution and carries no ShareAlike obligation.

**Required attribution:**
> BodyParts3D, © Database Center for Life Science, licensed under CC Attribution 4.0 International.

---

### Human Brain Model (`assets/models/brain.obj`)

**Source:** BodyParts3D / Anatomography (DBCLS)  
**Evidence:** OBJ file header: `# scryx brain (decimated) — BodyParts3D/Anatomography 4.3 (c) DBCLS, CC BY-SA 2.1 JP`  
**Processing:** Mesh decimated by the project author for web rendering performance

**License:** Creative Commons Attribution 4.0 International (CC BY 4.0)  
**Notes:** Same source and license as the spine models above. The header cites the original CC BY-SA 2.1 JP; the current official BodyParts3D license is CC BY 4.0.

**Required attribution:**
> BodyParts3D, © Database Center for Life Science, licensed under CC Attribution 4.0 International.

---

### Jellyfish Model (`assets/models/ambient/jellyfish.obj`)

**Source:** BodyParts3D / Anatomography (DBCLS)  
**Evidence:** OBJ file header: `# scryx ambient neural creature — BodyParts3D (c) DBCLS, CC BY-SA 2.1 JP`

**License:** Creative Commons Attribution 4.0 International (CC BY 4.0)  
**Notes:** Same source and license as brain.obj and spine models above.

**Required attribution:**
> BodyParts3D, © Database Center for Life Science, licensed under CC Attribution 4.0 International.

---

### Fly Brain (`assets/models/fly-brain-vfb-00101567-lite.obj`)

**Source:** Original procedurally generated mesh — **CC0 1.0 Universal (public domain)**  
**Generated:** 2026-11-02, as part of ScDomi/ScDomi.github.io  
**Method:** Bicephalic ellipsoid with bilateral symmetry and low-frequency organic surface perturbations. No anatomical dataset used. Coordinate space matches the original VFB bounding box for drop-in rendering compatibility.

**License:** ✅ CC0 1.0 Universal — no restrictions, no attribution required  
**Third-party rights:** None. This is an original work.

**Note on replacement:** A prior version of this file was derived from VirtualFlyBrain (VFB_00101567, JRC2018 dataset, CC BY-NC-SA 4.0). That file was replaced with this CC0 original to eliminate the Non-Commercial and ShareAlike restrictions from the repository. The visualization function (3D brain envelope for the DL fly-brain chapter) is preserved.

---

### FlyWire Neuropil Connectivity Data (`assets/flywire_neuropil.json`)

**Source:** FlyWire Whole-brain Connectome Connectivity Data, Zenodo record 10676866  
**URL:** https://zenodo.org/records/10676866  
**Content:** Aggregated synapse counts between 28 Drosophila brain neuropil regions + neurotransmitter probability data (GABA / ACh / glutamate), derived from FlyWire v783 adult female brain connectome  
**Producer:** FlyWire Consortium

**License:** ✅ Creative Commons Attribution 4.0 International (CC BY 4.0)  
**Evidence:** Zenodo record 10676866 license field reads: *"Creative Commons Attribution 4.0 International"* — confirmed by direct page load (2026-11-02).  
**Note:** The FlyWire.ai platform website lists CC BY-NC 4.0 for general platform data. The specific Zenodo dataset used here (10676866) is **CC BY 4.0** — no Non-Commercial restriction.

**Source provenance:** `dl-visualizer.js` contains the attribution comment: `Source: FlyWire Consortium, proofread_connections_783 (Zenodo 10676866)`. The data structure (regions, syn matrix, nt probabilities) matches the Zenodo 10676866 dataset contents.

**Required citation:**
> Dorkenwald S et al. (2024). Neuronal wiring diagram of an adult brain. *Nature* doi:10.1038/s41586-024-07558-y  
> FlyWire Whole-brain Connectome Connectivity Data (v783.0). Zenodo. https://doi.org/10.5281/zenodo.10676866

---

## JavaScript Libraries (CDN)

Loaded from CDN at runtime — not bundled in the repository.

| Library | Version | License | CDN |
|---|---|---|---|
| Three.js | 0.160 / 0.164 | MIT | jsDelivr |
| GSAP | 3.12.5 | Standard GSAP License (free for personal/non-commercial) | jsDelivr |
| ScrollTrigger | 3.12.5 | Standard GSAP License | jsDelivr |
| Lenis | 1.0.42 | MIT (Studio Freight) | jsDelivr |
| MathJax | 3 (tex-mml-chtml) | Apache 2.0 | jsDelivr |

**GSAP note:** The Standard GSAP License covers personal and non-commercial use at no cost. This site is non-commercial; usage is compliant. Verify before commercial deployment.

---

## Fonts

No custom fonts. System font stacks only.

---

## Images and SVGs

All files in `assets/brand/`, `assets/projects/`, and `assets/about-*.svg` are original works by ScDomi. No third-party attribution required.

---

## Summary Table

| Asset | Status | License | Action Needed |
|---|---|---|---|
| Spine OBJs (12 files) | ✅ Verified | CC BY 4.0 (BodyParts3D/DBCLS) | Attribution in this file ✅ |
| brain.obj | ✅ Verified | CC BY 4.0 (BodyParts3D/DBCLS) | Attribution in this file ✅ |
| jellyfish.obj | ✅ Verified | CC BY 4.0 (BodyParts3D/DBCLS) | Attribution in this file ✅ |
| fly-brain-vfb-...obj | ✅ CC0 (original, generated 2026-11-02) | CC0 1.0 Universal | None |
| flywire_neuropil.json | ✅ Verified | CC BY 4.0 (Zenodo 10676866, confirmed by direct page load) | Attribution in this file ✅ |
| Three.js | ✅ | MIT | None |
| GSAP | ✅ Non-commercial | GSAP Standard | Verify if commercial use arises |
| Lenis | ✅ | MIT | None |
| MathJax | ✅ | Apache 2.0 | None |

---

*Last updated: 2026-11-02*
