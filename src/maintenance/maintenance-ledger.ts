import type { MaintenanceLedger } from './types';

const LEDGER_STORAGE_KEY = 'space-teamster.maintenance-ledgers.v1';
const MAX_COMMITTED_LEDGERS = 20;

function isLedger(value: unknown): value is MaintenanceLedger {
  const candidate = value as Partial<MaintenanceLedger> | null;
  return !!candidate
    && typeof candidate.id === 'string'
    && candidate.status === 'committed'
    && typeof candidate.mean === 'number'
    && Array.isArray(candidate.strikes)
    && !!candidate.context;
}

export function loadCommittedMaintenanceLedgers(): MaintenanceLedger[] {
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isLedger).slice(0, MAX_COMMITTED_LEDGERS) : [];
  } catch {
    return [];
  }
}

export function appendCommittedMaintenanceLedger(ledger: MaintenanceLedger): MaintenanceLedger[] {
  const committed: MaintenanceLedger = {
    ...ledger,
    status: 'committed',
    context: { ...ledger.context },
    raw: { ...ledger.raw },
    normalized: { sourceUnits: { ...ledger.normalized.sourceUnits } },
    baseSystemWeights: { ...ledger.baseSystemWeights },
    adjustedSystemWeights: { ...ledger.adjustedSystemWeights },
    contributions: ledger.contributions.map(value => ({ ...value })),
    poissonRolls: [...ledger.poissonRolls],
    strikes: ledger.strikes.map(value => ({ ...value })),
  };
  const next = [committed, ...loadCommittedMaintenanceLedgers().filter(existing => existing.id !== committed.id)].slice(0, MAX_COMMITTED_LEDGERS);
  try {
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Could not persist maintenance debug ledger', error);
  }
  return next;
}
