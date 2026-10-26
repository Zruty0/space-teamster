// Historical synchronous runtime from4ce155e, for before/after performance comparisons.
// Uses the same approved material source; deliberately builds whole strips inside draw.
import { getApproachTerrainHeight, type ApproachSceneryPainter } from '../../src/approach';
import { HARTWELL_APPROACH_TARGETS, hartwellApproachRegion } from '../../src/approach-biomes';
import { createHartwellScenery } from '../../src/approach-scenery';
import { groundCacheScale, groundStripRange, GROUND_CACHE_PIXELS, GROUND_CACHE_ENTRIES,
 GROUND_STRIP_WIDTH as TILE, GROUND_STRIP_BLEED as BLEED, GROUND_STRIP_TOP as TOP, GROUND_STRIP_BOTTOM as BOTTOM } from '../../src/approach-ground-cache';
export function createSynchronousGroundReference(){
 const sources=new Map<string,{background:ApproachSceneryPainter;material:ApproachSceneryPainter}>();
 const cache=new Map<string,{canvas:HTMLCanvasElement;pixels:number}>();
 let pixels=0,builds=0;
 function evict(key:string){const e=cache.get(key)!;pixels-=e.pixels;e.canvas.width=e.canvas.height=1;cache.delete(key);}
 const draw:ApproachSceneryPainter=(ctx,cam,state,level,W,H)=>{
  if(level.body.id!=='estella-v'||!HARTWELL_APPROACH_TARGETS.includes(level.poi.id))return false;
  let source=sources.get(level.poi.id);
  if(!source){const r=hartwellApproachRegion(level.poi.id);source={background:createHartwellScenery(r,true,'background'),material:createHartwellScenery(r,true,'material')};sources.set(level.poi.id,source);}
  source.background(ctx,cam,state,level,W,H);
  const z=cam.zoom,sy=(y:number)=>H/2-(y-cam.y)*z,step=4/z,start=cam.x-W/(2*z)-step,count=Math.ceil(W/4)+2;
  const surface:Array<readonly[number,number]>=[];
  for(let i=0;i<=count;i++){const x=start+i*step;surface.push([W/2+(x-cam.x)*z,sy(getApproachTerrainHeight(x,level))]);}
  if(surface.every(([,y])=>y>H+2))return true;
  const scale=groundCacheScale(z,W),span=TILE/scale,[first,last]=groundStripRange(cam.x,z,W,scale);
  ctx.save();
  try{
   ctx.globalAlpha=1;ctx.setLineDash([]);ctx.beginPath();surface.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
   ctx.lineTo(W+8,H+8);ctx.lineTo(-8,H+8);ctx.closePath();ctx.clip();ctx.fillStyle='#211b1b';ctx.fillRect(0,0,W,H);
   if(sy(BOTTOM)>0&&sy(TOP)<H)for(let tile=first;tile<=last;tile++){
    const key=`${level.poi.id}:${level.gateX}:${state.localDir}:${scale}:${tile}`;let entry=cache.get(key);
    if(entry){cache.delete(key);cache.set(key,entry);}
    else{
     const width=TILE+2*BLEED,coreHeight=Math.ceil((TOP-BOTTOM)*scale),height=coreHeight+2*BLEED;
     while(cache.size&&(cache.size>=GROUND_CACHE_ENTRIES||pixels+width*height>GROUND_CACHE_PIXELS))evict(cache.keys().next().value!);
     const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
     const target=canvas.getContext('2d',{alpha:false,willReadFrequently:false})!;
     source.material(target,{x:(tile+.5)*span,y:TOP-coreHeight/(2*scale),zoom:scale},state,level,width,height);
     entry={canvas,pixels:width*height};cache.set(key,entry);pixels+=entry.pixels;builds++;
    }
    ctx.drawImage(entry.canvas,W/2+(tile*span-BLEED/scale-cam.x)*z,sy(TOP+BLEED/scale),entry.canvas.width*z/scale,entry.canvas.height*z/scale);
   }
  }finally{ctx.restore();}
  ctx.save();ctx.globalAlpha=1;ctx.setLineDash([]);ctx.beginPath();surface.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.strokeStyle='rgba(223,163,104,.58)';ctx.lineWidth=1;ctx.stroke();ctx.restore();return true;
 };
 return Object.assign(draw,{diagnostics:()=>({pixels,entries:cache.size,builds,visibleMissing:0,failures:0}),clear:()=>{for(const key of [...cache.keys()])evict(key);}});
}
