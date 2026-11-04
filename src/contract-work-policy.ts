// Approved stable contract classes. Pure identities only: no board fitting, locations or display-name inference.
import type { CareerContract } from './career-contracts';
import type { ReputationId } from './reputation';
import { combineContractClass, cerberusContractClass } from './contract-work';

export const HOUSE_IDS = ['house-alvares', 'house-mendes', 'house-nunes'] as const;
export type HouseId = typeof HOUSE_IDS[number];
export function isHouseId(id?: string): id is HouseId { return HOUSE_IDS.some(h => h === id); }
export interface HouseIdentity {
  factionId?: string;
  templateId?: string;
  nunesInquiry?: { instanceId: string; contribution: number };
}
export interface HouseWorkClass {
  house: HouseId;
  family: string;
  pool: 'commercial' | 'important' | 'inquiry';
  trust: 0 | 1;
  // Advancement after level 1 only. Nov 4: own +1/4 / other Houses +1/8 below 1.
  gain: readonly [number, number];
}
export function houseContractClass(c: HouseIdentity): HouseWorkClass | undefined {
  if (!isHouseId(c.factionId) || !c.templateId) return undefined;
  const house = c.factionId, parts = c.templateId.split(':');
  let family = parts[0], pool: HouseWorkClass['pool'];
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

/** Approved favor policy, independent of whether the job advances its employer. */
export function houseRivalLoss(c: HouseIdentity): number {
  const policy = houseContractClass(c);
  return policy && ((policy.house === 'house-alvares' && policy.family === 'escheat')
    || (policy.house === 'house-mendes' && policy.pool === 'important')
    || (policy.house === 'house-nunes' && policy.pool === 'inquiry')) ? 1 / 20 : 0;
}

export const BFS = 'bruckner-field-services', VHM = 'voss-heinkel-metricwerke';
const STOCK_LANES = new Set(['import-feeder', 'hub-to-subhub', 'hub-to-local-leaf', 'subhub-to-leaf']);
const RETURN_LANES = new Set(['export-return-to-highliner', 'subhub-return-to-hub', 'leaf-return-to-subhub', 'leaf-return-to-hub', 'local-leaf-return-to-hub']);
const IMPORTANT_RETURNS = new Set(['warranty-black-box-packages', 'incident-review-evidence-crates', 'quarantined-controller-returns']);
const IMPORTANT_CREWS = new Set(['commissioning-engineer-team', 'warranty-inspector-party', 'incident-review-board', 'emergency-propulsion-service-crew']);
const DIRECT_LANES = new Set(['direct-hardware', 'direct-return-to-weymark', 'people-outbound', 'people-return-home']);

export function vhmContractClass(c: Pick<CareerContract, 'factionId' | 'templateId'>): 'commercial' | 'important' | 'direct' | undefined {
  const [lane, variant] = c.templateId?.split(':') ?? [];
  if (c.factionId === VHM) return DIRECT_LANES.has(lane) ? 'direct' : undefined;
  if (c.factionId !== BFS) return undefined;
  if (STOCK_LANES.has(lane)) return 'commercial';
  if (RETURN_LANES.has(lane)) return IMPORTANT_RETURNS.has(variant) ? 'important' : 'commercial';
  if (lane === 'crew-direct') return IMPORTANT_CREWS.has(variant) ? 'important' : 'commercial';
  return undefined;
}
export const KIS = 'kisaragi-harmony-yards', KISE = 'kisaragi-yards-estella';
export const KISARAGI_IMPORTANT_IDS = [
  'facility-admin:yard-acceptance-documents',
  'facility-admin:client-specification-archives',
  'facility-admin:hull-warranty-packets',
  'facility-admin:registry-and-fit-out-records',
  'facility-balancing:silk-class-acceptance-mockup-sections',
  'facility-balancing:porcelain-class-acceptance-mockup-sections',
  'facility-balancing:porcelain-class-pressure-shell-rework-lots',
] as const;
const IMPORTANT = new Set<string>(KISARAGI_IMPORTANT_IDS);
const DIRECT = new Set(['celadon-import', 'facility-prestige-transfer', 'prestige-records', 'people-outbound', 'people-return-hearth']);
export function kisaragiContractClass(c: Pick<CareerContract, 'factionId' | 'templateId'>): 'commercial' | 'important' | 'direct' | undefined {
  const [lane, variant] = c.templateId?.split(':') ?? [];
  if (c.factionId === KIS) return DIRECT.has(lane) ? 'direct' : undefined;
  if (c.factionId !== KISE) return undefined;
  if (IMPORTANT.has(c.templateId ?? '')) return 'important';
  if (lane === 'supplier-to-facility' || lane === 'facility-balancing'
    || (lane === 'balor-trade' && variant === 'tenant-fit-out-purchase')) return 'commercial';
  return undefined;
}
export const COVENANT = 'covenant-remnants';
export const PILGRIM_GATE = 'estella-xiia-volatiles-transit';
export const COVENANT_DUES_IDS = [0, 1].flatMap(slot => [
  'chapter-built cryogenic valve blocks', 'proofed pressure-door assemblies', 'cold-rated habitat fittings',
  'remanufactured relay cooling plants', 'ice-work pump sets',
].map(cargo => `compact-dues-${slot}-${cargo}`));
export const COVENANT_PASSAGE_IDS = ['passage-notarized Covenant postulants', 'passage-sanctioned Covenant pilgrims'];
export function covenantContractClass(c: Pick<CareerContract, 'factionId' | 'templateId'>): 'provision' | 'dues' | 'service' | 'passage' | undefined {
  if (c.factionId !== COVENANT) return undefined;
  const id = c.templateId ?? '';
  if (/^provision-.+-(toil|genesis)$/.test(id)) return 'provision';
  if (COVENANT_DUES_IDS.includes(id)) return 'dues';
  if (id === 'compact-service-genesis-mirror-clinic') return 'service';
  if (COVENANT_PASSAGE_IDS.includes(id)) return 'passage';
  return undefined;
}
export const DAEDALUS = 'daedalus-systems', BAM = 'balor-advanced-materials', MERREN = 'merren-conservatory';
export const GOV = 'estella-government', EDF = 'estella-defence-force', EIP = 'estella-institute-of-planetology';
export const NEW_EARNING_PROVIDERS = [DAEDALUS, BAM, MERREN, GOV, EDF, EIP] as const;
export type RemainingTrack = typeof DAEDALUS | typeof BAM | typeof MERREN | 'estella-institutions';
export const RECIPIENT_PROVIDERS = ['oathmark-accord-authority', 'wells-noble-houses',
  'halloran-smelting-house', 'hartwell-shipping-companies', 'new-canaan-miners-mutual', 'svarog-yard-company',
  'glitterfield-miners', 'pike-mining-companies', 'cinderhook-refining-houses', 'roadstead-export-brokers',
  'hartwell-machinery-brokers', 'hartwell-labor-exchange'] as const;
export const REMAINING_PROVIDERS: readonly string[] = [...NEW_EARNING_PROVIDERS, ...RECIPIENT_PROVIDERS];
export const BATCH_PROVIDERS = [...REMAINING_PROVIDERS, 'covenant-remnants'];
type Identity = Pick<CareerContract, 'factionId' | 'templateId'>;
export type RemainingWorkPolicy = { track?: RemainingTrack; work: 'commercial' | 'important' | 'entrusted'; trust: 0 | 1 | 2; importantNet?: number };
const includes = (items: readonly string[], value: string) => items.includes(value);
const BAM_IMPORTANT = ['extraction-overhaul', 'foundry-overhaul', 'extraction-specialists', 'foundry-specialists',
  'extraction-specialist-return', 'foundry-specialist-return'];
const BAM_ROUTINE = ['extraction-cutters', 'extraction-actuators', 'extraction-sensors', 'extraction-seals', 'foundry-pumps',
  'foundry-automation', 'foundry-carbon', 'foundry-oxygen', 'shade-food', 'shade-medical', 'shade-water', 'shade-life-support',
  'extraction-concentrates', 'foundry-alloys', 'foundry-linings', 'foundry-thermal-tiles', 'foundry-ceramics',
  'rated-recruitment', 'leave-out', 'leave-return'];
const INSTITUTION_LANES: Record<string, Record<string, readonly string[]>> = {
  [GOV]: { gaia: ['civil-service', 'inspection', 'polar-public-works', 'public-clinics', 'research-procurement', 'public-records'],
    dahai: ['dahai-civic-exchange', 'dahai-port-inspection', 'dahai-public-clinics', 'dahai-physical-archives'],
    camps: ['camps-civic-services', 'pike-public-clinic'], thule: ['civic-stores', 'clinic-stores', 'community-services', 'deepwell-technicians'] },
  [EDF]: { gaia: ['yard-rotation', 'training-exchange', 'liaison', 'leave-travel', 'service-stores', 'service-supplies'],
    dahai: ['dahai-port-liaison', 'dahai-leave-exchange', 'dahai-liaison-stores'],
    farwatch: ['provisions', 'life-support', 'station-equipment', 'overhaul-returns', 'equipment-returns', 'duty-rotations', 'technical-rotations'] },
  [EIP]: { dahai: ['field-instruments', 'field-specimens', 'field-rotations', 'instrument-procurement', 'visiting-fellows', 'polar-comparisons', 'deep-assays', 'storm-comparisons'],
    camps: ['camps-field-instruments', 'camps-field-specimens', 'camps-field-rotations', 'institute-metrology-return', 'institute-certified-standards'],
    sahra: ['wadi-instruments', 'wadi-specimens', 'wadi-researchers', 'raqib-instruments', 'raqib-instrument-returns', 'raqib-researchers',
      'raqib-life-support', 'raqib-food', 'raqib-local-standards', 'raqib-local-returns', 'raqib-local-observers'],
    farwatch: ['observation-equipment', 'instrument-returns', 'research-rotations', 'optical-service'],
    barataria: ['observatory-instruments', 'observer-visits'] },
};
const INSTITUTION_IMPORTANT: Record<string, readonly string[]> = {
  [GOV]: ['gaia:inspection', 'gaia:public-records', 'dahai:dahai-port-inspection', 'dahai:dahai-physical-archives'],
  [EDF]: ['gaia:training-exchange', 'gaia:liaison', 'dahai:dahai-port-liaison', 'farwatch:station-equipment', 'farwatch:duty-rotations', 'farwatch:technical-rotations'],
  [EIP]: ['dahai:field-specimens', 'dahai:polar-comparisons', 'dahai:deep-assays', 'dahai:storm-comparisons',
    'camps:camps-field-specimens', 'camps:institute-metrology-return', 'camps:institute-certified-standards',
    'sahra:wadi-specimens', 'sahra:raqib-instrument-returns', 'sahra:raqib-local-standards', 'sahra:raqib-local-returns',
    'farwatch:observation-equipment', 'farwatch:instrument-returns', 'farwatch:optical-service', 'barataria:observatory-instruments'],
};
export function remainingWorkPolicy(c: Identity): RemainingWorkPolicy | undefined {
  const p = c.factionId ?? '', id = c.templateId ?? '', [family, lane] = id.split(':');
  const ordinary = (track?: RemainingTrack): RemainingWorkPolicy => ({ track, work: 'commercial', trust: 0 });
  const important = (track: RemainingTrack, importantNet: number): RemainingWorkPolicy => ({ track, work: 'important', trust: 1, importantNet });
  if (includes(RECIPIENT_PROVIDERS, p)) return ordinary();
  if (p === DAEDALUS) {
    if (id.startsWith('icarus-restricted-inputs-') || id.startsWith('icarus-research-principals-')) return { track: DAEDALUS, work: 'entrusted', trust: 2 };
    if (['validation-outbound-', 'validation-return-', 'validation-team-return-', 'dataset-intake-'].some(prefix => id.startsWith(prefix))
      || (id.startsWith('personnel-outbound-') && id.endsWith('-driver-validation teams'))
      || (family === 'balor-trade' && ['isolated-hot-zone-trial', 'trial-hardware-return', 'trial-record-return'].includes(lane))) return important(DAEDALUS, 15000);
    if (['server-farm-inputs-', 'campus-fabrication-inputs-', 'product-', 'personnel-outbound-', 'research-fellows-'].some(prefix => id.startsWith(prefix))
      || (family === 'balor-trade' && ['sensor-sale', 'interface-sale', 'interface-rma', 'ceramic-stock-purchase'].includes(lane))
      || (family === 'camps' && ['scaffold-control-refit', 'scaffold-controller-return', 'scaffold-integration'].includes(lane))
      || (family === 'dahai' && ['deep-sensors', 'farm-controls', 'fleet-controls', 'polar-archive-hardware', 'customer-hardware-return', 'integration-rotation'].includes(lane))) return ordinary(DAEDALUS);
  }
  if (p === BAM) {
    if (BAM_IMPORTANT.includes(family)) return important(BAM, 20000);
    if (BAM_ROUTINE.includes(family)) return ordinary(BAM);
  }
  if (p === MERREN) {
    if (['stewardship', 'immigration', 'union-pilgrimage', 'union-return', 'specialist-inbound', 'specialist-outbound'].includes(family)
      || (family === 'procurement' && lane === 'biological-reference-stock')) return important(MERREN, 10000);
    if (['consolidation', 'distribution', 'standard-export', 'premium-export', 'highliner-export', 'return-assets'].includes(family)
      || (family === 'procurement' && ['clean-volatiles', 'organic-feedstock', 'controlled-equipment'].includes(lane))
      || (family === 'balor-trade' && ['shade-export', 'shade-cassette-return', 'shade-frame-return'].includes(lane))
      || (family === 'dahai' && ['hatchery-cultures', 'fleet-cultures', 'marine-ingredient-purchase', 'fleet-culture-rack-return'].includes(lane))) return ordinary(MERREN);
  }
  if (INSTITUTION_LANES[p]?.[family]?.includes(lane)) return INSTITUTION_IMPORTANT[p].includes(`${family}:${lane}`)
    ? important('estella-institutions', 5000) : ordinary('estella-institutions');
  return undefined;
}

export const CIVILIAN_RECOGNITION_PROVIDERS = ['gaia-civilian-bookings', 'dahai-civilian-bookings',
  'camps-civilian-bookings', 'sahra-civilian-bookings', 'weymark-independent-operators'] as const;
export interface ContractWorkPolicy {
  track?: ReputationId;
  trust: 0 | 1 | 2;
  importantNet?: number;
  advancedGain?: readonly [number, number];
}
export type WorkIdentity = Pick<CareerContract, 'factionId' | 'templateId' | 'category' | 'travelMode' | 'nunesInquiry'>;
export function noncommercialContract(c: WorkIdentity): boolean {
  return (c.category === 'empty' && c.templateId === 'empty-run' && !c.factionId)
    || (c.factionId === 'teamsters-guild' && (c.category === 'certification' || c.travelMode === 'old-nell'));
}
/** Undefined means unauthored: do not silently authorize a new paid offer. */
export function contractWorkPolicy(c: WorkIdentity): ContractWorkPolicy | undefined {
  const p = c.factionId;
  if (noncommercialContract(c)) return { trust: 0 };
  if (c.category === 'empty' || c.category === 'certification' || c.travelMode === 'old-nell') return undefined;
  if (p === 'teamsters-guild' || CIVILIAN_RECOGNITION_PROVIDERS.some(id => id === p)) return { trust: 0 };
  if (p === 'steel-combine') {
    const work = combineContractClass(c);
    return work ? { track: p, trust: work === 'export' ? 2 : work === 'basic-routine' ? 0 : 1,
      advancedGain: work === 'important' ? [1, 15] : undefined } : undefined;
  }
  if (p === 'cerberus-human-resources') {
    const work = cerberusContractClass(c);
    return { track: p, trust: work === 'entrusted-commercial' ? 2 : work === 'important' ? 1 : 0,
      importantNet: work === 'important' ? 20000 : undefined, advancedGain: work === 'important' ? [1, 15] : undefined };
  }
  const house = houseContractClass(c);
  if (house) return { track: house.house, trust: house.trust, importantNet: house.pool === 'important' ? 5000 : undefined,
    advancedGain: house.pool !== 'commercial' ? house.gain : undefined };
  const vhm = vhmContractClass(c), kis = kisaragiContractClass(c);
  if (vhm || kis) {
    const work = vhm ?? kis;
    return { track: vhm ? VHM : 'kisaragi', trust: work === 'direct' ? 2 : work === 'important' ? 1 : 0,
      importantNet: work === 'important' ? 10000 : undefined, advancedGain: work === 'important' ? [1, kis ? 20 : 15] : undefined };
  }
  const cov = covenantContractClass(c);
  if (cov) return { track: COVENANT, trust: cov === 'provision' ? 0 : 1,
    importantNet: cov === 'provision' ? undefined : 5000, advancedGain: cov === 'provision' ? undefined : [1, 15] };
  const rest = remainingWorkPolicy(c);
  return rest ? { track: rest.track, trust: rest.trust, importantNet: rest.importantNet,
    advancedGain: rest.work === 'important' ? [1, 15] : undefined } : undefined;
}
