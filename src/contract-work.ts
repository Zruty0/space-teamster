import type { CareerContract } from './career-contracts';

export type ContractIdentity = Pick<CareerContract, 'factionId' | 'templateId' | 'category' | 'travelMode' | 'nunesInquiry'>;
export type CombineWorkClass = 'basic-routine' | 'elevated-routine' | 'important' | 'export';
export type CerberusWorkClass = 'routine' | 'important' | 'entrusted-commercial';

// Persistent provider/template identities; never inferred from display text, destination or pay.
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

export function combineContractClass(contract: ContractIdentity): CombineWorkClass | undefined {
  if (contract.factionId !== 'steel-combine' || !contract.templateId) return undefined;
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

export const CERBERUS_IMPORTANT_TEMPLATES = [
  'custody-transfer-to-olympos', 'local-custody-processing', 'surface-labor-allocation', 'local-surface-labor-processing',
  'local-workforce-manifests', 'local-shareholder-packets', 'local-legal-archives', 'local-audit-records', 'audit-records-to-acheron',
] as const;
const IMPORTANT_CHR = new Set<string>(CERBERUS_IMPORTANT_TEMPLATES);
const ENTRUSTED_CHR = new Set(['shareholder-packets-to-finance', 'legal-archives-to-capital', 'executive-delegation']);

export function cerberusContractClass(contract: ContractIdentity): CerberusWorkClass | undefined {
  if (contract.factionId !== 'cerberus-human-resources') return undefined;
  if (IMPORTANT_CHR.has(contract.templateId ?? '')) return 'important';
  if (ENTRUSTED_CHR.has(contract.templateId ?? '')) return 'entrusted-commercial';
  // Includes generic workforce intake: its name alone establishes neither consent nor coercion.
  return 'routine';
}
