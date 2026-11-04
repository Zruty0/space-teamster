// Review-only Kisaragi classification and income projection; no production imports this module.
import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { emptyTravelAccess } from '../src/content/estella/empty-travel-access';
import { generateFactionContractCandidates } from '../src/content/estella/faction-contracts';
import { localTerminalScopeIds, sharedTerminalParentId } from '../src/local-directory';
import { calibrateNewContractQuote, calibratedNetCredits, incomeEconomicMinimum, type IncomeCurve } from '../src/contract-income';
import { fitIncomeCurve, incomeStats, type IncomeSample } from './audit-contract-income';

export const KIS = 'kisaragi-harmony-yards', KISE = 'kisaragi-yards-estella';
export const KISARAGI_IMPORTANT_REVIEW_IDS = [
  'facility-admin:yard-acceptance-documents',
  'facility-admin:client-specification-archives',
  'facility-admin:hull-warranty-packets',
  'facility-admin:registry-and-fit-out-records',
  'facility-balancing:silk-class-acceptance-mockup-sections',
  'facility-balancing:porcelain-class-acceptance-mockup-sections',
  'facility-balancing:porcelain-class-pressure-shell-rework-lots',
] as const;
const IMPORTANT = new Set<string>(KISARAGI_IMPORTANT_REVIEW_IDS);
const DIRECT = new Set(['celadon-import', 'facility-prestige-transfer', 'prestige-records', 'people-outbound', 'people-return-hearth']);
export function proposedKisaragiClass(c: Pick<CareerContract, 'factionId' | 'templateId'>): 'commercial' | 'important' | 'direct' | undefined {
  const [lane, variant] = c.templateId?.split(':') ?? [];
  if (c.factionId === KIS) return DIRECT.has(lane) ? 'direct' : undefined;
  if (c.factionId !== KISE) return undefined;
  if (IMPORTANT.has(c.templateId ?? '')) return 'important';
  if (lane === 'supplier-to-facility' || lane === 'facility-balancing'
    || (lane === 'balor-trade' && variant === 'tenant-fit-out-purchase')) return 'commercial';
  return undefined;
}
/** Review arithmetic only: successful completions, not acceptance, failure or retry callbacks. */
export function projectKisaragiReviewEvent(score: number, unrelated: number,
  c: Pick<CareerContract, 'factionId' | 'templateId'> & { category?: string; travelMode?: string }) {
  if (c.category === 'empty' || c.travelMode === 'old-nell') return { score, unrelated };
  // Exact hundredths for this policy; preserve arbitrary legacy fractions off that grid.
  const shift = (ticks: number) => {
    const grid = Math.round(score * 100);
    return grid / 100 === score ? (grid + ticks) / 100 : score + ticks / 100;
  };
  if (c.factionId === KIS || c.factionId === KISE) {
    return { score: score < 1 ? Math.min(1, shift(25))
      : score < 2 && proposedKisaragiClass(c) === 'important' ? Math.min(2, shift(5)) : score, unrelated: 0 };
  }
  unrelated = Math.min(Number.MAX_SAFE_INTEGER, unrelated + 1);
  return { score: score >= 1 && unrelated > 10 ? Math.max(Math.floor(score), shift(-2)) : score, unrelated };
}
export function sampleKisaragiBoards(firstDay = 0, days = 16): IncomeSample[] {
  const sources = [...new Set(estellaSelectableNavTargets().map(t => canonicalEstellaLocationId(t.id)))].sort();
  return sources.flatMap(boardSource => Array.from({ length: days }, (_, i) => firstDay + i).flatMap(day => {
    const worldTime = day * 86400;
    if (!localTerminalScopeIds(boardSource).some(sourceId => generateFactionContractCandidates({ sourceId, worldTime })
      .some(c => c.factionId === KIS || c.factionId === KISE))) return [];
    return [...generateCareerContracts(boardSource, worldTime), ...generatePassengerContracts(boardSource, worldTime)]
      .filter(c => c.factionId === KIS || c.factionId === KISE).map(contract => ({ day, boardSource, contract }));
  }));
}
export function currentKisaragiQuotes(rows: IncomeSample[]): IncomeSample[] {
  return rows.filter(r => r.contract.factionId === KIS || r.contract.factionId === KISE).map(r => ({ ...r,
    contract: { ...r.contract, quote: calibrateNewContractQuote(r.contract, r.contract.quote) } }));
}
export function fitProposedKiseCurve(rows: IncomeSample[]): IncomeCurve {
  return fitIncomeCurve(rows.filter(r => proposedKisaragiClass(r.contract) === 'commercial').map(r => r.contract.quote.parFuelCost));
}
export function auditKisaragiProposal(rows: IncomeSample[], curve: IncomeCurve) {
  const projected = rows.map(r => {
    const work = proposedKisaragiClass(r.contract);
    if (!work) throw Error(`Unreviewed KIS/KIS-E identity: ${r.contract.factionId}/${r.contract.templateId}`);
    const net = work === 'important' ? 10000 : work === 'commercial'
      ? calibratedNetCredits('KIS-E', r.contract.quote.parFuelCost, curve) : r.contract.quote.expectedMargin;
    const minimum = work === 'direct' ? 2 : Math.max(work === 'important' ? 1 : 0, incomeEconomicMinimum(KISE, net)!);
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
      minimums: [...new Set(important.map(r => r.minimum))], sources: [...new Set(important.map(r => r.boardSource))].sort(),
      uniquePostingIds: new Set(important.map(r => r.contract.id)).size,
      physicalSourceDays: [...new Set(important.map(r => sharedTerminalParentId(r.boardSource) ?? r.boardSource))].sort().map(source => {
        const matching = important.filter(r => (sharedTerminalParentId(r.boardSource) ?? r.boardSource) === source);
        return { source, postingAppearances: matching.length, uniquePostingIds: new Set(matching.map(r => r.contract.id)).size,
          days: [...new Set(matching.map(r => r.day))].sort((a, b) => a - b) };
      }) },
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
