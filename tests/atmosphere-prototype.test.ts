import { atmosphereNoise, atmospherePhase, atmosphereProfile, GAIA_ATMOSPHERE_PROFILE } from '../src/atmosphere-prototype-profile';
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
for(const t of [-720,-361,-360,-1,0,.01,90,180,359.99,360,720,123456]){
 const phase=atmospherePhase(t,360);assert(phase>=0&&phase<1,'normalized absolute phase');
 assert(Math.abs(phase-atmospherePhase(t+360,360))<1e-12,'periodic through negative/positive time');
}
for(const args of [[NaN,360],[Infinity,360],[3,0],[2,-1],[1,Infinity]])assert(atmospherePhase(args[0],args[1])===0,'invalid time guarded');
const random=Math.random;
try{
 Math.random=()=>{throw Error('unseeded RNG forbidden');};
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
