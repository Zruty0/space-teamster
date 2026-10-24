import { atmosphereNoise, atmosphereVortices, atmospherePhase, atmosphereProfile, GAIA_ATMOSPHERE_PROFILE } from '../src/atmosphere-prototype-profile';
import './atmosphere-timing.test';
import './atmosphere-gallery.test';
import './atmosphere-art-state.test';
import { createAtmospherePrototype } from '../src/atmosphere-prototype';
let checks=0;
function assert(ok:unknown,message:string):asserts ok{checks++;if(!ok)throw Error(message);}
const json=(x:unknown)=>JSON.stringify(x),p=GAIA_ATMOSPHERE_PROFILE;
assert(Object.isFrozen(p)&&Object.isFrozen(p.cloudColor)&&Object.isFrozen(p.hazeColor),'immutable profile/colours');
assert(json(atmosphereProfile())===json(p),'repeat defaults');
assert(p.seed===849372310,'permanent Gaia ID seed');
const input={coverage:.6,cloudColor:[.2,.3,.4]as const},before=json(input);atmosphereProfile(input);assert(json(input)===before,'input unchanged');
const bounded=atmosphereProfile({coverage:Infinity,scale:-99,shear:99,opticalDepth:NaN,seed:-1,cloudColor:[NaN,-2,9],zonalTurns:1.4,tropicalTurns:-1.6,cirrusTurns:Infinity});
assert(bounded.coverage===p.coverage&&bounded.scale===.4&&bounded.shear===1.5&&bounded.opticalDepth===p.opticalDepth,'finite bounded controls');
assert(bounded.seed===1&&json(bounded.cloudColor)===json([p.cloudColor[0],0,1]),'safe seed/colours');
assert(bounded.zonalTurns===1&&bounded.tropicalTurns===-2&&bounded.cirrusTurns===p.cirrusTurns,'integer winding preserves loop');
const storms=atmosphereProfile({vortexCount:99,vortexSize:-1,vortexStrength:Infinity,vortexEye:5});
assert(storms.vortexCount===6&&storms.vortexSize===.12&&storms.vortexStrength===p.vortexStrength&&storms.vortexEye===1,'bounded vortex controls');
assert(atmosphereProfile({vortexCount:1.6}).vortexCount===2,'integer vortex count');
assert(atmosphereProfile({vortexCount:-1,vortexStrength:0}).vortexCount===0,'vortices can be disabled');
assert(atmosphereProfile({vortexSpeed:1.7}).vortexSpeed===2&&atmosphereProfile({vortexSpeed:99}).vortexSpeed===3,'integer bounded spin multiplier closes loop');
assert(atmosphereProfile({vortexSpeed:0}).vortexSpeed===0,'local spin can stop without removing storms');
for(const t of [-720,-361,-360,-1,0,.01,90,180,359.99,360,720,123456]){
 const phase=atmospherePhase(t,360);assert(phase>=0&&phase<1,'normalized absolute phase');
 assert(Math.abs(phase-atmospherePhase(t+360,360))<1e-12,'periodic through negative/positive time');
}
for(const args of [[NaN,360],[Infinity,360],[3,0],[2,-1],[1,Infinity]])assert(atmospherePhase(args[0],args[1])===0,'invalid time guarded');
for(const capacity of [0,-1,17,1.5,NaN,Infinity]){
 let message='';try{createAtmospherePrototype(256,capacity);}catch(error){message=String(error);}
 assert(message.includes('Noise cache capacity must be 1–16'),'invalid cache bound rejected before allocating a canvas');
}
const random=Math.random;
try{
 Math.random=()=>{throw Error('unseeded RNG forbidden');};
 const systems=atmosphereVortices(p.seed);
 assert(Object.isFrozen(systems)&&systems.length===6,'bounded frozen storm registry');
 assert(json(systems)===json(atmosphereVortices(p.seed)),'seeded systems repeat');
 assert(json(systems)!==json(atmosphereVortices(p.seed+1)),'system geography varies by seed');
 for(const key of ['sizeScale','strengthScale','eyeScale','turns']as const)assert(new Set(systems.map(v=>v[key])).size===6,`individual ${key}, not one shared parameter`);
 for(const [i,system]of systems.entries()){
  assert(Object.isFrozen(system)&&Object.isFrozen(system.center),'deep immutable storm descriptors');
  assert(Math.abs(Math.hypot(...system.center)-1)<1e-12,'storm centers on unit sphere');
  assert(system.center.every(Number.isFinite)&&Number.isFinite(system.phase),'finite storm descriptors');
  assert(Math.sign(system.center[1])===(i%2===0?1:-1),'opposite hemisphere circulation anchors');
  assert(Math.abs(system.center[1])>.3&&Math.abs(system.center[1])<.6,'midlatitude systems, not polar/equatorial singularities');
  assert(system.sizeScale>=.72&&system.sizeScale<=1.20&&system.strengthScale>=.72&&system.strengthScale<=1.27&&system.eyeScale>=.30&&system.eyeScale<=1.45,'bounded individual characteristics');
  assert(Number.isInteger(system.turns)&&system.turns>=12&&system.turns<=29,'distinct faster integer winding');
  assert(Math.abs(Math.sin(system.turns*Math.PI*2+system.phase)-Math.sin(system.phase))<1e-12,'individual spin closes exactly analytically');
 }
 const a=atmosphereNoise(p.seed),b=atmosphereNoise(p.seed),c=atmosphereNoise(p.seed+1);
 assert(a.length===64**3,'bounded 256KiB noise volume');
 assert(a.every((n,i)=>n===b[i]),'same seed exact noise');
 assert(a.filter((n,i)=>n!==c[i]).length>a.length*.95,'different seed different weather');
 const buckets=new Uint32Array(16);a.forEach(n=>buckets[Math.floor(n/16)]++);
 for(const n of buckets)assert(n>a.length*.05&&n<a.length*.08,'noise dynamic range');
 a[0]^=255;assert(atmosphereNoise(p.seed)[0]===b[0],'no mutable shared buffer');
 for(const size of [0,3,65,1.5,Infinity]){let threw=false;try{atmosphereNoise(1,size);}catch{threw=true;}assert(threw,'bad allocations rejected');}
}finally{Math.random=random;}
console.log(`Atmosphere prototype passed: ${checks} assertions; deterministic noise, bounded immutable parameters, exact periodic phase. Gaia seed ${p.seed}.`);
