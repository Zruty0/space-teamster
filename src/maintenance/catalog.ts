import { FAULT_LIBRARIES, RAW_MAINTENANCE_SYSTEMS } from './catalog-data';
import type {
  ComponentDefinition,
  ComponentId,
  FaultMultiplierDefinition,
  FaultSeverity,
  MaintenanceSystemDefinition,
  MaintenanceSystemId,
  RigEquipmentId,
  RestrictionDefinition,
  RigValidationWarning,
  TelemetrySourceId,
} from './types';
import { MAINTENANCE_SYSTEM_IDS, TELEMETRY_SOURCE_IDS } from './types';

const MAIN_THRUST: TelemetrySourceId[] = ['standardMainDrive', 'highMainDrive', 'driveFiringDuration', 'loadedThrustStress'];
const MANEUVERING: TelemetrySourceId[] = ['standardManeuvering', 'highManeuvering', 'brakingSas', 'dockingCollision', 'otherCollision', 'atmosphericCollision'];
const BODY_LOADS: TelemetrySourceId[] = ['standardMainDrive', 'highMainDrive', 'loadedThrustStress', 'surfaceOperation', 'touchdownStress', 'dockingOperation', 'tractorCapture', 'dockingCollision', 'otherCollision', 'atmosphericCollision'];
const CONTROL_USE: TelemetrySourceId[] = ['standardMainDrive', 'highMainDrive', 'standardManeuvering', 'highManeuvering', 'brakingSas', 'wingOperation'];

function multiplier(sourceIds: TelemetrySourceId[] | 'all', targetSystemId: MaintenanceSystemId, minor: number, major: number): FaultMultiplierDefinition {
  return { sourceIds, targetSystemId, minor, major };
}

const EFFECTS: Record<ComponentId, { multipliers?: FaultMultiplierDefinition[]; restrictions?: RestrictionDefinition }> = {
  'body-main-chassis': { multipliers: [multiplier(BODY_LOADS, 'body-frame', 1.25, 2)], restrictions: { major: ['high-thrust-unavailable'], total: ['grounded'] } },
  'body-cab-pressure-shell': { multipliers: [multiplier(['flightDuration'], 'auxiliary-systems', 1.25, 2)], restrictions: { major: ['passenger-unavailable'], total: ['grounded'] } },
  'body-cargo-spine': { multipliers: [multiplier(['loadedThrustStress', 'dockingOperation', 'dockingCollision'], 'body-frame', 1.25, 1)], restrictions: { major: ['high-thrust-unavailable'], total: ['grounded'] } },
  'body-bodywork-mounts': { multipliers: [multiplier('all', 'auxiliary-systems', 1.25, 1.75)], restrictions: { total: ['grounded'] } },
  'powertrain-main-drive-core': { multipliers: [multiplier(MAIN_THRUST, 'powertrain', 1.25, 1.75)], restrictions: { major: ['high-thrust-unavailable'], total: ['grounded'] } },
  'powertrain-field-coil-bank': { multipliers: [multiplier(MAIN_THRUST, 'powertrain', 1.25, 1.75)], restrictions: { major: ['high-thrust-unavailable'], total: ['grounded'] } },
  'powertrain-regulator-bank': { multipliers: [multiplier(MAIN_THRUST, 'powertrain', 1.25, 1.75)], restrictions: { major: ['high-thrust-unavailable'], total: ['grounded'] } },
  'powertrain-fuel-feed': { multipliers: [multiplier(MAIN_THRUST, 'powertrain', 1.25, 1.75)], restrictions: { major: ['high-thrust-unavailable'], total: ['grounded'] } },
  'powertrain-drive-cooling': { multipliers: [multiplier(MAIN_THRUST, 'powertrain', 1.25, 1.75)], restrictions: { major: ['high-thrust-unavailable'], total: ['grounded'] } },
  'steering-maneuvering-thrusters': { multipliers: [multiplier(MANEUVERING, 'steering-thrusters', 1.25, 1.75)], restrictions: { major: ['braking-sas-unavailable'], total: ['grounded'] } },
  'steering-thruster-feed': { multipliers: [multiplier(MANEUVERING, 'steering-thrusters', 1.25, 1.75)], restrictions: { total: ['grounded'] } },
  'steering-thruster-valves': { multipliers: [multiplier(MANEUVERING, 'steering-thrusters', 1.25, 1.75)], restrictions: { major: ['braking-sas-unavailable'], total: ['grounded'] } },
  'atmospheric-heat-shielding': { multipliers: [multiplier(['heatExposure', 'severeHeatExposure'], 'atmospheric-package', 1.25, 1.75)], restrictions: { total: ['atmospheric-work-unavailable'] } },
  'atmospheric-surfaces': { multipliers: [multiplier(['aerodynamicLoading'], 'atmospheric-package', 1.25, 1.75)], restrictions: { major: ['wings-unavailable'], total: ['atmospheric-work-unavailable'] } },
  'atmospheric-surface-actuators': { multipliers: [multiplier(['wingOperation'], 'atmospheric-package', 1.25, 1.75)], restrictions: { major: ['wings-unavailable'], total: ['atmospheric-work-unavailable'] } },
  'landing-gear-assembly': { multipliers: [multiplier(['touchdownStress'], 'landing-docking', 1.25, 1.75)], restrictions: { major: ['surface-landing-unavailable'], total: ['grounded'] } },
  'landing-docking-coupler': { multipliers: [multiplier(['dockingOperation', 'dockingCollision'], 'landing-docking', 1.25, 1.75)], restrictions: { major: ['station-docking-unavailable'], total: ['grounded'] } },
  'landing-tractor-capture-receiver': { multipliers: [multiplier(['tractorCapture'], 'landing-docking', 1.25, 1.75)], restrictions: { major: ['station-docking-unavailable'], total: ['grounded'] } },
  'cab-driver-controls': { multipliers: [multiplier(CONTROL_USE, 'cab-controls', 1.25, 1.75)], restrictions: { major: ['grounded'], total: ['grounded'] } },
  'cab-flight-computer': { multipliers: [multiplier(['flightDuration', 'stellarRadiation'], 'cab-controls', 1.25, 1.75)], restrictions: { major: ['grounded'], total: ['grounded'] } },
  'cab-navigation-instruments': { multipliers: [multiplier(['flightDuration', 'stellarRadiation'], 'cab-controls', 1.25, 1.75)], restrictions: { major: ['grounded'], total: ['grounded'] } },
  'cab-instrument-panel': { multipliers: [multiplier(['flightDuration', 'stellarRadiation'], 'cab-controls', 1.25, 1.75)], restrictions: { major: ['grounded'], total: ['grounded'] } },
  'auxiliary-service-power': { multipliers: [multiplier('all', 'auxiliary-systems', 1.25, 1.75), multiplier('all', 'cab-controls', 1.25, 1.25)], restrictions: { major: ['grounded'], total: ['grounded'] } },
  'auxiliary-environmental-control': { multipliers: [multiplier(['flightDuration', 'passengerOccupancy'], 'auxiliary-systems', 1.25, 1.75)], restrictions: { major: ['passenger-unavailable'], total: ['grounded'] } },
  'auxiliary-communications': { multipliers: [multiplier(['communications', 'stellarRadiation'], 'auxiliary-systems', 1.25, 1.75)], restrictions: { total: ['grounded'] } },
  'auxiliary-cargo-handling': { multipliers: [multiplier(['freightHandling'], 'auxiliary-systems', 1.25, 1.75)], restrictions: { major: ['freight-unavailable'], total: ['grounded'] } },
};

export const MAINTENANCE_SYSTEMS: readonly MaintenanceSystemDefinition[] = RAW_MAINTENANCE_SYSTEMS.map(system => ({
  id: system.id as MaintenanceSystemId,
  name: system.name,
  optional: system.optional,
  componentIds: system.components.map(component => component.id),
}));

export const MAINTENANCE_COMPONENTS: readonly ComponentDefinition[] = RAW_MAINTENANCE_SYSTEMS.flatMap(system => system.components.map(raw => ({
  ...raw,
  systemId: system.id as MaintenanceSystemId,
  localFaults: [...raw.localFaults],
  faultMultipliers: EFFECTS[raw.id]?.multipliers ?? [],
  restrictions: EFFECTS[raw.id]?.restrictions ?? {},
})));

const COMPONENT_BY_ID = new Map(MAINTENANCE_COMPONENTS.map(component => [component.id, component]));
const SYSTEM_BY_ID = new Map(MAINTENANCE_SYSTEMS.map(system => [system.id, system]));

export function maintenanceComponentById(id: ComponentId): ComponentDefinition | undefined {
  return COMPONENT_BY_ID.get(id);
}

export function optionalEquipmentComponent(id: RigEquipmentId): ComponentDefinition | undefined {
  return MAINTENANCE_COMPONENTS.find(component => component.optionalEquipmentId === id);
}

export function maintenanceSystemById(id: MaintenanceSystemId): MaintenanceSystemDefinition {
  const system = SYSTEM_BY_ID.get(id);
  if (!system) throw new Error(`Unknown maintenance system: ${id}`);
  return system;
}

export function componentFaults(component: ComponentDefinition, severity?: Exclude<FaultSeverity, 'total'>) {
  const faults = [
    ...component.localFaults,
    ...component.faultLibraryIds.flatMap(id => FAULT_LIBRARIES[id] ?? []),
  ];
  return severity ? faults.filter(fault => fault.severity === severity) : faults;
}

export function componentFaultById(component: ComponentDefinition, faultId: string | undefined) {
  return faultId ? componentFaults(component).find(fault => fault.id === faultId) : undefined;
}

export function validateMaintenanceCatalog(): RigValidationWarning[] {
  const warnings: RigValidationWarning[] = [];
  if (MAINTENANCE_SYSTEMS.length !== MAINTENANCE_SYSTEM_IDS.length) warnings.push({ path: 'systems', message: `Expected ${MAINTENANCE_SYSTEM_IDS.length} systems; found ${MAINTENANCE_SYSTEMS.length}` });
  MAINTENANCE_SYSTEM_IDS.forEach((id, index) => {
    if (MAINTENANCE_SYSTEMS[index]?.id !== id) warnings.push({ path: `systems[${index}]`, message: `Expected ${id}` });
  });
  const ids = new Set<string>();
  for (const component of MAINTENANCE_COMPONENTS) {
    if (ids.has(component.id)) warnings.push({ path: component.id, message: 'Duplicate component ID' });
    ids.add(component.id);
    if (component.majorThreshold >= component.minorThreshold || component.minorThreshold >= component.baseHp || component.majorThreshold <= 0) {
      warnings.push({ path: component.id, message: 'Invalid HP threshold order' });
    }
    if (!(component.serviceHours >= 0.5 && component.serviceHours <= 2 && Number.isInteger(component.serviceHours * 2))) {
      warnings.push({ path: component.id, message: 'Service time must be 0.5–2 hours in half-hour increments' });
    }
    for (const libraryId of component.faultLibraryIds) {
      if (!FAULT_LIBRARIES[libraryId]) warnings.push({ path: component.id, message: `Unknown fault library: ${libraryId}` });
    }
    for (const severity of ['minor', 'major'] as const) {
      if (!componentFaults(component, severity).length) warnings.push({ path: component.id, message: `No ${severity} faults` });
    }
    for (const effect of component.faultMultipliers) {
      if (effect.sourceIds !== 'all') for (const sourceId of effect.sourceIds) {
        if (!TELEMETRY_SOURCE_IDS.includes(sourceId)) warnings.push({ path: component.id, message: `Unknown telemetry source: ${sourceId}` });
      }
    }
  }
  return warnings;
}

const catalogWarnings = validateMaintenanceCatalog();
if (catalogWarnings.length) console.warn('Maintenance catalog validation warnings', catalogWarnings);
