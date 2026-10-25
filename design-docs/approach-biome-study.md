# Hartwell approach / departure biome study

Updated: 2026-10-24 (Pacific)
Status: preview implemented for all five surface sites; awaiting visual review. Not enabled in Game. No landing/takeoff redesign or other-world rollout.

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

Roadstead/Ascension are orbital sites, not missing surface previews. First Landing is a synthetic rendering fixture only; no career access, reservation or story changes.

Controls: regional/upper/low views, approach/departure, along-track pan, original scenery, flight-overlay toggle, reset, per-site PNG export and native checks. All five canvases use identical framing for comparison. No save is loaded; fixtures create real generated ApproachLevels in memory. Ship/gate/trajectory/wind graphics use the current production renderer, not a recreated UI.

## Scope boundary: scenery versus collision surface

This first pass preserves the existing foreground/collision contour exactly. The old fixed noise height function is exported without modifying its calculations, and the new foreground uses the same sampling grid. Therefore the foreground outline is intentionally identical at equally framed Hartwell targets. Target seeds currently vary the background massifs and surface materials, not flight obstacles. Replacement of physical terrain, target grounding and later landing continuity require a subsequent approved step.

- One frozen biome, `hartwell-dry-uplands-v1`: rusty ground, ochre beds, muted distant relief, altitude-anchored dusty sky.
- Two target-seeded background relief layers: broad mesa/shoulder geometry first, subordinate erosion noise, softer tones and restrained depth parallax. These are BACKGROUND scenery, not flyable/hittable mountains in the flight plane.
- Clipped foreground rock: broad sediment bands, subdued talus/erosion and deterministic material grain. A restrained warm edge identifies the actual flight surface; no neon wireframe ground or grid.
- Region-relative coordinates account for target position/local direction. No frame RNG. Signed indexed streams let camera movement visit arbitrary cells without regenerating a finite map or retaining unlimited tiles.
- One lazily generated256² RGBA grain tile per preview target (~1.25MiB total raw pixels across five), placed in world coordinates, reused across draws. No WebGL context, animation sequence or unbounded terrain cache. This is not a mobile/performance-budget claim.
- No city/industrial buildings, roads, vegetation, added atmospheric weather/hazards, chemistry/resource claims or terrain/geography changes to the globe.

## Implementation

- `src/approach-biomes.ts`: shared biome definition, explicit five-target assignment, independent immutable region/relief/material seeds and continuous signed-coordinate relief sampling.
- `src/approach-scenery.ts`: Canvas2D painter factory, opt-in only for its assigned Hartwell target. Restores canvas state; declines other bodies/targets or invalid cameras.
- `src/approach.ts`: optional final `ApproachSceneryPainter` argument to `renderApproach`; original background is the default/fallback. Existing Game calls supply no painter. Exposes unchanged original background and terrain sampling for comparisons.
- `tests/hartwell-approach-preview.{html,ts}`: isolated five-site gallery using ten real approach/departure levels. No production import of the new biome or painter modules.

## Validation

`npm run test:approach-biomes`:11421 assertions — complete surface roster, pinned seeds, shared frozen biome, independent streams, continuous negative/positive coordinate cells, bounded/repeatable relief, target translation/direction mapping and1001 exact comparisons against the original flight-height formula.

Desktop Edge native70 checks: five distinct scenery images, exact approach/departure and pan/zoom replay, all five real render paths, original-default/declined-hook pixel equality, canvas-state restoration, unchanged flight state/levels/weather/gates/catalog, other-world refusal. Reload reproduces all five hashes; actual slider/original-toggle controls and career-byte isolation checked externally. Regional/upper/low/departure/original and all five individual images inspected/captured. Driver/report/screenshots: `Temp/st-hartwell-approach-cdp-20261024.mjs`, `st-hartwell-approach-native-20261024.json`, `st-hartwell-approach-*-20261024.png`.

Balor/empty-rig regressions and production build also checked. Any concurrent Farwatch economy/source edits belong to another worker; do not attribute their bundle/content changes to this scenery study. No mobile tests, manual live-save edits, push or deploy.
