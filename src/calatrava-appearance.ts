import { crateredWorldGeometry, crateredWorldProfile } from './cratered-world-geometry';
import { groundRegion, groundStream } from './authored-ground-geometry';
import { beginDisc, finishDisc, trace } from './world-disc-primitives';
export const CALATRAVA_SEED = crateredWorldProfile('heated-rock-v1:estella-xd').seed;
const IMPACTS = crateredWorldProfile('calatrava-impacts-v1:estella-xd', {craterCount:52, craterScale:.78, basinCoverage:.75});
function createGeometry() {
  const r = groundStream(CALATRAVA_SEED,'resurfacing'), h = groundStream(CALATRAVA_SEED,'geothermal');
  const resurfaced = [
    // Local resurfacing reaches Marcher Wells at its real -1.2 angle.
    groundRegion([[.02,-.20],[.23,-.12],[.19,.17],[.40,.39],[.45,.73],[.62,1.16],[.20,1.15],[.18,.79],[.12,.53],[-.05,.27]],r()*6.28,'#76554b'),
    groundRegion([[-.71,-.62],[-.49,-.71],[-.28,-.51],[-.08,-.45],[-.18,-.25],[-.43,-.35]],r()*6.28,'#805d4d'),
    groundRegion([[.49,-.45],[.81,-.49],[1.13,-.31],[1.12,-.02],[.79,.06],[.54,-.12]],r()*6.28,'#92725c'),
  ];
  const geothermal = [
    groundRegion([[.08,-.13],[.17,-.07],[.12,.20],[.31,.44],[.33,.77],[.45,1.14],[.31,1.15],[.25,.79],[.22,.48],[.03,.25]],h()*6.28,'#a7754c'),
    groundRegion([[.14,.28],[.28,.43],[.29,.71],[.39,.99],[.31,1.04],[.23,.74],[.22,.48]],h()*6.28,'#ba8d5d'),
    groundRegion([[-.62,-.60],[-.48,-.62],[-.33,-.46],[-.18,-.42],[-.27,-.37],[-.43,-.43]],h()*6.28,'#ad8057'),
  ];
  const rock = crateredWorldGeometry(IMPACTS);
  return Object.freeze({basins:rock.basins, craters:rock.craters, resurfaced:Object.freeze(resurfaced), geothermal:Object.freeze(geothermal)});
}
let cached: ReturnType<typeof createGeometry> | undefined;
export function calatravaGeometry() { return cached ??= createGeometry(); }
/** Airless rocky hybrid. Muted mineral belts, not global lava or glowing cracks.
 * Older impacts are overpainted by the younger smooth resurfaced ground. */
export function drawCalatravaDisc(ctx: CanvasRenderingContext2D, cx:number, cy:number, radius:number):void {
  if (!beginDisc(ctx,cx,cy,radius)) return;
  const model=calatravaGeometry();
  ctx.fillStyle='#9d7159';ctx.fillRect(-1,-1,2,2);
  for(const basin of model.basins){trace(ctx,basin);ctx.fillStyle='#86624f';ctx.fill();}
  const count=radius<14?3:radius<60?9:model.craters.length;
  for(const {x,y,r,squash,angle} of model.craters.slice(0,count)){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(squash,1);
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle='#715244';ctx.fill();
    ctx.strokeStyle='#b58e6b';ctx.lineWidth=Math.max(.0025,Math.min(.6/radius,r*.13));ctx.stroke();
    if(radius>=14){
      ctx.beginPath();ctx.arc(0,0,r*.77,-2.8-angle,-.3-angle);ctx.strokeStyle='#5b473f';ctx.lineWidth=r*.14;ctx.stroke();
      ctx.beginPath();ctx.arc(0,0,r*.80,.2-angle,2.5-angle);ctx.strokeStyle='#c19a77';ctx.lineWidth=r*.09;ctx.stroke();
    }
    ctx.restore();
  }
  for(const group of [model.resurfaced,model.geothermal])for(const layer of group){
    trace(ctx,radius<60?layer.coarse:layer.full);ctx.fillStyle=layer.color;ctx.fill();
  }
  finishDisc(ctx,radius,'#bd9877');
}
