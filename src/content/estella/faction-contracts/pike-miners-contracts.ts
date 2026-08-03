import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

// Small Hartwell mining houses working Pike's clean-metal strip fields. They share a market
// bucket but post under their own company names. Raw surface lots either go downwell to
// Cinderhook Refinery or up to Pike Ore-Handling Depot; system export starts from the depot.
const PIKE_MINERS_ID = 'pike-mining-companies';
const PIKE_STRIP_MINE = 'estella-va-strip-mine';
const PIKE_ORBITAL_DEPOT = 'estella-va-ore-handling-depot';
const CINDERHOOK = 'estella-v-atmo-refinery';
const ROADSTEAD = 'estella-v-transit-customs';
const HAMMER = 'estella-vi-heavy-cargo-station';
const SVAROG_SHIPYARD = 'estella-via-drydock-station';
const VELES_TERMINAL = 'estella-via-component-supply-station';

const ROSTER_SIZE = 20;

const ORBITAL_LIFT_PAY = { generosity: 0.35, compensationRatio: 0.65, maxCompAllowance: 2 } as const;
const CINDERHOOK_PAY = { generosity: 0.7, compensationRatio: 0.4, maxCompAllowance: 2 } as const;
const ROADSTEAD_STAGING_PAY = { generosity: 0.75, compensationRatio: 0.4, maxCompAllowance: 2 } as const;
const EXPORT_PAY = { generosity: 0.8, compensationRatio: 0.4, maxCompAllowance: 2 } as const;
const SHIPYARD_PAY = { generosity: 0.85, compensationRatio: 0.4, maxCompAllowance: 2 } as const;

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination, issuer) => `${issuer}'s receiver at ${destination} runs a glove over the ${cargo} and grins at the clean metal. "Put this one in the shipyard lane," he says, pointing at the assay tag.`,
  (_candidate, cargo, destination, issuer) => `The ${cargo} comes off at ${destination} in gray dust and magnetic clatter. ${issuer}'s crew has the next lot staged before your clamps unlock.`,
  (_candidate, cargo, destination) => `At ${destination}, Pike handlers move the ${cargo} with the no-nonsense rhythm of people paid by tonnage. A chalk mark on the pallet sends it onward toward Hartwell or the forge worlds.`,
  (_candidate, cargo, destination, issuer) => `${issuer} signs for the ${cargo} at ${destination} under bare work lights. "Keep it segregated from the dirty lots," the foreman says. "Buyer wants clean metal only."`,
  (_candidate, cargo, destination) => `The ${cargo} joins a queue of Pike metal at ${destination}, all bright edges and old frontier accounting. The receipt is short, but the dock crew's relief is plain.`,
];

interface CargoDef {
  surfaceLot: string;
  cinderhookLot: string;
  depotLot: string;
  exportLot: string;
  massClass: CargoMassClass;
  buyers: string[];
}

interface Company {
  name: string;
  slug: string;
  ores: CargoDef[];
}

const NAME_POOL = [
  'Albright Pike Metals',
  'Benton Clean Ore',
  'Bluejack Extraction',
  'Cairn & Cable Mining',
  'Concord Nickel House',
  'Dawes-Lowell Claims',
  'Dry Bell Metals',
  'Elliott Reduction Works',
  'Frontier Ferric',
  'Gadsden Strip Concern',
  'Harker Silicates',
  'Iron Psalm Mining',
  'Juno Claim Works',
  'Keelson Metals',
  'Lariat Extraction',
  'Marrow Ridge Mining',
  'North Pike Combine',
  'Oberlin Ore Company',
  'Red Lantern Claims',
  'Saddleback Metals',
  'Tolliver Clean Metals',
  'Union Crown Ore',
  'Vance Reduced Metals',
  'West Pike Prospecting',
  'Yarrow Strip Works',
];

const CARGOES: CargoDef[] = [
  {
    surfaceLot: 'nickel-iron strip ore',
    cinderhookLot: 'Cinderhook nickel-iron feedstock',
    depotLot: 'orbital nickel-iron export lots',
    exportLot: 'Pike nickel-iron ingots',
    massClass: 'dense',
    buyers: [ROADSTEAD, HAMMER, SVAROG_SHIPYARD],
  },
  {
    surfaceLot: 'clean sulfide concentrate',
    cinderhookLot: 'sulfide refinery concentrate',
    depotLot: 'bagged sulfide concentrate lots',
    exportLot: 'Pike sulfide concentrate',
    massClass: 'dense',
    buyers: [ROADSTEAD, HAMMER, VELES_TERMINAL],
  },
  {
    surfaceLot: 'reduced metal-bearing regolith',
    cinderhookLot: 'reduced-metal refinery feed',
    depotLot: 'reduced metal export lots',
    exportLot: 'reduced-metal billets',
    massClass: 'heavy',
    buyers: [ROADSTEAD, HAMMER, SVAROG_SHIPYARD],
  },
  {
    surfaceLot: 'magnesium-aluminum silicate ore',
    cinderhookLot: 'magnesium-aluminum refinery feed',
    depotLot: 'bagged silicate feedstock',
    exportLot: 'magnesium-aluminum silicate lots',
    massClass: 'heavy',
    buyers: [ROADSTEAD, HAMMER, VELES_TERMINAL],
  },
  {
    surfaceLot: 'low-carbon pressure-metal ore',
    cinderhookLot: 'clean pressure-metal feedstock',
    depotLot: 'pressure-metal export lots',
    exportLot: 'clean pressure-metal billets',
    massClass: 'heavy',
    buyers: [ROADSTEAD, SVAROG_SHIPYARD, VELES_TERMINAL],
  },
  {
    surfaceLot: 'shipyard ballast stone',
    cinderhookLot: 'ballast-grade refinery feed',
    depotLot: 'cut ballast export slabs',
    exportLot: 'certified Pike ballast slabs',
    massClass: 'dense',
    buyers: [ROADSTEAD, SVAROG_SHIPYARD],
  },
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

const ROSTER: Company[] = seededSample(NAME_POOL, ROSTER_SIZE, hashString('pike-roster-v1')).map(name => {
  const h = hashString(name);
  const oreCount = 1 + ((h >>> 4) % 2);
  return { name, slug: slug(name), ores: seededSample(CARGOES, oreCount, h ^ 0x51eed51a) };
});

function makeCargo(label: string, massClass: CargoMassClass, seedKey: string): MissionCargoSpec {
  return { label, massClass, massTons: cargoMassForClass(massClass, `${PIKE_MINERS_ID}:${seedKey}:${label}`) };
}

function candidate(
  company: Company,
  templateId: string,
  sourceId: string,
  destinationId: string,
  cargo: MissionCargoSpec,
  likelihood: number,
  pay: { generosity: number; compensationRatio: number; maxCompAllowance: number },
): FactionContractCandidate {
  return {
    factionId: PIKE_MINERS_ID,
    factionName: company.name,
    templateId,
    sourceId,
    destinationId,
    cargo,
    likelihood,
    ...pay,
  };
}

function generatePikeMinerContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const src = ctx.sourceId;

  for (const co of ROSTER) {
    for (const cargo of co.ores) {
      if (src === PIKE_STRIP_MINE) {
        out.push(candidate(co, `${co.slug}:strip-to-depot:${slug(cargo.depotLot)}`, src, PIKE_ORBITAL_DEPOT, makeCargo(cargo.depotLot, cargo.massClass, `${co.slug}:depot:${src}`), 0.85, ORBITAL_LIFT_PAY));
        out.push(candidate(co, `${co.slug}:strip-to-cinderhook:${slug(cargo.cinderhookLot)}`, src, CINDERHOOK, makeCargo(cargo.cinderhookLot, cargo.massClass, `${co.slug}:cinderhook:${src}`), 0.45, CINDERHOOK_PAY));
      }

      if (src === PIKE_ORBITAL_DEPOT) {
        for (const buyer of cargo.buyers) {
          const roadstead = buyer === ROADSTEAD;
          const shipyard = buyer === SVAROG_SHIPYARD || buyer === VELES_TERMINAL;
          const pay = roadstead ? ROADSTEAD_STAGING_PAY : shipyard ? SHIPYARD_PAY : EXPORT_PAY;
          out.push(candidate(co, `${co.slug}:export:${slug(cargo.exportLot)}:${buyer}`, src, buyer, makeCargo(cargo.exportLot, cargo.massClass, `${co.slug}:export:${buyer}`), roadstead ? 0.65 : shipyard ? 0.42 : 0.55, pay));
        }
      }
    }
  }

  return out.map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const PIKE_MINERS_PROVIDER: FactionContractProvider = {
  id: PIKE_MINERS_ID,
  name: 'Pike Mining Companies',
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generatePikeMinerContracts(ctx);
  },
};
