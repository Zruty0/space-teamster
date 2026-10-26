import { createWorldWeather } from '../src/world-weather';
import { drawCurrentWorldDisc as drawAuthoredWorldDisc } from '../src/world-presentation';
import { orientBalorOrbitalVisit } from '../src/balor-orientation';
import { WEATHER_DIRECTIONS } from '../src/atmosphere-gallery-profiles';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { ORBITAL_LEVELS, createOrbitalState, renderOrbital, type OrbitalLevel } from '../src/orbital';
import { bodyById, SURFACE_POIS } from '../src/world';
import { Game } from '../src/game';
import { defaultCareerProfile } from '../src/career-state';
const atlas=document.getElementById('atlas')as HTMLCanvasElement,flight=document.getElementById('flight')as HTMLCanvasElement;
const ctx=atlas.getContext('2d',{willReadFrequently:false})!,fctx=flight.getContext('2d',{willReadFrequently:false})!;
const status=document.getElementById('status')!,select=document.getElementById('scene')as HTMLSelectElement;
let wall=0,time=0,playing=false,last=performance.now();
const weatherHashes=new Map<string,number>(),probe=document.createElement('canvas');probe.width=probe.height=576;
const probeCtx=probe.getContext('2d',{willReadFrequently:false})!;
const weather=createWorldWeather(1792879200123,()=>wall,(id,image)=>{
 probeCtx.clearRect(0,0,576,576);probeCtx.drawImage(image,0,0);weatherHashes.set(id,hash(probe));
}),levels=new Map<string,OrbitalLevel>();
const allIds=[...WEATHER_DIRECTIONS.map(d=>d.id),'estella-i'];
for(const id of allIds){
 const poi=SURFACE_POIS.find(p=>p.bodyId===id)!;
 const before=new Set(ORBITAL_LEVELS.map(l=>l.id));createPlayableEstellaMission('estella-vi-heavy-cargo-station',poi.id,undefined,8001);
 const raw=ORBITAL_LEVELS.find(l=>!before.has(l.id)&&l.bodyId===id&&l.reentryApproachLevelId!==undefined);
 if(!raw)throw Error(`Missing native flight ${id}`);
 levels.set(id,orientBalorOrbitalVisit(raw,0));const option=new Option(bodyById(id).name,id);select.add(option);
}
for(const id of ['estella','estella-xi','estella-xii']){
 const level=ORBITAL_LEVELS.find(l=>l.bodyId===id&&l.systemBodies?.length);
 if(level){levels.set(id,level);select.add(new Option(`${bodyById(id).name} system`,id));}
}
select.value='estella-iv';
function paintAtlas(){
 wall+=110;weather.beginFrame(time);ctx.fillStyle='#07111b';ctx.fillRect(0,0,1200,670);
 for(const [i,direction]of WEATHER_DIRECTIONS.entries()){
  const x=150+i%4*300,y=158+Math.floor(i/4)*320,body=bodyById(direction.id);
  if(!weather.draw(ctx,direction.id,x,y,112,body.color))drawAuthoredWorldDisc(ctx,direction.id,x,y,112,body.color);
  if(!weather.draw(ctx,direction.id,x+100,y+130,12,body.color))drawAuthoredWorldDisc(ctx,direction.id,x+100,y+130,12,body.color);
  ctx.fillStyle='#c5d8e4';ctx.font='17px system-ui';ctx.textAlign='center';ctx.fillText(direction.name,x,y-125);
 }
 weather.endFrame();
}
function paintFlight(id=select.value){
 wall+=110;const level=levels.get(id)!,body=bodyById(id);
 const radius=level.systemBodies?Math.max(...level.systemBodies.map(b=>b.orbitRadius))*1.15:body.radius*1.6;
 const state=createOrbitalState(level,{x:body.radius*1.25,y:body.radius*.3,vx:0,vy:100,time});
 const cam={x:0,y:0,zoom:340/radius};const before=JSON.stringify([state,level]);
 renderOrbital(fctx,flight,cam,state,level,0,true,true,weather);
 if(JSON.stringify([state,level])!==before)throw Error('Artwork mutated flight state');
 return{level,state,cam};
}
function draw(){paintAtlas();paintFlight();document.getElementById('diagnostics')!.textContent=JSON.stringify(weather.diagnostics(),null,2);status.textContent=`World time ${time.toFixed(1)}s · art time ${(time/60).toFixed(1)}s`;}
function warm(){for(let i=0;i<10;i++)paintAtlas();}
function hash(canvas:HTMLCanvasElement,x=0,y=0,w=canvas.width,h=canvas.height){let out=2166136261;for(const v of canvas.getContext('2d')!.getImageData(x,y,w,h).data)out=Math.imul(out^v,16777619);return out>>>0;}
function checks(){
 playing=false;let count=0;const assert=(ok:unknown,message:string)=>{count++;if(!ok)throw Error(message);};
 time=0;warm();const before=hash(atlas),beforeWeather=JSON.stringify([...weatherHashes]),diag=weather.diagnostics();
 assert(diag.cachedWorlds===8&&diag.noise?.noiseCacheEntries===8,'eight bounded live layers / noise entries');
 assert(diag.models.every(m=>!['estella-i','estella-x','estella-xi','estella-xii'].includes(m.id)),'Balor/giants excluded');
 const updates=diag.updates;paintAtlas();assert(weather.diagnostics().updates===updates,'paused simulation does not regenerate weather');
 time=360;let previous=weather.diagnostics().updates;
 for(let i=0;i<10;i++){paintAtlas();const next=weather.diagnostics().updates;assert(next-previous<=1,'at most one generation per display frame');previous=next;}
 assert(weather.diagnostics().frames.every(f=>f.artTime===6),'oldest-first refresh reaches every world without starvation');
 assert(hash(atlas)!==before,'live clouds evolve with world time');
 time=0;warm();
 // Compare complete transparent weather layers, independent of Skia's cached
 // terrain-edge rasterization on the composite atlas (which can vary at the rim).
 assert(JSON.stringify([...weatherHashes])===beforeWeather,'retry/reverse world time recreates exact full weather-layer pixels');
 const stable=JSON.stringify(weather.diagnostics().models);
 for(const id of levels.keys()){
  const p=paintFlight(id);assert(p.level.bodyId===id,'actual orbital or parent/system scene');
  assert(weather.diagnostics().models.length===8,'same stable per-world seed/profile registry');
 }
 assert(JSON.stringify(weather.diagnostics().models)===stable,'visits never reroll weather');
 // Exercise the actual Game rendering hook without its constructor/save IO.
 const game:any=Object.create(Game.prototype),scene=paintFlight('estella-iii');
 game.canvas=flight;game.ctx=fctx;game.career=defaultCareerProfile();game.time=9999;game.worldTime=180;
 game.orbitalWeather=weather;game.activeManifestCondition={};game.missionDvUsed=0;game.activeMissionQuote=null;
 scene.state.time=180;const careerBefore=JSON.stringify(game.career);wall+=110;
 game.renderGameplayPhase({kind:'orbital',level:scene.level,os:scene.state,cam:scene.cam,state:'orbiting',worldTimeStart:0,missionDvStart:0},'',undefined,undefined,true);
 assert(weather.diagnostics().artTime===3,'Game hook uses absolute orbital simulation time, not render/visit clock');
 assert(JSON.stringify(game.career)===careerBefore,'render never edits career state');
 // Resolved sizes reuse one image; tiny markers intentionally omit weather.
 const tiny=document.createElement('canvas');tiny.width=tiny.height=64;const tc=tiny.getContext('2d',{willReadFrequently:true})!,cold=createWorldWeather(1792879200123);
 const tb=bodyById('estella-iii');cold.beginFrame(0);assert(cold.draw(tc,tb.id,32,32,12,tb.color),'tiny marker works before WebGL preparation');cold.endFrame();
 assert(cold.diagnostics().cachedWorlds===0&&cold.diagnostics().updates===0,'tiny markers do not allocate or refresh unresolved weather');
 const tp=tc.getImageData(0,0,64,64).data;tc.clearRect(0,0,64,64);drawAuthoredWorldDisc(tc,tb.id,32,32,12,tb.color);const tq=tc.getImageData(0,0,64,64).data;
 assert(tp.every((v,i)=>Math.abs(v-tq[i])<=1),'tiny production marker equals approved static base, no cloud wash');cold.dispose();
 // Drawing itself never regenerates.
 time=0;warm();weather.beginFrame(0);const n=weather.diagnostics().updates;
 const body=bodyById('estella-iii');weather.draw(ctx,body.id,150,158,112,body.color);weather.draw(ctx,body.id,250,288,12,body.color);
 assert(weather.diagnostics().updates===n,'central/marker reuse cached field without mid-frame regeneration');
 const off=weather.draw(ctx,'estella-x',100,100,20,bodyById('estella-x').color);assert(!off,'giant dispatch remains original');
 assert(weather.diagnostics().noise?.error===0,'no WebGL errors');
 wall+=110;weather.beginFrame(120);weather.draw(ctx,body.id,150,158,112,body.color);weather.endFrame();
 const fresh=weather.diagnostics().updates;weather.endFrame();assert(weather.diagnostics().updates===fresh,'duplicate endFrame cannot exceed frame budget');
 wall+=50;weather.beginFrame(180);weather.draw(ctx,body.id,150,158,112,body.color);weather.endFrame();
 assert(weather.diagnostics().updates===fresh,'world cannot refresh faster than100ms');
 wall+=51;weather.beginFrame(180);weather.draw(ctx,body.id,150,158,112,body.color);weather.endFrame();
 assert(weather.diagnostics().updates===fresh+1,'refresh resumes after cadence limit');
 time=0;warm();draw();
 return{checks:count,atlasHash:hash(atlas),weatherHashes:[...weatherHashes],diagnostics:weather.diagnostics()};
}
select.onchange=()=>draw();document.getElementById('play')!.onclick=()=>{playing=!playing;last=performance.now();document.getElementById('play')!.textContent=playing?'Pause':'Play';};
document.getElementById('reset')!.onclick=()=>{time=0;warm();draw();};
document.getElementById('checks')!.onclick=()=>{try{const r=checks();status.textContent=`PASS — ${r.checks} production native checks`;}catch(error){status.textContent=String(error);}};
function frame(now:number){if(playing&&!document.hidden){time+=(now-last)/1000*60;draw();}last=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);
warm();draw();
(window as any).worldWeatherPreview={ready:true,checks,weather,render(worldTime:number,id=select.value){playing=false;time=worldTime;select.value=id;warm();draw();return weather.diagnostics();}};
window.addEventListener('pagehide',()=>weather.dispose(),{once:true});
