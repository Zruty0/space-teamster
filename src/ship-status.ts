import { MAINTENANCE_COMPONENTS, MAINTENANCE_SYSTEMS } from './maintenance/catalog';
import { deriveRestrictions, systemStatus } from './maintenance/rig-state';
import type {
  CareerRigState,
  MaintenanceSystemId,
  OptionalEquipmentId,
  FaultSeverity,
  RigRestrictionId,
  RigSystemStatus,
} from './maintenance/types';

export interface PlayerDiagnosedComponentFault {
  componentId: string;
  componentName: string;
  severity: FaultSeverity;
}

export interface PlayerShipSystemStatus {
  id: MaintenanceSystemId;
  name: string;
  status: RigSystemStatus;
  notEquipped: boolean;
  diagnosisRequired: boolean;
  diagnosedFaults: PlayerDiagnosedComponentFault[];
}

const PLAYER_RESTRICTION_LABELS: Record<RigRestrictionId, string> = {
  grounded: 'Rig grounded',
  'high-thrust-unavailable': 'No high-thrust operation',
  'braking-sas-unavailable': 'No braking SAS',
  'wings-unavailable': 'No atmospheric wing operation',
  'freight-unavailable': 'No freight work',
  'passenger-unavailable': 'No passenger work',
  'surface-landing-unavailable': 'No surface landing',
  'station-docking-unavailable': 'No station docking',
  'atmospheric-work-unavailable': 'No atmospheric flight',
};

const OPTIONAL_EQUIPMENT_NAMES: Record<OptionalEquipmentId, string> = {
  'heavy-heat-shielding': 'Heavy Heat Shielding',
};

export function playerShipSystemStatuses(rig: CareerRigState): PlayerShipSystemStatus[] {
  return MAINTENANCE_SYSTEMS.map(system => {
    const faultedComponents = system.componentIds.flatMap(componentId => {
      const state = rig.components[componentId];
      const component = MAINTENANCE_COMPONENTS.find(candidate => candidate.id === componentId);
      return state?.installed && state.fault && component ? [{ state, component }] : [];
    });
    return {
      id: system.id,
      name: system.name,
      status: systemStatus(rig, system.id),
      notEquipped: system.optional && system.componentIds.every(componentId => !rig.components[componentId]?.installed),
      diagnosisRequired: faultedComponents.some(({ state }) => state.fault?.diagnosis !== 'confirmed'),
      diagnosedFaults: faultedComponents.flatMap(({ state, component }) => state.fault?.diagnosis === 'confirmed'
        ? [{ componentId: component.id, componentName: component.name, severity: state.fault.severity }]
        : []),
    };
  });
}

export function overallPlayerShipStatus(rig: CareerRigState): RigSystemStatus {
  const statuses = playerShipSystemStatuses(rig).map(system => system.status);
  if (statuses.includes('alert')) return 'alert';
  if (statuses.includes('warning')) return 'warning';
  return 'ok';
}

export function playerRestrictionLabel(id: RigRestrictionId): string {
  return PLAYER_RESTRICTION_LABELS[id];
}

export function playerRestrictionLabels(rig: CareerRigState): string[] {
  const ids = new Set(deriveRestrictions(rig).map(restriction => restriction.id));
  return Object.entries(PLAYER_RESTRICTION_LABELS)
    .filter(([id]) => ids.has(id as RigRestrictionId))
    .map(([, label]) => label);
}

export function playerOptionalEquipmentNames(rig: CareerRigState): string[] {
  return rig.optionalEquipment.map(id => OPTIONAL_EQUIPMENT_NAMES[id]);
}
