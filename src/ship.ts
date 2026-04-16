// Ship state and physics simulation.
// All physics expressed as accelerations (mass factored out).

import { config } from './config';
import { InputState } from './input';

export interface ShipState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;        // rad, 0 = nose up, positive = CW
  angularVel: number;   // rad/s
  throttle: number;     // 0..1
  gimbalAngle: number;  // rad, current gimbal offset
  gearDeployed: boolean;
  // Computed / display
  thrustFiring: boolean;
  rcsRotLeft: boolean;
  rcsRotRight: boolean;
  rcsTranslating: boolean;
}

export function createShip(): ShipState {
  return {
    x: config.startX,
    y: config.startY,
    vx: config.startVX,
    vy: config.startVY,
    angle: 0,
    angularVel: 0,
    throttle: 0,
    gimbalAngle: 0,
    gearDeployed: false,
    thrustFiring: false,
    rcsRotLeft: false,
    rcsRotRight: false,
    rcsTranslating: false,
  };
}

export function resetShip(ship: ShipState): void {
  Object.assign(ship, createShip());
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function updateShip(
  ship: ShipState,
  input: InputState,
  dt: number,
  time: number,
  stopAssistActive: boolean,
  killRotActive: boolean,
): void {
  const c = config;

  // --- Throttle ---
  const throttleRate = ship.gearDeployed ? c.throttleRate * 0.25 : c.throttleRate;
  if (input.throttleUp) {
    ship.throttle = clamp(ship.throttle + throttleRate * dt, 0, 1);
  }
  if (input.throttleDown) {
    ship.throttle = clamp(ship.throttle - throttleRate * dt, 0, 1);
  }

  // --- Gimbal ---
  const gimbalTarget = input.pitch * c.gimbalMaxAngle;
  const gimbalDelta = gimbalTarget - ship.gimbalAngle;
  const maxGimbalChange = c.gimbalSlewRate * dt;
  ship.gimbalAngle += clamp(gimbalDelta, -maxGimbalChange, maxGimbalChange);

  // (Gear toggle handled at frame level in game.ts)

  // === Forces & Torques ===
  let ax = 0;
  let ay = 0;
  let angAccel = 0;

  // --- Gravity ---
  ay -= c.gravity;

  // --- Main engine thrust ---
  const thrustAccel = ship.throttle * c.mainEngineAccel;
  if (thrustAccel > 0.01) {
    // Thrust direction: ship angle adjusted by gimbal
    // Positive gimbal → CW torque → thrust goes slightly left in world
    const thrustAngle = ship.angle - ship.gimbalAngle;
    ax += Math.sin(thrustAngle) * thrustAccel;
    ay += Math.cos(thrustAngle) * thrustAccel;

    // Gimbal torque
    angAccel += thrustAccel * Math.sin(ship.gimbalAngle) * c.gimbalTorqueEfficiency;

    ship.thrustFiring = true;
  } else {
    ship.thrustFiring = false;
  }

  // --- RCS rotation ---
  const rcsPitchInput = input.pitch;
  if (Math.abs(rcsPitchInput) > 0.01) {
    angAccel += rcsPitchInput * c.rcsAngularAccel;
    ship.rcsRotRight = rcsPitchInput > 0;
    ship.rcsRotLeft = rcsPitchInput < 0;
  } else {
    ship.rcsRotRight = false;
    ship.rcsRotLeft = false;
  }

  // --- Auto-level assist (Q): rotate toward 0° using RCS ---
  if (killRotActive) {
    // PD controller to drive angle to 0 and angular velocity to 0
    const angleError = -ship.angle; // target is 0
    const desiredAngVel = angleError * 5.0; // proportional gain
    const angVelError = desiredAngVel - ship.angularVel;
    const levelAccel = clamp(angVelError * 8.0, -c.rcsAngularAccel * 2, c.rcsAngularAccel * 2);
    angAccel += levelAccel;
    ship.rcsRotRight = levelAccel > 0.1;
    ship.rcsRotLeft = levelAccel < -0.1;
  }

  // --- Hover assist (Space): set throttle to counteract gravity at level orientation ---
  ship.rcsTranslating = false;
  if (stopAssistActive) {
    // Simple: gravity / maxAccel, assumes ship is upright. Player compensates for tilt.
    ship.throttle = clamp(c.gravity / c.mainEngineAccel, 0, 1);
  }

  // --- Atmospheric drag ---
  const speed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
  if (speed > 0.01) {
    ax -= ship.vx * speed * c.dragCoeff;
    ay -= ship.vy * speed * c.dragCoeff;
  }

  // --- Angular drag ---
  angAccel -= ship.angularVel * c.angularDrag;

  // --- Wind ---
  if (c.windEnabled) {
    const wind = Math.sin(time * c.windFrequency * 2 * Math.PI)
               * Math.sin(time * c.windFrequency * 0.7 * 2 * Math.PI + 1.3)
               * c.windStrength;
    ax += wind;
  }

  // === Integration (symplectic Euler) ===
  ship.angularVel += angAccel * dt;
  ship.angle += ship.angularVel * dt;

  // Normalize angle to [-π, π]
  while (ship.angle > Math.PI) ship.angle -= 2 * Math.PI;
  while (ship.angle < -Math.PI) ship.angle += 2 * Math.PI;

  ship.vx += ax * dt;
  ship.vy += ay * dt;

  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
}

// --- Ship geometry for rendering & collision ---

// Outline vertices in local coords (origin = CoM, y-up, meters)
export const SHIP_OUTLINE: [number, number][] = [
  [0, 5],        // nose
  [1.2, 3.5],    // right shoulder
  [1.8, 1],      // right upper body
  [2, -2],       // right lower body
  [2.5, -3],     // right engine mount
  [2.5, -4.5],   // right engine bottom
  [1.2, -4.5],   // right engine inner
  [1.2, -3],     // right inner step
  [-1.2, -3],    // left inner step
  [-1.2, -4.5],  // left engine inner
  [-2.5, -4.5],  // left engine bottom
  [-2.5, -3],    // left engine mount
  [-2, -2],      // left lower body
  [-1.8, 1],     // left upper body
  [-1.2, 3.5],   // left shoulder
];

// Cockpit window detail line
export const COCKPIT_LINE: [number, number][] = [
  [-0.8, 3.8],
  [0, 4.5],
  [0.8, 3.8],
];

// Landing gear (deployed), left and right legs
export const GEAR_LEFT: [number, number][] = [
  [-1.5, -4.5],
  [-2.5, -6.5],
  [-3.2, -6.5],
];
export const GEAR_RIGHT: [number, number][] = [
  [1.5, -4.5],
  [2.5, -6.5],
  [3.2, -6.5],
];

// Collision check points (local coords)
export const COLLISION_POINTS: [number, number][] = [
  [0, -4.5],     // bottom center
  [-2.5, -4.5],  // left engine bottom
  [2.5, -4.5],   // right engine bottom
  [0, 5],        // nose
  [-2, 0],       // left body
  [2, 0],        // right body
];

// When gear deployed, the lowest points change
export const GEAR_COLLISION_POINTS: [number, number][] = [
  [-2.5, -6.5],  // left gear foot
  [-3.2, -6.5],
  [2.5, -6.5],   // right gear foot
  [3.2, -6.5],
];

// Transform local point to world coords
export function localToWorld(
  lx: number, ly: number,
  shipX: number, shipY: number, angle: number
): [number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    shipX + lx * cos + ly * sin,
    shipY - lx * sin + ly * cos,
  ];
}
