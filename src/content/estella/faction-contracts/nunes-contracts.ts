import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { ESTELLA_NODES_BY_ID } from '..';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';
import {
  NUNES_INQUIRY_CONTRACT_PROGRESS,
  defaultNunesInquirySnapshot,
  formatNunesInquiryTitle,
  nunesInquiryCatalogEntry,
  type ActiveNunesInquiry,
} from './nunes-inquiries';

const NUNES_ID = 'house-nunes';
const NUNES_NAME = 'House Nunes';
const NUNES_TAG = 'NUNES';
const DAY = 86_400;

const CASTLE_NUNES = 'estella-xiid-black-project-exile';
const BLACKGLASS = 'estella-xiid-blackglass-observatory';
const MIRROR_CLINIC = 'estella-xiid-mirror-clinic';
const ACADEMY = 'estella-xi-science-waypoint-poi';
const FROSTGLASS = 'estella-xa-exobiology-research';
const TEIDE_SURVEY = 'estella-xiic-comet-research';
const MANTICORE_OBSERVATORY = 'estella-xii-observation-post';
const FAR_BELL = 'estella-xii-comm-relay-poi';
const ALEMBIC_RING = 'estella-xd-chem-station';
const ALMADEN_ORBITAL = 'estella-xia-chem-station';
const MARISMA_CAULDRON = 'estella-xib-organic-chemistry';
const REACH_RELAY = 'estella-xiii-long-range-observatory';
const REACH_MAIN_PORT = 'estella-xiii-main-port';
const REACH_EXILE = 'estella-xiii-prison-exile-colony';
const REACH_CLASSIFIED = 'estella-xiii-classified-research';
const LONELY_BEACON = 'reach-rogue-lonely-beacon';
const SERRATINE = 'estella-xc-main-outpost';
const HERALD_GATE = 'estella-xc-transit-refuel';

const INQUIRY_PAY = { generosity: 0.25, compensationRatio: 0.75, maxCompAllowance: 2, flatReward: 20_000 } as const;
const WATCH_PAY = { generosity: 0.2, compensationRatio: 0.8, maxCompAllowance: 2, flatReward: 15_000 } as const;
const RECOVERY_PAY = { generosity: 0.1, compensationRatio: 0.9, maxCompAllowance: 2, flatReward: 35_000 } as const;
const CUSTODY_PAY = { generosity: 0.25, compensationRatio: 0.75, maxCompAllowance: 2, flatReward: 30_000 } as const;
type Pay = typeof INQUIRY_PAY | typeof WATCH_PAY | typeof RECOVERY_PAY | typeof CUSTODY_PAY;

interface CargoOption {
  label: string;
  massClass: CargoMassClass;
}

interface CandidateArgs {
  templateId: string;
  sourceId: string;
  destinationId: string;
  cargo: CargoOption;
  pay: Pay;
  issuerId: string;
  issuerName: string;
  details: string;
  completionMessage: string;
  category?: 'passenger';
  likelihood?: number;
  boardPriority?: boolean;
  inquiry?: ActiveNunesInquiry;
}

const LEARNED_LOCATIONS = [
  ACADEMY,
  BLACKGLASS,
  MIRROR_CLINIC,
  FROSTGLASS,
  TEIDE_SURVEY,
  MANTICORE_OBSERVATORY,
  FAR_BELL,
  ALEMBIC_RING,
  ALMADEN_ORBITAL,
  MARISMA_CAULDRON,
] as const;

const PREPARATION_CARGO: readonly CargoOption[] = [
  { label: 'calibrated philosophical instruments', massClass: 'light' },
  { label: 'blackglass optical blanks', massClass: 'light' },
  { label: 'sealed alchemical furnaces', massClass: 'standard' },
  { label: 'philosophical calculation cabinets', massClass: 'standard' },
  { label: 'preserved biological cabinets', massClass: 'light' },
  { label: 'vacuum retort assemblies', massClass: 'standard' },
  { label: 'anatomical culture cabinets', massClass: 'light' },
];

const OBSERVANCE_CARGO: readonly CargoOption[] = [
  { label: 'celestial observation vaults', massClass: 'light' },
  { label: 'mineral specimen reliquaries', massClass: 'standard' },
  { label: 'universal field instrument chests', massClass: 'standard' },
  { label: 'sealed experimental apparatus', massClass: 'standard' },
  { label: 'comparative physic sample cabinets', massClass: 'light' },
];

const COLLECTION_CARGO: readonly CargoOption[] = [
  { label: 'completed observation vaults', massClass: 'light' },
  { label: 'field specimen reliquaries', massClass: 'standard' },
  { label: 'weathered philosophical instruments', massClass: 'standard' },
  { label: 'sealed trial records and apparatus', massClass: 'standard' },
  { label: 'preserved comparative specimens', massClass: 'light' },
];

const DISPUTATION_CARGO: readonly CargoOption[] = [
  { label: 'original instruments and specimen cabinets', massClass: 'standard' },
  { label: 'contested observation vaults', massClass: 'light' },
  { label: 'demonstration retorts and calculation cabinets', massClass: 'standard' },
];

const PREPARATION_PASSENGERS: readonly CargoOption[] = [
  { label: 'Nunes-sponsored Magisters and apprentices', massClass: 'standard' },
  { label: 'physicians and natural philosophers', massClass: 'standard' },
  { label: 'alchemists and instrument masters', massClass: 'standard' },
];

const OBSERVANCE_PASSENGERS: readonly CargoOption[] = [
  { label: 'universalist field Magisters', massClass: 'standard' },
  { label: 'celestial philosophers and apprentices', massClass: 'standard' },
  { label: 'physicians, alchemists, and instrument masters', massClass: 'standard' },
];

const DISPUTATION_PASSENGERS: readonly CargoOption[] = [
  { label: 'disputing Magisters of the learned houses', massClass: 'standard' },
  { label: 'returning field Magisters and apprentices', massClass: 'standard' },
  { label: 'assembled physicians and natural philosophers', massClass: 'standard' },
];

const WATCH_OUTBOUND: readonly CargoOption[] = [
  { label: 'hardened telescope assemblies', massClass: 'standard' },
  { label: 'signal-intercept racks', massClass: 'standard' },
  { label: 'relay cryocoolers', massClass: 'standard' },
  { label: 'encrypted recorder vaults', massClass: 'light' },
  { label: 'outer-watch sensor packages', massClass: 'standard' },
  { label: 'emergency beacon stores', massClass: 'standard' },
];

const WATCH_RETURN: readonly CargoOption[] = [
  { label: 'failed watch instruments', massClass: 'standard' },
  { label: 'recovered recorder vaults', massClass: 'light' },
  { label: 'weathered relay assemblies', massClass: 'standard' },
  { label: 'outer-patrol sensor archives', massClass: 'light' },
];

const RECOVERY_OUTBOUND: readonly CargoOption[] = [
  { label: 'sealed rescue caches', massClass: 'standard' },
  { label: 'field isolation modules', massClass: 'heavy' },
  { label: 'decontamination machinery', massClass: 'heavy' },
  { label: 'emergency medical apparatus', massClass: 'standard' },
];

const RECOVERY_RETURN: readonly CargoOption[] = [
  { label: 'recovered lifepod assemblies', massClass: 'heavy' },
  { label: 'quarantined watch equipment', massClass: 'standard' },
  { label: 'sealed medical apparatus', massClass: 'standard' },
];

const CUSTODY_CARGO: readonly CargoOption[] = [
  { label: 'tamper-evident archive cabinets', massClass: 'standard' },
  { label: 'sealed evidence lockers', massClass: 'standard' },
  { label: 'confiscated recorder banks', massClass: 'standard' },
  { label: 'identity-custody instrument cases', massClass: 'light' },
];

const WATCH_PASSENGERS: readonly CargoOption[] = [
  { label: 'relay wardens and recovery crew', massClass: 'standard' },
  { label: 'outer-watch instrument keepers', massClass: 'standard' },
];

const RECOVERY_PASSENGERS: readonly CargoOption[] = [
  { label: 'exposed watch crews', massClass: 'standard' },
  { label: 'Nunes quarantine assessors', massClass: 'standard' },
  { label: 'recovered relay wardens', massClass: 'standard' },
];

const CUSTODY_PASSENGERS: readonly CargoOption[] = [
  { label: 'protected witnesses under Nunes seal', massClass: 'standard' },
  { label: 'counter-interrogation patients', massClass: 'standard' },
  { label: 'released exiles under quiet passage', massClass: 'standard' },
  { label: 'guarded exile transfer', massClass: 'standard' },
];

const WATCH_DESTINATIONS = [MANTICORE_OBSERVATORY, FAR_BELL, TEIDE_SURVEY, REACH_RELAY, REACH_CLASSIFIED, LONELY_BEACON] as const;
const RECOVERY_DESTINATIONS = [FAR_BELL, TEIDE_SURVEY, REACH_RELAY, REACH_CLASSIFIED, LONELY_BEACON] as const;
const CUSTODY_SOURCES = [SERRATINE, HERALD_GATE, REACH_MAIN_PORT, REACH_EXILE] as const;

const FIELD_BY_INQUIRY: Readonly<Record<string, readonly string[]>> = {
  'living-ice': [FROSTGLASS, MIRROR_CLINIC, REACH_CLASSIFIED],
  'manticore-winter': [MANTICORE_OBSERVATORY, FAR_BELL, TEIDE_SURVEY],
  'blackglass-parallax': [BLACKGLASS, FAR_BELL, REACH_RELAY, LONELY_BEACON],
  'blue-fire': [TEIDE_SURVEY, ALMADEN_ORBITAL, ALEMBIC_RING],
  'memory-seat': [MIRROR_CLINIC, FROSTGLASS, REACH_CLASSIFIED],
  'silent-signal': [FAR_BELL, BLACKGLASS, REACH_RELAY, LONELY_BEACON],
  'captive-stone': [ACADEMY, FAR_BELL, TEIDE_SURVEY],
  'empty-crucible': [ALEMBIC_RING, ALMADEN_ORBITAL, MARISMA_CAULDRON],
  'wandering-lights': [BLACKGLASS, FAR_BELL, REACH_RELAY, LONELY_BEACON],
  'common-physic': [MIRROR_CLINIC, FROSTGLASS, MANTICORE_OBSERVATORY],
  'concordant-measures': [ACADEMY, BLACKGLASS, MANTICORE_OBSERVATORY, TEIDE_SURVEY],
  'second-shadow': [BLACKGLASS, FAR_BELL, REACH_RELAY, LONELY_BEACON],
};

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

function missionCargo(option: CargoOption, key: string): MissionCargoSpec {
  return { label: option.label, massTons: cargoMassForClass(option.massClass, `${NUNES_ID}:${key}`) };
}

function makeCandidate(args: CandidateArgs): FactionContractCandidate {
  return {
    factionId: NUNES_ID,
    factionName: NUNES_NAME,
    factionTag: NUNES_TAG,
    templateId: args.templateId,
    sourceId: args.sourceId,
    destinationId: args.destinationId,
    cargo: missionCargo(args.cargo, args.templateId),
    category: args.category,
    likelihood: args.likelihood ?? 1,
    boardPriority: args.boardPriority,
    issuerId: args.issuerId,
    issuerName: args.issuerName,
    details: args.details,
    completionMessage: args.completionMessage,
    nunesInquiry: args.inquiry ? { instanceId: args.inquiry.instanceId, contribution: NUNES_INQUIRY_CONTRACT_PROGRESS } : undefined,
    ...args.pay,
  };
}

function inquiryPhrase(inquiry: ActiveNunesInquiry, key: string): string {
  const title = formatNunesInquiryTitle(inquiry);
  return sample([
    `in furtherance of the ${title}`,
    `for the learned advancement of the ${title}`,
    `in service of the observations and proofs belonging to the ${title}`,
  ], `nunes:inquiry-phrase:${inquiry.instanceId}:${key}`);
}

function inquiryCandidates(ctx: FactionContractContext, inquiry: ActiveNunesInquiry, day: number): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const entry = nunesInquiryCatalogEntry(inquiry.catalogId);
  const principal = entry.principalLocationId;
  const fields = (FIELD_BY_INQUIRY[inquiry.catalogId] ?? [principal]).filter(id => id !== principal);
  const contributors = LEARNED_LOCATIONS.filter(id => id !== principal);
  const contributor = sample(contributors, `nunes:contributor:${inquiry.instanceId}:${day}`);
  const field = sample(fields.length ? fields : contributors, `nunes:field:${inquiry.instanceId}:${day}`);
  const phrase = inquiryPhrase(inquiry, `${ctx.sourceId}:${day}`);
  const title = formatNunesInquiryTitle(inquiry);

  if (ctx.sourceId === contributor) {
    const cargo = sample(PREPARATION_CARGO, `nunes:preparation-cargo:${inquiry.instanceId}:${day}`);
    out.push(makeCandidate({
      templateId: `inquiry:${inquiry.instanceId}:preparation:${contributor}->${principal}:${day}`,
      sourceId: contributor,
      destinationId: principal,
      cargo,
      pay: INQUIRY_PAY,
      issuerId: 'house-nunes-chamber-of-inquiry',
      issuerName: 'House Nunes Chamber of Inquiry',
      details: `The ${entry.principalInstitution} requested the ${cargo.label} ${phrase}. Its Magisters have entered the lot among the instruments and materials of preparation.`,
      completionMessage: `At ${locationName(principal)}, the receiving Magisters enter the ${cargo.label} into the prepared inventory. The ${title} advances toward its first trial.`,
      inquiry,
      boardPriority: true,
    }));
    const passengers = sample(PREPARATION_PASSENGERS, `nunes:preparation-passengers:${inquiry.instanceId}:${day}`);
    out.push(makeCandidate({
      templateId: `inquiry:${inquiry.instanceId}:preparation-passengers:${contributor}->${principal}:${day}`,
      sourceId: contributor,
      destinationId: principal,
      cargo: passengers,
      pay: INQUIRY_PAY,
      issuerId: 'house-nunes-patronage-hall',
      issuerName: 'House Nunes Patronage Hall',
      category: 'passenger',
      details: `The ${passengers.label} have been called to ${locationName(principal)} ${phrase}. They will join the masters preparing its first trials.`,
      completionMessage: `The ${passengers.label} enter ${locationName(principal)} under the Nunes patronage seal. Their names pass into the working roll of the ${title}.`,
      inquiry,
    }));
  }

  if (ctx.sourceId === principal) {
    const cargo = sample(OBSERVANCE_CARGO, `nunes:observance-cargo:${inquiry.instanceId}:${day}`);
    out.push(makeCandidate({
      templateId: `inquiry:${inquiry.instanceId}:observance:${principal}->${field}:${day}`,
      sourceId: principal,
      destinationId: field,
      cargo,
      pay: INQUIRY_PAY,
      issuerId: principal === BLACKGLASS ? 'blackglass-office-of-observances' : 'house-nunes-chamber-of-inquiry',
      issuerName: principal === BLACKGLASS ? 'Blackglass Office of Observances' : 'House Nunes Chamber of Inquiry',
      details: `This consignment of ${cargo.label} is appointed to the observance at ${locationName(field)} ${phrase}. The field Magisters have prepared its place among their instruments.`,
      completionMessage: `The field Magisters take the ${cargo.label} into the appointed observance at ${locationName(field)}. The presiding Magister records your delivery in the work of the ${title}.`,
      inquiry,
      boardPriority: true,
    }));
    const passengers = sample(OBSERVANCE_PASSENGERS, `nunes:observance-passengers:${inquiry.instanceId}:${day}`);
    out.push(makeCandidate({
      templateId: `inquiry:${inquiry.instanceId}:observance-passengers:${principal}->${field}:${day}`,
      sourceId: principal,
      destinationId: field,
      cargo: passengers,
      pay: INQUIRY_PAY,
      issuerId: 'house-nunes-patronage-hall',
      issuerName: 'House Nunes Patronage Hall',
      category: 'passenger',
      details: `The ${passengers.label} have been appointed to the observance at ${locationName(field)} ${phrase}. Their findings will enter the common record of the work.`,
      completionMessage: `The ${passengers.label} join the observance at ${locationName(field)}. Its master enters every traveler upon the roll of the ${title}.`,
      inquiry,
    }));
    if (principal !== ACADEMY) {
      const disputants = sample(DISPUTATION_PASSENGERS, `nunes:disputation-passengers:${inquiry.instanceId}:${day}`);
      out.push(makeCandidate({
        templateId: `inquiry:${inquiry.instanceId}:disputation:${principal}->${ACADEMY}:${day}`,
        sourceId: principal,
        destinationId: ACADEMY,
        cargo: disputants,
        pay: INQUIRY_PAY,
        issuerId: 'house-nunes-patronage-hall',
        issuerName: 'House Nunes Patronage Hall',
        category: 'passenger',
        details: `The ${disputants.label} have been summoned to the Academy of Sublime Measures ${phrase}. House Nunes has granted their collective passage.`,
        completionMessage: `The ${disputants.label} enter the Academy’s disputation chamber. Their names are added to the masters assembled for the ${title}.`,
        inquiry,
      }));
    }
  }

  if (ctx.sourceId === field) {
    const cargo = sample(COLLECTION_CARGO, `nunes:collection-cargo:${inquiry.instanceId}:${day}`);
    out.push(makeCandidate({
      templateId: `inquiry:${inquiry.instanceId}:collection:${field}->${principal}:${day}`,
      sourceId: field,
      destinationId: principal,
      cargo,
      pay: INQUIRY_PAY,
      issuerId: 'blackglass-office-of-observances',
      issuerName: 'Blackglass Office of Observances',
      details: `This consignment of ${cargo.label} contains instruments, specimens, or recorded measures gathered ${phrase}. It is recalled to ${locationName(principal)} for examination.`,
      completionMessage: `At ${locationName(principal)}, the receiving Magisters take the ${cargo.label} into examination. Its measures and specimens enter the growing record of the ${title}.`,
      inquiry,
      boardPriority: true,
    }));
    const passengers = sample(OBSERVANCE_PASSENGERS, `nunes:collection-passengers:${inquiry.instanceId}:${day}`);
    out.push(makeCandidate({
      templateId: `inquiry:${inquiry.instanceId}:collection-passengers:${field}->${principal}:${day}`,
      sourceId: field,
      destinationId: principal,
      cargo: passengers,
      pay: INQUIRY_PAY,
      issuerId: 'house-nunes-patronage-hall',
      issuerName: 'House Nunes Patronage Hall',
      category: 'passenger',
      details: `The ${passengers.label} have completed their appointed work ${phrase}. House Nunes is returning them to ${locationName(principal)} with their observations.`,
      completionMessage: `At ${locationName(principal)}, the ${passengers.label} deliver their observations and rejoin the learned house directing the ${title}.`,
      inquiry,
    }));
  }

  if (ctx.sourceId === principal && principal !== ACADEMY) {
    const cargo = sample(DISPUTATION_CARGO, `nunes:disputation-cargo:${inquiry.instanceId}:${day}`);
    out.push(makeCandidate({
      templateId: `inquiry:${inquiry.instanceId}:disputation-cargo:${principal}->${ACADEMY}:${day}`,
      sourceId: principal,
      destinationId: ACADEMY,
      cargo,
      pay: INQUIRY_PAY,
      issuerId: 'house-nunes-patronage-hall',
      issuerName: 'House Nunes Patronage Hall',
      details: `This consignment of ${cargo.label} is summoned to the Academy of Sublime Measures ${phrase}. The assembled Magisters require the original instruments and specimens.`,
      completionMessage: `The Academy receives the ${cargo.label} beneath the seals of the assembled learned houses. The evidence is placed before the disputation of the ${title}.`,
      inquiry,
    }));
  }
  return out;
}

function routineCandidates(ctx: FactionContractContext, day: number): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const watchDestination = sample(WATCH_DESTINATIONS, `nunes:watch-destination:${day}`);
  if (ctx.sourceId === CASTLE_NUNES || ctx.sourceId === BLACKGLASS) {
    const cargo = sample(WATCH_OUTBOUND, `nunes:watch-outbound:${ctx.sourceId}:${day}`);
    out.push(makeCandidate({
      templateId: `outer-watch:${ctx.sourceId}->${watchDestination}:${day}`,
      sourceId: ctx.sourceId,
      destinationId: watchDestination,
      cargo,
      pay: WATCH_PAY,
      issuerId: 'house-nunes-outer-ward',
      issuerName: 'House Nunes Outer Ward',
      details: `The Outer Ward assigned the ${cargo.label} to ${locationName(watchDestination)}. Its keepers have prepared the watch station and entered your rig beneath the Nunes seal.`,
      completionMessage: `At ${locationName(watchDestination)}, the wardens take the ${cargo.label} into the outer watch. The receiving keeper closes the Nunes warrant.`,
      boardPriority: true,
    }));
    const passengers = sample(WATCH_PASSENGERS, `nunes:watch-passengers:${ctx.sourceId}:${day}`);
    out.push(makeCandidate({
      templateId: `outer-watch-passengers:${ctx.sourceId}->${watchDestination}:${day}`,
      sourceId: ctx.sourceId,
      destinationId: watchDestination,
      cargo: passengers,
      pay: WATCH_PAY,
      issuerId: 'house-nunes-outer-ward',
      issuerName: 'House Nunes Outer Ward',
      category: 'passenger',
      details: `The ${passengers.label} have been appointed to ${locationName(watchDestination)} under the wardenship inherited by House Nunes. Their stores and watch places are prepared.`,
      completionMessage: `The ${passengers.label} report to the keeper at ${locationName(watchDestination)}. The outer-watch roll records every traveler present.`,
    }));
  }

  if (WATCH_DESTINATIONS.includes(ctx.sourceId as typeof WATCH_DESTINATIONS[number])) {
    const cargo = sample(WATCH_RETURN, `nunes:watch-return:${ctx.sourceId}:${day}`);
    out.push(makeCandidate({
      templateId: `outer-watch-return:${ctx.sourceId}->${BLACKGLASS}:${day}`,
      sourceId: ctx.sourceId,
      destinationId: BLACKGLASS,
      cargo,
      pay: WATCH_PAY,
      issuerId: 'blackglass-office-of-observances',
      issuerName: 'Blackglass Office of Observances',
      details: `House Nunes recalled the ${cargo.label} from ${locationName(ctx.sourceId)}. Blackglass will examine the instruments and enter their record into the private archive.`,
      completionMessage: `Blackglass receives the ${cargo.label} into its examination hall. The archive clerk closes the outer-watch return.`,
    }));
  }

  const recoveryDestination = sample(RECOVERY_DESTINATIONS, `nunes:recovery-destination:${day}`);
  if (ctx.sourceId === CASTLE_NUNES || ctx.sourceId === MIRROR_CLINIC) {
    const cargo = sample(RECOVERY_OUTBOUND, `nunes:recovery-outbound:${ctx.sourceId}:${day}`);
    out.push(makeCandidate({
      templateId: `recovery:${ctx.sourceId}->${recoveryDestination}:${day}`,
      sourceId: ctx.sourceId,
      destinationId: recoveryDestination,
      cargo,
      pay: RECOVERY_PAY,
      issuerId: ctx.sourceId === MIRROR_CLINIC ? 'mirror-clinic-quiet-registry' : 'house-nunes-outer-ward',
      issuerName: ctx.sourceId === MIRROR_CLINIC ? 'Mirror Clinic Quiet Registry' : 'House Nunes Outer Ward',
      details: `The Outer Ward placed the ${cargo.label} under Nunes recovery warrant for ${locationName(recoveryDestination)}. The receiving wardens have assigned secure storage and a working party.`,
      completionMessage: `At ${locationName(recoveryDestination)}, the recovery wardens take charge of the ${cargo.label}. Their keeper signs the House warrant and releases your rig.`,
    }));
  }

  if (RECOVERY_DESTINATIONS.includes(ctx.sourceId as typeof RECOVERY_DESTINATIONS[number])) {
    const cargo = sample(RECOVERY_RETURN, `nunes:recovery-return:${ctx.sourceId}:${day}`);
    out.push(makeCandidate({
      templateId: `recovery-return:${ctx.sourceId}->${MIRROR_CLINIC}:${day}`,
      sourceId: ctx.sourceId,
      destinationId: MIRROR_CLINIC,
      cargo,
      pay: RECOVERY_PAY,
      issuerId: 'mirror-clinic-quiet-registry',
      issuerName: 'Mirror Clinic Quiet Registry',
      details: `House Nunes is returning the ${cargo.label} from ${locationName(ctx.sourceId)} under a recovery seal. Mirror Clinic has prepared controlled reception and examination.`,
      completionMessage: `Mirror Clinic receives the ${cargo.label} through controlled custody. The Quiet Registry closes the recovery warrant.`,
    }));
    const passengers = sample(RECOVERY_PASSENGERS, `nunes:recovery-passengers:${ctx.sourceId}:${day}`);
    out.push(makeCandidate({
      templateId: `recovery-passengers:${ctx.sourceId}->${MIRROR_CLINIC}:${day}`,
      sourceId: ctx.sourceId,
      destinationId: MIRROR_CLINIC,
      cargo: passengers,
      pay: RECOVERY_PAY,
      issuerId: 'mirror-clinic-quiet-registry',
      issuerName: 'Mirror Clinic Quiet Registry',
      category: 'passenger',
      details: `The ${passengers.label} have been entered for controlled passage from ${locationName(ctx.sourceId)} to Mirror Clinic. The Quiet Registry has prepared their reception.`,
      completionMessage: `At Mirror Clinic, the ${passengers.label} pass into the care of the receiving physicians. The Quiet Registry accounts for every traveler.`,
    }));
  }

  if (CUSTODY_SOURCES.includes(ctx.sourceId as typeof CUSTODY_SOURCES[number])) {
    const destination = sample([CASTLE_NUNES, MIRROR_CLINIC], `nunes:custody-destination:${ctx.sourceId}:${day}`);
    const cargo = sample(CUSTODY_CARGO, `nunes:custody-cargo:${ctx.sourceId}:${day}`);
    out.push(makeCandidate({
      templateId: `quiet-custody:${ctx.sourceId}->${destination}:${day}`,
      sourceId: ctx.sourceId,
      destinationId: destination,
      cargo,
      pay: CUSTODY_PAY,
      issuerId: 'house-nunes-sealed-custody',
      issuerName: 'House Nunes Sealed Custody',
      details: `The appointing office committed the ${cargo.label} to House Nunes for quiet custody. ${locationName(destination)} will receive the seal intact and ask no declaration beyond the manifest.`,
      completionMessage: `At ${locationName(destination)}, two custody clerks examine the seal and take charge of the ${cargo.label}. Your warrant closes without amendment.`,
    }));
    const passengers = sample(CUSTODY_PASSENGERS, `nunes:custody-passengers:${ctx.sourceId}:${day}`);
    out.push(makeCandidate({
      templateId: `quiet-custody-passengers:${ctx.sourceId}->${destination}:${day}`,
      sourceId: ctx.sourceId,
      destinationId: destination,
      cargo: passengers,
      pay: CUSTODY_PAY,
      issuerId: 'mirror-clinic-quiet-registry',
      issuerName: 'Mirror Clinic Quiet Registry',
      category: 'passenger',
      details: `The ${passengers.label} have accepted passage to ${locationName(destination)} under the private seal of House Nunes. The receiving registry has prepared their custody conditions.`,
      completionMessage: `The ${passengers.label} enter ${locationName(destination)} under the private seal. The receiving clerk confirms every name and releases your passenger receipt.`,
    }));
  }
  return out;
}

function generateNunesContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const day = Math.floor(ctx.worldTime / DAY);
  const snapshot = ctx.nunesInquiries ?? defaultNunesInquirySnapshot(ctx.worldTime);
  return [
    ...snapshot.active.flatMap(inquiry => inquiryCandidates(ctx, inquiry, day)),
    ...routineCandidates(ctx, day),
  ];
}

export const HOUSE_NUNES_PROVIDER: FactionContractProvider = {
  id: NUNES_ID,
  name: NUNES_NAME,
  generateContracts: generateNunesContracts,
};
