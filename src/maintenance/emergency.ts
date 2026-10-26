import type { CareerProfile } from '../career-state';
import { MAINTENANCE_COMPONENTS } from './catalog';
import { componentMaxHp } from './grades';
import { deriveRestrictions } from './rig-state';
import { localTerminalScopeIds } from '../physical-terminals';
import type { MaintenanceShopDef } from './shops';

/** Minimal recovery, not an inspection, upgrade, service or paid repair. */
export function emergencyRestartNeeded(profile: Pick<CareerProfile, 'rig'>): boolean {
  return deriveRestrictions(profile.rig).some(r => r.id === 'grounded' && r.componentId !== undefined);
}

/** Pure transaction; caller saves once before publishing. No money or time gate. */
export function emergencyRestart(profile: CareerProfile, shop: MaintenanceShopDef): CareerProfile | undefined {
  const scope = new Set(localTerminalScopeIds(profile.locationId));
  if (!shop.locationIds.some(id => scope.has(id)) || !emergencyRestartNeeded(profile)) return undefined;
  const next = structuredClone(profile);
  const blocking = new Set(deriveRestrictions(next.rig).flatMap(r => r.componentId ? [r.componentId] : []));
  for (const component of MAINTENANCE_COMPONENTS) {
    const state = next.rig.components[component.id];
    if (!state?.installed || !blocking.has(component.id)) continue;
    // The minimum fault-free operating condition. Retain grade and depleted AP;
    // further wear still matters. Nonblocking faults and optional purchases stay.
    state.hp = Math.max(state.hp, Math.min(componentMaxHp(component, state.grade), component.minorThreshold + 1));
    delete state.fault;
  }
  for (const inspection of Object.values(next.maintenanceShopInspections)) {
    // A reset supersedes findings, not balances. Normal inspection rules resume.
    delete inspection.diagnosedMaintenanceMission;
    inspection.fabricatedFaults = [];
    inspection.fabricatedServiceComponentIds = [];
  }
  return next;
}
