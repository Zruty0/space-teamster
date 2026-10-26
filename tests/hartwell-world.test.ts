import './svg-dom';
import './outline-canvas-shim';
import { drawCurrentWorldDisc } from '../src/world-presentation';
import { hartwellGeometry, drawHartwellDisc, HARTWELL_SEED } from '../src/hartwell-appearance';
import { drawAuthoredWorldDisc } from '../src/world-disc-appearance';
import { crateredWorldProfile, crateredWorldGeometry, CRATER_GEOMETRY_CACHE_LIMIT } from '../src/cratered-world-geometry';
import { BODIES, SURFACE_POIS, bodyById } from '../src/world';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { ORBITAL_LEVELS, createOrbitalState, renderOrbital, transferBodyState, type OrbitalLevel } from '../src/orbital';
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
function frozen(value:any):void{if(!value||typeof value!=='object')return;assert(Object.isFrozen(value),'deeply immutable surface');Object.values(value).forEach(frozen);}
const worldBefore=json([BODIES,SURFACE_POIS]),body=bodyById('estella-v');
const originalRandom=Math.random;
try{
 Math.random=()=>{throw Error('frame RNG forbidden');};
 const model=hartwellGeometry();frozen(model);
 assert(model===hartwellGeometry(),'one cached permanent map');
 assert(HARTWELL_SEED===2051664115&&HARTWELL_SEED===crateredWorldProfile('dry-world-v1:estella-v').seed,'permanent body ID seed');
 assert(json(Object.keys(model).sort())===json(['craters','deposits','erosion','uplands']),'terrain only, no atmosphere/cloud/storm/city layers');
 assert(model.uplands.length===4&&model.deposits.length===3&&model.erosion.length===6&&model.craters.length===14,'bounded authored composition');
 assert(model.craters.reduce((area,c)=>area+c.r*c.r*c.squash,0)<.03,'impacts secondary: less than3% projected disc area before overlap/clip');
 for(const layers of [model.uplands,model.deposits,model.erosion])for(const part of layers){
  assert(part.coarse.every(p=>part.full.includes(p)),'LOD reuses exact immutable points');
  assert(part.full.every(p=>p.every(Number.isFinite)),'finite normalized geography');
 }
 for(const radius of [.25,3,8,14,59,60,220,2000]){
  const a=recorder(),b=recorder();assert(drawAuthoredWorldDisc(a.ctx,body.id,640,400,radius,body.color),'explicit Hartwell dispatch');drawHartwellDisc(b.ctx,640,400,radius);
  assert(json(a.calls)===json(b.calls),'same central/marker painter');
  const repeat=recorder();drawHartwellDisc(repeat.ctx,640,400,radius);assert(json(a.calls)===json(repeat.calls),'repeatable geography');
  assert(a.calls.filter(c=>c[0]==='save').length===a.calls.filter(c=>c[0]==='restore').length,'balanced canvas state');
  assert(a.calls.findIndex(c=>c[0]==='clip')<a.calls.findIndex(c=>c[0]==='fillRect'),'art clipped to original silhouette');
  assert(a.calls.some(c=>c[0]==='set'&&c[1]==='fillStyle'&&c[2]==='#aa6946'),'opaque rusty plains base');
  const count=radius<14?0:radius<60?3:14;
  assert(a.calls.filter(c=>c[0]==='arc').length===2+count*2,'only limb/clip and bounded impact detail');
  assert(a.calls.filter(c=>c[0]==='stroke').length===1+count,'erosion/deposits are filled terrain, not line cracks');
  assert(a.calls.filter(c=>c[0]==='lineTo').length<2400,'bounded surface geometry');
  assert(a.calls.every(c=>c.slice(1).every(v=>typeof v!=='number'||Number.isFinite(v))),'finite draw coordinates');
  assert(a.calls.filter(c=>c[0]==='moveTo').length===13,'all major terrain layers at every LOD');
 }
 for(const [x,y,r]of [[0,0,0],[0,0,-1],[0,0,Infinity],[NaN,0,2],[0,Infinity,2]]){const a=recorder();drawHartwellDisc(a.ctx,x,y,r);assert(!a.calls.length,'invalid geometry skipped');}
 const before=json(model);
 for(let i=0;i<=CRATER_GEOMETRY_CACHE_LIMIT;i++)crateredWorldGeometry(crateredWorldProfile(`hartwell-eviction-${i}`));
 assert(model===hartwellGeometry()&&json(model)===before,'shared crater-cache eviction cannot change retained surface');
}finally{Math.random=originalRandom;}
function render(level:OrbitalLevel,time:number){
 const orbit=level.systemBodies?.find(b=>b.id==='estella-v')?.orbitRadius;
 const cam={x:1700,y:-2300,zoom:orbit?Math.min(140/level.planetRadius,250/orbit):140/level.planetRadius},state=createOrbitalState(level,{x:level.planetRadius*1.45,y:0,vx:0,vy:-300,time}),before=json({level,state}),rec=recorder();
 renderOrbital(rec.ctx,{width:1280,height:800} as HTMLCanvasElement,cam,state,level,time);assert(json({level,state})===before,'no changes to flight/objective state');return{...rec,cam};
}
function segment(calls:unknown[][],x:number,y:number,r:number){
 const expected=recorder();drawCurrentWorldDisc(expected.ctx,body.id,x,y,r,body.color);
 const start=calls.findIndex(c=>c[0]==='translate'&&c[1]===x&&c[2]===y)-1;
 assert(start>=0&&json(calls.slice(start,start+expected.calls.length))===json(expected.calls),'production central/stellar painter');
}
const targets=['estella-v-transit-customs','estella-v-high-orbit-factory','estella-v-capital-settlement','estella-v-open-cast-mine','estella-v-atmo-refinery','estella-v-storm-research','estella-v-abandoned-colony'];
const names=['ROADSTEAD STATION','ASCENSION SCAFFOLD','CONCORD','DAWES CUT','CINDERHOOK REFINERY','GALE SURVEY','FIRST LANDING'];
for(const [i,target]of targets.entries()){
 const before=new Set(ORBITAL_LEVELS.map(l=>l.id));createPlayableEstellaMission('estella-iii-main-customs',target,undefined,10100+i);
 const created=ORBITAL_LEVELS.filter(l=>!before.has(l.id)),local=created.find(l=>l.bodyId===body.id)!,star=created.find(l=>l.bodyId==='estella'&&l.systemBodies?.some(b=>b.id===body.id))!;
 assert(local&&star,`${target}: actual local/stellar phases`);
 assert(local.atmoHeight===55000&&local.scaleHeight===11000&&local.surfaceDensity===.18,'thin CO2 envelope unchanged');
 if(i>=2)assert(local.landingSiteAngle===[.15,1.1,2.05,-2.35,-.85][i-2],'actual ground objective angle unchanged');
 for(const time of [0,123456]){
  const a=render(local,time);segment(a.calls,640-a.cam.x*a.cam.zoom,400+a.cam.y*a.cam.zoom,body.radius*a.cam.zoom);
  for(const label of ['HARTWELL',names[i]]){
   const fill=a.calls.find(c=>c[0]==='fillText'&&c[1]===label),outline=a.calls.find(c=>c[0]==='strokeText'&&c[1]===label);
   assert(fill&&outline&&json(fill.slice(1))===json(outline.slice(1)),'real body/target label halo at original anchor');
  }
  assert(a.calls.some(c=>c[0]==='set'&&c[1]==='strokeStyle'&&c[2]===`rgba(${body.atmosphere!.color.join(', ')}, 0.3)`),'original atmosphere still drawn');
  const b=render({...star,targetBodyId:body.id},time),pos=transferBodyState(star,body.id,time)!;
  segment(b.calls,640+(pos.x-b.cam.x)*b.cam.zoom,400-(pos.y-b.cam.y)*b.cam.zoom,Math.min(10,Math.max(3,body.radius*b.cam.zoom)));
  assert(b.calls.some(c=>c[0]==='strokeText'&&c[1]==='HARTWELL'),'system marker label halo');
 }
}
assert(json([BODIES,SURFACE_POIS])===worldBefore,'body/atmosphere/colors/sites unchanged');
console.log(`Hartwell artwork passed: ${assertions} assertions; seed ${HARTWELL_SEED}, permanent terrain, secondary impacts, seven real targets, original atmosphere and site angles.`);
