import { FRAGILITY_LEVELS, type FragileCargoTerms } from './cargo-handling';

export interface IntegrityState {
  baseMax: number;
  baseRemaining: number;
  bufferMax: number;
  bufferRemaining: number;
  maxPenaltyCredits: number;
  fragile: FragileCargoTerms;
}

export type IntegrityThrustLevel = 'none' | 'standard' | 'high';

export const INTEGRITY_DAMAGE_RATES = {
  // Player wall-clock exposure: one bar per two minutes of precision thrust,
  // one per 30 seconds of high thrust or active turbulence.
  standardThrustPerSecond: 1 / 120,
  highThrustPerSecond: 1 / 30,
  turbulencePerSecond: 1 / 30,
} as const;

export function createIntegrityState(
  fragile: FragileCargoTerms,
  fixedPayCredits: number,
  equipmentBufferUnits = 0,
): IntegrityState {
  const tier = FRAGILITY_LEVELS[fragile.level];
  const containerBuffer = fragile.shockAbsorbingContainer ? 1 : 0;
  const bufferMax = tier.buffer + containerBuffer + Math.max(0, Math.floor(equipmentBufferUnits));
  return {
    baseMax: tier.integrity,
    baseRemaining: tier.integrity,
    bufferMax,
    bufferRemaining: bufferMax,
    maxPenaltyCredits: Math.max(0, Math.round(fixedPayCredits * fragile.conditionRiskFraction)),
    fragile: { ...fragile },
  };
}

export function cloneIntegrityState(state: IntegrityState | null): IntegrityState | null {
  return state ? { ...state, fragile: { ...state.fragile } } : null;
}

export function applyIntegrityDamage(state: IntegrityState | null, damage: number): number {
  if (!state || !Number.isFinite(damage) || damage <= 0) return 0;
  const before = state.bufferRemaining + state.baseRemaining;
  const bufferDamage = Math.min(state.bufferRemaining, damage);
  state.bufferRemaining -= bufferDamage;
  state.baseRemaining = Math.max(0, state.baseRemaining - (damage - bufferDamage));
  return before - state.bufferRemaining - state.baseRemaining;
}

export function applyIntegrityExposure(
  state: IntegrityState | null,
  dt: number,
  thrust: IntegrityThrustLevel,
  turbulence = false,
): number {
  if (!state || dt <= 0) return 0;
  const thrustRate = thrust === 'high'
    ? INTEGRITY_DAMAGE_RATES.highThrustPerSecond
    : thrust === 'standard'
      ? INTEGRITY_DAMAGE_RATES.standardThrustPerSecond
      : 0;
  const rate = thrustRate + (turbulence ? INTEGRITY_DAMAGE_RATES.turbulencePerSecond : 0);
  return applyIntegrityDamage(state, rate * dt);
}

export function landingIntegrityDamage(
  verticalSpeed: number,
  horizontalSpeed: number,
  baseIntegrityUnits: number,
  maxVerticalSpeed: number,
  maxHorizontalSpeed: number,
): number {
  // Specific touchdown impulse is proportional to the velocity removed when the rig
  // settles. Calibrate the line so the edge of a PERFECT touchdown costs 2% of base
  // integrity and the corner of the accepted landing envelope costs two whole bars.
  const impulse = Math.hypot(Math.abs(verticalSpeed), Math.abs(horizontalSpeed));
  const perfectImpulse = Math.hypot(1, 0.5);
  const hardImpulse = Math.max(perfectImpulse + 1e-6, Math.hypot(maxVerticalSpeed, maxHorizontalSpeed));
  const perfectDamage = Math.max(0, baseIntegrityUnits) * 0.02;
  const damage = perfectDamage
    + (impulse - perfectImpulse) / (hardImpulse - perfectImpulse) * (2 - perfectDamage);
  return Math.max(0, Math.min(2, damage));
}

export function dockingIntegrityDamage(impactSpeed: number): number {
  if (!Number.isFinite(impactSpeed) || impactSpeed <= 0) return 0;
  return Math.min(0.75, Math.max(0.05, impactSpeed / 5 * 0.75));
}

export function integrityPenalty(state: IntegrityState | null): number {
  if (!state || state.baseMax <= 0) return 0;
  const damagedFraction = 1 - state.baseRemaining / state.baseMax;
  return Math.round(state.maxPenaltyCredits * Math.max(0, Math.min(1, damagedFraction)));
}

export function integrityConditionSummary(state: IntegrityState): string {
  const intactPercent = Math.round(state.baseRemaining / state.baseMax * 100);
  const bufferStatus = state.bufferRemaining > 0 ? 'shock buffer remains' : 'no shock buffer remains';
  return `${intactPercent}% condition | ${bufferStatus}`;
}

export function drawIntegrityMeter(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: IntegrityState,
  top: number,
): void {
  const brickW = 18;
  const brickH = 11;
  const gap = 3;
  const count = state.baseMax + state.bufferMax;
  const barW = count * brickW + Math.max(0, count - 1) * gap;
  const panelW = 300;
  const panelH = 48;
  const x = canvas.width - 20 - panelW;
  const y = top;
  const barX = x + panelW / 2 - barW / 2;
  const barY = y + 25;

  ctx.save();
  ctx.fillStyle = 'rgba(3, 10, 16, 0.82)';
  ctx.fillRect(x, y, panelW, panelH);
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.42)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, panelW - 1, panelH - 1);
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#b8fff1';
  ctx.fillText('FRAGILE CARGO INTEGRITY', x + panelW / 2, y + 15);

  let slot = 0;
  for (let i = 0; i < state.baseMax; i++, slot++) {
    const bx = barX + slot * (brickW + gap);
    const remaining = Math.max(0, Math.min(1, state.baseRemaining - i));
    ctx.fillStyle = '#ff4d5a';
    ctx.fillRect(bx, barY, brickW, brickH);
    if (remaining > 0) {
      ctx.fillStyle = '#35d58a';
      ctx.fillRect(bx, barY, brickW * remaining, brickH);
    }
    ctx.strokeStyle = '#9fffd0';
    ctx.strokeRect(bx + 0.5, barY + 0.5, brickW - 1, brickH - 1);
  }
  for (let i = 0; i < state.bufferMax; i++, slot++) {
    const bx = barX + slot * (brickW + gap);
    const remaining = Math.max(0, Math.min(1, state.bufferRemaining - i));
    ctx.fillStyle = '#17242d';
    ctx.fillRect(bx, barY, brickW, brickH);
    if (remaining > 0) {
      ctx.fillStyle = '#46b9ff';
      ctx.fillRect(bx, barY, brickW * remaining, brickH);
    }
    ctx.strokeStyle = remaining > 0 ? '#a8ddff' : '#40525e';
    ctx.strokeRect(bx + 0.5, barY + 0.5, brickW - 1, brickH - 1);
  }
  ctx.restore();
}
