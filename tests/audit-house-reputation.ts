// Review-only House policy and census. Nothing in src imports this module.
// Actual prices/access remain unchanged; proposed classifications are not runtime authority.
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { generateFactionContractCandidates } from '../src/content/estella/faction-contracts';
import { localTerminalScopeIds } from '../src/local-directory';
import { calibratedNetCredits, calibrateNewContractQuote, incomeEconomicMinimum, incomeTargetId, type IncomeCurve } from '../src/contract-income';
import { fitIncomeCurve, incomeStats, type IncomeSample } from './audit-contract-income';

export const HOUSE_IDS = ['house-alvares', 'house-mendes', 'house-nunes'] as const;
export type HouseId = typeof HOUSE_IDS[number];
export function isHouseId(id?: string): id is HouseId { return HOUSE_IDS.some(h => h === id); }
export interface HouseReviewIdentity {
  factionId?: string;
  templateId?: string;
  nunesInquiry?: { instanceId: string; contribution: number };
}
export interface HouseReviewClass {
  house: HouseId;
  family: string;
  pool: 'commercial' | 'important' | 'inquiry';
  trust: 0 | 1;
  // Advancement after level 1 only. Nov 4: own +1/4 / other Houses +1/8 below 1.
  gain: readonly [number, number];
}
export function proposedHouseClass(c: HouseReviewIdentity): HouseReviewClass | undefined {
  if (!isHouseId(c.factionId) || !c.templateId) return undefined;
  const house = c.factionId, parts = c.templateId.split(':');
  let family = parts[0], pool: HouseReviewClass['pool'];
  let gain: readonly [number, number] = [1, 15];
  if (house === 'house-alvares') {
    if (family === 'due' || family === 'assigned') pool = 'commercial';
    else if (family === 'grant' || family === 'escheat') pool = 'important';
    else if (family === 'occasion') {
      const movement = parts[4];
      if (!['delegation', 'delegation-return', 'freight', 'retinue', 'retinue-return', 'equipment-return'].includes(movement)) return undefined;
      family = `occasion-${movement}`;
      pool = movement === 'delegation' || movement === 'delegation-return' ? 'important' : 'commercial';
    } else return undefined;
  } else if (house === 'house-mendes') {
    if (family === 'forge-intake') pool = 'commercial';
    else if (['hydra-local', 'hydra-estella-x', 'hydra-estella-xii'].includes(family)) {
      const kind = parts[3];
      if (!['outbound-freight', 'outbound-passenger', 'return-freight', 'return-passenger'].includes(kind)) return undefined;
      const outer = family !== 'hydra-local';
      family = `${outer ? 'outer' : 'local'}-${kind}`;
      pool = 'important';
      gain = [kind.startsWith('return') ? 2 : outer ? 4 : 3, 40];
    } else return undefined;
  } else {
    if (family === 'inquiry' && c.nunesInquiry && c.nunesInquiry.contribution > 0) pool = 'inquiry';
    else if (['outer-watch', 'outer-watch-passengers', 'outer-watch-return'].includes(family)) pool = 'commercial';
    else if (['recovery', 'recovery-return', 'recovery-passengers', 'quiet-custody', 'quiet-custody-passengers'].includes(family)) pool = 'important';
    else return undefined;
  }
  return { house, family, pool, trust: pool === 'commercial' ? 0 : 1, gain: pool === 'commercial' ? [0, 1] : gain };
}

/** Review-only Nov 4 favor policy, independent of whether the job advances its employer. */
export function proposedHouseRivalLoss(c: HouseReviewIdentity): number {
  const policy = proposedHouseClass(c);
  return policy && ((policy.house === 'house-alvares' && policy.family === 'escheat')
    || (policy.house === 'house-mendes' && policy.pool === 'important')
    || (policy.house === 'house-nunes' && policy.pool === 'inquiry')) ? 1 / 20 : 0;
}

/** Arithmetic model for review tests, NOT used by Game settlement or acceptance. */
export function projectHouseReviewEvent(
  before: Record<HouseId, number>, counters: Record<HouseId, number>,
  c: HouseReviewIdentity & { category?: string; travelMode?: string },
) {
  const scores = { ...before }, unrelated = { ...counters };
  if (c.category === 'empty' || c.travelMode === 'old-nell') return { scores, unrelated };
  const policy = proposedHouseClass(c), loss = proposedHouseRivalLoss(c);
  const shift = (value: number, ticks: number) => {
    const grid = Math.round(value * 120);
    return grid / 120 === value ? (grid + ticks) / 120 : value + ticks / 120;
  };
  for (const house of HOUSE_IDS) {
    const value = before[house];
    if (house === c.factionId) {
      unrelated[house] = 0;
      if (value < 1) scores[house] = Math.min(1, shift(value, 30));
      else if (value < 2 && policy) scores[house] = Math.min(2, shift(value, 120 * policy.gain[0] / policy.gain[1]));
    } else {
      unrelated[house] = Math.min(Number.MAX_SAFE_INTEGER, unrelated[house] + 1);
      if (value < 1) {
        if (isHouseId(c.factionId)) scores[house] = Math.min(1, shift(value, 15));
      } else if (loss) scores[house] = Math.max(1, shift(value, -6));
      else if (unrelated[house] > 7) scores[house] = Math.max(Math.floor(value), shift(value, -3));
    }
  }
  return { scores, unrelated };
}

/** Actual public boards, canonical terminals once; raw candidates only skip irrelevant sources. */
export function sampleHouseBoards(firstDay = 0, days = 16): IncomeSample[] {
  const sources = [...new Set(estellaSelectableNavTargets().map(t => canonicalEstellaLocationId(t.id)))].sort();
  return sources.flatMap(boardSource => Array.from({ length: days }, (_, i) => firstDay + i).flatMap(day => {
    const worldTime = day * 86400;
    const relevant = localTerminalScopeIds(boardSource).some(sourceId =>
      generateFactionContractCandidates({ sourceId, worldTime }).some(c => isHouseId(c.factionId)));
    if (!relevant) return [];
    return [...generateCareerContracts(boardSource, worldTime), ...generatePassengerContracts(boardSource, worldTime)]
      .filter(c => isHouseId(c.factionId)).map(contract => ({ day, boardSource, contract }));
  }));
}

/** A cached pre-income census can be reconstructed at current prices without changing the source. */
export function currentHouseQuotes(rows: IncomeSample[]): IncomeSample[] {
  return rows.filter(r => isHouseId(r.contract.factionId)).map(r => ({ ...r,
    contract: { ...r.contract, quote: calibrateNewContractQuote(r.contract, r.contract.quote) } }));
}
export function fitProposedHouseCurves(rows: IncomeSample[]): Record<HouseId, IncomeCurve> {
  return Object.fromEntries(HOUSE_IDS.map(id => [id, fitIncomeCurve(rows.filter(r =>
    r.contract.factionId === id && proposedHouseClass(r.contract)?.pool === 'commercial').map(r => r.contract.quote.parFuelCost))])) as Record<HouseId, IncomeCurve>;
}

export function auditHouseProposal(rows: IncomeSample[], curves: Record<HouseId, IncomeCurve>) {
  return HOUSE_IDS.map(house => {
    const pool = rows.filter(r => r.contract.factionId === house).map(row => {
      const policy = proposedHouseClass(row.contract);
      if (!policy) throw Error(`Unreviewed House identity: ${house}/${row.contract.templateId}`);
      const proposedNet = policy.pool === 'commercial'
        ? calibratedNetCredits(incomeTargetId(house)!, row.contract.quote.parFuelCost, curves[house])
        : policy.pool === 'inquiry' ? row.contract.quote.expectedMargin : 5000;
      const minimum = Math.max(policy.trust, incomeEconomicMinimum(house, proposedNet)!);
      return { ...row, policy, proposedNet, minimum };
    });
    const commercial = pool.filter(r => r.policy.pool === 'commercial');
    const bands = [0, 1, 2].map(level => {
      const selected = commercial.filter(r => r.minimum === level);
      return { level, percent: commercial.length ? Math.round(selected.length * 1000 / commercial.length) / 10 : 0,
        ...incomeStats(selected.map(r => r.proposedNet)) };
    });
    const starters = commercial.filter(r => r.minimum === 0);
    const starterSources = [...new Set(starters.map(r => r.boardSource))].sort().map(source => {
      const at = starters.filter(r => r.boardSource === source);
      return { source, count: at.length, freight: at.filter(r => r.contract.category === 'freight').length,
        destinations: [...new Set(at.map(r => r.contract.destinationId))].sort(),
        qualifications: [...new Set(at.map(r => r.contract.requiredCertification ?? 'none'))].sort() };
    });
    return { house, postings: pool.length, commercial: commercial.length,
      currentEconomicBands: [0, 1, 2].map(level => incomeStats(pool.filter(r => incomeEconomicMinimum(house, r.contract.quote.expectedMargin) === level).map(r => r.contract.quote.expectedMargin))),
      proposedBands: bands,
      important: incomeStats(pool.filter(r => r.policy.pool === 'important').map(r => r.proposedNet)),
      inquiry: incomeStats(pool.filter(r => r.policy.pool === 'inquiry').map(r => r.proposedNet)),
      families: [...new Set(pool.map(r => r.policy.family))].sort().map(family => {
        const matching = pool.filter(r => r.policy.family === family);
        const policy = matching[0].policy;
        return { family, pool: policy.pool, gain: policy.gain, rivalLossToEachOtherHouse: proposedHouseRivalLoss(matching[0].contract),
          current: incomeStats(matching.map(r => r.contract.quote.expectedMargin)), count: matching.length,
          proposedMinimums: [...new Set(matching.map(r => r.minimum))].sort(),
          sources: [...new Set(matching.map(r => r.boardSource))].sort() };
      }),
      starterSources,
      starterFreight: starters.filter(r => r.contract.category === 'freight').length,
      importantFreight: pool.filter(r => r.policy.pool !== 'commercial' && r.contract.category === 'freight').length,
      distinctCommercialWorkloads: new Set(commercial.map(r => r.contract.quote.parFuelCost)).size,
    };
  });
}
