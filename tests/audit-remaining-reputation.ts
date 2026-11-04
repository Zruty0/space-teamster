// Batched design review only. No production module imports these policies or curves.
import type { CareerContract } from '../src/career-contracts';
import { normalizeReputations } from '../src/reputation';
import { employerReputationLevel } from '../src/employer-reputation';
import { incomeTargetId, incomeEconomicMinimum, incomeBoundaries, calibratedNetCredits,
  calibrateNewContractQuote, CONTRACT_INCOME_TARGETS, type IncomeCurve } from '../src/contract-income';
import { emptyTravelAccess } from '../src/content/estella/empty-travel-access';
import { sampleIncomeBoards, fitIncomeCurve, incomeStats, type IncomeSample } from './audit-contract-income';
import { proposedCovenantClass, fitProposedCovenantCurve } from './audit-covenant-reputation';
export { sampleCovenantBoards } from './audit-covenant-reputation';

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
export type ReviewPolicy = { track?: RemainingTrack; work: 'commercial' | 'important' | 'entrusted'; trust: 0 | 1 | 2; importantNet?: number };
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
export function remainingReviewPolicy(c: Identity): ReviewPolicy | undefined {
  const p = c.factionId ?? '', id = c.templateId ?? '', [family, lane] = id.split(':');
  const ordinary = (track?: RemainingTrack): ReviewPolicy => ({ track, work: 'commercial', trust: 0 });
  const important = (track: RemainingTrack, importantNet: number): ReviewPolicy => ({ track, work: 'important', trust: 1, importantNet });
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
export function projectRemainingReviewEvent(track: RemainingTrack, score: number, unrelated: number,
  c: Identity & { category?: string; travelMode?: string }) {
  if (c.category === 'empty' || c.travelMode === 'old-nell') return { score, unrelated };
  const policy = remainingReviewPolicy(c);
  const shift = (ticks: number) => { const grid = Math.round(score * 30); return grid / 30 === score ? (grid + ticks) / 30 : score + ticks / 30; };
  if (policy?.track === track) return { score: score < 1 ? Math.min(1, shift(15))
    : score < 2 && policy.work === 'important' ? Math.min(2, shift(2)) : score, unrelated: 0 };
  unrelated = Math.min(Number.MAX_SAFE_INTEGER, unrelated + 1);
  return { score: score >= 1 && unrelated > 5 ? Math.max(Math.floor(score), shift(-1)) : score, unrelated };
}
export function currentBatchQuotes(rows: IncomeSample[]) {
  return rows.filter(r => BATCH_PROVIDERS.includes(r.contract.factionId ?? '')).map(r => ({ ...r,
    contract: { ...r.contract, quote: calibrateNewContractQuote(r.contract, r.contract.quote) } }));
}
export function sampleBatchBoards(firstDay: number, days: number) { return currentBatchQuotes(sampleIncomeBoards(firstDay, days)); }
export interface BatchFit { curves: Record<string, IncomeCurve>; daedalusPremium: IncomeCurve; covenant: IncomeCurve }
export function fitBatchProposal(reference: IncomeSample[], covenantReference: IncomeSample[]): BatchFit {
  const curves: Record<string, IncomeCurve> = {};
  for (const provider of NEW_EARNING_PROVIDERS) {
    const commercial = reference.filter(r => r.contract.factionId === provider && remainingReviewPolicy(r.contract)?.work !== 'important');
    const routine = commercial.filter(r => remainingReviewPolicy(r.contract)?.work === 'commercial');
    if (routine.length <= .8 * commercial.length) throw Error(`${provider}: entrusted pool exceeds premium budget`);
    curves[provider] = fitIncomeCurve(routine.map(r => r.contract.quote.parFuelCost), false,
      .2 * commercial.length / routine.length, .8 * commercial.length / routine.length);
  }
  const daedalus = curves[DAEDALUS];
  if (daedalus.length !== 8) throw Error('Daedalus needs three bands');
  const premium = reference.filter(r => r.contract.factionId === DAEDALUS && remainingReviewPolicy(r.contract)?.work !== 'important'
    && (remainingReviewPolicy(r.contract)?.trust === 2 || r.contract.quote.parFuelCost > daedalus[5]));
  return { curves, daedalusPremium: fitIncomeCurve(premium.map(r => r.contract.quote.parFuelCost), true), covenant: fitProposedCovenantCurve(covenantReference) };
}
/** Fixed gentle entry shoulder (same shape as CHR), not refitted against held-out boards. */
export function covenantGentleEntryNet(fuel: number, curve: IncomeCurve) {
  if (curve.length !== 8) throw Error('Covenant needs three bands');
  if (fuel > curve[2]) return calibratedNetCredits('COVENANT', fuel, curve);
  return Math.min(15000, Math.round(fuel < curve[0] ? 5000 * Math.sqrt(fuel / curve[0])
    : fuel > curve[1] ? 5000 * (1 + .5 * Math.log2(fuel / curve[1])) : 5000));
}
export function projectBatchQuote(c: CareerContract, fit: BatchFit) {
  if (c.factionId === 'covenant-remnants') {
    const work = proposedCovenantClass(c);
    if (!work) throw Error(`Unknown Covenant identity ${c.templateId}`);
    const net = work === 'provision' ? covenantGentleEntryNet(c.quote.parFuelCost, fit.covenant) : 5000;
    return { work: work === 'provision' ? 'commercial' : 'important', net, minimum: Math.max(work === 'provision' ? 0 : 1, incomeEconomicMinimum(c.factionId, net)!) };
  }
  const policy = remainingReviewPolicy(c);
  if (!policy) throw Error(`Unreviewed identity ${c.factionId}/${c.templateId}`);
  const curve = fit.curves[c.factionId!], target = incomeTargetId(c.factionId)!;
  let net = c.quote.expectedMargin;
  if (policy.work === 'important') net = policy.importantNet!;
  else if (c.factionId === DAEDALUS && curve.length === 8 && (policy.trust === 2 || c.quote.parFuelCost > curve[5])) {
    const [lo, hi] = fit.daedalusPremium, f = c.quote.parFuelCost, floor = incomeBoundaries('DAEDALUS')![1] + 1;
    net = Math.round(f < lo ? floor + (300000 - floor) * Math.sqrt(f / lo) : f > hi ? 300000 + (300000 - floor) * Math.log2(f / hi) : 300000);
  } else if (curve) net = calibratedNetCredits(target, c.quote.parFuelCost, curve);
  return { work: policy.work, net, minimum: Math.max(policy.trust, incomeEconomicMinimum(c.factionId, net)!) };
}
export function auditBatchProposal(rows: IncomeSample[], fit: BatchFit) {
  return BATCH_PROVIDERS.map(provider => {
    const pool = rows.filter(r => r.contract.factionId === provider).map(r => ({ ...r, ...projectBatchQuote(r.contract, fit) }));
    const commercial = pool.filter(r => r.work !== 'important'), important = pool.filter(r => r.work === 'important');
    const starter = commercial.filter(r => r.minimum === 0);
    const bands = [0, 1, 2].map(level => { const at = commercial.filter(r => r.minimum === level);
      return { level, ...incomeStats(at.map(r => r.net)), percent: commercial.length ? Math.round(at.length * 1000 / commercial.length) / 10 : 0 }; });
    const targets = CONTRACT_INCOME_TARGETS[incomeTargetId(provider)!];
    return { provider, commercial: commercial.length, important: { ...incomeStats(important.map(r => r.net)), freight: important.filter(r => r.contract.category === 'freight').length },
      bands, warnings: bands.flatMap((b, i) => [
        ...(Math.abs(b.percent - [20, 60, 20][i]) > 5 ? [`band ${i} mix differs by >5pp`] : []),
        ...(b.median === null ? [`band ${i} absent`] : targets[i] && Math.abs(b.median / targets[i]! - 1) > .25 ? [`band ${i} median differs by >25%`] : []),
      ]),
      publicStarterFreight: starter.filter(r => r.contract.category === 'freight' && emptyTravelAccess(r.boardSource) === 'public').length,
      starterSources: [...new Set(starter.map(r => r.boardSource))].sort().map(source => ({ source, access: emptyTravelAccess(source),
        qualifications: [...new Set(starter.filter(r => r.boardSource === source).map(r => r.contract.requiredCertification ?? 'none'))] })),
      importantSources: [...new Set(important.map(r => r.boardSource))].sort(),
      recognitionAtZero: employerReputationLevel(normalizeReputations(undefined), provider),
    };
  });
}
