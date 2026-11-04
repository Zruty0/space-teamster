// Actual public boards, equal weight per posting occurrence, not per unique route or player hour.
import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { generateFactionContractCandidates } from '../src/content/estella/faction-contracts';
import { localTerminalScopeIds } from '../src/local-directory';
import { incomeCalibrationKind, incomeTargetId, contractIncomeMinimum, incomeEconomicMinimum,
  CONTRACT_INCOME_TARGETS, type IncomeCurve } from '../src/contract-income';

export { calibrateNewContractQuote } from '../src/contract-income';
export { CONTRACT_INCOME_CURVES, CERBERUS_PREMIUM_CURVE } from '../src/contract-income-curves';
import { cerberusContractClass } from '../src/contract-work';

export interface IncomeSample { day: number; boardSource: string; contract: CareerContract }
export function sampleIncomeBoards(firstDay = 0, days = 16): IncomeSample[] {
  const sources = [...new Set(estellaSelectableNavTargets().map(t => canonicalEstellaLocationId(t.id)))].sort();
  return sources.flatMap(source => Array.from({ length: days }, (_, i) => firstDay + i).flatMap(day =>
    [...generateCareerContracts(source, day * 86400), ...generatePassengerContracts(source, day * 86400)]
      .map(contract => ({ day, boardSource: source, contract }))));
}

/** Same public selection; skip expensive mission generation only when a source has no CHR candidates. */
export function sampleCerberusIncomeBoards(firstDay = 0, days = 16): IncomeSample[] {
  const sources = [...new Set(estellaSelectableNavTargets().map(t => canonicalEstellaLocationId(t.id)))].sort();
  return sources.flatMap(source => Array.from({ length: days }, (_, i) => firstDay + i).flatMap(day => {
    const worldTime = day * 86400;
    const hasChr = localTerminalScopeIds(source).some(sourceId => generateFactionContractCandidates({ sourceId, worldTime })
      .some(c => c.factionId === 'cerberus-human-resources'));
    if (!hasChr) return [];
    return [...generateCareerContracts(source, worldTime), ...generatePassengerContracts(source, worldTime)]
      .filter(c => c.factionId === 'cerberus-human-resources').map(contract => ({ day, boardSource: source, contract }));
  }));
}

function middlePair(sorted: number[]): [number, number] {
  return [sorted[Math.floor((sorted.length - 1) / 2)], sorted[Math.floor(sorted.length / 2)]];
}
export function incomeStats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const pair = middlePair(sorted);
  return { count: sorted.length, min: sorted[0] ?? null,
    median: sorted.length ? (pair[0] + pair[1]) / 2 : null, max: sorted[sorted.length - 1] ?? null };
}

/** Partition whole equal-workload groups; never split them with random or per-day fee surcharges. */
export function fitIncomeCurve(values: number[], single = false, lowerFraction = .2, upperFraction = .8): IncomeCurve {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length || sorted.some(v => !Number.isFinite(v) || v <= 0)) throw Error('Invalid reference workloads.');
  if (single) return middlePair(sorted);
  const cuts: { index: number; fuel: number }[] = [];
  for (let index = 1; index < sorted.length; index++) if (sorted[index - 1] !== sorted[index]) {
    cuts.push({ index, fuel: (sorted[index - 1] + sorted[index]) / 2 });
  }
  if (cuts.length < 2) throw Error('Insufficient distinct workloads for three commercial bands.');
  const nearest = (available: typeof cuts, fraction: number) => available.reduce((best, candidate) =>
    Math.abs(candidate.index / sorted.length - fraction) < Math.abs(best.index / sorted.length - fraction) ? candidate : best);
  const lower = nearest(cuts.slice(0, -1), lowerFraction);
  const upper = nearest(cuts.filter(c => c.index > lower.index), upperFraction);
  return [...middlePair(sorted.slice(0, lower.index)), lower.fuel,
    ...middlePair(sorted.slice(lower.index, upper.index)), upper.fuel, ...middlePair(sorted.slice(upper.index))];
}

export function fitIncomeCurves(rows: IncomeSample[]): Record<string, IncomeCurve> {
  const pools = new Map<string, IncomeSample[]>();
  for (const row of rows) if (incomeCalibrationKind(row.contract) && incomeCalibrationKind(row.contract) !== 'important') {
    const key = row.contract.factionId!;
    const pool = pools.get(key) ?? []; pool.push(row); pools.set(key, pool);
  }
  return Object.fromEntries([...pools.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, pool]) => {
    if (id === 'cerberus-human-resources') {
      const routine = pool.filter(r => cerberusContractClass(r.contract) === 'routine');
      if (routine.length <= .8 * pool.length) throw Error('CHR entrusted pool exceeds the premium offer budget.');
      return [id, fitIncomeCurve(routine.map(r => r.contract.quote.parFuelCost), false,
        .2 * pool.length / routine.length, .8 * pool.length / routine.length)];
    }
    return [id, fitIncomeCurve(pool.map(r => r.contract.quote.parFuelCost), incomeCalibrationKind(pool[0].contract) === 'single')];
  }));
}

export function fitCerberusPremiumCurve(rows: IncomeSample[], ordinaryCurve: IncomeCurve): readonly [number, number] {
  if (ordinaryCurve.length !== 8) throw Error('CHR needs three ordinary bands.');
  const premium = rows.filter(r => r.contract.factionId === 'cerberus-human-resources'
    && incomeCalibrationKind(r.contract) === 'ordinary'
    && (cerberusContractClass(r.contract) === 'entrusted-commercial' || r.contract.quote.parFuelCost > ordinaryCurve[5]));
  return middlePair(premium.map(r => r.contract.quote.parFuelCost).sort((a, b) => a - b));
}

export function incomeAudit(rows: IncomeSample[]) {
  const important = rows.filter(r => incomeCalibrationKind(r.contract) === 'important');
  const selected = rows.filter(r => incomeCalibrationKind(r.contract) && incomeCalibrationKind(r.contract) !== 'important');
  const providers = [...new Set(selected.map(r => r.contract.factionId!))].sort();
  const bands = (pool: IncomeSample[]) => [0, 1, 2].map(level => {
    const matching = pool.filter(r => contractIncomeMinimum(r.contract) === level);
    return { level, ...incomeStats(matching.map(r => r.contract.quote.expectedMargin)),
      percent: pool.length ? Math.round(matching.length / pool.length * 1000) / 10 : 0 };
  });
  const ordinary = selected.filter(r => incomeCalibrationKind(r.contract) === 'ordinary');
  const groups = providers.map(provider => {
    const pool = selected.filter(r => r.contract.factionId === provider);
    const targets = CONTRACT_INCOME_TARGETS[incomeTargetId(provider)!];
    return { provider, kind: incomeCalibrationKind(pool[0].contract), targets, bands: bands(pool),
      economicCounts: [0, 1, 2].map(level => pool.filter(r => incomeEconomicMinimum(provider, r.contract.quote.expectedMargin) === level).length),
      distinctWorkloads: new Set(pool.map(r => r.contract.quote.parFuelCost)).size };
  });
  const boardKeys = [...new Set(ordinary.map(r => `${r.boardSource}@${r.day}`))];
  const starter = ordinary.filter(r => contractIncomeMinimum(r.contract) === 0);
  const balanceWarnings = groups.flatMap(group => group.bands.flatMap((band, level) => {
    const target = group.targets[level];
    return [
      ...(group.kind === 'ordinary' && Math.abs(band.percent - [20, 60, 20][level]) > 5
        ? [`${group.provider} tier ${level}: mix ${band.percent}% differs by >5 percentage points`] : []),
      ...(target && band.median !== null && Math.abs(band.median / target - 1) > .25
        ? [`${group.provider} tier ${level}: median ${band.median} differs from ${target} by >25%`] : []),
    ];
  }));
  return { postings: rows.length, calibratedPostings: selected.length + important.length,
    unchangedPostings: rows.length - selected.length - important.length, balanceWarnings,
    important: { ...incomeStats(important.map(r => r.contract.quote.expectedMargin)),
      minimumLevels: [0, 1, 2].map(level => important.filter(r => contractIncomeMinimum(r.contract) === level).length) },
    ordinaryBands: bands(ordinary), providers: groups,
    onboarding: { ordinaryBoards: boardKeys.length, boardsWithStarterOffers: new Set(starter.map(r => `${r.boardSource}@${r.day}`)).size,
      starterSources: [...new Set(starter.map(r => r.boardSource))].sort(),
      caravanserai: bands(ordinary.filter(r => r.boardSource === 'caravanserai-main-commercial-dock')),
      starterFreightByProvider: Object.fromEntries(providers.map(p => [p, starter.filter(r => r.contract.factionId === p && r.contract.category === 'freight').length])) },
    scope: 'Combine/CHR gates and progression are live; other factions remain planned access. CHR important work is excluded from commercial proportions. Other important classes remain unauthored and need refitting when selected.' };
}
