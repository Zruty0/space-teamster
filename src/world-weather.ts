// Production visual overlay. No simulation, missions, save schema or physics.
import { createAtmospherePrototype } from './atmosphere-prototype';
import { productionWeatherProfiles, weatherArtSeconds } from './atmosphere-art-state';
import { drawAuthoredWorldDisc, type WorldTint } from './world-disc-appearance';
import { drawCurrentWorldDisc } from './world-presentation';
export interface OrbitalWeatherPainter{
  beginFrame(worldTime:number):void;
  draw(ctx:CanvasRenderingContext2D,id:string,cx:number,cy:number,radius:number,tint:WorldTint):boolean;
  endFrame():void;
}
type Model=ReturnType<typeof productionWeatherProfiles>[number];
interface CachedWeather{images:HTMLCanvasElement[];artTime:number;updated:number;}
/** One context, eight noise seeds and at most eight current-image mip chains.
 * Only one world refresh per display frame, oldest first, at most10Hz/world.
 * This avoids generating eight expensive frames together during time warp. */
export function createWorldWeather(seed:number,now=()=>performance.now(),inspectFrame?:(id:string,image:HTMLCanvasElement,artTime:number)=>void,style:'filled'|'outline'='outline'){
  const models=productionWeatherProfiles(seed),byId=new Map(models.map(m=>[m.id,m]));
  const cache=new Map<string,CachedWeather>(),requests=new Set<string>();
  let engine:ReturnType<typeof createAtmospherePrototype>|undefined;
  let failed=false,disposed=false,reason='',artTime=0,wall=0,updates=0,frameServiced=false;
  function fail(error:unknown){
    if(failed)return;
    failed=true;reason=String(error);for(const c of cache.values())for(const image of c.images)image.width=image.height=1;
    cache.clear();engine?.dispose();engine=undefined;
    console.warn('Atmospheric artwork unavailable; using static world artwork.',reason);
  }
  function initialize(warm=false){
    if(engine||failed||disposed)return;
    try{
      engine=createAtmospherePrototype(512,models.length,style);
      engine.canvas.addEventListener('webglcontextlost',()=>fail('WebGL context lost'));
      // Force shader/texture warmup outside flight painting when prewarm is used.
      if(warm)engine.render(artTime,models[0].profile);
    }catch(error){fail(error);}
  }
  function update(model:Model){
    initialize();if(!engine||failed||disposed)return;
    try{
      let entry=cache.get(model.id);
      if(!entry){
        const images:HTMLCanvasElement[]=[];
        for(let size=576;size>=4;size=Math.floor(size/2)){
          const image=document.createElement('canvas');image.width=image.height=size;images.push(image);
        }
        entry={images,artTime:NaN,updated:-Infinity};cache.set(model.id,entry);
      }
      engine.render(artTime,model.profile);
      const full=entry.images[0],ctx=full.getContext('2d')!;
      ctx.clearRect(0,0,576,576);engine.composite(ctx,288,288,256,model.profile);
      for(let i=1;i<entry.images.length;i++){
        const image=entry.images[i],small=image.getContext('2d')!;
        small.clearRect(0,0,image.width,image.height);small.drawImage(entry.images[i-1],0,0,image.width,image.height);
      }
      entry.artTime=artTime;entry.updated=wall;updates++;
      inspectFrame?.(model.id,full,artTime);
    }catch(error){fail(error);}
  }
  return{
    prewarm(){initialize(true);},
    beginFrame(worldTime:number){artTime=weatherArtSeconds(worldTime);wall=now();requests.clear();frameServiced=false;},
    draw(ctx:CanvasRenderingContext2D,id:string,cx:number,cy:number,radius:number,tint:WorldTint):boolean{
      const model=byId.get(id);
      if(!model||failed||disposed||!(radius>0)||![cx,cy,radius].every(Number.isFinite))return false;
      const extent=radius*1.125;
      if(cx+extent<0||cy+extent<0||cx-extent>ctx.canvas.width||cy-extent>ctx.canvas.height)return false;
      // Match the approved gallery: unresolved contour mips must not turn into
      // a colored cloud wash on tiny chart markers. No refresh needed for these.
      if(style==='outline'&&radius<14)return drawCurrentWorldDisc(ctx,id,cx,cy,radius,tint,0,!!model.underdeck);
      requests.add(id);
      const entry=cache.get(id);
      // Missing/lost WebGL retains the exact original painter; no empty discs.
      if(!entry)return false;
      if(style==='outline'){
        if(!drawCurrentWorldDisc(ctx,id,cx,cy,radius,tint,0,!!model.underdeck))return false;
      }else if(model.underdeck){
        ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fillStyle=model.underdeck;ctx.fill();
        const shade=ctx.createRadialGradient(cx-radius*.35,cy-radius*.4,radius*.1,cx,cy,radius*1.3);
        shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,.38)');ctx.fillStyle=shade;ctx.fill();ctx.restore();
      }else if(!drawAuthoredWorldDisc(ctx,id,cx,cy,radius,tint))return false;
      let lod=0;while(lod+1<entry.images.length&&entry.images[lod+1].width>=extent*2)lod++;
      ctx.save();ctx.imageSmoothingEnabled=true;
      ctx.drawImage(entry.images[lod],cx-extent,cy-extent,extent*2,extent*2);ctx.restore();return true;
    },
    endFrame(){
      if(failed||disposed||frameServiced)return;
      frameServiced=true;
      const eligible=[...requests].filter(id=>{
        const entry=cache.get(id);return !entry||(entry.artTime!==artTime&&wall-entry.updated>=100);
      });
      eligible.sort((a,b)=>(cache.get(a)?.updated??-Infinity)-(cache.get(b)?.updated??-Infinity));
      if(eligible.length)update(byId.get(eligible[0])!);
    },
    diagnostics(){return{seed,available:!!engine&&!failed,failed,reason,updates,artTime,cachedWorlds:cache.size,noise:engine?.diagnostics(),frames:[...cache].map(([id,c])=>({id,artTime:c.artTime,updated:c.updated})),models};},
    dispose(){if(disposed)return;disposed=true;engine?.dispose();engine=undefined;for(const c of cache.values())for(const image of c.images)image.width=image.height=1;cache.clear();requests.clear();},
  };
}
