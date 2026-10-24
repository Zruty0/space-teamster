import { crateredWorldProfile } from './cratered-world-geometry';
import { beginDisc, finishDisc, trace } from './world-disc-primitives';

type Point = readonly [number, number];
interface CloudLayer {
  readonly full: readonly Point[];
  readonly coarse: readonly Point[];
  readonly color: string;
}
export interface AcheronCloudGeometry {
  readonly broad: readonly CloudLayer[];
  readonly wisps: readonly CloudLayer[];
}
export const ACHERON_CLOUD_SEED = crateredWorldProfile('cloud-world-v1:estella-ii').seed;
let cached: AcheronCloudGeometry | undefined;
const freezePoints = (points: readonly Point[]): readonly Point[] => Object.freeze(points.map(p => Object.freeze(p)));
function stream(layer: string): () => number {
  let state = crateredWorldProfile(`cloud-${layer}-v1:${ACHERON_CLOUD_SEED}`).seed;
  return () => { state = state * 16807 % 2147483647; return state / 2147483647; };
}

// Two broad sheared circulations, not parallel giant belts or visible terrain.
// This is a static illustration, not a wind field used by flight physics.
function flow(x: number, y: number): Point {
  for (const [cx, cy, radius, strength] of [[-.37,-.32,.74,2.0],[.37,.40,.70,-1.75]]) {
    const dx=x-cx,dy=y-cy,turn=strength*Math.exp(-(dx*dx+dy*dy)/(radius*radius));
    x=cx+dx*Math.cos(turn)-dy*Math.sin(turn);
    y=cy+dx*Math.sin(turn)+dy*Math.cos(turn);
  }
  const angle=-.32;
  return [x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];
}
function ribbon(offset:number,width:number,phase:number,color:string):CloudLayer {
  const edge=(side:number):Point[]=>Array.from({length:129},(_,i):Point=>{
    const x=-1.65+i/128*3.3;
    const center=offset+.10*Math.sin(x*1.8+phase)+.025*Math.sin(x*6-phase);
    const spread=width*(.80+.20*Math.sin(x*2.1+phase)**2);
    return flow(x,center+side*spread);
  });
  const upper=edge(-1),lower=edge(1);
  return Object.freeze({
    full:freezePoints([...upper,...[...lower].reverse()]),
    coarse:freezePoints([...upper.filter((_,i)=>i%4===0),...[...lower.filter((_,i)=>i%4===0)].reverse()]),
    color,
  });
}
/** One lazily built, deeply immutable cloud map. Independent broad/fine streams;
 * permanent body ID only, never names, time, visits or frame randomness. */
export function acheronCloudGeometry():AcheronCloudGeometry {
  if(cached)return cached;
  const broadRandom=stream('broad'),fineRandom=stream('wisps');
  const broad:CloudLayer[]=[],wisps:CloudLayer[]=[];
  const colors=[[238,215,168],[184,139,73],[244,226,190],[217,180,112],[234,207,153],[181,139,82],[240,218,177]];
  for(let i=0;i<7;i++){
    const offset=-1.10+i*.36+(broadRandom()-.5)*.06;
    const width=.12+broadRandom()*.08,phase=broadRandom()*Math.PI*2;
    // Filled feather layers, never crack-like contour strokes. Even where
    // these thin out, the opaque ochre cloud base hides all ground.
    for(const [extra,alpha]of [[.055,.18],[.025,.26],[0,.48]]){
      broad.push(ribbon(offset,width+extra,phase,`rgba(${colors[i].join(',')},${alpha})`));
    }
  }
  for(let i=0;i<6;i++)wisps.push(ribbon(-.95+i*.36+(fineRandom()-.5)*.1,.012+fineRandom()*.014,fineRandom()*Math.PI*2,'rgba(250,235,205,0.18)'));
  cached=Object.freeze({broad:Object.freeze(broad),wisps:Object.freeze(wisps)});
  return cached;
}

/** Opaque ochre/cream cloud globe at the existing disc radius. No claims about
 * unresolved cloud chemistry, cloud altitude, hidden terrain or new hazards.
 * The existing atmospheric envelope and site overlays remain orbital.ts work. */
export function drawAcheronDisc(ctx:CanvasRenderingContext2D,cx:number,cy:number,radius:number):void {
  if(!beginDisc(ctx,cx,cy,radius))return;
  const model=acheronCloudGeometry();
  ctx.fillStyle='#c7a165';ctx.fillRect(-1,-1,2,2);
  for(const layer of model.broad){trace(ctx,radius<60?layer.coarse:layer.full);ctx.fillStyle=layer.color;ctx.fill();}
  if(radius>=60)for(const layer of model.wisps){trace(ctx,layer.full);ctx.fillStyle=layer.color;ctx.fill();}
  finishDisc(ctx,radius,'#ddbd84');
}
