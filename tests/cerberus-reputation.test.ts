import { cerberusContractClass, CERBERUS_IMPORTANT_TEMPLATES } from '../src/contract-work';
import { contractReputationLockReasons, contractReputationNotices, previewContractReputation } from '../src/contract-reputation';
import { calibrateNewContractQuote, contractIncomeMinimum, incomeCalibrationKind, CONTRACT_INCOME_TARGETS } from '../src/contract-income';
import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { defaultCareerProfile, loadCareerProfile, saveCareerProfile, TEAMSTER_CERTIFICATION_IDS, type CareerProfile } from '../src/career-state';
import { createDefaultRigState } from '../src/maintenance/rig-state';
import { normalizeReputations, REPUTATION_TRACKS } from '../src/reputation';
import { employerReputationLevel } from '../src/employer-reputation';
import { contractGrossPay, estimateEstellaMissionCost, makePayTerms } from '../src/mission-cost';
import { Game } from '../src/game';

const CHR = 'cerberus-human-resources', STEEL = 'steel-combine';
export let checks = 0;
function assert(value: unknown, message: string): asserts value { checks++; if (!value) throw Error(message); }
function equal(a: unknown, b: unknown, message: string) {
  const json = (v: unknown) => JSON.stringify(v, (_key, value) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value);
  assert(json(a) === json(b), message);
}
export function chrProfile(chr = 0, steel = 0): CareerProfile {
  return { ...defaultCareerProfile(), money: 1000000, certifications: [...TEAMSTER_CERTIFICATION_IDS], rig: createDefaultRigState(true),
    reputations: { ...normalizeReputations(undefined), [CHR]: chr, [STEEL]: steel } };
}
const routine = { factionId: CHR, templateId: 'oxygen-industrial-bottles' };
const records = { factionId: CHR, templateId: 'local-audit-records' };
const custody = { factionId: CHR, templateId: 'custody-transfer-to-olympos' };
const workforce = { factionId: CHR, templateId: 'workforce-transfer-to-hub' };
const combine = { factionId: STEEL, templateId: 'hammer-to-gornilo:smelter-feedstock' };
function complete(career: CareerProfile, contract = routine): CareerProfile {
  const { reputations, reputationUnrelatedContracts } = previewContractReputation(career, contract);
  return { ...career, reputations, reputationUnrelatedContracts };
}
const score = (c: CareerProfile) => c.reputations![CHR];
for (const templateId of CERBERUS_IMPORTANT_TEMPLATES) {
  assert(cerberusContractClass({ factionId: CHR, templateId }) === 'important', 'explicit important family');
  assert(cerberusContractClass({ factionId: 'merren-conservatory', templateId }) === undefined, 'no borrowed importance from another issuer');
  const p = chrProfile(1); assert(score(complete(p, { factionId: CHR, templateId })) === 32 / 30, 'every important family advances one fifteenth');
}
for (const templateId of ['executive-delegation', 'shareholder-packets-to-finance', 'legal-archives-to-capital']) {
  assert(cerberusContractClass({ factionId: CHR, templateId }) === 'entrusted-commercial', 'explicit trust-2 commercial pool');
  assert(score(complete(chrProfile(1.5), { factionId: CHR, templateId })) === 1.5, 'premium commercial work is not advancement');
}
assert(cerberusContractClass(workforce) === 'routine', 'ambiguous workforce intake remains ordinary');
assert(complete(chrProfile(1.5, 2), workforce).reputations![STEEL] === 2, 'no invented workforce coercion penalty');
let career = chrProfile();
career = complete(career); assert(score(career) === .5, 'first job earns half bar');
for (let i = 0; i < 60; i++) career = complete(career, combine);
assert(score(career) === .5, 'no decay below first rank');
career = complete(career); assert(score(career) === 1, 'second ordinary job earns rank 1');
assert(employerReputationLevel(career.reputations, 'halloran-smelting-house') === 1, 'commercial recognition reads completed CHR level');
for (let i = 1; i <= 15; i++) {
  career = complete(career, records);
  assert(score(career) === (30 + i * 2) / 30, `records provide exact non-custody progression ${i}/15`);
  equal(JSON.parse(JSON.stringify(career)).reputations, career.reputations, 'fraction survives serialization');
}
assert(score(career) === 2, 'fifteenth important completion reaches exactly 2');
for (let i = 0; i < 100; i++) career = complete(career, custody);
assert(score(career) === 2, 'ordinary contracts never award level 3');
assert(score(complete(chrProfile(.9), records)) === 1, 'no first-band award spill');
assert(score(complete(chrProfile(1.99), records)) === 2, 'no quest-band spill');
for (const value of [0, .5, 1, 1.5, 2, 2.5, 3]) {
  let p = chrProfile(value, 3);
  for (let i = 0; i < 5; i++) p = complete(p, combine);
  assert(score(p) === value, 'five unrelated jobs give full grace, no reciprocal rivalry');
  p = complete(p, combine);
  const expected = value < 1 ? value : Math.max(Math.floor(value), value - 1 / 30);
  assert(Math.abs(score(p) - expected) < 1e-14, 'sixth unrelated job consumes fractional standing only');
  for (let i = 0; i < 100; i++) p = complete(p, combine);
  assert(score(p) === (value < 1 ? value : Math.floor(value)), 'integer floor protected');
  assert(!previewContractReputation(chrProfile(value, 3), combine).effects.some(e => e.faction === CHR && e.kind === 'rival-loss'), 'Combine work never causes CHR disapproval');
}
career = chrProfile(1.5, 1.5); career.reputationUnrelatedContracts = { [CHR]: 5, [STEEL]: 5 };
const next = complete(career, routine);
assert(score(next) === 1.5 && next.reputationUnrelatedContracts![CHR] === 0, 'own routine work refreshes CHR grace');
assert(next.reputationUnrelatedContracts![STEEL] === 6 && next.reputations![STEEL] === 44 / 30, 'independent Combine unrelated counter/decay');
for (const contract of [{ ...records, category: 'empty' as const }, { ...routine, travelMode: 'old-nell' as const }]) {
  const p = previewContractReputation(career, contract);
  equal(p.reputations, career.reputations, 'empty/personal travel preserves both scores');
  equal(p.reputationUnrelatedContracts, career.reputationUnrelatedContracts, 'empty/personal travel preserves both counters');
}
const both = previewContractReputation(chrProfile(1, 2.1), custody);
assert(both.reputations[CHR] === 32 / 30 && Math.abs(both.reputations[STEEL] - 1.9) < 1e-14, 'CHR gain and directed Combine loss coexist');
const messages = contractReputationNotices(chrProfile(1, 2.1), custody);
assert(messages.some(n => n.text === 'Completing this contract will improve your reputation with Cerberus Human Resources.'), 'neutral improvement notice');
assert(messages.some(n => n.text === 'Steel Combine disapproves of this contract. Completing it will reduce your reputation with them.'), 'neutral rival notice alongside gain');
assert(!previewContractReputation(chrProfile(1, 2.1), records).effects.some(e => e.kind === 'rival-loss'), 'records importance is not political hostility');
assert(!contractReputationNotices(chrProfile(2, 1), records).some(n => n.text.includes('improve')), 'no promised gains at ordinary cap');
assert(contractReputationNotices(chrProfile(1.5), routine).some(n => n.text.includes('maintain')), 'routine fractional maintenance notice');
for (const value of [1, 2, 3]) assert(!contractReputationNotices(chrProfile(value), routine).some(n => n.text.includes('maintain')), 'no false maintenance at integer floor');
const all = chrProfile(1.5, 1.5);
for (const track of REPUTATION_TRACKS) if (![CHR, STEEL].includes(track.id)) { all.reputations![track.id] = .75; all.reputationUnrelatedContracts![track.id] = 4; }
for (const contract of [routine, records, custody, combine]) {
  const before = JSON.stringify(all), p = previewContractReputation(all, contract);
  for (const track of REPUTATION_TRACKS) if (![CHR, STEEL].includes(track.id)) {
    assert(p.reputations[track.id] === .75 && p.reputationUnrelatedContracts[track.id] === 4, 'no donor awards or unauthored decay');
  }
  equal(JSON.stringify(all), before, 'pure preview cannot mutate career');
}

export const chrOffers = Array.from({ length: 8 }, (_, day) => ['caravanserai-main-commercial-dock',
  'estella-ii-commercial-hub-dock', 'estella-ii-olympos', 'estella-iii-capital-city', 'estella-vi-heavy-cargo-station']
  .flatMap(source => [...generateCareerContracts(source, day * 86400), ...generatePassengerContracts(source, day * 86400)]))
  .flat().filter(c => c.factionId === CHR);
assert(chrOffers.length > 100, 'substantial actual generated CHR sample');
for (const id of CERBERUS_IMPORTANT_TEMPLATES) assert(chrOffers.some(c => c.templateId === id), `actual important supply: ${id}`);
for (const contract of chrOffers) {
  const snapshot = JSON.stringify(contract), kind = cerberusContractClass(contract), required = contractIncomeMinimum(contract)!;
  assert(contractGrossPay(contract.quote.pay, contract.quote.parFuelCost, contract.quote.parFuelCost) - contract.quote.parFuelCost === contract.quote.expectedMargin, 'real quote arithmetic');
  if (kind === 'important') assert(contract.quote.expectedMargin === 20000 && required === 1 && incomeCalibrationKind(contract) === 'important', 'important pay pool separate and accessible before rank 2');
  if (kind === 'entrusted-commercial') assert(required === 2 && contract.quote.expectedMargin > 250000, 'entrusted commercial belongs in premium earnings/access pool');
  for (const value of [0, .9999999999999999, 1, 1.9999999999999998, 2, 2.9, 3]) {
    const p = chrProfile(value, 3);
    assert(contractReputationLockReasons(p, contract).length === (value < required ? 1 : 0), 'completed levels and quoted net AND trust, never reciprocal Combine refusal');
  }
  equal(JSON.stringify(contract), snapshot, 'gates/previews cannot change quotes');
}
export const entry = chrOffers.find(c => contractIncomeMinimum(c) === 0 && c.category === 'freight')!;
export const advancement = chrOffers.find(c => c.templateId === 'local-audit-records')!;
export const hostile = chrOffers.find(c => c.templateId === 'local-workforce-manifests')!;
export const premium = chrOffers.find(c => cerberusContractClass(c) === 'routine' && contractIncomeMinimum(c) === 2)!;
assert(entry && advancement && hostile && premium, 'starter freight, non-custody advancement, rivalry and high-paying ordinary freight exist');
const returningRecords = chrOffers.find(c => ['local-shareholder-packets', 'local-legal-archives'].includes(c.templateId ?? '')
  && c.sourceId === advancement.destinationId && c.destinationId === advancement.sourceId);
assert(returningRecords, 'non-custody advancement has a genuine two-way Acheron Hub/Olympos route');
for (const fuel of [NaN, Infinity, -1]) {
  let rejected = false;
  try { calibrateNewContractQuote(advancement, { ...advancement.quote, parFuelCost: fuel }); } catch { rejected = true; }
  assert(rejected, 'important fixed-net pricing cannot bypass invalid workload validation');
}
for (const [net, required] of [[40000, 0], [40001, 1], [250000, 1], [250001, 2]] as const) {
  const quoted = { ...entry, quote: { ...entry.quote, expectedMargin: net } };
  for (const level of [0, 1, 2]) assert(contractReputationLockReasons(chrProfile(level), quoted).length === (level < required ? 1 : 0), 'exact live credit boundary');
}
assert(contractIncomeMinimum({ ...advancement, quote: { ...advancement.quote, expectedMargin: 300000 } }) === 2, 'old expensive important quote still respects economic minimum, never repriced');

const storage = new Map<string, string>(), key = 'space-teamster.career.v1'; let fail = false, writes = 0;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => { if (fail && k === key) throw Error('synthetic failed save'); storage.set(k, v); if (k === key) writes++; },
} });
const legacy = chrProfile(1.5); delete legacy.reputationUnrelatedContracts;
storage.set(key, JSON.stringify(legacy)); const beforeWrites = writes;
assert(loadCareerProfile().reputations![CHR] === 1.5 && writes === beforeWrites, 'legacy score loads without eager write or inferred jobs');
assert(!loadCareerProfile().reputationUnrelatedContracts![CHR], 'legacy CHR starts with full grace');
const game: any = Object.create(Game.prototype); game.canvas = { width: 1360, height: 940 };
game.career = chrProfile(); let launches = 0, logs = 0;
game.launchPlayableEstellaMission = () => { launches++; }; game.loadStationTerminal = () => {};
game.logSuccessfulGeneratedRun = () => { logs++; };
const post = (contract: CareerContract) => ({ id: 'contractPosting', selectedIndex: 0, contracts: [contract], contractIndex: 0 });
for (const contract of [advancement, premium]) {
  const state = post(contract);
  assert(game.buildInteractiveScene(state).options[0].disabled, 'actual scene locks higher reputation');
  game.activateInteractiveSceneOption(state, 'acceptContract'); assert(launches === 0, 'handler blocks direct acceptance bypass');
  assert(!game.buildInteractiveScene(state).bodyRows.some((r: any) => r.text?.includes('will improve')), 'locked offer does not promise unattainable reward');
}
function finish(contract: CareerContract) {
  game.activateInteractiveSceneOption(post(contract), 'acceptContract');
  assert(game.activeCareerContract === contract && game.activeMissionQuote === contract.quote, 'accept exact cached quote with current eligibility');
  game.missionDvUsed = contract.quote.parDv; game.worldTime = 100;
  game.activeManifestCondition = { integrity: null, comfort: null }; game.pendingMaintenanceSettlement = null;
  game.finishCareerDelivery();
}
finish(entry); finish(entry); assert(score(game.career) === 1, 'two actual Game settlements unlock rank 1');
assert(!game.buildInteractiveScene(post(advancement)).options[0].disabled, 'cached important posting immediately unlocks');
game.career.locationId = advancement.sourceId; // Fixture repositioning before a genuine alternating route.
for (let i = 0; i < 15; i++) {
  const job = game.career.locationId === advancement.sourceId ? advancement : returningRecords;
  assert(job.sourceId === game.career.locationId, 'records progression does not require repeatedly teleporting to one pickup');
  finish(job);
}
assert(score(game.career) === 2 && !game.buildInteractiveScene(post(premium)).options[0].disabled, 'fifteen real non-custody settlements unlock premium');
assert(game.career.money === 1000000 + 2 * entry.quote.expectedMargin + 15 * 20000 && Number(logs) === 17, 'exact money and one history entry per job');
assert(loadCareerProfile().reputations![CHR] === 2, 'earned score persists with existing save schema');

// Simultaneous advance/rival loss is atomic, and a legacy accepted high quote is never rewritten.
const oldQuote = estimateEstellaMissionCost(hostile.sourceId, hostile.destinationId, hostile.cargo, hostile.selectedTransfer,
  makePayTerms({ generosity: 1.25, compensationRatio: .2, maxCompAllowance: 2 }));
for (const contract of [hostile, { ...hostile, quote: oldQuote }]) {
  game.career = chrProfile(1.5, 2.1); game.career.reputationUnrelatedContracts = { [CHR]: 7, [STEEL]: 7 };
  game.activeCareerContract = contract; game.activeMissionQuote = contract.quote;
  game.missionDvUsed = contract.quote.parDv; game.worldTime = 500;
  game.activeManifestCondition = { integrity: null, comfort: null }; game.pendingMaintenanceSettlement = null;
  saveCareerProfile(game.career);
  const profileBefore = game.career, serialized = JSON.stringify(profileBefore), saved = storage.get(key), quoteBefore = JSON.stringify(contract), logCount = logs;
  const expected = previewContractReputation(profileBefore, contract);
  fail = true; let rejected = false; try { game.finishCareerDelivery(); } catch { rejected = true; }
  assert(rejected && game.career === profileBefore && JSON.stringify(game.career) === serialized && storage.get(key) === saved && logs === logCount, 'failed save preserves all money/scores/counters/history');
  assert(game.activeCareerContract === contract && game.activeMissionQuote === contract.quote, 'failed save retains accepted booking for retry');
  fail = false; game.finishCareerDelivery();
  equal(game.career.reputations, expected.reputations, 'settlement and preview agree on simultaneous gain/loss');
  equal(game.career.reputationUnrelatedContracts, expected.reputationUnrelatedContracts, 'independent counters persist atomically');
  assert(game.career.money === profileBefore.money + contract.quote.expectedMargin && logs === logCount + 1, 'retry pays accepted old/new amount once');
  equal(JSON.stringify(contract), quoteBefore, 'old accepted quote unchanged');
  game.finishCareerDelivery(); assert(logs === logCount + 1, 'duplicate callback cannot repeat rewards');
}
console.log(`Cerberus reputation: ${checks} checks; ${chrOffers.length} actual offers, all important families, 2+15 Game completions, credit/trust gates, decay, records alternative, asymmetric rivalry and atomic legacy settlement.`);
