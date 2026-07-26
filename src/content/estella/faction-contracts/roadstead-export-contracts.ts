import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

// Roadstead is Hartwell's orbital trade membrane: customs, brokerage, and consolidation.
// These brokers sell Pike/Cinderhook clean-metal lots onward; they do not refine or mine.
const ROADSTEAD_EXPORT_ID = 'roadstead-export-brokers';
const ROADSTEAD = 'estella-v-transit-customs';
const HAMMER = 'estella-vi-heavy-cargo-station';
const SVAROG_SHIPYARD = 'estella-via-drydock-station';
const YARDSTOCK = 'estella-via-component-supply-station';
const TESSERA_FACTORY = 'estella-vii-high-vacuum-factory';
const CARAVANSERAI = 'caravanserai-main-commercial-dock';

const ROSTER_SIZE = 16;
const ROUTINE_PAY = { generosity: 0.75, compensationRatio: 0.4, maxCompAllowance: 2 } as const;
const CERTIFIED_PAY = { generosity: 0.8, compensationRatio: 0.35, maxCompAllowance: 2 } as const;

interface ExportLot {
  label: string;
  massClass: CargoMassClass;
  buyers: string[];
  certified?: boolean;
}

interface Broker {
  name: string;
  slug: string;
  lots: ExportLot[];
}

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination, issuer) => `${issuer}'s export clerk at ${destination} signs for the ${cargo} under a wall of Hartwell claim maps. "Roadstead clears it, the system buys it," she says.`,
  (_candidate, cargo, destination) => `The ${cargo} leaves Roadstead paper behind and enters ${destination}'s buyer chain. The broker's receipt is mostly stamps, liens, and satisfied arithmetic.`,
  (_candidate, cargo, destination, issuer) => `${issuer} clears the ${cargo} into ${destination} with a customs seal still warm from Roadstead. "Clean lot, clean title," the receiver says.`,
  (_candidate, cargo, destination) => `At ${destination}, the ${cargo} is treated less like ore than like money with mass. Hartwell's brokerage cut vanishes into the manifest before payment clears.`,
  (_candidate, cargo, destination) => `The ${cargo} is accepted at ${destination} with assay stamps facing outward. Someone has already sold it twice on paper by the time it leaves your bay.`,
];

const NAME_POOL = [
  'Roadstead Export Desk',
  'Concord Clean-Metal Factors',
  'Hartwell Forward Metals',
  'Roadstead Assay Brokerage',
  'Cinder-Pike Export House',
  'Frontier Metal Factors',
  'Claimline Materials',
  'Orbital Lien & Lot',
  'Pike-Cinder Sales Office',
  'Roadstead Customs Brokerage',
  'Old Scaffold Export Trust',
  'Concord Billet Exchange',
  'Hartwell Metal Office',
  'Red Dust Exporters',
  'Roadstead Clean Lot Company',
  'Charter Metal Board',
  'Camps Frontier Factors',
  'Surveyor Export Office',
];

const LOTS: ExportLot[] = [
  { label: 'Hartwell clean-metal lots', massClass: 'heavy', buyers: [HAMMER, SVAROG_SHIPYARD, YARDSTOCK] },
  { label: 'brokered Pike nickel-iron ingots', massClass: 'dense', buyers: [HAMMER, SVAROG_SHIPYARD] },
  { label: 'Cinderhook pressure-alloy billets', massClass: 'heavy', buyers: [HAMMER, SVAROG_SHIPYARD, YARDSTOCK], certified: true },
  { label: 'certified low-carbon plate stock', massClass: 'heavy', buyers: [SVAROG_SHIPYARD, YARDSTOCK], certified: true },
  { label: 'instrument-grade Hartwell alloy blanks', massClass: 'standard', buyers: [TESSERA_FACTORY], certified: true },
  { label: 'reduced-metal billet lots', massClass: 'heavy', buyers: [HAMMER, CARAVANSERAI] },
  { label: 'Pike sulfide concentrate', massClass: 'dense', buyers: [HAMMER, YARDSTOCK] },
  { label: 'certified Pike ballast slabs', massClass: 'dense', buyers: [SVAROG_SHIPYARD], certified: true },
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

const ROSTER: Broker[] = seededSample(NAME_POOL, ROSTER_SIZE, hashString('roadstead-export-roster-v1')).map(name => {
  const h = hashString(name);
  const lotCount = 1 + ((h >>> 5) % 2);
  return { name, slug: slug(name), lots: seededSample(LOTS, lotCount, h ^ 0x20ad5ead) };
});

function makeCargo(lot: ExportLot, seedKey: string): MissionCargoSpec {
  return { label: lot.label, massClass: lot.massClass, massTons: cargoMassForClass(lot.massClass, `${ROADSTEAD_EXPORT_ID}:${seedKey}:${lot.label}`) };
}

function candidate(broker: Broker, lot: ExportLot, destinationId: string): FactionContractCandidate {
  return {
    factionId: ROADSTEAD_EXPORT_ID,
    factionName: broker.name,
    templateId: `${broker.slug}:export:${slug(lot.label)}:${destinationId}`,
    sourceId: ROADSTEAD,
    destinationId,
    cargo: makeCargo(lot, `${broker.slug}:${destinationId}`),
    likelihood: lot.certified ? 0.42 : 0.55,
    ...(lot.certified ? CERTIFIED_PAY : ROUTINE_PAY),
  };
}

function generateRoadsteadExportContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  if (ctx.sourceId !== ROADSTEAD) return [];
  const out: FactionContractCandidate[] = [];
  for (const broker of ROSTER) {
    for (const lot of broker.lots) {
      for (const destinationId of lot.buyers) out.push(candidate(broker, lot, destinationId));
    }
  }
  return out.map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const ROADSTEAD_EXPORT_BROKERS_PROVIDER: FactionContractProvider = {
  id: ROADSTEAD_EXPORT_ID,
  name: 'Roadstead Export Brokers',
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateRoadsteadExportContracts(ctx);
  },
};
