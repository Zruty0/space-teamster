// Filled reference painters; current game dispatch is world-presentation.ts.
// Orbital/chart artwork only. Normalized, static geometry; no simulation state,
// terrain, collision, weather or rotation changes. Gaia site angles are authored
// separately in placements.ts and checked against this artwork by the preview.
import { CELESTE_CRATER_PROFILE, crateredWorldGeometry, resolveCrateredWorldProfile, type CrateredWorldProfile } from './cratered-world-geometry';
import { rockyWorldProfileFor } from './content/estella/rocky-world-appearance';
import { icyWorldProfileFor, icyWorldTintFor } from './content/estella/icy-world-appearance';
import { drawIcyDisc } from './icy-world-appearance';
import { gasGiantProfileFor } from './content/estella/gas-giant-appearance';
import { drawGasGiantDisc } from './gas-giant-appearance';
import { drawAcheronDisc } from './acheron-appearance';
import { drawDahaiDisc } from './dahai-appearance';
import { drawHartwellDisc } from './hartwell-appearance';
import { drawKuzniaDisc } from './kuznia-appearance';
import { drawCalatravaDisc } from './calatrava-appearance';
import { drawAlmadenDisc } from './almaden-appearance';
import { drawMarismaDisc } from './marisma-appearance';
import { trace, beginDisc, finishDisc, type WorldTint } from './world-disc-primitives';
export type { WorldTint } from './world-disc-primitives';
type Point = readonly [number, number];
const TAU = Math.PI * 2;

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

// Read-only geometry access for the outline-style review; production paint unchanged.
const freezeRegions=(regions:readonly (readonly Point[])[])=>Object.freeze(regions.map(points=>Object.freeze(points.map(p=>Object.freeze([...p]) as Point))));
let gaiaGeometry:Readonly<{land:readonly (readonly Point[])[];forests:readonly (readonly Point[])[];islands:readonly (readonly Point[])[];iceEdges:readonly (readonly Point[])[]}>|undefined;
export function gaiaDiscGeometry() {
  return gaiaGeometry??=Object.freeze({land:freezeRegions(COASTS),forests:freezeRegions(FORESTS),islands:freezeRegions(ISLANDS),iceEdges:freezeRegions(ICE_EDGES)});
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

function color(tint: WorldTint, scale: number): string {
  return `rgb(${tint.map(c => Math.round(Math.min(255, Math.max(0, c * scale)))).join(',')})`;
}

/** Reusable airless globe. Tint recolors ALL relief; no atmospheric ring.
 * Production opt-ins use the explicit Stage 2 rocky-world profile registry.
 */
export function drawCrateredDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, tint: WorldTint, profile: CrateredWorldProfile = CELESTE_CRATER_PROFILE): void {
  if (!tint.every(Number.isFinite) || !beginDisc(ctx, cx, cy, radius)) return;
  const settings = resolveCrateredWorldProfile(profile);
  const { basins, craters } = crateredWorldGeometry(settings);
  const relief = (scale: number) => color(tint, settings.reliefContrast === 1 ? scale : 0.78 + (scale - 0.78) * settings.reliefContrast);
  ctx.fillStyle = color(tint, 0.78); ctx.fillRect(-1, -1, 2, 2);
  for (const basin of basins) { trace(ctx, basin); ctx.fillStyle = relief(0.62); ctx.fill(); }
  const count = radius < 14 ? 3 : radius < 60 ? 9 : craters.length;
  for (const { x, y, r, squash, angle } of craters.slice(0, count)) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(squash, 1);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
    ctx.fillStyle = relief(0.53); ctx.fill();
    ctx.lineWidth = Math.max(0.0025, Math.min(0.6 / radius, r * 0.13));
    ctx.strokeStyle = relief(0.92); ctx.stroke();
    if (radius >= 14) {
      ctx.beginPath(); ctx.arc(0, 0, r * 0.77, -2.8 - angle, -0.3 - angle);
      ctx.strokeStyle = relief(0.38); ctx.lineWidth = r * 0.14; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.80, 0.2 - angle, 2.5 - angle);
      ctx.strokeStyle = relief(1.02); ctx.lineWidth = r * 0.09; ctx.stroke();
    }
    ctx.restore();
  }
  finishDisc(ctx, radius, color(tint, 0.92));
}

/** Common dispatch for close orbital discs and moving system/moon markers. */
export function drawAuthoredWorldDisc(ctx: CanvasRenderingContext2D, bodyId: string, cx: number, cy: number, radius: number, tint: WorldTint): boolean {
  if (bodyId === 'estella-xd') { drawCalatravaDisc(ctx, cx, cy, radius); return true; }
  if (bodyId === 'estella-xia') { drawAlmadenDisc(ctx, cx, cy, radius); return true; }
  if (bodyId === 'estella-xib') { drawMarismaDisc(ctx, cx, cy, radius); return true; }
  if (bodyId === 'estella-vi') {
    drawKuzniaDisc(ctx, cx, cy, radius);
    return true;
  }
  if (bodyId === 'estella-v') {
    drawHartwellDisc(ctx, cx, cy, radius);
    return true;
  }
  if (bodyId === 'estella-iv') {
    drawDahaiDisc(ctx, cx, cy, radius);
    return true;
  }
  if (bodyId === 'estella-ii') {
    drawAcheronDisc(ctx, cx, cy, radius);
    return true;
  }
  if (bodyId === 'estella-iii') {
    drawGaiaDisc(ctx, cx, cy, radius);
    return true;
  }
  const giant = gasGiantProfileFor(bodyId);
  if (giant) {
    drawGasGiantDisc(ctx, cx, cy, radius, giant);
    return true;
  }
  const ice = icyWorldProfileFor(bodyId);
  if (ice) {
    drawIcyDisc(ctx, cx, cy, radius, icyWorldTintFor(bodyId, tint), ice);
    return true;
  }
  const profile = rockyWorldProfileFor(bodyId);
  if (!profile) return false;
  drawCrateredDisc(ctx, cx, cy, radius, tint, profile);
  return true;
}
