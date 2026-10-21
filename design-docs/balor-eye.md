# Balor Eye rendering and entry orientation

Updated: 2026-10-20

## Appearance

`src/balor-appearance.ts`: shared `drawBalorDisc()` for the local planet and system-map marker. Charcoal rock, narrow sunward molten cap, yellow/orange interior, irregular red cooling margin and small crust plates. Cached normalized geometry; gradients in Canvas2D; no image assets, frame randomness, animation or off-limb atmospheric halo. Planet/trajectory/target overlays keep their existing draw order.

Pete rejected the initial broad cap and requested15–30degrees. `BALOR_EYE_ARC = PI/6` is30° TOTAL surface arc, ±15° from the star-facing point. Its projected shoreline is near x=cos(15°), so the top-down view shows a narrow bright patch on the limb, not a centred eyeball or a molten hemisphere. Shore roughness scales with cap depth; crust and gradient scales follow the same footprint. At small chart scales, an inward one-pixel stroke preserves visibility over the same30° arc; it does not enlarge into a hemisphere.

## Fixed visit orientation

`src/balor-orientation.ts` computes `atan2(-planetY,-planetX)` from Balor's actual stellar ephemeris at orbital entry. World +Y-up becomes a negative Canvas rotation. `orientBalorOrbitalVisit()` returns a phase-local clone; global catalogs and level registries stay canonical.

- Fresh local orbital entry: snapshot entry time, orient artwork, ground markers and landing reference together.
- No continuous rotation while physics time, warp or wall time advances.
- Retry: retain the phase snapshot; never add the rotation twice.
- Orbital descent: clone the approach frame/POI with that same snapshot. Return to orbit from that approach retains it.
- First surface ascent: local approach uses canonical ground coordinates. At orbital entry rotate ship position AND velocity once into the chosen frame, preserving altitude, along-track displacement, speed, angular momentum, temperature and delta-v accounting.
- Incoming space/transfer states are already inertial and must not rotate. Station orbits, dynamic station starts, transfer vectors and orbital markers also remain inertial.
- System-map marker: same entry-time freeze rule. The body continues following its orbit, but its artwork does not continuously turn during that view. A fresh local view takes a fresh snapshot.

The old42000s rotationPeriod metadata is removed; this is deliberately frozen presentation, not simulated synchronous spin or moving landing zones.

## Surface geography

Catalog longitudes for Balor are relative to the Eye (+X). Extraction One−0.35rad is on solid ground near the30° cap; Foundry One−1.65rad is at the cooler margin; Shade−2.6rad stays on the night side. Navigation labels specify “from the Eye.” Other bodies retain their existing coordinate rules.

No added magma terrain collisions, radiation/heat damage, weather, orbital mechanics or contract economics. No save migration is needed for this visual/frame pass.

## Verification

`npm run test:balor` includes naming/catalog regression and `tests/balor-eye.test.ts`:24 entry epochs, three surface destinations, star direction, fixed/retry snapshots, immutable global data, ground/cap separation, real Game load/descent/return/ascent transitions, landing prediction reference, conserved rigid-frame quantities, station start/ephemeris invariance, production local/system renderer dispatch, deterministic geometry, small-marker detail and zero-size guards.

Desktop-only visual fixture: `http://127.0.0.1:5173/tests/balor-eye-preview.html`. Uses the production renderer plus20 real-canvas pixel assertions for orientation, colours, narrow footprint, clipping and repeated-image identity. No user profile is loaded. Inspected with headless Edge at1280×900; no mobile viewport or emulation. The fixture is not a production build entry.
