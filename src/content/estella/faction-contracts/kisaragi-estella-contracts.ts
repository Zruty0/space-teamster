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

const KIS_E_ID = 'kisaragi-yards-estella';
const KIS_E_NAME = 'Kisaragi Yards Estella';
const KIS_E_TAG = 'KIS-E';

// Subsidiary yard freight: premium goods, careful handling, but routine — pays above the
// corporate baseline with no per-template variation.
const KIS_E_BASE_GENEROSITY = 0.8;
const KIS_E_COMPENSATION_RATIO = 0.45;
const KIS_E_MAX_COMP_ALLOWANCE = 2;

const FACILITY_DELIVERY_COUNT = 2;
const FACILITY_BALANCING_COUNT = 2;
const SUPPLIER_CARGO_COUNT = 2;
const FACILITY_CARGO_COUNT = 2;

const TIER_ORDER: Record<KisaragiTier, number> = { Silk: 0, Porcelain: 1, Celadon: 2 };
const KIS_E_TIERS: KisaragiTier[] = ['Silk', 'Porcelain'];

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination, issuer) => `${issuer}'s local yard office at ${destination} receives the ${cargo} with tidy efficiency. "Thank you for keeping the Harmony schedule smooth," the clerk says.`,
  (_candidate, cargo, destination) => `The ${cargo} is moved into ${destination}'s Kisaragi-marked stores under soft lights and strict labels. Local staff are less theatrical than the parent house, but just as exacting.`,
  (_candidate, cargo, destination) => `At ${destination}, KIS-E handlers inspect the ${cargo}, reseal the manifest, and send a brief note of appreciation. Nothing is hurried; nothing is late.`,
  (_candidate, cargo, destination, issuer) => `${issuer} clears the ${cargo} into ${destination}'s yard inventory. "Cadence preserved," the local expeditor says with a small bow.`,
  (_candidate, cargo, destination) => `The ${cargo} joins a neat line of Kisaragi work at ${destination}. A modest receipt arrives, polished and formatted like a formal invitation.`,
];

function node(id: string, weight: number): WeightedNode {
  return { id, weight };
}

const KISARAGI_FACILITIES: WeightedNode[] = [
  node('caravanserai-outfitter-drydock', 1.8),
  node('estella-via-drydock-station', 3.0),
  node('estella-xie-outer-spec-drydock', 2.4),
];

const KISARAGI_SUPPLIERS: WeightedNode[] = [
  node('estella-vi-heavy-cargo-station', 2.5),
  node('estella-via-component-supply-station', 1.8),
  node('estella-xie-component-fabrication', 1.6),
  node('estella-vii-high-vacuum-factory', 1.0),
  node('industrial-refinery-finished-goods', 0.9),
];

const SUPPLIER_ITEMS: KisaragiItem[] = [
  { label: 'cabin liner panels', minTier: 'Silk', massClass: 'standard', likelihood: 1.0 },
  { label: 'acoustic isolation kits', minTier: 'Silk', massClass: 'standard', likelihood: 0.95 },
  { label: 'promenade fit-out crates', minTier: 'Silk', massClass: 'standard', likelihood: 0.85 },
  { label: 'thermal tile lots', minTier: 'Silk', massClass: 'heavy', likelihood: 0.75 },
  { label: 'pressure-door frames', minTier: 'Porcelain', massClass: 'heavy', likelihood: 0.95 },
  { label: 'panoramic viewport assemblies', minTier: 'Porcelain', massClass: 'heavy', likelihood: 0.9 },
  { label: 'exterior fairing panels', minTier: 'Porcelain', massClass: 'heavy', likelihood: 0.85 },
  { label: 'pressure-shell sections', minTier: 'Porcelain', massClass: 'heavy', likelihood: 0.8 },
  { label: 'refinery frame reinforcement lots', minTier: 'Porcelain', massClass: 'heavy', likelihood: 0.7 },
  { label: 'gas-giant corrosion shielding panels', minTier: 'Porcelain', massClass: 'heavy', likelihood: 0.65 },
];

const SUPPLIER_INPUTS: KisaragiCargoOption[] = [
  { label: 'prestige ceramic feedstock', tier: 'Silk', massClass: 'heavy', likelihood: 0.75 },
  { label: 'high-finish pressure alloy lots', tier: 'Silk', massClass: 'heavy', likelihood: 0.8 },
  { label: 'viewport crystal blanks', tier: 'Silk', massClass: 'standard', likelihood: 0.7 },
  { label: 'acoustic metamaterial stock', tier: 'Silk', massClass: 'standard', likelihood: 0.65 },
  { label: 'corrosion-shield laminate blanks', tier: 'Silk', massClass: 'heavy', likelihood: 0.65 },
  { label: 'precision frame castings', tier: 'Silk', massClass: 'heavy', likelihood: 0.7 },
  { label: 'cruise-liner fixture stock', tier: 'Silk', massClass: 'standard', likelihood: 0.6 },
  { label: 'gas-giant shielding laminate blanks', tier: 'Silk', massClass: 'heavy', likelihood: 0.6 },
];

const FACILITY_ITEMS: KisaragiItem[] = [
  { label: 'interior module lots', minTier: 'Silk', massClass: 'standard', likelihood: 1.0 },
  { label: 'fit-out module crates', minTier: 'Silk', massClass: 'standard', likelihood: 0.95 },
  { label: 'acceptance mockup sections', minTier: 'Silk', massClass: 'standard', likelihood: 0.7 },
  { label: 'yard tooling pallets', minTier: 'Silk', massClass: 'heavy', likelihood: 0.75 },
  { label: 'unfinished hull sections', minTier: 'Porcelain', massClass: 'heavy', likelihood: 0.95 },
  { label: 'viewport frame assemblies', minTier: 'Porcelain', massClass: 'heavy', likelihood: 0.8 },
  { label: 'pressure-shell rework lots', minTier: 'Porcelain', massClass: 'heavy', likelihood: 0.75 },
];

const PAPERWORK: KisaragiCargoOption[] = [
  { label: 'yard acceptance documents', tier: 'Silk', massClass: 'light', likelihood: 0.6 },
  { label: 'client specification archives', tier: 'Porcelain', massClass: 'light', likelihood: 0.55 },
  { label: 'hull warranty packets', tier: 'Porcelain', massClass: 'light', likelihood: 0.5 },
  { label: 'registry and fit-out records', tier: 'Silk', massClass: 'light', likelihood: 0.45 },
];

const ADMIN_DESTINATIONS: WeightedNode[] = [
  node('caravanserai-highliner-bay-poi', 1.0),
  node('estella-iii-finance-city', 0.7),
];

function allowedTiers(item: KisaragiItem, tiers: KisaragiTier[]): KisaragiTier[] {
  return tiers.filter(tier => TIER_ORDER[tier] >= TIER_ORDER[item.minTier]);
}

function expandItems(items: KisaragiItem[], tiers: KisaragiTier[]): KisaragiCargoOption[] {
  return items.flatMap(item => allowedTiers(item, tiers).map(tier => ({
    label: `${tier}-class ${item.label}`,
    tier,
    massClass: item.massClass,
    likelihood: item.likelihood * (tier === 'Silk' ? 1 : 0.85),
  })));
}

const SUPPLIER_CARGO = [...expandItems(SUPPLIER_ITEMS, KIS_E_TIERS), ...SUPPLIER_INPUTS];
const FACILITY_CARGO = expandItems(FACILITY_ITEMS, KIS_E_TIERS);

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
    massTons: cargoMassForClass(option.massClass, `${KIS_E_ID}:${templateId}:${sourceId}->${destinationId}:${option.label}`),
  };
}

function templateIdFor(prefix: string, option: KisaragiCargoOption): string {
  return `${prefix}:${option.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '')}`;
}

function pushCandidate(out: FactionContractCandidate[], templatePrefix: string, sourceId: string, destinationId: string, option: KisaragiCargoOption, laneLikelihood: number): void {
  const templateId = templateIdFor(templatePrefix, option);
  out.push({
    factionId: KIS_E_ID,
    factionName: KIS_E_NAME,
    factionTag: KIS_E_TAG,
    templateId,
    sourceId,
    destinationId,
    cargo: cargoFor(option, templateId, sourceId, destinationId),
    likelihood: laneLikelihood * option.likelihood,
    generosity: KIS_E_BASE_GENEROSITY,
    compensationRatio: KIS_E_COMPENSATION_RATIO,
    maxCompAllowance: KIS_E_MAX_COMP_ALLOWANCE,
  });
}

function isFacility(sourceId: string): boolean {
  return KISARAGI_FACILITIES.some(facility => facility.id === sourceId);
}

function isSupplier(sourceId: string): boolean {
  return KISARAGI_SUPPLIERS.some(supplier => supplier.id === sourceId);
}

function generateKisEContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const sourceId = ctx.sourceId;
  const day = Math.floor(ctx.worldTime / 86_400);
  const seed = hashString(`${KIS_E_ID}:${sourceId}:${day}`);

  if (isSupplier(sourceId)) {
    const facilities = weightedPick(KISARAGI_FACILITIES, FACILITY_DELIVERY_COUNT, seed ^ 0x51eaf00d, facility => facility.weight);
    facilities.forEach((facility, facilityIndex) => {
      const cargoLots = weightedPick(SUPPLIER_CARGO, SUPPLIER_CARGO_COUNT, seed ^ hashString(`${facility.id}:${facilityIndex}:supplier`), option => option.likelihood);
      for (const cargo of cargoLots) pushCandidate(out, 'supplier-to-facility', sourceId, facility.id, cargo, 0.7 * facility.weight);
    });
  }

  if (isFacility(sourceId)) {
    const otherFacilities = weightedPick(KISARAGI_FACILITIES.filter(facility => facility.id !== sourceId), FACILITY_BALANCING_COUNT, seed ^ 0xba1a9ce, facility => facility.weight);
    otherFacilities.forEach((facility, facilityIndex) => {
      const cargoLots = weightedPick(FACILITY_CARGO, FACILITY_CARGO_COUNT, seed ^ hashString(`${facility.id}:${facilityIndex}:facility`), option => option.likelihood);
      for (const cargo of cargoLots) pushCandidate(out, 'facility-balancing', sourceId, facility.id, cargo, 0.65 * facility.weight);
    });

    for (const destination of ADMIN_DESTINATIONS) {
      const [paperwork] = weightedPick(PAPERWORK, 1, seed ^ hashString(`${destination.id}:paperwork`), option => option.likelihood);
      if (paperwork) pushCandidate(out, 'facility-admin', sourceId, destination.id, paperwork, 0.35 * destination.weight);
    }
  }

  return out.map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const KISARAGI_YARDS_ESTELLA_PROVIDER: FactionContractProvider = {
  id: KIS_E_ID,
  name: KIS_E_NAME,
  generosity: KIS_E_BASE_GENEROSITY,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateKisEContracts(ctx);
  },
};
