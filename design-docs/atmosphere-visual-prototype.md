# Gaia dynamic atmosphere — visual prototype

Updated: 2026-10-24
Status: Gaia-only review prototype implemented; appearance awaiting approval. Not installed in the game. Pete approved the generator approach and suggested precomputing a long repeating sequence, but asked to establish the look first. Other atmospheric worlds, production integration and a sequence baker are not implemented.

## Review

`http://127.0.0.1:5173/tests/gaia-atmosphere-preview.html`

- Approved Gaia beside animated Gaia; same original land/ocean/ice painter, fixed geography and no site changes.
- Play/pause, restart, timeline scrub, speed, seed, three starting presets, cloud-only inspection and transparent single-frame PNG export.
- Controls: lower cloud amount, frontal organization, feature scale, detail/erosion, shear, slow evolution, high cirrus, optical thickness, haze and shadows. Amount is a normalized generator control, not a literal global coverage fraction.
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

Prototype limitations: analytic procedural motion, not a meteorological solver. No terrain moisture model, dedicated cyclone lifecycles, volumetric ray marching, day/night terminator, adaptive resolution or CPU generator fallback yet. WebGL2 is needed to GENERATE this preview; a future baked playback path need not require it. CPU submission time shown in the UI is NOT GPU/frame-time measurement.

## Precomputation direction — deferred until appearance approval

The same phase-based generator can produce an offline sequence. Bake the atmosphere layer, not repeated copies of Gaia's terrain or labels. Playback could retain only adjacent frames and blend premultiplied colour/alpha; do not naïvely stack two translucent images with source-over, which changes opacity. Review interpolation for ghosting before picking frame spacing.

Memory matters more than the nominal loop duration:600 uncompressed RGBA frames cost150MiB at256² or600MiB at512², before extra copies/mips. Compressed files reduce download size, not necessarily decoded texture residency. Evaluate resolution, frame cadence, compression/streaming and a bounded two-frame cache after the look is approved. No video codec, texture atlas, storage format or asset size budget committed yet; no long sequence generated in this change.

## Scope and validation

- Original Gaia/Celeste/other-world painters, orbital dispatch, labels, world/atmosphere physics, weather simulation, missions/access and saves unchanged. No production cloud rollout. Main build still has148 modules and the same `index-Bskshzig.js` / `contract-board-worker-CcZKljdC.js` artifacts as before the prototype.
- `npm run test:atmosphere`:61 pure assertions; fixed seed, deterministic/no-frame-RNG volume, safe allocations, immutable bounded controls, integer winds and periodic positive/negative time.
- `tests/atmosphere-native-checks.ts`:13 browser checks; shader compilation via actual generation, exact loop endpoints/reverse scrub, evolving phases, unchanged original-side pixels, continuous loop neighborhood, silhouette/transparent edges, zero-cloud controls, different seeds, coverage/control wiring and no WebGL errors. Atmosphere-off composite compared with independent frozen Gaia baseline (≤1 channel-level rounding allowance between backing stores).
- Desktop Edge/SwiftShader: native checks pass; phase0/90/180 hashes2523478143/304427265/3620701833; reload identical. Premultiplied mean channel change across359.99s→.01s is~.544/255. At phase0,~64.1% of sampled inner-disc pixels have cloud alpha>32,~35.8% alpha>230; these are projected-image metrics, not planetary climate statistics.
- Five loop-phase screenshots plus broken/frontal presets inspected. Play/pause, reload, check-button option restoration, context-loss shutdown and explicit missing-WebGL failure tested. Software-rendered checks establish correctness, not hardware performance. Driver/screenshots: Temp/st-gaia-atmosphere-*-20261024.*.
- All existing world-disc suites and production build pass; existing Vite warnings only. No mobile testing, live-save work or push.

Next: review appearance/motion on Gaia; revise as requested, then separately choose baking/playback and production integration. Keep other approved globes intact until their atmospheric presets are authorized.
