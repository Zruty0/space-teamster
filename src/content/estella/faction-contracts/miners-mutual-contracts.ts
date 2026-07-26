import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

interface MinersMutualContractTemplate {
  templateId: string;
  sourceIds: string[];
  destinationIds: string[];
  cargoLabel: string;
  massClass: CargoMassClass;
  likelihood: number;
  generosity?: number;
  compensationRatio?: number;
}

const MINERS_MUTUAL_ID = 'new-canaan-miners-mutual';
const MINERS_MUTUAL_NAME = 'New Canaan Miners Mutual';
const MINERS_MUTUAL_TAG = 'CO-OP';

// A broke mutual pays below open market for ordinary work — you fly for goodwill, not profit.
// Genuine emergency relief is the exception: the Co-op will overpay when members are in trouble.
const MINERS_MUTUAL_BASE_GENEROSITY = 0.6;
const MINERS_MUTUAL_BASE_COMPENSATION_RATIO = 0.45;
const MINERS_MUTUAL_EXPORT_GENEROSITY = 0.7;
const MINERS_MUTUAL_EXPORT_COMPENSATION_RATIO = 0.35;
const MINERS_MUTUAL_EMERGENCY_GENEROSITY = 0.85;
const MINERS_MUTUAL_EMERGENCY_COMPENSATION_RATIO = 0.45;
const MINERS_MUTUAL_MAX_COMP_ALLOWANCE = 2;

const NEW_CANAAN_DOCKS = ['harlan-dock', 'mercer-dock'];

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination, issuer) => `${issuer}'s loading crew at ${destination} starts pulling the ${cargo} loose before your engine bells have cooled. "That buys us another week of air," the crew chief says, shaking your hand hard.`,
  (_candidate, cargo, destination, issuer) => `The ${cargo} is met by patched suits and tired faces at ${destination}. ${issuer} sends thanks from the Co-op board: another leak, pump, or ration line can stay ahead of failure.`,
  (_candidate, cargo, destination) => `At ${destination}, the dock boss counts the ${cargo} twice, then grins like the numbers came out better than expected. Someone chalks your ship name onto a bulkhead under "paid up friends."`,
  (_candidate, cargo, destination, issuer) => `${issuer} locals swarm the ${cargo} with practiced urgency at ${destination}. "Take it straight to pressure maintenance," a miner says. "They've been waiting since dawn."`,
  (_candidate, cargo, destination) => `The ${cargo} comes off at ${destination} into a noisy argument about whose claim needs it first. The argument sounds cheerful, which is probably the best report the Co-op can give.`,
];

const MINERS_MUTUAL_TEMPLATES: MinersMutualContractTemplate[] = [
  // Emergency purchases from expensive Caravanserai suppliers: uncommon, but visible at game start.
  { templateId: 'serai-emergency-patch-kits', sourceIds: ['caravanserai-main-commercial-dock'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'emergency patch kits', massClass: 'light', likelihood: 0.35, generosity: MINERS_MUTUAL_EMERGENCY_GENEROSITY, compensationRatio: MINERS_MUTUAL_EMERGENCY_COMPENSATION_RATIO },
  { templateId: 'serai-oxygen-bottles', sourceIds: ['caravanserai-refuel-depot'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'emergency oxygen bottles', massClass: 'light', likelihood: 0.45, generosity: MINERS_MUTUAL_EMERGENCY_GENEROSITY, compensationRatio: MINERS_MUTUAL_EMERGENCY_COMPENSATION_RATIO },

  // Preferred inbound bulk supply: cheaper industrial/life-support suppliers outside the Caravanserai.
  { templateId: 'industrial-pressure-seals', sourceIds: ['estella-vi-main-transit-dispatch'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'pressure seals and valve blocks', massClass: 'standard', likelihood: 1.1 },
  { templateId: 'foundry-recycler-parts', sourceIds: ['estella-vi-main-transit-dispatch'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'recycler pump cartridges', massClass: 'standard', likelihood: 0.95 },
  { templateId: 'component-rotary-kits', sourceIds: ['estella-via-component-supply-station'], destinationIds: ['harlan-dock'], cargoLabel: 'rotary bearing kits', massClass: 'heavy', likelihood: 1.0 },
  { templateId: 'drydock-airlock-actuators', sourceIds: ['estella-via-drydock-station'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'airlock actuator assemblies', massClass: 'heavy', likelihood: 0.8 },
  { templateId: 'agri-ration-packs', sourceIds: ['estella-vi-main-transit-dispatch'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'bulk ration packs', massClass: 'standard', likelihood: 0.75 },
  { templateId: 'cold-chain-medical', sourceIds: ['estella-vib-cold-chain-station'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'medical cold-chain lockers', massClass: 'light', likelihood: 0.55 },
  { templateId: 'still-pressure-gas', sourceIds: ['still-public-approach-dock'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'certified pressure gas cylinders', massClass: 'standard', likelihood: 0.65 },

  // Outbound brokerage from the Co-op rocks to buyers with better processors.
  { templateId: 'tailings-to-foundry', sourceIds: NEW_CANAAN_DOCKS, destinationIds: ['estella-vi-heavy-cargo-station'], cargoLabel: 'low-grade titanium tailings concentrate', massClass: 'dense', likelihood: 1.15, generosity: MINERS_MUTUAL_EXPORT_GENEROSITY, compensationRatio: MINERS_MUTUAL_EXPORT_COMPENSATION_RATIO },
  { templateId: 'basalt-to-industrial-city', sourceIds: NEW_CANAAN_DOCKS, destinationIds: ['estella-vi-heavy-cargo-station'], cargoLabel: 'basalt fiber feedstock', massClass: 'heavy', likelihood: 0.95, generosity: MINERS_MUTUAL_EXPORT_GENEROSITY, compensationRatio: MINERS_MUTUAL_EXPORT_COMPENSATION_RATIO },
  { templateId: 'scrap-to-drydock', sourceIds: NEW_CANAAN_DOCKS, destinationIds: ['estella-via-drydock-station'], cargoLabel: 'scrap pressure alloy', massClass: 'heavy', likelihood: 0.9, generosity: MINERS_MUTUAL_EXPORT_GENEROSITY, compensationRatio: MINERS_MUTUAL_EXPORT_COMPENSATION_RATIO },
  { templateId: 'shielding-to-components', sourceIds: NEW_CANAAN_DOCKS, destinationIds: ['estella-via-component-supply-station'], cargoLabel: 'regolith shielding blocks', massClass: 'dense', likelihood: 0.7, generosity: MINERS_MUTUAL_EXPORT_GENEROSITY, compensationRatio: MINERS_MUTUAL_EXPORT_COMPENSATION_RATIO },
  { templateId: 'assay-to-high-tech', sourceIds: NEW_CANAAN_DOCKS, destinationIds: ['estella-iii-high-tech-city'], cargoLabel: 'sealed assay cores', massClass: 'light', likelihood: 0.45, generosity: MINERS_MUTUAL_EXPORT_GENEROSITY, compensationRatio: MINERS_MUTUAL_EXPORT_COMPENSATION_RATIO },
];

function cargoForTemplate(template: MinersMutualContractTemplate, sourceId: string, destinationId: string): MissionCargoSpec {
  return {
    label: template.cargoLabel,
    massClass: template.massClass,
    massTons: cargoMassForClass(template.massClass, `${MINERS_MUTUAL_ID}:${template.templateId}:${sourceId}->${destinationId}:${template.cargoLabel}`),
  };
}

function candidatesFromTemplates(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  for (const template of MINERS_MUTUAL_TEMPLATES) {
    if (!template.sourceIds.includes(ctx.sourceId)) continue;
    for (const destinationId of template.destinationIds) {
      if (destinationId === ctx.sourceId) continue;
      out.push({
        factionId: MINERS_MUTUAL_ID,
        factionName: MINERS_MUTUAL_NAME,
        factionTag: MINERS_MUTUAL_TAG,
        templateId: template.templateId,
        sourceId: ctx.sourceId,
        destinationId,
        cargo: cargoForTemplate(template, ctx.sourceId, destinationId),
        likelihood: template.likelihood,
        generosity: template.generosity ?? MINERS_MUTUAL_BASE_GENEROSITY,
        compensationRatio: template.compensationRatio ?? MINERS_MUTUAL_BASE_COMPENSATION_RATIO,
        maxCompAllowance: MINERS_MUTUAL_MAX_COMP_ALLOWANCE,
      });
    }
  }
  return out.map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const NEW_CANAAN_MINERS_MUTUAL_PROVIDER: FactionContractProvider = {
  id: MINERS_MUTUAL_ID,
  name: MINERS_MUTUAL_NAME,
  generosity: MINERS_MUTUAL_BASE_GENEROSITY,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return candidatesFromTemplates(ctx);
  },
};
