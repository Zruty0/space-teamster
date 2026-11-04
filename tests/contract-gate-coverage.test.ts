// Coverage audit only: approval and proposed gates are not production implementation.
import { contractGateCoverage, coveredIncomeMinimum, coveredProjectedNet, fitCoverage, sampleAllBoards,
  sampleContactOffers, CIVILIAN_RECOGNITION_PROVIDERS, ADDITIONAL_PRICING_PROVIDERS } from './audit-contract-gate-coverage';
import { ESTELLA_FACTION_CONTRACT_PROVIDERS } from '../src/content/estella/faction-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { localTerminalScopeIds } from '../src/local-directory';
import { defaultCareerProfile } from '../src/career-state';
import { normalizeReputations } from '../src/reputation';
import { employerReputationLevel } from '../src/employer-reputation';
import { contractReputationLockReasons, previewContractReputation } from '../src/contract-reputation';
import { createEmptyRun } from '../src/empty-runs';
import { contractGrossPay, contractFuelCompensation } from '../src/mission-cost';

let checks = 0, candidates = 0;
function assert(value: unknown, text: string): asserts value { checks++; if (!value) throw Error(text); }
function throws(fn: () => unknown, text: string) { let failed = false; try { fn(); } catch { failed = true; } assert(failed, text); }
const sources = [...new Set(estellaSelectableNavTargets().flatMap(t => localTerminalScopeIds(canonicalEstellaLocationId(t.id))))];
const seen = new Set<string>();
for (const provider of ESTELLA_FACTION_CONTRACT_PROVIDERS) for (let day = 0; day < 16; day++) for (const sourceId of sources) {
  for (const c of provider.generateContracts({ sourceId, worldTime: day * 86400 })) {
    candidates++; seen.add(c.factionId);
    const before = JSON.stringify(c), policy = contractGateCoverage(c);
    assert(policy.kind === 'paid' && policy.target && policy.recognition, `explicit paid policy ${c.factionId}/${c.templateId}`);
    assert(JSON.stringify(c) === before, 'no identity, issuer, fuel, cargo or regional-order mutation');
    assert(coveredIncomeMinimum(policy, 1e9) >= 2 || policy.priceException === 'combine', 'high quoted income cannot silently default to level zero');
  }
}
assert(seen.size === 34, 'all public providers covered, not just original 28');
for (const provider of CIVILIAN_RECOGNITION_PROVIDERS) {
  const policy = contractGateCoverage({ factionId: provider, templateId: 'existing-civilian-offer' });
  assert(policy.recognition === 'GOV' && policy.target === 'INSTITUTIONS' && policy.trust === 0, 'civilian issuer retains identity while recognizing Institutions');
  for (const [net, level] of [[0, 0], [27500, 0], [27501, 1], [75000, 1], [75001, 2]]) {
    assert(coveredIncomeMinimum(policy, net) === level, 'institutional ceilings and equality rule');
  }
  assert(employerReputationLevel({ ...normalizeReputations(undefined), 'estella-institutions': 1.99 }, policy.recognition!) === 1, 'recognition uses completed Institutions standing');
}
for (const provider of ['house-nunes', 'kisaragi-harmony-yards', 'estella-defence-force', 'daedalus-systems']) {
  const templateId = provider === 'house-nunes' ? 'outer-watch:site' : provider === 'kisaragi-harmony-yards' ? 'prestige-records:x'
    : provider === 'estella-defence-force' ? 'gaia:leave-travel:site:out' : 'product-site-cargo';
  assert(contractGateCoverage({ factionId: provider, templateId }).recognition === provider, 'faction work at Gaia/Dahai does not become civilian/GOV work');
}
const inquiry = contractGateCoverage({ factionId: 'house-nunes', templateId: 'inquiry:subject', nunesInquiry: { instanceId: 'review', contribution: 8 } });
assert(inquiry.priceException === 'inquiry' && coveredIncomeMinimum(inquiry, 20000) === 1, 'Inquiry pricing exception is NOT a gate bypass');
const guild = contractGateCoverage({ factionId: 'teamsters-guild', templateId: 'skim-precursor-alpha' });
assert(guild.kind === 'paid' && guild.recognition === 'COMMERCIAL' && coveredIncomeMinimum(guild, 17000000) === 2, 'paid precursor jobs receive a policy without a Guild meter');
for (const factionId of [undefined, 'future-provider', 'constructor', '__proto__']) throws(() => contractGateCoverage({ factionId }), 'unknown paid issuers fail the audit closed');
throws(() => contractGateCoverage({ factionId: 'future-provider', category: 'certification' }), 'unknown issuer cannot claim bootstrap exception');
throws(() => coveredIncomeMinimum(guild, NaN), 'nonfinite quote rejected');
const contacts = sampleContactOffers();
const expected = ['basic-certification-still-transfer', 'basic-certification-board-old-nell', 'basic-certification-weymark-landing',
  'basic-certification-nells-rest-return', 'line-certification-roadstead-checkride', 'thin-atmosphere-endorsement-concord',
  'thick-atmosphere-endorsement-stribog', 'old-nell-passage-to-weymark', 'old-nell-passage-to-still'];
assert(expected.every(id => contacts.offers.some(c => c.templateId === id)), 'direct Gid/office actions included; all nine bootstrap/transit identities reached');
for (const c of contacts.offers) {
  const policy = contractGateCoverage(c);
  assert(policy.kind !== 'paid' && policy.trust === 0 && c.quote.expectedMargin <= 1, `bootstrap/transit is not profitable commercial work: ${c.templateId}/${c.quote.expectedMargin}`);
  assert(contractReputationLockReasons(defaultCareerProfile(), c).length === 0, 'certification not locked behind reputation it cannot earn');
}
const empty = createEmptyRun(defaultCareerProfile(), 'estella-viii-first-rendezvous-station');
assert(contractGateCoverage(empty).kind === 'empty' && empty.quote.grossPay === 0, 'empty repositioning is not paid employment');
const rows = sampleAllBoards(0, 4), before = JSON.stringify(rows);
const fit = fitCoverage(rows, rows.filter(r => r.contract.factionId === 'covenant-remnants'));
for (const { contract: c } of rows) {
  const policy = contractGateCoverage(c), net = coveredProjectedNet(c, fit), minimum = coveredIncomeMinimum(policy, net);
  assert(minimum >= policy.trust && minimum <= 2, 'every fresh board quote has an explicit 0/1/2 minimum');
  if (ADDITIONAL_PRICING_PROVIDERS.includes(c.factionId!)) {
    const pay = { ...c.quote.pay, generosity: 0, flatReward: net + c.quote.parFuelCost - contractFuelCompensation(c.quote.pay, c.quote.parFuelCost, c.quote.parFuelCost) };
    assert(pay.flatReward >= 0 && contractGrossPay(pay, c.quote.parFuelCost, c.quote.parFuelCost) - c.quote.parFuelCost === net, 'new pool target net retains original reimbursement/cap');
    assert(contractReputationLockReasons(defaultCareerProfile(), c).length === 0, 'audit does not pretend new production gates are live');
    const profile = defaultCareerProfile(); profile.reputations!['estella-institutions'] = 1.5; profile.reputationUnrelatedContracts!['estella-institutions'] = 5;
    assert(previewContractReputation(profile, c).reputations['estella-institutions'] === 1.5, 'recognition proposal does not silently grant civilian/Guild GOV credit');
  }
}
assert(JSON.stringify(rows) === before, 'new/accepted quotes and identities never mutated by audit');
console.log(`Gate coverage: ${checks} checks, ${candidates} raw candidates, ${rows.length} actual board postings, ${contacts.offers.length} contact/state appearances; all 34 providers and nine noncommercial identities.`);
