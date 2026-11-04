import './svg-dom';
import './smoke-density.test';
import '../src/content/estella';
import { createLandingLevel } from '../src/levels';
import { generateTerrain, getTerrainHeight } from '../src/terrain';
import { pointHitsSite } from '../src/surface-site';
import { createShip } from '../src/ship';
import { createWindTracers, WIND_TRACER_CAP, windTracerTarget } from '../src/wind-tracers';
import { createFlightAtmosphere, PARTICLE_CAP } from '../src/flight-atmosphere';
import type { LandingAir } from '../src/landing-air';
let n=0;function assert(ok:unknown,message:string){n++;if(!ok)throw Error(message);}
const level=createLandingLevel('estella-v-open-cast-mine',993313),terrain=generateTerrain(level),before=JSON.stringify(terrain),dt=1/120;
const air=(vx:number,density=.18):LandingAir=>({sample:()=>({vx,density})});
const fx=createWindTracers(level.poi.id);
fx.step(air(10),terrain,dt,0);let previous=fx.snapshot();
assert(previous.length>100&&previous.length<=WIND_TRACER_CAP,'ambient population is bounded and sparse');
for(let i=1;i<600;i++){
 const speed=i<200?10:i<400?-8:0;fx.step(air(speed),terrain,dt,i*dt);
 const now=fx.snapshot();
 for(const p of now){
  const old=previous.find(q=>q.id===p.id&&q.generation===p.generation);
  if(old)assert(Math.abs(p.x-old.x-speed*dt)<1e-9&&p.y===old.y,'each surviving tracer follows actual wind including reversal/calm');
  assert(p.y>getTerrainHeight(terrain,p.x)&&!pointHitsSite(terrain.surfaceSite!,p.x,p.y),'no active tracers inside ground/buildings');
 }
 assert(now.length<=WIND_TRACER_CAP,'pool remains bounded');previous=now;
}
fx.step(air(15),terrain,dt,5);const first=JSON.stringify(fx.snapshot());fx.reset();fx.step(air(10),terrain,dt,0);
for(let i=1;i<600;i++)fx.step(air(i<200?10:i<400?-8:0),terrain,dt,i*dt);
fx.step(air(15),terrain,dt,5);assert(JSON.stringify(fx.snapshot())===first,'deterministic reset/retry');
fx.step(air(10,0),terrain,dt,5);assert(fx.diagnostics().active===0,'vacuum clears atmospheric flecks');
fx.reset();fx.step(air(10),terrain,NaN,0);assert(fx.diagnostics().active===0,'invalid dt cannot corrupt pool');
const other=createWindTracers('other-permanent-poi');other.step(air(10),terrain,dt,0);fx.step(air(10),terrain,dt,0);
assert(JSON.stringify(other.snapshot())!==JSON.stringify(fx.snapshot()),'different permanent POIs have different distributions');
const effects=createFlightAtmosphere(level.poi.id),ship=createShip();Object.assign(ship,{x:1000,y:terrain.pad.y+100,thrustFiring:false});const shipBefore=JSON.stringify(ship);
for(let i=0;i<120;i++)effects.step(ship,air(10),terrain,dt,i*dt);
assert(effects.diagnostics().active===0&&effects.diagnostics().tracers.active>0,'wind indicators do not require engine exhaust');
assert(JSON.stringify(ship)===shipBefore&&JSON.stringify(terrain)===before,'effects cannot modify ship physics or terrain');
// Future stationary emitter is tested synthetically, not installed in any POI/SVG.
effects.emitSmoke({x:1000,y:terrain.pad.y+100,vx:0,vy:6,life:6,size:1.2},air(10),1);
const source=effects.snapshot()[0];
for(let i=120;i<360;i++)effects.step(ship,air(10),terrain,dt,i*dt);
const plume=effects.snapshot()[0];assert(plume.x>source.x+10&&plume.y>source.y&&plume.vx>8,'stationary upward smoke bends downwind through shared advection');
for(let i=0;i<PARTICLE_CAP*4;i++)effects.emitSmoke({x:1000,y:terrain.pad.y+100,vx:0,vy:5,life:100,size:100},air(10),3);
assert(effects.diagnostics().active===PARTICLE_CAP&&effects.snapshot().every(p=>p.life<=8&&p.radius<=3),'shared smoke source bounds and fixed pool prevent unbounded emitters');
const valid=JSON.stringify(effects.snapshot());effects.emitSmoke({x:NaN,y:1,vx:0,vy:0},air(10),3);assert(JSON.stringify(effects.snapshot())===valid,'invalid emitter ignored');
effects.reset();assert(effects.snapshot().length===0&&effects.tracerSnapshot().length===0,'both pools reset together');
effects.emitSmoke({x:1000,y:terrain.pad.y+100,vx:0,vy:5,life:8},air(0,0),0);
assert(effects.snapshot()[0].life<=.35,'vacuum source cannot leave lingering atmospheric smoke');
// Real 2D flow: vertical-only wind must advect and paint, not be treated as calm.
for(const vy of [-8,8]){
 const vertical:LandingAir={sample:()=>({vx:0,vy,density:.18})};fx.reset();fx.step(vertical,terrain,dt,0);const start=fx.snapshot();fx.step(vertical,terrain,dt,dt);
 for(const p of fx.snapshot()){const old=start.find(q=>q.id===p.id&&q.generation===p.generation);if(old)assert(p.x===old.x&&Math.abs(p.y-old.y-vy*dt)<1e-9,'tracers follow up/down flow');}
 const calls:any[]=[],ctx=new Proxy({} as any,{get:(_o,k)=>(...args:any[])=>calls.push([k,...args]),set:()=>true}),snapshot=JSON.stringify(fx.snapshot());
 fx.draw(ctx,{x:1000,y:terrain.pad.y+100,zoom:1},1200,720,false,vertical,dt);
 assert(calls.some(c=>c[0]==='stroke'),'vertical-only wind has visible tracers');assert(JSON.stringify(fx.snapshot())===snapshot,'vector drawing is read-only');
 effects.reset();effects.emitSmoke({x:1000,y:terrain.pad.y+100,vx:0,vy:0,life:6},vertical,0);
 for(let i=0;i<120;i++)effects.step(ship,vertical,terrain,dt,i*dt);
 const plume=effects.snapshot()[0];assert(!!plume&&Math.sign(plume.vy)===Math.sign(vy)&&Math.sign(plume.y-terrain.pad.y-100)===Math.sign(vy),'smoke follows updrafts and downdrafts');
}
let previousCount=0;
for(const speed of [0,5,10,20,40,80]){
 fx.reset();fx.step(air(speed),terrain,dt,0);const count=fx.diagnostics().active,target=windTracerTarget(speed);
 assert(target===Math.min(WIND_TRACER_CAP,speed/40*WIND_TRACER_CAP),'linear speed-proportional quota with fixed ceiling');
 assert(count<=target&&count>=target*.9,'actual population follows wind strength, excluding solids');
 assert(count>=previousCount,'stronger wind never reduces initial uniform-flow population');previousCount=count;
 const same=JSON.stringify(fx.snapshot()),calls:any[]=[],ctx=new Proxy({} as any,{get:(_o,k)=>(...args:any[])=>calls.push([k,...args]),set:()=>true});
 fx.draw(ctx,{x:1000,y:terrain.pad.y+100,zoom:.1},1200,720,false,air(speed),0);
 const strokes=calls.filter(c=>c[0]==='stroke').length;
 assert(strokes===count*2,'visible directional particles match the actual speed-proportional pool');
 fx.draw(ctx,{x:1000,y:terrain.pad.y+100,zoom:.1},1200,720,true,air(speed),0);
 assert(JSON.stringify(fx.snapshot())===same,'quality/draw cannot change wind-dependent population');
}
fx.step(air(0),terrain,dt,1);assert(fx.diagnostics().active===0,'calm removes wind-direction particles, not just their opacity');
console.log(`Wind tracers / reusable smoke sources passed: ${n} assertions.`);
