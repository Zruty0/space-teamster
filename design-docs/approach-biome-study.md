# Hartwell approach / departure biome study

Updated: 2026-10-25 (Pacific)
Status: Pete approved production integration2026-10-24. Enabled in Game for Hartwell approach/departure only. No landing/takeoff redesign or other-world rollout.

## Approved model

Pete specifies one or more biomes per planet (usually one; Gaia may have several), each with its own surface appearance. The designated target rectangle determines the generation seed. Hartwell starts with one biome, not a separate biome for each settlement.

The seed uses the target's persistent POI identity, not its display name, generated mission/phase ID, gate dimensions, arrival time or camera. Repeated visits and approach/departure share it. The future no-target fallback and other planets' biome assignments remain unimplemented.

## Preview

`http://127.0.0.1:5173/tests/hartwell-approach-preview.html`

| Surface target | Stable ID suffix (estella-v-) | Region seed |
|---|---|---:|
| Concord | capital-settlement | 819666517 |
| Dawes Cut | open-cast-mine | 1382687953 |
| Cinderhook Refinery | atmo-refinery | 2606388751 |
| Gale Survey | storm-research | 1520306920 |
| First Landing | abandoned-colony | 999795556 |

Roadstead/Ascension are orbital sites, not missing surface previews. First Landing remains reserved; rendering it in the fixtures does not grant career access. No reservation or story changes.

Controls: regional/upper/low views, approach/departure, along-track pan, detailed-foreground on/off (previous candidate comparison), original scenery, flight-overlay toggle, reset, per-site PNG export and native checks. All five canvases use identical framing for comparison. No save is loaded; fixtures create real generated ApproachLevels in memory. Ship/gate/trajectory/wind graphics use the current production renderer, not a recreated UI.

## Scope boundary: scenery versus collision surface

This first pass preserves the existing foreground/collision contour exactly. The old fixed noise height function is exported without modifying its calculations, and the new foreground uses the same sampling grid. Therefore the foreground outline is intentionally identical at equally framed Hartwell targets. Target seeds currently vary the background massifs and surface materials, not flight obstacles. Replacement of physical terrain, target grounding and later landing continuity require a subsequent approved step.

- One frozen biome, `hartwell-dry-uplands-v1`: rusty ground, ochre beds, muted distant relief, altitude-anchored dusty sky.
- Two target-seeded background relief layers: broad mesa/shoulder geometry first, subordinate erosion noise, softer tones and restrained depth parallax. These are BACKGROUND scenery, not flyable/hittable mountains in the flight plane.
- Clipped foreground rock: broad sediment bands, subdued talus/erosion and deterministic material grain. A restrained warm edge identifies the actual flight surface; no neon wireframe ground or grid.
- Region-relative coordinates account for target position/local direction. No frame RNG. Signed indexed streams let camera movement visit arbitrary cells without regenerating a finite map or retaining unlimited tiles.
- Foreground detail revision requested2026-10-24: patched angular bedrock/fissures, multi-scale regolith, faceted scree with contact shadows/lit bevels and broken fine bedding ledges. All below the same clipping boundary; original sky and background relief remain pixel-identical.
- One lazily generated512×256 RGBA rock/regolith tile per target (~2.5MiB raw across five), sampled at two incommensurate world scales to suppress visible repetition. World-indexed clasts/ledges add non-repeating detail and fade continuously with zoom. Previous256² grain tiles remain behind the comparison toggle (~1.25MiB extra only after use). No WebGL context, animation sequence or unbounded terrain cache. This is not a mobile/performance-budget claim.
- No city/industrial buildings, roads, vegetation, added atmospheric weather/hazards, chemistry/resource claims or terrain/geography changes to the globe.

## Implementation

- `src/approach-biomes.ts`: shared biome definition, explicit five-target assignment, independent immutable region/relief/material seeds and continuous signed-coordinate relief sampling.
- `src/approach-ground-material.ts`: pure seeded periodic material raster, patched cellular rock and granular regolith; no collision/terrain model changes.
- `src/approach-scenery.ts`: Canvas2D painter factory, opt-in only for its assigned Hartwell target. Restores canvas state; declines other bodies/targets or invalid cameras.
- `src/approach.ts`: optional final `ApproachSceneryPainter` argument to `renderApproach`; original background is the default/fallback. Game now supplies the approved Hartwell dispatcher; other bodies/unknown targets fall back unchanged. Exposes unchanged original background and terrain sampling for comparisons.
- `src/approach-scenery-runtime.ts`: lazy per-Game dispatcher with five source pairs; static foreground material is raster-cached in world-space strips (details below). Same seeds through visits/retries/approach/departure. No save IO or new seed key. Detailed mode only; comparison textures are gallery-only.
- `tests/hartwell-approach-preview.{html,ts}`: retained five-site gallery using ten real approach/departure levels.
- `tests/hartwell-flight.{html,ts}`: optional save-free playable practice at `/tests/hartwell-flight.html`. Uses actual `updateApproach`, production camera/keyboard and `Game.renderGameplayPhase`, synthetic nearby or full-entry starts. Starts paused; site/phase selectors, Fly/Pause/restart, hidden/focus-loss pause. Fixed1×, no career cargo/maintenance modifiers, settlement or phase handoff; stops at success/failure. Does not load/save career or unlock First Landing.
- Runtime camera safeguards: skip invisible foreground/material allocation above the ground; skip zero-opacity small geometry at wide zoom. Deep cutaway texture fades between−2km and−8km so wide ascent does not expose a screen full of repetitive underground material. Regional/low gallery appearance unchanged.

## Validation

`npm run test:approach-biomes`:667473 assertions (includes per-pixel material opacity bounds) — complete surface roster, pinned seeds, shared frozen biome, independent streams, continuous negative/positive coordinate cells, bounded/repeatable relief, target translation/direction mapping and1001 exact comparisons against the original flight-height formula.

Desktop Edge native85 checks: detailed mode changes substantial foreground area while preserving every tested backdrop pixel; detail-toggle replay is exact. Also five distinct scenery images, exact approach/departure and pan/zoom replay, all five real render paths, original-default/declined-hook pixel equality, canvas-state restoration, unchanged flight state/levels/weather/gates/catalog, other-world refusal. Reload reproduces all five hashes; actual slider/original-toggle controls and career-byte isolation checked externally. Regional/upper/low/departure/original and all five individual images inspected/captured. Driver/report/screenshots: `Temp/st-hartwell-approach-cdp-20261024.mjs`, `st-hartwell-approach-native-20261024.json`, `st-hartwell-approach-*-20261024.png`.

Controls-legibility follow-up: the bottom34px controls strip now has an opaque black backing in approach/departure; text, font, colors and position unchanged.

Production integration:142 native checks across all five real approach/departure scenes, actual Game hook/HUD versus approved painter, original-fallback differences, actual control/physics advance and deterministic retry, real camera zoom.008–.08, other-world exact fallback, unchanged career/levels/catalog. Cached ground is spatially filtered at its raster LOD, not expected to match direct vectors pixel-for-pixel at arbitrary zoom. Sky/background above the live contour match within1 channel; a native-scale material row through a strip seam matches within2 channels. Cached stationary replay is exact, eviction/rebuild within1 channel; gallery same-painter replay remains exact. Live keyboard thrust, pause and safe paused reload/career isolation also pass. `Temp/st-hartwell-flight-cdp-20261024.mjs` and matching report/screenshots retain evidence.

Historical initial CPU-only sampling (5.1–5.8ms means) was not a frame-rate budget. The subsequent FPS regression and fix are measured below. No mobile budget established. Balor/empty-rig regressions and production build pass. Farwatch/Barataria changes were committed separately and retained. No mobile tests, manual live-save edits, push or deploy.

## FPS / target visibility correction — 2026-10-25

Pete reports poor approach FPS and a target rect lost against non-black scenery. Reproduced with a moving camera at1920×1080: the uncached detailed renderer ran~19–24FPS on RTX5080/Edge/D3D11, despite CPU submission means near12ms. CPU profiling identified repeated foreground path/fill work (thousands of small clasts), not flight physics, as the dominant renderer work. CPU submission alone had hidden substantial frame-delivery cost.

Production now keeps live sky/background/parallax and rasterizes only static ground material:
-512px core strips plus4px bleed, fixed world positions, keyed by target ID/gateX/local direction/LOD/strip index. Original seed/landform functions generate each strip. Native ground detail is retained, spatially filtered when zoomed.
- A deterministic scale ladder and pure viewport-budget policy ensure the complete visible set fits the cache, avoiding eviction/rebuild loops. Global per-Game LRU:≤32 strips and≤8,388,608 pixel backing (32MiB raw RGBA, not a claim of total browser/GPU memory). Existing five material tiles add≤2.5MiB raw; no temporal animation cache.
- Strips cover+2km to−8km; the actual height function remains≤1.9km, and the approved deeper cutaway is solid dark. Opaque overlapping bleed removes fractional-pixel gaps. Eviction releases old backing dimensions.
- Live4px-sampled foreground clipping and edge are still drawn from the unchanged collision-height function every frame. Never use a cached/scaled silhouette for collision clearance. Physics, gate coordinates, wind, sky/background, HUD and ship are not cached.
- Source direct painter remains in the gallery/reference tests. Runtime diagnostics expose builds/hits/evictions/pixel counts; clear/revisit reconstruct deterministically. Cold first-use or new-LOD strip builds can still cause brief hitches; observed initial cached-frame CPU34–50ms, warm moving-frame maxima6.6–10.5ms in the final run. No universal stutter-free/mobile claim.

Target rect: continuous7px dark backing,4px pale dash edging, original2px speed-status color/dashes, opaque speed-label background. Bounds, speed checks, text/font/anchor and black controls strip unchanged. Native checks cover acceptable and excessive speed states, allfive sites/both phases, cache bounds/stationary hits/forced eviction/clear/seams/above-ground pixel identity, and unchanged flight/catalog/career state.

### Measured moving-camera render delivery

Headless Edge/D3D11, verified RTX5080; real Game approach render/HUD/trajectory, fixed representative state, moving/panning camera with8% zoom variation.150 RAF frames/case, first30 excluded from steady metrics; no readback inside timed runs. This is a controlled approach-render test, not a full-career/mobile guarantee. Display scheduling ceiling~120Hz. Separate original wireframe, direct detailed and cached-runtime cases.

| Case | CPU mean/p95 | Delivered frames/s |
|---|---|---|
|1920×1080, zoom.065, old runtime before fix|12.13/13.90ms|21.55|
|1920×1080, zoom.065, direct reference after fix|12.35/13.80ms|23.22|
|1920×1080, zoom.065, cached runtime|.73/1.00ms|119.96|
|1200×720, zoom.065, cached runtime|.63/.80ms|119.98|
|1920×1080, zoom.008, cached runtime|1.38/1.80ms|119.99|

Repeat under concurrent unit/build activity: detailed direct19.30FPS versus cached119.98FPS at1080p; cached CPU mean.96ms/p951.20ms. Far/zoomed-out rendering was already near120FPS and remains so. Native stress tests alternate cold LODs and do pixel readbacks; their CPU averages are not these steady-state figures.

Reproduction/evidence: `Temp/st-approach-perf-20261025.mjs`; `st-approach-perf-{before,after,after-final}-20261025.json` include raw CPU profiles, hardware strings, timings and cache counts. Isolated benchmark/native sessions block the Vite HMR client to avoid concurrent Thule edits reloading the page during measurements; the normal dev server/HMR remain untouched. Existing native flight driver/report/screenshots refreshed. Thule/economy work in the shared tree is unrelated and excluded from the scoped commit.
