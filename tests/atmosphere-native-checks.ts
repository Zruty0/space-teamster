import { drawGaiaDisc as originalGaia } from './fixtures/world-disc-v1';
import type { AtmosphereProfile } from '../src/atmosphere-prototype-profile';
interface Scene {
  defaults:AtmosphereProfile;
  render(time:number,changes?:Partial<AtmosphereProfile>):{error:number};
  cloudPixels():Uint8ClampedArray;
}
/** Explicit browser check, not a startup cost or game integration. WebGL pixel
 * hashes are compared within one browser/backend, never across GPU vendors. */
export function checkAtmosphereNative(api:Scene,canvas:HTMLCanvasElement){
  let checks=0;const assert=(ok:unknown,message:string)=>{checks++;if(!ok)throw Error(message);};
  const hash=(data:Uint8ClampedArray)=>{let h=2166136261;for(const value of data)h=Math.imul(h^value,16777619);return h>>>0;};
  const ctx=canvas.getContext('2d')!;
  api.render(0);const left=hash(ctx.getImageData(0,0,585,660).data);
  const sample=(time:number)=>{api.render(time);return api.cloudPixels();};
  const period=api.defaults.loopSeconds,zero=sample(0),quarter=sample(period*.25),half=sample(period*.5),end=sample(period),back=sample(0);
  assert(hash(zero)===hash(end)&&hash(zero)===hash(back),'exact loop endpoints / reverse scrubbing');
  assert(hash(zero)!==hash(quarter)&&hash(quarter)!==hash(half),'evolving weather, not static overlay');
  assert(left===hash(ctx.getImageData(0,0,585,660).data),'original Gaia side unchanged through time');
  const before=sample(period-.01),after=sample(.01);let seam=0;
  // Compare premultiplied colour: RGB of nearly transparent pixels is unstable
  // after unpremultiplication and has no corresponding visible discontinuity.
  for(let i=0;i<before.length;i+=4){
    for(let k=0;k<3;k++)seam+=Math.abs(before[i+k]*before[i+3]/255-after[i+k]*after[i+3]/255);
    seam+=Math.abs(before[i+3]-after[i+3]);
  }
  seam/=before.length;assert(seam<1.5,`smooth loop neighborhood: ${seam}`);
  const size=Math.sqrt(zero.length/4);let visible=0,interior=0,opaque=0,soft=0,outsideClear=true;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const r=Math.hypot((x+.5)/(size/2)-1,(y+.5)/(size/2)-1),alpha=zero[(y*size+x)*4+3];
    if(r<.9){interior++;if(alpha>32)visible++;if(alpha>230)opaque++;if(alpha>8&&alpha<220)soft++;}
    if(r>1.01&&alpha!==0)outsideClear=false;
  }
  assert(outsideClear,'transparent outside spherical shell');
  assert(visible/interior>.12&&visible/interior<.85,'mixed cloud and clear regions');
  assert(soft/interior>.05,'translucent edges and wisps');
  api.render(0,{coverage:0,cirrus:0});assert(api.cloudPixels().every((v,i)=>i%4!==3||v===0),'both cloud decks off is transparent');
  api.render(0,{coverage:0,cirrus:0,haze:0,shadow:0});
  const original=document.createElement('canvas');original.width=1200;original.height=660;
  const originalCtx=original.getContext('2d')!;originalCtx.fillStyle='#060e17';originalCtx.fillRect(0,0,1200,660);originalGaia(originalCtx,900,290,225);
  const expected=originalCtx.getImageData(662,52,476,476).data,off=ctx.getImageData(662,52,476,476).data;
  let baseMaxDifference=0;for(let i=0;i<off.length;i++)baseMaxDifference=Math.max(baseMaxDifference,Math.abs(off[i]-expected[i]));
  // Separate accelerated/readback backing stores can round gradients by one byte.
  assert(baseMaxDifference<=1,'all layers off matches independent original Gaia within one channel level');
  api.render(0,{seed:api.defaults.seed+1});assert(hash(api.cloudPixels())!==hash(zero),'different seed changes weather');
  api.render(0,{coverage:.2});const low=api.cloudPixels();api.render(0,{coverage:.8});const high=api.cloudPixels();
  let lowAlpha=0,highAlpha=0;for(let i=3;i<low.length;i+=4){lowAlpha+=low[i];highAlpha+=high[i];}
  assert(highAlpha>lowAlpha*1.5,'coverage control increases clouds');
  const slider=document.querySelector<HTMLInputElement>('[data-key=coverage]')!;slider.value='.35';slider.dispatchEvent(new Event('input',{bubbles:true}));
  assert(document.querySelector('output')!.textContent==='0.35','live control wiring');
  assert(api.render(0).error===0,'no WebGL error');
  return{checks,hashes:[hash(zero),hash(quarter),hash(half)],seamMeanDifference:seam,cloudCoverage:visible/interior,opaqueFraction:opaque/interior,softFraction:soft/interior,baseMaxDifference};
}
