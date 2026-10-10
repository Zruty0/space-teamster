import type { CareerProfile } from '../career-state';
import { localTerminalScopeIds } from '../local-directory';
import { maintenanceComponentById, maintenanceSystemById, optionalEquipmentComponent } from './catalog';
import { componentMaxHp, componentReplacementCost, componentServicedAp } from './grades';
import { cloneRigState, installedOptionalEquipmentIds, maintenanceSystemFullyInstalled } from './rig-state';
import { stockedComponentGrades, type MaintenanceShopDef } from './shops';
import type { CareerRigState, ComponentGrade, RigEquipmentId } from './types';

export const RIG_EQUIPMENT = {
  'atmospheric-package': {
    name: 'Atmospheric Package',
    description: 'Heat shielding, deployable atmospheric surfaces, and powered actuators equip your rig for atmospheric flight.',
  },
  'heavy-heat-shielding': {
    name: 'Heavy Heat Shielding',
    description: 'Additional thermal protection provides four times the heat resistance of the standard Atmospheric Package. Requires an installed Atmospheric Package.',
  },
  'cargo-shock-absorbers': {
    name: 'Cargo Shock Absorbers',
    description: 'Additional cargo-mount dampers absorb vibration and handling shocks, giving fragile consignments extra protection during flight.',
  },
  'passenger-comfort-package': {
    name: 'Passenger Comfort Package',
    description: 'Improved seating, acoustic isolation, and cabin amenities give passengers a more comfortable journey.',
  },
} as const;

export function isRigEquipmentId(value: string): value is RigEquipmentId {
  return Object.prototype.hasOwnProperty.call(RIG_EQUIPMENT, value);
}

export interface EquipmentQuote {
  equipmentId: RigEquipmentId;
  grade?: ComponentGrade;
  componentIds: string[];
  partsCredits: number;
  laborHours: number;
  credits: number;
}

export function equipmentUnavailableReason(rig: CareerRigState, shop: MaintenanceShopDef, id: RigEquipmentId): string | undefined {
  if (!shop.equipmentIds?.includes(id)) return 'Equipment is not stocked here.';
  if (id === 'atmospheric-package') {
    if (maintenanceSystemFullyInstalled(rig, 'atmospheric-package')) return 'Already installed.';
  } else if (id === 'heavy-heat-shielding') {
    if (rig.optionalEquipment.includes(id)) return 'Already installed.';
    if (!maintenanceSystemFullyInstalled(rig, 'atmospheric-package')) return 'Requires an installed Atmospheric Package.';
  } else {
    const component = optionalEquipmentComponent(id);
    if (!component) return 'Unknown equipment.';
    if (rig.components[component.id]?.installed) return 'Already installed.';
  }
  return undefined;
}

export function equipmentQuote(rig: CareerRigState, shop: MaintenanceShopDef, id: RigEquipmentId, grade: ComponentGrade = 'D'): EquipmentQuote | undefined {
  if (equipmentUnavailableReason(rig, shop, id)) return undefined;
  if (id === 'heavy-heat-shielding') {
    const partsCredits = Math.round(60_000 * shop.partsMarkup);
    const laborHours = 6 * shop.laborHoursMultiplier;
    return { equipmentId: id, componentIds: [], partsCredits, laborHours, credits: Math.round(partsCredits + laborHours * shop.laborRate) };
  }
  if (!stockedComponentGrades(shop).includes(grade)) return undefined;
  // Partial packages are completed, never exchanged: preserve installed condition,
  // grades, and faults, and charge only for the missing components.
  const componentIds = id === 'atmospheric-package'
    ? maintenanceSystemById('atmospheric-package').componentIds
    : [optionalEquipmentComponent(id)!.id];
  const components = componentIds
    .filter(componentId => !rig.components[componentId]?.installed)
    .map(componentId => maintenanceComponentById(componentId)!);
  const partsCredits = Math.round(components.reduce((sum, component) => sum + componentReplacementCost(component, grade), 0) * shop.partsMarkup);
  const laborHours = components.reduce((sum, component) => sum + component.replacementLaborHours, 0) * shop.laborHoursMultiplier;
  return { equipmentId: id, grade, componentIds: components.map(component => component.id), partsCredits, laborHours, credits: Math.round(partsCredits + laborHours * shop.laborRate) };
}

export function equipmentPayment(profile: CareerProfile, shop: MaintenanceShopDef, quote: EquipmentQuote): { credit: number; due: number } {
  const credit = Math.min(quote.credits, Math.max(0, profile.maintenanceShopInspections[shop.id]?.creditRemaining ?? 0));
  return { credit, due: quote.credits - credit };
}

/** Pure, revalidated transaction. Caller persists the result once before publishing it. */
export function purchaseEquipment(profile: CareerProfile, shop: MaintenanceShopDef, id: RigEquipmentId, grade: ComponentGrade = 'D'): CareerProfile | undefined {
  const scope = new Set(localTerminalScopeIds(profile.locationId));
  if (!shop.locationIds.some(locationId => scope.has(locationId))) return undefined;
  const quote = equipmentQuote(profile.rig, shop, id, grade);
  if (!quote) return undefined;
  const payment = equipmentPayment(profile, shop, quote);
  if (!Number.isFinite(profile.money) || profile.money < payment.due || !Number.isFinite(profile.worldTime)) return undefined;
  const worldTime = profile.worldTime + quote.laborHours * 3600;
  const rig = cloneRigState(profile.rig);
  for (const componentId of quote.componentIds) {
    const component = maintenanceComponentById(componentId)!;
    rig.components[componentId] = {
      installed: true,
      grade,
      hp: componentMaxHp(component, grade),
      ap: componentServicedAp(component, grade, shop.workQualityGrade),
      lastServiceWorldTime: worldTime,
      lastServiceMission: rig.completedMaintenanceMissions,
    };
  }
  if (id === 'heavy-heat-shielding') rig.optionalEquipment.push(id);
  rig.optionalEquipment = installedOptionalEquipmentIds(rig);
  const inspections = { ...profile.maintenanceShopInspections };
  if (inspections[shop.id]) inspections[shop.id] = { ...inspections[shop.id], creditRemaining: 0 };
  return { ...profile, rig, worldTime, money: profile.money - payment.due, maintenanceShopInspections: inspections };
}
