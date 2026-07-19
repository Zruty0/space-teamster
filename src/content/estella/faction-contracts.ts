import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../mission-cost';

export interface FactionContractContext {
  sourceId: string;
  worldTime: number;
}

export interface FactionContractCandidate {
  factionId: string;
  factionName: string;
  factionTag: string;
  templateId: string;
  sourceId: string;
  destinationId: string;
  cargo: MissionCargoSpec;
  likelihood: number;
}

export interface FactionContractProvider {
  id: string;
  name: string;
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[];
}

interface FactionContractTemplate {
  templateId: string;
  sourceIds: string[];
  destinationIds: string[];
  cargoLabel: string;
  massClass: CargoMassClass;
  likelihood: number;
}

const MINERS_MUTUAL_ID = 'new-canaan-miners-mutual';
const MINERS_MUTUAL_NAME = 'New Canaan Miners Mutual';
const MINERS_MUTUAL_TAG = 'CO-OP';

const CERBERUS_ID = 'cerberus-human-resources';
const CERBERUS_NAME = 'Cerberus Human Resources';
const CERBERUS_TAG = 'CHR';

const NEW_CANAAN_DOCKS = ['harlan-dock', 'mercer-dock'];
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
  'estella-vi-industrial-city',
  'estella-vi-spaceport',
  'estella-vi-main-transit-dispatch',
  'caravanserai-main-commercial-dock',
  'caravanserai-customs-inspection',
  'caravanserai-free-trader-anchorage',
  'estella-xid-main-port',
  'estella-xid-customs-transit',
];

const MINERS_MUTUAL_TEMPLATES: FactionContractTemplate[] = [
  // Emergency purchases from expensive Caravanserai suppliers: uncommon, but visible at game start.
  { templateId: 'serai-emergency-patch-kits', sourceIds: ['caravanserai-main-commercial-dock'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'emergency patch kits', massClass: 'light', likelihood: 0.35 },
  { templateId: 'serai-oxygen-bottles', sourceIds: ['caravanserai-refuel-depot'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'emergency oxygen bottles', massClass: 'light', likelihood: 0.45 },

  // Preferred inbound bulk supply: cheaper industrial/life-support suppliers outside the Caravanserai.
  { templateId: 'industrial-pressure-seals', sourceIds: ['estella-vi-industrial-city'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'pressure seals and valve blocks', massClass: 'standard', likelihood: 1.1 },
  { templateId: 'foundry-recycler-parts', sourceIds: ['estella-vi-foundry-complex'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'recycler pump cartridges', massClass: 'standard', likelihood: 0.95 },
  { templateId: 'component-rotary-kits', sourceIds: ['estella-via-component-supply-station'], destinationIds: ['harlan-dock'], cargoLabel: 'rotary bearing kits', massClass: 'heavy', likelihood: 1.0 },
  { templateId: 'drydock-airlock-actuators', sourceIds: ['estella-via-drydock-station'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'airlock actuator assemblies', massClass: 'heavy', likelihood: 0.8 },
  { templateId: 'agri-ration-packs', sourceIds: ['estella-vi-agricultural-lowlands'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'bulk ration packs', massClass: 'standard', likelihood: 0.75 },
  { templateId: 'cold-chain-medical', sourceIds: ['estella-vib-cold-chain-station'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'medical cold-chain lockers', massClass: 'light', likelihood: 0.55 },
  { templateId: 'still-pressure-gas', sourceIds: ['still-public-approach-dock'], destinationIds: NEW_CANAAN_DOCKS, cargoLabel: 'certified pressure gas cylinders', massClass: 'standard', likelihood: 0.65 },

  // Outbound brokerage from the Co-op rocks to buyers with better processors.
  { templateId: 'tailings-to-foundry', sourceIds: NEW_CANAAN_DOCKS, destinationIds: ['estella-vi-foundry-complex'], cargoLabel: 'low-grade titanium tailings concentrate', massClass: 'dense', likelihood: 1.15 },
  { templateId: 'basalt-to-industrial-city', sourceIds: NEW_CANAAN_DOCKS, destinationIds: ['estella-vi-industrial-city'], cargoLabel: 'basalt fiber feedstock', massClass: 'heavy', likelihood: 0.95 },
  { templateId: 'scrap-to-drydock', sourceIds: NEW_CANAAN_DOCKS, destinationIds: ['estella-via-drydock-station'], cargoLabel: 'scrap pressure alloy', massClass: 'heavy', likelihood: 0.9 },
  { templateId: 'shielding-to-components', sourceIds: NEW_CANAAN_DOCKS, destinationIds: ['estella-via-component-supply-station'], cargoLabel: 'regolith shielding blocks', massClass: 'dense', likelihood: 0.7 },
  { templateId: 'assay-to-high-tech', sourceIds: NEW_CANAAN_DOCKS, destinationIds: ['estella-iii-high-tech-city'], cargoLabel: 'sealed assay cores', massClass: 'light', likelihood: 0.45 },
];

const CERBERUS_TEMPLATES: FactionContractTemplate[] = [
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
  { templateId: 'carbon-fiber-to-camps', sourceIds: ACHERON_CORPORATE_NODES, destinationIds: ['estella-vi-industrial-city'], cargoLabel: 'carbon-fiber structural rolls', massClass: 'heavy', likelihood: 0.95 },
  { templateId: 'graphene-to-drydock', sourceIds: ACHERON_CORPORATE_NODES, destinationIds: ['estella-via-drydock-station', 'caravanserai-outfitter-drydock'], cargoLabel: 'graphene cable stock', massClass: 'standard', likelihood: 0.8 },
  { templateId: 'graphite-to-components', sourceIds: ACHERON_CORPORATE_NODES, destinationIds: ['estella-via-component-supply-station'], cargoLabel: 'graphite heat-sink blocks', massClass: 'heavy', likelihood: 0.7 },
  { templateId: 'oxygen-industrial-bottles', sourceIds: ACHERON_CORPORATE_NODES, destinationIds: ['estella-xid-main-port', 'estella-vi-heavy-cargo-station'], cargoLabel: 'industrial oxygen bottles', massClass: 'standard', likelihood: 0.55 },

  // High-value surface extraction exports.
  { templateId: 'rare-metals-to-gaia-tech', sourceIds: ACHERON_SURFACE_OPS_NODES, destinationIds: ['estella-iii-high-tech-city'], cargoLabel: 'platinum-group metal ingots', massClass: 'dense', likelihood: 1.0 },
  { templateId: 'silica-to-precision-factory', sourceIds: ACHERON_SURFACE_OPS_NODES, destinationIds: ['estella-vii-high-vacuum-factory'], cargoLabel: 'silica crystal stock', massClass: 'heavy', likelihood: 0.65 },
  { templateId: 'rare-metals-to-foundry', sourceIds: ACHERON_SURFACE_OPS_NODES, destinationIds: ['estella-vi-foundry-complex'], cargoLabel: 'pressure-mined rare metal pallets', massClass: 'dense', likelihood: 0.8 },

  // Inputs for surface operations and chain maintenance.
  { templateId: 'pressure-valves-to-acheron', sourceIds: ['estella-vi-foundry-complex', 'estella-vi-industrial-city'], destinationIds: ACHERON_SURFACE_OPS_NODES, cargoLabel: 'deep-pressure valve assemblies', massClass: 'heavy', likelihood: 0.9 },
  { templateId: 'lift-bearings-to-olympos', sourceIds: ['estella-via-component-supply-station', 'estella-via-drydock-station'], destinationIds: ['estella-ii-olympos'], cargoLabel: 'acid-rated lift bearings', massClass: 'heavy', likelihood: 0.75 },
  { templateId: 'medicine-to-olympos', sourceIds: ['estella-vib-cold-chain-station'], destinationIds: ['estella-ii-olympos', 'estella-ii-commercial-hub-dock'], cargoLabel: 'executive medicine lockers', massClass: 'light', likelihood: 0.55 },
  { templateId: 'hydrogen-to-pandemonium', sourceIds: ['estella-ii-nimbus-crucible', ACHERON_COMMERCIAL_HUB_ID, ACHERON_OLYMPOS_ID], destinationIds: [ACHERON_PANDEMONIUM_ID], cargoLabel: 'surface hydrogen ration tanks', massClass: 'standard', likelihood: 0.9 },

  // Corporate governance, finance, and luxury consumption.
  { templateId: 'shareholder-packets-to-finance', sourceIds: ACHERON_CORPORATE_NODES, destinationIds: ['estella-iii-finance-city'], cargoLabel: 'shareholder packets', massClass: 'light', likelihood: 0.75 },
  { templateId: 'legal-archives-to-capital', sourceIds: ACHERON_CORPORATE_NODES, destinationIds: ['estella-iii-capital-city'], cargoLabel: 'sealed legal archives', massClass: 'light', likelihood: 0.65 },
  { templateId: 'audit-records-to-acheron', sourceIds: ['estella-iii-finance-city', 'estella-iii-capital-city'], destinationIds: ACHERON_CORPORATE_NODES, cargoLabel: 'sealed audit records', massClass: 'light', likelihood: 0.6 },
  { templateId: 'paradiso-hospitality-cargo', sourceIds: ['estella-iii-luxury-orbital-habitat', 'estella-iv-primary-city', 'caravanserai-highliner-bay-poi'], destinationIds: ['estella-ii-olympos'], cargoLabel: 'Paradiso hospitality cargo', massClass: 'standard', likelihood: 0.65 },
  { templateId: 'executive-delegation', sourceIds: ['estella-iii-finance-city', 'estella-iii-capital-city', 'estella-ii-olympos'], destinationIds: ['estella-ii-olympos', 'estella-iii-finance-city'], cargoLabel: 'executive delegation', massClass: 'light', likelihood: 0.5 },
];

function cargoForTemplate(factionId: string, template: FactionContractTemplate, sourceId: string, destinationId: string): MissionCargoSpec {
  return {
    label: template.cargoLabel,
    massClass: template.massClass,
    massTons: cargoMassForClass(template.massClass, `${factionId}:${template.templateId}:${sourceId}->${destinationId}:${template.cargoLabel}`),
  };
}

function cerberusDestinationLikelihood(destinationId: string): number {
  return CERBERUS_ACHERON_DESTINATION_WEIGHTS[destinationId] ?? 1;
}

function candidatesFromTemplates(
  factionId: string,
  factionName: string,
  factionTag: string,
  templates: FactionContractTemplate[],
  ctx: FactionContractContext,
  likelihoodForDestination: (destinationId: string) => number = () => 1,
): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  for (const template of templates) {
    if (!template.sourceIds.includes(ctx.sourceId)) continue;
    for (const destinationId of template.destinationIds) {
      if (destinationId === ctx.sourceId) continue;
      out.push({
        factionId,
        factionName,
        factionTag,
        templateId: template.templateId,
        sourceId: ctx.sourceId,
        destinationId,
        cargo: cargoForTemplate(factionId, template, ctx.sourceId, destinationId),
        likelihood: template.likelihood * likelihoodForDestination(destinationId),
      });
    }
  }
  return out;
}

export const NEW_CANAAN_MINERS_MUTUAL_PROVIDER: FactionContractProvider = {
  id: MINERS_MUTUAL_ID,
  name: MINERS_MUTUAL_NAME,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return candidatesFromTemplates(MINERS_MUTUAL_ID, MINERS_MUTUAL_NAME, MINERS_MUTUAL_TAG, MINERS_MUTUAL_TEMPLATES, ctx);
  },
};

export const CERBERUS_HUMAN_RESOURCES_PROVIDER: FactionContractProvider = {
  id: CERBERUS_ID,
  name: CERBERUS_NAME,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return candidatesFromTemplates(CERBERUS_ID, CERBERUS_NAME, CERBERUS_TAG, CERBERUS_TEMPLATES, ctx, cerberusDestinationLikelihood);
  },
};

export const ESTELLA_FACTION_CONTRACT_PROVIDERS: FactionContractProvider[] = [
  NEW_CANAAN_MINERS_MUTUAL_PROVIDER,
  CERBERUS_HUMAN_RESOURCES_PROVIDER,
];

export function generateFactionContractCandidates(ctx: FactionContractContext): FactionContractCandidate[] {
  return ESTELLA_FACTION_CONTRACT_PROVIDERS.flatMap(provider => provider.generateContracts(ctx));
}
