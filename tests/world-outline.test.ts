import '../src/content/estella';
import { BODIES } from '../src/world';
import { gasGiantProfileFor } from '../src/content/estella/gas-giant-appearance';
import { GIANT_FEATHER_START } from '../src/soft-giant-appearance';
import { hasOutlineWorld, drawOutlineWorld, MATERIAL_FILL, OUTLINE_INK, terrainOutlineInk } from '../src/world-outline-appearance';
import { gaiaDiscGeometry } from '../src/world-disc-appearance';
import { balorEyeGeometry, balorShoreX, BALOR_EYE_ARC } from '../src/balor-appearance';
import { ATMOSPHERE_FRAGMENT } from '../src/atmosphere-prototype-shader';
import { ATMOSPHERE_OUTLINE_FRAGMENT } from '../src/atmosphere-outline-shader';
let count=0;function assert(ok:unknown,message:string){count++;if(!ok)throw Error(message);}
const catalog=JSON.stringify(BODIES),worlds=BODIES.filter(b=>hasOutlineWorld(b.id));
assert(worlds.length===33,'33 existing globes, not the star or station/cluster icons');
assert(!hasOutlineWorld('estella')&&!hasOutlineWorld('unknown'),'explicit opt-in');
for(const fill of Object.values(MATERIAL_FILL))assert(Math.max(...[1,3,5].map(i=>parseInt(fill.slice(i,i+2),16)))<=32,'material backgrounds remain very dark');
for(const b of worlds){const p=terrainOutlineInk(b.color);assert(Math.max(...[1,3,5].map(i=>parseInt(p.background.slice(i,i+2),16)))<=14,'near-black per-planet background');}
assert(terrainOutlineInk([200,100,50]).land!==terrainOutlineInk([50,100,200]).land,'terrain keeps muted planetary hue');
assert(terrainOutlineInk([200,100,50]).background==='#0b0603','near-black true planetary tint');
assert(OUTLINE_INK.ice==='#c2c5c9','ice material exception remains light gray');
assert(GIANT_FEATHER_START===.94,'feather inside original giant radius');
const gaia=gaiaDiscGeometry();assert(gaia===gaiaDiscGeometry(),'bounded same-object Gaia model');
for(const regions of Object.values(gaia)){
 assert(Object.isFrozen(regions),'immutable regions');for(const points of regions){assert(Object.isFrozen(points),'immutable polygon');for(const point of points)assert(Object.isFrozen(point)&&point.every(Number.isFinite),'immutable source-accurate points');}
}
const eye=balorEyeGeometry();assert(eye===balorEyeGeometry(),'same immutable Eye model');
assert(eye.shore.length===81&&eye.crust.length===3,'original shore and crust');
for(const [x,y]of eye.shore)assert(x===balorShoreX(y),'no reauthored/widened shoreline');
assert(Math.abs(eye.shore[0][1]+Math.sin(BALOR_EYE_ARC/2))<1e-12,'original -15deg endpoint');
assert(Math.abs(eye.shore[80][1]-Math.sin(BALOR_EYE_ARC/2))<1e-12,'original +15deg endpoint');
const sourceEnd=ATMOSPHERE_FRAGMENT.indexOf('  vec3 light=');
assert(ATMOSPHERE_OUTLINE_FRAGMENT.slice(0,sourceEnd)===ATMOSPHERE_FRAGMENT.slice(0,sourceEnd),'exact noise/seed/advection/cyclone field, only final paint changes');
assert(ATMOSPHERE_OUTLINE_FRAGMENT.includes('float field=density+upper;'),'density contours survive opaque alpha saturation');
assert(ATMOSPHERE_OUTLINE_FRAGMENT.includes('vec3 color=clamp(cloudColor,0.,1.);'),'preserve authored weather color');
// Command-level tests supplement real native Canvas/WebGL pixel checks. No fake
// pixel raster used to approve the actual look; gallery checks do that separately.
function recording(){
 const commands:unknown[]=[],state:Record<string,unknown>={},stack:Record<string,unknown>[]=[];
 const methods:Record<string,Function>={save(){stack.push({...state});commands.push(['save']);},restore(){const old=stack.pop();if(!old)throw Error('Unbalanced restore');for(const key of Object.keys(state))delete state[key];Object.assign(state,old);commands.push(['restore']);}};
 const ctx=new Proxy(state,{get(_,key:string){return methods[key]??state[key]??((...args:unknown[])=>{commands.push([key,...args]);});},set(_,key:string,value){state[key]=value;commands.push(['set',key,value]);return true;}})as unknown as CanvasRenderingContext2D;
 return{ctx,commands,stack};
}
for(const b of worlds){
 // Colored giants use real cached Canvas rasters, covered by native checks.
 if(gasGiantProfileFor(b.id))continue;
 for(const radius of [6,22,140,300]){
  const a=recording(),z=recording();assert(drawOutlineWorld(a.ctx,b.id,150,150,radius,0,false,b.color),'dispatch');drawOutlineWorld(z.ctx,b.id,150,150,radius,0,false,b.color);
  assert(!a.stack.length,'balanced context');assert(JSON.stringify(a.commands)===JSON.stringify(z.commands),'deterministic replay');
  assert(!a.commands.some(c=>Array.isArray(c)&&String(c[0]).includes('Gradient')),'no gradients');
 }
}
for(const r of [0,-1,NaN,Infinity]){const a=recording();assert(!drawOutlineWorld(a.ctx,'estella-iii',0,0,r)&&!a.commands.length,'invalid viewport untouched');}
assert(JSON.stringify(BODIES)===catalog,'catalog unchanged');
console.log(`Planet outline review passed: ${count} assertions; ${worlds.length} worlds.`);
