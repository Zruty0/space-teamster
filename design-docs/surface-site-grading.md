# SVG surface-site grading

Updated: 2026-10-27 (Pacific)
Status: LIVE at Dawes only. Pete requests the outpost at the average surrounding edge height, with terrain crossfading into slopes rather than cliff joins. Design must support future individual SVGs, not clone this outpost everywhere.

## Current placement

- Footprint remains x=812–1112 (300 m). Pad remains centered at x=1000, now width 35 m, x=982.5–1017.5 (later 1.6× narrowing request). SVG pad anchors narrow proportionally, so grading footprint/datum and building scale do not change. Two 11.775 m colliding beacon towers flank the pad; see surface-poi-art.md.
- Native footprint-edge heights: 71.76092 m left / 54.35933 m right. Their arithmetic mean sets the **whole site datum to 63.06013 m**, up from the old 30 m. Pad, buildings, lights and collision move together; the grading operation does not change building sizes/layout/colors. The later pad/tower revision is separate.
- 75 m graded shoulders join the flat site to native terrain: x=737–812 and x=1112–1187. Outside x=737–1187, original terrain/features remain untouched. This does not smooth unrelated distant cliffs/features.
- `LevelDef.padY` remains the authored terrain baseline. **`TerrainData.pad.y` is the resolved physical altitude.** Initial entry retains height above the datum; approach handoff, launch placement/hold, scoring, HUD, camera reference and retries use the resolved pad. No double elevation offset on retries.

## Shared geometry, not an alpha illusion

`surface-grading.ts` is independent of Dawes, SVG decoding and rendering. Inputs: footprint edges, a native-height sampler and optional blend width/sample spacing. It averages native edge heights, then blends each shoulder with `t²(3−2t)`, using zero deck-side weight derivative and a continuous native-side join.

- SVG sites start from unflattened native terrain, not the previous pad depression. Ordinary unregistered sites retain the exact legacy terrain/pad generation.
- Default blend width is one quarter of footprint width, clamped to 40–200 m. Default samples are on the 2 m world grid; exact fractional footprint/shoulder endpoints are inserted.
- Only shoulders need samples: Dawes has 78 profile vertices, including two flat-deck endpoints. Bounds/finite values/sample budget are validated; at most 8192 nominal shoulder intervals. Immutable output, generated once per terrain, no camera/time/random dependency.
- `getTerrainHeight` interpolates this exact profile. `terrainSurfacePoints` supplies the same polyline to the authored painter and generic renderer fallback. No duplicate-x vertical cut faces remain.
- Whole-hull/cab/gear collision sweeps against the same shoulder segments and SVG solids. Flat deck retains normal marked-pad touchdown rules; slopes/forecourt are not extra landing targets. Trajectory prediction uses the same collision helper.
- If SVG art is unavailable or no site painter handles a future definition, the generic renderer still draws graded ground and opaque physical solid silhouettes. There are no hidden old cliff colliders beneath a decorative fade.

## Future SVG sites

- `surfaceSvgSolids(source, asset)` parses compatible closed `data-solid` paths from any validated SVG, with the same supported nested translations and curve flattener. No separately guessed building boxes.
- `placeSurfaceSite(asset, shapes, pad, nativeHeight, options)` maps any asset through its own pad anchors, derives its footprint from asset bounds, grades it and translates all solids onto the resulting datum. `placeSurfacePoi` uses the resolved terrain pad to place matching artwork. Asset bounds must represent the intended grading footprint, not arbitrary visual padding.
- `surfaceSiteDefinitionFor` is the explicit **physics-definition** opt-in point, currently Dawes only. A future asset registration must also select matching artwork/theme in the scenery dispatcher; do not silently reuse Dawes imagery or terrain art on other worlds. Generic fallback is already safe during that integration.
- Cache parsed immutable definitions per asset, generate grading only for the active terrain, and keep SVG raster ownership bounded. Current raster set is six images / 687,520 pixels after adding beacon towers; grading adds no textures, decode work or all-sites prewarm.
- Floating/cloud-city layouts remain excluded and retain their fixed-deck policy. They must not be grounded by this algorithm.

## Checks

- Surface unit 5,715; foreground/swept collision 652; generic grading 12,049. Independent blend calculations, seam continuity, exact mesh interpolation, outside bounds, invalid inputs, deterministic rebuilds, fractional anchors, varied footprint/pad scales and a distinct synthetic SVG that is never registered in the game.
- 634 native checks: slope pixels agree with solid ground, no vertical joins, actual crashes/touchdown/takeoff, actual Game loader/handoff/retry at the new datum, plus all 102 surface sites / 30 surface worlds and exactly one outpost. Keyboard/pause/reload/save isolation pass; screenshots inspected.
- Empty-run, empty-rig, station/parked and approach-biome regressions, typechecks and build pass. No other-world grading, geography, access or save changes.
- Desktop 1080p draw submission remains roughly 0.6–0.85 ms mean / ≤1.3 ms sampled max. Latest native RAF is ~85 FPS **both with drawing and in the no-render baseline**, unlike earlier 72/120 Hz runs; do not present that scheduling difference as a renderer regression or a universal performance promise. `dawesLanding.performance(false)` supplies the idle control. No mobile tests.
