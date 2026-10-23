import { icyWorldGeometry, resolveIcyWorldProfile, type IcyWorldProfile } from './icy-world-geometry';
import { beginDisc, finishDisc, trace, type WorldTint } from './world-disc-primitives';

/** Solid ice throughout: layered dark exposures, bright frost and sparse,
 * softened impact relief. No fracture lines, water, atmosphere or hazards.
 * Existing atmosphere is drawn independently by the production orbital layer. */
export function drawIcyDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, tint: WorldTint, profile: IcyWorldProfile): void {
  if (!tint.every(Number.isFinite) || !beginDisc(ctx, cx, cy, radius)) return;
  const p = resolveIcyWorldProfile(profile), model = icyWorldGeometry(p);
  const material = (light: number, frost = 0): string => `rgb(${tint.map((v, i) => {
    const relief = 0.88 + (light - 0.88) * p.reliefContrast;
    const clean = v * relief * (1 - frost) + [238, 245, 248][i] * frost;
    return Math.round(Math.max(0, Math.min(255, clean * (1 - p.dirt * 0.45) + [94, 91, 85][i] * relief * p.dirt * 0.45)));
  }).join(',')})`;
  ctx.fillStyle = material(0.88, 0.15); ctx.fillRect(-1, -1, 2, 2);
  for (const basin of model.surface.basins) {
    trace(ctx, basin); ctx.fillStyle = material(0.68); ctx.fill();
  }
  for (const [i, field] of model.frost.entries()) {
    trace(ctx, field);
    ctx.fillStyle = material(0.94, 0.43 + i % 3 * 0.09); ctx.fill();
  }
  ctx.lineCap = 'round';
  const count = radius < 14 ? 0 : radius < 60 ? 5 : model.surface.craters.length;
  for (const { x, y, r, squash, angle } of model.surface.craters.slice(0, count)) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(squash, 1);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = material(0.78, 0.15); ctx.fill();
    ctx.strokeStyle = material(0.96, 0.42); ctx.lineWidth = r * 0.10; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.82, -2.8 - angle, -0.3 - angle);
    ctx.strokeStyle = material(0.64); ctx.lineWidth = r * 0.12; ctx.stroke();
    ctx.restore();
  }
  finishDisc(ctx, radius, material(0.95, 0.25));
}
