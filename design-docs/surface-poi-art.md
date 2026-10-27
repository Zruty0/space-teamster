# Dawes foreground outpost / Hartwell surface presentation

Updated: 2026-10-26 (Pacific)
Status: LIVE. Pete approves the dark outline-led style, then explicitly requests foreground opaque buildings with collision, terrain ending at the site edges, green left / red right blinking beacons, and a playable test. This supersedes the earlier decorative/backdrop-only outpost.

## Physical scope

- Dawes Cut (`estella-v-open-cast-mine`) only. Original landing pad remains x=972–1028, y=30, center=1000, width=56 m.
- Follow-up approval: Pete requests a larger blue dome on the warehouse side of the pad. The dome is now 69 m wide / 38.53 m tall (1.5× its previous size), beside both warehouses on the left. Main warehouse remains 41 m wide / 19.5 m tall, plus vents. Clear gaps separate the buildings and pad.
- Deck extends left to accommodate the revised layout: 300 m, x=812–1112, still y=30. Original terrain terminates at its edges. Terrain outside this enlarged footprint is unchanged; the old x=820–860 feature is now inside the cleared site, while the x=1140–1190 feature remains outside. Original samples/profile are retained beneath the site overlay.
- `TerrainData.surfaceSite` is generated deterministically for this one ordinary surface site. `points` retains the original samples; `getTerrainHeight` overlays the flat deck only inside the site. `landingSurfacePoints` traces the live cut faces/deck/outside contour. Do not bypass these helpers by treating raw samples as Dawes' live visible ground.
- Buildings, vents, dome, footing and airlock are solid. Only the original marked pad is a valid touchdown target; the rest of the forecourt/buildings cause a crash. No collider on decorative lamps/markings.
- Original gravity, thrust, controls, pad tolerances, camera algorithm, ship geometry, mission access, contracts and saves are unchanged. The authorized local grading/colliders are a physical change, not merely a reskin. Other landing sites remain unchanged.

## SVG contract

`art/surface/basic-outpost.svg` remains the editable source. Metadata version 1 / asset ID `basic-outpost-v1` retain pad/beacon anchors, bounds, module crops and footing spans.

Five raster modules: `site-deck`, `warehouse-rear`, `warehouse-main`, `residential-dome`, `landing-pad`. Deck and foreground buildings share the pad datum rather than being lifted onto the old hills. Drawing order is background, outside terrain/cut faces, foreground SVG, guidance/ship/HUD. Dark fills are fully opaque. Foundations remain visible as structural cutaway, not natural terrain painted across buildings.

Seven closed paths marked `data-solid` supply the actual collision geometry. Nested SVG `translate` transforms are read directly; cubic curves use the existing station path flattener (24 steps). No separately guessed rectangular building hitboxes. Closed foreground paths must fit their module's painted crop; invisible/out-of-crop solids are rejected. Module crops, transforms and pad anchors must remain coherent when editing the asset. Metadata and solid extraction work without a DOM, canvas or image decode.

Palette variables remain portable: wall, roof, edge, trim, dust, glass, light and pad. Defaults are very dark Hartwell-tinted fills with muted structural lines. The residential group locally overrides wall/roof/glass/edge/trim to dark blue and blue structural lines, keeping fully opaque interiors. Another environment can recolor the same SVG without changing anchors/collision. Station assets and station collision behavior are unchanged; only the existing pure path flattener is exported for reuse.

## Collision and preparation

- `surface-site.ts` builds immutable world-space solid polygons and site bounds from the SVG and original pad. No random placement, phase-ID seed or raster-dependent collision.
- `surface-ship-collision.ts` tests whole hull/cab polygons and deployed gear segments, including contained small solids. It also tests cut faces. Broad-phase filtering keeps clear pad airspace cheap.
- Translation is swept with edge quadrilaterals; rotation is divided into at most 2° steps (under 2 mm chord error at rig radius). Actual Game physics passes the previous pose. Trajectory prediction uses the same obstruction test, preventing a misleading clear path through a warehouse.
- Collision does not wait for SVG decode. Until artwork is ready—or if decode fails—opaque collision silhouettes and the deck/pad remain visible. Five caller-owned rasters total 666,304 pixels (~2.54 MiB raw RGBA), within the existing 1 Mi-pixel asset budget. The flat deck uses 1 pixel per SVG unit; detailed buildings/pad retain 2× sampling, and no raster dimension exceeds 2048 px. No per-frame decoding. Placements/obstacles are weakly cached.
- Paired beacons retain the deterministic 1.4 s double pulse: green at the smaller world x, red at the larger world x. Pause/retry behavior is unchanged.

## Hartwell approach / landing appearance

- All five existing Hartwell approach/departure regions use `approach-outline-scenery.ts`: near-black tinted sky, dark ground, stronger real foreground edge, faint existing distant ridges, large angular rock boundaries and restrained strata. No painted grain or microscopic dot-like clasts.
- Permanent region/ridge/material seeds and approach collision heights stay unchanged. Wind arrows, labels, extents and strength semantics remain; filled wind-band rectangles become faint boundaries only when the new painter actually handles the scene. Foreign-world fallback is pixel-identical.
- Existing world-strip caching, global 32-entry / 8 Mi-pixel cap, old-LOD retention, cooperative soft 2 ms preparation and camera look-ahead remain. The lighter material can finish a strip within one slice; tests must not require it to remain unfinished merely to prove yielding.
- Dawes landing shares the exact new backdrop with its existing regional projection. Original separate phase meshes/handoff remain; this is stylistic continuity, not a new seamless world mesh.
- Footer backing, gate contrast, status colors, rig and pad guidance remain readable and unchanged. No new flight weather or other-world biome rollout.

## Try / verify

`http://127.0.0.1:5173/tests/dawes-landing.html`

Overview, close-up, landing entry, pad/takeoff and approach comparison. Starts paused. Fly uses actual ship physics/camera; takeoff holds the original pad until throttle rises. Stops at landing/crash, with no career loading/saving, settlement or phase transition. Optional collision-outline overlay shows actual solid paths. It replaces the former legacy-art toggle, which would hide new obstacles. Source SVG link included.

- `npm run test:surface-poi`: 5,270 metadata/placement/terrain checks plus 623 foreground collision checks, including DOM-free creation, exact footprint/pad, unchanged outside heights, roof/side/rotated contacts and clear-endpoint sweeps.
- 61 native checks (including opaque blue dome pixels): five bounded rasters, opaque interiors/deck, no old hillside through the site, green/red beacon pixels and blink-only animation, exact shared sky, actual crashes/swept dome contact, touchdown/takeoff, retry, other-site fallback and career/catalog isolation. Keyboard/pause/reload and screenshots pass.
- 225 production approach checks pass, including cache/replay/seams/pressure/cancellation/hidden/resume/foreign fallback. Historical filled gallery retains all five hashes across 85 checks. Biome unit suite: 667,798 assertions. Station/parked/empty-run/Balor/atmosphere/world-family suites and build pass.
- Controlled desktop 1080p rendering: about 120 FPS; landing draw CPU roughly 0.65–0.77 ms mean, worst measured 1.4 ms; approach native draw sample mean ~0.34 ms. These are renderer measurements, not full-career/mobile guarantees. No timed readbacks in the 1080p benchmark.
- `Temp/st-dawes-foreground-cdp-20261026.mjs` and matching JSON/screenshots retain evidence. Historical `hartwellFlight.performance()` synchronous reference still paints old filled art; output now labels the differing art styles and must not be presented as a same-art scheduling comparison.
- Orbital recoloring is live separately; see `wireframe-visual-review.md`. No push/deploy, mobile tests or manual live-save edits.
