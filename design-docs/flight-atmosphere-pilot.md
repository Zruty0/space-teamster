# Flight atmosphere pilot

Updated: 2026-11-02 (Pacific)
Status: Pete likes the pilot; adds airborne wind-direction particles and anticipates future smokestacks. Particles are implemented in the existing save-free Dawes pilot. No smokestacks or wider career/world rollout added. SAS remains zero ground velocity.

## Try

`http://127.0.0.1:5173/tests/dawes-landing.html?atmosphere=1`

- Starts paused. Fly enables actual landing physics; T toggles SAS, Space selects hover lift. SAS starts on in this pilot and its choice survives the parked takeoff hold.
- Approach comparison + Fly animates clouds over actual Game approach rendering, with the rig held in its preview pose. This is not an autonomous full approach simulation.
- Visual effects, physical landing wind and low-quality paint are independently switchable. No career constructor, save loading/writing, settlement or phase completion. Normal careers/plain practice stay unchanged.
- `Game.atmosphericPilot` is the explicit optional hook; Game additionally limits it to ordinary Dawes surface/approach scenes. Other sites and floating layouts are not opted in.

## Physics and SAS

`landing-air.ts`: permanent POI-seeded prevailing direction, 12 m/s base plus smooth 3/2 m/s gust components, using absolute world seconds. Native terrain-relative shelter smoothly reduces wind near the ground; density follows body atmosphere/altitude. Airless inputs produce zero wind/density.

- These are velocities, **not the existing approach wind-layer accelerations**. Existing approach physics and legacy landing dev-panel wind remain unchanged outside the pilot; no direct unit conversion or double application.
- Pilot drag uses velocity relative to moving air, density-scaled against Hartwell's 0.18 reference density. Only the wind-induced acceleration increment is capped at 0.35 m/s²; ordinary drag is not clipped to that cap. Tune other-world profiles before broader use.
- SAS targets zero **ground-relative velocity**, not airspeed and not a remembered position. It reserves existing RCS authority for wind rejection first, then spends the remainder damping velocity. This fixes a tested failure where a full-thrust climb exhausted the velocity-damping budget and allowed lateral wind drift.
- Total SAS acceleration remains at most 10% of current main-engine acceleration. Underpowered SAS may saturate; no free cancellation or extra thrust. Ordinary drag may help braking; it is not cancelled. Normal lift/hover throttle is still required: SAS is not an anti-gravity/throttle autopilot.
- Counter-wind RCS consumes delta-v and actual Game maintenance telemetry. Existing equipment/restriction gates remain in charge. Pilot ground hold preserves the chosen SAS toggle; normal career ground-hold behavior is untouched.
- Pilot trajectory prediction runs the same `updateShip` integrator, air sampler, held controls, SAS and swept collision at 120 Hz. No drawing/emission during prediction. Legacy prediction is unchanged when the pilot is off.

## Art / resources

`flight-atmosphere.ts` owns presentation only:
- Three sparse cloud layers, seeded world-space cells, absolute-clock advection, parallax, atmosphere-tinted soft shapes. No camera/time reseeding. Low quality thins cells without moving survivors. Clipped to approach airspace, behind rig/gates/HUD. No atmospheric clouds on airless bodies.
- Two main-engine nozzle plumes follow actual thrust/nacelle pose, inherit rig velocity, expand, drift with the same local air and expire. Short dispersing vacuum exhaust is supported, not lingering atmospheric smoke. No ground dust added.
- Fixed pool of 256 smoke particles, physics-tick emission, deterministic serial hashes and reset/retry. Draw and paused redraw never advance particles. Low quality only thins paint; simulation/physics are identical.
- One 256×96 cloud sprite and one 64×64 soft puff sprite: 28,672 extra raster pixels (~112 KiB raw RGBA), not a total browser/GPU memory claim. Cloud quads are bounded by screen LOD. No per-frame gradient creation, image decode or unbounded per-world cache.
- `wind-tracers.ts`: separate 128-slot pool of sparse airborne flecks, with a brighter leading tip / short fading tail. Positions are seeded from permanent POI identity across the fixed landing region, never the camera. Actual local wind advects them at physics ticks, including reversal/calm; they need no engine thrust. They expire/reseed, are hidden in calm air, and clear in vacuum. Low quality only thins paint. No terrain stipple or new textures.
- Actual Game and practice pad-hold paths advance these visual pools while the rig is parked, without thrust, fuel or physical motion. Paused redraw still cannot advance either pool.
- Reusable `emitSmoke({x,y,vx,vy,life?,size?}, air, time)` emits one world-space puff into the existing 256-slot pool. Engines now use it; a synthetic stationary upward source proves wind deflection. Life/size are bounded (atmospheric max 8 s / scale 3; vacuum remains short-lived). Future chimneys must supply authored/resolved world anchors and an emission-rate budget. No source registry, chimney geometry, stacks, extra smoke sources or buoyancy model installed yet.
- Landing particles/smoke/wisps clip against the shared physical terrain and all solid polygons (including overlapping buildings/towers). Rig, guidance and HUD paint afterward. Wind HUD reports m/s and zero-ground-speed SAS target.

## Gates / limitations

The same absolute clock/regional velocity drives clouds and local air, so retries/phase clocks do not reroll weather. **Approach physical wind remains its existing acceleration-layer model.** A continuous physical force transition between that model and the new landing model has not been rolled out or claimed: inspect/tune that boundary, per-world weather, floating-platform altitude/shelter, and loadouts before production enablement. No vertical gusts, random torque, building wakes, new biome geography or mobile testing.

## Validation

- `npm run test:landing-air`: 9,242 original checks plus 153,955 wind-tracer/source checks (actual displacement, reversal/calm, terrain/solid rejection, vacuum, POI identity, deterministic replay, engine-off population, no physics/terrain mutation, stationary rising plume, resource bounds). Analytic advection/velocity agreement, absolute-clock replay, 20-second stationary hold versus wind drift, thrust-authority variants/saturation, full-thrust climb wind priority, RCS cost/cap, same-integrator prediction, deterministic particles/retry, expiry and vacuum.
- Native: 634 existing Dawes/cross-world checks (102 sites/30 worlds) + 30 pilot checks. Actual Game handler holds position against wind, records RCS effort and advances exhaust; foreign POIs refused. Visual toggles preserve physics; opacity/ground clipping, clouds/vacuum, parked/takeoff SAS, pause/reload/keyboard and career isolation pass. Screenshots inspected.
- Controlled 12-second hover: SAS on x=1000, vx=vy=0; off drifts ~9.85 m. This is a control experiment, not a universal weather claim.
- Surface 5,715 / collision 652 / grading 12,049; empty runs 2,913 + rig 35; biome 667,798; existing Hartwell native 250 and typechecks/build pass.
- Desktop 1080p pilot with active plume/wind/prediction: ~1.33 ms mean draw, p95 ~1.6–1.7 ms, sampled max ~1.9–2.1 ms; idle and rendering both ~120 FPS. Physics ticks occur outside that draw timer. Not full-career/mobile proof.
- Latest native driver/report/screenshots: Temp `st-flight-atmosphere-cdp-20261102.mjs`, `st-flight-atmosphere-native-20261102.json`, `st-flight-atmosphere-*-20261102.png`. Actual Game parked/engine-off advection and no fuel use pass; both pools replay identically across visual quality and retry. Latest desktop draw mean ~1.34 ms / p95 1.6 / max 2 ms; idle/render ~120 FPS. Screenshots inspected. Separate Edge profile, no live-save edits, push or deploy.
