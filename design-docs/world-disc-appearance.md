# Gaia and reusable airless globe artwork

Updated: 2026-10-23

## Scope

Approved: change the rendered planet/moon only. Gaia has oceans, greenery and large polar ice caps; Celeste uses a generic cratered airless-world treatment, recolorable for later worlds. Settlement suggestions remain recorded in [Gaia](locations/estella-03-gaia.md), not authorized for implementation.

- Gaia (`estella-iii`) keeps its custom disc. Stage2 now opts in the13 rocky worlds via `content/estella/rocky-world-appearance.ts`, including unchanged Celeste. Balor, icy/custom worlds, captured asteroids and gas-giant bands are unchanged.
- Follow-up approval: smaller oceans and site positions appropriate to the outer rim. Final pixel fixture samples approximately15% ocean and29% ice; illustration proportions only, not planetary climate figures.
- Gaia rim angles in `content/estella/placements.ts`: Orselle0.1 (district aliases identical), Valenne2.85 unchanged; Rochefort−0.30, Mirabel−2.98, Cousteau Station−2.45. The government/military spaceport was removed later on2026-10-23. Cities sit on green land, Mirabel at a shore and Cousteau on the ice near its habitable edge. Lunar sites unchanged. These are real surface angles shared by markers, objectives and flight generation, not render-only offsets.
- No surface scenery, clouds, city lights, extra atmosphere, gravity/flight tuning, climate model, rotation, collision-shape, contract/history rewriting or save migration.
- Static schematic globe artwork, not a latitude/longitude terrain atlas. Body names, orbital ephemerides and overlay ordering are retained.

## Implementation

`src/world-disc-appearance.ts` exports:

- `drawGaiaDisc(ctx, cx, cy, radius)`: blue ocean, irregular green continents and forest patches, large pale northern/southern caps with blue ice margins.
- `drawCrateredDisc(ctx, cx, cy, radius, tint, profile?)`: reusable basins/crater relief; `tint` is a readonly RGB tuple. Celeste uses its existing `[170, 165, 150]` palette and exact legacy appearance by default. Recoloring does not regenerate geometry. The approved Stage2 registry supplies per-world profiles to13 rocky bodies; other families remain gated.
- `drawAuthoredWorldDisc(ctx, bodyId, cx, cy, radius, tint)`: shared opt-in dispatch used by central-body and system/moon-marker rendering in `src/orbital.ts`; returns false without drawing for other IDs.

Normalized geometry is generated once, independently of time/random frame state. Craters foreshorten toward the limb. Tiny markers use fewer features; larger discs add fine coastline/forest/crater detail. Relief shading is fixed illustration, not a sun-tracking terminator. Paint and border are clipped inside the circular silhouette; canvas state is restored. No off-limb bloom.

## Seeded foundation — Stage1, 2026-10-23

`src/cratered-world-geometry.ts` exports `crateredWorldProfile(bodyId, overrides?)`, `crateredWorldGeometry(profile?)`, `resolveCrateredWorldProfile(profile)` and `CELESTE_CRATER_PROFILE`. Profiles derive seeds from stable IDs, not names/time; Celeste retains41873 plus explicit legacy basins. Optional crater count/scale, basin coverage and relief contrast are bounded. Crater and basin random streams are independent; changing density never shuffles the basins or existing crater positions. Geometry/points are deeply immutable and cached in a64-entry LRU, independent of tint/contrast/zoom. Eviction/rebuild yields identical geometry.

Stage1 initially used this machinery only for Celeste; Stage2 now supplies explicit frozen profiles for all13 approved rocky worlds. Both central and moving-marker paths use the same registry and existing body palettes. `/tests/rocky-world-preview.html` is the live gallery/production-orbital preview. The Stage1 comparison page now identifies its three examples as live and verifies their pixels match the approved demonstrations. [Stage plan and approval status](planet-visual-stages.md).

## Validation

- `npm run test:world-discs`:5069 seeded-foundation assertions (independent frozen original painter, seed variation, controls, immutable bounded cache),610 Stage2 rollout assertions (13 profiles, actual central/parent render paths at two epochs, unchanged physics/sites) plus294 assertions for deterministic paint, finite/invalid geometry, LOD, tint-only recoloring, opt-in scope and actual production central/system/moon rendering at multiple epochs. Checks rendering leaves flight states/level geometry unchanged and authored sites match painted land/coast/ice at both LODs.
- Stage1 comparison fixture: `/tests/cratered-world-preview.html`;58 native pixel/state checks, repeated after reload. Exact Celeste pixels at6 sizes versus frozen pre-stage source, seeded variation at identical tint/settings, and approved example/live-painter equivalence after Stage2. Fixture source: `tests/fixtures/world-disc-v1.ts` (do not regenerate to bless renderer changes).
- Stage2 gallery: `/tests/rocky-world-preview.html`,240 native checks including13 distinct grey-only images, shared dispatch/profile pixels, small markers, unaffected-body fallback and exact original Celeste. Native production-orbital view exercised for all13 bodies (`?view=flight&body=<id>`).
- Desktop native-canvas fixture: `/tests/world-disc-preview.html`; `?view=flight` shows production orbital rendering.45 pixel/state checks cover ice/greenery/ocean, reduced ocean coverage, real site placement on land/coast/ice, deterministic pixels, clipping, recoloring and small markers. Synthetic missions only; no save reads/writes.
- Gaia, Balor/Eye, orbital markers, empty/rendering, par and production build pass. Existing Vite CJS/chunk-size warnings remain. Concurrent Gaia shipping work initially tripped an old provider-count assertion; after its integration updates, the broader Balor expansion suite also passes (63,589 assertions).
