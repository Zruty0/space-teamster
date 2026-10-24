import { crateredWorldProfile } from './cratered-world-geometry';
import type { WorldTint } from './world-disc-primitives';
type Point = readonly [number, number];
export interface GiantStorm {
  readonly x: number; readonly y: number; readonly rx: number; readonly ry: number;
  readonly angle: number; readonly light?: boolean;
}
export interface GasGiantProfile {
  readonly seed: number;
  readonly edges: readonly number[];
  readonly colors: readonly number[];
  readonly palette: readonly WorldTint[];
  readonly stormColors: readonly [WorldTint, WorldTint];
  readonly storms: readonly GiantStorm[];
  readonly turbulence: number;
  readonly filamentCount: number;
  readonly filamentOpacity: number;
}
interface Ribbon { readonly full: readonly Point[]; readonly coarse: readonly Point[] }
export interface GasGiantGeometry {
  readonly bands: readonly Ribbon[];
  readonly filaments: readonly (readonly Point[])[];
  readonly storms: readonly { readonly outline: readonly Point[]; readonly swirls: readonly (readonly Point[])[] }[];
}
export const GIANT_GEOMETRY_CACHE_LIMIT = 16;
const cache = new Map<string, GasGiantGeometry>();
const freezePoints = (points: readonly Point[]): readonly Point[] => Object.freeze(points.map(p => Object.freeze(p)));

/** Permanent ID hash only; the shared hash utility does not generate craters. */
export function defineGasGiantProfile(id: string, spec: Omit<GasGiantProfile, 'seed'>): GasGiantProfile {
  const validColor = (c: WorldTint) => c.length === 3 && c.every(n => Number.isFinite(n) && n >= 0 && n <= 255);
  if (spec.edges.length < 1 || spec.edges.length > 30 || spec.edges.some((y,i) => !Number.isFinite(y) || y <= -1 || y >= 1 || (i > 0 && y - spec.edges[i-1] < 0.025))
    || spec.colors.length !== spec.edges.length + 1 || !spec.palette.length || !spec.palette.every(validColor)
    || spec.colors.some(i => !Number.isInteger(i) || i < 0 || i >= spec.palette.length)
    || spec.stormColors.length !== 2 || !spec.stormColors.every(validColor)
    || !Number.isFinite(spec.turbulence) || spec.turbulence < 0 || spec.turbulence > 0.1
    || !Number.isInteger(spec.filamentCount) || spec.filamentCount < 0 || spec.filamentCount > 24
    || !Number.isFinite(spec.filamentOpacity) || spec.filamentOpacity < 0 || spec.filamentOpacity > 0.4
    || spec.storms.length > 8 || spec.storms.some(s => ![s.x,s.y,s.rx,s.ry,s.angle].every(Number.isFinite) || Math.hypot(s.x,s.y) > 0.85 || s.rx <= 0 || s.rx > 0.35 || s.ry <= 0 || s.ry > 0.2)) throw Error('Invalid gas-giant artwork profile');
  const freezeColor = (c: WorldTint): WorldTint => Object.freeze([...c]) as WorldTint;
  return Object.freeze({ ...spec, seed: crateredWorldProfile(`gas-giant-v1:${id}`).seed,
    edges: Object.freeze([...spec.edges]), colors: Object.freeze([...spec.colors]),
    palette: Object.freeze(spec.palette.map(freezeColor)),
    stormColors: Object.freeze([freezeColor(spec.stormColors[0]),freezeColor(spec.stormColors[1])] as const),
    storms: Object.freeze(spec.storms.map(s => Object.freeze({...s}))),
  });
}
function stream(seed: number, layer: string): () => number {
  let state = crateredWorldProfile(`giant-${layer}-v1:${seed}`).seed;
  return () => { state = state * 16807 % 2147483647; return state / 2147483647; };
}
/** Static cloud map, not simulated winds. Independent streams preserve existing
 * bands/storms when filament detail changes. Color/zoom never move the features. */
export function gasGiantGeometry(p: GasGiantProfile): GasGiantGeometry {
  const key = JSON.stringify([p.seed,p.edges,p.turbulence,p.filamentCount,p.storms.map(s=>[s.x,s.y,s.rx,s.ry,s.angle])]);
  const prior = cache.get(key);
  if (prior) { cache.delete(key); cache.set(key,prior); return prior; }
  const bandRandom=stream(p.seed,'bands'), detailRandom=stream(p.seed,'filaments'), stormRandom=stream(p.seed,'storms');
  const latitudes=[-1.15,...p.edges,1.15];
  const edges=latitudes.map((latitude,index): readonly Point[] => {
    const phase=bandRandom()*Math.PI*2, frequency=5+bandRandom()*5;
    const gap=Math.min(latitude-(latitudes[index-1]??-2), (latitudes[index+1]??2)-latitude);
    const amplitude=index===0||index===latitudes.length-1?0:Math.min(p.turbulence,gap*0.24);
    return freezePoints(Array.from({length:49},(_,i): Point => {
      const x=-1.1+i/48*2.2;
      const wave=Math.sin(x*frequency+phase)*0.65+Math.sin(x*frequency*2.7-phase)*0.22;
      return [x,latitude+0.045*(x*x-0.4)+amplitude*wave];
    }));
  });
  const bands=edges.slice(0,-1).map((edge,i) => Object.freeze({
    full: freezePoints([...edge,...[...edges[i+1]].reverse()]),
    coarse: freezePoints([...edge.filter((_,j)=>j%4===0),...[...edges[i+1].filter((_,j)=>j%4===0)].reverse()]),
  }));
  const filaments=Array.from({length:p.filamentCount},()=>{
    const index=Math.floor(detailRandom()*bands.length), fraction=0.15+detailRandom()*0.7, width=0.02+detailRandom()*0.05;
    const side=(offset:number)=>edges[index].map(([x,y],j):Point=>[x,y+(edges[index+1][j][1]-y)*(fraction+offset)]);
    return freezePoints([...side(-width),...side(width).reverse()]);
  });
  const storms=p.storms.map(s=>{
    const phase=stormRandom()*Math.PI*2;
    const project=(x:number,y:number):Point=>[s.x+x*s.rx*Math.cos(s.angle)-y*s.ry*Math.sin(s.angle),s.y+x*s.rx*Math.sin(s.angle)+y*s.ry*Math.cos(s.angle)];
    const outline=freezePoints(Array.from({length:64},(_,i):Point=>{
      const a=i/64*Math.PI*2, r=1+0.035*Math.sin(a*3+phase)+0.025*Math.sin(a*5-phase);
      return project(Math.cos(a)*r,Math.sin(a)*r);
    }));
    const swirls=Object.freeze([0,Math.PI].map(start=>{
      const side=(sign:number)=>Array.from({length:40},(_,i):Point=>{
        const t=i/39, angle=start+phase+t*Math.PI*1.65;
        const radius=0.84-t*0.7+sign*0.055*Math.sin(t*Math.PI);
        return project(Math.cos(angle)*radius,Math.sin(angle)*radius);
      });
      return freezePoints([...side(-1),...side(1).reverse()]);
    }));
    return Object.freeze({outline,swirls});
  });
  const model=Object.freeze({bands:Object.freeze(bands),filaments:Object.freeze(filaments),storms:Object.freeze(storms)});
  if(cache.size>=GIANT_GEOMETRY_CACHE_LIMIT)cache.delete(cache.keys().next().value!);
  cache.set(key,model);return model;
}
