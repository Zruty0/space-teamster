import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { bodyById } from '../../../world';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

const MENDES_ID = 'house-mendes';
const MENDES_NAME = 'House Mendes';
const MENDES_TAG = 'MENDES';
const LORD_MARSHAL = '[contact]Lord Marshal Vasco Mendes[/contact]';

const BANNER_FORGE = 'estella-xie-component-fabrication';
const CASTLE_MENDES = 'estella-xc-castle-mendes';
const GRYPHON = 'estella-x';
const HYDRA = 'estella-xi';
const MANTICORE = 'estella-xii';

const DAY = 86_400;
const HYDRA_ESCAPE_BUFFER = 3 * DAY;
const OUTER_POSTING_HALF_WIDTH = 7 * DAY;
const LOCAL_MUSTER_DURATION = 30 * DAY;
const RETURN_DELAY = 30 * DAY;
const LOCAL_RETURN_DURATION = 14 * DAY;

const GENEROSITY = 0.4;
const COMPENSATION_RATIO = 0.6;
const MAX_COMP_ALLOWANCE = 2;
const OUTBOUND_MUSTER_FEE = 25_000;
const RETURN_MUSTER_FEE = 15_000;

type GiantId = typeof GRYPHON | typeof HYDRA | typeof MANTICORE;
type ContractKind = 'outbound-freight' | 'outbound-passenger' | 'return-freight' | 'return-passenger';

interface CargoOption {
  label: string;
  massClass: CargoMassClass;
  category?: 'passenger';
}

interface MusterTheater {
  id: string;
  name: string;
  giantId: GiantId;
  destinationIds: readonly string[];
}

interface TransferWindow {
  index: number;
  sourceGiantId: GiantId;
  destinationGiantId: GiantId;
  parentDepartureTime: number;
  transferTime: number;
}

interface MusterEvent {
  id: string;
  name: string;
  giantId: GiantId;
  theater: MusterTheater;
  departureStart: number;
  departureEnd: number;
  expectedArrival: number;
}

const GRYPHON_THEATERS: readonly MusterTheater[] = [
  { id: 'beira-frostwatch', name: 'Beira Frostwatch Muster', giantId: GRYPHON, destinationIds: ['estella-xa-volatiles-transit'] },
  { id: 'tinto-red-vein', name: 'Tinto Red Vein Muster', giantId: GRYPHON, destinationIds: ['estella-xb-worker-hab'] },
  { id: 'thronehold-three-banners', name: 'Thronehold Three Banners Muster', giantId: GRYPHON, destinationIds: ['estella-xc-main-outpost', 'estella-xc-transit-refuel'] },
  { id: 'calatrava-shield', name: 'Calatrava Shield Muster', giantId: GRYPHON, destinationIds: ['estella-xd-proving-grounds', 'estella-xd-iron-lists', 'estella-xd-redoubt-field'] },
];

const HYDRA_THEATERS: readonly MusterTheater[] = [
  { id: 'almaden-cinder', name: 'Almaden Cinder Muster', giantId: HYDRA, destinationIds: ['estella-xia-sealed-worker-hab', 'estella-xia-chem-station'] },
  { id: 'marisma-fenwatch', name: 'Marisma Fenwatch Muster', giantId: HYDRA, destinationIds: ['estella-xib-science-settlement', 'estella-xib-cryo-transit'] },
  { id: 'macao-great-pennant', name: 'Macao Great Pennant Muster', giantId: HYDRA, destinationIds: ['estella-xic-research-station-poi', 'estella-xic-last-breath-lists'] },
  { id: 'cadiz-highport', name: 'Cadiz Highport Muster', giantId: HYDRA, destinationIds: ['estella-xid-main-port', 'estella-xid-services-outfitter-hangar'] },
];

const MANTICORE_THEATERS: readonly MusterTheater[] = [
  { id: 'mercy-pilgrim-guard', name: 'Mercy Pilgrim Guard Muster', giantId: MANTICORE, destinationIds: ['estella-xiia-volatiles-transit'] },
  { id: 'vigil-gate', name: 'Vigil Gate Muster', giantId: MANTICORE, destinationIds: ['estella-xiib-transit-station-poi', 'estella-xiib-outpost'] },
  { id: 'teide-outer-watch', name: 'Teide Outer Watch Muster', giantId: MANTICORE, destinationIds: ['estella-xiic-castle-teide'] },
  { id: 'ceuta-blackglass', name: 'Ceuta Blackglass Muster', giantId: MANTICORE, destinationIds: ['estella-xiid-blackglass-observatory'] },
];

const OUTBOUND_FREIGHT: readonly CargoOption[] = [
  { label: 'proofed household guard armor sets', massClass: 'standard' },
  { label: 'shock-lance racks', massClass: 'standard' },
  { label: 'certified robotic destriers', massClass: 'heavy' },
  { label: 'house banner target automata', massClass: 'standard' },
  { label: 'field fortification modules', massClass: 'heavy' },
  { label: 'mobile command equipment suites', massClass: 'standard' },
  { label: 'exercise telemetry pylons', massClass: 'standard' },
  { label: 'sealed weapons lots', massClass: 'standard' },
  { label: 'hazard-rated guard equipment sets', massClass: 'standard' },
  { label: 'casualty-processing stores', massClass: 'standard' },
];

const OUTBOUND_PASSENGERS: readonly CargoOption[] = [
  { label: 'household guard standards inspectors', massClass: 'light', category: 'passenger' },
  { label: 'senior household captains', massClass: 'light', category: 'passenger' },
  { label: 'field surgeons and casualty assessors', massClass: 'light', category: 'passenger' },
  { label: 'exercise adjudicators', massClass: 'light', category: 'passenger' },
  { label: 'muster clerks and seal officers', massClass: 'light', category: 'passenger' },
  { label: 'household logistics officers', massClass: 'light', category: 'passenger' },
];

const RETURN_FREIGHT: readonly CargoOption[] = [
  { label: 'damaged household guard armor sets', massClass: 'standard' },
  { label: 'disabled target automata', massClass: 'standard' },
  { label: 'robotic destrier overhaul lots', massClass: 'heavy' },
  { label: 'surplus fortification modules', massClass: 'heavy' },
  { label: 'exercise telemetry archives', massClass: 'light' },
  { label: 'proof-failure specimens', massClass: 'standard' },
  { label: 'sealed after-action records', massClass: 'light' },
];

const RETURN_PASSENGERS: readonly CargoOption[] = OUTBOUND_PASSENGERS;

function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
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

function theatersFor(giantId: GiantId): readonly MusterTheater[] {
  if (giantId === GRYPHON) return GRYPHON_THEATERS;
  if (giantId === MANTICORE) return MANTICORE_THEATERS;
  return HYDRA_THEATERS;
}

function transferWindowBase(sourceGiantId: GiantId, destinationGiantId: GiantId): { base: number; synodic: number; transferTime: number } {
  const source = bodyById(sourceGiantId);
  const destination = bodyById(destinationGiantId);
  const parent = source.orbit?.parentBodyId ? bodyById(source.orbit.parentBodyId) : undefined;
  if (!source.orbit || !destination.orbit || !parent || source.orbit.parentBodyId !== destination.orbit.parentBodyId) {
    throw new Error(`Mendes muster transfer pair is not co-orbital: ${sourceGiantId} -> ${destinationGiantId}`);
  }
  const sourceMeanMotion = Math.sqrt(parent.gm / (source.orbit.radius ** 3));
  const destinationMeanMotion = Math.sqrt(parent.gm / (destination.orbit.radius ** 3));
  const transferRadius = (source.orbit.radius + destination.orbit.radius) * 0.5;
  const transferTime = Math.PI * Math.sqrt((transferRadius ** 3) / parent.gm);
  const synodic = Math.PI * 2 / Math.abs(destinationMeanMotion - sourceMeanMotion);
  const sense = source.orbit.orbitSense;
  const initialPhase = sense * (destination.orbit.epochAngle - source.orbit.epochAngle);
  const desiredPhase = Math.PI - destinationMeanMotion * transferTime;
  const raw = (desiredPhase - initialPhase) / (destinationMeanMotion - sourceMeanMotion);
  return { base: positiveModulo(raw, synodic), synodic, transferTime };
}

function transferWindow(sourceGiantId: GiantId, destinationGiantId: GiantId, index: number): TransferWindow {
  const schedule = transferWindowBase(sourceGiantId, destinationGiantId);
  return {
    index,
    sourceGiantId,
    destinationGiantId,
    parentDepartureTime: schedule.base + index * schedule.synodic,
    transferTime: schedule.transferTime,
  };
}

function nearbyTransferWindows(sourceGiantId: GiantId, destinationGiantId: GiantId, worldTime: number, radius = 1): TransferWindow[] {
  const schedule = transferWindowBase(sourceGiantId, destinationGiantId);
  const nearest = Math.round((worldTime - schedule.base) / schedule.synodic);
  const out: TransferWindow[] = [];
  for (let index = nearest - radius; index <= nearest + radius; index++) out.push(transferWindow(sourceGiantId, destinationGiantId, index));
  return out;
}

function nextTransferWindow(sourceGiantId: GiantId, destinationGiantId: GiantId, notBefore: number): TransferWindow {
  const schedule = transferWindowBase(sourceGiantId, destinationGiantId);
  const index = Math.ceil((notBefore - schedule.base) / schedule.synodic);
  return transferWindow(sourceGiantId, destinationGiantId, index);
}

function theaterForWindow(destinationGiantId: GiantId, index: number): MusterTheater {
  const theaters = theatersFor(destinationGiantId);
  return theaters[hashString(`${sourceWindowKey(destinationGiantId, index)}:theater`) % theaters.length];
}

function sourceWindowKey(destinationGiantId: GiantId, index: number): string {
  return `hydra-${destinationGiantId}:${index}`;
}

function outerMuster(window: TransferWindow): MusterEvent {
  const theater = theaterForWindow(window.destinationGiantId, window.index);
  const stationDeparture = window.parentDepartureTime - HYDRA_ESCAPE_BUFFER;
  return {
    id: `${sourceWindowKey(window.destinationGiantId, window.index)}:${theater.id}`,
    name: theater.name,
    giantId: window.destinationGiantId,
    theater,
    departureStart: stationDeparture - OUTER_POSTING_HALF_WIDTH,
    departureEnd: stationDeparture + OUTER_POSTING_HALF_WIDTH,
    expectedArrival: window.parentDepartureTime + window.transferTime,
  };
}

function activeOuterMusters(worldTime: number): MusterEvent[] {
  return ([GRYPHON, MANTICORE] as const).flatMap(destinationGiantId => nearbyTransferWindows(HYDRA, destinationGiantId, worldTime)
    .map(outerMuster)
    .filter(event => worldTime >= event.departureStart && worldTime <= event.departureEnd));
}

function localMusterAt(worldTime: number): MusterEvent {
  const index = Math.floor(worldTime / LOCAL_MUSTER_DURATION);
  const theater = HYDRA_THEATERS[hashString(`hydra-local:${index}`) % HYDRA_THEATERS.length];
  return {
    id: `hydra-local:${index}:${theater.id}`,
    name: theater.name,
    giantId: HYDRA,
    theater,
    departureStart: index * LOCAL_MUSTER_DURATION,
    departureEnd: (index + 1) * LOCAL_MUSTER_DURATION,
    expectedArrival: index * LOCAL_MUSTER_DURATION,
  };
}

function recentOuterMusters(worldTime: number): MusterEvent[] {
  const lookback = 800 * DAY;
  return ([GRYPHON, MANTICORE] as const).flatMap(destinationGiantId => {
    const schedule = transferWindowBase(HYDRA, destinationGiantId);
    const first = Math.floor((worldTime - lookback - schedule.base) / schedule.synodic);
    const last = Math.ceil((worldTime - schedule.base) / schedule.synodic);
    const events: MusterEvent[] = [];
    for (let index = first; index <= last; index++) events.push(outerMuster(transferWindow(HYDRA, destinationGiantId, index)));
    return events;
  });
}

function recentLocalMusters(worldTime: number): MusterEvent[] {
  const first = Math.max(0, Math.floor((worldTime - 400 * DAY) / LOCAL_MUSTER_DURATION));
  const last = Math.floor(worldTime / LOCAL_MUSTER_DURATION);
  const events: MusterEvent[] = [];
  for (let index = first; index <= last; index++) events.push(localMusterAt(index * LOCAL_MUSTER_DURATION));
  return events;
}

function returnPostingActive(event: MusterEvent, destinationGiantId: typeof HYDRA | typeof GRYPHON, worldTime: number): boolean {
  const ready = event.expectedArrival + RETURN_DELAY;
  if (event.giantId === destinationGiantId) return worldTime >= ready && worldTime <= ready + LOCAL_RETURN_DURATION;
  const window = nextTransferWindow(event.giantId, destinationGiantId, ready + HYDRA_ESCAPE_BUFFER);
  const stationDeparture = window.parentDepartureTime - HYDRA_ESCAPE_BUFFER;
  return Math.abs(worldTime - stationDeparture) <= OUTER_POSTING_HALF_WIDTH;
}

function assignmentText(kind: ContractKind, cargo: string, muster: string, seed: number): string {
  const assignment = kind.startsWith('return')
    ? `${LORD_MARSHAL} ordered the ${cargo} returned from the ${muster}`
    : `${LORD_MARSHAL} assigned the ${cargo} to the ${muster}`;
  const service = [
    'By completing this movement, you are doing an important service to House Mendes.',
    'In carrying out this warrant, you are doing an important service to House Mendes.',
    'Your work on this movement is an important service to House Mendes.',
  ][seed % 3];
  return `${assignment}. ${service}`;
}

function completionText(kind: ContractKind, cargo: string, destination: string, muster: string, seed: number): string {
  const variants: Record<ContractKind, readonly string[]> = {
    'outbound-freight': [
      `At ${destination}, muster quartermasters take custody of the ${cargo} for the ${muster}. ${LORD_MARSHAL}’s seal is entered against the load, and your delivery is closed.`,
      `The ${cargo} pass into the issue lines of the ${muster} at ${destination}. Acknowledgment from ${LORD_MARSHAL} reaches your terminal before the bay is clear.`,
    ],
    'outbound-passenger': [
      `The ${cargo} report to the ${muster} at ${destination}. ${LORD_MARSHAL}’s adjutant verifies the roll and releases your passenger receipt.`,
      `At ${destination}, the ${cargo} step directly into their duties for the ${muster}. ${LORD_MARSHAL} acknowledges the completed movement.`,
    ],
    'return-freight': [
      `Banner Forge receives the ${cargo} from the ${muster}. ${LORD_MARSHAL}’s return warrant is closed as reclamation crews take the load.`,
      `The ${cargo} come off your rig at Banner Forge and move directly to inspection after the ${muster}. ${LORD_MARSHAL} records the return as complete.`,
    ],
    'return-passenger': [
      `At Castle Mendes, the ${cargo} report back from the ${muster}. ${LORD_MARSHAL} acknowledges every name on the returning roll.`,
      `The ${cargo} enter the Marshalcy with the records of the ${muster}. ${LORD_MARSHAL} closes the movement order and releases your rig.`,
    ],
  };
  const pool = variants[kind];
  return pool[seed % pool.length];
}

function cargoSpec(option: CargoOption, seedKey: string): MissionCargoSpec {
  return {
    label: option.label,
    massClass: option.massClass,
    massTons: cargoMassForClass(option.massClass, `${MENDES_ID}:${seedKey}`),
  };
}

function makeCandidate(
  event: MusterEvent,
  kind: ContractKind,
  sourceId: string,
  destinationId: string,
  option: CargoOption,
  worldTime: number,
  priority: boolean,
): FactionContractCandidate {
  const templateId = `${event.id}:${kind}:${sourceId}->${destinationId}:${slug(option.label)}`;
  const seed = hashString(`${templateId}:${Math.floor(worldTime / DAY)}`);
  const cargo = cargoSpec(option, templateId);
  return {
    factionId: MENDES_ID,
    factionName: MENDES_NAME,
    factionTag: MENDES_TAG,
    templateId,
    sourceId,
    destinationId,
    cargo,
    category: option.category,
    likelihood: priority ? 8 : 3,
    boardPriority: priority,
    generosity: GENEROSITY,
    flatReward: kind.startsWith('return') ? RETURN_MUSTER_FEE : OUTBOUND_MUSTER_FEE,
    compensationRatio: COMPENSATION_RATIO,
    maxCompAllowance: MAX_COMP_ALLOWANCE,
    issuerId: kind === 'return-passenger' ? 'house-mendes-marshalcy' : 'banner-forge-ordnance-office',
    issuerName: kind === 'return-passenger' ? 'House Mendes Marshalcy' : 'Banner Forge Ordnance Office',
    briefing: assignmentText(kind, option.label, event.name, seed),
    completionMessage: completionText(kind, option.label, locationName(destinationId), event.name, seed >>> 1),
    preferredTransferId: event.giantId === HYDRA && kind.startsWith('outbound') ? undefined : 'best',
  };
}

function locationName(id: string): string {
  // Candidate titles and final contracts resolve the authoritative location name; this
  // local lookup avoids importing the full contract generator back into the provider.
  const names: Record<string, string> = {
    'estella-xa-volatiles-transit': 'Castle Beira',
    'estella-xb-worker-hab': 'Castle Tinto',
    'estella-xc-main-outpost': 'Serratine',
    'estella-xc-transit-refuel': 'Herald Gate',
    'estella-xd-proving-grounds': 'Calatrava Keep',
    'estella-xd-iron-lists': 'Iron Lists',
    'estella-xd-redoubt-field': 'Redoubt Field',
    'estella-xia-sealed-worker-hab': 'Castle Almaden',
    'estella-xia-chem-station': 'Almaden Orbital',
    'estella-xib-science-settlement': 'Castle Marisma',
    'estella-xib-cryo-transit': 'Coldgate',
    'estella-xic-research-station-poi': 'Macao Palace',
    'estella-xic-last-breath-lists': 'The Great Arena',
    'estella-xid-main-port': 'Cadiz Highport',
    'estella-xid-services-outfitter-hangar': 'Shipwright Keep',
    'estella-xiia-volatiles-transit': 'Pilgrim Gate',
    'estella-xiib-transit-station-poi': 'Vigil Gate',
    'estella-xiib-outpost': 'Vigil Keep',
    'estella-xiic-castle-teide': 'Castle Teide',
    'estella-xiid-blackglass-observatory': 'Blackglass Observatory',
    [BANNER_FORGE]: 'Banner Forge',
    [CASTLE_MENDES]: 'Castle Mendes',
  };
  return names[id] ?? id;
}

function outboundCandidates(event: MusterEvent, worldTime: number): FactionContractCandidate[] {
  const out: FactionContractCandidate[] = [];
  event.theater.destinationIds.forEach((destinationId, destinationIndex) => {
    const freight = seededSample(OUTBOUND_FREIGHT, 2, hashString(`${event.id}:${destinationId}:freight:${Math.floor(worldTime / DAY)}`));
    freight.forEach((option, optionIndex) => out.push(makeCandidate(event, 'outbound-freight', BANNER_FORGE, destinationId, option, worldTime, destinationIndex === 0 && optionIndex === 0)));
    const passenger = seededSample(OUTBOUND_PASSENGERS, 1, hashString(`${event.id}:${destinationId}:passenger:${Math.floor(worldTime / DAY)}`))[0];
    out.push(makeCandidate(event, 'outbound-passenger', BANNER_FORGE, destinationId, passenger, worldTime, destinationIndex === 0));
  });
  return out;
}

function returnCandidates(event: MusterEvent, sourceId: string, worldTime: number): FactionContractCandidate[] {
  if (!event.theater.destinationIds.includes(sourceId)) return [];
  const out: FactionContractCandidate[] = [];
  if (returnPostingActive(event, HYDRA, worldTime)) {
    const options = seededSample(RETURN_FREIGHT, 2, hashString(`${event.id}:${sourceId}:return-freight:${Math.floor(worldTime / DAY)}`));
    options.forEach((option, index) => out.push(makeCandidate(event, 'return-freight', sourceId, BANNER_FORGE, option, worldTime, index === 0)));
  }
  if (returnPostingActive(event, GRYPHON, worldTime) && sourceId !== CASTLE_MENDES) {
    const option = seededSample(RETURN_PASSENGERS, 1, hashString(`${event.id}:${sourceId}:return-passenger:${Math.floor(worldTime / DAY)}`))[0];
    out.push(makeCandidate(event, 'return-passenger', sourceId, CASTLE_MENDES, option, worldTime, true));
  }
  return out;
}

function generateMendesContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  const activeOuter = activeOuterMusters(ctx.worldTime);
  if (ctx.sourceId === BANNER_FORGE) {
    if (activeOuter.length) return activeOuter.flatMap(event => outboundCandidates(event, ctx.worldTime));
    return outboundCandidates(localMusterAt(ctx.worldTime), ctx.worldTime);
  }

  const outerReturns = recentOuterMusters(ctx.worldTime).flatMap(event => returnCandidates(event, ctx.sourceId, ctx.worldTime));
  const localReturns = recentLocalMusters(ctx.worldTime).flatMap(event => returnCandidates(event, ctx.sourceId, ctx.worldTime));
  return [...outerReturns, ...localReturns];
}

export const HOUSE_MENDES_PROVIDER: FactionContractProvider = {
  id: MENDES_ID,
  name: MENDES_NAME,
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateMendesContracts(ctx);
  },
};
