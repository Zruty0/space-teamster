import { defaultCareerProfile, loadCareerProfile, saveCareerProfile } from '../src/career-state';
import { Game } from '../src/game';
import { SERRAT_DOMAIN_CIVIL_REFIT_OFFICE as shop, VILAR_HERALD_GATE_SHOP as other, diagnosisQuote } from '../src/maintenance/shops';
import { resolveMaintenanceSettlement } from '../src/maintenance/strike-resolution';
import { createMaintenanceTelemetry } from '../src/maintenance/telemetry';
import { estimateEstellaMissionCost } from '../src/mission-cost';
import { equipmentPayment, equipmentQuote, purchaseEquipment } from '../src/maintenance/equipment';

let assertions = 0;
function assert(value: unknown, message: string): asserts value { assertions++; if (!value) throw new Error(message); }
function equal(a: unknown, b: unknown, message: string) { assert(JSON.stringify(a) === JSON.stringify(b), message); }
const storage = new Map<string, string>();
let writes = 0, failWrites = false;
let beforeSave: (() => void) | undefined;
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { beforeSave?.(); if (failWrites) throw new Error('Storage unavailable'); writes++; storage.set(key, value); },
  removeItem: (key: string) => storage.delete(key),
} });
const game: any = Object.create(Game.prototype);
game.career = { ...defaultCareerProfile(), locationId: shop.locationIds[0], money: 1_000_000 };
game.worldTime = 0;
game.phase = { kind: 'interactiveScene', scene: { id: 'maintenanceShop', selectedIndex: 0, maintenanceShopId: shop.id } };
const action = (value: string) => game.activateInteractiveSceneOption({}, value);
const profileScene = () => game.maintenanceShopScene({ id: 'maintenanceShop', selectedIndex: 0 }, shop, 'Serrat Domain Shipyard');
const diagnosed = () => game.maintenanceShopDiagnosed(shop.id);
const diagnosticOption = () => profileScene().options.find((o: any) => o.label === 'Diagnostic Inspection');
assert(!diagnosed() && !diagnosticOption().disabled, 'first visit offers diagnosis');
assert(profileScene().options.find((o: any) => o.label === 'Service').disabled, 'first visit gates service');
const quote = diagnosisQuote(shop);
const original = game.career;
beforeSave = () => assert(game.career === original, 'diagnosis saves before publishing career');
action(`maintenanceDiagnose:${shop.id}`);
beforeSave = undefined;
equal(writes, 1, 'diagnosis saves once');
equal(game.career.money, original.money - quote.credits, 'diagnosis charges its quoted price');
equal(game.career.worldTime, quote.laborHours * 3600, 'diagnosis charges its quoted time');
assert(diagnosed() && diagnosticOption().disabled, 'diagnosis disabled only for current report');
equal(game.career.maintenanceShopInspections[shop.id].diagnosedMaintenanceMission, 0, 'inspection records current mission counter');
assert(!game.maintenanceShopDiagnosed(other.id), 'diagnosis does not unlock another branch');
const afterDiagnosis = JSON.stringify(game.career);
action(`maintenanceDiagnose:${shop.id}`);
equal(JSON.stringify(game.career), afterDiagnosis, 'duplicate diagnosis is a no-op');
equal(writes, 1, 'duplicate diagnosis does not save');
game.career.worldTime += 3600;
assert(diagnosed(), 'waiting or shop time does not invalidate report');

// Pending success and a discarded/retried settlement must not expire the report.
const context = { missionId: 'inspection-test', title: 'Inspection flight', sourceId: shop.locationIds[0], destinationId: shop.locationIds[0], manifestKind: 'empty' as const, manifestMassTons: 0, attempt: 1, startWorldTime: game.career.worldTime };
const settlement = resolveMaintenanceSettlement(createMaintenanceTelemetry(), context, game.career.rig, game.career.worldTime + 100);
game.pendingMaintenanceSettlement = settlement;
assert(diagnosed(), 'pending success has not expired inspection');
game.pendingMaintenanceSettlement = null;
assert(diagnosed(), 'discarded settlement / retry preserves inspection');
equal(resolveMaintenanceSettlement(createMaintenanceTelemetry(), context, game.career.rig, game.career.worldTime + 100), settlement, 'retry remains deterministic');

// Exercise the real delivery commit, not an eager invalidation on departure.
game.activeCareerContract = { destinationId: shop.locationIds[0] };
game.activeMissionQuote = estimateEstellaMissionCost('estella-xi-science-waypoint-poi', 'estella-xif-deep-listening-array', { label: 'Test cargo', massTons: 0 });
game.activeManifestCondition = {};
game.missionDvUsed = 100;
game.worldTime = game.career.worldTime + 100;
game.pendingMaintenanceSettlement = settlement;
game.loadStationTerminal = () => {};
game.finishCareerDelivery();
assert(!diagnosed() && !diagnosticOption().disabled, 'successful delivery reopens diagnosis');
assert(profileScene().options.find((o: any) => o.label === 'Service').disabled, 'stale report gates service');
assert(profileScene().options.find((o: any) => o.label === 'Repairs and Replacements').disabled, 'stale report gates repairs');
equal(game.career.maintenanceShopInspections[shop.id].creditRemaining, quote.credits, 'expiry preserves unused credit');
const stale = JSON.stringify(game.career);
action(`maintenanceServiceAll:${shop.id}`);
equal(JSON.stringify(game.career), stale, 'direct stale service action cannot bypass gate');
const equipment = equipmentQuote(game.career.rig, shop, 'atmospheric-package')!;
equal(equipmentPayment(game.career, shop, equipment).credit, quote.credits, 'expired inspection credit still applies to equipment');
const bought = purchaseEquipment(game.career, shop, 'atmospheric-package')!;
equal(bought.maintenanceShopInspections[shop.id].creditRemaining, 0, 'equipment can consume old credit without diagnosis');
equal(game.career.maintenanceShopInspections[shop.id].creditRemaining, quote.credits, 'pure equipment transaction leaves active credit untouched');

// Newly faulted hardware must be diagnosable on a return visit.
const component = game.career.rig.components['body-main-chassis'];
component.hp = 0;
component.fault = { severity: 'total', diagnosis: 'unknown', generatedMission: 1, generatedStrike: 1 };
const claim = { id: 'old-claim', systemId: 'body-and-frame', componentId: 'body-main-chassis', faultId: 'old-fault', statusActive: true };
game.career.maintenanceShopInspections[other.id] = {
  diagnosedWorldTime: 0, diagnosedMaintenanceMission: 0, creditRemaining: 123,
  dishonestyRevision: 2, fabricatedFaults: [claim], fabricatedServiceComponentIds: ['body-main-chassis'], pretendMaintainedComponentIds: ['auxiliary-comms'],
};
game.career.maintenanceShopInspections[shop.id].pretendMaintainedComponentIds = ['body-main-chassis'];
const oldProfile = game.career, oldJson = JSON.stringify(oldProfile), oldTime = game.worldTime;
failWrites = true;
action(`maintenanceDiagnose:${shop.id}`);
assert(game.career === oldProfile, 'failed diagnosis does not publish career');
equal(JSON.stringify(game.career), oldJson, 'failed diagnosis preserves money, faults, claims, and credits');
equal(game.worldTime, oldTime, 'failed diagnosis preserves active world time');
assert(!diagnosed(), 'failed diagnosis does not unlock maintenance');
failWrites = false;
const writesBeforeRenewal = writes;
action(`maintenanceDiagnose:${shop.id}`);
equal(writes, writesBeforeRenewal + 1, 'renewal saves once');
assert(diagnosed(), 'renewed report is current');
equal(game.career.rig.components['body-main-chassis'].fault.diagnosis, 'confirmed', 'return visit can diagnose new damage');
equal(game.career.maintenanceShopInspections[shop.id].creditRemaining, quote.credits, 'renewal credit replaces rather than stacks');
equal(game.career.maintenanceShopInspections[shop.id].pretendMaintainedComponentIds, ['body-main-chassis'], 'local sham-service state retained');
equal(game.career.maintenanceShopInspections[other.id].fabricatedFaults, [], 'new diagnosis supersedes old fabricated faults globally');
equal(game.career.maintenanceShopInspections[other.id].creditRemaining, 123, 'other credit retained');
equal(game.career.maintenanceShopInspections[other.id].pretendMaintainedComponentIds, ['auxiliary-comms'], 'other sham-service state retained');
game.career = loadCareerProfile();
assert(diagnosed(), 'current report survives save/load');
game.career.worldTime += 10000;
assert(diagnosed(), 'later shop work does not expire report');

// Legacy saves cannot prove freshness: allow reinspection but retain credit/history.
for (const marker of [undefined, -1, 0.5, '1', null]) {
  const legacy = structuredClone(game.career);
  legacy.maintenanceShopInspections[shop.id].diagnosedMaintenanceMission = marker;
  storage.set('space-teamster.career.v1', JSON.stringify(legacy));
  game.career = loadCareerProfile();
  assert(!diagnosed(), 'legacy/invalid marker cannot lock diagnosis forever');
  equal(game.career.maintenanceShopInspections[shop.id].creditRemaining, quote.credits, 'legacy credit retained');
  equal(game.career.maintenanceShopInspections[shop.id].pretendMaintainedComponentIds, ['body-main-chassis'], 'legacy sham state retained');
}
const noMoney = { ...game.career, money: 0 };
game.career = noMoney;
action(`maintenanceDiagnose:${shop.id}`);
assert(game.career === noMoney && !diagnosed(), 'insufficient funds cannot renew');
game.career = { ...game.career, money: 1_000_000, locationId: other.locationIds[0] };
const remote = JSON.stringify(game.career);
action(`maintenanceDiagnose:${shop.id}`);
equal(JSON.stringify(game.career), remote, 'remote renewal rejected');
game.career.locationId = shop.locationIds[0];
action(`maintenanceDiagnose:${shop.id}`);
saveCareerProfile(game.career);
game.career = loadCareerProfile();
assert(diagnosed(), 'legacy report can be renewed and persisted');
console.log(`Maintenance inspection regression passed: ${assertions} assertions.`);
