import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

interface GuildContractTemplate {
  templateId: string;
  sourceIds: string[];
  destinationIds: string[];
  cargoLabel: string;
  massClass: CargoMassClass;
  likelihood: number;
  /** Per-template pay override; falls back to Guild routine pay when omitted. */
  generosity?: number;
  compensationRatio?: number;
}

const GUILD_ID = 'teamsters-guild';
const GUILD_NAME = 'The Teamsters\' Guild';
const GUILD_TAG = 'GUILD';

// Routine Guild work pays a normal fixed premium plus partial fuel reimbursement. Near-star
// precursor runs are the "extreme rates, extreme mortality" work: high fixed pay, little or no
// reimbursement.
const GUILD_BASE_GENEROSITY = 0.85;
const GUILD_BASE_COMPENSATION_RATIO = 0.4;
const SKIM_GENEROSITY = 1.7;
const SKIM_COMPENSATION_RATIO = 0;
const SKIM_STAGING_GENEROSITY = 1.3;
const SKIM_STAGING_COMPENSATION_RATIO = 0.15;
const GUILD_PAPER_GENEROSITY = 0.9;
const GUILD_PAPER_COMPENSATION_RATIO = 0.35;
const GUILD_MAX_COMP_ALLOWANCE = 2;

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination, issuer) => `${issuer} closes the ${cargo} manifest at ${destination} with an old stamp and a newer encryption key. "The road remembers reliable hands," the dispatcher says.`,
  (_candidate, cargo, destination) => `At ${destination}, Guild freight clerks take the ${cargo} into custody and argue over the ledger in three dialects. Your account balance settles before they finish.`,
  (_candidate, cargo, destination, issuer) => `${issuer} marks the ${cargo} delivered at ${destination}. "Acceptable time," a senior Teamster mutters, which is almost a compliment.`,
  (_candidate, cargo, destination) => `The ${cargo} clears Guild inspection at ${destination}. The BBS posts a plain thank-you and a reminder that the next job is already waiting.`,
  (_candidate, cargo, destination) => `At ${destination}, the Guild crew handles the ${cargo} like monopoly property: carefully, possessively, and with no apologies. The contract closes clean.`,
];

// Guild flight-control / fuel-chain nodes. Guild work is only posted at these docks.
// Precursor skim-in originates at the near-star skim hubs and Estella I staging.
// Fuel distribution and hardware originate at the Still; paperwork at Guild offices.
// Bulk fuel canisters only move to high-throughput traffic hubs (Caravanserai, the
// Wells main-port hub, the Reach main port); small relays refuel locally.
const SKIM_STAGING_DOCK = 'estella-i-transit-customs';
const STILL_SKIM_BERTH = 'still-skim-runner-berth-poi';
const STILL_DISTRIBUTION = 'still-distribution-bay';
const GUILD_HQ = 'still-guild-hq';
const CERTIFICATION_AUTHORITY = 'caravanserai-certification-authority';

const GUILD_TEMPLATES: GuildContractTemplate[] = [
  // Precursor skim-in: crews haul stellar antimatter precursor from the near-star skim hubs to the Still.
  { templateId: 'skim-precursor-alpha', sourceIds: ['skim-hub-alpha-precursor-dock'], destinationIds: [STILL_SKIM_BERTH], cargoLabel: 'sealed antimatter precursor canisters', massClass: 'dense', likelihood: 1.2, generosity: SKIM_GENEROSITY, compensationRatio: SKIM_COMPENSATION_RATIO },
  { templateId: 'skim-precursor-beta', sourceIds: ['skim-hub-beta-precursor-dock'], destinationIds: [STILL_SKIM_BERTH], cargoLabel: 'sealed antimatter precursor canisters', massClass: 'dense', likelihood: 0.8, generosity: SKIM_GENEROSITY, compensationRatio: SKIM_COMPENSATION_RATIO },
  { templateId: 'skim-staging-precursor', sourceIds: [SKIM_STAGING_DOCK], destinationIds: [STILL_SKIM_BERTH], cargoLabel: 'staged precursor lot', massClass: 'heavy', likelihood: 0.7, generosity: SKIM_STAGING_GENEROSITY, compensationRatio: SKIM_STAGING_COMPENSATION_RATIO },

  // Fuel distribution-out: limited bulk canister runs from the Still to major traffic hubs only.
  { templateId: 'fuel-serai', sourceIds: [STILL_DISTRIBUTION], destinationIds: ['caravanserai-refuel-depot'], cargoLabel: 'stable fuel canisters', massClass: 'standard', likelihood: 0.9 },
  { templateId: 'fuel-wells-hub', sourceIds: [STILL_DISTRIBUTION], destinationIds: ['estella-xid-main-port'], cargoLabel: 'stable fuel canisters', massClass: 'standard', likelihood: 0.55 },
  { templateId: 'fuel-reach-port', sourceIds: [STILL_DISTRIBUTION], destinationIds: ['estella-xiii-main-port'], cargoLabel: 'stable fuel canisters', massClass: 'standard', likelihood: 0.45 },

  // Engine / RCS supply: Guild-controlled propulsion hardware out to outfitters and maintenance yards.
  { templateId: 'engine-outfitter-serai', sourceIds: [STILL_DISTRIBUTION], destinationIds: ['caravanserai-outfitter-drydock'], cargoLabel: 'certified maneuvering engine units', massClass: 'heavy', likelihood: 0.8 },
  { templateId: 'engine-svarog', sourceIds: [STILL_DISTRIBUTION], destinationIds: ['estella-via-drydock-station'], cargoLabel: 'certified main-drive cores', massClass: 'dense', likelihood: 0.65 },
  { templateId: 'rcs-yardstock', sourceIds: [STILL_DISTRIBUTION], destinationIds: ['estella-via-component-supply-station'], cargoLabel: 'RCS thruster packages', massClass: 'standard', likelihood: 0.6 },
  { templateId: 'engine-nells-rest', sourceIds: [STILL_DISTRIBUTION, GUILD_HQ], destinationIds: ['estella-viii-first-rendezvous-station'], cargoLabel: 'engine overhaul kits', massClass: 'heavy', likelihood: 0.55 },

  // Certification / insurance / debt paperwork: light courier work between Guild offices and Hearth authority.
  { templateId: 'guild-records-finance', sourceIds: [GUILD_HQ], destinationIds: ['estella-iii-finance-city'], cargoLabel: 'sealed Guild insurance archives', massClass: 'light', likelihood: 0.5, generosity: GUILD_PAPER_GENEROSITY, compensationRatio: GUILD_PAPER_COMPENSATION_RATIO },
  { templateId: 'guild-records-capital', sourceIds: [GUILD_HQ], destinationIds: ['estella-iii-capital-city'], cargoLabel: 'sealed debt-ledger records', massClass: 'light', likelihood: 0.45, generosity: GUILD_PAPER_GENEROSITY, compensationRatio: GUILD_PAPER_COMPENSATION_RATIO },
  { templateId: 'cert-records-to-hq', sourceIds: [CERTIFICATION_AUTHORITY], destinationIds: [GUILD_HQ], cargoLabel: 'certification audit packets', massClass: 'light', likelihood: 0.55, generosity: GUILD_PAPER_GENEROSITY, compensationRatio: GUILD_PAPER_COMPENSATION_RATIO },
];

function cargoForTemplate(template: GuildContractTemplate, sourceId: string, destinationId: string): MissionCargoSpec {
  return {
    label: template.cargoLabel,
    massClass: template.massClass,
    massTons: cargoMassForClass(template.massClass, `${GUILD_ID}:${template.templateId}:${sourceId}->${destinationId}:${template.cargoLabel}`),
  };
}

function candidatesFromTemplates(ctx: FactionContractContext): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  for (const template of GUILD_TEMPLATES) {
    if (!template.sourceIds.includes(ctx.sourceId)) continue;
    for (const destinationId of template.destinationIds) {
      if (destinationId === ctx.sourceId) continue;
      out.push({
        factionId: GUILD_ID,
        factionName: GUILD_NAME,
        factionTag: GUILD_TAG,
        templateId: template.templateId,
        sourceId: ctx.sourceId,
        destinationId,
        cargo: cargoForTemplate(template, ctx.sourceId, destinationId),
        likelihood: template.likelihood,
        generosity: template.generosity ?? GUILD_BASE_GENEROSITY,
        compensationRatio: template.compensationRatio ?? GUILD_BASE_COMPENSATION_RATIO,
        maxCompAllowance: GUILD_MAX_COMP_ALLOWANCE,
      });
    }
  }
  return out.map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const TEAMSTERS_GUILD_PROVIDER: FactionContractProvider = {
  id: GUILD_ID,
  name: GUILD_NAME,
  generosity: GUILD_BASE_GENEROSITY,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return candidatesFromTemplates(ctx);
  },
};
