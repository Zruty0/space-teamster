// Shared clipping/shading only. Extracted unchanged from the accepted rocky/Gaia
// painter; their original pixels are protected by independent baseline tests.
export type WorldTint = readonly [number, number, number];
type Point = readonly [number, number];
const TAU = Math.PI * 2;
export function trace(ctx: CanvasRenderingContext2D, points: readonly Point[]): void {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}
export function beginDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): boolean {
  if (!(radius > 0) || ![cx, cy, radius].every(Number.isFinite)) return false;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(radius, radius);
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.clip();
  return true;
}
export function finishDisc(ctx: CanvasRenderingContext2D, radius: number, outline: string): void {
  if (radius >= 14) {
    // Illustrative relief, not a moving terminator or simulated illumination.
    const shade = ctx.createRadialGradient(-0.35, -0.45, 0.12, -0.12, -0.18, 1.3);
    shade.addColorStop(0, 'rgba(255,255,255,0.08)');
    shade.addColorStop(0.48, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,7,18,0.48)');
    ctx.fillStyle = shade; ctx.fillRect(-1, -1, 2, 2);
  }
  // Border is clipped INSIDE the limb; no off-body glow or altered silhouette.
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU);
  ctx.strokeStyle = outline; ctx.lineWidth = 1.5 / radius; ctx.stroke();
  ctx.restore();
}
