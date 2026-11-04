// Retained review oracle and live Kisaragi regression guards.
import { incomeEconomicMinimum } from '../src/contract-income';
import { KIS, KISE, KISARAGI_IMPORTANT_REVIEW_IDS, proposedKisaragiClass, projectKisaragiReviewEvent, sampleKisaragiBoards, fitProposedKiseCurve, auditKisaragiProposal } from './audit-kisaragi-reputation';
import { KISARAGI_HARMONY_YARDS_PROVIDER } from '../src/content/estella/faction-contracts/kisaragi-contracts';
import { KISARAGI_YARDS_ESTELLA_PROVIDER } from '../src/content/estella/faction-contracts/kisaragi-estella-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { localTerminalScopeIds } from '../src/local-directory';
import { defaultCareerProfile } from '../src/career-state';
import { contractReputationLockReasons, previewContractReputation } from '../src/contract-reputation';
import { normalizeReputations } from '../src/reputation';
import { employerReputationLevel } from '../src/employer-reputation';
import { canTravelEmpty } from '../src/empty-runs';

let checks = 0, candidates = 0, balorOrders = 0;
function assert(value: unknown, text: string): asserts value { checks++; if (!value) throw Error(text); }
const sources = [...new Set(estellaSelectableNavTargets().flatMap(t => localTerminalScopeIds(canonicalEstellaLocationId(t.id))))];
const importantIds = new Set<string>(), families = new Set<string>();
for (let day = 0; day < 16; day++) for (const sourceId of sources) {
  for (const provider of [KISARAGI_HARMONY_YARDS_PROVIDER, KISARAGI_YARDS_ESTELLA_PROVIDER]) {
    for (const c of provider.generateContracts({ sourceId, worldTime: day * 86400 })) {
      candidates++;
      const before = JSON.stringify(c), work = proposedKisaragiClass(c);
      assert(work, `review covers ${c.factionId}/${c.templateId}`);
      assert(JSON.stringify(c) === before, 'no quote/identity/seed/copy mutation');
      for (const factionId of ['svarog-yard-company', 'oathmark-accord', 'balor-advanced-materials', 'house-mendes']) {
        assert(!proposedKisaragiClass({ ...c, factionId }), 'landlord, supplier or local House is not automatically a Kisaragi employer');
      }
      if (work === 'important') importantIds.add(c.templateId);
      families.add(`${c.factionId}/${c.templateId.split(':')[0]}`);
      if (c.factionId === KIS) assert(work === 'direct' && c.compensationRatio === 0, 'parent retains direct class and zero reimbursement');
      else {
        assert(c.category !== 'passenger' && c.compensationRatio === .45, 'local subsidiary remains freight-only with original compensation');
        assert(!c.cargo.label.includes('Celadon'), 'no invented local finished Celadon production');
        if (c.templateId.startsWith('balor-trade:')) {
          balorOrders++;
          assert(work === 'commercial' && c.templateId.startsWith('balor-trade:tenant-fit-out-purchase:'), 'BAM-sourced KIS-E procurement stays KIS-E commercial work');
        }
      }
    }
  }
}
assert(importantIds.size === 7 && KISARAGI_IMPORTANT_REVIEW_IDS.every(id => importantIds.has(id)), 'all seven important identities observed in actual raw generation');
assert(families.size === 9 && balorOrders > 0, 'five parent and four local families, including regional Balor purchase lanes');
for (const templateId of ['supplier-to-facility:porcelain-class-pressure-shell-sections',
  'facility-balancing:porcelain-class-unfinished-hull-sections', 'facility-balancing:silk-class-interior-module-lots']) {
  assert(proposedKisaragiClass({ factionId: KISE, templateId }) === 'commercial', 'quality grade/pressure hardware alone does not select importance');
}
for (const tier of ['silk', 'porcelain', 'celadon']) {
  assert(proposedKisaragiClass({ factionId: KIS, templateId: `facility-prestige-transfer:${tier}-class-fit-out-module-crates` }) === 'direct', 'all direct quality classes retain parent trust floor');
}
assert(!proposedKisaragiClass({ factionId: KISE, templateId: 'new-unauthored-programme' }), 'unknown future lane needs review');
assert(!proposedKisaragiClass({ factionId: KISE, templateId: 'balor-trade:invented-purchase:port:cargo' }), 'only the authored regional purchase family is included');
const important = { factionId: KISE, templateId: KISARAGI_IMPORTANT_REVIEW_IDS[0] };
const ordinary = { factionId: KISE, templateId: 'supplier-to-facility:silk-class-stock' };
const direct = { factionId: KIS, templateId: 'prestige-records:acceptance' };
let state = { score: 0, unrelated: 0 };
for (let i = 1; i <= 4; i++) {
  state = projectKisaragiReviewEvent(state.score, state.unrelated, important);
  assert(state.score === i / 4 && state.unrelated === 0, 'four introductory jobs; important work gets no extra advanced credit below 1');
}
for (let i = 1; i <= 20; i++) {
  state = projectKisaragiReviewEvent(state.score, state.unrelated, important);
  assert(state.score === 1 + i / 20, 'twenty important jobs reach exactly 2');
}
assert(projectKisaragiReviewEvent(2, 99, important).score === 2, 'ordinary work never grants 3');
for (const c of [ordinary, direct]) {
  const next = projectKisaragiReviewEvent(1.5, 99, c);
  assert(next.score === 1.5 && next.unrelated === 0, 'both related providers maintain and refresh, not advance');
}
assert(projectKisaragiReviewEvent(.9, 4, direct).score === 1, 'legacy accepted parent job receives capped introduction');
state = { score: 1.5, unrelated: 0 };
for (let i = 1; i <= 10; i++) {
  state = projectKisaragiReviewEvent(state.score, state.unrelated, {});
  assert(state.score === 1.5 && state.unrelated === i, 'ten unrelated completions free');
}
state = projectKisaragiReviewEvent(state.score, state.unrelated, {});
assert(state.score === 1.48 && state.unrelated === 11, 'eleventh completion starts 1/50 decay');
assert(projectKisaragiReviewEvent(1.01, 11, {}).score === 1, 'integer floor protected');
assert(projectKisaragiReviewEvent(.75, 11, {}).score === .75, 'no decay below 1');
assert(projectKisaragiReviewEvent(2, 11, {}).score === 2, 'established level 2 protected');
for (const c of [{ category: 'empty' }, { travelMode: 'old-nell' }]) {
  assert(JSON.stringify(projectKisaragiReviewEvent(1.5, 10, c)) === JSON.stringify({ score: 1.5, unrelated: 10 }), 'empty/Old Nell excluded');
}
assert(projectKisaragiReviewEvent(1.234567, 0, important).score === 1.234567 + .05, 'off-grid saved fraction not rounded');
const rows = sampleKisaragiBoards(0, 1), before = JSON.stringify(rows);
const curve = fitProposedKiseCurve(rows), audit = auditKisaragiProposal(rows, curve);
assert(JSON.stringify(rows) === before, 'projection never reprices actual contracts');
assert(audit.important.count > 0 && audit.important.min === 10000 && audit.important.max === 10000 && audit.important.minimums[0] === 1, 'important 10k/trust-1 pool is separate');
assert(audit.important.freight === audit.important.count && audit.starterFreight > 0, 'early and important work do not require a passenger route');
assert(audit.important.uniquePostingIds <= audit.important.count, 'supply audit distinguishes unique IDs from board appearances');
assert(audit.direct.minimums.length === 1 && audit.direct.minimums[0] === 2, 'all parent work is proposed at 2');
const career = defaultCareerProfile();
career.reputations = { ...normalizeReputations(undefined), kisaragi: 1.5 };
career.reputationUnrelatedContracts = { kisaragi: 5 };
assert(employerReputationLevel(career.reputations, KISE) === 1 && employerReputationLevel(career.reputations, KIS) === 1, 'existing recognition uses shared completed Kisaragi level');
const otherCorporate = { ...normalizeReputations(undefined), 'voss-heinkel-metricwerke': 3 };
assert(employerReputationLevel(otherCorporate, KISE) === 0 && employerReputationLevel(otherCorporate, KIS) === 0, 'other corporate recognition cannot bypass this own-track relationship');
for (const row of rows) {
  assert(!!contractReputationLockReasons(career, row.contract).length === (incomeEconomicMinimum(row.contract.factionId, row.contract.quote.expectedMargin)! > 1 || row.contract.factionId === KIS), 'live own/shared gates honor quote and parent floor');
  const next = previewContractReputation(career, row.contract);
  const expected = projectKisaragiReviewEvent(1.5, 5, row.contract);
  assert(next.reputations.kisaragi === expected.score && next.reputationUnrelatedContracts.kisaragi === expected.unrelated, 'live Kisaragi arithmetic matches approved review');
}
for (const id of ['estella-vi-heavy-cargo-station', 'estella-via-component-supply-station', 'estella-via-drydock-station',
  'estella-xie-rare-alloy-extraction', 'estella-xie-outer-spec-drydock']) {
  assert(canTravelEmpty(career, id), 'existing public pickup/receiving interface retained');
}
console.log(`Kisaragi review: ${checks} checks, ${candidates} raw candidates, ${importantIds.size} important identities, ${rows.length} actual postings; production progression/gates match approved review.`);
