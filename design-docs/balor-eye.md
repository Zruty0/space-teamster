# Balor Eye rendering and entry orientation

Updated: 2026-10-24

## Appearance

`src/balor-appearance.ts`: shared `drawBalorDisc()` for the local planet and system-map marker. On2026-10-24 Pete requested the same cratered-airless treatment as other rocky worlds, plus a deeper Eye and tendrils without widening its angular footprint.

The base now uses `drawCrateredDisc()` with stable body-ID profile `estella-i`:68 impacts, scale.88, basin coverage.8, relief contrast1.15, warm-grey tint[109,101,94]. Same immutable normalized crater/basin model and nested LOD as other airless worlds; terrain rotates only with the existing Eye-relative visit/system frame. No terrain/physics/POI changes.

`BALOR_EYE_ARC = PI/6` remains30° TOTAL rim arc (±15°). Original limb endpoints stay at x=cos15°, y=±sin15°. Central shoreline extends inward by~.14 planet radii (x~.827); four tapered molten tendrils reach x=.52–.72. The complete Eye—including tendrils—is clipped to the original angular wedge and disc. Hot yellow/orange radial gradient, red cooling shore and small crust plates remain; no off-limb bloom or atmospheric ring. At small chart scales the original inward one-pixel30° arc hint remains.

Historical progression: the initial broad cap was narrowed at Pete's request on2026-10-21; the2026-10-24 revision changes projected depth, not the approved angular width. No frame RNG, animation or changing permanent seed.

## Fixed visit orientation

`src/balor-orientation.ts` computes `atan2(-planetY,-planetX)` from Balor's actual stellar ephemeris at orbital entry. World +Y-up becomes a negative Canvas rotation. `orientBalorOrbitalVisit()` returns a phase-local clone; global catalogs and level registries stay canonical.

- Fresh local orbital entry: snapshot entry time, orient artwork, ground markers and landing reference together.
- No continuous rotation while physics time, warp or wall time advances.
- Retry: retain the phase snapshot; never add the rotation twice.
- Orbital descent: clone the approach frame/POI with that same snapshot. Return to orbit from that approach retains it.
- First surface ascent: local approach uses canonical ground coordinates. At orbital entry rotate ship position AND velocity once into the chosen frame, preserving altitude, along-track displacement, speed, angular momentum, temperature and delta-v accounting.
- Incoming space/transfer states are already inertial and must not rotate. Station orbits, dynamic station starts, transfer vectors and orbital markers also remain inertial.
- System-map marker (corrected2026-10-22): always faces Estella from its CURRENT plotted position (`atan2(-pos.y, -pos.x)` using the same `transferBodyState` result as marker placement). No system-view entry snapshot: freezing this while the marker moved caused the Eye to point away from the star. This chart-only facing does not rotate local surface geography or alter the frozen close-up visit.

The old42000s rotationPeriod metadata is removed; this is deliberately frozen presentation, not simulated synchronous spin or moving landing zones.

## Surface geography

Catalog longitudes for Balor are relative to the Eye (+X). Extraction One−0.35rad is on solid ground near the30° cap; Foundry One−1.65rad is at the cooler margin; Shade−2.6rad stays on the night side. Navigation labels specify “from the Eye.” Other bodies retain their existing coordinate rules.

No added magma terrain collisions, radiation/heat damage, weather, orbital mechanics or contract economics. No save migration is needed for this visual/frame pass.

## Verification

`npm run test:balor` includes naming/catalog regression and `tests/balor-eye.test.ts`:24 entry epochs, three surface destinations, star direction, fixed/retry snapshots, immutable global data, ground/cap separation, real Game load/descent/return/ascent transitions, landing prediction reference, conserved rigid-frame quantities, station start/ephemeris invariance, production local/system renderer dispatch (local snapshot fixed; system marker star-facing across a full orbit, camera offsets and stale snapshot fields), deterministic geometry, small-marker detail and zero-size guards.

Desktop-only visual fixture: `http://127.0.0.1:5173/tests/balor-eye-preview.html`. Uses the production renderer plus28 real-canvas pixel assertions for orientation, colours, inward reach/unchanged angular sector, clipping and repeated-image identity. Probe canvas explicitly keeps accelerated backing during repeated readback. Balor Eye unit regression2538 assertions covers the new immutable crater profile/tendril bounds as well as the existing visit/flight invariants. No user profile is loaded. Inspected with headless Edge at1280×900; no mobile viewport or emulation. The fixture is not a production build entry.
