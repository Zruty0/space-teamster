import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

interface BrucknerCargoOption {
  label: string;
  massClass: CargoMassClass;
  likelihood: number;
}

interface WeightedNode {
  id: string;
  weight: number;
}

interface BrucknerNodeGroup {
  subHub: WeightedNode;
  leaves: WeightedNode[];
}

const BRUCKNER_ID = 'bruckner-field-services';
const BRUCKNER_NAME = 'Bruckner Field Services';
const BRUCKNER_TAG = 'BFS';

// Professional dealer/service network; pays fine for routine service logistics. Failed and
// quarantined returns nobody wants to haul carry a premium. Technician-crew relocations are
// passenger-board connectivity work with mild reimbursement instead of freight margins.
const BRUCKNER_BASE_GENEROSITY = 0.8;
const BRUCKNER_BASE_COMPENSATION_RATIO = 0.45;
const BRUCKNER_RETURN_GENEROSITY = 1.2;
const BRUCKNER_RETURN_COMPENSATION_RATIO = 0.25;
const BRUCKNER_CREW_GENEROSITY = 0.5;
const BRUCKNER_CREW_COMPENSATION_RATIO = 0.6;
const BRUCKNER_MAX_COMP_ALLOWANCE = 2;
const DIRECT_CREW_RELOCATION_COUNT = 2;
const SUB_HUB_LEAF_DISTRIBUTION_COUNT = 4;
const CENTRAL_LOCAL_LEAF_DISTRIBUTION_COUNT = 2;

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination, issuer) => `${issuer}'s service desk at ${destination} tags the ${cargo} with a warranty-chain sticker before the pallet is fully down. "You just saved somebody's afternoon," a mechanic says.`,
  (_candidate, cargo, destination) => `The ${cargo} rolls into ${destination}'s Bruckner cage among torque wrenches, orange cones, and half-open drive housings. Dispatch thanks you for keeping somebody else's warranty alive.`,
  (_candidate, cargo, destination) => `At ${destination}, a field tech signs for the ${cargo} while already arguing about the repair queue. Your manifest clears under "arrived in serviceable condition."`,
  (_candidate, cargo, destination, issuer) => `${issuer} receives the ${cargo} at ${destination} with practical relief rather than ceremony. "Good, we're only two crises behind now," the dock lead says.`,
  (_candidate, cargo, destination) => `The ${cargo} disappears into labeled bins and anti-static sleeves at ${destination}. Bruckner's terminal prints a warranty receipt nobody will read until something breaks.`,
];

const IMPORT_TOUCHDOWN_ID = 'caravanserai-highliner-bay-poi';
const CENTRAL_HUB_ID = 'estella-viii-harder-approach-station';

const HEARTH_SUB_HUB_ID = 'estella-iii-main-customs';
const CAMPS_SUB_HUB_ID = 'estella-via-component-supply-station';
const ESTELLA_X_SUB_HUB_ID = 'estella-xc-transit-refuel';
const ESTELLA_XI_SUB_HUB_ID = 'estella-xid-main-port';
const ESTELLA_XII_SUB_HUB_ID = 'estella-xii-observation-post';
const REACH_SUB_HUB_ID = 'estella-xiii-main-port';

function node(id: string, weight: number): WeightedNode {
  return { id, weight };
}

const LOCAL_SERVICE_LEAVES: WeightedNode[] = [
  node('caravanserai-outfitter-drydock', 2.6),
  node('estella-viii-first-rendezvous-station', 1.5),
  node('still-public-approach-dock', 0.8),
];

const NODE_GROUPS: BrucknerNodeGroup[] = [
  {
    subHub: node(HEARTH_SUB_HUB_ID, 1.3),
    leaves: [
      node('estella-i-transit-customs', 0.8),
      node('estella-i-hot-processing', 0.25),
      node('estella-ii-commercial-hub-dock', 1.2),
      node('estella-iii-high-tech-city', 0.55),
      node('estella-iiia-main-port-transit', 0.9),
      node('skim-hub-alpha-precursor-dock', 1.0),
      node('skim-hub-beta-precursor-dock', 0.7),
    ],
  },
  {
    subHub: node(CAMPS_SUB_HUB_ID, 1.8),
    leaves: [
      node('estella-via-drydock-station', 3.0),
      node('estella-vi-heavy-cargo-station', 1.8),
      node('estella-vi-main-transit-dispatch', 1.0),
      node('estella-vii-transit-export', 1.1),
      node('estella-vii-high-vacuum-factory', 1.0),
    ],
  },
  {
    subHub: node(ESTELLA_X_SUB_HUB_ID, 0.9),
    leaves: [
      node('estella-x-observation-skim-hub', 0.8),
      node('estella-xc-main-outpost', 0.55),
      node('estella-xd-chem-station', 0.9),
      node('estella-x-captive-refuel-relay', 0.8),
      node('estella-xb-smelting-processing', 0.35),
    ],
  },
  {
    subHub: node(ESTELLA_XI_SUB_HUB_ID, 1.5),
    leaves: [
      node('estella-xid-services-outfitter-hangar', 0.9),
      node('estella-xie-outer-spec-drydock', 2.6),
      node('estella-xie-rare-alloy-extraction', 1.2),
      node('estella-xi-skim-hub', 1.2),
      node('estella-xia-chem-station', 1.0),
      node('estella-xib-cryo-transit', 0.6),
      node('estella-xib-organic-chemistry', 0.4),
    ],
  },
  {
    subHub: node(ESTELLA_XII_SUB_HUB_ID, 0.9),
    leaves: [
      node('estella-xiic-isotope-mining', 0.35),
      node('estella-xii-comm-relay-poi', 0.8),
    ],
  },
  {
    subHub: node(REACH_SUB_HUB_ID, 0.8),
    leaves: [
      node('estella-xiv-transit-dock', 0.8),
      node('reach-rogue-isotope-mine', 0.35),
      node('reach-rogue-lonely-beacon', 0.5),
      node('reach-comet-fragment-2-poi', 0.5),
      node('reach-comet-fragment-5-poi', 0.5),
      node('deepest-dock-poi', 0.4),
    ],
  },
];

const SUB_HUBS = NODE_GROUPS.map(group => group.subHub);
const SERVICE_LEAVES = [...LOCAL_SERVICE_LEAVES, ...NODE_GROUPS.flatMap(group => group.leaves)];

const IMPORT_STOCK: BrucknerCargoOption[] = [
  { label: 'VHM civilian drive inventory', massClass: 'standard', likelihood: 1.1 },
  { label: 'certified propulsion service stock', massClass: 'standard', likelihood: 1.0 },
  { label: 'metric-drive dealer inventory', massClass: 'standard', likelihood: 0.9 },
  { label: 'sealed warranty replacement lots', massClass: 'standard', likelihood: 0.8 },
  { label: 'Bruckner branch resupply pallets', massClass: 'standard', likelihood: 0.7 },
];

const HUB_DISTRIBUTION_STOCK: BrucknerCargoOption[] = [
  { label: 'main drive maintenance supplies', massClass: 'standard', likelihood: 1.1 },
  { label: 'RCS installation kits', massClass: 'heavy', likelihood: 0.9 },
  { label: 'field calibration service kits', massClass: 'standard', likelihood: 1.0 },
  { label: 'propulsion diagnostics kits', massClass: 'standard', likelihood: 0.85 },
  { label: 'thermal-control maintenance kits', massClass: 'standard', likelihood: 0.75 },
  { label: 'drive alignment certification kits', massClass: 'light', likelihood: 0.7 },
];

const LEAF_SERVICE_STOCK: BrucknerCargoOption[] = [
  { label: 'main drive maintenance supplies', massClass: 'standard', likelihood: 1.0 },
  { label: 'field calibration service kits', massClass: 'standard', likelihood: 0.95 },
  { label: 'RCS maintenance supplies', massClass: 'standard', likelihood: 0.85 },
  { label: 'warranty recertification packages', massClass: 'light', likelihood: 0.75 },
  { label: 'certified drive overhaul kits', massClass: 'heavy', likelihood: 0.55 },
  { label: 'vibration isolation service kits', massClass: 'standard', likelihood: 0.65 },
];

const RETURNS: BrucknerCargoOption[] = [
  { label: 'failed drive service returns', massClass: 'standard', likelihood: 1.0 },
  { label: 'warranty black-box packages', massClass: 'light', likelihood: 0.95 },
  { label: 'sealed telemetry return lots', massClass: 'light', likelihood: 0.9 },
  { label: 'incident review evidence crates', massClass: 'light', likelihood: 0.65 },
  { label: 'quarantined controller returns', massClass: 'standard', likelihood: 0.7 },
];

const CREW_MOVES: BrucknerCargoOption[] = [
  { label: 'Bruckner field technician team', massClass: 'light', likelihood: 1.1 },
  { label: 'drive alignment crew', massClass: 'light', likelihood: 1.0 },
  { label: 'commissioning engineer team', massClass: 'light', likelihood: 0.85 },
  { label: 'warranty inspector party', massClass: 'light', likelihood: 0.8 },
  { label: 'incident review board', massClass: 'light', likelihood: 0.55 },
  { label: 'emergency propulsion service crew', massClass: 'standard', likelihood: 0.75 },
];

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rand(seed: number): number {
  let x = seed >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 0xffffffff;
}

function weightedPick<T>(items: T[], count: number, seed: number, weightOf: (item: T) => number): T[] {
  const pool = items.filter(item => weightOf(item) > 0);
  const picked: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const total = pool.reduce((sum, item) => sum + weightOf(item), 0);
    let roll = rand(seed + i * 0x7f4a7c15) * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      roll -= weightOf(pool[idx]);
      if (roll <= 0) break;
    }
    const [item] = pool.splice(Math.min(idx, pool.length - 1), 1);
    picked.push(item);
  }
  return picked;
}

function cargoFor(label: string, massClass: CargoMassClass, templateId: string, sourceId: string, destinationId: string): MissionCargoSpec {
  return {
    label,
    massClass,
    massTons: cargoMassForClass(massClass, `${BRUCKNER_ID}:${templateId}:${sourceId}->${destinationId}:${label}`),
  };
}

function templateIdFor(prefix: string, option: BrucknerCargoOption): string {
  return `${prefix}:${option.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '')}`;
}

function pushCargoOption(out: FactionContractCandidate[], templatePrefix: string, sourceId: string, destinationId: string, option: BrucknerCargoOption, laneLikelihood: number, generosity: number = BRUCKNER_BASE_GENEROSITY): void {
  const templateId = templateIdFor(templatePrefix, option);
  const passenger = templatePrefix.startsWith('crew-');
  const returnWork = templatePrefix.includes('return');
  out.push({
    factionId: BRUCKNER_ID,
    factionName: BRUCKNER_NAME,
    factionTag: BRUCKNER_TAG,
    templateId,
    sourceId,
    destinationId,
    cargo: cargoFor(option.label, option.massClass, templateId, sourceId, destinationId),
    likelihood: laneLikelihood * option.likelihood,
    generosity,
    compensationRatio: passenger ? BRUCKNER_CREW_COMPENSATION_RATIO : returnWork ? BRUCKNER_RETURN_COMPENSATION_RATIO : BRUCKNER_BASE_COMPENSATION_RATIO,
    maxCompAllowance: BRUCKNER_MAX_COMP_ALLOWANCE,
    category: passenger ? 'passenger' : undefined,
  });
}

function pushSampledCargoOptions(
  out: FactionContractCandidate[],
  templatePrefix: string,
  sourceId: string,
  destinationId: string,
  options: BrucknerCargoOption[],
  laneLikelihood: number,
  count: number,
  seedBase: number,
  generosity: number = BRUCKNER_BASE_GENEROSITY,
): void {
  for (const option of weightedPick(options, count, seedBase ^ hashString(`${templatePrefix}:${sourceId}->${destinationId}`), option => option.likelihood)) {
    pushCargoOption(out, templatePrefix, sourceId, destinationId, option, laneLikelihood, generosity);
  }
}

function groupForSource(sourceId: string): BrucknerNodeGroup | undefined {
  return NODE_GROUPS.find(group => group.subHub.id === sourceId || group.leaves.some(leaf => leaf.id === sourceId));
}

function isLocalServiceLeaf(sourceId: string): boolean {
  return LOCAL_SERVICE_LEAVES.some(leaf => leaf.id === sourceId);
}

function addCrewRelocations(out: FactionContractCandidate[], ctx: FactionContractContext): void {
  const crewNodes = [...SUB_HUBS, ...SERVICE_LEAVES];
  if (!crewNodes.some(node => node.id === ctx.sourceId)) return;
  const day = Math.floor(ctx.worldTime / 86_400);
  const seed = hashString(`${BRUCKNER_ID}:crew:${ctx.sourceId}:${day}`);
  const directTargets = weightedPick(
    crewNodes.filter(node => node.id !== ctx.sourceId),
    DIRECT_CREW_RELOCATION_COUNT,
    seed,
    node => node.weight,
  );
  directTargets.forEach((destination, index) => {
    const [crew] = weightedPick(CREW_MOVES, 1, seed ^ hashString(`${destination.id}:${index}`), option => option.likelihood);
    if (crew) pushCargoOption(out, 'crew-direct', ctx.sourceId, destination.id, crew, 0.55 * destination.weight, BRUCKNER_CREW_GENEROSITY);
  });
}

function generateBrucknerContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const sourceId = ctx.sourceId;

  const day = Math.floor(ctx.worldTime / 86_400);
  const seedBase = hashString(`${BRUCKNER_ID}:lanes:${sourceId}:${day}`);

  if (sourceId === IMPORT_TOUCHDOWN_ID) {
    pushSampledCargoOptions(out, 'import-feeder', sourceId, CENTRAL_HUB_ID, IMPORT_STOCK, 2.4, 3, seedBase);
  }

  if (sourceId === CENTRAL_HUB_ID) {
    pushSampledCargoOptions(out, 'export-return-to-highliner', sourceId, IMPORT_TOUCHDOWN_ID, RETURNS, 1.25, 2, seedBase, BRUCKNER_RETURN_GENEROSITY);
    for (const subHub of SUB_HUBS) pushSampledCargoOptions(out, 'hub-to-subhub', sourceId, subHub.id, HUB_DISTRIBUTION_STOCK, 0.75 * subHub.weight, 1, seedBase);
    for (const leaf of weightedPick(LOCAL_SERVICE_LEAVES, CENTRAL_LOCAL_LEAF_DISTRIBUTION_COUNT, seedBase ^ 0x105ea1, leaf => leaf.weight)) {
      pushSampledCargoOptions(out, 'hub-to-local-leaf', sourceId, leaf.id, LEAF_SERVICE_STOCK, 0.55 * leaf.weight, 1, seedBase);
    }
  }

  const group = groupForSource(sourceId);
  if (group?.subHub.id === sourceId) {
    pushSampledCargoOptions(out, 'subhub-return-to-hub', sourceId, CENTRAL_HUB_ID, RETURNS, 1.05, 2, seedBase, BRUCKNER_RETURN_GENEROSITY);
    for (const leaf of weightedPick(group.leaves, SUB_HUB_LEAF_DISTRIBUTION_COUNT, seedBase ^ 0x5e1f1eaf, leaf => leaf.weight)) {
      pushSampledCargoOptions(out, 'subhub-to-leaf', sourceId, leaf.id, LEAF_SERVICE_STOCK, 0.65 * leaf.weight, 1, seedBase);
    }
  } else if (group?.leaves.some(leaf => leaf.id === sourceId)) {
    pushSampledCargoOptions(out, 'leaf-return-to-subhub', sourceId, group.subHub.id, RETURNS, 1.05, 2, seedBase, BRUCKNER_RETURN_GENEROSITY);
    pushSampledCargoOptions(out, 'leaf-return-to-hub', sourceId, CENTRAL_HUB_ID, RETURNS, 0.55, 1, seedBase, BRUCKNER_RETURN_GENEROSITY);
  }

  if (isLocalServiceLeaf(sourceId)) {
    pushSampledCargoOptions(out, 'local-leaf-return-to-hub', sourceId, CENTRAL_HUB_ID, RETURNS, 1.05, 2, seedBase, BRUCKNER_RETURN_GENEROSITY);
  }

  addCrewRelocations(out, ctx);
  return out.map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const BRUCKNER_FIELD_SERVICES_PROVIDER: FactionContractProvider = {
  id: BRUCKNER_ID,
  name: BRUCKNER_NAME,
  generosity: BRUCKNER_BASE_GENEROSITY,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateBrucknerContracts(ctx);
  },
};
