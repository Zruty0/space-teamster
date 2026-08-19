import { componentFaultById, maintenanceComponentById, maintenanceSystemById } from './catalog';
import { COMPONENT_GRADES, componentMaxHp, componentPartsCost, componentReplacementCost, componentServicedAp, shopCanPerform } from './grades';
import { applyMechanicOperation } from './maintenance-service';
import { MAINTENANCE_SYSTEM_IDS, type CareerRigState, type ComponentGrade, type ComponentId, type MaintenanceSystemId, type ShopGrade, type WorkGrade } from './types';

export interface MaintenanceShopPerson {
  references: string[];
  contact?: boolean;
}

export interface MaintenanceShopCopy {
  people: MaintenanceShopPerson[];
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
  name: 'Vilar’s Outfitter at Oathmark',
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
    people: [
      { references: ['Baron Estêvão Vilar', 'Baron Vilar'] },
      { references: ['Sir Tomás Barreto', 'Sir Tomás'] },
    ],
    profileBlurb: 'A gilt House Vilar badge marks this as one shop in Baron Estêvão Vilar’s network of outfitter shops. The Oathmark concession is governed by Sir Tomás Barreto, a knight-overseer who directs its licensed journeymen and serf work crews from a lavish gallery above the service bays.',
    levelBlurb: 'Standard Wells outfitter in Baron Vilar’s chartered network',
    diagnosisBlurb: '“Welcome, Teamster! Entrust your rig to House Vilar and I shall see it examined from frame to antenna.” (Sir Tomás turns and shouts down the gallery.) “Inspection cradle three! Move, you witless sluggards—the rig will not inspect itself!” (He turns back with a broad smile.) “Your rig shall receive my personal attention.”',
    serviceBlurb: '“A prudent choice, Teamster! My people shall restore every serviceable fitting to mint condition.” (Sir Tomás snaps his fingers toward the bays.) “What are you gawping at? Get to work!” (He faces you again.) “House Vilar takes uncommon pride in the care of a working rig.”',
    repairsBlurb: '“Ah, the serious work—the kind by which lesser shops expose themselves. House Vilar does not send a Teamster away with a rig held together by prayers and invoice paper.” (Sir Tomás calls down to the bays.) “Fetch the proper tools, not whatever rubbish you abandoned under a bench!” (He offers you an expansive bow.) “We shall put matters right.”',
  },
};

export const VILAR_HERALD_GATE_SHOP: MaintenanceShopDef = {
  id: 'vilar-herald-gate-outfitter',
  name: 'Vilar’s Outfitter at Herald Gate',
  organizationName: 'House Vilar',
  locationIds: ['estella-xc-transit-refuel'],
  diagnosticGrade: 'C',
  workQualityGrade: 'D',
  componentGradeBest: 'D',
  componentGradeWorst: 'D',
  laborRate: 500,
  diagnosisHours: 2,
  partsMarkup: 1,
  turnaroundMultiplier: 1,
  copy: {
    people: [
      { references: ['Baron Estêvão Vilar', 'Baron Vilar'] },
      { references: ['Dame Leonor Falcão', 'Dame Leonor'] },
    ],
    profileBlurb: 'The crimson-and-gold badge of House Vilar hangs above a vaulted service gallery built into Herald Gate’s commercial ring. Baron Estêvão Vilar’s local concession is governed by Dame Leonor Falcão, a knight-overseer whose immaculate licensed journeymen direct rows of grey-clad serf mechanics below.',
    levelBlurb: 'Standard Wells outfitter in Baron Vilar’s chartered network',
    diagnosisBlurb: '“House Vilar welcomes you to Herald Gate, Teamster. I am Dame Leonor Falcão, and nothing beneath this roof escapes a proper accounting.” (She glances down into the service gallery.) “That scanner is three degrees out. Correct it before I decide your eyes are ornamental.” (Her attention returns to you.) “Your rig shall be examined with considerably greater care.”',
    serviceBlurb: '“A working rig deserves to leave my gallery looking newly issued. House Vilar shall see every serviceable fitting restored accordingly.” (Dame Leonor taps the gallery rail with one gloved finger.) “Must I explain the purpose of a tool cart, or will someone bring it before the Teamster dies of age?” (She offers you a composed smile.) “They become remarkably efficient under proper supervision.”',
    repairsBlurb: '“Damage is distasteful, but never embarrassing when placed in competent hands. We shall return your rig to honorable service.” (Dame Leonor looks down toward the bays.) “If I see that component struck with a hammer, the next object fitted to the test stand will be the mechanic.” (She inclines her head to you.) “Do not be concerned, Teamster. My people understand the cost of disappointing me.”',
  },
};

export const MAINTENANCE_SHOPS: readonly MaintenanceShopDef[] = [
  SERRAT_DOMAIN_SHIPYARD_SHOP,
  VILAR_HERALD_GATE_SHOP,
];

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
