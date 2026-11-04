# Spatial wind field and approach buffeting

Updated: 2026-11-04 (Pacific)
Status: LIVE. November 3 feedback retains horizontal-only smooth approach winds, harsher Stribog landing and speed-proportional tracers. November 4: Pete finds approach turbulence too mild and not slowing time; physical buffets are strengthened and active turbulence now cancels accelerated warp.

## Regional model

- `surface-wind-field.ts` evaluates permanent site-relative spatial patterns, seeded by `surface-vector-field-v1:${canonicalPoiId}`. Mission time slowly evolves phase/background flow; moving through the field produces the faster changes. No wall clock, retry counter, camera or draw RNG.
- Climate `base`, `gust` and `windLimit` are authored controls, not forecasts. `gust` controls spatial variation; the old temporal `gustRate` is removed. Background `wind()` / `advection()` are slow synoptic references, not the full local sample.
- Fine lower circulation has 120–380 m characteristic wavelengths. Above 150 m from resolved receiving-site height, smoothly blend into upper shear, fully established at 1,350 m. Upper increment ceiling is `3 * lowerLimit + 2` m/s².
- Canonical coordinates still align gate/pad origins; `terrain.pad.y` is authoritative, including grading/platforms. **The two flight modes now deliberately use different projections**, not identical matched-state weather. Existing compressed phase handoff is unchanged; this is not a seamless phase-physics rewrite.
- Absolute planetary altitude controls density and the atmospheric-edge fade. Solid ground attenuates lower flow; vertical landing flow fades over 30 m AGL. Floating decks do not invent mountain shelter or reset density to sea level. Airless/below-ground samples have no flow; actual building/deck geometry remains separately authoritative for collision/paint masking.

## Approach / departure

- Production `Game.loadApproach` supplies `air(..., {approach:true})` for descent and departure. Wind `vy` is exactly zero at every altitude; no up-/downdraft velocity component. Gravity, lift, vertical drag and attitude-driven aerodynamics remain physical, not cancelled.
- Horizontal modes and shear have 3× wider spatial scales; jet-edge sharpness is halved (2.5→1.25). Opposing altitude layers and strong winds remain, with softer changes along the route. Bulk cloud drift uses the same widened shear profile.
- Sparse shear/buffet pockets retain their 2× spatial scale, but torque gain increases from 0.5 to 1.2 (2.4× the November 3 value). Maximum Stribog torque is 2.16 rad/s² before density/speed attenuation, below stock 3 rad/s² pitch authority. Horizontal velocities/shear, landing winds and smoke remain unchanged. Density/relative-speed coupling remains. These are actual angular forces, not screen shake; HUD and maintenance/manifest exposure use local torque >0.08 rad/s² with the actual rig coordinates. Ordinary changing wind does not trigger `TURBULENCE`; no timed-event scheduler.
- Active turbulence (>0.08 rad/s², the same physical predicate as the warning) drops 2×/5× warp to 1× in descent and departure. Warp-up is rejected while buffeting; leaving the pocket does not automatically accelerate again. This is normal speed, not sub-1× slow motion. Manual control still cancels warp; ordinary wind without buffeting does not.
- `Game.handleApproach` banks wall seconds and spends `PHYSICS_DT / currentWarp` for each fixed 120 Hz simulation step. Mid-frame pocket entry changes the remaining budget immediately, avoiding accelerated-time debt. Mission clocks still advance by simulation seconds; control/maintenance exposure uses the actual step's wall duration. Other modes' clocks are unchanged; phase loaders reset the accumulator.
- Coasting prediction integrates translation, temperature and angular dynamics together with ≤0.1 s default internal steps (bounded subdivisions), retaining the existing 0.4 s output point budget. No cosmetic path averaging, history-dependent filtering or weakened physics in prediction. Fine-step agreement and coarse/fine consistency are tested. Existing no-input/deployable prediction limitations remain.
- Approach HUD/bands show horizontal m/s readings and arrows, without redundant vertical-zero labels. Guides remain read-only, altitude-anchored and terrain/atmosphere clipped.

## Landing / controls

- Landing retains 2D currents and its prior fine spatial pattern. Stribog alone uses `landingWindScale:1.4` and `landingWindLimit:4.2`: 40% faster horizontal and vertical currents, with stronger aerodynamic response. These landing-only overrides do not strengthen approach or other sites.
- Shared forces remain a ground-relative base drag plus bounded relative-air increment: a gameplay-limited hybrid, not a full fluid/air-relative rewrite. No legacy approach acceleration layers are stacked back in.
- SAS stays finite paid zero-ground-velocity assistance, not position lock, free authority or gravity cancellation. No thruster changes. Strong Stribog patches can now slightly exceed stock ordinary lateral + SAS (3.675 m/s²); the earlier stationary-hover promise is superseded. Human/loadout feedback still needed.

## Direction particles / budget

- Fixed tracer pool grows 128→512, separate from smoke, now 1,536 fixed slots under [smoke-density.md](smoke-density.md). Smoke amount/lifetime scale with local density; direction-tracer counts still scale with wind. Local activation quota is linear in actual vector speed, `ceil(512 * clamp(speed / 40, 0, 1))`; zero in calm/vacuum, saturated at 40 m/s. Uniform-flow tests verify proportional actual counts. Local advection, clipping and lifecycle can reduce active/visible counts below the quota.
- Dormant candidates retain deterministic positions/lifetimes instead of rerolling every tick to seek strong cells. Lifetimes shorten to 2–5 s so small eddies do not drain the visible population into stagnant pockets. Fade in/out, stronger tails up to 10 px and brighter heads convey direction; no terrain decoration.
- Actual local vx/vy advects tracer and smoke motion; vertical landing flow remains visible. Draw/pause/quality cannot advance particles or change physics. Low quality thins paint only. Cloud sheets approximate large-scale shear rather than integrating every small eddy. No new textures/caches, geometry, stacks, saves or contracts.

## Validation / review

- `/tests/surface-weather.html`: save-free actual equipped Game across 36 atmospheric profiles / eight worlds and airless controls.
- Unit: 19,494 field/buffet/prediction checks, 4,393 regional weather, 14 bands; landing air 9,242 and tracer/smoke 92,863. Build passes.
- Stribog scan: lower peak speed ~65.3 m/s and increment ~3.89 m/s² (formerly 46.6 / 3.02); upper horizontal speed ~108.9 m/s and increment ~12.97. Other landing profiles remain unchanged.
- Sampled horizontal spatial variation is ~27% of the original approach field. Buffet warning area ~3.0%, peak torque ~2.12 rad/s²; the tested uncontrolled four-second encounter deflects attitude ~80° versus ~33° before. A 5 Hz synthetic pilot using ordinary full/neutral pitch limits that to ~6.6°. Not a human/loadout guarantee.
- Rolling eight-second preview changes by at most ~3.22 m per 60 Hz frame in the tested encounter (includes the moving horizon); default prediction endpoint is ~2.57 m from the 120 Hz reference after eight seconds. Fine-step live/predicted and deterministic retries pass. Not a guarantee for all long chaotic trajectories.
- Native 1,460 checks: actual horizontal-only approach/departure at all sites, warnings/buffeting, real constructor/reload, pause/keyboard/storage isolation and render clipping. Strong-cell normal lateral/throttle + SAS reduces 30 s drift to ~11–22 m versus ~27–42 m untrimmed; no longer promises stationary hold. After 30 s, 146–155 tracers remain active in these spatial fields, exceeding the entire former pool; actual retry reproduces them.
- November 4 native warp checks: actual regional approach/departure at both 2× and 5×; actual spatial pocket entry cancels warp within one 50 ms frame. Timed positive/negative controls verify mid-frame budgeting, frame-subdivision equivalence, exact replay, refusal during buffeting, no auto-resume, pilot restoration in clear air and preserved manual warp-down/cancellation. Actual constructor/reload and smoke-density controls retained.
- Desktop paused approach draw ~1.07 ms mean / 1.3 ms p95; idle/render RAF both ~85 FPS. No mobile/full-career performance guarantee. Screenshots inspected. Temp `st-turbulence-warp-cdp-20261104.mjs`, matching log and `st-surface-weather-*-20261104-turbulence-warp` report/screenshots. Previous November 3 evidence retained. No push/deploy or live-save edits. The separately reported low-altitude projection/dash flicker is still unresolved; this change does not claim to fix it.
