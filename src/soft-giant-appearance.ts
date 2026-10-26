// Review-only colored giants: same bands/storms, feather INSIDE the physical
// limb, no hard rim stroke/glow or changed radius. Three fixed512px backings.
import { drawGasGiantDisc } from './gas-giant-appearance';
import type { GasGiantProfile } from './gas-giant-geometry';
const cache=new Map<GasGiantProfile,HTMLCanvasElement>();
export const GIANT_FEATHER_START=.94;
export function drawSoftGiantDisc(ctx:CanvasRenderingContext2D,cx:number,cy:number,r:number,profile:GasGiantProfile):void{
 if(!(r>0)||![cx,cy,r].every(Number.isFinite))return;
 let image=cache.get(profile);
 if(!image){
  image=document.createElement('canvas');image.width=image.height=512;const paint=image.getContext('2d');if(!paint)throw Error('Giant artwork canvas unavailable');
  drawGasGiantDisc(paint,256,256,256,profile);
  const mask=paint.createRadialGradient(256,256,0,256,256,256);mask.addColorStop(0,'#fff');mask.addColorStop(GIANT_FEATHER_START,'#fff');mask.addColorStop(1,'rgba(255,255,255,0)');
  paint.globalCompositeOperation='destination-in';paint.fillStyle=mask;paint.fillRect(0,0,512,512);paint.globalCompositeOperation='source-over';
  if(cache.size===3){const key=cache.keys().next().value!;const old=cache.get(key)!;old.width=old.height=1;cache.delete(key);}cache.set(profile,image);
 }
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(image,cx-r,cy-r,r*2,r*2);ctx.restore();
}
export function softGiantDiagnostics(){return{entries:cache.size,pixels:cache.size*512*512};}
