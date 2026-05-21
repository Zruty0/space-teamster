import { type CareerContract } from './career-contracts';
import { type EstellaTransferOption } from './estella-mission';
import { actualFuelCostForQuote, type MissionCostQuote } from './mission-cost';

const STORAGE_KEY = 'space-teamster.missionProfiles.v1';
const MAX_ENTRIES = 1000;

export interface MissionProfileLogEntry {
  completedAt: string;
  mode: 'mission8' | 'career';
  sourceId: string;
  destinationId: string;
  routeClass?: string;
  transferId?: string;
  transferLabel?: string;
  waitTime?: number;
  transferTime?: number;
  departureVInf?: number;
  arrivalVInf?: number;
  startWorldTime: number;
  completionWorldTime: number;
  cargoLabel: string;
  cargoMassTons: number;
  loadedMassTons: number;
  parDv: number;
  actualDv: number;
  deltaVsPar: number;
  parFuelCost: number;
  actualFuelCost: number;
  grossPay: number;
  net: number;
  breakdown: string;
}

export function readMissionProfiles(): MissionProfileLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendMissionProfile(entry: MissionProfileLogEntry): void {
  const entries = readMissionProfiles();
  entries.push(entry);
  const trimmed = entries.slice(-MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function clearMissionProfiles(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function createMissionProfileEntry(opts: {
  mode: 'mission8' | 'career';
  quote: MissionCostQuote;
  actualDv: number;
  startWorldTime: number;
  completionWorldTime: number;
  selectedTransfer?: EstellaTransferOption;
  careerContract?: CareerContract | null;
}): MissionProfileLogEntry {
  const actualFuelCost = actualFuelCostForQuote(opts.quote, opts.actualDv);
  return {
    completedAt: new Date().toISOString(),
    mode: opts.mode,
    sourceId: opts.quote.sourceId,
    destinationId: opts.quote.destinationId,
    routeClass: opts.careerContract?.routeClass,
    transferId: opts.selectedTransfer?.id,
    transferLabel: opts.selectedTransfer?.label,
    waitTime: opts.selectedTransfer?.waitTime,
    transferTime: opts.selectedTransfer?.transferTime,
    departureVInf: opts.selectedTransfer?.departureVInf,
    arrivalVInf: opts.selectedTransfer?.arrivalVInf,
    startWorldTime: opts.startWorldTime,
    completionWorldTime: opts.completionWorldTime,
    cargoLabel: opts.quote.cargoLabel,
    cargoMassTons: opts.quote.cargoMassTons,
    loadedMassTons: opts.quote.loadedMassTons,
    parDv: opts.quote.parDv,
    actualDv: Math.round(opts.actualDv),
    deltaVsPar: Math.round(opts.actualDv - opts.quote.parDv),
    parFuelCost: opts.quote.parFuelCost,
    actualFuelCost,
    grossPay: opts.quote.grossPay,
    net: opts.quote.grossPay - actualFuelCost,
    breakdown: opts.quote.breakdown.map(item => `${item.label} ${item.dv}`).join('|'),
  };
}

function downloadText(filename: string, text: string, type: string): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown): string {
  return JSON.stringify(value ?? '');
}

export function missionProfilesToCsv(entries: MissionProfileLogEntry[] = readMissionProfiles()): string {
  const cols: (keyof MissionProfileLogEntry)[] = [
    'completedAt',
    'mode',
    'sourceId',
    'destinationId',
    'routeClass',
    'transferId',
    'transferLabel',
    'waitTime',
    'transferTime',
    'departureVInf',
    'arrivalVInf',
    'startWorldTime',
    'completionWorldTime',
    'cargoLabel',
    'cargoMassTons',
    'loadedMassTons',
    'parDv',
    'actualDv',
    'deltaVsPar',
    'parFuelCost',
    'actualFuelCost',
    'grossPay',
    'net',
    'breakdown',
  ];
  return [
    cols.join(','),
    ...entries.map(entry => cols.map(col => csvEscape(entry[col])).join(',')),
  ].join('\n');
}

export function downloadMissionProfilesJson(): void {
  downloadText('space-teamster-mission-profiles.json', JSON.stringify(readMissionProfiles(), null, 2), 'application/json');
}

export function downloadMissionProfilesCsv(): void {
  downloadText('space-teamster-mission-profiles.csv', missionProfilesToCsv(), 'text/csv');
}

export function installMissionProfileConsoleTools(): void {
  const w = window as unknown as {
    missionProfiles?: () => MissionProfileLogEntry[];
    downloadMissionProfilesJson?: () => void;
    downloadMissionProfilesCsv?: () => void;
    clearMissionProfiles?: () => void;
  };
  w.missionProfiles = readMissionProfiles;
  w.downloadMissionProfilesJson = downloadMissionProfilesJson;
  w.downloadMissionProfilesCsv = downloadMissionProfilesCsv;
  w.clearMissionProfiles = clearMissionProfiles;
}
