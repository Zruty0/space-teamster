// Approach phase: atmospheric reentry to reach a target gate.
// Self-contained module: physics, prediction, rendering, HUD.

import { config } from './config';
import { InputState } from './input';
import { Camera, worldToScreen } from './renderer';

// ===================== Types =====================

export interface ApproachLevel {
  id: number;
  name: string;
  subtitle: string;

  gravity: number;

  // Entry
  startX: number;
  startY: number;
  startVX: number;
  startVY: number;
  startAngle: number;

  // Atmosphere
  surfaceDensity: number;
  scaleHeight: number;

  // Aero (effective Cd = Cd * A / m)
  dragNose: number;         // streamlined, nose-first
  dragBroadside: number;    // maximum cross-section (sideways)
  dragShield: number;
  dragWingPerRad: number;
  liftBody: number;          // body lift coefficient (lifting body effect)
  liftWingPerRad: number;

  // Heat
  heatCoeff: number;
  dissipation: number;
  shieldHeatMult: number;
  wingsMaxTemp: number;

  // Wings
  maxWingAngle: number;
  wingAngleRate: number;

  // Engine
  thrustAccel: number;
  fuelSeconds: number;

  // Gate
  gateX: number;
  gateY: number;
  gateRadius: number;
  gateMaxSpeed: number;
  gateMinSpeed: number;

  // Wind layers: horizontal wind bands at specific altitudes
  windLayers: WindLayer[];
  // Turbulence: altitude range with random perturbations
  turbulence: TurbulenceZone[];

  // Landing level to transition to (0 = none)
  landingLevelId: number;
}

export interface WindLayer {
  altitudeCenter: number;  // meters
  altitudeWidth: number;   // half-width of the band
  strength: number;        // m/s² (positive = rightward)
}

export interface TurbulenceZone {
  altitudeMin: number;
  altitudeMax: number;
  strength: number;        // m/s² peak random force
}

export interface ApproachState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVel: number;

  throttle: number;
  fuel: number;

  heatShield: boolean;
  wingsDeployed: boolean;
  wingAngle: number;      // tilt angle in radians (minWingAngle..maxWingAngle)
  temperature: number;

  alive: boolean;
  gateReached: boolean;
  gateSpeed: number;
  retroFiring: boolean;
  _foldTimer: number;
  _deployTimer: number;
}

interface TrajectoryPoint {
  x: number;
  y: number;
  temp: number;
  burnedUp: boolean;
}

export interface TrajectoryResult {
  points: TrajectoryPoint[];
  impactX: number | null;
  reachedGate: boolean;
  overheatIdx: number;    // first index where temp >= 1.0 (-1 if none)
  wingFoldIdx: number;    // first index where temp >= wingsMaxTemp (-1 if none)
}

// ===================== Levels =====================

export const APPROACH_LEVELS: ApproachLevel[] = [
  {
    id: 6,
    name: "Kepler's Rest",
    subtitle: 'Atmospheric reentry — learn the ropes',
    gravity: 8.0,
    startX: -60000, startY: 20000, startVX: 900, startVY: -50, startAngle: 1.5,
    surfaceDensity: 1.5, scaleHeight: 8000,
    dragNose: 0.000020, dragBroadside: 0.00040, dragShield: 0.00035,
    dragWingPerRad: 0.00015, liftBody: 0.00012, liftWingPerRad: 0.00085,
    heatCoeff: 1e-5, dissipation: 0.08, shieldHeatMult: 0.12, wingsMaxTemp: 0.50,
    maxWingAngle: 1.0, wingAngleRate: 1.0,
    thrustAccel: 15, fuelSeconds: 80,
    gateX: 0, gateY: 1500, gateRadius: 2000, gateMaxSpeed: 150, gateMinSpeed: 15,
    windLayers: [
      { altitudeCenter: 12000, altitudeWidth: 1500, strength: 8 },    // tailwind at 12km
      { altitudeCenter: 7000, altitudeWidth: 1200, strength: -12 },   // headwind at 7km
      { altitudeCenter: 3500, altitudeWidth: 800, strength: 5 },      // light tailwind low
    ],
    turbulence: [
      { altitudeMin: 4000, altitudeMax: 9000, strength: 3 },          // mid-altitude turbulence
    ],
    landingLevelId: 1,
  },
];

// ===================== State =====================

export function createApproachState(
  level: ApproachLevel,
  override?: { x: number; y: number; vx: number; vy: number; angle: number },
): ApproachState {
  const init = override ?? {
    x: level.startX, y: level.startY,
    vx: level.startVX, vy: level.startVY,
    angle: level.startAngle,
  };
  return {
    x: init.x, y: init.y,
    vx: init.vx, vy: init.vy,
    angle: init.angle, angularVel: 0,
    throttle: 0, fuel: level.fuelSeconds,
    heatShield: false, wingsDeployed: false, wingAngle: MIN_WING_ANGLE, temperature: 0,
    alive: true, gateReached: false, gateSpeed: 0, retroFiring: false,
    _foldTimer: 0, _deployTimer: 0,
  };
}

// ===================== Physics =====================

const MIN_WING_ANGLE = 0.087; // ~5 degrees

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function density(y: number, level: ApproachLevel): number {
  if (y <= 0) return level.surfaceDensity;
  return level.surfaceDensity * Math.exp(-y / level.scaleHeight);
}

/** Get wind acceleration at altitude (horizontal, m/s²). Time-evolving. */
function getWind(y: number, level: ApproachLevel, time: number = 0): number {
  let wind = 0;
  for (let i = 0; i < level.windLayers.length; i++) {
    const w = level.windLayers[i];
    // Slowly evolve width and strength over time
    // Each layer gets a unique phase offset from its index
    const phase = i * 2.17;
    const widthMod = 1 + 0.3 * Math.sin(time * 0.08 + phase);
    const strengthMod = 1 + 0.25 * Math.sin(time * 0.06 + phase + 1.3)
                          + 0.1 * Math.sin(time * 0.15 + phase * 0.7);
    const curWidth = w.altitudeWidth * widthMod;
    const curStrength = w.strength * strengthMod;

    const dist = Math.abs(y - w.altitudeCenter);
    if (dist < curWidth) {
      const t = dist / curWidth;
      wind += curStrength * (1 - t * t);
    }
  }
  return wind;
}

/** Get current wind layer params for rendering (time-evolved). */
function getWindLayerParams(w: WindLayer, idx: number, time: number) {
  const phase = idx * 2.17;
  const widthMod = 1 + 0.3 * Math.sin(time * 0.08 + phase);
  const strengthMod = 1 + 0.25 * Math.sin(time * 0.06 + phase + 1.3)
                        + 0.1 * Math.sin(time * 0.15 + phase * 0.7);
  return {
    altitudeCenter: w.altitudeCenter,
    altitudeWidth: w.altitudeWidth * widthMod,
    strength: w.strength * strengthMod,
  };
}

/** Get turbulence torque (random rotational force, rad/s²). */
function getTurbulenceTorque(
  x: number, y: number, time: number, level: ApproachLevel,
): number {
  let torque = 0;
  for (const z of level.turbulence) {
    if (y >= z.altitudeMin && y <= z.altitudeMax) {
      const edgeDist = Math.min(y - z.altitudeMin, z.altitudeMax - y);
      const edgeFade = clamp(edgeDist / 500, 0, 1);
      const hash = Math.sin(x * 0.001 + y * 0.0013 + time * 3.7) *
                   Math.cos(x * 0.0007 + time * 5.3) +
                   Math.sin(y * 0.0008 + time * 4.9) * 0.5;
      torque += hash * z.strength * edgeFade;
    }
  }
  return torque;
}

/** Check if currently in turbulence zone. */
function inTurbulence(y: number, level: ApproachLevel): boolean {
  for (const z of level.turbulence) {
    if (y >= z.altitudeMin && y <= z.altitudeMax) return true;
  }
  return false;
}

/** Compute aero accelerations and heat rate for a given state snapshot. */
function aeroForces(
  x: number, y: number, vx: number, vy: number,
  angle: number, heatShield: boolean, wingAngle: number,
  level: ApproachLevel,
): { ax: number; ay: number; heatRate: number; aoa: number } {
  const speed = Math.sqrt(vx * vx + vy * vy);
  const rho = density(y, level);
  let ax = 0, ay = 0, heatRate = 0, aoa = 0;

  if (speed < 1 || rho < 1e-7) return { ax, ay, heatRate, aoa };

  // AoA: angle between velocity and ship nose
  const velAngle = Math.atan2(vx, vy);
  aoa = velAngle - angle;
  while (aoa > Math.PI) aoa -= 2 * Math.PI;
  while (aoa < -Math.PI) aoa += 2 * Math.PI;

  // Body drag from cross-section: nose-first = min, broadside = max
  const sinA = Math.sin(aoa);
  const cosA = Math.cos(aoa);
  let Cd = level.dragNose * cosA * cosA + level.dragBroadside * sinA * sinA;

  // Heat shield override
  if (heatShield) Cd = Math.max(Cd, level.dragShield);

  // Wing drag (additive)
  Cd += wingAngle * level.dragWingPerRad;

  const q = 0.5 * rho * speed * speed;

  // Drag
  const dragA = q * Cd;
  ax -= (vx / speed) * dragA;
  ay -= (vy / speed) * dragA;

  // Lift: body (always) + wings (when deployed)
  const Cl = level.liftBody + wingAngle * level.liftWingPerRad;
  if (Cl > 0.00001) {
    const aoaEff = Math.abs(Math.sin(aoa) * Math.cos(aoa));
    const liftA = q * Cl * aoaEff;

    // Lift direction: component of nose perpendicular to velocity
    const noseX = Math.sin(angle);
    const noseY = Math.cos(angle);
    const vdx = vx / speed, vdy = vy / speed;
    const dot = noseX * vdx + noseY * vdy;
    let px = noseX - dot * vdx;
    let py = noseY - dot * vdy;
    const pl = Math.sqrt(px * px + py * py);
    if (pl > 0.001) {
      px /= pl; py /= pl;
      ax += px * liftA;
      ay += py * liftA;
    }
  }

  // Heat proportional to drag * speed (more drag = more friction heating)
  heatRate = dragA * speed * level.heatCoeff;

  return { ax, ay, heatRate, aoa };
}

export function updateApproach(
  s: ApproachState, input: InputState, level: ApproachLevel, dt: number, time: number,
): void {
  if (!s.alive || s.gateReached) return;

  // --- Deployables (mutually exclusive) ---
  if (input.toggleHeatShield) {
    if (s.heatShield) { s.heatShield = false; }
    else { s.heatShield = true; s.wingsDeployed = false; }
  }
  // G: toggle wings (deploy at min angle)
  if (input.toggleWings && !s.wingsDeployed) {
    s.wingsDeployed = true;
    s.wingAngle = MIN_WING_ANGLE;
    s.heatShield = false;
  }
  // Wing angle (Q/E)
  if (s.wingsDeployed) {
    if (input.wingAngleUp) {
      s.wingAngle = clamp(s.wingAngle + level.wingAngleRate * dt, MIN_WING_ANGLE, level.maxWingAngle);
    }
    if (input.wingAngleDown) {
      // Fold toward min; when at min and still holding Q, accumulate fold timer
      s.wingAngle = clamp(s.wingAngle - level.wingAngleRate * dt, MIN_WING_ANGLE, level.maxWingAngle);
    }
  }
  // Q held at min angle for 0.5s → retract wings
  if (s.wingsDeployed && input.wingAngleDown && s.wingAngle <= MIN_WING_ANGLE + 0.001) {
    s._foldTimer = (s._foldTimer ?? 0) + dt;
    if (s._foldTimer >= 0.5) { s.wingsDeployed = false; s._foldTimer = 0; }
  } else {
    s._foldTimer = 0;
  }
  // E held when wings retracted for 0.5s → deploy
  if (!s.wingsDeployed && !s.heatShield && input.wingAngleUp) {
    s._deployTimer = (s._deployTimer ?? 0) + dt;
    if (s._deployTimer >= 0.5) {
      s.wingsDeployed = true;
      s.wingAngle = MIN_WING_ANGLE;
      s._deployTimer = 0;
    }
  } else {
    s._deployTimer = 0;
  }
  // Force fold wings if too hot (same speed as Q)
  if (s.temperature > level.wingsMaxTemp && s.wingsDeployed) {
    s.wingAngle = clamp(s.wingAngle - level.wingAngleRate * dt, MIN_WING_ANGLE, level.maxWingAngle);
    if (s.wingAngle <= MIN_WING_ANGLE + 0.001) {
      s.wingsDeployed = false;
    }
  }

  // --- Throttle ---
  const canBurn = s.fuel > 0;
  if (input.throttleUp && canBurn) {
    s.throttle = clamp(s.throttle + 2.5 * dt, 0, 1);
  } else if (!input.throttleDown) {
    s.throttle = clamp(s.throttle - 3.0 * dt, 0, 1);
  }

  // --- Rotation (RCS) ---
  let angAccel = 0;
  if (Math.abs(input.pitch) > 0.01) angAccel += input.pitch * config.rcsAngularAccel;
  angAccel -= s.angularVel * config.angularDrag;

  // --- Forces ---
  const effectiveWing = s.wingsDeployed ? s.wingAngle : 0;
  const { ax: aeroAx, ay: aeroAy, heatRate, aoa } = aeroForces(
    s.x, s.y, s.vx, s.vy, s.angle, s.heatShield, effectiveWing, level,
  );
  let ax = aeroAx;
  let ay = -level.gravity + aeroAy;

  // Wind layers (horizontal force)
  ax += getWind(s.y, level, time);

  // Turbulence (rotational — bumps the ship's attitude)
  angAccel += getTurbulenceTorque(s.x, s.y, time, level);

  // Engine thrust (W = forward along ship nose)
  if (s.throttle > 0.01 && canBurn) {
    const t = s.throttle * level.thrustAccel;
    ax += Math.sin(s.angle) * t;
    ay += Math.cos(s.angle) * t;
    s.fuel -= s.throttle * dt;
    if (s.fuel < 0) s.fuel = 0;
  }

  // Retro thrust (S = reverse along ship nose, equal power)
  const spd = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  s.retroFiring = false;
  if (input.throttleDown && canBurn) {
    const t = level.thrustAccel;
    ax -= Math.sin(s.angle) * t;
    ay -= Math.cos(s.angle) * t;
    s.fuel -= dt;
    if (s.fuel < 0) s.fuel = 0;
    s.retroFiring = true;
  }



  // --- Heat ---
  const hm = s.heatShield ? level.shieldHeatMult : 1.0;
  s.temperature += (heatRate * hm - level.dissipation * s.temperature) * dt;
  s.temperature = clamp(s.temperature, 0, 1.5);
  if (s.temperature >= 1.0) { s.alive = false; return; }

  // --- Integrate ---
  s.angularVel += angAccel * dt;
  s.angle += s.angularVel * dt;
  while (s.angle > Math.PI) s.angle -= 2 * Math.PI;
  while (s.angle < -Math.PI) s.angle += 2 * Math.PI;

  s.vx += ax * dt;
  s.vy += ay * dt;
  s.x += s.vx * dt;
  s.y += s.vy * dt;

  // --- Bounds ---
  if (s.y <= getApproachTerrainHeight(s.x)) { s.alive = false; return; }

  // --- Gate (rectangular: gateX ± gateRadius, 0 to gateY) ---
  const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  const inGateX = s.x >= level.gateX - level.gateRadius && s.x <= level.gateX + level.gateRadius;
  const terrainAtGate = getApproachTerrainHeight(s.x);
  const inGateY = s.y >= terrainAtGate && s.y <= level.gateY + terrainAtGate;
  if (inGateX && inGateY && speed <= level.gateMaxSpeed && speed >= level.gateMinSpeed) {
    s.gateReached = true;
    s.gateSpeed = speed;
  }
}

// ===================== Trajectory Prediction =====================

export function predictTrajectory(
  s: ApproachState, level: ApproachLevel,
  predTime: number = 0, maxTime = 180, step = 0.4,
): TrajectoryResult {
  const points: TrajectoryPoint[] = [];
  let impactX: number | null = null;
  let reachedGate = false;
  let overheatIdx = -1;
  let wingFoldIdx = -1;
  let x = s.x, y = s.y, vx = s.vx, vy = s.vy;
  let temp = s.temperature;
  const angle = s.angle;
  const shield = s.heatShield;
  const wing = s.wingsDeployed ? s.wingAngle : 0;
  let dead = false;
  let prevTooHot = temp >= level.wingsMaxTemp;

  for (let t = 0; t < maxTime; t += step) {
    const { ax: aax, ay: aay, heatRate } = aeroForces(x, y, vx, vy, angle, shield, wing, level);
    let ax = aax + getWind(y, level, predTime);  // wind in prediction (current time snapshot)
    const ay = -level.gravity + aay;   // no turbulence in prediction (unpredictable)

    const hm = shield ? level.shieldHeatMult : 1.0;
    temp += (heatRate * hm - level.dissipation * temp) * step;
    // Track where wings become unusable (too hot) or usable again (cooled down)
    const tooHotForWings = temp >= level.wingsMaxTemp;
    if (wingFoldIdx < 0) {
      // If we start cool, mark where it gets too hot
      // If we start hot, mark where it cools enough for wings
      if (points.length === 0) {
        // first point — set initial state
      } else if (!prevTooHot && tooHotForWings) {
        wingFoldIdx = points.length; // just became too hot
      } else if (prevTooHot && !tooHotForWings) {
        wingFoldIdx = points.length; // just became cool enough
      }
    }
    prevTooHot = tooHotForWings;
    if (temp >= 1.0 && overheatIdx < 0) overheatIdx = points.length;
    if (temp >= 1.0) dead = true;
    temp = clamp(temp, 0, 1.5);

    vx += ax * step;
    vy += ay * step;
    x += vx * step;
    y += vy * step;

    points.push({ x, y, temp: clamp(temp, 0, 1), burnedUp: dead });

    if (!dead && !reachedGate) {
      const inGX = x >= level.gateX - level.gateRadius && x <= level.gateX + level.gateRadius;
      const tAtGate = getApproachTerrainHeight(x);
      const inGY = y >= tAtGate && y <= level.gateY + tAtGate;
      if (inGX && inGY) { reachedGate = true; }
    }
    if (y <= getApproachTerrainHeight(x)) { impactX = x; break; }
  }
  return { points, impactX, reachedGate, overheatIdx, wingFoldIdx };
}

// ===================== Camera =====================

export interface ApproachCamera {
  x: number; y: number; zoom: number;
}

export function createApproachCamera(level: ApproachLevel): ApproachCamera {
  return { x: level.startX, y: level.startY, zoom: 0.015 };
}

export function updateApproachCamera(
  cam: ApproachCamera, s: ApproachState, level: ApproachLevel,
  dt: number, W: number, H: number,
): void {
  const smooth = 1 - Math.exp(-2.0 * dt);

  // --- Compute desired zoom ---
  const baseZoom = 0.04;
  const maxZoom = baseZoom * 2;    // can zoom in 2x when close
  const minZoom = baseZoom * 0.2;  // can zoom out 5x when far

  // Fit both ship and gate horizontally in ~80% of screen
  const hDist = Math.abs(level.gateX - s.x) + level.gateRadius;
  const zoomForH = (W * 0.8) / Math.max(hDist, 100);

  // Fit both ship and ground+gate vertically in ~80% of screen
  const vDist = Math.max(s.y, level.gateY) + 500;
  const zoomForV = (H * 0.8) / Math.max(vDist, 100);

  const targetZoom = clamp(Math.min(zoomForH, zoomForV), minZoom, maxZoom);
  cam.zoom += (targetZoom - cam.zoom) * smooth;

  const z = cam.zoom;
  const viewW = W / z;
  const viewH = H / z;

  // --- Camera center: ship in middle, then adjust ---
  let cx = s.x;
  let cy = s.y;

  // Horizontal: pan toward gate until gate is at least 10% from edge,
  // but don't push ship past 10% from the opposite edge.
  const gateX = level.gateX;
  // Gate at 90% from ship side: gate needs to be at screen frac 0.9 (or 0.1)
  // gateWorldX = cx + viewW * (frac - 0.5)
  // To put gate at 90%: cx = gateX - viewW * 0.4
  // To put gate at 10%: cx = gateX + viewW * 0.4
  if (gateX > s.x) {
    // Gate to the right: pan right
    const gateCx = gateX - viewW * 0.4; // gate at 90% from left
    const shipLimitCx = s.x + viewW * 0.4; // ship at 10% from left
    cx = Math.min(gateCx, shipLimitCx);
    cx = Math.max(cx, s.x); // don't pan away from gate
  } else {
    // Gate to the left: pan left
    const gateCx = gateX + viewW * 0.4; // gate at 10% from left
    const shipLimitCx = s.x - viewW * 0.4; // ship at 90% from left
    cx = Math.max(gateCx, shipLimitCx);
    cx = Math.min(cx, s.x); // don't pan away from gate
  }

  // Vertical: pan down to show ground at bottom 10%.
  // Ground height below ship (approximate)
  const groundH = getApproachTerrainHeight(s.x);
  // Ground at 90% from top: world y at 90% = cy - 0.4*viewH = groundH
  const groundCy = groundH + 0.4 * viewH;
  // Ship at 10% from top: cy = ship.y - 0.4 * viewH
  const shipTopCy = s.y - 0.4 * viewH;
  // Start at ship center, only pan down, clamped
  cy = Math.max(shipTopCy, Math.min(s.y, groundCy));

  // Smooth follow
  cam.x += (cx - cam.x) * smooth;
  cam.y += (cy - cam.y) * smooth;
}

// ===================== Rendering =====================

const COL_GATE = '#00ffcc';
const COL_GATE_DIM = '#007766';
const COL_GROUND = '#224422';

function ws(wx: number, wy: number, cam: ApproachCamera, W: number, H: number): [number, number] {
  return [
    (wx - cam.x) * cam.zoom + W / 2,
    -(wy - cam.y) * cam.zoom + H / 2,
  ];
}

// ===================== Approach Terrain (Perlin noise) =====================

// Simple 1D value noise with smooth interpolation
function noiseHash(n: number): number {
  // Deterministic pseudo-random from integer
  let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function smoothNoise(x: number): number {
  const ix = Math.floor(x);
  const fx = x - ix;
  // Smoothstep
  const t = fx * fx * (3 - 2 * fx);
  return noiseHash(ix) * (1 - t) + noiseHash(ix + 1) * t;
}

function perlin1D(x: number, freq: number, seed: number): number {
  return smoothNoise(x * freq + seed) * 2 - 1; // -1 to 1
}

/** Get approach terrain height at world x. Two octaves of Perlin noise. */
function getApproachTerrainHeight(x: number): number {
  // Large rolling hills
  const h1 = perlin1D(x, 0.00008, 42.0) * 1200;
  // Medium detail
  const h2 = perlin1D(x, 0.0003, 97.0) * 400;
  return Math.max(0, h1 + h2 + 300); // offset so average is ~300m, min 0
}

function tempColor(t: number): string {
  if (t < 0.25) return '#00ff88';
  if (t < 0.50) return '#aaff00';
  if (t < 0.70) return '#ffaa00';
  if (t < 0.85) return '#ff6600';
  return '#ff2200';
}

export function renderApproach(
  ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement,
  cam: ApproachCamera, s: ApproachState, level: ApproachLevel, time: number,
): void {
  const W = canvas.width, H = canvas.height;

  // --- Background: atmosphere gradient ---
  drawAtmoBackground(ctx, cam, W, H, level);

  // --- Terrain (Perlin noise ground) ---
  drawApproachTerrain(ctx, cam, W, H);


  // --- Wind layers ---
  drawWindLayers(ctx, cam, level, W, H, time);

  // --- Trajectory preview ---
  drawTrajectory(ctx, cam, s, level, W, H, time);

  // --- Gate ---
  drawGate(ctx, cam, s, level, W, H);

  // --- Ship ---
  drawApproachShip(ctx, cam, s, level, W, H, time);
}

function drawAtmoBackground(
  ctx: CanvasRenderingContext2D, cam: ApproachCamera,
  W: number, H: number, level: ApproachLevel,
): void {
  // Sample altitude at top and bottom of screen
  const topY = cam.y + H / (2 * cam.zoom);
  const botY = cam.y - H / (2 * cam.zoom);

  // Draw bands
  const bands = 30;
  for (let i = 0; i < bands; i++) {
    const frac = i / bands;
    const alt = topY + (botY - topY) * frac;
    const rho = density(Math.max(0, alt), level);

    // Space is dark, atmosphere adds blue then orange near ground
    const atmoFrac = Math.min(1, rho / (level.surfaceDensity * 0.3));
    const r = Math.floor(5 + atmoFrac * 15);
    const g = Math.floor(5 + atmoFrac * 20);
    const b = Math.floor(16 + atmoFrac * 40);
    ctx.fillStyle = `rgb(${r},${g},${b})`;

    const sy = (frac * H);
    const sh = H / bands + 1;
    ctx.fillRect(0, sy, W, sh);
  }
}

function drawApproachTerrain(
  ctx: CanvasRenderingContext2D, cam: ApproachCamera, W: number, H: number,
): void {
  // Check if ground could be visible (conservative: highest terrain ~1500m)
  const screenBottomWorldY = cam.y - H / (2 * cam.zoom);
  if (screenBottomWorldY > 2000) return; // too high, no terrain visible

  // One sample every ~4 screen pixels
  const pixelsPerSample = 4;
  const numSamples = Math.ceil(W / pixelsPerSample) + 2;
  const worldPerPixel = 1 / cam.zoom;
  const worldStep = pixelsPerSample * worldPerPixel;
  const viewLeft = cam.x - W / (2 * cam.zoom);
  const startWorldX = viewLeft - worldStep;

  // Build terrain points
  ctx.beginPath();
  let firstSx = 0, firstSy = 0;
  for (let i = 0; i <= numSamples; i++) {
    const wx = startWorldX + i * worldStep;
    const wy = getApproachTerrainHeight(wx);
    const [sx, sy] = ws(wx, wy, cam, W, H);
    if (i === 0) { ctx.moveTo(sx, sy); firstSx = sx; }
    else ctx.lineTo(sx, sy);
  }
  // Close at bottom of screen
  const lastSx = firstSx + numSamples * pixelsPerSample;
  ctx.lineTo(lastSx + 10, H + 10);
  ctx.lineTo(firstSx - 10, H + 10);
  ctx.closePath();
  ctx.fillStyle = '#060c06';
  ctx.fill();

  // Outline
  ctx.beginPath();
  for (let i = 0; i <= numSamples; i++) {
    const wx = startWorldX + i * worldStep;
    const wy = getApproachTerrainHeight(wx);
    const [sx, sy] = ws(wx, wy, cam, W, H);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = COL_GROUND;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawWindLayers(
  ctx: CanvasRenderingContext2D, cam: ApproachCamera,
  level: ApproachLevel, W: number, H: number, time: number,
): void {
  for (let i = 0; i < level.windLayers.length; i++) {
    const w = getWindLayerParams(level.windLayers[i], i, time);
    const topAlt = w.altitudeCenter + w.altitudeWidth;
    const botAlt = w.altitudeCenter - w.altitudeWidth;
    const [, syTop] = ws(0, topAlt, cam, W, H);
    const [, syBot] = ws(0, botAlt, cam, W, H);

    // Skip if off screen
    if (syTop > H + 10 || syBot < -10) continue;

    const bandH = syBot - syTop;
    if (bandH < 1) continue;

    // Color: blue-ish for headwind (negative), orange-ish for tailwind (positive)
    const isHead = w.strength < 0;
    const alpha = clamp(Math.abs(w.strength) / 15, 0.02, 0.07);
    ctx.fillStyle = isHead
      ? `rgba(60, 100, 200, ${alpha})`
      : `rgba(200, 150, 60, ${alpha})`;
    ctx.fillRect(0, syTop, W, bandH);

    // Arrow indicators showing wind direction
    const arrowSpacing = 120;
    const arrowSize = Math.min(12, bandH * 0.3);
    const syMid = (syTop + syBot) / 2;
    ctx.strokeStyle = isHead
      ? `rgba(80, 140, 255, ${alpha * 3})`
      : `rgba(255, 200, 80, ${alpha * 3})`;
    ctx.lineWidth = 1.5;

    for (let sx = arrowSpacing / 2; sx < W; sx += arrowSpacing) {
      const dir = w.strength > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(sx - dir * arrowSize, syMid - arrowSize * 0.4);
      ctx.lineTo(sx + dir * arrowSize, syMid);
      ctx.lineTo(sx - dir * arrowSize, syMid + arrowSize * 0.4);
      ctx.stroke();
    }

    // Label at left edge
    const [, syLabel] = ws(0, w.altitudeCenter, cam, W, H);
    if (syLabel > 10 && syLabel < H - 10) {
      ctx.font = '10px monospace';
      ctx.fillStyle = isHead ? 'rgba(80, 140, 255, 0.6)' : 'rgba(255, 200, 80, 0.6)';
      ctx.textAlign = 'left';
      const label = isHead ? `← ${Math.abs(w.strength).toFixed(0)} m/s²` : `→ ${w.strength.toFixed(0)} m/s²`;
      ctx.fillText(label, 8, syLabel + 3);
    }
  }
}

function drawTrajectory(
  ctx: CanvasRenderingContext2D, cam: ApproachCamera,
  s: ApproachState, level: ApproachLevel, W: number, H: number, time: number,
): void {
  const result = predictTrajectory(s, level, time);
  const pts = result.points;
  if (pts.length < 2) return;

  ctx.lineWidth = 2;
  const dashLen = 8;
  let dashOn = true;
  let dashAccum = 0;

  for (let i = 1; i < pts.length; i++) {
    const [sx0, sy0] = ws(pts[i - 1].x, pts[i - 1].y, cam, W, H);
    const [sx1, sy1] = ws(pts[i].x, pts[i].y, cam, W, H);

    if ((sx0 < -200 && sx1 < -200) || (sx0 > W + 200 && sx1 > W + 200)) continue;
    if ((sy0 < -200 && sy1 < -200) || (sy0 > H + 200 && sy1 > H + 200)) continue;

    const segLen = Math.sqrt((sx1 - sx0) ** 2 + (sy1 - sy0) ** 2);
    dashAccum += segLen;
    if (dashAccum > dashLen) {
      dashOn = !dashOn;
      dashAccum -= dashLen;
    }

    if (dashOn) {
      ctx.strokeStyle = pts[i].burnedUp ? '#ff2200' : tempColor(pts[i].temp);
      ctx.globalAlpha = pts[i].burnedUp ? 0.4 : 0.7;
      ctx.beginPath();
      ctx.moveTo(sx0, sy0);
      ctx.lineTo(sx1, sy1);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Impact point marker + distance indicator (always visible)
  const last = pts[pts.length - 1];
  if (last) {
    const [lsx, lsy] = ws(last.x, Math.max(last.y, 0), cam, W, H);
    const endX = result.impactX ?? last.x;
    const diff = endX - level.gateX;
    const onTarget = Math.abs(diff) < level.gateRadius;

    // X marker at impact (if on screen)
    if (lsx > -50 && lsx < W + 50 && lsy > -50 && lsy < H + 50) {
      if (onTarget) {
        ctx.beginPath();
        ctx.arc(lsx, lsy, 7, 0, Math.PI * 2);
        ctx.strokeStyle = COL_GATE;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#ff2200';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lsx - 6, lsy - 6); ctx.lineTo(lsx + 6, lsy + 6);
        ctx.moveTo(lsx + 6, lsy - 6); ctx.lineTo(lsx - 6, lsy + 6);
        ctx.stroke();
      }
    }

    // Distance label: always on screen
    const distKm = Math.abs(diff) / 1000;
    const tag = onTarget ? 'ON TARGET'
      : diff < 0 ? `${distKm.toFixed(1)}km short`
      : `${distKm.toFixed(1)}km long`;
    const tagCol = onTarget ? '#00ffcc' : '#ff6644';
    const labelX = clamp(lsx, 60, W - 60);
    const labelY = clamp(lsy - 14, 50, H - 20);
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = tagCol;
    ctx.textAlign = 'center';
    ctx.fillText(tag, labelX, labelY);
  }

  // --- Trajectory markers ---

  // Wing marker: shows where wings transition (too hot or cool enough)
  // Don't draw if overheat comes first (or at same point)
  if (result.wingFoldIdx >= 0 && result.wingFoldIdx < pts.length &&
      (result.overheatIdx < 0 || result.wingFoldIdx < result.overheatIdx)) {
    const p = pts[result.wingFoldIdx];
    const [mx, my] = ws(p.x, p.y, cam, W, H);
    if (mx > -50 && mx < W + 50 && my > -50 && my < H + 50) {
      // Wings icon: two lines showing fold/unfold
      const isCooling = p.temp < level.wingsMaxTemp;
      if (isCooling) {
        // Wings opening: lines spreading outward
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mx - 3, my + 2); ctx.lineTo(mx - 9, my - 3);
        ctx.moveTo(mx + 3, my + 2); ctx.lineTo(mx + 9, my - 3);
        ctx.stroke();
      } else {
        // Wings folding: lines closing inward
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mx - 8, my - 2); ctx.lineTo(mx - 3, my + 4);
        ctx.moveTo(mx + 8, my - 2); ctx.lineTo(mx + 3, my + 4);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(mx, my + 1, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#00ccff';
      ctx.fill();
    }
  }

  // Overheat marker (red X)
  if (result.overheatIdx >= 0 && result.overheatIdx < pts.length) {
    const p = pts[result.overheatIdx];
    const [mx, my] = ws(p.x, p.y, cam, W, H);
    if (mx > -50 && mx < W + 50 && my > -50 && my < H + 50) {
      ctx.strokeStyle = '#ff2200';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mx - 7, my - 7); ctx.lineTo(mx + 7, my + 7);
      ctx.moveTo(mx + 7, my - 7); ctx.lineTo(mx - 7, my + 7);
      ctx.stroke();
    }
  }
}

function drawGate(
  ctx: CanvasRenderingContext2D, cam: ApproachCamera,
  s: ApproachState, level: ApproachLevel, W: number, H: number,
): void {
  // Gate rectangle sits on terrain
  const terrainAtGate = getApproachTerrainHeight(level.gateX);
  const [leftX, topY] = ws(level.gateX - level.gateRadius, level.gateY + terrainAtGate, cam, W, H);
  const [rightX, botY] = ws(level.gateX + level.gateRadius, terrainAtGate, cam, W, H);
  const [centerX] = ws(level.gateX, (level.gateY + terrainAtGate * 2) * 0.5, cam, W, H);
  const rectW = rightX - leftX;
  const rectH = botY - topY;

  const onScreen = rightX > 0 && leftX < W && botY > 0 && topY < H;

  if (onScreen && Math.abs(rectW) > 2) {
    const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
    const speedOk = speed <= level.gateMaxSpeed && speed >= level.gateMinSpeed;
    const col = speedOk ? COL_GATE : COL_GATE_DIM;

    // Rectangle outline
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(leftX, topY, rectW, rectH);
    ctx.setLineDash([]);

    // Speed label at top
    ctx.font = '11px monospace';
    ctx.fillStyle = COL_GATE_DIM;
    ctx.textAlign = 'center';
    ctx.fillText(`${level.gateMinSpeed}-${level.gateMaxSpeed} m/s`, centerX, topY - 6);
  }

  // Off-screen indicator
  if (!onScreen) {
    const [gcx, gcy] = ws(level.gateX, level.gateY * 0.5, cam, W, H);
    const margin = 40;
    const cx = clamp(gcx, margin, W - margin);
    const cy = clamp(gcy, margin, H - margin);
    const dx = gcx - cx, dy = gcy - cy;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) {
      const nx = dx / len, ny = dy / len;
      const as = 10;
      ctx.beginPath();
      ctx.moveTo(cx + nx * as, cy + ny * as);
      ctx.lineTo(cx - nx * 4 - ny * as * 0.5, cy - ny * 4 + nx * as * 0.5);
      ctx.lineTo(cx - nx * 4 + ny * as * 0.5, cy - ny * 4 - nx * as * 0.5);
      ctx.closePath();
      ctx.fillStyle = COL_GATE;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    const dist = Math.sqrt((s.x - level.gateX) ** 2 + (s.y - level.gateY * 0.5) ** 2);
    ctx.font = '11px monospace';
    ctx.fillStyle = COL_GATE;
    ctx.textAlign = 'center';
    ctx.fillText(`TGT ${(dist / 1000).toFixed(1)}km`, cx, cy - 14);
  }
}

function drawApproachShip(
  ctx: CanvasRenderingContext2D, cam: ApproachCamera,
  s: ApproachState, level: ApproachLevel, W: number, H: number, time: number,
): void {
  const [sx, sy] = ws(s.x, s.y, cam, W, H);
  const size = 14;

  // --- Plasma teardrop (proportional to heat GENERATED, scales with zoom) ---
  const spd = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  const rho = density(s.y, level);
  // Use same drag-based heat formula as physics
  const sinA = Math.sin(Math.atan2(s.vx, s.vy) - s.angle);
  const cosA = Math.cos(Math.atan2(s.vx, s.vy) - s.angle);
  const bodyCd = level.dragNose * cosA * cosA + level.dragBroadside * sinA * sinA;
  const effectiveWing = s.wingsDeployed ? s.wingAngle : 0;
  const totalCd = bodyCd + effectiveWing * level.dragWingPerRad;
  const dragAccel = 0.5 * rho * spd * spd * totalCd;
  const actualHeatRate = dragAccel * spd * level.heatCoeff;
  // Normalize: 0.1/s heat rate = full plasma intensity
  const plasmaIntensity = clamp(actualHeatRate / 0.1, 0, 1);
  if (plasmaIntensity > 0.02) {
    const intensity = plasmaIntensity;
    const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
    const velAngle = speed > 10 ? Math.atan2(s.vx, s.vy) : s.angle;
    const flicker = 0.85 + 0.15 * Math.sin(time * 30);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(velAngle);

    // Ship-scale: proportional to the ship icon size and intensity
    const frontR = size * (0.4 + intensity * 0.8) * flicker;
    const tailLen = size * (1.5 + intensity * 5) * flicker;
    const bw = frontR * 0.7;

    // Teardrop path
    ctx.beginPath();
    ctx.moveTo(0, tailLen);
    ctx.quadraticCurveTo(-bw * 1.3, tailLen * 0.25, -bw, -frontR * 0.2);
    ctx.arc(0, -frontR * 0.2, frontR, Math.PI, 0, false);
    ctx.quadraticCurveTo(bw * 1.3, tailLen * 0.25, 0, tailLen);

    const grad = ctx.createLinearGradient(0, -frontR, 0, tailLen);
    const rr = 255, gg = Math.floor(180 * intensity);
    grad.addColorStop(0, `rgba(${rr}, ${gg}, 40, ${0.55 * intensity})`);
    grad.addColorStop(0.35, `rgba(${rr}, ${Math.floor(gg * 0.5)}, 0, ${0.3 * intensity})`);
    grad.addColorStop(1, 'rgba(180, 40, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Bright core at nose
    ctx.beginPath();
    ctx.arc(0, -frontR * 0.2, frontR * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 180, ${0.35 * intensity * flicker})`;
    ctx.fill();

    ctx.restore();
  }

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(s.angle);

  // --- Body triangle ---
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.5, size * 0.5);
  ctx.lineTo(-size * 0.5, size * 0.5);
  ctx.closePath();
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // --- Heat shield: orange fill on the front half of the ship ---
  if (s.heatShield) {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.5, size * 0.5);
    ctx.lineTo(-size * 0.5, size * 0.5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 136, 0, 0.5)';
    ctx.fill();
    // Bright edge on the nose half
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, size * 0.5);
    ctx.lineTo(0, -size);
    ctx.lineTo(size * 0.5, size * 0.5);
    ctx.strokeStyle = '#ffaa33';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // --- Wings (min angle = swept back/streamlined, max = perpendicular) ---
  if (s.wingsDeployed) {
    // Normalize: 0 = fully swept, 1 = fully perpendicular
    const t = (s.wingAngle - MIN_WING_ANGLE) / (level.maxWingAngle - MIN_WING_ANGLE);
    const wingSpan = size * (0.5 + t * 0.7);  // longer at max
    // Sweep: at min angle wings point backward (+y), at max they're perpendicular (0)
    const sweepY = (1 - t) * size * 0.6;
    ctx.beginPath();
    ctx.moveTo(-size * 0.25, size * 0.05);
    ctx.lineTo(-wingSpan, size * 0.05 + sweepY);
    ctx.moveTo(size * 0.25, size * 0.05);
    ctx.lineTo(wingSpan, size * 0.05 + sweepY);
    ctx.strokeStyle = '#00ccff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // --- Main thrust flame (from bottom) ---
  if (s.throttle > 0.05 && s.fuel > 0) {
    const flicker = 0.7 + 0.3 * Math.sin(time * 40);
    const fl = (3 + s.throttle * 10) * flicker;
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, size * 0.5);
    ctx.lineTo(0, size * 0.5 + fl);
    ctx.lineTo(size * 0.2, size * 0.5);
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // --- Retro thrust flame (from nose) ---
  if (s.retroFiring) {
    const flicker = 0.7 + 0.3 * Math.sin(time * 45);
    const fl = (3 + 10) * flicker;
    ctx.beginPath();
    ctx.moveTo(-size * 0.15, -size);
    ctx.lineTo(0, -size - fl);
    ctx.lineTo(size * 0.15, -size);
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inner core
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(0, -size - fl * 0.5);
    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

// ===================== HUD =====================

const COL_HUD = '#00ff88';
const COL_HUD_DIM = '#007744';
const COL_WARN = '#ffaa00';
const COL_DANGER = '#ff3333';
const COL_OK = '#00ffcc';

export function drawApproachHUD(
  ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement,
  s: ApproachState, level: ApproachLevel,
  state: 'approaching' | 'approachSuccess' | 'approachFailed',
  time: number,
): void {
  const W = canvas.width, H = canvas.height;
  const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  const altKm = (s.y / 1000);
  const distGate = Math.sqrt((s.x - level.gateX) ** 2 + (s.y - level.gateY) ** 2);

  ctx.save();
  const lx = 20;
  let ly = 30;
  const lh = 20;

  ctx.font = '14px "Courier New", monospace';
  ctx.textAlign = 'left';

  // Level name (top right)
  ctx.font = '13px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.fillText(`${level.name}  [g=${level.gravity.toFixed(1)}]`, W - 20, 24);
  ctx.textAlign = 'left';
  ctx.font = '14px "Courier New", monospace';

  // Altitude
  label(ctx, lx, ly, 'ALT', `${altKm.toFixed(1)} km`, COL_HUD); ly += lh;

  // Speed
  const spdCol = speed > level.gateMaxSpeed ? COL_WARN : speed < level.gateMinSpeed ? COL_HUD_DIM : COL_OK;
  label(ctx, lx, ly, 'SPD', `${speed.toFixed(0)} m/s`, spdCol); ly += lh;

  // V/Speed
  label(ctx, lx, ly, 'V/S', `${s.vy.toFixed(0)} m/s`, COL_HUD); ly += lh;

  // AoA
  const velAngle = Math.atan2(s.vx, s.vy);
  let aoa = velAngle - s.angle;
  while (aoa > Math.PI) aoa -= 2 * Math.PI;
  while (aoa < -Math.PI) aoa += 2 * Math.PI;
  label(ctx, lx, ly, 'AoA', `${(aoa * 180 / Math.PI).toFixed(1)}°`, COL_HUD); ly += lh;

  // Config
  let cfgStr = 'CLEAN';
  let cfgCol = COL_HUD;
  if (s.heatShield) { cfgStr = 'SHIELD'; cfgCol = '#ff8800'; }
  else if (s.wingsDeployed) { cfgStr = `WINGS ${(s.wingAngle * 180 / Math.PI).toFixed(0)}°`; cfgCol = '#00ccff'; }
  label(ctx, lx, ly, 'CFG', cfgStr, cfgCol); ly += lh;

  // Atmosphere density
  const rho = density(s.y, level);
  const rhoFrac = rho / level.surfaceDensity;
  const rhoCol = rhoFrac > 0.3 ? COL_WARN : rhoFrac > 0.05 ? COL_HUD : COL_HUD_DIM;
  label(ctx, lx, ly, 'ATM', `${(rhoFrac * 100).toFixed(1)}%`, rhoCol); ly += lh;

  // Fuel
  const fuelPct = level.fuelSeconds > 0 ? (s.fuel / level.fuelSeconds * 100) : 0;
  const fuelCol = fuelPct < 20 ? COL_DANGER : fuelPct < 50 ? COL_WARN : COL_HUD;
  label(ctx, lx, ly, 'FUEL', `${fuelPct.toFixed(0)}%`, fuelCol); ly += lh;

  // Gate distance
  label(ctx, lx, ly, 'TGT', `${(distGate / 1000).toFixed(1)} km`, COL_OK); ly += lh;

  // --- Temperature bar (right side) ---
  const barX = W - 45;
  const barY = 50;
  const barW = 20;
  const barH = 150;

  ctx.strokeStyle = COL_HUD_DIM;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  // Fill
  const fillH = barH * Math.min(s.temperature, 1);
  const tCol = tempColor(s.temperature);
  ctx.fillStyle = tCol;
  ctx.fillRect(barX, barY + barH - fillH, barW, fillH);

  // Wings-max-temp tick
  const wmY = barY + barH - barH * level.wingsMaxTemp;
  ctx.strokeStyle = '#00ccff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(barX - 4, wmY);
  ctx.lineTo(barX + barW + 4, wmY);
  ctx.stroke();
  ctx.fillStyle = '#00ccff';
  ctx.font = '9px monospace';
  ctx.fillText('WNG', barX - 30, wmY + 3);

  ctx.fillStyle = COL_HUD_DIM;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TEMP', barX + barW / 2, barY + barH + 14);

  // --- Warnings (center top) ---
  let warnY = 30;
  const now = Date.now();

  // Wings too hot
  if (s.temperature > level.wingsMaxTemp * 0.8 && s.wingsDeployed) {
    if (Math.sin(now * 0.012) > -0.3) {
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = COL_DANGER;
      ctx.fillText('⚠ TOO HOT FOR WINGS', W / 2, warnY);
      warnY += 24;
    }
  }

  // Wind annunciation
  const windAccel = getWind(s.y, level, time);
  if (Math.abs(windAccel) > 1) {
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    const windDir = windAccel > 0 ? '→' : '←';
    const windCol = Math.abs(windAccel) > 8 ? COL_WARN : '#5588cc';
    ctx.fillStyle = windCol;
    ctx.fillText(`WIND ${windDir} ${Math.abs(windAccel).toFixed(0)} m/s²`, W / 2, warnY);
    warnY += 22;
  }

  // Turbulence annunciation
  if (inTurbulence(s.y, level)) {
    if (Math.sin(now * 0.008) > -0.2) {
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = COL_WARN;
      ctx.fillText('⚠ TURBULENCE', W / 2, warnY);
      warnY += 22;
    }
  }

  // --- State overlays ---
  if (state === 'approachSuccess') {
    ctx.fillStyle = 'rgba(0, 20, 0, 0.6)';
    ctx.fillRect(W / 2 - 200, H / 2 - 80, 400, 160);
    ctx.strokeStyle = COL_OK;
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 200, H / 2 - 80, 400, 160);

    ctx.textAlign = 'center';
    ctx.fillStyle = COL_OK;
    ctx.font = 'bold 28px monospace';
    ctx.fillText('TARGET REACHED', W / 2, H / 2 - 40);
    ctx.font = '16px monospace';
    ctx.fillText(`Speed: ${s.gateSpeed.toFixed(0)} m/s`, W / 2, H / 2);
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '14px monospace';
    ctx.fillText('R: Retry  |  L: Levels', W / 2, H / 2 + 50);
  }

  if (state === 'approachFailed') {
    ctx.fillStyle = 'rgba(20, 0, 0, 0.6)';
    ctx.fillRect(W / 2 - 200, H / 2 - 60, 400, 120);
    ctx.strokeStyle = COL_DANGER;
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 200, H / 2 - 60, 400, 120);

    ctx.textAlign = 'center';
    ctx.fillStyle = COL_DANGER;
    ctx.font = 'bold 28px monospace';
    const msg = s.temperature >= 1 ? 'BURNED UP' : 'IMPACT';
    ctx.fillText(msg, W / 2, H / 2 - 15);
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '14px monospace';
    ctx.fillText('R: Retry  |  L: Levels', W / 2, H / 2 + 25);
  }

  // --- Controls hint ---
  if (state === 'approaching') {
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COL_HUD_DIM;
    ctx.fillText('A/D: Pitch  W: Thrust  S: Retro  G: Wings  Q/E: Wing Angle  H: Shield  R: Restart  L: Levels', W / 2, H - 15);
  }

  ctx.restore();
}

function label(ctx: CanvasRenderingContext2D, x: number, y: number, lbl: string, val: string, col: string): void {
  ctx.fillStyle = '#558855';
  ctx.fillText(lbl, x, y);
  ctx.fillStyle = col;
  ctx.fillText(val, x + 50, y);
}
