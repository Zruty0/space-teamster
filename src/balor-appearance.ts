// A static lava cap, not an animated texture or an atmosphere. Coordinates are
// normalized to planet radius; +X is sunward. Geometry is built once and shared
// by the system marker and full orbital disc. No frame RNG or world-time input.
type Point = readonly [number, number];

// Total surface arc, not a radius: ±15° about the substellar point. Seen from
// above the orbital plane this is a narrow cap on the limb, not half the disc.
export const BALOR_EYE_ARC = Math.PI / 6;
const HALF_ARC = BALOR_EYE_ARC / 2;
const SHORE_X = Math.cos(HALF_ARC);
const EYE_DEPTH = 1 - SHORE_X;
const EYE_HEIGHT = Math.sin(HALF_ARC);

export function balorShoreX(y: number): number {
  const v = y / EYE_HEIGHT;
  return SHORE_X + EYE_DEPTH * (0.05 * Math.sin(v * 11 + 0.4) + 0.025 * Math.sin(v * 31 - 0.8) + 0.015 * Math.cos(v * 53));
}

const SHORE: readonly Point[] = Object.freeze(Array.from({ length: 81 }, (_, i) => {
  const y = EYE_HEIGHT * (-1.08 + 2.16 * i / 80);
  return Object.freeze([balorShoreX(y), y]) as Point;
}));

function island(cx: number, cy: number, rx: number, ry: number, phase: number): readonly Point[] {
  return Object.freeze(Array.from({ length: 13 }, (_, i) => {
    const angle = i / 13 * Math.PI * 2;
    const irregularity = 1 + 0.20 * Math.sin(angle * 3 + phase) + 0.12 * Math.cos(angle * 5 - phase);
    return Object.freeze([cx + Math.cos(angle) * rx * irregularity, cy + Math.sin(angle) * ry * irregularity]) as Point;
  }));
}
const CRUST = Object.freeze([
  island(SHORE_X + EYE_DEPTH * 0.25, -EYE_HEIGHT * 0.48, EYE_DEPTH * 0.12, EYE_HEIGHT * 0.07, 1),
  island(SHORE_X + EYE_DEPTH * 0.38, EYE_HEIGHT * 0.29, EYE_DEPTH * 0.065, EYE_HEIGHT * 0.12, 2),
  island(SHORE_X + EYE_DEPTH * 0.65, -EYE_HEIGHT * 0.24, EYE_DEPTH * 0.055, EYE_HEIGHT * 0.035, 3),
]);
const ROCK_SEAMS: readonly (readonly Point[])[] = [
  [[-0.89, -0.12], [-0.68, -0.22], [-0.51, -0.18], [-0.34, -0.35], [-0.13, -0.30], [0.20, -0.44]],
  [[-0.65, 0.66], [-0.44, 0.48], [-0.38, 0.27], [-0.16, 0.19], [0.10, 0.25], [0.29, 0.14]],
  [[-0.20, -0.91], [-0.13, -0.69], [0.08, -0.60], [0.16, -0.41]],
];

function trace(ctx: CanvasRenderingContext2D, points: readonly Point[], offsetX = 0): void {
  ctx.beginPath();
  points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x + offsetX, y) : ctx.lineTo(x + offsetX, y));
}
function cap(ctx: CanvasRenderingContext2D, inset = 0): void {
  trace(ctx, SHORE, inset);
  ctx.lineTo(1.1, EYE_HEIGHT * 1.08);
  ctx.lineTo(1.1, -EYE_HEIGHT * 1.08);
  ctx.closePath();
}

/** eyeAngle uses world (+Y-up) radians; Canvas is +Y-down. All glow is clipped
 * inside the body. A small marker keeps the same silhouette without tiny noise.
 */
export function drawBalorDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, eyeAngle: number): void {
  if (!(radius > 0) || ![cx, cy, radius, eyeAngle].every(Number.isFinite)) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-eyeAngle);
  ctx.scale(radius, radius);
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.clip();
  const detailed = radius >= 14;
  if (detailed) {
    const rock = ctx.createLinearGradient(-1, 0, 1, 0);
    rock.addColorStop(0, '#090d13');
    rock.addColorStop(0.55, '#202329');
    rock.addColorStop(1, '#49352d');
    ctx.fillStyle = rock;
  } else ctx.fillStyle = '#171c25';
  ctx.fillRect(-1, -1, 2, 2);

  if (radius >= 45) {
    ctx.strokeStyle = '#35373b';
    ctx.lineWidth = Math.max(0.65 / radius, 0.003);
    for (const seam of ROCK_SEAMS) { trace(ctx, seam); ctx.stroke(); }
  }
  cap(ctx);
  ctx.fillStyle = detailed ? '#8e301d' : '#ff9d32';
  ctx.fill();
  if (detailed) {
    // Local hot glow and cooling shore, never a global atmosphere ring.
    trace(ctx, SHORE, -EYE_DEPTH * 0.025);
    ctx.strokeStyle = 'rgba(225, 65, 20, 0.22)';
    ctx.lineWidth = EYE_DEPTH * 0.08;
    ctx.stroke();
    cap(ctx, EYE_DEPTH * 0.07);
    ctx.save();
    ctx.translate(SHORE_X, 0);
    ctx.scale(EYE_DEPTH, EYE_HEIGHT);
    const lava = ctx.createRadialGradient(0.9, 0, 0.01, 0.9, 0, 1.2);
    ctx.restore();
    lava.addColorStop(0, '#ffe3a0');
    lava.addColorStop(0.25, '#ffbd4b');
    lava.addColorStop(0.55, '#f97a24');
    lava.addColorStop(0.82, '#c64016');
    lava.addColorStop(1, '#7d251b');
    ctx.fillStyle = lava;
    ctx.fill();
    if (radius >= 180) {
      ctx.save();
      cap(ctx, EYE_DEPTH * 0.07);
      ctx.clip();
      for (const plate of CRUST) {
        trace(ctx, plate);
        ctx.closePath();
        ctx.fillStyle = '#342922';
        ctx.fill();
        ctx.strokeStyle = '#a34720';
        ctx.lineWidth = Math.min(0.3 / radius, EYE_DEPTH * 0.025);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  ctx.restore();
  // Crisp chart silhouette over the disc; no off-limb bloom masking flight UI.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#6b625c';
  ctx.lineWidth = radius >= 14 ? 1 : 0.75;
  ctx.stroke();
  if (radius < 45) {
    // Minimum one-pixel depth for chart markers, but retain the 30° arc rather
    // than enlarging the molten area into a hemisphere at small zoom levels.
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(0, radius - 0.5), -eyeAngle - HALF_ARC, -eyeAngle + HALF_ARC);
    ctx.strokeStyle = '#ffb448';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}
