# Density-scaled engine smoke

Updated: 2026-11-03 (Pacific)
Status: LIVE. Pete requests smoke amount and duration scale with atmospheric density. The former Stribog plume is the Gaia reference; dense Acheron should show roughly five times that amount.

## Model / bounds

- `flight-atmosphere.ts` uses actual local `LandingAir.sample(...).density`, in kg/m³. No planet-name multiplier or physics-density changes. Consequently Olympos at 55 km remains near Gaia; Nimbus and lower Acheron reach the dense-air target. This altitude distinction was explicitly explained, not individually confirmed as an artistic preference.
- Amount target `A = min(5, (max(0, rho) / 1.2)^1.1)`; persistence factor `s = sqrt(A)`. Engine emission multiplier is `0.04 + 0.96*s`; puff duration is nominal lifetime ×s, with a brief 0.25–0.35 s vacuum floor and 8 s absolute ceiling. Invalid density uses the vacuum envelope. Radius transitions continuously from a small vacuum puff to the existing atmospheric size.
- Reference engine cadence `min(48, 22 + 30*power)` events/s. Density scales it, with a hard 112 events/s ceiling; two actual nozzles per event. Wind still advects smoke but no longer independently boosts emission, so the density calibration stays legible. The sparse wind-direction tracers remain separately speed-scaled and unchanged.
- Nominal default lifetime remains 2.2–2.6 s at Gaia density. `SmokeSource.life` is now a reference-density lifetime, not a density-independent expiry. This shared API still emits one puff per explicit call; future stationary sources own their emission clocks. No stacks/source registrations added.
- Smoke pool expands 256→1,536 fixed slots to accommodate about 1,130 live dense-air puffs without silently truncating their lifetimes. If full, skip births rather than overwrite living puffs. Maximum 224 engine births/s, bounded slot search, expiry and terrain/structure masking. No new raster textures/cache; existing cloud/puff sprites retained.
- Emission, advection and ageing occur only on simulation ticks. Draw/pause/quality do not advance particles or change ship/thrust/fuel state. Reset and identical inputs reproduce density transitions exactly. No weather-force, trajectory, save or economic changes.

## Evidence

- `tests/smoke-density.test.ts` runs under `test:landing-air`: 10,829 checks. Uniform full-thrust steady population: vacuum 2 / thin air 29 / Gaia 232 / Stribog 449 / dense Acheron 1,130. Mean lifetime ~0.33 / 0.83 / 2.41 / 3.35 / 5.37 s. Dense/reference count ratio ~4.87, also verified at partial power. Density/vacuum continuity, invalid samples, saturation without overwriting, expiry, replay and immutable ship/terrain pass.
- Existing air 9,242 / tracer-source 92,863 and weather/buffet/band suites pass; build passes.
- Native 1,437 checks include all-site flight, actual constructor/retry, held same-thrust sources using actual Game regional air/rendering, pause/keyboard/storage isolation and structure clipping. Native Gaia 225 / Stribog 435 / Nimbus 1,130 / Olympos 234 puffs; Nimbus/Gaia ~5.02. Held-source tests isolate density from differing gravity/hover throttle; they do not simulate full-thrust hover physics.
- Actual screenshot comparison inspected. Dense Nimbus paused 1080p render ~1.31 ms mean / 1.60 ms p95; Gaia ~0.80 ms. Desktop samples, not mobile/full-career performance guarantees. Temp `st-smoke-density-cdp-20261103.mjs`, matching native log, `st-smoke-density-comparison-20261103.json`, `st-surface-weather-*-20261103-smoke-density` reports/images.
- Separate open report: near-ground Stribog approach projection still varies/flickers. It includes lower approach winds through terrain impact; segment-based dash rendering is another possible contributor. No reproduction/root-cause isolation or fix for that report is claimed by this smoke change.
