import './svg-dom';
import '../src/content/estella';
import { config } from '../src/config';
import { createLandingLevel } from '../src/levels';
import { generateTerrain, getTerrainHeight } from '../src/terrain';
import { createShip, updateShip } from '../src/ship';
import { createLandingAir, landingAerodynamics, landingSasForce, regionalWind, regionalAdvection } from '../src/landing-air';
import { createFlightAtmosphere, NEUTRAL_FLIGHT_INPUT, PARTICLE_CAP } from '../src/flight-atmosphere';
import { predictLandingTrajectory } from '../src/renderer';
let count=0;function assert(v:unknown,s:string){count++;if(!v)throw Error(s);}
const saved={...config},level=createLandingLevel('estella-v-open-cast-mine',993311),terrain=generateTerrain(level),epoch=12345;
const air=createLandingAir(level.body,level.poi.id,epoch,x=>getTerrainHeight(terrain,x));
Object.assign(config,{gravity:level.gravity,mainEngineAccel:24.5,dragCoeff:.0008,windEnabled:false});
function ship(sas=true){const s=createShip();Object.assign(s,{x:1000,y:terrain.pad.y+100,vx:0,vy:0,angle:0,gearDeployed:true,sas,throttle:config.gravity/config.mainEngineAccel});return s;}
try{
 for(let t=0;t<1000;t+=.73){
  assert(Math.abs((regionalAdvection(level.poi.id,t+.001)-regionalAdvection(level.poi.id,t-.001))/.002-regionalWind(level.poi.id,t))<1e-6,'analytic cloud drift follows wind velocity');
  const a=air.sample(1000,100,t),b=createLandingAir(level.body,level.poi.id,epoch+50,x=>getTerrainHeight(terrain,x)).sample(1000,100,t-50);
  assert(JSON.stringify(a)===JSON.stringify(b),'phase clocks share absolute weather, no arrival reroll');
 }
 const steady=ship(),drifting=ship(false),fx=createFlightAtmosphere();
 for(let i=0;i<2400;i++){
  const t=i/120;updateShip(steady,NEUTRAL_FLIGHT_INPUT,1/120,t,air);updateShip(drifting,NEUTRAL_FLIGHT_INPUT,1/120,t,air);fx.step(steady,air,terrain,1/120,t);
  assert(Math.abs(steady.vx)<1e-10&&Math.abs(steady.vy)<1e-10,'SAS rejects breeze/gusts without drift');
  assert(fx.diagnostics().active<=PARTICLE_CAP,'bounded particle pool at every tick');
 }
 assert(steady.x===1000&&Math.abs(drifting.x-1000)>1,'SAS zero ground velocity, not matching moving air');
 assert(steady.dvUsed>drifting.dvUsed,'wind hold pays RCS delta-v');
 // Representative lower/full acceleration configurations, without scaling weather to the rig.
 for(const accel of [8,16,24.5]){config.mainEngineAccel=accel;const loaded=ship();for(let i=0;i<720;i++)updateShip(loaded,NEUTRAL_FLIGHT_INPUT,1/120,i/120,air);
  assert(Math.abs(loaded.vx)<1e-10&&Math.abs(loaded.vy)<1e-10,'ground-velocity hold across available thrust configurations');
  assert(loaded.dvUsed-6*config.gravity<=6*accel*.1+1e-6,'compensation respects RCS budget at each acceleration');
 }
 const climbing=ship();climbing.throttle=1;
 for(let i=0;i<600;i++){const dv=climbing.dvUsed;updateShip(climbing,NEUTRAL_FLIGHT_INPUT,1/120,i/120,air);
  assert(Math.abs(climbing.vx)<1e-10,'full-thrust climb cannot starve lateral wind rejection');
  assert(climbing.dvUsed-dv<=config.mainEngineAccel*1.1/120+1e-10,'wind priority never increases total RCS authority');
 }
 assert(climbing.vy>10,'SAS does not override the main-engine climb command');
 const force=landingAerodynamics(0,0,1000,100,0,.0008,air),weak=landingSasForce(0,0,.001,force);
 assert(Math.abs(Math.hypot(weak.ax,weak.ay)-.001)<1e-12,'SAS authority remains capped');
 assert(Math.hypot(force.ax+weak.ax,force.ay+weak.ay)>0,'underpowered SAS cannot magically cancel weather');
 const high=landingAerodynamics(500,-200,1000,100,0,.0008,air),calm=landingAerodynamics(500,-200,1000,100,0,.0008,createLandingAir(level.body,level.poi.id,epoch,()=>0,false));
 assert(Math.hypot(high.ax-calm.ax,high.ay-calm.ay)<=.350001,'bounded wind disturbance at high speed');
 assert(air.sample(1000,level.body.atmosphere!.height,0).vx===0&&air.sample(1000,level.body.atmosphere!.height,0).density===0,'above atmosphere there is no wind or density');
 const vacuum=createLandingAir({...level.body,atmosphere:null},level.poi.id,epoch,()=>0);
 assert(JSON.stringify(vacuum.sample(0,0,0))==='{"vx":0,"density":0}','vacuum has no wind/density');
 assert(landingAerodynamics(100,100,0,0,0,1,vacuum).ax===0,'vacuum has no aerodynamic force');
 for(const sas of [false,true])for(const thrust of [false,true]){
  const s=ship(sas),manual={...NEUTRAL_FLIGHT_INPUT,moveRight:thrust},sim={...s};
  const predicted=predictLandingTrajectory(s,terrain,level,0,1,1/120,air,manual);
  for(let i=1;i<predicted.length;i++){updateShip(sim,manual,1/120,(i-1)/120,air);assert(Math.abs(predicted[i][0]-sim.x)<1e-10&&Math.abs(predicted[i][1]-sim.y)<1e-10,'prediction shares wind/SAS/held-control integration');}
 }
 fx.reset();const first=ship(false);for(let i=0;i<360;i++){updateShip(first,NEUTRAL_FLIGHT_INPUT,1/120,i/120,air);fx.step(first,air,terrain,1/120,i/120);}const before=JSON.stringify(fx.snapshot());
 fx.reset();const again=ship(false);for(let i=0;i<360;i++){updateShip(again,NEUTRAL_FLIGHT_INPUT,1/120,i/120,air);fx.step(again,air,terrain,1/120,i/120);}
 assert(before===JSON.stringify(fx.snapshot())&&JSON.stringify(first)===JSON.stringify(again),'weather/emission/flight deterministic retry');
 for(let i=360;i<800;i++){again.thrustFiring=false;fx.step(again,air,terrain,1/120,i/120);}assert(fx.diagnostics().active===0,'plumes expire after thrust stops');
 assert(fx.diagnostics().cloudPixels===0,'pure physics/emission allocates no cloud raster');
}finally{Object.assign(config,saved);}
console.log(`Landing air / SAS / effects passed: ${count} assertions.`);
