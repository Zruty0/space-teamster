# Space Teamster — Agent Handoff / Design Reference

Updated: 2026-04-22

Purpose: give another coding/design agent enough context to continue work without re-deriving the project structure, mission graph, gameplay semantics, and active design constraints from scratch.

This file is a working design/reference document for agents. It is not player-facing documentation.

---

## 1. Project summary

Space Teamster is a 2D canvas game about hauling cargo through a small orbital campaign.

Core gameplay modes:
- landing / launch
- approach / departure
- orbital
- docking / undocking

The current campaign is set in the **Tycho system** and has **7 playable missions**. The long-term direction is to support a much larger authored star system with many bodies and POIs, so current architecture decisions should avoid assuming Tycho is permanent.

The game currently runs in:
- `D:/src/space-teamster`
- Vite + TypeScript + Canvas
- live deploy target: GitHub Pages

---

## 2. Current architecture

### Main files
- `src/game.ts`
  - main state machine
  - mission start flow
  - phase transitions
  - phase-complete overlay handling
  - carries persistent `worldTime`
- `src/world.ts`
  - bodies
  - parent orbits
  - surface POIs
  - station POIs
  - body-local orbital defaults
  - body atmosphere / terrain colors / transfer patch gameplay params
- `src/campaign-content.ts`
  - authored campaign phase descriptors
  - landing / approach / orbital phase definitions
  - mission start descriptors consumed by `missions.ts` / `game.ts`
- `src/missions.ts`
  - mission list and mission metadata
  - mission-wide destination name/context now lives here
- `src/levels.ts`
  - landing level builders/lookups from surface POIs and campaign descriptors
- `src/approach.ts`
  - approach and departure physics
  - atmospheric aero/heat/wind/turbulence
  - airless powered approach/departure
  - approach HUD and rendering
- `src/orbital.ts`
  - local orbit, station rendezvous, body transfer, body arrival
  - exact vacuum coast propagation
  - orbital prediction and patched-conic style transfers
  - orbital HUD and rendering
- `src/docking.ts`
  - docking/undocking gameplay
  - currently still contains hardcoded placeholder station gameplay geometry
- `src/hud.ts`
  - landing HUD
  - level select
  - shared success/transition overlays
- `src/hud-layout.ts`
  - shared right-panel and HUD label helpers
- `src/renderer.ts`
  - landing rendering, camera, landing trajectory preview
- `src/ship.ts`
  - landing craft geometry/physics helpers
- `src/input.ts`
  - input handling
  - `Backspace` restart

### Important architectural boundary
Current intended separation is:
- `world.ts` = physical world truth and POI identity
- `campaign-content.ts` = authored campaign phase graph / tuned phase descriptors
- mode files (`approach.ts`, `orbital.ts`, `docking.ts`, `levels.ts`) = generic builders/sim/rendering, ideally with less campaign hardcoding over time

This is transitional. Docking layouts/content are still more hardcoded than desired.

---

## 3. World and POIs

### Bodies
Current world has 3 bodies:
- `tycho`
  - atmospheric primary
  - blue palette
  - current gravity around surface corresponds to `3.5 m/s²`
- `castor`
  - airless moon
  - brown/tan palette
- `pollux`
  - airless moon
  - blue-grey/cyan palette

### Surface POIs
- `castor-settlement`
- `port-kessler`
- `pollux-outpost`

### Station POIs
- `calloway`
- `anchor`
- `morrow`

### Station orbit facts
From `world.ts`:
- `Calloway Station`
  - body: Castor
  - orbit radius: `300 km` from center = `100 km` altitude
  - orbit sense: `CW`
- `Anchor Station`
  - body: Tycho
  - orbit radius: `630 km` from center = `180 km` altitude
  - orbit sense: `CCW`
- `Morrow Station`
  - body: Castor
  - orbit radius: `420 km` from center = `220 km` altitude
  - orbit sense: `CW`

---

## 4. Mission list and final destinations

Mission definitions in `src/missions.ts` now carry:
- `destinationName`
- `destinationLocation`

Current missions:
1. `Mail Run`
   - destination: `Castor Settlement`
   - location: `Castor surface`
2. `Core Samples`
   - destination: `Calloway Station`
   - location: `orbiting Castor 100km CW`
3. `Festival Freight`
   - destination: `Port Kessler`
   - location: `Tycho surface`
4. `The Morning After`
   - destination: `Anchor Station`
   - location: `orbiting Tycho 180km CCW`
5. `Twin Run`
   - destination: `Pollux Outpost`
   - location: `Pollux surface`
6. `The Hard Way Up`
   - destination: `Morrow Station`
   - location: `orbiting Castor 220km CW`
7. `Long Haul`
   - destination: `Port Kessler`
   - location: `Tycho surface`

All missions currently reset `worldTime` to a predefined start time on mission start. For now every mission uses `startWorldTime: 0`.

---

## 5. Current mission flows

### Mission 1 — Mail Run
- Calloway undock
- Castor orbit
- Castor descent approach
- Castor landing

### Mission 2 — Core Samples
- Castor launch
- Castor departure approach
- Calloway rendezvous
- Calloway docking delivery

### Mission 3 — Festival Freight
- Anchor undock
- Tycho orbit
- Tycho descent approach
- Port Kessler landing

### Mission 4 — The Morning After
- Port Kessler launch
- Tycho departure approach
- Anchor rendezvous
- Anchor docking delivery

### Mission 5 — Twin Run
- Castor launch
- Castor transfer orbit / local escape
- Tycho-centric transfer to Pollux
- Pollux arrival orbit
- Pollux descent approach
- Pollux landing

### Mission 6 — The Hard Way Up
- Port Kessler launch
- Tycho departure approach
- Tycho-centric transfer to Castor
- Morrow rendezvous
- Morrow docking delivery

### Mission 7 — Long Haul
- Calloway undock
- Castor local escape targeting Tycho periapsis
- direct handoff into Tycho-local orbital play
- Tycho descent approach
- Port Kessler landing

---

## 6. Core gameplay semantics and constraints

### Restart / overlays / scoring
- restart key is `Backspace` everywhere
- phase success pauses on shared green overlay
- orbital off-objective atmosphere/approach entry uses amber transition overlay
- gameplay now scores by **cumulative mission Δv used**, not by per-phase fuel caps

### Orbital atmosphere semantics
- positive AoA means **nose above horizon**
- `A/D` in orbital atmosphere stays screen-consistent
  - `A = left / CCW`
  - `D = right / CW`

### Approach semantics
- guidance text should stay generic
- use `ARRIVE AT TARGET AREA`
- approach `ATM` means % of Earth-standard density (`1.225 kg/m³`)
- approach from left/right affects short/long semantics correctly

### Transfer / patched-conic semantics
- explicit phases, not hidden transfer scenes
- small authored gameplay patch circles, not realistic Hill spheres
- child-body local orbit can escape back to parent transfer where authored
- Pollux/Castor local escape/SOI radius currently inherited from transfer gameplay patch radius
- Tycho-centric transfer capture circles remain separate authored values

### Tycho pacing
Tycho orbital pacing is altitude-driven:
- `atmo` / low-pass
- `low`
- `high`

Current split:
- low/high threshold = `800 km`

Current Tycho high orbit target values:
- `baseTimeScale = 2400`
- low wall-clock thrust ≈ `4.8 m/s/s`
- high wall-clock thrust ≈ `90 m/s/s`

### Prediction philosophy
- vacuum orbital prediction should show full bound ellipses or long hyperbolic legs
- exact two-body vacuum propagation is now used for live coast and vacuum prediction
- atmosphere/low-pass still uses numeric integration

---

## 7. Current HUD design

### High-level layout
- left side = ship/state information
- right side = destination box
- top center = warnings / annunciations
- bottom = controls hint

### Destination box structure
The right-side panel currently has 4 conceptual groups:
1. destination title (`DESTINATION`)
2. final mission destination name
3. destination location/context line
4. `NEXT` instructions
5. phase-specific target values

### Mission-wide destination behavior
The destination box reflects the **final mission destination**, not just the immediate phase target.

Example:
- Mission 6 Tycho departure still says destination `Morrow Station`, not just `Castor`

### Phase-specific target values philosophy
Current design direction: show **current value vs target/threshold/range** whenever practical.

Examples already implemented:
- launch: current altitude vs required climb altitude
- landing: current pad offset / V/S / H/S / attitude vs landing limits
- approach departure: current altitude and current ApA vs continuation thresholds
- approach descent: current distance vs gate radius, current speed vs gate speed window
- orbital deorbit: current `PeA` vs required transition altitude
- rendezvous: current distance and relative speed vs capture limits
- docking delivery: current distance and current alignment vs tractor-beam window/alignment limit
- docking undock: current station distance vs required clear distance

### Current orbital deorbit target choice
For deorbit phases, the most useful current-vs-target number currently chosen is:
- `PeA current < transitionAltitude`

This reflects the actual threshold to enter the next mode.

### Current HUD implementation files
- landing HUD: `src/hud.ts`
- shared right panel: `src/hud-layout.ts`
- approach HUD: `src/approach.ts`
- orbital HUD: `src/orbital.ts`
- docking HUD: `src/docking.ts`

---

## 8. Landing mode design

### Current craft identity
Landing craft is a side-profile cargo truck/tug.

Important visual/physics facts:
- mirrored by `facingSign`
- collision includes cab and container
- current geometry in `src/ship.ts`
- renderer in `src/renderer.ts`

### Landing controls
Two gear modes:

#### Gear up
- `W/A/S/D` = world-space thrust
- diagonals normalized
- plain thrust = `20%`
- `Shift` = max thrust
- `Q/E` = rotate hull
- auto-rotate active until manually disabled

#### Gear down
- `W/S` = adjust constant lift
- `Space` = hover/neutral thrust
- `A/D` = lateral thrust while preserving lift
- plain lateral = `5%`
- `Shift+A/D` = max lateral
- `Q/E` = rotate hull
- subtle velocity-based auto-tilt unless disabled

### Landing SAS
- `T` toggles landing SAS
- translational damping only
- can fully/partially counter gravity on low-gravity bodies
- no rotational stabilization

### Landing trajectory preview
- up to `5s`
- stops at terrain impact
- uses current thrust/attitude/wind/drag state

---

## 9. Approach mode design

### Supports both
- descent / arrival
- departure / launch-to-orbit handoff

### Atmospheric bodies
Approach supports:
- exponential density model
- AoA-dependent drag/lift
- heat accumulation/dissipation
- wing deployment and angle
- wind layers
- turbulence zones

### Airless bodies
- same mode reused for powered descent/departure
- wings visually allowed but no aero effect

### Important approach transitions
- descent can return to orbital when climbing back above transition altitude
- departure enters orbital when altitude + ApA thresholds are met
- departure target values should reflect **continuation requirements**, not destination orbit artifice

---

## 10. Orbital mode design

### Supports multiple kinds of orbital phases
- local surface orbit / deorbit
- station rendezvous
- system transfer
- body arrival / capture

### Important transfer behaviors
- `escapeSOIRadius` used for local-body escape behavior where authored
- `systemBodies` used for parent-frame transfer targets
- current target-body flyby prediction supports:
  - `FBY`
  - impact as negative flyby altitude
  - `CW` / `CCW` capture sense
  - arrival speed readout

### Current deorbit target display
For deorbit-to-approach phases, target box currently uses `PeA` as the actionable comparison because it determines whether the craft will enter approach/atmosphere.

---

## 11. Docking mode design

### Current state
Docking gameplay is generic enough to work, but station geometry/layout is still effectively hardcoded placeholder content in `src/docking.ts`.

### Current placeholder station
- hub + 4 spokes + side bay slots
- dimensions are in meters in `src/docking.ts`
- generated SVG reference/template now exists at:
  - `art/stations/placeholder-hub-spoke.svg`

### Docking gameplay facts
- `Shift` = high thrust
- `T` = SAS toggle
- docking delivery uses tractor beam when close enough and aligned
- undock phases complete after clearing required station distance

### Current useful target values
- delivery:
  - distance to target bay vs beam range
  - alignment angle vs threshold (~`0.18 rad` ≈ `10.3°`)
- undock:
  - station distance vs exit clear distance

---

## 12. Art/layout pipeline direction

### Goal
Support custom station layouts and surface POI art authored outside code.

### Current recommendation
Use **SVG as authored source**, then import/convert it into runtime data rather than rendering arbitrary SVG directly in the game.

### Recommended SVG layers/groups
For station and surface POI assets:
- `background`
- `foreground-decor`
- `foreground-solid`
- `collision`
- `anchors`

Meaning:
- `background`
  - visual only, behind ship
- `foreground-decor`
  - visual only, in front of ship if desired
- `foreground-solid`
  - visible solid-looking structures; can later correspond to collidable objects
- `collision`
  - simplified gameplay collision shapes, not necessarily rendered
- `anchors`
  - named points/directions for bays, pad, labels, etc.

### Important art rule
Do **not** use pretty art directly as collision geometry.
Use separate simplified shapes in `collision`.

### Current station SVG template
Generated template:
- `art/stations/placeholder-hub-spoke.svg`

Properties:
- Inkscape-friendly
- hidden `collision` and `anchors`
- station-center local origin
- bay anchor markers included

### Planned use in game
Likely staged approach:
1. art-only rendering from imported SVG-derived data
2. use `anchors` for docking bay positions/orientations
3. use `collision` layer for gameplay collision

### Surface POI art direction
Same structure as stations, but side-view / local pad-centered coordinates.
Destination is to author site skyline/structures separately from terrain generation.

---

## 13. Animation in authored art
Recommended approach:
- use SVG as source to **tag** animated elements
- do not rely on native SVG runtime animation
- importer should interpret metadata/layer/group ids and drive animation in game code

Examples:
- blinking lights
- pulsing lights
- rotating beacon visuals

Moving collision solids are a later/harder step. Decorative animation is the intended first use.

---

## 14. Current known open work

### High priority design/implementation areas
1. **Custom station layouts**
   - move docking geometry/layout out of hardcoded `docking.ts`
   - begin importing or manually defining layout assets
2. **Surface POI authored art**
   - support skyline/foreground/background site art in landing and approach
3. **Remaining runtime-content refactor**
   - reduce static phase catalogs and level-id-centric routing further
4. **Mission playtest / tuning**
   - verify Mission 5 end-to-end after all transfer/prediction/HUD changes
   - verify Mission 6 low/high transition feel after exact coast / predictor changes
5. **HUD polish**
   - continue refining current-vs-target values and top annunciation priority

### Architectural caution
Do not assume the Tycho system is the permanent content structure. User intends a much larger future star system with many bodies and POIs. Prefer body/POI/hierarchy-driven systems over Tycho-specific phase assumptions.

---

## 15. Existing generated / authored station art reference

Current generated template for experimentation in Inkscape:
- `art/stations/placeholder-hub-spoke.svg`

Use this as a reference for:
- layer names
- local origin convention
- anchor naming ideas
- collision-vs-art separation

---

## 16. Build / deploy / repo notes

### Build
- `npm -C D:/src/space-teamster run build`

### Dev server historically used
- `http://localhost:4173/`

### GitHub Pages
- deployed from `gh-pages`
- live URL historically:
  - `https://zruty0.github.io/space-teamster/`

### Push policy
- commit normally
- do **not** push unless explicitly asked

### Known untracked local files often present
- `.vite-dev.log`
- `.vite-dev.err.log`

---

## 17. Suggested next steps for another agent

If picking up station/POI art work, a good order is:
1. add asset reference fields (`layoutId`, `sceneId`) to world POIs
2. define runtime asset types for station/surface scenes
3. implement art-only loading/rendering path first
4. migrate docking bay anchors to authored asset anchors
5. migrate collision to authored collision shapes
6. add surface POI scene rendering in landing and approach

If picking up HUD work, a good order is:
1. audit current phase rows for clarity/current-vs-target consistency
2. reduce top-center duplicate guidance where destination box already explains it
3. verify all mission phases show useful destination context and actionable thresholds

---

## 18. One-line mental model

Space Teamster is moving toward a reusable body/POI-driven campaign framework with generic gameplay modes, mission-authored destination context, patched-conic orbital transfers, and eventually authored SVG-based station/site scene assets.
