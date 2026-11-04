// Bounded route witnesses, not campaign/balance simulations. Prequalified/equipped carrier,
// par fuel, no maintenance/handling losses; report required operating capital instead of gifting it.
import { defaultCareerProfile, TEAMSTER_CERTIFICATION_IDS } from '../src/career-state';
import { createDefaultRigState } from '../src/maintenance/rig-state';
import { createEmptyRun, canTravelEmpty, emptyRunLocationId } from '../src/empty-runs';
import { generateCareerContracts, type CareerContract } from '../src/career-contracts';
import { contractEarningTrack, previewContractReputation, contractReputationLockReasons } from '../src/contract-reputation';
import { emptyTravelAccess } from '../src/content/estella/empty-travel-access';
import { isHouseId } from '../src/contract-work-policy';
import { contractEquipmentRestrictionLabels } from '../src/mission-restrictions';
import { sampleAllBoards } from './audit-contract-gate-coverage';
import type { ReputationId } from '../src/reputation';
const tracks: ReputationId[] = ['house-alvares', 'house-mendes', 'house-nunes', 'voss-heinkel-metricwerke', 'kisaragi',
  'covenant-remnants', 'daedalus-systems', 'balor-advanced-materials', 'merren-conservatory', 'estella-institutions'];
const reference = sampleAllBoards(0, 4);
let checks = 0;
function assert(v: unknown, text: string): asserts v { checks++; if (!v) throw Error(text); }
function arrival(c: CareerContract, now: number) {
  return Math.max(now, c.scheduledStartWorldTime ?? c.selectedTransfer?.waitTime ?? now)
    + (c.selectedTransfer?.transferTime ?? 0) + 3600; // explicit one-hour local/terminal allowance, not simulated flight time
}
const results = [];
for (const track of tracks) {
  let career = defaultCareerProfile(); career.certifications = [...TEAMSTER_CERTIFICATION_IDS]; career.rig = createDefaultRigState(true);
  const terminals = new Map<string, string>();
  for (const row of reference.filter(r => (contractEarningTrack(r.contract) === track || (isHouseId(track) && isHouseId(r.contract.factionId))) && r.contract.category === 'freight')) {
    const physical = emptyRunLocationId(row.boardSource);
    if (!terminals.has(physical) || emptyTravelAccess(row.boardSource) === 'public') terminals.set(physical, row.boardSource);
  }
  const sources = [...terminals.values()];
  let income = 0, reposition = 0, balance = 0, minimumBalance = 0, jobs = 0, emptyLegs = 0;
  const path: { id: string; source: string; destination: string; net: number; standing: number }[] = [];
  while (career.reputations![track] < 2 && jobs < 40) {
    const currentScore = career.reputations![track];
    let best: { transfer?: CareerContract; job: CareerContract; time: number; cost: number } | undefined;
    for (const source of [...sources].sort((a, b) => Number(emptyRunLocationId(b) === emptyRunLocationId(career.locationId)) - Number(emptyRunLocationId(a) === emptyRunLocationId(career.locationId)))) {
      const same = emptyRunLocationId(career.locationId) === emptyRunLocationId(source);
      if (!same && !canTravelEmpty(career, source)) continue;
      const transfer = same ? undefined : createEmptyRun(career, source);
      const cost = transfer ? transfer.quote.parFuelCost : 0, time = transfer ? arrival(transfer, career.worldTime) : career.worldTime;
      for (const wait of [0, 1, 2, 4, 8, 16]) {
        const at = time + wait * 86400;
        const job = generateCareerContracts(source, at, career.nunesInquiries).find(c => (contractEarningTrack(c) === track || (isHouseId(track) && isHouseId(c.factionId)))
          && !contractReputationLockReasons(career, c).length && !contractEquipmentRestrictionLabels(c, career.rig).length
          && (!c.requiredCertification || career.certifications.includes(c.requiredCertification))
          && previewContractReputation(career, c).reputations[track] > currentScore);
        if (job && (!best || cost < best.cost || (cost === best.cost && at < best.time))) best = { transfer, job, cost, time: at };
        if (job) break;
      }
      if (best) break; // bounded first legal witness, deliberately not an optimal route planner
    }
    assert(best, `No legal freight advancement witness for ${track} at ${currentScore}`);
    if (best.transfer) {
      assert(!contractEquipmentRestrictionLabels(best.transfer, career.rig).length, 'empty reposition has installed equipment');
      balance -= best.cost; reposition += best.cost; emptyLegs++;
      minimumBalance = Math.min(minimumBalance, balance);
      career.locationId = best.transfer.destinationId;
    }
    const next = previewContractReputation(career, best.job);
    income += best.job.quote.expectedMargin; balance += best.job.quote.expectedMargin;
    career.reputations = next.reputations; career.reputationUnrelatedContracts = next.reputationUnrelatedContracts;
    career.locationId = best.job.destinationId; career.worldTime = arrival(best.job, best.time); jobs++;
    path.push({ id: best.job.id, source: best.job.sourceId, destination: best.job.destinationId, net: best.job.quote.expectedMargin, standing: career.reputations[track] });
  }
  assert(career.reputations![track] === 2, 'ordinary authored work reaches exactly 2, never quest rank');
  const requiredOperatingCapital = -minimumBalance;
  assert(requiredOperatingCapital + balance >= 0, 'finite disclosed starting capital funds all modeled repositioning, no free teleport');
  console.error(`Route witness ${track}: ${jobs} jobs, required capital ${requiredOperatingCapital}`);
  results.push({ track, jobs, emptyLegs, days: Math.ceil(career.worldTime / 86400), income, reposition, requiredOperatingCapital,
    first: path[0], last: path[path.length - 1] });
}
console.log(JSON.stringify({ status: 'ROUTE WITNESSES ONLY: fully qualified/equipped, par fuel, no wear/penalties; capital must be earned elsewhere; no flown campaign claim', checks, results }, null, 2));
