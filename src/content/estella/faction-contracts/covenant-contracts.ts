import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { ESTELLA_NODES_BY_ID } from '..';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

const COVENANT_ID = 'covenant-remnants';
const COVENANT_NAME = 'Covenant Remnants';
const COVENANT_TAG = 'COVENANT';
const DAY = 86_400;

const PILGRIM_GATE = 'estella-xiia-volatiles-transit';
const CASTLE_NUNES = 'estella-xiid-black-project-exile';
const MIRROR_CLINIC = 'estella-xiid-mirror-clinic';

const PROVISION_PAY = { generosity: 0.25, compensationRatio: 0.8, maxCompAllowance: 2 } as const;
const COMPACT_DUES_PAY = { generosity: 0.2, compensationRatio: 0.85, maxCompAllowance: 2 } as const;
const COMPACT_SERVICE_PAY = { generosity: 0.25, compensationRatio: 0.8, maxCompAllowance: 2 } as const;
const PASSAGE_PAY = { generosity: 0.15, compensationRatio: 0.9, maxCompAllowance: 2 } as const;

type Pay = typeof PROVISION_PAY | typeof COMPACT_DUES_PAY | typeof COMPACT_SERVICE_PAY | typeof PASSAGE_PAY;

interface CargoOption {
  label: string;
  massClass: CargoMassClass;
  order: 'Toil' | 'Genesis';
}

interface ProcurementSource {
  sourceId: string;
  cargo: readonly CargoOption[];
  likelihood: number;
}

interface CandidateArgs {
  templateId: string;
  sourceId: string;
  destinationId: string;
  cargo: { label: string; massClass: CargoMassClass };
  pay: Pay;
  issuerId: string;
  issuerName: string;
  details: string;
  completionMessage: string;
  title?: string;
  category?: 'passenger';
  likelihood?: number;
}

const MEDICAL_ESSENTIALS: readonly CargoOption[] = [
  { label: 'medical clinic lockers', massClass: 'light', order: 'Genesis' },
  { label: 'certified biological reference cultures', massClass: 'light', order: 'Genesis' },
  { label: 'implant-compatible pharmaceuticals', massClass: 'light', order: 'Genesis' },
  { label: 'neural-interface culture media', massClass: 'light', order: 'Genesis' },
];

const HABITAT_ESSENTIALS: readonly CargoOption[] = [
  { label: 'life-support filter pallets', massClass: 'standard', order: 'Toil' },
  { label: 'replacement scrubber beds', massClass: 'standard', order: 'Toil' },
  { label: 'environmental control assemblies', massClass: 'standard', order: 'Toil' },
  { label: 'pressure-suit consumables', massClass: 'standard', order: 'Toil' },
];

const INDUSTRIAL_ESSENTIALS: readonly CargoOption[] = [
  { label: 'machine-tool stock', massClass: 'heavy', order: 'Toil' },
  { label: 'compressor cartridge crates', massClass: 'standard', order: 'Toil' },
  { label: 'high-purity ceramic stock', massClass: 'standard', order: 'Toil' },
  { label: 'power-conditioning assemblies', massClass: 'standard', order: 'Toil' },
];

const CULTIVATION_ESSENTIALS: readonly CargoOption[] = [
  { label: 'trace-mineral nutrient concentrates', massClass: 'standard', order: 'Toil' },
  { label: 'sterile growing substrate', massClass: 'standard', order: 'Toil' },
  { label: 'biological culture media', massClass: 'light', order: 'Genesis' },
  { label: 'hydroponic nutrient concentrates', massClass: 'standard', order: 'Toil' },
];

const ALL_ESSENTIALS = [
  ...MEDICAL_ESSENTIALS,
  ...HABITAT_ESSENTIALS,
  ...INDUSTRIAL_ESSENTIALS,
  ...CULTIVATION_ESSENTIALS,
] as const;

const PROCUREMENT_SOURCES: readonly ProcurementSource[] = [
  // Wells trade dominates. Cadiz consolidates the widest legal selection.
  { sourceId: 'estella-xid-main-port', cargo: ALL_ESSENTIALS, likelihood: 0.78 },
  { sourceId: 'estella-xid-customs-transit', cargo: [...HABITAT_ESSENTIALS, ...INDUSTRIAL_ESSENTIALS], likelihood: 0.7 },
  { sourceId: 'estella-xid-services-outfitter-hangar', cargo: [...HABITAT_ESSENTIALS, ...INDUSTRIAL_ESSENTIALS], likelihood: 0.6 },
  { sourceId: 'estella-xib-organic-chemistry', cargo: [...MEDICAL_ESSENTIALS, ...CULTIVATION_ESSENTIALS], likelihood: 0.58 },
  { sourceId: 'estella-xib-cryo-transit', cargo: [...HABITAT_ESSENTIALS, ...CULTIVATION_ESSENTIALS], likelihood: 0.54 },
  { sourceId: 'estella-xa-exobiology-research', cargo: MEDICAL_ESSENTIALS, likelihood: 0.5 },

  // Camps and Belt purchases exist, but Estella's hostility keeps them uncommon.
  { sourceId: 'estella-vi-main-transit-dispatch', cargo: [...HABITAT_ESSENTIALS, ...CULTIVATION_ESSENTIALS], likelihood: 0.25 },
  { sourceId: 'estella-via-component-supply-station', cargo: INDUSTRIAL_ESSENTIALS, likelihood: 0.22 },
  { sourceId: 'estella-vib-cold-chain-station', cargo: MEDICAL_ESSENTIALS, likelihood: 0.22 },
  { sourceId: 'estella-vii-transit-export', cargo: INDUSTRIAL_ESSENTIALS, likelihood: 0.18 },
  { sourceId: 'caravanserai-main-commercial-dock', cargo: ALL_ESSENTIALS, likelihood: 0.14 },
  { sourceId: 'estella-viii-harder-approach-station', cargo: [...HABITAT_ESSENTIALS, ...INDUSTRIAL_ESSENTIALS], likelihood: 0.12 },
];

const COMPACT_DUES: readonly { label: string; massClass: CargoMassClass }[] = [
  { label: 'chapter-built cryogenic valve blocks', massClass: 'standard' },
  { label: 'proofed pressure-door assemblies', massClass: 'heavy' },
  { label: 'cold-rated habitat fittings', massClass: 'standard' },
  { label: 'remanufactured relay cooling plants', massClass: 'heavy' },
  { label: 'ice-work pump sets', massClass: 'heavy' },
];

const PASSAGE_SOURCES = [
  'caravanserai-foreign-quarter',
  'caravanserai-highliner-bay-poi',
  'estella-v-transit-customs',
  'estella-vi-main-transit-dispatch',
  'estella-xid-main-port',
  'estella-xiii-main-port',
] as const;

const PASSENGERS: readonly { label: string; details: string; completionMessage: string; likelihood: number }[] = [
  {
    label: 'notarized Covenant postulants',
    details: 'Each Postulant made the required declarations of intent before recognized notaries while unsealed and outside Covenant custody. Pilgrim Gate holds matched copies, household sponsorships, and places in the unsealed house.',
    completionMessage: 'The Gate registry compares each passenger with the lodged declarations and admits the party to the unsealed house. Every identity, witness mark, and sponsorship matches the departure record.',
    likelihood: 0.18,
  },
  {
    label: 'sanctioned Covenant pilgrims',
    details: 'The pilgrims hold recognized Testimony warrants and household places on Mercy. Pilgrim Gate has matched their passage manifest to the receiving register.',
    completionMessage: 'Pilgrim Gate receives the pilgrims by household and warrant. The receiving register records the company complete and ready for its appointed passage on Mercy.',
    likelihood: 0.1,
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

function sample<T>(values: readonly T[], key: string): T {
  return values[hashString(key) % values.length];
}

function locationName(id: string): string {
  return ESTELLA_NODES_BY_ID.get(id)?.name ?? id;
}

function missionCargo(option: { label: string; massClass: CargoMassClass }, key: string): MissionCargoSpec {
  return {
    label: option.label,
    massClass: option.massClass,
    massTons: cargoMassForClass(option.massClass, `${COVENANT_ID}:${key}:${option.label}`),
  };
}

function candidate(args: CandidateArgs): FactionContractCandidate {
  return {
    factionId: COVENANT_ID,
    factionName: COVENANT_NAME,
    factionTag: COVENANT_TAG,
    templateId: args.templateId,
    sourceId: args.sourceId,
    destinationId: args.destinationId,
    title: args.title,
    cargo: missionCargo(args.cargo, args.templateId),
    category: args.category,
    likelihood: args.likelihood ?? 1,
    issuerId: args.issuerId,
    issuerName: args.issuerName,
    details: args.details,
    completionMessage: args.completionMessage,
    ...args.pay,
  };
}

function procurementCandidates(ctx: FactionContractContext, day: number): FactionContractCandidate[] {
  const source = PROCUREMENT_SOURCES.find(entry => entry.sourceId === ctx.sourceId);
  if (!source) return [];
  const cargo = sample(source.cargo, `provision:${ctx.sourceId}:${day}`);
  const orderName = `Holy Order of ${cargo.order}`;
  return [candidate({
    templateId: `provision-${ctx.sourceId}-${cargo.order.toLowerCase()}`,
    sourceId: ctx.sourceId,
    destinationId: PILGRIM_GATE,
    cargo,
    pay: PROVISION_PAY,
    issuerId: `covenant-order-${cargo.order.toLowerCase()}-provision`,
    issuerName: orderName,
    likelihood: source.likelihood,
    details: `${orderName} purchased the ${cargo.label} for Mercy's common provision. Pilgrim Gate has assigned reception and entered the shipment against the receiving Order's account.`,
    completionMessage: `Pilgrim Gate receives the ${cargo.label} and releases it to the Order of ${cargo.order}. The common provision account records your delivery complete.`,
  })];
}

function compactCandidates(ctx: FactionContractContext, day: number): FactionContractCandidate[] {
  if (ctx.sourceId !== PILGRIM_GATE) return [];
  const first = sample(COMPACT_DUES, `compact-dues-a:${day}`);
  let second = sample(COMPACT_DUES, `compact-dues-b:${day}`);
  if (second.label === first.label) second = COMPACT_DUES[(COMPACT_DUES.indexOf(second) + 1) % COMPACT_DUES.length];

  const dues = [first, second].map((cargo, index) => candidate({
    templateId: `compact-dues-${index}-${cargo.label}`,
    sourceId: PILGRIM_GATE,
    destinationId: CASTLE_NUNES,
    cargo,
    pay: COMPACT_DUES_PAY,
    issuerId: 'covenant-order-toil-dues',
    issuerName: 'Holy Order of Toil',
    title: 'Deliver Compact Dues',
    likelihood: index === 0 ? 0.58 : 0.32,
    details: `The Order of Toil entered the ${cargo.label} against the material dues owed to House Nunes. ${locationName(CASTLE_NUNES)} holds the receiving warrant and compact tally.`,
    completionMessage: `The Nunes receivers accept the ${cargo.label} and enter it against the Covenant account. The compact tally closes for this shipment.`,
  }));

  const service = candidate({
    templateId: 'compact-service-genesis-mirror-clinic',
    sourceId: PILGRIM_GATE,
    destinationId: MIRROR_CLINIC,
    cargo: { label: 'Covenant physicians and neural researchers', massClass: 'standard' },
    pay: COMPACT_SERVICE_PAY,
    issuerId: 'covenant-order-genesis-service',
    issuerName: 'Holy Order of Genesis',
    title: 'Carry Compact Physicians',
    category: 'passenger',
    likelihood: 0.42,
    details: 'The Order of Genesis appointed the physicians and researchers to a term of compact service at Mirror Clinic. Their clinical materials are registered separately, and the Clinic has prepared quarters.',
    completionMessage: 'Mirror Clinic receives the physicians and researchers and begins their service term. Their party arrived together, fit, and ready for the appointed work.',
  });

  return [...dues, service];
}

function passageCandidates(ctx: FactionContractContext, day: number): FactionContractCandidate[] {
  if (!PASSAGE_SOURCES.includes(ctx.sourceId as typeof PASSAGE_SOURCES[number])) return [];
  const passage = sample(PASSENGERS, `passage:${ctx.sourceId}:${day}`);
  return [candidate({
    templateId: `passage-${passage.label}`,
    sourceId: ctx.sourceId,
    destinationId: PILGRIM_GATE,
    cargo: { label: passage.label, massClass: 'standard' },
    pay: PASSAGE_PAY,
    issuerId: 'covenant-order-testimony-passage',
    issuerName: 'Holy Order of Testimony',
    title: passage.label === 'notarized Covenant postulants' ? 'Transport Notarized Postulants' : 'Transport Sanctioned Pilgrims',
    category: 'passenger',
    likelihood: passage.likelihood,
    details: passage.details,
    completionMessage: passage.completionMessage,
  })];
}

function generateCovenantContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const day = Math.floor(ctx.worldTime / DAY);
  return [
    ...procurementCandidates(ctx, day),
    ...compactCandidates(ctx, day),
    ...passageCandidates(ctx, day),
  ];
}

export const COVENANT_REMNANTS_PROVIDER: FactionContractProvider = {
  id: COVENANT_ID,
  name: COVENANT_NAME,
  generateContracts: generateCovenantContracts,
};
