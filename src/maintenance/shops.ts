import { componentFaultById, maintenanceComponentById, maintenanceSystemById } from './catalog';
import { COMPONENT_GRADES, componentMaxHp, componentPartsCost, componentReplacementCost, componentServicedAp, shopCanPerform } from './grades';
import { applyMechanicOperation } from './maintenance-service';
import { MAINTENANCE_SYSTEM_IDS, type CareerRigState, type ComponentGrade, type ComponentId, type MaintenanceSystemId, type ShopGrade, type WorkGrade } from './types';

export interface MaintenanceShopCopy {
  profileBlurb: string;
  levelBlurb: string;
  diagnosisBlurb: string;
  serviceBlurb: string;
  repairsBlurb: string;
}

export interface MaintenanceShopDef {
  id: string;
  name: string;
  organizationName?: string;
  locationIds: string[];
  diagnosticGrade: WorkGrade;
  workQualityGrade: ShopGrade;
  componentGradeBest: ComponentGrade;
  componentGradeWorst: ComponentGrade;
  laborRate: number;
  diagnosisHours: number;
  partsMarkup: number;
  turnaroundMultiplier: number;
  copy: MaintenanceShopCopy;
}

export interface MaintenanceQuote {
  credits: number;
  laborHours: number;
  turnaroundHours: number;
}

export const SERRAT_DOMAIN_SHIPYARD_SHOP: MaintenanceShopDef = {
  id: 'serrat-domain-shipyard-service-yard',
  name: 'Baron Vilar’s Outfitter',
  organizationName: 'House Vilar',
  locationIds: ['estella-xie-outer-spec-drydock'],
  diagnosticGrade: 'C',
  workQualityGrade: 'D',
  componentGradeBest: 'D',
  componentGradeWorst: 'D',
  laborRate: 500,
  diagnosisHours: 2,
  partsMarkup: 1,
  turnaroundMultiplier: 1,
  copy: {
    profileBlurb: 'A lacquered household crest presides over a thoroughly ordinary Wells outfitting bay. Its proprietor, the minor noble Baron Estêvão Vilar, personally oversees licensed journeymen and the bonded serf crews who service Teamster rigs beneath his viewing gallery.',
    levelBlurb: 'Standard Wells outfitter under a minor noble’s household charter',
    diagnosisBlurb: '“Splendid! Leave your rig to me, Teamster, and I shall have every system examined from frame to antenna. You there—stop gawping and bring up the inspection cradle before our guest grows old!”',
    serviceBlurb: '“Your rig deserves the civilized attentions of my house. Choose the systems and my people will restore every scrap of protection worth restoring. Serfs! Clean hands, quick tools, and no excuses in front of a paying Teamster!”',
    repairsBlurb: '“Now we come to the heroic work: what is broken, my crews shall mend—or replace entire, should prudence demand it. Move, you idle wretches! Our honored Teamster did not dock here to watch you breathe.”',
  },
};

export const MAINTENANCE_SHOPS: readonly MaintenanceShopDef[] = [SERRAT_DOMAIN_SHIPYARD_SHOP];

export function maintenanceShopById(id: string): MaintenanceShopDef | undefined {
  return MAINTENANCE_SHOPS.find(shop => shop.id === id);
}

export function diagnosisQuote(shop: MaintenanceShopDef): MaintenanceQuote {
  return {
    credits: Math.round(shop.diagnosisHours * shop.laborRate),
    laborHours: shop.diagnosisHours,
    turnaroundHours: shop.diagnosisHours * shop.turnaroundMultiplier,
  };
}

export function diagnoseRigAtShop(rig: CareerRigState, shop: MaintenanceShopDef): number {
  let changed = 0;
  for (const [componentId, state] of Object.entries(rig.components)) {
    if (!state.installed || !state.fault || state.fault.diagnosis === 'confirmed') continue;
    if (state.fault.severity === 'total') {
      state.fault.diagnosis = 'confirmed';
      changed++;
      continue;
    }
    const component = maintenanceComponentById(componentId);
    const fault = component && componentFaultById(component, state.fault.faultId);
    const diagnosis = fault && shopCanPerform(shop.diagnosticGrade, fault.workGrade) ? 'confirmed' : 'suspected';
    if (state.fault.diagnosis !== diagnosis) {
      state.fault.diagnosis = diagnosis;
      changed++;
    }
  }
  return changed;
}

export function componentNeedsService(rig: CareerRigState, shop: MaintenanceShopDef, componentId: ComponentId): boolean {
  const component = maintenanceComponentById(componentId);
  const state = rig.components[componentId];
  return !!component && !!state?.installed && state.ap < componentServicedAp(component, state.grade, shop.workQualityGrade);
}

export function systemServiceQuote(rig: CareerRigState, shop: MaintenanceShopDef, systemId: MaintenanceSystemId): MaintenanceQuote {
  const system = maintenanceSystemById(systemId);
  const laborHours = system.componentIds.reduce((sum, componentId) => {
    const component = maintenanceComponentById(componentId);
    return sum + (component && componentNeedsService(rig, shop, componentId) ? component.serviceHours : 0);
  }, 0);
  return {
    credits: Math.round(laborHours * shop.laborRate),
    laborHours,
    turnaroundHours: laborHours * shop.turnaroundMultiplier,
  };
}

export function rigServiceQuote(rig: CareerRigState, shop: MaintenanceShopDef): MaintenanceQuote {
  return MAINTENANCE_SYSTEM_IDS.reduce((total, systemId) => {
    const quote = systemServiceQuote(rig, shop, systemId);
    total.credits += quote.credits;
    total.laborHours += quote.laborHours;
    total.turnaroundHours += quote.turnaroundHours;
    return total;
  }, { credits: 0, laborHours: 0, turnaroundHours: 0 });
}

export function systemNeedsService(rig: CareerRigState, shop: MaintenanceShopDef, systemId: MaintenanceSystemId): boolean {
  const system = maintenanceSystemById(systemId);
  return system.componentIds.some(componentId => componentNeedsService(rig, shop, componentId));
}

export function repairQuote(rig: CareerRigState, shop: MaintenanceShopDef, componentId: ComponentId): (MaintenanceQuote & { repair: string; workGrade: WorkGrade }) | undefined {
  const component = maintenanceComponentById(componentId);
  const state = rig.components[componentId];
  if (!component || !state?.installed || !state.fault || state.fault.severity === 'total' || state.fault.diagnosis !== 'confirmed') return undefined;
  const fault = componentFaultById(component, state.fault.faultId);
  if (!fault || !shopCanPerform(shop.workQualityGrade, fault.workGrade)) return undefined;
  const labor = fault.laborHours * shop.laborRate;
  const parts = componentPartsCost(component, state.grade, state.fault.severity) * shop.partsMarkup;
  return {
    repair: fault.repair,
    workGrade: fault.workGrade,
    credits: Math.round(labor + parts),
    laborHours: fault.laborHours,
    turnaroundHours: fault.laborHours * shop.turnaroundMultiplier,
  };
}

export function stockedComponentGrades(shop: MaintenanceShopDef): ComponentGrade[] {
  const best = COMPONENT_GRADES.indexOf(shop.componentGradeBest);
  const worst = COMPONENT_GRADES.indexOf(shop.componentGradeWorst);
  return COMPONENT_GRADES.slice(Math.min(best, worst), Math.max(best, worst) + 1);
}

export function replacementGradeAtShop(shop: MaintenanceShopDef, currentGrade: ComponentGrade): { grade: ComponentGrade; exact: boolean } {
  const stocked = stockedComponentGrades(shop);
  if (stocked.includes(currentGrade)) return { grade: currentGrade, exact: true };
  const currentRank = COMPONENT_GRADES.indexOf(currentGrade);
  const grade = stocked.reduce((closest, candidate) => Math.abs(COMPONENT_GRADES.indexOf(candidate) - currentRank) < Math.abs(COMPONENT_GRADES.indexOf(closest) - currentRank) ? candidate : closest);
  return { grade, exact: false };
}

export function replacementQuote(rig: CareerRigState, shop: MaintenanceShopDef, componentId: ComponentId): (MaintenanceQuote & { grade: ComponentGrade; exact: boolean }) | undefined {
  const component = maintenanceComponentById(componentId);
  const state = rig.components[componentId];
  if (!component || !state?.installed || !state.fault) return undefined;
  const replacement = replacementGradeAtShop(shop, state.grade);
  const labor = component.replacementLaborHours * shop.laborRate;
  const parts = componentReplacementCost(component, replacement.grade) * shop.partsMarkup;
  return {
    ...replacement,
    credits: Math.round(labor + parts),
    laborHours: component.replacementLaborHours,
    turnaroundHours: component.replacementLaborHours * shop.turnaroundMultiplier,
  };
}

export function serviceSystemAtShop(rig: CareerRigState, shop: MaintenanceShopDef, systemId: MaintenanceSystemId, worldTime: number): boolean {
  const system = maintenanceSystemById(systemId);
  let changed = false;
  for (const componentId of system.componentIds) {
    if (componentNeedsService(rig, shop, componentId)) changed = applyMechanicOperation(rig, componentId, 'service', shop.workQualityGrade, worldTime) || changed;
  }
  return changed;
}

export function serviceRigAtShop(rig: CareerRigState, shop: MaintenanceShopDef, worldTime: number): boolean {
  let changed = false;
  for (const systemId of MAINTENANCE_SYSTEM_IDS) changed = serviceSystemAtShop(rig, shop, systemId, worldTime) || changed;
  return changed;
}

export function repairComponentAtShop(rig: CareerRigState, shop: MaintenanceShopDef, componentId: ComponentId, worldTime: number): boolean {
  if (!repairQuote(rig, shop, componentId)) return false;
  return applyMechanicOperation(rig, componentId, 'repair', shop.workQualityGrade, worldTime);
}

export function replaceComponentAtShop(rig: CareerRigState, shop: MaintenanceShopDef, componentId: ComponentId): boolean {
  const component = maintenanceComponentById(componentId);
  const state = rig.components[componentId];
  const quote = replacementQuote(rig, shop, componentId);
  if (!component || !state || !quote) return false;
  state.installed = true;
  state.grade = quote.grade;
  state.hp = componentMaxHp(component, quote.grade);
  state.ap = componentServicedAp(component, quote.grade, shop.workQualityGrade);
  delete state.fault;
  delete state.lastServiceWorldTime;
  delete state.lastServiceMission;
  return true;
}
