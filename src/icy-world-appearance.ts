import { icyWorldGeometry, resolveIcyWorldProfile, type IcyWorldProfile } from './icy-world-geometry';
import { beginDisc, finishDisc, trace, type WorldTint } from './world-disc-primitives';

/** Solid ice throughout: dark exposures, bright frost, double-edged fractures
 * and softened impact relief. No water, atmosphere, hazards or changing cracks.
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
    if (radius >= 60) {
      ctx.strokeStyle = material(0.91, 0.3); ctx.lineWidth = 0.009; ctx.stroke();
    }
  }
  if (radius >= 14) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const line = (points: readonly (readonly [number, number])[]) => {
      ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    };
    for (const fracture of model.fractures.slice(0, radius < 60 ? 4 : undefined)) {
      for (const path of radius < 60 ? [fracture.main] : [fracture.main, fracture.branch]) {
        line(path); ctx.strokeStyle = material(0.74, 0.12); ctx.lineWidth = 0.017; ctx.stroke();
        ctx.save(); ctx.translate(-0.003, -0.004);
        line(path); ctx.strokeStyle = material(1, 0.55); ctx.lineWidth = 0.005; ctx.stroke(); ctx.restore();
        line(path); ctx.strokeStyle = material(0.51); ctx.lineWidth = 0.004; ctx.stroke();
      }
    }
  }
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
