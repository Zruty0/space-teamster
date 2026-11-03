import './svg-dom';
import './approach-wind-bands.test';
import '../src/content/estella';
import './stribog-gusts.test';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { BODIES, SURFACE_POIS, bodyById, surfacePoiById } from '../src/world';
import { createRegionalWeather } from '../src/surface-weather';
import { landingAerodynamics, landingSasForce } from '../src/landing-air';
import { createLandingLevel } from '../src/levels';
import { generateTerrain, landingReferenceHeight } from '../src/terrain';
import { APPROACH_LEVELS, approachWindAcceleration, createApproachState, updateApproach, predictTrajectory } from '../src/approach';
import { createShip, updateShip } from '../src/ship';
import { config } from '../src/config';
import { NEUTRAL_FLIGHT_INPUT } from '../src/flight-atmosphere';
import { createPlayableEstellaMission } from '../src/estella-playable';
createPlayableEstellaMission('estella-iii-main-customs','estella-v-open-cast-mine',undefined,12345);
const template=APPROACH_LEVELS.find(p=>p.poi.id==='estella-v-open-cast-mine'&&!p.departure)!;
let checks=0;function assert(ok:unknown,msg:string){checks++;if(!ok)throw Error(msg);}
const saved={...config},catalog=JSON.stringify([BODIES,SURFACE_POIS]),report:any[]=[];
try{
 for(const poi of SURFACE_POIS){
  const body=bodyById(poi.bodyId),weather=createRegionalWeather(body,poi),level=createLandingLevel(poi.id,991120),terrain=generateTerrain(level),ground=(x:number)=>landingReferenceHeight(level,terrain,x),epoch=12345,air=weather.air(epoch,ground);
  if(!body.atmosphere){assert(air.sample(1000,100,20).density===0&&weather.wind(123)===0&&weather.advection(123)===0,`${poi.id} remains airless`);continue;}
  const canonical=createRegionalWeather(body,surfacePoiById(canonicalEstellaLocationId(poi.id)));
  assert(weather.wind(12345)===canonical.wind(12345)&&weather.advection(12345)===canonical.advection(12345),'district aliases share physical city weather');
  const y=terrain.pad.y+80,copy=createRegionalWeather(body,{...poi}),otherEpoch=weather.air(epoch+300,ground);
  assert(JSON.stringify(air.sample(1000,y,0))===JSON.stringify(canonical.air(epoch,ground).sample(1000,y,0)),'canonical districts share the complete vector field');
  for(const t of [0,20,300,9000,21600,86400,400000]){
   assert(weather.wind(t)===copy.wind(t),'permanent identity determinism');
   assert(Math.abs((weather.advection(t+.01)-weather.advection(t-.01))/.02-weather.wind(t))<.001,'analytic background cloud drift follows synoptic wind');
   assert(JSON.stringify(air.sample(1000,y,t+300))===JSON.stringify(otherEpoch.sample(1000,y,t)),'phase/retry epochs share the same absolute air');
  }
  assert(Math.abs(weather.wind(epoch)-weather.wind(epoch+7200))>.001,'mission time changes weather');
  assert(air.sample(1000,body.atmosphere.height,0).density===0&&air.sample(1000,body.atmosphere.height+100,0).vx===0,'no wind/air above atmosphere');
  const below=air.sample(1000,body.atmosphere.height-.001,0);assert(Math.abs(below.vx)<.001&&below.density<.00001,'continuous atmosphere edge');
  const approach={...template,body,poi,flightAir:air,gravity:level.gravity,surfaceDensity:body.atmosphere.surfaceDensity,scaleHeight:body.atmosphere.scaleHeight,gateRadius:0,gateX:1e9,departure:undefined};
  for(const vx of [-160,-20,0,20,160])for(const vy of [-20,0,20]){
   const a=landingAerodynamics(vx,vy,1000,y,20,config.dragCoeff,air),b=approachWindAcceleration(1000,y,vx,vy,approach,20);
   assert(a.windAX===b.ax&&a.windAY===b.ay,'approach/landing share exact matched-state wind forces');
   assert(Math.hypot(a.windAX,a.windAY)<=(weather.climate.landingWindLimit??weather.climate.windLimit)+1e-10,'climate force bound');
   for(const authority of [.4,1.2,2.45,4]){const sas=landingSasForce(vx,vy,authority,a);assert(Math.hypot(sas.ax,sas.ay)<=authority+1e-10,'finite SAS across loadouts');}
  }
  const start={x:1000,y:Math.max(terrain.pad.y+1500,2000),vx:15,vy:-5,angle:0},state=createApproachState(approach,start),prediction=predictTrajectory(state,approach,0,1/120,1/120);
  updateApproach(state,{...NEUTRAL_FLIGHT_INPUT},approach,1/120,0);
  assert(Math.abs(state.x-prediction.points[0].x)<1e-10&&Math.abs(state.y-prediction.points[0].y)<1e-10,'live/predicted approach weather agrees');
  if(poi.landingLayout?.kind==='cloud-city'){
   const sample=air.sample(1000,poi.altitude+10,0);
   assert(JSON.stringify(sample)===JSON.stringify(weather.air(epoch,()=>-1234,{siteY:terrain.pad.y}).sample(1000,poi.altitude+10,0)),'floating decks do not invent ground shelter');
   assert(Math.abs(sample.density-body.atmosphere.surfaceDensity*Math.exp(-(poi.altitude+10)/body.atmosphere.scaleHeight))<1e-9,'floating density uses absolute altitude');
  }
  let peak=0,peakTime=0;
  for(let t=0;t<86400;t+=7200)for(let x=500;x<=1500;x+=25){const a=landingAerodynamics(0,0,x,y,t,config.dragCoeff,air),f=Math.hypot(a.windAX,a.windAY);if(f>peak){peak=f;peakTime=t;}}
  Object.assign(config,saved,{gravity:level.gravity,startX:1000,startY:y,startVX:0,startVY:0});
  const sim=()=>{const s=createShip();Object.assign(s,{gearDeployed:true,sas:true,throttle:level.gravity/config.mainEngineAccel});for(let i=0;i<1200;i++)updateShip(s,{...NEUTRAL_FLIGHT_INPUT},1/120,peakTime+i/120,air);return s;};
  const first=sim(),retry=sim();assert(JSON.stringify(first)===JSON.stringify(retry),'deterministic full control replay');
  assert(Number.isFinite(first.x)&&Number.isFinite(first.dvUsed)&&first.dvUsed>0,'hover weather costs real finite control effort');
  if((weather.climate.landingWindLimit??weather.climate.windLimit)<config.mainEngineAccel*.1)assert(Math.abs(first.vx)<1e-8,'SAS holds ground vx within thrust authority');
  report.push({name:poi.name,body:body.name,label:weather.climate.label,peak:+peak.toFixed(3),drift:+(first.x-1000).toFixed(3),wind:+weather.wind(epoch).toFixed(1)});
 }
 const sorted=[...report].sort((a,b)=>b.peak-a.peak);
 assert(sorted[0].name==='Port Stribog'&&sorted[0].peak>config.mainEngineAccel*.1,'Stribog has greatest wind demand, can saturate default SAS');
 assert(sorted[1].name==='Zhulong','Zhulong is the second strongest surface weather challenge');
 assert(report.filter(p=>p.body==='Dahai'&&p.name!=='Zhulong').every(p=>p.peak<1),'other Dahai cities retain calmer marine conditions');
 assert(JSON.stringify([BODIES,SURFACE_POIS])===catalog,'weather never changes geography/catalog');
 console.log(JSON.stringify({sites:report.length,worlds:new Set(report.map(p=>p.body)).size,strongest:sorted.slice(0,8)},null,2));
 console.log(`Surface weather rollout: ${checks} checks passed.`);
}finally{Object.assign(config,saved);}
