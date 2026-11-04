import { defaultCareerProfile, TEAMSTER_CERTIFICATION_IDS } from '../src/career-state';
import { REPUTATION_TRACKS, normalizeReputations } from '../src/reputation';
import { contractWorkPolicy, HOUSE_IDS, isHouseId } from '../src/contract-work-policy';
import { contractReputationLockReasons, previewContractReputation, reputationProgressionPolicy, contractEarningTrack } from '../src/contract-reputation';
import { contractIncomeMinimum, calibrateNewContractQuote } from '../src/contract-income';
import { createDefaultRigState } from '../src/maintenance/rig-state';
import { Game } from '../src/game';
import { contractGateCoverage, coveredIncomeMinimum, sampleAllBoards, sampleContactOffers } from './audit-contract-gate-coverage';
import { projectHouseReviewEvent } from './audit-house-reputation';
import { projectKisaragiReviewEvent } from './audit-kisaragi-reputation';
import { projectCovenantReviewEvent } from './audit-covenant-reputation';
import { projectRemainingReviewEvent } from './audit-remaining-reputation';
import type { ContractIdentity } from '../src/contract-work';
import type { CareerContract } from '../src/career-contracts';
let checks = 0;
function assert(value: unknown, message: string): asserts value { checks++; if (!value) throw Error(message); }
function equal(a: unknown, b: unknown, message: string) { assert(JSON.stringify(a) === JSON.stringify(b), message); }
const zero = defaultCareerProfile();
const rows = sampleAllBoards(0, 4), offers = rows.map(r => r.contract);
assert(new Set(offers.map(c => c.factionId)).size === 34, 'all 34 public providers in actual boards');
const allTwo = { reputations: Object.fromEntries(REPUTATION_TRACKS.map(t => [t.id, 2])) as ReturnType<typeof normalizeReputations> };
for (const c of offers) {
  const before = JSON.stringify(c), oracle = contractGateCoverage(c), policy = contractWorkPolicy(c);
  assert(policy && policy.trust === oracle.trust && policy.importantNet === oracle.importantNet, 'production class matches independently retained review');
  const minimum = coveredIncomeMinimum(oracle, c.quote.expectedMargin);
  assert(contractIncomeMinimum(c) === minimum, 'live quoted-income AND authored-trust minimum');
  assert(contractReputationLockReasons(zero, c).length === (minimum > 0 ? 1 : 0), 'no paid pool bypass at zero');
  assert(contractReputationLockReasons(allTwo, c).length === 0, 'ordinary work never requires rank 3');
  if (policy.importantNet !== undefined) assert(c.quote.expectedMargin === policy.importantNet, 'important low-net price live');
  if (c.nunesInquiry) assert(minimum === 1 && c.quote.pay.flatReward === 20000 && c.quote.pay.generosity === .25, 'Inquiry stays original price with trust 1');
  equal(calibrateNewContractQuote(c, c.quote), c.quote, 'new-quote transform idempotent');
  assert(JSON.stringify(c) === before, 'inspection does not mutate quoted terms');
}
const identities: ContractIdentity[] = [...new Map(offers.map(c => [`${c.factionId}/${c.templateId}`, c])).values()];
// Review arithmetic is an independent oracle, not imported by production.
for (const c of identities) for (const score of [0, .99, 1, 1.25, 1.5, 1.9999999999999998, 2, 2.5]) {
  const profile = defaultCareerProfile();
  for (const t of REPUTATION_TRACKS) { profile.reputations![t.id] = Math.min(score, t.titles.length - 1); profile.reputationUnrelatedContracts![t.id] = 10; }
  const frozen = JSON.stringify(profile), next = previewContractReputation(profile, c);
  const hs = Object.fromEntries(HOUSE_IDS.map(id => [id, score])) as Record<typeof HOUSE_IDS[number], number>;
  const hc = Object.fromEntries(HOUSE_IDS.map(id => [id, 10])) as typeof hs;
  const houses = projectHouseReviewEvent(hs, hc, c);
  for (const id of HOUSE_IDS) {
    assert(next.reputations[id] === houses.scores[id] && next.reputationUnrelatedContracts[id] === houses.unrelated[id], 'simultaneous House credit/rivalry/counters match oracle');
  }
  for (const [id, oracle] of [['kisaragi', projectKisaragiReviewEvent(score, 10, c)], ['covenant-remnants', projectCovenantReviewEvent(score, 10, c)]] as const) {
    assert(next.reputations[id] === oracle.score && next.reputationUnrelatedContracts[id] === oracle.unrelated, `${id} arithmetic matches approved pacing`);
  }
  for (const id of ['daedalus-systems', 'balor-advanced-materials', 'merren-conservatory', 'estella-institutions'] as const) {
    const before = profile.reputations![id], oracle = projectRemainingReviewEvent(id, before, 10, c);
    assert(next.reputations[id] === oracle.score && next.reputationUnrelatedContracts[id] === oracle.unrelated, 'own/shared/inherited attribution and decay');
  }
  assert(next.reputations['smuggler-notoriety'] === profile.reputations!['smuggler-notoriety'], 'no invented Notoriety effects');
  assert(JSON.stringify(profile) === frozen, 'preview cannot publish mutable career state');
}
for (const c of sampleContactOffers().offers) assert(contractReputationLockReasons(zero, c).length === 0, 'bootstrap/contact transport never needs paid-job recognition');
for (const p of ['unknown', '__proto__', 'constructor', 'estella-government']) for (const templateId of ['constructor:x', '__proto__:x', 'name:O']) {
  assert(contractReputationLockReasons(zero, { factionId: p, templateId }).length === 1, 'unknown/prototype-shaped paid identities fail closed without crashing');
}
for (const c of offers.filter(c => isHouseId(c.factionId)).slice(0, 50)) {
  const rival = HOUSE_IDS.find(id => id !== c.factionId)!;
  assert(contractReputationLockReasons({ reputations: { ...allTwo.reputations, [rival]: 3 } }, c)[0]?.includes('refuses'), 'current House-3 affiliation refuses only new rival employment');
}
const institution = offers.find(c => c.factionId === 'estella-government' && contractIncomeMinimum(c) === 0)!;
assert(institution, 'institutional entry exists');
let progression = defaultCareerProfile();
for (const p of ['estella-government', 'estella-defence-force']) {
  const job = offers.find(c => c.factionId === p && contractIncomeMinimum(c) === 0)!;
  const next = previewContractReputation(progression, job); progression.reputations = next.reputations; progression.reputationUnrelatedContracts = next.reputationUnrelatedContracts;
}
assert(progression.reputations!['estella-institutions'] === 1, 'GOV and EDF introductions count toward one bar');
const eipImportant = offers.find(c => c.factionId === 'estella-institute-of-planetology' && contractWorkPolicy(c)?.advancedGain)!;
for (let i = 0; i < 15; i++) {
  const next = previewContractReputation(progression, eipImportant); progression.reputations = next.reputations; progression.reputationUnrelatedContracts = next.reputationUnrelatedContracts;
}
assert(progression.reputations!['estella-institutions'] === 2, 'fifteen important shared-track completions reach 2 exactly');
for (const c of offers.filter(c => !contractEarningTrack(c))) {
  const profile = defaultCareerProfile();
  for (const t of REPUTATION_TRACKS) { profile.reputations![t.id] = 1.5; profile.reputationUnrelatedContracts![t.id] = reputationProgressionPolicy(t.id).grace; }
  const next = previewContractReputation(profile, c);
  for (const t of REPUTATION_TRACKS.filter(t => t.id !== 'smuggler-notoriety')) assert(next.reputations[t.id] < 1.5, 'recognition recipients neither reward nor refresh a donor');
}
// Actual Game acceptance and atomic settlement on synthetic profiles, including old quotes.
let fail = false; const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => { if (fail) throw Error('synthetic failed save'); storage.set(k, v); },
} });
const probes = [...new Map(offers.filter(c => contractIncomeMinimum(c)! > 0).map(c => [c.factionId!, c])).values()];
probes.push(...offers.filter(c => c.nunesInquiry).slice(0, 1));
for (const offered of probes) for (const legacy of [false, true]) {
  const c: CareerContract = structuredClone(offered);
  if (legacy) { c.quote.pay.flatReward += 123456; c.quote.grossPay += 123456; c.quote.expectedMargin += 123456; }
  const game: any = Object.create(Game.prototype); game.canvas = { width: 1360, height: 940 };
  game.career = defaultCareerProfile(); game.career.rig = createDefaultRigState(true); game.career.certifications = [...TEAMSTER_CERTIFICATION_IDS];
  game.career.money = 1e7; game.career.locationId = c.sourceId; game.loadStationTerminal = () => {}; game.launchPlayableEstellaMission = () => {};
  game.worldTime = game.career.worldTime; let logs = 0; game.logSuccessfulGeneratedRun = () => { logs++; };
  const state = { id: 'contractPosting', selectedIndex: 0, contracts: [c], contractIndex: 0 };
  game.activateInteractiveSceneOption(state, 'acceptContract');
  assert(!game.activeCareerContract, 'acceptance handler rechecks standing, not just UI lock');
  game.career.reputations = { ...allTwo.reputations };
  game.activateInteractiveSceneOption(state, 'acceptContract');
  assert(game.activeCareerContract === c && game.activeMissionQuote === c.quote, 'accepted quote retained exactly');
  // An existing booking remains payable despite later affiliation/standing changes.
  for (const t of REPUTATION_TRACKS) game.career.reputations[t.id] = 1.5;
  game.career.reputations['house-mendes'] = 3;
  const before = JSON.stringify(game.career), quoted = JSON.stringify(c), next = previewContractReputation(game.career, c);
  game.missionDvUsed = c.quote.parDv; game.worldTime += 10; game.pendingMaintenanceSettlement = null;
  game.activeManifestCondition = { integrity: null, comfort: null };
  fail = true; let threw = false; try { game.finishCareerDelivery(); } catch { threw = true; }
  assert(threw && JSON.stringify(game.career) === before && game.activeCareerContract === c && logs === 0, 'failed save publishes no money, rivalry, counters, Inquiry or booking mutation');
  fail = false; game.finishCareerDelivery();
  equal(game.career.reputations, next.reputations, 'successful save atomically publishes every standing');
  equal(game.career.reputationUnrelatedContracts, next.reputationUnrelatedContracts, 'successful save atomically publishes every counter');
  assert(game.career.money === 1e7 + c.quote.expectedMargin && Number(logs) === 1, 'exact original par payment and one completion log');
  equal(JSON.stringify(c), quoted, 'legacy/new accepted quote never rewritten');
  const settled = JSON.stringify(game.career); game.finishCareerDelivery();
  assert(JSON.stringify(game.career) === settled && Number(logs) === 1, 'stale settlement callback cannot double credit/decay/history');
}
console.log(`Reputation rollout: ${checks} checks, ${offers.length} actual postings, ${identities.length} identities, ${probes.length * 2} constructed Game atomic/legacy settlements.`);
