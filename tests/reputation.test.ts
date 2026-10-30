import { REPUTATION_TRACKS, isReputationId, normalizeReputations, normalizedReputation, reputationStanding } from '../src/reputation';
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

// Independent reviewed labels, transcribed from the naming review, not generated from runtime.
const reviewed = new Map(`House Alvares|Unpresented Stranger|Carrier by Ducal Warrant|Favoured Client of the Court|Intimate of the Ducal Household
House Mendes|Unproven Outsider|Provisioner to the Banners|Honoured Ally of the House|Companion of the Marshal’s Table
House Nunes|Unintroduced Stranger|Bearer of the Watch Warrant|Esteemed Friend of the Outer Watch|Keeper of the House’s Confidence
Steel Combine|Unaffiliated Worker|Registered Sympathizer|Honorary Citizen|Honorary Udarnik
Voss-Heinkel Metricwerke|Unrated Operator|Field-Proven Contractor|Factory-Warranted Carrier|Partner of the Works
Kisaragi|Unproven Hand|Proven Hand|Carrier of the Marque|Honoured Friend of the House
Covenant Remnants|Unsealed Stranger|Guest at the Gate|Friend of the Covenant|Unsealed Kindred
Daedalus Systems|Unknown Quantity|Known Quantity|Authorized Contractor|Authorized Partner
Cerberus Human Resources|Unverified Asset|Verified Asset|Trusted Instrument|Friend of the Board
Notoriety|No Name|Safe Pair of Hands|A Name Worth Trusting|One of Our Own`.split('\n').map(line => {
  const cells = line.split('|');
  return [cells[0], cells.slice(1)] as const;
}));
assert(REPUTATION_TRACKS.length === 10 && new Set(REPUTATION_TRACKS.map(t => t.id)).size === 10, 'exactly ten independent tracks');
for (const track of REPUTATION_TRACKS) {
  equal(track.titles, reviewed.get(track.name), `${track.name}: all four reviewed titles`);
  assert(isReputationId(track.id), `${track.id}: valid stable id`);
}
for (const id of ['teamsters-guild', 'GUILD', 'BFS', 'KIS-E', '__proto__', 'constructor', '', null, undefined, 2]) assert(!isReputationId(id), 'unknown/non-track ids rejected');

const zero = normalizeReputations(undefined);
assert(Object.keys(zero).length === 10 && Object.values(zero).every(v => v === 0), 'all ten start unknown');
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
    assert(standing.progress === value && standing.level === Math.floor(value), `${track.id}/${value}: exact progress, floor rank`);
    assert(standing.title === track.titles[Math.floor(value)], 'title belongs to current full-bar rank');
    assert(standing.bars.length === 3 && standing.bars.filter(v => v === 1).length === standing.level, 'exactly three sequential bars, no premature promotion');
    assert(Math.abs(standing.bars.reduce((a, b) => a + b, 0) - value) < 1e-14, 'bar fills preserve fractional progress');
  }
}

const legacy = defaultCareerProfile();
legacy.money = -123; legacy.worldTime = 456; legacy.certifications = [...TEAMSTER_CERTIFICATION_IDS]; legacy.knownContactIds = ['gideon-gid-bell'];
// Already settled to this clock: legacy load's normal passive Inquiry advance is not a rank effect.
legacy.nunesInquiries.updatedWorldTime = legacy.worldTime;
delete legacy.reputations;
storage.set(key, JSON.stringify(legacy));
const count = writes, loaded = loadCareerProfile();
equal(loaded.reputations, zero, 'legacy save gets ten zero ranks');
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

const game: any = Object.create(Game.prototype);
game.career = loaded; game.worldTime = 999;
game.phase = { kind: 'interactiveScene', scene: { id: 'careerStatus', selectedIndex: 0 } };
game.pendingMaintenanceSettlement = { resultingRig: structuredClone(loaded.rig), ledger: { marker: 'untouched' } };
game.phaseCompletion = { marker: 'untouched' };
const baseline = structuredClone(game.career);
const clocksAndFlight = JSON.stringify([game.worldTime, game.phase, game.pendingMaintenanceSettlement, game.phaseCompletion]);
for (const id of ['__proto__', 'constructor', 'teamsters-guild', 'KIS-E', 'bogus']) {
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
  for (const value of [3, 1.5, 0]) {
    const before = structuredClone(game.career), w = writes;
    assert(game.setReputationFromDevPanel(track.id, value) === 'saved', 'every track can be edited up, partially and down');
    equal(game.career, { ...before, reputations: { ...before.reputations, [track.id]: value } }, 'only requested standing changed');
    assert(writes === w + 1, 'one write per change');
    equal(loadCareerProfile().reputations, game.career.reputations, 'edited progress persists');
  }
}
equal(JSON.stringify([game.worldTime, game.phase, game.pendingMaintenanceSettlement, game.phaseCompletion]), clocksAndFlight, 'edits do not touch flight snapshots/clocks/scene/maintenance settlement');

for (const value of [0, 0.75, 1, 1.9999999999999998, 2, 2.5, 3]) {
  game.career.reputations = Object.fromEntries(REPUTATION_TRACKS.map(t => [t.id, value]));
  const scene = game.buildInteractiveScene({ id: 'careerStatus', selectedIndex: 0 });
  const rows = scene.bodyRows.filter((row: any) => row.bars);
  assert(rows.length === 10, 'career view includes all ten, no Guild reputation');
  for (const [index, track] of REPUTATION_TRACKS.entries()) {
    const s = reputationStanding(game.career.reputations, track.id);
    equal(rows[index], { kind: 'kv', label: track.name, value: `${s.title} (${s.level}/3)`, bars: s.bars }, 'scene uses actual rank title and fractional bar data');
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
    for (const track of REPUTATION_TRACKS) assert(drawn.includes(track.titles[Math.floor(value)].replace(/\s/g, '')), 'every full title is reachable, never ellipsized');
    assert(!text.some(t => /…|\.\.\./.test(t)), 'no truncated career labels');
    const bars = fills.filter(r => r.color === '#4ddcff');
    if (value === 0) assert(bars.length === 0, 'zero draws empty bars');
    else assert(bars.length > 0 && bars.every(r => r.w > 0 && r.w <= 30 && r.h === 11), 'bar fills bounded');
    if (value === 1.5) assert(bars.some(r => r.w === 15), 'half-filled bar is drawn at half width');
  }
}

// Same profile, low/high ranks: public offers, locks, travel and equipment terms unchanged.
game.career = { ...loaded, money: 1000000, reputations: { ...zero } };
const low = structuredClone(game.career), high = { ...structuredClone(low), reputations: Object.fromEntries(REPUTATION_TRACKS.map(t => [t.id, 3])) };
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
const reset = resetCareerProfile(); equal(reset.reputations, zero, 'new career resets all ten');
equal(loadCareerProfile().reputations, zero, 'reset persists');
console.log(`Reputation: ${checks} checks; ten reviewed tracks, partial thresholds, safe legacy loads, atomic edits, desktop status bars and no gameplay effects.`);
