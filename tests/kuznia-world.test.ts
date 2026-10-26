import './svg-dom';
import './outline-canvas-shim';
import { drawCurrentWorldDisc } from '../src/world-presentation';
import { kuzniaGeometry, drawKuzniaDisc, KUZNIA_SEED } from '../src/kuznia-appearance';
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
function frozen(value:any):void{if(!value||typeof value!=='object')return;assert(Object.isFrozen(value),'deeply immutable cold surface');Object.values(value).forEach(frozen);}
function inside(points:readonly (readonly [number,number])[],x:number,y:number):boolean{
 let result=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [xi,yi]=points[i],[xj,yj]=points[j];
  if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)result=!result;
 }
 return result;
}
const worldBefore=json([BODIES,SURFACE_POIS]),body=bodyById('estella-vi');
const originalRandom=Math.random;
try{
 Math.random=()=>{throw Error('frame RNG forbidden');};
 const model=kuzniaGeometry();frozen(model);
 assert(model===kuzniaGeometry(),'one cached permanent map');
 assert(KUZNIA_SEED===248294852&&KUZNIA_SEED===crateredWorldProfile('cold-ground-v1:estella-vi').seed,'permanent ID seed');
 assert(json(Object.keys(model).sort())===json(['highlands','lowlands','polarGround','slopes']),'ground only; no clouds, lava, pollution, city or invented resource layers');
 assert(model.lowlands.length===3&&model.highlands.length===3&&model.slopes.length===5&&model.polarGround.length===2,'bounded authored composition');
 for(const layers of [model.lowlands,model.highlands,model.slopes,model.polarGround])for(const part of layers){
  assert(part.coarse.every(p=>part.full.includes(p)),'LOD reuses exact immutable points');
  assert(part.full.every(p=>p.every(Number.isFinite)),'finite normalized geography');
 }
 for(const lod of ['full','coarse'] as const){
  const at=(angle:number,layers:typeof model.highlands)=>layers.some(p=>inside(p[lod],Math.cos(angle)*.985,-Math.sin(angle)*.985));
  assert(at(-1.25,model.highlands),'Kopanka existing rim sits on main massif');
  assert(at(2.7,model.lowlands)&&!at(2.7,model.highlands),'Mokosh existing rim stays in lowlands');
  assert(at(-2.55,model.polarGround),'Morana retains polar-ground context at actual angle');
 }
 for(const radius of [.25,3,8,14,59,60,220,2000]){
  const a=recorder(),b=recorder();assert(drawAuthoredWorldDisc(a.ctx,body.id,640,400,radius,body.color),'explicit Kuznia dispatch');drawKuzniaDisc(b.ctx,640,400,radius);
  assert(json(a.calls)===json(b.calls),'same central/marker painter');
  const repeat=recorder();drawKuzniaDisc(repeat.ctx,640,400,radius);assert(json(a.calls)===json(repeat.calls),'repeatable geography');
  assert(a.calls.filter(c=>c[0]==='save').length===a.calls.filter(c=>c[0]==='restore').length,'balanced canvas state');
  assert(a.calls.findIndex(c=>c[0]==='clip')<a.calls.findIndex(c=>c[0]==='fillRect'),'original silhouette clipping');
  assert(a.calls.some(c=>c[0]==='set'&&c[1]==='fillStyle'&&c[2]==='#607b85'),'opaque slate ground base');
  assert(a.calls.filter(c=>c[0]==='arc').length===2,'clip/limb only; no craters/storm symbols');
  assert(a.calls.filter(c=>c[0]==='stroke').length===1,'filled terrain only; no crack/industrial strokes');
  assert(a.calls.filter(c=>c[0]==='lineTo').length<1500,'bounded renderer geometry');
  assert(a.calls.every(c=>c.slice(1).every(v=>typeof v!=='number'||Number.isFinite(v))),'finite draw coordinates');
  assert(a.calls.filter(c=>c[0]==='moveTo').length===13,'all ground layers at both LODs');
 }
 for(const [x,y,r]of [[0,0,0],[0,0,-1],[0,0,Infinity],[NaN,0,2],[0,Infinity,2]]){const a=recorder();drawKuzniaDisc(a.ctx,x,y,r);assert(!a.calls.length,'invalid geometry skipped');}
}finally{Math.random=originalRandom;}
function render(level:OrbitalLevel,time:number){
 const orbit=level.systemBodies?.find(b=>b.id==='estella-vi')?.orbitRadius;
 const cam={x:1700,y:-2300,zoom:orbit?Math.min(140/level.planetRadius,250/orbit):140/level.planetRadius},state=createOrbitalState(level,{x:level.planetRadius*1.45,y:0,vx:0,vy:-300,time}),before=json({level,state}),rec=recorder();
 renderOrbital(rec.ctx,{width:1280,height:800} as HTMLCanvasElement,cam,state,level,time);assert(json({level,state})===before,'no changes to flight/objective state');return{...rec,cam};
}
function segment(calls:unknown[][],x:number,y:number,r:number){
 const expected=recorder();drawCurrentWorldDisc(expected.ctx,body.id,x,y,r,body.color);
 const start=calls.findIndex(c=>c[0]==='translate'&&c[1]===x&&c[2]===y)-1;
 assert(start>=0&&json(calls.slice(start,start+expected.calls.length))===json(expected.calls),'production central/stellar painter');
}
const targets=['estella-vi-main-transit-dispatch','estella-vi-heavy-cargo-station','estella-vi-industrial-city','estella-vi-foundry-complex','estella-vi-spaceport','estella-vi-agricultural-lowlands','estella-vi-polar-weather-research','estella-vi-mountain-mining'];
const names=['ANVIL STATION','HAMMER STATION','PERUN CITY','GORNILO CRUCIBLE','PORT STRIBOG','MOKOSH LOWLANDS','MORANA STATION','KOPANKA MINE'];
for(const [i,target]of targets.entries()){
 const before=new Set(ORBITAL_LEVELS.map(l=>l.id));createPlayableEstellaMission('estella-iii-main-customs',target,undefined,10300+i);
 const created=ORBITAL_LEVELS.filter(l=>!before.has(l.id)),local=created.find(l=>l.bodyId===body.id)!,star=created.find(l=>l.bodyId==='estella'&&l.systemBodies?.some(b=>b.id===body.id))!;
 assert(local&&star,`${target}: actual local/stellar phases`);
 assert(local.atmoHeight===95000&&local.scaleHeight===11500&&local.surfaceDensity===2.2,'thick cold atmospheric envelope unchanged');
 if(i>=2)assert(local.landingSiteAngle===[-.15,.95,1.85,2.7,-2.55,-1.25][i-2],'actual objective angle unchanged');
 if(i===7)assert(local.surfaceMarkers?.find(m=>m.id===target)?.altitude===4000,'Kopanka actual four-kilometre marker altitude preserved');
 for(const time of [0,123456]){
  const a=render(local,time);segment(a.calls,640-a.cam.x*a.cam.zoom,400+a.cam.y*a.cam.zoom,body.radius*a.cam.zoom);
  for(const label of ['KUZNIA',names[i]]){
   const fill=a.calls.find(c=>c[0]==='fillText'&&c[1]===label),outline=a.calls.find(c=>c[0]==='strokeText'&&c[1]===label);
   assert(fill&&outline&&json(fill.slice(1))===json(outline.slice(1)),'real body/target label halo at original anchor');
  }
  assert(a.calls.some(c=>c[0]==='set'&&c[1]==='strokeStyle'&&c[2]===`rgba(${body.atmosphere!.color.join(', ')}, 0.3)`),'original atmosphere still drawn');
  const b=render({...star,targetBodyId:body.id},time),pos=transferBodyState(star,body.id,time)!;
  segment(b.calls,640+(pos.x-b.cam.x)*b.cam.zoom,400-(pos.y-b.cam.y)*b.cam.zoom,Math.min(10,Math.max(3,body.radius*b.cam.zoom)));
  assert(b.calls.some(c=>c[0]==='strokeText'&&c[1]==='KUZNIA'),'system marker label halo');
 }
}
assert(json([BODIES,SURFACE_POIS])===worldBefore,'body/atmosphere/colors/sites unchanged');
console.log(`Kuznia artwork passed: ${assertions} assertions; seed ${KUZNIA_SEED}, permanent cold terrain, eight real targets, original atmosphere/angles/altitude.`);
