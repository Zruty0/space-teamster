import { REPUTATION_TRACKS, isReputationId, normalizeReputations, normalizedReputation, reputationStanding, reputationMaxLevel, inheritedReputationLevel, INHERITED_REPUTATION_TRACKS, type ReputationId } from '../src/reputation';
import { defaultCareerProfile, loadCareerProfile, saveCareerProfile, resetCareerProfile, TEAMSTER_CERTIFICATION_IDS } from '../src/career-state';
import { Game } from '../src/game';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { emptyRunDestinationIds } from '../src/empty-runs';
import { equipmentQuote } from '../src/maintenance/equipment';
import { MAINTENANCE_SHOPS } from '../src/maintenance/shops';
import { drawInteractiveScene, interactiveSceneBodyScrollLimit } from '../src/interactive-scene';

let checks = 0, writes = 0, fail = false;
function assert(value: unknown, message: string): asserts value { checks++; if (!value) throw Error(message); }
function canonical(v: any): any { return Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v; }
function equal(a: unknown, b: unknown, message: string) { assert(JSON.stringify(canonical(a)) === JSON.stringify(canonical(b)), message); }
const storage = new Map<string, string>();
const key = 'space-teamster.career.v1';
let beforeSave: (() => void) | undefined;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => { beforeSave?.(); if (fail) throw Error('blocked synthetic save'); storage.set(k, v); writes++; },
} });

// Independent title expectations: ten reviewed tracks plus provisional general BAM/Merren titles.
const reviewed = new Map(`House Alvares|Unpresented Stranger|Carrier by Ducal Warrant|Favoured Client of the Court|Intimate of the Ducal Household
House Mendes|Unproven Outsider|Provisioner to the Banners|Honoured Ally of the House|Companion of the Marshal’s Table
House Nunes|Unintroduced Stranger|Bearer of the Watch Warrant|Esteemed Friend of the Outer Watch|Keeper of the House’s Confidence
Steel Combine|Unaffiliated Worker|Registered Sympathizer|Honorary Citizen|Honorary Udarnik
Voss-Heinkel Metricwerke|Unrated Operator|Field-Proven Contractor|Factory-Warranted Carrier|Partner of the Works
Kisaragi|Unproven Hand|Proven Hand|Carrier of the Marque|Honoured Friend of the House
Covenant Remnants|Unsealed Stranger|Guest at the Gate|Friend of the Covenant|Unsealed Kindred
Daedalus Systems|Unknown Quantity|Known Quantity|Authorized Contractor|Authorized Partner
Cerberus Human Resources|Unverified Asset|Verified Asset|Trusted Instrument|Friend of the Board
Balor Advanced Materials|Unknown|Reliable Contractor|Trusted Friend
Merren Conservatory|Unknown|Reliable Contractor|Trusted Friend
Notoriety|No Name|Safe Pair of Hands|A Name Worth Trusting|One of Our Own`.split('\n').map(line => {
  const cells = line.split('|');
  return [cells[0], cells.slice(1)] as const;
}));
assert(REPUTATION_TRACKS.length === 12 && new Set(REPUTATION_TRACKS.map(t => t.id)).size === 12, 'exactly twelve independent tracks');
for (const track of REPUTATION_TRACKS) {
  equal(track.titles, reviewed.get(track.name), `${track.name}: original reviewed titles or provisional general commercial titles`);
  assert(isReputationId(track.id), `${track.id}: valid stable id`);
  const expectedCap = ['balor-advanced-materials', 'merren-conservatory'].includes(track.id) ? 2 : 3;
  assert(reputationMaxLevel(track.id) === expectedCap && track.titles.length === expectedCap + 1, 'only BAM/Merren capped at 2');
}
for (const id of ['teamsters-guild', 'GUILD', 'BFS', 'KIS-E', 'ACCORD', 'HALL', 'oathmark-accord-authority', 'halloran-smelting-house', 'bruckner-field-services', '__proto__', 'constructor', '', null, undefined, 2]) assert(!isReputationId(id), 'unknown/non-track ids rejected');

const zero = normalizeReputations(undefined);
assert(Object.keys(zero).length === 12 && Object.values(zero).every(v => v === 0), 'all twelve start unknown');
const a = defaultCareerProfile(), b = defaultCareerProfile();
a.reputations!['house-alvares'] = 2.5;
assert(b.reputations!['house-alvares'] === 0, 'default records do not share mutable state');
for (const value of [undefined, null, [], '2', true, NaN, Infinity, -Infinity, {}]) assert(normalizedReputation(value) === 0, 'malformed progress is zero');
assert(normalizedReputation(-4) === 0 && normalizedReputation(9) === 3, 'finite saved out-of-range values clamped');
const inherited = Object.create({ 'house-alvares': 3 }); inherited['house-mendes'] = 1.25;
equal(normalizeReputations(inherited), { ...zero, 'house-mendes': 1.25 }, 'ignore inherited and unknown keys');
equal(normalizeReputations({ 'house-nunes': '2', 'steel-combine': 0.375, 'made-up': 3 }), { ...zero, 'steel-combine': 0.375 }, 'partial save validated without coercion');
for (const track of REPUTATION_TRACKS) {
  for (const value of [0, 0.001, 0.25, 0.5, 0.9999999999999999, 1, 1.2, 1.5, 1.9999999999999998, 2, 2.75, 2.9999999999999996, 3]) {
    const standing = reputationStanding({ ...zero, [track.id]: value }, track.id);
    const max = track.titles.length - 1, expected = Math.min(max, value);
    assert(standing.progress === expected && standing.level === Math.floor(expected), `${track.id}/${value}: capped progress, floor rank`);
    assert(standing.title === track.titles[Math.floor(expected)], 'title belongs to current full-bar rank');
    assert(standing.bars.length === max && standing.bars.filter(v => v === 1).length === standing.level, 'bar count matches cap, no premature promotion');
    assert(Math.abs(standing.bars.reduce((a, b) => a + b, 0) - expected) < 1e-14, 'bar fills preserve fractional progress');
  }
}

// Inherited employer standing takes maximum completed levels, never sums or transfers progress.
const inheritedSources = {
  BFS: ['voss-heinkel-metricwerke'], 'KIS-E': ['kisaragi'],
  ACCORD: ['house-alvares', 'house-mendes', 'house-nunes'],
  HALL: ['voss-heinkel-metricwerke', 'kisaragi', 'daedalus-systems', 'cerberus-human-resources', 'balor-advanced-materials', 'merren-conservatory'],
} as const;
equal(INHERITED_REPUTATION_TRACKS, inheritedSources, 'explicit donor sets, no fabricated employer tracks');
equal(normalizeReputations({ ...zero, ACCORD: 3, HALL: 3, BFS: 3, 'KIS-E': 3 }), zero, 'derived values cannot become independent saved standings');
for (const employer of ['BFS', 'KIS-E', 'ACCORD', 'HALL'] as const) {
  assert(inheritedReputationLevel(undefined, employer) === 0, 'legacy derived level zero');
  for (const track of REPUTATION_TRACKS) for (const value of [0, 0.9, 1.99, 2, 2.99, 3]) {
    const state = { ...zero, [track.id]: value }, before = JSON.stringify(state);
    const eligible = (inheritedSources[employer] as readonly string[]).includes(track.id);
    const expected = eligible ? Math.floor(Math.min(track.titles.length - 1, value)) : 0;
    assert(inheritedReputationLevel(state, employer) === expected, `${employer}: eligible donors only, capped full levels`);
    assert(JSON.stringify(state) === before, 'derived reading never changes stored tracks');
  }
  const state = { ...zero };
  for (const id of inheritedSources[employer]) state[id] = 0.9;
  assert(inheritedReputationLevel(state, employer) === 0, 'partial donor bars never add up');
  for (const id of inheritedSources[employer]) state[id] = 1.9;
  assert(inheritedReputationLevel(state, employer) === 1, 'maximum, not sum');
  state[inheritedSources[employer][0]] = 3;
  assert(inheritedReputationLevel(state, employer) === 3, 'best donor wins');
  state[inheritedSources[employer][0]] = 0;
  assert(inheritedReputationLevel(state, employer) === (inheritedSources[employer].length > 1 ? 1 : 0), 'derived level falls when best donor resets');
}

const legacy = defaultCareerProfile();
legacy.money = -123; legacy.worldTime = 456; legacy.certifications = [...TEAMSTER_CERTIFICATION_IDS]; legacy.knownContactIds = ['gideon-gid-bell'];
// Already settled to this clock: legacy load's normal passive Inquiry advance is not a rank effect.
legacy.nunesInquiries.updatedWorldTime = legacy.worldTime;
delete legacy.reputations;
storage.set(key, JSON.stringify(legacy));
const count = writes, loaded = loadCareerProfile();
equal(loaded.reputations, zero, 'legacy save gets twelve zero ranks');
const { reputations: _r, ...rest } = loaded;
equal(rest, legacy, 'legacy location/cash/time/qualifications/rig/credits/contacts/inquiries preserved');
assert(writes === count, 'loading ranks adds no eager save or schema-version migration');
for (const bad of [null, [], 'bad', 4, { 'steel-combine': -1, 'house-alvares': 12, 'kisaragi': '3' }]) {
  storage.set(key, JSON.stringify({ ...legacy, reputations: bad }));
  const p = loadCareerProfile();
  equal(p.reputations, normalizeReputations(bad), 'malformed rank field repaired locally');
  const { reputations, ...other } = p; equal(other, legacy, 'malformed ranks never reset the career');
}
loaded.reputations!['daedalus-systems'] = 1.875;
saveCareerProfile(loaded);
equal(loadCareerProfile(), loaded, 'rank values round-trip through existing career key');
assert(storage.size === 1, 'no new storage key');
// Ten-track saves retain all previous progress, adding the two new zero entries without a write.
const oldTracks: Partial<Record<ReputationId, number>> = { ...loaded.reputations };
delete oldTracks['balor-advanced-materials']; delete oldTracks['merren-conservatory'];
storage.set(key, JSON.stringify({ ...loaded, reputations: oldTracks }));
const previousWrites = writes;
equal(loadCareerProfile(), loaded, 'old ten-track save retains original values, adds only two zeros');
assert(writes === previousWrites, 'no eager expansion save');
for (const id of ['balor-advanced-materials', 'merren-conservatory'] as const) {
  storage.set(key, JSON.stringify({ ...loaded, reputations: { ...loaded.reputations, [id]: 9 } }));
  assert(loadCareerProfile().reputations![id] === 2, 'load clamps new commercial cap');
}
saveCareerProfile(loaded);

const game: any = Object.create(Game.prototype);
game.career = loaded; game.worldTime = 999;
game.phase = { kind: 'interactiveScene', scene: { id: 'careerStatus', selectedIndex: 0 } };
game.pendingMaintenanceSettlement = { resultingRig: structuredClone(loaded.rig), ledger: { marker: 'untouched' } };
game.phaseCompletion = { marker: 'untouched' };
const baseline = structuredClone(game.career);
const clocksAndFlight = JSON.stringify([game.worldTime, game.phase, game.pendingMaintenanceSettlement, game.phaseCompletion]);
for (const id of ['__proto__', 'constructor', 'teamsters-guild', 'KIS-E', 'bogus', 'ACCORD', 'HALL', 'oathmark-accord-authority', 'halloran-smelting-house', 'bruckner-field-services']) {
  const n = writes; assert(game.setReputationFromDevPanel(id, 2) === 'invalid' && writes === n, 'forged track rejected');
}
for (const value of [-1, 3.01, Infinity, NaN, '2', null, undefined]) {
  const n = writes; assert(game.setReputationFromDevPanel('steel-combine', value) === 'invalid' && writes === n, 'bad developer value rejected, not silently clamped');
}
equal(game.career, baseline, 'invalid edits mutate nothing');
fail = true;
const original = game.career, json = JSON.stringify(original), stored = storage.get(key), n = writes;
assert(game.setReputationFromDevPanel('steel-combine', 2.5) === 'save-failed', 'persistence failure reported');
assert(game.career === original && JSON.stringify(original) === json && writes === n && storage.get(key) === stored, 'failed save leaves active and durable state untouched');
fail = false;
beforeSave = () => assert(game.career === original && JSON.stringify(original) === json, 'save before publish');
assert(game.setReputationFromDevPanel('steel-combine', 2.5) === 'saved', 'failed edit can be retried');
beforeSave = undefined;
assert(writes === n + 1 && game.career !== original, 'retry commits exactly once');
assert(game.setReputationFromDevPanel('steel-combine', 2.5) === 'unchanged' && writes === n + 1, 'same-value edit does not save');
for (const track of REPUTATION_TRACKS) {
  for (const value of [reputationMaxLevel(track.id), 1.5, 0]) {
    const before = structuredClone(game.career), w = writes;
    assert(game.setReputationFromDevPanel(track.id, value) === 'saved', 'every track can be edited up, partially and down');
    equal(game.career, { ...before, reputations: { ...before.reputations, [track.id]: value } }, 'only requested standing changed');
    assert(writes === w + 1, 'one write per change');
    equal(loadCareerProfile().reputations, game.career.reputations, 'edited progress persists');
  }
}
equal(JSON.stringify([game.worldTime, game.phase, game.pendingMaintenanceSettlement, game.phaseCompletion]), clocksAndFlight, 'edits do not touch flight snapshots/clocks/scene/maintenance settlement');
for (const id of ['balor-advanced-materials', 'merren-conservatory'] as const) {
  const before = JSON.stringify(game.career), durable = storage.get(key), w = writes;
  for (const invalid of [2.0000000000000004, 2.5, 3]) assert(game.setReputationFromDevPanel(id, invalid) === 'invalid', 'cap enforced in Game, not only native form');
  assert(JSON.stringify(game.career) === before && storage.get(key) === durable && writes === w, 'over-cap edits change nothing');
  fail = true;
  assert(game.setReputationFromDevPanel(id, 1.5) === 'save-failed', 'new track edit failure reported');
  fail = false;
  assert(JSON.stringify(game.career) === before && storage.get(key) === durable && writes === w, 'new track failure atomic');
  assert(game.setReputationFromDevPanel(id, 1.5) === 'saved' && writes === w + 1, 'new track retry writes once');
}
// Mixed state: independently reveal and hide every track; never reveal unrelated zero standings.
for (const track of REPUTATION_TRACKS) for (const progress of [0, Number.MIN_VALUE, 0.001, 1, reputationMaxLevel(track.id), 0]) {
  game.career.reputations = { ...zero, [track.id]: progress };
  const rows = game.buildInteractiveScene({ id: 'careerStatus', selectedIndex: 0 }).bodyRows.filter((row: any) => row.bars);
  assert(rows.length === (progress > 0 ? 1 : 0), 'only positive track displayed');
  if (rows.length) assert(rows[0].label === track.name && rows[0].bars.length === reputationMaxLevel(track.id), 'correct mixed-state name and bar count');
}

for (const value of [0, Number.MIN_VALUE, 0.75, 1, 1.9999999999999998, 2, 2.5, 3, 0]) {
  game.career.reputations = Object.fromEntries(REPUTATION_TRACKS.map(t => [t.id, value]));
  const scene = game.buildInteractiveScene({ id: 'careerStatus', selectedIndex: 0 });
  const rows = scene.bodyRows.filter((row: any) => row.bars);
  const visible = REPUTATION_TRACKS.filter(() => value > 0);
  assert(rows.length === visible.length, 'every completely zero track is hidden; any positive partial level zero remains visible');
  assert(scene.bodyRows.some((r: any) => r.text === 'FACTION REPUTATION') === (value > 0), 'section heading shown only when at least one standing is positive');
  assert(!scene.bodyRows.some((r: any) => /Each full bar|Partial bars|FACTION RANKS/.test(r.text ?? '')), 'no explanatory text or old heading');
  for (const [index, track] of visible.entries()) {
    const s = reputationStanding(game.career.reputations, track.id);
    equal(rows[index], { kind: 'kv', label: track.name, value: s.title, bars: s.bars }, 'scene uses title without numeric suffix and retains fractional bars');
  }
}

// Desktop drawing: render the actual status at all scroll positions, including long titles.
const canvas = { width: 1024, height: 768 } as HTMLCanvasElement;
let text: string[] = [], fills: { color: string; x: number; y: number; w: number; h: number }[] = [];
const ctx = new Proxy<any>({
  font: '13px monospace', fillStyle: '',
  measureText(s: string) { return { width: Array.from(s).length * Number(this.font.match(/([\d.]+)px/)?.[1] ?? 13) * 0.62 }; },
  fillText(s: string) { text.push(s); },
  fillRect(x: number, y: number, w: number, h: number) { fills.push({ color: this.fillStyle, x, y, w, h }); },
}, { get: (t, k) => k in t ? t[k] : () => {} }) as CanvasRenderingContext2D;
for (const size of [[1024, 768], [1280, 800], [1920, 1080]]) {
  [canvas.width, canvas.height] = size;
  for (const value of [0, 1.5, 3]) {
    game.career.reputations = Object.fromEntries(REPUTATION_TRACKS.map(t => [t.id, value]));
    const scene = game.buildInteractiveScene({ id: 'careerStatus', selectedIndex: 0 });
    const limit = interactiveSceneBodyScrollLimit(ctx, canvas, scene);
    text = []; fills = [];
    for (let offset = 0; offset < limit + 180; offset += 180) drawInteractiveScene(ctx, canvas, scene, 0, offset);
    const drawn = text.join('').replace(/\s/g, '');
    for (const track of REPUTATION_TRACKS) {
      const found = drawn.includes(track.titles[Math.floor(Math.min(value, track.titles.length - 1))]!.replace(/\s/g, ''));
      assert(found === (value > 0), 'visible titles reachable; all completely zero reputations omitted');
    }
    assert(!text.some(t => /…|\.\.\./.test(t)), 'no truncated career labels');
    const bars = fills.filter(r => r.color === '#4ddcff');
    if (value === 0) assert(bars.length === 0, 'zero draws empty bars');
    else assert(bars.length > 0 && bars.every(r => r.w > 0 && r.w <= 30 && r.h === 11), 'bar fills bounded');
    if (value === 1.5) assert(bars.some(r => r.w === 15), 'half-filled bar is drawn at half width');
  }
}

// Same profile, low/high ranks: public offers, locks, travel and equipment terms unchanged.
game.career = { ...loaded, money: 1000000, reputations: { ...zero } };
const low = structuredClone(game.career), high = { ...structuredClone(low), reputations: Object.fromEntries(REPUTATION_TRACKS.map(t => [t.id, reputationMaxLevel(t.id)])) };
const offers = [...generateCareerContracts(low.locationId, 0), ...generatePassengerContracts(low.locationId, 0)];
for (const contract of offers) {
  const state = { id: 'contractPosting', selectedIndex: 0, contracts: [contract], contractIndex: 0 };
  game.career = low; const before = game.buildInteractiveScene(state);
  game.career = high; equal(game.buildInteractiveScene(state), before, 'standing does not gate offers or alter quotes');
}
equal([...emptyRunDestinationIds(low)], [...emptyRunDestinationIds(high)], 'no contact/discovery/private travel grants');
for (const shop of MAINTENANCE_SHOPS.filter(s => s.equipmentIds?.length)) equal(equipmentQuote(low.rig, shop, 'atmospheric-package'), equipmentQuote(high.rig, shop, 'atmospheric-package'), 'no equipment price/availability effects');
// Complete an actual ordinary contract: ranks survive settlement but never earn gains.
const contract = offers.find(c => c.category === 'freight')!;
game.career = high; game.activeCareerContract = contract; game.activeMissionQuote = contract.quote;
game.missionDvUsed = contract.quote.parDv; game.worldTime = 1000; game.pendingMaintenanceSettlement = null;
game.activeManifestCondition = { integrity: null, comfort: null }; game.loadStationTerminal = () => {}; game.logSuccessfulGeneratedRun = () => {};
const standingBefore = structuredClone(high.reputations);
game.finishCareerDelivery(); equal(game.career.reputations, standingBefore, 'delivery never grants reputation');
equal(loadCareerProfile().reputations, standingBefore, 'delivery save retains manual ranks');
const reset = resetCareerProfile(); equal(reset.reputations, zero, 'new career resets all twelve');
equal(loadCareerProfile().reputations, zero, 'reset persists');
console.log(`Reputation: ${checks} checks; twelve tracks, per-track caps, inherited levels, zero visibility, partial thresholds, safe legacy loads, atomic edits, desktop status bars and no gameplay effects.`);
