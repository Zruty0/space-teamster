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
  { id: 'estella-xa-volatiles-transit', house: 'Count Beira', office: "Count Beira's Household Office" },
  { id: 'estella-xb-worker-hab', house: 'Count Tinto', office: "Count Tinto's Household Office" },
  { id: 'estella-xd-proving-grounds', house: 'Marquis Calatrava', office: "Marquis Calatrava's Marshalcy" },
  { id: 'estella-xia-sealed-worker-hab', house: 'Marquis Almaden', office: "Marquis Almaden's Household Office" },
  { id: 'estella-xib-science-settlement', house: 'Count Marisma', office: "Count Marisma's Household Office" },
  { id: 'estella-xid-services-outfitter-hangar', house: 'Lord Cadiz', office: "Lord Cadiz's Household Office" },
  { id: 'estella-xiic-castle-teide', house: 'Count Teide', office: "Count Teide's Charter Office" },
];

const MACAO_DESTINATIONS = [
  'estella-xic-research-station-poi',
  'estella-xic-deep-ice-exobiology',
  'estella-xic-last-breath-lists',
];

const SHIPYARD_DESTINATIONS = [
  'estella-xie-outer-spec-drydock',
  'estella-xie-rare-alloy-extraction',
];

const OATHMARK_MARTIAL_DESTINATIONS = [
  'estella-xie-oathmark-academy',
  'estella-xie-component-fabrication',
];

const OATHMARK_DESTINATIONS = [
  ...SHIPYARD_DESTINATIONS,
  ...OATHMARK_MARTIAL_DESTINATIONS,
];

const COURT_DESTINATIONS = [
  'estella-xc-main-outpost',
  'estella-xc-transit-refuel',
];

const MANTICORE_ADJACENT_DESTINATIONS = [
  'estella-xii-observation-post',
];

const HEARTH_DESTINATIONS = [
  'estella-iii-capital-city',
  'estella-iii-finance-city',
  'estella-iii-coastal-resort',
  'estella-iii-historic-site',
];

const SEAT_IDS = NOBLE_SEATS.map(seat => seat.id);
const SPECIAL_IDS = [...MACAO_DESTINATIONS, ...OATHMARK_DESTINATIONS, ...COURT_DESTINATIONS, ...MANTICORE_ADJACENT_DESTINATIONS];
const ALLOWED_SOURCE_IDS = [...SEAT_IDS, ...SPECIAL_IDS, ...HEARTH_DESTINATIONS];
const NOBLE_DESTINATION_COUNT = 5;
const SAME_GIANT_DESTINATION_COUNT = 4;
const NOBLE_GENEROSITY = 0.3;
const NOBLE_COMPENSATION_RATIO = 0.7;
const NOBLE_MAX_COMP_ALLOWANCE = 2;

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

const COURT_CARGO: CargoOption[] = [
  { label: 'precedence case witnesses', massClass: 'light', category: 'passenger', likelihood: 0.74 },
  { label: 'petition counsel and sealed clerks', massClass: 'light', category: 'passenger', likelihood: 0.7 },
  { label: 'marriage-contract notaries', massClass: 'light', category: 'passenger', likelihood: 0.62 },
  { label: 'sealed chancery bundles', massClass: 'light', likelihood: 0.66 },
  { label: 'heraldic evidence chests', massClass: 'standard', likelihood: 0.54 },
];

const TO_SHIPYARD_CARGO: CargoOption[] = [
  { label: 'house yacht refit bonds', massClass: 'light', likelihood: 0.74 },
  { label: 'heraldic hull plate patterns', massClass: 'standard', likelihood: 0.68 },
  { label: 'private stateroom fittings', massClass: 'standard', likelihood: 0.62 },
  { label: 'yard arbitration counsel', massClass: 'light', category: 'passenger', likelihood: 0.58 },
  { label: 'crest-coded transponder petitions', massClass: 'light', likelihood: 0.52 },
];

const FROM_SHIPYARD_CARGO: CargoOption[] = [
  { label: 'sealed yard acceptance papers', massClass: 'light', likelihood: 0.72 },
  { label: 'proofed yacht components', massClass: 'standard', likelihood: 0.66 },
  { label: 'shipwright witnesses and appraisers', massClass: 'light', category: 'passenger', likelihood: 0.6 },
  { label: 'house pennant transponder cores', massClass: 'light', likelihood: 0.56 },
  { label: 'polished cabin shrine modules', massClass: 'standard', likelihood: 0.46 },
];

const TO_OATHMARK_CARGO: CargoOption[] = [
  { label: 'household guard candidates', massClass: 'standard', category: 'passenger', likelihood: 0.76 },
  { label: 'duelists, seconds, and armor squires', massClass: 'standard', category: 'passenger', likelihood: 0.72 },
  { label: 'challenge writs and bout stakes', massClass: 'light', likelihood: 0.64 },
  { label: 'unproofed ceremonial armor', massClass: 'standard', likelihood: 0.58 },
  { label: 'family blade blanks', massClass: 'light', likelihood: 0.5 },
  { label: 'disassembled siege engine kits', massClass: 'heavy', likelihood: 0.46 },
  { label: 'robotic destrier cradles', massClass: 'heavy', likelihood: 0.44 },
  { label: 'shock-lance racks', massClass: 'standard', likelihood: 0.42 },
  { label: 'tilt-yard drone packs', massClass: 'standard', likelihood: 0.38 },
  { label: 'house banner target automata', massClass: 'standard', likelihood: 0.34 },
];

const FROM_OATHMARK_CARGO: CargoOption[] = [
  { label: 'certified duel referees', massClass: 'light', category: 'passenger', likelihood: 0.72 },
  { label: 'proofed honor blades', massClass: 'light', likelihood: 0.66 },
  { label: 'academy verdict rolls', massClass: 'light', likelihood: 0.58 },
  { label: 'tournament armor aftercare crates', massClass: 'standard', likelihood: 0.52 },
  { label: 'graduated household guard cadres', massClass: 'standard', category: 'passenger', likelihood: 0.48 },
  { label: 'certified robotic destriers', massClass: 'heavy', likelihood: 0.44 },
  { label: 'proofed siege engine carriages', massClass: 'heavy', likelihood: 0.4 },
  { label: 'calibrated joust drone swarms', massClass: 'standard', likelihood: 0.36 },
  { label: 'referee telemetry pylons', massClass: 'standard', likelihood: 0.32 },
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

function giantSoiFor(id: string): 'gryphon' | 'hydra' | 'manticore' | undefined {
  if ([
    'estella-xa-volatiles-transit',
    'estella-xb-worker-hab',
    'estella-xd-proving-grounds',
    ...COURT_DESTINATIONS,
  ].includes(id)) return 'gryphon';
  if ([
    'estella-xia-sealed-worker-hab',
    'estella-xib-science-settlement',
    'estella-xid-services-outfitter-hangar',
    ...MACAO_DESTINATIONS,
    ...OATHMARK_DESTINATIONS,
  ].includes(id)) return 'hydra';
  if ([
    'estella-xiic-castle-teide',
    ...MANTICORE_ADJACENT_DESTINATIONS,
  ].includes(id)) return 'manticore';
  return undefined;
}

function sameGiantDestinationsFor(sourceId: string): string[] {
  const sourceGiant = giantSoiFor(sourceId);
  if (!sourceGiant) return [];
  return [...SEAT_IDS, ...SPECIAL_IDS].filter(id => id !== sourceId && giantSoiFor(id) === sourceGiant);
}

function wideDestinationsFor(sourceId: string, day: number): string[] {
  const sourceGiant = giantSoiFor(sourceId);
  const wells = [...SEAT_IDS, ...SPECIAL_IDS].filter(id => id !== sourceId && giantSoiFor(id) !== sourceGiant);
  const hearth = day % 4 === 0 ? HEARTH_DESTINATIONS : [];
  return [...wells, ...hearth];
}

function destinationPoolFor(sourceId: string, day: number): string[] {
  const sourceIsSeat = SEAT_IDS.includes(sourceId);
  const sourceIsSpecial = SPECIAL_IDS.includes(sourceId);
  const sourceIsHearth = HEARTH_DESTINATIONS.includes(sourceId);

  if (sourceIsSeat || sourceIsSpecial) {
    const sameGiant = seededSample(sameGiantDestinationsFor(sourceId), SAME_GIANT_DESTINATION_COUNT, hashString(`${sourceId}:same-giant:${day}`));
    const wideCount = Math.max(1, NOBLE_DESTINATION_COUNT - sameGiant.length);
    const wide = seededSample(wideDestinationsFor(sourceId, day).filter(id => !sameGiant.includes(id)), wideCount, hashString(`${sourceId}:wide:${day}`));
    return [...sameGiant, ...wide];
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
    generosity: NOBLE_GENEROSITY,
    flatReward: isHearthLeg ? 30_000 : isSpecialLeg ? 20_000 : 12_000,
    compensationRatio: NOBLE_COMPENSATION_RATIO,
    maxCompAllowance: NOBLE_MAX_COMP_ALLOWANCE,
  };
}

function cargoPoolForLane(sourceId: string, destinationId: string, day: number): CargoOption[] {
  if (COURT_DESTINATIONS.includes(destinationId) || COURT_DESTINATIONS.includes(sourceId)) return COURT_CARGO;
  if (SHIPYARD_DESTINATIONS.includes(destinationId)) return TO_SHIPYARD_CARGO;
  if (SHIPYARD_DESTINATIONS.includes(sourceId)) return FROM_SHIPYARD_CARGO;
  if (OATHMARK_MARTIAL_DESTINATIONS.includes(destinationId)) return TO_OATHMARK_CARGO;
  if (OATHMARK_MARTIAL_DESTINATIONS.includes(sourceId)) return FROM_OATHMARK_CARGO;
  return (hashString(`${sourceId}->${destinationId}:kind:${day}`) & 1) === 0 ? PASSENGER_CARGO : FREIGHT_CARGO;
}

function cargoForLane(sourceId: string, destinationId: string, day: number): CargoOption {
  return seededSample(cargoPoolForLane(sourceId, destinationId, day), 1, hashString(`${sourceId}->${destinationId}:cargo:${day}`))[0];
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
