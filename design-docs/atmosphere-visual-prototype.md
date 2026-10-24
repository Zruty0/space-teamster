# Gaia dynamic atmosphere — visual prototype

Updated: 2026-10-24
Status: Gaia-only review prototype implemented; appearance awaiting approval. Not installed in the game. Pete approved the generator approach and suggested precomputing a long repeating sequence, but asked to establish the look first. Other atmospheric worlds, production integration and a sequence baker are not implemented.

## Review

`http://127.0.0.1:5173/tests/gaia-atmosphere-preview.html`

- Approved Gaia beside animated Gaia; same original land/ocean/ice painter, fixed geography and no site changes.
- Play/pause, restart, timeline scrub, speed, seed, four starting presets (including Cyclonic systems), cloud-only inspection and transparent single-frame PNG export.
- Controls: lower cloud amount, frontal organization, feature scale, detail/erosion, shear, slow evolution, high cirrus, optical thickness, haze, shadows, vortex count/size/strength and eye clearing. Amount is a normalized generator control, not a literal global coverage fraction.
- Small markers use filtered spatial levels of the SAME generated frame, not independent weather.
- Six-minute preview loop at1×. This is an art timing choice, not Gaia's rotation period or a flight-weather timescale. No game clock mapping decided yet.
- Run visual checks explicitly from the preview; they pause playback and restore the selected profile/time/cloud-only view. `?test=1` starts paused for browser automation.

## Implementation

New preview-only modules:
- `atmosphere-prototype-profile.ts`: immutable/bounded profile, Gaia permanent-ID seed849372310, pure normalized phase, deterministic64³ R8 noise volume (256KiB).
- `atmosphere-prototype-shader.ts`: WebGL2 shell shader. Seeded multiscale density organized by curved/broken frontal envelopes; fine edge erosion, distinct tropical/zonal drift, slower periodic shape distortion, a separate anisotropic cirrus field. Nonlinear optical depth, spherical foreshortening/slant opacity, fixed upper-left lighting and fine cloud relief. No literal spiral stamps.
- `atmosphere-prototype.ts`: one offscreen WebGL2 field, Canvas2D composite, derived cloud-alpha shadow, subtle blue veil/limb. Bounded512px output and successive2× spatial reductions down to4px; no accumulated animation frames. Explicit GPU resource disposal and readable unavailable/context-loss errors.
- `gaia-atmosphere-preview.ts`: review page only; no imports into production entry points. Exposes seed/time-driven rendering for native checks and future baking.

Integer zonal/tropical/cirrus winding counts plus periodic sine/cosine distortions close the field at phase0/1. Every requested phase is evaluated directly: no integration history, per-frame RNG, accumulated fluid state or cache-dependent weather. The immutable profile/noise seed is independent of display names. Native pixel equality is checked within one browser/backend; different GPU vendors may round differently.

### Vortex review revision — 2026-10-24

Pete requested vortices as the missing feature. Three systems are enabled by default;14 sliders/four presets now include count0–6, angular radius.12–.50, strength0–2 and eye clearing0–1. Count/strength zero restores the original cloud field exactly on the tested backend.

`atmosphereVortices(seed)` generates six deeply frozen descriptors from an independent stream. Selecting a prefix never reshuffles existing systems or the base noise. Midlatitude centres lie on the sphere in the advected weather frame; northern/southern systems spin oppositely. The shader inverse-warps the existing cloud density around those centres with a radial twist and two complete local turns per loop. Periodic size/twist variation preserves closure. Density blends smoothly into surrounding weather; fine breakup remains in the advected frame so arms retain billows instead of polished concentric threads. Eye clearing is optional; no stroked spirals or painted storm icons. These are persistent procedural circulations, not full storm birth/death simulation.

Prototype limitations: analytic procedural motion, not a meteorological solver. No terrain moisture model, dedicated cyclone lifecycles, volumetric ray marching, day/night terminator, adaptive resolution or CPU generator fallback yet. WebGL2 is needed to GENERATE this preview; a future baked playback path need not require it. CPU submission time shown in the UI is NOT GPU/frame-time measurement.

## Precomputation direction — deferred until appearance approval

The same phase-based generator can produce an offline sequence. Bake the atmosphere layer, not repeated copies of Gaia's terrain or labels. Playback could retain only adjacent frames and blend premultiplied colour/alpha; do not naïvely stack two translucent images with source-over, which changes opacity. Review interpolation for ghosting before picking frame spacing.

Memory matters more than the nominal loop duration:600 uncompressed RGBA frames cost150MiB at256² or600MiB at512², before extra copies/mips. Compressed files reduce download size, not necessarily decoded texture residency. Evaluate resolution, frame cadence, compression/streaming and a bounded two-frame cache after the look is approved. No video codec, texture atlas, storage format or asset size budget committed yet; no long sequence generated in this change.

## Scope and validation

- This atmosphere work does not edit production painters, orbital dispatch, labels, world/atmosphere physics, weather, missions/access or saves. Initial05fe774 had identical production artifacts to the preceding build. Vortex-revision validation also includes concurrent Sahra content work by another worker; its changed production artifacts/files are not part of the atmosphere revision.
- `npm run test:atmosphere`:97 pure assertions; frozen spherical vortex descriptors/independent seeds/count bounds,  fixed seed, deterministic/no-frame-RNG volume, safe allocations, immutable bounded controls, integer winds and periodic positive/negative time.
- `tests/atmosphere-native-checks.ts`:19 browser checks; localized visible vortices, count/size/eye controls and identical count-zero/strength-zero baseline,  shader compilation via actual generation, exact loop endpoints/reverse scrub, evolving phases, unchanged original-side pixels, continuous loop neighborhood, silhouette/transparent edges, zero-cloud controls, different seeds, coverage/control wiring and no WebGL errors. Atmosphere-off composite compared with independent frozen Gaia baseline (≤1 channel-level rounding allowance between backing stores).
- Desktop Edge/SwiftShader: native checks pass; vortex revision phase0/90/180 hashes540820995/3949268624/3463169560; reload identical. Vortices-off hash2523478143 matches initial05fe774 exactly; default vortices affect~6.0% of texture pixels by alpha>3. Premultiplied mean channel change across359.99s→.01s is~.596/255. At phase0,~66.4% of sampled inner-disc pixels have cloud alpha>32,~36.1% alpha>230; these are projected-image metrics, not planetary climate statistics.
- Five loop-phase screenshots plus broken/frontal/cyclonic presets captured; default and cyclonic revision views inspected. Play/pause, reload, check-button option restoration, context-loss shutdown and explicit missing-WebGL failure tested. Software-rendered checks establish correctness, not hardware performance. Driver/screenshots: Temp/st-gaia-atmosphere-*-20261024.*.
- All existing world-disc suites and production build pass; existing Vite warnings only. No mobile testing, live-save work or push.

Next: review appearance/motion on Gaia; revise as requested, then separately choose baking/playback and production integration. Keep other approved globes intact until their atmospheric presets are authorized.
