# Regional surface weather

Updated: 2026-11-02 (Pacific)
Status: LIVE in normal careers. Pete authorizes all atmospheric planets/moons and surface POIs, mission-time variation, retry stability, and Port Stribog as the strongest weather challenge. Zhulong is the selected Dahai recommendation.

## Scope / review

- 36 catalog surface POIs on eight atmospheric worlds: Acheron, Gaia, Dahai, Hartwell, Kuznia, Almaden, Marisma, Mercy. Two Orselle district aliases share their physical city's weather: 34 distinct receiving sites.
- Every atmospheric landing, parked launch, departure and descent uses regional air automatically through the real Game constructor. No career opt-in or save migration.
- Airless destinations are unchanged. Giants retain existing orbital cloud/weather art; no giant surface destinations invented. Surface geometry, access, contract terms/history and orbital geography are unchanged.
- Save-free interactive review: `/tests/surface-weather.html`. Select POI, landing/parked/approach/departure, and absolute mission seconds; +6 hours changes the conditions. Fly uses actual Game handlers. Synthetic rig has real atmospheric equipment; no constructor/save IO/settlement on this page. Effects and low-quality paint are independent of physical weather.
- The old `/tests/dawes-landing.html?atmosphere=1` remains a historical tuning comparison, not the production profile. Its optional `atmosphericPilot` hook deliberately retains Dawes-only scope.

## Regional model

`src/surface-weather.ts` owns authored world defaults, selected site overrides and stateless evaluation. Permanent canonical POI identity seeds the `surface-weather-v1` namespace. Phase IDs, cameras, frame rate, wall-clock time and retry count never seed weather.

- Two slow synoptic components (hours) plus two smooth gust components (seconds), with permanent prevailing direction/phase. Conditions can weaken, strengthen or briefly reverse. Site exposure, gust cadence, mean/gust speeds, cloud base/depth/coverage and wind-force budget differ.
- Absolute time is `phase.worldTimeStart + elapsed`. Phase retry restores that epoch; identical inputs reproduce weather/flight/particles. Whole-mission retries retain their existing start-time mechanism. Flying/waiting longer encounters later weather, not an attempt-dependent reroll.
- Regional advection is the analytic integral of the same wind; clouds and directional wisps do not use an independent weather clock.
- Terrain shelter uses physical landing height, blending to approach terrain away from the target. Floating decks receive full exposed flow, not fictitious mountain shelter. Their density uses absolute planetary altitude, not height above deck.
- Density and wind taper continuously to zero at the atmosphere boundary. No atmospheric flow above it or on airless bodies.
- Orselle/Financial District/First Dome Quarter use the same canonical weather seed, including clouds and tracers.

## Character / challenge

World defaults are varied per POI (mean/gust scales ±15%, independent synoptic phases/periods). Representative tuning:

| Place / family | Character | Nominal unsheltered mean / gust amplitude, m/s | Wind-increment bound, m/s² |
|---|---|---:|---:|
| Gaia default | Temperate air | 8 / 4 | 0.65 |
| Valenne / Mirabel / Cousteau | Sheltered farms / coastal crosswinds / polar fronts | 6 / 3; 12 / 6; 15 / 9 | 0.5 / 0.8 / 1.0 |
| Fuyuan | Calm-latitude marine air | 7 / 3 | 0.55 |
| Jiuyuan / Bingjie | Open-ocean breeze / polar marine gusts | 14 / 7; 15 / 8 | 0.9 / 0.95 |
| **Zhulong** | Storm-belt squalls | **36 / 19** | **2.25** |
| Hartwell default | Thin-air gusts, sparse higher clouds | 12 / 6 | 0.55 |
| Concord / Gale Survey | Sheltered / exposed gust fronts | 7 / 3; 25 / 14 | 0.35 / 1.1 |
| Kuznia default | Thick cold squalls, low cloud | 24 / 13 | 1.6 |
| Morana Station | Polar squalls | 30 / 17 | 1.9 |
| **Port Stribog** | **Violent, fast crosswind gusts; lowest cloud** | **62 / 32** | **3.8** |
| Acheron / Nimbus Crucible | Exposed cloud currents / acid-cloud currents | 20 / 9; 27 / 13 | 1.3 / 1.7 |
| Almaden | Thin sulfur drift | 9 / 5 | 0.45 |
| Marisma | Slower dense methane squalls | 16 / 9 | 1.2 |
| Mercy | Gentle cold nitrogen air | 6 / 3 | 0.25 |

These are profile parameters, not a promise of constant wind speed or a maximum forecast. Slow weather components also modulate the nominal mean; Stribog can exceed 100 m/s in its strongest periods. Profiles have calmer windows.

Zhulong fits because its fixed home port supports fleets working the storm belts. It remains fixed; no moving city or permanent eyewall is invented. Fuyuan's established calm belt remains gentler, while Bingjie has moderate polar exposure. Stribog has the greatest weather envelope and force budget throughout the catalog; other places can still be harder for non-weather reasons.

## Flight / continuity

- Production landing uses density-scaled relative-air drag. Smooth bounded saturation preserves differences between gusts instead of flattening every strong wind to the pilot's 0.35 m/s² cap.
- Approach and departure use the **same wind-induced drag increment** at matching position/velocity/absolute time. Old approach acceleration layers and random weather torque are replaced, never added on top. Old approach fixtures without regional air remain legacy comparisons.
- Approach baseline aerodynamics/lift/heat and existing compressed gate-to-landing position/velocity mapping are retained. This is shared air and matched-state wind-force continuity, **not** a rewrite making the entire phase handoff physically seamless. Predictions use the same weather-force path. Existing approach turbulence warnings/exposure now follow strong changing regional winds; maintenance receives total production aerodynamic acceleration.
- SAS still targets zero ground velocity, reserves finite RCS for wind before damping, consumes delta-v and maintenance effort, and does not add authority or cancel gravity. Most stock-rig profiles are within its hold authority; strong Stribog weather can saturate it. HUD explicitly warns `RCS LIMIT — USE MANUAL THRUST`. Actual stock lateral trim is tested at Stribog; no position lock.
- Weather does not waive equipment/restriction gates, alter prices/access or add saved fields. Legacy dev-panel sine-wind settings do not stack with regional air.

## Presentation / budget

- Climate-dependent soft cloud coverage/base/depth and atmosphere tint; clouds in approach/departure and landing skies. Transparent sprite gutters prevent hard cloud ends. Upper atmosphere/physical terrain clips prevent sky effects outside the air column.
- The existing 128-slot airborne tracer and 256-slot exhaust pools remain fixed. Strong wind increases visual emission cadence within the same smoke budget to fill stretched plumes. No draw-time aging or quality-dependent simulation.
- Exact exclusion clips cover SVG solids and floating decks, supports and domes; no fake solid column beneath platforms. No changes to colliders or existing generic Dahai landing geometry.
- One active regional presentation per Game, two small raster sprites (28,672 pixels total), weak terrain-air cache. No accumulating per-POI texture cache. `weatherVisuals` / `weatherLow` change paint only; production physical weather is on by default.
- No new rain, lightning, vertical gust forces, ground dust, building wakes, smokestacks or geography. Future stack emitters retain the shared plume API.

## Evidence

- `npm run test:surface-weather`: 4,357 checks: all atmospheric sites/worlds plus vacuum exclusion, aliases, time variation, analytic advection, epoch equivalence, atmosphere edge, floating altitude/shelter, force continuity/bounds, finite SAS across authority variants, deterministic full control replay, and one-step live/predicted approach agreement.
- Day scan: strongest sampled wind increments Stribog ~3.783 m/s², Zhulong ~2.212, Morana ~1.861, Nimbus ~1.662. All other Dahai locations remain below 1.0. Stribog exceeds stock 2.45 m/s² SAS authority intentionally.
- Native review: 476 checks across all 36 catalog atmospheric POIs / eight worlds and 66 airless POIs. Equipped actual Game landing/departure/descent, parked no-fuel wind, retries, visual/quality isolation, actual phase handoff clocks, floating-structure pixel exclusion with positive control, and stock Stribog trim pass.
- Separate real Game constructor/default-enable and actual `reloadPhase` replay pass in an isolated browser, with no career storage changes. Native review keyboard/pause/reload isolation passes; screenshots inspected.
- Retained baseline native 634 + pilot 30 and Hartwell 250 pass; air/tracer unit 9,242 + 153,955; surface/collision/grading 5,715 / 652 / 12,049; empty 2,913 + 35; biome 667,798; typechecks/build pass.
- Desktop 1080p paused-scene draw samples: Stribog/Olympos ~0.63–0.68 ms mean, approach ~0.44–0.45 ms. Later RAF pacing ~65–72 FPS also occurs without rendering; earlier paired runs ~120 FPS. Not a full active-flight, full-career or mobile performance guarantee; no mobile testing.
- Temp evidence: `st-surface-weather-cdp-20261102.mjs`, `st-surface-weather-native-20261102.json`, matching screenshots and run log. No push/deploy or live-save edits.
