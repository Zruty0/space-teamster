import './svg-dom';
import './outline-canvas-shim';
import { drawCurrentWorldDisc } from '../src/world-presentation';
import { dahaiGeometry, drawDahaiDisc, DAHAI_SEED } from '../src/dahai-appearance';
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
function frozen(value:any):void{if(!value||typeof value!=='object')return;assert(Object.isFrozen(value),'deeply immutable ocean/ice map');Object.values(value).forEach(frozen);}
function inside(points:readonly (readonly [number,number])[],x:number,y:number):boolean{
 let result=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [xi,yi]=points[i],[xj,yj]=points[j];
  if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)result=!result;
 }
 return result;
}
const worldBefore=json([BODIES,SURFACE_POIS]),body=bodyById('estella-iv');
const originalRandom=Math.random;
try{
 Math.random=()=>{throw Error('frame RNG forbidden');};
 const model=dahaiGeometry();frozen(model);
 assert(model===dahaiGeometry(),'one cached permanent map');
 assert(DAHAI_SEED===1709551853&&DAHAI_SEED===crateredWorldProfile('ocean-world-v1:estella-iv').seed,'permanent ID seed');
 assert(json(Object.keys(model).sort())===json(['ice','water']),'only ocean and ice: no cloud/storm/wisp geometry');
 assert(model.water.length===6&&model.ice.length===2,'retained water/ice layer counts');
 // Captured before removal from 6515c25/88ae24d, not regenerated to bless changes.
 const hash=(value:unknown)=>{let h=2166136261;for(const c of json(value))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
 assert(hash(model.water)===95071542,'original water geography/palette unchanged');
 assert(hash(model.ice)===855573291,'original ice geography/palette unchanged');
 for(const layers of [model.water,model.ice])for(const part of layers){
  assert(part.coarse.every(p=>part.full.includes(p)),'LOD reuses exact immutable points');
  assert(part.full.every(p=>p.every(Number.isFinite)),'finite normalized geography');
 }
 for(const lod of ['full','coarse'] as const){
  const at=(angle:number,layers:typeof model.ice)=>layers.some(p=>inside(p[lod],Math.cos(angle)*.985,-Math.sin(angle)*.985));
  assert(at(-2,model.ice),'Bingjie existing rim on floating sea ice at both LODs');
  for(const angle of [-.1,1.15,2.45])assert(!at(angle,model.ice),'other cities retain ocean at existing rim');
  for(const depth of [.88,.95,.985])assert(!model.ice.some(p=>inside(p[lod],Math.cos(1.15)*depth,-Math.sin(1.15)*depth)),'Zhulong marker and inward label area remain on open water, not ice');
 }
 for(const radius of [.25,3,8,14,59,60,220,2000]){
  const a=recorder(),b=recorder();assert(drawAuthoredWorldDisc(a.ctx,body.id,640,400,radius,body.color),'explicit Dahai dispatch');drawDahaiDisc(b.ctx,640,400,radius);
  assert(json(a.calls)===json(b.calls),'same central/marker painter');
  const repeat=recorder();drawDahaiDisc(repeat.ctx,640,400,radius);assert(json(a.calls)===json(repeat.calls),'repeatable geography');
  assert(a.calls.filter(c=>c[0]==='save').length===a.calls.filter(c=>c[0]==='restore').length,'balanced canvas state');
  assert(a.calls.findIndex(c=>c[0]==='clip')<a.calls.findIndex(c=>c[0]==='fillRect'),'art clipped to original silhouette');
  assert(a.calls.some(c=>c[0]==='set'&&c[1]==='fillStyle'&&c[2]==='#176da5'),'continuous opaque blue ocean base');
  assert(a.calls.filter(c=>c[0]==='stroke').length===1,'limb only, no cracks/coast/city strokes');
  assert(a.calls.filter(c=>c[0]==='arc').length===2,'clip/limb only, no craters');
  assert(a.calls.filter(c=>c[0]==='lineTo').length<600,'bounded ocean/ice geometry');
  assert(a.calls.every(c=>c.slice(1).every(v=>typeof v!=='number'||Number.isFinite(v))),'finite coordinates');
  assert(a.calls.filter(c=>c[0]==='moveTo').length===8,'only six water and two ice layers at every LOD');
 }
 for(const [x,y,r]of [[0,0,0],[0,0,-1],[0,0,Infinity],[NaN,0,2],[0,Infinity,2]]){const a=recorder();drawDahaiDisc(a.ctx,x,y,r);assert(!a.calls.length,'invalid geometry skipped');}
}finally{Math.random=originalRandom;}
function render(level:OrbitalLevel,time:number){
 const targetOrbit=level.systemBodies?.find(b=>b.id==='estella-iv')?.orbitRadius;
 const cam={x:1700,y:-2300,zoom:targetOrbit?Math.min(140/level.planetRadius,250/targetOrbit):140/level.planetRadius},state=createOrbitalState(level,{x:level.planetRadius*1.45,y:0,vx:0,vy:-300,time}),before=json({level,state}),rec=recorder();
 renderOrbital(rec.ctx,{width:1280,height:800} as HTMLCanvasElement,cam,state,level,time);assert(json({level,state})===before,'no changes to flight/objective state');return{...rec,cam};
}
function segment(calls:unknown[][],x:number,y:number,r:number){
 const expected=recorder();drawCurrentWorldDisc(expected.ctx,body.id,x,y,r,body.color);
 const start=calls.findIndex(c=>c[0]==='translate'&&c[1]===x&&c[2]===y)-1;
 assert(start>=0&&json(calls.slice(start,start+expected.calls.length))===json(expected.calls),'production central/stellar painter');
}
const targets=['estella-iv-main-orbital-station','estella-iv-primary-city','estella-iv-climate-poi-1','estella-iv-climate-poi-2','estella-iv-climate-poi-3'];
const names=['DAHAI MAIN ORBITAL STATION','FUYUAN','ZHULONG','JIUYUAN','BINGJIE'];
for(const [i,target]of targets.entries()){
 const before=new Set(ORBITAL_LEVELS.map(l=>l.id));createPlayableEstellaMission('estella-iii-main-customs',target,undefined,9900+i);
 const created=ORBITAL_LEVELS.filter(l=>!before.has(l.id)),local=created.find(l=>l.bodyId===body.id)!,star=created.find(l=>l.bodyId==='estella'&&l.systemBodies?.some(b=>b.id===body.id))!;
 assert(local&&star,`${target}: actual local/stellar phases`);
 assert(local.atmoHeight===75000&&local.scaleHeight===8500&&local.surfaceDensity===1,'original atmospheric envelope unchanged');
 if(i)assert(local.landingSiteAngle===[-.1,1.15,2.45,-2][i-1],'actual objective angle unchanged; no marker offsets');
 for(const time of [0,123456]){
  const a=render(local,time);segment(a.calls,640-a.cam.x*a.cam.zoom,400+a.cam.y*a.cam.zoom,body.radius*a.cam.zoom);
  for(const label of ['DAHAI',names[i]]){
   const fill=a.calls.find(c=>c[0]==='fillText'&&c[1]===label),outline=a.calls.find(c=>c[0]==='strokeText'&&c[1]===label);
   assert(fill&&outline&&json(fill.slice(1))===json(outline.slice(1)),'real body/target labels outlined at original anchor');
  }
  assert(a.calls.some(c=>c[0]==='set'&&c[1]==='strokeStyle'&&c[2]===`rgba(${body.atmosphere!.color.join(', ')}, 0.3)`),'original atmosphere still drawn');
  const b=render({...star,targetBodyId:body.id},time),pos=transferBodyState(star,body.id,time)!;
  segment(b.calls,640+(pos.x-b.cam.x)*b.cam.zoom,400-(pos.y-b.cam.y)*b.cam.zoom,Math.min(10,Math.max(3,body.radius*b.cam.zoom)));
  assert(b.calls.some(c=>c[0]==='strokeText'&&c[1]==='DAHAI'),'system marker label also outlined');
 }
}
assert(json([BODIES,SURFACE_POIS])===worldBefore,'body/atmosphere/colors/sites unchanged');
console.log(`Dahai artwork passed: ${assertions} assertions; seed ${DAHAI_SEED}, ocean/ice only, original geography, Zhulong on water, aligned rim sites, five real targets and outlined labels.`);
