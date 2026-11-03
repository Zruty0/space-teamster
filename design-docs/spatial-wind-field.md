# Spatial wind field and approach buffeting

Updated: 2026-11-03 (Pacific)
Status: LIVE. Pete requests strong, direction-varying approach winds; lower-speed but varied landing currents, including up-/downdrafts. Challenging sites should have sharper, more violent changes. This supersedes the earlier predominantly temporal Stribog tuning and the proposed timed-buffet implementation (never shipped).

## Field

- `surface-wind-field.ts` supplies a continuous 2D velocity field, in m/s, seeded by `surface-vector-field-v1:${canonicalPoiId}`. The region's geometry is stable; mission time slowly evolves its phase and background flow. Traveling between positions—not a global rapid sine gust—is the main source of rapid changes. No wall clock, retry counter, camera or draw RNG.
- The existing climate `base`, `gust` and `windLimit` are authored controls, not forecasts. `gust` now controls spatial variation; obsolete temporal `gustRate` is removed. Background `wind()` / `advection()` remain the analytic slow synoptic reference, not the complete local air sample.
- Lower circulation combines several spatial modes. Wavelength shrinks from roughly 380 m at calm sites to 120 m at Stribog. Horizontal and vertical components vary with both coordinates; vertical flow fades into solid ground over 30 m. Floating decks are not mountains: no fictitious ground column or sea-level density reset.
- At ≤150 m above the resolved receiving-site datum, use the lower field and original low-altitude force ceiling. Smoothly blend to upper air by 1,350 m. Upper air has alternating-direction shear layers, up-/downdraft columns and sparse compact vortices. Upper force ceiling is `3 * lowerLimit + 2` m/s². No hard phase switch: matching physical states sample identical vectors and force budgets.
- Approach coordinates are translated into the landing site's permanent frame using gate/pad origins. `terrain.pad.y` provides the resolved height reference, including grading/platforms. Existing compressed approach→landing handoff mapping itself is unchanged, so this is not a fully seamless phase-physics rewrite.
- Density still follows absolute planetary altitude and fades to zero at the atmospheric edge. Airless and below-ground samples have no flow; actual floating structure geometry remains a rendering/collision concern, not an invented shelter column.

## Forces / turbulence

- `AirSample.vy` is optional for legacy compatibility (default zero). `landingAerodynamics` now computes both relative components. Updrafts/downdrafts produce real vertical aerodynamic force, not camera shake or a separate artificial lift impulse.
- The shared force model still retains ground-relative base drag plus a bounded relative-air increment. It is a gameplay-limited hybrid, not an unbounded fluid/air-relative simulation. Existing approach lift/heat/base aero remain; no old acceleration layers are stacked back in.
- Regional approach/departure buffeting derives from the sparse vortex pockets, density and relative airspeed. Torque follows clockwise ship-angle convention, is bounded, and stays within stock pitch authority. Landing's newly tuned controls are not given this rotational disturbance; its varied translational currents remain real.
- HUD and maintenance/manifest turbulence exposure use the actual local applied torque (>0.08 rad/s²), with the rig's x/y/velocity. Merely changing wind no longer triggers `TURBULENCE`. The warning is steady while active rather than blinking by wall-clock time. Staying inside a pocket can prolong exposure; there is no unrelated timed event scheduler.
- Regional coasting prediction integrates the same angular forcing/damping and resulting aero changes. Fine-step multi-step agreement is tested; existing coarse-step, deployable and no-input prediction assumptions still apply.
- SAS remains finite paid zero-ground-velocity assistance, not position lock, added authority or gravity cancellation. Normal lateral plus throttle corrections control tested stock lower-field conditions; no universal promise for damaged/heavy rigs or severe upper air.

## Presentation / budget

- Approach guides sample local vectors, with angled arrows and horizontal/vertical m/s labels. HUD shows both components. Terrain/atmosphere clips, bounded grid LOD and telemetry clearance remain.
- The same local vectors advect the fixed 128 tracer / 256 smoke pools in both axes. Vertical-only flow is visible. Draw/quality do not change emission or physics.
- Bulk cloud sheets use an analytic large-scale shear advection approximation, including opposite directions by layer—not per-particle integration of each small vortex. No new textures, caches, buildings, geography, stacks or save fields.

## Validation / review

- `/tests/surface-weather.html`: all 36 atmospheric profiles, actual equipped Game landing/approach/departure, mission epochs and retry replay; no live-save edits.
- Unit spatial sweep: Stribog sample lower speed peak ~46.6 m/s / near-hover increment ~3.02 m/s²; upper speed ~129.2 m/s / increment ~13.0 m/s². Meaningful horizontal reversals and both draft signs at fixed time, continuous field/blend and exact frame/epoch equivalence.
- Sampled Stribog upper-field warning coverage ~5.7%; peak torque ~1.78 rad/s² versus stock 3.0 pitch authority. Uncorrected pocket entry produces ~32° attitude deflection in the test, with live/predicted motion and retries agreeing. This is a physical disturbance, not a notification-only effect.
- Native 566 checks: actual lower-field normal-input lateral/throttle pilot (no Shift) stays within ~2.7–3.2 m over 30 s versus ~15–25 m without manual correction, actual buffet/HUD and actual approach retry, all-site phase rendering, clipping, constructor/default weather, keyboard/pause/reload/storage isolation. Synthetic pilot, not human or full-career proof.
- Surface-weather, landing-air and vector tracer/smoke suites and build pass. Desktop sampled paused draws ~0.67–0.85 ms at 1080p; idle/render RAF both ~85 FPS in that run. No mobile testing or full-career performance guarantee.
- Temp evidence: `st-vector-wind-cdp-20261103.mjs`, `st-vector-wind-native-20261103.log`, `st-surface-weather-native-20261103-vector-wind.json`, matching screenshots. No push/deploy.
