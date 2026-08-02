import type { TeamsterCertificationId } from '../../../career-state';
import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContactContractContext, FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

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
  requiredCertification?: TeamsterCertificationId;
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
  (_candidate, cargo, destination, issuer) => `${issuer} closes the ${cargo} manifest at ${destination} with an old stamp and a newer encryption key. "Route office wants the seal numbers before you undock," the dispatcher says.`,
  (_candidate, cargo, destination) => `At ${destination}, Guild freight clerks take the ${cargo} into custody and argue over the ledger in three dialects. Your account balance settles before they finish.`,
  (_candidate, cargo, destination, issuer) => `${issuer} marks the ${cargo} delivered at ${destination}. "Move the canisters behind the locked line," a senior Teamster says, already looking at the next dispatch.`,
  (_candidate, cargo, destination) => `The ${cargo} clears Guild inspection at ${destination}. The BBS posts a plain thank-you and a reminder that the next job is already waiting.`,
  (_candidate, cargo, destination) => `At ${destination}, the Guild crew handles the ${cargo} like monopoly property: carefully, possessively, and with no apologies. The contract closes clean.`,
];

// Guild flight-control / fuel-chain nodes. Guild work is only posted at these docks.
// Precursor skim-in originates at the near-star skim hubs and Estella I staging.
// Fuel distribution and hardware originate at the Still; paperwork at Guild offices.
// Bulk fuel canisters move to high-throughput traffic hubs and Wells fuel-chain anchors.
const SKIM_STAGING_DOCK = 'estella-i-transit-customs';
const STILL_SKIM_BERTH = 'still-skim-runner-berth-poi';
const STILL_DISTRIBUTION = 'still-distribution-bay';
const GUILD_HQ = 'still-guild-hq';
const CERTIFICATION_AUTHORITY = 'caravanserai-certification-authority';
const CARAVANSERAI_COMMERCIAL_DOCK = 'caravanserai-main-commercial-dock';
const STILL_PUBLIC_DOCK = 'still-public-approach-dock';
const NELLS_REST = 'estella-viii-first-rendezvous-station';
const WEYMARK_TOWN = 'estella-viii-settlement';
const ROADSTEAD = 'estella-v-transit-customs';
const CONCORD = 'estella-v-capital-settlement';
const ANVIL = 'estella-vi-main-transit-dispatch';
const PORT_STRIBOG = 'estella-vi-spaceport';

const GUILD_TEMPLATES: GuildContractTemplate[] = [
  // Precursor skim-in: crews haul stellar antimatter precursor from the near-star skim hubs to the Still.
  { templateId: 'skim-precursor-alpha', sourceIds: ['skim-hub-alpha-precursor-dock'], destinationIds: [STILL_SKIM_BERTH], cargoLabel: 'sealed antimatter precursor canisters', massClass: 'dense', likelihood: 1.2, generosity: SKIM_GENEROSITY, compensationRatio: SKIM_COMPENSATION_RATIO, requiredCertification: 'volatile-cargo' },
  { templateId: 'skim-precursor-beta', sourceIds: ['skim-hub-beta-precursor-dock'], destinationIds: [STILL_SKIM_BERTH], cargoLabel: 'sealed antimatter precursor canisters', massClass: 'dense', likelihood: 0.8, generosity: SKIM_GENEROSITY, compensationRatio: SKIM_COMPENSATION_RATIO, requiredCertification: 'volatile-cargo' },
  { templateId: 'skim-staging-precursor', sourceIds: [SKIM_STAGING_DOCK], destinationIds: [STILL_SKIM_BERTH], cargoLabel: 'staged precursor lot', massClass: 'heavy', likelihood: 0.7, generosity: SKIM_STAGING_GENEROSITY, compensationRatio: SKIM_STAGING_COMPENSATION_RATIO, requiredCertification: 'volatile-cargo' },

  // Fuel distribution-out: limited bulk canister runs from the Still to major traffic hubs and fuel-chain anchors.
  { templateId: 'fuel-serai', sourceIds: [STILL_DISTRIBUTION], destinationIds: ['caravanserai-refuel-depot'], cargoLabel: 'stable fuel canisters', massClass: 'standard', likelihood: 0.9, requiredCertification: 'volatile-cargo' },
  { templateId: 'fuel-wells-hub', sourceIds: [STILL_DISTRIBUTION], destinationIds: ['estella-x-observation-skim-hub', 'estella-xc-transit-refuel', 'estella-x-captive-refuel-relay', 'estella-xi-skim-hub', 'estella-xid-main-port', 'estella-xii-observation-post'], cargoLabel: 'stable fuel canisters', massClass: 'standard', likelihood: 0.55, requiredCertification: 'volatile-cargo' },
  { templateId: 'fuel-reach-port', sourceIds: [STILL_DISTRIBUTION], destinationIds: ['estella-xiii-main-port'], cargoLabel: 'stable fuel canisters', massClass: 'standard', likelihood: 0.45, requiredCertification: 'volatile-cargo' },

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

function certificationCandidate(
  ctx: FactionContactContractContext,
  candidate: Pick<FactionContractCandidate, 'templateId' | 'sourceId' | 'destinationId' | 'title' | 'certificationOnSuccess' | 'tutorial' | 'travelMode' | 'destinationLeadAngleFromSource' | 'completionMessage'>
    & Partial<Pick<FactionContractCandidate, 'cargo' | 'generosity' | 'flatReward' | 'compensationRatio' | 'maxCompAllowance'>>,
): FactionContractCandidate {
  return {
    factionId: GUILD_ID,
    factionName: GUILD_NAME,
    factionTag: GUILD_TAG,
    issuerId: ctx.issuer.id,
    issuerName: ctx.issuer.name,
    category: 'certification',
    cargo: candidate.cargo ?? { label: candidate.travelMode === 'old-nell' ? 'Guild apprentice passage warrant' : 'Guild certification telemetry kit', massTons: 0 },
    likelihood: 1,
    generosity: candidate.generosity ?? 0,
    flatReward: candidate.flatReward ?? 0,
    compensationRatio: candidate.compensationRatio ?? 1,
    maxCompAllowance: candidate.maxCompAllowance ?? Number.MAX_SAFE_INTEGER,
    ...candidate,
  };
}

function oldNellPassageCandidates(ctx: FactionContactContractContext): FactionContractCandidate[] {
  if (!ctx.issuer.missionTags.includes('old-nell-passage') || (ctx.progress.basic3 ?? 0) <= 0) return [];
  const fromNewCanaan = ctx.availableSourceIds.includes(CARAVANSERAI_COMMERCIAL_DOCK);
  const fromWeymark = ctx.availableSourceIds.includes(NELLS_REST);
  if (!fromNewCanaan && !fromWeymark) return [];
  const sourceId = fromNewCanaan ? CARAVANSERAI_COMMERCIAL_DOCK : NELLS_REST;
  const destinationId = fromNewCanaan ? NELLS_REST : CARAVANSERAI_COMMERCIAL_DOCK;
  return [{
    factionId: GUILD_ID,
    factionName: GUILD_NAME,
    factionTag: GUILD_TAG,
    issuerId: ctx.issuer.id,
    issuerName: ctx.issuer.name,
    templateId: fromNewCanaan ? 'old-nell-passage-to-weymark' : 'old-nell-passage-to-new-canaan',
    sourceId,
    destinationId,
    title: fromNewCanaan ? 'Ride Old Nell to Weymark' : 'Ride Old Nell to New Canaan',
    category: 'passenger',
    cargo: { label: 'Junior Teamster passage warrant', massTons: 0 },
    likelihood: 1,
    generosity: 0,
    flatReward: 0,
    compensationRatio: 0,
    travelMode: 'old-nell',
    completionMessage: fromNewCanaan
      ? 'Old Nell delivers you and your rig to Nell’s Rest. Weymark local boards and the station certification office are available from the terminal.'
      : 'Old Nell returns you and your rig to the Caravanserai. New Canaan local boards are available from the terminal.',
  }];
}

function basicCertificationCandidates(ctx: FactionContactContractContext): FactionContractCandidate[] {
  if (!ctx.issuer.missionTags.includes('certification-basic')) return [];
  const hasBasic1 = (ctx.progress.basic1 ?? 0) > 0;
  const hasBasic2 = (ctx.progress.basic2 ?? 0) > 0;
  const hasBasic3 = (ctx.progress.basic3 ?? 0) > 0;

  if (!hasBasic1 && ctx.availableSourceIds.includes(CARAVANSERAI_COMMERCIAL_DOCK)) {
    return [certificationCandidate(ctx, {
      templateId: 'basic-certification-still-transfer',
      sourceId: CARAVANSERAI_COMMERCIAL_DOCK,
      destinationId: STILL_PUBLIC_DOCK,
      title: 'Land at the Public Approach Dock at The Still',
      certificationOnSuccess: 'basic-1',
      tutorial: true,
      completionMessage: `The Public Approach Dock logs your berth without damage, and ${ctx.issuer.name} closes the first practical over comms. “That’s one. Nice and tidy—leave the exciting flying to people with poorer judgment.”`,
    })];
  }

  if (hasBasic1 && !hasBasic2 && ctx.availableSourceIds.includes(GUILD_HQ)) {
    return [certificationCandidate(ctx, {
      templateId: 'basic-certification-board-old-nell',
      sourceId: GUILD_HQ,
      destinationId: NELLS_REST,
      title: 'Board Old Nell for the checkride',
      tutorial: true,
      travelMode: 'old-nell',
      completionMessage: `Old Nell delivers you and your rig to Nell’s Rest. ${ctx.issuer.name} has already placed the next practical with the station certification office.`,
    })];
  }

  if (hasBasic1 && !hasBasic2 && ctx.availableSourceIds.includes(NELLS_REST)) {
    return [certificationCandidate(ctx, {
      templateId: 'basic-certification-weymark-landing',
      sourceId: NELLS_REST,
      destinationId: WEYMARK_TOWN,
      title: 'Deorbit and land at Weymark Town',
      certificationOnSuccess: 'basic-2',
      tutorial: true,
      completionMessage: `Weymark Town traffic logs your rig safely on the pad. ${ctx.issuer.name} signs the landing practical over the certification link. “Any landing you walk away from is a good landing.”`,
    })];
  }

  if (hasBasic2 && !hasBasic3 && ctx.availableSourceIds.includes(WEYMARK_TOWN)) {
    return [certificationCandidate(ctx, {
      templateId: 'basic-certification-nells-rest-return',
      sourceId: WEYMARK_TOWN,
      destinationId: NELLS_REST,
      title: 'Launch and dock at Nell’s Rest',
      certificationOnSuccess: 'basic-3',
      tutorial: true,
      destinationLeadAngleFromSource: 150 * Math.PI / 180,
      completionMessage: `Nell’s Rest closes the tractor capture and returns a clean berth report. ${ctx.issuer.name} signs the basic certificate. “Three for three. Welcome to the Guild rolls, Junior Teamster.”`,
    })];
  }

  if (!hasBasic3) return [];

  const candidates: FactionContractCandidate[] = [];
  const hasLine = (ctx.progress.line ?? 0) > 0;
  const hasThinAtmosphere = (ctx.progress.thinAtmosphere ?? 0) > 0;
  const hasThickAtmosphere = (ctx.progress.thickAtmosphere ?? 0) > 0;

  if (!hasLine) {
    const lineSource = ctx.availableSourceIds.includes(NELLS_REST)
      ? NELLS_REST
      : ctx.availableSourceIds.includes(GUILD_HQ)
        ? GUILD_HQ
        : undefined;
    if (lineSource) {
      candidates.push(certificationCandidate(ctx, {
        templateId: 'line-certification-roadstead-checkride',
        sourceId: lineSource,
        destinationId: ROADSTEAD,
        title: 'Fly the line checkride to Roadstead Station',
        certificationOnSuccess: 'line',
        tutorial: true,
        cargo: { label: 'bonded Guild line-check freight', massClass: 'standard', massTons: 20 },
        generosity: 0.2,
        compensationRatio: 0.8,
        maxCompAllowance: Number.MAX_SAFE_INTEGER,
        completionMessage: `Roadstead Station accepts the checkride telemetry and closes the arrival record. ${ctx.issuer.name} signs the line certificate. “That makes it official. You’re a Teamster.”`,
      }));
    }
  }

  if (!hasThinAtmosphere && ctx.availableSourceIds.includes(ROADSTEAD)) {
    candidates.push(certificationCandidate(ctx, {
      templateId: 'thin-atmosphere-endorsement-concord',
      sourceId: ROADSTEAD,
      destinationId: CONCORD,
      title: 'Fly the thin-atmosphere endorsement to Concord',
      certificationOnSuccess: 'thin-atmosphere',
      tutorial: false,
      completionMessage: `Concord pad control certifies the descent record and forwards it to Roadstead. ${ctx.issuer.name} adds the thin-atmosphere endorsement to your Guild license.`,
    }));
  }

  if (!hasThickAtmosphere && ctx.availableSourceIds.includes(ANVIL)) {
    candidates.push(certificationCandidate(ctx, {
      templateId: 'thick-atmosphere-endorsement-stribog',
      sourceId: ANVIL,
      destinationId: PORT_STRIBOG,
      title: 'Fly the thick-atmosphere endorsement to Port Stribog',
      certificationOnSuccess: 'thick-atmosphere',
      tutorial: false,
      completionMessage: `Port Stribog weather control closes the practical after touchdown. ${ctx.issuer.name} records the thick-atmosphere endorsement on your Guild license.`,
    }));
  }

  return candidates;
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
        requiredCertification: template.requiredCertification,
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
  generateContactContracts(ctx: FactionContactContractContext): FactionContractCandidate[] {
    if (ctx.issuer.missionTags.includes('old-nell-passage')) return oldNellPassageCandidates(ctx);
    return basicCertificationCandidates(ctx);
  },
};
