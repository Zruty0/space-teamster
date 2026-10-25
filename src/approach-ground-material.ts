// Cosmetic rock/regolith texture only. Periodic, target-seeded, generated once.
import { regionRandom } from './approach-biomes';
export const GROUND_MATERIAL_WIDTH = 512;
export const GROUND_MATERIAL_HEIGHT = 256;
const wrap = (n: number, size: number) => (n % size + size) % size;
const smooth = (x: number) => x*x*(3-2*x);
export function hartwellGroundMaterial(seed: number): Uint8ClampedArray {
  if (!Number.isInteger(seed) || seed<0 || seed>0xffffffff) throw new Error('Invalid ground material seed');
  const W=GROUND_MATERIAL_WIDTH,H=GROUND_MATERIAL_HEIGHT;
  const grid=(w:number,h:number,channel:number)=>Float64Array.from({length:w*h},(_,i)=>regionRandom(seed,i,channel));
  const coarse=grid(8,4,120),fine=grid(32,16,121);
  const noise=(values:Float64Array,w:number,h:number,x:number,y:number)=>{
    const ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy);
    const at=(a:number,b:number)=>values[wrap(b,h)*w+wrap(a,w)];
    return (at(ix,iy)*(1-u)+at(ix+1,iy)*u)*(1-v)+(at(ix,iy+1)*(1-u)+at(ix+1,iy+1)*u)*v;
  };
  const features=Array.from({length:16*8},(_,i)=>({x:.12+.76*regionRandom(seed,i,122),y:.12+.76*regionRandom(seed,i,123),tone:regionRandom(seed,i,124)}));
  const pixels=new Uint8ClampedArray(W*H*4);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const gx=x/32,gy=y/32,cx=Math.floor(gx),cy=Math.floor(gy);
    let first=Infinity,second=Infinity,tone=0;
    for(let j=cy-1;j<=cy+1;j++)for(let i=cx-1;i<=cx+1;i++){
      const feature=features[wrap(j,8)*16+wrap(i,16)];
      const d=(i+feature.x-gx)**2+(j+feature.y-gy)**2;
      if(d<first){second=first;first=d;tone=feature.tone;}else if(d<second)second=d;
    }
    const large=noise(coarse,8,4,x/64,y/64),small=noise(fine,32,16,x/16,y/16);
    // Exposed angular rock in patches, separated by softer granular regolith.
    const exposure=smooth(Math.max(0,Math.min(1,(large-.28)/.45)));
    const edge=(Math.sqrt(second)-Math.sqrt(first))*32;
    const fissure=Math.max(0,1-edge/1.15)*exposure;
    const rim=Math.max(0,1-Math.abs(edge-2)/1.1)*exposure;
    const grain=regionRandom(seed,y*W+x,125)-.5;
    const relief=(large-.5)*.28+(small-.5)*.21+(tone-.5)*.36*exposure-fissure*.48+rim*.10+grain*.17;
    const bright=relief>0,k=(y*W+x)*4;
    pixels[k]=bright?237:28;pixels[k+1]=bright?179:20;pixels[k+2]=bright?116:18;
    pixels[k+3]=Math.min(145,Math.round(Math.abs(relief)*230));
  }
  return pixels;
}
