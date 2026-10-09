/** Existing authored heat coefficients describe heavy shielding. Normal shielding
 * absorbs four times the normalized heat load; cooling and aerodynamics are unchanged. */
export const NORMAL_SHIELD_HEAT_MULTIPLIER = 4;
export const HEAVY_SHIELD_HEAT_MULTIPLIER = 1;

export function advanceTemperature(temperature: number, heatRate: number, coolingRate: number, dt: number, heatMultiplier = HEAVY_SHIELD_HEAT_MULTIPLIER): number {
  return Math.max(0, Math.min(1.5, temperature + (heatRate * heatMultiplier - coolingRate * temperature) * dt));
}
