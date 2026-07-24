import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
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

const GENEROSITY = 1.3;

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
  return {
    factionId: HALLORAN_ID,
    factionName: HALLORAN_NAME,
    factionTag: HALLORAN_TAG,
    templateId,
    sourceId,
    destinationId,
    cargo,
    likelihood,
    generosity: GENEROSITY,
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

  // Crew out: Cupola -> Hartwell.
  if (src === CUPOLA_HAB) {
    for (const dest of HARTWELL_CREW) {
      out.push(candidate(`crew-out:${dest}`, src, dest, makeCargo('refinery crew rotations', 'light', `crewout:${dest}`), 0.45));
    }
  }

  return out;
}

export const HALLORAN_PROVIDER: FactionContractProvider = {
  id: HALLORAN_ID,
  name: HALLORAN_NAME,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateHalloranContracts(ctx);
  },
};
