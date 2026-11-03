import { bodyById, surfacePoiById } from '../src/world';
import { createLandingLevel } from '../src/levels';
import { generateTerrain, landingReferenceHeight } from '../src/terrain';
import { createRegionalWeather } from '../src/surface-weather';
import { landingAerodynamics } from '../src/landing-air';
import { config } from '../src/config';
import { createShip, updateShip } from '../src/ship';
import { NEUTRAL_FLIGHT_INPUT } from '../src/flight-atmosphere';
let checks=0;function assert(ok:unknown,msg:string){checks++;if(!ok)throw Error(msg);}
const poi=surfacePoiById('estella-vi-spaceport'),body=bodyById(poi.bodyId),weather=createRegionalWeather(body,poi);
const level=createLandingLevel(poi.id,991199),terrain=generateTerrain(level),ground=(x:number)=>landingReferenceHeight(level,terrain,x),air=weather.air(0,ground);
const saved={...config},normal=saved.mainEngineAccel*.05,sas=saved.mainEngineAccel*.1;
const epochs=[...Array.from({length:49},(_,i)=>i*1800),12345,43210,7*86400+123,31*86400+987,365*86400+456];
let peak=0,maxLullGap=0,minSwing=Infinity,maxMean=0,manualDemand=0,samples=0;
try{
 for(const altitude of [5,20,85,500,2000])for(const epoch of epochs){
  let min=Infinity,max=-Infinity,quiet=0,run=0,longest=0,sum=0;
  for(let tick=0;tick<600;tick++){
   const t=epoch+tick*.1,f=landingAerodynamics(0,0,1000,terrain.pad.y+altitude,t,saved.dragCoeff,air).windAX,a=Math.abs(f);
   peak=Math.max(peak,a);min=Math.min(min,f);max=Math.max(max,f);sum+=a;samples++;if(a>sas)manualDemand++;
   if(a<.5){quiet++;run=0;}else{run+=.1;longest=Math.max(longest,run);}
   assert(a<=normal+sas+.025+1e-9,'near-hover wind fits stock ordinary lateral + SAS, allowing only tiny excess');
   assert(Math.abs(weather.wind(t))<=72+1e-9,'bounded gust velocity, no former 100+ m/s sustained flow');
  }
  assert(quiet>=60,'each landing-minute has at least six seconds of clear force lulls');
  assert(min<-.3&&max>.3,'each landing-minute includes meaningful direction changes');
  assert(max-min>3,'force swings remain perceptible after aerodynamic saturation');
  assert(longest<8,'no prolonged unbroken shove');
  assert(sum/600<1.7,'mean force stays far below former saturation');
  maxLullGap=Math.max(maxLullGap,longest);minSwing=Math.min(minSwing,max-min);maxMean=Math.max(maxMean,sum/600);
 }
 assert(peak>sas,'Stribog gusts still demand manual trim beyond SAS');
 assert(manualDemand/samples>.1&&manualDemand/samples<.35,'manual assistance needed for bursts, not most of the landing');
 // Replay a reactive, ordinary-thrust pilot: cancel only wind beyond SAS, then
 // damp existing drift. No Shift, no extra actuator or hidden physics authority.
 Object.assign(config,saved,{gravity:level.gravity,startX:1000,startY:terrain.pad.y+85,startVX:0,startVY:0});
 const simulate=(epoch:number,manual:boolean)=>{
  const s=createShip();Object.assign(s,{sas:true,gearDeployed:true,throttle:level.gravity/config.mainEngineAccel});
  let maxDrift=0,effort=0,dir=0;
  for(let tick=0;tick<3600;tick++){
   const time=epoch+tick/120,f=landingAerodynamics(s.vx,s.vy,s.x,s.y,time,config.dragCoeff,air);
   const residual=f.windAX-Math.sign(f.windAX)*Math.min(Math.abs(f.windAX),sas);
   const correction=-residual-s.vx*1.5;
   if(tick%30===0)dir=manual&&Math.abs(correction)>.15?Math.sign(correction):0; // 4 Hz pilot input, not perfect per-tick trim.
   if(dir)effort++;
   updateShip(s,{...NEUTRAL_FLIGHT_INPUT,moveLeft:dir<0,moveRight:dir>0,shiftHeld:false},1/120,time,air);
   maxDrift=Math.max(maxDrift,Math.abs(s.x-1000));
  }
  return{ship:s,maxDrift,effort};
 };
 let worstControlled=0,worstUntrimmed=0;
 for(const epoch of [0,12345,43200,86400,31536456]){
  const a=simulate(epoch,true),b=simulate(epoch,true),untrimmed=simulate(epoch,false);
  assert(JSON.stringify(a)===JSON.stringify(b),'gust/controller replay deterministic');
  assert(a.maxDrift<6&&a.effort>0&&a.ship.dvUsed>0,`ordinary manual trim controls gusts with paid finite thrust: ${JSON.stringify({epoch,drift:a.maxDrift,effort:a.effort,dv:a.ship.dvUsed,untrimmed:untrimmed.maxDrift})}`);
  assert(a.maxDrift<untrimmed.maxDrift,'reactive ordinary input improves on SAS-only flight');
  worstControlled=Math.max(worstControlled,a.maxDrift);worstUntrimmed=Math.max(worstUntrimmed,untrimmed.maxDrift);
 }
 console.log(JSON.stringify({stribogGusts:{peak,maxLullGap,minSwing,maxMean,manualDemandFraction:manualDemand/samples,worstControlled,worstUntrimmed}},null,2));
 console.log(`Stribog gust handling: ${checks} checks passed.`);
}finally{Object.assign(config,saved);}
