import type { CareerContract } from './career-contracts';
import type { CareerProfile } from './career-state';
import { normalizeReputations, normalizeReputationUnrelatedContracts, reputationStanding, type ReputationId } from './reputation';

type ContractIdentity = Pick<CareerContract, 'factionId' | 'templateId' | 'category' | 'travelMode'>;
export type CombineWorkClass = 'basic-routine' | 'elevated-routine' | 'important' | 'export';
const COMBINE = 'steel-combine';
const CERBERUS = 'cerberus-human-resources';

// These are persistent template identities, never cargo display-name or endpoint inference.
const INTERNAL_LANES = new Set(['hammer-to-gornilo', 'hammer-to-perun', 'hammer-to-veles', 'gornilo-to-hammer',
  'perun-to-hammer', 'veles-to-hammer', 'anvil-to-surface', 'surface-to-anvil', 'mokosh-to-anvil', 'morana-to-anvil']);
const ELEVATED_INTERNAL = new Set([
  'hammer-to-perun:machine-tool-stock',
  'hammer-to-veles:blasting-charges', 'hammer-to-veles:replacement-cutting-heads',
  'perun-to-hammer:finished-machinery', 'perun-to-hammer:machine-tools', 'perun-to-hammer:pumps-and-compressors',
  'perun-to-hammer:gear-assemblies', 'perun-to-hammer:heavy-vehicle-chassis',
  'anvil-to-surface:tooling-and-spares',
]);
const IMPORT_LANES = new Set(['import-new-canaan', 'import-serai', 'import-glitterfield', 'kalyna-work-pilgrimage']);
const EXPORT_LANES = new Set(['export-svarog', 'export-yardstock', 'export-serai', 'export-tessera', 'export-oathmark']);
const CAMPS_BASIC = new Set(['morana-station-stores', 'morana-crews', 'stribog-return-personnel', 'stribog-service-returns']);
const CAMPS_ELEVATED = new Set(['morana-instruments', 'mokosh-farm-spares']);
const DAHAI_EXPORTS = new Set(['deep-alloy-stock', 'deep-machine-tools', 'fleet-steelwork', 'polar-handling']);
const SAHRA_EXPORTS = new Set(['waterworks-pipe', 'field-mining-stock']);
const COERCIVE_CHR = new Set(['custody-transfer-to-olympos', 'local-custody-processing',
  'surface-labor-allocation', 'local-surface-labor-processing']);

export function combineContractClass(contract: ContractIdentity): CombineWorkClass | undefined {
  if (contract.factionId !== COMBINE || !contract.templateId) return undefined;
  const [lane, variant] = contract.templateId.split(':');
  if (INTERNAL_LANES.has(lane)) return ELEVATED_INTERNAL.has(contract.templateId) ? 'elevated-routine' : 'basic-routine';
  if (IMPORT_LANES.has(lane)) return 'important';
  if (EXPORT_LANES.has(lane)) return 'export';
  if (lane === 'balor-trade') {
    if (variant === 'ore-purchase' || variant === 'brick-purchase') return 'important';
    if (variant === 'foundry-machine-tools' || variant === 'extraction-chassis') return 'export';
  }
  if (lane === 'camps') {
    if (CAMPS_BASIC.has(variant)) return 'basic-routine';
    if (CAMPS_ELEVATED.has(variant)) return 'elevated-routine';
  }
  if ((lane === 'dahai' && DAHAI_EXPORTS.has(variant)) || (lane === 'sahra' && SAHRA_EXPORTS.has(variant))) return 'export';
  return undefined;
}

export function contractReputationLockReasons(career: Pick<CareerProfile, 'reputations'>, contract: ContractIdentity): string[] {
  if (contract.category === 'empty' || contract.factionId !== COMBINE) return [];
  if (reputationStanding(career.reputations, CERBERUS).level === 3) {
    return ['Steel Combine refuses contracts because of your level-3 affiliation with Cerberus Human Resources.'];
  }
  const work = combineContractClass(contract);
  const minimum = work === 'export' ? 2 : work === 'important' || work === 'elevated-routine' ? 1 : 0;
  if (reputationStanding(career.reputations, COMBINE).level >= minimum) return [];
  const title = minimum === 1 ? 'Registered Sympathizer' : 'Honorary Citizen';
  return [`Requires Steel Combine reputation level ${minimum} (${title}).`];
}

export type ContractReputationEffect = {
  faction: ReputationId;
  kind: 'advance' | 'rival-loss' | 'maintain' | 'decay';
  before: number;
  after: number;
};

/** Preserve the exact authored 1/30 grid without rounding arbitrary saved/dev standings. */
function shiftByTicks(value: number, ticks: number): number {
  const grid = Math.round(value * 30);
  return grid / 30 === value ? (grid + ticks) / 30 : value + ticks / 30;
}

/** Pure shared preview/settlement calculation. Only Combine progression is authored so far. */
export function previewContractReputation(career: Pick<CareerProfile, 'reputations' | 'reputationUnrelatedContracts'>, contract: ContractIdentity) {
  const reputations = normalizeReputations(career.reputations);
  const reputationUnrelatedContracts = normalizeReputationUnrelatedContracts(career.reputationUnrelatedContracts);
  const effects: ContractReputationEffect[] = [];
  // Old Nell is personal passage, not completed employment. Empty flights never consume grace.
  if (contract.category === 'empty' || contract.travelMode === 'old-nell') return { reputations, reputationUnrelatedContracts, effects };
  const before = reputations[COMBINE];
  let after = before;
  if (contract.factionId === COMBINE) {
    reputationUnrelatedContracts[COMBINE] = 0;
    if (before < 1) after = Math.min(1, shiftByTicks(before, 15));
    else if (before < 2 && combineContractClass(contract) === 'important') after = Math.min(2, shiftByTicks(before, 2));
    if (after > before) effects.push({ faction: COMBINE, kind: 'advance', before, after });
    else if (before > 1 && before !== Math.floor(before)) effects.push({ faction: COMBINE, kind: 'maintain', before, after });
  } else {
    const count = before < 1 ? 0 : Math.min(Number.MAX_SAFE_INTEGER, (reputationUnrelatedContracts[COMBINE] ?? 0) + 1);
    reputationUnrelatedContracts[COMBINE] = count;
    const lossTicks = contract.factionId !== CERBERUS ? 0
      : COERCIVE_CHR.has(contract.templateId ?? '') ? 6 : contract.templateId === 'local-workforce-manifests' ? 3 : 0;
    if (lossTicks) {
      // No promotion of unknown pilots to the rival floor, and no double passive charge.
      after = Math.min(before, Math.max(1, shiftByTicks(before, -lossTicks)));
      if (after < before) effects.push({ faction: COMBINE, kind: 'rival-loss', before, after });
    } else if (count > 5 && before >= 1) {
      after = Math.max(Math.floor(before), shiftByTicks(before, -1));
      if (after < before) effects.push({ faction: COMBINE, kind: 'decay', before, after });
    }
  }
  reputations[COMBINE] = after;
  return { reputations, reputationUnrelatedContracts, effects };
}

/** Ship-computer voice: one template per effect, regardless of faction. */
export function contractReputationNotice(effect: ContractReputationEffect): string | undefined {
  const faction = reputationStanding(undefined, effect.faction).name;
  if (effect.kind === 'advance') return `Completing this contract will improve your reputation with ${faction}.`;
  if (effect.kind === 'rival-loss') return `${faction} disapproves of this contract. Completing it will reduce your reputation with them.`;
  if (effect.kind === 'maintain') return `This is routine work for ${faction}. Completing it will maintain your reputation with them.`;
  // Passive unrelated-work decay is not direct faction disapproval.
  return undefined;
}

export function contractReputationNotices(career: Pick<CareerProfile, 'reputations' | 'reputationUnrelatedContracts'>, contract: ContractIdentity) {
  return previewContractReputation(career, contract).effects.flatMap(effect => {
    const text = contractReputationNotice(effect);
    return text ? [{ text, tone: effect.kind === 'advance' ? 'success' as const : effect.kind === 'rival-loss' ? 'danger' as const : 'normal' as const }] : [];
  });
}
