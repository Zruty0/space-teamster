# Non-Flight Interaction System Plan

Updated: 2026-07-17

## Goal

Unify all non-flying gameplay under one cursor-driven dialogue/BBS-style interaction system:

- contract BBS
- NPC/contact dialogue
- shops/outfitters
- maintenance and repair
- tutorial/certification briefings
- personal/ship status inspection
- Guild account/loan management

Non-flight UI should feel like terminals, boards, briefings, and conversations, not separate bespoke menus.

## Core Primitive

Use one `InteractiveScene` system.

```ts
interface InteractiveScene {
  id: string;
  title: string;
  subtitle?: string;
  nodes: Record<string, SceneNode>;
  startNodeId: string;
}
```

A scene is a stateful terminal/dialogue interaction with:

- body text
- selectable rows/options
- optional detail panel
- guards/disabled reasons
- final confirmation screens
- transactional effects
- persistent session context

```ts
interface InteractionSession {
  sceneId: string;
  nodeId: string;
  context: Record<string, unknown>;
}
```

Session context holds temporary data such as selected posting, pending offer, haggled pay, selected repair line items, or generated estimate report.

## Scene Nodes

```ts
type SceneNode =
  | TextNode
  | MenuNode
  | ListNode
  | TransactionNode;
```

### Text node

For NPC dialogue, announcements, lore, and brief/debrief text.

```ts
interface TextNode {
  kind: 'text';
  speaker?: string;
  body: string[];
  options: SceneOption[];
}
```

### Menu node

For fixed choices.

```ts
interface MenuNode {
  kind: 'menu';
  body?: string[];
  options: SceneOption[];
}
```

### List node

For dynamic rows: contracts, repairs, equipment, reputations, certifications, shop stock.

```ts
interface ListNode {
  kind: 'list';
  body?: string[];
  providerId: string;
  emptyText?: string;
  rowMode?: 'inspect' | 'select' | 'toggle' | 'execute';
}
```

### Transaction node

For final confirmation: accepting contracts, approving repairs, buying parts, paying loans.

```ts
interface TransactionNode {
  kind: 'transaction';
  summary: string[];
  confirmLabel: string;
  cancelLabel?: string;
  effects: SceneEffect[];
}
```

## Options, Guards, Effects

```ts
interface SceneOption {
  label: string;
  detail?: string;
  disabledReason?: string;
  action: SceneAction;
}
```

Actions should be typed, not string scripts.

```ts
type SceneAction =
  | { kind: 'goto'; nodeId: string }
  | { kind: 'back' }
  | { kind: 'close' }
  | { kind: 'acceptContract'; postingId: string }
  | { kind: 'startMission'; sourceId: string; destinationId: string }
  | { kind: 'toggleRepairLine'; lineId: string }
  | { kind: 'approveSelectedRepairs' }
  | { kind: 'buyItem'; itemId: string }
  | { kind: 'makeLoanPayment'; amount: number };
```

Guards control row visibility/availability.

```ts
type SceneGuard =
  | { kind: 'hasMoney'; amount: number }
  | { kind: 'atLocation'; locationId?: string }
  | { kind: 'locationHasService'; service: string }
  | { kind: 'hasCertification'; certId: string }
  | { kind: 'factionReputation'; factionId: string; minRank: string }
  | { kind: 'rigSpaceworthy' }
  | { kind: 'equipmentTier'; equipmentId: string; minTier: number };
```

Effects mutate durable career state only after confirmation.

```ts
type SceneEffect =
  | { kind: 'addMoney'; amount: number }
  | { kind: 'spendMoney'; amount: number }
  | { kind: 'setLocation'; locationId: string }
  | { kind: 'advanceTime'; seconds: number }
  | { kind: 'setFlag'; flag: string }
  | { kind: 'grantCertification'; certId: string }
  | { kind: 'adjustReputation'; factionId: string; amount: number }
  | { kind: 'repairEquipment'; equipmentId: string; hpTo: number }
  | { kind: 'acceptContract'; contractId: string };
```

## Contract Flow

BBS rows should represent `ContractPosting`, not accepted contracts. Selecting a posting starts an acceptance flow.

```text
Posting selected
→ optional briefing/dialogue/haggle/lore
→ final confirmation
→ accepted contract
→ launch
```

Never let a BBS row directly start a mission.

```ts
interface ContractPosting {
  id: string;
  issuerId: string;
  factionId?: string;
  contactId?: string;
  title: string;
  publicSummary: string;
  postingStyle: 'corporate' | 'guild' | 'private' | 'shady' | 'government';
  sourceId: string;
  destinationId: string;
  cargo: CargoSpec;
  statedPay: number;
  restrictions: ContractRestriction[];
  hazards: RouteHazard[];
  gates: ContractGate[];
  flow: ContractAcceptanceFlow;
}
```

```ts
type ContractAcceptanceFlow =
  | { kind: 'direct' }
  | { kind: 'briefing'; sceneId: string }
  | { kind: 'contactDialogue'; sceneId: string }
  | { kind: 'haggle'; sceneId: string };
```

Examples:

- sleek corporate BBS listing: direct flow to final confirmation
- Guild certification job: briefing scene, then confirmation
- shady cargo: contact dialogue outside hangar, lore/haggling, then confirmation

## Final Contract Confirmation

Every contract acceptance ends with a confirmation screen showing:

- from / to
- cargo type and mass
- stated pay and final pay
- reputation/pay modifiers
- estimated par ΔV
- estimated fuel cost
- estimated net pay
- route hazards
- special restrictions
- certification/reputation gates if relevant

Example restrictions:

- good+ landing required
- fragile cargo shock limit
- deadline
- no carrier transfer
- no customs inspection

## Economic Computer

The rig's economic computer produces estimate reports. Better equipment gives more accurate estimates.

```ts
interface EconEstimate {
  computerId: string;
  accuracyClass: 'rough' | 'standard' | 'professional' | 'guild-certified';
  estimatedParDv: EstimateRange;
  estimatedFuelCost: EstimateRange;
  estimatedNet: EstimateRange;
  shownBreakdown: EstimateLine[];
  confidence: number;
  warnings: string[];
}
```

Basic computer: broad ranges, missing hazards, low confidence.

Professional/guild computer: narrow ranges, better route breakdown, hazard warnings, more reliable net estimate.

This creates a concrete reason to upgrade economic/navigation equipment.

## Reputation and Certifications

Contracts can be gated or modified by certifications and reputation.

```ts
type ContractGate =
  | { kind: 'certification'; certId: string }
  | { kind: 'factionReputation'; factionId: string; minRank: ReputationRank }
  | { kind: 'contactTrust'; contactId: string; minRank: number }
  | { kind: 'rigSpaceworthy' };
```

Reputation can:

- unlock postings
- hide postings
- alter pay
- change haggling options
- change NPC tone
- affect shop honesty or prices

## Tutorial and Certification Missions

Tutorials should be real contracts, not a separate tutorial mode.

Use contract kinds such as:

```ts
type ContractKind = 'delivery' | 'certification' | 'training' | 'carrierRide';
```

Flow:

```text
BBS certification posting
→ briefing dialogue
→ accept/confirm
→ flight or carrier relocation
→ post-flight debrief
→ grant certification/reward
```

The interaction system owns:

- briefing
- explanation/lore
- accept/decline
- debrief
- rewards and certification unlocks

Flight systems own:

- in-flight tutorial objective overlays
- step completion conditions
- retry/failure handling

Old Nell example:

```text
Guild Orientation: The Nell Run
- accept at Caravanserai
- dock/ride Old Nell or time-skip first pass
- arrive at Nell's Rest on Weymark
- complete local orbital/landing certification work
```

Old Nell is unique: the first local big iron, too old for profitable trunk line work but Guild-chartered for Caravanserai ⇄ VIII apprentice/certification runs. Highliners are separate interstellar Alcubierre vessels and should not be conflated with local big irons.

## Damage, Wear, Repair

Rig equipment is persistent career state. The Ship Status view groups components under seven confirmed, player-facing categories, each with its own status icon:

1. **Body and Frame**
2. **Powertrain**
3. **Steering and Thrusters**
4. **Atmospheric Package**
5. **Landing and Docking**
6. **Cab and Controls**
7. **Auxiliary Systems**

```ts
type EquipmentCategory =
  | 'body-frame'
  | 'powertrain'
  | 'steering-thrusters'
  | 'atmospheric-package'
  | 'landing-docking'
  | 'cab-controls'
  | 'auxiliary-systems';

interface EquipmentDef {
  id: string;
  name: string;
  category: EquipmentCategory;
  maxHp: number;
  maxArmor: number;
  spaceworthyMinHp?: number;
  breakpoints: EquipmentBreakpoint[];
  telemetrySusceptibility: TelemetrySusceptibility;
  subassemblies: ComponentSubassemblyDef[];
}
```

Repeated units are tracked as one component collection rather than many individual condition records. For example, the RCS assembly has one HP/AP state. A persistent fault may identify an authored subassembly such as the aft-port nozzle bank for diagnosis and repair flavor, but that nozzle bank does not have separate HP or service wear.

```ts
interface EquipmentState {
  equipmentId: string;
  hp: number;
  armor: number;
  fault?: EquipmentFaultState;
  lastServicedAt?: number;
}
```

Breakpoints are named states with repair meanings.

Example nav computer:

```text
<80%  Out of date       Software update
<50%  Intermittent      Servicing
<20%  Failing to boot   Replacement, grounding
```

Completed-flight telemetry produces an ordered sequence of strikes rather than degrading every component uniformly. Telemetry inputs include flight time, total ΔV, thrust exposure, landing roughness, atmospheric heat, turbulence, and docking/collision events. Each strike targets one or more of the seven systems, then selects one random component collection in each targeted system.

Components use small integer condition (HP) and armor (AP) pools. Component quality determines maximum HP/AP. Servicing refreshes AP; repairs restore HP. AP is strong but not an absolute buffer: each unit of current AP has five times the strike weight of each unit of maximum HP. For current armor `A` and maximum HP `Hmax`:

```text
P(AP hit) = 5A / (5A + Hmax)
P(HP hit) = Hmax / (5A + Hmax)
```

An AP hit removes one current AP; an HP hit removes one current HP. The probability deliberately uses maximum HP, not current HP, so a badly damaged component does not become increasingly protected by its remaining armor. With maximum `3 HP` and current `2 AP`, every strike has `10/13` AP-hit and `3/13` HP-hit chances regardless of current HP.

A normal mission targets a random mean of approximately **one strike-equivalent**, not exactly one guaranteed strike. Zero-strike missions should be common enough to notice, while the distribution must retain a tail allowing occasional surprising strike clusters. One strike affecting two systems counts as two strike-equivalents because it resolves two component-hit rolls. With seven baseline systems of five fresh `3 HP / 2 AP` components, one mean strike-equivalent per normal mission produces the first fault after roughly three to five missions; concentrated telemetry targeting one system tends toward the early end, while widely distributed targeting tends toward the late end. Exact random distribution, telemetry thresholds/weights, system targeting, and mission/retry commit timing remain to be defined.

### Faults and repair work

Components may define optional Minor and Major HP thresholds; Total always occurs at `0 HP`. A fault is generated only the first time an HP hit crosses a threshold from above. For a `4 HP` component with Minor at `3` and Major at `1`, the sequence is Minor on `4→3`, nothing on `3→2`, Major on `2→1`, and Total on `1→0`. A Major fault supersedes the existing Minor fault rather than stacking with it. Total failure supersedes every repairable fault and requires replacement.

Fault content comes from reusable libraries keyed by compatible component traits rather than a full component-by-fault Cartesian product. Example families include software, electronics, wiring/connectors, hydraulics, fluid/propellant, bearings/rotating machinery, mechanical linkages, seals/pressure, thermal/cooling, and structure/bodywork. A generated repairable fault stores:

- severity (`minor` or `major`)
- fault name
- repair-action name
- persistent authored subassembly location for flavor
- parts fraction of component base cost
- labor hours
- work grade (`A` through `F`)
- gameplay symptom/effect

Parts are `20%` of component base cost for Minor work and `50%` for Major work. Replacement parts are `100%` of base cost. Labor is fault-dependent hours multiplied by the shop's labor rate.

Grade A is the most demanding/specialized work and F is the simplest. A shop may perform work at its capability grade or any easier grade: a C shop can do C/D/E/F, while an F shop can only replace modules. Replacement is always F-grade work, so a shop unable to perform the proper repair can recommend full replacement instead.

A successful repair always restores the component to full HP, restores AP to its serviced maximum, clears the fault, and updates service time. Repair therefore includes servicing. Standalone servicing restores AP to maximum but does not restore lost HP. Replacement installs the component at full HP and AP and clears Total failure.

### Warnings and grounding

Compute rig status from actual equipment state:

```ts
type RigStatus = 'ok' | 'warning' | 'alert' | 'grounded';
```

- warning: any minor breakpoint active
- alert: severe breakpoint active
- grounded: any grounding breakpoint active

BBS/terminal header should show maintenance warning/alert icons. Non-spaceworthy rigs cannot accept/launch normal work until repaired, except special tow/yard-transfer/test exceptions.

### Repair quotes

Separate actual damage from shop diagnosis.

```ts
interface RepairLineItem {
  id: string;
  equipmentId?: string; // absent for fake invented equipment
  label: string;
  claimedProblem: string;
  actualProblem?: string;
  repairKind: string;
  partsCost: number;
  laborHours: number;
  laborRate: number;
  totalCost: number;
  necessary: boolean;
  fake?: boolean;
  exaggerated?: boolean;
  fixesHpTo?: number;
}
```

Honest shops report real faults. Dishonest shops may:

- invent fake failures
- overstate severity
- recommend unnecessary replacements
- inflate labor
- invent non-existing equipment

```ts
interface MaintenanceShopDef {
  id: string;
  name: string;
  locationIds: string[];
  laborRate: number;
  partsMarkup: number;
  honesty: number;
  competence: number;
  turnaroundMultiplier: number;
  specialties: string[];
}
```

Maintenance shop scene is a dynamic list with toggle rows and transaction confirmation:

```text
[ ] RCS Nozzle #4 — Out of alignment
    Parts 0 cr, Labor 1.4 hr, Total 140 cr

[ ] Nav Computer — Software update required
    Parts 20 cr, Labor 0.5 hr, Total 70 cr

Approve selected / approve all / decline
```

## Personal and Ship Inspection

Use the same interaction system for a persistent personal/ship status terminal.

Root example:

```text
PERSONAL TERMINAL
> Pilot Record
> Certifications
> Faction Reputation
> Rig Status
> Maintenance Alerts
> Guild Account / Loans
> Contract History
> Back
```

### Certifications

Show granted and missing certifications, issuer, date, and what they unlock.

### Reputation

Show known factions only.

```text
Teamsters' Guild   Good
Gaia Combine       Neutral
Free Traders       Trusted
```

### Rig status

Show equipment list and alerts.

```text
RCS Nozzle #1      96%
RCS Nozzle #4      74%  ⚠ Out of alignment
Nav Computer       81%  ⚠ Out of date
Landing Leg B      18%  ✖ Not spaceworthy
```

### Guild account / loans

Show:

- cash
- principal
- accrued interest
- next payment
- delinquency state
- payment/deferment options where allowed

## Local Terminal vs Shipboard Terminal

Do not make all local services accessible everywhere.

### Shipboard terminal

Available outside docked state for inspection/read-only status.

```text
SHIPBOARD TERMINAL
> Pilot Record
> Certifications
> Known Reputation
> Rig Status
> Equipment Alerts
> Accepted Contract
> Nav/Econ Estimate
> Guild Loan State
```

### Local terminal

Available only when docked/landed at a location.

```text
LOCAL TERMINAL — Caravanserai Main Commercial Dock
> Contract BBS
> Personal Terminal
> Maintenance Shop
> Outfitter / Parts
> Local Contacts
> Port Services
> Launch / Depart
```

Rules:

- inspect self/ship/account: available anywhere
- transact with local economy: only docked/landed at that location
- remote BBS/comms may be added later, likely read-only or delayed

## UI Shell

One renderer should support all non-flight scenes.

Layout:

```text
TITLE / LOCATION / CASH / TIME / MAINT STATUS

BODY TEXT OR LIST

> selectable row
  selectable row
  disabled row + reason

DETAIL PANEL

FOOTER: Enter select | Esc back | Arrows move
```

Controls:

- Up/Down: move cursor
- Enter: select/confirm
- Backspace/Esc/Left: back
- Right may inspect/open detail but should not accept irreversible actions

## Design Rules

- Scene system owns navigation and rendering.
- Gameplay systems own business logic.
- Durable state changes happen through typed effects after confirmation.
- BBS postings are not accepted contracts.
- Shop quotes are claims, not truth.
- Tutorials are certification contracts with richer briefing/debrief scenes.
- Shipboard inspection can be available anywhere; local transactions require location access.
- Highliners are special interstellar Alcubierre vessels; local big irons and Old Nell are separate concepts.
