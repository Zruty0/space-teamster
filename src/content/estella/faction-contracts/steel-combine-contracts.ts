import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

const STEEL_COMBINE_ID = 'steel-combine';
const STEEL_COMBINE_NAME = 'The Steel Combine';
const STEEL_COMBINE_TAG = 'STEEL';

// Posting authorities (both STEEL). Internal plan logistics come from the Planning Office;
// anything crossing the trade membrane (imports/exports) comes from the Foreign Trade Committee.
const PLANNING_OFFICE = 'Steel Combine Planning Office';
const FOREIGN_TRADE_COMMITTEE = 'Steel Combine Foreign Trade Committee';

// Pay: the Combine reimburses actual fuel at 100% for all work. Exports add a modest fixed
// production bonus; there are no flat rewards.
const MAX_COMP_ALLOWANCE = 2;
const EXPORT_GENEROSITY = 0.15;

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination) => `At ${destination}, the ${cargo} is received by a planning clerk with a red pencil and a tired smile. "Schedule fulfilled," she says, and stamps the line green.`,
  (_candidate, cargo, destination) => `The ${cargo} enters ${destination}'s queue under stamped forms and loudspeakers. Someone marks another quota box green.`,
  (_candidate, cargo, destination) => `Steel Combine workers at ${destination} unload the ${cargo} with practiced, collective rhythm. The receipt says only: delivered for the plan.`,
  (_candidate, cargo, destination) => `At ${destination}, a foreman signs for the ${cargo} and waves you clear before the next shift horn. "Useful work," he says, brief and sincere.`,
  (_candidate, cargo, destination) => `The ${cargo} is folded into ${destination}'s production chain almost immediately. The Combine terminal credits you for useful work, not heroics.`,
];

// Kuznia trade-membrane and surface nodes.
const HAMMER = 'estella-vi-heavy-cargo-station'; // VI.2 high-orbit bulk marshalling
const ANVIL = 'estella-vi-main-transit-dispatch'; // VI.1 low-orbit dispatch/customs/passengers
const GORNILO = 'estella-vi-foundry-complex'; // VI.4 Gornilo Crucible
const PERUN = 'estella-vi-industrial-city'; // VI.3
const MOKOSH = 'estella-vi-agricultural-lowlands'; // VI.6
const VELES = 'estella-vi-mountain-mining'; // VI.8
const MORANA = 'estella-vi-polar-weather-research'; // VI.7
const STRIBOG = 'estella-vi-spaceport'; // VI.5

// Likely external feedstock sources (imports) and finished-goods buyers (exports).
const NEW_CANAAN_DOCKS = ['harlan-dock', 'mercer-dock'];
const CARAVANSERAI = 'caravanserai-main-commercial-dock';
const SVAROG_YARD = 'estella-via-drydock-station';
const YARDSTOCK = 'estella-via-component-supply-station';
const SERAI_OUTFITTER = 'caravanserai-outfitter-drydock';
const TESSERA_FACTORY = 'estella-vii-high-vacuum-factory';
const SERRAT_DOMAIN_SHIPYARD = 'estella-xie-outer-spec-drydock';
const KEELWRIGHT_WORKS = 'estella-xie-rare-alloy-extraction';
const BANNER_FORGE = 'estella-xie-component-fabrication';

type JobKind = 'distribution' | 'import' | 'export';

interface CargoOption {
  label: string;
  massClass: CargoMassClass;
}

interface SteelLane {
  laneId: string;
  kind: JobKind;
  sourceIds: string[];
  destinationIds: string[];
  cargo: CargoOption[];
  likelihood: number;
  // How many distinct cargo types to offer per (source -> destination) on a given board.
  sampleCount: number;
}

// --- Cargo pools ---------------------------------------------------------------------------

// Feedstock and supplies flowing DOWN from the bulk membrane to the works.
const GORNILO_INTAKE: CargoOption[] = [
  { label: 'smelter feedstock', massClass: 'dense' },
  { label: 'iron-ore pellets', massClass: 'dense' },
  { label: 'coke and flux', massClass: 'heavy' },
  { label: 'scrap charge', massClass: 'heavy' },
  { label: 'alloying additives', massClass: 'standard' },
  { label: 'refractory brick', massClass: 'heavy' },
];
const PERUN_INTAKE: CargoOption[] = [
  { label: 'billet stock', massClass: 'heavy' },
  { label: 'plate and sheet stock', massClass: 'heavy' },
  { label: 'bar and rod stock', massClass: 'heavy' },
  { label: 'casting blanks', massClass: 'dense' },
  { label: 'machine-tool stock', massClass: 'standard' },
];
const VELES_INTAKE: CargoOption[] = [
  { label: 'mining supplies', massClass: 'standard' },
  { label: 'drill stock', massClass: 'standard' },
  { label: 'blasting charges', massClass: 'light' },
  { label: 'shoring timber', massClass: 'heavy' },
  { label: 'replacement cutting heads', massClass: 'standard' },
];

// Finished goods and ore flowing UP to the bulk membrane.
const GORNILO_OUTPUT: CargoOption[] = [
  { label: 'rolled structural sections', massClass: 'dense' },
  { label: 'steel billets', massClass: 'dense' },
  { label: 'plate steel', massClass: 'heavy' },
  { label: 'rail and beam stock', massClass: 'heavy' },
  { label: 'alloy ingots', massClass: 'dense' },
  { label: 'pressure-pipe stock', massClass: 'heavy' },
];
const PERUN_OUTPUT: CargoOption[] = [
  { label: 'finished machinery', massClass: 'heavy' },
  { label: 'machine tools', massClass: 'heavy' },
  { label: 'pumps and compressors', massClass: 'heavy' },
  { label: 'gear assemblies', massClass: 'standard' },
  { label: 'prefabricated structural modules', massClass: 'dense' },
  { label: 'heavy vehicle chassis', massClass: 'heavy' },
];
const VELES_OUTPUT: CargoOption[] = [
  { label: 'specialty ore', massClass: 'dense' },
  { label: 'rare-earth concentrate', massClass: 'dense' },
  { label: 'refractory ore', massClass: 'dense' },
  { label: 'high-grade alloy ore', massClass: 'dense' },
];

// Light membrane traffic (people, orders, small freight) via Anvil.
const ANVIL_DOWN: CargoOption[] = [
  { label: 'work crews', massClass: 'light' },
  { label: 'shift rotations', massClass: 'light' },
  { label: 'plan directives', massClass: 'light' },
  { label: 'quota allocations', massClass: 'light' },
  { label: 'tooling and spares', massClass: 'standard' },
  { label: 'medical supplies', massClass: 'light' },
];
const SURFACE_UP_LIGHT: CargoOption[] = [
  { label: 'quota reports', massClass: 'light' },
  { label: 'production returns', massClass: 'light' },
  { label: 'work rotations', massClass: 'light' },
  { label: 'spent-tooling returns', massClass: 'standard' },
  { label: 'personnel transfers', massClass: 'light' },
];
const FOOD: CargoOption[] = [
  { label: 'bulk-food allotments', massClass: 'standard' },
  { label: 'grain rations', massClass: 'standard' },
  { label: 'protein rations', massClass: 'standard' },
  { label: 'preserved-food crates', massClass: 'standard' },
];
const PASSENGER_LABELS = new Set(['work crews', 'shift rotations', 'work rotations', 'personnel transfers']);

const WEATHER: CargoOption[] = [
  { label: 'weather telemetry cores', massClass: 'light' },
  { label: 'storm-forecast data', massClass: 'light' },
  { label: 'atmospheric survey logs', massClass: 'light' },
];

// Imports (external feedstock -> Hammer).
const NEW_CANAAN_IMPORTS: CargoOption[] = [
  { label: 'titanium tailings concentrate', massClass: 'dense' },
  { label: 'basalt fiber feedstock', massClass: 'heavy' },
  { label: 'scrap pressure alloy', massClass: 'heavy' },
  { label: 'regolith aggregate', massClass: 'dense' },
  { label: 'bulk silicates', massClass: 'heavy' },
];
const SERAI_IMPORTS: CargoOption[] = [
  { label: 'imported refractory feedstock', massClass: 'dense' },
  { label: 'off-world alloy stock', massClass: 'heavy' },
  { label: 'bulk industrial chemicals', massClass: 'standard' },
  { label: 'imported machine parts', massClass: 'standard' },
];
// Refined metal bought from the Glitterfield refinery (Cupola Station) — the buyer-side leg of
// the Belt-to-Camps ore corridor. Posts at Cupola's ingot bay.
const GLITTERFIELD_INGOTS: CargoOption[] = [
  { label: 'nickel-iron ingots', massClass: 'heavy' },
  { label: 'ferrochrome ingots', massClass: 'heavy' },
  { label: 'cobalt ingots', massClass: 'dense' },
  { label: 'refined metal ingots', massClass: 'heavy' },
];

// Exports (Hammer -> external buyers).
const EXPORT_SVAROG: CargoOption[] = [
  { label: 'rolled structural sections', massClass: 'dense' },
  { label: 'hull plate stock', massClass: 'heavy' },
  { label: 'pressure-shell blanks', massClass: 'dense' },
  { label: 'frame members', massClass: 'heavy' },
];
const EXPORT_YARDSTOCK: CargoOption[] = [
  { label: 'certified steel stock', massClass: 'heavy' },
  { label: 'structural billets', massClass: 'dense' },
  { label: 'fastener stock', massClass: 'standard' },
  { label: 'welded assemblies', massClass: 'heavy' },
];
const EXPORT_SERAI: CargoOption[] = [
  { label: 'heavy machinery', massClass: 'heavy' },
  { label: 'prefabricated modules', massClass: 'dense' },
  { label: 'cargo-frame stock', massClass: 'heavy' },
  { label: 'structural components', massClass: 'heavy' },
];
const EXPORT_TESSERA: CargoOption[] = [
  { label: 'precision alloy billets', massClass: 'heavy' },
  { label: 'tool-steel stock', massClass: 'heavy' },
  { label: 'high-purity ingots', massClass: 'dense' },
  { label: 'instrument-grade alloy', massClass: 'standard' },
];
const EXPORT_OATHMARK: CargoOption[] = [
  { label: 'outer-spec hull plate stock', massClass: 'heavy' },
  { label: 'certified frame members', massClass: 'heavy' },
  { label: 'shipyard machine-tool stock', massClass: 'standard' },
  { label: 'armor-grade plate lots', massClass: 'heavy' },
  { label: 'proofed structural billets', massClass: 'dense' },
];

const LANES: SteelLane[] = [
  // Internal distribution: Hammer (bulk) <-> surface.
  { laneId: 'hammer-to-gornilo', kind: 'distribution', sourceIds: [HAMMER], destinationIds: [GORNILO], cargo: GORNILO_INTAKE, likelihood: 1.1, sampleCount: 2 },
  { laneId: 'hammer-to-perun', kind: 'distribution', sourceIds: [HAMMER], destinationIds: [PERUN], cargo: PERUN_INTAKE, likelihood: 0.9, sampleCount: 2 },
  { laneId: 'hammer-to-veles', kind: 'distribution', sourceIds: [HAMMER], destinationIds: [VELES], cargo: VELES_INTAKE, likelihood: 0.6, sampleCount: 1 },
  { laneId: 'gornilo-to-hammer', kind: 'distribution', sourceIds: [GORNILO], destinationIds: [HAMMER], cargo: GORNILO_OUTPUT, likelihood: 1.1, sampleCount: 2 },
  { laneId: 'perun-to-hammer', kind: 'distribution', sourceIds: [PERUN], destinationIds: [HAMMER], cargo: PERUN_OUTPUT, likelihood: 0.9, sampleCount: 2 },
  { laneId: 'veles-to-hammer', kind: 'distribution', sourceIds: [VELES], destinationIds: [HAMMER], cargo: VELES_OUTPUT, likelihood: 0.7, sampleCount: 1 },

  // Internal distribution: Anvil (light/passengers/paperwork) <-> surface.
  { laneId: 'anvil-to-surface', kind: 'distribution', sourceIds: [ANVIL], destinationIds: [GORNILO, PERUN, VELES, STRIBOG], cargo: ANVIL_DOWN, likelihood: 0.85, sampleCount: 1 },
  { laneId: 'surface-to-anvil', kind: 'distribution', sourceIds: [GORNILO, PERUN, VELES], destinationIds: [ANVIL], cargo: SURFACE_UP_LIGHT, likelihood: 0.75, sampleCount: 1 },
  { laneId: 'mokosh-to-anvil', kind: 'distribution', sourceIds: [MOKOSH], destinationIds: [ANVIL], cargo: FOOD, likelihood: 0.8, sampleCount: 1 },
  { laneId: 'morana-to-anvil', kind: 'distribution', sourceIds: [MORANA], destinationIds: [ANVIL], cargo: WEATHER, likelihood: 0.5, sampleCount: 1 },

  // Imports (sparse): likely external feedstock sources -> Hammer.
  { laneId: 'import-new-canaan', kind: 'import', sourceIds: NEW_CANAAN_DOCKS, destinationIds: [HAMMER], cargo: NEW_CANAAN_IMPORTS, likelihood: 0.3, sampleCount: 1 },
  { laneId: 'import-serai', kind: 'import', sourceIds: [CARAVANSERAI], destinationIds: [HAMMER], cargo: SERAI_IMPORTS, likelihood: 0.25, sampleCount: 1 },
  { laneId: 'import-glitterfield', kind: 'import', sourceIds: ['industrial-refinery-finished-goods'], destinationIds: [HAMMER], cargo: GLITTERFIELD_INGOTS, likelihood: 0.3, sampleCount: 1 },

  // Exports (sparse, lucrative: compensation + flat bounty): Hammer -> external buyers.
  { laneId: 'export-svarog', kind: 'export', sourceIds: [HAMMER], destinationIds: [SVAROG_YARD], cargo: EXPORT_SVAROG, likelihood: 0.35, sampleCount: 1 },
  { laneId: 'export-yardstock', kind: 'export', sourceIds: [HAMMER], destinationIds: [YARDSTOCK], cargo: EXPORT_YARDSTOCK, likelihood: 0.3, sampleCount: 1 },
  { laneId: 'export-serai', kind: 'export', sourceIds: [HAMMER], destinationIds: [SERAI_OUTFITTER], cargo: EXPORT_SERAI, likelihood: 0.25, sampleCount: 1 },
  { laneId: 'export-tessera', kind: 'export', sourceIds: [HAMMER], destinationIds: [TESSERA_FACTORY], cargo: EXPORT_TESSERA, likelihood: 0.25, sampleCount: 1 },
  { laneId: 'export-oathmark', kind: 'export', sourceIds: [HAMMER], destinationIds: [SERRAT_DOMAIN_SHIPYARD, KEELWRIGHT_WORKS, BANNER_FORGE], cargo: EXPORT_OATHMARK, likelihood: 0.22, sampleCount: 1 },
];

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Deterministic sample of `count` distinct cargo options (seeded Fisher-Yates).
function sampleCargo(pool: CargoOption[], count: number, seed: number): CargoOption[] {
  if (count >= pool.length) return pool.slice();
  const idx = pool.map((_, i) => i);
  let s = seed >>> 0 || 1;
  const rng = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff; };
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, count).map(i => pool[i]);
}

function templateIdFor(laneId: string, label: string): string {
  return `${laneId}:${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '')}`;
}

function issuerFor(kind: JobKind): string {
  return kind === 'distribution' ? PLANNING_OFFICE : FOREIGN_TRADE_COMMITTEE;
}

function candidateFor(lane: SteelLane, sourceId: string, destinationId: string, option: CargoOption): FactionContractCandidate {
  const templateId = templateIdFor(lane.laneId, option.label);
  const passenger = PASSENGER_LABELS.has(option.label);
  const cargo: MissionCargoSpec = {
    label: option.label,
    massClass: option.massClass,
    massTons: cargoMassForClass(option.massClass, `${STEEL_COMBINE_ID}:${templateId}:${sourceId}->${destinationId}:${option.label}`),
  };
  return {
    factionId: STEEL_COMBINE_ID,
    factionName: STEEL_COMBINE_NAME,
    factionTag: STEEL_COMBINE_TAG,
    templateId,
    sourceId,
    destinationId,
    cargo,
    likelihood: lane.likelihood,
    issuerName: issuerFor(lane.kind),
    // Fuel-compensation only; exports add a fixed percentage plan-bonus.
    generosity: lane.kind === 'export' ? EXPORT_GENEROSITY : 0,
    compensationRatio: 1.0,
    maxCompAllowance: MAX_COMP_ALLOWANCE,
    flatReward: 0,
    category: passenger ? 'passenger' : undefined,
  };
}

function generateSteelCombineContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const day = Math.floor(ctx.worldTime / 86_400);
  for (const lane of LANES) {
    if (!lane.sourceIds.includes(ctx.sourceId)) continue;
    for (const destinationId of lane.destinationIds) {
      if (destinationId === ctx.sourceId) continue;
      const seed = hashString(`${lane.laneId}:${ctx.sourceId}->${destinationId}:${day}`);
      for (const option of sampleCargo(lane.cargo, lane.sampleCount, seed)) {
        out.push(candidateFor(lane, ctx.sourceId, destinationId, option));
      }
    }
  }
  return out.map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const STEEL_COMBINE_PROVIDER: FactionContractProvider = {
  id: STEEL_COMBINE_ID,
  name: STEEL_COMBINE_NAME,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateSteelCombineContracts(ctx);
  },
};
