# Regional surface weather

Updated: 2026-11-03 (Pacific)
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
| **Port Stribog** | **Gust-dominated crosswinds, lulls/reversals; lowest cloud** | **10 / 55** | **3.7** |
| Acheron / Nimbus Crucible | Exposed cloud currents / acid-cloud currents | 20 / 9; 27 / 13 | 1.3 / 1.7 |
| Almaden | Thin sulfur drift | 9 / 5 | 0.45 |
| Marisma | Slower dense methane squalls | 16 / 9 | 1.2 |
| Mercy | Gentle cold nitrogen air | 6 / 3 | 0.25 |

These are profile parameters, not constant wind speeds. Slow components also modulate the nominal mean. November 3 Stribog tuning supersedes the original 62 / 32 m/s, 3.8 m/s² profile: Pete found it too steady and wants ordinary non-Shift lateral control to cope, prioritizing gustiness. Prevailing baseline is now 10 m/s, combined gust amplitude 55 m/s, gust rate 0.9 rad/s (~7 / 19 s components), and wind-increment ceiling 3.7 m/s². Unsheltered absolute wind is bounded by 72 m/s. Peaks remain challenging but repeatedly pass through lulls and reversals instead of staying saturated. Other climates and phase/identity seeding are unchanged.

Zhulong fits because its fixed home port supports fleets working the storm belts. It remains fixed; no moving city or permanent eyewall is invented. Fuyuan's established calm belt remains gentler, while Bingjie has moderate polar exposure. Stribog retains the greatest wind-force budget; its challenge is short gusts rather than the greatest sustained wind speed. Other places can still be harder for non-weather reasons.

## Flight / continuity

- Production landing retains density-scaled ground-relative base drag and adds a separately bounded relative-air wind increment. This hybrid is not pure air-relative drag: high sustained winds can saturate the increment and flatten felt gust variation. The Stribog retune moves its velocity profile through the responsive range; it does not rewrite the shared aerodynamic model.
- Approach and departure use the **same wind-induced drag increment** at matching position/velocity/absolute time. Old approach acceleration layers and random weather torque are replaced, never added on top. Old approach fixtures without regional air remain legacy comparisons.
- Approach baseline aerodynamics/lift/heat and existing compressed gate-to-landing position/velocity mapping are retained. This is shared air and matched-state wind-force continuity, **not** a rewrite making the entire phase handoff physically seamless. Predictions use the same weather-force path. Existing approach turbulence warnings/exposure now follow strong changing regional winds; maintenance receives total production aerodynamic acceleration.
- SAS still targets zero ground velocity, reserves finite RCS for wind before damping, consumes delta-v and maintenance effort, and does not add authority or cancel gravity. Most stock-rig profiles are within its hold authority; strong Stribog weather can saturate it. HUD explicitly warns `RCS LIMIT — USE MANUAL THRUST`. Actual stock ordinary lateral trim is tested at Stribog; no position lock or stronger thrusters. Gear-down non-Shift lateral + SAS totals 3.675 m/s² with default acceleration. The 3.7 ceiling is only 0.025 above that; scanned near-hover gusts peak around 3.54. This is a stock near-hover target, not a promise for every loadout/high-speed approach.
- Weather does not waive equipment/restriction gates, alter prices/access or add saved fields. Legacy dev-panel sine-wind settings do not stack with regional air.

## Presentation / budget

- November 3 regression fix: the rollout suppressed old approach wind bands along with their obsolete force layers. `approach-wind-bands.ts` restores outline bands, arrows and **m/s** labels in actual approach/departure rendering, sampling `flightAir` at current mission time. These are altitude guides, not invented shear zones or restored acceleration layers; physics and predictions are unchanged. World-altitude anchors with bounded camera LOD (at most 26 rows / 96 arrows per row), atmosphere/terrain clipping, calm/vacuum suppression and HUD-clear labels. No texture/cache or simulation mutation.

- Climate-dependent soft cloud coverage/base/depth and atmosphere tint; clouds in approach/departure and landing skies. Transparent sprite gutters prevent hard cloud ends. Upper atmosphere/physical terrain clips prevent sky effects outside the air column.
- The existing 128-slot airborne tracer and 256-slot exhaust pools remain fixed. Strong wind increases visual emission cadence within the same smoke budget to fill stretched plumes. No draw-time aging or quality-dependent simulation.
- Exact exclusion clips cover SVG solids and floating decks, supports and domes; no fake solid column beneath platforms. No changes to colliders or existing generic Dahai landing geometry.
- One active regional presentation per Game, two small raster sprites (28,672 pixels total), weak terrain-air cache. No accumulating per-POI texture cache. `weatherVisuals` / `weatherLow` change paint only; production physical weather is on by default.
- No new rain, lightning, vertical gust forces, ground dust, building wakes, smokestacks or geography. Future stack emitters retain the shared plume API.

## Evidence

- `npm run test:surface-weather`: 14 wind-band checks (live direction/velocity/time, pause replay, clipping setup, HUD clearance, bounded work and immutable camera), plus 4,357 weather checks: all atmospheric sites/worlds plus vacuum exclusion, aliases, time variation, analytic advection, epoch equivalence, atmosphere edge, floating altitude/shelter, force continuity/bounds, finite SAS across authority variants, deterministic full control replay, and one-step live/predicted approach agreement.
- Stribog gust tests: 325,367 checks across 54 mission epochs (day scan plus week/month/year offsets) × five heights (5–2,000 m), sampled every 0.1 s over one-minute windows. Observed peak 3.542 m/s², longest stretch without a <0.5 m/s² lull 4.6 s, minimum signed force swing 5.746 m/s², maximum window mean absolute force 1.557 m/s². Manual assistance beyond SAS needed in ~24% of samples, not continuously. Deterministic 4 Hz synthetic pilot input uses ordinary lateral thrust, never Shift; unit 30 s worst drift ~2.85 m versus ~14.31 m SAS-only.
- Day scan: strongest sampled wind increments Stribog ~3.520 m/s², Zhulong ~2.212, Morana ~1.861, Nimbus ~1.662. All other Dahai locations remain below 1.0. Stribog exceeds stock 2.45 m/s² SAS authority intentionally.
- Native review: 561 checks (November 3), including real approach/departure wind-band labels at all atmospheric sites and positive-control native terrain/atmosphere/calm/vacuum clipping. Original coverage across all 36 catalog atmospheric POIs / eight worlds and 66 airless POIs. Equipped actual Game landing/departure/descent, parked no-fuel wind, retries, visual/quality isolation, actual phase handoff clocks, floating-structure pixel exclusion with positive control, and stock Stribog trim pass.
- Separate real Game constructor/default-enable and actual `reloadPhase` replay pass in an isolated browser, with no career storage changes. Native review keyboard/pause/reload isolation passes; screenshots inspected.
- Retained baseline native 634 + pilot 30 and Hartwell 250 pass; air/tracer unit 9,242 + 153,955; surface/collision/grading 5,715 / 652 / 12,049; empty 2,913 + 35; biome 667,798; typechecks/build pass.
- Desktop 1080p paused-scene draw samples: Stribog/Olympos ~0.63–0.68 ms mean, approach ~0.44–0.45 ms. Later RAF pacing ~65–72 FPS also occurs without rendering; earlier paired runs ~120 FPS. Not a full active-flight, full-career or mobile performance guarantee; no mobile testing.
- Stribog native retest uses actual Game handlers at three epochs for 30 s: ordinary 4 Hz reactive input + SAS limits maximum drift to ~0.80–2.85 m versus ~3.71–14.31 m SAS-only. Flight remains live and consumes thrust; identical retry inputs reproduce the full result. Synthetic pilot, not a human-control/per-loadout guarantee. Existing actual constructor/retry, pause/reload/storage isolation, air/tracer suites and build pass. Temp `st-stribog-gusts-cdp-20261103.mjs`, `st-stribog-gusts-native-20261103.log`, `st-surface-weather-native-20261103-stribog-gusts.json`, matching screenshots.
- November 3 wind-band evidence: `st-wind-bands-cdp-20261103.mjs`, `st-wind-bands-native-20261103.log`, `st-surface-weather-native-20261103-wind-bands.json`, matching approach/departure screenshots. Full native checks, actual constructor/retry, keyboard/pause/reload/storage isolation and build pass; screenshots inspected.
- Original Temp evidence: `st-surface-weather-cdp-20261102.mjs`, `st-surface-weather-native-20261102.json`, matching screenshots and run log. No push/deploy or live-save edits.
