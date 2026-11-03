import { Game } from '../src/game';
import { drawRegionalWindBands } from '../src/approach-wind-bands';
import { defaultCareerProfile } from '../src/career-state';
import { createMaintenanceTelemetry } from '../src/maintenance/telemetry';
import { createDefaultRigState } from '../src/maintenance/rig-state';
import { config } from '../src/config';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { BODIES, SURFACE_POIS, bodyById, surfacePoiById } from '../src/world';
import { createLandingLevel } from '../src/levels';
import { generateTerrain, getTerrainHeight } from '../src/terrain';
import { APPROACH_LEVELS, approachWindAcceleration, approachTurbulenceTorque, approachInTurbulence } from '../src/approach';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { landingAerodynamics, landingSasForce } from '../src/landing-air';
import { createRegionalWeather } from '../src/surface-weather';
import { createFlightAtmosphere, NEUTRAL_FLIGHT_INPUT } from '../src/flight-atmosphere';
import { readInput } from '../src/input';
const canvas=document.getElementById('flight') as HTMLCanvasElement,ctx=canvas.getContext('2d')!;
const site=document.getElementById('site') as HTMLSelectElement,view=document.getElementById('view') as HTMLSelectElement,epoch=document.getElementById('epoch') as HTMLInputElement;
const play=document.getElementById('play')!,status=document.getElementById('status')!;
const sites=SURFACE_POIS.filter(p=>bodyById(p.bodyId).atmosphere),catalog=JSON.stringify([BODIES,SURFACE_POIS]);
for(const p of sites){const o=document.createElement('option');o.value=p.id;o.textContent=`${bodyById(p.bodyId).name} — ${p.name}`;site.append(o);}site.value='estella-vi-spaceport';
const templates=new Map<string,{approach:any;departure:any}>();
function phases(id:string){
 let p=templates.get(id);if(p)return p;
 const canonical=canonicalEstellaLocationId(id);
 createPlayableEstellaMission('estella-iii-main-customs',id,undefined,0);
 const approach={...APPROACH_LEVELS.find(l=>l.poi.id===canonical&&!l.departure)!,poi:surfacePoiById(id)};
 createPlayableEstellaMission(id,'estella-iii-main-customs',undefined,0);
 const departure={...APPROACH_LEVELS.find(l=>l.poi.id===canonical&&l.departure)!,poi:surfacePoiById(id)};
 if(!approach.body||!departure.body)throw Error(`Missing actual flight template for ${id}`);
 p={approach,departure};templates.set(id,p);return p;
}
const game:any=Object.create(Game.prototype);let paused=true,checking=false,last=performance.now(),accumulator=0;
Object.assign(game,{canvas,ctx,career:defaultCareerProfile(),surfaceWeatherEnabled:true,weatherVisuals:true,weatherLow:false,missionDvUsed:0,activeMissionQuote:null,activeManifestCondition:{integrity:null,comfort:null},activeMaintenanceTelemetry:createMaintenanceTelemetry(),showGuidance:()=>{},showContextualOperationsManual:()=>{},completePhase:()=>{paused=true;},completeTransition:(_p:any,t:any)=>{t.run();}});
game.career.rig=createDefaultRigState(true); // Synthetic, actually equipped atmospheric rig; never a live save.
function reset(id=site.value,mode=view.value,seconds=Number(epoch.value)){
 if(!Number.isFinite(seconds)||seconds<0)throw Error('Invalid mission clock');
 site.value=id;view.value=mode;epoch.value=String(seconds);paused=true;accumulator=0;play.textContent='Fly';
 const level=createLandingLevel(id,995001),terrain=generateTerrain(level),p=phases(id);
 game.activeMaintenanceTelemetry=createMaintenanceTelemetry();game.activeManifestCondition={integrity:null,comfort:null};game.missionDvUsed=0;game.worldTime=seconds;
 if(mode==='approach'||mode==='departure'){
  game.loadApproach(mode==='approach'?p.approach:p.departure,{x:mode==='approach'?-1800:0,y:terrain.pad.y+2500,vx:mode==='approach'?100:20,vy:mode==='approach'?-8:40,angle:mode==='approach'?1.5:.3},seconds);
  Object.assign(game.phase.cam,{x:0,y:terrain.pad.y+2300,zoom:.065});
 }else{
  game.loadLanding(level,{x:1000,y:terrain.pad.y+85,vx:0,vy:0},mode==='parked'?{targetAltitude:500,orbitDir:1,nextApproachLevelId:p.departure.id}:undefined,seconds);
  Object.assign(game.phase.ship,{sas:true,gearDeployed:true,throttle:mode==='parked'?0:level.gravity/config.mainEngineAccel});
  Object.assign(game.phase.camera,{x:1000,y:terrain.pad.y+95,zoom:2.6});
 }
 draw();return snapshot();
}
function draw(){const p=game.phase;game.renderGameplayPhase(p,'Practice complete',p.level.poi.name,p.level.body.name,false);status.textContent=`${p.level.poi.name} · ${p.kind} · ${paused?'paused':'flying'} · mission ${(p.worldTimeStart+game.time).toFixed(2)} s · no saves`;}
function step(input={...NEUTRAL_FLIGHT_INPUT}){if(game.phase.kind==='landing')game.handleLanding({...input},1/120);else game.handleApproach({...input},1/120);if(game.phase.state==='crashed'||game.phase.state==='approachFailed')paused=true;}
function advance(seconds:number,input:Partial<typeof NEUTRAL_FLIGHT_INPUT>={}){if(!Number.isFinite(seconds)||seconds<0||seconds>20)throw Error('Invalid step');paused=true;for(let i=0;i<Math.round(seconds*120);i++)step({...NEUTRAL_FLIGHT_INPUT,...input,toggleSAS:i===0&&!!input.toggleSAS});draw();return snapshot();}
function snapshot(){const p=game.phase,air=p.kind==='landing'?game.landingAtmosphere(p)?.air:p.level.flightAir,s=p.ship??p.as;return{site:p.level.poi.id,phase:p.kind,epoch:p.worldTimeStart,time:game.time,state:p.state,ship:{...s},wind:air?.sample(s.x,s.y,game.time),effects:game.regionalAtmosphere?.pilot.effects.diagnostics(),particles:game.regionalAtmosphere?.pilot.effects.tracerSnapshot()};}
async function checks(){
 checking=true;paused=true;let n=0;const assert=(ok:unknown,msg:string)=>{n++;if(!ok)throw Error(msg);};const results:any[]=[];
 const saved={site:site.value,view:view.value,epoch:Number(epoch.value),visual:game.weatherVisuals,low:game.weatherLow};
 const storage=JSON.stringify({...localStorage});
 try{
  for(const poi of sites){
   reset(poi.id,'landing',12345);await game.landingScenery.prepare(game.phase.level);
   assert(!!game.landingAtmosphere(game.phase)?.physicsAir,`${poi.id} automatically enabled`);
   advance(1);const a=snapshot(),pool=JSON.stringify(a.particles);draw();draw();assert(pool===JSON.stringify(snapshot().particles),'draw cannot advance particles');
   assert(a.effects.tracers.active>0&&a.effects.tracers.active<=128&&a.effects.active<=256,'bounded atmospheric effects');
   results.push({site:poi.name,body:game.phase.level.body.name,wind:a.wind.vx,drift:a.ship.x-1000});
   reset(poi.id,'landing',12345);advance(1);assert(JSON.stringify(snapshot())===JSON.stringify(a),'actual Game retry reproduces controls/weather/effects');
   game.weatherVisuals=false;game.weatherLow=true;reset(poi.id,'landing',12345);advance(1);const b=snapshot();assert(JSON.stringify(a.ship)===JSON.stringify(b.ship)&&pool===JSON.stringify(b.particles),'visual flags never alter simulation');game.weatherVisuals=true;game.weatherLow=false;
   const phase=game.phase,air=game.landingAtmosphere(phase).air,landingForce=landingAerodynamics(12,-3,1000,phase.terrain.pad.y+85,0,config.dragCoeff,air);
   const labels:string[]=[],originalText=ctx.fillText.bind(ctx);
   const captureText=(text:string,x:number,y:number,maxWidth?:number)=>{if(/^[←→] \d+\.\d · [↑↓] \d+\.\d m\/s$/.test(text))labels.push(text);if(maxWidth===undefined)originalText(text,x,y);else originalText(text,x,y,maxWidth);};
   ctx.fillText=captureText;
   try{reset(poi.id,'departure',12345);}finally{ctx.fillText=originalText;}
   const flight=game.phase.level;
   assert(labels.length>0,'actual regional departure renderer restores wind band velocity labels');
   assert(!!flight.flightAir&&flight.windLayers.length===0&&flight.turbulence.length===0,'approach replaces legacy weather, no double force/torque');
   const force=approachWindAcceleration(0,phase.terrain.pad.y+85,12,-3,flight,0);
   assert(Math.abs(force.ax-landingForce.windAX)<1e-12&&Math.abs(force.ay-landingForce.windAY)<1e-12,'shared near-site handoff air and wind force');
   advance(.25);const departure=snapshot();reset(poi.id,'departure',12345);advance(.25);assert(departure.ship.alive&&departure.ship.x!==0&&JSON.stringify(snapshot().ship)===JSON.stringify(departure.ship),'actual equipped departure advances and retry is stable');
   labels.length=0;ctx.fillText=captureText;try{reset(poi.id,'approach',12345);}finally{ctx.fillText=originalText;}
   assert(labels.length>0,'actual regional approach renderer restores wind band velocity labels');
   advance(.25);assert(game.phase.as.alive&&game.phase.state==='approaching'&&game.phase.as.x!==-1800&&Number.isFinite(game.phase.as.vx)&&!!game.phase.level.flightAir,'actual equipped descent advances with new air');
   reset(poi.id,'parked',12345);advance(1);const parked=snapshot();assert(parked.ship.dvUsed===0&&parked.ship.x===1000&&parked.effects.active===0&&parked.effects.tracers.active>0,'parked wind without fuel or smoke');
   reset(poi.id,'landing',12345+7200);assert(Math.abs(snapshot().wind.vx-a.wind.vx)>.001,'mission time changes conditions');
   if(poi.landingLayout?.kind==='cloud-city'){
    const layout=poi.landingLayout,weather=createRegionalWeather(bodyById(poi.bodyId),poi),fx=createFlightAtmosphere(poi.id,weather),terrain=game.phase.terrain;
    const scratch=document.createElement('canvas');scratch.width=scratch.height=128;const c=scratch.getContext('2d')!;
    const stillAir={sample:()=>({vx:0,density:1})};
    const alphaAt=(x:number,y:number)=>{
     fx.reset();fx.emitSmoke({x,y,vx:0,vy:0,size:3,life:2},stillAir,0);
     for(let i=0;i<60;i++)fx.step({...game.phase.ship,thrustFiring:false},stillAir,terrain,1/120,i/120);
     c.clearRect(0,0,128,128);fx.drawLanding(c,{x,y,zoom:4},terrain,stillAir,poi.id,.5,12345.5,128,128,false);
     return c.getImageData(64,64,1,1).data[3];
    };
    assert(alphaAt(1000,layout.deckY+100)>0,'floating smoke positive paint control');
    assert(alphaAt(1000,layout.deckY-layout.deckThickness/2)===0,'no smoke through floating deck');
    const dome=layout.domes[0];assert(alphaAt(dome.x,layout.deckY+dome.height/2)===0,'no smoke through floating dome');
    assert(alphaAt(layout.supportXs[0],layout.deckY-layout.supportHeight/2)===0,'no smoke through floating support');
   }
  }
  for(const poi of SURFACE_POIS.filter(p=>!bodyById(p.bodyId).atmosphere)){
   const level=createLandingLevel(poi.id,995002);game.loadLanding(level,undefined,undefined,0);assert(!game.landingAtmosphere(game.phase),'all vacuum destinations excluded');
  }
  // Native clipping controls: wind-band ink is airspace-only, with calm/vacuum suppression.
  const bandsCanvas=document.createElement('canvas');bandsCanvas.width=bandsCanvas.height=256;
  const bandsCtx=bandsCanvas.getContext('2d')!;
  const bandPaint=(vx:number,density:number)=>{bandsCtx.clearRect(0,0,256,256);drawRegionalWindBands(bandsCtx,{x:0,y:0,zoom:1},{sample:()=>({vx,density})},()=>0,90,256,256,12345);};
  bandPaint(12,1);assert(bandsCtx.getImageData(0,40,256,86).data.some(v=>v>0),'native wind band positive paint control');
  assert(bandsCtx.getImageData(0,130,256,126).data.every(v=>v===0),'bands never paint below terrain');
  assert(bandsCtx.getImageData(0,0,256,36).data.every(v=>v===0),'bands never paint above atmospheric ceiling');
  for(const [v,d]of [[0,1],[12,0]]){bandPaint(v,d);assert(bandsCtx.getImageData(0,0,256,256).data.every(v=>v===0),'calm/vacuum has no wind band paint');}
  // Synthetic snapshots only; running transition callbacks invokes real loaders, never settlement.
  reset('estella-v-open-cast-mine','landing',23456);advance(.5);const source=game.phase;source.launchGuidance={targetAltitude:500,orbitDir:1,nextApproachLevelId:phases(source.level.poi.id).departure.id};
  const t=game.transitionLandingToApproach(source);assert(!!t,'actual departure handoff exists');t.run();assert(game.phase.worldTimeStart===23456+.5||Math.abs(game.phase.worldTimeStart-(23456+.5))<1e-8,'handoff keeps mission clock');
  reset('estella-v-open-cast-mine','approach',23456);advance(.5);game.phase.as.x=0;game.phase.as.y=1500;const arrival=game.transitionApproachToLanding(game.phase);arrival.run();assert(!!game.landingAtmosphere(game.phase)&&Math.abs(game.phase.worldTimeStart-(23456+.5))<1e-8,'actual arrival starts regional landing air at continuation time');
  // Exercise actual Game handlers in a strong, terrain-clear lower-field cell.
  // The synthetic pilot commands normal lateral keys and finite-rate throttle keys.
  const stribogHandling:any[]=[];
  const stribogFlight=(epoch:number,manual:boolean)=>{
   reset('estella-vi-spaceport','landing',epoch);
   const terrain=game.phase.terrain,air=game.landingAtmosphere(game.phase).air,y=terrain.pad.y+140;
   let startX=1000,best=-1;
   for(let x=200;x<=1800;x+=10){if(Math.max(getTerrainHeight(terrain,x-15),getTerrainHeight(terrain,x+15))>y-20)continue;
    const f=landingAerodynamics(0,0,x,y,0,config.dragCoeff,air),m=Math.hypot(f.windAX,f.windAY);if(m>best){best=m;startX=x;}}
   game.loadLanding(game.phase.level,{x:startX,y,vx:0,vy:0},undefined,epoch);
   Object.assign(game.phase.ship,{sas:true,gearDeployed:true,throttle:game.phase.level.gravity/config.mainEngineAccel});
   let maxDrift=0,dir=0,effort=0,verticalDir=0,holdTicks=0;
   for(let tick=0;tick<3600;tick++){
    const p=game.phase,s=p.ship,air=game.landingAtmosphere(p).air;
    if(tick%30===0){
     const f=landingAerodynamics(s.vx,s.vy,s.x,s.y,game.time,config.dragCoeff,air),sas=landingSasForce(s.vx,s.vy,config.mainEngineAccel*.1,f);
     const correction=-f.ax-sas.ax-s.vx*1.5-(s.x-startX)*.15;
     dir=manual&&Math.abs(correction)>.15?Math.sign(correction):0;
     const target=Math.max(0,Math.min(1,(config.gravity-f.ay-sas.ay-s.vy*1.5-(s.y-y)*.15)/config.mainEngineAccel));
     const error=target-s.throttle;verticalDir=manual?Math.sign(error):0;
     holdTicks=manual?Math.min(30,Math.round(Math.abs(error)/(config.throttleRate*.25)*120)):0;
    }
    step({...NEUTRAL_FLIGHT_INPUT,moveLeft:dir<0,moveRight:dir>0,throttleUp:holdTicks>0&&verticalDir>0,throttleDown:holdTicks>0&&verticalDir<0,shiftHeld:false});
    if(dir||holdTicks>0)effort++;holdTicks--;
    maxDrift=Math.max(maxDrift,Math.hypot(game.phase.ship.x-startX,game.phase.ship.y-y));
   }
   return{snapshot:snapshot(),maxDrift,effort,best,startX};
  };
  for(const epoch of [0,12345,43200]){
   const untrimmed=stribogFlight(epoch,false),trimmed=stribogFlight(epoch,true),retry=stribogFlight(epoch,true);
   assert(trimmed.maxDrift<6&&trimmed.maxDrift<untrimmed.maxDrift&&trimmed.effort>0,'actual Stribog ordinary reactive lateral trim controls gusts');
   assert(trimmed.snapshot.state==='flying'&&trimmed.snapshot.time>29.9&&trimmed.snapshot.ship.dvUsed>0,`gust control uses live equipped flight and paid thrust: ${JSON.stringify({epoch,state:trimmed.snapshot.state,ship:trimmed.snapshot.ship,time:trimmed.snapshot.time})}`);
   assert(JSON.stringify(trimmed)===JSON.stringify(retry),'actual gusts and reactive input replay identically');
   stribogHandling.push({epoch,untrimmed:untrimmed.maxDrift,trimmed:trimmed.maxDrift});
  }
  // The warning must correspond to an actual rare spatial buffet, not all wind.
  reset('estella-vi-spaceport','approach',0);const al=game.phase.level;
  let core={x:0,y:3500,vx:140,vy:0},peak=0;
  for(let x=-6000;x<=6000;x+=80)for(let y=1800;y<=8000;y+=80){const m={x,y,vx:140,vy:0},v=Math.abs(approachTurbulenceTorque(m,al,0));if(v>peak){peak=v;core=m;}}
  assert(peak>.8,'pronounced approach buffet exists');
  game.loadApproach(al,{...core,angle:1.4},0);
  const labels:string[]=[],text=ctx.fillText.bind(ctx),initial=JSON.stringify(game.phase.as);
  ctx.fillText=(t:string,x:number,y:number,max?:number)=>{labels.push(t);if(max===undefined)text(t,x,y);else text(t,x,y,max);};
  try{draw();}finally{ctx.fillText=text;}
  assert(labels.includes('⚠ TURBULENCE')&&approachInTurbulence(core.y,game.phase.level,0,core),'actual HUD warns only for applied local buffet');
  assert(JSON.stringify(game.phase.as)===initial,'warning/render does not alter flight');
  advance(4);const buffeted=snapshot();assert(buffeted.ship.alive&&Math.abs(buffeted.ship.angle-1.4)>.08,'actual Game applies visible rotational buffet');
  game.reloadPhase(game.phase);advance(4);assert(JSON.stringify(snapshot().ship)===JSON.stringify(buffeted.ship),'actual approach retry reproduces spatial field and buffet');
  assert(JSON.stringify([BODIES,SURFACE_POIS])===catalog,'catalog/geography unchanged');assert(JSON.stringify({...localStorage})===storage,'no career/save writes');
  return{passed:true,checks:n,sites:sites.length,worlds:new Set(sites.map(p=>p.bodyId)).size,results,stribogHandling};
 }finally{game.weatherVisuals=saved.visual;game.weatherLow=saved.low;reset(saved.site,saved.view,saved.epoch);checking=false;}
}
async function performanceCheck(paint=true){
 checking=true;paused=true;const oldW=canvas.width,oldH=canvas.height;
 try{canvas.width=1920;canvas.height=1080;const samples:number[]=[],frames:number[]=[];let prev=performance.now();
  for(let i=0;i<210;i++){await new Promise(requestAnimationFrame);const now=performance.now();if(i>=30)frames.push(now-prev);prev=now;
   const t=performance.now();if(paint)draw();if(i>=30)samples.push(performance.now()-t);
  }samples.sort((a,b)=>a-b);return{paint,width:1920,height:1080,mean:samples.reduce((a,b)=>a+b,0)/180,p95:samples[171],max:samples[179],fps:180000/frames.reduce((a,b)=>a+b,0)};
 }finally{canvas.width=oldW;canvas.height=oldH;checking=false;}
}
for(const control of [site,view,epoch])control.onchange=()=>reset();
document.getElementById('reset')!.onclick=()=>reset();document.getElementById('later')!.onclick=()=>reset(site.value,view.value,Number(epoch.value)+21600);
play.onclick=()=>{paused=!paused;play.textContent=paused?'Fly':'Pause';};document.getElementById('checks')!.onclick=async()=>{const r=await checks();status.textContent=`PASS: ${r.checks} checks / ${r.sites} atmospheric sites`;};
for(const [id,key]of [['visuals','weatherVisuals'],['low','weatherLow']])document.getElementById(id)!.onchange=e=>{game[key]=(e.target as HTMLInputElement).checked;draw();};
window.addEventListener('keydown',e=>{if(e.key==='Escape'){paused=true;play.textContent='Fly';}});
function frame(now:number){const dt=Math.min(.05,(now-last)/1000);last=now;if(!checking){const input=readInput();if(!paused&&!document.hidden){accumulator+=dt;let first=true;while(accumulator>=1/120){step({...input,toggleSAS:first&&input.toggleSAS,toggleGear:first&&input.toggleGear,toggleWings:first&&input.toggleWings});first=false;accumulator-=1/120;}}draw();}requestAnimationFrame(frame);}
window.addEventListener('blur',()=>{paused=true;play.textContent='Fly';});document.addEventListener('visibilitychange',()=>{if(document.hidden){paused=true;accumulator=0;play.textContent='Fly';}});
reset();requestAnimationFrame(frame);(window as any).surfaceWeather={ready:true,reset,advance,snapshot,checks,performance:performanceCheck,game};
