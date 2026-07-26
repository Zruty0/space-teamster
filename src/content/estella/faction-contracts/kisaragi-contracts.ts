import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

type KisaragiTier = 'Silk' | 'Porcelain' | 'Celadon';

interface WeightedNode {
  id: string;
  weight: number;
}

interface KisaragiItem {
  label: string;
  minTier: KisaragiTier;
  massClass: CargoMassClass;
  likelihood: number;
}

interface KisaragiCargoOption {
  label: string;
  tier: KisaragiTier;
  massClass: CargoMassClass;
  likelihood: number;
}

const KIS_ID = 'kisaragi-harmony-yards';
const KIS_NAME = 'Kisaragi Harmony Yards';
const KIS_TAG = 'KIS';

// The richest client in the system. Kisaragi pays fixed premium rates for perfection and does
// not reimburse fuel, even for people movement. Sloppy burns are reputation damage.
const KIS_BASE_GENEROSITY = 1.5;
const KIS_CELADON_GENEROSITY = 1.7;
const KIS_PEOPLE_GENEROSITY = 1.2;
const KIS_COMPENSATION_RATIO = 0;
const KIS_MAX_COMP_ALLOWANCE = 2;

const GAIA_HQ_ID = 'estella-iii-finance-city';
const HIGHLINER_BAY_ID = 'caravanserai-highliner-bay-poi';
const IMPORT_DESTINATION_COUNT = 2;
const IMPORT_CARGO_PER_DESTINATION = 2;
const FACILITY_TRANSFER_DESTINATION_COUNT = 2;
const FACILITY_TRANSFER_CARGO_PER_DESTINATION = 2;
const OUTBOUND_PEOPLE_DESTINATION_COUNT = 2;

const TIER_ORDER: Record<KisaragiTier, number> = { Silk: 0, Porcelain: 1, Celadon: 2 };
const KIS_TIERS: KisaragiTier[] = ['Silk', 'Porcelain', 'Celadon'];

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination, issuer) => `${issuer}'s cargo dock at ${destination} is pristine and faintly scented with lavender. "Thank you for completing the delivery harmoniously," a smiling receptionist says.`,
  (_candidate, cargo, destination) => `The ${cargo} is received at ${destination} by attendants in spotless yard coats. They bow to the manifest, then to you, and the payment arrives without a fingerprint on it.`,
  (_candidate, cargo, destination, issuer) => `${issuer} staff guide the ${cargo} into ${destination} as if it were entering a gallery. The thank-you note calls your arrival "properly balanced."`,
  (_candidate, cargo, destination) => `At ${destination}, Kisaragi inspectors approve the ${cargo} with soft voices and exact instruments. "A graceful handoff," one says before the porcelain-white terminal marks completion.`,
  (_candidate, cargo, destination) => `The ${cargo} vanishes into ${destination}'s polished yard chain. Someone offers tea while the BBS releases payment with elegant finality.`,
];

function node(id: string, weight: number): WeightedNode {
  return { id, weight };
}

const KISARAGI_FACILITIES: WeightedNode[] = [
  node('caravanserai-outfitter-drydock', 1.8),
  node('estella-via-drydock-station', 3.0),
  node('estella-xie-outer-spec-drydock', 2.4),
];

const PRESTIGE_RECORD_DESTINATIONS: WeightedNode[] = [
  node(HIGHLINER_BAY_ID, 1.2),
  node('estella-iii-luxury-orbital-habitat', 0.8),
  node(GAIA_HQ_ID, 0.9),
];

const CELADON_IMPORTS: KisaragiCargoOption[] = [
  { label: 'Celadon-class hull elements', tier: 'Celadon', massClass: 'heavy', likelihood: 1.0 },
  { label: 'Celadon-class pressure-shell sections', tier: 'Celadon', massClass: 'heavy', likelihood: 0.95 },
  { label: 'Celadon-class luxury liner modules', tier: 'Celadon', massClass: 'heavy', likelihood: 0.9 },
  { label: 'Celadon-class highliner frame interface rings', tier: 'Celadon', massClass: 'dense', likelihood: 0.65 },
  { label: 'Celadon-class signature shell modules', tier: 'Celadon', massClass: 'heavy', likelihood: 0.8 },
  { label: 'Celadon-class docking collar assemblies', tier: 'Celadon', massClass: 'heavy', likelihood: 0.75 },
];

const FACILITY_TRANSFER_ITEMS: KisaragiItem[] = [
  { label: 'cabin liner panels', minTier: 'Silk', massClass: 'standard', likelihood: 0.85 },
  { label: 'acoustic fit-out kits', minTier: 'Silk', massClass: 'standard', likelihood: 0.8 },
  { label: 'promenade module lots', minTier: 'Silk', massClass: 'standard', likelihood: 0.75 },
  { label: 'fit-out module crates', minTier: 'Silk', massClass: 'standard', likelihood: 0.75 },
  { label: 'pressure-door rework frames', minTier: 'Porcelain', massClass: 'heavy', likelihood: 0.85 },
  { label: 'panoramic viewport rework assemblies', minTier: 'Porcelain', massClass: 'heavy', likelihood: 0.8 },
  { label: 'pressure-shell rework lots', minTier: 'Porcelain', massClass: 'heavy', likelihood: 0.8 },
  { label: 'docking collar rework assemblies', minTier: 'Porcelain', massClass: 'heavy', likelihood: 0.7 },
  { label: 'matching shell sections', minTier: 'Celadon', massClass: 'heavy', likelihood: 0.75 },
  { label: 'acceptance mockup sections', minTier: 'Celadon', massClass: 'standard', likelihood: 0.6 },
  { label: 'luxury liner module rework lots', minTier: 'Celadon', massClass: 'heavy', likelihood: 0.7 },
];

const PRESTIGE_RECORDS: KisaragiCargoOption[] = [
  { label: 'Celadon-class acceptance records', tier: 'Celadon', massClass: 'light', likelihood: 0.8 },
  { label: 'Celadon-class registry vault', tier: 'Celadon', massClass: 'light', likelihood: 0.65 },
  { label: 'Celadon-class client acceptance suite', tier: 'Celadon', massClass: 'standard', likelihood: 0.55 },
  { label: 'Porcelain-class warranty evidence crates', tier: 'Porcelain', massClass: 'light', likelihood: 0.7 },
  { label: 'client specification archive', tier: 'Silk', massClass: 'light', likelihood: 0.55 },
];

const KIS_PEOPLE: KisaragiCargoOption[] = [
  { label: 'Kisaragi master shipwright delegation', tier: 'Celadon', massClass: 'light', likelihood: 1.0 },
  { label: 'hull acceptance board', tier: 'Porcelain', massClass: 'light', likelihood: 0.85 },
  { label: 'interior finish inspectors', tier: 'Silk', massClass: 'light', likelihood: 0.75 },
  { label: 'executive fitting delegation', tier: 'Celadon', massClass: 'light', likelihood: 0.65 },
  { label: 'owner representative party', tier: 'Porcelain', massClass: 'light', likelihood: 0.6 },
  { label: 'Kisaragi recovery rotation crew', tier: 'Silk', massClass: 'standard', likelihood: 0.75 },
];

function allowedTiers(item: KisaragiItem, tiers: KisaragiTier[]): KisaragiTier[] {
  return tiers.filter(tier => TIER_ORDER[tier] >= TIER_ORDER[item.minTier]);
}

function expandItems(items: KisaragiItem[], tiers: KisaragiTier[]): KisaragiCargoOption[] {
  return items.flatMap(item => allowedTiers(item, tiers).map(tier => ({
    label: `${tier}-class ${item.label}`,
    tier,
    massClass: item.massClass,
    likelihood: item.likelihood * (tier === 'Celadon' ? 1.15 : tier === 'Porcelain' ? 0.9 : 0.65),
  })));
}

const FACILITY_TRANSFER_CARGO = expandItems(FACILITY_TRANSFER_ITEMS, KIS_TIERS);

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

function cargoFor(option: KisaragiCargoOption, templateId: string, sourceId: string, destinationId: string): MissionCargoSpec {
  return {
    label: option.label,
    massClass: option.massClass,
    massTons: cargoMassForClass(option.massClass, `${KIS_ID}:${templateId}:${sourceId}->${destinationId}:${option.label}`),
  };
}

function templateIdFor(prefix: string, option: KisaragiCargoOption): string {
  return `${prefix}:${option.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '')}`;
}

function pushCandidate(out: FactionContractCandidate[], templatePrefix: string, sourceId: string, destinationId: string, option: KisaragiCargoOption, laneLikelihood: number): void {
  const templateId = templateIdFor(templatePrefix, option);
  const passenger = templatePrefix.startsWith('people-');
  out.push({
    factionId: KIS_ID,
    factionName: KIS_NAME,
    factionTag: KIS_TAG,
    templateId,
    sourceId,
    destinationId,
    cargo: cargoFor(option, templateId, sourceId, destinationId),
    likelihood: laneLikelihood * option.likelihood,
    generosity: passenger ? KIS_PEOPLE_GENEROSITY : option.tier === 'Celadon' ? KIS_CELADON_GENEROSITY : KIS_BASE_GENEROSITY,
    compensationRatio: KIS_COMPENSATION_RATIO,
    maxCompAllowance: KIS_MAX_COMP_ALLOWANCE,
    category: passenger ? 'passenger' : undefined,
  });
}

function isFacility(sourceId: string): boolean {
  return KISARAGI_FACILITIES.some(facility => facility.id === sourceId);
}

function pickedCargo(options: KisaragiCargoOption[], seed: number): KisaragiCargoOption | undefined {
  return weightedPick(options, 1, seed, option => option.likelihood)[0];
}

function generateKisContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const sourceId = ctx.sourceId;
  const day = Math.floor(ctx.worldTime / 86_400);
  const seed = hashString(`${KIS_ID}:${sourceId}:${day}`);

  if (sourceId === HIGHLINER_BAY_ID) {
    const destinations = weightedPick(KISARAGI_FACILITIES, IMPORT_DESTINATION_COUNT, seed ^ 0xce1ad0, facility => facility.weight);
    destinations.forEach((destination, destinationIndex) => {
      const cargoLots = weightedPick(CELADON_IMPORTS, IMPORT_CARGO_PER_DESTINATION, seed ^ hashString(`${destination.id}:${destinationIndex}:import`), cargo => cargo.likelihood);
      for (const cargo of cargoLots) pushCandidate(out, 'celadon-import', sourceId, destination.id, cargo, 0.5 * destination.weight);
    });
  }

  if (sourceId === GAIA_HQ_ID) {
    const destinations = weightedPick(KISARAGI_FACILITIES, OUTBOUND_PEOPLE_DESTINATION_COUNT, seed ^ 0x917ad1a, facility => facility.weight);
    destinations.forEach((destination, index) => {
      const people = pickedCargo(KIS_PEOPLE, seed ^ hashString(`${destination.id}:${index}:outbound`));
      if (people) pushCandidate(out, 'people-outbound', sourceId, destination.id, people, 0.5 * destination.weight);
    });
  }

  if (isFacility(sourceId)) {
    const transferDestinations = weightedPick(KISARAGI_FACILITIES.filter(facility => facility.id !== sourceId), FACILITY_TRANSFER_DESTINATION_COUNT, seed ^ 0xba1a9ce, facility => facility.weight);
    transferDestinations.forEach((destination, index) => {
      const cargoLots = weightedPick(FACILITY_TRANSFER_CARGO, FACILITY_TRANSFER_CARGO_PER_DESTINATION, seed ^ hashString(`${destination.id}:${index}:transfer`), cargo => cargo.likelihood);
      for (const cargo of cargoLots) pushCandidate(out, 'facility-prestige-transfer', sourceId, destination.id, cargo, 0.45 * destination.weight);
    });

    for (const destination of PRESTIGE_RECORD_DESTINATIONS) {
      const records = pickedCargo(PRESTIGE_RECORDS, seed ^ hashString(`${destination.id}:records`));
      if (records) pushCandidate(out, 'prestige-records', sourceId, destination.id, records, 0.32 * destination.weight);
    }

    const returnPeople = pickedCargo(KIS_PEOPLE, seed ^ 0xacab1e);
    if (returnPeople) pushCandidate(out, 'people-return-hearth', sourceId, GAIA_HQ_ID, returnPeople, 0.55);
  }

  return out.map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const KISARAGI_HARMONY_YARDS_PROVIDER: FactionContractProvider = {
  id: KIS_ID,
  name: KIS_NAME,
  generosity: KIS_BASE_GENEROSITY,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateKisContracts(ctx);
  },
};
