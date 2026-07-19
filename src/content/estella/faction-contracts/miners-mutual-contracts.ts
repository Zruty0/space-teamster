import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

interface MinersMutualContractTemplate {
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

const NEW_CANAAN_DOCKS = ['harlan-dock', 'mercer-dock'];

const MINERS_MUTUAL_TEMPLATES: MinersMutualContractTemplate[] = [
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
      });
    }
  }
  return out;
}

export const NEW_CANAAN_MINERS_MUTUAL_PROVIDER: FactionContractProvider = {
  id: MINERS_MUTUAL_ID,
  name: MINERS_MUTUAL_NAME,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return candidatesFromTemplates(ctx);
  },
};
