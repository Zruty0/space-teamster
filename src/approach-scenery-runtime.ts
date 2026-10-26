// Hartwell only. Live background/clearance contour; bounded, cooperatively prepared ground.
import { getApproachTerrainHeight, type ApproachSceneryPainter } from './approach';
import { HARTWELL_APPROACH_TARGETS, hartwellApproachRegion } from './approach-biomes';
import { createHartwellScenery, createHartwellScenerySteps } from './approach-scenery';
import { groundCacheScale, groundStripRange, GROUND_CACHE_PIXELS, GROUND_CACHE_ENTRIES,
  GROUND_STRIP_WIDTH as TILE, GROUND_STRIP_BLEED as BLEED, GROUND_STRIP_TOP as TOP, GROUND_STRIP_BOTTOM as BOTTOM } from './approach-ground-cache';

type Args=Parameters<ApproachSceneryPainter>;
type Source={background:ApproachSceneryPainter;material:ReturnType<typeof createHartwellScenerySteps>};
interface Job { key:string; identity:string; tile:number; scale:number; source:Source; state:Args[2]; level:Args[3]; }
interface Strip { canvas:HTMLCanvasElement; pixels:number; ready:boolean; job:Job; }
const SLICE_MS=2;
export function createApproachScenery() {
  const sources=new Map<string,Source>(),cache=new Map<string,Strip>();
  let wanted=new Map<string,Job>(),visible:string[]=[];
  let active:{entry:Strip;steps:Generator<void,boolean,void>}|undefined;
  let pixels=0,builds=0,hits=0,evictions=0,slices=0,maxSliceMs=0,lastSliceMs=0,cancellations=0,failures=0;
  let raf:number|undefined,idle:number|undefined,lastRequest=0,disabled=false;
  let display:{identity:string;scale:number}|undefined;
  let previous:{identity:string;x:number;zoom:number;time:number}|undefined;
  function evict(key:string){
    const entry=cache.get(key);if(!entry)return;
    if(active?.entry===entry){active.steps.return(false);active=undefined;cancellations++;}
    pixels-=entry.pixels;entry.canvas.width=entry.canvas.height=1;cache.delete(key);evictions++;
  }
  const pending=()=>[...wanted.keys()].filter(key=>!cache.get(key)?.ready).length;
  function cancelScheduled(){
    if(raf!==undefined)cancelAnimationFrame(raf);
    if(idle!==undefined)cancelIdleCallback(idle);
    raf=idle=undefined;
  }
  function stopWork(){
    cancelScheduled();wanted.clear();visible=[];previous=undefined;
    if(active)evict(active.entry.job.key);
  }
  function schedule(){
    if(disabled||raf!==undefined||idle!==undefined||(!active&&!pending()))return;
    // At most one cooperative slice per animation frame, after the live draw where
    // requestIdleCallback exists. Busy/older browsers still advance small chunks.
    raf=requestAnimationFrame(()=>{
      raf=undefined;
      if(typeof requestIdleCallback==='function')idle=requestIdleCallback(deadline=>{idle=undefined;work(deadline.timeRemaining());},{timeout:100});
      else work(SLICE_MS);
    });
  }
  function start(job:Job){
    const width=TILE+2*BLEED,coreHeight=Math.ceil((TOP-BOTTOM)*job.scale),height=coreHeight+2*BLEED;
    while(cache.size&&(cache.size>=GROUND_CACHE_ENTRIES||pixels+width*height>GROUND_CACHE_PIXELS)){
      const victim=[...cache.keys()].find(key=>!wanted.has(key));
      if(!victim)throw Error('Ground working set exceeds cache budget');
      evict(victim);
    }
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const target=canvas.getContext('2d',{alpha:false,willReadFrequently:false});
    if(!target)throw Error('Ground canvas unavailable');
    const entry:Strip={canvas,pixels:width*height,ready:false,job};cache.set(job.key,entry);pixels+=entry.pixels;
    const cam={x:(job.tile+.5)*TILE/job.scale,y:TOP-coreHeight/(2*job.scale),zoom:job.scale};
    active={entry,steps:job.source.material(target,cam,{...job.state},job.level,width,height)};
  }
  function work(idleMs:number){
    if(document.hidden||performance.now()-lastRequest>250||disabled)return;
    const begin=performance.now(),budget=Math.min(SLICE_MS,Math.max(.25,idleMs));
    try{
      do{
        if(!active){const next=[...wanted.values()].find(job=>!cache.get(job.key)?.ready);if(!next)break;start(next);}
        if(active!.steps.next().done){active!.entry.ready=true;builds++;active=undefined;}
      }while(performance.now()-begin<budget);
    }catch{
      failures++;disabled=true;if(active)evict(active.entry.job.key);
    }
    lastSliceMs=performance.now()-begin;maxSliceMs=Math.max(maxSliceMs,lastSliceMs);slices++;schedule();
  }
  function plan(source:Source,cam:Args[1],state:Args[2],level:Args[3],W:number,scale:number){
    const identity=`${level.poi.id}:${level.gateX}:${state.localDir}`,now=performance.now();
    if(active&&active.entry.job.identity!==identity)evict(active.entry.job.key);
    const next=new Map<string,Job>();let plannedPixels=0;
    function add(tile:number,lod:number){
      const key=`${identity}:${lod}:${tile}`;if(next.has(key))return;
      const cost=(TILE+2*BLEED)*(Math.ceil((TOP-BOTTOM)*lod)+2*BLEED);
      if(next.size>=GROUND_CACHE_ENTRIES||plannedPixels+cost>GROUND_CACHE_PIXELS)return;
      next.set(key,{key,identity,tile,scale:lod,source,state,level});plannedPixels+=cost;
    }
    function range(x:number,zoom:number,lod:number){
      const [first,last]=groundStripRange(x,zoom,W,lod);
      const tiles=Array.from({length:last-first+1},(_,i)=>first+i);
      tiles.sort((a,b)=>Math.abs((a+.5)*TILE/lod-x)-Math.abs((b+.5)*TILE/lod-x));
      tiles.forEach(tile=>add(tile,lod));return[first,last];
    }
    const [first,last]=range(cam.x,cam.zoom,scale);visible=[...next.keys()];
    // Protect the old displayed LOD while its replacement is prepared. Never mix
    // half-built canvases into flight or change collision geometry to hide a miss.
    if(display?.identity===identity){
      const [a,b]=groundStripRange(cam.x,cam.zoom,W,display.scale);
      for(let tile=a;tile<=b;tile++)if(cache.get(`${identity}:${display.scale}:${tile}`)?.ready)add(tile,display.scale);
    }
    add(first-1,scale);add(last+1,scale);
    if(previous?.identity===identity){
      const dt=Math.max(.001,(now-previous.time)/1000),span=TILE/scale;
      const x=cam.x+Math.max(-2*span,Math.min(2*span,(cam.x-previous.x)/dt*.4));
      const predictedZoom=Math.max(cam.zoom*.7,Math.min(cam.zoom*1.4,cam.zoom+(cam.zoom-previous.zoom)/dt*.4));
      // Don't prepare unreachable detail beyond the production camera's .008–.08
      // range (still accept a fixture/future caller's already-observed zoom).
      const z=Math.max(Math.min(.008,cam.zoom),Math.min(Math.max(.08,cam.zoom),predictedZoom));
      range(x,z,groundCacheScale(z,W));
    }
    previous={identity,x:cam.x,zoom:cam.zoom,time:now};wanted=next;lastRequest=now;
    if(visible.every(key=>cache.get(key)?.ready))display={identity,scale};
    schedule();return identity;
  }
  const draw:ApproachSceneryPainter=(ctx,cam,state,level,W,H)=>{
    if(level.body.id!=='estella-v'||!HARTWELL_APPROACH_TARGETS.includes(level.poi.id)){stopWork();return false;}
    if(!(cam.zoom>0)||!(W>0)||!(H>0)||![cam.x,cam.y,cam.zoom,W,H,level.gateX].every(Number.isFinite)){stopWork();return false;}
    let source=sources.get(level.poi.id);
    if(!source){
      const region=hartwellApproachRegion(level.poi.id);
      source={background:createHartwellScenery(region,true,'background'),material:createHartwellScenerySteps(region)};
      sources.set(level.poi.id,source);
    }
    source.background(ctx,cam,state,level,W,H);
    const z=cam.zoom,sy=(y:number)=>H/2-(y-cam.y)*z;
    const step=4/z,start=cam.x-W/(2*z)-step,count=Math.ceil(W/4)+2;
    const surface:Array<readonly[number,number]>=[];
    for(let i=0;i<=count;i++){const x=start+i*step;surface.push([W/2+(x-cam.x)*z,sy(getApproachTerrainHeight(x,level))]);}
    // A small approach margin prepares ground just before it enters the viewport.
    if(surface.every(([,y])=>y>H+256)){stopWork();return true;}
    const scale=groundCacheScale(z,W);
    const identity=sy(BOTTOM)>0?plan(source,cam,state,level,W,scale):'';
    if(!identity)stopWork();
    if(surface.every(([,y])=>y>H+2))return true;
    ctx.save();
    try{
      ctx.globalAlpha=1;ctx.setLineDash([]);
      ctx.beginPath();surface.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
      ctx.lineTo(W+8,H+8);ctx.lineTo(-8,H+8);ctx.closePath();ctx.clip();
      // First-use coverage until the complete visible LOD is ready. It uses the
      // approved rock palette/depth shading, not black holes or lower-detail tiles.
      let covered=sy(BOTTOM)<=0;
      if(display?.identity===identity){
        const [a,b]=groundStripRange(cam.x,z,W,display.scale);
        covered=Array.from({length:b-a+1},(_,i)=>cache.get(`${identity}:${display!.scale}:${a+i}`)?.ready).every(Boolean);
      }
      if(covered){ctx.fillStyle='#211b1b';ctx.fillRect(0,0,W,H);}
      else{
      const palette=hartwellApproachRegion(level.poi.id).biome.palette;
      const rock=ctx.createLinearGradient(0,sy(1300),0,sy(-2000));
      rock.addColorStop(0,palette.ground);rock.addColorStop(.45,'#754630');rock.addColorStop(1,palette.deep);
      ctx.fillStyle=rock;ctx.fillRect(0,0,W,H);
      const deep=ctx.createLinearGradient(0,sy(-2000),0,sy(BOTTOM));
      deep.addColorStop(0,'rgba(33,27,27,0)');deep.addColorStop(.7,'rgba(33,27,27,.85)');deep.addColorStop(1,'#211b1b');
      ctx.fillStyle=deep;ctx.fillRect(0,0,W,H);
      }
      if(display?.identity===identity){
        const lod=display.scale,span=TILE/lod,[first,last]=groundStripRange(cam.x,z,W,lod);
        for(let tile=first;tile<=last;tile++){
          const key=`${identity}:${lod}:${tile}`,entry=cache.get(key);if(!entry?.ready)continue;
          cache.delete(key);cache.set(key,entry);hits++;
          const x=W/2+(tile*span-BLEED/lod-cam.x)*z;
          ctx.drawImage(entry.canvas,x,sy(TOP+BLEED/lod),entry.canvas.width*z/lod,entry.canvas.height*z/lod);
        }
      }
    }finally{ctx.restore();}
    ctx.save();ctx.globalAlpha=1;ctx.setLineDash([]);ctx.beginPath();
    surface.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.strokeStyle='rgba(223,163,104,.58)';ctx.lineWidth=1;ctx.stroke();ctx.restore();return true;
  };
  return Object.assign(draw,{
    diagnostics:()=>({entries:cache.size,pixels,maxPixels:GROUND_CACHE_PIXELS,builds,hits,evictions,targets:sources.size,
      pending:pending(),visibleMissing:visible.filter(key=>!cache.get(key)?.ready).length,active:!!active,displayScale:display?.scale,plannedEntries:wanted.size,
      slices,lastSliceMs,maxSliceMs,sliceBudgetMs:SLICE_MS,cancellations,failures,disabled}),
    clear:()=>{cancelScheduled();wanted.clear();visible=[];for(const key of [...cache.keys()])evict(key);display=previous=undefined;disabled=false;},
  });
}
