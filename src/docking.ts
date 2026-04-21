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
    thrustForce: 200,
    rotTorque: 80,
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
    thrustForce: 200,
    rotTorque: 80,
    tugMass: 500,
    containerMass: 0,
    dampingAssist: true,
  },
];

// ===================== State =====================

export function createDockingState(level: DockingLevel): DockingState {
  return {
    x: -60, y: 10,
    vx: 0.5, vy: 0,
    angle: 0,
    angVel: 0,
    sas: level.dampingAssist,
    alive: true,
    delivered: false,
    thrustUp: false, thrustDown: false, thrustLeft: false, thrustRight: false,
  };
}

// ===================== Ship Geometry =====================

// Frame dimensions (meters) — loaded vs empty
function shipDims(hasContainer: boolean): { w: number; h: number; cw: number; ch: number } {
  if (hasContainer) {
    // Loaded: frame wraps around container
    return { w: 12, h: 8, cw: 10, ch: 6 }; // frame, container
  } else {
    // Empty: telescoped/folded compact
    return { w: 6, h: 4, cw: 0, ch: 0 };
  }
}

// ===================== Physics =====================

export function updateDocking(
  s: DockingState, input: InputState, level: DockingLevel, dt: number,
): void {
  if (!s.alive || s.delivered) return;

  // SAS toggle
  if (input.toggleHighThrust) s.sas = !s.sas;

  const mass = level.tugMass + (level.hasContainer ? level.containerMass : 0);
  const inertia = mass * 2; // simplified rotational inertia

  // Rotation: Q/E
  let torque = 0;
  if (input.wingAngleDown) torque -= level.rotTorque;  // Q = CCW
  if (input.wingAngleUp) torque += level.rotTorque;    // E = CW
  if (s.sas && !input.wingAngleDown && !input.wingAngleUp) {
    torque -= s.angVel * level.rotTorque * 2; // SAS rotation damping
  }
  s.angVel += (torque / inertia) * dt;
  s.angle += s.angVel * dt;

  // Translation: WASD = screen directions
  s.thrustUp = false; s.thrustDown = false; s.thrustLeft = false; s.thrustRight = false;
  let fx = 0, fy = 0;
  if (input.throttleUp)    { fy += level.thrustForce; s.thrustUp = true; }
  if (input.throttleDown)  { fy -= level.thrustForce; s.thrustDown = true; }
  if (input.pitch < 0)     { fx -= level.thrustForce; s.thrustLeft = true; }
  if (input.pitch > 0)     { fx += level.thrustForce; s.thrustRight = true; }

  // SAS translation damping
  if (s.sas) {
    const anyInput = input.throttleUp || input.throttleDown || input.pitch !== 0;
    if (!anyInput) {
      fx -= s.vx * mass * 1.5;
      fy -= s.vy * mass * 1.5;
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
  const dims = shipDims(level.hasContainer);

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(-s.angle); // screen rotation

  const fw = dims.w * z;  // frame width (pixels)
  const fh = dims.h * z;  // frame height

  // Frame (wireframe rectangle)
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-fw / 2, -fh / 2, fw, fh);

  // Corner brackets (structural detail)
  const cb = Math.min(fw, fh) * 0.15;
  ctx.lineWidth = 2;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(-fw / 2, -fh / 2 + cb); ctx.lineTo(-fw / 2, -fh / 2); ctx.lineTo(-fw / 2 + cb, -fh / 2);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(fw / 2, -fh / 2 + cb); ctx.lineTo(fw / 2, -fh / 2); ctx.lineTo(fw / 2 - cb, -fh / 2);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(-fw / 2, fh / 2 - cb); ctx.lineTo(-fw / 2, fh / 2); ctx.lineTo(-fw / 2 + cb, fh / 2);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(fw / 2, fh / 2 - cb); ctx.lineTo(fw / 2, fh / 2); ctx.lineTo(fw / 2 - cb, fh / 2);
  ctx.stroke();

  if (level.hasContainer) {
    // Container inside frame
    const cw = dims.cw * z;
    const ch = dims.ch * z;
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
    ctx.strokeStyle = '#44aa66';
    ctx.lineWidth = 1;
    ctx.strokeRect(-cw / 2, -ch / 2, cw, ch);

    // Container markings (horizontal stripes)
    ctx.strokeStyle = 'rgba(68, 170, 102, 0.3)';
    ctx.lineWidth = 0.5;
    const stripes = 3;
    for (let i = 1; i < stripes; i++) {
      const y = -ch / 2 + (ch * i) / stripes;
      ctx.beginPath();
      ctx.moveTo(-cw / 2, y);
      ctx.lineTo(cw / 2, y);
      ctx.stroke();
    }
  } else {
    // Empty frame — show telescoped inner structure
    const iw = fw * 0.5;
    const ih = fh * 0.5;
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.strokeRect(-iw / 2, -ih / 2, iw, ih);
    ctx.setLineDash([]);
  }

  // Thruster nozzles (small triangles on each side)
  const nz = Math.min(fw, fh) * 0.08;
  ctx.fillStyle = '#557755';
  // Top (thrust down)
  ctx.beginPath();
  ctx.moveTo(-nz, -fh / 2); ctx.lineTo(nz, -fh / 2); ctx.lineTo(0, -fh / 2 - nz * 1.5);
  ctx.closePath(); ctx.fill();
  // Bottom (thrust up)
  ctx.beginPath();
  ctx.moveTo(-nz, fh / 2); ctx.lineTo(nz, fh / 2); ctx.lineTo(0, fh / 2 + nz * 1.5);
  ctx.closePath(); ctx.fill();
  // Left (thrust right)
  ctx.beginPath();
  ctx.moveTo(-fw / 2, -nz); ctx.lineTo(-fw / 2, nz); ctx.lineTo(-fw / 2 - nz * 1.5, 0);
  ctx.closePath(); ctx.fill();
  // Right (thrust left)
  ctx.beginPath();
  ctx.moveTo(fw / 2, -nz); ctx.lineTo(fw / 2, nz); ctx.lineTo(fw / 2 + nz * 1.5, 0);
  ctx.closePath(); ctx.fill();

  // Thrust flames (screen-direction, but drawn in ship-local coords)
  const flicker = 0.7 + 0.3 * Math.sin(time * 40);
  const fl = 5 * z * flicker;
  ctx.lineWidth = 2;

  // Thrust flames (opposite to thrust direction)
  if (s.thrustDown) {
    ctx.beginPath();
    ctx.moveTo(-nz * 0.8, -fh / 2 - nz * 1.5);
    ctx.lineTo(0, -fh / 2 - nz * 1.5 - fl);
    ctx.lineTo(nz * 0.8, -fh / 2 - nz * 1.5);
    ctx.strokeStyle = '#ffaa00'; ctx.stroke();
  }
  if (s.thrustUp) {
    ctx.beginPath();
    ctx.moveTo(-nz * 0.8, fh / 2 + nz * 1.5);
    ctx.lineTo(0, fh / 2 + nz * 1.5 + fl);
    ctx.lineTo(nz * 0.8, fh / 2 + nz * 1.5);
    ctx.strokeStyle = '#ffaa00'; ctx.stroke();
  }
  if (s.thrustRight) {
    ctx.beginPath();
    ctx.moveTo(-fw / 2 - nz * 1.5, -nz * 0.8);
    ctx.lineTo(-fw / 2 - nz * 1.5 - fl, 0);
    ctx.lineTo(-fw / 2 - nz * 1.5, nz * 0.8);
    ctx.strokeStyle = '#ffaa00'; ctx.stroke();
  }
  if (s.thrustLeft) {
    ctx.beginPath();
    ctx.moveTo(fw / 2 + nz * 1.5, -nz * 0.8);
    ctx.lineTo(fw / 2 + nz * 1.5 + fl, 0);
    ctx.lineTo(fw / 2 + nz * 1.5, nz * 0.8);
    ctx.strokeStyle = '#ffaa00'; ctx.stroke();
  }

  ctx.restore();
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
  ctx.fillText('W/S: Up/Down  A/D: Left/Right  Q/E: Rotate  SHIFT: SAS  R: Restart  L: Levels', W / 2, H - 15);

  ctx.restore();
}
