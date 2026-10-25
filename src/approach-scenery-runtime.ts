// Hartwell only. Keep the approved moving sky/background, cache the expensive
// STATIC foreground in bounded world-space strips. Physics/HUD never enter caches.
import { getApproachTerrainHeight, type ApproachSceneryPainter } from './approach';
import { HARTWELL_APPROACH_TARGETS, hartwellApproachRegion } from './approach-biomes';
import { createHartwellScenery } from './approach-scenery';
import { groundCacheScale, groundStripRange, GROUND_CACHE_PIXELS, GROUND_CACHE_ENTRIES,
  GROUND_STRIP_WIDTH as TILE, GROUND_STRIP_BLEED as BLEED, GROUND_STRIP_TOP as TOP, GROUND_STRIP_BOTTOM as BOTTOM } from './approach-ground-cache';
interface Strip { canvas: HTMLCanvasElement; pixels: number; }
export function createApproachScenery() {
  const sources=new Map<string,{ background: ApproachSceneryPainter; material: ApproachSceneryPainter }>();
  const cache=new Map<string,Strip>();
  let pixels=0,builds=0,hits=0,evictions=0,lastFrameBuilds=0;
  function evict(key:string){const entry=cache.get(key)!;pixels-=entry.pixels;entry.canvas.width=entry.canvas.height=1;cache.delete(key);evictions++;}
  const draw:ApproachSceneryPainter=(ctx,cam,state,level,W,H)=>{
    if(level.body.id!=='estella-v'||!HARTWELL_APPROACH_TARGETS.includes(level.poi.id))return false;
    if(!(cam.zoom>0)||!(W>0)||!(H>0)||![cam.x,cam.y,cam.zoom,W,H,level.gateX].every(Number.isFinite))return false;
    let source=sources.get(level.poi.id);
    if(!source){
      const region=hartwellApproachRegion(level.poi.id);
      source={background:createHartwellScenery(region,true,'background'),material:createHartwellScenery(region,true,'material')};
      sources.set(level.poi.id,source);
    }
    source.background(ctx,cam,state,level,W,H);lastFrameBuilds=0;
    const z=cam.zoom,sy=(y:number)=>H/2-(y-cam.y)*z;
    const step=4/z,start=cam.x-W/(2*z)-step,count=Math.ceil(W/4)+2;
    const surface:Array<readonly[number,number]>=[];
    for(let i=0;i<=count;i++){const x=start+i*step;surface.push([W/2+(x-cam.x)*z,sy(getApproachTerrainHeight(x,level))]);}
    if(surface.every(([,y])=>y>H+2))return true;
    const scale=groundCacheScale(z,W),span=TILE/scale;
    const [first,last]=groundStripRange(cam.x,z,W,scale);
    ctx.save();
    try{
      ctx.globalAlpha=1;ctx.setLineDash([]);
      ctx.beginPath();surface.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
      ctx.lineTo(W+8,H+8);ctx.lineTo(-8,H+8);ctx.closePath();ctx.clip();
      ctx.fillStyle='#211b1b';ctx.fillRect(0,0,W,H);
      // Skip strips entirely if the view is below their solid-dark cutaway limit.
      if(sy(BOTTOM)>0&&sy(TOP)<H){
        for(let tile=first;tile<=last;tile++){
          const key=`${level.poi.id}:${level.gateX}:${state.localDir}:${scale}:${tile}`;
          let entry=cache.get(key);
          if(entry){cache.delete(key);cache.set(key,entry);hits++;}
          else{
            const width=TILE+2*BLEED,coreHeight=Math.ceil((TOP-BOTTOM)*scale),height=coreHeight+2*BLEED;
            while(cache.size&&(cache.size>=GROUND_CACHE_ENTRIES||pixels+width*height>GROUND_CACHE_PIXELS))evict(cache.keys().next().value!);
            const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
            const target=canvas.getContext('2d',{alpha:false,willReadFrequently:false})!;
            const bakeCam={x:(tile+.5)*span,y:TOP-coreHeight/(2*scale),zoom:scale};
            source.material(target,bakeCam,state,level,width,height);
            entry={canvas,pixels:width*height};cache.set(key,entry);pixels+=entry.pixels;builds++;lastFrameBuilds++;
          }
          const x=W/2+(tile*span-BLEED/scale-cam.x)*z;
          // Opaque, matching bleed pixels overlap adjacent strips: no fractional-pixel gaps.
          ctx.drawImage(entry.canvas,x,sy(TOP+BLEED/scale),entry.canvas.width*z/scale,entry.canvas.height*z/scale);
        }
      }
    }finally{ctx.restore();}
    // Exact live contour at every scale, not a scaled/cached collision silhouette.
    ctx.save();ctx.globalAlpha=1;ctx.setLineDash([]);ctx.beginPath();
    surface.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.strokeStyle='rgba(223,163,104,.58)';ctx.lineWidth=1;ctx.stroke();ctx.restore();
    return true;
  };
  return Object.assign(draw,{
    diagnostics:()=>({entries:cache.size,pixels,maxPixels:GROUND_CACHE_PIXELS,builds,hits,evictions,lastFrameBuilds,targets:sources.size}),
    clear:()=>{for(const key of [...cache.keys()])evict(key);},
  });
}
