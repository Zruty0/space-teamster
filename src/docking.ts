// Docking phase: visual prototype for tug + container delivery.
// Self-contained module: physics, rendering, HUD.

import { InputState } from './input';

// ===================== Types =====================

export interface DockingLevel {
  id: number;
  name: string;
  subtitle: string;
  hasContainer: boolean;    // loaded or empty tug

  // Station bay position/orientation
  bayX: number; bayY: number;
  bayAngle: number;         // radians, 0 = bay opens rightward
  bayWidth: number;         // container must fit in this
  bayDepth: number;

  // Tractor beam
  beamRange: number;        // distance at which assist kicks in (meters)
  beamStrength: number;     // 0..1, how much it helps

  // Ship
  tugMass: number;          // kg (empty)
  containerMass: number;    // kg (when loaded)
  thrustForce: number;      // newtons
  rotTorque: number;        // N·m
  dampingAssist: boolean;   // SAS default state
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

export const DOCKING_LEVELS: DockingLevel[] = [
  {
    id: 9,
    name: 'Container Delivery',
    subtitle: 'Deliver container to station bay',
    hasContainer: true,
    bayX: 80, bayY: 0,
    bayAngle: Math.PI,       // bay opens leftward (ship approaches from left)
    bayWidth: 14,
    bayDepth: 20,
    beamRange: 15,
    beamStrength: 0.5,
    thrustForce: 800,
    rotTorque: 300,
    tugMass: 500,
    containerMass: 2000,
    dampingAssist: true,
  },
  {
    id: 10,
    name: 'Empty Return',
    subtitle: 'Maneuver empty tug',
    hasContainer: false,
    bayX: 80, bayY: 0,
    bayAngle: Math.PI,
    bayWidth: 14,
    bayDepth: 20,
    beamRange: 15,
    beamStrength: 0.5,
    thrustForce: 800,
    rotTorque: 300,
    tugMass: 500,
    containerMass: 0,
    dampingAssist: true,
  },
];

// ===================== State =====================

export function createDockingState(level: DockingLevel): DockingState {
  return {
    x: -60, y: 10,
    vx: 0, vy: 0,
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

  if (input.wingAngleDown) { torque += level.rotTorque; s.rotCCW = true; }
  if (input.wingAngleUp) { torque -= level.rotTorque; s.rotCW = true; }
  if (s.sas && !input.wingAngleDown && !input.wingAngleUp && Math.abs(s.angVel) > 0.01) {
    torque -= s.angVel * level.rotTorque * 5;
    if (s.angVel > 0.01) s.sasCCW = true;  // damping CCW rotation
    if (s.angVel < -0.01) s.sasCW = true;
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
      const maxF = level.thrustForce * 2;
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

  s.vx += (fx / mass) * dt;
  s.vy += (fy / mass) * dt;
  s.x += s.vx * dt;
  s.y += s.vy * dt;
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

  // Neutral X at ship position (where dot would be with zero velocity)
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.15)';
  ctx.lineWidth = 1;
  const [cx, cy] = dws(s.x, s.y, cam, W, H);
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
  const [bx, by] = dws(level.bayX, level.bayY, cam, W, H);
  const z = cam.zoom;

  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(-level.bayAngle); // screen rotation (Y flipped)

  const bw = level.bayWidth * z;
  const bd = level.bayDepth * z;

  // Station body (large rectangle behind the bay)
  const bodyW = 40 * z;
  const bodyH = 30 * z;
  ctx.strokeStyle = '#556677';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, -bodyH / 2, bodyW, bodyH);
  ctx.fillStyle = '#0a0f14';
  ctx.fillRect(0, -bodyH / 2, bodyW, bodyH);

  // Solar panels
  ctx.strokeStyle = '#445566';
  ctx.lineWidth = 1.5;
  const panelW = 15 * z, panelH = 8 * z;
  ctx.strokeRect(bodyW * 0.3, -bodyH / 2 - panelH - 2 * z, panelW, panelH);
  ctx.strokeRect(bodyW * 0.3, bodyH / 2 + 2 * z, panelW, panelH);

  // Bay opening (rectangular slot)
  ctx.strokeStyle = '#88aacc';
  ctx.lineWidth = 2;
  // Bay is open on the left side (toward approaching ship)
  ctx.beginPath();
  ctx.moveTo(0, -bw / 2);
  ctx.lineTo(-bd, -bw / 2);
  ctx.lineTo(-bd, bw / 2);
  ctx.lineTo(0, bw / 2);
  ctx.stroke();

  // Guide markings inside bay
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = '#44ff88';
  ctx.lineWidth = 1;
  // Center line
  ctx.beginPath();
  ctx.moveTo(-bd, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Tractor beam range indicator
  if (level.beamRange > 0) {
    const br = level.beamRange * z;
    ctx.beginPath();
    ctx.arc(-bd / 2, 0, br, 0, Math.PI * 2);
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = 'rgba(0, 255, 200, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
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
  function drawMainSet(up: boolean, down: boolean, fwd: boolean, back: boolean, col: string, lw: number) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    for (const tx of [t1x, t2x]) {
      if (up) {
        ctx.beginPath();
        ctx.moveTo(tx - nz * 0.6, fh / 2 + nz);
        ctx.lineTo(tx, fh / 2 + nz + fl);
        ctx.lineTo(tx + nz * 0.6, fh / 2 + nz);
        ctx.stroke();
      }
      if (down) {
        ctx.beginPath();
        ctx.moveTo(tx - nz * 0.6, -fh / 2 - nz);
        ctx.lineTo(tx, -fh / 2 - nz - fl);
        ctx.lineTo(tx + nz * 0.6, -fh / 2 - nz);
        ctx.stroke();
      }
      // Forward: flames go straight backward (parallel to ship axis)
      if (fwd) {
        ctx.beginPath();
        ctx.moveTo(tx, -fh / 2 - nz);
        ctx.lineTo(tx - fl, -fh / 2 - nz);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tx, fh / 2 + nz);
        ctx.lineTo(tx - fl, fh / 2 + nz);
        ctx.stroke();
      }
      // Backward: flames go straight forward
      if (back) {
        ctx.beginPath();
        ctx.moveTo(tx, -fh / 2 - nz);
        ctx.lineTo(tx + fl, -fh / 2 - nz);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tx, fh / 2 + nz);
        ctx.lineTo(tx + fl, fh / 2 + nz);
        ctx.stroke();
      }
    }
  }

  // Helper to draw RCS flames at corners
  function drawRCS(ccw: boolean, cw: boolean, col: string, len: number) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = col;
    if (ccw) {
      ctx.beginPath(); ctx.moveTo(x1 - nz * 0.3, -fh / 2); ctx.lineTo(x1, -fh / 2 - len); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0 + nz * 0.3, fh / 2); ctx.lineTo(x0, fh / 2 + len); ctx.stroke();
    }
    if (cw) {
      ctx.beginPath(); ctx.moveTo(x0 + nz * 0.3, -fh / 2); ctx.lineTo(x0, -fh / 2 - len); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1 - nz * 0.3, fh / 2); ctx.lineTo(x1, fh / 2 + len); ctx.stroke();
    }
  }

  // Player thrust flames
  const lw = hi ? 2.5 : 1.5;
  drawMainSet(s.thrustUp, s.thrustDown, s.thrustRight, s.thrustLeft, mainCol, lw);
  drawRCS(s.rotCCW, s.rotCW, '#ff4422', rcsfl);

  // SAS flames (same intensity as player thrust)
  drawMainSet(s.sasUp, s.sasDown, s.sasRight, s.sasLeft, mainCol, lw);
  drawRCS(s.sasCCW, s.sasCW, '#ff4422', rcsfl);
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

  // Distance to bay
  const dx = s.x - level.bayX, dy = s.y - level.bayY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  ctx.fillStyle = DIM; ctx.fillText('BAY', lx, ly);
  ctx.fillStyle = COL; ctx.fillText(`${dist.toFixed(1)} m`, lx + 50, ly);
  ly += lh;

  // Controls hint
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = DIM;
  ctx.fillText('W/S: Up/Down  A/D: Left/Right  Q: CCW  E: CW  T: SAS  R: Restart  L: Levels', W / 2, H - 15);

  ctx.restore();
}
