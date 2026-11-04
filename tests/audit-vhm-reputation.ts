// VHM/Bruckner review only. This module is never imported by production.
import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { emptyTravelAccess } from '../src/content/estella/empty-travel-access';
import { generateFactionContractCandidates } from '../src/content/estella/faction-contracts';
import { localTerminalScopeIds } from '../src/local-directory';
import { calibrateNewContractQuote, calibratedNetCredits, incomeEconomicMinimum, type IncomeCurve } from '../src/contract-income';
import { fitIncomeCurve, incomeStats, type IncomeSample } from './audit-contract-income';

export const BFS = 'bruckner-field-services', VHM = 'voss-heinkel-metricwerke';
const STOCK_LANES = new Set(['import-feeder', 'hub-to-subhub', 'hub-to-local-leaf', 'subhub-to-leaf']);
const RETURN_LANES = new Set(['export-return-to-highliner', 'subhub-return-to-hub', 'leaf-return-to-subhub', 'leaf-return-to-hub', 'local-leaf-return-to-hub']);
const IMPORTANT_RETURNS = new Set(['warranty-black-box-packages', 'incident-review-evidence-crates', 'quarantined-controller-returns']);
const IMPORTANT_CREWS = new Set(['commissioning-engineer-team', 'warranty-inspector-party', 'incident-review-board', 'emergency-propulsion-service-crew']);
const DIRECT_LANES = new Set(['direct-hardware', 'direct-return-to-weymark', 'people-outbound', 'people-return-home']);

export function proposedVhmClass(c: Pick<CareerContract, 'factionId' | 'templateId'>): 'commercial' | 'important' | 'direct' | undefined {
  const [lane, variant] = c.templateId?.split(':') ?? [];
  if (c.factionId === VHM) return DIRECT_LANES.has(lane) ? 'direct' : undefined;
  if (c.factionId !== BFS) return undefined;
  if (STOCK_LANES.has(lane)) return 'commercial';
  if (RETURN_LANES.has(lane)) return IMPORTANT_RETURNS.has(variant) ? 'important' : 'commercial';
  if (lane === 'crew-direct') return IMPORTANT_CREWS.has(variant) ? 'important' : 'commercial';
  return undefined;
}
export function sampleVhmBoards(firstDay = 0, days = 16): IncomeSample[] {
  const sources = [...new Set(estellaSelectableNavTargets().map(t => canonicalEstellaLocationId(t.id)))].sort();
  return sources.flatMap(boardSource => Array.from({ length: days }, (_, i) => firstDay + i).flatMap(day => {
    const worldTime = day * 86400;
    if (!localTerminalScopeIds(boardSource).some(sourceId => generateFactionContractCandidates({ sourceId, worldTime })
      .some(c => c.factionId === BFS || c.factionId === VHM))) return [];
    return [...generateCareerContracts(boardSource, worldTime), ...generatePassengerContracts(boardSource, worldTime)]
      .filter(c => c.factionId === BFS || c.factionId === VHM).map(contract => ({ day, boardSource, contract }));
  }));
}
export function currentVhmQuotes(rows: IncomeSample[]): IncomeSample[] {
  return rows.filter(r => r.contract.factionId === BFS || r.contract.factionId === VHM).map(r => ({ ...r,
    contract: { ...r.contract, quote: calibrateNewContractQuote(r.contract, r.contract.quote) } }));
}
export function fitProposedBfsCurve(rows: IncomeSample[]): IncomeCurve {
  return fitIncomeCurve(rows.filter(r => proposedVhmClass(r.contract) === 'commercial').map(r => r.contract.quote.parFuelCost));
}
export function auditVhmProposal(rows: IncomeSample[], curve: IncomeCurve) {
  const projected = rows.map(r => {
    const work = proposedVhmClass(r.contract);
    if (!work) throw Error(`Unreviewed VHM/BFS template: ${r.contract.factionId}/${r.contract.templateId}`);
    const net = work === 'important' ? 10000 : work === 'commercial' ? calibratedNetCredits('BFS', r.contract.quote.parFuelCost, curve) : r.contract.quote.expectedMargin;
    const minimum = work === 'direct' ? 2 : Math.max(work === 'important' ? 1 : 0, incomeEconomicMinimum(BFS, net)!);
    return { ...r, work, net, minimum };
  });
  const commercial = projected.filter(r => r.work === 'commercial');
  const important = projected.filter(r => r.work === 'important');
  const direct = projected.filter(r => r.work === 'direct');
  const starters = commercial.filter(r => r.minimum === 0);
  return {
    postings: rows.length, commercial: commercial.length,
    proposedBands: [0, 1, 2].map(level => {
      const matching = commercial.filter(r => r.minimum === level);
      return { level, ...incomeStats(matching.map(r => r.net)), percent: commercial.length ? Math.round(matching.length * 1000 / commercial.length) / 10 : 0 };
    }),
    important: { ...incomeStats(important.map(r => r.net)), freight: important.filter(r => r.contract.category === 'freight').length,
      minimums: [...new Set(important.map(r => r.minimum))], sources: new Set(important.map(r => r.boardSource)).size },
    direct: { ...incomeStats(direct.map(r => r.net)), minimums: [...new Set(direct.map(r => r.minimum))],
      compensationRatios: [...new Set(direct.map(r => r.contract.quote.pay.compensationRatio))] },
    starterFreight: starters.filter(r => r.contract.category === 'freight').length,
    starterSources: [...new Set(starters.map(r => r.boardSource))].sort().map(source => {
      const at = starters.filter(r => r.boardSource === source);
      return { source, emptyAccess: emptyTravelAccess(source), count: at.length,
        freight: at.filter(r => r.contract.category === 'freight').length,
        qualifications: [...new Set(at.map(r => r.contract.requiredCertification ?? 'none'))].sort(),
        destinations: [...new Set(at.map(r => r.contract.destinationId))].sort() };
    }),
    families: [...new Set(projected.map(r => `${r.contract.factionId}/${r.contract.templateId!.split(':')[0]}`))].sort().map(family => {
      const at = projected.filter(r => `${r.contract.factionId}/${r.contract.templateId!.split(':')[0]}` === family);
      return { family, count: at.length, important: at.filter(r => r.work === 'important').length,
        currentNet: incomeStats(at.map(r => r.contract.quote.expectedMargin)) };
    }),
  };
}
