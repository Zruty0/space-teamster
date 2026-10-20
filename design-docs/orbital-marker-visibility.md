# Orbital marker visibility

Updated: 2026-10-20

Surface sites are local-navigation detail, not orbital-overview decoration.

- Station rendezvous: no surface-site dots, leader lines or labels.
- Transit to another body or escape to another orbital phase: no surface-site markers, including incidental fallback reentry sites.
- Surface landing: only the selected landing site, matched to landingSiteAngle; wrapped longitudes supported. Coincident markers do not produce duplicate labels.
- Legacy levels without a surface-marker array retain the single LZ marker only during a surface objective.
- Orbital station markers and navigation menus remain unchanged. Surface destinations remain selectable. No zoom threshold or Svarog-specific exception.
- Drawing policy only: no changes to reentry, trajectory prediction, collision, flight objectives or saved missions.

Implementation: `orbitalHasSurfaceObjective()` and `visibleOrbitalSurfaceMarkers()` in `src/orbital.ts`, shared with the legacy LZ fallback.

`npm run test:orbital-markers` checks the selectors and production renderer with a recording desktop canvas, plus generated Kuznia→Svarog and Kuznia landing phases. Tests verify marker leader lines are suppressed as well as labels, and orbital markers/navigation remain available. No browser or mobile emulation.
