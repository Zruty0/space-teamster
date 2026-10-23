# Gaia and reusable airless globe artwork

Updated: 2026-10-23

## Scope

Approved: change the rendered planet/moon only. Gaia has oceans, greenery and large polar ice caps; Celeste uses a generic cratered airless-world treatment, recolorable for later worlds. Settlement suggestions remain recorded in [Gaia](locations/estella-03-gaia.md), not authorized for implementation.

- Only Gaia (`estella-iii`) and Celeste (`estella-iiia`) opt in. Balor, other worlds and gas-giant bands are unchanged.
- Follow-up approval: smaller oceans and site positions appropriate to the outer rim. Final pixel fixture samples approximately15% ocean and29% ice; illustration proportions only, not planetary climate figures.
- Gaia rim angles in `content/estella/placements.ts`: Orselle0.1 (district aliases identical), Valenne2.85 unchanged; Rochefort−0.30, Mirabel−2.98, Cousteau Station−2.45. The government/military spaceport was removed later on2026-10-23. Cities sit on green land, Mirabel at a shore and Cousteau on the ice near its habitable edge. Lunar sites unchanged. These are real surface angles shared by markers, objectives and flight generation, not render-only offsets.
- No surface scenery, clouds, city lights, extra atmosphere, gravity/flight tuning, climate model, rotation, collision-shape, contract/history rewriting or save migration.
- Static schematic globe artwork, not a latitude/longitude terrain atlas. Body names, orbital ephemerides and overlay ordering are retained.

## Implementation

`src/world-disc-appearance.ts` exports:

- `drawGaiaDisc(ctx, cx, cy, radius)`: blue ocean, irregular green continents and forest patches, large pale northern/southern caps with blue ice margins.
- `drawCrateredDisc(ctx, cx, cy, radius, tint)`: reusable basins/crater relief; `tint` is a readonly RGB tuple. Celeste uses its existing `[170, 165, 150]` palette. Recoloring does not regenerate geometry. Applying this to more bodies is a separate content decision.
- `drawAuthoredWorldDisc(ctx, bodyId, cx, cy, radius, tint)`: shared opt-in dispatch used by central-body and system/moon-marker rendering in `src/orbital.ts`; returns false without drawing for other IDs.

Normalized geometry is generated once, independently of time/random frame state. Craters foreshorten toward the limb. Tiny markers use fewer features; larger discs add fine coastline/forest/crater detail. Relief shading is fixed illustration, not a sun-tracking terminator. Paint and border are clipped inside the circular silhouette; canvas state is restored. No off-limb bloom.

## Validation

- `npm run test:world-discs`:294 assertions for deterministic paint, finite/invalid geometry, LOD, tint-only recoloring, opt-in scope and actual production central/system/moon rendering at multiple epochs. Checks rendering leaves flight states/level geometry unchanged and authored sites match painted land/coast/ice at both LODs.
- Desktop native-canvas fixture: `/tests/world-disc-preview.html`; `?view=flight` shows production orbital rendering.45 pixel/state checks cover ice/greenery/ocean, reduced ocean coverage, real site placement on land/coast/ice, deterministic pixels, clipping, recoloring and small markers. Synthetic missions only; no save reads/writes.
- Gaia, Balor/Eye, orbital markers, empty/rendering, par and production build pass. Existing Vite CJS/chunk-size warnings remain. Concurrent Gaia shipping work initially tripped an old provider-count assertion; after its integration updates, the broader Balor expansion suite also passes (63,589 assertions).
