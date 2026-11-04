// Retained review oracle and live rollout checks, not a flown-campaign test.
import { incomeEconomicMinimum } from '../src/contract-income';
import { proposedCovenantClass } from './audit-covenant-reputation';
import { DAEDALUS, BAM, MERREN, GOV, EDF, EIP, NEW_EARNING_PROVIDERS, RECIPIENT_PROVIDERS, REMAINING_PROVIDERS,
  remainingReviewPolicy, projectRemainingReviewEvent, sampleBatchBoards, fitBatchProposal, projectBatchQuote,
  auditBatchProposal, covenantGentleEntryNet, sampleCovenantBoards } from './audit-remaining-reputation';
import { ESTELLA_FACTION_CONTRACT_PROVIDERS } from '../src/content/estella/faction-contracts';
import { EMPLOYER_REPUTATION_PROVIDER_KEYS, UNASSIGNED_REPUTATION_PROVIDERS, employerReputationLevel } from '../src/employer-reputation';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { localTerminalScopeIds } from '../src/local-directory';
import { normalizeReputations, reputationMaxLevel } from '../src/reputation';
import { contractReputationLockReasons, previewContractReputation } from '../src/contract-reputation';
import { defaultCareerProfile } from '../src/career-state';
import { contractGrossPay, contractFuelCompensation } from '../src/mission-cost';
import { emptyTravelAccess } from '../src/content/estella/empty-travel-access';

let checks = 0, candidates = 0;
function assert(value: unknown, text: string): asserts value { checks++; if (!value) throw Error(text); }
const prior = ['house-alvares', 'house-mendes', 'house-nunes', 'steel-combine', 'cerberus-human-resources',
  'voss-heinkel-metricwerke', 'bruckner-field-services', 'kisaragi-harmony-yards', 'kisaragi-yards-estella', 'covenant-remnants'];
assert(new Set([...prior, ...REMAINING_PROVIDERS]).size === 28, 'batch closes all mapped public-employer reviews');
assert(Object.keys(EMPLOYER_REPUTATION_PROVIDER_KEYS).every(id => [...prior, ...REMAINING_PROVIDERS, 'teamsters-guild',
  'gaia-civilian-bookings', 'dahai-civilian-bookings', 'camps-civilian-bookings', 'sahra-civilian-bookings', 'weymark-independent-operators'].includes(id)), 'batch and later civilian/Guild extension cover all providers');
assert(ESTELLA_FACTION_CONTRACT_PROVIDERS.length === 34 && UNASSIGNED_REPUTATION_PROVIDERS.length === 0, 'Guild and five mixed pools now explicitly recognized');
assert(!ESTELLA_FACTION_CONTRACT_PROVIDERS.some(p => p.id === 'smuggler-notoriety'), 'no fictional central smuggling provider');
const sources = [...new Set(estellaSelectableNavTargets().flatMap(t => localTerminalScopeIds(canonicalEstellaLocationId(t.id))))];
const counts = new Map<string, { ordinary: number; important: number; freight: number; entrusted: number }>();
for (const provider of ESTELLA_FACTION_CONTRACT_PROVIDERS.filter(p => REMAINING_PROVIDERS.includes(p.id))) {
  const count = { ordinary: 0, important: 0, freight: 0, entrusted: 0 }; counts.set(provider.id, count);
  for (let day = 0; day < 16; day++) for (const sourceId of sources) {
    for (const c of provider.generateContracts({ sourceId, worldTime: day * 86400 })) {
      candidates++;
      const before = JSON.stringify(c), policy = remainingReviewPolicy(c);
      assert(policy, `unreviewed raw ${c.factionId}/${c.templateId}`);
      assert(JSON.stringify(c) === before, 'identity/order/copy/fuel/cargo are not edited by review');
      if (policy.work === 'important') { count.important++; if (c.category !== 'passenger') count.freight++; }
      else if (policy.work === 'entrusted') count.entrusted++;
      else count.ordinary++;
      if (RECIPIENT_PROVIDERS.some(p => p === provider.id)) {
        assert(!policy.track && policy.trust === 0 && policy.work === 'commercial', 'recipient has no invented donor award, meter or important pool');
      } else {
        assert(policy.track === ([GOV, EDF, EIP].some(p => p === provider.id) ? 'estella-institutions' : provider.id), 'earning attributed to explicit employer/shared institution');
      }
      if (provider.id === DAEDALUS) {
        assert(!/autonomous general intelligence|machine governance|Icarus 3\.0|personality simulation|alignment/i.test([c.title, c.cargo.label, c.details, c.completionMessage].join(' ')), 'public copy does not expose reserved research plot');
        assert(!(c.sourceId.startsWith('estella-xif-') && c.destinationId.startsWith('estella-xif-')), 'no invented same-Coimbra circulation');
      }
    }
  }
}
for (const provider of NEW_EARNING_PROVIDERS) {
  const count = counts.get(provider)!;
  assert(count.ordinary > 0 && count.important > 0 && count.freight > 0, `${provider} has ordinary and important freight, not passenger-only progression`);
}
assert(counts.get(DAEDALUS)!.entrusted > 0, 'Icarus reserved commercial floor observed');
const selected = [
  [DAEDALUS, 'validation-return-public-site-hardware', 'important', 1],
  [DAEDALUS, 'icarus-restricted-inputs-public-supplier-racks', 'entrusted', 2],
  [DAEDALUS, 'balor-trade:trial-hardware-return:site:cargo', 'important', 1],
  [DAEDALUS, 'balor-trade:interface-rma:site:cargo', 'commercial', 0],
  [BAM, 'foundry-overhaul:site:cargo', 'important', 1], [BAM, 'rated-recruitment:site:cargo', 'commercial', 0],
  [MERREN, 'procurement:biological-reference-stock:site:cargo', 'important', 1],
  [MERREN, 'premium-export:site:therapeutic-seed-culture-vaults', 'commercial', 0],
  [MERREN, 'union-pilgrimage:site', 'important', 1],
  [GOV, 'gaia:inspection:site:out', 'important', 1], [GOV, 'gaia:public-clinics:site:out', 'commercial', 0],
  [EDF, 'farwatch:station-equipment:out', 'important', 1], [EDF, 'farwatch:provisions:out', 'commercial', 0],
  [EIP, 'sahra:raqib-food:out', 'commercial', 0], [EIP, 'sahra:raqib-local-standards:out', 'important', 1],
  [EIP, 'farwatch:optical-service:return', 'important', 1],
] as const;
for (const [factionId, templateId, work, trust] of selected) {
  const result = remainingReviewPolicy({ factionId, templateId });
  assert(result?.work === work && result.trust === trust, `selected ${factionId}/${templateId}`);
  assert(!remainingReviewPolicy({ factionId: 'covenant-remnants', templateId }), 'cargo/destination cannot transfer classification to another employer');
}
for (const factionId of NEW_EARNING_PROVIDERS) assert(!remainingReviewPolicy({ factionId, templateId: 'unknown-future-programme' }), 'future family requires review');
for (const factionId of UNASSIGNED_REPUTATION_PROVIDERS) assert(!remainingReviewPolicy({ factionId, templateId: 'gaia:inspection:site:out' }), 'mixed/civilian/Guild policy not invented');
for (const [track, factionId, templateId] of [[DAEDALUS, DAEDALUS, 'validation-return-site-hardware'],
  [BAM, BAM, 'foundry-overhaul:site:cargo'], [MERREN, MERREN, 'stewardship:site:cargo'],
  ['estella-institutions', GOV, 'gaia:public-records:site:in']] as const) {
  const own = { factionId, templateId };
  let state = { score: 0, unrelated: 0 };
  for (let i = 1; i <= 2; i++) { state = projectRemainingReviewEvent(track, state.score, state.unrelated, own); assert(state.score === i / 2, 'two introductory jobs, no advanced spill'); }
  for (let i = 1; i <= 15; i++) { state = projectRemainingReviewEvent(track, state.score, state.unrelated, own); assert(Math.abs(state.score - (1 + i / 15)) < 1e-12, 'fifteen important jobs'); }
  assert(state.score === 2 && projectRemainingReviewEvent(track, 2, 99, own).score === 2, 'ordinary completion never grants 3');
  state = { score: 1.5, unrelated: 0 };
  for (let i = 1; i <= 5; i++) { state = projectRemainingReviewEvent(track, state.score, state.unrelated, {}); assert(state.score === 1.5, 'five free unrelated completions'); }
  assert(projectRemainingReviewEvent(track, 1.5, 5, {}).score === 44 / 30, 'sixth completion starts decay');
  assert(projectRemainingReviewEvent(track, 1.01, 99, {}).score === 1, 'floor protected');
  assert(projectRemainingReviewEvent(track, .5, 99, {}).score === .5, 'no below-1 decay');
  for (const c of [{ category: 'empty' }, { travelMode: 'old-nell' }]) assert(projectRemainingReviewEvent(track, 1.5, 99, c).unrelated === 99, 'travel exclusions');
}
let institution = projectRemainingReviewEvent('estella-institutions', 0, 0, { factionId: GOV, templateId: 'gaia:civil-service:site:out' });
institution = projectRemainingReviewEvent('estella-institutions', institution.score, institution.unrelated, { factionId: EIP, templateId: 'dahai:field-rotations:site:out' });
assert(institution.score === 1, 'GOV plus EIP introductions add to one shared track');
assert(projectRemainingReviewEvent('estella-institutions', 1.5, 99, { factionId: EDF, templateId: 'gaia:leave-travel:site:out' }).unrelated === 0, 'EDF routine also refreshes shared counter');
for (const provider of RECIPIENT_PROVIDERS) {
  for (const track of [DAEDALUS, BAM, MERREN, 'estella-institutions'] as const) {
    const result = projectRemainingReviewEvent(track, 1.5, 0, { factionId: provider, templateId: 'commercial-job' });
    assert(result.score === 1.5 && result.unrelated === 1, 'recipient neither earns donor credit nor refreshes it');
  }
  const houseRecipient = provider === 'oathmark-accord-authority' || provider === 'wells-noble-houses';
  const state = { ...normalizeReputations(undefined), [houseRecipient ? 'house-nunes' : BAM]: 1.99 };
  assert(employerReputationLevel(state, provider) === 1, 'fractional donor does not round up');
  state[houseRecipient ? 'house-nunes' : BAM] = 2;
  assert(employerReputationLevel(state, provider) === 2, 'recipient recognition reaches 2 without its own meter');
}
for (const track of [BAM, MERREN, 'estella-institutions'] as const) assert(reputationMaxLevel(track) === 2, 'intrinsic two-level cap preserved');
assert(reputationMaxLevel(DAEDALUS) === 3, 'Daedalus third level reserved for authored quests');
const rows = sampleBatchBoards(0, 4), covRows = sampleCovenantBoards(0, 4), serialized = JSON.stringify(rows);
const fit = fitBatchProposal(rows, covRows), summary = auditBatchProposal(rows, fit);
for (const row of rows) {
  const c = row.contract, projected = projectBatchQuote(c, fit);
  assert(projected.minimum >= (remainingReviewPolicy(c)?.trust ?? (projected.work === 'important' ? 1 : 0)), 'economic AND trust access');
  const reimbursement = contractFuelCompensation(c.quote.pay, c.quote.parFuelCost, c.quote.parFuelCost);
  const pay = { ...c.quote.pay, generosity: 0, flatReward: projected.net + c.quote.parFuelCost - reimbursement };
  assert(pay.flatReward >= 0 && contractGrossPay(pay, c.quote.parFuelCost, c.quote.parFuelCost) - c.quote.parFuelCost === projected.net, 'net anchor reconstructs with original reimbursement/cap');
  if (RECIPIENT_PROVIDERS.some(p => p === c.factionId)) assert(projected.net === c.quote.expectedMargin, 'recipient prices left exactly unchanged');
}
assert(JSON.stringify(rows) === serialized, 'projection does not mutate actual quotes/history/identities');
assert(summary.filter(r => NEW_EARNING_PROVIDERS.some(p => p === r.provider)).every(r => r.publicStarterFreight > 0 && r.important.freight > 0), 'actual public entry and important freight for all six providers');
assert(fit.covenant.length === 8, 'Covenant three-band curve');
assert(covenantGentleEntryNet(fit.covenant[0], fit.covenant) === 5000 && covenantGentleEntryNet(fit.covenant[1], fit.covenant) === 5000, 'gentle Covenant shoulder retains median anchor');
let previous = -1;
for (let i = 1; i <= 1000; i++) { const net = covenantGentleEntryNet(i * fit.covenant[5] / 100, fit.covenant); assert(net >= previous, 'Covenant fixed curve stays monotone'); previous = net; }
const career = defaultCareerProfile();
for (const track of [DAEDALUS, BAM, MERREN, 'estella-institutions'] as const) { career.reputations![track] = 1.5; career.reputationUnrelatedContracts![track] = 5; }
for (const { contract } of rows) {
  const level = employerReputationLevel(career.reputations, contract.factionId!)!;
  assert(!!contractReputationLockReasons(career, contract).length === (Math.max(remainingReviewPolicy(contract)?.trust ?? (proposedCovenantClass(contract) === 'provision' ? 0 : 1), incomeEconomicMinimum(contract.factionId, contract.quote.expectedMargin)!) > level), 'live gates meet quoted economic/trust policy');
  const next = previewContractReputation(career, contract);
  for (const track of [DAEDALUS, BAM, MERREN, 'estella-institutions'] as const) {
    const expected = projectRemainingReviewEvent(track, 1.5, 5, contract);
    assert(next.reputations[track] === expected.score && next.reputationUnrelatedContracts[track] === expected.unrelated, 'live shared/own/recipient arithmetic matches review');
  }
}
assert(emptyTravelAccess('deepest-dock-poi') === 'contract-only', 'Farwatch never gets empty access from standing');
assert(emptyTravelAccess('estella-xif-sealed-research-outpost') === 'restricted', 'Icarus trust floor not a public-access grant');
console.log(`Remaining review: ${checks} checks, ${candidates} raw candidates, ${rows.length} actual postings; eighteen remaining providers covered, approved production policy matches review.`);
