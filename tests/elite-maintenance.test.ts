import { Game } from '../src/game';
import { defaultCareerProfile, TEAMSTER_CERTIFICATION_IDS } from '../src/career-state';
import { MAINTENANCE_SHOPS, diagnosisQuote, rigServiceQuote, repairQuote, replacementQuote, stockedComponentGrades, diagnoseRigAtShop, repairComponentAtShop, type MaintenanceShopDef } from '../src/maintenance/shops';
import { ELITE_COPY } from '../src/maintenance/elite-copy';
import { MAINTENANCE_COMPONENTS, componentFaults } from '../src/maintenance/catalog';
import { createDefaultRigState, validateRigState } from '../src/maintenance/rig-state';
import { equipmentQuote, purchaseEquipment } from '../src/maintenance/equipment';
import { maintenanceReferrals } from '../src/maintenance/referrals';
import { physicalTerminalId } from '../src/physical-terminals';
import baseline from './fixtures/maintenance-stage-4-fingerprints.json';
let checks = 0, writes = 0, fail = false;
function assert(v: unknown, message: string): asserts v { checks++; if (!v) throw Error(message); }
function equal(a: unknown, b: unknown, message: string) { assert(JSON.stringify(a) === JSON.stringify(b), message); }
function close(a: number, b: number, message: string) { assert(Math.abs(a - b) < 1e-7, message); }
function profile(shop: MaintenanceShopDef, atmosphere = true) { return { ...defaultCareerProfile(), locationId: shop.locationIds[0], money: 10000000, certifications: [...TEAMSTER_CERTIFICATION_IDS], rig: createDefaultRigState(atmosphere) }; }
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null, setItem: () => { if (fail) throw Error('blocked'); writes++; } } });
const elites = MAINTENANCE_SHOPS.filter(s => s.facilityTier === 3);
equal(elites.map(s => physicalTerminalId(s.locationIds[0])).sort(), ['estella-iii-high-tech-city', 'estella-via-drydock', 'estella-viii-high-station', 'estella-xie-outer-spec-drydock-station'].sort(), 'exact four elite landmarks');
equal(Object.keys(ELITE_COPY).sort(), baseline.promoted.map(s => s.physicalId).sort(), 'exact two new elite accounts');
for (const shop of elites) {
  let p = profile(shop);
  p = purchaseEquipment(p, shop, 'cargo-shock-absorbers', 'D')!;
  p = purchaseEquipment(p, shop, 'passenger-comfort-package', 'D')!;
  equal(validateRigState(p.rig), [], 'valid fully equipped rig');
  assert(Object.values(p.rig.components).every(c => c.installed), 'exercise every component');
  const faults = new Set<string>(), aOnly = new Set<string>(); let pairs = 0;
  for (const c of MAINTENANCE_COMPONENTS) for (const f of componentFaults(c)) {
    pairs++; faults.add(f.id); if (f.workGrade === 'A') aOnly.add(f.id);
    const rig = structuredClone(p.rig), state = rig.components[c.id];
    state.hp = f.severity === 'minor' ? c.minorThreshold : 1;
    state.fault = { severity: f.severity, faultId: f.id, diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
    assert(!repairQuote(rig, shop, c.id), 'unknown fault cannot be repaired before diagnosis');
    diagnoseRigAtShop(rig, shop);
    assert(state.fault.diagnosis === 'confirmed' && repairQuote(rig, shop, c.id), 'elite identifies and quotes every catalogued repair');
    const grade = state.grade;
    assert(repairComponentAtShop(rig, shop, c.id, 1234), 'every quoted repair actually executes');
    assert(!state.fault && state.grade === grade && state.lastServiceWorldTime === 1234, 'repair clears damage without upgrading parts');
    equal(validateRigState(rig), [], 'repaired rig stays valid');
  }
  equal([pairs, faults.size, aOnly.size], [520, 320, 6], 'complete fault catalog at each elite');
  equal(maintenanceReferrals(shop), [], 'no higher-service referral at an elite');
  const game: any = Object.create(Game.prototype);
  game.worldTime = 0; game.showGuidance = () => {};
  const reset = () => { game.career = profile(shop); game.worldTime = 0; game.phase = { kind: 'interactiveScene', scene: { id: 'maintenanceShop', maintenanceShopId: shop.id, selectedIndex: 0 } }; };
  const action = (value: string) => game.activateInteractiveSceneOption({}, value);
  // Execute all seven A-only component/fault combinations through the real game handlers.
  for (const c of MAINTENANCE_COMPONENTS) for (const f of componentFaults(c).filter(f => f.workGrade === 'A')) {
    reset(); const state = game.career.rig.components[c.id];
    assert(state.installed, 'A-only repair fixture is installed');
    state.hp = 1; state.fault = { severity: f.severity, faultId: f.id, diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
    action(`maintenanceDiagnose:${shop.id}`);
    const quote = repairQuote(game.career.rig, shop, c.id)!;
    assert(quote, 'A repair quoted after actual paid inspection');
    const original = game.career, json = JSON.stringify(original), time = game.worldTime, count = writes;
    fail = true; action(`maintenanceWork:${shop.id}:${c.id}:repair`); fail = false;
    equal([JSON.stringify(game.career), game.worldTime, writes], [json, time, count], 'failed A repair leaves cash/time/faults/credit untouched');
    for (const money of [0, -1000]) {
      game.career = { ...original, money }; const poor = JSON.stringify(game.career);
      action(`maintenanceWork:${shop.id}:${c.id}:repair`); equal(JSON.stringify(game.career), poor, 'unaffordable elite work denied');
    }
    game.career = { ...original, locationId: 'missing-terminal' }; const remote = JSON.stringify(game.career);
    action(`maintenanceWork:${shop.id}:${c.id}:repair`); equal(JSON.stringify(game.career), remote, 'remote elite repair denied');
    game.career = original;
    action(`maintenanceWork:${shop.id}:${c.id}:repair`);
    assert(!game.career.rig.components[c.id].fault && writes === count + 1, 'actual A repair committed once');
    equal(game.career.money, original.money - Math.max(0, quote.credits - diagnosisQuote(shop).credits), 'exact A repair charge and branch credit');
    close(game.career.worldTime, original.worldTime + quote.laborHours * 3600, 'exact A repair time');
    equal(JSON.stringify(original), json, 'repair transaction leaves original profile untouched');
  }
  reset();
  const driveId = 'powertrain-main-drive-core', total = game.career.rig.components[driveId];
  total.hp = 0; total.fault = { severity: 'total', diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
  action(`maintenanceDiagnose:${shop.id}`);
  const replacement = replacementQuote(game.career.rig, shop, driveId)!;
  action(`maintenanceWork:${shop.id}:${driveId}:replace`);
  assert(!game.career.rig.components[driveId].fault && game.career.rig.components[driveId].grade === replacement.grade && game.career.rig.components[driveId].hp > 0, 'actual Total replacement fits the quoted grade');
  equal(game.career.money, 10000000 - replacement.credits, 'exact replacement charge including paid-inspection credit');
  close(game.career.worldTime, (diagnosisQuote(shop).laborHours + replacement.laborHours) * 3600, 'exact diagnosis plus replacement time');
  reset(); const original = JSON.stringify(game.career), count = writes;
  action(`maintenanceReferral:${shop.id}`);
  equal([JSON.stringify(game.career), writes, game.phase.scene.id], [original, count, 'maintenanceShop'], 'forged higher-referral action is a no-op');
  const scene = game.maintenanceShopScene(game.phase.scene, shop, shop.name);
  assert(!scene.options.some((o: any) => o.action.startsWith('maintenanceReferral:')), 'no misleading higher-work button');
  assert(!/\btier\s*-?\d|facilityTier|\bS3\b/.test(JSON.stringify(scene)), 'internal class hidden');
  if (!ELITE_COPY[physicalTerminalId(shop.locationIds[0])]) continue;
  equal([shop.diagnosticGrade, shop.workQualityGrade, shop.laborRate, shop.diagnosisHours, shop.laborHoursMultiplier, shop.partsMarkup, shop.honesty], ['A', 'A', 1400, 2, 0.8, 1.1, 1], 'approved elite commercial terms');
  equal(stockedComponentGrades(shop), ['A', 'B', 'C', 'D'], 'four stocked grades');
  const depleted = createDefaultRigState(true); for (const s of Object.values(depleted.components)) s.ap = 0;
  const broken = createDefaultRigState(true); broken.components['powertrain-main-drive-core'].hp = 0;
  broken.components['powertrain-main-drive-core'].fault = { severity: 'total', diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
  equal([diagnosisQuote(shop).credits, diagnosisQuote(shop).laborHours, rigServiceQuote(depleted, shop).credits, rigServiceQuote(depleted, shop).laborHours, replacementQuote(broken, shop, 'powertrain-main-drive-core')!.credits], [2240, 1.6, 22400, 16, 350160], 'independent approved S3 quote examples');
  assert(!repairQuote(broken, shop, 'powertrain-main-drive-core'), 'Total still requires replacement');
  // Pre-existing professional inspection and unused credit keep their ordinary lifecycle.
  reset(); game.career.rig = depleted;
  game.career.maintenanceShopInspections[shop.id] = { diagnosedWorldTime: 0, diagnosedMaintenanceMission: 0, creditRemaining: 1000, dishonestyRevision: 2, fabricatedFaults: [], fabricatedServiceComponentIds: [], pretendMaintainedComponentIds: [] };
  game.career.maintenanceShopInspections.other = { ...structuredClone(game.career.maintenanceShopInspections[shop.id]), creditRemaining: 77 };
  const oldInspection = JSON.stringify(game.career); action(`maintenanceDiagnose:${shop.id}`);
  equal(JSON.stringify(game.career), oldInspection, 'current old report not forcibly renewed or migrated');
  action(`maintenanceServiceAll:${shop.id}`);
  equal([game.career.money, game.career.worldTime, game.career.maintenanceShopInspections[shop.id].creditRemaining, game.career.maintenanceShopInspections.other.creditRemaining], [10000000 - 21400, 16 * 3600, 0, 77], 'old local credit applies once at new service rate');
  const installedPrices = [153280, 72720, 48480, 60600];
  for (const [index, id] of shop.equipmentIds!.entries()) {
    const rig = createDefaultRigState(id === 'heavy-heat-shielding');
    equal(equipmentQuote(rig, shop, id, 'D')!.credits, installedPrices[index], 'independent D equipment price');
    for (const grade of id === 'heavy-heat-shielding' ? ['D'] as const : stockedComponentGrades(shop)) {
      reset(); game.career = profile(shop, id === 'heavy-heat-shielding');
      const q = equipmentQuote(game.career.rig, shop, id, grade)!; assert(q, 'every stocked equipment grade available');
      const before = JSON.stringify(game.career), count = writes;
      fail = true; action(`equipmentBuy:${shop.id}:${id}:${grade}`); fail = false;
      equal([JSON.stringify(game.career), writes], [before, count], 'failed equipment save is atomic');
      action(`equipmentBuy:${shop.id}:${id}:${grade}`);
      equal([game.career.money, writes], [10000000 - q.credits, count + 1], 'actual equipment purchase charge');
      close(game.career.worldTime, q.laborHours * 3600, 'actual equipment installation time');
      for (const componentId of q.componentIds) assert(game.career.rig.components[componentId].installed && game.career.rig.components[componentId].grade === grade, 'actual chosen-grade equipment installed');
      if (id === 'heavy-heat-shielding') assert(game.career.rig.optionalEquipment.includes(id), 'heavy shielding actually installed');
      equal(validateRigState(game.career.rig), [], 'purchased rig valid');
    }
  }
  assert(!equipmentQuote(createDefaultRigState(false), shop, 'heavy-heat-shielding'), 'no AP prerequisite bypass');
}
console.log(`Elite acceptance: ${checks} checks; four landmarks, all 320 faults / 520 pairs each, every A-only paid repair, two S3 upgrades and actual A–D installations.`);
