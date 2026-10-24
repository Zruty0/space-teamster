# Atmospheric-world sample gallery

Updated: 2026-10-24
Status: approved and integrated into the game. Current v2 reduces Dahai's cloud amount25%; historical v1 links remain reproducible. See [runtime](atmosphere-runtime.md).

## Scope and review

`http://127.0.0.1:5173/tests/atmosphere-gallery.html`

Pete approved the Gaia effect, requested randomized per-world parameters and ten animated candidates per atmospheric world, then explicitly excluded the giants. Eight worlds: Acheron, Gaia, Dahai, Hartwell, Kuznia, Almaden, Marisma and Mercy. Gryphon/Hydra/Manticore are absent; their existing artwork is untouched. This includes the three atmospheric moons, not just bodies catalogued as planets.

- One independent1–10 slider per world;80 total candidates, one selected/animated per card.
- Different cloud/haze palettes, amounts, optical depths, feature scales, fronts, circulation counts/sizes/strengths, shear, evolution and speeds. **Dahai is silvery**, with correlated neutral/cool channels—not independently randomized RGB.
- Global play/pause, speed, restart and original-art toggle. Small corner images show approved originals; smaller markers reuse the exact generated cloud frame.
- Batch seed comes from `Date.now()` once on initial creation or New time-seeded batch. Not per frame or per visit to a card. Load seed allows explicit reproduction.
- URL retains range version, seed, independent choices and starting time. Review link updates immediately; address-bar writes are limited to4Hz to avoid Chromium history flooding during rapid slider input. `?test=1` starts paused.
- Export JSON includes range version, seed, time, all80 exact profiles and selected choices. No career storage reads/writes. No automatic selection persistence beyond the review URL.
- Expanding each card displays its selected profile and the predefined ranges.

## Art directions

Generator amount is a normalized art control, NOT literal global coverage or physical density. Loop durations are illustration timing, not meteorological or rotation periods.

| World | Palette / structure | Amount | Optical depth | Loop seconds |
|---|---|---|---|---|
|Acheron|Ochre/brass/cream, dense fast broad decks|.72–.96|4.5–7|400–700|
|Gaia|Bright water clouds, blue limb, broken fronts|.30–.68|2.5–4.5|300–500|
|Dahai|Silvery marine decks, ocean/ice underneath|.435–.645 (v2)|3.8–6|240–420|
|Hartwell|Sparse copper/ochre dust veils|.15–.40|.5–1.8|360–720|
|Kuznia|Steel-grey banks and strong cold fronts|.60–.90|3.5–6.5|240–420|
|Almaden|Faint sulfur-cream wisps|.12–.34|.4–1.3|350–600|
|Marisma|Amber/tan haze and slow broad cloud masses|.50–.80|2.5–5|500–850|
|Mercy|Very thin pearl-violet high wisps|.10–.28|.35–1|600–1000|

These are approved visual directions, not new atmospheric chemistry, hazards or resource claims. Solid-world painters/geography remain fixed. Acheron's candidate uses an opaque atmospheric underdeck instead of stacking new weather over its old static cloud shapes; it never exposes invented terrain. Original Acheron remains visible in the corner and original-art mode. Their original painters remain fallback/reference art. Production now composites weather on the eight eligible worlds; giant artwork remains unchanged.

## Implementation

- `src/atmosphere-gallery-profiles.ts`: frozen versioned per-world ranges and palettes. Each continuous parameter uses independently seeded, randomly shuffled ten-stratum sampling (Latin hypercube), so ten candidates span the range instead of clustering. Discrete counts/turns remain integral. Colors interpolate coherent endpoints together. Seed namespace includes batch, stable body ID and parameter/sample identity, not display name.
- `src/atmosphere-gallery.ts`: preview entry point, shared absolute art clock, immutable samples; selection never rerolls other worlds. New batches preserve the slider choices. Fixed base/reference images are cached separately from weather.
- `createAtmospherePrototype(resolution,noiseCacheCapacity=1)` now supports a bounded1–16 entry LRU of seeded R8 volumes and vortex uniforms. Gallery uses one256px WebGL2 generator and eight entries: at most2MiB noise textures, plus output/shadow/mips/card canvases. No80-context or temporal-frame cache. Retired sample seeds are released immediately; general LRU eviction remains bounded and deterministic. Default Gaia pilot behavior stays single-seed.
- Draw each world's field, composite its full/small views, then reuse the shared output for the next world. Canvas2D snapshots preserve independent card images. Visible canvases update around10Hz; offscreen cards retain their last image, and hidden pages pause their clock. Explicit initial/batch/selection/test draws can refresh offscreen images once.
- Display canvases explicitly use `willReadFrequently:false`: repeated native pixel checks otherwise trigger browser backing-store changes and can alter rounding. Context loss stops animation and disables controls; missing WebGL2 produces an explicit error.

## Validation

- Profile/noise tests127 assertions; timer tests356; gallery tests2092 (including v1/v2 compatibility): exact non-giant catalog/physics roster,80 distinct seeds/profiles, deep immutability, full parameter strata, bounded ranges without silent renderer clipping, deterministic replay without internal clock/RNG, silver Dahai and sparse thin atmospheres.
-196 native gallery assertions on desktop Edge/D3D11: every candidate renders distinctly and exactly repeats at its own loop endpoint; original reference pixels fixed, independent selectors, animation, shared-output snapshot isolation, seed replay after eviction, original-art toggle, bounded noise cache and no GL errors.
- UI driver verifies URL reload (all samples10 at3s), play/pause, offscreen canvas culling, hidden-page gate, fresh time-seeded batch, context-loss and missing-WebGL handling. Sample1/sample10 galleries inspected. Driver/report/screenshots: `Temp/st-atmosphere-gallery-*-20261024.*`.
- Existing Gaia pilot23 native checks/UI/failure paths still pass; original SwiftShader hashes2363045251/3007250900/2313460865 and vortex-off2523478143 unchanged after resource-cache extension.
- Build and previous world-disc suites pass. Shared tree contains another worker's Sahra economy implementation; its production module/artifact changes are unrelated to this preview. No mobile testing, manual live-save edits, physical weather changes or push. The later production installation is documented separately in atmosphere-runtime.md.

Pete subsequently approved rollout without choosing specific sample numbers. Production picks one stable candidate per body from its separate time-seeded cosmetic configuration. Review links/exports still preserve exact choices for future tuning. v1 uses the original Dahai amount; v2 changes only that amount by.75. Current runtime clock/seed/fallback policy is in atmosphere-runtime.md.
