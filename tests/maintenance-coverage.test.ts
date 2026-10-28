import { Game } from '../src/game';
import { defaultCareerProfile, TEAMSTER_CERTIFICATION_IDS } from '../src/career-state';
import { MAINTENANCE_COMPONENTS, componentFaults } from '../src/maintenance/catalog';
import { createDefaultRigState, deriveRestrictions } from '../src/maintenance/rig-state';
import { MAINTENANCE_SHOPS, WELLS_FRONTIER_OUTFITTERS, EMERGENCY_MAINTENANCE_SHOPS, diagnosisQuote, rigServiceQuote, replacementQuote, repairQuote, diagnoseRigAtShop, type MaintenanceShopDef } from '../src/maintenance/shops';
import { WEYMARK_PILOT_SHOPS } from '../src/maintenance/weymark-shops';
import { COVERAGE_SHOPS } from '../src/maintenance/coverage';
import { equipmentQuote } from '../src/maintenance/equipment';
import { emergencyRestart, emergencyRestartNeeded } from '../src/maintenance/emergency';
import { maintenanceReferrals } from '../src/maintenance/referrals';
import { MAINTENANCE_NETWORK } from '../src/maintenance/referral-network';
import { LOCAL_DIRECTORY_ENTRIES, localDirectoryEntriesAt } from '../src/local-directory';
import { localTerminalScopeIds, physicalTerminalId } from '../src/physical-terminals';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { emptyTravelAccess } from '../src/content/estella/empty-travel-access';
import { canTravelEmpty, createEmptyRun } from '../src/empty-runs';
import baseline from './fixtures/maintenance-stage-1-shops.json';
import proposal from '../design-docs/maintenance-stage-1-roster.json';
let checks = 0;
function assert(v: unknown, message: string): asserts v { checks++; if (!v) throw new Error(message); }
function canonical(value: any): any { return Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value; }
function equal(a: unknown, b: unknown, message: string) { assert(JSON.stringify(canonical(a)) === JSON.stringify(canonical(b)), message); }
function profile(locationId: string) { return { ...defaultCareerProfile(), locationId, certifications: [...TEAMSTER_CERTIFICATION_IDS], rig: createDefaultRigState(true) }; }
function broken(locationId: string) {
  const p = profile(locationId);
  p.money = -1000;
  for (const s of Object.values(p.rig.components)) if (s.installed) { s.hp = 0; s.ap = 0; s.fault = { severity: 'total', diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 }; }
  return p;
}
// Restricted operation alone must not unlock free emergency recovery.
for (const component of MAINTENANCE_COMPONENTS) for (const severity of ['minor', 'major', 'total'] as const) {
  const p = profile(WEYMARK_PILOT_SHOPS[0].locationIds[0]);
  if (!p.rig.components[component.id].installed) continue;
  p.rig.components[component.id].fault = { severity, diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
  const grounded = deriveRestrictions(p.rig).some(r => r.id === 'grounded');
  equal(emergencyRestartNeeded(p), grounded, `grounded-only eligibility: ${component.id}/${severity}`);
  if (!grounded) assert(!emergencyRestart(p, WEYMARK_PILOT_SHOPS[0]), 'nongrounding damage cannot trigger recovery');
}
const targets = estellaSelectableNavTargets();
assert(MAINTENANCE_SHOPS.length === 159, 'one service or emergency desk per physical site');
assert(EMERGENCY_MAINTENANCE_SHOPS.length === 9, 'nine approved unstaffed locations remain self-help only');
assert(MAINTENANCE_SHOPS.filter(s => s.facilityTier >= 0).length === 150, 'approved Stage 3 staffed coverage');
equal([-1, 0, 1, 2, 3].map(t => MAINTENANCE_SHOPS.filter(s => s.facilityTier === t).length), [9, 57, 63, 26, 4], 'final approved coverage distribution');
assert(WELLS_FRONTIER_OUTFITTERS.length === 26, '26 basic Wells branches remain');
equal(WEYMARK_PILOT_SHOPS.map(s => s.facilityTier), [0, 1, 2], 'pilot ladder');
assert(WELLS_FRONTIER_OUTFITTERS.every(s => s.honesty === 0.8), 'approved Wells honesty');
assert(WEYMARK_PILOT_SHOPS[0].honesty === 0.95, 'approved general basic honesty');
assert(MAINTENANCE_SHOPS.find(s => s.id === 'red-dust-mechanical-reclamation')!.honesty === 0, 'named dishonest exception retained');
assert(new Set(MAINTENANCE_SHOPS.map(s => s.id)).size === 159, 'unique accounts');
for (const shop of MAINTENANCE_SHOPS) {
  assert(LOCAL_DIRECTORY_ENTRIES.filter(e => e.maintenanceShopId === shop.id).length === 1, 'exactly one directory record');
  const refs = maintenanceReferrals(shop);
  assert(refs.length === (shop.facilityTier === 3 ? 0 : (refs[0] && MAINTENANCE_NETWORK.find(n => n.physicalId === refs[0].physicalId)!.tier === 3 ? 1 : 2)), 'one recommendation plus elite alternative where needed');
  assert(new Set(refs.map(r => r.physicalId)).size === refs.length, 'no duplicate elite referral');
  for (const r of refs) {
    assert(emptyTravelAccess(r.entranceId) === 'public', 'referral uses a public operational entrance');
    assert(MAINTENANCE_NETWORK.find(n => n.physicalId === r.physicalId)!.tier > shop.facilityTier, 'strictly higher referral');
    assert(!r.name.includes('Emergency restart'), 'future facilities are named, not temporary self-help desks');
  }
  const game: any = Object.create(Game.prototype);
  game.career = broken(shop.locationIds[0]);
  for (const id of ['maintenanceShop', 'maintenanceReferral', 'maintenanceEmergencyConfirm']) {
    const scene = game.maintenanceShopScene({ id, selectedIndex: 0 }, shop, shop.name);
    assert(!/\btier\s*-?\d|facilityTier|\bS[0123]\b|\bW0\b/.test(JSON.stringify(scene)), 'internal facility classes never rendered');
    assert(!/routine (?:maintenance|servicing) (?:is|remains) separate|Ordinary repairs, servicing and equipment purchases remain separate/i.test(JSON.stringify(scene)), 'removed maintenance disclaimer stays absent');
  }
  const p = broken(shop.locationIds[0]);
  const before = JSON.stringify(p);
  const next = emergencyRestart(p, shop)!;
  assert(next && !deriveRestrictions(next.rig).some(r => r.componentId), 'all damage-caused work/travel restrictions cleared');
  equal(JSON.stringify(p), before, 'pure emergency operation');
  equal([next.money, next.worldTime, next.rig.rngState, next.rig.completedMaintenanceMissions], [p.money, p.worldTime, p.rig.rngState, p.rig.completedMaintenanceMissions], 'no cash, time, RNG or mission grant');
  for (const [id, state] of Object.entries(next.rig.components)) {
    equal([state.grade, state.ap, state.installed], [p.rig.components[id].grade, p.rig.components[id].ap, p.rig.components[id].installed], 'no parts or service upgrade');
  }
  assert(!emergencyRestart(next, shop), 'duplicate healthy restart is a no-op');
  assert(!emergencyRestart(broken('missing-terminal'), shop), 'remote restart rejected');
  if (shop.facilityTier === -1) {
    assert(!replacementQuote(p.rig, shop, 'powertrain-main-drive-core'), 'self-help cannot sell replacement parts');
    assert(!repairQuote(p.rig, shop, 'powertrain-main-drive-core'), 'self-help cannot sell repairs');
    equal(rigServiceQuote(p.rig, shop), { credits: 0, laborHours: 0 }, 'self-help has no paid service');
  }
}
for (const target of targets) {
  const scope = new Set(localTerminalScopeIds(target.id));
  const shops = MAINTENANCE_SHOPS.filter(s => s.locationIds.some(id => scope.has(id)));
  assert(shops.length === 1, `one real or emergency service at ${target.id}`);
  assert(localDirectoryEntriesAt(target.id, TEAMSTER_CERTIFICATION_IDS).filter(e => e.maintenanceShopId).length === 1, 'actual directory agrees');
  const p = emergencyRestart(broken(target.id), shops[0])!;
  const destination = physicalTerminalId(target.id) === 'caravanserai' ? 'estella-viii-first-rendezvous-station' : 'caravanserai-main-commercial-dock';
  assert(canTravelEmpty(p, destination), 'even private/reserve departures retain a public escape destination');
  const trip = createEmptyRun(p, destination);
  assert(trip.destinationId === destination && p.money === -1000, 'empty departure creation has no positive-cash requirement');
}
for (const row of proposal) {
  const actual = MAINTENANCE_NETWORK.find(n => n.physicalId === row.physicalId)!;
  equal([actual.tier, actual.next ?? null, actual.elite ?? null], [row.tier, row.referralPhysicalId, row.elitePhysicalId], 'approved roster and runtime referral plan agree');
  equal(MAINTENANCE_SHOPS.find(s => s.id === row.shopId)!.facilityTier, row.tier, 'every final planned facility is active');
}
assert(MAINTENANCE_NETWORK.find(n => n.physicalId === 'estella-via-drydock')!.tier === 3, 'Svarog elite approved');
const lowRefs = maintenanceReferrals(WEYMARK_PILOT_SHOPS[0]);
equal(lowRefs.map(r => r.physicalId), ['estella-viii-settlement', 'estella-viii-high-station'], 'Low Gauge recommends town and elite depot');
const future = maintenanceReferrals(MAINTENANCE_SHOPS.find(s => s.id === 'red-dust-mechanical-reclamation')!);
assert(future[0].name === 'Chalkwall Mechanical' && future[1].physicalId === 'estella-via-drydock', 'approved future facilities advertised without activation');
assert(MAINTENANCE_SHOPS.find(s => s.locationIds.some(id => physicalTerminalId(id) === 'estella-via-drydock'))!.facilityTier === 3, 'Svarog elite workshop is active');
assert(MAINTENANCE_SHOPS.find(s => s.id === 'vilar-cadiz-highport-outfitter')!.workQualityGrade === 'B', 'approved Cadiz work upgrade');

// Independent pre-edit audit: preserve all 63 accounts; only the 25 approved
// Wells promotions change commercial terms. Text changes are checked against Markdown.
let protectedQuotes = 0, approvedPromotions = 0;
for (const old of baseline.shops) {
  const shop = MAINTENANCE_SHOPS.find(s => s.id === old.id)!;
  assert(shop, `legacy account retained: ${old.id}`);
  const planned = proposal.find(p => p.shopId === shop.id)!;
  if (shop.id.startsWith('wells-frontier') && planned.tier > 0) {
    approvedPromotions++;
    assert(shop.facilityTier === planned.tier && shop.honesty === 1, 'approved Wells professional/full-service promotion');
    continue;
  }
  protectedQuotes++;
  const { copy, facilityTier, directorySummary, ...attributes } = shop;
  const { diagnosis, depletedService, driveReplacement, equipment, ...expected } = old;
  if (shop.id.startsWith('wells-frontier')) { expected.honesty = 0.8; expected.name = shop.name; expected.organizationName = shop.organizationName!; }
  if (shop.id === 'vilar-cadiz-highport-outfitter') expected.workQualityGrade = 'B';
  equal(attributes, expected, `old shop attributes: ${old.id}`);
  equal(diagnosisQuote(shop), diagnosis, 'old diagnosis quote');
  const rig = createDefaultRigState(true); for (const s of Object.values(rig.components)) s.ap = 0;
  equal(rigServiceQuote(rig, shop), depletedService, 'old service quote');
  const drive = createDefaultRigState(true); drive.components['powertrain-main-drive-core'].fault = { severity: 'total', diagnosis: 'confirmed', generatedMission: 0, generatedStrike: 0 };
  equal(replacementQuote(drive, shop, 'powertrain-main-drive-core'), driveReplacement, 'old replacement quote');
  equal(Object.fromEntries((shop.equipmentIds ?? []).map(id => [id, equipmentQuote(id === 'heavy-heat-shielding' ? createDefaultRigState(true) : createDefaultRigState(false), shop, id, 'D')])), equipment, 'old installation quotes');
}
equal([protectedQuotes, approvedPromotions], [38, 25], 'exact legacy economic-change boundary');
for (const shop of COVERAGE_SHOPS.filter(s => s.facilityTier >= 0)) {
  const rig = createDefaultRigState(true); for (const state of Object.values(rig.components)) state.ap = 0;
  const drive = createDefaultRigState(true); drive.components['powertrain-main-drive-core'].fault = { severity: 'total', diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
  const professional = shop.facilityTier === 1;
  equal([diagnosisQuote(shop).credits, diagnosisQuote(shop).laborHours, rigServiceQuote(rig, shop).credits, rigServiceQuote(rig, shop).laborHours, replacementQuote(drive, shop, 'powertrain-main-drive-core')!.credits], shop.facilityTier === 3 ? [2240, 1.6, 22400, 16, 350160] : shop.facilityTier === 2 ? [1440, 1.8, 14400, 18, 312960] : professional ? [1000, 2, 10000, 20, 309000] : [500, 2, 3625, 14.5, shop.partsMarkup === 1.5 ? 364500 : 280500], 'independent approved quote examples');
  for (const id of shop.equipmentIds ?? []) {
    const quote = equipmentQuote(id === 'heavy-heat-shielding' ? createDefaultRigState(true) : createDefaultRigState(false), shop, id, 'D');
    assert(quote, 'all approved professional equipment is actually available');
  }
}
for (const shop of MAINTENANCE_SHOPS.filter(s => s.facilityTier >= 0)) for (const component of MAINTENANCE_COMPONENTS) for (const fault of componentFaults(component)) {
  const rig = createDefaultRigState(true), state = rig.components[component.id];
  if (!state.installed) continue;
  state.fault = { severity: fault.severity, faultId: fault.id, diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
  diagnoseRigAtShop(rig, shop);
  const quote = repairQuote(rig, shop, component.id);
  const rank = 'ABCDEF';
  assert(!!quote === (rank.indexOf(shop.diagnosticGrade) <= rank.indexOf(fault.workGrade) && rank.indexOf(shop.workQualityGrade) <= rank.indexOf(fault.workGrade)), 'real fault capability matrix');
  assert(replacementQuote(rig, shop, component.id), 'replacement remains available even for unknown/complex faults');
}
// New game actions: no paid inspection for advice/restart, no remote execution,
// no state publication before persistence, and no tier/credit migration layer.
let writes = 0, fail = false;
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => null, setItem: () => { if (fail) throw Error('blocked'); writes++; } }, configurable: true });
const game: any = Object.create(Game.prototype);
const basic = WEYMARK_PILOT_SHOPS[0];
game.career = broken(basic.locationIds[0]); game.worldTime = 0; game.showGuidance = () => {};
game.phase = { kind: 'interactiveScene', scene: { id: 'maintenanceShop', selectedIndex: 0, maintenanceShopId: basic.id } };
const action = (s: string) => game.activateInteractiveSceneOption({}, s);
const untouched = JSON.stringify(game.career);
action(`maintenanceReferral:${basic.id}`);
assert(game.phase.scene.id === 'maintenanceReferral' && writes === 0, 'free referral without inspection');
equal(JSON.stringify(game.career), untouched, 'advice has no side effects');
action(`maintenanceEmergencyConfirm:${basic.id}`); equal(JSON.stringify(game.career), untouched, 'confirmation is nonmutating');
fail = true; action(`maintenanceEmergency:${basic.id}`); equal(JSON.stringify(game.career), untouched, 'failed save leaves entire career unchanged');
fail = false; action(`maintenanceEmergency:${basic.id}`); assert(Number(writes) === 1 && !emergencyRestartNeeded(game.career), 'one atomic emergency save at negative cash');
action(`maintenanceEmergency:${basic.id}`); assert(Number(writes) === 1, 'duplicate recovery does not save');
assert(!canTravelEmpty(game.career, 'deepest-dock-poi'), 'emergency work never grants Farwatch access');
const creditCase = broken(basic.locationIds[0]);
creditCase.maintenanceShopInspections[basic.id] = { diagnosedWorldTime: 10, diagnosedMaintenanceMission: 0, creditRemaining: 123, dishonestyRevision: 2, fabricatedFaults: [], fabricatedServiceComponentIds: [], pretendMaintainedComponentIds: [] };
const creditReset = emergencyRestart(creditCase, basic)!;
equal(creditReset.maintenanceShopInspections[basic.id].creditRemaining, 123, 'recovery preserves unused credit');
assert(creditReset.maintenanceShopInspections[basic.id].diagnosedMaintenanceMission === undefined, 'superseded report becomes stale without a version layer');
const bare = profile(basic.locationIds[0]); bare.rig = createDefaultRigState(false);
bare.rig.components['powertrain-main-drive-core'].fault = { severity: 'total', diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
const bareReset = emergencyRestart(bare, basic)!;
assert(!bareReset.rig.components['atmospheric-heat-shielding'].installed, 'recovery never grants missing atmospheric equipment');
const selfHelp = EMERGENCY_MAINTENANCE_SHOPS[0];
game.career = broken(selfHelp.locationIds[0]); game.career.money = 1000000;
game.career.maintenanceShopInspections[selfHelp.id] = { ...creditCase.maintenanceShopInspections[basic.id] };
const beforePaidBypass = JSON.stringify(game.career), beforePaidWrites = writes;
for (const op of ['maintenanceDiagnose', 'maintenanceServiceAll', 'maintenanceRepairAll']) action(`${op}:${selfHelp.id}`);
action(`maintenanceWork:${selfHelp.id}:powertrain-main-drive-core:replace`);
equal(JSON.stringify(game.career), beforePaidBypass, 'forged paid actions cannot turn self-help into a shop');
equal(writes, beforePaidWrites, 'forged paid actions never save');
game.career = profile(basic.locationIds[0]);
game.career.rig.components['powertrain-main-drive-core'].fault = { severity: 'major', diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
assert(deriveRestrictions(game.career.rig).some(r => r.id === 'high-thrust-unavailable'), 'nongrounded fixture has a real operating restriction');
const restrictedBefore = JSON.stringify(game.career), restrictedWrites = writes;
const restrictedScene = game.maintenanceShopScene({ id: 'maintenanceShop', selectedIndex: 0 }, basic, basic.name);
assert(restrictedScene.options.find((o: any) => o.action === `maintenanceEmergencyConfirm:${basic.id}`).disabled, 'nongrounded emergency button is disabled');
action(`maintenanceEmergencyConfirm:${basic.id}`);
action(`maintenanceEmergency:${basic.id}`);
equal(JSON.stringify(game.career), restrictedBefore, 'nongrounded direct actions cannot recover the rig');
equal(writes, restrictedWrites, 'nongrounded actions never save');
// Exercise real paid actions at every newly templated staffed branch. Copy
// reuse never shares inspection credit; private shops reject remote actions.
for (const shop of COVERAGE_SHOPS.filter(s => s.facilityTier >= 0)) {
  game.career = profile(shop.locationIds[0]); game.career.money = 1000000; game.worldTime = 0;
  for (const key of Object.keys(game.career.rig.components)) game.career.rig.components[key].ap = 0;
  game.career.maintenanceShopInspections[basic.id] = { diagnosedWorldTime: 0, creditRemaining: 777, dishonestyRevision: 2, fabricatedFaults: [], fabricatedServiceComponentIds: [], pretendMaintainedComponentIds: [] };
  const beforeInspectionWrites = writes;
  action(`maintenanceDiagnose:${shop.id}`);
  const inspection = diagnosisQuote(shop);
  equal([game.career.money, game.career.worldTime, writes - beforeInspectionWrites], [1000000 - inspection.credits, inspection.laborHours * 3600, 1], 'actual diagnosis charges exact quote once');
  equal(game.career.maintenanceShopInspections[shop.id].creditRemaining, inspection.credits, 'local inspection credit recorded');
  equal(game.career.maintenanceShopInspections[basic.id].creditRemaining, 777, 'other branch credit retained');
  if (shop.facilityTier === 1) {
    action(`maintenanceServiceAll:${shop.id}`);
    equal([game.career.money, game.career.worldTime, game.career.maintenanceShopInspections[shop.id].creditRemaining], [990000, 22 * 3600, 0], 'professional service applies credit once and advances quoted time');
    const serviced = JSON.stringify(game.career), serviceWrites = writes;
    action(`maintenanceServiceAll:${shop.id}`);
    equal([JSON.stringify(game.career), writes], [serviced, serviceWrites], 'duplicate service cannot charge again');
  }
  game.career.locationId = basic.locationIds[0];
  const remoteBefore = JSON.stringify(game.career), remoteWrites = writes;
  for (const op of ['maintenanceDiagnose', 'maintenanceServiceAll', 'maintenanceRepairAll', 'maintenanceEmergency']) action(`${op}:${shop.id}`);
  equal([JSON.stringify(game.career), writes], [remoteBefore, remoteWrites], 'all direct remote work rejected');
}
console.log(`Maintenance coverage: ${checks} checks; 159 physical scopes, 150 staffed shops, 9 self-help desks; 38 exact legacy quote sets, 25 approved Wells promotions.`);
