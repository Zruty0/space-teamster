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

Rig equipment is persistent career state.

```ts
interface EquipmentDef {
  id: string;
  name: string;
  category: 'propulsion' | 'rcs' | 'landing' | 'avionics' | 'thermal' | 'electrical' | 'cargo' | 'lights';
  maxHp: number;
  spaceworthyMinHp?: number;
  breakpoints: EquipmentBreakpoint[];
  wearModel: WearModel;
}
```

```ts
interface EquipmentState {
  equipmentId: string;
  hp: number;
  hiddenDamage?: number;
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

Completed flights generate wear based on:

- flight time
- total ΔV
- landing roughness
- total overheat time in atmosphere
- hard docking/collision events
- existing equipment condition

Damaged equipment increases the chance/rate of further damage.

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
