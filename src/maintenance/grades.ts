import type { ComponentDefinition, ComponentGrade, FaultSeverity, ShopGrade, WorkGrade } from './types';

export const COMPONENT_GRADES: readonly ComponentGrade[] = ['A', 'B', 'C', 'D', 'E', 'F'];
export const SHOP_GRADES: readonly ShopGrade[] = COMPONENT_GRADES;

const GRADE_RULES: Record<ComponentGrade, { hp: number; ap: number; cost: number }> = {
  A: { hp: 1, ap: 1, cost: 4 },
  B: { hp: 1, ap: 0, cost: 2 },
  C: { hp: 1, ap: 0, cost: 1.5 },
  D: { hp: 0, ap: 0, cost: 1 },
  E: { hp: 0, ap: -1, cost: 0.9 },
  F: { hp: 0, ap: -1, cost: 0.8 },
};

const SHOP_AP_MODIFIER: Record<ShopGrade, number> = {
  A: 1,
  B: 1,
  C: 0,
  D: 0,
  E: 0,
  F: -1,
};

export function componentMaxHp(component: ComponentDefinition, grade: ComponentGrade): number {
  return Math.max(1, component.baseHp + GRADE_RULES[grade].hp);
}

export function componentBaseAp(component: ComponentDefinition, grade: ComponentGrade): number {
  return Math.max(0, component.baseAp + GRADE_RULES[grade].ap);
}

export function componentServicedAp(component: ComponentDefinition, grade: ComponentGrade, shopGrade: ShopGrade): number {
  return Math.max(0, componentBaseAp(component, grade) + SHOP_AP_MODIFIER[shopGrade]);
}

export function componentReplacementCost(component: ComponentDefinition, grade: ComponentGrade): number {
  return Math.round(component.baseCost * GRADE_RULES[grade].cost);
}

export function componentPartsCost(component: ComponentDefinition, grade: ComponentGrade, severity: FaultSeverity): number {
  const fraction = severity === 'minor' ? 0.2 : severity === 'major' ? 0.5 : 1;
  return Math.round(componentReplacementCost(component, grade) * fraction);
}

function gradeRank(grade: WorkGrade): number {
  return COMPONENT_GRADES.indexOf(grade);
}

export function shopCanPerform(shopGrade: ShopGrade, workGrade: WorkGrade): boolean {
  return gradeRank(shopGrade) <= gradeRank(workGrade);
}
