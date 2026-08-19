import { componentFaults, maintenanceComponentById, maintenanceSystemById } from './catalog';
import { componentBaseAp, componentMaxHp, componentServicedAp } from './grades';
import { severityForHp } from './rig-state';
import type { CareerRigState, ComponentGrade, ComponentId, MaintenanceSystemId, ShopGrade } from './types';

export type MechanicOperation = 'repair' | 'service' | 'exchange';
export type MechanicDamagePool = 'hp' | 'ap';

export interface MechanicDamageRolls {
  faultRoll: number;
  locationRoll: number;
}

function unitRoll(value: number): number {
  return Math.max(0, Math.min(0.9999999999999999, value));
}

export function applyMechanicComponentDamage(
  rig: CareerRigState,
  componentId: ComponentId,
  pool: MechanicDamagePool,
  rolls: MechanicDamageRolls = { faultRoll: Math.random(), locationRoll: Math.random() },
): boolean {
  const component = maintenanceComponentById(componentId);
  const state = rig.components[componentId];
  if (!component || !state?.installed) return false;
  if (pool === 'ap') {
    if (state.ap <= 0) return false;
    state.ap--;
    return true;
  }
  if (state.hp <= 0) return false;

  const beforeSeverity = severityForHp(componentId, state.hp);
  state.hp--;
  const afterSeverity = severityForHp(componentId, state.hp);
  if (!afterSeverity || afterSeverity === beforeSeverity) return true;

  let faultId: string | undefined;
  let locationId: string | undefined;
  if (afterSeverity !== 'total') {
    const faults = componentFaults(component, afterSeverity);
    if (faults.length) faultId = faults[Math.floor(unitRoll(rolls.faultRoll) * faults.length)].id;
    if (component.locations.length) locationId = component.locations[Math.floor(unitRoll(rolls.locationRoll) * component.locations.length)];
  }
  state.fault = {
    severity: afterSeverity,
    faultId,
    locationId,
    diagnosis: 'unknown',
    generatedMission: rig.completedMaintenanceMissions + 1,
    generatedStrike: 0,
  };
  return true;
}

function recordService(rig: CareerRigState, componentId: ComponentId, shopGrade: ShopGrade, worldTime: number): boolean {
  const component = maintenanceComponentById(componentId);
  const state = rig.components[componentId];
  if (!component || !state?.installed) return false;
  state.ap = componentServicedAp(component, state.grade, shopGrade);
  state.lastServiceWorldTime = worldTime;
  state.lastServiceMission = rig.completedMaintenanceMissions;
  return true;
}

export function applyMechanicOperation(
  rig: CareerRigState,
  componentId: ComponentId,
  operation: MechanicOperation,
  grade: ComponentGrade,
  worldTime: number,
): boolean {
  const component = maintenanceComponentById(componentId);
  const state = rig.components[componentId];
  if (!component || !state) return false;

  if (operation === 'service') return recordService(rig, componentId, grade, worldTime);

  if (operation === 'repair') {
    if (!state.installed || !state.fault || state.fault.severity === 'total') return false;
    state.hp = componentMaxHp(component, state.grade);
    delete state.fault;
    return recordService(rig, componentId, grade, worldTime);
  }

  state.installed = true;
  state.grade = grade;
  state.hp = componentMaxHp(component, grade);
  state.ap = componentBaseAp(component, grade);
  delete state.fault;
  delete state.lastServiceWorldTime;
  delete state.lastServiceMission;
  return true;
}

export function removeOptionalMaintenanceSystem(rig: CareerRigState, systemId: MaintenanceSystemId): boolean {
  const system = maintenanceSystemById(systemId);
  if (!system?.optional) return false;
  let changed = false;
  for (const componentId of system.componentIds) {
    const state = rig.components[componentId];
    if (!state) continue;
    changed = changed || state.installed || state.hp !== 0 || state.ap !== 0 || !!state.fault;
    state.installed = false;
    state.grade = 'D';
    state.hp = 0;
    state.ap = 0;
    delete state.fault;
    delete state.lastServiceWorldTime;
    delete state.lastServiceMission;
  }
  if (systemId === 'atmospheric-package') {
    const before = rig.optionalEquipment.length;
    rig.optionalEquipment = rig.optionalEquipment.filter(id => id !== 'heavy-heat-shielding');
    changed = changed || rig.optionalEquipment.length !== before;
  }
  return changed;
}

export function applyMechanicSystemOperation(
  rig: CareerRigState,
  systemId: MaintenanceSystemId,
  operation: MechanicOperation,
  grade: ComponentGrade,
  worldTime: number,
): boolean {
  const system = maintenanceSystemById(systemId);
  if (!system) return false;
  let changed = false;
  for (const componentId of system.componentIds) {
    const state = rig.components[componentId];
    if (operation === 'repair' && state?.installed) {
      const componentOperation: MechanicOperation = state.fault && state.fault.severity !== 'total' ? 'repair' : 'service';
      changed = applyMechanicOperation(rig, componentId, componentOperation, grade, worldTime) || changed;
    } else {
      changed = applyMechanicOperation(rig, componentId, operation, grade, worldTime) || changed;
    }
  }
  return changed;
}
