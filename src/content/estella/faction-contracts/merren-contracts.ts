import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { ESTELLA_NODES_BY_ID } from '..';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

const MERREN_ID = 'merren-conservatory';
const MERREN_NAME = 'Merren Conservatory';
const MERREN_TAG = 'MERREN';

const KALYNA_ORBITAL = 'estella-vib-cold-chain-station';
const TETERIV = 'estella-vib-vat-protein';
const ZHITOMIR = 'estella-vib-pharma-horticulture';
const DNIPRO = 'estella-vib-aquaculture';
const KALYNA_SURFACE = [TETERIV, ZHITOMIR, DNIPRO] as const;
const ANVIL = 'estella-vi-main-transit-dispatch';
const KUZNIA_SURFACE = [
  'estella-vi-agricultural-lowlands',
  'estella-vi-industrial-city',
  'estella-vi-foundry-complex',
  'estella-vi-mountain-mining',
] as const;
const ROADSTEAD = 'estella-v-transit-customs';
const CONCORD = 'estella-v-capital-settlement';
const HIGHLINER_BAY = 'caravanserai-highliner-bay-poi';
const DAY = 86_400;

const INTERNAL_PAY = { generosity: 0.25, compensationRatio: 0.8, maxCompAllowance: 2 } as const;
const STANDARD_PAY = { generosity: 0.3, compensationRatio: 0.75, maxCompAllowance: 2 } as const;
const PREMIUM_PAY = { generosity: 0.4, compensationRatio: 0.7, maxCompAllowance: 2 } as const;
const UNION_PAY = { generosity: 0.1, compensationRatio: 0.9, maxCompAllowance: 2 } as const;

type Pay = typeof INTERNAL_PAY | typeof STANDARD_PAY | typeof PREMIUM_PAY | typeof UNION_PAY;

interface CargoOption {
  label: string;
  massClass: CargoMassClass;
}

interface ProcurementLane {
  id: string;
  sourceIds: readonly string[];
  cargo: readonly CargoOption[];
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
}

const TETERIV_OUTPUT: readonly CargoOption[] = [
  { label: 'cultured game-bird cuts', massClass: 'light' },
  { label: 'noble-table protein lots', massClass: 'standard' },
  { label: 'heritage poultry culture trays', massClass: 'light' },
  { label: 'culinary tissue culture cassettes', massClass: 'light' },
];

const ZHITOMIR_OUTPUT: readonly CargoOption[] = [
  { label: 'pharmaceutical horticulture crates', massClass: 'light' },
  { label: 'bespoke medical nutriments', massClass: 'light' },
  { label: 'sealed floral conservatory stock', massClass: 'light' },
  { label: 'rare medicinal cultivars', massClass: 'light' },
  { label: 'therapeutic seed culture vaults', massClass: 'light' },
];

const DNIPRO_OUTPUT: readonly CargoOption[] = [
  { label: 'boutique aquaculture trays', massClass: 'light' },
  { label: 'living ornamental aquaculture', massClass: 'light' },
  { label: 'cultured delicacy stock', massClass: 'light' },
  { label: 'aquatic breeding cultures', massClass: 'light' },
];

const OUTPUT_BY_SOURCE: Record<string, readonly CargoOption[]> = {
  [TETERIV]: TETERIV_OUTPUT,
  [ZHITOMIR]: ZHITOMIR_OUTPUT,
  [DNIPRO]: DNIPRO_OUTPUT,
};

const INPUT_BY_DESTINATION: Record<string, readonly CargoOption[]> = {
  [TETERIV]: [
    { label: 'biological culture media', massClass: 'light' },
    { label: 'sterile growing substrate', massClass: 'standard' },
    { label: 'cold-chain packaging cassettes', massClass: 'standard' },
  ],
  [ZHITOMIR]: [
    { label: 'trace-mineral nutrient concentrates', massClass: 'standard' },
    { label: 'sterile growing substrate', massClass: 'standard' },
    { label: 'environmental control assemblies', massClass: 'standard' },
  ],
  [DNIPRO]: [
    { label: 'aquaculture nutrient concentrates', massClass: 'standard' },
    { label: 'water-quality control assemblies', massClass: 'standard' },
    { label: 'cold-chain packaging cassettes', massClass: 'standard' },
  ],
};

const ALL_OUTPUT = [...TETERIV_OUTPUT, ...ZHITOMIR_OUTPUT, ...DNIPRO_OUTPUT];
const PREMIUM_OUTPUT = ALL_OUTPUT.filter(option => [
  'sealed floral conservatory stock',
  'rare medicinal cultivars',
  'therapeutic seed culture vaults',
  'living ornamental aquaculture',
  'aquatic breeding cultures',
  'heritage poultry culture trays',
].includes(option.label));
const STANDARD_OUTPUT = ALL_OUTPUT.filter(option => !PREMIUM_OUTPUT.includes(option));

const PROCUREMENT_LANES: readonly ProcurementLane[] = [
  {
    id: 'clean-volatiles',
    sourceIds: ['estella-xa-deep-ice-mine', 'estella-xic-ice-mining'],
    cargo: [
      { label: 'clean cultivation volatile tanks', massClass: 'heavy' },
      { label: 'sterile process-water tanks', massClass: 'heavy' },
    ],
  },
  {
    id: 'organic-feedstock',
    sourceIds: ['estella-xib-cryo-transit', 'estella-xib-organic-chemistry', 'estella-xib-hydrocarbon-extraction'],
    cargo: [
      { label: 'biological polymer feedstock', massClass: 'standard' },
      { label: 'culture-grade organic solvent lots', massClass: 'standard' },
    ],
  },
  {
    id: 'controlled-equipment',
    sourceIds: [ANVIL, 'estella-via-component-supply-station', 'estella-vii-high-vacuum-factory', 'estella-iii-high-tech-city'],
    cargo: [
      { label: 'environmental control assemblies', massClass: 'standard' },
      { label: 'sterilization equipment', massClass: 'standard' },
      { label: 'cold-chain packaging cassettes', massClass: 'standard' },
    ],
  },
  {
    id: 'biological-reference-stock',
    sourceIds: ['estella-iii-agricultural-region', 'estella-iv-climate-poi-2', 'estella-iv-climate-poi-3'],
    cargo: [
      { label: 'certified biological reference cultures', massClass: 'light' },
      { label: 'quarantined breeding stock', massClass: 'light' },
    ],
  },
];

const STANDARD_DESTINATIONS = [
  'estella-iii-main-customs',
  'estella-iii-capital-city',
  'estella-iv-main-orbital-station',
  'estella-iv-primary-city',
  'harlan-dock',
  'mercer-dock',
  'estella-xc-main-outpost',
  'estella-xc-transit-refuel',
  'estella-xid-customs-transit',
  'estella-xic-research-station-poi',
];

const PREMIUM_DESTINATIONS = [
  'estella-iii-luxury-orbital-habitat',
  'estella-iii-capital-city',
  'estella-iii-coastal-resort',
  'estella-ii-olympos',
  'estella-iv-primary-city',
  'estella-xb-luxury-retreat',
  'estella-xc-main-outpost',
  'estella-xc-transit-refuel',
  'estella-xic-research-station-poi',
  'estella-xic-deep-ice-exobiology',
  'estella-xa-volatiles-transit',
  'estella-xb-worker-hab',
  'estella-xia-sealed-worker-hab',
  'estella-xib-science-settlement',
];

const STEWARDSHIP_DESTINATIONS = [
  'harlan-dock',
  'mercer-dock',
  'estella-v-capital-settlement',
  'estella-xiia-isolated-settlement',
  'estella-xiib-outpost',
  'estella-xiic-castle-teide',
];

const RETURN_ASSETS: readonly CargoOption[] = [
  { label: 'reusable cold-chain cassettes', massClass: 'standard' },
  { label: 'sterilizable culture racks', massClass: 'standard' },
  { label: 'conservatory transport frames', massClass: 'standard' },
  { label: 'quarantine sample lockers', massClass: 'light' },
];

const RETURN_SOURCES = [...new Set([...STANDARD_DESTINATIONS, ...PREMIUM_DESTINATIONS, HIGHLINER_BAY, ...STEWARDSHIP_DESTINATIONS])];

const IMMIGRANT_MANIFESTS: readonly CargoOption[] = [
  { label: 'Merren-sponsored horticultural households', massClass: 'standard' },
  { label: 'cultivation workers and their families', massClass: 'standard' },
  { label: 'aquaculture settlers and household dependents', massClass: 'standard' },
  { label: 'biological-production apprentices and sponsors', massClass: 'standard' },
];

const SPECIALIST_INBOUND: readonly CargoOption[] = [
  { label: 'visiting clinical horticulturists', massClass: 'light' },
  { label: 'aquaculture genetics delegation', massClass: 'light' },
  { label: 'biological quarantine assessors', massClass: 'light' },
  { label: 'conservatory design specialists', massClass: 'light' },
  { label: 'returning Merren specialists', massClass: 'light' },
];

const SPECIALIST_OUTBOUND: readonly CargoOption[] = [
  { label: 'Merren cultivation specialists', massClass: 'light' },
  { label: 'Merren conservatory installation team', massClass: 'light' },
  { label: 'Merren clinical growing delegation', massClass: 'light' },
  { label: 'returning visiting specialists', massClass: 'light' },
];

const SPECIALIST_NODES = [
  'estella-iii-main-customs',
  'estella-iii-capital-city',
  'estella-iii-high-tech-city',
  'estella-iv-main-orbital-station',
  'estella-iv-primary-city',
  'estella-iv-climate-poi-2',
  'estella-iv-climate-poi-3',
];

const IMMIGRATION_DETAILS_SHARED = [
  (passengers: string) => `Merren Conservatory has accepted the ${passengers} for permanent settlement on Kalyna. The Conservatory is carrying their passage, entry fees, and first season of housing.`,
  (passengers: string) => `The ${passengers} chose Kalyna through Merren’s household settlement program. Homes and work placements are waiting beyond Kalyna Orbital.`,
  (passengers: string) => `Merren’s settlement office matched the ${passengers} with work in Kalyna’s gardens, pools, and culture halls. This flight brings the complete households to their new moon.`,
  (passengers: string) => `Kalyna’s producer halls requested new households with the skills represented by the ${passengers}. Merren approved permanent residence and placed their transport on the Conservatory account.`,
  (passengers: string) => `This passage carries the ${passengers} under Merren’s family-settlement charter. The manifest includes every household member traveling into permanent residence.`,
  (passengers: string) => `Merren built Kalyna by carrying households through hard years together. The Conservatory is funding the ${passengers} as the next permanent members of that settlement.`,
  (passengers: string) => `Kalyna’s growers selected the ${passengers} through Merren’s sponsored immigration rolls. The Conservatory has reserved their berths and prepared their receiving communities.`,
  (passengers: string) => `The ${passengers} accepted Merren’s offer of permanent work and residence on Kalyna. Their reception party will meet the flight at Kalyna Orbital.`,
];

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function sample<T>(items: readonly T[], count: number, seed: number): T[] {
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

function name(id: string): string {
  return ESTELLA_NODES_BY_ID.get(id)?.name ?? id;
}

function makeCandidate(args: CandidateArgs): FactionContractCandidate {
  const cargo: MissionCargoSpec = {
    label: args.cargo.label,
    massClass: args.cargo.massClass,
    massTons: cargoMassForClass(args.cargo.massClass, `${MERREN_ID}:${args.templateId}:${args.sourceId}->${args.destinationId}:${args.cargo.label}`),
  };
  return {
    factionId: MERREN_ID,
    factionName: MERREN_NAME,
    factionTag: MERREN_TAG,
    templateId: args.templateId,
    sourceId: args.sourceId,
    destinationId: args.destinationId,
    cargo,
    category: args.category,
    likelihood: args.likelihood ?? 3,
    boardPriority: args.boardPriority,
    generosity: args.pay.generosity,
    compensationRatio: args.pay.compensationRatio,
    maxCompAllowance: args.pay.maxCompAllowance,
    flatReward: 0,
    issuerId: args.issuerId,
    issuerName: args.issuerName,
    details: args.details,
    completionMessage: args.completionMessage,
  };
}

function freightCandidate(args: Omit<CandidateArgs, 'category'>): FactionContractCandidate {
  return makeCandidate(args);
}

function passengerCandidate(args: Omit<CandidateArgs, 'category'>): FactionContractCandidate {
  return makeCandidate({ ...args, category: 'passenger' });
}

function localConsolidation(sourceId: string, day: number): FactionContractCandidate[] {
  const pool = OUTPUT_BY_SOURCE[sourceId];
  if (!pool) return [];
  return sample(pool, 2, hashString(`merren:consolidation:${sourceId}:${day}`)).map((cargo, index) => freightCandidate({
    templateId: `consolidation:${sourceId}:${slug(cargo.label)}`,
    sourceId,
    destinationId: KALYNA_ORBITAL,
    cargo,
    pay: INTERNAL_PAY,
    issuerId: 'merren-producer-hall',
    issuerName: `${name(sourceId)} Producer Hall`,
    details: `The ${name(sourceId)} producer hall released the ${cargo.label} for inspection and consolidation at Kalyna Orbital. Merren’s cold-chain seal remains with the lot.`,
    completionMessage: `At Kalyna Orbital, Merren inspectors take the ${cargo.label} into the cold-chain floor. The producer-hall seal passes inspection and the lot enters the export schedule.`,
    likelihood: index === 0 ? 8 : 4,
    boardPriority: index === 0,
  }));
}

function localDistribution(day: number): FactionContractCandidate[] {
  return KALYNA_SURFACE.map((destinationId, index) => {
    const cargo = sample(INPUT_BY_DESTINATION[destinationId], 1, hashString(`merren:distribution:${destinationId}:${day}`))[0];
    return freightCandidate({
      templateId: `distribution:${destinationId}:${slug(cargo.label)}`,
      sourceId: KALYNA_ORBITAL,
      destinationId,
      cargo,
      pay: INTERNAL_PAY,
      issuerId: 'merren-export-house',
      issuerName: 'Merren Conservatory Export House',
      details: `Merren Conservatory assigned the ${cargo.label} to ${name(destinationId)}. The receiving producer hall has prepared controlled storage and a work crew.`,
      completionMessage: `At ${name(destinationId)}, the receiving hall moves the ${cargo.label} into prepared storage. Merren closes the transfer against the facility’s cultivation plan.`,
      likelihood: index === day % KALYNA_SURFACE.length ? 7 : 3,
      boardPriority: index === day % KALYNA_SURFACE.length,
    });
  });
}

function procurement(sourceId: string, day: number): FactionContractCandidate[] {
  return PROCUREMENT_LANES.filter(lane => lane.sourceIds.includes(sourceId)).map(lane => {
    const cargo = sample(lane.cargo, 1, hashString(`merren:procurement:${lane.id}:${sourceId}:${day}`))[0];
    return freightCandidate({
      templateId: `procurement:${lane.id}:${sourceId}:${slug(cargo.label)}`,
      sourceId,
      destinationId: KALYNA_ORBITAL,
      cargo,
      pay: INTERNAL_PAY,
      issuerId: 'merren-purchasing',
      issuerName: 'Merren Conservatory Purchasing Office',
      details: `Merren Purchasing accepted the ${cargo.label} for Kalyna’s controlled supply. Kalyna Orbital will inspect the lot before surface distribution.`,
      completionMessage: `Kalyna Orbital receives the ${cargo.label} into controlled inspection. Merren’s technicians draw their samples, accept the lot, and release your rig.`,
      likelihood: sourceId === ANVIL ? 7 : 3,
      boardPriority: sourceId === ANVIL,
    });
  });
}

function exportCandidates(day: number): FactionContractCandidate[] {
  const standardDestinations = sample(STANDARD_DESTINATIONS, 2, hashString(`merren:standard-destinations:${day}`));
  const premiumDestinations = sample(PREMIUM_DESTINATIONS, 2, hashString(`merren:premium-destinations:${day}`));
  const standardCargo = sample(STANDARD_OUTPUT, 2, hashString(`merren:standard-cargo:${day}`));
  const premiumCargo = sample(PREMIUM_OUTPUT, 2, hashString(`merren:premium-cargo:${day}`));
  const standard = standardDestinations.map((destinationId, index) => {
    const cargo = standardCargo[index];
    return freightCandidate({
      templateId: `standard-export:${destinationId}:${slug(cargo.label)}`,
      sourceId: KALYNA_ORBITAL,
      destinationId,
      cargo,
      pay: STANDARD_PAY,
      issuerId: 'merren-export-house',
      issuerName: 'Merren Conservatory Export House',
      details: `Merren Conservatory sold the ${cargo.label} to ${name(destinationId)} under a condition-certified order. Kalyna Orbital completed inspection and released the lot.`,
      completionMessage: `At ${name(destinationId)}, the receiving factor checks the ${cargo.label} against Merren’s condition seal. The order is accepted and your manifest closes.`,
      likelihood: index === 0 ? 7 : 4,
      boardPriority: index === 0,
    });
  });
  const premium = premiumDestinations.map((destinationId, index) => {
    const cargo = premiumCargo[index];
    return freightCandidate({
      templateId: `premium-export:${destinationId}:${slug(cargo.label)}`,
      sourceId: KALYNA_ORBITAL,
      destinationId,
      cargo,
      pay: PREMIUM_PAY,
      issuerId: 'merren-export-house',
      issuerName: 'Merren Conservatory Export House',
      details: `Merren’s conservators prepared the ${cargo.label} for ${name(destinationId)}. The receiving order depends on preserving the living stock and its sealed environment.`,
      completionMessage: `The ${cargo.label} enters its prepared environment at ${name(destinationId)}. The receiving conservator confirms the living stock and signs Merren’s release.`,
      likelihood: index === 0 ? 6 : 3,
    });
  });
  const highlinerCargo = sample(PREMIUM_OUTPUT, 1, hashString(`merren:highliner-cargo:${day}`))[0];
  const highliner = freightCandidate({
    templateId: `highliner-export:${slug(highlinerCargo.label)}`,
    sourceId: KALYNA_ORBITAL,
    destinationId: HIGHLINER_BAY,
    cargo: highlinerCargo,
    pay: PREMIUM_PAY,
    issuerId: 'merren-export-house',
    issuerName: 'Merren Conservatory Export House',
    details: `Merren’s conservators prepared the ${highlinerCargo.label} for Highliner Bay. The receiving order depends on preserving the living stock and its sealed environment.`,
    completionMessage: `The ${highlinerCargo.label} enters its prepared environment at Highliner Bay. The receiving conservator confirms the living stock and signs Merren’s release.`,
    likelihood: 4,
  });
  const stewardshipDestination = sample(STEWARDSHIP_DESTINATIONS, 1, hashString(`merren:stewardship-destination:${day}`))[0];
  const stewardshipCargo = sample([...ZHITOMIR_OUTPUT, ...TETERIV_OUTPUT], 1, hashString(`merren:stewardship-cargo:${day}`))[0];
  const stewardship = freightCandidate({
    templateId: `stewardship:${stewardshipDestination}:${slug(stewardshipCargo.label)}`,
    sourceId: KALYNA_ORBITAL,
    destinationId: stewardshipDestination,
    cargo: stewardshipCargo,
    pay: STANDARD_PAY,
    issuerId: 'merren-stewardship-reserve',
    issuerName: 'Merren Conservatory Stewardship Reserve',
    details: `Merren’s stewardship reserve released the ${stewardshipCargo.label} to ${name(stewardshipDestination)}. The Conservatory is carrying the cultivation loss and funding its transport.`,
    completionMessage: `At ${name(stewardshipDestination)}, local growers take custody of the ${stewardshipCargo.label}. Merren records the allotment against its stewardship reserve and clears your manifest.`,
    likelihood: 2,
  });
  return [...standard, ...premium, highliner, stewardship];
}

function reusableReturns(sourceId: string, day: number): FactionContractCandidate[] {
  if (!RETURN_SOURCES.includes(sourceId)) return [];
  const cargo = sample(RETURN_ASSETS, 1, hashString(`merren:return-assets:${sourceId}:${day}`))[0];
  return [freightCandidate({
    templateId: `return-assets:${sourceId}:${slug(cargo.label)}`,
    sourceId,
    destinationId: KALYNA_ORBITAL,
    cargo,
    pay: INTERNAL_PAY,
    issuerId: 'merren-return-custody',
    issuerName: 'Merren Conservatory Return Custody',
    details: `Merren Conservatory recalled the ${cargo.label} from ${name(sourceId)} for inspection, sterilization, and reuse at Kalyna Orbital.`,
    completionMessage: `Kalyna Orbital receives the ${cargo.label} into the sterilization queue. Merren’s inspection clerk closes the return and releases your rig.`,
    likelihood: 1.5,
  })];
}

function immigrationDetails(sourceId: string, passengers: string, day: number): string {
  const sourceSpecific = sourceId === ROADSTEAD
    ? (label: string) => `The ${label} completed their residency entry at Roadstead. Kalyna Orbital will receive them as new Conservatory households and direct them to their surface sponsors.`
    : (label: string) => `The ${label} are leaving Concord with household berths paid by Merren Conservatory. Their assigned housing, school places, and work placements are ready on Kalyna.`;
  const pool = [...IMMIGRATION_DETAILS_SHARED, sourceSpecific];
  return pool[hashString(`merren:immigration-details:${sourceId}:${passengers}:${day}`) % pool.length](passengers);
}

function immigration(sourceId: string, day: number): FactionContractCandidate[] {
  if (sourceId !== ROADSTEAD && sourceId !== CONCORD) return [];
  return sample(IMMIGRANT_MANIFESTS, 2, hashString(`merren:immigration:${sourceId}:${day}`)).map((cargo, index) => passengerCandidate({
    templateId: `immigration:${sourceId}:${slug(cargo.label)}`,
    sourceId,
    destinationId: KALYNA_ORBITAL,
    cargo,
    pay: PREMIUM_PAY,
    issuerId: 'merren-settlement-office',
    issuerName: 'Merren Conservatory Settlement Office',
    details: immigrationDetails(sourceId, cargo.label, day),
    completionMessage: `At Kalyna Orbital, settlement stewards welcome the ${cargo.label} into Merren’s residency register. Surface sponsors are waiting to take each household onward.`,
    likelihood: index === 0 ? 7 : 3,
    boardPriority: index === 0,
  }));
}

function workUnionPilgrims(sourceId: string, day: number): FactionContractCandidate[] {
  const surfaceDestination = KUZNIA_SURFACE[hashString(`merren:union-surface:${day}`) % KUZNIA_SURFACE.length];
  const cargo: CargoOption = { label: 'Kalyna Udarniki work pilgrims', massClass: 'standard' };
  const returning: CargoOption = { label: 'returning Kalyna work pilgrims', massClass: 'standard' };
  if (sourceId === KALYNA_ORBITAL) {
    return [ANVIL, surfaceDestination].map((destinationId, index) => passengerCandidate({
      templateId: `union-pilgrimage:${destinationId}`,
      sourceId,
      destinationId,
      cargo,
      pay: UNION_PAY,
      issuerId: 'merren-work-union',
      issuerName: 'Merren Work Union',
      details: destinationId === ANVIL
        ? `The Merren Work Union selected the ${cargo.label} for reciprocal service on Kuznia. Anvil will receive the party into the Combine’s surface distribution system.`
        : `The Merren Work Union is funding the ${cargo.label} for direct service at ${name(destinationId)}. The Steel Combine granted surface receiving clearance for this work-exchange party.`,
      completionMessage: `The ${cargo.label} report into the working company at ${name(destinationId)}. The Combine receiving clerk acknowledges their ${destinationId === ANVIL ? 'exchange' : 'direct-clearance exchange'}.`,
      likelihood: index === 0 ? 7 : 4,
      boardPriority: index === 0,
    }));
  }
  if (sourceId === ANVIL || sourceId === surfaceDestination) {
    return [passengerCandidate({
      templateId: `union-return:${sourceId}`,
      sourceId,
      destinationId: KALYNA_ORBITAL,
      cargo: returning,
      pay: UNION_PAY,
      issuerId: 'merren-work-union',
      issuerName: 'Merren Work Union',
      details: `The ${returning.label} completed their Kuznia work pilgrimage. The Merren Work Union placed their return to Kalyna Orbital on the collective passage account.`,
      completionMessage: `At Kalyna Orbital, the Merren Work Union receives the ${returning.label} home from Kuznia. The collective passage account closes with every traveler present.`,
      likelihood: 6,
      boardPriority: true,
    })];
  }
  return [];
}

function specialists(sourceId: string, day: number): FactionContractCandidate[] {
  if (sourceId === KALYNA_ORBITAL) {
    const destinations = sample(SPECIALIST_NODES, 2, hashString(`merren:specialist-destinations:${day}`));
    const manifests = sample(SPECIALIST_OUTBOUND, 2, hashString(`merren:specialist-outbound:${day}`));
    return destinations.map((destinationId, index) => {
      const cargo = manifests[index];
      const returning = cargo.label === 'returning visiting specialists';
      return passengerCandidate({
        templateId: `specialist-outbound:${destinationId}:${slug(cargo.label)}`,
        sourceId,
        destinationId,
        cargo,
        pay: PREMIUM_PAY,
        issuerId: 'merren-specialist-exchange',
        issuerName: 'Merren Conservatory Specialist Exchange',
        details: returning
          ? `The ${cargo.label} completed their work on Kalyna. Merren Conservatory is returning them to ${name(destinationId)} under the original specialist exchange.`
          : `Merren Conservatory assigned the ${cargo.label} to ${name(destinationId)} for a commissioned cultivation, clinical, or conservatory program.`,
        completionMessage: returning
          ? `The ${cargo.label} disembark at ${name(destinationId)} with their assignment complete. The receiving office signs the exchange roll and releases your rig.`
          : `The ${cargo.label} enter their assigned program at ${name(destinationId)}. Merren’s coordinator accepts the party and closes the specialist manifest.`,
        likelihood: 3,
      });
    });
  }
  if (!SPECIALIST_NODES.includes(sourceId)) return [];
  const cargo = sample(SPECIALIST_INBOUND, 1, hashString(`merren:specialist-inbound:${sourceId}:${day}`))[0];
  const returning = cargo.label === 'returning Merren specialists';
  return [passengerCandidate({
    templateId: `specialist-inbound:${sourceId}:${slug(cargo.label)}`,
    sourceId,
    destinationId: KALYNA_ORBITAL,
    cargo,
    pay: PREMIUM_PAY,
    issuerId: 'merren-specialist-exchange',
    issuerName: 'Merren Conservatory Specialist Exchange',
    details: returning
      ? `The ${cargo.label} completed their assignment at ${name(sourceId)}. Merren Conservatory is returning them to Kalyna Orbital.`
      : `Merren Conservatory invited the ${cargo.label} from ${name(sourceId)} to work with Kalyna’s producer halls. Kalyna Orbital will complete their biological-entry clearance.`,
    completionMessage: returning
      ? `The ${cargo.label} disembark at Kalyna Orbital with their assignment complete. The receiving office signs the exchange roll and releases your rig.`
      : `The ${cargo.label} enter their assigned program at Kalyna Orbital. Merren’s coordinator accepts the party and closes the specialist manifest.`,
    likelihood: 2.5,
  })];
}

export const MERREN_CONSERVATORY_PROVIDER: FactionContractProvider = {
  id: MERREN_ID,
  name: MERREN_NAME,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    const day = Math.floor(ctx.worldTime / DAY);
    return [
      ...localConsolidation(ctx.sourceId, day),
      ...(ctx.sourceId === KALYNA_ORBITAL ? localDistribution(day) : []),
      ...procurement(ctx.sourceId, day),
      ...(ctx.sourceId === KALYNA_ORBITAL ? exportCandidates(day) : []),
      ...reusableReturns(ctx.sourceId, day),
      ...immigration(ctx.sourceId, day),
      ...workUnionPilgrims(ctx.sourceId, day),
      ...specialists(ctx.sourceId, day),
    ];
  },
};
