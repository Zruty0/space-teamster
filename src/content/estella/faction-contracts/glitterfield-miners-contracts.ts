import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

// The many small Hartwell mining companies working Glitterfield. They are too small to carry a
// system-market identifier (no tag) — only their company name shows. All ore funnels to the
// Cupola Station refinery; the miners haul their own refined ingots onward to in-system buyers.
const MINERS_ID = 'glitterfield-miners';

// Glitterfield stations.
const CUPOLA_ORE_INTAKE = 'industrial-refinery-ore-intake';
const CUPOLA_INGOT_BAY = 'industrial-refinery-finished-goods';
const DEPOTS = ['grubstake-depot-dock', 'highgrade-depot-dock', 'slagfoot-depot-dock', 'deepcut-depot-dock'];

// External nodes (in-system only — ore never leaves the system).
const HAMMER = 'estella-vi-heavy-cargo-station';
const SVAROG = 'estella-via-drydock-station';
const ORE_BUYERS = [HAMMER, SVAROG];
const HARTWELL_CREW = ['estella-v-transit-customs', 'estella-v-capital-settlement']; // Roadstead, Concord
const SUPPLY_SOURCES = ['caravanserai-main-commercial-dock', 'estella-v-transit-customs'];

// Pay. Hartwell capitalists pay standard fixed price; in-cluster ore hops (Depot -> Cupola) are
// deliberately low-risk / low-reward: generosity dropped ~0.5 and half the fuel reimbursed.
const STANDARD_PAY = { generosity: 1.3 } as const;
const IN_CLUSTER_PAY = { generosity: 0.8, compensationRatio: 0.5, maxCompAllowance: 2 } as const;

interface OreDef {
  ore: string;
  ingot: string;
}

const ORES: OreDef[] = [
  { ore: 'nickel-iron ore', ingot: 'nickel-iron ingots' },
  { ore: 'cobalt ore', ingot: 'cobalt ingots' },
  { ore: 'platinum-group ore', ingot: 'platinum-group ingots' },
  { ore: 'chromite ore', ingot: 'ferrochrome ingots' },
  { ore: 'nickel concentrate', ingot: 'nickel ingots' },
  { ore: 'rare-earth-bearing ore', ingot: 'rare-earth oxides' },
];

const SUPPLIES = [
  'mining supplies', 'drill stock', 'blasting charges', 'cutting heads',
  'shoring frames', 'life-support consumables', 'oxygen canisters', 'ration packs',
];

const NAME_POOL = [
  'Brannock Extraction', 'Redlaw Mining', 'Kestrel Claims', 'Dury Ore Co.', 'Halvorsen Diggings',
  'Prentice Metals', 'Corrigan & Sons', 'Maddox Mineral', 'Tolliver Mining', 'Ashgrove Extraction',
  'Vanmeer Ore Co.', 'Skelt Diggings', 'Orlick Metals', 'Penhallow Claims', 'Draycott Mining',
  'Sutro Minerals', 'Quennell Extraction', 'Rvarden Ore Co.', 'Threadgood Mining', 'Bexlow Minerals',
  'Cardew Claims', 'Merrick Diggings', 'Stannard Mineral', 'Ledbetter Mining', 'Pryce Ore Co.',
  'Gannet Extraction',
];
const ROSTER_SIZE = 20;

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

// Seeded distinct sample of `count` items (Fisher-Yates prefix).
function seededSample<T>(pool: T[], count: number, seed: number): T[] {
  const idx = pool.map((_, i) => i);
  let s = seed >>> 0 || 1;
  const rng = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff; };
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, Math.min(count, pool.length)).map(i => pool[i]);
}

function pick<T>(pool: T[], seed: number): T {
  return pool[(seed >>> 0) % pool.length];
}

interface Company {
  name: string;
  slug: string;
  depot: string;
  ores: OreDef[];
}

// Stable roster: sample 20 companies, each assigned a home depot and 1-2 ores.
const ROSTER: Company[] = seededSample(NAME_POOL, ROSTER_SIZE, hashString('glitterfield-roster-v1')).map(name => {
  const h = hashString(name);
  const oreCount = 1 + ((h >>> 5) % 2); // 1 or 2
  return {
    name,
    slug: slug(name),
    depot: DEPOTS[h % DEPOTS.length],
    ores: seededSample(ORES, oreCount, h ^ 0x51ed5eed),
  };
});

function makeCargo(label: string, massClass: CargoMassClass, seedKey: string): MissionCargoSpec {
  return { label, massClass, massTons: cargoMassForClass(massClass, `${MINERS_ID}:${seedKey}:${label}`) };
}

function candidate(
  company: Company,
  templateId: string,
  sourceId: string,
  destinationId: string,
  cargo: MissionCargoSpec,
  likelihood: number,
  pay: { generosity: number; compensationRatio?: number; maxCompAllowance?: number },
): FactionContractCandidate {
  return {
    factionId: MINERS_ID,
    factionName: company.name, // shown as issuer; no tag (too small for the market)
    templateId,
    sourceId,
    destinationId,
    cargo,
    likelihood,
    ...pay,
  };
}

function generateGlitterfieldMinerContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const src = ctx.sourceId;
  const day = Math.floor(ctx.worldTime / 86_400);

  for (const co of ROSTER) {
    // At the company's home depot: ore to the refinery (in-cluster, low-risk/low-reward) and
    // occasional raw ore direct to in-system buyers.
    if (src === co.depot) {
      for (const o of co.ores) {
        out.push(candidate(co, `${co.slug}:ore-refinery:${slug(o.ore)}`, src, CUPOLA_ORE_INTAKE, makeCargo(o.ore, 'dense', `${co.slug}:ore:${src}`), 0.9, IN_CLUSTER_PAY));
        for (const buyer of ORE_BUYERS) {
          out.push(candidate(co, `${co.slug}:ore-direct:${slug(o.ore)}`, src, buyer, makeCargo(o.ore, 'dense', `${co.slug}:oredirect:${src}->${buyer}`), 0.18, STANDARD_PAY));
        }
      }
    }

    // At the Cupola ingot bay: the miners haul their own refined metal onward to buyers.
    if (src === CUPOLA_INGOT_BAY) {
      for (const o of co.ores) {
        for (const buyer of ORE_BUYERS) {
          out.push(candidate(co, `${co.slug}:ingots:${slug(o.ingot)}:${buyer}`, src, buyer, makeCargo(o.ingot, 'heavy', `${co.slug}:ingot:${buyer}`), 0.35, STANDARD_PAY));
        }
      }
    }

    // At Hartwell: shift crews out to the company's depot.
    if (HARTWELL_CREW.includes(src)) {
      out.push(candidate(co, `${co.slug}:crews`, src, co.depot, makeCargo('shift crews', 'light', `${co.slug}:crews:${src}`), 0.4, STANDARD_PAY));
    }

    // At supply sources: mining and life-support supplies in to the depot.
    if (SUPPLY_SOURCES.includes(src)) {
      const supply = pick(SUPPLIES, hashString(`${co.slug}:supply:${src}:${day}`));
      out.push(candidate(co, `${co.slug}:supply:${slug(supply)}`, src, co.depot, makeCargo(supply, 'standard', `${co.slug}:supply:${src}`), 0.4, STANDARD_PAY));
    }
  }

  return out;
}

export const GLITTERFIELD_MINERS_PROVIDER: FactionContractProvider = {
  id: MINERS_ID,
  name: 'Glitterfield Mining Companies',
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateGlitterfieldMinerContracts(ctx);
  },
};
