// Full contract-coverage audit/projection only; not imported by production.
import { generateDirectoryEntryContracts, type CareerContract } from '../src/career-contracts';
import { normalizeReputations } from '../src/reputation';
import { employerReputationLevel, EMPLOYER_REPUTATION_PROVIDER_KEYS } from '../src/employer-reputation';
import { contractReputationLockReasons } from '../src/contract-reputation';
import { combineContractClass, cerberusContractClass } from '../src/contract-work';
import { incomeTargetId, incomeBoundaries, calibrateNewContractQuote, calibratedNetCredits, type IncomeTargetId, type IncomeCurve } from '../src/contract-income';
import { LOCAL_DIRECTORY_ENTRIES } from '../src/local-directory';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { emptyTravelAccess } from '../src/content/estella/empty-travel-access';
import type { TeamsterCertificationId } from '../src/career-state';
import { sampleIncomeBoards, fitIncomeCurve, incomeStats, type IncomeSample } from './audit-contract-income';
import { proposedHouseClass, isHouseId, fitProposedHouseCurves, type HouseId } from './audit-house-reputation';
import { proposedVhmClass, BFS, VHM, fitProposedBfsCurve } from './audit-vhm-reputation';
import { proposedKisaragiClass, KIS, KISE, fitProposedKiseCurve } from './audit-kisaragi-reputation';
import { proposedCovenantClass } from './audit-covenant-reputation';
import { remainingReviewPolicy, BATCH_PROVIDERS, fitBatchProposal, projectBatchQuote, type BatchFit } from './audit-remaining-reputation';

export const CIVILIAN_RECOGNITION_PROVIDERS = ['gaia-civilian-bookings', 'dahai-civilian-bookings',
  'camps-civilian-bookings', 'sahra-civilian-bookings', 'weymark-independent-operators'] as const;
export const ADDITIONAL_PRICING_PROVIDERS = [...CIVILIAN_RECOGNITION_PROVIDERS, 'teamsters-guild'];
export interface GateCoverage {
  kind: 'paid' | 'empty' | 'certification' | 'old-nell';
  recognition?: string;
  target?: IncomeTargetId;
  trust: number;
  importantNet?: number;
  priceException?: 'inquiry' | 'combine';
}
/** All paid work gets an explicit policy; unknown issuers are audit errors, never default level zero. */
export function contractGateCoverage(c: Pick<CareerContract, 'factionId' | 'templateId' | 'category' | 'travelMode' | 'nunesInquiry'>): GateCoverage {
  if (c.category === 'empty' && c.templateId === 'empty-run' && !c.factionId) return { kind: 'empty', trust: 0 };
  if (c.factionId === 'teamsters-guild' && c.travelMode === 'old-nell') return { kind: 'old-nell', trust: 0 };
  if (c.factionId === 'teamsters-guild' && c.category === 'certification') return { kind: 'certification', trust: 0 };
  if (c.category === 'empty' || c.category === 'certification' || c.travelMode === 'old-nell') throw Error('Unknown noncommercial contract exception');
  const p = c.factionId ?? '';
  if (CIVILIAN_RECOGNITION_PROVIDERS.some(id => id === p)) return { kind: 'paid', recognition: 'GOV', target: 'INSTITUTIONS', trust: 0 };
  // Recommendation for paid Guild operations: ordinary commercial recognition, NOT a new Guild meter or GOV ownership.
  if (p === 'teamsters-guild') return { kind: 'paid', recognition: 'COMMERCIAL', target: 'COMMERCIAL', trust: 0 };
  if (!Object.prototype.hasOwnProperty.call(EMPLOYER_REPUTATION_PROVIDER_KEYS, p)) throw Error(`Unassigned paid contract provider: ${p || '<missing>'}`);
  const base: GateCoverage = { kind: 'paid', recognition: p, target: incomeTargetId(p), trust: 0 };
  if (p === 'steel-combine') {
    const work = combineContractClass(c); if (!work) throw Error(`Unreviewed Combine identity ${c.templateId}`);
    return { ...base, trust: work === 'export' ? 2 : work === 'basic-routine' ? 0 : 1, priceException: 'combine' };
  }
  if (p === 'cerberus-human-resources') { const work = cerberusContractClass(c); return { ...base, trust: work === 'entrusted-commercial' ? 2 : work === 'important' ? 1 : 0, importantNet: work === 'important' ? 20000 : undefined }; }
  if (isHouseId(p)) {
    const work = proposedHouseClass(c); if (!work) throw Error(`Unreviewed House identity ${c.templateId}`);
    return { ...base, trust: work.trust, importantNet: work.pool === 'important' ? 5000 : undefined, priceException: work.pool === 'inquiry' ? 'inquiry' : undefined };
  }
  if (p === BFS || p === VHM || p === KIS || p === KISE) {
    const work = p === BFS || p === VHM ? proposedVhmClass(c) : proposedKisaragiClass(c);
    if (!work) throw Error(`Unreviewed manufacturer identity ${p}/${c.templateId}`);
    return { ...base, trust: work === 'direct' ? 2 : work === 'important' ? 1 : 0, importantNet: work === 'important' ? 10000 : undefined };
  }
  if (p === 'covenant-remnants') { const work = proposedCovenantClass(c); if (!work) throw Error(`Unreviewed Covenant identity ${c.templateId}`);
    return { ...base, trust: work === 'provision' ? 0 : 1, importantNet: work === 'provision' ? undefined : 5000 }; }
  const remaining = remainingReviewPolicy(c); if (!remaining) throw Error(`Unreviewed paid identity ${p}/${c.templateId}`);
  return { ...base, trust: remaining.trust, importantNet: remaining.importantNet };
}
export function coveredIncomeMinimum(policy: GateCoverage, net: number) {
  if (!Number.isFinite(net)) throw Error('Nonfinite quoted income');
  const caps = policy.target && incomeBoundaries(policy.target);
  return Math.max(policy.trust, !caps || net <= caps[0] ? 0 : net <= caps[1] ? 1 : 2);
}
export interface CoverageFit { batch: BatchFit; houses: Record<HouseId, IncomeCurve>; bfs: IncomeCurve; kise: IncomeCurve; additional: Record<string, IncomeCurve> }
export function fitCoverage(reference: IncomeSample[], covenantReference: IncomeSample[]): CoverageFit {
  return { batch: fitBatchProposal(reference, covenantReference), houses: fitProposedHouseCurves(reference),
    bfs: fitProposedBfsCurve(reference), kise: fitProposedKiseCurve(reference),
    additional: Object.fromEntries(ADDITIONAL_PRICING_PROVIDERS.map(p => [p, fitIncomeCurve(reference.filter(r => r.contract.factionId === p).map(r => r.contract.quote.parFuelCost))])) };
}
export function coveredProjectedNet(c: CareerContract, fit: CoverageFit) {
  const policy = contractGateCoverage(c), p = c.factionId ?? '';
  if (policy.kind !== 'paid' || policy.priceException) return c.quote.expectedMargin;
  if (policy.importantNet !== undefined) return policy.importantNet;
  if (BATCH_PROVIDERS.includes(p)) return projectBatchQuote(c, fit.batch).net;
  const curve = fit.additional[p] ?? (isHouseId(p) ? fit.houses[p] : p === BFS ? fit.bfs : p === KISE ? fit.kise : undefined);
  return curve ? calibratedNetCredits(policy.target!, c.quote.parFuelCost, curve) : c.quote.expectedMargin;
}
export function currentAllQuotes(rows: IncomeSample[]) { return rows.map(r => ({ ...r, contract: { ...r.contract, quote: calibrateNewContractQuote(r.contract, r.contract.quote) } })); }
export function sampleAllBoards(firstDay: number, days: number) { return sampleIncomeBoards(firstDay, days); }
export function sampleContactOffers() {
  const sources = [...new Set(estellaSelectableNavTargets().map(t => canonicalEstellaLocationId(t.id)))];
  const stages: TeamsterCertificationId[][] = [[], ['basic-1'], ['basic-1', 'basic-2'], ['basic-1', 'basic-2', 'basic-3'], ['basic-1', 'basic-2', 'basic-3', 'line']];
  const offers: CareerContract[] = [];
  // Include direct contact/office-action dispatch, not just directory-listed entries:
  // Gid is deliberately hidden remotely but his tutorial feed is reachable through offices.
  for (const source of sources) for (const certs of stages) for (const entry of LOCAL_DIRECTORY_ENTRIES) {
    if (entry.missionTags?.length) offers.push(...generateDirectoryEntryContracts(entry.id, source, 0, certs));
  }
  return { offers, missionEntries: LOCAL_DIRECTORY_ENTRIES.filter(e => e.missionTags?.length).map(e => ({ id: e.id, factionId: e.factionId, tags: e.missionTags })) };
}
export function auditGateCoverage(rows: IncomeSample[], fit: CoverageFit) {
  const zero = { reputations: normalizeReputations(undefined) };
  const projected = rows.map(r => { const policy = contractGateCoverage(r.contract), net = coveredProjectedNet(r.contract, fit);
    return { ...r, policy, net, minimum: coveredIncomeMinimum(policy, net), currentQuoteMinimum: coveredIncomeMinimum(policy, r.contract.quote.expectedMargin),
      currentlyLockedAtZero: contractReputationLockReasons(zero, r.contract).length > 0 }; });
  const providers = [...new Set(projected.map(r => r.contract.factionId!))].sort().map(provider => {
    const pool = projected.filter(r => r.contract.factionId === provider);
    const ordinary = pool.filter(r => r.policy.importantNet === undefined && r.policy.priceException !== 'inquiry');
    const starters = pool.filter(r => r.minimum === 0);
    const bands = [0, 1, 2].map(level => { const at = ordinary.filter(r => r.minimum === level); return { level, ...incomeStats(at.map(r => r.net)), percent: ordinary.length ? Math.round(at.length * 1000 / ordinary.length) / 10 : 0 }; });
    return { provider, recognition: pool[0].policy.recognition, target: pool[0].policy.target, appearances: pool.length,
      currentNet: incomeStats(pool.map(r => r.contract.quote.expectedMargin)), currentGross: incomeStats(pool.map(r => r.contract.quote.grossPay)),
      currentQuotesByRequiredLevel: [0, 1, 2].map(level => pool.filter(r => r.currentQuoteMinimum === level).length),
      missingLiveLocksAtZero: pool.filter(r => r.currentQuoteMinimum > 0 && !r.currentlyLockedAtZero).length,
      projectedBands: bands, importantCount: pool.filter(r => r.policy.importantNet !== undefined).length,
      inquiries: pool.filter(r => r.policy.priceException === 'inquiry').length,
      publicStarterFreight: starters.filter(r => r.contract.category === 'freight' && emptyTravelAccess(r.boardSource) === 'public').length,
      recognitionAtZero: employerReputationLevel(zero.reputations, pool[0].policy.recognition!),
    };
  });
  return { appearances: rows.length, providers, newPoolExamples: projected.filter(r => ADDITIONAL_PRICING_PROVIDERS.includes(r.contract.factionId ?? ''))
    .sort((a, b) => b.contract.quote.expectedMargin - a.contract.quote.expectedMargin).slice(0, 12).map(r => ({ id: r.contract.id, provider: r.contract.factionId,
      source: r.contract.sourceId, destination: r.contract.destinationId, currentNet: r.contract.quote.expectedMargin, currentGross: r.contract.quote.grossPay,
      proposedNet: r.net, minimum: r.minimum })) };
}
