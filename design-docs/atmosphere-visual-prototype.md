# Gaia dynamic atmosphere — visual prototype

Updated: 2026-10-24
Status: Gaia tuning prototype retained. Pete approved the effect and requested an eight-world randomized review gallery; see [atmosphere-sample-gallery.md](atmosphere-sample-gallery.md). Giants explicitly excluded. The approved eight-world weather is now integrated in the game; see [runtime](atmosphere-runtime.md). The review pages remain available; no sequence baker is implemented. The original Gaia-specific implementation/measurements below are retained as reference.

## Review

`http://127.0.0.1:5173/tests/gaia-atmosphere-preview.html`

- Approved Gaia beside animated Gaia; same original land/ocean/ice painter, fixed geography and no site changes.
- Play/pause, restart, timeline scrub, speed, seed, four starting presets (including Cyclonic systems), cloud-only inspection and transparent single-frame PNG export.
- Controls: lower cloud amount, frontal organization, feature scale, detail/erosion, shear, slow evolution, high cirrus, optical thickness, haze, shadows, vortex count/base size/strength, eye clearing and integer spin multiplier. Fifteen sliders, four presets; individual seeded settings are listed underneath. Amount is a normalized generator control, not a literal global coverage fraction.
- Small markers use filtered spatial levels of the SAME generated frame, not independent weather.
- Six-minute preview loop at1×. This is an art timing choice, not Gaia's rotation period or a flight-weather timescale. No game clock mapping decided yet.
- Run visual checks explicitly from the preview; they pause playback and restore the selected profile/time/cloud-only view. `?test=1` starts paused for browser automation.

## Implementation

New preview-only modules:
- `atmosphere-prototype-profile.ts`: immutable/bounded profile, Gaia permanent-ID seed849372310, pure normalized phase, deterministic64³ R8 noise volume (256KiB).
- `atmosphere-prototype-shader.ts`: WebGL2 shell shader. Seeded multiscale density organized by curved/broken frontal envelopes; fine edge erosion, distinct tropical/zonal drift, slower periodic shape distortion, a separate anisotropic cirrus field. Nonlinear optical depth, spherical foreshortening/slant opacity, fixed upper-left lighting and fine cloud relief. No literal spiral stamps.
- `atmosphere-prototype.ts`: one offscreen WebGL2 field, Canvas2D composite, derived cloud-alpha shadow, subtle blue veil/limb. Bounded512px output and successive2× spatial reductions down to4px; no accumulated animation frames. Explicit GPU resource disposal and readable unavailable/context-loss errors.
- `atmosphere-prototype-timing.ts`: optional asynchronous GPU draw queries, at most4 pending/60 retained samples, disjoint invalidation and resource cleanup. Unsupported timing is explicit, not a zero measurement. Excludes Canvas2D copies/compositing/presentation.
- `gaia-atmosphere-preview.ts`: review page only; no imports into production entry points. Exposes seed/time-driven rendering for native checks and future baking.

Integer zonal/tropical/cirrus winding counts plus periodic sine/cosine distortions close the field at phase0/1. Every requested phase is evaluated directly: no integration history, per-frame RNG, accumulated fluid state or cache-dependent weather. The immutable profile/noise seed is independent of display names. Native pixel equality is checked within one browser/backend; different GPU vendors may round differently.

### Initial vortex revision cb6fc61 — 2026-10-24 (historical)

Pete requested vortices as the missing feature. Three systems are enabled by default;14 sliders/four presets now include count0–6, angular radius.12–.50, strength0–2 and eye clearing0–1. Count/strength zero restores the original cloud field exactly on the tested backend.

`atmosphereVortices(seed)` generates six deeply frozen descriptors from an independent stream. Selecting a prefix never reshuffles existing systems or the base noise. Midlatitude centres lie on the sphere in the advected weather frame; northern/southern systems spin oppositely. The shader inverse-warps the existing cloud density around those centres with a radial twist and two complete local turns per loop. Periodic size/twist variation preserves closure. Density blends smoothly into surrounding weather; fine breakup remains in the advected frame so arms retain billows instead of polished concentric threads. Eye clearing is optional; no stroked spirals or painted storm icons. These are persistent procedural circulations, not full storm birth/death simulation.

### Individual spinning systems — 2026-10-24

Pete likes the effect but wants visible spin and different parameters per vortex. The former2 turns per360s made circulation too slow, while stationary fine breakup weakened the motion cue. Fine billows now rotate rigidly with each storm (without differential stretching); the broader density retains its radial curl.

A separate per-system property stream preserves the existing centres/phases/noise. Each descriptor now has its own size multiplier.72–1.20, strength.72–1.27, eye clearing.30–1.45 and integer spin count12–29 per loop. Eye radius also varies with the seeded phase. Gaia's first three systems have12/16/19 turns:30.0/22.5/18.9 seconds per revolution at1×. Global sliders scale these distinct settings, rather than cloning one storm. The new integer spin multiplier0–3 keeps closure;0 stops local spin without removing the storm. Evolution0 now freezes radius/twist breathing for isolated-motion checks. No full storm lifecycle or physics added.

Prototype limitations: analytic procedural motion, not a meteorological solver. No terrain moisture model, dedicated cyclone lifecycles, volumetric ray marching, day/night terminator, adaptive resolution or CPU generator fallback yet. WebGL2 is needed to GENERATE this preview; a future baked playback path need not require it. The UI separates CPU submission from asynchronous GPU cloud-draw timing; neither is complete gameplay frame time.

## Hardware measurements and recommendation — 2026-10-24

Desktop Edge155 / ANGLE D3D11, verified NVIDIA RTX5080, driver32.0.16.1088. Each case:12 warmups,48 uniformly sampled loop phases, one450px globe plus five small markers. Default profile apart from resolution/count. GPU timer wraps only the shader draw. CPU submission includes generation commands, shadows/mips, Gaia drawing and composite; synchronized wall time additionally forces a1px readback. Explicit `willReadFrequently:false` prevents repeated readbacks silently changing the canvas to software. These are isolated measurements, not game FPS or low-end guarantees.

| Resolution / vortices | GPU draw mean / p95 (ms) | CPU submission mean (ms) | Synchronized path mean / p95 (ms) |
|---|---|---|---|
|256 /0|.021 /.023|.371|2.025 /2.300|
|256 /3|.023 /.025|.337|1.863 /2.100|
|256 /6|.024 /.026|.350|1.927 /2.200|
|512 /0|.044 /.046|.337|1.887 /2.200|
|512 /3|.057 /.067|.356|1.963 /2.300|
|512 /6|.060 /.071|.377|2.073 /2.600|

All48 GPU samples valid per case; no GL errors. Creation is separate: an earlier cold-context observation was450ms; the repeat first context was39ms and subsequent contexts~4ms. Prewarm/reuse rather than creating contexts during flight. Initial benchmark without explicit readback hints inflated synchronized cost to6–9ms; discarded as representative normal-path evidence because repeated readbacks can change canvas backing. Driver/data: `Temp/st-gaia-atmosphere-perf-20261024.mjs` / `.json`.

**Recommendation, not production implementation:** retain live generation, update visible cloud layers around10–15Hz and reuse their filtered images between updates; select resolution by visible size and prewarm. The shader is cheap on this hardware, so baking is not presently justified solely to avoid it. Benchmark weaker hardware/full scenes and optimize copies/compositing before final rollout. Baked/low-detail fallback remains an option, especially without WebGL2. No all-world benchmark, production clock mapping, adaptive scheduling or fallback has been implemented.

## Precomputation alternative — still unimplemented

The same phase-based generator can produce an offline sequence. Bake the atmosphere layer, not repeated copies of Gaia's terrain or labels. Playback could retain only adjacent frames and blend premultiplied colour/alpha; do not naïvely stack two translucent images with source-over, which changes opacity. Review interpolation for ghosting before picking frame spacing.

Memory matters more than the nominal loop duration:600 uncompressed RGBA frames cost150MiB at256² or600MiB at512², before extra copies/mips. Compressed files reduce download size, not necessarily decoded texture residency. Evaluate resolution, frame cadence, compression/streaming and a bounded two-frame cache after the look is approved. No video codec, texture atlas, storage format or asset size budget committed yet; no long sequence generated in this change. Faster spin increases the cadence needed to avoid ghosted arms: a6-minute15Hz loop has5400 frames, totaling1.32GiB at256² or5.27GiB at512² if all RGBA frames are decoded/resident. Streaming a bounded few frames avoids that residency; file size/codec/decode cost and interpolation still require actual measurement.

## Scope and validation

- This atmosphere work does not edit production painters, orbital dispatch, labels, world/atmosphere physics, weather, missions/access or saves. Initial05fe774 had identical production artifacts to the preceding build. The spin revision preserves the now-committed Sahra work: production build remains148 modules with `index-xTZ8mJrz.js` and `contract-board-worker-Dle4UKAY.js`.
- `npm run test:atmosphere`:121 profile/noise assertions plus356 timer assertions. Frozen spherical descriptors, individual bounded parameters/speeds, seeded diversity, independent streams, count/spin bounds, fixed seed, deterministic/no-frame-RNG volume, safe allocations, immutable bounded controls, integer winds and periodic positive/negative time.
- `tests/atmosphere-native-checks.ts`:23 browser checks on SwiftShader AND hardware D3D11. Spin-only changes within2s with all other motion frozen; stopped spin is static; isolated system repeats at its own revolution period; live spin control readout. Localized visible vortices, count/size/eye controls and identical count-zero/strength-zero baseline, shader compilation via actual generation, exact loop endpoints/reverse scrub, evolving phases, unchanged original-side pixels, continuous loop neighborhood, silhouette/transparent edges, zero-cloud controls, different seeds, coverage/control wiring and no WebGL errors. Atmosphere-off composite compared with independent frozen Gaia baseline (≤1 channel-level rounding allowance between backing stores).
- Desktop Edge/SwiftShader: native checks pass; spin revision phase0/90/180 hashes2363045251/3007250900/2313460865; reload identical. Vortices-off hash2523478143 matches initial05fe774 exactly; default vortices affect~6.7% of texture pixels by alpha>3. Premultiplied mean channel change across359.99s→.01s is~.734/255. Hardware hashes678938471/3272003766/2571444659, reload identical; seam~.845/255. Cross-backend hashes intentionally differ. At phase0,~67.3% of sampled inner-disc pixels have cloud alpha>32,~36.2% alpha>230; these are projected-image metrics, not planetary climate statistics.
- Seven loop-phase screenshots (including2s/4s) plus broken/frontal/cyclonic presets captured on both backends; default and early spinning hardware phases inspected. Play/pause, reload, check-button option restoration, context-loss shutdown and explicit missing-WebGL failure tested. Software-rendered checks establish correctness, not hardware performance. Driver/screenshots: Temp/st-gaia-atmosphere-*-20261024.*.
- All existing world-disc suites and production build pass; existing Vite warnings only. No mobile testing, live-save work or push.

Pete approved the eight-world rollout, with Dahai's amount reduced25%. Runtime now uses persistent visual seeds and simulation time; giants retain their existing artwork. The original Gaia control page remains available. The shared generator now optionally caches1–16 seed volumes (gallery8, Gaia default1); original Gaia native hashes remain unchanged.
