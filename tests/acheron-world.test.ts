import './svg-dom';
import { acheronCloudGeometry, drawAcheronDisc, ACHERON_CLOUD_SEED } from '../src/acheron-appearance';
import { drawAuthoredWorldDisc } from '../src/world-disc-appearance';
import { crateredWorldProfile } from '../src/cratered-world-geometry';
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
function frozen(value:any):void{if(!value||typeof value!=='object')return;assert(Object.isFrozen(value),'deeply immutable cloud map');Object.values(value).forEach(frozen);}
const worldBefore=json([BODIES,SURFACE_POIS]),body=bodyById('estella-ii');
const originalRandom=Math.random;
try{
 Math.random=()=>{throw Error('frame RNG forbidden');};
 const model=acheronCloudGeometry();frozen(model);
 assert(model===acheronCloudGeometry(),'single cached map, independent of frame/visit');
 assert(ACHERON_CLOUD_SEED===869881717&&ACHERON_CLOUD_SEED===crateredWorldProfile('cloud-world-v1:estella-ii').seed,'pinned permanent body ID seed');
 assert(model.broad.length===21&&model.wisps.length===6,'seven feathered cloud systems and six fine wisps');
 for(const layer of [...model.broad,...model.wisps])assert(layer.coarse.every(p=>layer.full.some(q=>p[0]===q[0]&&p[1]===q[1])),'LOD takes exact points from full cloud geography');
 for(const radius of [.25,3,8,14,59,60,220,2000]){
  const a=recorder(),b=recorder();assert(drawAuthoredWorldDisc(a.ctx,body.id,640,400,radius,body.color),'explicit Acheron dispatch');drawAcheronDisc(b.ctx,640,400,radius);
  assert(json(a.calls)===json(b.calls),'same painter through central/marker dispatcher');
  const repeat=recorder();drawAcheronDisc(repeat.ctx,640,400,radius);assert(json(a.calls)===json(repeat.calls),'repeatable cloud geography');
  assert(a.calls.filter(c=>c[0]==='save').length===a.calls.filter(c=>c[0]==='restore').length,'balanced canvas state');
  assert(a.calls.findIndex(c=>c[0]==='clip')<a.calls.findIndex(c=>c[0]==='fillRect'),'paint clipped to original disc');
  assert(a.calls.some(c=>c[0]==='set'&&c[1]==='fillStyle'&&c[2]==='#c7a165'),'opaque cloud base hides ground');
  assert(a.calls.filter(c=>c[0]==='stroke').length===1,'only limb stroked; no crack/terrain/city outlines');
  assert(a.calls.filter(c=>c[0]==='arc').length===2,'clip/limb circles only; no crater circles');
  assert(a.calls.filter(c=>c[0]==='lineTo').length<7200,'bounded cloud geometry');
  assert(a.calls.every(c=>c.slice(1).every(v=>typeof v!=='number'||Number.isFinite(v))),'finite coordinates');
  assert(a.calls.filter(c=>c[0]==='moveTo').length===(radius<60?21:27),'small LOD omits wisps only');
 }
 for(const [x,y,r]of [[0,0,0],[0,0,-1],[0,0,Infinity],[NaN,0,2],[0,Infinity,2]]){const a=recorder();drawAcheronDisc(a.ctx,x,y,r);assert(!a.calls.length,'invalid geometry skipped');}
}finally{Math.random=originalRandom;}
function render(level:OrbitalLevel,time:number){
 const cam={x:1700,y:-2300,zoom:140/level.planetRadius},state=createOrbitalState(level,{x:level.planetRadius*1.45,y:0,vx:0,vy:-300,time}),before=json({level,state}),rec=recorder();
 renderOrbital(rec.ctx,{width:1280,height:800} as HTMLCanvasElement,cam,state,level,time);assert(json({level,state})===before,'no changes to flight/objective state');return{...rec,cam};
}
function segment(calls:unknown[][],x:number,y:number,r:number){
 const expected=recorder();drawAcheronDisc(expected.ctx,x,y,r);
 const start=calls.findIndex(c=>c[0]==='translate'&&c[1]===x&&c[2]===y)-1;
 assert(start>=0&&json(calls.slice(start,start+expected.calls.length))===json(expected.calls),'actual production central/stellar cloud painter');
}
for(const [i,target]of ['estella-ii-commercial-hub-dock','estella-ii-olympos','estella-ii-nimbus-crucible','estella-ii-pandemonium'].entries()){
 const before=new Set(ORBITAL_LEVELS.map(l=>l.id));createPlayableEstellaMission('estella-iii-main-customs',target,undefined,9750+i);
 const created=ORBITAL_LEVELS.filter(l=>!before.has(l.id)),local=created.find(l=>l.bodyId===body.id)!,star=created.find(l=>l.bodyId==='estella'&&l.systemBodies?.some(b=>b.id===body.id))!;
 assert(local&&star,`${target}: real local and stellar phases`);
 assert(local.atmoHeight===120000&&local.scaleHeight===body.atmosphere!.scaleHeight&&local.surfaceDensity===body.atmosphere!.surfaceDensity,'existing atmospheric envelope retained');
 for(const time of [0,123456]){
  const a=render(local,time);segment(a.calls,640-a.cam.x*a.cam.zoom,400+a.cam.y*a.cam.zoom,body.radius*a.cam.zoom);
  assert(a.calls.some(c=>c[0]==='fillText'&&c[1]==='ACHERON'),'central name retained');
  assert(a.calls.some(c=>c[0]==='fillText'&&c[1]===['ACHERON COMMERCIAL HUB','OLYMPOS','NIMBUS CRUCIBLE','PANDEMONIUM'][i]),'real target marker retained over cloud artwork');
  assert(a.calls.some(c=>c[0]==='set'&&c[1]==='fillStyle'&&c[2]===`rgba(${body.atmosphere!.color.join(', ')}, 0.15)`),'existing atmospheric layer still rendered');
  const b=render({...star,targetBodyId:body.id},time),pos=transferBodyState(star,body.id,time)!;
  segment(b.calls,640+(pos.x-b.cam.x)*b.cam.zoom,400-(pos.y-b.cam.y)*b.cam.zoom,Math.min(10,Math.max(3,body.radius*b.cam.zoom)));
 }
}
assert(json([BODIES,SURFACE_POIS])===worldBefore,'body/atmosphere/colors/sites unchanged');
console.log(`Acheron cloud artwork passed: ${assertions} assertions; opaque static cloud map, LOD, four real targets, original atmosphere/flight state.`);
