# Mass Gameplay Plan

Purpose: make cargo mass affect how the ship feels without turning the game into a strict vehicle simulator. Delta-v capacity remains effectively unlimited; mass affects responsiveness, burn time, handling, and economy.

## Goals

- Heavy cargo should feel heavier: slower acceleration, slower rotation, more planning needed.
- Light cargo should feel noticeably nimble.
- Effects should be gentle and clamped so all generated jobs remain flyable.
- Economy remains based on actual delta-v times loaded mass.
- Touchdown/docking success rules should stay readable and mostly unchanged.

## Current State

Cargo mass currently affects only mission accounting:

```text
loadedMass = ship dry mass + container tare + cargo mass
parFuelCost = parDv * loadedMass * fuelPrice
actualFuelCost = actualDv * loadedMass * fuelPrice
pay = parFuelCost * generosity
```

It does not currently affect:

- orbital thrust
- approach thrust
- landing thrust
- RCS / rotation
- aerodynamics
- docking container mass
- fuel capacity

## Mass Model

Use loaded mass as the single gameplay input:

```text
loadedMass = dryMass + containerTare + cargoMass
referenceMass = dryMass + containerTare + standardCargoMass
```

Suggested first reference:

```text
dryMass = 120t
containerTare = 8t
standardCargoMass = 25t
referenceMass = 153t
```

Use clamped scale factors:

```text
thrustScale = clamp(0.75, 1.15, referenceMass / loadedMass)
rotationScale = clamp(0.80, 1.10, sqrt(referenceMass / loadedMass))
aeroScale = clamp(0.85, 1.10, sqrt(referenceMass / loadedMass))
```

Do not expose exact formulas in UI at first. Show simple labels:

```text
LOAD LIGHT
LOAD STANDARD
LOAD HEAVY
LOAD DENSE
```

## Implementation Order

### 1. Thread Cargo Mass Into Playable Missions

Add a generated mission mass payload that can be passed into each created phase.

Likely files:

- `src/mission-cost.ts`
- `src/estella-mission.ts`
- `src/estella-playable.ts`
- `src/game.ts`

Add a small type, probably near mission-cost or playable mission creation:

```ts
interface MissionMassProfile {
  cargoMassTons: number;
  loadedMassTons: number;
  thrustScale: number;
  rotationScale: number;
  aeroScale: number;
}
```

Source of truth should be the mission quote, so the same mass drives pay and handling.

### 2. Docking / Container Handling

Highest-value first gameplay effect.

Current docking already has mass/inertia machinery. Wire generated cargo into docking levels:

```text
containerMass = containerTare + cargoMass
```

Expected feel:

- light cargo: easier to stop and align
- dense cargo: more drift, more overshoot, stronger need for SAS and early braking

Keep docking success thresholds unchanged.

Potential files:

- `src/docking.ts`
- `src/estella-playable.ts`

### 3. Orbital Thrust Scaling

Apply `thrustScale` to orbital phases:

```text
thrustAccel *= thrustScale
thrustAccelMax *= thrustScale
thrustWallDvPerSec *= thrustScale, where present
thrustWallDvPerSecMax *= thrustScale, where present
```

Expected feel:

- heavy cargo makes burns take longer
- transfer execution demands more planning
- same delta-v is still available, just slower to apply

Keep fuel/delta-v budget unchanged for now.

Potential files:

- `src/orbital.ts`
- `src/estella-playable.ts`

### 4. Rotation / RCS Scaling

Apply `rotationScale` to attitude controls:

```text
rcsAngularAccel *= rotationScale
```

Also consider cluster/docking angular response.

Expected feel:

- heavy cargo is lumbering
- light cargo is twitchier
- player can still recover, just less instantly

Potential files:

- `src/orbital.ts`
- `src/approach.ts`
- `src/cluster.ts`
- `src/docking.ts`

### 5. Landing Feel

Apply mass to final landing controls, but do not change touchdown tolerances.

Use:

```text
landing main thrust *= thrustScale
landing attitude authority *= rotationScale
```

Do not initially change:

- max safe vertical speed
- max safe horizontal speed
- max landing angle
- pad scoring
- collision model

Expected feel:

- heavy cargo requires earlier braking
- heavy cargo is harder to arrest near the pad
- landing standard remains understandable

Potential files:

- `src/game.ts`
- `src/ship.ts`
- `src/config.ts`
- `src/renderer.ts` for optional visual feedback

### 6. Approach / Atmospheric Handling

Start conservative.

First pass:

```text
approach thrust *= thrustScale
approach rotation/control response *= rotationScale
```

Only later consider aero scaling:

```text
lift *= aeroScale
broadside drag *= aeroScale
```

Aerodynamic scaling is more tuning-sensitive; avoid until thrust/rotation feel is validated.

Potential files:

- `src/approach.ts`
- `src/estella-playable.ts`

### 7. Cluster Flight

Apply mass mostly to thrust and rotation:

```text
cluster thrustAccel *= thrustScale
cluster thrustAccelMax *= thrustScale
cluster angularAccel *= rotationScale
```

Keep collision/capture thresholds unchanged.

Potential files:

- `src/cluster.ts`
- `src/estella-playable.ts`

## UI/HUD

Add simple load feedback in each phase HUD:

```text
LOAD 153t STANDARD
```

or shorter:

```text
LOAD HEAVY
```

Do not show all scale factors unless debugging.

Mission/contract board should show:

```text
Cargo: Dense machine parts, 48t
Loaded mass: 176t
```

## Balancing Notes

Initial cargo classes are already bounded. Keep effects mild:

- heavy cargo should be a handling challenge, not a mission failure trap
- dense cargo should pay more because actual fuel cost and par fuel cost scale with mass
- retries remain free in career mode, so mass can add skill challenge without bankrupting players on failed attempts

Recommended clamps for first implementation:

```text
thrustScale:   0.75 to 1.15
rotationScale: 0.80 to 1.10
aeroScale:     0.85 to 1.10
```

If heavy cargo still feels too easy, reduce lower thrust clamp to 0.70. If it feels punishing, raise it to 0.85.

## Non-Goals For First Pass

Do not implement yet:

- finite fuel capacity by mass
- structural failure based on cargo mass
- changing touchdown tolerance by mass
- detailed center-of-mass shifts
- per-cargo fragile/hazard handling
- cargo insurance or penalties

Those can come after the basic career loop exists and mass feel is validated.

## Suggested Milestone

Implement after barebones career mode exists:

1. Career contract produces quote and cargo mass.
2. Accepted contract passes quote/mass into generated mission.
3. Docking and thrust scaling respond to mass.
4. Landing thrust scaling responds to mass.
5. Playtest cargo classes for feel.
