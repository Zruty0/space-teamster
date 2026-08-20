import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

const AUTHORITY_ID = 'oathmark-accord-authority';
const AUTHORITY_NAME = 'Oathmark Accord Authority';
const AUTHORITY_TAG = 'ACCORD';

const SERRAT_DOMAIN_SHIPYARD = 'estella-xie-outer-spec-drydock';
const KEELWRIGHT_WORKS = 'estella-xie-rare-alloy-extraction';
const OATHMARK_ACADEMY = 'estella-xie-oathmark-academy';

const SVAROG_SHIPYARD = 'estella-via-drydock-station';
const VELES_TERMINAL = 'estella-via-component-supply-station';
const HAMMER_STATION = 'estella-vi-heavy-cargo-station';
const MOSAIC_ASSEMBLY_LAB = 'estella-vii-high-vacuum-factory';
const GRYPHON_AERIE = 'estella-x-observation-skim-hub';
const HYDRA_MAW_ORBITAL = 'estella-xi-skim-hub';
const MANTICORE_OBSERVATORY = 'estella-xii-observation-post';
const CADIZ_HIGHPORT = 'estella-xid-main-port';

const GENEROSITY = 0.15;
const COMPENSATION_RATIO = 0.85;
const MAX_COMP_ALLOWANCE = 2;
const INTERNAL_WARRANT_FEE = 6_000;
const EXTERNAL_WARRANT_FEE = 12_000;
const PASSENGER_WARRANT_FEE = 10_000;
const MEDIATION_WARRANT_FEE = 20_000;

type ContractKind = 'industrial' | 'passenger' | 'mediation';

interface CargoOption {
  label: string;
  massClass: CargoMassClass;
  category?: 'passenger';
}

interface AccordLane {
  id: string;
  kind: ContractKind;
  sourceId: string;
  destinationIds: readonly string[];
  cargo: readonly CargoOption[];
  likelihood: number;
  sampleCount: number;
  destinationSampleCount?: number;
  flatReward: number;
  issuerId: string;
  issuerName: string;
}

const INDUSTRIAL_COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination) => `At ${destination}, Accord receiving clerks compare the ${cargo} against its warrant, proof marks, and custody seals. The senior clerk countersigns the delivery and releases the rig without ceremony.`,
  (_candidate, cargo, destination) => `The ${cargo} passes into ${destination}’s controlled stores under two signatures and the grey seal of Oathmark. A receipt marked CHAIN COMPLETE appears on the Teamster terminal.`,
  (_candidate, cargo, destination) => `${destination} receives the ${cargo} into the next scheduled work order. The Authority inspector checks the final seal, enters the delivery time, and says, “The warrant is satisfied.”`,
];

const PASSENGER_COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination) => `At ${destination}, the ${cargo} disembark with sealed cases and an appointment docket already open. The receiving office countersigns each name before closing the warrant.`,
  (_candidate, cargo, destination) => `A registrar meets the ${cargo} at ${destination}, verifies the passenger roll, and escorts the party directly into the scheduled examination. The Authority posts a completed-passage receipt.`,
];

const MEDIATION_COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination) => `Both parties are waiting at ${destination}, in separate galleries under separate banners. The ${cargo} pass between them without acknowledgment, and the hearing chamber doors close.`,
  (_candidate, cargo, destination) => `At ${destination}, guards from two households count the ${cargo} independently and reach the same number. The chief mediator takes custody of the disputed seals and orders the first session convened.`,
  (_candidate, cargo, destination) => `The ${cargo} enter ${destination} behind a neutral grey pennant. Raised voices stop as the Accord clerk reads the warrant aloud; your passenger receipt is signed before the arguments resume.`,
];

const KEELWRIGHT_TO_SHIPYARD: CargoOption[] = [
  { label: 'certified frame members', massClass: 'heavy' },
  { label: 'proofed structural billets', massClass: 'dense' },
  { label: 'drive alignment certification kits', massClass: 'light' },
  { label: 'airlock actuator assemblies', massClass: 'standard' },
  { label: 'maintenance control cabinets', massClass: 'standard' },
  { label: 'viewport frame assemblies', massClass: 'heavy' },
];

const SHIPYARD_TO_KEELWRIGHT: CargoOption[] = [
  { label: 'failed drive service returns', massClass: 'standard' },
  { label: 'pressure-shell rework lots', massClass: 'heavy' },
  { label: 'production returns', massClass: 'standard' },
  { label: 'spent-tooling returns', massClass: 'standard' },
  { label: 'quarantined controller returns', massClass: 'standard' },
  { label: 'client specification archives', massClass: 'light' },
];

const SHIPYARD_EXPORTS: CargoOption[] = [
  { label: 'certified refit modules', massClass: 'heavy' },
  { label: 'sealed yard acceptance papers', massClass: 'light' },
  { label: 'proofed yacht components', massClass: 'standard' },
  { label: 'shipyard machine-tool stock', massClass: 'standard' },
  { label: 'maintenance control cabinets', massClass: 'standard' },
];

const KEELWRIGHT_EXPORTS: CargoOption[] = [
  { label: 'certified frame members', massClass: 'heavy' },
  { label: 'proofed structural billets', massClass: 'dense' },
  { label: 'precision frame castings', massClass: 'heavy' },
  { label: 'airlock actuator assemblies', massClass: 'standard' },
  { label: 'maintenance control cabinets', massClass: 'standard' },
];

const ACADEMY_EQUIPMENT: CargoOption[] = [
  { label: 'referee telemetry pylons', massClass: 'standard' },
  { label: 'tilt-yard drone packs', massClass: 'standard' },
  { label: 'academy verdict rolls', massClass: 'light' },
];

const NEUTRAL_PASSENGERS: CargoOption[] = [
  { label: 'certified duel referees', massClass: 'light', category: 'passenger' },
  { label: 'incident review board', massClass: 'light', category: 'passenger' },
  { label: 'technical specialist party', massClass: 'light', category: 'passenger' },
  { label: 'yard arbitration counsel', massClass: 'light', category: 'passenger' },
  { label: 'shipwright witnesses and appraisers', massClass: 'light', category: 'passenger' },
];

const MEDIATION_PASSENGERS: CargoOption[] = [
  { label: 'emergency mediation panelists', massClass: 'standard', category: 'passenger' },
  { label: 'Accord arbitrator and seal clerks', massClass: 'light', category: 'passenger' },
  { label: 'neutral truce witnesses', massClass: 'light', category: 'passenger' },
  { label: 'yard-lien examiner and valuation counsel', massClass: 'light', category: 'passenger' },
  { label: 'charter-combat referees', massClass: 'light', category: 'passenger' },
  { label: 'succession hearing mediators', massClass: 'light', category: 'passenger' },
  { label: 'damage assessor and evidence registrar', massClass: 'light', category: 'passenger' },
];

const NOBLE_DISPUTE_SITES = [
  'estella-xa-volatiles-transit',
  'estella-xb-worker-hab',
  'estella-xc-main-outpost',
  'estella-xc-transit-refuel',
  'estella-xc-castle-alvares',
  'estella-xc-castle-mendes',
  'estella-xd-proving-grounds',
  'estella-xia-sealed-worker-hab',
  'estella-xib-science-settlement',
  'estella-xic-research-station-poi',
  'estella-xic-deep-ice-exobiology',
  'estella-xic-last-breath-lists',
  'estella-xid-services-outfitter-hangar',
  'estella-xiic-castle-teide',
] as const;

const LANES: readonly AccordLane[] = [
  {
    id: 'keelwright-to-shipyard', kind: 'industrial', sourceId: KEELWRIGHT_WORKS,
    destinationIds: [SERRAT_DOMAIN_SHIPYARD], cargo: KEELWRIGHT_TO_SHIPYARD,
    likelihood: 3.0, sampleCount: 2, flatReward: INTERNAL_WARRANT_FEE,
    issuerId: 'keelwright-warrant-office', issuerName: 'Keelwright Works Warrant Office',
  },
  {
    id: 'shipyard-to-keelwright', kind: 'industrial', sourceId: SERRAT_DOMAIN_SHIPYARD,
    destinationIds: [KEELWRIGHT_WORKS], cargo: SHIPYARD_TO_KEELWRIGHT,
    likelihood: 3.0, sampleCount: 2, flatReward: INTERNAL_WARRANT_FEE,
    issuerId: 'serrat-domain-yard-dispatch', issuerName: 'Serrat Domain Yard Dispatch',
  },
  {
    id: 'shipyard-to-academy', kind: 'industrial', sourceId: SERRAT_DOMAIN_SHIPYARD,
    destinationIds: [OATHMARK_ACADEMY], cargo: ACADEMY_EQUIPMENT,
    likelihood: 2.0, sampleCount: 1, flatReward: INTERNAL_WARRANT_FEE,
    issuerId: 'serrat-domain-yard-dispatch', issuerName: 'Serrat Domain Yard Dispatch',
  },
  {
    id: 'academy-to-shipyard', kind: 'industrial', sourceId: OATHMARK_ACADEMY,
    destinationIds: [SERRAT_DOMAIN_SHIPYARD], cargo: ACADEMY_EQUIPMENT,
    likelihood: 1.5, sampleCount: 1, flatReward: INTERNAL_WARRANT_FEE,
    issuerId: 'oathmark-academy-registrar', issuerName: 'Oathmark Academy Registrar',
  },
  {
    id: 'academy-equipment-exports', kind: 'industrial', sourceId: OATHMARK_ACADEMY,
    destinationIds: ['estella-xc-main-outpost', 'estella-xd-proving-grounds', 'estella-xic-last-breath-lists', CADIZ_HIGHPORT],
    cargo: ACADEMY_EQUIPMENT, likelihood: 0.8, sampleCount: 1, destinationSampleCount: 3,
    flatReward: EXTERNAL_WARRANT_FEE, issuerId: 'oathmark-academy-registrar', issuerName: 'Oathmark Academy Registrar',
  },
  {
    id: 'shipyard-exports', kind: 'industrial', sourceId: SERRAT_DOMAIN_SHIPYARD,
    destinationIds: [SVAROG_SHIPYARD, VELES_TERMINAL, HAMMER_STATION, CADIZ_HIGHPORT, GRYPHON_AERIE, HYDRA_MAW_ORBITAL, MANTICORE_OBSERVATORY],
    cargo: SHIPYARD_EXPORTS, likelihood: 1.0, sampleCount: 1, destinationSampleCount: 4,
    flatReward: EXTERNAL_WARRANT_FEE, issuerId: 'serrat-domain-yard-dispatch', issuerName: 'Serrat Domain Yard Dispatch',
  },
  {
    id: 'keelwright-exports', kind: 'industrial', sourceId: KEELWRIGHT_WORKS,
    destinationIds: [SVAROG_SHIPYARD, VELES_TERMINAL, HAMMER_STATION, MOSAIC_ASSEMBLY_LAB, CADIZ_HIGHPORT],
    cargo: KEELWRIGHT_EXPORTS, likelihood: 1.0, sampleCount: 1, destinationSampleCount: 3,
    flatReward: EXTERNAL_WARRANT_FEE, issuerId: 'keelwright-warrant-office', issuerName: 'Keelwright Works Warrant Office',
  },
  {
    id: 'academy-neutral-passengers', kind: 'passenger', sourceId: OATHMARK_ACADEMY,
    destinationIds: [SERRAT_DOMAIN_SHIPYARD, 'estella-xc-main-outpost', 'estella-xd-proving-grounds', 'estella-xic-last-breath-lists', CADIZ_HIGHPORT],
    cargo: NEUTRAL_PASSENGERS, likelihood: 1.2, sampleCount: 1, destinationSampleCount: 4,
    flatReward: PASSENGER_WARRANT_FEE, issuerId: 'oathmark-academy-registrar', issuerName: 'Oathmark Academy Registrar',
  },
  {
    id: 'emergency-mediation-warrants', kind: 'mediation', sourceId: OATHMARK_ACADEMY,
    destinationIds: NOBLE_DISPUTE_SITES, cargo: MEDIATION_PASSENGERS,
    likelihood: 0.5, sampleCount: 1, destinationSampleCount: 3,
    flatReward: MEDIATION_WARRANT_FEE, issuerId: 'accord-custody-office', issuerName: 'Accord Custody Office',
  },
];

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededSample<T>(items: readonly T[], count: number, seed: number): T[] {
  const out = items.slice();
  let state = seed >>> 0 || 1;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, Math.min(count, out.length));
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function completionPool(kind: ContractKind): CompletionBlurb[] {
  if (kind === 'mediation') return MEDIATION_COMPLETION_BLURBS;
  if (kind === 'passenger') return PASSENGER_COMPLETION_BLURBS;
  return INDUSTRIAL_COMPLETION_BLURBS;
}

function candidate(lane: AccordLane, destinationId: string, option: CargoOption, worldTime: number): FactionContractCandidate {
  const templateId = `${lane.id}:${destinationId}:${slug(option.label)}`;
  const cargo: MissionCargoSpec = {
    label: option.label,
    massClass: option.massClass,
    massTons: cargoMassForClass(option.massClass, `${AUTHORITY_ID}:${templateId}:${lane.sourceId}->${destinationId}`),
  };
  const result: FactionContractCandidate = {
    factionId: AUTHORITY_ID,
    factionName: AUTHORITY_NAME,
    factionTag: AUTHORITY_TAG,
    templateId,
    sourceId: lane.sourceId,
    destinationId,
    cargo,
    likelihood: lane.likelihood,
    generosity: GENEROSITY,
    flatReward: lane.flatReward,
    compensationRatio: COMPENSATION_RATIO,
    maxCompAllowance: MAX_COMP_ALLOWANCE,
    issuerId: lane.issuerId,
    issuerName: lane.issuerName,
    category: option.category,
  };
  return { ...result, completionMessage: completionBlurbFrom(completionPool(lane.kind), result, worldTime) };
}

function generateOathmarkAccordContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const day = Math.floor(ctx.worldTime / 86_400);
  return LANES.flatMap(lane => {
    if (lane.sourceId !== ctx.sourceId) return [];
    const destinations = lane.destinationSampleCount
      ? seededSample(lane.destinationIds, lane.destinationSampleCount, hashString(`${lane.id}:destinations:${day}`))
      : lane.destinationIds.slice();
    return destinations.flatMap(destinationId => seededSample(
      lane.cargo,
      lane.sampleCount,
      hashString(`${lane.id}:${lane.sourceId}->${destinationId}:${day}`),
    ).map(option => candidate(lane, destinationId, option, ctx.worldTime)));
  });
}

export const OATHMARK_ACCORD_AUTHORITY_PROVIDER: FactionContractProvider = {
  id: AUTHORITY_ID,
  name: AUTHORITY_NAME,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateOathmarkAccordContracts(ctx);
  },
};
