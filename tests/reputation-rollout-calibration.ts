// Offline fixed-reference fitting. Never imported by production.
import { fitCoverage, sampleAllBoards } from './audit-contract-gate-coverage';
import { remainingReviewPolicy } from './audit-remaining-reputation';
import { fitIncomeCurve, type IncomeSample } from './audit-contract-income';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { generateFactionContractCandidates } from '../src/content/estella/faction-contracts';
import { localTerminalScopeIds } from '../src/local-directory';
export { sampleAllBoards };
export function focusedBoards(firstDay: number, days: number) {
  const rows: IncomeSample[] = [];
  const selected = (p?: string) => p === 'estella-government' || p === 'sahra-civilian-bookings';
  const sources = [...new Set(estellaSelectableNavTargets().map(t => canonicalEstellaLocationId(t.id)))];
  for (let day = firstDay; day < firstDay + days; day++) for (const boardSource of sources) {
    const worldTime = day * 86400;
    if (!localTerminalScopeIds(boardSource).some(sourceId => generateFactionContractCandidates({ sourceId, worldTime }).some(c => selected(c.factionId)))) continue;
    rows.push(...[...generateCareerContracts(boardSource, worldTime), ...generatePassengerContracts(boardSource, worldTime)]
      .filter(c => selected(c.factionId)).map(contract => ({ day, boardSource, contract })));
  }
  return rows;
}
export function rolloutFit(reference: IncomeSample[], covenant: IncomeSample[], broad: IncomeSample[]) {
  const fit = fitCoverage(reference.filter(r => r.day < 16), covenant);
  fit.batch.curves['estella-government'] = fitIncomeCurve(broad.filter(r => r.contract.factionId === 'estella-government'
    && remainingReviewPolicy(r.contract)?.work === 'commercial').map(r => r.contract.quote.parFuelCost));
  fit.additional['sahra-civilian-bookings'] = fitIncomeCurve(broad.filter(r => r.contract.factionId === 'sahra-civilian-bookings').map(r => r.contract.quote.parFuelCost));
  return { curves: { ...fit.houses, 'bruckner-field-services': fit.bfs, 'kisaragi-yards-estella': fit.kise,
    ...fit.batch.curves, 'covenant-remnants': fit.batch.covenant, ...fit.additional }, daedalusPremium: fit.batch.daedalusPremium };
}
