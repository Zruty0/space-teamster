/** Pure fixed-reference local-market math. No current-board counts, pilot standing or randomness. */
export type OriginIncomeCurve = readonly [number] | readonly [number, number, number, number, number, number, number, number];
export type OriginFeeCurve = readonly [number, number, number, number, number, number];
export type OriginIncomePosition = { band: 0 | 1 | 2; workload: number };

/** Compare route/load effort within the departure market, not against cheap launches elsewhere. */
export function originIncomePosition(workload: number, curve: OriginIncomeCurve): OriginIncomePosition {
  if (!Number.isFinite(workload) || workload < 0) throw new Error('Invalid origin income workload.');
  if (curve.length === 1) return { band: 0, workload: workload / curve[0] };
  if (workload <= curve[2]) return { band: 0, workload: workload / ((curve[0] + curve[1]) / 2) };
  if (workload <= curve[5]) return { band: 1, workload: (workload - curve[2]) / ((curve[3] + curve[4]) / 2 - curve[2]) };
  return { band: 2, workload: (workload - curve[5]) / ((curve[6] + curve[7]) / 2 - curve[5]) };
}

/** Employer-specific fee medians are fitted after local band selection. Fuel reimbursement is separate.
 * Entry variation is deliberately gentle; band 1/2 floors preserve the quoted economic AND trust rule.
 */
export function originIncomeCredits(position: OriginIncomePosition, medians: readonly number[],
  boundaries: readonly [number, number], fees: OriginFeeCurve): number {
  const { band, workload: x } = position, median = medians[band], lo = fees[band * 2], hi = fees[band * 2 + 1];
  if (!Number.isFinite(x) || x < 0 || lo <= 0 || hi < lo) throw new Error('Invalid origin fee reference.');
  const floor = band === 0 ? 0 : boundaries[band - 1] + 1;
  let net = x < lo ? floor + (median - floor) * (1 - (1 - x / lo) ** 3)
    : x > hi ? median + (band === 0 ? median * .2 : median - floor) * Math.log2(x / hi) : median;
  if (band === 0 || band === 1) net = Math.min(boundaries[band], net);
  return Math.max(floor, Math.round(net));
}
