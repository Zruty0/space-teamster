import { crateredWorldGeometry, crateredWorldProfile, resolveCrateredWorldProfile, type CrateredWorldProfile, type CrateredWorldGeometry } from './cratered-world-geometry';

type Point = readonly [number, number];
export interface IcyWorldProfile extends CrateredWorldProfile {
  readonly frostCoverage?: number;
  readonly fractureCount?: number;
  readonly dirt?: number;
}
export interface IcyWorldGeometry {
  readonly surface: CrateredWorldGeometry;
  readonly frost: readonly (readonly Point[])[];
  readonly fractures: readonly { readonly main: readonly Point[]; readonly branch: readonly Point[] }[];
}
export const ICE_GEOMETRY_CACHE_LIMIT = 32;
const cache = new Map<string, IcyWorldGeometry>();
const bounded = (n: number | undefined, fallback: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? n! : fallback));
export function resolveIcyWorldProfile(profile: IcyWorldProfile): Readonly<Required<IcyWorldProfile>> {
  return { ...resolveCrateredWorldProfile(profile),
    frostCoverage: bounded(profile.frostCoverage, 0.65, 0, 1),
    fractureCount: Math.round(bounded(profile.fractureCount, 7, 0, 16)),
    dirt: bounded(profile.dirt, 0.15, 0, 1),
  };
}
export function icyWorldProfile(bodyId: string, overrides: Partial<IcyWorldProfile> = {}): Readonly<Required<IcyWorldProfile>> {
  return Object.freeze(resolveIcyWorldProfile({ ...overrides, ...crateredWorldProfile(bodyId, { craterCount: 30, craterScale: 0.65, basinCoverage: 0.8, ...overrides }) }));
}
function stream(seed: number, layer: string): () => number {
  let state = crateredWorldProfile(`ice-${layer}-v1:${seed}`).seed;
  return () => { state = state * 16807 % 2147483647; return state / 2147483647; };
}
const freezePoints = (points: Point[]): readonly Point[] => Object.freeze(points.map(p => Object.freeze(p)));

/** Independent frost/fracture/crater streams, normalized once. LOD only omits
 * detail; zoom, palette, time, dirt and contrast cannot move geology. */
export function icyWorldGeometry(profile: IcyWorldProfile): IcyWorldGeometry {
  const p = resolveIcyWorldProfile(profile);
  const key = `${p.seed}:${p.craterCount}:${p.craterScale}:${p.basinCoverage}:${p.basinLayout}:${p.frostCoverage}:${p.fractureCount}`;
  const prior = cache.get(key);
  if (prior) { cache.delete(key); cache.set(key, prior); return prior; }
  const frostRandom = stream(p.seed, 'frost'), fractureRandom = stream(p.seed, 'fractures');
  const frost: (readonly Point[])[] = [];
  if (p.frostCoverage > 0) for (let i = 0; i < 8; i++) {
    const x = frostRandom() * 1.8 - 0.9, y = frostRandom() * 1.8 - 0.9;
    const rx = (0.36 + frostRandom() * 0.43) * Math.sqrt(p.frostCoverage);
    const ry = (0.24 + frostRandom() * 0.38) * Math.sqrt(p.frostCoverage);
    const phase = frostRandom() * Math.PI * 2, rotation = frostRandom() * Math.PI * 2;
    frost.push(freezePoints(Array.from({ length: 48 }, (_, j): Point => {
      const a = j / 48 * Math.PI * 2;
      const edge = 1 + 0.17 * Math.sin(a * 3 + phase) + 0.08 * Math.sin(a * 8 - phase);
      const px = rx * Math.cos(a) * edge, py = ry * Math.sin(a) * edge;
      return [x + px * Math.cos(rotation) - py * Math.sin(rotation), y + px * Math.sin(rotation) + py * Math.cos(rotation)];
    })));
  }
  const fractures: IcyWorldGeometry['fractures'][number][] = [];
  for (let i = 0; i < p.fractureCount; i++) {
    const rotation = fractureRandom() * Math.PI * 2, offset = fractureRandom() * 1.4 - 0.7;
    const phase = fractureRandom() * Math.PI * 2, bend = 0.08 + fractureRandom() * 0.18;
    const length = 1.7 + fractureRandom() * 0.6;
    const map = (x: number, y: number): Point => [x * Math.cos(rotation) - y * Math.sin(rotation), x * Math.sin(rotation) + y * Math.cos(rotation)];
    const main = freezePoints(Array.from({ length: 25 }, (_, j): Point => {
      const x = (j / 24 - 0.5) * length;
      return map(x, offset + bend * Math.sin(x * 3 + phase) + 0.018 * Math.sin(x * 23 + phase));
    }));
    const branchStart = 8 + Math.floor(fractureRandom() * 9), side = fractureRandom() < 0.5 ? -1 : 1;
    const [sx, sy] = main[branchStart];
    const branch = freezePoints(Array.from({ length: 9 }, (_, j): Point => {
      const t = j / 8, [dx, dy] = map(t * 0.25, side * t * 0.3 + Math.sin(t * 12) * 0.012);
      return [sx + dx, sy + dy];
    }));
    fractures.push(Object.freeze({ main, branch }));
  }
  const geometry = Object.freeze({ surface: crateredWorldGeometry(p), frost: Object.freeze(frost), fractures: Object.freeze(fractures) });
  if (cache.size >= ICE_GEOMETRY_CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(key, geometry);
  return geometry;
}
