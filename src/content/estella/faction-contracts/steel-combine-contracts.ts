import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { estellaNodeById } from '../index';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

const STEEL_COMBINE_ID = 'steel-combine';
const STEEL_COMBINE_NAME = 'The Steel Combine';
const STEEL_COMBINE_TAG = 'STEEL';

// Posting authorities (issuer flavor).
const PLAN_DIRECTORATE = 'Steel Combine Plan Directorate';
const FOREIGN_TRADE_COMMITTEE = 'Steel Combine Foreign Trade Committee';

// Pay: everything is fuel-compensation only (net-zero, no-loss "safe transfer"), except exports,
// which add a modest flat plan-bonus on top. The commune does not do market profit.
const MAX_COMP_ALLOWANCE = 2;
const EXPORT_BOUNTY = 10_000;

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

type JobKind = 'distribution' | 'import' | 'export';

interface SteelTemplate {
  templateId: string;
  kind: JobKind;
  sourceIds: string[];
  destinationIds: string[];
  cargoLabel: string;
  massClass: CargoMassClass;
  likelihood: number;
}

const TEMPLATES: SteelTemplate[] = [
  // --- Internal distribution: Hammer (bulk/heavy) <-> surface ---
  { templateId: 'hammer-feedstock-to-gornilo', kind: 'distribution', sourceIds: [HAMMER], destinationIds: [GORNILO], cargoLabel: 'smelter feedstock', massClass: 'dense', likelihood: 1.1 },
  { templateId: 'hammer-billet-to-perun', kind: 'distribution', sourceIds: [HAMMER], destinationIds: [PERUN], cargoLabel: 'billet stock', massClass: 'heavy', likelihood: 0.9 },
  { templateId: 'hammer-supplies-to-veles', kind: 'distribution', sourceIds: [HAMMER], destinationIds: [VELES], cargoLabel: 'mining supplies', massClass: 'standard', likelihood: 0.6 },
  { templateId: 'gornilo-steel-to-hammer', kind: 'distribution', sourceIds: [GORNILO], destinationIds: [HAMMER], cargoLabel: 'rolled structural sections', massClass: 'dense', likelihood: 1.1 },
  { templateId: 'perun-machinery-to-hammer', kind: 'distribution', sourceIds: [PERUN], destinationIds: [HAMMER], cargoLabel: 'finished machinery', massClass: 'heavy', likelihood: 0.9 },
  { templateId: 'veles-ore-to-hammer', kind: 'distribution', sourceIds: [VELES], destinationIds: [HAMMER], cargoLabel: 'specialty ore', massClass: 'dense', likelihood: 0.7 },

  // --- Internal distribution: Anvil (light/passengers/paperwork) <-> surface ---
  { templateId: 'anvil-crews-to-surface', kind: 'distribution', sourceIds: [ANVIL], destinationIds: [GORNILO, PERUN, VELES], cargoLabel: 'work crews', massClass: 'light', likelihood: 0.9 },
  { templateId: 'anvil-directives-to-surface', kind: 'distribution', sourceIds: [ANVIL], destinationIds: [GORNILO, PERUN, STRIBOG], cargoLabel: 'plan directives', massClass: 'light', likelihood: 0.7 },
  { templateId: 'mokosh-rations-to-anvil', kind: 'distribution', sourceIds: [MOKOSH], destinationIds: [ANVIL], cargoLabel: 'bulk-food allotments', massClass: 'standard', likelihood: 0.8 },
  { templateId: 'surface-quota-to-anvil', kind: 'distribution', sourceIds: [GORNILO, PERUN, VELES], destinationIds: [ANVIL], cargoLabel: 'quota reports', massClass: 'light', likelihood: 0.75 },
  { templateId: 'morana-telemetry-to-anvil', kind: 'distribution', sourceIds: [MORANA], destinationIds: [ANVIL], cargoLabel: 'weather telemetry cores', massClass: 'light', likelihood: 0.5 },

  // --- Imports (sparse): likely external feedstock sources -> Hammer ---
  { templateId: 'import-concentrate-newcanaan', kind: 'import', sourceIds: NEW_CANAAN_DOCKS, destinationIds: [HAMMER], cargoLabel: 'titanium tailings concentrate', massClass: 'dense', likelihood: 0.3 },
  { templateId: 'import-basalt-newcanaan', kind: 'import', sourceIds: NEW_CANAAN_DOCKS, destinationIds: [HAMMER], cargoLabel: 'basalt fiber feedstock', massClass: 'heavy', likelihood: 0.25 },
  { templateId: 'import-refractory-serai', kind: 'import', sourceIds: [CARAVANSERAI], destinationIds: [HAMMER], cargoLabel: 'imported refractory feedstock', massClass: 'dense', likelihood: 0.25 },

  // --- Exports (sparse, lucrative: compensation + flat bounty): Hammer -> external buyers ---
  { templateId: 'export-structural-svarog', kind: 'export', sourceIds: [HAMMER], destinationIds: [SVAROG_YARD], cargoLabel: 'rolled structural sections', massClass: 'dense', likelihood: 0.35 },
  { templateId: 'export-steel-yardstock', kind: 'export', sourceIds: [HAMMER], destinationIds: [YARDSTOCK], cargoLabel: 'certified steel stock', massClass: 'heavy', likelihood: 0.3 },
  { templateId: 'export-machinery-serai', kind: 'export', sourceIds: [HAMMER], destinationIds: [SERAI_OUTFITTER], cargoLabel: 'heavy machinery', massClass: 'heavy', likelihood: 0.25 },
  { templateId: 'export-alloy-tessera', kind: 'export', sourceIds: [HAMMER], destinationIds: [TESSERA_FACTORY], cargoLabel: 'precision alloy billets', massClass: 'heavy', likelihood: 0.25 },
];

interface FlavorSet {
  issuer: string;
  titles: string[];
  blurbs: string[];
}

const FLAVOR: Record<JobKind, FlavorSet> = {
  distribution: {
    issuer: PLAN_DIRECTORATE,
    titles: ['Plan delivery: {cargo} \u2192 {destination}', 'Plan lift: {cargo} \u2192 {destination}', 'Quota run: {cargo} \u2192 {destination}'],
    blurbs: [
      'For the good of the people.',
      'Plan fulfillment is a collective duty.',
      'The quota does not wait.',
      'Every tonne serves the commune.',
      'The furnaces must not go cold.',
      'Honor to the udarnik who exceeds the quota.',
    ],
  },
  import: {
    issuer: FOREIGN_TRADE_COMMITTEE,
    titles: ['Trade intake: {cargo} \u2192 {destination}', 'Foreign supply: {cargo} \u2192 {destination}'],
    blurbs: [
      "The commune's foundries hunger.",
      'Feedstock for the plan. For the good of the people.',
      'What the Belt sells, the Republic forges.',
    ],
  },
  export: {
    issuer: FOREIGN_TRADE_COMMITTEE,
    titles: ['Export lot: {cargo} \u2192 {destination}', 'Foreign trade: {cargo} \u2192 {destination}'],
    blurbs: [
      'Hard currency keeps the heat on.',
      'The Republic sells steel so the people may breathe.',
      'Plan surplus for export. For the good of the people.',
    ],
  },
};

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick<T>(pool: T[], seed: number): T {
  return pool[(seed >>> 0) % pool.length];
}

function nodeName(id: string): string {
  return estellaNodeById(id)?.name ?? id;
}

function fill(template: string, cargo: string, destination: string): string {
  return template.replace(/\{cargo\}/g, cargo).replace(/\{destination\}/g, destination);
}

function candidateFor(template: SteelTemplate, sourceId: string, destinationId: string, worldTime: number): FactionContractCandidate {
  const day = Math.floor(worldTime / 86_400);
  const routeSeed = hashString(`${template.templateId}:${sourceId}->${destinationId}:${day}`);
  const flavor = FLAVOR[template.kind];
  const title = fill(pick(flavor.titles, routeSeed), template.cargoLabel, nodeName(destinationId));
  const blurb = pick(flavor.blurbs, hashString(`${template.templateId}:${sourceId}->${destinationId}:${day}:blurb`));
  const cargo: MissionCargoSpec = {
    label: template.cargoLabel,
    massClass: template.massClass,
    massTons: cargoMassForClass(template.massClass, `${STEEL_COMBINE_ID}:${template.templateId}:${sourceId}->${destinationId}:${template.cargoLabel}`),
  };
  return {
    factionId: STEEL_COMBINE_ID,
    factionName: STEEL_COMBINE_NAME,
    factionTag: STEEL_COMBINE_TAG,
    templateId: template.templateId,
    sourceId,
    destinationId,
    cargo,
    likelihood: template.likelihood,
    issuerName: flavor.issuer,
    title,
    blurb,
    // Fuel-compensation only; exports add a flat plan-bonus.
    generosity: 0,
    compensationRatio: 1.0,
    maxCompAllowance: MAX_COMP_ALLOWANCE,
    flatReward: template.kind === 'export' ? EXPORT_BOUNTY : 0,
  };
}

function generateSteelCombineContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  for (const template of TEMPLATES) {
    if (!template.sourceIds.includes(ctx.sourceId)) continue;
    for (const destinationId of template.destinationIds) {
      if (destinationId === ctx.sourceId) continue;
      out.push(candidateFor(template, ctx.sourceId, destinationId, ctx.worldTime));
    }
  }
  return out;
}

export const STEEL_COMBINE_PROVIDER: FactionContractProvider = {
  id: STEEL_COMBINE_ID,
  name: STEEL_COMBINE_NAME,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateSteelCombineContracts(ctx);
  },
};
