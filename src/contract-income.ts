import type { CareerContract } from './career-contracts';
import { combineContractClass, cerberusContractClass } from './contract-work';
import { EMPLOYER_REPUTATION_PROVIDER_KEYS } from './employer-reputation';
import { contractFuelCompensation, contractGrossPay, type MissionCostQuote } from './mission-cost';
import { CONTRACT_INCOME_CURVES, CERBERUS_PREMIUM_CURVE, DAEDALUS_PREMIUM_CURVE } from './contract-income-curves';
import { contractWorkPolicy } from './contract-work-policy';
import { physicalTerminalId } from './physical-terminals';
import { ORIGIN_INCOME_CURVES, ORIGIN_ROUTE_WORKLOADS, ORIGIN_EMPLOYER_FEES } from './contract-income-origin-curves';
import { originIncomePosition, originIncomeCredits } from './origin-income-math';

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

/** Important assignments are separate low-paying pools, never part of the commercial 20/60/20 mix. */
export function incomeCalibrationKind(contract: IncomeIdentity): 'ordinary' | 'single' | 'important' | undefined {
  if (contract.category === 'empty' || contract.category === 'certification' || contract.travelMode === 'old-nell' || contract.nunesInquiry) return undefined;
  const id = incomeTargetId(contract.factionId);
  if (!id) return undefined;
  if (id === 'STEEL') return combineContractClass(contract) === 'export' ? 'single' : undefined;
  if (contractWorkPolicy(contract)?.importantNet !== undefined) return 'important';
  return id === 'VHM' || id === 'KIS' ? 'single' : 'ordinary';
}

/** Shared quoted-income AND authored-trust gate. Inquiry pricing exclusion is not an access exemption. */
export function contractIncomeMinimum(contract: IncomeIdentity & Pick<CareerContract, 'quote'>, authoredTrustMinimum: IncomeLevel = 0): IncomeLevel | undefined {
  if (contract.category === 'empty' || contract.category === 'certification' || contract.travelMode === 'old-nell') return undefined;
  const economic = incomeEconomicMinimum(contract.factionId, contract.quote.expectedMargin);
  if (economic === undefined) return undefined;
  const id = incomeTargetId(contract.factionId);
  const work = combineContractClass(contract);
  const chr = cerberusContractClass(contract);
  const trust = id === 'VHM' || id === 'KIS' || work === 'export' || chr === 'entrusted-commercial' ? 2
    : work === 'important' || work === 'elevated-routine' || chr === 'important' ? 1 : 0;
  return Math.max(economic, trust, contractWorkPolicy(contract)?.trust ?? 0, authoredTrustMinimum) as IncomeLevel;
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

/** Stable entry shoulders for the broad-reference pools; no live-board fitting. */
export function gentleEntryNetCredits(id: IncomeTargetId, fuel: number, curve: IncomeCurve, upperSlope = .5): number {
  const median = CONTRACT_INCOME_TARGETS[id][0]!;
  return Math.min(incomeBoundaries(id)![0], Math.round(fuel < curve[0] ? median * Math.sqrt(fuel / curve[0])
    : fuel > curve[1] ? median * (1 + upperSlope * Math.log2(fuel / curve[1])) : median));
}
/** Provider-wide baseline/fallback and preserved entrusted pricing. New ordinary offers use
 * originContractNetCredits below; this function alone is not the current local-market quote. */
export function ordinaryContractNetCredits(contract: IncomeIdentity, fuel: number): number {
  if (!Number.isFinite(fuel) || fuel < 0) throw new Error('Invalid income workload.');
  const provider = contract.factionId!, id = incomeTargetId(provider)!, curve = CONTRACT_INCOME_CURVES[provider];
  if (!curve) throw new Error(`Missing income calibration: ${provider}`);
  if (id === 'CHR' && (cerberusContractClass(contract) === 'entrusted-commercial' || (curve.length === 8 && fuel > curve[5]))) return cerberusPremiumNetCredits(fuel);
  if (id === 'DAEDALUS' && (contractWorkPolicy(contract)?.trust === 2 || (curve.length === 8 && fuel > curve[5]))) {
    const [lo, hi] = DAEDALUS_PREMIUM_CURVE, floor = incomeBoundaries(id)![1] + 1, median = CONTRACT_INCOME_TARGETS[id][2];
    return Math.round(fuel < lo ? floor + (median - floor) * Math.sqrt(fuel / lo)
      : fuel > hi ? median + (median - floor) * Math.log2(fuel / hi) : median);
  }
  if (curve.length === 8 && fuel <= curve[2]) {
    if (id === 'CHR') return cerberusEntryNetCredits(fuel);
    if (provider === 'covenant-remnants' || provider === 'estella-government' || provider === 'sahra-civilian-bookings') return gentleEntryNetCredits(id, fuel, curve, provider === 'estella-government' ? .1 : .5);
  }
  return calibratedNetCredits(id, fuel, curve);
}

/** Origin-aware pricing for ordinary, trust-zero work. Local workload bands and employer fee
 * medians are separate: a high launch cost alone must not exclude all entry work at a port.
 * Directory aliases share a physical market; surface/orbital departures remain separate.
 * Reference route workload (not today's transfer fuel) prevents seasonal starter starvation.
 * Real par/actual fuel accounting is untouched; the fixed-pay component absorbs the difference.
 */
export function originContractNetCredits(contract: IncomeIdentity, quote: MissionCostQuote): number {
  const network = ordinaryContractNetCredits(contract, quote.parFuelCost);
  // Covenant imports retain their separately reviewed curve: pooling bulky provisions with
  // unrelated shippers erased its public introduction offers and its compact premium pool.
  if (incomeCalibrationKind(contract) !== 'ordinary' || contractWorkPolicy(contract)?.trust !== 0
    || contract.factionId === 'covenant-remnants') return network;
  const source = physicalTerminalId(quote.sourceId), destination = physicalTerminalId(quote.destinationId);
  const key = `${source}|${contract.category === 'passenger' ? 'passenger' : 'freight'}`;
  const curve = ORIGIN_INCOME_CURVES[key], fees = ORIGIN_EMPLOYER_FEES[contract.factionId!];
  // New/unrepresented markets retain the prior fixed provider policy and are exposed by audits.
  if (!curve || !fees) return network;
  if (!Number.isFinite(quote.loadedMassTons) || quote.loadedMassTons <= 0) throw new Error('Invalid income load.');
  const reference = ORIGIN_ROUTE_WORKLOADS[`${source}|${destination}`];
  const workload = reference === undefined ? quote.parFuelCost : Math.round(reference * quote.loadedMassTons);
  const target = incomeTargetId(contract.factionId)!;
  const local = originIncomeCredits(originIncomePosition(workload, curve),
    CONTRACT_INCOME_TARGETS[target] as readonly number[], incomeBoundaries(target)!, fees);
  return local;
}

/** New-offer construction only. Never run on load, acceptance, retries or settlement.
 * The credited fixed amount includes unreimbursed par fuel; old ordinary fee components are
 * replaced, NOT added again. Original reimbursement ratio/cap and every route/cargo field survive.
 */
export function calibrateNewContractQuote(contract: IncomeIdentity, quote: MissionCostQuote): MissionCostQuote {
  const kind = incomeCalibrationKind(contract);
  if (!kind) return quote;
  if (!Number.isFinite(quote.parFuelCost) || quote.parFuelCost < 0) throw new Error('Invalid income workload.');
  const net = kind === 'important' ? contractWorkPolicy(contract)!.importantNet!
    : originContractNetCredits(contract, quote);
  const reimbursement = contractFuelCompensation(quote.pay, quote.parFuelCost, quote.parFuelCost);
  const fixed = net + quote.parFuelCost - reimbursement;
  if (!Number.isFinite(fixed) || fixed < 0) throw new Error('Income calibration requires review of fuel reimbursement.');
  const pay = { ...quote.pay, generosity: 0, flatReward: fixed };
  const grossPay = contractGrossPay(pay, quote.parFuelCost, quote.parFuelCost);
  return { ...quote, pay, generosity: 0, grossPay, expectedMargin: grossPay - quote.parFuelCost };
}
