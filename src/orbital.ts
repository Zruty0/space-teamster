// Orbital phase: 2D Keplerian orbit around a planet with aerobraking.
// Self-contained module: physics, prediction, rendering, HUD.

import { InputState } from './input';

// ===================== Types =====================

export interface OrbitalLevel {
  id: number;
  name: string;
  subtitle: string;

  // Planet
  planetRadius: number;     // meters
  planetGM: number;         // gravitational parameter (m³/s²)
  atmoHeight: number;       // atmosphere thickness above surface (meters)
  atmoColor: [number, number, number]; // RGB for atmosphere tint

  // Time scaling: "1x" display = baseTimeScale × real physics rate
  // This makes orbits visually fast while keeping velocities realistic
  baseTimeScale: number;

  // Starting orbit (state vectors, physics-time velocities)
  startX: number;
  startY: number;
  startVX: number;
  startVY: number;

  // Ship
  thrustAccel: number;      // m/s²
  fuelDeltaV: number;       // total delta-v budget in m/s

  // Atmosphere (for aerobraking)
  surfaceDensity: number;
  scaleHeight: number;
  orbitalDragCoeff: number; // effective Cd*A/m for orbital aerobraking

  // Heat
  heatCoeff: number;        // heat rate = dragAccel * speed * heatCoeff
  heatDissipation: number;  // radiative cooling rate

  // Transition to approach phase
  transitionAltitude: number; // meters above surface — switch to approach when below this

  // Landing site (angle on planet surface, radians from +X axis)
  landingSiteAngle: number;

  // Index into APPROACH_LEVELS for phase transition (0-based)
  approachLevelIdx: number;
}

export interface OrbitalState {
  x: number;         // position relative to planet center
  y: number;
  vx: number;
  vy: number;

  fuel: number;      // remaining delta-v in m/s
  alive: boolean;
  enteredAtmo: boolean;
  temperature: number; // 0..1, for display

  // Trail (ring buffer of recent positions, using wall-clock time)
  trail: { x: number; y: number; t: number }[];
  trailIdx: number;

  // Time
  time: number;        // physics time
  realTime: number;    // wall-clock time (for trail)
  timeWarp: number;    // user-controlled multiplier (displayed)
  timeWarpLevel: number; // index into WARP_SPEEDS

  // Thrust state (for rendering)
  thrusting: 'none' | 'prograde' | 'retrograde' | 'left' | 'right';
  inAtmo: boolean;     // currently inside atmosphere
}

// ===================== Constants =====================

const WARP_SPEEDS = [1, 2, 5, 10, 25, 50, 100];
const TRAIL_MAX = 800;
const TRAIL_DURATION = 12; // wall-clock seconds
const PHYSICS_SUBSTEP = 1 / 120;
const ATMO_WARP_CAP = 5; // max displayed warp when in atmosphere

// ===================== Levels =====================

function gmForPeriod(planetRadius: number, orbitAlt: number, period: number): number {
  const r = planetRadius + orbitAlt;
  return (4 * Math.PI * Math.PI * r * r * r) / (period * period);
}

export const ORBITAL_LEVELS: OrbitalLevel[] = [
  (() => {
    const planetRadius = 600_000;
    const orbitAlt = 200_000;
    const baseTimeScale = 100;
    const wallPeriod = 50;             // seconds on screen for one orbit at "1x"
    const physicsPeriod = wallPeriod * baseTimeScale;
    const gm = gmForPeriod(planetRadius, orbitAlt, physicsPeriod);
    const r = planetRadius + orbitAlt;
    const v = Math.sqrt(gm / r);       // ~1005 m/s

    return {
      id: 7,
      name: "Kepler's Rest Orbit",
      subtitle: 'Deorbit — enter the atmosphere',
      planetRadius,
      planetGM: gm,
      atmoHeight: 80_000,
      atmoColor: [60, 120, 200] as [number, number, number],
      baseTimeScale,
      startX: 0,
      startY: r,
      startVX: v,
      startVY: 0,
      thrustAccel: 0.1,              // ×100 base scale = 10 m/s per wall-sec, deorbit ~5s
      fuelDeltaV: 600,               // escape ~417, generous margin
      surfaceDensity: 1.5,
      scaleHeight: 8000,
      orbitalDragCoeff: 0.0001,      // between nose-first and broadside
      heatCoeff: 1e-5,
      heatDissipation: 0.08,
      transitionAltitude: 25_000,    // hand off to approach at 25km
      landingSiteAngle: -Math.PI / 4,
      approachLevelIdx: 0,  // Kepler's Rest approach
    };
  })(),
];

// ===================== State =====================

export function createOrbitalState(level: OrbitalLevel): OrbitalState {
  _predDirty = true;
  _cachedPred = null;
  return {
    x: level.startX,
    y: level.startY,
    vx: level.startVX,
    vy: level.startVY,
    fuel: level.fuelDeltaV,
    alive: true,
    enteredAtmo: false,
    temperature: 0,
    trail: [],
    trailIdx: 0,
    time: 0,
    realTime: 0,
    timeWarp: 1,
    timeWarpLevel: 0,
    thrusting: 'none',
    inAtmo: false,
  };
}

/** Convert orbital state at transition into approach-phase initial conditions.
 *  gateX: the gate's x position in approach coords (defines the LZ position). */
export function orbitalToApproachParams(
  os: OrbitalState, level: OrbitalLevel, gateX: number,
): { x: number; y: number; vx: number; vy: number; angle: number } {
  const r = Math.sqrt(os.x * os.x + os.y * os.y);
  const alt = r - level.planetRadius;

  // Local radial (up) unit vector
  const radX = os.x / r;
  const radY = os.y / r;

  // Angular momentum determines orbit direction
  // h = x*vy - y*vx; h < 0 = CW, h > 0 = CCW
  const h = os.x * os.vy - os.y * os.vx;

  // Local tangent: perpendicular to radial, in direction of travel
  const tanX = h >= 0 ? -radY : radY;
  const tanY = h >= 0 ? radX : -radX;

  // Decompose velocity into radial and tangential
  const vRadial = os.vx * radX + os.vy * radY;      // positive = away from planet
  const vTangential = os.vx * tanX + os.vy * tanY;   // positive = in direction of travel

  // How far ahead of the LZ is the ship (positive = still needs to travel to reach LZ)
  const posAngle = Math.atan2(os.y, os.x);
  let angleDiff = posAngle - level.landingSiteAngle;
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
  // CW (h<0): angles decrease in travel direction. angleDiff > 0 = ship ahead of LZ
  // CCW (h>0): angles increase in travel direction. angleDiff < 0 = ship ahead of LZ
  const distAhead = (h < 0 ? angleDiff : -angleDiff) * level.planetRadius;

  // In approach coords: gate (LZ) is at gateX. Ship is distAhead meters before it.
  const approachX = gateX - distAhead;

  // Ship angle in approach frame: 0 = pointing up, positive = tilted toward travel
  const shipAngle = Math.atan2(vTangential, vRadial);

  return {
    x: approachX,
    y: alt,
    vx: vTangential,
    vy: vRadial,
    angle: shipAngle,
  };
}

// ===================== Orbital Mechanics =====================

interface OrbitalElements {
  a: number;
  e: number;
  omega: number;
  h: number;
  energy: number;
  periapsis: number;
  apoapsis: number;
  trueAnomaly: number;
}

function computeElements(x: number, y: number, vx: number, vy: number, gm: number): OrbitalElements {
  const r = Math.sqrt(x * x + y * y);
  const v2 = vx * vx + vy * vy;
  const energy = v2 / 2 - gm / r;
  const a = -gm / (2 * energy);
  const h = x * vy - y * vx;
  const ex = (vy * h) / gm - x / r;
  const ey = (-vx * h) / gm - y / r;
  const e = Math.sqrt(ex * ex + ey * ey);
  const omega = Math.atan2(ey, ex);
  const periapsis = a * (1 - e);
  const apoapsis = e < 1 ? a * (1 + e) : Infinity;
  const theta = Math.atan2(y, x);
  let trueAnomaly = theta - omega;
  while (trueAnomaly > Math.PI) trueAnomaly -= 2 * Math.PI;
  while (trueAnomaly < -Math.PI) trueAnomaly += 2 * Math.PI;
  return { a, e, omega, h, energy, periapsis, apoapsis, trueAnomaly };
}

function orbitPosition(elem: OrbitalElements, nu: number): { x: number; y: number } {
  const p = elem.a * (1 - elem.e * elem.e);
  const r = p / (1 + elem.e * Math.cos(nu));
  if (r < 0) return { x: 0, y: 0 };
  const angle = nu + elem.omega;
  return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
}

// ===================== Atmosphere =====================

function atmoDensity(alt: number, level: OrbitalLevel): number {
  if (alt <= 0) return level.surfaceDensity;
  if (alt >= level.atmoHeight) return 0;
  return level.surfaceDensity * Math.exp(-alt / level.scaleHeight);
}

/** Compute drag acceleration magnitude and heat rate at a given state. */
function aeroDrag(
  x: number, y: number, vx: number, vy: number, level: OrbitalLevel,
): { dragAx: number; dragAy: number; heatRate: number } {
  const r = Math.sqrt(x * x + y * y);
  const alt = r - level.planetRadius;
  const rho = atmoDensity(alt, level);
  if (rho < 1e-10) return { dragAx: 0, dragAy: 0, heatRate: 0 };

  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed < 0.1) return { dragAx: 0, dragAy: 0, heatRate: 0 };

  const dragAccel = 0.5 * rho * speed * speed * level.orbitalDragCoeff;
  const dragAx = -(vx / speed) * dragAccel;
  const dragAy = -(vy / speed) * dragAccel;
  const heatRate = dragAccel * speed * level.heatCoeff;
  return { dragAx, dragAy, heatRate };
}

// ===================== Physics Update =====================

export function updateOrbital(
  s: OrbitalState, input: InputState, level: OrbitalLevel, dt: number,
): void {
  if (!s.alive || s.enteredAtmo) return;

  // Track wall-clock time (for trail)
  s.realTime += dt;

  // --- Time warp controls ---
  if (input.warpUp) {
    s.timeWarpLevel = Math.min(s.timeWarpLevel + 1, WARP_SPEEDS.length - 1);
    s.timeWarp = WARP_SPEEDS[s.timeWarpLevel];
  }
  if (input.warpDown) {
    s.timeWarpLevel = Math.max(s.timeWarpLevel - 1, 0);
    s.timeWarp = WARP_SPEEDS[s.timeWarpLevel];
  }

  // Thrust cancels time warp
  const thrusting = input.throttleUp || input.throttleDown || input.pitch !== 0;
  if (thrusting && s.timeWarpLevel > 0) {
    s.timeWarpLevel = 0;
    s.timeWarp = 1;
  }

  // Cap warp when in atmosphere
  const effectiveWarp = s.inAtmo
    ? Math.min(s.timeWarp, ATMO_WARP_CAP)
    : s.timeWarp;

  // Total time multiplier: baseTimeScale × user warp
  const totalScale = level.baseTimeScale * effectiveWarp;
  const effectiveDt = dt * totalScale;

  // Substeps
  const substeps = Math.max(1, Math.ceil(effectiveDt / PHYSICS_SUBSTEP));
  const subDt = effectiveDt / substeps;

  s.thrusting = 'none';

  for (let step = 0; step < substeps; step++) {
    const r = Math.sqrt(s.x * s.x + s.y * s.y);
    const alt = r - level.planetRadius;

    if (r < level.planetRadius) { s.alive = false; return; }

    // Gravity
    const gAccel = level.planetGM / (r * r);
    let ax = -gAccel * (s.x / r);
    let ay = -gAccel * (s.y / r);

    // Atmospheric drag
    const { dragAx, dragAy, heatRate } = aeroDrag(s.x, s.y, s.vx, s.vy, level);
    ax += dragAx;
    ay += dragAy;

    // Heat
    s.temperature += (heatRate - level.heatDissipation * s.temperature) * subDt;
    if (s.temperature < 0) s.temperature = 0;
    if (s.temperature > 1.5) s.temperature = 1.5;

    s.inAtmo = alt < level.atmoHeight;

    // Thrust
    if (s.fuel > 0) {
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (speed > 0.01) {
        const pdx = s.vx / speed;
        const pdy = s.vy / speed;
        const leftX = -pdy;
        const leftY = pdx;

        let thrustX = 0, thrustY = 0;
        if (input.throttleUp) {
          thrustX += pdx * level.thrustAccel;
          thrustY += pdy * level.thrustAccel;
          s.thrusting = 'prograde';
        }
        if (input.throttleDown) {
          thrustX -= pdx * level.thrustAccel;
          thrustY -= pdy * level.thrustAccel;
          s.thrusting = 'retrograde';
        }
        if (input.pitch < 0) {
          thrustX += leftX * level.thrustAccel;
          thrustY += leftY * level.thrustAccel;
          s.thrusting = 'left';
        }
        if (input.pitch > 0) {
          thrustX -= leftX * level.thrustAccel;
          thrustY -= leftY * level.thrustAccel;
          s.thrusting = 'right';
        }

        const thrustMag = Math.sqrt(thrustX * thrustX + thrustY * thrustY);
        if (thrustMag > 0.01) {
          const dvUsed = thrustMag * subDt;
          if (dvUsed <= s.fuel) {
            ax += thrustX;
            ay += thrustY;
            s.fuel -= dvUsed;
          } else {
            const frac = s.fuel / dvUsed;
            ax += thrustX * frac;
            ay += thrustY * frac;
            s.fuel = 0;
          }
        }
      }
    }

    // Symplectic Euler
    s.vx += ax * subDt;
    s.vy += ay * subDt;
    s.x += s.vx * subDt;
    s.y += s.vy * subDt;
    s.time += subDt;

    // Invalidate prediction when orbit changes (thrust)
    if (s.thrusting !== 'none') _predDirty = true;

    // Transition: below transition altitude while in atmosphere
    const newR = Math.sqrt(s.x * s.x + s.y * s.y);
    const newAlt = newR - level.planetRadius;
    if (newAlt <= level.transitionAltitude && newAlt < level.atmoHeight) {
      s.enteredAtmo = true;
      return;
    }

    if (newR <= level.planetRadius) { s.alive = false; return; }
  }

  // Trail update (wall-clock time)
  const trailEntry = { x: s.x, y: s.y, t: s.realTime };
  if (s.trail.length < TRAIL_MAX) {
    s.trail.push(trailEntry);
  } else {
    s.trail[s.trailIdx] = trailEntry;
    s.trailIdx = (s.trailIdx + 1) % TRAIL_MAX;
  }
}

// ===================== Orbit Prediction (Numerical) =====================

interface PredPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alt: number;
  inAtmo: boolean;
  belowCritical: boolean;
  heatRate: number;
}

interface PredEvent {
  x: number; y: number;
  vx: number; vy: number;
  alt: number;
  idx: number;
}

interface PredictionResult {
  points: PredPoint[];
  atmoEntry: PredEvent | null;   // first point entering atmosphere
  atmoExit: PredEvent | null;    // first point exiting atmosphere after entry
  approachStart: PredEvent | null; // first point below critical altitude
  impact: PredEvent | null;      // ground impact point
}

function analyzePrediction(points: PredPoint[], level: OrbitalLevel): PredictionResult {
  let atmoEntry: PredEvent | null = null;
  let atmoExit: PredEvent | null = null;
  let approachStart: PredEvent | null = null;
  let impact: PredEvent | null = null;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const pt = points[i];

    // Atmo entry: transition from outside to inside
    if (!atmoEntry && !prev.inAtmo && pt.inAtmo) {
      atmoEntry = { x: pt.x, y: pt.y, vx: pt.vx, vy: pt.vy, alt: pt.alt, idx: i };
    }

    // Atmo exit: transition from inside to outside (after entry)
    if (atmoEntry && !atmoExit && prev.inAtmo && !pt.inAtmo) {
      atmoExit = { x: pt.x, y: pt.y, vx: pt.vx, vy: pt.vy, alt: pt.alt, idx: i };
    }

    // Approach start: first point below critical altitude
    if (!approachStart && pt.belowCritical) {
      approachStart = { x: pt.x, y: pt.y, vx: pt.vx, vy: pt.vy, alt: pt.alt, idx: i };
    }

    // Impact: altitude <= 0
    if (!impact && pt.alt <= 0) {
      impact = { x: pt.x, y: pt.y, vx: pt.vx, vy: pt.vy, alt: 0, idx: i };
      break;
    }
  }

  return { points, atmoEntry, atmoExit, approachStart, impact };
}

// Cached prediction — only recomputed when orbit changes
let _cachedPred: PredictionResult | null = null;
let _predDirty = true;
let _predFrameCount = 0;
const ATMO_RECALC_INTERVAL = 30; // recalc every N frames when in atmo

/** Mark prediction as needing recomputation (call when orbit changes). */
export function invalidatePrediction(): void { _predDirty = true; }

function getCachedPrediction(s: OrbitalState, level: OrbitalLevel): PredictionResult {
  _predFrameCount++;
  // Periodic recalc when in atmosphere (drag changes orbit slowly)
  if (s.inAtmo && _predFrameCount % ATMO_RECALC_INTERVAL === 0) _predDirty = true;
  if (!_predDirty && _cachedPred) return _cachedPred;
  const elem = computeElements(s.x, s.y, s.vx, s.vy, level.planetGM);
  const period = elem.a > 0 ? 2 * Math.PI * Math.sqrt(elem.a ** 3 / level.planetGM) : 10000;
  const maxTime = Math.min(period * 1.8, 20000);
  const stepSize = Math.max(1, maxTime / 1200);
  const points = predictOrbit(s, level, maxTime, stepSize);
  _cachedPred = analyzePrediction(points, level);
  _predDirty = false;
  return _cachedPred;
}

function predictOrbit(
  s: OrbitalState, level: OrbitalLevel, maxPhysTime: number, stepSize: number,
): PredPoint[] {
  const points: PredPoint[] = [];
  let x = s.x, y = s.y, vx = s.vx, vy = s.vy;
  // Substeps per prediction step for accuracy
  const subs = 4;
  const subDt = stepSize / subs;

  for (let t = 0; t < maxPhysTime; t += stepSize) {
    for (let si = 0; si < subs; si++) {
      const r = Math.sqrt(x * x + y * y);
      if (r < level.planetRadius) {
        // Add impact point and stop
        points.push({ x, y, vx, vy, alt: r - level.planetRadius, inAtmo: true, belowCritical: true, heatRate: 0 });
        return points;
      }
      const gAccel = level.planetGM / (r * r);
      let ax = -gAccel * (x / r);
      let ay = -gAccel * (y / r);
      const { dragAx, dragAy } = aeroDrag(x, y, vx, vy, level);
      ax += dragAx;
      ay += dragAy;
      vx += ax * subDt;
      vy += ay * subDt;
      x += vx * subDt;
      y += vy * subDt;
    }

    const r = Math.sqrt(x * x + y * y);
    const alt = r - level.planetRadius;
    const { heatRate } = aeroDrag(x, y, vx, vy, level);
    points.push({
      x, y, vx, vy, alt,
      inAtmo: alt < level.atmoHeight,
      belowCritical: alt < level.transitionAltitude,
      heatRate,
    });
  }
  return points;
}

// ===================== Camera =====================

export interface OrbitalCamera {
  x: number;
  y: number;
  zoom: number;
}

export function createOrbitalCamera(level: OrbitalLevel): OrbitalCamera {
  const orbitR = Math.sqrt(level.startX * level.startX + level.startY * level.startY);
  const zoom = 350 / orbitR;
  return { x: 0, y: 0, zoom };
}

export function updateOrbitalCamera(
  cam: OrbitalCamera, s: OrbitalState, level: OrbitalLevel,
  dt: number, W: number, H: number,
): void {
  const elem = computeElements(s.x, s.y, s.vx, s.vy, level.planetGM);
  const maxR = elem.e < 1 ? elem.apoapsis * 1.15 : Math.sqrt(s.x * s.x + s.y * s.y) * 1.5;
  const halfScreen = Math.min(W, H) * 0.45;
  const targetZoom = halfScreen / Math.max(maxR, level.planetRadius * 1.5);
  const smooth = 1 - Math.exp(-1.5 * dt);
  cam.zoom += (targetZoom - cam.zoom) * smooth;
  cam.x += (0 - cam.x) * smooth;
  cam.y += (0 - cam.y) * smooth;
}

// ===================== Rendering =====================

function ws(wx: number, wy: number, cam: OrbitalCamera, W: number, H: number): [number, number] {
  return [
    (wx - cam.x) * cam.zoom + W / 2,
    -(wy - cam.y) * cam.zoom + H / 2,
  ];
}

export function renderOrbital(
  ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement,
  cam: OrbitalCamera, s: OrbitalState, level: OrbitalLevel, time: number,
): void {
  const W = canvas.width, H = canvas.height;

  ctx.fillStyle = '#030308';
  ctx.fillRect(0, 0, W, H);

  drawStars(ctx, W, H);
  drawPlanet(ctx, cam, level, W, H);
  drawAtmosphere(ctx, cam, level, W, H);
  drawLandingSite(ctx, cam, level, W, H);
  drawOrbitPrediction(ctx, cam, s, level, W, H);
  drawTrail(ctx, cam, s, W, H);
  drawOrbitalMarkers(ctx, cam, s, level, W, H);
  drawShip(ctx, cam, s, level, W, H, time);
}

// --- Stars ---
const STAR_CACHE: { x: number; y: number; b: number }[] = [];
function drawStars(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  if (STAR_CACHE.length === 0) {
    let seed = 12345;
    for (let i = 0; i < 200; i++) {
      seed = (seed * 16807) % 2147483647;
      const x = (seed / 2147483647) * 1.2 - 0.1;
      seed = (seed * 16807) % 2147483647;
      const y = (seed / 2147483647) * 1.2 - 0.1;
      seed = (seed * 16807) % 2147483647;
      const b = 0.2 + (seed / 2147483647) * 0.6;
      STAR_CACHE.push({ x, y, b });
    }
  }
  for (const star of STAR_CACHE) {
    ctx.fillStyle = `rgba(180, 190, 210, ${star.b})`;
    ctx.fillRect(star.x * W, star.y * H, 1.5, 1.5);
  }
}

// --- Planet ---
function drawPlanet(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  level: OrbitalLevel, W: number, H: number,
): void {
  const [cx, cy] = ws(0, 0, cam, W, H);
  const r = level.planetRadius * cam.zoom;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0f0a';
  ctx.fill();

  ctx.beginPath();
  const segments = 120;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const noise =
      Math.sin(angle * 7 + 1.3) * 0.003 +
      Math.sin(angle * 13 + 4.7) * 0.002 +
      Math.sin(angle * 23 + 2.1) * 0.001;
    const pr = r * (1 + noise);
    const px = cx + Math.cos(angle) * pr;
    const py = cy - Math.sin(angle) * pr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = '#224422';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// --- Atmosphere ---
function drawAtmosphere(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  level: OrbitalLevel, W: number, H: number,
): void {
  const [cx, cy] = ws(0, 0, cam, W, H);
  const innerR = level.planetRadius * cam.zoom;
  const outerR = (level.planetRadius + level.atmoHeight) * cam.zoom;
  const [ar, ag, ab] = level.atmoColor;

  const bands = 12;
  for (let i = 0; i < bands; i++) {
    const f0 = i / bands;
    const f1 = (i + 1) / bands;
    const r0 = innerR + (outerR - innerR) * f0;
    const r1 = innerR + (outerR - innerR) * f1;
    const alpha = 0.15 * (1 - f0) * (1 - f0);
    ctx.beginPath();
    ctx.arc(cx, cy, r1, 0, Math.PI * 2);
    ctx.arc(cx, cy, r0, 0, Math.PI * 2, true);
    ctx.fillStyle = `rgba(${ar}, ${ag}, ${ab}, ${alpha})`;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, 0.3)`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);
}

// --- Landing site ---
function drawLandingSite(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  level: OrbitalLevel, W: number, H: number,
): void {
  const angle = level.landingSiteAngle;
  const surfR = level.planetRadius;
  const atmoR = level.planetRadius + level.atmoHeight;

  const sx = surfR * Math.cos(angle);
  const sy = surfR * Math.sin(angle);
  const [ssx, ssy] = ws(sx, sy, cam, W, H);

  const ax = atmoR * 1.15 * Math.cos(angle);
  const ay = atmoR * 1.15 * Math.sin(angle);
  const [asx, asy] = ws(ax, ay, cam, W, H);

  ctx.beginPath();
  ctx.moveTo(ssx, ssy);
  ctx.lineTo(asx, asy);
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(ssx, ssy, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#00ffcc';
  ctx.fill();

  ctx.font = '11px monospace';
  ctx.fillStyle = '#00ffcc';
  ctx.textAlign = 'center';
  const labelR = atmoR * 1.2;
  const lx = labelR * Math.cos(angle);
  const ly = labelR * Math.sin(angle);
  const [lsx, lsy] = ws(lx, ly, cam, W, H);
  ctx.fillText('LZ', lsx, lsy + 4);
}

// --- Orbit prediction (numerical, with aerobraking) ---
function drawOrbitPrediction(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  s: OrbitalState, level: OrbitalLevel, W: number, H: number,
): void {
  const pred = getCachedPrediction(s, level);
  const points = pred.points;
  if (points.length < 2) return;

  // --- Draw orbit line ---
  ctx.lineWidth = 1.5;
  let prevSx = 0, prevSy = 0;
  let dashAccum = 0, dashOn = true;
  const dashLen = 8;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const [sx, sy] = ws(pt.x, pt.y, cam, W, H);

    if (i === 0) { prevSx = sx; prevSy = sy; continue; }

    const segLen = Math.sqrt((sx - prevSx) ** 2 + (sy - prevSy) ** 2);
    dashAccum += segLen;
    if (dashAccum > dashLen) { dashOn = !dashOn; dashAccum -= dashLen; }

    if (dashOn) {
      const frac = i / points.length;
      const alpha = 0.2 + 0.8 * (1 - frac); // 1.0 ahead → 0.2 at full orbit

      // Color: green=vacuum, yellow=in atmo, orange=below critical altitude
      let r = 0, g = 255, b = 100; // green
      if (pt.belowCritical) {
        r = 255; g = 160; b = 0;    // orange
      } else if (pt.inAtmo) {
        r = 255; g = 220; b = 0;    // yellow
      }

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(prevSx, prevSy);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }

    prevSx = sx;
    prevSy = sy;
  }

  // --- Event markers on orbit (arrow icons, no text) ---

  // Helper: draw arrow at a point along velocity direction
  function drawEventArrow(
    ex: number, ey: number, evx: number, evy: number,
    color: string, inward: boolean, size: number,
  ) {
    const [mx, my] = ws(ex, ey, cam, W, H);
    const spd = Math.sqrt(evx * evx + evy * evy);
    if (spd < 0.01) return;

    // Arrow along velocity direction on screen
    // Screen velocity: (evx, -evy) due to Y flip
    const svx = evx / spd, svy = -evy / spd;
    // Perpendicular (for arrowhead wings)
    const px = -svy, py = svx;

    // For "inward" (entry/approach): arrow points along velocity
    // For "outward" (exit): arrow also along velocity but we add an upward tick
    const tipX = mx + svx * size;
    const tipY = my + svy * size;
    const baseX = mx - svx * size;
    const baseY = my - svy * size;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Arrow shaft
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(tipX, tipY);
    // Arrowhead
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - svx * size * 0.6 + px * size * 0.4, tipY - svy * size * 0.6 + py * size * 0.4);
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - svx * size * 0.6 - px * size * 0.4, tipY - svy * size * 0.6 - py * size * 0.4);
    ctx.stroke();

    if (!inward) {
      // Exit: add a small "kick up" line (perpendicular away from planet)
      const rr = Math.sqrt(ex * ex + ey * ey);
      const outX = ex / rr, outY = ey / rr; // radial outward in world
      const soutX = outX, soutY = -outY;     // screen coords
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + soutX * size * 1.2, my + soutY * size * 1.2);
      ctx.stroke();
    }
  }

  // Atmo entry: yellow arrow diving in
  if (pred.atmoEntry) {
    drawEventArrow(
      pred.atmoEntry.x, pred.atmoEntry.y,
      pred.atmoEntry.vx, pred.atmoEntry.vy,
      '#ffdd00', true, 8,
    );
  }

  // Atmo exit: yellow arrow with upward kick
  if (pred.atmoExit) {
    drawEventArrow(
      pred.atmoExit.x, pred.atmoExit.y,
      pred.atmoExit.vx, pred.atmoExit.vy,
      '#ffdd00', false, 8,
    );
  }

  // Approach start: orange arrow, slightly larger
  if (pred.approachStart) {
    drawEventArrow(
      pred.approachStart.x, pred.approachStart.y,
      pred.approachStart.vx, pred.approachStart.vy,
      '#ff8844', true, 10,
    );
    // Double ring to distinguish from entry
    const [mx, my] = ws(pred.approachStart.x, pred.approachStart.y, cam, W, H);
    ctx.beginPath();
    ctx.arc(mx, my, 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff8844';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Impact point marker + distance from LZ
  if (pred.impact) {
    const [mx, my] = ws(pred.impact.x, pred.impact.y, cam, W, H);
    // X marker
    ctx.strokeStyle = '#ff2200';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx - 5, my - 5); ctx.lineTo(mx + 5, my + 5);
    ctx.moveTo(mx + 5, my - 5); ctx.lineTo(mx - 5, my + 5);
    ctx.stroke();

    // Distance from LZ (arc distance on surface)
    const impactAngle = Math.atan2(pred.impact.y, pred.impact.x);
    let angleDiff = impactAngle - level.landingSiteAngle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    const arcDist = Math.abs(angleDiff) * level.planetRadius / 1000; // km
    // "Short" = impact is before LZ in direction of travel
    // h > 0 = CCW (angle increases), h < 0 = CW (angle decreases)
    // If CW: ship hasn't reached LZ yet if impact angle > LZ angle (angleDiff > 0) = short
    // If CCW: ship hasn't reached LZ yet if impact angle < LZ angle (angleDiff < 0) = short
    const elem = computeElements(s.x, s.y, s.vx, s.vy, level.planetGM);
    const isShort = elem.h < 0 ? angleDiff > 0 : angleDiff < 0;

    const distLabel = arcDist < 1 ? 'ON TARGET' :
      `${arcDist.toFixed(0)}km ${isShort ? 'short' : 'long'}`;
    const distCol = arcDist < 5 ? '#00ffcc' : '#ff6644';
    ctx.font = '10px monospace';
    ctx.fillStyle = distCol;
    ctx.textAlign = 'center';
    ctx.fillText(distLabel, mx, my + 18);
  }
}

// --- Trail ---
function drawTrail(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  s: OrbitalState, W: number, H: number,
): void {
  if (s.trail.length < 2) return;

  const now = s.realTime;
  ctx.lineWidth = 2;

  const entries: { x: number; y: number; t: number }[] = [];
  if (s.trail.length < TRAIL_MAX) {
    for (const e of s.trail) entries.push(e);
  } else {
    for (let i = 0; i < TRAIL_MAX; i++) {
      entries.push(s.trail[(s.trailIdx + i) % TRAIL_MAX]);
    }
  }

  let prevSx = 0, prevSy = 0, prevValid = false;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const age = now - e.t;
    if (age > TRAIL_DURATION || age < 0) { prevValid = false; continue; }

    const [sx, sy] = ws(e.x, e.y, cam, W, H);

    if (prevValid) {
      const alpha = 0.6 * (1 - age / TRAIL_DURATION);
      if (alpha > 0.01) {
        ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(prevSx, prevSy);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
    }

    prevSx = sx;
    prevSy = sy;
    prevValid = true;
  }
}

// --- Pe/Ap markers ---
function drawOrbitalMarkers(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  s: OrbitalState, level: OrbitalLevel, W: number, H: number,
): void {
  const elem = computeElements(s.x, s.y, s.vx, s.vy, level.planetGM);

  // Periapsis — orange diamond
  const pePos = orbitPosition(elem, 0);
  const [psx, psy] = ws(pePos.x, pePos.y, cam, W, H);
  const ms = 6;

  ctx.beginPath();
  ctx.moveTo(psx, psy - ms);
  ctx.lineTo(psx + ms, psy);
  ctx.lineTo(psx, psy + ms);
  ctx.lineTo(psx - ms, psy);
  ctx.closePath();
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Apoapsis — blue diamond
  if (elem.e < 1) {
    const apPos = orbitPosition(elem, Math.PI);
    const [asx, asy] = ws(apPos.x, apPos.y, cam, W, H);

    ctx.beginPath();
    ctx.moveTo(asx, asy - ms);
    ctx.lineTo(asx + ms, asy);
    ctx.lineTo(asx, asy + ms);
    ctx.lineTo(asx - ms, asy);
    ctx.closePath();
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// --- Ship ---
function drawShip(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  s: OrbitalState, level: OrbitalLevel, W: number, H: number, time: number,
): void {
  const [sx, sy] = ws(s.x, s.y, cam, W, H);
  const size = 10;
  const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  const shipAngle = speed > 0.1 ? Math.atan2(s.vx, s.vy) : 0;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(shipAngle);

  // Triangle
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.5, size * 0.5);
  ctx.lineTo(-size * 0.5, size * 0.5);
  ctx.closePath();
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Thrust flames
  const flicker = 0.7 + 0.3 * Math.sin(time * 40);
  if (s.thrusting === 'prograde') {
    const fl = 8 * flicker;
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, size * 0.5);
    ctx.lineTo(0, size * 0.5 + fl);
    ctx.lineTo(size * 0.2, size * 0.5);
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (s.thrusting === 'retrograde') {
    const fl = 8 * flicker;
    ctx.beginPath();
    ctx.moveTo(-size * 0.15, -size);
    ctx.lineTo(0, -size - fl);
    ctx.lineTo(size * 0.15, -size);
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (s.thrusting === 'left') {
    const fl = 6 * flicker;
    ctx.beginPath();
    ctx.moveTo(size * 0.4, -size * 0.2);
    ctx.lineTo(size * 0.4 + fl, 0);
    ctx.lineTo(size * 0.4, size * 0.2);
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  if (s.thrusting === 'right') {
    const fl = 6 * flicker;
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, -size * 0.2);
    ctx.lineTo(-size * 0.4 - fl, 0);
    ctx.lineTo(-size * 0.4, size * 0.2);
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();

  // Velocity vector line
  if (speed > 0.1) {
    const vLen = 30;
    const vsx = sx + (s.vx / speed) * vLen;
    const vsy = sy - (s.vy / speed) * vLen;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(vsx, vsy);
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// ===================== HUD =====================

const COL_HUD = '#00ff88';
const COL_HUD_DIM = '#007744';
const COL_WARN = '#ffaa00';
const COL_DANGER = '#ff3333';
const COL_OK = '#00ffcc';

export function drawOrbitalHUD(
  ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement,
  s: OrbitalState, level: OrbitalLevel,
  state: 'orbiting' | 'enteredAtmo' | 'crashed',
): void {
  const W = canvas.width, H = canvas.height;
  const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  const r = Math.sqrt(s.x * s.x + s.y * s.y);
  const alt = (r - level.planetRadius) / 1000;

  const elem = computeElements(s.x, s.y, s.vx, s.vy, level.planetGM);
  const peAlt = (elem.periapsis - level.planetRadius) / 1000;
  const apAlt = elem.e < 1 ? (elem.apoapsis - level.planetRadius) / 1000 : Infinity;

  ctx.save();

  // Level name
  ctx.font = '13px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.fillText(level.name, W - 20, 24);

  const lx = 20;
  let ly = 30;
  const lh = 20;
  ctx.font = '14px "Courier New", monospace';
  ctx.textAlign = 'left';

  label(ctx, lx, ly, 'ALT', `${alt.toFixed(1)} km`, COL_HUD); ly += lh;
  label(ctx, lx, ly, 'SPD', `${speed.toFixed(0)} m/s`, COL_HUD); ly += lh;

  // PeA — always matches diamond color (orange)
  const peInAtmo = peAlt < level.atmoHeight / 1000;
  const peBelowCrit = peAlt < level.transitionAltitude / 1000;
  label(ctx, lx, ly, 'PeA', `${peAlt.toFixed(1)} km`, '#ffaa00'); ly += lh;

  // ApA (blue)
  const apStr = apAlt === Infinity ? 'ESCAPE' : `${apAlt.toFixed(1)} km`;
  label(ctx, lx, ly, 'ApA', apStr, apAlt === Infinity ? COL_WARN : '#00aaff'); ly += lh;

  // Atmosphere altitude
  label(ctx, lx, ly, 'ATM', `${(level.atmoHeight / 1000).toFixed(0)} km`, COL_HUD_DIM); ly += lh;

  label(ctx, lx, ly, 'ECC', elem.e.toFixed(4), COL_HUD_DIM); ly += lh;

  // Fuel
  const fuelPct = level.fuelDeltaV > 0 ? (s.fuel / level.fuelDeltaV * 100) : 0;
  const fuelCol = fuelPct < 20 ? COL_DANGER : fuelPct < 50 ? COL_WARN : COL_HUD;
  label(ctx, lx, ly, '\u0394V', `${s.fuel.toFixed(0)} m/s (${fuelPct.toFixed(0)}%)`, fuelCol); ly += lh;

  // Time warp
  const warpCol = s.timeWarp > 1 ? COL_WARN : COL_HUD_DIM;
  const warpDisplay = s.inAtmo && s.timeWarp > ATMO_WARP_CAP ? `${ATMO_WARP_CAP}x (capped)` : `${s.timeWarp}x`;
  label(ctx, lx, ly, 'WARP', warpDisplay, warpCol); ly += lh;

  // Temperature (when nonzero)
  if (s.temperature > 0.01) {
    const tempCol = s.temperature > 0.7 ? COL_DANGER : s.temperature > 0.3 ? COL_WARN : COL_HUD;
    label(ctx, lx, ly, 'TEMP', `${(s.temperature * 100).toFixed(0)}%`, tempCol); ly += lh;
  }

  // Entry parameters — show as soon as orbit enters atmosphere
  if (peInAtmo && state === 'orbiting') {
    const pred = getCachedPrediction(s, level);
    // Use approach start point if available, otherwise atmo entry
    const entryPt = pred.approachStart || pred.atmoEntry;
    if (entryPt) {
      const entrySpeed = Math.sqrt(entryPt.vx * entryPt.vx + entryPt.vy * entryPt.vy);
      const rr = Math.sqrt(entryPt.x * entryPt.x + entryPt.y * entryPt.y);
      const radX = entryPt.x / rr, radY = entryPt.y / rr;
      const vr = entryPt.vx * radX + entryPt.vy * radY;
      const vh = Math.sqrt(Math.max(0, entrySpeed * entrySpeed - vr * vr));
      const entryAngle = Math.abs(Math.atan2(-vr, vh)) * 180 / Math.PI;
      ly += 4;
      const entryCol = '#ff8844';
      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = '#885544';
      ctx.fillText('ENTRY', lx, ly);
      ctx.fillStyle = entryCol;
      ctx.fillText(`${entrySpeed.toFixed(0)} m/s  ${entryAngle.toFixed(1)}\u00b0`, lx + 56, ly);
      ly += lh;
    }
  }

  // --- Warnings ---
  let warnY = 30;
  if (peInAtmo && state === 'orbiting') {
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COL_WARN;
    if (Math.sin(Date.now() * 0.008) > -0.3) {
      ctx.fillText('⚠ AEROBRAKE TRAJECTORY', W / 2, warnY);
    }
    warnY += 22;
  }

  if (elem.periapsis < level.planetRadius && state === 'orbiting') {
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COL_DANGER;
    if (Math.sin(Date.now() * 0.012) > -0.3) {
      ctx.fillText('⚠ IMPACT TRAJECTORY', W / 2, warnY);
    }
    warnY += 22;
  }

  if (s.inAtmo && state === 'orbiting') {
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8844';
    ctx.fillText('AEROBRAKING', W / 2, warnY);
    warnY += 22;
  }

  // --- State overlays ---
  if (state === 'enteredAtmo') {
    ctx.fillStyle = 'rgba(0, 20, 0, 0.6)';
    ctx.fillRect(W / 2 - 200, H / 2 - 80, 400, 160);
    ctx.strokeStyle = COL_OK;
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 200, H / 2 - 80, 400, 160);

    ctx.textAlign = 'center';
    ctx.fillStyle = COL_OK;
    ctx.font = 'bold 24px monospace';
    ctx.fillText('ENTERING ATMOSPHERE', W / 2, H / 2 - 35);
    ctx.font = '14px monospace';
    ctx.fillText(`Speed: ${speed.toFixed(0)} m/s`, W / 2, H / 2 - 5);
    ctx.fillText(`Altitude: ${alt.toFixed(1)} km`, W / 2, H / 2 + 15);
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '14px monospace';
    ctx.fillText('R: Retry  |  L: Levels', W / 2, H / 2 + 55);
  }

  if (state === 'crashed') {
    ctx.fillStyle = 'rgba(20, 0, 0, 0.6)';
    ctx.fillRect(W / 2 - 200, H / 2 - 60, 400, 120);
    ctx.strokeStyle = COL_DANGER;
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 200, H / 2 - 60, 400, 120);

    ctx.textAlign = 'center';
    ctx.fillStyle = COL_DANGER;
    ctx.font = 'bold 28px monospace';
    ctx.fillText('IMPACT', W / 2, H / 2 - 15);
    ctx.fillStyle = COL_HUD_DIM;
    ctx.font = '14px monospace';
    ctx.fillText('R: Retry  |  L: Levels', W / 2, H / 2 + 25);
  }

  // Controls hint
  if (state === 'orbiting') {
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COL_HUD_DIM;
    ctx.fillText('W/S: Pro/Retrograde  A/D: Left/Right  [/]: Time Warp  R: Restart  L: Levels', W / 2, H - 15);
  }

  ctx.restore();
}

function label(ctx: CanvasRenderingContext2D, x: number, y: number, lbl: string, val: string, col: string): void {
  ctx.fillStyle = '#558855';
  ctx.fillText(lbl, x, y);
  ctx.fillStyle = col;
  ctx.fillText(val, x + 50, y);
}
