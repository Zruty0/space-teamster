# Planet visual review — subdued fills / dominant outline

Updated: 2026-10-26 (Pacific)
Status: Pete approves this final planet outlook2026-10-26. Gallery implemented; main game visuals have not switched yet. He next requests a description of proposed approach/landing changes, not immediate implementation. Latest instructions supersede the pure-black/green-line/stipple proposal.

## Latest direction

- Giants keep their existing colors, bands and storms; soften the outer boundary.
- Other worlds keep the original catalog planet color on the outer circle. Double only that stroke from1.5 to3px, clipped inward to the same physical radius; internal line widths stay unchanged.
- Craters/terrain shapes use a darker, grayer version of their own planet's color, not plain gray. Current palette mixes30%original chroma with70%luminance, then scales to68%for main lines/43%for secondary lines.
- Background is a near-black version of the planet color (5.5%RGB), not pure black. Occlusion masks use the same tint so there are no black cutouts.
- Water, ice and lava keep gray-blue/light-gray/orange outlines with very dark regional fills: #0b1118/#141618/#201006. Gaia land occludes ocean; ice caps replace ocean paint. Dahai retains its dark planet-blue ocean background and local ice. Icy worlds retain dark frost regions and outlines. No new seas/resources on mineral-tone worlds.
- Weather wisps keep each original profile's cloudColor, without haze/shadow/glow fills.
- **No dots/stipple anywhere.** Pete first tried regular3×dots, then Mercator/hex projection/local-only patterns/heavier ice, and finally explicitly rejected dots. The intermediate pattern helper was removed, not left dormant. Do not restore it from earlier notes.

## Gallery / implementation

`http://127.0.0.1:5173/tests/planet-outline-gallery.html`

33painted worlds, equal display size, same unchanged rig plus22/8px chart markers. Current production painter on left, proposed revision on right. Selector/weather toggle/Animate/Pause/time scrub. Fixed review weather seed1792879200123, same profile/epoch on both sides; not the live saved cosmetic seed. Static comparison remains usable without WebGL2.

- `src/world-outline-appearance.ts`: original immutable geography, body IDs and seeds. No image edge detection/new terrain. Frozen Gaia/Balor accessors leave original painters intact. Same Celeste41873; Balor original deep shore/crust/30°wedge/orientation, no tendrils. Craters/foreground regions preserve painter occlusion order.
- `src/soft-giant-appearance.ts`: original colored giant painter into at most3fixed512px canvases (~3MiB raw backing). Alpha feather from94%radius tozero at100%; no halo outside, hard outline, altered physical radius or new giant weather. Full-detail raster reused at chart sizes.
- `src/atmosphere-outline-shader.ts`: exact original noise/advection/cyclone/density prefix, broken density contours instead of filled lighting. Original cloudColor retained. Acheron uses pre-opacity density so opaque alpha does not erase its contours. No weather/rotation/flight changes.
- `createAtmospherePrototype(...,'outline')` remains explicit opt-in. Production default is still original `filled`. Outline weather omitted below14px to avoid mipmaps averaging into a wash. Planet/region fills are flat/dark, not gradients; giants are the explicit exception.
- Gallery has2engines with8noise volumes each, at most6cached base-pair canvases, plus displayed pair canvases. Visible animation at most10Hz. This is a review setup, not a production performance claim.

## Validation / next step

-1350pure assertions:33-world opt-in, source geometry/frozen data/Eye footprint, unchanged shader-field prefix, palette bounds, deterministic commands across sizes, context balance/invalid views, unchanged catalog.
-536native checks: real pixels at six sizes, replay/limb clipping, original rim hues,3pxrim only, allowed dark fills≤32/channel, forbidden stipple fills, gray-tinted interior strokes/material exceptions, feathered giant alpha and bounded cache,8weather profile colors/movement/replay/resources. Desktop screenshots inspected; animation/pause/storage isolation and unavailable-WebGL static fallback pass.
- Filled-world families and atmosphere regressions pass; production weather49native/Balor44native/startup/persistence/lifecycle/fallback pass. Final full test typecheck and build pass. A transient unrelated maintenance-test TS2367 occurred during concurrent work and was later resolved without an art workaround. Existing CJS/chunk warnings only.
- Final evidence: Temp/st-planet-outline-v3-cdp-20261026.mjs, v3nativeJSON/screenshots. v2evidence retains the now-rejected regular-dot draft; v1retains35bf8f6.
- No live rollout/push/deploy/mobile tests/live-save edits. Preserve concurrent maintenance changes. Next: describe the proposed approach/landing treatment for review, then apply the agreed direction consistently to orbital, approach/departure and Dawes ground/outpost without changing physics/collision/cameras/anchors or losing approved detail/readability.
