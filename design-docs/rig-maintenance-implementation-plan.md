# Rig Maintenance Implementation Plan

Implementation plan for the approved component catalog, telemetry weights, persistent condition, faults, servicing, repair, replacement, operational restrictions, and developer inspection views.

Source design:

- `non-flight-interaction-plan.md`
- `rig-maintenance-components.md`
- `rig-maintenance-telemetry.md`

The simulated player maintenance policies are test scenarios, not automatic career behavior. Production servicing and repairs remain explicit player transactions when shop UI is implemented.

## 1. Runtime modules

Create `src/maintenance/` with narrow modules:

- `types.ts` — system/component/fault/grade/state/telemetry/ledger types
- `catalog.ts` — the seven systems, approved components, locations, local faults, and reusable fault libraries
- `grades.ts` — component cost/HP/AP modifiers, shop AP modifiers, work capability, parts percentages
- `rig-state.ts` — default state, migration, derived severity, restrictions, grounding, validation
- `telemetry.ts` — mission accumulator, distorted-time integration, channel coefficients, source-specific fault multipliers
- `strike-resolution.ts` — seeded Poisson roll, weighted system selection, uniform component selection, AP/HP resolution, threshold crossing, fault/location generation
- `maintenance-service.ts` — service, repair, replacement, quotes, and shop capability
- `maintenance-ledger.ts` — immutable current/pending/committed audit records and debug-log persistence
- `index.ts` — public maintenance API

Markdown remains design reference rather than runtime input. Runtime catalog data is authored as typed TypeScript and validated by tests.

## 2. Persistent rig state

Add the rig to `CareerProfile` so delivery economics and wear commit in the same `saveCareerProfile()` write:

```ts
interface CareerRigState {
  schemaVersion: 1;
  rngState: number;
  completedMaintenanceMissions: number;
  components: Record<ComponentId, InstalledComponentState>;
}

interface InstalledComponentState {
  installed: boolean;
  grade: ComponentGrade;
  hp: number;
  ap: number;
  fault?: ActiveFaultState;
  lastServiceWorldTime?: number;
}

interface ActiveFaultState {
  severity: 'minor' | 'major' | 'total';
  faultId?: string;
  locationId?: string;
  generatedMission: number;
  generatedStrike: number;
}
```

Derived values such as maximum HP, serviced AP, costs, system status, and grounding are recalculated from catalog plus state rather than persisted.

Migration rules:

- Missing rig state creates grade-D standard equipment at full grade-D HP/AP.
- Atmospheric Package components are absent for new careers.
- Existing saves that already hold an atmospheric endorsement receive a migrated grade-D Atmospheric Package so migration does not remove existing access.
- Unknown component/fault IDs are ignored safely and recorded in the developer view.
- Rig state is validated and clamped on load without silently restoring legitimate sub-threshold HP.

## 3. Telemetry accumulator

Create one mission accumulator when a playable mission launches. It stores raw approved channels, not only the final system totals:

```ts
interface MaintenanceTelemetryAccumulator {
  standardMainDriveDv: number;
  highMainDriveDv: number;
  distortedDriveFiringSeconds: number;
  standardManeuverDv: number;
  highManeuverDv: number;
  distortedSasSeconds: number;
  distortedFlightSeconds: number;
  distortedPassengerSeconds: number;
  heatIntegral: number;
  severeHeatIntegral: number;
  aerodynamicLoadIntegral: number;
  distortedTurbulenceSeconds: number;
  wingTravelRadians: number;
  surfaceCycles: number;
  touchdownStress: number;
  dockingCycles: number;
  tractorCaptures: number;
  dockingCollisionStress: number;
  otherCollisionStress: number;
}
```

Settlement adds manifest-derived channels: loaded thrust stress, freight/passenger cycle, and communications cycle.

All time-integral channels use:

```text
1 + 0.5 × log10(max(1, userWarp))
```

applied to wall-clock player time. Fixed simulation/base-time scaling never directly multiplies maintenance duration.

### Flight instrumentation

Add typed step/event telemetry from each flight model rather than inferring every source from aggregate `dvUsed`:

- landing: main-drive Delta-V, maneuver/SAS use, gear cycle, touchdown result, collision
- approach: standard/high main drive, maneuvering, wings, heat, aerodynamic load, turbulence
- orbital: standard/high main drive, maneuver/SAS use, heat/aerodynamic load when in atmosphere
- docking: standard/high maneuvering, SAS, docking contacts, docking/undocking cycle, future tractor capture
- cluster: standard/high maneuvering, SAS, nonfatal collisions

Use returned step deltas or explicit event records. Do not count one collision repeatedly across cooldown frames.

## 4. Retry snapshots

Add a maintenance telemetry snapshot beside each phase's existing `manifestConditionStart` snapshot.

- Phase retry restores the phase-start telemetry snapshot.
- Whole-mission retry restores the empty mission-start accumulator.
- Failed attempts never mutate persistent rig state or RNG state.
- Successful phase transitions retain accumulated telemetry.
- Reloading or rerendering a completion overlay cannot generate another maintenance roll.

## 5. Weight calculation and source modifiers

At final delivery:

1. Convert raw telemetry into normalized channel units.
2. Produce a per-source, per-system contribution matrix using `rig-maintenance-telemetry.md`.
3. Apply active-fault multipliers only to their authored telemetry sources.
4. Sum adjusted system weights.
5. Preserve zero source/system weight.

Keep source rows in the ledger so effects such as Cargo Spine modifying loaded-thrust and docking Body weight do not incorrectly multiply unrelated Body weight.

## 6. Deterministic strike resolution

Use a small persisted deterministic PRNG, not `Math.random()`.

For each successful delivery:

1. Clone the rig RNG state into a pending settlement.
2. Roll `Poisson(sum(adjustedSystemWeights))`.
3. For each strike, select a system proportionally to adjusted weight.
4. Select uniformly among installed components in that system.
5. Roll AP versus HP using current AP and maximum grade-adjusted HP.
6. Remove exactly one AP or HP.
7. On a threshold crossing, generate a fault and an independent valid location.
8. Let Major supersede Minor; Total supersedes repairable faults.
9. Store every roll and state transition in the pending ledger.

The pending settlement caches both resulting rig state and next RNG state. It is generated once and committed once.

## 7. Atomic delivery commit

Prepare maintenance settlement when final delivery completion is first reached, but do not mutate career state yet. When the player confirms the final completion overlay:

- apply money, location, time, certifications, resulting rig state, and next maintenance RNG state
- save the complete `CareerProfile` once
- append the committed maintenance ledger

Final-phase retry discards the pending settlement and restores the phase telemetry snapshot. Settlement UI reopening cannot reroll it.

Old Nell/carrier relocation does not generate flight telemetry or strikes unless later given an explicit carrier-wear rule.

## 8. Servicing, repair, and replacement engine

Implement pure operations used by future shop UI and simulation tests:

- `serviceRig(rig, shopGrade)` — refresh all selected installed AP using component grade plus nonstacking shop modifier; never restore HP or clear faults
- `quoteRepair(component, fault, shop)` — grade-adjusted parts percentage plus labor/markup
- `repairComponent(...)` — require capable work grade; restore full HP and shop-serviced AP; clear fault
- `replaceComponent(...)` — always F work; install selected grade at full HP and shop-serviced AP
- `deriveRestrictions(rig)` — grounding, high-thrust, SAS, wing, freight, passenger, surface, and docking restrictions

Minor faults remain legal to leave active. Major faults can remain active when their restriction does not block the intended operation. Total always requires replacement. Shop-policy simulations choose when and what to transact; they do not alter these core rules.

## 9. Operational enforcement

After state/settlement is stable, enforce derived restrictions at both acceptance and launch:

- grounded rigs cannot launch ordinary work
- freight/passenger restrictions filter or disable incompatible postings
- station/surface destination requirements check docking and landing capability
- high thrust, braking SAS, and wings are disabled in controls when unavailable
- Atmospheric Package absence/Total blocks atmospheric work only

Show a specific reason wherever an action is blocked. Do not silently remove money, time, location, or wear on failed launch attempts.

## 10. Tilde developer views

The existing `Backquote`/F2 `dev-panel.ts` remains the only entry point. Add no main-menu, station-terminal, BBS, or Ship Status navigation to these views.

Refactor the placeholder panel into read-only tabs:

- **Mechanic**
- **Telemetry Ledger**

The selected tab persists while the panel is closed. A provider callback supplies snapshots from `Game` without coupling maintenance modules to DOM code. Refresh visible data only when dirty or at a throttled rate.

### Mechanic view

Show all seven systems and every catalog component, including absent optional equipment:

- system and derived status
- component name and stable ID
- installed/not installed
- component grade
- current/max HP
- current AP and AP that each shop grade would produce, with current serviced target emphasized
- absolute Minor/Major/Total thresholds
- active severity, fault name, and location
- last service time/mission
- grade-adjusted replacement value
- direct restrictions and source-specific strike multipliers
- validation warnings for unknown or invalid state

Use compact system sections and color only as a supplement to text. The first implementation is inspection-only; mutation/cheat buttons are separate future work.

### Detailed telemetry ledger

Provide a selector for:

- current attempt
- pending final settlement
- recent committed missions (ring buffer, newest first)

For the selected mission show:

1. Mission identity, route, attempt, manifest, start/completion time, and commit status.
2. Every raw telemetry channel with units.
3. Distorted-time totals and observed warp factors.
4. Normalized channel units.
5. Every source-to-system base-weight contribution, including zero Atmospheric Package rows where useful.
6. Active fault multipliers by source and their multiplicative products.
7. Base and adjusted weight totals by system.
8. Poisson mean, RNG state before/after, and strike count.
9. Every strike in order:
   - system-selection roll and selected system
   - component-selection roll and selected component
   - AP-hit probability and random roll
   - AP/HP before and after
   - crossed threshold
   - generated severity, fault name, and location
10. Retry/snapshot information and whether the ledger is current, discarded, pending, or committed.

Persist a debug-only ring of the latest 20 committed ledgers under a separate versioned local-storage key. Failure to write this debug history must not invalidate the atomic career settlement.

The panel should widen responsively for ledger tables and support vertical and horizontal scrolling without changing canvas layout.

## 11. Tests and verification

### Unit tests

- catalog IDs, library references, thresholds, and universal fault/location compatibility
- grade HP/AP/cost derivation and shop AP modifiers
- work-grade capability and repair/replacement quotes
- sub-threshold HP persistence
- threshold crossing and Minor/Major/Total supersession
- source-specific multiplicative fault weights
- distorted time: `1× -> 1`, `10× -> 1.5`, `100× -> 2`
- clean telemetry fixture totals exactly `0.994`
- seeded Poisson/system/component/AP-HP/fault/location resolution

### Integration tests

- phase retry restores telemetry
- whole retry restores mission-start telemetry
- failed attempt commits no wear/RNG change
- final settlement is generated once and committed once
- career money/location/time/rig update in one save
- old saves migrate without losing certifications or progress
- operational restrictions block only authored work
- service restores AP only; repair restores HP/AP; replacement handles Total

### Browser/debug smoke tests

- Tilde and F2 open both tabs during flight, completion overlay, terminal, and start menu
- no main-menu or terminal links expose the debug views
- Mechanic values match seeded test rig state
- live telemetry rows change during thrust, warp, atmosphere, touchdown, and docking contact
- pending and committed ledgers show identical strike results
- panel remains usable at narrow/mobile viewport sizes

## 12. Delivery order

1. Types, grades, typed catalog, and validation tests.
2. Career rig state, migration, deterministic RNG, and derived status/restrictions.
3. Read-only Mechanic developer view.
4. Telemetry accumulator, distorted time, and phase retry snapshots.
5. Flight-model instrumentation and clean `0.994` fixture.
6. Weight calculation, pending ledger, strike/fault resolution, and atomic delivery commit.
7. Detailed Telemetry Ledger developer view and debug history.
8. Service/repair/replacement engine and quote tests.
9. Operational restriction enforcement.
10. Browser smoke tests, seeded 100-mission regression scenarios, and balancing pass.

Keep each stage buildable and commit it separately. Do not add player-facing maintenance menus or shop scenes until the persistent state, ledger, and restriction core are verified.
