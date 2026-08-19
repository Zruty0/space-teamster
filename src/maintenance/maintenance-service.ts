import { maintenanceComponentById, maintenanceSystemById } from './catalog';
import { componentBaseAp, componentMaxHp, componentServicedAp } from './grades';
import type { CareerRigState, ComponentGrade, ComponentId, MaintenanceSystemId, ShopGrade } from './types';

export type MechanicOperation = 'repair' | 'service' | 'exchange';

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
