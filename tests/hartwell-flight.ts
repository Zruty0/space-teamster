import { Game } from '../src/game';
import { defaultCareerProfile } from '../src/career-state';
import { HARTWELL_APPROACH_TARGETS } from '../src/approach-biomes';
import { createHartwellScenery } from '../src/approach-scenery';
import { hartwellApproachRegion } from '../src/approach-biomes';
import { createApproachScenery } from '../src/approach-scenery-runtime';
import { APPROACH_LEVELS, createApproachState, createApproachCamera, updateApproachCamera, updateApproach, applyApproachWeather, getApproachTerrainHeight, renderApproach, type ApproachLevel } from '../src/approach';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { readInput, type InputState } from '../src/input';
import { BODIES, SURFACE_POIS } from '../src/world';
const canvas=document.getElementById('flight')as HTMLCanvasElement,ctx=canvas.getContext('2d',{willReadFrequently:false})!;
const site=document.getElementById('site')as HTMLSelectElement,phase=document.getElementById('phase')as HTMLSelectElement,full=document.getElementById('full')as HTMLInputElement;
const play=document.getElementById('play')!,status=document.getElementById('status')!;
const catalog=JSON.stringify([BODIES,SURFACE_POIS]);
const game:any=Object.create(Game.prototype); // Rendering only: no constructor, save IO, settlement or career launch.
game.canvas=canvas;game.ctx=ctx;game.career=defaultCareerProfile();game.activeManifestCondition={};game.missionDvUsed=0;game.activeMissionQuote=null;game.time=0;
const levels=new Map<string,ApproachLevel>();
for(const id of HARTWELL_APPROACH_TARGETS)for(const departing of [false,true]){
 const before=new Set(APPROACH_LEVELS.map(l=>l.id));
 createPlayableEstellaMission(departing?id:'estella-iii-main-customs',departing?'estella-iii-main-customs':id,undefined,12345);
 const raw=APPROACH_LEVELS.find(l=>!before.has(l.id)&&l.poi.id===id&&!!l.departure===departing);
 if(!raw)throw Error(`Missing practice phase ${id}`);
 const level={...raw};applyApproachWeather(level,12345);levels.set(`${id}:${departing}`,level);
 if(!departing)site.add(new Option(level.poi.name,id));
}
let paused=true,elapsed=0,accumulator=0,last=performance.now();
let current:any;
const neutral=readInput();
function reset(id=site.value,departing=phase.value==='departure',entry=full.checked){
 const level=levels.get(`${id}:${departing}`);if(!level)throw Error('Unknown practice site');
 site.value=id;phase.value=departing?'departure':'approach';full.checked=entry;
 const state=entry&&!departing?createApproachState(level):createApproachState(level,{
  x:departing?0:-9000,y:departing?getApproachTerrainHeight(0,level)+600:4500,
  vx:departing?0:200,vy:departing?40:-30,angle:departing?0:1.45,
 });
 const cam=createApproachCamera(level);updateApproachCamera(cam,state,level,0,1200,720);
 current={kind:'approach',level,as:state,cam,state:'approaching',worldTimeStart:12345,missionDvStart:0};
 elapsed=0;accumulator=0;paused=true;play.textContent='Fly';draw();
}
function draw(){
 game.time=elapsed;
 game.renderGameplayPhase(current,'Practice complete',current.level.poi.name,'Hartwell',false);
 status.textContent=`${current.level.poi.name} · ${current.level.departure?'departure':'approach'} · ${paused?'paused':'flying'} · ${elapsed.toFixed(1)} s · no career/save changes`;
}
function step(input:InputState,dt:number){
 elapsed+=dt;updateApproach(current.as,input,current.level,dt,12345+elapsed);
 updateApproachCamera(current.cam,current.as,current.level,dt,1200,720);
 if(!current.as.alive)current.state='approachFailed';
 else if(current.as.gateReached)current.state='approachSuccess';
 if(current.state!=='approaching'){paused=true;play.textContent='Fly';}
}
function advance(seconds:number,input:Partial<InputState>={}){
 if(!Number.isFinite(seconds)||seconds<0||seconds>20)throw Error('Invalid practice advance');
 paused=true;const n=Math.ceil(seconds*120);
 for(let i=0;i<n&&current.state==='approaching';i++)step({...neutral,...input,toggleWings:i===0&&!!input.toggleWings},seconds/n);
 draw();return snapshot();
}
function snapshot(){return{level:current.level,site:site.value,departure:!!current.level.departure,elapsed,paused,state:{...current.as},camera:{...current.cam}};}
function checks(){
 paused=true;let count=0;
 const assert=(ok:unknown,message:string)=>{count++;if(!ok)throw Error(message);};
 const hash=()=>{let h=2166136261;for(const v of ctx.getImageData(0,0,1200,720).data)h=Math.imul(h^v,16777619);return h>>>0;};
 const career=JSON.stringify(game.career),levelState=JSON.stringify([...levels]);
 const timings:number[]=[];
 for(const id of HARTWELL_APPROACH_TARGETS)for(const departing of [false,true]){
  reset(id,departing,false);const state=JSON.stringify(current.as),live=hash(),pixels=ctx.getImageData(0,0,1200,720).data;
  const footer=ctx.getImageData(0,686,1,34).data;
  assert(footer.every((v,i)=>v===(i%4===3?255:0)),`${id}/${departing}: controls have opaque black backing`);
  assert(typeof game.approachScenery==='function','actual Game hook initializes runtime scenery');
  const runtime=game.approachScenery;
  game.approachScenery=createHartwellScenery(hartwellApproachRegion(id));draw();
  const after=ctx.getImageData(0,0,1200,720).data;
  // Cached ground is filtered at its LOD; sky/background and overlays above the
  // exact live collision contour must still match the approved direct renderer.
  let sameSky=true;
  for(let x=0;x<1200;x++){
    const wx=current.cam.x+(x-600)/current.cam.zoom;
    const edge=360-(getApproachTerrainHeight(wx,current.level)-current.cam.y)*current.cam.zoom;
    for(let y=0;y<Math.min(720,edge-3);y++)for(let ch=0;ch<4;ch++){
      const at=(y*1200+x)*4+ch;if(Math.abs(after[at]-pixels[at])>1)sameSky=false;
    }
  }
  assert(sameSky,`${id}/${departing}: cache changes no sky/background/gate geometry`);
  game.approachScenery=()=>false;draw();assert(hash()!==live,`${id}/${departing}: new scenery enabled, not original fallback`);
  game.approachScenery=runtime;draw();assert(JSON.stringify(current.as)===state,'render does not change flight');
  const cached=hash(),built=runtime.diagnostics().builds;draw();
  assert(hash()===cached&&runtime.diagnostics().builds===built,'stationary frame reuses strips with identical pixels');
  assert(runtime.diagnostics().pixels<=runtime.diagnostics().maxPixels&&runtime.diagnostics().entries<=32,'bounded cache');
  const first=advance(1,{throttleUp:true,pitch:.2});
  assert(first.elapsed>0&&first.state.dvUsed>0,'actual physics responds to flight controls');
  reset(id,departing,false);const replay=advance(1,{throttleUp:true,pitch:.2});
  assert(JSON.stringify(replay.state)===JSON.stringify(first.state),'restart/control replay deterministic');
  // Actual production camera range, including zoomed-out ascent/entry. CPU submission only.
  for(const zoom of [.008,.015,.04,.08]){
   current.cam.zoom=zoom;const t=performance.now();draw();timings.push(performance.now()-t);
   assert(Number.isFinite(current.cam.x)&&current.as.alive,'live-camera render remains valid');
  }
 }
 // Exact-size cached pixels, including the strip boundary atworld x=0, versus
 // the original material. This catches gaps/coordinate shifts without comparing LODs.
 reset(HARTWELL_APPROACH_TARGETS[0],false,false);
 current.cam={x:0,y:2000,zoom:.08};draw();
 const seamRow=ctx.getImageData(0,560,1200,1).data,runtime=game.approachScenery;
 game.approachScenery=createHartwellScenery(hartwellApproachRegion(site.value));draw();
 const directRow=ctx.getImageData(0,560,1200,1).data;
 assert(seamRow.every((v,i)=>Math.abs(v-directRow[i])<=2),'native-scale strips retain original material across seams');
 game.approachScenery=runtime;draw();const beforeEviction=ctx.getImageData(0,0,1200,720).data;
 for(let i=0;i<24;i++){current.cam.x=i*30000;draw();}
 assert(runtime.diagnostics().evictions>0&&runtime.diagnostics().pixels<=runtime.diagnostics().maxPixels,'moving camera evicts within budget');
 current.cam.x=0;draw();const rebuilt=ctx.getImageData(0,0,1200,720).data;
 assert(rebuilt.every((v,i)=>Math.abs(v-beforeEviction[i])<=1),'evicted strips replay deterministically');
 const previousBuilds=runtime.diagnostics().builds;runtime.clear();draw();
 assert(runtime.diagnostics().builds>previousBuilds,'explicit cache clear rebuilds');
 for(const speed of [100,500]){
  current.as.vx=speed;current.as.vy=0;draw();
  const base=current.level.poi.altitude||getApproachTerrainHeight(current.level.gateX,current.level);
  const left=600-current.level.gateRadius*.08,top=360-(base+current.level.gateY-2000)*.08;
  const h=current.level.gateY*.08;let dark=0,pale=0,colored=0;
  const strip=ctx.getImageData(Math.round(left)-3,Math.ceil(top)+6,4,Math.floor(h)-12).data;
  const rgb=speed===100?[0,255,204]:[0,119,102];
  for(let i=0;i<strip.length;i+=4){const r=strip[i],g=strip[i+1],b=strip[i+2];
   if(r===3&&g===7&&b===11)dark++;
   if(r===214&&g===232&&b===232)pale++;
   if(r===rgb[0]&&g===rgb[1]&&b===rgb[2])colored++;
  }
  assert(dark>30&&pale>10&&colored>10,`gate has black/pale contrast and original speed color at${speed}`);
  const label=ctx.getImageData(600,Math.ceil(top)-18,1,1).data;
  assert(label[0]===3&&label[1]===7&&label[2]===11,'speed label has black backing');
 }
 const other={...current.level,body:{...current.level.body,id:'estella-iii'}};
 const dispatcher=createApproachScenery();
 renderApproach(ctx,canvas,current.cam,current.as,other,0);const original=hash();
 renderApproach(ctx,canvas,current.cam,current.as,other,0,true,dispatcher);
 assert(hash()===original,'other worlds retain original scenery exactly');
 assert(JSON.stringify(game.career)===career,'in-memory career unchanged');
 assert(JSON.stringify([...levels])===levelState,'levels/weather/targets unchanged');
 assert(JSON.stringify([BODIES,SURFACE_POIS])===catalog,'catalog unchanged');
 reset(HARTWELL_APPROACH_TARGETS[0],false,false);
 timings.sort((a,b)=>a-b);
 return{passed:true,checks:count,cpuSubmissionMean:timings.reduce((a,b)=>a+b,0)/timings.length,cpuSubmissionP95:timings[Math.ceil(timings.length*.95)-1]};
}
site.onchange=phase.onchange=full.onchange=()=>reset();
document.getElementById('reset')!.onclick=()=>reset();
play.onclick=()=>{if(current.state!=='approaching')reset();paused=!paused;last=performance.now();play.textContent=paused?'Fly':'Pause';canvas.focus();};
document.getElementById('checks')!.onclick=()=>{const r=checks();status.textContent=`PASS — ${r.checks} production flight checks`;};
function frame(now:number){
 const input=readInput(),dt=Math.min(.1,(now-last)/1000);last=now;
 if(input.reset)reset();
 if(input.levelSelect){paused=true;play.textContent='Fly';draw();}
 if(!paused&&!document.hidden){
  accumulator+=dt;let first=true;
  while(accumulator>=1/120&&!paused){step({...input,toggleWings:first&&input.toggleWings},1/120);first=false;accumulator-=1/120;}
  draw();
 }
 requestAnimationFrame(frame);
}
window.addEventListener('blur',()=>{paused=true;play.textContent='Fly';});
document.addEventListener('visibilitychange',()=>{if(document.hidden){paused=true;play.textContent='Fly';accumulator=0;}});
reset();requestAnimationFrame(frame);
(window as any).hartwellFlight={ready:true,reset,advance,snapshot,checks};
