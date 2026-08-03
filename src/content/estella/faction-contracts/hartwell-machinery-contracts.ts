import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

// Hartwell brokers finance, charter, and lease Kuznia/Svarog machinery into Hartwell and Pike.
// They are not manufacturers; they turn claims, liens, and future ore into present equipment.
const HARTWELL_MACHINERY_ID = 'hartwell-machinery-brokers';
const HAMMER = 'estella-vi-heavy-cargo-station';
const ANVIL = 'estella-vi-main-transit-dispatch';
const SVAROG_SHIPYARD = 'estella-via-drydock-station';
const VELES_TERMINAL = 'estella-via-component-supply-station';

const ROADSTEAD = 'estella-v-transit-customs';
const CONCORD = 'estella-v-capital-settlement';
const DAWES_CUT = 'estella-v-open-cast-mine';
const CINDERHOOK = 'estella-v-atmo-refinery';
const GALE_SURVEY = 'estella-v-storm-research';
const PIKE_STRIP_MINE = 'estella-va-strip-mine';
const PIKE_MINER_HAB = 'estella-va-miner-hab';
const PIKE_ORBITAL_DEPOT = 'estella-va-ore-handling-depot';

const WELLS_HEAVY_MACHINERY_DESTINATIONS = [
  'estella-xa-deep-ice-mine',
  'estella-xb-rare-element-mine',
  'estella-xb-smelting-processing',
  'estella-xd-geothermal-extraction',
  'estella-xia-sulfur-mine',
  'estella-xib-cryo-transit',
  'estella-xib-methane-refinery',
  'estella-xib-hydrocarbon-extraction',
  'estella-xic-ice-mining',
  'estella-xiic-isotope-mining',
];

const WELLS_SPECIALIST_MACHINERY_DESTINATIONS = [
  ...WELLS_HEAVY_MACHINERY_DESTINATIONS,
  'estella-xd-chem-station',
  'estella-xia-chem-station',
  'estella-xia-rare-element-extraction',
  'estella-xib-organic-chemistry',
  'estella-xie-rare-alloy-extraction',
  'estella-xiic-castle-teide',
];

const ROSTER_SIZE = 18;

const ROUTINE_PAY = { generosity: 0.75, compensationRatio: 0.45, maxCompAllowance: 2 } as const;
const HEAVY_PAY = { generosity: 0.85, compensationRatio: 0.4, maxCompAllowance: 2 } as const;
const PAPER_PAY = { generosity: 0.7, compensationRatio: 0.45, maxCompAllowance: 2 } as const;

interface Lane {
  sourceId: string;
  destinationIds: string[];
  cargo: CargoOption[];
  likelihood: number;
}

interface CargoOption {
  label: string;
  massClass: CargoMassClass;
  pay: typeof ROUTINE_PAY | typeof HEAVY_PAY | typeof PAPER_PAY;
}

interface Broker {
  name: string;
  slug: string;
  lanes: Lane[];
}

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination, issuer) => `${issuer}'s receiver at ${destination} signs for the ${cargo} and starts the lease clock immediately. "Claim survives another month," she says.`,
  (_candidate, cargo, destination) => `The ${cargo} comes off at ${destination} wrapped in finance seals and Kuznia grease. By the time the clamps release, somebody already owes somebody else interest.`,
  (_candidate, cargo, destination, issuer) => `${issuer} clears the ${cargo} into ${destination}'s equipment yard. "Get that rig moving before the lien cools," the broker says over comms.`,
  (_candidate, cargo, destination) => `At ${destination}, the ${cargo} is met by miners, mechanics, and a clerk guarding the title packet like scripture. Hartwell capitalism resumes its noisy work.`,
  (_candidate, cargo, destination) => `The ${cargo} rolls into ${destination} under a stack of claims-backed invoices. The dock crew looks relieved; the accounting terminal looks predatory.`,
];

const NAME_POOL = [
  'Charter Iron Desk',
  'Concord Machinery Exchange',
  'Dawes Equipment Finance',
  'Frontier Gear Trust',
  'Gale Survey Supply',
  'Hartwell Lease Office',
  'Hoist & Claim Brokerage',
  'Pike Hoist Brokerage',
  'Red Dust Machinery',
  'Roadstead Charter & Hoist',
  'Roadstead Pump & Cable',
  'Saddle Note Equipment',
  'Scrip Iron Factors',
  'Surveyor Machinery Trust',
  'Three Lien Gearhouse',
  'Venture Pump Office',
  'Westward Crusher Lease',
  'Yoke & Cable Finance',
  'Concord Claim Tools',
  'Dustline Equipment Factors',
];

const HEAVY_EQUIPMENT: CargoOption[] = [
  { label: 'drill head assemblies', massClass: 'heavy', pay: HEAVY_PAY },
  { label: 'pump skid packages', massClass: 'heavy', pay: HEAVY_PAY },
  { label: 'hoist drum assemblies', massClass: 'heavy', pay: HEAVY_PAY },
  { label: 'crusher modules', massClass: 'dense', pay: HEAVY_PAY },
  { label: 'pressure-rated compressors', massClass: 'heavy', pay: HEAVY_PAY },
  { label: 'vacuum loader kits', massClass: 'heavy', pay: HEAVY_PAY },
  { label: 'ore sorter modules', massClass: 'standard', pay: ROUTINE_PAY },
  { label: 'refinery maintenance skids', massClass: 'heavy', pay: HEAVY_PAY },
  { label: 'sulfur-rated loader frames', massClass: 'heavy', pay: HEAVY_PAY },
  { label: 'cryo pump skids', massClass: 'heavy', pay: HEAVY_PAY },
  { label: 'hydrocarbon separator skids', massClass: 'heavy', pay: HEAVY_PAY },
];

const LIGHT_EQUIPMENT: CargoOption[] = [
  { label: 'survey instrument crates', massClass: 'light', pay: ROUTINE_PAY },
  { label: 'claim beacon kits', massClass: 'light', pay: ROUTINE_PAY },
  { label: 'assay bench packages', massClass: 'standard', pay: ROUTINE_PAY },
  { label: 'sealed title packets', massClass: 'light', pay: PAPER_PAY },
  { label: 'maintenance control cabinets', massClass: 'standard', pay: ROUTINE_PAY },
  { label: 'valve control kits', massClass: 'standard', pay: ROUTINE_PAY },
  { label: 'cryo-safe valve racks', massClass: 'standard', pay: ROUTINE_PAY },
  { label: 'sealed export-lien packets', massClass: 'light', pay: PAPER_PAY },
];

const LANES: Lane[] = [
  { sourceId: HAMMER, destinationIds: [ROADSTEAD, CINDERHOOK, DAWES_CUT, PIKE_STRIP_MINE, PIKE_ORBITAL_DEPOT, ...WELLS_HEAVY_MACHINERY_DESTINATIONS], cargo: HEAVY_EQUIPMENT, likelihood: 0.55 },
  { sourceId: ANVIL, destinationIds: [ROADSTEAD, CONCORD, CINDERHOOK, GALE_SURVEY, PIKE_MINER_HAB, ...WELLS_SPECIALIST_MACHINERY_DESTINATIONS], cargo: LIGHT_EQUIPMENT, likelihood: 0.55 },
  { sourceId: VELES_TERMINAL, destinationIds: [ROADSTEAD, CINDERHOOK, DAWES_CUT, PIKE_STRIP_MINE, PIKE_ORBITAL_DEPOT, ...WELLS_SPECIALIST_MACHINERY_DESTINATIONS], cargo: [...HEAVY_EQUIPMENT, ...LIGHT_EQUIPMENT], likelihood: 0.45 },
  { sourceId: SVAROG_SHIPYARD, destinationIds: [CINDERHOOK, PIKE_STRIP_MINE, PIKE_ORBITAL_DEPOT, ROADSTEAD, ...WELLS_HEAVY_MACHINERY_DESTINATIONS, 'estella-xie-rare-alloy-extraction'], cargo: HEAVY_EQUIPMENT, likelihood: 0.42 },
  { sourceId: ROADSTEAD, destinationIds: [CONCORD, CINDERHOOK, DAWES_CUT, GALE_SURVEY, PIKE_STRIP_MINE, PIKE_MINER_HAB, PIKE_ORBITAL_DEPOT, ...WELLS_SPECIALIST_MACHINERY_DESTINATIONS], cargo: [...HEAVY_EQUIPMENT, ...LIGHT_EQUIPMENT], likelihood: 0.5 },
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

const ROSTER: Broker[] = seededSample(NAME_POOL, ROSTER_SIZE, hashString('hartwell-machinery-roster-v1')).map(name => {
  const h = hashString(name);
  const laneCount = 1 + ((h >>> 7) % 2);
  return { name, slug: slug(name), lanes: seededSample(LANES, laneCount, h ^ 0x4ea25001) };
});

function makeCargo(option: CargoOption, seedKey: string): MissionCargoSpec {
  return { label: option.label, massClass: option.massClass, massTons: cargoMassForClass(option.massClass, `${HARTWELL_MACHINERY_ID}:${seedKey}:${option.label}`) };
}

function candidate(broker: Broker, lane: Lane, destinationId: string, option: CargoOption): FactionContractCandidate {
  return {
    factionId: HARTWELL_MACHINERY_ID,
    factionName: broker.name,
    templateId: `${broker.slug}:${lane.sourceId}->${destinationId}:${slug(option.label)}`,
    sourceId: lane.sourceId,
    destinationId,
    cargo: makeCargo(option, `${broker.slug}:${lane.sourceId}->${destinationId}`),
    likelihood: lane.likelihood,
    ...option.pay,
  };
}

function generateMachineryContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const day = Math.floor(ctx.worldTime / 86_400);

  for (const broker of ROSTER) {
    for (const lane of broker.lanes) {
      if (lane.sourceId !== ctx.sourceId) continue;
      for (const destinationId of lane.destinationIds) {
        const options = seededSample(lane.cargo, 1, hashString(`${broker.slug}:${lane.sourceId}->${destinationId}:${day}`));
        for (const option of options) out.push(candidate(broker, lane, destinationId, option));
      }
    }
  }

  return out.map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const HARTWELL_MACHINERY_BROKERS_PROVIDER: FactionContractProvider = {
  id: HARTWELL_MACHINERY_ID,
  name: 'Hartwell Machinery Brokers',
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateMachineryContracts(ctx);
  },
};
