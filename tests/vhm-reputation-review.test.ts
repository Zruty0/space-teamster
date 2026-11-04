// Review classifiers/projection only; runtime VHM/BFS progression is intentionally still off.
import { BFS, VHM, proposedVhmClass, sampleVhmBoards, fitProposedBfsCurve, auditVhmProposal } from './audit-vhm-reputation';
import { BRUCKNER_FIELD_SERVICES_PROVIDER } from '../src/content/estella/faction-contracts/bruckner-contracts';
import { VOSS_HEINKEL_METRICWERKE_PROVIDER } from '../src/content/estella/faction-contracts/vhm-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { localTerminalScopeIds } from '../src/local-directory';
import { defaultCareerProfile } from '../src/career-state';
import { contractReputationLockReasons, previewContractReputation } from '../src/contract-reputation';
import { normalizeReputations } from '../src/reputation';
import { canTravelEmpty } from '../src/empty-runs';

let checks = 0, candidates = 0;
function assert(value: unknown, text: string): asserts value { checks++; if (!value) throw Error(text); }
const sources = [...new Set(estellaSelectableNavTargets().flatMap(t => localTerminalScopeIds(canonicalEstellaLocationId(t.id))))];
const importantIds = new Set<string>(), families = new Set<string>();
for (let day = 0; day < 16; day++) for (const sourceId of sources) {
  for (const provider of [BRUCKNER_FIELD_SERVICES_PROVIDER, VOSS_HEINKEL_METRICWERKE_PROVIDER]) {
    for (const c of provider.generateContracts({ sourceId, worldTime: day * 86400 })) {
      candidates++;
      const before = JSON.stringify(c), work = proposedVhmClass(c);
      assert(work !== undefined, `known raw class: ${c.templateId}`);
      assert(before === JSON.stringify(c), 'classification does not mutate source content');
      assert(!proposedVhmClass({ ...c, factionId: 'kisaragi-yards-estella' }), 'other employer does not borrow VHM progression');
      if (work === 'important') importantIds.add(c.templateId);
      if (c.factionId === VHM) assert(work === 'direct' && c.compensationRatio === 0, 'every direct VHM family keeps no reimbursement');
      families.add(`${c.factionId}/${c.templateId.split(':')[0]}`);
    }
  }
}
assert(importantIds.size === 19, 'all 3 critical variants on 5 return lanes plus 4 specialist crew variants observed');
assert(families.size === 14, 'all ten BFS / four direct VHM lane families observed');
for (const templateId of ['leaf-return-to-subhub:failed-drive-service-returns', 'leaf-return-to-hub:sealed-telemetry-return-lots',
  'crew-direct:bruckner-field-technician-team', 'crew-direct:drive-alignment-crew', 'import-feeder:sealed-warranty-replacement-lots']) {
  assert(proposedVhmClass({ factionId: BFS, templateId }) === 'commercial', 'ordinary stock, general returns and technician transport stay commercial');
}
assert(!proposedVhmClass({ factionId: BFS, templateId: 'invented-lane' }), 'unknown future lane not silently classified');
const rows = sampleVhmBoards(0, 1), before = JSON.stringify(rows);
const curve = fitProposedBfsCurve(rows), audit = auditVhmProposal(rows, curve);
assert(JSON.stringify(rows) === before, 'candidate curve/reporting never changes actual quotes');
assert(audit.important.min === 10000 && audit.important.max === 10000 && audit.important.minimums[0] === 1, 'important low-pay/trust-1 pool separated');
assert(audit.direct.minimums.length === 1 && audit.direct.minimums[0] === 2, 'all direct work proposed at 2 regardless of pay');
assert(audit.direct.compensationRatios.length === 1 && audit.direct.compensationRatios[0] === 0, 'no new direct fuel reimbursement');
assert(audit.starterFreight > 0 && audit.important.freight > 0, 'actual freight supply for introduction and advanced work');
const career = defaultCareerProfile();
career.reputations = { ...normalizeReputations(undefined), [VHM]: 1.5 };
career.reputationUnrelatedContracts = { [VHM]: 5 };
for (const row of rows) {
  assert(!contractReputationLockReasons(career, row.contract).length, 'review does not activate actual gates');
  const next = previewContractReputation(career, row.contract);
  assert(next.reputations[VHM] === 1.5 && next.reputationUnrelatedContracts[VHM] === 5, 'review does not activate awards or grace reset');
}
assert(canTravelEmpty(career, 'estella-viii-harder-approach-station'), 'depot has public operational arrival, not a new reputation perk');
assert(!canTravelEmpty(career, 'deepest-dock-poi'), 'Farwatch remains contract-only despite network work');
console.log(`VHM/BFS review: ${checks} checks, ${candidates} raw candidates, ${importantIds.size} important identities, ${rows.length} live postings; no production progression/gates changed.`);
