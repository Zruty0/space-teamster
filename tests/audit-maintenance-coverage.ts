// Read-only Stage 1 inventory. No career/storage access, registration or runtime changes.
// node tests/run-equipment.mjs tests/audit-maintenance-coverage.ts > <report.json>
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID } from '../src/content/estella';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { emptyTravelAccess } from '../src/content/estella/empty-travel-access';
import { contractLocationId } from '../src/contract-presentation';
import { localTerminalScopeIds, LOCAL_DIRECTORY_ENTRIES } from '../src/local-directory';
import { MAINTENANCE_SHOPS, diagnosisQuote, rigServiceQuote, replacementQuote, type MaintenanceShopDef } from '../src/maintenance/shops';
import { equipmentQuote } from '../src/maintenance/equipment';
import { MAINTENANCE_COMPONENTS, componentFaults } from '../src/maintenance/catalog';
import { createDefaultRigState } from '../src/maintenance/rig-state';
import { COMPONENT_GRADES, shopCanPerform } from '../src/maintenance/grades';
import proposal from '../design-docs/maintenance-stage-1-roster.json';
import { generateEstellaMission } from '../src/estella-mission';
import { preferredContractTransfer } from '../src/career-contracts';
const targets = estellaSelectableNavTargets();
const groups = new Map<string, string[]>();
for (const t of targets) { const id = contractLocationId(t.id); groups.set(id, [...(groups.get(id) ?? []), t.id]); }
const prototypes: MaintenanceShopDef[] = [
  { ...MAINTENANCE_SHOPS[0], id: 'proposed-0', facilityTier: 0, name: 'Proposed basic mechanic', locationIds: [], equipmentIds: [], diagnosticGrade: 'E', workQualityGrade: 'F', componentGradeBest: 'F', componentGradeWorst: 'F', laborRate: 250, partsMarkup: 1.15, laborHoursMultiplier: 1, honesty: 0.95 },
  { ...MAINTENANCE_SHOPS[0], id: 'proposed-wells-0', facilityTier: 0, name: 'Wells basic mechanic', locationIds: [], equipmentIds: [], diagnosticGrade: 'E', workQualityGrade: 'F', componentGradeBest: 'F', componentGradeWorst: 'F', laborRate: 250, partsMarkup: 1.5, laborHoursMultiplier: 1, honesty: 0.8 },
  { ...MAINTENANCE_SHOPS[0], id: 'proposed-1', name: 'Proposed professional', locationIds: [] },
  { ...MAINTENANCE_SHOPS[0], id: 'proposed-2', facilityTier: 2, name: 'Proposed full service', locationIds: [], diagnosticGrade: 'B', workQualityGrade: 'B', componentGradeBest: 'B', componentGradeWorst: 'D', laborRate: 800, laborHoursMultiplier: 0.9 },
  { ...MAINTENANCE_SHOPS[0], id: 'proposed-3', facilityTier: 3, name: 'Proposed Rochefort elite', locationIds: [], diagnosticGrade: 'A', workQualityGrade: 'A', componentGradeBest: 'A', componentGradeWorst: 'D', laborRate: 1400, partsMarkup: 1.1, laborHoursMultiplier: 0.8 },
];
function measure(s: MaintenanceShopDef) {
  const rig = createDefaultRigState(true);
  for (const component of Object.values(rig.components)) component.ap = 0;
  const broken = createDefaultRigState(true);
  broken.components['powertrain-main-drive-core'].fault = { severity: 'total', diagnosis: 'confirmed', generatedMission: 0, generatedStrike: 0 };
  const { copy, ...attributes } = s;
  return { ...attributes, diagnosis: diagnosisQuote(s), depletedService: rigServiceQuote(rig, s), driveReplacement: replacementQuote(broken, s, 'powertrain-main-drive-core'), equipment: Object.fromEntries((s.equipmentIds ?? []).map(id => [id, equipmentQuote(id === 'heavy-heat-shielding' ? createDefaultRigState(true) : createDefaultRigState(false), s, id, 'D')])) };
}
const shops = MAINTENANCE_SHOPS.map(measure);
const sites = [...groups].map(([id, members]) => {
  const n = ESTELLA_NODES_BY_ID.get(id)!;
  const scope = localTerminalScopeIds(members[0]);
  const ancestors: Array<{ id: string; name: string; kind: string }> = [];
  let p = n.placement?.parentId;
  while (p) { const node = ESTELLA_NODES_BY_ID.get(p)!; ancestors.push({id: node.id, name: node.name, kind: node.kind}); p = node.placement?.parentId; }
  const local = shops.filter(s => s.locationIds.some(l => scope.includes(l)));
  const dirs = LOCAL_DIRECTORY_ENTRIES.filter(e => e.maintenanceShopId && e.locationIds.some(l => scope.includes(l)));
  return { id, name: n.name, region: n.regionId, summary: n.summary, tags: n.tags, ancestors, members: members.map(id => ({id, name: ESTELLA_NODES_BY_ID.get(id)!.name, access: emptyTravelAccess(id)})), shops: local.map(s => s.id), directoryShops: dirs.map(s => s.maintenanceShopId), directoryIds: dirs.map(s => s.id) };
});
const faults = new Map(MAINTENANCE_COMPONENTS.flatMap(c => componentFaults(c)).map(f => [f.id, f]));
const nonselectable = ESTELLA_NODES.filter(n => n.kind === 'poi' && !targets.some(t => t.id === n.id)).map(n => ({id:n.id, name:n.name, summary:n.summary}));
const coverage = COMPONENT_GRADES.map(g => ({grade:g, uniqueFaults: [...faults.values()].filter(f => shopCanPerform(g, f.workGrade)).length, componentFaultPairs: MAINTENANCE_COMPONENTS.flatMap(c => componentFaults(c)).filter(f => shopCanPerform(g, f.workGrade)).length}));
const discrepancies = sites.filter(s => JSON.stringify([...s.shops].sort()) !== JSON.stringify([...s.directoryShops].sort()));
if (discrepancies.length) throw new Error(`Shop/directory mismatch: ${discrepancies.map(s => s.id).join(',')}`);
const siteById = new Map(sites.map(s => [s.id, s]));
const planById = new Map(proposal.map(p => [p.physicalId, p]));
if (planById.size !== sites.length || proposal.length !== sites.length) throw new Error('Proposal must cover every physical site exactly once');
const plannedShops = proposal.filter(p => p.tier !== null);
if (new Set(plannedShops.map(p => p.shopId)).size !== plannedShops.length || new Set(plannedShops.map(p => p.directoryId)).size !== plannedShops.length) throw new Error('Proposed service accounts must be unique');
for (const p of proposal) {
  const site = siteById.get(p.physicalId);
  if (!site || JSON.stringify([...p.receivingIds].sort()) !== JSON.stringify(site.members.map(m => m.id).sort())) throw new Error(`Physical membership mismatch: ${p.physicalId}`);
  if (p.tier !== null && ![-1, 0, 1, 2, 3].includes(p.tier)) throw new Error(`Invalid proposed tier: ${p.physicalId}`);
  if (p.tier === null ? p.shopId !== null || p.directoryId !== null : !p.shopId || !p.directoryId) throw new Error(`Service account/exclusion mismatch: ${p.physicalId}`);
  if (site.shops.some(id => !id.startsWith('emergency-')) && (!site.shops.includes(p.shopId!) || !site.directoryIds.includes(p.directoryId!))) throw new Error(`Existing staffed service account must survive: ${p.physicalId}`);
  const r = p.referralPhysicalId && planById.get(p.referralPhysicalId);
  if (p.tier !== null && p.tier < 3) {
    if (!r || r.tier === null || r.tier <= p.tier) throw new Error(`Referral must increase capability: ${p.physicalId}`);
    if (!siteById.get(r.physicalId)!.members.some(m => m.access === 'public')) throw new Error(`Public referral cannot disclose private site: ${p.physicalId}`);
  } else if (r) throw new Error(`Unstaffed/elite site needs no upward referral: ${p.physicalId}`);
  if (p.terms.startsWith('E-') && !site.shops.includes(p.terms.slice(2))) throw new Error(`Legacy shop missing: ${p.physicalId}`);
}
// Diagnostic probe only: the planner returns interbody transfer estimates, not a complete door-to-door ETA.
const routeProbe = [
  ['estella-viii-mining-site', 'estella-viii-settlement'],
  ['estella-viii-mining-site', 'estella-viii-first-rendezvous-station'],
  ['caravanserai-main-commercial-dock', 'harlan-dock'],
  ['estella-xiii-main-port', 'estella-xie-outer-spec-drydock'],
].map(([sourceId, destinationId]) => {
  const options = generateEstellaMission(sourceId, destinationId, 0).transferOptions;
  const selected = preferredContractTransfer(options);
  return { sourceId, destinationId, optionCount: options.length, selected: selected && {waitTime: selected.waitTime, transferTime: selected.transferTime} };
});
console.log(JSON.stringify({ proposalCounts: Object.fromEntries([-1, 0, 1, 2, 3].map(tier => [String(tier), proposal.filter(p => p.tier === tier).length])), routeProbe, counts: {rawPoi: ESTELLA_NODES.filter(n=>n.kind==='poi').length, selectable: targets.length, physical: sites.length, physicalWithShops: sites.filter(s=>s.shops.length).length, authoredShops: shops.filter(s=>s.facilityTier >= 0 && !s.id.startsWith('wells-frontier')).length, emergencyDesks: shops.filter(s=>s.facilityTier === -1).length, fallbackShops: shops.filter(s=>s.id.startsWith('wells-frontier')).length, uniqueFaults:faults.size, componentFaultPairs: MAINTENANCE_COMPONENTS.flatMap(c=>componentFaults(c)).length}, coverage, highestComplexity: [...faults.values()].filter(f => f.workGrade === 'A').map(f => ({name:f.name, repair:f.repair, components:MAINTENANCE_COMPONENTS.filter(c=>componentFaults(c).some(cf=>cf.id===f.id)).map(c=>c.name)})), nonselectable, sites, shops, proposedQuotes: prototypes.map(measure) }, null, 2));
