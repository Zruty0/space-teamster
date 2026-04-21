// Docking phase: visual prototype for tug + container delivery.
// Self-contained module: physics, rendering, HUD.

import { InputState } from './input';

// ===================== Types =====================

// Station geometry constants
const HUB_RADIUS = 20;      // central hub radius (meters)
const SPOKE_WIDTH = 8;       // spoke core width
const BAY_W = 16;            // bay slot width (along spoke)
const BAY_D = 8;             // bay slot depth (perpendicular to spoke)
const BAYS_PER_SIDE = 6;     // bays per side of spoke
const SPOKE_LEN = BAYS_PER_SIDE * BAY_W; // total spoke length

interface BayInfo {
  spokeIdx: number;   // 0-3 (right, up, left, down)
  side: number;       // 0 = left/top side, 1 = right/bottom side
  slot: number;       // 0-5 along spoke
  filled: boolean;    // has a container
  isTarget: boolean;  // delivery target
}

export interface DockingLevel {
  id: number;
  name: string;
  subtitle: string;
  hasContainer: boolean;

  // Station center
  stationX: number; stationY: number;

  // Bay layout (generated)
  bays: BayInfo[];

  // Tractor beam
  beamRange: number;
  beamStrength: number;

  // Ship
  tugMass: number;
  containerMass: number;
  thrustForce: number;
  rotTorque: number;
  dampingAssist: boolean;

  // Start
  startX: number; startY: number;
  startVX: number; startVY: number;
}

export interface DockingState {
  x: number; y: number;     // position (meters)
  vx: number; vy: number;   // velocity
  angle: number;            // radians
  angVel: number;           // angular velocity

  sas: boolean;
  alive: boolean;
  delivered: boolean;

  // Thrust flags for rendering
  thrustUp: boolean;
  thrustDown: boolean;
  thrustLeft: boolean;
  thrustRight: boolean;
  rotCW: boolean;
  rotCCW: boolean;
  // SAS thruster flags (for rendering SAS corrections)
  sasUp: boolean; sasDown: boolean; sasLeft: boolean; sasRight: boolean;
  sasCW: boolean; sasCCW: boolean;
}

// ===================== Levels =====================

function generateBays(targetSpoke: number, targetSide: number, targetSlot: number, fillPct: number): BayInfo[] {
  const bays: BayInfo[] = [];
  let seed = 42;
  const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let spoke = 0; spoke < 4; spoke++) {
    for (let side = 0; side < 2; side++) {
      for (let slot = 0; slot < BAYS_PER_SIDE; slot++) {
        const isTarget = spoke === targetSpoke && side === targetSide && slot === targetSlot;
        const filled = isTarget ? false : rng() < fillPct;
        bays.push({ spokeIdx: spoke, side, slot, filled, isTarget });
      }
    }
  }
  return bays;
}

/** Get world-space center and open direction of a bay. */
function bayWorldPos(bay: BayInfo, sx: number, sy: number): { x: number; y: number; angle: number } {
  const spokeAngle = bay.spokeIdx * Math.PI / 2;
  const dist = HUB_RADIUS + bay.slot * BAY_W + BAY_W / 2;
  const sideSign = bay.side === 0 ? 1 : -1;
  const sideOff = (SPOKE_WIDTH / 2 + BAY_D / 2) * sideSign;
  const sdx = Math.cos(spokeAngle), sdy = Math.sin(spokeAngle);
  const pdx = -sdy, pdy = sdx; // perpendicular (left of spoke direction)
  const bx = sx + sdx * dist + pdx * sideOff;
  const by = sy + sdy * dist + pdy * sideOff;
  const openAngle = spokeAngle + (bay.side === 0 ? Math.PI / 2 : -Math.PI / 2);
  return { x: bx, y: by, angle: openAngle };
}

/** Check if point is inside station solid geometry. Returns push-out vector or null. */
function stationCollision(
  px: number, py: number, sx: number, sy: number, bays: BayInfo[],
): { nx: number; ny: number; depth: number } | null {
  // Check hub
  const hdx = px - sx, hdy = py - sy;
  const hDist = Math.sqrt(hdx * hdx + hdy * hdy);
  if (hDist < HUB_RADIUS) {
    const d = HUB_RADIUS - hDist;
    return { nx: hdx / Math.max(hDist, 0.1), ny: hdy / Math.max(hDist, 0.1), depth: d };
  }
  // Check spokes
  for (let spoke = 0; spoke < 4; spoke++) {
    const a = spoke * Math.PI / 2;
    const sdx = Math.cos(a), sdy = Math.sin(a);
    const pdx = -sdy, pdy = sdx;
    // Project point into spoke-local coords
    const lx = (px - sx) * sdx + (py - sy) * sdy; // along spoke
    const ly = (px - sx) * pdx + (py - sy) * pdy;  // perpendicular
    if (lx > HUB_RADIUS && lx < HUB_RADIUS + SPOKE_LEN && Math.abs(ly) < SPOKE_WIDTH / 2) {
      // Inside spoke core
      const pushPerp = (SPOKE_WIDTH / 2 - Math.abs(ly));
      const sign = ly > 0 ? 1 : -1;
      return { nx: pdx * sign, ny: pdy * sign, depth: pushPerp };
    }
    // Check filled bays on this spoke
    for (const bay of bays) {
      if (bay.spokeIdx !== spoke || !bay.filled) continue;
      const bp = bayWorldPos(bay, sx, sy);
      const bdx = px - bp.x, bdy = py - bp.y;
      // Bay is BAY_W x BAY_D, rotated by openAngle
      const oa = bp.angle;
      const blx = bdx * Math.cos(-oa) - bdy * Math.sin(-oa); // depth direction
      const bly = bdx * Math.sin(-oa) + bdy * Math.cos(-oa); // width direction  
      if (Math.abs(blx) < BAY_D / 2 && Math.abs(bly) < BAY_W / 2) {
        // Push out along nearest edge
        const dx2 = BAY_D / 2 - Math.abs(blx);
        const dy2 = BAY_W / 2 - Math.abs(bly);
        if (dx2 < dy2) {
          const s2 = blx > 0 ? 1 : -1;
          return { nx: Math.cos(oa) * s2, ny: Math.sin(oa) * s2, depth: dx2 };
        } else {
          const s2 = bly > 0 ? 1 : -1;
          const perpA = oa + Math.PI / 2;
          return { nx: Math.cos(perpA) * s2, ny: Math.sin(perpA) * s2, depth: dy2 };
        }
      }
    }
  }
  return null;
}

export const DOCKING_LEVELS: DockingLevel[] = [
  {
    id: 9,
    name: 'Container Delivery',
    subtitle: 'Deliver to station bay',
    hasContainer: true,
    stationX: 80, stationY: 0,
    bays: generateBays(0, 1, 3, 0.6), // target: right spoke, bottom side, slot 3
    beamRange: 12,
    beamStrength: 0.5,
    thrustForce: 3200,
    rotTorque: 1200,
    tugMass: 500,
    containerMass: 2000,
    dampingAssist: true,
    startX: -60, startY: -30,
    startVX: 2, startVY: 0.5,
  },
  {
    id: 10,
    name: 'Empty Return',
    subtitle: 'Navigate empty tug',
    hasContainer: false,
    stationX: 80, stationY: 0,
    bays: generateBays(2, 0, 1, 0.7),
    beamRange: 12,
    beamStrength: 0.5,
    thrustForce: 3200,
    rotTorque: 1200,
    tugMass: 500,
    containerMass: 0,
    dampingAssist: true,
    startX: -60, startY: 20,
    startVX: 1.5, startVY: -0.3,
  },
];

// ===================== State =====================

export function createDockingState(level: DockingLevel): DockingState {
  return {
    x: level.startX, y: level.startY,
    vx: level.startVX, vy: level.startVY,
    angle: 0,
    angVel: 0,
    sas: level.dampingAssist,
    alive: true,
    delivered: false,
    thrustUp: false, thrustDown: false, thrustLeft: false, thrustRight: false,
    rotCW: false, rotCCW: false,
    sasUp: false, sasDown: false, sasLeft: false, sasRight: false,
    sasCW: false, sasCCW: false,
  };
}

// ===================== Ship Geometry =====================

// Ship dimensions (meters)
// Cab is at the front (+X in ship-local). Frame extends behind.
const CAB_W = 4;     // cab length (along ship axis)
const CAB_H = 3.5;   // cab width (perpendicular) — roughly 20ft container proportions
const CAB_GAP = 1.5;  // gap between cab and frame
const FRAME_W = 16;   // frame length (when loaded)
const FRAME_H = 6;    // frame width (wraps container)
const CONTAINER_W = 14;
const CONTAINER_H = 4;
const EMPTY_FRAME_W = 6;  // fits around cab like a 20ft container
const EMPTY_FRAME_H = 5;

// ===================== Physics =====================

export function updateDocking(
  s: DockingState, input: InputState, level: DockingLevel, dt: number,
): void {
  if (!s.alive || s.delivered) return;

  // SAS toggle (T key)
  if (input.toggleSAS) s.sas = !s.sas;

  const mass = level.tugMass + (level.hasContainer ? level.containerMass : 0);
  const inertia = mass * 2;

  // Rotation: Q = CCW, E = CW
  s.rotCCW = false; s.rotCW = false;
  let torque = 0;
  s.sasUp = false; s.sasDown = false; s.sasLeft = false; s.sasRight = false;
  s.sasCW = false; s.sasCCW = false;

  if (input.wingAngleDown) { torque += level.rotTorque; s.rotCCW = true; }  // Q = CCW on screen
  if (input.wingAngleUp) { torque -= level.rotTorque; s.rotCW = true; }     // E = CW on screen
  if (s.sas && !input.wingAngleDown && !input.wingAngleUp && Math.abs(s.angVel) > 0.01) {
    torque -= s.angVel * level.rotTorque * 5;
    if (s.angVel > 0.01) s.sasCW = true;   // rotating CCW, SAS fires CW pattern
    if (s.angVel < -0.01) s.sasCCW = true;  // rotating CW, SAS fires CCW pattern
  }
  s.angVel += (torque / inertia) * dt;
  s.angle += s.angVel * dt;

  // Translation: WASD = screen directions, decomposed into ship thrusters
  s.thrustUp = false; s.thrustDown = false; s.thrustLeft = false; s.thrustRight = false;
  const hiThrust = input.toggleHighThrust; // Shift held = high thrust
  const thrustMult = hiThrust ? 4 : 1;
  const force = level.thrustForce * thrustMult;

  // Screen-direction thrust in world coords
  let screenFx = 0, screenFy = 0;
  if (input.throttleUp)        screenFy += force;  // W = screen up = +Y world
  if (input.throttleDown)      screenFy -= force;  // S = screen down = -Y world
  if (input.pitch < -0.1)      screenFx -= force;  // A = screen left = -X world
  if (input.pitch > 0.1)       screenFx += force;  // D = screen right = +X world

  // Decompose into ship-local axes to determine which thrusters fire
  // Ship forward (+X local) = (cos(angle), sin(angle)) in world
  // Ship right (+Y local, screen down when angle=0) = (-sin(angle), cos(angle))... 
  // Actually: ship local +X = forward. In world: (cos a, sin a).
  // Ship local +Y = right side. In world: perpendicular CW = (sin a, -cos a)? 
  // Let's just project:
  const cosA = Math.cos(s.angle), sinA = Math.sin(s.angle);
  // Ship forward (local +X) in world = (cosA, sinA)
  // Ship left (local +Y toward screen-top when angle=0) in world = (-sinA, cosA)
  const fwd = screenFx * cosA + screenFy * sinA;      // forward component
  const lat = -screenFx * sinA + screenFy * cosA;     // left component

  if (fwd > 0.01) s.thrustRight = true;   // forward thrust (+X local)
  if (fwd < -0.01) s.thrustLeft = true;   // backward thrust (-X local)
  if (lat > 0.01) s.thrustUp = true;      // left thrust (+Y local = screen up)
  if (lat < -0.01) s.thrustDown = true;   // right thrust (-Y local = screen down)
  (s as any)._hiThrustRender = hiThrust;  // for bigger flames

  let fx = screenFx, fy = screenFy;

  // SAS translation damping
  if (s.sas) {
    const anyInput = input.throttleUp || input.throttleDown || input.pitch !== 0;
    if (!anyInput && (Math.abs(s.vx) > 0.01 || Math.abs(s.vy) > 0.01)) {
      const maxF = level.thrustForce * 2; // always base thrust, not affected by Shift
      const sasFx = -Math.max(-maxF, Math.min(maxF, s.vx * mass * 2.0));
      const sasFy = -Math.max(-maxF, Math.min(maxF, s.vy * mass * 2.0));
      fx += sasFx;
      fy += sasFy;
      // Decompose SAS force into ship-local for thruster flags
      const cosA = Math.cos(s.angle), sinA = Math.sin(s.angle);
      const sasFwd = sasFx * cosA + sasFy * sinA;
      const sasLat = -sasFx * sinA + sasFy * cosA;
      if (sasFwd > 0.01) s.sasRight = true;   // forward SAS
      if (sasFwd < -0.01) s.sasLeft = true;    // backward SAS
      if (sasLat > 0.01) s.sasUp = true;       // up SAS
      if (sasLat < -0.01) s.sasDown = true;    // down SAS
    }
  }

  // Tractor beam: pull toward target bay when close
  if (level.hasContainer) {
    const target = level.bays.find(b => b.isTarget);
    if (target) {
      const bp = bayWorldPos(target, level.stationX, level.stationY);
      const tdx = bp.x - s.x, tdy = bp.y - s.y;
      const tDist = Math.sqrt(tdx * tdx + tdy * tdy);
      if (tDist < level.beamRange && tDist > 0.5) {
        const strength = level.beamStrength * (1 - tDist / level.beamRange);
        fx += (tdx / tDist) * strength * mass * 2;
        fy += (tdy / tDist) * strength * mass * 2;
      }
    }
  }

  s.vx += (fx / mass) * dt;
  s.vy += (fy / mass) * dt;
  s.x += s.vx * dt;
  s.y += s.vy * dt;

  // Station collision
  const col = stationCollision(s.x, s.y, level.stationX, level.stationY, level.bays);
  if (col) {
    // Push out
    s.x += col.nx * col.depth * 1.1;
    s.y += col.ny * col.depth * 1.1;
    // Relative velocity along collision normal
    const vNorm = s.vx * col.nx + s.vy * col.ny;
    if (vNorm < 0) { // moving into surface
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (speed > 5) {
        s.alive = false; // crash
        return;
      }
      // Bounce (lose 70% energy)
      s.vx -= col.nx * vNorm * 1.7;
      s.vy -= col.ny * vNorm * 1.7;
    }
  }

  // Delivery check: container inside target bay + nearly stationary
  if (level.hasContainer) {
    const target = level.bays.find(b => b.isTarget);
    if (target) {
      const bp = bayWorldPos(target, level.stationX, level.stationY);
      const dx = s.x - bp.x, dy = s.y - bp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (dist < 3 && speed < 0.5 && Math.abs(s.angVel) < 0.1) {
        s.delivered = true;
      }
    }
  }
}

// ===================== Camera =====================

export interface DockingCamera {
  x: number; y: number;
  zoom: number; // pixels per meter
}

export function createDockingCamera(): DockingCamera {
  return { x: 0, y: 0, zoom: 4 };
}

export function updateDockingCamera(
  cam: DockingCamera, s: DockingState, dt: number,
): void {
  const smooth = 1 - Math.exp(-3.0 * dt);
  cam.x += (s.x - cam.x) * smooth;
  cam.y += (s.y - cam.y) * smooth;
}

// ===================== Rendering =====================

function dws(wx: number, wy: number, cam: DockingCamera, W: number, H: number): [number, number] {
  return [
    (wx - cam.x) * cam.zoom + W / 2,
    -(wy - cam.y) * cam.zoom + H / 2, // Y flipped
  ];
}

export function renderDocking(
  ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement,
  cam: DockingCamera, s: DockingState, level: DockingLevel, time: number,
): void {
  const W = canvas.width, H = canvas.height;

  // Background
  ctx.fillStyle = '#030308';
  ctx.fillRect(0, 0, W, H);

  // Stars
  drawDockingStars(ctx, W, H);

  // Station
  drawStation(ctx, cam, level, W, H);

  // Ship (tug + container)
  drawTug(ctx, cam, s, level, W, H, time);

  // Neutral X at ship center
  const [cx, cy] = dws(s.x, s.y, cam, W, H);
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 5); ctx.lineTo(cx + 5, cy + 5);
  ctx.moveTo(cx + 5, cy - 5); ctx.lineTo(cx - 5, cy + 5);
  ctx.stroke();

  // Prediction dot (where ship will be in 2s)
  const predX = s.x + s.vx * 2;
  const predY = s.y + s.vy * 2;
  const [px, py] = dws(predX, predY, cam, W, H);
  ctx.beginPath();
  ctx.arc(px, py, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
  ctx.fill();
}

// --- Stars ---
const DOCK_STARS: { x: number; y: number; b: number }[] = [];
function drawDockingStars(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  if (DOCK_STARS.length === 0) {
    let seed = 54321;
    for (let i = 0; i < 150; i++) {
      seed = (seed * 16807) % 2147483647;
      DOCK_STARS.push({
        x: (seed / 2147483647) * 1.2 - 0.1,
        y: ((seed = (seed * 16807) % 2147483647) / 2147483647) * 1.2 - 0.1,
        b: 0.15 + ((seed = (seed * 16807) % 2147483647) / 2147483647) * 0.4,
      });
    }
  }
  for (const star of DOCK_STARS) {
    ctx.fillStyle = `rgba(180, 190, 210, ${star.b})`;
    ctx.fillRect(star.x * W, star.y * H, 1.5, 1.5);
  }
}

// --- Station ---
function drawStation(
  ctx: CanvasRenderingContext2D, cam: DockingCamera,
  level: DockingLevel, W: number, H: number,
): void {
  const z = cam.zoom;
  const sx = level.stationX, sy = level.stationY;

  // --- Hub (filled dark circle with outline) ---
  const [hx, hy] = dws(sx, sy, cam, W, H);
  const hr = HUB_RADIUS * z;
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0f14';
  ctx.fill();
  ctx.strokeStyle = '#556677';
  ctx.lineWidth = 2;
  ctx.stroke();

  // --- 4 Spokes ---
  for (let spoke = 0; spoke < 4; spoke++) {
    const a = spoke * Math.PI / 2;
    const sdx = Math.cos(a), sdy = Math.sin(a);
    const pdx = -sdy, pdy = sdx;

    // Spoke core rectangle
    const startDist = HUB_RADIUS;
    const endDist = HUB_RADIUS + SPOKE_LEN;
    const hw = SPOKE_WIDTH / 2;

    // 4 corners of spoke in world coords
    const corners = [
      [sx + sdx * startDist + pdx * hw, sy + sdy * startDist + pdy * hw],
      [sx + sdx * endDist + pdx * hw, sy + sdy * endDist + pdy * hw],
      [sx + sdx * endDist - pdx * hw, sy + sdy * endDist - pdy * hw],
      [sx + sdx * startDist - pdx * hw, sy + sdy * startDist - pdy * hw],
    ];

    ctx.beginPath();
    for (let i = 0; i < corners.length; i++) {
      const [scx, scy] = dws(corners[i][0], corners[i][1], cam, W, H);
      if (i === 0) ctx.moveTo(scx, scy); else ctx.lineTo(scx, scy);
    }
    ctx.closePath();
    ctx.fillStyle = '#080c10';
    ctx.fill();
    ctx.strokeStyle = '#445566';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // --- Bays ---
  for (const bay of level.bays) {
    const bp = bayWorldPos(bay, sx, sy);
    const oa = bp.angle; // opening direction
    // Bay rect: BAY_W along spoke, BAY_D depth outward
    const cos = Math.cos(oa), sin = Math.sin(oa);
    // Bay center is at bp.x, bp.y. Width direction = perpendicular to open angle.
    const wdx = -sin, wdy = cos; // width direction (along spoke)
    const ddx = cos, ddy = sin;  // depth direction (outward)

    // 4 corners (3-sided: open on the inward side toward spoke)
    const bw2 = BAY_W / 2, bd2 = BAY_D / 2;
    const c0 = [bp.x - wdx * bw2 - ddx * bd2, bp.y - wdy * bw2 - ddy * bd2]; // inner-left
    const c1 = [bp.x + wdx * bw2 - ddx * bd2, bp.y + wdy * bw2 - ddy * bd2]; // inner-right
    const c2 = [bp.x + wdx * bw2 + ddx * bd2, bp.y + wdy * bw2 + ddy * bd2]; // outer-right
    const c3 = [bp.x - wdx * bw2 + ddx * bd2, bp.y - wdy * bw2 + ddy * bd2]; // outer-left

    if (bay.filled) {
      // Filled bay: draw container
      const [s0x, s0y] = dws(c0[0], c0[1], cam, W, H);
      const [s1x, s1y] = dws(c1[0], c1[1], cam, W, H);
      const [s2x, s2y] = dws(c2[0], c2[1], cam, W, H);
      const [s3x, s3y] = dws(c3[0], c3[1], cam, W, H);
      ctx.beginPath();
      ctx.moveTo(s0x, s0y); ctx.lineTo(s1x, s1y);
      ctx.lineTo(s2x, s2y); ctx.lineTo(s3x, s3y);
      ctx.closePath();
      ctx.fillStyle = '#0c1a0c';
      ctx.fill();
      ctx.strokeStyle = '#335533';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (bay.isTarget) {
      // Target bay: highlight
      const [s0x, s0y] = dws(c0[0], c0[1], cam, W, H);
      const [s1x, s1y] = dws(c1[0], c1[1], cam, W, H);
      const [s2x, s2y] = dws(c2[0], c2[1], cam, W, H);
      const [s3x, s3y] = dws(c3[0], c3[1], cam, W, H);
      // Dashed outline
      ctx.beginPath();
      ctx.moveTo(s0x, s0y); ctx.lineTo(s1x, s1y);
      ctx.lineTo(s2x, s2y); ctx.lineTo(s3x, s3y);
      ctx.closePath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      // "TGT" label
      const [tcx, tcy] = dws(bp.x, bp.y, cam, W, H);
      ctx.font = '9px monospace';
      ctx.fillStyle = '#00ffcc';
      ctx.textAlign = 'center';
      ctx.fillText('TGT', tcx, tcy + 3);
    } else {
      // Empty bay: thin outline
      const [s2x, s2y] = dws(c2[0], c2[1], cam, W, H);
      const [s3x, s3y] = dws(c3[0], c3[1], cam, W, H);
      const [s0x, s0y] = dws(c0[0], c0[1], cam, W, H);
      const [s1x, s1y] = dws(c1[0], c1[1], cam, W, H);
      // Just the 3 walls (not the spoke-side opening)
      ctx.beginPath();
      ctx.moveTo(s0x, s0y); ctx.lineTo(s3x, s3y);
      ctx.lineTo(s2x, s2y); ctx.lineTo(s1x, s1y);
      ctx.strokeStyle = '#223322';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

// --- Tug + Container ---
function drawTug(
  ctx: CanvasRenderingContext2D, cam: DockingCamera,
  s: DockingState, level: DockingLevel, W: number, H: number, time: number,
): void {
  const [sx, sy] = dws(s.x, s.y, cam, W, H);
  const z = cam.zoom;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(-s.angle);

  const cabW = CAB_W * z;
  const cabH = CAB_H * z;
  const gap = CAB_GAP * z;

  if (level.hasContainer) {
    // === LOADED CONFIG ===
    const frameW = FRAME_W * z;
    const frameH = FRAME_H * z;
    const contW = CONTAINER_W * z;
    const contH = CONTAINER_H * z;

    // Layout: [frame with container] --gap-- [cab]
    // Frame center is origin, cab is to the right
    const frameX0 = -frameW / 2;
    const frameX1 = frameW / 2;
    const cabX0 = frameX1 + gap; // cab starts after gap

    // Container (centered in frame)
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(-contW / 2, -contH / 2, contW, contH);
    ctx.strokeStyle = '#44aa66';
    ctx.lineWidth = 1;
    ctx.strokeRect(-contW / 2, -contH / 2, contW, contH);
    // Container stripes
    ctx.strokeStyle = 'rgba(68, 170, 102, 0.3)';
    for (let i = 1; i < 4; i++) {
      const lx = -contW / 2 + (contW * i) / 4;
      ctx.beginPath(); ctx.moveTo(lx, -contH / 2); ctx.lineTo(lx, contH / 2); ctx.stroke();
    }

    // Frame wireframe
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(frameX0, -frameH / 2, frameW, frameH);

    // Corner brackets
    const cb = frameH * 0.12;
    ctx.lineWidth = 2;
    for (const [bx, by, dx, dy] of [
      [frameX0, -frameH/2, 1, 1], [frameX1, -frameH/2, -1, 1],
      [frameX0, frameH/2, 1, -1], [frameX1, frameH/2, -1, -1],
    ] as [number, number, number, number][]) {
      ctx.beginPath();
      ctx.moveTo(bx, by + dy * cb); ctx.lineTo(bx, by); ctx.lineTo(bx + dx * cb, by);
      ctx.stroke();
    }

    // Connecting lines: frame to cab
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(frameX1, -cabH / 2 * 0.8); ctx.lineTo(cabX0, -cabH / 2 * 0.8);
    ctx.moveTo(frameX1, cabH / 2 * 0.8); ctx.lineTo(cabX0, cabH / 2 * 0.8);
    ctx.stroke();

    // Cab
    drawCab(ctx, cabX0, cabW, cabH);

    // Nozzles under, flames on top (drawn after frame/container)
    drawNozzles(ctx, frameX0, frameX1, frameH);
    // (flames drawn below, after cab)

  } else {
    // === EMPTY CONFIG — cab inside a compact frame ===
    const efW = EMPTY_FRAME_W * z;
    const efH = EMPTY_FRAME_H * z;
    const frameX0 = -efW / 2;
    const frameX1 = efW / 2;

    // Frame (solid, around the cab)
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(frameX0, -efH / 2, efW, efH);

    // Cab inside frame (centered)
    const innerCabX = -cabW / 2;
    drawCab(ctx, innerCabX, cabW, cabH);

    drawNozzles(ctx, frameX0, frameX1, efH);
  }

  // Flames drawn LAST (on top of everything)
  if (level.hasContainer) {
    const frameW = FRAME_W * z;
    const frameH = FRAME_H * z;
    drawFlames(ctx, -frameW / 2, frameW / 2, frameH, z, s, time);
  } else {
    const efW = EMPTY_FRAME_W * z;
    const efH = EMPTY_FRAME_H * z;
    drawFlames(ctx, -efW / 2, efW / 2, efH, z, s, time);
  }

  ctx.restore();
}

function drawCab(ctx: CanvasRenderingContext2D, x0: number, w: number, h: number): void {
  // Trapezoid: wider at back, narrower at front
  const narrow = h * 0.7;
  ctx.fillStyle = '#0c180c';
  ctx.beginPath();
  ctx.moveTo(x0, -h / 2);
  ctx.lineTo(x0 + w, -narrow / 2);
  ctx.lineTo(x0 + w, narrow / 2);
  ctx.lineTo(x0, h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cockpit window
  ctx.strokeStyle = '#00ccff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0 + w * 0.5, -narrow * 0.3);
  ctx.lineTo(x0 + w * 0.85, -narrow * 0.2);
  ctx.lineTo(x0 + w * 0.85, narrow * 0.2);
  ctx.lineTo(x0 + w * 0.5, narrow * 0.3);
  ctx.closePath();
  ctx.stroke();
}

function drawNozzles(
  ctx: CanvasRenderingContext2D,
  x0: number, x1: number, fh: number,
): void {
  const fw = x1 - x0;
  const t1x = x0 + fw * 0.25;
  const t2x = x0 + fw * 0.75;
  const nz = fh * 0.18;
  ctx.fillStyle = '#557755';
  for (const tx of [t1x, t2x]) {
    ctx.beginPath();
    ctx.moveTo(tx - nz, -fh / 2); ctx.lineTo(tx + nz, -fh / 2); ctx.lineTo(tx, -fh / 2 - nz);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx - nz, fh / 2); ctx.lineTo(tx + nz, fh / 2); ctx.lineTo(tx, fh / 2 + nz);
    ctx.closePath(); ctx.fill();
  }
}

function drawFlames(
  ctx: CanvasRenderingContext2D,
  x0: number, x1: number, fh: number, z: number,
  s: DockingState, time: number,
): void {
  const fw = x1 - x0;
  const t1x = x0 + fw * 0.25;
  const t2x = x0 + fw * 0.75;
  const nz = fh * 0.18;
  const hi = (s as any)._hiThrustRender;
  const flicker = 0.7 + 0.3 * Math.sin(time * 40);
  const fl = (hi ? 5 : 1.5) * z * flicker;
  const rcsfl = (hi ? 3 : 1.2) * z * flicker;
  const mainCol = '#ffaa00';

  // Helper to draw main flames for a set of flags
  function drawMainSet(up: boolean, down: boolean, fwd: boolean, back: boolean, col: string, lw: number, flameLen?: number) {
    const f = flameLen ?? fl;
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    for (const tx of [t1x, t2x]) {
      if (up) {
        ctx.beginPath();
        ctx.moveTo(tx - nz * 0.6, fh / 2 + nz);
        ctx.lineTo(tx, fh / 2 + nz + f);
        ctx.lineTo(tx + nz * 0.6, fh / 2 + nz);
        ctx.stroke();
      }
      if (down) {
        ctx.beginPath();
        ctx.moveTo(tx - nz * 0.6, -fh / 2 - nz);
        ctx.lineTo(tx, -fh / 2 - nz - f);
        ctx.lineTo(tx + nz * 0.6, -fh / 2 - nz);
        ctx.stroke();
      }
      if (fwd) {
        ctx.beginPath();
        ctx.moveTo(tx, -fh / 2 - nz);
        ctx.lineTo(tx - f, -fh / 2 - nz);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tx, fh / 2 + nz);
        ctx.lineTo(tx - f, fh / 2 + nz);
        ctx.stroke();
      }
      if (back) {
        ctx.beginPath();
        ctx.moveTo(tx, -fh / 2 - nz);
        ctx.lineTo(tx + f, -fh / 2 - nz);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tx, fh / 2 + nz);
        ctx.lineTo(tx + f, fh / 2 + nz);
        ctx.stroke();
      }
    }
  }

  // Helper to draw RCS flames at corners
  function drawRCS(ccw: boolean, cw: boolean, col: string, len: number) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = col;
    // CCW on screen: top-left fires up, bottom-right fires down
    if (ccw) {
      ctx.beginPath(); ctx.moveTo(x0 + nz * 0.3, -fh / 2); ctx.lineTo(x0, -fh / 2 - len); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1 - nz * 0.3, fh / 2); ctx.lineTo(x1, fh / 2 + len); ctx.stroke();
    }
    // CW on screen: top-right fires up, bottom-left fires down
    if (cw) {
      ctx.beginPath(); ctx.moveTo(x1 - nz * 0.3, -fh / 2); ctx.lineTo(x1, -fh / 2 - len); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 + nz * 0.3, fh / 2); ctx.lineTo(x0, fh / 2 + len); ctx.stroke();
    }
  }

  // Player thrust flames
  const lw = hi ? 2.5 : 1.5;
  drawMainSet(s.thrustUp, s.thrustDown, s.thrustRight, s.thrustLeft, mainCol, lw);
  drawRCS(s.rotCCW, s.rotCW, '#ff4422', rcsfl);

  // SAS flames (always normal size, unaffected by Shift)
  const normalFl = 1.5 * z * flicker;
  const normalRcs = 1.2 * z * flicker;
  drawMainSet(s.sasUp, s.sasDown, s.sasRight, s.sasLeft, mainCol, 1.5, normalFl);
  drawRCS(s.sasCCW, s.sasCW, '#ff4422', normalRcs);
}

// ===================== HUD =====================

export function drawDockingHUD(
  ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement,
  s: DockingState, level: DockingLevel,
  state: 'docking' | 'delivered' | 'crashed',
): void {
  const W = canvas.width, H = canvas.height;
  const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);

  ctx.save();
  ctx.font = '14px "Courier New", monospace';
  ctx.textAlign = 'left';

  const lx = 20;
  let ly = 30;
  const lh = 20;
  const COL = '#00ff88';
  const DIM = '#007744';

  // Level name
  ctx.font = '13px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = DIM;
  ctx.fillText(level.name, W - 20, 24);

  ctx.textAlign = 'left';
  ctx.font = '14px "Courier New", monospace';

  // Speed
  ctx.fillStyle = DIM; ctx.fillText('SPD', lx, ly);
  ctx.fillStyle = COL; ctx.fillText(`${speed.toFixed(1)} m/s`, lx + 50, ly);
  ly += lh;

  // Angle
  ctx.fillStyle = DIM; ctx.fillText('ANG', lx, ly);
  ctx.fillStyle = COL; ctx.fillText(`${(s.angle * 180 / Math.PI).toFixed(1)}°`, lx + 50, ly);
  ly += lh;

  // SAS
  ctx.fillStyle = DIM; ctx.fillText('SAS', lx, ly);
  ctx.fillStyle = s.sas ? '#00ffcc' : DIM;
  ctx.fillText(s.sas ? 'ON' : 'OFF', lx + 50, ly);
  ly += lh;

  // Distance to target bay
  const target = level.bays.find(b => b.isTarget);
  if (target) {
    const bp = bayWorldPos(target, level.stationX, level.stationY);
    const dx = s.x - bp.x, dy = s.y - bp.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    ctx.fillStyle = DIM; ctx.fillText('TGT', lx, ly);
    ctx.fillStyle = dist < level.beamRange ? '#00ffcc' : COL;
    ctx.fillText(`${dist.toFixed(1)} m`, lx + 50, ly);
    ly += lh;
  }

  // State overlays
  if (state === 'delivered') {
    ctx.fillStyle = 'rgba(0, 20, 0, 0.6)';
    ctx.fillRect(W / 2 - 200, H / 2 - 60, 400, 120);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 200, H / 2 - 60, 400, 120);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('DELIVERED', W / 2, H / 2 - 15);
    ctx.fillStyle = DIM;
    ctx.font = '14px monospace';
    ctx.fillText('R: Retry  |  L: Levels', W / 2, H / 2 + 25);
  }
  if (state === 'crashed') {
    ctx.fillStyle = 'rgba(20, 0, 0, 0.6)';
    ctx.fillRect(W / 2 - 200, H / 2 - 60, 400, 120);
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 200, H / 2 - 60, 400, 120);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('CRASHED', W / 2, H / 2 - 15);
    ctx.fillStyle = DIM;
    ctx.font = '14px monospace';
    ctx.fillText('R: Retry  |  L: Levels', W / 2, H / 2 + 25);
  }

  // Controls hint
  if (state === 'docking') {
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = DIM;
    ctx.fillText('W/S: Up/Down  A/D: Left/Right  Q: CCW  E: CW  T: SAS  Shift: Hi Thrust  R: Restart', W / 2, H - 15);
  }

  ctx.restore();
}
