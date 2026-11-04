import type { CareerContract } from './career-contracts';
import { combineContractClass, cerberusContractClass } from './contract-work';
import { EMPLOYER_REPUTATION_PROVIDER_KEYS } from './employer-reputation';
import { contractFuelCompensation, contractGrossPay, type MissionCostQuote } from './mission-cost';
import { CONTRACT_INCOME_CURVES, CERBERUS_PREMIUM_CURVE } from './contract-income-curves';

/** Approved net credits at par, not gross pay or per-job guarantees. Null means no such band. */
export const CONTRACT_INCOME_TARGETS = {
  ALVARES: [5_000, 60_000, 100_000], MENDES: [5_000, 50_000, 90_000], NUNES: [5_000, 40_000, 75_000],
  STEEL: [0, 0, 30_000], VHM: [null, null, 300_000], BFS: [10_000, 100_000, 150_000],
  KIS: [null, null, 300_000], 'KIS-E': [10_000, 100_000, 150_000], COVENANT: [5_000, 25_000, 50_000],
  DAEDALUS: [15_000, 175_000, 300_000], CHR: [20_000, 200_000, 300_000], BAM: [20_000, 200_000, 300_000],
  MERREN: [10_000, 100_000, 150_000], INSTITUTIONS: [5_000, 50_000, 100_000], ACCORD: [10_000, 100_000, 150_000],
  NOBLE: [5_000, 30_000, 60_000], HALL: [10_000, 100_000, 150_000], HSC: [8_000, 75_000, 125_000],
  'CO-OP': [10_000, 100_000, 150_000], SSC: [10_000, 100_000, 150_000], COMMERCIAL: [8_000, 75_000, 125_000],
  NOTORIETY: [5_000, 60_000, 100_000],
} as const;
export type IncomeTargetId = keyof typeof CONTRACT_INCOME_TARGETS;
export type IncomeLevel = 0 | 1 | 2;
export type IncomeIdentity = Pick<CareerContract, 'factionId' | 'templateId' | 'category' | 'travelMode' | 'nunesInquiry'>;
export type IncomeCurve = readonly [median0Low: number, median0High: number, boundary0: number,
  median1Low: number, median1High: number, boundary1: number, median2Low: number, median2High: number]
  | readonly [medianLow: number, medianHigh: number];

export function incomeTargetId(provider: string | undefined): IncomeTargetId | undefined {
  if (!provider || !Object.prototype.hasOwnProperty.call(EMPLOYER_REPUTATION_PROVIDER_KEYS, provider)) return undefined;
  const key = EMPLOYER_REPUTATION_PROVIDER_KEYS[provider as keyof typeof EMPLOYER_REPUTATION_PROVIDER_KEYS];
  return key === 'GOV' || key === 'EDF' || key === 'EIP' ? 'INSTITUTIONS' : key;
}

export function incomeBoundaries(id: IncomeTargetId): readonly [number, number] | undefined {
  const [m0, m1, m2] = CONTRACT_INCOME_TARGETS[id];
  if (m0 === null || m1 === null || id === 'STEEL') return undefined;
  return [Math.min(40_000, (m0 + m1) / 2), (m1 + m2) / 2];
}

/** Undefined is unassigned, not an invented level-zero employer. Special trust floors are separate. */
export function incomeEconomicMinimum(provider: string | undefined, netAtPar: number): IncomeLevel | undefined {
  const id = incomeTargetId(provider);
  if (!id || !Number.isFinite(netAtPar)) return undefined;
  const boundaries = incomeBoundaries(id);
  if (!boundaries) return 0;
  return netAtPar <= boundaries[0] ? 0 : netAtPar <= boundaries[1] ? 1 : 2;
}

/** Important CHR assignments are a separate low-paying pool, never part of the 20/60/20 mix.
 * No assumed smuggling provider, Guild, mixed civilian, Inquiry or other important-work policy.
 */
export function incomeCalibrationKind(contract: IncomeIdentity): 'ordinary' | 'single' | 'important' | undefined {
  if (contract.category === 'empty' || contract.category === 'certification' || contract.travelMode === 'old-nell' || contract.nunesInquiry) return undefined;
  const id = incomeTargetId(contract.factionId);
  if (!id) return undefined;
  if (id === 'STEEL') return combineContractClass(contract) === 'export' ? 'single' : undefined;
  if (cerberusContractClass(contract) === 'important') return 'important';
  return id === 'VHM' || id === 'KIS' ? 'single' : 'ordinary';
}

/** Shared gate/audit calculation. Combine/CHR enforcement lives in contract-reputation.ts;
 * the other factions' access/progression remain deferred.
 */
export function contractIncomeMinimum(contract: IncomeIdentity & Pick<CareerContract, 'quote'>, authoredTrustMinimum: IncomeLevel = 0): IncomeLevel | undefined {
  if (contract.category === 'empty' || contract.category === 'certification' || contract.travelMode === 'old-nell' || contract.nunesInquiry) return undefined;
  const economic = incomeEconomicMinimum(contract.factionId, contract.quote.expectedMargin);
  if (economic === undefined) return undefined;
  const id = incomeTargetId(contract.factionId);
  const work = combineContractClass(contract);
  const chr = cerberusContractClass(contract);
  const trust = id === 'VHM' || id === 'KIS' || work === 'export' || chr === 'entrusted-commercial' ? 2
    : work === 'important' || work === 'elevated-routine' || chr === 'important' ? 1 : 0;
  return Math.max(economic, trust, authoredTrustMinimum) as IncomeLevel;
}

function interpolate(x: number, x0: number, y0: number, x1: number, y1: number, towardMedian = false): number {
  const t = (x - x0) / (x1 - x0);
  // Flatten near the target median: small transfer/load changes shouldn't double a starter fee.
  return y0 + (y1 - y0) * (towardMedian ? 1 - (1 - t) ** 3 : t ** 3);
}

/** Fixed reference workload knots: no live-board percentiles, hashes, pilot rank or random premiums.
 * Upper tails grow logarithmically rather than creating an unapproved universal payout clamp.
 */
export function calibratedNetCredits(id: IncomeTargetId, fuel: number, curve: IncomeCurve): number {
  if (!Number.isFinite(fuel) || fuel < 0) throw new Error('Invalid income workload.');
  if (fuel === 0) return 0;
  const [m0, m1, m2] = CONTRACT_INCOME_TARGETS[id];
  if (curve.length === 2) {
    return Math.round(fuel < curve[0] ? m2 * Math.sqrt(fuel / curve[0])
      : fuel > curve[1] ? m2 * (1 + 0.5 * Math.log2(fuel / curve[1])) : m2);
  }
  const boundaries = incomeBoundaries(id);
  if (m0 === null || m1 === null || !boundaries) throw new Error('Income curve does not match employer bands.');
  const [lo0, hi0, cut0, lo1, hi1, cut1, lo2, hi2] = curve;
  const [b0, b1] = boundaries;
  if (fuel <= cut0) return Math.round(fuel < lo0 ? m0 * (1 - (1 - fuel / lo0) ** 3)
    : fuel > hi0 ? interpolate(fuel, hi0, m0, cut0, b0) : m0);
  if (fuel <= cut1) return Math.max(b0 + 1, Math.round(fuel < lo1
    ? interpolate(fuel, cut0, b0, lo1, m1, true) : fuel > hi1 ? interpolate(fuel, hi1, m1, cut1, b1) : m1));
  return Math.max(b1 + 1, Math.round(fuel < lo2 ? interpolate(fuel, cut1, b1, lo2, m2, true)
    : fuel > hi2 ? m2 + (m2 - b1) * Math.log2(fuel / hi2) : m2));
}

/** Entry jobs need not fill the entire 0–40k eligibility band. Gentle variation around 20k
 * avoids near-identical workforce loads swinging the starter median toward the 40k ceiling.
 */
export function cerberusEntryNetCredits(fuel: number): number {
  if (!Number.isFinite(fuel) || fuel < 0) throw new Error('Invalid income workload.');
  const curve = CONTRACT_INCOME_CURVES['cerberus-human-resources'];
  const [lo, hi] = curve, median = CONTRACT_INCOME_TARGETS.CHR[0];
  return Math.round(fuel < lo ? median * Math.sqrt(fuel / lo)
    : fuel > hi ? median * (1 + .5 * Math.log2(fuel / hi)) : median);
}

/** Shared premium pool: entrusted corporate work plus the highest-workload ordinary freight.
 * Its median is fitted over both, so a trust floor cannot distort the 20/60/20 access audit.
 */
export function cerberusPremiumNetCredits(fuel: number): number {
  if (!Number.isFinite(fuel) || fuel < 0) throw new Error('Invalid income workload.');
  const [lo, hi] = CERBERUS_PREMIUM_CURVE, median = CONTRACT_INCOME_TARGETS.CHR[2];
  const floor = incomeBoundaries('CHR')![1] + 1;
  return Math.round(fuel < lo ? floor + (median - floor) * Math.sqrt(fuel / lo)
    : fuel > hi ? median + (median - floor) * Math.log2(fuel / hi) : median);
}

/** New-offer construction only. Never run on load, acceptance, retries or settlement.
 * The credited fixed amount includes unreimbursed par fuel; old ordinary fee components are
 * replaced, NOT added again. Original reimbursement ratio/cap and every route/cargo field survive.
 */
export function calibrateNewContractQuote(contract: IncomeIdentity, quote: MissionCostQuote): MissionCostQuote {
  const kind = incomeCalibrationKind(contract);
  if (!kind) return quote;
  if (!Number.isFinite(quote.parFuelCost) || quote.parFuelCost < 0) throw new Error('Invalid income workload.');
  const id = incomeTargetId(contract.factionId)!;
  const curve: IncomeCurve | undefined = CONTRACT_INCOME_CURVES[contract.factionId!];
  if (!curve) throw new Error(`Missing income calibration: ${contract.factionId}`);
  const chrPremium = id === 'CHR' && (cerberusContractClass(contract) === 'entrusted-commercial'
    || (curve.length === 8 && quote.parFuelCost > curve[5]));
  const net = kind === 'important' ? CONTRACT_INCOME_TARGETS.CHR[0]
    : chrPremium ? cerberusPremiumNetCredits(quote.parFuelCost)
      : id === 'CHR' && curve.length === 8 && quote.parFuelCost <= curve[2] ? cerberusEntryNetCredits(quote.parFuelCost)
        : calibratedNetCredits(id, quote.parFuelCost, curve);
  const reimbursement = contractFuelCompensation(quote.pay, quote.parFuelCost, quote.parFuelCost);
  const fixed = net + quote.parFuelCost - reimbursement;
  if (!Number.isFinite(fixed) || fixed < 0) throw new Error('Income calibration requires review of fuel reimbursement.');
  const pay = { ...quote.pay, generosity: 0, flatReward: fixed };
  const grossPay = contractGrossPay(pay, quote.parFuelCost, quote.parFuelCost);
  return { ...quote, pay, generosity: 0, grossPay, expectedMargin: grossPay - quote.parFuelCost };
}
