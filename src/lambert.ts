import { bodyById } from './world';

function stumpffC(z: number): number {
  if (z > 1e-6) return (1 - Math.cos(Math.sqrt(z))) / z;
  if (z < -1e-6) return (Math.cosh(Math.sqrt(-z)) - 1) / -z;
  return 0.5 - z / 24 + z * z / 720;
}

function stumpffS(z: number): number {
  if (z > 1e-6) {
    const r = Math.sqrt(z);
    return (r - Math.sin(r)) / (r * r * r);
  }
  if (z < -1e-6) {
    const r = Math.sqrt(-z);
    return (Math.sinh(r) - r) / (r * r * r);
  }
  return 1 / 6 - z / 120 + z * z / 5040;
}

export function circularBodyStateInFrame(bodyId: string, parentBodyId: string, time: number): { x: number; y: number; vx: number; vy: number } | null {
  const body = bodyById(bodyId);
  const parent = bodyById(parentBodyId);
  if (!body.orbit || body.orbit.parentBodyId !== parent.id) return null;
  const omega = body.orbit.orbitSense * Math.sqrt(parent.gm / (body.orbit.radius ** 3));
  const angle = body.orbit.epochAngle + omega * (time - body.orbit.epochTime);
  const speed = Math.sqrt(parent.gm / body.orbit.radius);
  return {
    x: body.orbit.radius * Math.cos(angle),
    y: body.orbit.radius * Math.sin(angle),
    vx: -body.orbit.orbitSense * speed * Math.sin(angle),
    vy: body.orbit.orbitSense * speed * Math.cos(angle),
  };
}

export function lambertVelocity(
  r1: { x: number; y: number },
  r2: { x: number; y: number },
  tof: number,
  gm: number,
): { v1x: number; v1y: number; v2x: number; v2y: number } | null {
  const r1m = Math.hypot(r1.x, r1.y);
  const r2m = Math.hypot(r2.x, r2.y);
  const cosDt = Math.max(-1, Math.min(1, (r1.x * r2.x + r1.y * r2.y) / Math.max(1, r1m * r2m)));
  let sinDt = (r1.x * r2.y - r1.y * r2.x) / Math.max(1, r1m * r2m);
  if (sinDt < 0) sinDt = -sinDt;
  if (Math.abs(sinDt) < 1e-5 || Math.abs(1 - cosDt) < 1e-8) return null;
  const A = sinDt * Math.sqrt((r1m * r2m) / (1 - cosDt));
  if (!Number.isFinite(A) || Math.abs(A) < 1e-6) return null;

  const tofForZ = (z: number): { t: number; y: number } | null => {
    const c = stumpffC(z);
    const s = stumpffS(z);
    if (c <= 0) return null;
    const y = r1m + r2m + A * (z * s - 1) / Math.sqrt(c);
    if (y <= 0) return null;
    const x = Math.sqrt(y / c);
    const t = (x * x * x * s + A * Math.sqrt(y)) / Math.sqrt(gm);
    return Number.isFinite(t) ? { t, y } : null;
  };

  let bestZ = 0;
  let bestErr = Infinity;
  let prevZ = -20;
  let prev = tofForZ(prevZ);
  let bracket: { lo: number; hi: number } | null = null;
  for (let i = 1; i <= 240; i++) {
    const z = -20 + (40 * i) / 240;
    const cur = tofForZ(z);
    if (cur) {
      const err = Math.abs(cur.t - tof);
      if (err < bestErr) { bestErr = err; bestZ = z; }
      if (prev && (prev.t - tof) * (cur.t - tof) <= 0) {
        bracket = { lo: prevZ, hi: z };
        break;
      }
    }
    prevZ = z;
    prev = cur;
  }
  if (bracket) {
    for (let i = 0; i < 36; i++) {
      const mid = (bracket.lo + bracket.hi) * 0.5;
      const loVal = tofForZ(bracket.lo);
      const midVal = tofForZ(mid);
      if (!loVal || !midVal) break;
      if ((loVal.t - tof) * (midVal.t - tof) <= 0) bracket.hi = mid;
      else bracket.lo = mid;
    }
    bestZ = (bracket.lo + bracket.hi) * 0.5;
  }

  const solved = tofForZ(bestZ);
  if (!solved || bestErr > tof * 0.35) return null;
  const f = 1 - solved.y / r1m;
  const g = A * Math.sqrt(solved.y / gm);
  const gdot = 1 - solved.y / r2m;
  if (Math.abs(g) < 1e-9) return null;
  return {
    v1x: (r2.x - f * r1.x) / g,
    v1y: (r2.y - f * r1.y) / g,
    v2x: (gdot * r2.x - r1.x) / g,
    v2y: (gdot * r2.y - r1.y) / g,
  };
}

export function dynamicLambertDepartureVInf(
  sourceBodyId: string,
  destinationBodyId: string,
  parentBodyId: string,
  departureTime: number,
  transferTime: number,
): { angle: number; vInf: number } | null {
  const parent = bodyById(parentBodyId);
  const source = circularBodyStateInFrame(sourceBodyId, parentBodyId, departureTime);
  const destination = circularBodyStateInFrame(destinationBodyId, parentBodyId, departureTime + transferTime);
  if (!source || !destination) return null;
  const lambert = lambertVelocity(source, destination, transferTime, parent.gm);
  if (!lambert) return null;
  const vx = lambert.v1x - source.vx;
  const vy = lambert.v1y - source.vy;
  const vInf = Math.hypot(vx, vy);
  if (!Number.isFinite(vInf)) return null;
  return { angle: Math.atan2(vy, vx), vInf };
}
