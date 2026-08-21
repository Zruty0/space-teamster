import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { ESTELLA_NODES_BY_ID } from '..';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

const ALVARES_ID = 'house-alvares';
const ALVARES_NAME = 'House Alvares';
const ALVARES_TAG = 'ALVARES';

const HERALD_GATE = 'estella-xc-transit-refuel';
const CASTLE_ALVARES = 'estella-xc-castle-alvares';
const SERRATINE = 'estella-xc-main-outpost';
const CADIZ_GOODS_EXCHANGE = 'estella-xid-customs-transit';
const CALATRAVA_KEEP = 'estella-xd-proving-grounds';
const HAMMER = 'estella-vi-heavy-cargo-station';

const DAY = 86_400;
const MAX_COMP_ALLOWANCE = 2;
const LIEGE_PAY = { generosity: 0.25, compensationRatio: 0.75, maxCompAllowance: MAX_COMP_ALLOWANCE } as const;
const OCCASION_PAY = { generosity: 0.3, compensationRatio: 0.7, maxCompAllowance: MAX_COMP_ALLOWANCE } as const;
const ROUTINE_LIEGE_FEE = 15_000;
const ESCHEAT_FEE = 25_000;
const OCCASION_FEE = 20_000;
const OFFICIAL_DELEGATION_FEE = 25_000;

const OCCASION_CYCLE = 180 * DAY;
const OCCASION_OUTBOUND_DURATION = 120 * DAY;

type ContractKind = 'due' | 'assigned' | 'grant' | 'escheat' | 'occasion-delegation' | 'occasion-retinue' | 'occasion-freight' | 'occasion-return-passenger' | 'occasion-return-freight';

interface CargoOption {
  label: string;
  massClass: CargoMassClass;
  category?: 'passenger';
}

interface AssessmentSource {
  id: string;
  cargo: readonly CargoOption[];
  beneficiaries: readonly string[];
}

interface EscheatSource {
  id: string;
  cargo: readonly CargoOption[];
  destinations: readonly string[];
}

interface OccasionEvent {
  id: string;
  type: string;
  hostId: string;
  officialSourceId: string;
  retinueSourceIds: readonly string[];
  index: number;
  returnPhase: boolean;
}

const ASSESSMENT_SOURCES: readonly AssessmentSource[] = [
  {
    id: 'estella-xa-deep-ice-mine',
    cargo: [
      { label: 'Beira ice blocks', massClass: 'heavy' },
      { label: 'bonded water tanks', massClass: 'heavy' },
    ],
    beneficiaries: ['estella-xia-sealed-worker-hab', 'estella-xib-science-settlement', 'estella-xiib-transit-station-poi'],
  },
  {
    id: 'estella-xb-smelting-processing',
    cargo: [
      { label: 'Tinto smelter cakes', massClass: 'dense' },
      { label: 'high-finish pressure alloy lots', massClass: 'heavy' },
    ],
    beneficiaries: ['estella-xib-cryo-transit', 'estella-xid-main-port', CALATRAVA_KEEP],
  },
  {
    id: 'estella-xd-geothermal-extraction',
    cargo: [
      { label: 'Marcher mineral salts', massClass: 'heavy' },
      { label: 'public power equipment', massClass: 'heavy' },
    ],
    beneficiaries: ['estella-xa-volatiles-transit', 'estella-xii-observation-post', 'estella-xiib-outpost'],
  },
  {
    id: 'estella-xia-rare-element-extraction',
    cargo: [
      { label: 'Cinnabar trace-metal lots', massClass: 'dense' },
      { label: 'pressure-mined rare metal pallets', massClass: 'dense' },
    ],
    beneficiaries: ['estella-xie-rare-alloy-extraction', 'estella-xif-deep-listening-array', 'estella-xiid-blackglass-observatory'],
  },
  {
    id: 'estella-xib-hydrocarbon-extraction',
    cargo: [
      { label: 'Marisma hydrocarbon fractions', massClass: 'heavy' },
      { label: 'methane tankage', massClass: 'standard' },
    ],
    beneficiaries: ['estella-xid-main-port', 'estella-xi-skim-hub', 'estella-xiic-castle-teide'],
  },
  {
    id: 'estella-xic-ice-mining',
    cargo: [
      { label: 'Macao debt-court ice', massClass: 'heavy' },
      { label: 'bonded water tanks', massClass: 'heavy' },
    ],
    beneficiaries: ['estella-xia-sealed-worker-hab', 'estella-xiic-castle-teide', 'estella-xiia-volatiles-transit'],
  },
  {
    id: CADIZ_GOODS_EXCHANGE,
    cargo: [
      { label: 'bonded customs stock', massClass: 'standard' },
      { label: 'replacement machinery', massClass: 'heavy' },
    ],
    beneficiaries: ['estella-xiib-transit-station-poi', 'estella-xiic-castle-teide', 'estella-xii-observation-post'],
  },
  {
    id: 'estella-xiic-isotope-mining',
    cargo: [
      { label: 'Bluefire isotope cylinders', massClass: 'dense' },
      { label: 'shielded isotope concentrates', massClass: 'dense' },
    ],
    beneficiaries: ['estella-xii-observation-post', 'estella-xiid-blackglass-observatory', 'estella-xic-deep-ice-exobiology'],
  },
];

const GOVERNORS_GRANTS: readonly CargoOption[] = [
  { label: 'emergency pressure shelter modules', massClass: 'heavy' },
  { label: 'municipal scrubber banks', massClass: 'standard' },
  { label: 'public clinic modules', massClass: 'heavy' },
  { label: 'port reinforcement sections', massClass: 'heavy' },
  { label: 'replacement machinery', massClass: 'heavy' },
  { label: 'public power equipment', massClass: 'heavy' },
  { label: 'emergency water allotments', massClass: 'heavy' },
  { label: 'communications tower kits', massClass: 'standard' },
];

const GRANT_DESTINATIONS = [
  'estella-xa-volatiles-transit',
  'estella-xb-worker-hab',
  CALATRAVA_KEEP,
  'estella-xia-sealed-worker-hab',
  'estella-xib-science-settlement',
  'estella-xid-services-outfitter-hangar',
  'estella-xiib-transit-station-poi',
  'estella-xiic-castle-teide',
  'estella-xii-observation-post',
] as const;

const ESCHEAT_SOURCES: readonly EscheatSource[] = [
  {
    id: 'estella-xic-ice-mining',
    cargo: [
      { label: 'forfeited casino fixtures', massClass: 'standard' },
      { label: 'court-seized vehicle chassis', massClass: 'heavy' },
    ],
    destinations: [CADIZ_GOODS_EXCHANGE, SERRATINE],
  },
  {
    id: 'estella-xb-smelting-processing',
    cargo: [
      { label: 'seized machine tools', massClass: 'heavy' },
      { label: 'repossessed pressure modules', massClass: 'heavy' },
    ],
    destinations: [CADIZ_GOODS_EXCHANGE, HAMMER],
  },
  {
    id: 'estella-xia-rare-element-extraction',
    cargo: [
      { label: 'confiscated refinery equipment', massClass: 'heavy' },
      { label: 'seized machine tools', massClass: 'heavy' },
    ],
    destinations: [CADIZ_GOODS_EXCHANGE, HAMMER],
  },
  {
    id: 'estella-xib-hydrocarbon-extraction',
    cargo: [
      { label: 'confiscated refinery equipment', massClass: 'heavy' },
      { label: 'repossessed pressure modules', massClass: 'heavy' },
    ],
    destinations: [CADIZ_GOODS_EXCHANGE, 'estella-xib-cryo-transit'],
  },
  {
    id: 'estella-xid-specialty-cargo',
    cargo: [
      { label: 'impounded armory stores', massClass: 'heavy' },
      { label: 'bonded forfeiture lots', massClass: 'standard' },
    ],
    destinations: [CALATRAVA_KEEP, CADIZ_GOODS_EXCHANGE],
  },
];

const OCCASION_TYPES = [
  'wedding feast',
  'birth presentation',
  'coming-of-age feast',
  'investiture feast',
  'succession recognition',
  'public works dedication',
] as const;

const OCCASION_HOSTS = [
  'estella-xa-volatiles-transit',
  'estella-xb-worker-hab',
  CALATRAVA_KEEP,
  'estella-xia-sealed-worker-hab',
  'estella-xib-science-settlement',
  'estella-xic-research-station-poi',
  'estella-xid-services-outfitter-hangar',
  'estella-xiic-castle-teide',
] as const;

const RETINUE_SOURCES = [
  'estella-xa-volatiles-transit',
  'estella-xb-worker-hab',
  CALATRAVA_KEEP,
  'estella-xia-sealed-worker-hab',
  'estella-xib-science-settlement',
  'estella-xid-services-outfitter-hangar',
  'estella-xiic-castle-teide',
] as const;

const OFFICIAL_DELEGATIONS: readonly CargoOption[] = [
  { label: 'Alvares ceremonial delegation', massClass: 'standard', category: 'passenger' },
  { label: 'investiture officers and ceremonial guards', massClass: 'standard', category: 'passenger' },
  { label: 'public occasion stewards and witnesses', massClass: 'standard', category: 'passenger' },
];

const GENERAL_RETINUES: readonly CargoOption[] = [
  { label: 'subsidized lesser-household retinue', massClass: 'standard', category: 'passenger' },
  { label: 'musicians, chapel staff, and feast servants', massClass: 'standard', category: 'passenger' },
  { label: 'household elders and ceremonial attendants', massClass: 'standard', category: 'passenger' },
];

const WEDDING_RETINUES: readonly CargoOption[] = [
  { label: 'household elders and wedding attendants', massClass: 'standard', category: 'passenger' },
  ...GENERAL_RETINUES,
];

const COMING_OF_AGE_RETINUES: readonly CargoOption[] = [
  { label: 'coming-of-age sponsors and ceremonial guard', massClass: 'standard', category: 'passenger' },
  ...GENERAL_RETINUES,
];

const FEAST_FREIGHT: readonly CargoOption[] = [
  { label: 'banquet kitchen modules', massClass: 'heavy' },
  { label: 'feast service and table equipment', massClass: 'standard' },
  { label: 'ceremonial pavilion sections', massClass: 'heavy' },
  { label: 'household banners and display armor', massClass: 'standard' },
  { label: 'preserved feast stores', massClass: 'standard' },
  { label: 'temporary chapel fittings', massClass: 'standard' },
  { label: 'musicians’ equipment', massClass: 'standard' },
];

const WEDDING_FREIGHT: readonly CargoOption[] = [
  { label: 'gift and dowry chests', massClass: 'standard' },
  ...FEAST_FREIGHT,
];

const RETURN_EQUIPMENT = FEAST_FREIGHT.filter(option => option.label !== 'preserved feast stores');

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

function locationName(id: string): string {
  return ESTELLA_NODES_BY_ID.get(id)?.name ?? id;
}

function cargoSpec(option: CargoOption, seedKey: string): MissionCargoSpec {
  return {
    label: option.label,
    massClass: option.massClass,
    massTons: cargoMassForClass(option.massClass, `${ALVARES_ID}:${seedKey}`),
  };
}

function candidate(args: {
  kind: ContractKind;
  templateId: string;
  sourceId: string;
  destinationId: string;
  option: CargoOption;
  likelihood: number;
  flatReward: number;
  issuerId: string;
  issuerName: string;
  briefing: string;
  completionMessage: string;
  priority?: boolean;
}): FactionContractCandidate {
  const pay = args.kind.startsWith('occasion') ? OCCASION_PAY : LIEGE_PAY;
  return {
    factionId: ALVARES_ID,
    factionName: ALVARES_NAME,
    factionTag: ALVARES_TAG,
    templateId: args.templateId,
    sourceId: args.sourceId,
    destinationId: args.destinationId,
    cargo: cargoSpec(args.option, args.templateId),
    category: args.option.category,
    likelihood: args.likelihood,
    boardPriority: args.priority,
    flatReward: args.flatReward,
    issuerId: args.issuerId,
    issuerName: args.issuerName,
    briefing: args.briefing,
    completionMessage: args.completionMessage,
    ...pay,
  };
}

function assessmentCandidates(ctx: FactionContractContext): FactionContractCandidate[] {
  const source = ASSESSMENT_SOURCES.find(item => item.id === ctx.sourceId);
  if (!source) return [];
  const day = Math.floor(ctx.worldTime / DAY);
  const sourceName = locationName(source.id);
  const option = seededSample(source.cargo, 1, hashString(`alvares:assessment:${source.id}:${day}`))[0];
  const beneficiary = seededSample(source.beneficiaries, 1, hashString(`alvares:beneficiary:${source.id}:${day}`))[0];
  const duePriority = (hashString(`${source.id}:${day}:priority`) & 1) === 0;
  return [
    candidate({
      kind: 'due',
      templateId: `due:${source.id}:${slug(option.label)}:${day}`,
      sourceId: source.id,
      destinationId: HERALD_GATE,
      option,
      likelihood: 1,
      priority: duePriority,
      flatReward: ROUTINE_LIEGE_FEE,
      issuerId: 'ducal-weights-office',
      issuerName: 'Ducal Weights Office',
      briefing: `The Ducal Weights Office entered the ${option.label} as ${sourceName}’s assessed due. Delivery to Herald Gate will close the obligation.`,
      completionMessage: `At Herald Gate, the Ducal Weights Office weighs the ${option.label} against ${sourceName}’s assessment. The certified total closes the obligation and releases your rig.`,
    }),
    candidate({
      kind: 'assigned',
      templateId: `assigned:${source.id}->${beneficiary}:${slug(option.label)}:${day}`,
      sourceId: source.id,
      destinationId: beneficiary,
      option,
      likelihood: 1,
      priority: !duePriority,
      flatReward: ROUTINE_LIEGE_FEE,
      issuerId: 'ducal-weights-office',
      issuerName: 'Ducal Weights Office',
      briefing: `The Ducal Weights Office assigned ${sourceName}’s ${option.label} directly to ${locationName(beneficiary)}. One certified delivery will satisfy the due and the grant.`,
      completionMessage: `At ${locationName(beneficiary)}, receiving crews enter the ${option.label} into the assigned allotment under a Guild-certified weight. The Alvares terminal closes both the originating due and the recipient grant.`,
    }),
  ];
}

function grantCandidates(ctx: FactionContractContext): FactionContractCandidate[] {
  if (ctx.sourceId !== HERALD_GATE) return [];
  const day = Math.floor(ctx.worldTime / DAY);
  const destinations = seededSample(GRANT_DESTINATIONS, 4, hashString(`alvares:grants:${day}`));
  return destinations.map((destinationId, index) => {
    const option = seededSample(GOVERNORS_GRANTS, 1, hashString(`alvares:grant:${destinationId}:${day}`))[0];
    return candidate({
      kind: 'grant',
      templateId: `grant:${destinationId}:${slug(option.label)}:${day}`,
      sourceId: HERALD_GATE,
      destinationId,
      option,
      likelihood: 1,
      priority: index === 0,
      flatReward: ROUTINE_LIEGE_FEE,
      issuerId: 'governors-reserve',
      issuerName: 'Governor’s Reserve',
      briefing: `The Governor’s Reserve released the ${option.label} to ${locationName(destinationId)} under House Alvares authority.`,
      completionMessage: `${locationName(destinationId)} takes custody of the ${option.label} from the Governor’s Reserve. The receiving officer posts the allotment under the Governor’s Seal and clears your manifest.`,
    });
  });
}

function escheatCandidates(ctx: FactionContractContext): FactionContractCandidate[] {
  const source = ESCHEAT_SOURCES.find(item => item.id === ctx.sourceId);
  if (!source) return [];
  const day = Math.floor(ctx.worldTime / DAY);
  const option = seededSample(source.cargo, 1, hashString(`alvares:escheat-cargo:${source.id}:${day}`))[0];
  const destinationId = seededSample(source.destinations, 1, hashString(`alvares:escheat-destination:${source.id}:${day}`))[0];
  return [candidate({
    kind: 'escheat',
    templateId: `escheat:${source.id}->${destinationId}:${slug(option.label)}:${day}`,
    sourceId: source.id,
    destinationId,
    option,
    likelihood: 0.8,
    flatReward: ESCHEAT_FEE,
    issuerId: 'court-of-escheat',
    issuerName: 'Court of Escheat',
    briefing: `The Court of Escheat ordered the ${option.label} removed from ${locationName(source.id)} and delivered to ${locationName(destinationId)} under public custody.`,
    completionMessage: `At ${locationName(destinationId)}, the Court of Escheat’s receiver takes custody of the ${option.label}. The removal is entered against the judgment, and your warrant is closed.`,
  })];
}

function occasionEvent(worldTime: number): OccasionEvent {
  const index = Math.floor(worldTime / OCCASION_CYCLE);
  const phase = worldTime - index * OCCASION_CYCLE;
  const type = OCCASION_TYPES[hashString(`alvares:occasion-type:${index}`) % OCCASION_TYPES.length];
  const hostId = OCCASION_HOSTS[hashString(`alvares:occasion-host:${index}`) % OCCASION_HOSTS.length];
  const officialSourceId = (hashString(`alvares:occasion-office:${index}`) & 1) === 0 ? CASTLE_ALVARES : SERRATINE;
  const retinueSourceIds = seededSample(RETINUE_SOURCES.filter(id => id !== hostId), 3, hashString(`alvares:occasion-retinues:${index}`));
  return {
    id: `occasion:${index}:${slug(type)}:${hostId}`,
    type,
    hostId,
    officialSourceId,
    retinueSourceIds,
    index,
    returnPhase: phase >= OCCASION_OUTBOUND_DURATION,
  };
}

function officialDelegationPool(type: string): readonly CargoOption[] {
  if (type === 'investiture feast' || type === 'succession recognition' || type === 'coming-of-age feast') return OFFICIAL_DELEGATIONS;
  return OFFICIAL_DELEGATIONS.filter(option => option.label !== 'investiture officers and ceremonial guards');
}

function retinuePool(type: string): readonly CargoOption[] {
  if (type === 'wedding feast') return WEDDING_RETINUES;
  if (type === 'coming-of-age feast') return COMING_OF_AGE_RETINUES;
  return GENERAL_RETINUES;
}

function feastPool(type: string): readonly CargoOption[] {
  return type === 'wedding feast' ? WEDDING_FREIGHT : FEAST_FREIGHT;
}

function occasionOutboundCandidates(ctx: FactionContractContext, event: OccasionEvent): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  const day = Math.floor(ctx.worldTime / DAY);
  const hostName = locationName(event.hostId);
  if (ctx.sourceId === event.officialSourceId) {
    const delegation = seededSample(officialDelegationPool(event.type), 1, hashString(`${event.id}:delegation:${day}`))[0];
    out.push(candidate({
      kind: 'occasion-delegation',
      templateId: `${event.id}:delegation:${slug(delegation.label)}:${day}`,
      sourceId: ctx.sourceId,
      destinationId: event.hostId,
      option: delegation,
      likelihood: 1.4,
      priority: true,
      flatReward: OFFICIAL_DELEGATION_FEE,
      issuerId: 'office-of-public-occasions',
      issuerName: 'Office of Investitures and Public Occasions',
      briefing: `The Office of Investitures and Public Occasions assigned the ${delegation.label} to represent House Alvares at the ${event.type} at ${hostName}.`,
      completionMessage: `At ${hostName}, the ${delegation.label} disembark into the formal company of the ${event.type}. The presiding steward announces the Alvares delegation and releases your passenger receipt.`,
    }));
    const freight = seededSample(feastPool(event.type), 2, hashString(`${event.id}:freight:${day}`));
    freight.forEach((option, index) => out.push(candidate({
      kind: 'occasion-freight',
      templateId: `${event.id}:freight:${slug(option.label)}:${day}`,
      sourceId: ctx.sourceId,
      destinationId: event.hostId,
      option,
      likelihood: 1,
      priority: index === 0,
      flatReward: OCCASION_FEE,
      issuerId: 'office-of-public-occasions',
      issuerName: 'Office of Investitures and Public Occasions',
      briefing: `The Office of Investitures and Public Occasions committed the ${option.label} to the ${event.type} at ${hostName}.`,
      completionMessage: `At ${hostName}, feast stewards take the ${option.label} directly into preparation for the ${event.type}. The Office records the contribution under House Alvares patronage.`,
    })));
  }

  if (event.retinueSourceIds.includes(ctx.sourceId)) {
    const option = seededSample(retinuePool(event.type), 1, hashString(`${event.id}:retinue:${ctx.sourceId}:${day}`))[0];
    out.push(candidate({
      kind: 'occasion-retinue',
      templateId: `${event.id}:retinue:${ctx.sourceId}:${slug(option.label)}:${day}`,
      sourceId: ctx.sourceId,
      destinationId: event.hostId,
      option,
      likelihood: 1.2,
      priority: true,
      flatReward: OCCASION_FEE,
      issuerId: 'office-of-public-occasions',
      issuerName: 'Office of Investitures and Public Occasions',
      briefing: `House Alvares granted the ${option.label} passage to the ${event.type} at ${hostName}. Their attendance enters the formal company under the Governor’s patronage.`,
      completionMessage: `The ${option.label} arrive at ${hostName} with their household colors properly displayed. An Alvares steward welcomes them into the ${event.type} and closes their passage warrant.`,
    }));
  }
  return out;
}

function occasionReturnCandidates(ctx: FactionContractContext, event: OccasionEvent): FactionContractCandidate[] {
  if (ctx.sourceId !== event.hostId) return [];
  const out: FactionContractCandidate[] = [];
  const day = Math.floor(ctx.worldTime / DAY);
  const sourceName = locationName(event.hostId);
  const delegation = seededSample(officialDelegationPool(event.type), 1, hashString(`${event.id}:delegation-return:${day}`))[0];
  out.push(candidate({
    kind: 'occasion-return-passenger',
    templateId: `${event.id}:delegation-return:${slug(delegation.label)}:${day}`,
    sourceId: event.hostId,
    destinationId: event.officialSourceId,
    option: delegation,
    likelihood: 1.3,
    priority: true,
    flatReward: OCCASION_FEE,
    issuerId: 'office-of-public-occasions',
    issuerName: 'Office of Investitures and Public Occasions',
    briefing: `The ${event.type} at ${sourceName} has concluded. The Office of Investitures and Public Occasions assigned the ${delegation.label} to return to ${locationName(event.officialSourceId)}.`,
    completionMessage: `The ${delegation.label} disembark at ${locationName(event.officialSourceId)} after the ${event.type}. Their household steward signs the returning roll and releases your rig.`,
  }));
  event.retinueSourceIds.forEach((destinationId, index) => {
    const option = seededSample(retinuePool(event.type), 1, hashString(`${event.id}:retinue-return:${destinationId}:${day}`))[0];
    out.push(candidate({
      kind: 'occasion-return-passenger',
      templateId: `${event.id}:retinue-return:${destinationId}:${slug(option.label)}:${day}`,
      sourceId: event.hostId,
      destinationId,
      option,
      likelihood: 1,
      priority: index === 0,
      flatReward: OCCASION_FEE,
      issuerId: 'office-of-public-occasions',
      issuerName: 'Office of Investitures and Public Occasions',
      briefing: `The ${event.type} at ${sourceName} has concluded. The Office of Investitures and Public Occasions assigned the ${option.label} to return to ${locationName(destinationId)}.`,
      completionMessage: `The ${option.label} disembark at ${locationName(destinationId)} after the ${event.type}. Their household steward signs the returning roll and releases your rig.`,
    }));
  });
  const equipment = seededSample(RETURN_EQUIPMENT, 2, hashString(`${event.id}:equipment-return:${day}`));
  equipment.forEach((option, index) => out.push(candidate({
    kind: 'occasion-return-freight',
    templateId: `${event.id}:equipment-return:${slug(option.label)}:${day}`,
    sourceId: event.hostId,
    destinationId: event.officialSourceId,
    option,
    likelihood: 1,
    priority: index === 0,
    flatReward: OCCASION_FEE,
    issuerId: 'office-of-public-occasions',
    issuerName: 'Office of Investitures and Public Occasions',
    briefing: `The ${event.type} at ${sourceName} has concluded. The Office of Investitures and Public Occasions assigned the ${option.label} to return to ${locationName(event.officialSourceId)}.`,
    completionMessage: `The Office receives the ${option.label} at ${locationName(event.officialSourceId)} after the ${event.type}. Each reusable piece is entered back into ceremonial stores before your manifest closes.`,
  })));
  return out;
}

function occasionCandidates(ctx: FactionContractContext): FactionContractCandidate[] {
  const event = occasionEvent(ctx.worldTime);
  return event.returnPhase ? occasionReturnCandidates(ctx, event) : occasionOutboundCandidates(ctx, event);
}

function generateAlvaresContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  return [
    ...assessmentCandidates(ctx),
    ...grantCandidates(ctx),
    ...escheatCandidates(ctx),
    ...occasionCandidates(ctx),
  ];
}

export const HOUSE_ALVARES_PROVIDER: FactionContractProvider = {
  id: ALVARES_ID,
  name: ALVARES_NAME,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateAlvaresContracts(ctx);
  },
};
