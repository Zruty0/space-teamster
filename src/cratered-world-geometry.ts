// Pure artwork data. No world catalog, clock, display name, save state or RNG
// shared with the simulation. IDs/profile values alone determine the geometry.
type Point = readonly [number, number];
export interface CrateredWorldProfile {
  readonly seed: number;
  readonly craterCount?: number;
  readonly craterScale?: number;
  readonly basinCoverage?: number;
  readonly reliefContrast?: number;
  readonly basinLayout?: 'seeded' | 'celeste';
}
export interface Crater {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly squash: number;
  readonly angle: number;
}
export interface CrateredWorldGeometry {
  readonly craters: readonly Crater[];
  readonly basins: readonly (readonly Point[])[];
}
const MODULUS = 2147483647;
const TAU = Math.PI * 2;
export const CRATER_GEOMETRY_CACHE_LIMIT = 64;
export const CELESTE_CRATER_PROFILE: CrateredWorldProfile = Object.freeze({ seed: 41873, basinLayout: 'celeste' });
const cache = new Map<string, CrateredWorldGeometry>();

function bounded(value: number | undefined, fallback: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value !== undefined && Number.isFinite(value) ? value : fallback));
}
function normalizedSeed(seed: number): number {
  return Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) % MODULUS || 1 : 41873;
}
function seedFromText(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % (MODULUS - 1) + 1;
}
function randomStream(seed: number): () => number {
  let state = seed;
  return () => { state = state * 16807 % MODULUS; return state / MODULUS; };
}

/** Keep the v1 mapping stable across renames/reloads. Celeste's accepted layout
 * predates per-body seeds and remains an explicit compatibility baseline. */
export function crateredWorldProfile(bodyId: string, overrides: Partial<CrateredWorldProfile> = {}): Readonly<Required<CrateredWorldProfile>> {
  const seed = normalizedSeed(overrides.seed ?? (bodyId === 'estella-iiia' ? 41873 : seedFromText(`crater-world-v1:${bodyId}`)));
  return Object.freeze(resolveCrateredWorldProfile({
    ...overrides, seed,
    basinLayout: overrides.basinLayout ?? (bodyId === 'estella-iiia' && seed === 41873 ? 'celeste' : 'seeded'),
  }));
}

/** Bound artist controls and recover safely from nonfinite preview inputs. */
export function resolveCrateredWorldProfile(profile: CrateredWorldProfile): Readonly<Required<CrateredWorldProfile>> {
  return {
    seed: normalizedSeed(profile.seed),
    craterCount: Math.round(bounded(profile.craterCount, 58, 0, 160)),
    craterScale: bounded(profile.craterScale, 1, 0.35, 1.8),
    basinCoverage: bounded(profile.basinCoverage, 1, 0, 1.75),
    reliefContrast: bounded(profile.reliefContrast, 1, 0, 2),
    basinLayout: profile.basinLayout === 'celeste' ? 'celeste' : 'seeded',
  };
}

function blob(x: number, y: number, rx: number, ry: number, phase: number): readonly Point[] {
  return Array.from({ length: 56 }, (_, i): Point => {
    const a = i / 56 * TAU;
    const r = 1 + 0.12 * Math.sin(a * 3 + phase) + 0.08 * Math.sin(a * 7 - phase);
    return [x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r];
  });
}
function freezePoints(points: readonly Point[]): readonly Point[] {
  return Object.freeze(points.map(point => Object.freeze(point)));
}
function basinsFor(profile: Readonly<Required<CrateredWorldProfile>>): readonly (readonly Point[])[] {
  if (profile.basinCoverage === 0) return Object.freeze([]);
  const scale = Math.sqrt(profile.basinCoverage);
  if (profile.basinLayout === 'celeste') {
    return Object.freeze([
      freezePoints(blob(-0.35, -0.26, 0.43 * scale, 0.28 * scale, 2)),
      freezePoints(blob(0.27, 0.22, 0.34 * scale, 0.43 * scale, 4)),
    ]);
  }
  // Independent stream: adding craters does not shuffle the large basins.
  const random = randomStream(seedFromText(`basins-v1:${profile.seed}`));
  const count = 2 + Math.floor(random() * 3);
  const centers: Point[] = [];
  const basins: (readonly Point[])[] = [];
  for (let i = 0; i < count; i++) {
    let cx = 0, cy = 0;
    for (let attempt = 0; attempt < 24; attempt++) {
      const angle = random() * TAU, distance = 0.15 + random() * 0.50;
      cx = Math.cos(angle) * distance; cy = Math.sin(angle) * distance;
      if (centers.every(([x,y]) => Math.hypot(x - cx, y - cy) > 0.38)) break;
    }
    centers.push([cx,cy]);
    const rx = (0.19 + random() * 0.19) * scale, ry = (0.14 + random() * 0.16) * scale;
    const phase = random() * TAU, rotation = random() * TAU;
    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    basins.push(freezePoints(blob(0, 0, rx, ry, phase).map(([x,y]): Point => [cx + x * cos - y * sin, cy + x * sin + y * cos])));
  }
  return Object.freeze(basins);
}

/** Bounded LRU: geometry is reused across palettes, contrast and zoom levels.
 * Eviction changes allocation only; rebuilding yields identical coordinates. */
export function crateredWorldGeometry(profile: CrateredWorldProfile = CELESTE_CRATER_PROFILE): CrateredWorldGeometry {
  const p = resolveCrateredWorldProfile(profile);
  const key = `${p.seed}:${p.craterCount}:${p.craterScale}:${p.basinCoverage}:${p.basinLayout}`;
  const cached = cache.get(key);
  if (cached) { cache.delete(key); cache.set(key, cached); return cached; }
  const random = randomStream(p.seed);
  const craters: Crater[] = [];
  for (let i = 0; i < p.craterCount; i++) {
    const a = random() * TAU, d = Math.sqrt(random()) * 0.98;
    // Preserve Celeste's exact v1 random sequence and arithmetic at scale=1.
    craters.push(Object.freeze({
      x: Math.cos(a) * d, y: Math.sin(a) * d,
      r: (i < 9 ? 0.065 + random() * 0.065 : 0.014 + random() * 0.037) * p.craterScale,
      squash: Math.max(0.24, Math.sqrt(1 - d * d)), angle: a,
    }));
  }
  const geometry = Object.freeze({ craters: Object.freeze(craters), basins: basinsFor(p) });
  if (cache.size >= CRATER_GEOMETRY_CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(key, geometry);
  return geometry;
}
