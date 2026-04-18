// Orbital phase: 2D Keplerian orbit around a planet.
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

  // Starting orbit (state vectors)
  startX: number;
  startY: number;
  startVX: number;
  startVY: number;

  // Ship
  thrustAccel: number;      // m/s² (both prograde/retro and radial)
  fuelDeltaV: number;       // total delta-v budget in m/s

  // Landing site (angle on planet surface, radians from +X axis)
  landingSiteAngle: number;
}

export interface OrbitalState {
  x: number;         // position relative to planet center
  y: number;
  vx: number;
  vy: number;

  fuel: number;      // remaining delta-v in m/s
  alive: boolean;
  enteredAtmo: boolean;

  // Trail (ring buffer of recent positions)
  trail: { x: number; y: number; t: number }[];
  trailIdx: number;

  // Time
  time: number;
  timeWarp: number;  // multiplier
  timeWarpLevel: number; // index into WARP_SPEEDS

  // Thrust state (for rendering)
  thrusting: 'none' | 'prograde' | 'retrograde' | 'left' | 'right';
}

// ===================== Constants =====================

const WARP_SPEEDS = [1, 2, 5, 10, 25, 50, 100];
const TRAIL_MAX = 600;
const TRAIL_DURATION = 10; // seconds of trail at 1x
const PHYSICS_SUBSTEP = 1 / 120;

// ===================== Levels =====================

// Helper: compute GM for a desired circular orbit period at a given altitude
function gmForPeriod(planetRadius: number, orbitAlt: number, period: number): number {
  const r = planetRadius + orbitAlt;
  // v = 2πr / T, v² = GM/r → GM = (2πr/T)² * r = 4π²r³/T²
  return (4 * Math.PI * Math.PI * r * r * r) / (period * period);
}

export const ORBITAL_LEVELS: OrbitalLevel[] = [
  (() => {
    const planetRadius = 600_000;  // 600 km
    const orbitAlt = 200_000;      // 200 km
    const period = 50;             // ~50 seconds real-time at 1x
    const gm = gmForPeriod(planetRadius, orbitAlt, period);
    const r = planetRadius + orbitAlt;
    const v = Math.sqrt(gm / r);   // circular orbit speed

    return {
      id: 7,
      name: "Kepler's Rest Orbit",
      subtitle: 'Deorbit — enter the atmosphere',
      planetRadius,
      planetGM: gm,
      atmoHeight: 80_000,          // 80 km atmosphere
      atmoColor: [60, 120, 200] as [number, number, number],
      // Start at top of orbit, moving right (clockwise)
      startX: 0,
      startY: r,
      startVX: v,
      startVY: 0,
      thrustAccel: 1000,         // high thrust for snappy burns (orbital v is ~100km/s)
      fuelDeltaV: 6000,           // Hohmann deorbit costs ~4200, leaves margin for corrections
      landingSiteAngle: -Math.PI / 4, // 315° = lower-right of planet
    };
  })(),
];

// ===================== State =====================

export function createOrbitalState(level: OrbitalLevel): OrbitalState {
  return {
    x: level.startX,
    y: level.startY,
    vx: level.startVX,
    vy: level.startVY,
    fuel: level.fuelDeltaV,
    alive: true,
    enteredAtmo: false,
    trail: [],
    trailIdx: 0,
    time: 0,
    timeWarp: 1,
    timeWarpLevel: 0,
    thrusting: 'none',
  };
}

// ===================== Orbital Mechanics =====================

interface OrbitalElements {
  a: number;         // semi-major axis
  e: number;         // eccentricity
  omega: number;     // argument of periapsis (angle of periapsis from +X)
  h: number;         // specific angular momentum (scalar, positive = CCW)
  energy: number;    // specific orbital energy
  periapsis: number; // periapsis distance from center
  apoapsis: number;  // apoapsis distance from center (Infinity if hyperbolic)
  trueAnomaly: number; // current true anomaly
}

function computeElements(x: number, y: number, vx: number, vy: number, gm: number): OrbitalElements {
  const r = Math.sqrt(x * x + y * y);
  const v2 = vx * vx + vy * vy;

  // Specific orbital energy
  const energy = v2 / 2 - gm / r;

  // Semi-major axis
  const a = -gm / (2 * energy);

  // Specific angular momentum (2D cross product: h = x*vy - y*vx)
  const h = x * vy - y * vx;

  // Eccentricity vector: e = (v × h)/GM - r_hat
  // In 2D: e_x = (vy * h)/GM - x/r, e_y = (-vx * h)/GM - y/r
  const ex = (vy * h) / gm - x / r;
  const ey = (-vx * h) / gm - y / r;
  const e = Math.sqrt(ex * ex + ey * ey);

  // Argument of periapsis
  const omega = Math.atan2(ey, ex);

  // Periapsis and apoapsis
  const periapsis = a * (1 - e);
  const apoapsis = e < 1 ? a * (1 + e) : Infinity;

  // True anomaly: angle from periapsis to current position
  // cos(ν) = (e · r_hat) / (|e| * 1) but use atan2 for full angle
  const theta = Math.atan2(y, x); // position angle
  let trueAnomaly = theta - omega;
  // Normalize to [-π, π]
  while (trueAnomaly > Math.PI) trueAnomaly -= 2 * Math.PI;
  while (trueAnomaly < -Math.PI) trueAnomaly += 2 * Math.PI;

  return { a, e, omega, h, energy, periapsis, apoapsis, trueAnomaly };
}

/** Get position on orbit at a given true anomaly */
function orbitPosition(elem: OrbitalElements, nu: number): { x: number; y: number } {
  if (elem.e >= 1) {
    // Hyperbolic: r = a(1-e²) / (1 + e*cos(nu)), a is negative
    const p = elem.a * (1 - elem.e * elem.e);
    const r = p / (1 + elem.e * Math.cos(nu));
    if (r < 0) return { x: 0, y: 0 }; // invalid
    const angle = nu + elem.omega;
    return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
  }
  const p = elem.a * (1 - elem.e * elem.e);
  const r = p / (1 + elem.e * Math.cos(nu));
  const angle = nu + elem.omega;
  return { x: r * Math.cos(angle), y: r * Math.sin(angle) };
}

// ===================== Physics Update =====================

export function updateOrbital(
  s: OrbitalState, input: InputState, level: OrbitalLevel, dt: number,
): void {
  if (!s.alive || s.enteredAtmo) return;

  // --- Time warp controls ---
  if (input.warpUp) {
    s.timeWarpLevel = Math.min(s.timeWarpLevel + 1, WARP_SPEEDS.length - 1);
    s.timeWarp = WARP_SPEEDS[s.timeWarpLevel];
  }
  if (input.warpDown) {
    s.timeWarpLevel = Math.max(s.timeWarpLevel - 1, 0);
    s.timeWarp = WARP_SPEEDS[s.timeWarpLevel];
  }

  // --- Thrust (cancels time warp) ---
  const thrusting = input.throttleUp || input.throttleDown ||
    input.pitch !== 0;

  if (thrusting && s.timeWarpLevel > 0) {
    s.timeWarpLevel = 0;
    s.timeWarp = 1;
  }

  // Effective dt with time warp
  const effectiveDt = dt * s.timeWarp;

  // Substep count
  const substeps = Math.max(1, Math.ceil(effectiveDt / PHYSICS_SUBSTEP));
  const subDt = effectiveDt / substeps;

  s.thrusting = 'none';

  for (let step = 0; step < substeps; step++) {
    // Gravity
    const r = Math.sqrt(s.x * s.x + s.y * s.y);
    if (r < level.planetRadius) {
      s.alive = false;
      return;
    }
    const gAccel = level.planetGM / (r * r);
    let ax = -gAccel * (s.x / r);
    let ay = -gAccel * (s.y / r);

    // Thrust
    s.thrusting = 'none';
    if (s.fuel > 0) {
      const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (speed > 0.01) {
        const pdx = s.vx / speed;
        const pdy = s.vy / speed;
        // A = left of velocity (CCW 90°), D = right of velocity (CW 90°)
        const leftX = -pdy;
        const leftY = pdx;

        let thrustX = 0, thrustY = 0;

        if (input.throttleUp) {
          // W = prograde
          thrustX += pdx * level.thrustAccel;
          thrustY += pdy * level.thrustAccel;
          s.thrusting = 'prograde';
        }
        if (input.throttleDown) {
          // S = retrograde
          thrustX -= pdx * level.thrustAccel;
          thrustY -= pdy * level.thrustAccel;
          s.thrusting = 'retrograde';
        }
        if (input.pitch < 0) {
          // A = left of velocity
          thrustX += leftX * level.thrustAccel;
          thrustY += leftY * level.thrustAccel;
          s.thrusting = 'left';
        }
        if (input.pitch > 0) {
          // D = right of velocity
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
            // Partial burn with remaining fuel
            const frac = s.fuel / dvUsed;
            ax += thrustX * frac;
            ay += thrustY * frac;
            s.fuel = 0;
          }
        }
      }
    }

    // Symplectic Euler (kick-drift): conserves orbital energy
    s.vx += ax * subDt;
    s.vy += ay * subDt;
    s.x += s.vx * subDt;
    s.y += s.vy * subDt;

    s.time += subDt;

    // Check atmosphere entry
    const newR = Math.sqrt(s.x * s.x + s.y * s.y);
    if (newR <= level.planetRadius + level.atmoHeight) {
      s.enteredAtmo = true;
      return;
    }

    // Check crash
    if (newR <= level.planetRadius) {
      s.alive = false;
      return;
    }
  }

  // --- Trail update (once per frame, not per substep) ---
  const trailEntry = { x: s.x, y: s.y, t: s.time };
  if (s.trail.length < TRAIL_MAX) {
    s.trail.push(trailEntry);
  } else {
    s.trail[s.trailIdx] = trailEntry;
    s.trailIdx = (s.trailIdx + 1) % TRAIL_MAX;
  }
}

// ===================== Camera =====================

export interface OrbitalCamera {
  x: number;
  y: number;
  zoom: number; // pixels per meter
}

export function createOrbitalCamera(level: OrbitalLevel): OrbitalCamera {
  const orbitR = Math.sqrt(level.startX * level.startX + level.startY * level.startY);
  // Zoom so the full orbit circle fits in ~70% of a 900px half-screen
  // viewRadius in pixels = orbitR * zoom, want that ≈ 350px
  const zoom = 350 / orbitR;
  return { x: 0, y: 0, zoom };
}

export function updateOrbitalCamera(
  cam: OrbitalCamera, s: OrbitalState, level: OrbitalLevel,
  dt: number, W: number, H: number,
): void {
  // Camera always centered on planet (0,0)
  // Zoom: fit the orbit with some margin
  const orbitR = Math.sqrt(s.x * s.x + s.y * s.y);
  const elem = computeElements(s.x, s.y, s.vx, s.vy, level.planetGM);
  const maxR = elem.e < 1 ? elem.apoapsis * 1.15 : orbitR * 1.5;

  const halfScreen = Math.min(W, H) * 0.45;
  const targetZoom = halfScreen / Math.max(maxR, level.planetRadius * 1.5);

  const smooth = 1 - Math.exp(-1.5 * dt);
  cam.zoom += (targetZoom - cam.zoom) * smooth;

  // Keep centered on planet
  cam.x += (0 - cam.x) * smooth;
  cam.y += (0 - cam.y) * smooth;
}

// ===================== Rendering =====================

function ws(wx: number, wy: number, cam: OrbitalCamera, W: number, H: number): [number, number] {
  // World coords: +X right, +Y up. Screen: +X right, +Y down.
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

  // Background
  ctx.fillStyle = '#030308';
  ctx.fillRect(0, 0, W, H);

  // Stars
  drawStars(ctx, W, H);

  // Planet
  drawPlanet(ctx, cam, level, W, H);

  // Atmosphere
  drawAtmosphere(ctx, cam, level, W, H);

  // Landing site marker
  drawLandingSite(ctx, cam, level, W, H);

  // Orbit prediction line
  drawOrbitLine(ctx, cam, s, level, W, H);

  // Trail
  drawTrail(ctx, cam, s, W, H);

  // Periapsis / Apoapsis markers
  drawOrbitalMarkers(ctx, cam, s, level, W, H);

  // Ship
  drawShip(ctx, cam, s, level, W, H, time);
}

// --- Stars (fixed pattern) ---
const STAR_CACHE: { x: number; y: number; b: number }[] = [];
function drawStars(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  if (STAR_CACHE.length === 0) {
    // Generate once
    let seed = 12345;
    for (let i = 0; i < 200; i++) {
      seed = (seed * 16807 + 0) % 2147483647;
      const x = (seed / 2147483647) * 1.2 - 0.1;
      seed = (seed * 16807 + 0) % 2147483647;
      const y = (seed / 2147483647) * 1.2 - 0.1;
      seed = (seed * 16807 + 0) % 2147483647;
      const b = 0.2 + (seed / 2147483647) * 0.6;
      STAR_CACHE.push({ x, y, b });
    }
  }
  for (const star of STAR_CACHE) {
    const sx = star.x * W;
    const sy = star.y * H;
    const alpha = star.b;
    ctx.fillStyle = `rgba(180, 190, 210, ${alpha})`;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }
}

// --- Planet body ---
function drawPlanet(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  level: OrbitalLevel, W: number, H: number,
): void {
  const [cx, cy] = ws(0, 0, cam, W, H);
  const r = level.planetRadius * cam.zoom;

  // Dark filled circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0f0a';
  ctx.fill();

  // Rough terrain outline — perturb the radius slightly
  ctx.beginPath();
  const segments = 120;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    // Terrain noise: several frequencies
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

// --- Atmosphere band ---
function drawAtmosphere(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  level: OrbitalLevel, W: number, H: number,
): void {
  const [cx, cy] = ws(0, 0, cam, W, H);
  const innerR = level.planetRadius * cam.zoom;
  const outerR = (level.planetRadius + level.atmoHeight) * cam.zoom;

  // Gradient from inner (denser) to outer (transparent)
  const [ar, ag, ab] = level.atmoColor;
  const bands = 12;
  for (let i = 0; i < bands; i++) {
    const f0 = i / bands;
    const f1 = (i + 1) / bands;
    const r0 = innerR + (outerR - innerR) * f0;
    const r1 = innerR + (outerR - innerR) * f1;
    const alpha = 0.15 * (1 - f0) * (1 - f0); // quadratic falloff
    ctx.beginPath();
    ctx.arc(cx, cy, r1, 0, Math.PI * 2);
    ctx.arc(cx, cy, r0, 0, Math.PI * 2, true);
    ctx.fillStyle = `rgba(${ar}, ${ag}, ${ab}, ${alpha})`;
    ctx.fill();
  }

  // Atmo boundary dashed circle
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, 0.3)`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);
}

// --- Landing site marker ---
function drawLandingSite(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  level: OrbitalLevel, W: number, H: number,
): void {
  const angle = level.landingSiteAngle;
  const surfR = level.planetRadius;
  const atmoR = level.planetRadius + level.atmoHeight;

  // Point on surface
  const sx = surfR * Math.cos(angle);
  const sy = surfR * Math.sin(angle);
  const [ssx, ssy] = ws(sx, sy, cam, W, H);

  // Point at atmo top (radial line)
  const ax = atmoR * 1.15 * Math.cos(angle);
  const ay = atmoR * 1.15 * Math.sin(angle);
  const [asx, asy] = ws(ax, ay, cam, W, H);

  // Radial line through atmosphere
  ctx.beginPath();
  ctx.moveTo(ssx, ssy);
  ctx.lineTo(asx, asy);
  ctx.strokeStyle = 'rgba(0, 255, 204, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Marker on surface
  ctx.beginPath();
  ctx.arc(ssx, ssy, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#00ffcc';
  ctx.fill();

  // Label
  ctx.font = '11px monospace';
  ctx.fillStyle = '#00ffcc';
  ctx.textAlign = 'center';
  const labelR = atmoR * 1.2;
  const lx = labelR * Math.cos(angle);
  const ly = labelR * Math.sin(angle);
  const [lsx, lsy] = ws(lx, ly, cam, W, H);
  ctx.fillText('LZ', lsx, lsy + 4);
}

// --- Orbit prediction line (fading green dashed ellipse) ---
function drawOrbitLine(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  s: OrbitalState, level: OrbitalLevel, W: number, H: number,
): void {
  const elem = computeElements(s.x, s.y, s.vx, s.vy, level.planetGM);
  if (elem.a <= 0 && elem.e >= 1) {
    // Hyperbolic orbit — draw limited arc
    drawHyperbolicOrbit(ctx, cam, s, elem, level, W, H);
    return;
  }

  // Elliptical orbit: draw from current position forward (in direction of travel)
  const steps = 200;
  const startNu = elem.trueAnomaly;
  // h > 0 = CCW (true anomaly increases), h < 0 = CW (true anomaly decreases)
  const dir = elem.h >= 0 ? 1 : -1;

  ctx.lineWidth = 1.5;
  
  let prevSx = 0, prevSy = 0;
  let dashAccum = 0;
  let dashOn = true;
  const dashLen = 8;

  for (let i = 1; i <= steps; i++) {
    const frac = i / steps;
    const nu = startNu + dir * frac * Math.PI * 2;
    const pos = orbitPosition(elem, nu);
    const [sx, sy] = ws(pos.x, pos.y, cam, W, H);

    if (i === 1) {
      prevSx = sx;
      prevSy = sy;
      continue;
    }

    const segLen = Math.sqrt((sx - prevSx) ** 2 + (sy - prevSy) ** 2);
    dashAccum += segLen;
    if (dashAccum > dashLen) {
      dashOn = !dashOn;
      dashAccum -= dashLen;
    }

    if (dashOn) {
      // Brightest just ahead of ship, fading to 10% at the far side (behind ship)
      const alpha = 0.1 + 0.8 * (1 - frac); // 0.9 near ship → 0.1 at end
      ctx.strokeStyle = `rgba(0, 255, 100, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(prevSx, prevSy);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }

    prevSx = sx;
    prevSy = sy;
  }
}

function drawHyperbolicOrbit(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  s: OrbitalState, elem: OrbitalElements, level: OrbitalLevel,
  W: number, H: number,
): void {
  // Draw arc in direction of travel
  const maxNu = Math.acos(-1 / elem.e) * 0.95; // just inside asymptote
  const dir = elem.h >= 0 ? 1 : -1;
  // Draw from slightly behind ship to well ahead
  const startNu = Math.max(-maxNu, Math.min(maxNu, elem.trueAnomaly - dir * Math.PI * 0.3));
  const endNu = Math.max(-maxNu, Math.min(maxNu, elem.trueAnomaly + dir * Math.PI * 1.5));
  const steps = 150;

  ctx.lineWidth = 1.5;
  let prevSx = 0, prevSy = 0;
  let dashAccum = 0, dashOn = true;
  const dashLen = 8;

  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const nu = startNu + frac * (endNu - startNu);
    const pos = orbitPosition(elem, nu);
    const [sx, sy] = ws(pos.x, pos.y, cam, W, H);

    if (i === 0) {
      prevSx = sx;
      prevSy = sy;
      continue;
    }

    const segLen = Math.sqrt((sx - prevSx) ** 2 + (sy - prevSy) ** 2);
    dashAccum += segLen;
    if (dashAccum > dashLen) {
      dashOn = !dashOn;
      dashAccum -= dashLen;
    }

    if (dashOn) {
      // Fade based on distance from current true anomaly
      const distFromShip = Math.abs(nu - elem.trueAnomaly) / Math.PI;
      const alpha = Math.max(0.08, 0.9 - distFromShip * 0.8);
      ctx.strokeStyle = `rgba(0, 255, 100, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(prevSx, prevSy);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }

    prevSx = sx;
    prevSy = sy;
  }
}

// --- Trail ---
function drawTrail(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  s: OrbitalState, W: number, H: number,
): void {
  if (s.trail.length < 2) return;

  const now = s.time;
  ctx.lineWidth = 2;

  // Get ordered trail entries
  const entries: { x: number; y: number; t: number }[] = [];
  if (s.trail.length < TRAIL_MAX) {
    // Not full yet — just use array as-is
    for (const e of s.trail) entries.push(e);
  } else {
    // Ring buffer: read from oldest to newest
    for (let i = 0; i < TRAIL_MAX; i++) {
      entries.push(s.trail[(s.trailIdx + i) % TRAIL_MAX]);
    }
  }

  let prevSx = 0, prevSy = 0;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const age = now - e.t;
    if (age > TRAIL_DURATION || age < 0) {
      prevSx = 0;
      prevSy = 0;
      continue;
    }

    const [sx, sy] = ws(e.x, e.y, cam, W, H);

    if (i > 0 && prevSx !== 0) {
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
  }
}

// --- Periapsis / Apoapsis markers ---
function drawOrbitalMarkers(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  s: OrbitalState, level: OrbitalLevel, W: number, H: number,
): void {
  const elem = computeElements(s.x, s.y, s.vx, s.vy, level.planetGM);

  // Periapsis — orange marker
  const pePos = orbitPosition(elem, 0); // true anomaly = 0 at periapsis
  const [psx, psy] = ws(pePos.x, pePos.y, cam, W, H);

  const peInAtmo = elem.periapsis < level.planetRadius + level.atmoHeight;
  const peCol = '#ffaa00'; // always orange

  // Diamond marker (no label — altitudes shown on HUD only)
  const ms = 6;
  ctx.beginPath();
  ctx.moveTo(psx, psy - ms);
  ctx.lineTo(psx + ms, psy);
  ctx.lineTo(psx, psy + ms);
  ctx.lineTo(psx - ms, psy);
  ctx.closePath();
  ctx.strokeStyle = peCol;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Apoapsis — blue marker (only for elliptical)
  if (elem.e < 1) {
    const apPos = orbitPosition(elem, Math.PI); // true anomaly = π at apoapsis
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

  // Atmosphere entry point: where orbit crosses atmo boundary
  if (peInAtmo && elem.e < 1) {
    drawAtmoEntryMarker(ctx, cam, elem, level, W, H);
  }
}

function drawAtmoEntryMarker(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  elem: OrbitalElements, level: OrbitalLevel, W: number, H: number,
): void {
  // Find true anomaly where r = atmoR
  const atmoR = level.planetRadius + level.atmoHeight;
  const p = elem.a * (1 - elem.e * elem.e);
  // r = p / (1 + e*cos(nu)) → cos(nu) = (p/r - 1) / e
  const cosNu = (p / atmoR - 1) / elem.e;
  if (Math.abs(cosNu) > 1) return; // no intersection

  const nu = Math.acos(cosNu); // positive = first crossing going inbound

  // We want the entry point ahead of the ship (descending into atmo)
  // For a clockwise orbit (h < 0), the ship approaches periapsis with decreasing true anomaly
  // For CCW (h > 0), with increasing true anomaly
  // Entry = the crossing where we're heading inward (before periapsis)
  const entryNu = elem.h >= 0 ? -nu : nu; // pick the one before periapsis
  
  // Also check the other crossing (exit)
  const exitNu = -entryNu;

  for (const crossNu of [entryNu, exitNu]) {
    const pos = orbitPosition(elem, crossNu);
    const [sx, sy] = ws(pos.x, pos.y, cam, W, H);

    // Determine if this is entry or exit based on direction to/from periapsis
    const isEntry = Math.abs(crossNu) < Math.PI / 2 ? 
      (crossNu > 0 ? elem.h > 0 : elem.h < 0) : true;

    const col = '#ff8844';
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '10px monospace';
    ctx.fillStyle = col;
    ctx.textAlign = 'center';
    
    // Compute entry speed at this point using vis-viva: v² = GM(2/r - 1/a)
    const entrySpeed = Math.sqrt(level.planetGM * (2 / atmoR - 1 / elem.a));
    
    // Entry angle: angle between velocity and local horizontal
    // At the crossing point, compute velocity direction
    const r = atmoR;
    const vr = Math.sqrt(Math.max(0, entrySpeed * entrySpeed - (elem.h / r) * (elem.h / r)));
    const entryAngleDeg = Math.abs(Math.atan2(vr, Math.abs(elem.h) / r)) * 180 / Math.PI;

    ctx.fillText(`${entrySpeed.toFixed(0)}m/s ${entryAngleDeg.toFixed(1)}°`, sx, sy - 10);
  }
}

// --- Ship ---
function drawShip(
  ctx: CanvasRenderingContext2D, cam: OrbitalCamera,
  s: OrbitalState, level: OrbitalLevel, W: number, H: number, time: number,
): void {
  const [sx, sy] = ws(s.x, s.y, cam, W, H);
  const size = 10;

  // Ship angle: oriented prograde (along velocity)
  const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  // In world coords, velocity is (vx, vy). On screen, we need angle from screen-up.
  // Screen Y is flipped, so screen velocity is (vx, -vy).
  // Angle from screen-up (which is the "nose" direction in our triangle drawing):
  // We draw the triangle with nose pointing "up" in local coords, then rotate.
  // Ship nose should point in velocity direction.
  // In screen space: velocity direction angle from +X axis = atan2(-vy, vx)... 
  // Actually let's think of the rotation for ctx.rotate():
  // ctx.rotate(0) = no rotation, triangle points up (screen -Y direction)
  // We want triangle to point along screen velocity = (vx, -vy)
  // Angle of (vx, -vy) from screen-up (-Y) direction:
  // screen-up = (0, -1). Angle from screen-up CW = atan2(vx, vy) in world coords
  const shipAngle = speed > 0.1 ? Math.atan2(s.vx, s.vy) : 0;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(shipAngle);

  // Triangle (nose up in local space)
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.5, size * 0.5);
  ctx.lineTo(-size * 0.5, size * 0.5);
  ctx.closePath();
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Thrust flame
  const flicker = 0.7 + 0.3 * Math.sin(time * 40);
  if (s.thrusting === 'prograde') {
    // Flame from tail (bottom)
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
    // Flame from nose (top)
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
    // Flame from right side
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
    // Flame from left side
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

  // Velocity vector line (faint)
  if (speed > 0.1) {
    const vLen = 30; // pixels
    const vsx = sx + (s.vx / speed) * vLen;
    const vsy = sy - (s.vy / speed) * vLen; // flip Y for screen
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
  const alt = (r - level.planetRadius) / 1000; // km

  const elem = computeElements(s.x, s.y, s.vx, s.vy, level.planetGM);
  const peAlt = (elem.periapsis - level.planetRadius) / 1000;
  const apAlt = elem.e < 1 ? (elem.apoapsis - level.planetRadius) / 1000 : Infinity;

  ctx.save();

  // Level name (top right)
  ctx.font = '13px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = COL_HUD_DIM;
  ctx.fillText(level.name, W - 20, 24);

  // Left panel
  const lx = 20;
  let ly = 30;
  const lh = 20;
  ctx.font = '14px "Courier New", monospace';
  ctx.textAlign = 'left';

  // Altitude
  label(ctx, lx, ly, 'ALT', `${alt.toFixed(1)} km`, COL_HUD); ly += lh;

  // Speed
  label(ctx, lx, ly, 'SPD', `${speed.toFixed(0)} m/s`, COL_HUD); ly += lh;

  // Periapsis altitude (orange, matching marker)
  const peInAtmo = peAlt < level.atmoHeight / 1000;
  const peHudCol = peInAtmo ? COL_DANGER : '#ffaa00';
  label(ctx, lx, ly, 'PeA', `${peAlt.toFixed(1)} km`, peHudCol); ly += lh;

  // Apoapsis altitude (blue, matching marker)
  const apStr = apAlt === Infinity ? 'ESCAPE' : `${apAlt.toFixed(1)} km`;
  label(ctx, lx, ly, 'ApA', apStr, apAlt === Infinity ? COL_WARN : '#00aaff'); ly += lh;

  // Eccentricity
  label(ctx, lx, ly, 'ECC', elem.e.toFixed(4), COL_HUD_DIM); ly += lh;

  // Fuel (delta-v remaining)
  const fuelPct = level.fuelDeltaV > 0 ? (s.fuel / level.fuelDeltaV * 100) : 0;
  const fuelCol = fuelPct < 20 ? COL_DANGER : fuelPct < 50 ? COL_WARN : COL_HUD;
  label(ctx, lx, ly, 'ΔV', `${s.fuel.toFixed(0)} m/s (${fuelPct.toFixed(0)}%)`, fuelCol); ly += lh;

  // Time warp
  const warpCol = s.timeWarp > 1 ? COL_WARN : COL_HUD_DIM;
  label(ctx, lx, ly, 'WARP', `${s.timeWarp}x`, warpCol); ly += lh;

  // --- Warnings ---
  let warnY = 30;
  if (peInAtmo && state === 'orbiting') {
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COL_WARN;
    if (Math.sin(Date.now() * 0.008) > -0.3) {
      ctx.fillText('⚠ PERIAPSIS IN ATMOSPHERE', W / 2, warnY);
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

  // --- Controls hint ---
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
