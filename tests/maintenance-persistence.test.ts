import { Game } from '../src/game';
import { defaultCareerProfile } from '../src/career-state';
import { MAINTENANCE_SHOPS } from '../src/maintenance/shops';
import { createDefaultRigState } from '../src/maintenance/rig-state';
import { MAINTENANCE_COMPONENTS, componentFaults } from '../src/maintenance/catalog';
let checks = 0, writes = 0, fail = false;
function assert(v: unknown, message: string): asserts v { checks++; if (!v) throw Error(message); }
function equal(a: unknown, b: unknown, message: string) { assert(JSON.stringify(a) === JSON.stringify(b), message); }
let beforeSave: (() => void) | undefined;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null, setItem: () => { beforeSave?.(); if (fail) throw Error('blocked'); writes++; } } });
for (const mode of ['all-service', 'system-service', 'repair', 'replace', 'bulk-repair', 'fabricated']) {
  const shop = MAINTENANCE_SHOPS.find(s => mode === 'fabricated' ? s.id === 'red-dust-mechanical-reclamation' : s.facilityTier === 3)!;
  const game: any = Object.create(Game.prototype);
  game.career = { ...defaultCareerProfile(), locationId: shop.locationIds[0], money: 5000000, rig: createDefaultRigState(true) };
  game.worldTime = 0; game.showGuidance = () => {};
  game.phase = { kind: 'interactiveScene', scene: { id: 'maintenanceShop', selectedIndex: 0, maintenanceShopId: shop.id } };
  const action = (value: string) => game.activateInteractiveSceneOption({}, value);
  const c = MAINTENANCE_COMPONENTS.find(c => c.id === 'body-main-chassis')!;
  const fault = componentFaults(c)[0];
  if (['repair', 'replace', 'bulk-repair', 'fabricated'].includes(mode)) {
    const state = game.career.rig.components[c.id]; state.hp = 1;
    state.fault = mode === 'replace' ? { severity: 'total', diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 } : { severity: fault.severity, faultId: fault.id, diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
  }
  for (const state of Object.values(game.career.rig.components) as any[]) state.ap = 0;
  action(`maintenanceDiagnose:${shop.id}`);
  const record = game.career.maintenanceShopInspections[shop.id];
  const claim = record.fabricatedFaults[0];
  if (mode === 'fabricated') assert(claim, 'dishonest shop generates a real claim');
  // Exercise all ancillary bookkeeping, not only cash and HP.
  record.fabricatedServiceComponentIds.push(c.id);
  game.career.maintenanceShopInspections.other = { ...structuredClone(record), creditRemaining: 77 };
  const command = mode === 'all-service' ? `maintenanceServiceAll:${shop.id}`
    : mode === 'system-service' ? `maintenanceService:${shop.id}:${c.systemId}`
    : mode === 'bulk-repair' ? `maintenanceRepairAll:${shop.id}`
    : mode === 'fabricated' ? `maintenanceFabricatedWork:${shop.id}:${claim.id}`
    : `maintenanceWork:${shop.id}:${c.id}:${mode === 'repair' ? 'repair' : 'replace'}`;
  const original = game.career, json = JSON.stringify(original), time = game.worldTime, phase = JSON.stringify(game.phase), count = writes;
  fail = true;
  // Catch an old thrown storage error so the regression identifies the lost-state bug.
  try { action(command); } catch {}
  equal([JSON.stringify(game.career), game.worldTime, JSON.stringify(game.phase), writes], [json, time, phase, count], `${mode}: failed save must leave all state untouched`);
  assert(game.career === original, `${mode}: failed save retains original profile`);
  fail = false;
  beforeSave = () => {
    assert(game.career === original, `${mode}: persist before publishing`);
    equal([JSON.stringify(original), game.worldTime], [json, time], `${mode}: no early profile/world mutation`);
  };
  action(command); beforeSave = undefined;
  assert(writes === count + 1 && game.career !== original, `${mode}: retry commits once`);
  equal(JSON.stringify(original), json, `${mode}: old profile not mutated on success either`);
  equal([game.career.maintenanceShopInspections[shop.id].creditRemaining, game.career.maintenanceShopInspections.other.creditRemaining], [0, 77], `${mode}: local credit consumed once, other credit preserved`);
  assert(game.career.money < original.money && game.career.worldTime > original.worldTime && game.worldTime === game.career.worldTime, `${mode}: successful work publishes payment/time`);
}
console.log(`Maintenance persistence: ${checks} checks; service, system service, repair, replacement, bulk repair and fabricated work are save-before-publish.`);
