# Production atmosphere artwork

Updated: 2026-10-24
Status: approved by Pete ("okay, I agree, let's go") and integrated. Eight non-giant worlds only. Balor's separate crater/Eye revision is documented in [balor-eye.md](balor-eye.md).

## Scope

Acheron, Gaia, Dahai, Hartwell, Kuznia, Almaden, Marisma and Mercy now receive the approved procedural weather in actual central orbital discs and parent/system markers. Giants remain on their existing static artwork; airless worlds receive no weather. No surface scenes, hazards, physics, collision geometry, access or contract changes.

Permanent terrain is unchanged. Acheron uses the approved opaque cloud underdeck instead of painting animated weather over old static cloud stamps. Original painters remain the no-WebGL/context-loss fallback. Existing physical atmosphere bands/boundaries are retained. Labels draw after weather; Gaia/Mercy now join the existing dark glyph-halo treatment without changing text, status colors, fonts or anchors.

## Dahai revision and review compatibility

- Cloud **amount parameter** reduced25%: range.58–.86 becomes.435–.645. Optical depth, silvery colors, seeds, winds and all other parameters stay identical. This is not a claim of exactly25% less projected cloud area; density/opacity mapping is nonlinear.
- Current range version is `atmosphere-gallery-v2`. Original v1 seed namespaces remain, so the other seven worlds' samples are byte-for-byte unchanged for a given batch seed.
- Historical `version=atmosphere-gallery-v1` review URLs remain supported with the original Dahai amount. The page labels that historical state. New batches use v2; exports retain the actual version.
- No specific gallery seed/sample choices were supplied; production deterministically chooses one of the ten range-sampled candidates per body from the time-based installation seed.

## Seed and clock

`src/atmosphere-art-state.ts`:
- New isolated cosmetic key `space-teamster.atmosphere-art.v1`, JSON `{version:1,seed}`. First game start chooses `Date.now()` and stores it; later reloads reuse it. No career/mission/maintenance save schema migration or edits. Invalid/denied storage falls back to a stable in-memory session seed.
- Each body's candidate index derives from that seed plus its immutable body ID. Renames, visits, frames and time warp never reroll profiles.
- One art second per60 simulation seconds (`weatherArtSeconds(worldTime)`). Normal orbital acceleration therefore shows motion, while the six-minute pilot loop corresponds to six simulated hours. This is a visual mapping, not a physical weather/rotation model.
- `renderOrbital()` supplies `OrbitalState.time`, the absolute simulation epoch—not frame wall time or time since entering a scene. Pauses, waits, transfers and retries use the same phase evaluation. No integrated/random weather history.

## Rendering and resource budget

`src/world-weather.ts` supplies `OrbitalWeatherPainter` (`beginFrame`, `draw`, `endFrame`). `Game.start()` creates it and schedules idle shader warmup. `Game.renderGameplayPhase()` passes it to the actual orbital renderer. Test/reference callers can omit the optional painter and retain base-only rendering.

- One512px WebGL2 generator, eight seeded64³ R8 noise volumes at most (2MiB raw noise data).
- At most eight current transparent cloud/shadow/haze image chains:576px canvas with a256px planet radius and padding for the halo, filtered down to4px. No stored animation sequence. Same cached image at every scale during a frame.
- Only on-screen eligible bodies request work. After all planet/marker/label painting, refresh at most ONE requested world per display frame, oldest first. Each body refreshes no faster than100ms; all-eight system views can run below10Hz under that shared budget. Cached images can lag the current epoch until serviced, but generation always evaluates the requested absolute phase directly.
- Missing images briefly use the original painter while being prepared. Seed/phase generation is never called from flight physics. Duplicate `endFrame()` calls cannot exceed the budget.
- Context loss/unavailable WebGL uses original static globes and logs one warning; gameplay continues. Cleanup releases shader/noise/image resources. Page lifecycle recreates the renderer with the same seed after a persisted-page return.
- Optional frame inspection callback is used only by native tests; Game does not read pixels back. Prior standalone RTX5080 timings are reference, not a new full-game/mobile benchmark.

## Validation

`npm run test:atmosphere`:127 profile/resource-bound assertions,356 timer assertions,2092 gallery/range/version assertions,43 runtime seed/clock assertions. All seven non-Dahai worlds and every other Dahai parameter match v1 exactly.

`/tests/world-weather-preview.html` uses actual production painters and real generated orbital levels, with in-memory synthetic fixtures (no career load/save).49 native checks cover all eight central scenes, star and giant-parent marker scenes, shared cache limits, fair scheduling/no starvation, pause/cadence/duplicate-end budgets, deterministic full weather-layer replay after clock reversal/reload, actual Game render-hook time selection, unchanged in-memory career/flight state and giant exclusion.

Desktop Edge/D3D11 driver `Temp/st-weather-rollout-cdp-20261024.mjs` additionally checks actual `Game.start()` seed persistence across reload without career-byte changes, page lifecycle, and original-art fallback on lost/missing WebGL in an isolated browser profile. Atlas/Dahai/Gaia/Balor/parent/system/fallback screenshots retained. Compare exact transparent weather-layer pixels independently of the atlas: repeated complex terrain-edge rasterization can vary under Skia's path cache; do not relax the weather-layer replay assertion.

Balor:2538 Eye/unit assertions plus28 real-canvas checks, including unchanged30° arc, deeper core/tendrils, stable crater map, actual orientation/flight invariants. Label72/world-disc suites and build pass. Existing Vite warnings only. v2 gallery196 native checks plus controls/URL replay pass; the seven unchanged worlds retain prior native hashes.

No mobile testing, manual live-save modification, baked sequence or push/deployment. Review URLs remain available alongside the game.
