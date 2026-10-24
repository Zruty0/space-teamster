import { crateredWorldProfile } from './cratered-world-geometry';
import { beginDisc, finishDisc, trace } from './world-disc-primitives';

type Point = readonly [number, number];
interface GroundLayer {
  readonly full: readonly Point[];
  readonly coarse: readonly Point[];
  readonly color: string;
}
export interface KuzniaGeometry {
  readonly lowlands: readonly GroundLayer[];
  readonly highlands: readonly GroundLayer[];
  readonly slopes: readonly GroundLayer[];
  readonly polarGround: readonly GroundLayer[];
}
export const KUZNIA_SEED = crateredWorldProfile('cold-ground-v1:estella-vi').seed;
let cached: KuzniaGeometry | undefined;
function stream(part:string):()=>number {
  let state=crateredWorldProfile(`kuznia-${part}-v1:${KUZNIA_SEED}`).seed;
  return()=>{state=state*16807%2147483647;return state/2147483647;};
}
function ground(anchors:readonly Point[],phase:number,color:string):GroundLayer {
  const points:Point[]=[];
  for(let i=0;i<anchors.length;i++){
    const a=anchors[(i+anchors.length-1)%anchors.length],b=anchors[i],c=anchors[(i+1)%anchors.length],d=anchors[(i+2)%anchors.length];
    const length=Math.hypot(c[0]-b[0],c[1]-b[1]);
    for(let j=0;j<12;j++){
      const t=j/12;
      const coord=(k:0|1)=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t);
      const edge=Math.sin(t*Math.PI)*(.012*Math.sin(i*4+j*1.8+phase)+.005*Math.sin(j*3-phase));
      points.push(Object.freeze([coord(0)-(c[1]-b[1])/length*edge,coord(1)+(c[0]-b[0])/length*edge]));
    }
  }
  const full=Object.freeze(points);
  return Object.freeze({full,coarse:Object.freeze(full.filter((_,i)=>i%4===0)),color});
}
/** Static surface only. Pale polar ground is a tonal illustration, not a new
 * water/ice resource claim. No clouds, pollution, glowing industry or ice cracks.
 * Current flight terrain/atmosphere and all site angles remain separate data. */
export function kuzniaGeometry():KuzniaGeometry {
  if(cached)return cached;
  const low=stream('lowlands'),high=stream('highlands'),slope=stream('slopes'),polar=stream('polar-ground');
  const lowlands=[
    ground([[-1.18,-.74],[-.80,-.82],[-.53,-.64],[-.39,-.37],[-.54,-.12],[-.87,.05],[-1.18,-.07]],low()*6.28,'#465e67'),
    ground([[-.51,-.44],[-.13,-.62],[.17,-.50],[.40,-.30],[.28,.02],[-.03,.15],[-.32,.02]],low()*6.28,'#526b73'),
    ground([[.56,-.34],[.93,-.47],[1.17,-.19],[1.14,.16],[.83,.31],[.57,.16]],low()*6.28,'#4c626a'),
  ];
  const highlands=[
    // Main massif reaches Kopanka's unchanged -1.25 rim angle.
    ground([[.17,.18],[.49,.03],[.70,.17],[.86,.48],[1.08,.70],[.91,.97],[.50,1.12],[.18,1.03],[-.04,.75],[-.12,.43]],high()*6.28,'#788c96'),
    ground([[-.44,-1.14],[-.13,-1.09],[.20,-.86],[.47,-.75],[.57,-.50],[.37,-.37],[.13,-.53],[-.15,-.66],[-.45,-.88]],high()*6.28,'#728690'),
    ground([[-.41,.08],[-.15,.19],[-.24,.46],[-.50,.61],[-.71,.45],[-.63,.21]],high()*6.28,'#6e858e'),
  ];
  const slopes=[
    ground([[.27,.28],[.43,.20],[.57,.41],[.60,.69],[.81,.89],[.54,1.12],[.29,1.07],[.34,.75],[.17,.51]],slope()*6.28,'#91a1a7'),
    ground([[.51,.24],[.70,.35],[.86,.64],[.85,.87],[.67,.73],[.56,.48]],slope()*6.28,'#596d78'),
    ground([[.07,.43],[.23,.56],[.24,.83],[.11,.90],[-.02,.71]],slope()*6.28,'#647b87'),
    ground([[-.21,-1.09],[-.05,-1.08],[.19,-.85],[.39,-.67],[.35,-.54],[.13,-.68],[-.08,-.77]],slope()*6.28,'#88999f'),
    ground([[-.45,.16],[-.32,.23],[-.38,.41],[-.56,.50],[-.57,.34]],slope()*6.28,'#82969e'),
  ];
  const polarGround=[
    ground([[-1.14,.33],[-.91,.28],[-.66,.37],[-.48,.59],[-.65,.89],[-.99,1.03],[-1.21,.72]],polar()*6.28,'#84979d'),
    ground([[-1.07,.49],[-.83,.43],[-.62,.60],[-.77,.81],[-1.10,.83]],polar()*6.28,'#91a3a7'),
  ];
  cached=Object.freeze({lowlands:Object.freeze(lowlands),highlands:Object.freeze(highlands),slopes:Object.freeze(slopes),polarGround:Object.freeze(polarGround)});
  return cached;
}
export function drawKuzniaDisc(ctx:CanvasRenderingContext2D,cx:number,cy:number,radius:number):void {
  if(!beginDisc(ctx,cx,cy,radius))return;
  const model=kuzniaGeometry();
  ctx.fillStyle='#607b85';ctx.fillRect(-1,-1,2,2);
  for(const layers of [model.lowlands,model.highlands,model.slopes,model.polarGround])for(const item of layers){
    trace(ctx,radius<60?item.coarse:item.full);ctx.fillStyle=item.color;ctx.fill();
  }
  finishDisc(ctx,radius,'#9bb5bd');
}
