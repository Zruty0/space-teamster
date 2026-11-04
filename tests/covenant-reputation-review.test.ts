// Read-only review guards: these tests do not implement Covenant gains, gates or prices.
import { COVENANT, PILGRIM_GATE, COVENANT_DUES_REVIEW_IDS, COVENANT_PASSAGE_REVIEW_IDS,
  proposedCovenantClass, projectCovenantReviewEvent, sampleCovenantBoards, fitProposedCovenantCurve, auditCovenantProposal } from './audit-covenant-reputation';
import { COVENANT_REMNANTS_PROVIDER } from '../src/content/estella/faction-contracts/covenant-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { localTerminalScopeIds } from '../src/local-directory';
import { defaultCareerProfile } from '../src/career-state';
import { generateCareerContracts } from '../src/career-contracts';
import { contractReputationLockReasons, previewContractReputation } from '../src/contract-reputation';
import { normalizeReputations } from '../src/reputation';
import { employerReputationLevel } from '../src/employer-reputation';
import { emptyTravelAccess } from '../src/content/estella/empty-travel-access';
import { incomeEconomicMinimum } from '../src/contract-income';

let checks = 0, candidates = 0;
function assert(value: unknown, text: string): asserts value { checks++; if (!value) throw Error(text); }
const sources = [...new Set(estellaSelectableNavTargets().flatMap(t => localTerminalScopeIds(canonicalEstellaLocationId(t.id))))];
const observed = new Set<string>(), families = new Set<string>(), procurementSources = new Set<string>();
for (let day = 0; day < 32; day++) for (const sourceId of sources) {
  for (const c of COVENANT_REMNANTS_PROVIDER.generateContracts({ sourceId, worldTime: day * 86400 })) {
    candidates++;
    const before = JSON.stringify(c), work = proposedCovenantClass(c);
    assert(work, `unreviewed identity: ${c.templateId}`);
    observed.add(c.templateId); families.add(work);
    assert(before === JSON.stringify(c), 'classifier does not mutate cargo, identities, quotes or consent copy');
    assert(c.maxCompAllowance === 2, 'original fuel compensation cap retained');
    assert(c.compensationRatio === (work === 'dues' ? .85 : work === 'passage' ? .9 : .8), 'family-specific fuel terms retained');
    for (const factionId of ['house-nunes', 'hartwell-shipping-companies', 'steel-combine', 'cerberus-human-resources']) {
      assert(!proposedCovenantClass({ ...c, factionId }), 'credit follows employer, not destination, supplier or cargo label');
    }
    if (work === 'provision') {
      procurementSources.add(c.sourceId);
      assert(c.destinationId === PILGRIM_GATE && c.category !== 'passenger', 'essential imports terminate at the public membrane');
      assert(c.issuerId?.includes('toil') || c.issuerId?.includes('genesis'), 'existing orders, not new military or Seal freight');
    } else if (work === 'dues') {
      assert(c.sourceId === PILGRIM_GATE && c.destinationId === 'estella-xiid-black-project-exile' && c.category !== 'passenger', 'freight-only advancement alternative to passengers');
    } else if (work === 'service') {
      assert(c.sourceId === PILGRIM_GATE && c.destinationId === 'estella-xiid-mirror-clinic' && c.category === 'passenger', 'compact medical service unchanged');
    } else {
      assert(c.destinationId === PILGRIM_GATE && c.category === 'passenger', 'passage ends at Pilgrim Gate, not internal settlements');
      if (c.templateId === COVENANT_PASSAGE_REVIEW_IDS[0]) {
        assert(c.details?.includes('unsealed and outside Covenant custody') && c.details?.includes('notaries'), 'notarized pre-custody declarations preserved');
        assert(c.completionMessage?.includes('unsealed house'), 'delivery is not implantation or a Seal quest');
      }
    }
  }
}
assert(families.size === 4 && procurementSources.size === 12, 'four legal families / twelve procurement sources');
assert(COVENANT_DUES_REVIEW_IDS.every(id => observed.has(id)) && COVENANT_PASSAGE_REVIEW_IDS.every(id => observed.has(id))
  && observed.has('compact-service-genesis-mirror-clinic'), 'all thirteen selected important identities observed');
assert(!proposedCovenantClass({ factionId: COVENANT, templateId: 'seal-succession' }), 'future Seal quest not guessed into ordinary progression');
const provision = { factionId: COVENANT, templateId: 'provision-estella-xid-main-port-toil' };
const dues = { factionId: COVENANT, templateId: COVENANT_DUES_REVIEW_IDS[0] };
let state = projectCovenantReviewEvent(0, 0, provision);
assert(state.score === 1 && state.unrelated === 0, 'one import establishes Guest at the Gate before compact backhaul');
for (let i = 1; i <= 15; i++) {
  state = projectCovenantReviewEvent(state.score, state.unrelated, dues);
  assert(Math.abs(state.score - (1 + i / 15)) < 1e-12, 'fifteen important freight jobs reach 2 without passengers');
}
assert(state.score === 2 && projectCovenantReviewEvent(2, 99, dues).score === 2, 'ordinary work cannot grant Unsealed Kindred');
assert(projectCovenantReviewEvent(.5, 1, dues).score === 1, 'legacy accepted important work caps introduction with no simultaneous advanced gain');
state = { score: 1.5, unrelated: 0 };
for (let i = 1; i <= 5; i++) {
  state = projectCovenantReviewEvent(state.score, state.unrelated, {});
  assert(state.score === 1.5 && state.unrelated === i, 'five unrelated completions free');
}
assert(projectCovenantReviewEvent(state.score, state.unrelated, {}).score === 88 / 60, 'sixth unrelated completion starts 1/30 decay');
assert(projectCovenantReviewEvent(1.01, 5, {}).score === 1, 'floor protected');
assert(projectCovenantReviewEvent(.5, 99, {}).score === .5, 'no erosion below 1');
assert(projectCovenantReviewEvent(1.5, 99, provision).score === 1.5 && projectCovenantReviewEvent(1.5, 99, provision).unrelated === 0, 'routine imports maintain without advancing');
assert(projectCovenantReviewEvent(1.234567, 0, dues).score === 1.234567 + 1 / 15, 'arbitrary legacy fractions not rounded');
for (const c of [{ category: 'empty' }, { travelMode: 'old-nell' }]) {
  assert(JSON.stringify(projectCovenantReviewEvent(1.5, 5, c)) === JSON.stringify({ score: 1.5, unrelated: 5 }), 'empty travel excluded');
}
const rows = sampleCovenantBoards(0, 4), before = JSON.stringify(rows);
const curve = fitProposedCovenantCurve(rows), audit = auditCovenantProposal(rows, curve);
assert(before === JSON.stringify(rows), 'projection leaves actual postings/prices untouched');
assert(audit.important.min === 5000 && audit.important.max === 5000 && audit.important.minimums[0] === 1, 'important income and trust independent');
assert(audit.important.freight > 0 && audit.starterFreight > 0, 'freight entry and freight advancement observed');
assert(audit.starterSources.some(s => s.emptyAccess === 'public'), 'entry does not rely solely on private Frostglass');
assert(audit.important.gateDuesDays.length === 4, 'dues present throughout sampled days, not a flown loop');
for (const [net, level] of [[15000, 0], [15001, 1], [37500, 1], [37501, 2]]) {
  assert(incomeEconomicMinimum(COVENANT, net) === level, 'approved ceilings retain equality in lower band');
}
const career = defaultCareerProfile();
career.reputations = { ...normalizeReputations(undefined), 'covenant-remnants': 1.5 };
career.reputationUnrelatedContracts = { 'covenant-remnants': 5 };
for (const { contract } of rows) {
  assert(contractReputationLockReasons(career, contract).length === 0, 'new Covenant locks remain inactive');
  const next = previewContractReputation(career, contract);
  assert(next.reputations['covenant-remnants'] === 1.5 && next.reputationUnrelatedContracts['covenant-remnants'] === 5, 'review has not activated Covenant gains/decay');
  assert(next.reputations['house-nunes'] === 0, 'compact service does not grant Nunes employment credit');
}
assert(employerReputationLevel({ ...normalizeReputations(undefined), 'house-nunes': 3 }, COVENANT) === 0, 'Nunes protection is not inherited Covenant recognition');
assert(emptyTravelAccess(PILGRIM_GATE) === 'public', 'public gate access does not require standing');
for (const id of ['estella-xiia-deep-ice-mine', 'estella-xiia-isolated-settlement', 'estella-xiib-outpost', 'estella-xiid-black-project-exile']) {
  assert(emptyTravelAccess(id) === 'restricted', 'no interior/private access rewards');
}
assert(emptyTravelAccess('estella-xiid-mirror-clinic') === 'unlisted', 'medical contract does not globally expose Mirror Clinic');
assert(emptyTravelAccess('arkfall-apocrypha-cache-poi') === 'unlisted', 'no hidden smuggling access inferred');
const exits = generateCareerContracts(PILGRIM_GATE, 0).filter(c => c.factionId !== COVENANT);
assert(exits.length > 0, 'other-employer exits observed, not an affordability or qualification guarantee');
console.log(`Covenant review: ${checks} checks, ${candidates} raw candidates, ${rows.length} actual postings, thirteen important identities; production unchanged.`);
console.log('Gate day-0 other-employer freight:', exits.map(c => ({ faction: c.factionId, destination: c.destinationId,
  qualification: c.requiredCertification ?? 'none', quotedEconomicMinimum: incomeEconomicMinimum(c.factionId, c.quote.expectedMargin) })));
