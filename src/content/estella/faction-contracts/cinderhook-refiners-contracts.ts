import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

// Cinderhook's small refining houses turn Hartwell/Pike feedstock into brokerable clean lots.
// Inbound raw-feed work belongs to Pike/Dawes extractors; this provider handles Cinderhook output.
const CINDERHOOK_REFINERS_ID = 'cinderhook-refining-houses';
const CINDERHOOK = 'estella-v-atmo-refinery';
const ROADSTEAD = 'estella-v-transit-customs';
const HAMMER = 'estella-vi-heavy-cargo-station';
const SVAROG_SHIPYARD = 'estella-via-drydock-station';
const YARDSTOCK = 'estella-via-component-supply-station';
const TESSERA_FACTORY = 'estella-vii-high-vacuum-factory';

const ROSTER_SIZE = 16;

const ROADSTEAD_STAGING_PAY = { generosity: 0.75, compensationRatio: 0.4, maxCompAllowance: 2 } as const;
const ROUTINE_EXPORT_PAY = { generosity: 0.8, compensationRatio: 0.4, maxCompAllowance: 2 } as const;
const CERTIFIED_EXPORT_PAY = { generosity: 0.85, compensationRatio: 0.35, maxCompAllowance: 2 } as const;

interface RefinedLot {
  label: string;
  massClass: CargoMassClass;
  buyers: string[];
  certified?: boolean;
}

interface Company {
  name: string;
  slug: string;
  lots: RefinedLot[];
}

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination, issuer) => `${issuer}'s receiver at ${destination} signs for the ${cargo} with soot still on his cuffs. "Send it to the clean-metal cage before dust gets into the sample bags," he says.`,
  (_candidate, cargo, destination, issuer) => `The ${cargo} comes off at ${destination} tagged with fresh assay stamps and refinery heat still in the paperwork. ${issuer}'s clerk releases payment before the sample seal cools.`,
  (_candidate, cargo, destination) => `At ${destination}, handlers move the ${cargo} into the export lane with Hartwell's usual mix of frontier haste and careful accounting. The manifest clears without argument.`,
  (_candidate, cargo, destination, issuer) => `${issuer} logs the ${cargo} at ${destination} under yellow work lights. "Good batch," the dock foreman says. "Tell Cinderhook the slag numbers held."`,
  (_candidate, cargo, destination) => `The ${cargo} is swallowed into ${destination}'s materials queue, all stamped coupons and clean-metal tags. The receipt smells faintly of hot dust.`,
];

const NAME_POOL = [
  'Ashgate Materials',
  'Cinderhook Alloy & Assay',
  'Concord Metals Office',
  'Dawes-Cinder Refining',
  'Furnace Creek Combine',
  'Hook & Crucible',
  'Old Scaffold Metals',
  'Pike-Hartwell Reduction Co.',
  'Red Stack Refiners',
  'Roadstead Reduction',
  'Sable Flue Materials',
  'Saint Elmo Assay House',
  'South Hook Refining',
  'Torchline Metals',
  'Vesta Draft Refiners',
  'West Cinder Materials',
  'Yellow Stack Alloys',
  'Zincgate Reduction',
];

const LOTS: RefinedLot[] = [
  { label: 'certified clean-metal lots', massClass: 'heavy', buyers: [ROADSTEAD, HAMMER, YARDSTOCK] },
  { label: 'pressure-alloy billets', massClass: 'heavy', buyers: [ROADSTEAD, HAMMER, SVAROG_SHIPYARD], certified: true },
  { label: 'reduced-metal ingots', massClass: 'dense', buyers: [ROADSTEAD, HAMMER] },
  { label: 'low-carbon plate feedstock', massClass: 'heavy', buyers: [ROADSTEAD, SVAROG_SHIPYARD, YARDSTOCK], certified: true },
  { label: 'certified weld stock', massClass: 'standard', buyers: [ROADSTEAD, SVAROG_SHIPYARD, YARDSTOCK], certified: true },
  { label: 'instrument-grade alloy blanks', massClass: 'standard', buyers: [ROADSTEAD, TESSERA_FACTORY, YARDSTOCK], certified: true },
  { label: 'sulfide byproduct drums', massClass: 'standard', buyers: [ROADSTEAD, HAMMER] },
  { label: 'ceramic flux precursors', massClass: 'standard', buyers: [ROADSTEAD, TESSERA_FACTORY] },
  { label: 'clean ballast slabs', massClass: 'dense', buyers: [ROADSTEAD, SVAROG_SHIPYARD], certified: true },
];

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function slug(text: string): string {
  return text.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '');
}

function seededSample<T>(pool: T[], count: number, seed: number): T[] {
  const out = pool.slice();
  let s = seed >>> 0 || 1;
  const rng = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff; };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, count);
}

const ROSTER: Company[] = seededSample(NAME_POOL, ROSTER_SIZE, hashString('cinderhook-roster-v1')).map(name => {
  const h = hashString(name);
  const lotCount = 1 + ((h >>> 6) % 2);
  return { name, slug: slug(name), lots: seededSample(LOTS, lotCount, h ^ 0xc1d3a001) };
});

function makeCargo(label: string, massClass: CargoMassClass, seedKey: string): MissionCargoSpec {
  return { label, massClass, massTons: cargoMassForClass(massClass, `${CINDERHOOK_REFINERS_ID}:${seedKey}:${label}`) };
}

function candidate(company: Company, lot: RefinedLot, destinationId: string): FactionContractCandidate {
  const roadstead = destinationId === ROADSTEAD;
  const pay = roadstead ? ROADSTEAD_STAGING_PAY : lot.certified ? CERTIFIED_EXPORT_PAY : ROUTINE_EXPORT_PAY;
  const cargo = makeCargo(lot.label, lot.massClass, `${company.slug}:${destinationId}:${lot.label}`);
  const likelihood = roadstead ? 0.75 : lot.certified ? 0.32 : 0.4;
  return {
    factionId: CINDERHOOK_REFINERS_ID,
    factionName: company.name,
    templateId: `${company.slug}:refined:${slug(lot.label)}:${destinationId}`,
    sourceId: CINDERHOOK,
    destinationId,
    cargo,
    likelihood,
    ...pay,
  };
}

function generateCinderhookContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  if (ctx.sourceId !== CINDERHOOK) return [];
  const out: FactionContractCandidate[] = [];
  for (const co of ROSTER) {
    for (const lot of co.lots) {
      for (const destinationId of lot.buyers) out.push(candidate(co, lot, destinationId));
    }
  }
  return out.map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const CINDERHOOK_REFINERS_PROVIDER: FactionContractProvider = {
  id: CINDERHOOK_REFINERS_ID,
  name: 'Cinderhook Refining Houses',
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateCinderhookContracts(ctx);
  },
};
