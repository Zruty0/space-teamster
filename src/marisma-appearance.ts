import { crateredWorldProfile } from './cratered-world-geometry';
import { groundRegion, groundStream } from './authored-ground-geometry';
import { beginDisc, finishDisc, trace } from './world-disc-primitives';
export const MARISMA_SEED = crateredWorldProfile('cold-methane-ground-v1:estella-xib').seed;
function createGeometry(){
  const l=groundStream(MARISMA_SEED,'lowlands'),u=groundStream(MARISMA_SEED,'uplands'),s=groundStream(MARISMA_SEED,'surface-tones');
  const lowlands=[
    // Blue Fen and Blackwater keep their existing rim angles and lowland context.
    groundRegion([[.17,-1.13],[.60,-1.10],[.98,-.84],[1.14,-.46],[.80,-.28],[.49,-.37],[.25,-.63]],l()*6.28,'#456d87'),
    groundRegion([[-1.17,-.76],[-.82,-.82],[-.57,-.57],[-.38,-.44],[-.47,-.17],[-.78,-.04],[-1.17,-.20]],l()*6.28,'#3f6177'),
    groundRegion([[-.38,.11],[-.06,-.08],[.34,-.02],[.59,.19],[.43,.39],[.06,.43],[-.17,.60],[-.45,.42]],l()*6.28,'#527c94'),
  ];
  const uplands=[
    groundRegion([[-.69,-1.11],[-.38,-1.16],[-.12,-.83],[.02,-.61],[.24,-.39],[.22,-.17],[-.01,-.24],[-.18,-.49],[-.49,-.65]],u()*6.28,'#8daebc'),
    groundRegion([[-1.16,.20],[-.81,.12],[-.59,.26],[-.46,.61],[-.19,.78],[.13,.71],[.47,.55],[.80,.54],[1.09,.78],[.81,1.14],[-.04,1.16],[-.73,1.03]],u()*6.28,'#7c9fae'),
  ];
  const surfaceTones=[
    groundRegion([[-.96,.32],[-.78,.28],[-.60,.44],[-.53,.71],[-.19,.94],[-.23,1.12],[-.64,.94],[-.78,.64]],s()*6.28,'#97b6bf'),
    groundRegion([[.15,.83],[.48,.68],[.75,.67],[.92,.86],[.74,1.10],[.51,.94],[.25,1.02]],s()*6.28,'#8dabb6'),
    groundRegion([[-.43,-.99],[-.28,-1.04],[-.10,-.78],[-.04,-.58],[.10,-.38],[.02,-.38],[-.21,-.69]],s()*6.28,'#a2bdc6'),
  ];
  return Object.freeze({lowlands:Object.freeze(lowlands),uplands:Object.freeze(uplands),surfaceTones:Object.freeze(surfaceTones)});
}
let cached:ReturnType<typeof createGeometry>|undefined;
export function marismaGeometry(){return cached??=createGeometry();}
/** Cool surface tones only: not a map of newly invented seas/continents or ice
 * resources. No Titan-orange recolour, haze, clouds or atmospheric changes. */
export function drawMarismaDisc(ctx:CanvasRenderingContext2D,cx:number,cy:number,radius:number):void{
  if(!beginDisc(ctx,cx,cy,radius))return;
  const model=marismaGeometry();ctx.fillStyle='#688fa6';ctx.fillRect(-1,-1,2,2);
  for(const group of [model.lowlands,model.uplands,model.surfaceTones])for(const layer of group){
    trace(ctx,radius<60?layer.coarse:layer.full);ctx.fillStyle=layer.color;ctx.fill();
  }
  finishDisc(ctx,radius,'#aac8d6');
}
