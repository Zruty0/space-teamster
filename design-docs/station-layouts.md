# Authored docking layouts

Updated: 2026-10-18

- Assets: `art/stations/`; registry `src/local-layouts.ts`; physical-node assignments `src/content/estella/layouts.ts`.
- Named rectangles `berth-{id}-nose-{up|down|left|right}` are metadata, not painted/collidable geometry. Inkscape labels alone do not identify berths. Marker dimensions represent a14×4m container; all markers must imply the same SVG-units-per-metre scale. Nose directions describe the final layout orientation.
- The loaded rig is larger than a marker:16×6m frame plus a cab extending to13.5m ahead of its center. Leave room for the whole rig, not just the container rectangle.
- Visible fills and supported path strokes generate collision geometry. Rectangles, circles, ellipses and M/L/H/V/C/A/Z paths are supported, with composed SVG transforms. Keep gradients, masks and filters out of gameplay geometry unless the importer is extended.
- Station orientation rotates art, berths, collision and local spawns together. Current assets use fixed `rotationDegrees` and `autoRotate:false`; medieval stations have varied fixed angles. Svarog deliberately has0° rotation.

## Svarog Shipyard

`art/stations/svarog-shipyard.svg`, assigned only to physical node `estella-via-drydock`. Veles Terminal is unchanged. Source was Pete's Downloads `shipyard.svg`; original source remains untouched.

- Physical size preserved at approximately510.796×360.323m;36 berths,280 visible shapes.
- Removed `rect535`, a solid duplicate over berth N.
- Moved A/D0.5m upward, F0.5m outward, and E0.5m outward plus0.25m upward. No hull/artwork rescaling or redesign.
- Default berth-relative arrivals use a contiguous collision-free approach between16m and70m. The shipyard's actual approaches range23.5–70m. Full-frame/cab polygon intersection checks include occupied berths; half-metre intervals use longitudinally expanded footprints to cover the complete swept path, not just endpoints. A nearer internal approach is valid; no requirement for every berth to have a straight open-space corridor.
- Departure distance is at least half the layout diagonal plus25m, rounded up; Svarog uses338m. This encloses the whole rotated station and clears the rig footprint. Ordinary small stations retain their existing140m minimum.
- Orbital and cluster handoffs expand their arrival rings for oversized layouts; incoming direction and existing velocity semantics are preserved. Fixing only `level.startX/Y` is insufficient because handoffs supply overrides.
- Camera follows the rig at the normal4px/m close zoom on departure; it does not fit the whole station. On arrival it frames only the rig and assigned berth, using independent horizontal/vertical spans with15m footprint margins in the central82% of the screen. Zoom drops below4 only as needed to keep both visible, with no arbitrary minimum zoom. Zoom-out and center constraints apply immediately so smoothing/movement/desktop resizing cannot hide the berth; zoom-in eases back to normal as the rig approaches. Same policy for authored and procedural stations; physical scale does not change.
- Physics collision response, contract economics and mission settlement rules are unchanged. Full-footprint checks are used for placement/validation, not a replacement flight-collision solver.

## Validation

`npm run test:stations` parses actual SVGs using development-only `@xmldom/xmldom` and a small browser-DOM adapter. No stale geometry fixture or browser is required.

Checks every shipyard berth with the other35 occupied: dock/undock spawn clearance, delivery acceptance, continuous approach clearance, deterministic retries, geometric departure routes into open space, departure completion outside the full yard, actual orbital handoff behavior, close departure camera, tight rig/berth arrival framing through movement and desktop resizing, and existing small/medieval layout regression. Test-only fixed-heading RCS path search adds no gameplay autopilot and is not a fuel/handling balance test.
