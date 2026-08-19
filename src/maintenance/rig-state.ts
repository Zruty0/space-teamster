import { componentFaultById, MAINTENANCE_COMPONENTS, MAINTENANCE_SYSTEMS, maintenanceComponentById } from './catalog';
import { componentBaseAp, componentMaxHp } from './grades';
import type {
  ActiveFaultState,
  CareerRigState,
  ComponentGrade,
  FaultSeverity,
  InstalledComponentState,
  MaintenanceSystemId,
  RigRestriction,
  RigRestrictionId,
  RigSystemStatus,
  RigValidationWarning,
} from './types';
import { RIG_RESTRICTION_IDS } from './types';

export const DEFAULT_MAINTENANCE_RNG_SEED = 0x6d2b79f5;
const COMPONENT_GRADES = new Set<ComponentGrade>(['A', 'B', 'C', 'D', 'E', 'F']);

export function createDefaultRigState(includeAtmosphericPackage = false): CareerRigState {
  const components: Record<string, InstalledComponentState> = {};
  for (const component of MAINTENANCE_COMPONENTS) {
    const installed = component.systemId !== 'atmospheric-package' || includeAtmosphericPackage;
    components[component.id] = {
      installed,
      grade: 'D',
      hp: installed ? component.baseHp : 0,
      ap: installed ? component.baseAp : 0,
    };
  }
  return {
    schemaVersion: 1,
    rngState: DEFAULT_MAINTENANCE_RNG_SEED,
    completedMaintenanceMissions: 0,
    components,
  };
}

function finiteInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
}

function migrateFault(raw: any, componentId: string, hp: number, mission: number): ActiveFaultState | undefined {
  const component = maintenanceComponentById(componentId);
  if (!component) return undefined;
  const severity: FaultSeverity | undefined = hp <= 0
    ? 'total'
    : raw?.severity === 'minor' || raw?.severity === 'major'
      ? raw.severity
      : undefined;
  if (!severity) return undefined;
  const faultId = severity === 'total' ? undefined : typeof raw?.faultId === 'string' && componentFaultById(component, raw.faultId) ? raw.faultId : undefined;
  const locationId = typeof raw?.locationId === 'string' && component.locations.includes(raw.locationId) ? raw.locationId : undefined;
  const diagnosis = raw?.diagnosis === 'suspected' || raw?.diagnosis === 'confirmed' ? raw.diagnosis : 'unknown';
  return {
    severity,
    faultId,
    locationId,
    diagnosis,
    generatedMission: Math.max(0, finiteInteger(raw?.generatedMission, mission)),
    generatedStrike: Math.max(0, finiteInteger(raw?.generatedStrike, 0)),
  };
}

export function migrateRigState(raw: unknown, includeAtmosphericPackage = false): CareerRigState {
  const defaults = createDefaultRigState(includeAtmosphericPackage);
  if (!raw || typeof raw !== 'object') return defaults;
  const parsed = raw as any;
  const mission = Math.max(0, finiteInteger(parsed.completedMaintenanceMissions, 0));
  const rig: CareerRigState = {
    schemaVersion: 1,
    rngState: finiteInteger(parsed.rngState, DEFAULT_MAINTENANCE_RNG_SEED) >>> 0 || DEFAULT_MAINTENANCE_RNG_SEED,
    completedMaintenanceMissions: mission,
    components: {},
  };
  for (const component of MAINTENANCE_COMPONENTS) {
    const source = parsed.components?.[component.id];
    if (!source || typeof source !== 'object') {
      rig.components[component.id] = defaults.components[component.id];
      continue;
    }
    const grade: ComponentGrade = COMPONENT_GRADES.has(source.grade) ? source.grade : 'D';
    const maxHp = componentMaxHp(component, grade);
    const maxServiceAp = componentBaseAp(component, grade) + 1;
    const installedDefault = component.systemId !== 'atmospheric-package' || includeAtmosphericPackage;
    const installed = typeof source.installed === 'boolean' ? source.installed : installedDefault;
    const hp = installed ? Math.max(0, Math.min(maxHp, finiteInteger(source.hp, maxHp))) : 0;
    const ap = installed ? Math.max(0, Math.min(maxServiceAp, finiteInteger(source.ap, componentBaseAp(component, grade)))) : 0;
    const state: InstalledComponentState = { installed, grade, hp, ap };
    const fault = installed ? migrateFault(source.fault, component.id, hp, mission) : undefined;
    if (fault) state.fault = fault;
    if (typeof source.lastServiceWorldTime === 'number' && Number.isFinite(source.lastServiceWorldTime)) state.lastServiceWorldTime = source.lastServiceWorldTime;
    if (typeof source.lastServiceMission === 'number' && Number.isFinite(source.lastServiceMission)) state.lastServiceMission = Math.max(0, Math.floor(source.lastServiceMission));
    rig.components[component.id] = state;
  }
  return rig;
}

export function cloneRigState(rig: CareerRigState): CareerRigState {
  return {
    schemaVersion: 1,
    rngState: rig.rngState >>> 0,
    completedMaintenanceMissions: rig.completedMaintenanceMissions,
    components: Object.fromEntries(Object.entries(rig.components).map(([id, state]) => [id, {
      ...state,
      fault: state.fault ? { ...state.fault } : undefined,
    }])),
  };
}

export function severityForHp(componentId: string, hp: number): FaultSeverity | undefined {
  const component = maintenanceComponentById(componentId);
  if (!component) return undefined;
  if (hp <= 0) return 'total';
  if (hp <= component.majorThreshold) return 'major';
  if (hp <= component.minorThreshold) return 'minor';
  return undefined;
}

const RESTRICTION_LABELS: Record<RigRestrictionId, string> = {
  grounded: 'Rig is grounded',
  'high-thrust-unavailable': 'High thrust is unavailable',
  'braking-sas-unavailable': 'Braking SAS is unavailable',
  'wings-unavailable': 'Atmospheric wings are unavailable',
  'freight-unavailable': 'Freight work is unavailable',
  'passenger-unavailable': 'Passenger work is unavailable',
  'surface-landing-unavailable': 'Surface landing is unavailable',
  'station-docking-unavailable': 'Station docking is unavailable',
  'atmospheric-work-unavailable': 'Atmospheric work is unavailable',
};

export function deriveRestrictions(rig: CareerRigState): RigRestriction[] {
  const restrictions: RigRestriction[] = [];
  const seen = new Set<string>();
  const add = (id: RigRestrictionId, componentId: string | undefined, reason: string) => {
    const key = `${id}:${componentId ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    restrictions.push({ id, componentId, reason });
  };
  const atmosphericInstalled = MAINTENANCE_SYSTEMS.find(system => system.id === 'atmospheric-package')!.componentIds
    .every(componentId => rig.components[componentId]?.installed);
  if (!atmosphericInstalled) add('atmospheric-work-unavailable', undefined, 'Atmospheric work is unavailable: Atmospheric Package is not installed');

  for (const component of MAINTENANCE_COMPONENTS) {
    const state = rig.components[component.id];
    if (!state?.installed || !state.fault) continue;
    const ids = component.restrictions[state.fault.severity] ?? [];
    for (const id of ids) add(id, component.id, `${RESTRICTION_LABELS[id]}: ${component.name} ${state.fault.severity.toUpperCase()}`);
  }
  return restrictions.sort((a, b) => RIG_RESTRICTION_IDS.indexOf(a.id) - RIG_RESTRICTION_IDS.indexOf(b.id));
}

export function systemStatus(rig: CareerRigState, systemId: MaintenanceSystemId): RigSystemStatus {
  const system = MAINTENANCE_SYSTEMS.find(candidate => candidate.id === systemId);
  if (!system) return 'alert';
  const states = system.componentIds.map(id => rig.components[id]).filter((state): state is InstalledComponentState => !!state && state.installed);
  if (!states.length && system.optional) return 'ok';
  if (states.some(state => state.fault?.severity === 'major' || state.fault?.severity === 'total')) return 'alert';
  const restrictionComponents = new Set(deriveRestrictions(rig).map(restriction => restriction.componentId));
  if (system.componentIds.some(id => restrictionComponents.has(id))) return 'alert';
  for (const componentId of system.componentIds) {
    const component = maintenanceComponentById(componentId);
    const state = rig.components[componentId];
    if (!component || !state?.installed) continue;
    if (state.fault?.severity === 'minor' || state.ap <= 0 || state.hp < componentMaxHp(component, state.grade)) return 'warning';
  }
  return 'ok';
}

export function validateRigState(rig: CareerRigState): RigValidationWarning[] {
  const warnings: RigValidationWarning[] = [];
  for (const component of MAINTENANCE_COMPONENTS) {
    const state = rig.components[component.id];
    if (!state) {
      warnings.push({ path: `rig.components.${component.id}`, message: 'Missing component state' });
      continue;
    }
    const maxHp = componentMaxHp(component, state.grade);
    if (state.hp < 0 || state.hp > maxHp) warnings.push({ path: `rig.components.${component.id}.hp`, message: `HP ${state.hp} outside 0..${maxHp}` });
    if (state.ap < 0 || state.ap > componentBaseAp(component, state.grade) + 1) warnings.push({ path: `rig.components.${component.id}.ap`, message: `AP ${state.ap} outside serviced range` });
    if (!state.installed && (state.hp !== 0 || state.ap !== 0 || state.fault)) warnings.push({ path: `rig.components.${component.id}`, message: 'Absent component carries condition state' });
    if (state.fault?.faultId && !componentFaultById(component, state.fault.faultId)) warnings.push({ path: `rig.components.${component.id}.fault`, message: `Unknown fault ${state.fault.faultId}` });
    if (state.fault?.locationId && !component.locations.includes(state.fault.locationId)) warnings.push({ path: `rig.components.${component.id}.fault`, message: `Unknown location ${state.fault.locationId}` });
  }
  for (const id of Object.keys(rig.components)) {
    if (!maintenanceComponentById(id)) warnings.push({ path: `rig.components.${id}`, message: 'Unknown component state' });
  }
  return warnings;
}
