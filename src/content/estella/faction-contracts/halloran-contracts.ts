import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

// Halloran Smelting House runs the Cupola Station refinery — the chokepoint all Glitterfield ore
// passes through. It ships no metal itself: the miners and buyers move the ingots. Halloran only
// brings in its own crews and refinery consumables, and rotates crews back to Hartwell.
const HALLORAN_ID = 'halloran-smelting-house';
const HALLORAN_NAME = 'Halloran Smelting House';
const HALLORAN_TAG = 'HALL';

const CUPOLA_INTAKE = 'industrial-refinery-ore-intake';
const CUPOLA_HAB = 'industrial-refinery-staff-hab';
const HARTWELL_CREW = ['estella-v-transit-customs', 'estella-v-capital-settlement']; // Roadstead, Concord
const SUPPLY_SOURCES = ['caravanserai-main-commercial-dock', 'estella-v-transit-customs'];
const GAIA_HUBS = ['estella-iii-finance-city', 'estella-iii-capital-city']; // the House is rich enough to fly people from Gaia

const GENEROSITY = 0.8;
const COMPENSATION_RATIO = 0.4;
const PASSENGER_GENEROSITY = 0.4;
const GAIA_PASSENGER_GENEROSITY = 0.5;
const PASSENGER_COMPENSATION_RATIO = 0.6;
const MAX_COMP_ALLOWANCE = 2;

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination, issuer) => `${issuer} receives the ${cargo} at ${destination} under refinery glare and hot-metal stink. "The House takes its cut," the clerk says, but at least he says thank you.`,
  (_candidate, cargo, destination) => `At ${destination}, Halloran crews move the ${cargo} toward the smelter side without breaking stride. The acknowledgement is brisk; furnaces do not wait.`,
  (_candidate, cargo, destination) => `The ${cargo} is logged at ${destination} beside heat-stained bulkheads and assay screens. Halloran thanks you for feeding the chokepoint.`,
  (_candidate, cargo, destination, issuer) => `${issuer}'s receiver signs for the ${cargo} at ${destination} with one eye on the cupola schedule. "Good timing," she says. "Next furnace cycle was getting hungry."`,
  (_candidate, cargo, destination) => `The ${cargo} disappears into ${destination}'s refinery traffic. A smelter boss gives you a short nod, the local equivalent of applause.`,
];

interface CargoOption {
  label: string;
  massClass: CargoMassClass;
}

const CONSUMABLES: CargoOption[] = [
  { label: 'fluxing agents', massClass: 'standard' },
  { label: 'smelter electrodes', massClass: 'heavy' },
  { label: 'refining reagents', massClass: 'standard' },
  { label: 'refractory linings', massClass: 'heavy' },
  { label: 'furnace consumables', massClass: 'standard' },
];

// Experts and executives the House flies in from Gaia (passengers).
const GAIA_PEOPLE = ['metallurgical experts', 'assay auditors', 'refinery executives', 'process engineers', 'House delegation'];

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

function pick<T>(pool: T[], seed: number): T {
  return pool[(seed >>> 0) % pool.length];
}

function makeCargo(label: string, massClass: CargoMassClass, seedKey: string): MissionCargoSpec {
  return { label, massClass, massTons: cargoMassForClass(massClass, `${HALLORAN_ID}:${seedKey}:${label}`) };
}

function candidate(templateId: string, sourceId: string, destinationId: string, cargo: MissionCargoSpec, likelihood: number): FactionContractCandidate {
  const passenger = templateId.startsWith('crew') || templateId.startsWith('gaia');
  const gaiaPassenger = templateId.startsWith('gaia');
  return {
    factionId: HALLORAN_ID,
    factionName: HALLORAN_NAME,
    factionTag: HALLORAN_TAG,
    templateId,
    sourceId,
    destinationId,
    cargo,
    likelihood,
    generosity: passenger ? (gaiaPassenger ? GAIA_PASSENGER_GENEROSITY : PASSENGER_GENEROSITY) : GENEROSITY,
    compensationRatio: passenger ? PASSENGER_COMPENSATION_RATIO : COMPENSATION_RATIO,
    maxCompAllowance: MAX_COMP_ALLOWANCE,
    category: passenger ? 'passenger' : undefined,
  };
}

function generateHalloranContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const src = ctx.sourceId;
  const day = Math.floor(ctx.worldTime / 86_400);

  // Consumables in: sources -> Cupola.
  if (SUPPLY_SOURCES.includes(src)) {
    const c = pick(CONSUMABLES, hashString(`halloran:consumable:${src}:${day}`));
    out.push(candidate(`consumables:${slug(c.label)}`, src, CUPOLA_INTAKE, makeCargo(c.label, c.massClass, `consumable:${src}`), 0.5));
  }

  // Crew in: Hartwell -> Cupola.
  if (HARTWELL_CREW.includes(src)) {
    out.push(candidate('crew-in', src, CUPOLA_HAB, makeCargo('refinery crews', 'light', `crewin:${src}`), 0.5));
  }

  // Experts and executives in from Gaia — the House can afford it.
  if (GAIA_HUBS.includes(src)) {
    const p = pick(GAIA_PEOPLE, hashString(`halloran:gaia:${src}:${day}`));
    out.push(candidate(`gaia-experts:${slug(p)}`, src, CUPOLA_HAB, makeCargo(p, 'light', `gaia:${src}`), 0.5));
  }

  // Crew out: Cupola -> Hartwell, and executive returns to Gaia.
  if (src === CUPOLA_HAB) {
    for (const dest of HARTWELL_CREW) {
      out.push(candidate(`crew-out:${dest}`, src, dest, makeCargo('refinery crew rotations', 'light', `crewout:${dest}`), 0.45));
    }
    for (const dest of GAIA_HUBS) {
      out.push(candidate(`gaia-return:${dest}`, src, dest, makeCargo('House delegation', 'light', `gaiaret:${dest}`), 0.35));
    }
  }

  return out.map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const HALLORAN_PROVIDER: FactionContractProvider = {
  id: HALLORAN_ID,
  name: HALLORAN_NAME,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateHalloranContracts(ctx);
  },
};
