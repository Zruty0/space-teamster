# Dawes foreground outpost / Hartwell surface presentation

Updated: 2026-10-27 (Pacific)
Status: LIVE. Pete approves the dark outline-led style, then explicitly requests foreground opaque buildings with collision, terrain ending at the site edges, green left / red right blinking beacons, and a playable test. This supersedes the earlier decorative/backdrop-only outpost.

## Physical scope

- Dawes Cut (`estella-v-open-cast-mine`) only. Latest pad revision is x=982.5–1017.5, center=1000, width=35 m: 1.6× narrower than 56 m, approximately twice the 17 m rig width. The initial 2× narrowing request was superseded before completion. Latest approval raises the whole site to the mean native edge height, y=63.06013 m. See surface-site-grading.md.
- Follow-up approval: Pete requests a larger blue dome on the warehouse side of the pad. The dome is now 69 m wide / 38.53 m tall (1.5× its previous size), beside both warehouses on the left. Main warehouse remains 41 m wide / 19.5 m tall, plus vents. Clear gaps separate the buildings and pad.
- Beacon towers: 11.775 m tall, 1.5× parked rig height (3.8 m cab top + 4.05 m gear rest). Centers x=981.5/1018.5, outside the clear pad, 2 m cap/base width with tapered shafts. Both closed SVG `data-solid` paths join the seven building solids; hull/cab/gear/swept collision and prediction share all nine. Green-left/red-right blink stays cosmetic; lights off do not disable collision.
- SVG pad anchors also narrowed from ±112 to ±70, preserving 0.25 m/unit and every other building/site dimension. Dawes alone overrides `padHalfWidth:17.5`; the shared Camps profile and other sites stay unchanged.
- Deck remains 300 m, x=812–1112. Native edge heights 71.76092 / 54.35933 m give datum 63.06013 m. Smooth 75 m shoulders replace cliff joins, covering x=737–812 / 1112–1187. Terrain/features outside that complete grading envelope are unchanged; the in-envelope heightfield is intentionally graded.
- `TerrainData.surfaceSite` is deterministic; `points` retains unflattened native samples for SVG sites. `getTerrainHeight` and shared `terrainSurfacePoints` overlay the same flat deck/graded shoulders. `landingSurfacePoints` re-exports that helper. Runtime altitude is `terrain.pad.y`, not the authored baseline `level.padY`. Never draw raw samples through a registered site.
- Buildings, vents, dome, footing and airlock are solid. Only the original marked pad is a valid touchdown target; the rest of the forecourt/buildings cause a crash. No collider on decorative lamps/markings.
- Original gravity, thrust, controls, pad tolerances, camera algorithm, ship geometry, mission access, contracts and saves are unchanged. The authorized local grading/colliders are a physical change, not merely a reskin. Other landing geometry remains unchanged; the shared dark palette now applies to every world (see flight-presentation.md).

## SVG contract

`art/surface/basic-outpost.svg` remains the editable source. Metadata version 1 / asset ID `basic-outpost-v1` retain pad/beacon anchors, bounds, module crops and footing spans.

Five raster modules: `site-deck`, `warehouse-rear`, `warehouse-main`, `residential-dome`, `landing-pad`. Deck and foreground buildings share the pad datum rather than being lifted onto the old hills. Drawing order is background, graded terrain/deck, foreground SVG, guidance/ship/HUD. Dark fills are fully opaque. Latest approval removes below-ground striping: foundation/deck cutaways are clipped at the deck surface, leaving plain planet-colored ground. The above-ground buildings and thin landing-pad slab remain visible; collision and SVG source geometry are unchanged.

Seven closed paths marked `data-solid` supply the actual collision geometry. Nested SVG `translate` transforms are read directly; cubic curves use the existing station path flattener (24 steps). No separately guessed rectangular building hitboxes. Closed foreground paths must fit their module's painted crop; invisible/out-of-crop solids are rejected. Module crops, transforms and pad anchors must remain coherent when editing the asset. Metadata and solid extraction work without a DOM, canvas or image decode.

Palette variables remain portable: wall, roof, edge, trim, dust, glass, light and pad. Defaults are very dark Hartwell-tinted fills with muted structural lines. The residential group locally overrides wall/roof/glass/edge/trim to dark blue and blue structural lines, keeping fully opaque interiors. Another environment can recolor the same SVG without changing anchors/collision. Station assets and station collision behavior are unchanged; only the existing pure path flattener is exported for reuse.

## Collision and preparation

- `surface-site.ts` builds immutable world-space solid polygons and site bounds from the SVG and original pad. No random placement, phase-ID seed or raster-dependent collision.
- `surface-ship-collision.ts` tests whole hull/cab polygons and deployed gear segments, including contained small solids. It also tests the shared graded shoulder segments. Broad-phase filtering keeps clear pad airspace cheap.
- Translation is swept with edge quadrilaterals; rotation is divided into at most 2° steps (under 2 mm chord error at rig radius). Actual Game physics passes the previous pose. Trajectory prediction uses the same obstruction test, preventing a misleading clear path through a warehouse or shoulder crest.
- Collision does not wait for SVG decode. Until artwork is ready—or if decode fails—opaque collision silhouettes and the deck/pad remain visible. Six caller-owned rasters total 687,520 pixels (~2.62 MiB raw RGBA), within the existing 1 Mi-pixel asset budget. The flat deck uses 1 pixel per SVG unit; detailed buildings/pad retain 2× sampling, and no raster dimension exceeds 2048 px. No per-frame decoding. Placements/obstacles are weakly cached.
- Paired beacons retain the deterministic 1.4 s double pulse: green at the smaller world x, red at the larger world x. Pause/retry behavior is unchanged.

## Hartwell approach / landing appearance

- All five existing Hartwell approach/departure regions use `approach-outline-scenery.ts`: near-black tinted sky, dark ground, stronger real foreground edge, faint existing distant ridges and a plain subsurface matching the orbital planet background. Underground strata/rock lines are removed for now; no grain or stipple.
- Permanent region/ridge/material seeds and approach collision heights stay unchanged. Wind arrows, labels, extents and strength semantics remain. All current approach views use faint boundaries rather than filled bands, clipped to airspace so wind cannot stripe the ground. Foreign worlds use the new shared palette without receiving Hartwell ridges or outposts. Explicit historical painters remain available.
- Existing world-strip caching, global 32-entry / 8 Mi-pixel cap, old-LOD retention, cooperative soft 2 ms preparation and camera look-ahead remain. The lighter material can finish a strip within one slice; tests must not require it to remain unfinished merely to prove yielding.
- Dawes landing shares the exact new backdrop with its existing regional projection. Original separate phase meshes/handoff remain; this is stylistic continuity, not a new seamless world mesh.
- Footer backing, status colors, rig and pad guidance remain. Pete requests reverting target highlighting: gate is again its original thin status-colored dashed rectangle, with no dark/pale backing or black speed-label plate. No new flight weather, other-world geography or outpost replication.

## Try / verify

`http://127.0.0.1:5173/tests/dawes-landing.html`

Overview, close-up, landing entry, pad/takeoff and approach comparison. Starts paused. Fly uses actual ship physics/camera; takeoff holds the original pad until throttle rises. Stops at landing/crash, with no career loading/saving, settlement or phase transition. Optional collision-outline overlay shows actual solid paths. It replaces the former legacy-art toggle, which would hide new obstacles. Source SVG link included.

- `npm run test:surface-poi`: 5,715 metadata/placement/terrain checks plus 652 foreground collision and 12,049 generic grading checks, including DOM-free creation, exact footprint/pad, unchanged outside heights, roof/side/rotated contacts and clear-endpoint sweeps.
- 634 native checks (including opaque blue dome pixels and plain below-deck fill): six bounded rasters, opaque interiors/deck, no old hillside through the site, green/red beacon pixels and blink-only animation, exact shared sky, actual crashes/swept dome contact, touchdown/takeoff, retry, other-site fallback and career/catalog isolation. Cross-world checks cover all 102 surface sites and approach/departure on all 30 surface worlds, including deliberately buried wind indicators and exactly one outpost. Keyboard/pause/reload and screenshots pass.
- 250 production approach checks pass, including cache/replay/seams/pressure/cancellation/hidden/resume/foreign fallback. Historical filled gallery retains all five hashes across 85 checks. Biome unit suite: 667,798 assertions. Station/parked/empty-run/Balor/atmosphere/world-family suites and build pass.
- Controlled desktop 1080p landing draw CPU ~0.6–0.85 ms mean / ≤1.3 ms sampled max. Latest native RAF ~85 FPS matches its no-render control; earlier runs were ~72/120 Hz. See surface-site-grading.md for the baseline, not a claimed renderer slowdown or full-career/mobile guarantee. No timed readbacks in the 1080p benchmark.
- `Temp/st-dawes-foreground-cdp-20261026.mjs` and matching JSON/screenshots retain evidence. Historical `hartwellFlight.performance()` synchronous reference still paints old filled art; output now labels the differing art styles and must not be presented as a same-art scheduling comparison.
- Orbital recoloring is live separately; see `wireframe-visual-review.md`. No push/deploy, mobile tests or manual live-save edits.
