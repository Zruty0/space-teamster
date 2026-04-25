// Ship state and physics simulation.
// All physics expressed as accelerations (mass factored out).

import { config } from './config';
import { InputState } from './input';

export interface ShipState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;        // rad, 0 = craft horizontal, positive = CW
  angularVel: number;   // rad/s
  throttle: number;     // 0..1; cruise pulse strength gear-up, constant lift gear-down
  gimbalAngle: number;  // rad, current engine thrust direction in world coords
  renderGimbalAngle: number; // rad, visual nacelle direction in world coords
  gearDeployed: boolean;
  // Computed / display
  thrustFiring: boolean;
  rcsRotLeft: boolean;
  rcsRotRight: boolean;
  rcsTranslating: boolean;
  sas: boolean;
  dvUsed: number;
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
    renderGimbalAngle: 0,
    gearDeployed: false,
    thrustFiring: false,
    rcsRotLeft: false,
    rcsRotRight: false,
    rcsTranslating: false,
    sas: false,
    dvUsed: 0,
  };
}

export function resetShip(ship: ShipState): void {
  Object.assign(ship, createShip());
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function wrapAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

function angleDelta(target: number, current: number): number {
  return wrapAngle(target - current);
}

export function landingAutoAngleTarget(vx: number, vy: number): number {
  let refVX = vx;
  let refVY = vy;
  if (refVY > 0) {
    refVX = -refVX;
    refVY = -refVY;
  }
  const downwardSpeed = Math.max(0, -refVY);
  const descentSpeed = Math.hypot(refVX, downwardSpeed);
  if (descentSpeed < 1.0 || downwardSpeed < 0.5 || Math.abs(refVX) < 0.15) return 0;
  const offsetFromDown = Math.atan2(refVX, downwardSpeed);
  return clamp(offsetFromDown * 0.5, -Math.PI / 12, Math.PI / 12);
}

export function updateShip(
  ship: ShipState,
  input: InputState,
  dt: number,
  time: number,
): void {
  const c = config;

  let ax = 0;
  let ay = -c.gravity;
  let angAccel = 0;

  ship.thrustFiring = false;
  ship.rcsRotLeft = false;
  ship.rcsRotRight = false;
  ship.rcsTranslating = false;

  // --- Hull rotation: Q/E in both gear modes ---
  const rotateInput = (input.rotateRight ? 1 : 0) - (input.rotateLeft ? 1 : 0);
  if (Math.abs(rotateInput) > 0.01) {
    angAccel += rotateInput * c.rcsAngularAccel;
    ship.rcsRotRight = rotateInput > 0;
    ship.rcsRotLeft = rotateInput < 0;
  } else if (ship.gearDeployed) {
    // Gear-down auto-level when Q/E are not held, with slight velocity-following tilt.
    const targetAngle = landingAutoAngleTarget(ship.vx, ship.vy);
    const desiredAngVel = angleDelta(targetAngle, ship.angle) * 5.0;
    const angVelError = desiredAngVel - ship.angularVel;
    const levelAccel = clamp(angVelError * 8.0, -c.rcsAngularAccel * 2, c.rcsAngularAccel * 2);
    angAccel += levelAccel;
    ship.rcsRotRight = levelAccel > 0.1;
    ship.rcsRotLeft = levelAccel < -0.1;
  }

  let thrustAX = 0;
  let thrustAY = 0;

  if (ship.gearDeployed) {
    // Gear down: constant vertical lift, optional lateral component.
    const throttleRate = c.throttleRate * 0.25;
    if (input.throttleUp) ship.throttle = clamp(ship.throttle + throttleRate * dt, 0, 1);
    if (input.throttleDown) ship.throttle = clamp(ship.throttle - throttleRate * dt, 0, 1);
    if (input.setHoverThrottle) ship.throttle = clamp(c.gravity / c.mainEngineAccel, 0, 1);

    const lateralSign = (input.moveRight ? 1 : 0) - (input.moveLeft ? 1 : 0);
    const lateralAccel = lateralSign * c.mainEngineAccel * (input.shiftHeld ? 1 : 0.05);
    const liftAccel = ship.throttle * c.mainEngineAccel;

    thrustAX = lateralAccel;
    thrustAY = liftAccel;
    ship.gimbalAngle = Math.hypot(thrustAX, thrustAY) > 1e-6 ? Math.atan2(thrustAX, thrustAY) : 0;
  } else {
    // Gear up: world-space translational thrust, normalized on diagonals.
    ship.throttle = 0;
    const inputX = (input.moveRight ? 1 : 0) - (input.moveLeft ? 1 : 0);
    const inputY = (input.moveUp ? 1 : 0) - (input.moveDown ? 1 : 0);
    const inputMag = Math.hypot(inputX, inputY);
    if (inputMag > 1e-6) {
      const thrustAccel = c.mainEngineAccel * (input.shiftHeld ? 1 : 0.2);
      thrustAX = inputX / inputMag * thrustAccel;
      thrustAY = inputY / inputMag * thrustAccel;
      ship.throttle = thrustAccel / c.mainEngineAccel;
      ship.gimbalAngle = Math.atan2(thrustAX, thrustAY);
    } else {
      // Idle nacelles point left, away from the cab.
      ship.gimbalAngle = Math.PI / 2 - ship.angle;
    }
  }

  const thrustMag = Math.hypot(thrustAX, thrustAY);
  if (thrustMag > 1e-6) {
    ax += thrustAX;
    ay += thrustAY;
    ship.dvUsed += thrustMag * dt;
    ship.thrustFiring = true;
  }

  // Visual-only nacelle slew, intentionally slower than actual thrust-vector changes.
  const nacelleSlewRate = 6.0;
  const nacelleDelta = angleDelta(ship.gimbalAngle, ship.renderGimbalAngle);
  ship.renderGimbalAngle = wrapAngle(
    ship.renderGimbalAngle + clamp(nacelleDelta, -nacelleSlewRate * dt, nacelleSlewRate * dt),
  );

  // --- Landing SAS (T): damp translational motion without affecting rotation ---
  if (ship.sas) {
    const sasAccelMax = c.mainEngineAccel * 0.1;
    const sasTargetAX = -ship.vx * 1.5;
    const sasTargetAY = -ship.vy * 1.5;
    const sasMag = Math.hypot(sasTargetAX, sasTargetAY);
    if (sasMag > 0.01) {
      const scale = Math.min(1, sasAccelMax / sasMag);
      const sasAX = sasTargetAX * scale;
      const sasAY = sasTargetAY * scale;
      ax += sasAX;
      ay += sasAY;
      ship.dvUsed += Math.hypot(sasAX, sasAY) * dt;
      ship.rcsTranslating = true;
    }
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
  ship.angle = wrapAngle(ship.angle + ship.angularVel * dt);

  ship.vx += ax * dt;
  ship.vy += ay * dt;

  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
}

// --- Ship geometry for rendering & collision ---

export const LANDING_GEAR_REST_HEIGHT = 4.05;

// Side-view cargo tug / container truck. The craft is wide in landing view:
// long container + frame body, short cab separated to the right, engines and legs on the belt.
export const SHIP_OUTLINE: [number, number][] = [
  [-6.2, 2.6],
  [6.2, 2.6],
  [6.2, -2.6],
  [-6.2, -2.6],
];

export const CAB_OUTLINE: [number, number][] = [
  [7.0, 3.0],
  [8.0, 3.8],
  [9.4, 3.8],
  [10.4, 2.8],
  [10.8, 1.2],
  [10.8, -1.8],
  [7.0, -1.8],
];

export const BELT_LINE: [number, number][] = [
  [-6.2, 0],
  [6.2, 0],
];

export const ENGINE_PODS: [number, number][] = [
  [-4.0, 0],
  [4.0, 0],
];

// Cockpit / windshield detail line
export const COCKPIT_LINE: [number, number][] = [
  [8.0, 3.1],
  [9.2, 3.1],
  [10.1, 2.4],
  [10.2, 1.1],
];

// Landing gear (deployed): two-segment stick legs.
// Segment 1: down and out at ~45°.
// Segment 2: down, ~20° past vertical.
// Small horizontal foot at the end.
export const GEAR_LEFT: [number, number][] = [
  [-2.0, 0.0],
  [-3.12, -1.94],
  [-2.35, -4.03],
  [-2.85, -4.03],
  [-1.85, -4.03],
];
export const GEAR_RIGHT: [number, number][] = [
  [2.0, 0.0],
  [3.12, -1.94],
  [2.35, -4.03],
  [1.85, -4.03],
  [2.85, -4.03],
];

// Collision check points (local coords): both container and cab are part of the hitbox.
export const COLLISION_POINTS: [number, number][] = [
  [-6.2, -2.6], [0, -2.6], [6.2, -2.6],
  [-6.2, 0], [6.2, 0],
  [-6.2, 2.6], [0, 2.6], [6.2, 2.6],
  [7.0, -1.8], [10.8, -1.8],
  [7.0, 1.2], [10.8, 1.2],
  [8.0, 3.8], [9.4, 3.8], [10.4, 2.8],
];

// When gear deployed, the lowest points change.
export const GEAR_COLLISION_POINTS: [number, number][] = [
  [-2.85, -4.03],
  [-1.85, -4.03],
  [1.85, -4.03],
  [2.85, -4.03],
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
