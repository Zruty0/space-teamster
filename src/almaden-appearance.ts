import { crateredWorldProfile } from './cratered-world-geometry';
import { groundRegion, groundOval, groundStream, type GroundLayer } from './authored-ground-geometry';
import { beginDisc, finishDisc, trace } from './world-disc-primitives';
export const ALMADEN_SEED = crateredWorldProfile('sulfur-ground-v1:estella-xia').seed;
function createGeometry() {
  const r=groundStream(ALMADEN_SEED,'flows'), s=groundStream(ALMADEN_SEED,'sulfur'), c=groundStream(ALMADEN_SEED,'calderas');
  const flows=[
    groundRegion([[-1.14,-.47],[-.80,-.58],[-.48,-.38],[-.23,-.45],[.04,-.17],[-.16,.11],[-.48,.20],[-.81,.06],[-1.09,.12]],r()*6.28,'#9b703e'),
    groundRegion([[-.81,.25],[-.51,.18],[-.24,.38],[-.29,.67],[-.11,.99],[-.43,1.16],[-.90,1.02],[-1.11,.66]],r()*6.28,'#a96f3d'),
    groundRegion([[.09,.11],[.43,.13],[.60,.40],[.86,.57],[.99,.88],[.55,1.11],[.33,.85],[.30,.57],[.06,.42]],r()*6.28,'#a47c3c'),
    groundRegion([[.22,-1.09],[.53,-1.07],[.81,-.76],[.71,-.49],[.39,-.39],[.24,-.63]],r()*6.28,'#b88a3e'),
  ];
  const sulfur=[
    // Yellow Pit remains on sulfur-coloured ground, not in a caldera.
    groundRegion([[.56,-.34],[.86,-.50],[1.19,-.30],[1.13,.12],[.87,.19],[.63,.02]],s()*6.28,'#dfbf65'),
    groundRegion([[-.71,-1.05],[-.29,-1.17],[.11,-1.09],[.22,-.84],[-.05,-.73],[-.31,-.84],[-.57,-.74]],s()*6.28,'#d6b868'),
    groundRegion([[-.38,.21],[-.17,.04],[.10,.00],[.24,.20],[.11,.38],[-.15,.43]],s()*6.28,'#ddbb59'),
  ];
  const calderas:GroundLayer[]=[];
  for(const [x,y,rx,ry,angle] of [[-.33,-.23,.20,.14,-.3],[.43,.45,.14,.11,.7],[-.60,.62,.11,.075,-.8],[.59,-.63,.12,.07,.5]]){
    const phase=c()*6.28;
    calderas.push(groundOval(x,y,rx*1.4,ry*1.4,angle,phase,'#b77c43'),
      groundOval(x,y,rx,ry,angle,phase,'#655044'),
      groundOval(x+.012,y+.015,rx*.70,ry*.65,angle,phase,'#493d36'));
  }
  return Object.freeze({flows:Object.freeze(flows),sulfur:Object.freeze(sulfur),calderas:Object.freeze(calderas)});
}
let cached:ReturnType<typeof createGeometry>|undefined;
export function almadenGeometry(){return cached??=createGeometry();}
/** Sulfur ground and dark volcanic paterae, no plumes/new haze/global lava.
 * Existing thin SO2 atmosphere is drawn independently by the orbital renderer. */
export function drawAlmadenDisc(ctx:CanvasRenderingContext2D,cx:number,cy:number,radius:number):void{
  if(!beginDisc(ctx,cx,cy,radius))return;
  const model=almadenGeometry();ctx.fillStyle='#c5a04d';ctx.fillRect(-1,-1,2,2);
  for(const group of [model.flows,model.sulfur,model.calderas])for(const layer of group){
    trace(ctx,radius<60?layer.coarse:layer.full);ctx.fillStyle=layer.color;ctx.fill();
  }
  finishDisc(ctx,radius,'#d7b76b');
}
