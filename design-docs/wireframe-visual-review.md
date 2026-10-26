# Wireframe-like visual backtrack — planet review

Updated: 2026-10-26 (Pacific)
Status: Pete requests a return to linework throughout. **This step is the before/after planet gallery, not a live rollout.** The main game still uses the filled planet/Hartwell/Dawes art while he reviews the proposed replacement.

## Requested direction

The painted scenery makes the unchanged wireframe rig look out of place. Remove colored planet backgrounds while retaining craters, continents and weather as outlines. Oceans and lava lakes get very sparse dots. Atmosphere should read as floating wisps of outline, not filled masses. Subsequent application must include approach/landing terrain and the outpost, not just orbital discs. Preserve geography/IDs/seeds, physics, collision, camera, gates, saves, reservations and concurrent maintenance work.

## Review

`http://127.0.0.1:5173/tests/planet-outline-gallery.html`

- All33 currently painted planets/moons, including Reach's fragment, equal display size. Gaia/Dahai/Balor lead the gallery. Same unchanged rig and22/8px chart markers beside both versions. Not a physical-size comparison.
- Before: current authored globe and production-selected weather profile, including Acheron's underdeck, original haze/shadow/compositing. Fixed review seed1792879200123, not the operator's saved cosmetic seed.
- After: neutral black occlusion, restrained green contour lines, blue-grey ocean dots/coasts, amber lava dots/shore, pale broken weather threads. No colored region fills, illumination gradients, haze, shadow wash or halo.
- World selector, shared weather toggle, Animate/Pause and0–720art-second scrub/reset. Both sides use identical phase/profile/seed. No constructor, career/save IO or gameplay invocation.
- Static surface comparison still works if WebGL2 creation is unavailable. Weather checks explicitly require WebGL2. This is not yet a hardened production contour-weather lifecycle.

## Implementation

`src/world-outline-appearance.ts` is a **review-only** dispatcher. All body/region/crater/frost/belt/storm geometry comes from the existing immutable models, not image edge detection or new procedural geography. Read-only Gaia and Balor geometry accessors expose copies/original frozen models respectively, without modifying the filled painters.

- Crater rims and short inner arcs; basin/frost/terrain boundaries; continent/island/ice edges. Black masking preserves original overpainting/occlusion, rather than drawing hidden features through every layer.
- Same Celeste seed41873, same other-world seeds. Balor keeps its deep shore, crust islets at close scale, original30° total rim arc and rotation convention; no tendrils.
- Fixed sparse normalized dot positions, .75px radius, only clipped oceans (Gaia/Dahai) and the Eye. Land/ice occlude ocean dots. No stipple on mineral lowlands, ice fields or Almaden's non-lava calderas; no new resource/geography claims. Dots omitted below45px.
- Giants keep static belts/storms. Shared band edges are drawn once; tiny markers select a nested subset so many strokes do not merge into a colored-looking disc. Original band geometry is not rerolled.
- Acheron has static broken cloud lines when weather is off; animated weather replaces its static deck when enabled. No invented ground under that atmosphere.

`src/atmosphere-outline-shader.ts` reuses the exact filled shader prefix through noise/advection/cyclone/density evaluation. Final shading becomes two thin, softly broken **density** contours. Using pre-opacity density avoids losing opaque Acheron to saturated alpha. Same motion, loop, coverage parameters, independent weather seed and cosmetic timing; no simulation weather change.

`createAtmospherePrototype(..., 'outline')` is explicit opt-in; default remains `filled` with the original shader. Outline compositing skips all haze/shadow/halo fills. Weather omitted below14px, where contour mipmaps would average into a background wash. Production `world-weather.ts`/orbital dispatch have not been switched.

Gallery resources: two512px engines, each at most8noise volumes; at most6static pair canvases cached, plus one displayed pair canvas per world. Animate redraws only visible cards, at most10Hz. Neither the gallery's two-context architecture nor its timing is a game performance guarantee.

## Validation / boundaries

- `npm run test:planet-outlines`:1618 assertions;33-world roster, immutable source geometry, original Eye coordinates, sparse deterministic dots, exact shader-field prefix, stable drawing commands at four scales, context balance, no gradients, invalid viewport rejection and untouched catalog.
- Native gallery checks:369; all33 worlds at six scales, actual pixel replay/limb clipping, guarded fill operations (black only except tiny liquid dots), mostly negative space,8weather profiles with movement/rewind and bounded resources. Desktop screenshots inspected for craters/continents/ice/Eye/giants/weather and no-weather view. Animation/pause, isolated storage-byte equality and no-WebGL static fallback tested.
- Surface ink occupancy at140px radius: about1.2–8.9% on non-giants;18.7/18.5% on densely banded Gryphon/Hydra. Initial16% universal assertion was too restrictive for22belt edges; replaced by operation-level colored-fill prohibition plus25%negative-space check, not a hidden removal of belts. Cloud alpha>20 occupies about1.9–21.3% at the canonical review epoch; not a coverage/physics parameter.
- Filled-art regression suites (all world families), atmosphere parameter/state/timer suites, Balor8865+2208, TypeScript/build pass. Production weather49native, Balor44native, actual startup/persistence/career isolation, context-loss/unavailable-WebGL fallback pass. Original default shader remains unchanged. Existing Vite CJS/chunk warnings only.
- Evidence: `Temp/st-planet-outline-cdp-20261026.mjs`, corresponding native JSON and paired screenshots. Save-free `window.planetOutlineGallery` API exposes ready/render/snapshot/checks.
- No live wireframe rollout, no push/deploy/mobile tests or live-save edits. Review then apply the chosen line treatment across orbital rendering, Hartwell approach/departure, Dawes surface sky/terrain and SVG outpost. Preserve readability and existing cache/physics contracts; do not quietly remove the requested crater/continent/weather details.
