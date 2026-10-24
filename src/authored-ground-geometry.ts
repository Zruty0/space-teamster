// Artwork helpers for the three final authored moons. No catalog/clock/save
// dependencies. Existing approved worlds retain their original generators.
import { crateredWorldProfile } from './cratered-world-geometry';
export type GroundPoint = readonly [number, number];
export interface GroundLayer {
  readonly full: readonly GroundPoint[];
  readonly coarse: readonly GroundPoint[];
  readonly color: string;
}
export function groundStream(seed: number, part: string): () => number {
  let state = crateredWorldProfile(`authored-ground-v1:${seed}:${part}`).seed;
  return () => { state = state * 16807 % 2147483647; return state / 2147483647; };
}
export function groundLayer(points: readonly GroundPoint[], color: string): GroundLayer {
  const full = Object.freeze(points.map(p => Object.freeze(p)));
  return Object.freeze({ full, coarse: Object.freeze(full.filter((_, i) => i % 4 === 0)), color });
}
/** Closed, smooth landform with fixed fine edge relief. Coarse LOD retains the
 * authored anchors and exact full-model points, never generates fresh terrain. */
export function groundRegion(anchors: readonly GroundPoint[], phase: number, color: string): GroundLayer {
  const points: GroundPoint[] = [];
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[(i + anchors.length - 1) % anchors.length], b = anchors[i];
    const c = anchors[(i + 1) % anchors.length], d = anchors[(i + 2) % anchors.length];
    const length = Math.max(1e-8, Math.hypot(c[0] - b[0], c[1] - b[1]));
    for (let j = 0; j < 12; j++) {
      const t = j / 12;
      const coord = (k: 0 | 1) => .5 * (2*b[k] + (-a[k]+c[k])*t + (2*a[k]-5*b[k]+4*c[k]-d[k])*t*t + (-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t);
      const edge = Math.sin(t*Math.PI) * (.010*Math.sin(i*4+j*1.8+phase)+.004*Math.sin(j*3-phase));
      points.push([coord(0)-(c[1]-b[1])/length*edge, coord(1)+(c[0]-b[0])/length*edge]);
    }
  }
  return groundLayer(points, color);
}
/** Irregular volcanic depression, not a circular impact symbol. */
export function groundOval(x: number, y: number, rx: number, ry: number, angle: number, phase: number, color: string): GroundLayer {
  return groundLayer(Array.from({length:96}, (_,i): GroundPoint => {
    const a=i/96*Math.PI*2, r=1+.10*Math.sin(3*a+phase)+.045*Math.sin(7*a-phase);
    const px=Math.cos(a)*rx*r, py=Math.sin(a)*ry*r;
    return [x+px*Math.cos(angle)-py*Math.sin(angle), y+px*Math.sin(angle)+py*Math.cos(angle)];
  }), color);
}
