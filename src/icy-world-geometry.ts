import { crateredWorldGeometry, crateredWorldProfile, resolveCrateredWorldProfile, type CrateredWorldProfile, type CrateredWorldGeometry } from './cratered-world-geometry';

type Point = readonly [number, number];
export interface IcyWorldProfile extends CrateredWorldProfile {
  readonly frostCoverage?: number;
  readonly dirt?: number;
}
export interface IcyWorldGeometry {
  readonly surface: CrateredWorldGeometry;
  readonly frost: readonly (readonly Point[])[];
}
export const ICE_GEOMETRY_CACHE_LIMIT = 32;
const cache = new Map<string, IcyWorldGeometry>();
const bounded = (n: number | undefined, fallback: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? n! : fallback));
export function resolveIcyWorldProfile(profile: IcyWorldProfile): Readonly<Required<IcyWorldProfile>> {
  return { ...resolveCrateredWorldProfile(profile),
    frostCoverage: bounded(profile.frostCoverage, 0.65, 0, 1),
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

/** Independent frost/crater streams, normalized once. LOD only omits
 * detail; zoom, palette, time, dirt and contrast cannot move geology. */
export function icyWorldGeometry(profile: IcyWorldProfile): IcyWorldGeometry {
  const p = resolveIcyWorldProfile(profile);
  const key = `${p.seed}:${p.craterCount}:${p.craterScale}:${p.basinCoverage}:${p.basinLayout}:${p.frostCoverage}`;
  const prior = cache.get(key);
  if (prior) { cache.delete(key); cache.set(key, prior); return prior; }
  const frostRandom = stream(p.seed, 'frost');
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
  const geometry = Object.freeze({ surface: crateredWorldGeometry(p), frost: Object.freeze(frost) });
  if (cache.size >= ICE_GEOMETRY_CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(key, geometry);
  return geometry;
}
