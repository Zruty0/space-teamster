# Planet presentation — subdued fills / dominant outline

Updated: 2026-10-26 (Pacific)
Status: approved and LIVE in orbital mode. Central worlds and system/moon markers use the reviewed look. Hartwell surface styling and Dawes foreground collision are a separate approved step in `surface-poi-art.md`.

## Approved direction

- Giants retain their existing colors, bands and storms. Feather the outer boundary inward; no new ring or halo.
- Other worlds retain the catalog planet color on the outer circle. Only that stroke doubles from 1.5 to 3 px, clipped inward to the original radius. Internal line widths stay unchanged.
- Craters/terrain use a darker, grayer version of their own planet color: 30% original chroma mixed with 70% luminance, then scaled to 68% for main lines / 43% for secondary lines.
- Base and occlusion masks use a near-black planet tint (5.5% RGB), not pure black cutouts.
- Water, ice and lava retain gray-blue / light-gray / orange outlines, with very dark regional fills: `#0b1118` / `#141618` / `#201006`. Gaia land occludes ocean; ice caps replace ocean paint. Dahai keeps its dark planet-blue ocean and local ice. Mineral fields are not new seas/resources.
- Weather wisps retain each profile's `cloudColor`, without filled haze, shadow wash or glow.
- **No dots or stipple.** Earlier regular / Mercator / hex pattern ideas were explicitly rejected. Their intermediate helper was removed, not left dormant.

## Runtime and comparison

`http://127.0.0.1:5173/tests/planet-outline-gallery.html`

All 33 painted worlds at equal display size, with the unchanged rig and 22/8 px chart markers. Left: historical painted reference. Right: current approved look. Selector, weather toggle, animation and time scrub. Both sides use review seed `1792879200123` and the same profile/epoch, not the operator's live saved cosmetic seed. Static comparison works without WebGL2.

- `world-presentation.ts` is the current game dispatcher. `orbital.ts` uses it for central worlds, system/moon markers and static fallback, including Balor's existing orientation convention.
- `world-outline-appearance.ts` reuses original immutable geometry, body IDs and seeds. Same Celeste seed 41873; same Balor deep shore, crust, 30° wedge and no tendrils. Filled painters and frozen historical fixtures remain independent.
- `soft-giant-appearance.ts` retains at most three 512 px canvases (about 3 MiB raw backing). Alpha falls from 94% radius to zero at 100%, entirely inside the physical limb. No new giant weather or radius change. Direct colored art is the allocation-failure fallback.
- `atmosphere-outline-shader.ts` shares the original noise/advection/cyclone/density prefix and changes final presentation to broken density contours. Pre-opacity density keeps opaque Acheron's contours visible. Original weather colors, loop, coverage settings, independent seed and absolute cosmetic clock remain.
- `createAtmospherePrototype` defaults to filled art for reference galleries; production `createWorldWeather` explicitly selects outline mode. Its final draw omits weather below 14 px, before requesting any unresolved refresh. Otherwise cached mipmaps could average into a colored wash despite the generator's tiny-size rule.
- The physical atmosphere's dashed boundary remains at its original radius. Old filled atmospheric annuli are removed. No atmosphere, rotation, wind or flight physics change.
- Gallery resources: two engines, eight noise volumes each, at most six cached base-pair canvases, plus displayed cards. Visible animation at most 10 Hz. This review setup is not a game performance guarantee.

## Validation and scope

- Approved gallery: 1,350 pure assertions and 536 native checks, including original rim hues, rim-only width, dark-fill limits, no stipple fills, material exceptions, giant feather alpha/cache bounds, weather hues and time replay. Desktop screenshots inspected; controls, storage isolation and no-WebGL comparison pass.
- Production world-family integration checks now target the approved painter and dashed atmosphere boundary. Historical filled-family geometry/paint checks remain unchanged. Node cached-giant stubs verify routing only; actual raster quality is checked in the browser.
- Actual orbital/Game weather, startup seed persistence, career isolation and context-loss/unavailable-WebGL fallback are checked in `/tests/world-weather-preview.html`. Tiny-marker tests verify no cloud wash or unnecessary allocation. Balor orientation and reserved content remain intact.
- Evidence: `Temp/st-planet-outline-v3-*` for approved art; refreshed `st-weather-rollout-*` for production scenes. Earlier v2 dot evidence is rejected history.
- No push, deploy, mobile tests or live-save edits. This rollout changes orbital presentation only; the explicitly authorized Dawes grading/building collisions are documented separately.
