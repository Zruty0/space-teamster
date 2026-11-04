// Review-only classifier/supply guards, not a live Kisaragi progression implementation.
import { KIS, KISE, KISARAGI_IMPORTANT_REVIEW_IDS, proposedKisaragiClass, sampleKisaragiBoards, fitProposedKiseCurve, auditKisaragiProposal } from './audit-kisaragi-reputation';
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
  assert(contractReputationLockReasons(career, row.contract).length === 0, 'review has not activated Kisaragi gates');
  const next = previewContractReputation(career, row.contract);
  assert(next.reputations.kisaragi === 1.5 && next.reputationUnrelatedContracts.kisaragi === 5, 'review has not activated gains/decay/refresh');
}
for (const id of ['estella-vi-heavy-cargo-station', 'estella-via-component-supply-station', 'estella-via-drydock-station',
  'estella-xie-rare-alloy-extraction', 'estella-xie-outer-spec-drydock']) {
  assert(canTravelEmpty(career, id), 'existing public pickup/receiving interface retained');
}
console.log(`Kisaragi review: ${checks} checks, ${candidates} raw candidates, ${importantIds.size} important identities, ${rows.length} actual postings; production progression/gates unchanged.`);
