// Offline fixed-reference fitting. Never imported by production.
import { fitCoverage, sampleAllBoards } from './audit-contract-gate-coverage';
import { remainingReviewPolicy } from './audit-remaining-reputation';
import { fitIncomeCurve, incomeStats, type IncomeSample } from './audit-contract-income';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { generateFactionContractCandidates } from '../src/content/estella/faction-contracts';
import { localTerminalScopeIds } from '../src/local-directory';
import { calibrateNewContractQuote, contractIncomeMinimum } from '../src/contract-income';
import { contractWorkPolicy } from '../src/contract-work-policy';
import { emptyTravelAccess } from '../src/content/estella/empty-travel-access';
export { sampleAllBoards };
export function summarizeLive(rows: IncomeSample[]) {
  return [...new Set(rows.map(r => r.contract.factionId!))].sort().map(provider => {
    const pool = rows.filter(r => r.contract.factionId === provider).map(r => ({ ...r, contract: { ...r.contract,
      quote: calibrateNewContractQuote(r.contract, r.contract.quote) } }));
    const ordinary = pool.filter(r => contractWorkPolicy(r.contract)?.importantNet === undefined && !r.contract.nunesInquiry);
    const bands = [0, 1, 2].map(level => { const at = ordinary.filter(r => contractIncomeMinimum(r.contract) === level);
      return { level, percent: Math.round(at.length / ordinary.length * 1000) / 10, ...incomeStats(at.map(r => r.contract.quote.expectedMargin)),
        publicFreight: at.filter(r => r.contract.category === 'freight' && emptyTravelAccess(r.boardSource) === 'public').length }; });
    return { provider, appearances: pool.length, commercial: ordinary.length, bands };
  });
}
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
