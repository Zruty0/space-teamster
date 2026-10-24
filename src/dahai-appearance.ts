import { crateredWorldProfile } from './cratered-world-geometry';
import { beginDisc, finishDisc, trace } from './world-disc-primitives';

type Point = readonly [number, number];
interface Layer {
  readonly full: readonly Point[];
  readonly coarse: readonly Point[];
  readonly color: string;
}
export interface DahaiGeometry {
  readonly water: readonly Layer[];
  readonly ice: readonly Layer[];
  readonly clouds: readonly Layer[];
  readonly storms: readonly Layer[];
  readonly wisps: readonly Layer[];
}
export const DAHAI_SEED = crateredWorldProfile('ocean-world-v1:estella-iv').seed;
// Chart composition only, not axial tilt/latitude or a rotation of site markers.
// Bingjie's existing angle -2 lies on the small sea-ice margin. The opposite
// rim stays open ocean under storm clouds, consistent with Zhulong's home port.
export const DAHAI_CHART_TILT = 2 - Math.PI / 2;
let cached: DahaiGeometry | undefined;
function stream(part:string):()=>number {
  let state=crateredWorldProfile(`dahai-${part}-v1:${DAHAI_SEED}`).seed;
  return()=>{state=state*16807%2147483647;return state/2147483647;};
}
function orient([x,y]:Point):Point {
  const c=Math.cos(DAHAI_CHART_TILT),s=Math.sin(DAHAI_CHART_TILT);
  return Object.freeze([x*c-y*s,x*s+y*c]);
}
function layer(points:readonly Point[],color:string):Layer {
  const full=Object.freeze(points.map(orient));
  return Object.freeze({full,coarse:Object.freeze(full.filter((_,i)=>i%4===0||i>=full.length-4)),color});
}
function patch(x:number,y:number,rx:number,ry:number,phase:number,color:string):Layer {
  return layer(Array.from({length:64},(_,i):Point=>{
    const a=i/64*Math.PI*2;
    const edge=1+.10*Math.sin(5*a+phase)+.055*Math.sin(9*a-phase);
    return[x+Math.cos(a)*rx*edge,y+Math.sin(a)*ry*edge+.025*Math.sin((Math.cos(a)*rx+x)*5+phase)];
  }),color);
}
/** Permanent, bounded one-world cache. Water, cloud and storm streams are
 * independent; detail LOD never regenerates the map. No land/city geometry. */
export function dahaiGeometry():DahaiGeometry {
  if(cached)return cached;
  const ocean=stream('water'),cloud=stream('cloud'),storm=stream('storm'),fine=stream('wisps');
  const water:Layer[]=[],ice:Layer[]=[],clouds:Layer[]=[],storms:Layer[]=[],wisps:Layer[]=[];
  for(let i=0;i<6;i++)water.push(patch(-.85+ocean()*1.7,-.8+ocean()*1.6,.45+ocean()*.35,.14+ocean()*.12,ocean()*6.28,i%2?'rgba(28,141,179,0.18)':'rgba(13,55,118,0.18)'));
  for(const [edge,color]of [[.86,'#b5d5df'],[.93,'#d1e5e9']] as const){
    const boundary:Point[]=Array.from({length:65},(_,i):Point=>{const x=-1.3+i/64*2.6;return[x,edge+.014*Math.sin(x*9)+.008*Math.sin(x*19)];});
    // Four closing points also belong to the exact coarse subset.
    ice.push(layer([...boundary,[1.3,1.3],[.5,1.3],[-.5,1.3],[-1.3,1.3]],color));
  }
  // Clear water between decks, including the existing Fuyuan/Jiuyuan rim.
  // These are illustrative calm bands, not a new simulated weather field.
  for(const belt of [-.96,.12,.56])for(let i=0;i<7;i++){
    const x=-1.08+i*.35+(cloud()-.5)*.12,y=belt+.045*Math.sin(x*4)+(cloud()-.5)*.055;
    const rx=.16+cloud()*.12,ry=.04+cloud()*.045,phase=cloud()*Math.PI*2;
    clouds.push(patch(x,y,rx*1.12,ry*1.4,phase,'rgba(204,229,242,0.24)'));
    clouds.push(patch(x,y,rx,ry,phase,`rgba(235,245,250,${.60+cloud()*.22})`));
  }
  for(const [x,y,r,hand]of [[.40,-.69,.24,1],[-.30,.34,.29,-1]]){
    const phase=storm()*Math.PI*2;
    for(let arm=0;arm<3;arm++){
      const edge=(side:number):Point[]=>Array.from({length:65},(_,i):Point=>{
        const t=i/64,a=phase+arm*Math.PI*2/3+hand*t*4.8+.055*Math.sin(t*19+phase+arm);
        const distance=r*(.12+t*(.80+arm*.04));
        const width=.032*Math.sin(Math.PI*t)**.65*(.65+.35*Math.sin(t*24+phase+arm*.8)**2);
        return[x+Math.cos(a)*(distance+side*width),y+Math.sin(a)*(distance+side*width)*.72];
      });
      const outer=edge(1),inner=edge(-1);
      // Keep both edge endpoints in the coarse version.
      storms.push(layer([...outer,...inner.slice(0,-1).reverse()], 'rgba(242,250,252,0.80)'));
    }
  }
  for(let i=0;i<30;i++){
    const belt=[-.96,.12,.56][i%3],x=-1.1+fine()*2.2;
    wisps.push(patch(x,belt+.06*Math.sin(x*4)+(fine()-.5)*.13,.055+fine()*.10,.008+fine()*.014,fine()*6.28,'rgba(255,255,255,0.40)'));
  }
  cached=Object.freeze({water:Object.freeze(water),ice:Object.freeze(ice),clouds:Object.freeze(clouds),storms:Object.freeze(storms),wisps:Object.freeze(wisps)});
  return cached;
}
export function drawDahaiDisc(ctx:CanvasRenderingContext2D,cx:number,cy:number,radius:number):void {
  if(!beginDisc(ctx,cx,cy,radius))return;
  const model=dahaiGeometry();
  ctx.fillStyle='#176da5';ctx.fillRect(-1,-1,2,2);
  const paint=(layers:readonly Layer[])=>{for(const item of layers){trace(ctx,radius<60?item.coarse:item.full);ctx.fillStyle=item.color;ctx.fill();}};
  paint(model.water);paint(model.ice);paint(model.clouds);paint(model.storms);
  if(radius>=60)paint(model.wisps);
  finishDisc(ctx,radius,'#75b9db');
}
