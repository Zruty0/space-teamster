import { componentFaultById, maintenanceComponentById, maintenanceSystemById } from './catalog';
import { componentHasFabricatedFault, fabricatedFaultById, fabricatedFaultsForComponent } from './fabricated-faults';
import { COMPONENT_GRADES, componentMaxHp, componentPartsCost, componentReplacementCost, componentServicedAp, shopCanPerform } from './grades';
import { applyMechanicOperation } from './maintenance-service';
import { MAINTENANCE_SYSTEM_IDS, type CareerRigState, type ComponentGrade, type ComponentId, type FabricatedFaultClaim, type MaintenanceSystemId, type ShopGrade, type WorkGrade } from './types';

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
  honesty: number;
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
  honesty: 1,
  copy: {
    profileBlurb: 'A gilt House Vilar badge marks this as one shop in [person]Baron Estêvão Vilar[/person]’s network of outfitter shops. The Oathmark concession is governed by [person]Sir Tomás Barreto[/person], a knight-overseer who directs its licensed journeymen and serf work crews from a lavish gallery above the service bays.',
    levelBlurb: 'Standard Wells outfitter in [person]Baron Vilar[/person]’s chartered network',
    diagnosisBlurb: '“Welcome, Teamster! Entrust your rig to House Vilar and I shall see it examined from frame to antenna.” ([person]Sir Tomás[/person] turns and shouts down the gallery.) “Inspection cradle three! Move, you witless sluggards—the rig will not inspect itself!” (He turns back with a broad smile.) “Your rig shall receive my personal attention.”',
    serviceBlurb: '“A prudent choice, Teamster! My people shall restore every serviceable fitting to mint condition.” ([person]Sir Tomás[/person] snaps his fingers toward the bays.) “What are you gawping at? Get to work!” (He faces you again.) “House Vilar takes uncommon pride in the care of a working rig.”',
    repairsBlurb: '“Ah, the serious work—the kind by which lesser shops expose themselves. House Vilar does not send a Teamster away with a rig held together by prayers and invoice paper.” ([person]Sir Tomás[/person] calls down to the bays.) “Fetch the proper tools, not whatever rubbish you abandoned under a bench!” (He offers you an expansive bow.) “We shall put matters right.”',
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
  honesty: 1,
  copy: {
    profileBlurb: 'The crimson-and-gold badge of House Vilar hangs above a vaulted service gallery built into Herald Gate’s commercial ring. [person]Baron Estêvão Vilar[/person]’s local concession is governed by [person]Dame Leonor Falcão[/person], a knight-overseer whose immaculate licensed journeymen direct rows of grey-clad serf mechanics below.',
    levelBlurb: 'Standard Wells outfitter in [person]Baron Vilar[/person]’s chartered network',
    diagnosisBlurb: '“House Vilar welcomes you to Herald Gate, Teamster. I am [person]Dame Leonor Falcão[/person], and nothing beneath this roof escapes a proper accounting.” (She glances down into the service gallery.) “That scanner is three degrees out. Correct it before I decide your eyes are ornamental.” (Her attention returns to you.) “Your rig shall be examined with considerably greater care.”',
    serviceBlurb: '“A working rig deserves to leave my gallery looking newly issued. House Vilar shall see every serviceable fitting restored accordingly.” ([person]Dame Leonor[/person] taps the gallery rail with one gloved finger.) “Must I explain the purpose of a tool cart, or will someone bring it before the Teamster dies of age?” (She offers you a composed smile.) “They become remarkably efficient under proper supervision.”',
    repairsBlurb: '“Damage is distasteful, but never embarrassing when placed in competent hands. We shall return your rig to honorable service.” ([person]Dame Leonor[/person] looks down toward the bays.) “If I see that component struck with a hammer, the next object fitted to the test stand will be the mechanic.” (She inclines her head to you.) “Do not be concerned, Teamster. My people understand the cost of disappointing me.”',
  },
};

export const BRUCKNER_WEYMARK_SERVICE_HALL: MaintenanceShopDef = {
  id: 'bruckner-central-service-hall',
  name: 'Bruckner Central Service Hall',
  organizationName: 'Bruckner Field Services',
  locationIds: ['estella-viii-harder-approach-station'],
  diagnosticGrade: 'A',
  workQualityGrade: 'A',
  componentGradeBest: 'A',
  componentGradeWorst: 'D',
  laborRate: 1_200,
  diagnosisHours: 2,
  partsMarkup: 1,
  turnaroundMultiplier: 0.75,
  honesty: 1,
  copy: {
    profileBlurb: 'Bruckner’s central Estella service floor is bright, quiet, and divided into numbered clean bays. VHM-certified diagnostic frames stand beside locked civilian parts cages and a glass-fronted warranty office. Depot Service Director [person]Anja Riedel[/person] runs the floor by headset; every removed component is tagged before it touches a cart.',
    levelBlurb: 'Advanced VHM-authorized precision service and civilian parts depot',
    diagnosisBlurb: '“Put the rig on cradle four and leave the flight recorder live, Teamster. Weymark’s latest-generation diagnostic frames are operated by Bruckner’s senior VHM-certified engineers.” [person]Anja Riedel[/person] checks the custody seal on the diagnostic terminal. “You’ll receive a complete finding, the applicable warranty status, and the available work options. In that order.”',
    serviceBlurb: '“Preventive service is cheaper than an incident board, and considerably shorter. We’ll bring the selected systems to Bruckner service standard and return every recorded adjustment with the rig.”',
    repairsBlurb: '“You have already brought it to the best-equipped civilian service depot in Estella, Teamster. The certified alignment frames, sealed test benches, and VHM tooling are here at Weymark. If the component can be returned to specification, we have the equipment to do it. If it cannot, we will fit the proper replacement.”',
  },
};

export const RED_DUST_MECHANICAL: MaintenanceShopDef = {
  id: 'red-dust-mechanical-reclamation',
  name: 'Red Dust Mechanical & Reclamation',
  organizationName: 'Red Dust Mechanical & Reclamation',
  locationIds: ['estella-v-capital-settlement'],
  diagnosticGrade: 'D',
  workQualityGrade: 'E',
  componentGradeBest: 'E',
  componentGradeWorst: 'E',
  laborRate: 500,
  diagnosisHours: 2,
  partsMarkup: 1.35,
  turnaroundMultiplier: 1,
  honesty: 0,
  copy: {
    profileBlurb: 'Red Dust Mechanical & Reclamation occupies Concord’s former contractor motor pool, with four enclosed service bays and a crowded reclaimed-parts warehouse. [person]Abraham “Honest Abe” Calder[/person] staffs the enterprise entirely with his sons, in-laws, cousins, and whichever other relatives need work that season. Estimates are discussed around the family table in the office, while Gasket, the Calder family dog, sleeps underneath and wakes for every arriving rig.',
    levelBlurb: 'Notorious mechanical and reclaimed-parts shop that keeps regaining and again losing the Guild certification',
    diagnosisBlurb: '“Set her over the pit and come inside, Teamster. My daughter-in-law Marta has stew on, and nobody studies a repair estimate properly on an empty stomach.” [person]Abraham “Honest Abe” Calder[/person] ushers you toward the family table while his sons-in-law set the scanner beneath the rig. He beckons one of them over with a curl of one finger. “By the time we’ve eaten, young Eli here will have found everything worth discussing.”',
    serviceBlurb: '“Service only?” [person]Abe[/person]’s smile dims by exactly one degree. “Certainly. The boys will clear the dust, refresh the compounds, tighten the mounts, and give the finish a proper polish.” He glances toward the closed panels. “The deeper concerns will keep until you’re ready to give them the attention they deserve.”',
    repairsBlurb: '“Excellent. The Calders believe serious work deserves a full turnout.” Beyond the office glass, [person]Abe[/person]’s sons, in-laws, and cousins line up beside loaded tool carts, waiting for the authorization light. Gasket sits at the front with a rag in his mouth. “Sign the order, Teamster, and the whole family goes to work.”',
  },
};

export const MAINTENANCE_SHOPS: readonly MaintenanceShopDef[] = [
  SERRAT_DOMAIN_SHIPYARD_SHOP,
  VILAR_HERALD_GATE_SHOP,
  BRUCKNER_WEYMARK_SERVICE_HALL,
  RED_DUST_MECHANICAL,
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

function unitRoll(value: number): number {
  return Math.max(0, Math.min(0.9999999999999999, value));
}

export function fabricateFaultClaimsAtShop(
  rig: CareerRigState,
  shop: MaintenanceShopDef,
  random: () => number = Math.random,
): FabricatedFaultClaim[] {
  const fabricationChance = 1 - Math.max(0, Math.min(1, shop.honesty));
  if (fabricationChance <= 0) return [];
  const claims: FabricatedFaultClaim[] = [];
  for (const systemId of MAINTENANCE_SYSTEM_IDS) {
    const system = maintenanceSystemById(systemId);
    const installedComponents = system.componentIds.flatMap(componentId => {
      const component = maintenanceComponentById(componentId);
      const state = rig.components[componentId];
      return component && state?.installed && fabricatedFaultsForComponent(component).length
        ? [{ component, state }]
        : [];
    });
    const healthyComponents = installedComponents.filter(({ state }) => !state.fault);
    if (!installedComponents.some(({ state }) => !!state.fault) || !healthyComponents.length
      || unitRoll(random()) >= fabricationChance) continue;
    const selected = healthyComponents[Math.floor(unitRoll(random()) * healthyComponents.length)];
    const faults = fabricatedFaultsForComponent(selected.component);
    const fault = faults[Math.floor(unitRoll(random()) * faults.length)];
    claims.push({
      id: `fabricated-claim-${systemId}-${selected.component.id}-${fault.id}`,
      systemId,
      componentId: selected.component.id,
      faultId: fault.id,
      statusActive: true,
    });
  }
  return claims;
}

export function fabricateServiceComponentIdsAtShop(
  rig: CareerRigState,
  shop: MaintenanceShopDef,
  excludedComponentIds: ReadonlySet<ComponentId> = new Set(),
  random: () => number = Math.random,
): ComponentId[] {
  const fabricationChance = 1 - Math.max(0, Math.min(1, shop.honesty));
  if (fabricationChance <= 0) return [];
  const fabricated: ComponentId[] = [];
  for (const systemId of MAINTENANCE_SYSTEM_IDS) {
    const system = maintenanceSystemById(systemId);
    const candidates = system.componentIds.flatMap(componentId => {
      const component = maintenanceComponentById(componentId);
      const state = rig.components[componentId];
      return component && state?.installed && !state.fault && !excludedComponentIds.has(componentId)
        && !componentNeedsService(rig, shop, componentId)
        ? [{ componentId, cost: componentReplacementCost(component, state.grade) }]
        : [];
    });
    if (!candidates.length || unitRoll(random()) >= fabricationChance) continue;
    candidates.sort((a, b) => b.cost - a.cost);
    fabricated.push(candidates[0].componentId);
  }
  return fabricated;
}

export function fabricatedRepairQuote(
  rig: CareerRigState,
  shop: MaintenanceShopDef,
  claim: FabricatedFaultClaim,
): (MaintenanceQuote & { repair: string; workGrade: WorkGrade }) | undefined {
  const component = maintenanceComponentById(claim.componentId);
  const state = rig.components[claim.componentId];
  const fault = fabricatedFaultById(claim.faultId);
  if (!component || component.systemId !== claim.systemId || !state?.installed || !fault
    || !componentHasFabricatedFault(component, fault.id) || !shopCanPerform(shop.workQualityGrade, fault.workGrade)) return undefined;
  const labor = fault.laborHours * shop.laborRate;
  const parts = componentPartsCost(component, state.grade, 'minor') * shop.partsMarkup;
  return {
    repair: fault.repair,
    workGrade: fault.workGrade,
    credits: Math.round(labor + parts),
    laborHours: fault.laborHours,
    turnaroundHours: fault.laborHours * shop.turnaroundMultiplier,
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

export function systemServiceQuote(
  rig: CareerRigState,
  shop: MaintenanceShopDef,
  systemId: MaintenanceSystemId,
  fabricatedServiceComponentIds: readonly ComponentId[] = [],
): MaintenanceQuote {
  const system = maintenanceSystemById(systemId);
  const fabricated = new Set(fabricatedServiceComponentIds);
  const laborHours = system.componentIds.reduce((sum, componentId) => {
    const component = maintenanceComponentById(componentId);
    return sum + (component && (componentNeedsService(rig, shop, componentId) || fabricated.has(componentId)) ? component.serviceHours : 0);
  }, 0);
  return {
    credits: Math.round(laborHours * shop.laborRate),
    laborHours,
    turnaroundHours: laborHours * shop.turnaroundMultiplier,
  };
}

export function rigServiceQuote(rig: CareerRigState, shop: MaintenanceShopDef, fabricatedServiceComponentIds: readonly ComponentId[] = []): MaintenanceQuote {
  return MAINTENANCE_SYSTEM_IDS.reduce((total, systemId) => {
    const quote = systemServiceQuote(rig, shop, systemId, fabricatedServiceComponentIds);
    total.credits += quote.credits;
    total.laborHours += quote.laborHours;
    total.turnaroundHours += quote.turnaroundHours;
    return total;
  }, { credits: 0, laborHours: 0, turnaroundHours: 0 });
}

export function systemNeedsService(rig: CareerRigState, shop: MaintenanceShopDef, systemId: MaintenanceSystemId, fabricatedServiceComponentIds: readonly ComponentId[] = []): boolean {
  const system = maintenanceSystemById(systemId);
  const fabricated = new Set(fabricatedServiceComponentIds);
  return system.componentIds.some(componentId => componentNeedsService(rig, shop, componentId) || fabricated.has(componentId));
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
