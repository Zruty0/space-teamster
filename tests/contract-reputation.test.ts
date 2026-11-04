import { combineContractClass, contractReputationLockReasons, contractReputationNotices, contractReputationNotice, previewContractReputation } from '../src/contract-reputation';
import { normalizeReputations, normalizeReputationUnrelatedContracts, REPUTATION_TRACKS } from '../src/reputation';
import { defaultCareerProfile, loadCareerProfile, saveCareerProfile, TEAMSTER_CERTIFICATION_IDS, type CareerProfile } from '../src/career-state';
import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { STEEL_COMBINE_PROVIDER } from '../src/content/estella/faction-contracts/steel-combine-contracts';
import { ESTELLA_NODES } from '../src/content/estella';
import { createDefaultRigState } from '../src/maintenance/rig-state';
import { createMaintenanceTelemetry } from '../src/maintenance/telemetry';
import { resolveMaintenanceSettlement } from '../src/maintenance/strike-resolution';
import { Game } from '../src/game';

export let checks = 0;
function assert(value: unknown, message: string): asserts value { checks++; if (!value) throw Error(message); }
function equal(a: unknown, b: unknown, message: string) { assert(JSON.stringify(a) === JSON.stringify(b), message); }
const STEEL = 'steel-combine', CHR = 'cerberus-human-resources';
const basic = { factionId: STEEL, templateId: 'hammer-to-gornilo:smelter-feedstock' };
const elevated = { factionId: STEEL, templateId: 'hammer-to-veles:blasting-charges' };
const important = { factionId: STEEL, templateId: 'import-serai:bulk-industrial-chemicals' };
const exporting = { factionId: STEEL, templateId: 'export-svarog:hull-plate-stock' };
const rival = { factionId: CHR, templateId: 'custody-transfer-to-olympos' };
const manifests = { factionId: CHR, templateId: 'local-workforce-manifests' };
const unrelated = { factionId: CHR, templateId: 'medicine-to-olympos' };
export function profile(value = 0): CareerProfile {
  return { ...defaultCareerProfile(), certifications: [...TEAMSTER_CERTIFICATION_IDS], rig: createDefaultRigState(true),
    reputations: { ...normalizeReputations(undefined), [STEEL]: value } };
}
function complete(career: CareerProfile, contract = basic): CareerProfile {
  const { reputations, reputationUnrelatedContracts } = previewContractReputation(career, contract);
  return { ...career, reputations, reputationUnrelatedContracts };
}
function score(career: CareerProfile) { return career.reputations![STEEL]; }

// Stable families, including every partner programme; display labels and ownership never decide effects.
for (const [templateId, expected] of [
  [basic.templateId, 'basic-routine'], [elevated.templateId, 'elevated-routine'],
  ['hammer-to-veles:mining-supplies', 'basic-routine'], ['hammer-to-veles:replacement-cutting-heads', 'elevated-routine'],
  ['hammer-to-perun:billet-stock', 'basic-routine'], ['hammer-to-perun:machine-tool-stock', 'elevated-routine'],
  ['perun-to-hammer:prefabricated-structural-modules', 'basic-routine'], ['perun-to-hammer:machine-tools', 'elevated-routine'],
  ['anvil-to-surface:shift-rotations', 'basic-routine'], ['anvil-to-surface:tooling-and-spares', 'elevated-routine'],
  ['surface-to-anvil:spent-tooling-returns', 'basic-routine'], [important.templateId, 'important'], [exporting.templateId, 'export'],
  ['import-glitterfield:cobalt-ingots', 'important'], ['import-new-canaan:regolith-aggregate', 'important'],
  ['kalyna-work-pilgrimage:return:x->y', 'important'],
  ['balor-trade:ore-purchase:hammer:refractory ore', 'important'], ['balor-trade:brick-purchase:hammer:refractory brick', 'important'],
  ['balor-trade:foundry-machine-tools:hammer:machine tools', 'export'], ['balor-trade:extraction-chassis:hammer:heavy vehicle chassis', 'export'],
  ['dahai:deep-alloy-stock:site:hammer:in', 'export'], ['sahra:waterworks-pipe:hammer:site:out', 'export'],
  ['camps:morana-crews:anvil:morana:return', 'basic-routine'], ['camps:morana-station-stores:hammer:morana:out', 'basic-routine'],
  ['camps:morana-instruments:anvil:morana:out', 'elevated-routine'], ['camps:mokosh-farm-spares:hammer:mokosh:out', 'elevated-routine'],
] as const) assert(combineContractClass({ factionId: STEEL, templateId }) === expected, `class: ${templateId}`);
for (const factionId of [CHR, 'merren-conservatory', 'svarog-yard-company', undefined]) {
  assert(combineContractClass({ ...important, factionId }) === undefined, 'another issuer cannot borrow Combine mission identity');
}
assert(combineContractClass({ factionId: STEEL, templateId: 'unreviewed-new-programme' }) === undefined, 'unknown family not inferred from text');
const classes = new Set<string>(); let candidates = 0;
for (let day = 0; day < 16; day++) for (const node of ESTELLA_NODES) {
  for (const candidate of STEEL_COMBINE_PROVIDER.generateContracts({ sourceId: node.id, worldTime: day * 86400 })) {
    const json = JSON.stringify(candidate), kind = combineContractClass(candidate);
    assert(kind !== undefined, `all generated Combine families authored: ${candidate.templateId}`);
    classes.add(kind); candidates++;
    equal(candidate.generosity, kind === 'export' ? 0.15 : 0, 'original fees preserved');
    assert(candidate.compensationRatio === 1 && candidate.maxCompAllowance === 2 && !candidate.flatReward, 'original compensation, no new bounty');
    const rank = kind === 'export' ? 2 : kind === 'basic-routine' ? 0 : 1;
    for (const value of [0, 0.9999999999999999, 1, 1.9999999999999998, 2, 2.9, 3]) {
      equal(contractReputationLockReasons(profile(value), candidate).length, value < rank ? 1 : 0, 'gate uses completed bars only');
    }
    equal(JSON.stringify(candidate), json, 'classification cannot change generators, seed IDs, money or cargo');
  }
}
assert(classes.size === 4 && candidates > 500, 'all four classes generated across sixteen days');
let career = profile();
career = complete(career); assert(score(career) === 0.5, 'first job gives half a bar');
for (let i = 0; i < 40; i++) career = complete(career, unrelated);
assert(score(career) === 0.5, 'no early pace pressure');
career = complete(career); assert(score(career) === 1, 'second job earns level 1');
career = complete(career, elevated); assert(score(career) === 1, 'newly unlocked routine work does not advance 1→2');
for (let i = 1; i <= 15; i++) {
  career = complete(career, important);
  assert(score(career) === (30 + 2 * i) / 30, `important job ${i}: exact authored grid`);
  if (i < 15) assert(score(career) < 2, 'never promote early');
  saveRoundTrip(career);
}
assert(score(career) === 2, 'fifteen jobs, not sixteen, earn level 2');
for (const job of [basic, elevated, important, exporting]) for (let i = 0; i < 30; i++) career = complete(career, job);
assert(score(career) === 2, 'no ordinary job earns third bar');
assert(score(complete(profile(0.9), important)) === 1, 'first-band award never spills into next band');
assert(score(complete(profile(1.99), important)) === 2, 'second-band award never spills into quest band');
for (const value of [0.9999999999999999, 1.9999999999999998, 2.9999999999999996]) {
  const before = profile(value);
  assert(score(complete(before, unrelated)) === value, 'no broad near-integer rounding during grace');
  equal(contractReputationLockReasons(before, exporting).length, value < 2 ? 1 : 0, 'no broad rounding in gate');
}
career = profile(1.9);
for (let i = 1; i <= 5; i++) { career = complete(career, unrelated); assert(score(career) === 1.9, 'five unrelated jobs are grace'); }
career = complete(career, unrelated); assert(score(career) === 56 / 30, 'sixth unrelated job loses 1/30');
career = complete(career, elevated); assert(career.reputationUnrelatedContracts![STEEL] === 0 && score(career) === 56 / 30, 'routine maintenance resets grace without gain');
for (let i = 0; i < 100; i++) career = complete(career, unrelated);
assert(score(career) === 1, 'passive decay protects current integer floor');
for (const value of [1, 2, 3]) {
  let p = profile(value); for (let i = 0; i < 15; i++) p = complete(p, unrelated);
  assert(score(p) === value, 'exact earned levels are immune to neglect');
}
for (const value of [0, 0.5, 1, 1.05, 1.9, 2, 2.9, 3]) {
  const p = profile(value); p.reputationUnrelatedContracts = { [STEEL]: 8 };
  const r = complete(p, rival), m = complete(p, manifests);
  assert(Math.abs(score(r) - Math.min(value, Math.max(1, value - 0.2))) < 1e-14, 'custody loss crosses integer boundaries but protects 1, no double decay');
  assert(Math.abs(score(m) - Math.min(value, Math.max(1, value - 0.1))) < 1e-14, 'manifests loss, no promotion to 1');
  assert(r.reputationUnrelatedContracts![STEEL] === (value < 1 ? 0 : 9), 'rival completion consumes grace');
}
for (const templateId of ['surface-labor-allocation', 'local-custody-processing', 'local-surface-labor-processing']) {
  assert(score(complete(profile(2), { factionId: CHR, templateId })) === 1.8, 'explicit coercion class loses 0.2');
}
for (const templateId of ['workforce-transfer-to-hub', 'rare-metals-to-foundry', 'mining-cutters-to-pandemonium', 'shareholder-packets-to-finance', 'executive-delegation']) {
  assert(score(complete(profile(2), { factionId: CHR, templateId })) === 2, 'no invented penalty for ordinary, premium or ambiguous CHR work');
}
career = profile(2.8); career.reputationUnrelatedContracts = { [STEEL]: 8 };
for (const exempt of [{ ...basic, category: 'empty' as const }, { ...unrelated, travelMode: 'old-nell' as const }]) {
  const preview = previewContractReputation(career, exempt);
  equal(preview.reputations, career.reputations, 'empty travel/personal passage awards nothing');
  equal(preview.reputationUnrelatedContracts, career.reputationUnrelatedContracts, 'empty travel/personal passage consumes no grace');
  assert(preview.effects.length === 0, 'empty travel produces no notice');
}
career.reputations![CHR] = 3;
for (const job of [basic, elevated, important, exporting]) assert(contractReputationLockReasons(career, job)[0]?.includes('refuses'), 'CHR 3 overrides sufficient Combine level for every class');
const trustedChr = profile(3); trustedChr.reputations![CHR] = 1;
assert(contractReputationLockReasons(trustedChr, rival).length === 0, 'Combine 3 causes no reciprocal CHR refusal; authored trust still applies');
assert(score(complete(career, basic)) === 2.8, 'previously accepted Combine work can still settle after affiliation change');

// All eleven unauthored tracks/counters are untouched by Combine/CHR mechanics.
career = profile(1.5);
for (const track of REPUTATION_TRACKS) if (track.id !== STEEL && track.id !== CHR) {
  career.reputations![track.id] = 0.75; career.reputationUnrelatedContracts![track.id] = 4;
}
for (const job of [basic, important, rival, unrelated]) {
  const before = JSON.stringify(career), next = complete(career, job);
  for (const track of REPUTATION_TRACKS) if (track.id !== STEEL && track.id !== CHR) {
    assert(next.reputations![track.id] === 0.75 && next.reputationUnrelatedContracts![track.id] === (track.id === 'smuggler-notoriety' ? 4 : 5), 'no donor credit or below-1 decay; newly authored tracks consume unrelated slots');
  }
  equal(JSON.stringify(career), before, 'pure preview cannot mutate profile');
}
for (const value of [undefined, null, [], '3', { [STEEL]: -1 }, { [STEEL]: 0.1 }, { [STEEL]: Infinity }, { [STEEL]: '5' }, Object.create({ [STEEL]: 4 })]) {
  equal(normalizeReputationUnrelatedContracts(value), {}, 'malformed/missing/inherited counters mean full grace');
}
equal(normalizeReputationUnrelatedContracts({ [STEEL]: 5, fake: 8 }), { [STEEL]: 5 }, 'unknown counter keys ignored');

// Neutral copy: actual effects only, floors/caps respected, no faction-specific voice.
assert(contractReputationNotices(profile(0), basic)[0]?.text === 'Completing this contract will improve your reputation with Steel Combine.', 'advancement copy');
assert(contractReputationNotices(profile(1.5), elevated)[0]?.text === 'This is routine work for Steel Combine. Completing it will maintain your reputation with them.', 'maintenance copy');
assert(contractReputationNotices(profile(1.5), rival)[0]?.text === 'Steel Combine disapproves of this contract. Completing it will reduce your reputation with them.', 'rivalry copy');
for (const value of [0, 0.5, 1]) assert(!contractReputationNotices(profile(value), rival).some(n => n.text.includes('reduce your reputation')), 'no false reduction below rival floor; CHR may gain');
for (const value of [1, 2, 3]) assert(contractReputationNotices(profile(value), basic).length === 0, 'no false maintenance at protected integer');
assert(contractReputationNotices(profile(1.5), important).length === 1 && contractReputationNotices(profile(1.5), important)[0].tone === 'success', 'gain replaces redundant maintenance');
for (const track of REPUTATION_TRACKS) {
  const text = contractReputationNotice({ faction: track.id, kind: 'advance', before: 0, after: 0.5 });
  assert(text === `Completing this contract will improve your reputation with ${track.name}.`, 'same template for every faction');
}
const decaying = profile(1.5); decaying.reputationUnrelatedContracts = { [STEEL]: 5 };
assert(previewContractReputation(decaying, unrelated).effects[0].kind === 'decay' && !contractReputationNotices(decaying, unrelated).some(n => n.text.includes('disapproves')), 'passive decay is not disapproval; own CHR advancement remains visible');

// Synthetic persistence: no live-save reads/writes, no eager migration or historical inference.
const storage = new Map<string, string>(); const key = 'space-teamster.career.v1';
let writes = 0, fail = false, beforeSave: (() => void) | undefined;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => { if (k === key) { beforeSave?.(); if (fail) throw Error('synthetic save failure'); writes++; } storage.set(k, v); },
} });
function saveRoundTrip(p: CareerProfile) {
  // Pure JSON roundtrip during arithmetic checks, before installing storage.
  equal(JSON.parse(JSON.stringify(p)).reputations, p.reputations, 'arithmetic survives JSON serialization');
}
const legacy = profile(1.75); delete legacy.reputationUnrelatedContracts;
storage.set(key, JSON.stringify(legacy)); const oldWrites = writes;
let loaded = loadCareerProfile(); equal(loaded.reputationUnrelatedContracts, {}, 'old profile starts with full grace');
assert(score(loaded) === 1.75 && writes === oldWrites, 'no historical credit or eager save');
loaded.reputationUnrelatedContracts = { [STEEL]: 5 }; saveCareerProfile(loaded);
assert(loadCareerProfile().reputationUnrelatedContracts![STEEL] === 5, 'counter persists in existing career key');

// Real Game scene/handler/settlement, with equipment and licenses satisfied.
export const offers = Array.from({ length: 8 }, (_, day) => [
  ...generateCareerContracts('estella-vi-heavy-cargo-station', day * 86400),
  ...generateCareerContracts('caravanserai-main-commercial-dock', day * 86400),
  ...generatePassengerContracts('estella-vi-main-transit-dispatch', day * 86400),
]).flat();
const combineOffers = offers.filter(c => c.factionId === STEEL);
assert(combineOffers.some(c => combineContractClass(c) === 'basic-routine') && combineOffers.some(c => combineContractClass(c) === 'export'), 'public Hammer boards retain entry work and visible locked exports across ordinary days');
export function postingWith(identity: typeof basic): CareerContract {
  const base = combineOffers[0];
  return { ...base, ...identity, id: `synthetic:${identity.factionId}:${identity.templateId}`, category: 'freight' };
}
const game: any = Object.create(Game.prototype);
game.career = profile(); game.canvas = { width: 1360, height: 940 };
let launches = 0, logs = 0;
game.launchPlayableEstellaMission = () => { launches++; };
game.logSuccessfulGeneratedRun = () => { logs++; };
game.loadStationTerminal = () => {}; // settlement must consume its booking even if cleanup is a no-op
const exportContract = postingWith(exporting);
const state = { id: 'contractPosting', selectedIndex: 0, contracts: [exportContract], contractIndex: 0 };
let scene = game.buildInteractiveScene(state);
assert(scene.options[0].disabled && scene.options[0].detail.includes('level 2'), 'actual acceptance screen explains minimum');
game.activateInteractiveSceneOption(state, 'acceptContract'); assert(launches === 0 && !game.activeCareerContract, 'action cannot bypass cached locked posting');
game.career = profile(2); scene = game.buildInteractiveScene(state); assert(!scene.options[0].disabled, 'same cached posting unlocks at exact threshold');
game.activateInteractiveSceneOption(state, 'acceptContract'); assert(Number(launches) === 1, 'unlocked booking launches');
game.career.reputations[CHR] = 3; scene = game.buildInteractiveScene(state);
assert(scene.options[0].disabled && scene.options[0].detail.includes('refuses'), 'refusal shown separately from minimum standing');
game.activateInteractiveSceneOption(state, 'acceptContract'); assert(Number(launches) === 1, 'action checks current refusal, not cached board eligibility');
for (const [value, identity, needle] of [[0, basic, 'improve'], [1.5, elevated, 'maintain'], [1.5, rival, 'disapproves']] as const) {
  game.career = profile(value);
  if (identity.factionId === CHR) game.career.reputations[CHR] = 1;
  const actual = game.buildInteractiveScene({ ...state, contracts: [postingWith(identity)] });
  assert(actual.bodyRows.some((r: any) => r.kind === 'text' && r.text.includes(needle)), 'real posting integrates computer notice');
}

// Save failure preserves all state (including certs, Inquiry, pending wear and effects); retry commits once.
for (const [value, identity] of [[0, basic], [1.5, important], [1.5, rival], [1.5, unrelated]] as const) {
  const contract = postingWith(identity);
  contract.certificationOnSuccess = 'line';
  game.career = profile(value); game.career.certifications = [];
  game.career.reputationUnrelatedContracts = { [STEEL]: 5 };
  const inquiry = game.career.nunesInquiries.active[0];
  contract.nunesInquiry = { instanceId: inquiry.instanceId, contribution: 1 };
  game.activeCareerContract = contract; game.activeMissionQuote = contract.quote;
  game.activeManifestCondition = { integrity: null, comfort: null }; game.missionDvUsed = contract.quote.parDv;
  game.worldTime = 10;
  game.pendingMaintenanceSettlement = resolveMaintenanceSettlement(createMaintenanceTelemetry(), {
    missionId: contract.id, title: contract.title, manifestKind: 'freight', manifestMassTons: 1, attempt: 1, startWorldTime: 0,
  }, game.career.rig, game.worldTime);
  const pending = game.pendingMaintenanceSettlement;
  saveCareerProfile(game.career);
  const original = game.career, originalJson = JSON.stringify(original), durable = storage.get(key), count = writes, logCount = logs;
  const expected = previewContractReputation(original, contract);
  fail = true; let failed = false;
  try { game.finishCareerDelivery(); } catch { failed = true; }
  assert(failed && game.career === original && JSON.stringify(original) === originalJson, 'failed settlement does not mutate any live career field');
  assert(storage.get(key) === durable && writes === count && logs === logCount && game.activeCareerContract === contract
    && game.pendingMaintenanceSettlement === pending, 'failure leaves durable state/history/booking/pending wear unchanged');
  fail = false; beforeSave = () => equal(JSON.stringify(game.career), originalJson, 'save precedes publishing all rewards');
  game.finishCareerDelivery(); beforeSave = undefined;
  equal(game.career.reputations, expected.reputations, 'preview and settlement agree');
  equal(game.career.reputationUnrelatedContracts, expected.reputationUnrelatedContracts, 'preview and counter settlement agree');
  assert(game.career.rig.completedMaintenanceMissions === original.rig.completedMaintenanceMissions + 1
    && game.pendingMaintenanceSettlement === null, 'wear commits with progress, once');
  assert(game.career.certifications.includes('line') && game.career.nunesInquiries.active[0].progress > original.nunesInquiries.active[0].progress, 'certification/Inquiry committed alongside reward');
  assert(logs === logCount + 1 && writes === count + 1 && !game.activeCareerContract, 'retry logs/saves/consumes exactly once');
  const settled = JSON.stringify(game.career); game.finishCareerDelivery(); equal(JSON.stringify(game.career), settled, 'duplicate finish is no-op');
  assert(writes === count + 1 && logs === logCount + 1, 'duplicate finish adds no history or save');
}
// Actual completion overlay restores on failed persistence, guards stale callbacks and logs only after save.
game.career = profile(1); game.activeCareerContract = postingWith(important); game.activeMissionQuote = game.activeCareerContract.quote;
game.activeMaintenanceContext = null; game.pendingMaintenanceSettlement = null;
game.activeManifestCondition = { integrity: null, comfort: null }; game.missionDvUsed = 0;
game.phaseDvUsed = () => 0; game.showGuidance = (text: string) => { game.lastGuidance = text; };
let retries = 0; game.reloadPhase = () => { retries++; };
const phase = { missionDvStart: 0 };
game.completePhase(phase, () => game.finishRunTransition().run(), 'Synthetic completion.');
const overlay = game.phaseCompletion, prior = game.career, priorLogs = logs, priorWrites = writes;
fail = true; overlay.onContinue();
assert(game.phaseCompletion === overlay && game.career === prior && logs === priorLogs && writes === priorWrites, 'failed save restores completion screen and makes no duplicate flight log');
assert(game.lastGuidance === 'Contract completion could not be saved. Please try again.', 'failed save explained');
fail = false; overlay.onContinue();
assert(score(game.career) === 32 / 30 && logs === priorLogs + 1 && writes === priorWrites + 1, 'overlay retry commits once');
overlay.onContinue();
const pendingSentinel = {}; game.pendingMaintenanceSettlement = pendingSentinel;
overlay.onRetry();
assert(logs === priorLogs + 1 && writes === priorWrites + 1 && retries === 0 && game.pendingMaintenanceSettlement === pendingSentinel, 'stale continue/retry callbacks cannot settle, reset wear or resurrect a mission');
console.log(`Contract reputation: ${checks} checks; ${candidates} Combine candidates; gates, progression, decay, directed rivalry, notices and atomic settlement.`);
