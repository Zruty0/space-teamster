import { cargoMassForClass, type CargoMassClass, type MissionCargoSpec } from '../../../mission-cost';
import { completionBlurbFrom, type CompletionBlurb } from './completion-blurb-utils';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

const WELLS_NOBLES_ID = 'wells-noble-houses';

interface NobleSeat {
  id: string;
  house: string;
  office: string;
}

interface CargoOption {
  label: string;
  massClass: CargoMassClass;
  category?: 'freight' | 'passenger';
  likelihood: number;
}

const NOBLE_SEATS: NobleSeat[] = [
  { id: 'estella-xa-volatiles-transit', house: 'House Beira', office: 'Castle Beira Household Office' },
  { id: 'estella-xb-worker-hab', house: 'House Tinto', office: 'Castle Tinto Household Office' },
  { id: 'estella-xd-proving-grounds', house: 'House Calatrava', office: 'Calatrava Keep Marshalcy' },
  { id: 'estella-xia-sealed-worker-hab', house: 'House Almaden', office: 'Castle Almaden Household Office' },
  { id: 'estella-xib-science-settlement', house: 'House Marisma', office: 'Castle Marisma Household Office' },
  { id: 'estella-xid-services-outfitter-hangar', house: 'House Cadiz', office: 'Shipwright Keep Household Office' },
  { id: 'estella-xiic-castle-teide', house: 'House Teide', office: 'Castle Teide Charter Office' },
];

const MACAO_DESTINATIONS = [
  'estella-xic-research-station',
  'estella-xic-deep-ice-exobiology',
  'estella-xic-last-breath-lists',
];

const OATHMARK_DESTINATIONS = [
  'estella-xie-outer-spec-drydock',
  'estella-xie-oathmark-academy',
  'estella-xie-component-fabrication',
];

const HEARTH_DESTINATIONS = [
  'estella-iii-capital-city',
  'estella-iii-finance-city',
  'estella-iii-coastal-resort',
  'estella-iii-historic-site',
];

const SEAT_IDS = NOBLE_SEATS.map(seat => seat.id);
const SPECIAL_IDS = [...MACAO_DESTINATIONS, ...OATHMARK_DESTINATIONS];
const ALLOWED_SOURCE_IDS = [...SEAT_IDS, ...SPECIAL_IDS, ...HEARTH_DESTINATIONS];

const PASSENGER_CARGO: CargoOption[] = [
  { label: 'petition counsel and clerks', massClass: 'light', category: 'passenger', likelihood: 0.75 },
  { label: 'household guards in dress kit', massClass: 'standard', category: 'passenger', likelihood: 0.7 },
  { label: 'duelists, seconds, and armor squires', massClass: 'standard', category: 'passenger', likelihood: 0.68 },
  { label: 'heralds with sealed precedence rolls', massClass: 'light', category: 'passenger', likelihood: 0.62 },
  { label: 'private researchers with an unusually lavish retinue', massClass: 'standard', category: 'passenger', likelihood: 0.44 },
  { label: 'pilgrim scholars in sealed luxury berths', massClass: 'standard', category: 'passenger', likelihood: 0.38 },
];

const FREIGHT_CARGO: CargoOption[] = [
  { label: 'exotic gift caskets', massClass: 'light', likelihood: 0.7 },
  { label: 'ceremonial armor cases', massClass: 'standard', likelihood: 0.65 },
  { label: 'court wine and stasis delicacies', massClass: 'light', likelihood: 0.6 },
  { label: 'sculpted hunting beasts', massClass: 'standard', likelihood: 0.5 },
  { label: 'marriage exchange gifts', massClass: 'standard', likelihood: 0.58 },
  { label: 'tournament prizes and trophy engines', massClass: 'standard', likelihood: 0.52 },
  { label: 'sealed petition archive', massClass: 'light', likelihood: 0.48 },
];

const COMPLETION_BLURBS: CompletionBlurb[] = [
  (_candidate, cargo, destination, issuer) => `${destination}'s receiving steward takes the ${cargo} through a side gate and signs with a household seal. ${issuer} has already sent three corrections to the manifest.`,
  (_candidate, cargo, destination) => `The ${cargo} is met at ${destination} by guards in formal kit and a clerk with no sense of humor. The cargo clears only after the precedence marks are read aloud.`,
  (_candidate, cargo, destination, issuer) => `${issuer}'s agent waits until the ${cargo} is behind sealed doors at ${destination}. "No dock gossip," she says, and pays the porters before anyone can answer.`,
  (_candidate, cargo, destination) => `At ${destination}, a household factor counts the ${cargo} twice, then sends it onward under escort. Somewhere nearby, a minor quarrel becomes legally actionable.`,
  (_candidate, cargo, destination, issuer) => `${destination} receives the ${cargo} under court lamps and watchful retainers. "The House will remember the timing," ${issuer}'s factor says, which may or may not be thanks.`,
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
  return text.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '');
}

function seededSample<T>(pool: T[], count: number, seed: number): T[] {
  const out = pool.slice();
  let s = seed >>> 0 || 1;
  const rng = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff; };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, count);
}

function makeCargo(option: CargoOption, seedKey: string): MissionCargoSpec {
  return { label: option.label, massClass: option.massClass, massTons: cargoMassForClass(option.massClass, `${WELLS_NOBLES_ID}:${seedKey}:${option.label}`) };
}

function seatFor(id: string): NobleSeat | undefined {
  return NOBLE_SEATS.find(seat => seat.id === id);
}

function issuerName(sourceId: string, destinationId: string, seed: number): string {
  const sourceSeat = seatFor(sourceId);
  const destSeat = seatFor(destinationId);
  if (sourceSeat && destSeat) return (seed & 1) === 0 ? sourceSeat.office : destSeat.office;
  if (sourceSeat) return sourceSeat.office;
  if (destSeat) return destSeat.office;
  return 'Wells Noble Charter Desk';
}

function destinationPoolFor(sourceId: string, day: number): string[] {
  const sourceIsSeat = SEAT_IDS.includes(sourceId);
  const sourceIsSpecial = SPECIAL_IDS.includes(sourceId);
  const sourceIsHearth = HEARTH_DESTINATIONS.includes(sourceId);

  if (sourceIsSeat) {
    const otherSeats = SEAT_IDS.filter(id => id !== sourceId);
    const seats = seededSample(otherSeats, 3, hashString(`${sourceId}:seats:${day}`));
    const special = seededSample(SPECIAL_IDS, 1, hashString(`${sourceId}:special:${day}`));
    const hearth = day % 4 === 0 ? seededSample(HEARTH_DESTINATIONS, 1, hashString(`${sourceId}:hearth:${day}`)) : [];
    return [...seats, ...special, ...hearth];
  }

  if (sourceIsSpecial) {
    return seededSample(SEAT_IDS, 4, hashString(`${sourceId}:return-seats:${day}`));
  }

  if (sourceIsHearth) {
    return seededSample(SEAT_IDS, 3, hashString(`${sourceId}:hearth-to-seats:${day}`));
  }

  return [];
}

function candidate(sourceId: string, destinationId: string, option: CargoOption, day: number): FactionContractCandidate {
  const seedKey = `${sourceId}->${destinationId}:${slug(option.label)}:${day}`;
  const seed = hashString(seedKey);
  const isHearthLeg = HEARTH_DESTINATIONS.includes(sourceId) || HEARTH_DESTINATIONS.includes(destinationId);
  const isSpecialLeg = SPECIAL_IDS.includes(sourceId) || SPECIAL_IDS.includes(destinationId);
  return {
    factionId: WELLS_NOBLES_ID,
    factionName: 'Wells Noble Houses',
    factionTag: 'NOBLE',
    issuerName: issuerName(sourceId, destinationId, seed),
    templateId: seedKey,
    sourceId,
    destinationId,
    cargo: makeCargo(option, seedKey),
    category: option.category,
    likelihood: option.likelihood * (isHearthLeg ? 0.28 : isSpecialLeg ? 0.75 : 1),
    generosity: isHearthLeg ? 1.1 : isSpecialLeg ? 1.0 : 0.9,
    flatReward: isHearthLeg ? 18_000 : isSpecialLeg ? 12_000 : 8_000,
    compensationRatio: 0.5,
    maxCompAllowance: 2,
  };
}

function cargoForLane(sourceId: string, destinationId: string, day: number): CargoOption {
  const pool = (hashString(`${sourceId}->${destinationId}:kind:${day}`) & 1) === 0 ? PASSENGER_CARGO : FREIGHT_CARGO;
  return seededSample(pool, 1, hashString(`${sourceId}->${destinationId}:cargo:${day}`))[0];
}

function generateWellsNobleContracts(ctx: FactionContractContext): FactionContractCandidate[] {
  if (!ALLOWED_SOURCE_IDS.includes(ctx.sourceId)) return [];
  const day = Math.floor(ctx.worldTime / 86_400);
  return destinationPoolFor(ctx.sourceId, day)
    .map(destinationId => candidate(ctx.sourceId, destinationId, cargoForLane(ctx.sourceId, destinationId, day), day))
    .map(candidate => ({ ...candidate, completionMessage: completionBlurbFrom(COMPLETION_BLURBS, candidate, ctx.worldTime) }));
}

export const WELLS_NOBLE_HOUSES_PROVIDER: FactionContractProvider = {
  id: WELLS_NOBLES_ID,
  name: 'Wells Noble Houses',
  generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    return generateWellsNobleContracts(ctx);
  },
};
