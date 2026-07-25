import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

interface VhmCargoOption {
  label: string;
  massClass: CargoMassClass;
  likelihood: number;
}

interface WeightedNode {
  id: string;
  weight: number;
}

const VHM_ID = 'voss-heinkel-metricwerke';
const VHM_NAME = 'Voss-Heinkel Metricwerke';
const VHM_TAG = 'VHM';

const WEYMARK_DEPOT_ID = 'estella-viii-harder-approach-station';
const GAIA_CORPORATE_HQ_ID = 'estella-iii-finance-city';

// Severe, deep-pocketed, and shipping rare precious hardware: VHM buys reliability and pays
// near the top. Sealed hazard returns are the worst work and top the scale. People movement
// lives on the passenger board with reimbursement instead of freight margins.
const VHM_BASE_GENEROSITY = 1.5;
const VHM_RETURN_GENEROSITY = 1.7;
const VHM_PEOPLE_GENEROSITY = 0.5;
const VHM_PEOPLE_COMPENSATION_RATIO = 0.6;
const VHM_PEOPLE_MAX_COMP_ALLOWANCE = 2;

const DIRECT_HARDWARE_DESTINATION_COUNT = 3;
const GAIA_OUTBOUND_PEOPLE_DESTINATION_COUNT = 3;

function node(id: string, weight: number): WeightedNode {
  return { id, weight };
}

// VHM proper uses the same service leaves as the BFS network, but ships rare direct cargo without sub-hub aggregation.
// Vacuum dockyards, outfitter/service stations, and component/fabrication nodes dominate; surface precision-industry sites are low-weight exceptions.
const VHM_SERVICE_LEAVES: WeightedNode[] = [
  node('caravanserai-outfitter-drydock', 2.6),
  node('estella-viii-first-rendezvous-station', 1.4),
  node('still-public-approach-dock', 0.8),

  node('estella-i-transit-customs', 0.7),
  node('estella-i-hot-processing', 0.25),
  node('estella-ii-commercial-hub-dock', 1.1),
  node('estella-iii-high-tech-city', 0.55),
  node('estella-iiia-main-port-transit', 0.9),
  node('skim-hub-alpha-precursor-dock', 1.0),
  node('skim-hub-beta-precursor-dock', 0.7),

  node('estella-via-drydock-station', 3.0),
  node('estella-via-component-supply-station', 2.0),
  node('estella-vi-heavy-cargo-station', 1.8),
  node('estella-vi-main-transit-dispatch', 1.0),
  node('estella-vii-transit-export', 1.1),
  node('estella-vii-high-vacuum-factory', 1.0),

  node('estella-xc-transit-refuel', 1.0),
  node('estella-x-observation-skim-hub', 0.8),
  node('estella-xc-main-outpost', 0.55),
  node('estella-xd-chem-station', 0.9),
  node('estella-x-captive-refuel-relay', 0.8),
  node('estella-xb-smelting-processing', 0.35),

  node('estella-xid-main-port', 1.5),
  node('estella-xid-services-outfitter-hangar', 0.9),
  node('estella-xid-specialty-cargo', 0.9),
  node('estella-xie-outer-spec-drydock', 2.6),
  node('estella-xie-component-fabrication', 1.2),
  node('estella-xi-skim-hub', 1.2),
  node('estella-xia-chem-station', 1.0),
  node('estella-xib-cryo-transit', 0.6),
  node('estella-xib-organic-chemistry', 0.4),

  node('estella-xiib-transit-station-poi', 0.9),
  node('estella-xiia-volatiles-transit', 0.5),
  node('estella-xiic-isotope-mining', 0.35),
  node('estella-xii-comm-relay-poi', 0.8),

  node('estella-xiii-main-port', 0.8),
  node('estella-xiv-transit-dock', 0.8),
  node('reach-rogue-isotope-mine', 0.35),
  node('reach-rogue-lonely-beacon', 0.5),
  node('reach-comet-fragment-2-poi', 0.5),
  node('reach-comet-fragment-5-poi', 0.5),
  node('deepest-dock-poi', 0.4),
];

const DIRECT_HARDWARE: VhmCargoOption[] = [
  { label: 'VHM propulsion core assembly', massClass: 'heavy', likelihood: 1.0 },
  { label: 'factory-certified main drive module', massClass: 'heavy', likelihood: 0.95 },
  { label: 'metric field coil cartridge', massClass: 'dense', likelihood: 0.75 },
  { label: 'phase-locked field regulator bank', massClass: 'standard', likelihood: 0.85 },
  { label: 'field geometry control stack', massClass: 'standard', likelihood: 0.75 },
  { label: 'sealed orbital maneuvering engine package', massClass: 'heavy', likelihood: 0.7 },
  { label: 'null-field stabilization crate', massClass: 'standard', likelihood: 0.55 },
  { label: 'prototype field regulator package', massClass: 'standard', likelihood: 0.4 },
  { label: 'restricted civilian driveware crate', massClass: 'light', likelihood: 0.45 },
];

const DIRECT_RETURNS: VhmCargoOption[] = [
  { label: 'sealed accident telemetry core', massClass: 'light', likelihood: 0.95 },
  { label: 'VHM warranty black-box vault', massClass: 'light', likelihood: 0.9 },
  { label: 'drive incident evidence locker', massClass: 'light', likelihood: 0.75 },
  { label: 'failed field regulator vault', massClass: 'standard', likelihood: 0.7 },
  { label: 'quarantined propulsion control stack', massClass: 'standard', likelihood: 0.65 },
];

const VHM_PEOPLE: VhmCargoOption[] = [
  { label: 'VHM factory engineer delegation', massClass: 'light', likelihood: 1.0 },
  { label: 'metric-drive audit team', massClass: 'light', likelihood: 0.9 },
  { label: 'warranty arbitration board', massClass: 'light', likelihood: 0.75 },
  { label: 'senior commissioning crew', massClass: 'light', likelihood: 0.85 },
  { label: 'field geometry incident team', massClass: 'light', likelihood: 0.7 },
  { label: 'executive inspection party', massClass: 'light', likelihood: 0.55 },
  { label: 'dealer compliance auditors', massClass: 'light', likelihood: 0.65 },
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

function serviceLeaf(sourceId: string): WeightedNode | undefined {
  return VHM_SERVICE_LEAVES.find(leaf => leaf.id === sourceId);
}

function cargoFor(label: string, massClass: CargoMassClass, templateId: string, sourceId: string, destinationId: string): MissionCargoSpec {
  return {
    label,
    massClass,
    massTons: cargoMassForClass(massClass, `${VHM_ID}:${templateId}:${sourceId}->${destinationId}:${label}`),
  };
}

function templateIdFor(prefix: string, option: VhmCargoOption): string {
  return `${prefix}:${option.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '')}`;
}

function pushCandidate(out: FactionContractCandidate[], templatePrefix: string, sourceId: string, destinationId: string, option: VhmCargoOption, laneLikelihood: number, generosity: number = VHM_BASE_GENEROSITY): void {
  const templateId = templateIdFor(templatePrefix, option);
  const passenger = templatePrefix.startsWith('people-');
  out.push({
    factionId: VHM_ID,
    factionName: VHM_NAME,
    factionTag: VHM_TAG,
    templateId,
    sourceId,
    destinationId,
    cargo: cargoFor(option.label, option.massClass, templateId, sourceId, destinationId),
    likelihood: laneLikelihood * option.likelihood,
    generosity,
    compensationRatio: passenger ? VHM_PEOPLE_COMPENSATION_RATIO : undefined,
    maxCompAllowance: passenger ? VHM_PEOPLE_MAX_COMP_ALLOWANCE : undefined,
    category: passenger ? 'passenger' : undefined,
  });
}

function pickedCargo(options: VhmCargoOption[], seed: number): VhmCargoOption | undefined {
  return weightedPick(options, 1, seed, option => option.likelihood)[0];
}

function generateVhmContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const sourceId = ctx.sourceId;
  const day = Math.floor(ctx.worldTime / 86_400);
  const seed = hashString(`${VHM_ID}:${sourceId}:${day}`);

  if (sourceId === WEYMARK_DEPOT_ID) {
    const destinations = weightedPick(VHM_SERVICE_LEAVES, DIRECT_HARDWARE_DESTINATION_COUNT, seed ^ 0x4834d1e, leaf => leaf.weight);
    destinations.forEach((destination, index) => {
      const cargo = pickedCargo(DIRECT_HARDWARE, seed ^ hashString(`${destination.id}:${index}:hardware`));
      if (cargo) pushCandidate(out, 'direct-hardware', sourceId, destination.id, cargo, 0.55 * destination.weight);
    });

    const returnParty = pickedCargo(VHM_PEOPLE, seed ^ 0x6a1a100);
    if (returnParty) pushCandidate(out, 'people-return-home', sourceId, GAIA_CORPORATE_HQ_ID, returnParty, 0.45, VHM_PEOPLE_GENEROSITY);
  }

  if (sourceId === GAIA_CORPORATE_HQ_ID) {
    const destinations = weightedPick([node(WEYMARK_DEPOT_ID, 1.6), ...VHM_SERVICE_LEAVES], GAIA_OUTBOUND_PEOPLE_DESTINATION_COUNT, seed ^ 0x9a1af1ce, leaf => leaf.weight);
    destinations.forEach((destination, index) => {
      const party = pickedCargo(VHM_PEOPLE, seed ^ hashString(`${destination.id}:${index}:people`));
      if (party) pushCandidate(out, 'people-outbound', sourceId, destination.id, party, 0.55 * destination.weight, VHM_PEOPLE_GENEROSITY);
    });
  }

  const leaf = serviceLeaf(sourceId);
  if (leaf) {
    const returnCargo = pickedCargo(DIRECT_RETURNS, seed ^ 0x915eaf);
    if (returnCargo) pushCandidate(out, 'direct-return-to-weymark', sourceId, WEYMARK_DEPOT_ID, returnCargo, 0.5 * leaf.weight, VHM_RETURN_GENEROSITY);

    const returnParty = pickedCargo(VHM_PEOPLE, seed ^ 0x163a91a);
    if (returnParty) pushCandidate(out, 'people-return-home', sourceId, GAIA_CORPORATE_HQ_ID, returnParty, 0.5 * leaf.weight, VHM_PEOPLE_GENEROSITY);
  }

  return out;
}

export const VOSS_HEINKEL_METRICWERKE_PROVIDER: FactionContractProvider = {
  id: VHM_ID,
  name: VHM_NAME,
  generosity: VHM_BASE_GENEROSITY,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateVhmContracts(ctx);
  },
};
