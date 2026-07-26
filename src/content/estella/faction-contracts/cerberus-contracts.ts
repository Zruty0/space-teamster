import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

interface CerberusContractTemplate {
  templateId: string;
  sourceIds: string[];
  destinationIds: string[];
  cargoLabel: string;
  massClass: CargoMassClass;
  likelihood: number;
}

const CERBERUS_ID = 'cerberus-human-resources';
const CERBERUS_NAME = 'Cerberus Human Resources';
const CERBERUS_TAG = 'CHR';

// Rich but exploitative: ordinary corporate freight pays okay; morally/physically ugly freight
// still overpays to get flown. People movement belongs on the passenger board and uses
// reimbursement instead of freight margins.
const CERBERUS_BASE_GENEROSITY = 0.85;
const CERBERUS_BASE_COMPENSATION_RATIO = 0.4;
const CERBERUS_UNSAVORY_GENEROSITY = 1.25;
const CERBERUS_UNSAVORY_COMPENSATION_RATIO = 0.2;
const CERBERUS_HIGH_VALUE_GENEROSITY = 1.2;
const CERBERUS_HIGH_VALUE_COMPENSATION_RATIO = 0.25;
const CERBERUS_PASSENGER_GENEROSITY = 0.5;
const CERBERUS_PASSENGER_COMPENSATION_RATIO = 0.6;
const CERBERUS_MAX_COMP_ALLOWANCE = 2;

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination, issuer) => `${issuer} receives the ${cargo} at ${destination} behind tinted glass and immaculate hazard stripes. "Your performance has been recorded as satisfactory," a compliance officer says.`,
  (_candidate, cargo, destination) => `At ${destination}, Cerberus handlers move the ${cargo} without wasting a word. Your receipt arrives with a legal footer longer than the message.`,
  (_candidate, cargo, destination) => `The ${cargo} is absorbed into ${destination}'s Cerberus process chain with quiet efficiency. A supervisor smiles exactly once and certifies successful transfer.`,
  (_candidate, cargo, destination, issuer) => `${issuer} clocks the ${cargo} into ${destination} before you finish shutdown. "Schedule discipline is appreciated," the BBS says in a voice too smooth to be human.`,
  (_candidate, cargo, destination) => `Cerberus staff at ${destination} separate the ${cargo} from your manifest like a balance-sheet entry becoming real. Payment clears immediately and without warmth.`,
];

const CERBERUS_UNSAVORY_TEMPLATES = new Set<string>([
  'local-workforce-manifests',
  'hydrogen-to-pandemonium',
]);

const CERBERUS_PASSENGER_TEMPLATES = new Set<string>([
  'workforce-transfer-to-hub',
  'custody-transfer-to-olympos',
  'surface-labor-allocation',
  'local-custody-processing',
  'local-surface-labor-processing',
  'executive-delegation',
]);

const CERBERUS_HIGH_VALUE_TEMPLATES = new Set<string>([
  'local-rare-metal-export-staging',
  'local-carbonvale-export-staging',
  'local-shareholder-packets',
  'local-legal-archives',
  'local-paradiso-hospitality',
  'local-audit-records',
  'rare-metals-to-gaia-tech',
  'rare-metals-to-foundry',
  'shareholder-packets-to-finance',
  'legal-archives-to-capital',
  'audit-records-to-acheron',
  'paradiso-hospitality-cargo',
  'executive-delegation',
]);

function generosityForTemplate(templateId: string): number {
  if (CERBERUS_UNSAVORY_TEMPLATES.has(templateId)) return CERBERUS_UNSAVORY_GENEROSITY;
  if (CERBERUS_HIGH_VALUE_TEMPLATES.has(templateId)) return CERBERUS_HIGH_VALUE_GENEROSITY;
  return CERBERUS_BASE_GENEROSITY;
}

function compensationForTemplate(templateId: string): number {
  if (CERBERUS_UNSAVORY_TEMPLATES.has(templateId)) return CERBERUS_UNSAVORY_COMPENSATION_RATIO;
  if (CERBERUS_HIGH_VALUE_TEMPLATES.has(templateId)) return CERBERUS_HIGH_VALUE_COMPENSATION_RATIO;
  return CERBERUS_BASE_COMPENSATION_RATIO;
}

const ACHERON_COMMERCIAL_HUB_ID = 'estella-ii-commercial-hub-dock';
const ACHERON_OLYMPOS_ID = 'estella-ii-olympos';
const ACHERON_PANDEMONIUM_ID = 'estella-ii-pandemonium';
const ACHERON_CORPORATE_NODES = [ACHERON_COMMERCIAL_HUB_ID, ACHERON_OLYMPOS_ID];
const ACHERON_SURFACE_OPS_NODES = [ACHERON_COMMERCIAL_HUB_ID, ACHERON_OLYMPOS_ID, ACHERON_PANDEMONIUM_ID];
const CERBERUS_ACHERON_DESTINATION_WEIGHTS: Record<string, number> = {
  [ACHERON_COMMERCIAL_HUB_ID]: 0.6,
  [ACHERON_OLYMPOS_ID]: 0.3,
  [ACHERON_PANDEMONIUM_ID]: 0.1,
};

const CHR_WORKFORCE_ORIGINS = [
  'estella-iii-capital-city',
  'estella-iii-finance-city',
  'estella-iii-main-customs',
  'estella-iv-primary-city',
  'estella-iv-main-orbital-station',
  'estella-v-capital-settlement',
  'caravanserai-main-commercial-dock',
  'caravanserai-customs-inspection',
  'caravanserai-free-trader-anchorage',
  'estella-xid-main-port',
  'estella-xid-customs-transit',
];

const CERBERUS_TEMPLATES: CerberusContractTemplate[] = [
  // Custody and workforce intake from large population and legal/industrial hubs.
  { templateId: 'workforce-transfer-to-hub', sourceIds: CHR_WORKFORCE_ORIGINS, destinationIds: [ACHERON_COMMERCIAL_HUB_ID], cargoLabel: 'workforce transfer group', massClass: 'standard', likelihood: 1.0 },
  { templateId: 'custody-transfer-to-olympos', sourceIds: CHR_WORKFORCE_ORIGINS, destinationIds: [ACHERON_OLYMPOS_ID], cargoLabel: 'custody transfer passengers', massClass: 'standard', likelihood: 1.0 },
  { templateId: 'surface-labor-allocation', sourceIds: CHR_WORKFORCE_ORIGINS, destinationIds: [ACHERON_PANDEMONIUM_ID], cargoLabel: 'surface labor allocation', massClass: 'heavy', likelihood: 1.0 },

  // Acheron-local transshipment between the orbital interface, Olympos, and the surface chain.
  { templateId: 'local-custody-processing', sourceIds: [ACHERON_COMMERCIAL_HUB_ID], destinationIds: [ACHERON_OLYMPOS_ID], cargoLabel: 'custody processing passengers', massClass: 'standard', likelihood: 2.0 },
  { templateId: 'local-workforce-manifests', sourceIds: [ACHERON_OLYMPOS_ID], destinationIds: [ACHERON_COMMERCIAL_HUB_ID], cargoLabel: 'workforce transfer manifests', massClass: 'light', likelihood: 1.55 },
  { templateId: 'local-rare-metal-export-staging', sourceIds: [ACHERON_OLYMPOS_ID, ACHERON_PANDEMONIUM_ID], destinationIds: [ACHERON_COMMERCIAL_HUB_ID], cargoLabel: 'rare-metal export staging pallets', massClass: 'dense', likelihood: 2.15 },
  { templateId: 'local-carbonvale-export-staging', sourceIds: [ACHERON_OLYMPOS_ID], destinationIds: [ACHERON_COMMERCIAL_HUB_ID], cargoLabel: 'Carbonvale export lots', massClass: 'heavy', likelihood: 1.8 },
  { templateId: 'local-shareholder-packets', sourceIds: [ACHERON_OLYMPOS_ID], destinationIds: [ACHERON_COMMERCIAL_HUB_ID], cargoLabel: 'shareholder packets', massClass: 'light', likelihood: 1.25 },
  { templateId: 'local-legal-archives', sourceIds: [ACHERON_OLYMPOS_ID], destinationIds: [ACHERON_COMMERCIAL_HUB_ID], cargoLabel: 'sealed legal archives', massClass: 'light', likelihood: 1.15 },
  { templateId: 'local-pressure-equipment-staging', sourceIds: [ACHERON_COMMERCIAL_HUB_ID], destinationIds: [ACHERON_OLYMPOS_ID], cargoLabel: 'pressure-chain equipment pallets', massClass: 'heavy', likelihood: 1.65 },
  { templateId: 'local-paradiso-hospitality', sourceIds: [ACHERON_COMMERCIAL_HUB_ID], destinationIds: [ACHERON_OLYMPOS_ID], cargoLabel: 'Paradiso hospitality cargo', massClass: 'standard', likelihood: 1.45 },
  { templateId: 'local-executive-medicine', sourceIds: [ACHERON_COMMERCIAL_HUB_ID], destinationIds: [ACHERON_OLYMPOS_ID], cargoLabel: 'executive medicine lockers', massClass: 'light', likelihood: 1.25 },
  { templateId: 'local-audit-records', sourceIds: [ACHERON_COMMERCIAL_HUB_ID], destinationIds: [ACHERON_OLYMPOS_ID], cargoLabel: 'sealed audit records', massClass: 'light', likelihood: 1.1 },
  { templateId: 'local-hydrogen-chain-staging', sourceIds: [ACHERON_COMMERCIAL_HUB_ID], destinationIds: [ACHERON_OLYMPOS_ID, ACHERON_PANDEMONIUM_ID], cargoLabel: 'surface hydrogen ration tanks', massClass: 'standard', likelihood: 1.4 },
  { templateId: 'local-surface-labor-processing', sourceIds: [ACHERON_COMMERCIAL_HUB_ID, ACHERON_OLYMPOS_ID], destinationIds: [ACHERON_PANDEMONIUM_ID], cargoLabel: 'surface labor allocation', massClass: 'heavy', likelihood: 1.2 },

  // Carbonvale and Olympos exports.
  { templateId: 'carbon-fiber-to-camps', sourceIds: ACHERON_CORPORATE_NODES, destinationIds: ['estella-vi-heavy-cargo-station'], cargoLabel: 'carbon-fiber structural rolls', massClass: 'heavy', likelihood: 0.95 },
  { templateId: 'graphene-to-drydock', sourceIds: ACHERON_CORPORATE_NODES, destinationIds: ['estella-via-drydock-station', 'caravanserai-outfitter-drydock'], cargoLabel: 'graphene cable stock', massClass: 'standard', likelihood: 0.8 },
  { templateId: 'graphite-to-components', sourceIds: ACHERON_CORPORATE_NODES, destinationIds: ['estella-via-component-supply-station'], cargoLabel: 'graphite heat-sink blocks', massClass: 'heavy', likelihood: 0.7 },
  { templateId: 'oxygen-industrial-bottles', sourceIds: ACHERON_CORPORATE_NODES, destinationIds: ['estella-xid-main-port', 'estella-vi-heavy-cargo-station'], cargoLabel: 'industrial oxygen bottles', massClass: 'standard', likelihood: 0.55 },

  // High-value surface extraction exports.
  { templateId: 'rare-metals-to-gaia-tech', sourceIds: ACHERON_SURFACE_OPS_NODES, destinationIds: ['estella-iii-high-tech-city'], cargoLabel: 'platinum-group metal ingots', massClass: 'dense', likelihood: 1.0 },
  { templateId: 'silica-to-precision-factory', sourceIds: ACHERON_SURFACE_OPS_NODES, destinationIds: ['estella-vii-high-vacuum-factory'], cargoLabel: 'silica crystal stock', massClass: 'heavy', likelihood: 0.65 },
  { templateId: 'rare-metals-to-foundry', sourceIds: ACHERON_SURFACE_OPS_NODES, destinationIds: ['estella-vi-heavy-cargo-station'], cargoLabel: 'pressure-mined rare metal pallets', massClass: 'dense', likelihood: 0.8 },

  // Inputs for surface operations and chain maintenance.
  { templateId: 'pressure-valves-to-acheron', sourceIds: ['estella-vi-heavy-cargo-station'], destinationIds: ACHERON_SURFACE_OPS_NODES, cargoLabel: 'deep-pressure valve assemblies', massClass: 'heavy', likelihood: 0.9 },
  { templateId: 'lift-bearings-to-olympos', sourceIds: ['estella-via-component-supply-station', 'estella-via-drydock-station'], destinationIds: [ACHERON_OLYMPOS_ID], cargoLabel: 'acid-rated lift bearings', massClass: 'heavy', likelihood: 0.75 },
  { templateId: 'medicine-to-olympos', sourceIds: ['estella-vib-cold-chain-station'], destinationIds: [ACHERON_OLYMPOS_ID, ACHERON_COMMERCIAL_HUB_ID], cargoLabel: 'executive medicine lockers', massClass: 'light', likelihood: 0.55 },
  { templateId: 'hydrogen-to-pandemonium', sourceIds: ['estella-ii-nimbus-crucible', ACHERON_COMMERCIAL_HUB_ID, ACHERON_OLYMPOS_ID], destinationIds: [ACHERON_PANDEMONIUM_ID], cargoLabel: 'surface hydrogen ration tanks', massClass: 'standard', likelihood: 0.9 },

  // Corporate governance, finance, and luxury consumption.
  { templateId: 'shareholder-packets-to-finance', sourceIds: ACHERON_CORPORATE_NODES, destinationIds: ['estella-iii-finance-city'], cargoLabel: 'shareholder packets', massClass: 'light', likelihood: 0.75 },
  { templateId: 'legal-archives-to-capital', sourceIds: ACHERON_CORPORATE_NODES, destinationIds: ['estella-iii-capital-city'], cargoLabel: 'sealed legal archives', massClass: 'light', likelihood: 0.65 },
  { templateId: 'audit-records-to-acheron', sourceIds: ['estella-iii-finance-city', 'estella-iii-capital-city'], destinationIds: ACHERON_CORPORATE_NODES, cargoLabel: 'sealed audit records', massClass: 'light', likelihood: 0.6 },
  { templateId: 'paradiso-hospitality-cargo', sourceIds: ['estella-iii-luxury-orbital-habitat', 'estella-iv-primary-city', 'caravanserai-highliner-bay-poi'], destinationIds: [ACHERON_OLYMPOS_ID], cargoLabel: 'Paradiso hospitality cargo', massClass: 'standard', likelihood: 0.65 },
  { templateId: 'executive-delegation', sourceIds: ['estella-iii-finance-city', 'estella-iii-capital-city', ACHERON_OLYMPOS_ID], destinationIds: [ACHERON_OLYMPOS_ID, 'estella-iii-finance-city'], cargoLabel: 'executive delegation', massClass: 'light', likelihood: 0.5 },
];

function cargoForTemplate(template: CerberusContractTemplate, sourceId: string, destinationId: string): MissionCargoSpec {
  return {
    label: template.cargoLabel,
    massClass: template.massClass,
    massTons: cargoMassForClass(template.massClass, `${CERBERUS_ID}:${template.templateId}:${sourceId}->${destinationId}:${template.cargoLabel}`),
  };
}

function destinationLikelihood(destinationId: string): number {
  return CERBERUS_ACHERON_DESTINATION_WEIGHTS[destinationId] ?? 1;
}

function candidatesFromTemplates(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  for (const template of CERBERUS_TEMPLATES) {
    if (!template.sourceIds.includes(ctx.sourceId)) continue;
    for (const destinationId of template.destinationIds) {
      if (destinationId === ctx.sourceId) continue;
      const passenger = CERBERUS_PASSENGER_TEMPLATES.has(template.templateId);
      out.push({
        factionId: CERBERUS_ID,
        factionName: CERBERUS_NAME,
        factionTag: CERBERUS_TAG,
        templateId: template.templateId,
        sourceId: ctx.sourceId,
        destinationId,
        cargo: cargoForTemplate(template, ctx.sourceId, destinationId),
        likelihood: template.likelihood * destinationLikelihood(destinationId),
        generosity: passenger ? CERBERUS_PASSENGER_GENEROSITY : generosityForTemplate(template.templateId),
        compensationRatio: passenger ? CERBERUS_PASSENGER_COMPENSATION_RATIO : compensationForTemplate(template.templateId),
        maxCompAllowance: CERBERUS_MAX_COMP_ALLOWANCE,
        category: passenger ? 'passenger' : undefined,
      });
    }
  }
  return out.map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const CERBERUS_HUMAN_RESOURCES_PROVIDER: FactionContractProvider = {
  id: CERBERUS_ID,
  name: CERBERUS_NAME,
  generosity: CERBERUS_BASE_GENEROSITY,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return candidatesFromTemplates(ctx);
  },
};
