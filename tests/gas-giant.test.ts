import './svg-dom';
import './outline-canvas-shim';
import { drawCurrentWorldDisc } from '../src/world-presentation';
import { defineGasGiantProfile, gasGiantGeometry, GIANT_GEOMETRY_CACHE_LIMIT, type GasGiantProfile } from '../src/gas-giant-geometry';
import { ESTELLA_GAS_GIANT_PROFILES, gasGiantProfileFor } from '../src/content/estella/gas-giant-appearance';
import { drawGasGiantDisc } from '../src/gas-giant-appearance';
import { drawAuthoredWorldDisc } from '../src/world-disc-appearance';
import { BODIES, SURFACE_POIS, bodyById } from '../src/world';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { ORBITAL_LEVELS, createOrbitalState, renderOrbital, transferBodyState, type OrbitalLevel } from '../src/orbital';
export const EXPECTED_GIANT_IDS:readonly string[]=['estella-x','estella-xi','estella-xii'];
export const GIANT_TEST_HUBS=['estella-x-observation-skim-hub','estella-xi-skim-hub','estella-xii-observation-post'];
let assertions=0;
function assert(ok:unknown,msg:string):asserts ok{assertions++;if(!ok)throw Error(msg);}
const json=(x:unknown)=>JSON.stringify(x);
function recorder(){
 const calls:unknown[][]=[],raw:any={measureText:(s:string)=>({width:s.length*8})};
 for(const name of ['createLinearGradient','createRadialGradient'])raw[name]=(...args:number[])=>{
  const g={name,args,stops:[] as unknown[],addColorStop(offset:number,color:string){this.stops.push([offset,color]);}};calls.push([name,g]);return g;
 };
 const ctx=new Proxy(raw,{get:(o,k)=>k in o?o[k]:(...a:unknown[])=>calls.push([String(k),...a]),set:(o,k,v)=>{o[k]=v;calls.push(['set',String(k),v]);return true;}})as CanvasRenderingContext2D;
 return{ctx,calls};
}
function frozen(value:any):void{if(!value||typeof value!=='object')return;assert(Object.isFrozen(value),'deeply frozen geometry/profile');Object.values(value).forEach(frozen);}
assert(json(Object.keys(ESTELLA_GAS_GIANT_PROFILES).sort())===json([...EXPECTED_GIANT_IDS].sort()),'exact three approved giants');frozen(ESTELLA_GAS_GIANT_PROFILES);
const worldBefore=json([BODIES,SURFACE_POIS]),layouts=new Set<string>();
const originalRandom=Math.random;
try{
 Math.random=()=>{throw Error('Frame randomness forbidden');};
 for(const [index,id]of EXPECTED_GIANT_IDS.entries()){
  const p=gasGiantProfileFor(id)!,model=gasGiantGeometry(p);frozen(model);layouts.add(json(model));
  assert(p.seed===defineGasGiantProfile(id,p).seed,'permanent ID-derived seed');
  assert(model.bands.length===[22,15,7][index]&&model.storms.length===[2,4,2][index],'individually authored band/storm counts');
  assert(gasGiantGeometry({...p,palette:[...p.palette].reverse(),filamentOpacity:0,colors:[...p.colors].reverse()})===model,'palette/opacity does not regenerate geography');
  const more=gasGiantGeometry({...p,filamentCount:24});
  assert(json(more.bands)===json(model.bands)&&json(more.storms)===json(model.storms),'independent streams preserve main features when detail changes');
  for(const band of model.bands){
   assert(band.coarse.every(point=>band.full.some(q=>q[0]===point[0]&&q[1]===point[1])),'marker geometry is a subset of full geometry');
   assert(band.full.slice(0,49).every((point,i)=>point[1]<band.full[97-i][1]),'turbulent boundaries never cross/invert bands');
  }
  for(const r of [.25,3,8,14,18,59,60,220,2000]){
   const a=recorder(),b=recorder();assert(drawAuthoredWorldDisc(a.ctx,id,640,400,r,bodyById(id).color),'live dispatch');drawGasGiantDisc(b.ctx,640,400,r,p);
   assert(json(a.calls)===json(b.calls),'shared exact painter at each scale');
   const repeat=recorder();drawGasGiantDisc(repeat.ctx,640,400,r,p);assert(json(a.calls)===json(repeat.calls),'stable repeated frame');
   assert(a.calls.filter(c=>c[0]==='save').length===a.calls.filter(c=>c[0]==='restore').length,'balanced canvas stack');
   assert(a.calls.findIndex(c=>c[0]==='clip')<a.calls.findIndex(c=>c[0]==='fillRect'),'clipped before first paint');
   assert(a.calls.filter(c=>c[0]==='stroke').length===1,'only clipped limb stroked; no rings');
   assert(a.calls.filter(c=>c[0]==='lineTo').length<6500,'bounded geometry budget');
   assert(a.calls.every(c=>c.slice(1).every(v=>typeof v!=='number'||Number.isFinite(v))),'finite geometry');
   const paths=a.calls.filter(c=>c[0]==='moveTo');
   for(const storm of model.storms.slice(0,r<8?0:r<60?1:undefined))assert(paths.some(c=>c[1]===storm.outline[0][0]&&c[2]===storm.outline[0][1]),'same storm location across LOD');
  }
  for(const [x,y,r]of [[0,0,0],[0,0,-1],[0,0,Infinity],[NaN,0,2],[0,Infinity,2]]){const a=recorder();drawGasGiantDisc(a.ctx,x,y,r,p);assert(!a.calls.length,'invalid disc safely skipped');}
 }
}finally{Math.random=originalRandom;}
assert(layouts.size===3,'not three recolors of one cloud map');
assert(json(EXPECTED_GIANT_IDS.map(id=>gasGiantProfileFor(id)!.seed))===json([1305871086,166064809,1677540320]),'v1 permanent giant seeds pinned');
const base=gasGiantProfileFor('estella-x')!,old=gasGiantGeometry(base),snapshot=json(old);
for(let i=0;i<GIANT_GEOMETRY_CACHE_LIMIT+1;i++)gasGiantGeometry(defineGasGiantProfile(`eviction-${i}`,base));
assert(gasGiantGeometry(base)!==old&&json(gasGiantGeometry(base))===snapshot,'bounded cache rebuilds identical geography');
for(const change of [{edges:[0,0]},{turbulence:NaN},{filamentCount:100},{colors:[]},{palette:[[NaN,0,0]]},{storms:[{x:2,y:0,rx:1,ry:1,angle:0}]}]){
 let failed=false;try{defineGasGiantProfile('bad',{...base,...change} as Omit<GasGiantProfile,'seed'>);}catch{failed=true;}assert(failed,'invalid author profile rejected');
}
for(const id of ['estella-ii','estella-iv','estella-xa','estella-xib','estella-ix','constructor','__proto__'])assert(!gasGiantProfileFor(id),'no accidental custom/ice/moon opt-in');
function render(level:OrbitalLevel,time:number){
 const cam={x:1700,y:-2300,zoom:140/level.planetRadius},state=createOrbitalState(level,{x:level.planetRadius*1.45,y:0,vx:0,vy:-300,time}),before=json({level,state}),rec=recorder();
 renderOrbital(rec.ctx,{width:1280,height:800} as HTMLCanvasElement,cam,state,level,time);assert(json({level,state})===before,'orbital state/targets unchanged');return{...rec,cam};
}
function segment(calls:unknown[][],id:string,x:number,y:number,r:number){
 const expected=recorder();drawCurrentWorldDisc(expected.ctx,id,x,y,r,bodyById(id).color);
 const start=calls.findIndex(c=>c[0]==='drawImage'&&c[2]===x-r&&c[3]===y-r&&c[4]===r*2)-2;
 assert(start>=0&&json(calls.slice(start,start+expected.calls.length))===json(expected.calls),'actual central/system giant painter');
}
for(const [i,id]of EXPECTED_GIANT_IDS.entries()){
 const body=bodyById(id),before=new Set(ORBITAL_LEVELS.map(l=>l.id));createPlayableEstellaMission('estella-iii-main-customs',GIANT_TEST_HUBS[i],undefined,9600+i);
 const created=ORBITAL_LEVELS.filter(l=>!before.has(l.id)),local=created.find(l=>l.bodyId===id)!,star=created.find(l=>l.bodyId==='estella'&&l.systemBodies?.some(b=>b.id===id))!;
 assert(local&&star,'real skim/observatory and stellar transfer phases');
 assert(local.atmoHeight===body.atmosphere!.height,'original atmospheric envelope retained');
 for(const time of [0,123456]){
  const a=render(local,time);segment(a.calls,id,640-a.cam.x*a.cam.zoom,400+a.cam.y*a.cam.zoom,body.radius*a.cam.zoom);
  assert(a.calls.some(c=>c[0]==='set'&&c[1]==='strokeStyle'&&c[2]===`rgba(${body.atmosphere!.color.join(', ')}, 0.3)`),'existing atmosphere still rendered');
  const b=render({...star,targetBodyId:id},time),pos=transferBodyState(star,id,time)!;segment(b.calls,id,640+(pos.x-b.cam.x)*b.cam.zoom,400-(pos.y-b.cam.y)*b.cam.zoom,Math.min(18,Math.max(8,body.radius*b.cam.zoom)));
 }
}
assert(json([BODIES,SURFACE_POIS])===worldBefore,'body physics/colors/atmospheres/sites untouched');
console.log(`Gas giant family passed: ${assertions} assertions; three static cloud maps, shared LOD, real orbital views, no rings/physics changes.`);
