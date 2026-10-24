import { crateredWorldGeometry, crateredWorldProfile, type Crater } from './cratered-world-geometry';
import { beginDisc, finishDisc, trace } from './world-disc-primitives';

type Point = readonly [number, number];
interface TerrainLayer {
  readonly full: readonly Point[];
  readonly coarse: readonly Point[];
  readonly color: string;
}
export interface HartwellGeometry {
  readonly uplands: readonly TerrainLayer[];
  readonly deposits: readonly TerrainLayer[];
  readonly erosion: readonly TerrainLayer[];
  readonly craters: readonly Crater[];
}
export const HARTWELL_SEED = crateredWorldProfile('dry-world-v1:estella-v').seed;
const IMPACT_PROFILE = crateredWorldProfile('hartwell-impacts-v1:estella-v', {
  craterCount: 14, craterScale: .45, basinCoverage: 0,
});
let cached: HartwellGeometry | undefined;
function stream(part: string): () => number {
  let state = crateredWorldProfile(`hartwell-${part}-v1:${HARTWELL_SEED}`).seed;
  return () => { state = state * 16807 % 2147483647; return state / 2147483647; };
}
function layer(points: readonly Point[], color: string): TerrainLayer {
  const full = Object.freeze(points.map(p => Object.freeze(p)));
  return Object.freeze({ full, coarse: Object.freeze(full.filter((_, i) => i % 4 === 0 || i === full.length - 1)), color });
}
function region(anchors: readonly Point[], phase: number, color: string): TerrainLayer {
  // Large authored plateau outlines, not reused lunar basins. Fine edge relief
  // is seeded once; both detail levels share these exact points.
  return layer(anchors.flatMap(([x,y],i) => {
    const [nx,ny] = anchors[(i+1)%anchors.length],length = Math.hypot(nx-x,ny-y);
    return Array.from({length:12},(_,j):Point => {
      const t=j/12,rough=Math.sin(t*Math.PI)*(.018*Math.sin(i*3+j*1.4+phase)+.008*Math.sin(j*3.1-phase));
      return [x+(nx-x)*t-(ny-y)/length*rough,y+(ny-y)*t+(nx-x)/length*rough];
    });
  }),color);
}
function valley(anchors: readonly Point[], width: number, color: string): TerrainLayer {
  const path:Point[]=[];
  // Catmull-Rom centreline; filled broad terraces rather than thin crack strokes.
  for(let i=0;i<anchors.length-1;i++){
    const a=anchors[Math.max(0,i-1)],b=anchors[i],c=anchors[i+1],d=anchors[Math.min(anchors.length-1,i+2)];
    for(let j=0;j<16;j++){
      const t=j/16;
      const coord=(k:0|1)=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t);
      path.push([coord(0),coord(1)]);
    }
  }
  path.push(anchors[anchors.length-1]);
  const side=(sign:number)=>path.map(([x,y],i):Point=>{
    const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],length=Math.max(1e-8,Math.hypot(b[0]-a[0],b[1]-a[1]));
    const t=i/(path.length-1),taper=Math.sin(Math.PI*t)**.65;
    const spread=taper*(width*(.68+.32*Math.sin(t*13+sign*.7)**2)+.003*Math.sin(i*1.3+sign));
    return [x-sign*(b[1]-a[1])/length*spread,y+sign*(b[0]-a[0])/length*spread];
  });
  return layer([...side(-1),...side(1).reverse()],color);
}
/** Art-only static surface. Dust is deposited material, not airborne haze or
 * weather. No cloud/storm layers, settlement scenery or changes to flight. */
export function hartwellGeometry(): HartwellGeometry {
  if(cached)return cached;
  const relief=stream('uplands'),sediment=stream('deposits');
  const uplands = [
    region([[-1.12,-.22],[-.96,-.65],[-.64,-.77],[-.39,-.57],[-.21,-.73],[.08,-.63],[.24,-.36],[.10,-.19],[.25,-.05],[.02,.12],[-.24,.08],[-.47,.28],[-.72,.14],[-.82,-.05]],relief()*6.28,'#805442'),
    region([[.25,.38],[.45,.30],[.61,.44],[.91,.34],[1.15,.52],[1.12,.92],[.80,1.12],[.55,.93],[.41,.78],[.12,.75]],relief()*6.28,'#85523d'),
    region([[.54,-.97],[.78,-.91],[.95,-.66],[.82,-.45],[.63,-.50],[.48,-.68]],relief()*6.28,'#925d44'),
    region([[-.83,-.47],[-.65,-.60],[-.46,-.42],[-.27,-.52],[.04,-.39],[-.10,-.16],[-.35,-.08],[-.51,.10],[-.66,-.03]],relief()*6.28,'#704d40'),
  ];
  const deposits = [
    region([[.19,-.13],[.68,-.37],[.96,-.20],[1.06,.05],[.76,.22],[.43,.09]],sediment()*6.28,'#bd8052'),
    region([[-1.04,.37],[-.66,.32],[-.43,.49],[-.13,.56],[-.22,.82],[-.67,.89],[-1.04,.72]],sediment()*6.28,'#b67a4e'),
    region([[-.49,-1.08],[-.03,-1.12],[.26,-.91],[.36,-.63],[.07,-.74],[-.16,-.82]],sediment()*6.28,'#bc7c51'),
  ];
  const main:Point[]=[[-.86,-.42],[-.59,-.30],[-.34,-.34],[-.08,-.19],[.20,-.16],[.53,-.02]];
  const tributary:Point[]=[[-.38,-.65],[-.33,-.50],[-.34,-.34]];
  const erosion:TerrainLayer[]=[];
  for(const [path,width] of [[main,.075],[tributary,.044]] as const){
    erosion.push(valley(path,width,'#a37753'),valley(path,width*.66,'#8b6148'),valley(path,width*.33,'#76503e'));
  }
  cached=Object.freeze({uplands:Object.freeze(uplands),deposits:Object.freeze(deposits),erosion:Object.freeze(erosion),craters:crateredWorldGeometry(IMPACT_PROFILE).craters});
  return cached;
}
export function drawHartwellDisc(ctx:CanvasRenderingContext2D,cx:number,cy:number,radius:number):void {
  if(!beginDisc(ctx,cx,cy,radius))return;
  const model=hartwellGeometry();
  ctx.fillStyle='#aa6946';ctx.fillRect(-1,-1,2,2);
  for(const layers of [model.uplands,model.deposits,model.erosion])for(const item of layers){
    trace(ctx,radius<60?item.coarse:item.full);ctx.fillStyle=item.color;ctx.fill();
  }
  const count=radius<14?0:radius<60?3:model.craters.length;
  for(const {x,y,r,squash,angle} of model.craters.slice(0,count)){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(squash,1);
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle='rgba(72,43,31,0.19)';ctx.fill();
    ctx.beginPath();ctx.arc(0,0,r*.88,.25-angle,2.6-angle);
    ctx.strokeStyle='rgba(221,161,113,0.30)';ctx.lineWidth=r*.16;ctx.stroke();
    ctx.restore();
  }
  finishDisc(ctx,radius,'#c38e65');
}
