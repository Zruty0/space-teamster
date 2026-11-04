import './svg-dom';
import '../src/content/estella';
import { createFlightAtmosphere, PARTICLE_CAP, smokeDensityFactors } from '../src/flight-atmosphere';
import { createLandingLevel } from '../src/levels';
import { generateTerrain } from '../src/terrain';
import { createShip } from '../src/ship';
import { bodyById, surfacePoiById } from '../src/world';
import { createRegionalWeather } from '../src/surface-weather';
import type { LandingAir } from '../src/landing-air';
let checks=0;const assert=(ok:unknown,message:string)=>{checks++;if(!ok)throw Error(message);};
const terrain=generateTerrain(createLandingLevel('estella-v-open-cast-mine',993313)),dt=1/120;
const ship=createShip();Object.assign(ship,{x:1000,y:terrain.pad.y+1000,vx:0,vy:0,thrustFiring:true,thrustVisualLevel:1,renderGimbalAngle:0});
const before=JSON.stringify(ship),ground=JSON.stringify(terrain);
const air=(density:number,vx=12):LandingAir=>({sample:()=>({density,vx,vy:0})});
const run=(density:number,power=1)=>{
 const fx=createFlightAtmosphere('density-calibration'),s={...ship,thrustVisualLevel:power};
 for(let i=0;i<1200;i++){fx.step(s,air(density),terrain,dt,i*dt);assert(fx.diagnostics().active<=PARTICLE_CAP,'density smoke pool always bounded');}
 const p=fx.snapshot();return{count:p.length,life:p.length?p.reduce((n,p)=>n+p.life,0)/p.length:0,fx};
};
const vacuum=run(0),thin=run(.18),gaia=run(1.2),stribog=run(2.2),acheron=run(5.4);
assert(gaia.count>210&&gaia.count<255&&gaia.life>2.2&&gaia.life<2.6,'Gaia uses former full-thrust Stribog plume envelope');
assert(acheron.count/gaia.count>4.7&&acheron.count/gaia.count<5.3,'dense Acheron has approximately five times Gaia smoke');
assert(acheron.life>gaia.life*2&&acheron.life<gaia.life*2.5,'dense-air smoke lasts longer, not just extra births');
assert(stribog.count>gaia.count*1.7&&stribog.count<gaia.count*2.2&&stribog.life>gaia.life,'Stribog now lies above Gaia and below dense Acheron');
assert(thin.count<gaia.count*.25&&thin.life<gaia.life*.5,'thin air produces sparse short smoke');
assert(vacuum.count<=4&&vacuum.fx.snapshot().every(p=>p.life<=.35),'vacuum only brief nozzle exhaust');
for(const power of [.25,.5]){const g=run(1.2,power),a=run(5.4,power);assert(a.count/g.count>4.7&&a.count/g.count<5.3,'fivefold density calibration also holds at partial power');}
assert(JSON.stringify(ship)===before&&JSON.stringify(terrain)===ground,'smoke never changes thrust, fuel, ship or terrain');
// Local altitude, not planet-name overrides: Olympos is Gaia-like, Nimbus is dense.
const siteDensity=(id:string)=>{const poi=surfacePoiById(id),w=createRegionalWeather(bodyById(poi.bodyId),poi);return w.air(0,()=>0).sample(1000,poi.altitude+85,0).density;};
const olympos=siteDensity('estella-ii-olympos'),nimbus=siteDensity('estella-ii-nimbus-crucible');
assert(Math.abs(smokeDensityFactors(olympos).lifetime-1)<.03,'Olympos local air remains near Gaia reference');
assert(smokeDensityFactors(nimbus).lifetime>2.2,'Nimbus reaches dense Acheron plume target');
const fx=createFlightAtmosphere('density-retry');
const replay=()=>{for(let i=0;i<1200;i++)fx.step(ship,air(i<400?.18:i<800?1.2:5.4),terrain,dt,i*dt);return JSON.stringify(fx.snapshot());};
const first=replay();fx.reset();assert(replay()===first,'density transitions replay deterministically');
const single=(rho:number)=>{fx.reset();fx.emitSmoke({x:1000,y:ship.y,vx:0,vy:0},air(rho),0);return fx.snapshot()[0];};
let last=0;for(const rho of [0,1e-9,.001,.01,.1,.18,.5,1.2,2.2,5.4,60]){const puff=single(rho);assert(puff.life>=last&&puff.life<=8,'source duration scales continuously and monotonically with density');last=puff.life;}
assert(Math.abs(single(1e-9).life-single(0).life)<.001,'vacuum limit has no atmosphere-on/off lifetime jump');
for(const rho of [-1,NaN,Infinity])assert(single(rho).life<=.35,'invalid density safely uses vacuum envelope');
fx.reset();for(let i=0;i<PARTICLE_CAP;i++)fx.emitSmoke({x:1000,y:ship.y,vx:0,vy:0,life:8},air(60),0);
const full=JSON.stringify(fx.snapshot());for(let i=0;i<100;i++)fx.emitSmoke({x:999,y:ship.y,vx:0,vy:0},air(60),0);
assert(fx.snapshot().length===PARTICLE_CAP&&JSON.stringify(fx.snapshot())===full,'full pool skips births rather than truncating dense puff lifetimes');
for(let i=0;i<1000;i++)fx.step({...ship,thrustFiring:false},air(0),terrain,dt,i*dt);
assert(fx.snapshot().length===0,'all smoke expires after engines stop');
console.log({smokeDensity:{vacuum:{count:vacuum.count,life:vacuum.life},thin:{count:thin.count,life:thin.life},gaia:{count:gaia.count,life:gaia.life},stribog:{count:stribog.count,life:stribog.life},acheron:{count:acheron.count,life:acheron.life},ratio:acheron.count/gaia.count,olympos,nimbus}});
console.log(`Smoke density: ${checks} checks passed.`);
