# Surface POI SVG — Dawes Cut test bed

Updated: 2026-10-26 (Pacific)
Status: approved by Pete and enabled in the actual Dawes Cut surface renderer. Other sites/worlds unchanged; no collision/flight redesign.

## Scope

Pete requests matching approach/landing sky and terrain coloring (no wireframe scenery), then an environment-portable SVG outpost: a landing pad with blinking beacons on both sides, storage/warehouses and a small residential dome. Overall width about four current pad widths, with generic terrain outside.

- Dawes Cut (`estella-v-open-cast-mine`) only. Its existing56m pad stays atx972–1028/y30, centre1000. Outpost art spans224m (four widths), at0.25m/SVG unit.
- Same Hartwell biome palette, target seed/relief/material streams as approach. Shared background painter, not a separately approximated sky. Low-phase projection keeps distant relief at regional angular size (.065px/m), aligns its datum to the real pad and pans with the target-local camera. Gameplay camera zoom/follow is unchanged.
- Existing approach and landing use different physical meshes/entry mapping. This pass unifies **appearance**, not those meshes or the phase handoff. Landing traces every native collision vertex, including clamped ground beyond the finite mesh. No new terrain heights, pad dimensions, hazards or physical building collisions.
- Warehouses/dome are set back from the flight plane. Independent terrain-mounted modules sit on sampled footings; foreground covers their deep plinths along the actual surface. Dawes retains its original excavated bowl/steep shoulders rather than flattening the entire outpost.
- Original ship, trajectory, pad-centre/offscreen guidance, landing checks and controls remain. SVG replaces pad structure paint. Opaque black34px controls backing on this site; text/font/anchors unchanged.
- Dawes' ordinary landing renderer is shared with its surface launch view, so the same scene appears there too; launch mechanics are unchanged. No other-site rollout, buildings in approach, lore/economy/NPC/save changes.

## Authoring contract

Asset: `art/surface/basic-outpost.svg` — a standard, standalone SVG with opaque muted fills, structural outlines, simple roof panels, roll-up doors, cargo stacks, dome glazing and an airlock. No baked sky/terrain rectangle or external raster dependencies.

`<metadata>` JSON version1 declares:
- Asset ID and overall SVG bounds.
- Pad left/right/y anchors. Uniform scale derives from the **existing physical pad**, never the other way round.
- Two beacon bulb anchors.
- Named top-level module group IDs, raster crop bounds, left/right footing bounds and layer (`backdrop` or `pad`). Artwork geometry/transforms remain in SVG; keep metadata crops/footings updated when editing it.

Four groups: `warehouse-rear`, `warehouse-main`, `residential-dome`, `landing-pad`. Common module ground datum is the SVG pad y coordinate. Terrain modules move vertically as units; pad remains fixed to the real landing surface. Deep foundation artwork is occluded by the foreground, not used as collision geometry.

CSS palette variables: `--poi-wall`, `--poi-roof`, `--poi-edge`, `--poi-trim`, `--poi-dust`, `--poi-glass`, `--poi-light`, `--poi-pad`. The standalone file has neutral defaults; Dawes passes a Hartwell palette with ground-colored dust. Geometry, anchoring and blink behavior are independent of palette. Native tests render the same SVG in warm/cool palettes and verify identical alpha silhouettes. No other environment is enabled by that test.

`src/surface-poi.ts` supplies metadata parsing/validation, generic placement, palette substitution and caller-owned artwork preparation (can accept another SVG). No station geometry/parser/collision changes. Named pad/anchor metadata is the surface counterpart of authored station layouts, without importing station collision semantics.

## Runtime / resource bounds

- `src/landing-scenery.ts`: Dawes-only dispatcher, called by the optional hook in `renderer.render`. `Game` supplies the dispatcher and prewarms during Dawes approach/load, before landing handoff. Other sites/foreign bodies/cloud platforms decline to original rendering.
- One material tile512×256, same seeded source as approach, generated in cooperative4-row steps/~2ms RAF slices. Three world-anchored pattern samples: original macro scales8 and8√2m/texel plus close-range.08m/texel grain. Six subtle bedding bands; no per-frame thousands-of-clasts loop.
- Four static SVG module raster canvases,2pixels/SVG unit:392,608 pixels (~1.50MiB raw RGBA), plus material~.50MiB. Loader caps each asset at1Mi raster pixels and2048px/module dimension. This is retained raw backing, not total browser/GPU memory. No global cache of every location or regeneration for blink frames.
- Placement cached weakly by immutable TerrainData. No persistent storage/installation seed/schema changes. Palette fill and simple physical-pad strip remain available during preparation; failed decode/material preparation is observable in diagnostics.
- Beacon overlays use simulation time, not wall-clock SVG animation: paired double pulse in a1.4s cycle. Pause freezes phase; retry/replay deterministic. No re-decoding/rasterizing SVG for animation.

## Review / validation

`http://127.0.0.1:5173/tests/dawes-landing.html`

Overview, close-up, real landing entry and approach comparison; original scenery toggle; Fly/Pause/restart and actual landing controls. Starts paused. Nearby views begin gear-down at hover throttle; entry uses authored initial state. Actual Game renderer/HUD, `updateShip`, `updateCamera` and Game collision checks. Fixed1×/120Hz practice, stops at touchdown/crash; no constructor/career IO, cargo/maintenance modifiers, settlement or handoff. First Landing/access reservations untouched. Source SVG link provided.

- `npm run test:surface-poi`:3456 checks: real SVG metadata, immutable parse, four-width footprint and exact pad anchors under translated/scaled/elevated placements, palette/clock replay, every native visible terrain vertex and1001 independent pre-art terrain/collision samples, scoped opt-in and invalid authoring rejection.
-45 desktop native checks: actual Game hook in all three landing views, source-accurate shared backdrop, no static-scene flicker, beacon changes confined to their two light regions, periodic replay, black footer, warm/cool palette alpha identity for all four modules, pan/zoom/off-mesh views, real controls/retry/touchdown/crash, other-site exact fallback and unchanged career/catalog/terrain. Keyboard thrust/pause/reload and career-byte isolation pass; overview/close/entry/approach/original/flying screenshots inspected.
- Hartwell gallery85 checks and all five historical hashes unchanged; production approach225 checks/keyboard/reload pass. Approach unit667798, stations65548+parked432029, empty2913+35, TypeScript/build pass. Existing Vite CJS/chunk warnings only.
- Controlled desktop RTX5080/Edge D3D11 moving-camera1920×1080 test:180 measured RAF frames after30 warmup, actual Game rendering/HUD, no timed readbacks.119.98FPS; CPU mean.99ms/p951.30ms/max1.50ms, RAFp958.4ms/max8.5ms.1200×720 native draw sampling mean.72ms/p95.90ms. CPU submission, RAF delivery and GPU timing are distinct; no mobile/full-career guarantee.
- Evidence: `Temp/st-dawes-landing-cdp-20261026.mjs`, matching native JSON/screenshots. `window.dawesLanding` exposes reset/advance/snapshot/checks/performance for repeatable save-free checks. Isolated browser/HMR blocked only in tests. Vite kept hidden/running; no push/deploy/mobile testing or live-save edits.
