# Authored docking layouts

Updated: 2026-10-18

- Assets: `art/stations/`; registry `src/local-layouts.ts`; physical-node assignments `src/content/estella/layouts.ts`.
- Named rectangles `berth-{id}-nose-{up|down|left|right}` are metadata, not painted/collidable geometry. Inkscape labels alone do not identify berths. Marker dimensions represent a14×4m container; all markers must imply the same SVG-units-per-metre scale. Nose directions describe the final layout orientation.
- The loaded rig is larger than a marker:16×6m frame plus a cab extending to13.5m ahead of its center. Leave room for the whole rig, not just the container rectangle.
- Visible fills and supported path strokes generate collision geometry. Rectangles, circles, ellipses and M/L/H/V/C/A/Z paths are supported, with composed SVG transforms. Keep gradients, masks and filters out of gameplay geometry unless the importer is extended.
- Station orientation rotates art, berths, collision and local spawns together. Current assets use fixed `rotationDegrees` and `autoRotate:false`; medieval stations have varied fixed angles. Svarog deliberately has0° rotation.

## Svarog Shipyard

`art/stations/svarog-shipyard.svg`, assigned only to physical node `estella-via-drydock`. Veles Terminal is unchanged. Source was Pete's Downloads `shipyard.svg`; original source remains untouched.

- Physical size preserved at approximately510.796×360.323m;36 cargo berths,275 base shapes plus any parked-ship artwork. Five former pink rectangles are now ship-dock metadata.
- Removed `rect535`, a solid duplicate over berth N.
- Moved A/D0.5m upward, F0.5m outward, and E0.5m outward plus0.25m upward. No hull/artwork rescaling or redesign.
- Default berth-relative arrivals use a contiguous collision-free approach between16m and70m. The shipyard's actual approaches range23.5–70m. Full-frame/cab polygon intersection checks include occupied berths; half-metre intervals use longitudinally expanded footprints to cover the complete swept path, not just endpoints. A nearer internal approach is valid; no requirement for every berth to have a straight open-space corridor.
- Departure distance is at least half the layout diagonal plus25m, rounded up; Svarog uses338m. This encloses the whole rotated station and clears the rig footprint. Ordinary small stations retain their existing140m minimum.
- Orbital and cluster handoffs expand their arrival rings for oversized layouts; incoming direction and existing velocity semantics are preserved. Fixing only `level.startX/Y` is insufficient because handoffs supply overrides.
- Camera frames rig plus station center on departure, or rig plus assigned berth on arrival—not the whole station. It uses independent horizontal/vertical spans with15m footprint margins in the central82% of the screen. Departure zoom is capped at1.5–4px/m; arrival retains the4px/m maximum without a minimum that could hide a distant berth. Zoom-out and center constraints apply immediately; zoom-in eases back toward the close view. If the departure minimum prevents both endpoints fitting, keep their midpoint rather than violating the cap or favoring one endpoint. Same policy for authored and procedural stations; physical scale does not change.
- Physics collision response, contract economics and mission settlement rules are unchanged. Full-footprint checks are used for placement/validation, not a replacement flight-collision solver.

## Parked ship docks

- Rectangles named `ship-{id}-nose-{up|down|left|right}` describe ship placement. Like cargo markers, they are not drawn or collidable themselves, and do not expand station bounds. They are not player delivery berths. Existing dock/platform hull geometry remains unchanged when a dock is empty.
- `art/ships/small-ship-{1,2,3}.svg` are unmodified copies of Pete's supplied art. Models point up; painted bounds are uniformly fitted inside a dock and rotated to its authored nose direction. Rendering and collision polygons receive the same composed transform. The whole layout still respects the station's fixed orientation.
- Each supported dock gets an independent50/50 occupied/empty draw, followed by a separate uniform model draw if occupied. Hash inputs are stable station ID, layout ID, dock ID and draw purpose—not mission seed, level ID, display name, phase or time. No new save state, animation or frame-time randomness. Legacy callers without station ID fall back to station name.
- Current models support docks up to50m long. Svarog's three short docks are eligible; its two long docks remain empty until large-ship art is available. Current stable Svarog result: C contains small-ship-1; A/B/D/E are empty. Other eligible docks/stations can use any of the three models.
- Composed layouts are cached per base layout/station and do not mutate the parsed base asset. Each ship replaces its marker at the original SVG paint position: dock interior first, ship second, foreground ribs/gantries afterward. Ships are not appended over all station artwork. Svarog dock interiors retain their authored dark red `#2c1111`, not black. Parked ships join the existing authored shape rendering/collision pipeline; no new AI or economic behavior.

## Validation

`npm run test:stations` parses actual SVGs using development-only `@xmldom/xmldom` and a small browser-DOM adapter. No stale geometry fixture or browser is required.

Checks every shipyard berth with the other35 occupied: dock/undock spawn clearance, delivery acceptance, continuous approach clearance, deterministic retries, geometric departure routes into open space, departure completion outside the full yard, actual orbital handoff behavior, capped rig/station-center departure framing, tight rig/berth arrival framing through movement and desktop resizing, and existing small/medieval layout regression. Test-only fixed-heading RCS path search adds no gameplay autopilot and is not a fuel/handling balance test.

`tests/parked-ships.test.ts` also covers all three real ship assets, removal of all pink geometry, stable population/reloads/real arrival and departure wiring, independent occupancy/model draws across200 fixed station identities, no large-ship substitution, footprint bounds, all four nose directions, rendering/collision transform agreement, original marker paint order and foreground ribs, base-layout immutability, and all36 cargo berths with both actual and fully occupied shipyard fixtures. Assertion totals include repeated per-vertex geometry checks.
