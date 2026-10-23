// Orbital/chart artwork only. Normalized, static geometry; no simulation state,
// terrain, collision, weather or rotation changes. Gaia site angles are authored
// separately in placements.ts and checked against this artwork by the preview.
type Point = readonly [number, number];
export type WorldTint = readonly [number, number, number];
const TAU = Math.PI * 2;

function trace(ctx: CanvasRenderingContext2D, points: readonly Point[]): void {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}

function coast(points: readonly Point[], phase: number): readonly Point[] {
  return points.flatMap(([x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    const length = Math.hypot(nx - x, ny - y);
    return Array.from({ length: 8 }, (_, j): Point => {
      const t = j / 8;
      const rough = Math.sin(t * Math.PI) * (Math.sin(i * 11 + j * 2.3 + phase) * 0.012 + Math.sin(j * 5.1 + i) * 0.006);
      return [x + (nx - x) * t - (ny - y) / length * rough, y + (ny - y) * t + (nx - x) / length * rough];
    });
  });
}
const LAND: readonly (readonly Point[])[] = [
  [[-1.10,-0.50],[-0.76,-0.65],[-0.48,-0.60],[-0.30,-0.68],[-0.20,-0.46],[-0.23,-0.26],[-0.12,-0.12],[-0.24,0.02],[-0.17,0.17],[-0.32,0.28],[-0.35,0.49],[-0.48,0.72],[-0.88,0.70],[-0.98,0.49],[-0.82,0.33],[-0.79,0.22],[-1.08,0.14],[-1.12,-0.10]],
  [[0.04,-0.77],[0.40,-0.73],[0.64,-0.61],[0.84,-0.67],[1.14,-0.40],[1.12,-0.14],[1.09,0.08],[1.11,0.29],[0.87,0.40],[0.70,0.47],[0.83,0.63],[0.62,0.79],[0.36,0.70],[0.22,0.55],[0.28,0.39],[0.17,0.28],[0.20,0.08],[0.07,-0.08],[0.14,-0.26],[0.01,-0.40]],
];
const COASTS = LAND.map((points, i) => coast(points, i * 3));
function blob(x: number, y: number, rx: number, ry: number, phase: number): readonly Point[] {
  return Array.from({ length: 56 }, (_, i): Point => {
    const a = i / 56 * TAU;
    const r = 1 + 0.12 * Math.sin(a * 3 + phase) + 0.08 * Math.sin(a * 7 - phase);
    return [x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r];
  });
}
const FORESTS = [blob(-0.59, -0.21, 0.28, 0.32, 1), blob(0.52, -0.21, 0.30, 0.29, 3)];
const ISLANDS = [blob(-0.06, 0.25, 0.035, 0.09, 2), blob(0.02, 0.40, 0.045, 0.026, 1)];
const ICE_EDGES = [-1, 1].map(sign => Array.from({ length: 97 }, (_, i): Point => {
  const x = -1.1 + i / 96 * 2.2;
  const y = sign * (sign < 0 ? 0.53 : 0.59) + 0.036 * Math.sin(x * 9 + sign) + 0.019 * Math.sin(x * 23 - sign) + 0.008 * Math.sin(x * 51);
  return [x, y];
}));

function beginDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): boolean {
  if (!(radius > 0) || ![cx, cy, radius].every(Number.isFinite)) return false;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(radius, radius);
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.clip();
  return true;
}
function finishDisc(ctx: CanvasRenderingContext2D, radius: number, outline: string): void {
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

/** Ocean/greenery world with oversized, irregular ice caps. Shared at all scales. */
export function drawGaiaDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  if (!beginDisc(ctx, cx, cy, radius)) return;
  ctx.fillStyle = '#164967'; ctx.fillRect(-1, -1, 2, 2);
  const detailed = radius >= 45;
  (detailed ? COASTS : LAND).forEach((land, i) => {
    trace(ctx, land);
    ctx.strokeStyle = '#357782'; ctx.lineWidth = 0.023; ctx.stroke();
    ctx.fillStyle = '#5a8757'; ctx.fill();
    if (detailed) {
      ctx.save(); ctx.clip();
      trace(ctx, FORESTS[i]); ctx.fillStyle = '#306749'; ctx.fill();
      ctx.restore();
    }
  });
  if (detailed) for (const island of ISLANDS) { trace(ctx, island); ctx.fillStyle = '#5a8757'; ctx.fill(); }
  ICE_EDGES.forEach((edge, i) => {
    const sign = i ? 1 : -1;
    // Blue ice margin under the main cap; broad white areas remain visible even
    // on the smallest chart markers. No animated clouds covering the artwork.
    for (const shelf of [true, false]) {
      const points: Point[] = edge.filter((_, j) => detailed || j % 4 === 0).map(([x, y]) => [x, y - (shelf ? sign * 0.025 : 0)]);
      points.push([1.1, sign * 1.1], [-1.1, sign * 1.1]);
      trace(ctx, points); ctx.fillStyle = shelf ? '#7bafb9' : '#d4e6e7'; ctx.fill();
    }
  });
  finishDisc(ctx, radius, '#6c9da5');
}

// Shared airless-world relief. Precomputed once, not random on each frame or
// recoloring. Large basins remain legible at chart scale; finer pits fade out.
const BASINS = [blob(-0.35, -0.26, 0.43, 0.28, 2), blob(0.27, 0.22, 0.34, 0.43, 4)];
const CRATERS = (() => {
  let seed = 41873;
  const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
  const result: { x: number; y: number; r: number; squash: number; angle: number }[] = [];
  for (let i = 0; i < 58; i++) {
    const a = random() * TAU, d = Math.sqrt(random()) * 0.98;
    result.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, r: i < 9 ? 0.065 + random() * 0.065 : 0.014 + random() * 0.037, squash: Math.max(0.24, Math.sqrt(1 - d * d)), angle: a });
  }
  return result;
})();
function color(tint: WorldTint, scale: number): string {
  return `rgb(${tint.map(c => Math.round(Math.min(255, Math.max(0, c * scale)))).join(',')})`;
}

/** Reusable airless globe. Tint recolors ALL relief; no atmospheric ring.
 * Only Celeste is opted in currently. Other worlds keep their existing art.
 */
export function drawCrateredDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, tint: WorldTint): void {
  if (!tint.every(Number.isFinite) || !beginDisc(ctx, cx, cy, radius)) return;
  ctx.fillStyle = color(tint, 0.78); ctx.fillRect(-1, -1, 2, 2);
  for (const basin of BASINS) { trace(ctx, basin); ctx.fillStyle = color(tint, 0.62); ctx.fill(); }
  const count = radius < 14 ? 3 : radius < 60 ? 9 : CRATERS.length;
  for (const { x, y, r, squash, angle } of CRATERS.slice(0, count)) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(squash, 1);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
    ctx.fillStyle = color(tint, 0.53); ctx.fill();
    ctx.lineWidth = Math.max(0.0025, Math.min(0.6 / radius, r * 0.13));
    ctx.strokeStyle = color(tint, 0.92); ctx.stroke();
    if (radius >= 14) {
      ctx.beginPath(); ctx.arc(0, 0, r * 0.77, -2.8 - angle, -0.3 - angle);
      ctx.strokeStyle = color(tint, 0.38); ctx.lineWidth = r * 0.14; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.80, 0.2 - angle, 2.5 - angle);
      ctx.strokeStyle = color(tint, 1.02); ctx.lineWidth = r * 0.09; ctx.stroke();
    }
    ctx.restore();
  }
  finishDisc(ctx, radius, color(tint, 0.92));
}

/** Common dispatch for close orbital discs and moving system/moon markers. */
export function drawAuthoredWorldDisc(ctx: CanvasRenderingContext2D, bodyId: string, cx: number, cy: number, radius: number, tint: WorldTint): boolean {
  if (bodyId === 'estella-iii') drawGaiaDisc(ctx, cx, cy, radius);
  else if (bodyId === 'estella-iiia') drawCrateredDisc(ctx, cx, cy, radius, tint);
  else return false;
  return true;
}
