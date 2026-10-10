import { defaultCareerProfile, loadCareerProfile, saveCareerProfile } from '../src/career-state';
import { MAINTENANCE_COMPONENTS, MAINTENANCE_SYSTEMS, optionalEquipmentComponent, validateMaintenanceCatalog } from '../src/maintenance/catalog';
import { equipmentQuote, purchaseEquipment } from '../src/maintenance/equipment';
import { COMPONENT_GRADES, componentBaseAp, componentMaxHp } from '../src/maintenance/grades';
import { applyMechanicComponentDamage, applyMechanicOperation, applyMechanicSystemOperation } from '../src/maintenance/maintenance-service';
import { cloneRigState, createDefaultRigState, deriveRestrictions, maintenanceSystemFullyInstalled, manifestEquipmentBufferUnits, migrateRigState, validateRigState } from '../src/maintenance/rig-state';
import { diagnoseRigAtShop, MAINTENANCE_SHOPS, repairComponentAtShop, repairQuote, replaceComponentAtShop, replacementQuote, rigServiceQuote, serviceSystemAtShop, stockedComponentGrades, systemServiceQuote, VILAR_HERALD_GATE_SHOP as shop } from '../src/maintenance/shops';
import { resolveMaintenanceSettlement } from '../src/maintenance/strike-resolution';
import { calculateTelemetryWeights, createMaintenanceTelemetry } from '../src/maintenance/telemetry';
import { applyComfortExposure, applyComfortLoss, applyIntegrityDamage, applyIntegrityExposure, cloneManifestConditionState, comfortPenalty, createComfortState, createIntegrityState, createManifestConditionState, integrityPenalty } from '../src/manifest-condition';
import { playerOptionalEquipmentNames, playerShipSystemStatuses } from '../src/ship-status';
import { equipmentScene } from '../src/equipment-scene';
import { Game } from '../src/game';
import type { FragileCargoTerms } from '../src/cargo-handling';
import type { PassengerComfortTerms } from '../src/passenger-comfort';

export function runAuxiliaryEquipmentTests(): number {
  let assertions = 0;
  function assert(value: unknown, message: string): asserts value { assertions++; if (!value) throw new Error(message); }
  function equal(a: unknown, b: unknown, message: string) { assert(JSON.stringify(a) === JSON.stringify(b), message); }
  const ids = ['cargo-shock-absorbers', 'passenger-comfort-package'] as const;
  const profile = { ...defaultCareerProfile(), locationId: shop.locationIds[0], money: 1_000_000 };
  equal(validateMaintenanceCatalog(), [], 'optional catalog valid');
  equal([MAINTENANCE_SYSTEMS.length, MAINTENANCE_COMPONENTS.length], [7, 28], 'seven systems and 26 baseline plus two optional components');
  equal(manifestEquipmentBufferUnits(profile.rig), { integrity: 0, comfort: 0 }, 'new career gets no buffer bonuses');
  assert(maintenanceSystemFullyInstalled(profile.rig, 'auxiliary-systems'), 'absent upgrades do not make baseline auxiliaries incomplete');
  const oldRig: any = cloneRigState(profile.rig);
  for (const id of ids) delete oldRig.components[optionalEquipmentComponent(id)!.id];
  oldRig.optionalEquipment = [...ids]; // Stale flags must never conjure components.
  for (const version of [1, 2]) {
    const migrated = migrateRigState({ ...oldRig, schemaVersion: version });
    equal(manifestEquipmentBufferUnits(migrated), { integrity: 0, comfort: 0 }, 'old save upgrades absent');
    equal(migrated.optionalEquipment, [], 'orphaned upgrade flags discarded');
    equal(validateRigState(migrated), [], 'old save now has valid absent-component records');
  }
  const shock = purchaseEquipment(profile, shop, ids[0])!;
  const both = purchaseEquipment(shock, shop, ids[1])!;
  equal(shock.money, profile.money - 42_000, 'shock 40k parts plus 4h labor');
  equal(both.money, shock.money - 52_500, 'comfort 50k parts plus 5h labor');
  equal(both.worldTime, 9 * 3600, 'combined installation time');
  equal(manifestEquipmentBufferUnits(shock.rig), { integrity: 2, comfort: 0 }, 'shock affects cargo only');
  const comfortOnly = purchaseEquipment(profile, shop, ids[1])!;
  equal(manifestEquipmentBufferUnits(comfortOnly.rig), { integrity: 0, comfort: 2 }, 'comfort affects passengers only');
  equal(manifestEquipmentBufferUnits(both.rig), { integrity: 2, comfort: 2 }, 'healthy combined benefits');
  equal(playerOptionalEquipmentNames(both.rig), ['Cargo Shock Absorbers', 'Passenger Comfort Package'], 'optional list names');
  equal(deriveRestrictions(both.rig), deriveRestrictions(profile.rig), 'upgrades do not change work permissions');
  saveCareerProfile(both);
  equal(loadCareerProfile().rig, both.rig, 'optional state persistence');

  for (const vendor of MAINTENANCE_SHOPS.filter(s => s.equipmentIds?.includes(ids[0]))) {
    for (const id of ids) for (const grade of stockedComponentGrades(vendor)) {
      const p = { ...profile, locationId: vendor.locationIds[0] };
      const q = equipmentQuote(p.rig, vendor, id, grade)!;
      const bought = purchaseEquipment(p, vendor, id, grade)!;
      assert(!!bought, `${vendor.name} sells ${id} grade ${grade}`);
      equal(bought.money, p.money - q.credits, 'quote and transaction agree');
      equal(bought.worldTime, q.laborHours * 3600, 'actual installation time');
      equal(validateRigState(bought.rig), [], 'grade-adjusted installed state valid');
      assert(!purchaseEquipment(bought, vendor, id, grade), 'duplicate grade purchase denied');
      assert(!purchaseEquipment({ ...p, money: q.credits - 1 }, vendor, id, grade), 'insufficient funds denied');
    }
  }
  for (const id of ids) {
    const component = optionalEquipmentComponent(id)!;
    assert(component.systemId === 'auxiliary-systems', 'upgrade is Auxiliary Systems component');
    equal(component.restrictions, {}, 'no permission restrictions for optional faults');
    equal(component.faultMultipliers, [], 'no new wear multipliers');
    const rig = cloneRigState(both.rig);
    const state = rig.components[component.id];
    const benefit = () => manifestEquipmentBufferUnits(rig)[id === ids[0] ? 'integrity' : 'comfort'];
    assert(applyMechanicComponentDamage(rig, component.id, 'ap'), 'AP damage succeeds');
    equal(benefit(), 2, 'AP loss alone does not reduce bonus');
    const baselineAuxQuote = systemServiceQuote(profile.rig, shop, 'auxiliary-systems');
    equal(baselineAuxQuote.laborHours, 0, 'absent optional modules not serviced');
    equal(systemServiceQuote(rig, shop, 'auxiliary-systems').laborHours, 0.5, 'optional service time');
    serviceSystemAtShop(rig, shop, 'auxiliary-systems', 0);
    equal(state.ap, 2, 'optional service restores AP');
    assert(applyMechanicComponentDamage(rig, component.id, 'hp', { faultRoll: 0, locationRoll: 0 }), 'first HP strike');
    equal([state.hp, state.fault?.severity, benefit()], [2, 'minor', 1], 'minor damage reduces bonus');
    assert(!repairQuote(rig, shop, component.id), 'unknown fault not repairable before diagnosis');
    const beforeStatus = playerShipSystemStatuses(rig).find(s => s.id === 'auxiliary-systems')!;
    assert(beforeStatus.diagnosisRequired && !beforeStatus.diagnosedFaults.length, 'unknown status hides component');
    diagnoseRigAtShop(rig, shop);
    assert(playerShipSystemStatuses(rig).find(s => s.id === 'auxiliary-systems')!.diagnosedFaults.some(f => f.componentId === component.id), 'diagnosis reveals severity/component');
    serviceSystemAtShop(rig, shop, 'auxiliary-systems', 100);
    equal([state.hp, benefit()], [2, 1], 'service cannot restore HP or bonus');
    const rq = repairQuote(rig, shop, component.id)!;
    assert(rq.credits >= component.baseCost * 0.2, 'minor repair includes standard parts');
    assert(repairComponentAtShop(rig, shop, component.id, 200), 'repair uses normal shop flow');
    equal([state.hp, state.ap, benefit()], [3, 2, 2], 'repair restores protection');
    for (let i = 0; i < 2; i++) applyMechanicComponentDamage(rig, component.id, 'hp', { faultRoll: 0, locationRoll: 0 });
    equal([state.hp, state.fault?.severity, benefit()], [1, 'major', 0], 'major damage disables bonus');
    equal(deriveRestrictions(rig), deriveRestrictions(both.rig), 'major fault does not bar work');
    applyMechanicComponentDamage(rig, component.id, 'hp');
    equal([state.hp, state.fault?.severity, benefit()], [0, 'total', 0], 'total disables bonus');
    assert(!repairQuote(rig, shop, component.id), 'total requires replacement');
    equal(replacementQuote(rig, shop, component.id)!.credits, component.baseCost + component.replacementLaborHours * shop.laborRate, 'replacement pricing');
    assert(replaceComponentAtShop(rig, shop, component.id), 'replacement succeeds');
    equal(benefit(), 2, 'replacement restores bonus');
    equal(deriveRestrictions(rig), deriveRestrictions(both.rig), 'total/replacement do not add new restrictions');
    for (const grade of COMPONENT_GRADES) {
      applyMechanicOperation(rig, component.id, 'exchange', grade, 0);
      equal([state.hp, state.ap], [componentMaxHp(component, grade), componentBaseAp(component, grade)], 'grade durability');
      equal(benefit(), 2, 'grade never increases bonus');
      if (state.hp > 3) {
        applyMechanicComponentDamage(rig, component.id, 'hp');
        equal([state.hp, state.fault, benefit()], [3, undefined, 2], 'sub-threshold grade damage preserves bonus');
      }
    }
  }
  const debugRig = createDefaultRigState();
  applyMechanicSystemOperation(debugRig, 'auxiliary-systems', 'exchange', 'D', 0);
  equal(playerOptionalEquipmentNames(debugRig), ['Cargo Shock Absorbers', 'Passenger Comfort Package'], 'Mechanic exchange exposes installed optional modules');
  const baselineServiceRig = createDefaultRigState(true);
  const fullServiceRig = createDefaultRigState(true);
  applyMechanicSystemOperation(fullServiceRig, 'auxiliary-systems', 'exchange', 'D', 0);
  for (const rig of [baselineServiceRig, fullServiceRig]) for (const state of Object.values(rig.components)) state.ap = 0;
  equal([rigServiceQuote(baselineServiceRig, shop).laborHours, rigServiceQuote(fullServiceRig, shop).laborHours], [20, 21], 'optional service adds one hour, baseline unchanged');

  const fragile: FragileCargoTerms = { level: 'extremely-fragile', shockAbsorbingContainer: true, conditionRiskFraction: 0.7 };
  const passenger: PassengerComfortTerms = { expectation: 'prestige', serviceRiskFraction: 0.5 };
  const bonuses = manifestEquipmentBufferUnits(both.rig);
  const integrity = createIntegrityState(fragile, 10000, bonuses.integrity);
  const comfort = createComfortState(passenger, 10000, bonuses.comfort);
  equal(integrity.bufferMax, createIntegrityState(fragile, 10000).bufferMax + 2, 'stacks with supplied shock container');
  equal(comfort.bufferMax, createComfortState(passenger, 10000).bufferMax + 2, 'comfort buffer bonus');
  equal(integrity.maxPenaltyCredits, createIntegrityState(fragile, 10000).maxPenaltyCredits, 'cargo maximum penalty unchanged');
  equal(comfort.maxPenaltyCredits, createComfortState(passenger, 10000).maxPenaltyCredits, 'passenger maximum penalty unchanged');
  const rigBeforeBufferUse = JSON.stringify(both.rig);
  applyIntegrityDamage(integrity, 2);
  applyComfortLoss(comfort, 2);
  equal([integrityPenalty(integrity), comfortPenalty(comfort)], [0, 0], 'equipment buffer prevents early penalties');
  equal(JSON.stringify(both.rig), rigBeforeBufferUse, 'buffer use does not damage rig');
  const remaining = [integrity.bufferRemaining, comfort.bufferRemaining];
  applyIntegrityExposure(integrity, 60, 'none');
  applyComfortExposure(comfort, 60, 'none');
  assert(integrity.bufferRemaining <= remaining[0] && comfort.bufferRemaining <= remaining[1], 'buffers never regenerate in flight');
  applyIntegrityDamage(integrity, 100);
  applyComfortLoss(comfort, 100);
  equal([integrityPenalty(integrity), comfortPenalty(comfort)], [7000, 5000], 'max penalties unchanged after buffer exhaustion');

  const raw = createMaintenanceTelemetry();
  raw.distortedPassengerSeconds = 600 * 4000; // Strong auxiliary-only fixture, no new targeting rules.
  const context = { missionId: 'aux-test', title: 'Auxiliary test', manifestKind: 'passenger' as const, manifestMassTons: 0, attempt: 1, startWorldTime: 0 };
  equal(calculateTelemetryWeights(raw, context, profile.rig).adjustedSystemWeights, calculateTelemetryWeights(raw, context, both.rig).adjustedSystemWeights, 'installing modules leaves system-level telemetry weights unchanged');
  const settlement = resolveMaintenanceSettlement(raw, context, both.rig, 100);
  equal(settlement, resolveMaintenanceSettlement(raw, context, both.rig, 100), 'settlement deterministic');
  equal(JSON.stringify(both.rig), rigBeforeBufferUse, 'pending settlement never mutates career');
  const pool = MAINTENANCE_COMPONENTS.filter(c => c.systemId === 'auxiliary-systems' && both.rig.components[c.id]?.installed);
  equal(pool.length, 6, 'existing four auxiliaries plus two upgrades');
  for (const strike of settlement.ledger.strikes) {
    equal(strike.systemId, 'auxiliary-systems', 'fixture targets Auxiliary Systems');
    equal(strike.componentId, pool[Math.floor(strike.componentRoll * pool.length)].id, 'unchanged uniform component selection');
  }
  for (const id of ids) assert(settlement.ledger.strikes.some(s => s.componentId === optionalEquipmentComponent(id)!.id), 'new component receives ordinary strikes');
  equal(manifestEquipmentBufferUnits(settlement.resultingRig), { integrity: 0, comfort: 0 }, 'delivery faults affect next mission');
  const absentSettlement = resolveMaintenanceSettlement(raw, context, profile.rig, 100);
  const optionalComponentIds = new Set(ids.map(id => optionalEquipmentComponent(id)!.id));
  assert(absentSettlement.ledger.strikes.every(s => !optionalComponentIds.has(s.componentId)), 'absent optional modules never struck');

  // Real game actions and mission/retry setup, with isolated storage from the runner.
  const game: any = Object.create(Game.prototype);
  game.career = profile; game.worldTime = 0;
  game.activateInteractiveSceneOption({}, `equipmentBuy:${shop.id}:${ids[0]}:D`);
  game.activateInteractiveSceneOption({}, `equipmentBuy:${shop.id}:${ids[1]}:D`);
  equal(game.career.rig, both.rig, 'both game purchase actions wired');
  const options = equipmentScene(game.career, shop, true).options;
  assert(options.filter(o => ids.some(id => o.action.includes(`:${id}:`))).every(o => o.disabled), 'installed modules disabled in equipment menu');
  game.canvas = { width: 1280, height: 800 }; game.shownOperationsManualTutorials = new Set();
  game.showContextualOperationsManual = () => {}; game.activeMissionLayoutSeed = 1234;
  game.activeCareerContract = { id: 'buffer-mission', title: 'Buffers', category: 'passenger', cargo: { fragile, passengerComfort: passenger } };
  game.activeMissionQuote = { pay: { generosity: 0, flatReward: 10000, compensationRatio: 0, maxCompAllowance: 0 }, parFuelCost: 0, cargoMassTons: 0 };
  game.launchPlayableEstellaMission('estella-v-capital-settlement', 'estella-vi-spaceport', 0);
  const launchBuffers = cloneManifestConditionState(game.activeManifestCondition);
  equal([launchBuffers.integrity!.bufferMax, launchBuffers.comfort!.bufferMax], [3, 3], 'mission launch receives purchased buffers');
  applyIntegrityDamage(game.activeManifestCondition.integrity, 2.5);
  applyComfortLoss(game.activeManifestCondition.comfort, 2.5);
  game.reloadPhase(game.phase);
  equal(game.activeManifestCondition, launchBuffers, 'phase retry restores buffer snapshot');
  applyIntegrityDamage(game.activeManifestCondition.integrity, 2.5);
  game.restartWholeMission(game.phase);
  equal(game.activeManifestCondition, launchBuffers, 'whole retry restores full starting buffers');
  equal(game.career.money, both.money, 'retries do not charge equipment');
  game.pendingMaintenanceSettlement = settlement;
  equal(game.activeManifestCondition, launchBuffers, 'pending delivery damage cannot change active buffers');
  // Mimic successful delivery committing the precomputed rig, then start a new mission.
  game.career = { ...game.career, rig: settlement.resultingRig };
  game.launchPlayableEstellaMission('estella-v-capital-settlement', 'estella-vi-spaceport', 100);
  equal([game.activeManifestCondition.integrity.bufferMax, game.activeManifestCondition.comfort.bufferMax], [1, 1], 'next mission reflects disabled upgrades');
  return assertions;
}
