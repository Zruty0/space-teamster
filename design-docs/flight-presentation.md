# Shared flight presentation

Updated: 2026-10-29 (Pacific)
Status: LIVE. Pete approves the blue-dome revision, allows slight atmospheric tint, requests removing bottom stripes in favor of planet background color, then authorizes the same treatment across orbital/approach/landing views without copying outposts. Also requests reverting black target-rectangle highlighting.

## Current rules

- `planetBackgroundColor` in `flight-surface-style.ts` supplies orbital globe backgrounds and solid approach/landing ground. Default is the 5.5% catalog-color tint. Pete's background-only follow-up makes Gaia land richer green (`#041b09`) and Dahai ocean richer blue (`#021020`); their matching surface fills use those colors. Catalog colors, outlines/rims, ice, Gaia water, atmosphere and HUD are untouched. Existing globe geography, material exceptions, colored wisps and soft colored giants remain approved and unchanged.
- All ordinary landing views use a very dark atmospheric tint (near-black space for airless worlds), plain planet-colored terrain and a dominant catalog-colored physical contour. Existing pads/platforms, stars, rig and guidance remain; no new buildings or collision.
- All default approach/departure views use a slight altitude-dependent atmospheric tint, the same plain ground and original physical height function. Wind information keeps its direction/strength/extent but uses faint boundaries rather than filled washes; indicators clip to actual airspace rather than drawing through solid ground.
- Hartwell retains its five permanent seeded distant ridge backdrops and bounded incremental cache. Underground strata and angular rock lines are removed for now. No new region seeds, biomes or physical geography on other worlds.
- Dawes remains the **only** new outpost. Its blue dome, left-side warehouse layout, 300 m footprint and pad center remain. Latest pad width is 35 m (1.6× narrower), with 11.775 m solid beacon towers; the rest of the SVG keeps its size/position. Latest approval raises the datum to mean native edge height (63.06013 m) and adds smooth 75 m shoulders; see surface-site-grading.md. Rendering, collision, entry/takeoff and retries share the resolved pad. Below-deck foundation cutaways are hidden behind the plain ground, including during decode fallback; above-ground solids and the thin landing-pad slab stay visible. The pad/tower revision is the only later SVG geometry change.
- Approach target rectangle is again one 2 px status-colored dashed stroke. No black backing, pale halo or black speed-label plate. Bounds, labels, speed colors and thresholds are unchanged. Controls-footer backing remains.
- Reentry temperature gauge lives at x=20 beneath the left telemetry rows, rather than x=190 in the flight area. It follows optional par/departure rows and shortens when needed to leave room for the footer. Same temperature colors/value, wing threshold and warnings; no camera or physics change.
- Explicit historical filled painters/galleries remain comparisons, not default game fallbacks. No new filled orbital atmospheric wash is added; existing colored weather wisps/dashed physical boundary remain.

## Atmospheric effects pilot (not career rollout)

Approved implementation is available at `/tests/dawes-landing.html?atmosphere=1`: approach clouds, wind-advected exhaust, landing wind/wisps and zero-ground-velocity SAS. Visual quality does not change physics. Normal careers remain unchanged pending review; see flight-atmosphere-pilot.md for scope, thrust limits, evidence and the still-unmodified approach wind physics.

## Validation

- `tests/flight-presentation-native.ts`, invoked by Dawes practice checks: actual rendering at all 102 surface sites and actual generated approach/departure levels for all 30 surface worlds. Checks plain planet-color pixels, deliberately buried wind overlays, immutable levels/catalog and exactly one outpost. No career constructor, save IO or settlement.
- Dawes/native aggregate: 634 checks; actual collisions, swept motion, touchdown/takeoff, opacity/blue dome/beacons, plain bottom rows and isolation. Keyboard/pause/reload and screenshots pass.
- Hartwell native: 250 checks (24 pixel-equality cases with the rig at the old gauge position across heat, rotation and wing configurations, plus the relocated hot-gauge check), including both target speed colors without black/pale highlighting, cache bounds/seams/replay/cancellation and shared-style fallback. Historical filled gallery: 85 checks, same five landscape hashes.
- Orbital weather: 52 native; Balor 44; actual startup/persistence/lifecycle/static fallback passes. Planet unit suite: 1,493 checks (plus 538 native gallery checks for the richer backgrounds) including all-body cross-phase tint agreement. Surface: 5,715 + collision 652 + grading 12,049; approach biome: 667,798; world-family and empty-rig regressions pass. Production build passes.
- Controlled desktop 1080p landing draw remains below ~0.85 ms mean; latest ~85 FPS RAF matches the idle no-render baseline. Older runs reached 120 Hz; neither is a full-career/mobile guarantee. No push/deploy/mobile/live-save changes. Concurrent maintenance work is separate.
