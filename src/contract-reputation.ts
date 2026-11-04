import type { CareerContract } from './career-contracts';
import type { CareerProfile } from './career-state';
import { normalizeReputations, normalizeReputationUnrelatedContracts, reputationStanding, type ReputationId } from './reputation';
import { combineContractClass, cerberusContractClass, type ContractIdentity } from './contract-work';
import { contractIncomeMinimum } from './contract-income';
export { combineContractClass, cerberusContractClass, type CombineWorkClass, type CerberusWorkClass } from './contract-work';

const COMBINE = 'steel-combine';
const CERBERUS = 'cerberus-human-resources';
// Political impact is independent of advancement importance; records/audits are not disapproval.
const COERCIVE_CHR = new Set(['custody-transfer-to-olympos', 'local-custody-processing',
  'surface-labor-allocation', 'local-surface-labor-processing']);

type QuotedIdentity = ContractIdentity & Partial<Pick<CareerContract, 'quote'>>;
export function contractReputationLockReasons(career: Pick<CareerProfile, 'reputations'>, contract: QuotedIdentity): string[] {
  if (contract.category === 'empty' || contract.travelMode === 'old-nell') return [];
  if (contract.factionId === CERBERUS) {
    const work = cerberusContractClass(contract);
    const trust = work === 'entrusted-commercial' ? 2 : work === 'important' ? 1 : 0;
    // Unquoted candidate classification is useful to audits; actual postings always have a quote.
    const minimum = contract.quote ? contractIncomeMinimum({ ...contract, quote: contract.quote }) : trust;
    if (minimum === undefined) return ['Contract earnings could not be verified.'];
    if (reputationStanding(career.reputations, CERBERUS).level >= minimum) return [];
    return [`Requires Cerberus Human Resources reputation level ${minimum} (${minimum === 1 ? 'Verified Asset' : 'Trusted Instrument'}).`];
  }
  if (contract.factionId !== COMBINE) return [];
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

/** Pure shared preview/settlement. Only Combine and Cerberus have authored progression. */
export function previewContractReputation(career: Pick<CareerProfile, 'reputations' | 'reputationUnrelatedContracts'>, contract: ContractIdentity) {
  const reputations = normalizeReputations(career.reputations);
  const reputationUnrelatedContracts = normalizeReputationUnrelatedContracts(career.reputationUnrelatedContracts);
  const effects: ContractReputationEffect[] = [];
  if (contract.category === 'empty' || contract.travelMode === 'old-nell') return { reputations, reputationUnrelatedContracts, effects };
  for (const faction of [COMBINE, CERBERUS] as const) {
    const before = reputations[faction];
    let after = before;
    if (contract.factionId === faction) {
      reputationUnrelatedContracts[faction] = 0;
      const important = faction === COMBINE ? combineContractClass(contract) === 'important' : cerberusContractClass(contract) === 'important';
      if (before < 1) after = Math.min(1, shiftByTicks(before, 15));
      else if (before < 2 && important) after = Math.min(2, shiftByTicks(before, 2));
      if (after > before) effects.push({ faction, kind: 'advance', before, after });
      else if (before > 1 && before !== Math.floor(before)) effects.push({ faction, kind: 'maintain', before, after });
    } else {
      const count = before < 1 ? 0 : Math.min(Number.MAX_SAFE_INTEGER, (reputationUnrelatedContracts[faction] ?? 0) + 1);
      reputationUnrelatedContracts[faction] = count;
      const lossTicks = faction !== COMBINE || contract.factionId !== CERBERUS ? 0
        : COERCIVE_CHR.has(contract.templateId ?? '') ? 6 : contract.templateId === 'local-workforce-manifests' ? 3 : 0;
      if (lossTicks) {
        // No promotion to the rival floor or double passive charge; CHR has no reciprocal hostility.
        after = Math.min(before, Math.max(1, shiftByTicks(before, -lossTicks)));
        if (after < before) effects.push({ faction, kind: 'rival-loss', before, after });
      } else if (count > 5 && before >= 1) {
        after = Math.max(Math.floor(before), shiftByTicks(before, -1));
        if (after < before) effects.push({ faction, kind: 'decay', before, after });
      }
    }
    reputations[faction] = after;
  }
  return { reputations, reputationUnrelatedContracts, effects };
}

/** Ship-computer voice: one template per effect, regardless of faction. */
export function contractReputationNotice(effect: ContractReputationEffect): string | undefined {
  const faction = reputationStanding(undefined, effect.faction).name;
  if (effect.kind === 'advance') return `Completing this contract will improve your reputation with ${faction}.`;
  if (effect.kind === 'rival-loss') return `${faction} disapproves of this contract. Completing it will reduce your reputation with them.`;
  if (effect.kind === 'maintain') return `This is routine work for ${faction}. Completing it will maintain your reputation with them.`;
  return undefined;
}

export function contractReputationNotices(career: Pick<CareerProfile, 'reputations' | 'reputationUnrelatedContracts'>, contract: ContractIdentity) {
  return previewContractReputation(career, contract).effects.flatMap(effect => {
    const text = contractReputationNotice(effect);
    return text ? [{ text, tone: effect.kind === 'advance' ? 'success' as const : effect.kind === 'rival-loss' ? 'danger' as const : 'normal' as const }] : [];
  });
}
