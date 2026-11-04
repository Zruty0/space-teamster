import { CONTRACT_INCOME_TARGETS, incomeTargetId, incomeBoundaries, incomeEconomicMinimum, incomeCalibrationKind,
  contractIncomeMinimum, ordinaryContractNetCredits, calibratedNetCredits, cerberusEntryNetCredits, cerberusPremiumNetCredits, calibrateNewContractQuote, type IncomeTargetId } from '../src/contract-income';
import { CONTRACT_INCOME_CURVES } from '../src/contract-income-curves';
import { EMPLOYER_REPUTATION_PROVIDER_KEYS, UNASSIGNED_REPUTATION_PROVIDERS } from '../src/employer-reputation';
import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { contractFixedPay, contractFuelCompensation, contractGrossPay, estimateEstellaMissionCost, makePayTerms, type MissionCostQuote } from '../src/mission-cost';
import { defaultCareerProfile, TEAMSTER_CERTIFICATION_IDS } from '../src/career-state';
import { createDefaultRigState } from '../src/maintenance/rig-state';
import { combineContractClass, contractReputationLockReasons, previewContractReputation } from '../src/contract-reputation';
import { fitIncomeCurve } from './audit-contract-income';
import { Game } from '../src/game';

export let checks = 0;
function assert(value: unknown, message: string): asserts value { checks++; if (!value) throw Error(message); }
function equal(a: unknown, b: unknown, message: string) { assert(JSON.stringify(a) === JSON.stringify(b), message); }
function fakeQuote(fuel: number, compensationRatio = .4, maxCompAllowance = 2): MissionCostQuote {
  const pay = makePayTerms({ generosity: .8, flatReward: 12000, compensationRatio, maxCompAllowance });
  const grossPay = contractGrossPay(pay, fuel, fuel);
  return { sourceId: 'source', destinationId: 'destination', cargoLabel: 'unchanged', cargoMassTons: 10,
    loadedMassTons: 138, parDv: fuel / 138, fuelPricePerTonMps: 1, parFuelCost: fuel, pay,
    generosity: pay.generosity, grossPay, expectedMargin: grossPay - fuel, breakdown: [{ label: 'route', dv: fuel / 138 }] };
}
const ordinary = { factionId: 'cerberus-human-resources', templateId: 'mining-cutters-to-pandemonium', category: 'freight' as const };
assert(Object.keys(CONTRACT_INCOME_TARGETS).length === 22, 'all approved target rows represented');
for (const [provider, key] of Object.entries(EMPLOYER_REPUTATION_PROVIDER_KEYS)) {
  assert(incomeTargetId(provider) !== undefined && CONTRACT_INCOME_CURVES[provider], `explicit profile and independent fit: ${provider}`);
  const id = incomeTargetId(provider)!;
  const boundaries = incomeBoundaries(id);
  if (boundaries) {
    const [b0, b1] = boundaries;
    for (const [net, expected] of [[0, 0], [b0, 0], [b0 + 1, 1], [b1, 1], [b1 + 1, 2]] as const) {
      assert(incomeEconomicMinimum(provider, net) === expected, 'inclusive integer boundaries, not rounded thousands');
    }
    for (const level of [0, 1, 2] as const) assert(incomeEconomicMinimum(provider, CONTRACT_INCOME_TARGETS[id][level]!) === level, 'approved medians inside their bands');
    assert(b0 <= 40000, 'global entry ceiling');
  }
  const curve = CONTRACT_INCOME_CURVES[provider];
  for (let i = 0; i < curve.length; i++) assert(curve[i] > 0 && (i === 0 || curve[i] >= curve[i - 1]), 'positive ordered workload knots');
  if (curve.length === 8) assert(curve[1] < curve[2] && curve[2] < curve[3] && curve[4] < curve[5] && curve[5] < curve[6], 'strict separation, no division by zero');
  const fuels = [...new Set([0, 1, ...curve.flatMap(x => [Math.floor(x) - 1, Math.floor(x), Math.ceil(x), Math.ceil(x) + 1]),
    ...Array.from({ length: 240 }, (_, i) => (i + 1) * 10000), 25_000_000])].sort((a, b) => a - b);
  let previous = -1;
  for (const fuel of fuels) {
    const net = ordinaryContractNetCredits({ factionId: provider }, fuel);
    assert(Number.isInteger(net) && net >= previous, 'finite, monotonic integer credits across knots and tails'); previous = net;
    const identity = key === 'STEEL' ? { factionId: provider, templateId: 'export-svarog:hull-plate-stock' } : { factionId: provider };
    const raw = fakeQuote(fuel), frozen = JSON.stringify(raw), quote = calibrateNewContractQuote(identity, raw);
    assert(quote !== raw && JSON.stringify(raw) === frozen, 'new quote, no mutation of original/accepted terms');
    assert(quote.expectedMargin === net && quote.grossPay - fuel === net && contractGrossPay(quote.pay, fuel, fuel) - fuel === net, 'display and settlement earnings agree exactly');
    assert(quote.pay.compensationRatio === raw.pay.compensationRatio && quote.pay.maxCompAllowance === raw.pay.maxCompAllowance, 'fuel terms unchanged');
    assert(quote.breakdown === raw.breakdown && quote.parDv === raw.parDv && quote.cargoLabel === raw.cargoLabel, 'physical quote unchanged');
    equal(calibrateNewContractQuote(identity, quote), quote, 'recalculation at same conditions is stable, though only new-offer path invokes it');
  }
}
equal(incomeBoundaries('CHR'), [40000, 250000], 'CHR approved caps');
equal(incomeBoundaries('COVENANT'), [15000, 37500], 'poorer employers retain meaningful tier 1');
for (const provider of [...UNASSIGNED_REPUTATION_PROVIDERS, 'unknown', '__proto__', 'constructor', 'notoriety']) {
  assert(incomeTargetId(provider) === undefined, 'no inferred criminal/civilian/Guild provider');
  assert(incomeEconomicMinimum(provider, 900000) === undefined, 'unassigned is not level zero');
  const raw = fakeQuote(123456);
  assert(calibrateNewContractQuote({ factionId: provider }, raw) === raw, 'excluded provider quote is exact same object');
}
for (const fields of [{ category: 'certification' as const }, { category: 'empty' as const }, { travelMode: 'old-nell' as const }, { nunesInquiry: { instanceId: 'inquiry', contribution: 1 } }]) {
  const raw = fakeQuote(123456), contract = { ...ordinary, ...fields };
  assert(!incomeCalibrationKind(contract) && calibrateNewContractQuote(contract, raw) === raw, 'noncommercial/special work untouched');
  assert(fields.nunesInquiry ? contractIncomeMinimum({ ...contract, quote: raw }) === incomeEconomicMinimum(contract.factionId, raw.expectedMargin)
    : contractIncomeMinimum({ ...contract, quote: raw }) === undefined, 'pricing exception cannot exempt paid work from its income gate');
}
for (const invalid of [NaN, Infinity, -1]) {
  let threw = false; try { calibratedNetCredits('CHR', invalid, CONTRACT_INCOME_CURVES[ordinary.factionId]); } catch { threw = true; }
  assert(threw, 'invalid workload rejected');
}
const lowQuote = { ...fakeQuote(200000), expectedMargin: 15000 };
assert(contractIncomeMinimum({ ...ordinary, quote: lowQuote }) === 0, 'low earnings alone require zero');
assert(contractIncomeMinimum({ ...ordinary, quote: lowQuote }, 1) === 1, 'independent trust minimum wins at low pay');
assert(contractIncomeMinimum({ ...ordinary, quote: { ...lowQuote, expectedMargin: 134000 } }) === 1, 'ordinary cargo cannot bypass earnings minimum');
assert(contractIncomeMinimum({ ...ordinary, quote: { ...lowQuote, expectedMargin: 300000 } }, 1) === 2, 'economic minimum wins over lower trust');
for (const provider of ['voss-heinkel-metricwerke', 'kisaragi-harmony-yards']) assert(contractIncomeMinimum({ factionId: provider, quote: lowQuote }) === 2, 'direct-parent trust floor despite low earnings');
for (const [templateId, level] of [['hammer-to-gornilo:smelter-feedstock', 0], ['hammer-to-veles:blasting-charges', 1],
  ['import-serai:bulk-industrial-chemicals', 1], ['export-svarog:hull-plate-stock', 2]] as const) {
  const contract = { factionId: 'steel-combine', templateId, quote: { ...lowQuote, expectedMargin: level === 2 ? 30000 : 0 } };
  assert(contractIncomeMinimum(contract) === level, 'Combine trust classes survive cheap/zero fees');
  if (level !== 2) assert(calibrateNewContractQuote(contract, contract.quote) === contract.quote, 'Combine non-export quotes untouched');
}
for (const [ratio, cap] of [[0, 2], [.4, 2], [.8, .5], [1, 2]]) {
  const raw = fakeQuote(200000, ratio, cap), quote = calibrateNewContractQuote(ordinary, raw);
  for (const actual of [0, 100000, 200000, 400000, 800000]) {
    assert(contractFuelCompensation(quote.pay, 200000, actual) === contractFuelCompensation(raw.pay, 200000, actual), 'actual-fuel behavior and cap preserved');
    const expected = quote.expectedMargin + 200000 - actual
      + contractFuelCompensation(raw.pay, 200000, actual) - contractFuelCompensation(raw.pay, 200000, 200000);
    assert(contractGrossPay(quote.pay, 200000, actual) - actual === expected, 'off-par net retains efficiency/risk incentives');
  }
}
let excessRejected = false;
try { calibrateNewContractQuote(ordinary, fakeQuote(200000, 100)); } catch { excessRejected = true; }
assert(excessRejected, 'excess reimbursement requires explicit review, not negative fees');
const synthetic = Array.from({ length: 100 }, (_, i) => 1000 + i * 100);
const fitted = fitIncomeCurve(synthetic);
const nets = synthetic.map(f => calibratedNetCredits('CHR', f, fitted));
for (const level of [0, 1, 2] as const) {
  const values = nets.filter(n => incomeEconomicMinimum(ordinary.factionId, n) === level);
  assert(values.length === [20, 60, 20][level], '20/60/20 fitting, not old 40/40/20');
  assert((values[(values.length - 1) >> 1] + values[values.length >> 1]) / 2 === CONTRACT_INCOME_TARGETS.CHR[level], 'discrete even-sample median exact');
}
const tied = Array.from({ length: 100 }, (_, i) => i < 30 ? 1000 : 1000 + i * 100);
const tiedCurve = fitIncomeCurve(tied);
assert(tied.filter(f => incomeEconomicMinimum(ordinary.factionId, calibratedNetCredits('CHR', f, tiedCurve)) === 0).length === 30, 'inseparable equal workloads reported honestly, not artificially randomized');

// Real public postings and the actual Game acceptance/settlement paths, with disposable page-local storage.
export const sampleOffers = Array.from({ length: 8 }, (_, day) => [
  ...generateCareerContracts('estella-vi-heavy-cargo-station', day * 86400),
  ...generateCareerContracts('caravanserai-main-commercial-dock', day * 86400),
  ...generatePassengerContracts('caravanserai-main-commercial-dock', day * 86400),
  ...generateCareerContracts('estella-ii-olympos', day * 86400),
  ...generatePassengerContracts('estella-ii-olympos', day * 86400),
]).flat();
const storage = new Map<string, string>(); let fail = false;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { if (fail) throw Error('synthetic save failure'); storage.set(key, value); },
} });
const exporting = sampleOffers.find(c => combineContractClass(c) === 'export')!;
assert(exporting, 'generated Combine export exists');
const legacy: CareerContract = { ...exporting, quote: estimateEstellaMissionCost(exporting.sourceId, exporting.destinationId,
  exporting.cargo, exporting.selectedTransfer, makePayTerms({ generosity: .15, flatReward: 0, compensationRatio: 1, maxCompAllowance: 2 })) };
assert(legacy.quote.expectedMargin !== exporting.quote.expectedMargin, 'legacy/current exports have different accepted fees');
for (const contract of [legacy, exporting, ...sampleOffers.filter(c => c.factionId === ordinary.factionId).slice(0, 2)]) {
  const game: any = Object.create(Game.prototype);
  game.canvas = { width: 1360, height: 940 }; game.career = defaultCareerProfile();
  game.career.rig = createDefaultRigState(true); game.career.certifications = [...TEAMSTER_CERTIFICATION_IDS];
  game.career.reputations['steel-combine'] = 2; game.career.reputations['cerberus-human-resources'] = 2; game.career.money = 12345;
  game.loadStationTerminal = () => {}; game.launchPlayableEstellaMission = () => {};
  let logs = 0; game.logSuccessfulGeneratedRun = () => { logs++; };
  const accepted = JSON.stringify(contract), state = { id: 'contractPosting', selectedIndex: 0, contracts: [contract], contractIndex: 0 };
  game.activateInteractiveSceneOption(state, 'acceptContract');
  assert(game.activeCareerContract === contract && game.activeMissionQuote === contract.quote, 'acceptance keeps original quote, no repricing');
  game.missionDvUsed = contract.quote.parDv; game.activeManifestCondition = { integrity: null, comfort: null };
  game.pendingMaintenanceSettlement = null; game.worldTime = 1000;
  fail = true; let rejected = false;
  try { game.finishCareerDelivery(); } catch { rejected = true; }
  assert(rejected && game.career.money === 12345 && game.activeMissionQuote === contract.quote && logs === 0, 'failed save retains money and original booking');
  fail = false; game.finishCareerDelivery();
  assert(game.career.money === 12345 + contract.quote.expectedMargin && Number(logs) === 1, 'real par settlement uses exactly accepted net, old or new');
  equal(JSON.stringify(contract), accepted, 'accepted quote/history never rewritten');
  game.finishCareerDelivery(); assert(Number(logs) === 1, 'no double reward');
}
const zero = defaultCareerProfile();
assert(contractReputationLockReasons(zero, { ...ordinary, factionId: 'balor-advanced-materials' }).length === 1, 'unknown BAM template cannot silently bypass policy');
assert(previewContractReputation(zero, ordinary).reputations['cerberus-human-resources'] === .5, 'authorized CHR progression is separate from pricing');
console.log(`Contract income: ${checks} checks; approved medians/caps, monotonic fixed curves, tie handling, fuel terms, trust minima, new/legacy quote settlement and atomic retry.`);
