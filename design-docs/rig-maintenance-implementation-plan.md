# Rig Maintenance Implementation Plan

Implementation plan for the approved component catalog, telemetry weights, persistent condition, faults, servicing, repair, replacement, operational restrictions, player-facing Ship Status, maintenance-shop BBS postings, and developer inspection views.

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
- `maintenance-service.ts` — service, repair, replacement, quotes, work complexity, and shop-quality effects
- `shops.ts` — authored shop definitions, local availability, stock, diagnosis, capability, labor rates and hour multipliers, and markup
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
  diagnosis: 'unknown' | 'suspected' | 'confirmed';
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
- `replaceComponent(...)` — replacement has F-grade work complexity, so every shop can perform it; F does not describe replacement quality. Install the purchased component grade at full HP, then derive installation/service AP from the replacing shop's grade.
- `deriveRestrictions(rig)` — grounding, high-thrust, SAS, wing, freight, passenger, surface, and docking restrictions

Minor faults remain legal to leave active. Major faults can remain active when their restriction does not block the intended operation. Total always requires replacement. Shop-policy simulations choose when and what to transact; they do not alter these core rules.

## 9. Operational enforcement

After state/settlement is stable, enforce derived restrictions at both acceptance and launch:

- grounded rigs cannot launch ordinary work
- freight/passenger restrictions filter or disable incompatible postings
- station/surface destination requirements check docking and landing capability
- high thrust, braking SAS, and wings are disabled in controls when unavailable. Landing, docking, cluster, orbital, and approach handlers suppress high-thrust input before physics/telemetry; landing/docking/cluster also force active braking SAS off; approach suppresses wing controls and forces deployed wings unavailable. Attempted use shows a plain unavailable guidance banner.
- Atmospheric Package absence/Total blocks atmospheric work only; if an unequipped rig nevertheless reaches any atmospheric density in orbital flight, including an aerobraking pass, entry immediately crashes the rig

Contract boards mark incompatible missions `LOCKED` but keep their rows inspectable. Contract acceptance separately lists missing qualifications and current equipment restrictions, disables the final acceptance action, and repeats the player-safe blocking reasons. The mission restriction matrix checks grounding for every ordinary flight; freight/passenger capability by contract category; surface-landing or station-docking capability from destination placement; and atmospheric capability for atmospheric surface destinations. Old Nell carrier passage performs no player flight operation and is exempt. Recheck all requirements in the acceptance action so stale UI cannot bypass the lock.

Show a specific reason wherever an action is blocked. Do not silently remove money, time, location, or wear on failed launch attempts.

## 10. Player-facing Ship Status

Replace the existing Station Terminal `Ship Status` placeholder with one read-only `shipStatus` scene.

Show exactly the seven approved systems in their approved order. Each system has one coarse player-facing indicator:

- `OK` — no named fault
- `WARNING` — at least one active Minor fault and no Major/Total fault
- `ALERT` — at least one active Major or Total fault

Before diagnosis, a faulted system remains coarse and reads `WARNING — VISIT A SHOP FOR DIAGNOSIS` or `ALERT — VISIT A SHOP FOR DIAGNOSIS`. After a shop confirms a fault, replace that coarse system row with one line per confirmed faulted component showing only the warning/alert icon and component name. If confirmed and unconfirmed faults coexist, retain the coarse diagnosis-required row and list the confirmed components beneath it. Ship Status never shows component grade, HP/AP numbers, thresholds, fault names, fault locations, service age, repair prices, RNG, hidden diagnosis truth, or raw telemetry.

Below the seven indicators, show the derived equipment-based restrictions as a plain player-safe list, including grounding and unavailable freight, passenger, high-thrust, braking-SAS, docking, landing, wing, surface, or atmospheric work. Do not leak component names through internal restriction reasons. Missing Atmospheric Package uses the same list as every other restriction and reads `No atmospheric flight`. If no restriction is active, show `No equipment restrictions`.

An absent optional Atmospheric Package is not itself a damaged-system alert. Show only orange `NOT EQUIPPED`, without `OK` and without a warning/alert status icon, while the ordinary restriction list states `No atmospheric flight`. In orbital mode, any predicted unprotected atmospheric segment is red and receives a red fatal-entry text notice, but no triangle icon; actual atmospheric exposure immediately crashes the rig—even when the trajectory would otherwise aerobrake and exit. Impact prediction uses only the red X at the predicted impact point plus the original text warning. Suppress the blinking `IMPACT TRAJECTORY` text when predicted surface impact is within 50 km along the surface of the authored target.

Below restrictions, show an **Optional Equipment** list for separately purchased rig modules. The persistent list starts empty and displays `None installed`. Heavy Heat Shielding is the first defined future module, but it is not initially installed.

Ship Status is inspection-only. Service, diagnosis, repair, replacement, and purchasing belong to maintenance-shop postings.

Do not add seven system-specific icons. Show no icon for `OK`; show a yellow exclamation mark in a black warning triangle immediately beside the `WARNING` status text, and a white exclamation mark in a red triangle immediately beside the `ALERT` status text—not beside the system name. The Station Terminal's `Ship Status` option shows the same highest active warning/alert icon beside its label. Severity colors supplement rather than replace the `OK`, `WARNING`, and `ALERT` text. Use existing `InteractiveScene` body scrolling so the scene works on narrow/mobile viewports.

## 11. Maintenance-shop directory entries

Place authored maintenance shops in the Station Terminal's **Local Directory**, not in Ship Status or the freight/passenger contract boards:

- local entries use a clear `SHOP` or `SERVICE` tag
- only shops serving the current terminal scope can transact
- remote directory contacts may advertise a shop, but transactions require local physical access
- Ship Status remains inspection-only; an eventual `Find Local Maintenance` shortcut may route to filtered directory entries but performs no work itself

Define authored shops with stable IDs:

```ts
interface MaintenanceShopPerson {
  references: string[];
  contact?: boolean;
}

interface MaintenanceShopCopy {
  people: MaintenanceShopPerson[];
  profileBlurb: string;
  levelBlurb: string;
  diagnosisBlurb: string;
  serviceBlurb: string;
  repairsBlurb: string;
}

interface MaintenanceShopDef {
  id: string;
  name: string;
  organizationName?: string;
  locationIds: string[];
  diagnosticGrade: WorkGrade;
  workQualityGrade: ShopGrade;
  componentGradeBest: ComponentGrade;
  componentGradeWorst: ComponentGrade;
  laborRate: number;
  diagnosisHours: number;
  partsMarkup: number;
  laborHoursMultiplier: number;
  honesty: number;
  copy: MaintenanceShopCopy;
}
```

BBS rows show only player-legible commercial information:

- shop name and organization tag
- local location
- diagnostic grade and work-quality grade
- inclusive replacement-component grade range
- projected full-service price from installed component service hours and labor rate
- short capability summary
- `CLOSED`, `UNAVAILABLE`, or restriction text when appropriate

Selecting a posting opens a shop scene rather than a flight contract. Required scene flow:

1. **Shop profile** — description blurb, one-sentence verbal shop level, labor rate, and service actions. Internal diagnostic/work/stock grades and fault counts never appear in the profile or other player-facing shop scenes. Local Directory shop listings use a cyan wrench icon instead of a `[SHOP]` text tag.
2. **Diagnosis/quote** — actual or claimed Minor/Major/Total line items plus every active restriction. Diagnostic capability compares against the fault's work grade. A fault above that capability identifies the component and severity as, for example, `Major unknown fault`, but does not reveal its fault or location.
3. **Work selection** — toggle per-system service, repairs, and replacements. Repair services only the repaired component. System service adds every installed component's authored service time and skips absent optional equipment.
4. **Replacement selection** — use the component's current grade when it lies within the shop's inclusive stock range. Otherwise state that an exact replacement is unavailable, show the resulting grade change, and offer only the closest stocked boundary grade or cancellation.
5. **Confirmation** — total credits, displayed labor time, resulting service quality, replaced component grade, and restrictions cleared or remaining.
6. **Receipt** — atomically apply cash, world time, rig state, diagnosis state, service time, and replacement/repair results.

Replacement retains F-grade work complexity at every shop. Work Quality Grade determines both repair capability and installed/service AP quality. The selected replacement part retains its purchased component grade. Replacement remains available for an unknown fault and at every shop.

The standard licensed shop is Diagnostic C / Work D / Components D–D, normally at `500 cr/hour`. Baron Estêvão Vilar’s strictly orbital Wells chain uses that baseline at Gryphon Aerie, Herald Gate, Hydra Maw Orbital, Macao Palace, and Manticore Observatory. Sir Tomás Barreto moved with the former Oathmark concession to Gryphon Aerie; he welcomes Teamsters warmly while treating his serfs with open contempt. Dame Leonor Falcão remains impeccably courteous and coldly exacting at Herald Gate. Former skim chief Dame Inês Moura runs Hydra Maw like a pressure-critical flight deck. Sir Gaspar Seixas presents Macao work with palace-casino polish. Sir Lourenço Noronha runs Manticore according to ancient feudal custom, disdains Vilar’s purchased title, and binds the work to his older house’s knightly honor. Serrat Domain Shipyard is no longer in the Vilar network and is reserved for a distinct special shop.

Vilar’s Outfitter at Cadiz Highport is the chain flagship, personally operated by its self-made founder. Baron Vilar built the business before purchasing his baronial title, admires the Hearth’s smooth CEOs, and affects a brisk business-leader manner beneath Wells noble presentation. The larger Cadiz floor is Diagnostic B / Work C / Components C–D at `600 cr/hour`; its two-hour diagnosis costs `1,200 cr`. Other Vilar branches charge `1,000 cr` for the same two hours.

The Armorial Shipwrights at Shipwright Keep provide Diagnostic B / Work C / Components C–D capability and ordinary Work-C serviced AP within an ancient, extravagant repair-court tradition. Their `2×` labor-hours multiplier makes every authored task display, bill, and advance world time at twice its base hours while retaining a `600 cr/hour` rate. Their `2×` parts markup doubles base parts prices as well. A diagnosis is therefore `4 hours / 2,400 cr`, and full service of a depleted 20-hour baseline rig is `40 hours / 24,000 cr`. Journeymen, apprentices, and supervised squires work beneath heraldic rolls; completed work receives armorial marks; their physical Guild parchment and wax seal are displayed behind crystal. Sir Afonso de Lacerda, Keeper of the Yard Seal, presides. Player-facing Shop Level calls it an ancient armorial repair court rumored to offer ordinary workmanship with twice the ceremony.

There is no separate shop-turnaround value. `laborHoursMultiplier` scales authored hours before they are displayed, billed, and applied to world time. Bruckner’s former hidden `0.75×` turnaround is now a visible `0.75×` labor-hours multiplier; its rate rises from `1,200` to `1,600 cr/hour`, preserving existing gross labor prices while showing the shorter time. Standard shops use `1×`.

Shop profile blurbs use third-person scene setting; diagnosis, service, and repairs use separately authored character speech. Generic instructional paragraphs are omitted because prices, findings, and actions carry the required information. Explicit `[person]...[/person]` and `[contact]...[/contact]` markup controls human-name colors; names are never inferred from aliases. Service, repair, and replacement remain locked until that specific shop diagnoses the rig. The diagnostic fee persists as a one-use, nonstacking Service Credit against the first successful later work order at the same shop and never creates a cash refund. House Vilar inspections and credits remain branch-specific. Lists retain gross prices, while authorization shows the credit deduction. A fully depleted installed baseline rig including Atmospheric Package has `20.0` authored service hours and costs about `10,000 cr` at a standard Vilar branch or `12,000 cr` at Cadiz. After diagnosis, service quotes include only components that gain AP at that shop. No-benefit system rows are disabled with `This system is already maintained.`; full-rig and profile actions use `All systems are already maintained.` A completed **Diagnostic Inspection** action remains disabled. Authored component service times use half-hour increments with a `0.5 hour` minimum before the shop labor-hours multiplier; displayed, billed, and elapsed time uses the scaled result.

The unofficial-mechanic archetype is Diagnostic E / Work F / Components F–F. Most remote locations should provide one when no licensed shop is locally reachable; this guarantees diagnosis of only easy faults and universal standardized replacement, usually with an explicit downgrade to Grade F.

Implement an honest-shop baseline first. Then add diagnosis quality and honesty:

- actual fault truth remains in rig state
- player knowledge advances from unknown/suspected to confirmed
- honest shops quote real work
- dishonest shops may invent, exaggerate, or recommend unnecessary work using the existing `necessary`, `fake`, and `exaggerated` quote fields
- declining a quote changes no money, time, HP, AP, or fault state

Shop transactions use the same quote and mutation engine as tests. Save money, world time, and rig state atomically. Keep freight/passenger contract generation and maintenance-shop listings separate; shops are authored local services, not generated hauling contracts.

## 12. Tilde developer views

The existing `Backquote`/F2 `dev-panel.ts` remains the only entry point. Add no main-menu, station-terminal, BBS, or Ship Status navigation to these views.

Refactor the placeholder panel into two developer-only tabs:

- **Mechanic**, with explicit debug maintenance controls
- **Telemetry Ledger**, read-only

The selected tab persists while the panel is closed. A provider callback supplies snapshots from `Game` without coupling maintenance modules to DOM code. Refresh visible data only when dirty or at a throttled rate.

### Mechanic view

Show all seven systems and every catalog component, including absent optional equipment:

- system and derived status
- component name and installed/not-installed state
- component grade
- current/max HP
- current AP / grade-D base AP
- active severity, fault name, and location
- last service time/mission
- grade-adjusted replacement value
- active direct restrictions and nontrivial source-specific strike multipliers
- validation warnings for unknown or invalid state

Use compact system sections and color only as a supplement to text. Omit component IDs and fault thresholds.

Each system heading has compact `R`, `S`, and `X` controls for repair, service, and exchange. Selecting an operation replaces that control group with `A B C D E F X`; A–F confirms the operation at that grade and X cancels. Each component row also has direct `-1HP` and `-1AP` damage controls. HP damage bypasses armor, persists sub-threshold loss, and independently rolls a valid fault and location whenever it crosses a Minor or Major threshold; reaching zero creates Total. AP damage removes one point without rolling a fault. Controls disable at zero and for absent components. Repair clears repairable named faults, restores full HP, and services all installed components in the system at the selected shop grade; it does not erase sub-threshold HP loss or repair Total faults. Service restores AP at the selected shop grade. Exchange installs/replaces all system components at the selected component grade, restores their full HP and grade-base AP, clears faults, and does not count as service. The optional Atmospheric Package also has a direct `REMOVE` control that marks all three package components absent and removes dependent Heavy Heat Shielding. Debug mutations persist immediately and are mirrored into any pending successful-delivery rig so settlement cannot silently overwrite them. Mechanic content does not poll/rebuild while idle; this keeps buttons attached between pointer-down and click. Ledger polling pauses while the pointer is over the panel.

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

### Debug/player separation

The Mechanic view always shows actual hidden state, including component condition, true faults, and locations. Player Ship Status begins with seven coarse system indicators and derived equipment restrictions; after confirmed diagnosis it may show only the affected component name and severity icon. Fault names, locations, grades, and repair detail appear only in maintenance-shop scenes. The Telemetry Ledger remains developer-only and never appears in Ship Status or maintenance-shop scenes.

## 13. Tests and verification

### Unit tests

- catalog IDs, library references, thresholds, and universal fault/location compatibility
- grade HP/AP/cost derivation and shop AP modifiers
- work-grade complexity versus shop-grade quality, including F-complexity replacements whose serviced AP is determined by the replacing shop
- repair/replacement quotes
- sub-threshold HP persistence
- threshold crossing and Minor/Major/Total supersession
- source-specific multiplicative fault weights
- distorted time: `1× -> 1`, `10× -> 1.5`, `100× -> 2`
- clean telemetry fixture totals exactly `1.2222`
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

### Player/shop integration tests

- Station Terminal Ship Status shows the seven systems in the approved order
- each system displays only `OK`, `WARNING`, or `ALERT`; AP depletion and sub-threshold HP wear remain `OK`, Minor faults produce `WARNING`, and Major/Total faults produce `ALERT`
- Ship Status shows safe restrictions; unknown faults remain coarse while confirmed faults expose only component name and severity icon, never fault/location/grade/condition/RNG/telemetry detail
- absent Atmospheric Package displays orange `NOT EQUIPPED` without `OK` or a status icon, while `No atmospheric flight` appears in the ordinary restrictions list
- an unprotected orbital atmospheric entry or aerobraking pass immediately crashes and uses a red trajectory/fatal-entry text presentation without a triangle icon
- planned surface impacts within 50 km of the authored target do not show the blinking `IMPACT TRAJECTORY` text
- Ship Status and its Station Terminal option show only the approved warning/alert triangle when a named fault is active
- Optional Equipment displays `None installed` for a migrated/default rig
- Local Directory shop entries transact only when locally reachable
- selecting a shop never enters contract acceptance or flight launch flow
- quote selection previews correct component grade, shop-quality AP, parts, scaled labor time, and service price
- insufficient funds, declined quotes, and unavailable work leave career and rig state unchanged
- confirmed work updates money, world time, rig, diagnosis, and restrictions in one save
- replacement is available at every shop as F-complexity work while AP quality still follows shop grade
- shop rows and Ship Status remain usable at narrow/mobile viewport sizes

### Browser/debug smoke tests

- Tilde and F2 open both tabs during flight, completion overlay, terminal, and start menu
- no main-menu or terminal links expose the debug views
- Mechanic values match seeded test rig state
- live telemetry rows change during thrust, warp, atmosphere, touchdown, and docking contact
- pending and committed ledgers show identical strike results
- panel remains usable at narrow/mobile viewport sizes

## 14. Delivery order

1. Types, grades, typed catalog, and validation tests.
2. Career rig state, migration, deterministic RNG, and derived status/restrictions.
3. Read-only Mechanic developer view.
4. Telemetry accumulator, distorted time, and phase retry snapshots.
5. Flight-model instrumentation and clean `1.2222` fixture.
6. Weight calculation, pending ledger, strike/fault resolution, and atomic delivery commit.
7. Detailed Telemetry Ledger developer view and debug history.
8. Service/repair/replacement engine and quote tests.
9. Operational restriction enforcement.
10. Player Ship Status scene with seven coarse indicators, equipment restrictions, and status icons.
11. Authored shop catalog and Local Directory shop entries.
12. Honest diagnosis, quote selection, confirmation, receipt, and atomic shop transactions.
13. Dishonest diagnosis/quote behavior and replacement-grade stock.
14. Browser smoke tests, seeded 100-mission regression scenarios, mobile checks, and balancing pass.

Keep each stage buildable and commit it separately. The developer Mechanic and Telemetry Ledger views remain Tilde/F2-only; the player-facing Ship Status and maintenance-shop BBS scenes begin only after persistent state, ledger, restriction, and transaction rules are verified.
