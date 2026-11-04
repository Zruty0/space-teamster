import type { CareerContract } from './career-contracts';
import type { CareerProfile } from './career-state';
import { normalizeReputations, normalizeReputationUnrelatedContracts, reputationStanding, REPUTATION_TRACKS, type ReputationId } from './reputation';
import { type ContractIdentity } from './contract-work';
import { contractWorkPolicy, noncommercialContract, isHouseId, HOUSE_IDS, houseRivalLoss, CIVILIAN_RECOGNITION_PROVIDERS } from './contract-work-policy';
import { employerReputationLevel } from './employer-reputation';
import { contractIncomeMinimum } from './contract-income';
export { combineContractClass, cerberusContractClass, type CombineWorkClass, type CerberusWorkClass } from './contract-work';

const COMBINE = 'steel-combine', CERBERUS = 'cerberus-human-resources';
// Political impact is independent of advancement importance; records/audits are not disapproval.
const COERCIVE_CHR = new Set(['custody-transfer-to-olympos', 'local-custody-processing',
  'surface-labor-allocation', 'local-surface-labor-processing']);

/** Explicit attribution, including legacy accepted work. Never infer credit from recognition/hosts. */
export function contractEarningTrack(contract: ContractIdentity): ReputationId | undefined {
  const p = contract.factionId;
  if (p === 'bruckner-field-services') return 'voss-heinkel-metricwerke';
  if (p === 'kisaragi-harmony-yards' || p === 'kisaragi-yards-estella') return 'kisaragi';
  if (p === 'estella-government' || p === 'estella-defence-force' || p === 'estella-institute-of-planetology') return 'estella-institutions';
  return REPUTATION_TRACKS.find(t => t.id === p && t.id !== 'smuggler-notoriety' && t.id !== 'estella-institutions' && t.id !== 'kisaragi')?.id;
}

type QuotedIdentity = ContractIdentity & Partial<Pick<CareerContract, 'quote'>>;
export function contractReputationLockReasons(career: Pick<CareerProfile, 'reputations'>, contract: QuotedIdentity): string[] {
  if (noncommercialContract(contract)) return [];
  const policy = contractWorkPolicy(contract);
  if (!policy) return ['Contract reputation requirements could not be verified.'];
  if (contract.factionId === COMBINE && reputationStanding(career.reputations, CERBERUS).level === 3) {
    return ['Steel Combine refuses contracts because of your level-3 affiliation with Cerberus Human Resources.'];
  }
  if (isHouseId(contract.factionId)) {
    const rival = HOUSE_IDS.find(id => id !== contract.factionId && reputationStanding(career.reputations, id).level === 3);
    if (rival) return [`${reputationStanding(undefined, contract.factionId).name} refuses contracts because of your level-3 affiliation with ${reputationStanding(undefined, rival).name}.`];
  }
  // Unquoted identities support policy inspection; actual offers always carry immutable quotes.
  const minimum = contract.quote ? contractIncomeMinimum({ ...contract, quote: contract.quote }) : policy.trust;
  if (minimum === undefined) return ['Contract earnings could not be verified.'];
  const level = employerReputationLevel(career.reputations, contract.factionId ?? '');
  if (level === undefined) return ['Contract reputation requirements could not be verified.'];
  if (level >= minimum) return [];
  const track = contractEarningTrack(contract)
    ?? (CIVILIAN_RECOGNITION_PROVIDERS.some(p => p === contract.factionId) ? 'estella-institutions' : undefined);
  if (track) {
    const standing = reputationStanding({ ...normalizeReputations(undefined), [track]: minimum }, track);
    return [`Requires ${standing.name} reputation level ${minimum} (${standing.title}).`];
  }
  const label = contract.factionId === 'oathmark-accord-authority' || contract.factionId === 'wells-noble-houses' ? 'House' : 'commercial';
  return [`Requires ${label} recognition level ${minimum}.`];
}

export type ContractReputationEffect = {
  faction: ReputationId;
  kind: 'advance' | 'rival-loss' | 'maintain' | 'decay';
  before: number;
  after: number;
};

/** Preserve authored rational grids without rounding arbitrary saved/dev standings. */
function shift(value: number, amount: number, gridSize: number): number {
  const grid = Math.round(value * gridSize);
  return grid / gridSize === value ? (grid + Math.round(amount * gridSize)) / gridSize : value + amount;
}
export function reputationProgressionPolicy(track: ReputationId) {
  return isHouseId(track) ? { introduction: 1 / 4, grace: 7, decay: 1 / 40, grid: 120 }
    : track === 'kisaragi' ? { introduction: 1 / 4, grace: 10, decay: 1 / 50, grid: 100 }
    : { introduction: track === 'covenant-remnants' ? 1 : 1 / 2, grace: 5, decay: 1 / 30, grid: track === 'covenant-remnants' ? 60 : 30 };
}

/** Pure shared preview/settlement, published only after the existing atomic career save. */
export function previewContractReputation(career: Pick<CareerProfile, 'reputations' | 'reputationUnrelatedContracts'>, contract: ContractIdentity) {
  const reputations = normalizeReputations(career.reputations);
  const reputationUnrelatedContracts = normalizeReputationUnrelatedContracts(career.reputationUnrelatedContracts);
  const effects: ContractReputationEffect[] = [];
  if (contract.category === 'empty' || contract.travelMode === 'old-nell') return { reputations, reputationUnrelatedContracts, effects };
  const owner = contractEarningTrack(contract), work = contractWorkPolicy(contract), favorLoss = houseRivalLoss(contract);
  for (const { id: faction } of REPUTATION_TRACKS) {
    if (faction === 'smuggler-notoriety') continue; // No invented contact/quest progression.
    const before = reputations[faction], policy = reputationProgressionPolicy(faction);
    let after = before;
    if (owner === faction) {
      reputationUnrelatedContracts[faction] = 0;
      if (before < 1) after = Math.min(1, shift(before, policy.introduction, policy.grid));
      else if (before < 2 && work?.advancedGain) after = Math.min(2, shift(before, work.advancedGain[0] / work.advancedGain[1], policy.grid));
      if (after > before) effects.push({ faction, kind: 'advance', before, after });
      else if (before > 1 && before !== Math.floor(before)) effects.push({ faction, kind: 'maintain', before, after });
    } else {
      // Preserve existing Combine/CHR below-1 counters. Other authored policies count every unrelated completion.
      const count = (faction === COMBINE || faction === CERBERUS) && before < 1 ? 0
        : Math.min(Number.MAX_SAFE_INTEGER, (reputationUnrelatedContracts[faction] ?? 0) + 1);
      reputationUnrelatedContracts[faction] = count;
      const loss = faction === COMBINE && contract.factionId === CERBERUS
        ? COERCIVE_CHR.has(contract.templateId ?? '') ? .2 : contract.templateId === 'local-workforce-manifests' ? .1 : 0
        : isHouseId(faction) ? favorLoss : 0;
      if (isHouseId(faction) && isHouseId(owner) && before < 1) {
        after = Math.min(1, shift(before, 1 / 8, 120));
        if (after > before) effects.push({ faction, kind: 'advance', before, after });
      } else if (loss) {
        after = Math.min(before, Math.max(1, shift(before, -loss, policy.grid)));
        if (after < before) effects.push({ faction, kind: 'rival-loss', before, after });
      } else if (count > policy.grace && before >= 1) {
        after = Math.max(Math.floor(before), shift(before, -policy.decay, policy.grid));
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
