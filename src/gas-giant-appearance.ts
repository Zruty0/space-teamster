import { gasGiantGeometry, type GasGiantProfile } from './gas-giant-geometry';
import { beginDisc, finishDisc, trace, type WorldTint } from './world-disc-primitives';
const rgb=(c:WorldTint)=>`rgb(${c.join(',')})`;

/** One static cloud renderer, three authored compositions. All paint lies inside
 * the original disc. Existing atmospheric/skimming envelopes remain separate. */
export function drawGasGiantDisc(ctx:CanvasRenderingContext2D,cx:number,cy:number,radius:number,p:GasGiantProfile):void {
  if(!beginDisc(ctx,cx,cy,radius))return;
  const model=gasGiantGeometry(p);
  ctx.fillStyle=rgb(p.palette[0]);ctx.fillRect(-1,-1,2,2);
  for(const [i,band] of model.bands.entries()){
    trace(ctx,radius<60?band.coarse:band.full);
    ctx.fillStyle=rgb(p.palette[p.colors[i]]);ctx.fill();
  }
  if(radius>=60)for(const filament of model.filaments){
    trace(ctx,filament);ctx.fillStyle=`rgba(255,255,255,${p.filamentOpacity})`;ctx.fill();
  }
  if(radius>=8)for(const [i,storm] of model.storms.slice(0,radius<60?1:undefined).entries()){
    const light=p.storms[i].light===true;
    trace(ctx,storm.outline);ctx.fillStyle=rgb(p.stormColors[light?1:0]);ctx.fill();
    if(radius>=60)for(const swirl of storm.swirls){
      trace(ctx,swirl);ctx.fillStyle=rgb(p.stormColors[light?0:1]);ctx.fill();
    }
  }
  finishDisc(ctx,radius,rgb(p.palette[0]));
}
