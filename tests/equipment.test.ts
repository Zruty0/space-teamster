import { defaultCareerProfile, loadCareerProfile, saveCareerProfile } from '../src/career-state';
import { equipmentPayment, equipmentQuote, purchaseEquipment, RIG_EQUIPMENT } from '../src/maintenance/equipment';
import { MAINTENANCE_SHOPS, VILAR_HERALD_GATE_SHOP as shop, BRUCKNER_WEYMARK_SERVICE_HALL as bruckner, RED_DUST_MECHANICAL, WELLS_FRONTIER_OUTFITTERS, stockedComponentGrades } from '../src/maintenance/shops';
import { atmosphericExposureIsFatal, cloneRigState, createDefaultRigState, deriveRestrictions, maintenanceSystemFullyInstalled, migrateRigState, rigAtmosphericHeatMultiplier, validateRigState } from '../src/maintenance/rig-state';
import { maintenanceComponentById, maintenanceSystemById } from '../src/maintenance/catalog';
import { removeOptionalMaintenanceSystem } from '../src/maintenance/maintenance-service';
import { componentServicedAp } from '../src/maintenance/grades';
import { createMaintenanceTelemetry } from '../src/maintenance/telemetry';
import { resolveMaintenanceSettlement } from '../src/maintenance/strike-resolution';
import { equipmentScene } from '../src/equipment-scene';
import { advanceTemperature } from '../src/thermal';
import { APPROACH_LEVELS, createApproachState, predictTrajectory, updateApproach } from '../src/approach';
import { ORBITAL_LEVELS, createOrbitalState, orbitalToApproachParams, predictOrbit, updateOrbital } from '../src/orbital';
import { Game } from '../src/game';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { createManifestConditionState } from '../src/manifest-condition';
import type { InputState } from '../src/input';

let assertions = 0;
function assert(value: unknown, message: string): asserts value { assertions++; if (!value) throw new Error(message); }
function equal(a: unknown, b: unknown, message: string) { assert(JSON.stringify(a) === JSON.stringify(b), message); }
function close(a: number, b: number, message: string) { assert(Math.abs(a - b) < 1e-8, `${message}: ${a} != ${b}`); }
const storage = new Map<string, string>();
let storageWrites = 0;
let failWrites = false;
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { if (failWrites) throw new Error('Storage unavailable'); storageWrites++; storage.set(key, value); },
  removeItem: (key: string) => storage.delete(key),
} });
const profile = { ...defaultCareerProfile(), locationId: shop.locationIds[0], money: 1_000_000 };
const before = JSON.stringify(profile);
const quote = equipmentQuote(profile.rig, shop, 'atmospheric-package')!;
equal([quote.partsCredits, quote.laborHours, quote.credits], [120_000, 19, 129_500], 'grade D catalog pricing');
assert(!purchaseEquipment({ ...profile, money: quote.credits - 1 }, shop, 'atmospheric-package'), 'insufficient funds');
assert(!purchaseEquipment({ ...profile, locationId: 'caravanserai-main-commercial-dock' }, shop, 'atmospheric-package'), 'remote shop denied');
assert(!purchaseEquipment(profile, shop, 'heavy-heat-shielding'), 'heavy requires package');
assert(!equipmentQuote(profile.rig, shop, 'atmospheric-package', 'A'), 'unstocked grade denied');
assert(!equipmentQuote(profile.rig, RED_DUST_MECHANICAL, 'atmospheric-package'), 'dishonest shop not equipment vendor');
assert(WELLS_FRONTIER_OUTFITTERS.every(s => !s.equipmentIds), 'frontier shops not equipment vendors');
const installed = purchaseEquipment(profile, shop, 'atmospheric-package')!;
assert(installed && maintenanceSystemFullyInstalled(installed.rig, 'atmospheric-package'), 'installs full package');
equal(JSON.stringify(profile), before, 'transaction does not mutate input');
equal([installed.money, installed.worldTime], [870_500, 19 * 3600], 'deducts money and advances displayed time');
equal(installed.rig.optionalEquipment, [], 'purchase never grants free heavy shielding');
equal(rigAtmosphericHeatMultiplier(installed.rig), 4, 'normal thermal multiplier');
assert(!purchaseEquipment(installed, shop, 'atmospheric-package'), 'duplicate package rejected');
assert(!deriveRestrictions(installed.rig).some(r => r.id === 'atmospheric-work-unavailable'), 'package clears absence restriction');
assert(atmosphericExposureIsFatal(profile.rig, true) && !atmosphericExposureIsFatal(installed.rig, true), 'fatal absence rule');
for (const id of maintenanceSystemById('atmospheric-package').componentIds) {
  equal(installed.rig.components[id].ap, componentServicedAp(maintenanceComponentById(id)!, 'D', shop.workQualityGrade), 'installation service AP');
}
const heavyQuote = equipmentQuote(installed.rig, shop, 'heavy-heat-shielding')!;
equal([heavyQuote.partsCredits, heavyQuote.laborHours, heavyQuote.credits], [60_000, 6, 63_000], 'heavy pricing');
const heavy = purchaseEquipment(installed, shop, 'heavy-heat-shielding')!;
equal(rigAtmosphericHeatMultiplier(heavy.rig), 1, 'heavy thermal multiplier');
equal(heavy.rig.components, installed.rig.components, 'heavy purchase does not repair or service');
assert(!purchaseEquipment(heavy, shop, 'heavy-heat-shielding'), 'duplicate heavy denied');

for (const vendor of MAINTENANCE_SHOPS.filter(s => s.equipmentIds?.length)) {
  for (const grade of stockedComponentGrades(vendor)) {
    const p = { ...profile, locationId: vendor.locationIds[0], money: 10_000_000 };
    const q = equipmentQuote(p.rig, vendor, 'atmospheric-package', grade)!;
    const bought = purchaseEquipment(p, vendor, 'atmospheric-package', grade)!;
    assert(!!bought, `${vendor.name} grade ${grade} purchase`);
    equal(bought.worldTime, 19 * vendor.laborHoursMultiplier * 3600, 'shop time multiplier');
    equal(bought.money, p.money - q.credits, 'shop quote matches charge');
    equal(validateRigState(bought.rig), [], 'valid purchased rig');
  }
}
const fast = equipmentQuote(profile.rig, bruckner, 'atmospheric-package', 'A')!;
equal([fast.partsCredits, fast.laborHours], [480_000, 14.25], 'grade and fast-labor scaling');

const damaged = { ...installed, rig: cloneRigState(installed.rig) };
damaged.rig.components['atmospheric-heat-shielding'].hp = 1;
damaged.rig.components['atmospheric-heat-shielding'].fault = { severity: 'major', diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
damaged.rig.components['atmospheric-surfaces'].installed = false;
const partialQuote = equipmentQuote(damaged.rig, shop, 'atmospheric-package')!;
equal([partialQuote.partsCredits, partialQuote.laborHours], [60_000, 8], 'partial package charges only missing component');
const completed = purchaseEquipment(damaged, shop, 'atmospheric-package')!;
equal(completed.rig.components['atmospheric-heat-shielding'], damaged.rig.components['atmospheric-heat-shielding'], 'partial completion preserves old faults');
equal(completed.rig.components['body-main-chassis'], damaged.rig.components['body-main-chassis'], 'unrelated component preserved');

const inspection = { diagnosedWorldTime: 0, creditRemaining: 1000, dishonestyRevision: 2, fabricatedFaults: [], fabricatedServiceComponentIds: [], pretendMaintainedComponentIds: [] };
const credited = { ...profile, maintenanceShopInspections: { [shop.id]: inspection, other: inspection } };
equal(equipmentPayment(credited, shop, quote), { credit: 1000, due: 128500 }, 'existing service credit honored');
const withCredit = purchaseEquipment(credited, shop, 'atmospheric-package')!;
equal(withCredit.maintenanceShopInspections[shop.id].creditRemaining, 0, 'local credit consumed once');
equal(withCredit.maintenanceShopInspections.other.creditRemaining, 1000, 'other shop credit retained');
equal(credited.maintenanceShopInspections[shop.id].creditRemaining, 1000, 'input credit untouched');

const legacy = { ...createDefaultRigState(true), schemaVersion: 1 };
const migrated = migrateRigState(legacy);
equal(migrated.optionalEquipment, ['heavy-heat-shielding'], 'legacy full package grandfathered');
equal(migrated.components, legacy.components, 'migration preserves component condition');
equal(migrateRigState(migrated), migrated, 'migration idempotent');
equal(migrateRigState({ ...createDefaultRigState(false), schemaVersion: 1 }, true).optionalEquipment, [], 'explicitly absent legacy package not restored');
equal(migrateRigState(undefined, true).optionalEquipment, ['heavy-heat-shielding'], 'pre-rig atmospheric career grandfathered');
equal(migrateRigState(createDefaultRigState(true)).optionalEquipment, [], 'new normal package not grandfathered');
removeOptionalMaintenanceSystem(migrated, 'atmospheric-package');
equal(migrateRigState(migrated).optionalEquipment, [], 'removal not undone on reload');
assert(atmosphericExposureIsFatal(migrated, true), 'removed package unprotected');
storage.set('space-teamster.career.v1', JSON.stringify({ ...profile, rig: legacy }));
const loaded = loadCareerProfile();
equal(loaded.rig.optionalEquipment, ['heavy-heat-shielding'], 'career load migration');
equal(JSON.parse(storage.get('space-teamster.career.v1')!).rig.schemaVersion, 2, 'migration persisted immediately');
saveCareerProfile(heavy);
equal(loadCareerProfile().rig, heavy.rig, 'purchase persistence round trip');

const list = equipmentScene(profile, shop, true);
assert(list.options.some(o => o.action.startsWith('equipmentConfirm:') && !o.disabled), 'purchase available without diagnosis');
assert(list.options.some(o => o.label === 'Heavy Heat Shielding' && o.disabled), 'dependency shown on equipment list');
const confirm = equipmentScene({ ...profile, money: 1 }, shop, true, { id: 'atmospheric-package', grade: 'D' });
assert(confirm.options[0].disabled && confirm.options[0].label.includes('19h'), 'confirmation affordability and time');
assert(!RIG_EQUIPMENT['atmospheric-package'].description.includes('endorsement'), 'approved shortened description');
assert(equipmentScene(heavy, shop, true).options.slice(0, -1).every(o => o.disabled), 'installed equipment disabled');

// Exercise the actual game action handler, without constructing a canvas or touching real saves.
const game: any = Object.create(Game.prototype);
game.career = profile; game.worldTime = 0; game.phase = { kind: 'interactiveScene', scene: {} };
let writes = storageWrites;
game.activateInteractiveSceneOption({}, `equipmentConfirm:${shop.id}:atmospheric-package:D`);
equal(storageWrites, writes, 'opening quote does not persist or charge');
game.activateInteractiveSceneOption({}, `equipmentList:${shop.id}`);
equal(game.career, profile, 'cancel leaves career unchanged');
failWrites = true;
game.activateInteractiveSceneOption({}, `equipmentBuy:${shop.id}:atmospheric-package:D`);
equal(game.career, profile, 'failed storage does not publish purchase');
failWrites = false;
game.activateInteractiveSceneOption({}, `equipmentBuy:${shop.id}:atmospheric-package:D`);
equal(storageWrites, writes + 1, 'one atomic save per successful purchase');
const purchasedMoney = game.career.money;
game.activateInteractiveSceneOption({}, `equipmentBuy:${shop.id}:atmospheric-package:D`);
equal(game.career.money, purchasedMoney, 'replayed action cannot double-charge');

close(advanceTemperature(0, 0.1, 0.08, 1, 4), 4 * advanceTemperature(0, 0.1, 0.08, 1, 1), '4x heat load');
close(advanceTemperature(0.5, 0, 0.08, 1, 4), advanceTemperature(0.5, 0, 0.08, 1, 1), 'cooling unchanged');
const input = { pitch: 0 } as InputState;
createPlayableEstellaMission('estella-v-capital-settlement', 'estella-vi-spaceport', undefined, 1234);
const authored = APPROACH_LEVELS.find(l => l.body.atmosphere && l.surfaceDensity > 0)!;
assert(authored, 'atmospheric approach fixture');
const approach = { ...authored, thermalLoadMultiplier: 1, windLayers: [], turbulence: [] };
const init = { x: -50000, y: Math.min(10000, approach.body.atmosphere!.height / 2), vx: 1000, vy: -20, angle: Math.PI / 2 };
const h = createApproachState(approach, init);
const n = createApproachState(approach, init);
updateApproach(h, input, approach, 1 / 120, 0);
updateApproach(n, input, { ...approach, thermalLoadMultiplier: 4 }, 1 / 120, 0);
assert(h.temperature > 0 && h.alive && n.alive, 'thermal fixture heats without instant death');
close(n.temperature, h.temperature * 4, 'approach physics uses equipment');
const hot = { ...approach, heatCoeff: approach.heatCoeff * 0.3 / h.temperature };
const normalHot = createApproachState(hot, init), heavyHot = createApproachState(hot, init);
updateApproach(normalHot, input, { ...hot, thermalLoadMultiplier: 4 }, 1 / 120, 0);
updateApproach(heavyHot, input, hot, 1 / 120, 0);
assert(!normalHot.alive && heavyHot.alive, 'shielding changes survivability');
const predNormal = predictTrajectory(createApproachState(hot, init), { ...hot, thermalLoadMultiplier: 4 }, 0, 1 / 120, 1 / 120, false, false);
const predHeavy = predictTrajectory(createApproachState(hot, init), hot, 0, 1 / 120, 1 / 120, false, false);
assert(predNormal.overheatIdx === 0 && predHeavy.overheatIdx === -1, 'approach prediction matches death threshold');

const orbital = { ...ORBITAL_LEVELS.find(l => l.atmoHeight > 0 && l.surfaceDensity > 0)!, thermalLoadMultiplier: 1 };
assert(orbital.id !== undefined, 'orbital atmosphere fixture');
const orbitInit = { x: orbital.planetRadius + orbital.atmoHeight * 0.5, y: 0, vx: 0, vy: -1000, temperature: 0 };
const oh = createOrbitalState(orbital, orbitInit), on = createOrbitalState(orbital, orbitInit);
updateOrbital(oh, input, orbital, 1 / 120);
updateOrbital(on, input, { ...orbital, thermalLoadMultiplier: 4 }, 1 / 120);
assert(oh.temperature > 0 && on.alive, 'orbital fixture heats');
close(on.temperature, oh.temperature * 4, 'orbital equipment multiplier');
const orbitHot = { ...orbital, heatCoeff: orbital.heatCoeff * 0.3 / oh.temperature };
const hotH = createOrbitalState(orbitHot, orbitInit), hotN = createOrbitalState(orbitHot, orbitInit);
updateOrbital(hotH, input, orbitHot, 1 / 120);
updateOrbital(hotN, input, { ...orbitHot, thermalLoadMultiplier: 4 }, 1 / 120);
assert(hotH.alive && !hotN.alive, 'orbital heating can burn up normal rig');
const orbitPredH = predictOrbit(createOrbitalState(orbital, orbitInit), orbital, 0.1, 0.1, orbital.highAtmoAoA);
const orbitPredN = predictOrbit(createOrbitalState(orbital, orbitInit), { ...orbital, thermalLoadMultiplier: 4 }, 0.1, 0.1, orbital.highAtmoAoA);
close(orbitPredN[1].temperature!, orbitPredH[1].temperature! * 4, 'orbital prediction equipment multiplier');
const transferred = orbitalToApproachParams({ ...oh, temperature: 0.37 }, orbital);
equal(createApproachState(approach, transferred).temperature, 0.37, 'orbital-to-approach preserves heat');
const returnInit = game.approachToOrbitalInit(approach, { ...h, temperature: 0.42 }, orbital);
equal(createOrbitalState(orbital, returnInit).temperature, 0.42, 'approach-to-orbital preserves heat');

// Real phase loaders use a level copy and retry restores entry temperature, not accumulated heat.
game.career = heavy; game.canvas = { width: 1280, height: 800 };
game.activeManifestCondition = createManifestConditionState(null, null);
game.activeMaintenanceTelemetry = createMaintenanceTelemetry(); game.missionDvUsed = 0;
game.showContextualOperationsManual = () => {};
game.loadApproach(authored, { ...init, temperature: 0.37 }, 100);
assert(game.phase.level !== authored, 'authored approach not mutated');
game.phase.as.temperature = 0.9;
game.reloadPhase(game.phase);
equal(game.phase.as.temperature, 0.37, 'retry restores temperature snapshot');
equal(game.phase.level.thermalLoadMultiplier, 1, 'retry preserves heavy protection');
equal(game.career.money, heavy.money, 'retry cannot charge equipment again');
const ctx = { missionId: 'equipment-test', title: 'Equipment test', manifestKind: 'empty' as const, manifestMassTons: 0, attempt: 1, startWorldTime: 0 };
const settlement = resolveMaintenanceSettlement(createMaintenanceTelemetry(), ctx, heavy.rig, 100);
equal(settlement.resultingRig.optionalEquipment, ['heavy-heat-shielding'], 'successful settlement retains equipment');
equal(settlement, resolveMaintenanceSettlement(createMaintenanceTelemetry(), ctx, heavy.rig, 100), 'retry settlement deterministic');
equal(heavy.rig.completedMaintenanceMissions, 0, 'pending settlement does not mutate career');
// Short deterministic coasts across thin, thick, and breathable atmospheres.
// These are regression probes, not a claim that route balance is settled.
createPlayableEstellaMission('estella-v-capital-settlement', 'estella-iii-capital-city', undefined, 1234);
const probes: { body: string; normal: number; heavy: number; seconds: number }[] = [];
for (const bodyId of ['estella-v', 'estella-vi', 'estella-iii']) {
  const level = APPROACH_LEVELS.find(l => l.body.id === bodyId && !l.departure)!;
  assert(level, `profile exists ${bodyId}`);
  const start = { x: -50000, y: Math.min(10000, level.body.atmosphere!.height / 2), vx: 100, vy: 0, angle: Math.PI / 2 };
  const normal = createApproachState(level, start), shielded = createApproachState(level, start);
  const normalLevel = { ...level, thermalLoadMultiplier: 4, windLayers: [], turbulence: [] };
  const heavyLevel = { ...level, thermalLoadMultiplier: 1, windLayers: [], turbulence: [] };
  let elapsed = 0;
  for (let step = 0; step < 1200 && normal.alive && shielded.alive; step++) {
    updateApproach(normal, input, normalLevel, 1 / 120, elapsed);
    updateApproach(shielded, input, heavyLevel, 1 / 120, elapsed);
    elapsed += 1 / 120;
    if (normal.temperature < 1.5) close(normal.temperature, shielded.temperature * 4, `${bodyId} thermal ratio`);
  }
  assert(Number.isFinite(normal.temperature) && Number.isFinite(shielded.temperature), `${bodyId} finite temperatures`);
  assert(normal.temperature >= shielded.temperature, `${bodyId} heavy never hotter`);
  probes.push({ body: bodyId, normal: normal.temperature, heavy: shielded.temperature, seconds: elapsed });
}
console.log(JSON.stringify(probes, null, 2));
console.log(`Equipment regression passed: ${assertions} assertions.`);
