# Orbital atmospheric haze

Updated: 2026-11-02 (Pacific)
Status: LIVE. Pete requests an orbital atmospheric haze gradient whose strength follows atmospheric density; this supersedes the earlier orbital no-haze restriction.

- `src/orbital-haze.ts` paints beneath actual orbital globes and resolved system-body markers. All eleven atmospheric worlds (eight terrestrial/moon worlds plus three giants) are covered; airless bodies receive no haze.
- Uses existing atmosphere tint, height, surface density and scale height. Local density is `rho0 * exp(-altitude / scaleHeight)`; optical alpha is `0.65 * (1 - exp(-0.65 * density)) * (1 - altitude / height)^2`, zero outside the atmosphere. Dense worlds show stronger/broader haze; thin atmospheres stay faint. This is a bounded visual mapping, not a new physics/scattering simulation.
- Extent follows the physical atmosphere-to-radius ratio, including symbolic system markers; no invented outer radius. Solid worlds use an exterior annulus, preserving interior map/rim colors. Giants underlap their existing 6% soft limb to avoid a detached bright ring; their geography remains unchanged.
- Original dashed atmosphere boundary, surface/POI labels, trajectories and rig draw afterward. No weather timing, collision, physics, camera, seed, save or access changes.
- One Canvas2D radial gradient with 25 stops (26 for giant underlap). No raster allocation or persistent haze cache. Skip tiny/unresolved markers (<6 px radius or <0.5 px shell), offscreen rings and viewports entirely beneath the opaque globe. Close-orbit views with offscreen planet centers are supported.
- Save-free atlas plus actual orbital renderer: `/tests/orbital-haze.html`.
- Unit: 7,388 assertions; native: 82 across eleven atmospheric worlds plus airless control, density/altitude pixel ordering, zero interior/exterior spill, offscreen/close-limb cases, actual central/system rendering and actual Game hook/state isolation. Screenshots inspected.
- Planet outlines 1,493; orbital markers 41; world-disc/family regressions pass. Existing native orbital weather 52, Balor 44, actual startup/reload/career isolation and lost/unavailable-WebGL fallback pass. Production/test typechecks and build pass.
- Temp evidence: `st-orbital-haze-cdp-20261102.mjs`, `st-orbital-haze-native-20261102.json`, `st-orbital-haze-{gaia,acheron,hartwell,hydra}-20261102.png`. No push/deploy, live-save edits or mobile testing.
