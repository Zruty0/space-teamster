// Design review only. Never imported by production pricing, boards or settlement.
import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { generateFactionContractCandidates } from '../src/content/estella/faction-contracts';
import { localTerminalScopeIds, sharedTerminalParentId } from '../src/local-directory';
import { emptyTravelAccess } from '../src/content/estella/empty-travel-access';
import { calibrateNewContractQuote, calibratedNetCredits, incomeEconomicMinimum, type IncomeCurve } from '../src/contract-income';
import { fitIncomeCurve, incomeStats, type IncomeSample } from './audit-contract-income';

export const COVENANT = 'covenant-remnants';
export const PILGRIM_GATE = 'estella-xiia-volatiles-transit';
export const COVENANT_DUES_REVIEW_IDS = [0, 1].flatMap(slot => [
  'chapter-built cryogenic valve blocks', 'proofed pressure-door assemblies', 'cold-rated habitat fittings',
  'remanufactured relay cooling plants', 'ice-work pump sets',
].map(cargo => `compact-dues-${slot}-${cargo}`));
export const COVENANT_PASSAGE_REVIEW_IDS = ['passage-notarized Covenant postulants', 'passage-sanctioned Covenant pilgrims'];
export function proposedCovenantClass(c: Pick<CareerContract, 'factionId' | 'templateId'>): 'provision' | 'dues' | 'service' | 'passage' | undefined {
  if (c.factionId !== COVENANT) return undefined;
  const id = c.templateId ?? '';
  if (/^provision-.+-(toil|genesis)$/.test(id)) return 'provision';
  if (COVENANT_DUES_REVIEW_IDS.includes(id)) return 'dues';
  if (id === 'compact-service-genesis-mirror-clinic') return 'service';
  if (COVENANT_PASSAGE_REVIEW_IDS.includes(id)) return 'passage';
  return undefined;
}
/** Successful-completion arithmetic only; no production handler imports this model. */
export function projectCovenantReviewEvent(score: number, unrelated: number,
  c: Pick<CareerContract, 'factionId' | 'templateId'> & { category?: string; travelMode?: string }) {
  if (c.category === 'empty' || c.travelMode === 'old-nell') return { score, unrelated };
  const shift = (ticks: number) => {
    const grid = Math.round(score * 60);
    return grid / 60 === score ? (grid + ticks) / 60 : score + ticks / 60;
  };
  if (c.factionId === COVENANT) {
    const work = proposedCovenantClass(c);
    return { score: score < 1 ? 1 : score < 2 && work && work !== 'provision' ? Math.min(2, shift(4)) : score, unrelated: 0 };
  }
  unrelated = Math.min(Number.MAX_SAFE_INTEGER, unrelated + 1);
  return { score: score >= 1 && unrelated > 5 ? Math.max(Math.floor(score), shift(-2)) : score, unrelated };
}
export function sampleCovenantBoards(firstDay = 0, days = 16): IncomeSample[] {
  const sources = [...new Set(estellaSelectableNavTargets().map(t => canonicalEstellaLocationId(t.id)))].sort();
  return sources.flatMap(boardSource => Array.from({ length: days }, (_, i) => firstDay + i).flatMap(day => {
    const worldTime = day * 86400;
    if (!localTerminalScopeIds(boardSource).some(sourceId => generateFactionContractCandidates({ sourceId, worldTime })
      .some(c => c.factionId === COVENANT))) return [];
    return [...generateCareerContracts(boardSource, worldTime), ...generatePassengerContracts(boardSource, worldTime)]
      .filter(c => c.factionId === COVENANT).map(contract => ({ day, boardSource, contract }));
  }));
}
export function currentCovenantQuotes(rows: IncomeSample[]): IncomeSample[] {
  return rows.filter(r => r.contract.factionId === COVENANT).map(r => ({ ...r,
    contract: { ...r.contract, quote: calibrateNewContractQuote(r.contract, r.contract.quote) } }));
}
export function fitProposedCovenantCurve(rows: IncomeSample[]): IncomeCurve {
  return fitIncomeCurve(rows.filter(r => proposedCovenantClass(r.contract) === 'provision').map(r => r.contract.quote.parFuelCost));
}
export function auditCovenantProposal(rows: IncomeSample[], curve: IncomeCurve) {
  const projected = rows.map(r => {
    const work = proposedCovenantClass(r.contract);
    if (!work) throw Error(`Unreviewed Covenant identity: ${r.contract.templateId}`);
    const net = work === 'provision' ? calibratedNetCredits('COVENANT', r.contract.quote.parFuelCost, curve) : 5000;
    return { ...r, work, net, minimum: Math.max(work === 'provision' ? 0 : 1, incomeEconomicMinimum(COVENANT, net)!) };
  });
  const commercial = projected.filter(r => r.work === 'provision');
  const important = projected.filter(r => r.work !== 'provision');
  const starters = commercial.filter(r => r.minimum === 0);
  return {
    postings: rows.length, commercial: commercial.length,
    proposedBands: [0, 1, 2].map(level => {
      const selected = commercial.filter(r => r.minimum === level);
      return { level, ...incomeStats(selected.map(r => r.net)), percent: Math.round(selected.length * 1000 / commercial.length) / 10 };
    }),
    important: { ...incomeStats(important.map(r => r.net)), minimums: [...new Set(important.map(r => r.minimum))],
      freight: important.filter(r => r.contract.category === 'freight').length, uniquePostingIds: new Set(important.map(r => r.contract.id)).size,
      physicalSources: [...new Set(important.map(r => sharedTerminalParentId(r.boardSource) ?? r.boardSource))].sort(),
      gateDuesDays: [...new Set(important.filter(r => r.work === 'dues').map(r => r.day))].sort((a, b) => a - b) },
    starterFreight: starters.filter(r => r.contract.category === 'freight').length,
    publicStarterFreight: starters.filter(r => r.contract.category === 'freight' && emptyTravelAccess(r.boardSource) === 'public').length,
    starterSources: [...new Set(starters.map(r => r.boardSource))].sort().map(source => {
      const selected = starters.filter(r => r.boardSource === source);
      return { source, emptyAccess: emptyTravelAccess(source), count: selected.length,
        qualifications: [...new Set(selected.map(r => r.contract.requiredCertification ?? 'none'))].sort() };
    }),
    families: ['provision', 'dues', 'service', 'passage'].map(work => {
      const selected = projected.filter(r => r.work === work);
      return { work, ...incomeStats(selected.map(r => r.net)), uniquePostingIds: new Set(selected.map(r => r.contract.id)).size,
        templates: [...new Set(selected.map(r => r.contract.templateId))].sort(),
        currentNet: incomeStats(selected.map(r => r.contract.quote.expectedMargin)) };
    }),
  };
}
