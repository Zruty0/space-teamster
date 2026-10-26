import './svg-dom';
import './outline-canvas-shim';
import { drawCurrentWorldDisc } from '../src/world-presentation';
import { FINAL_MOONS } from './final-moons-fixture';
import { calatravaGeometry } from '../src/calatrava-appearance';
import { almadenGeometry } from '../src/almaden-appearance';
import { marismaGeometry } from '../src/marisma-appearance';
import { crateredWorldGeometry, crateredWorldProfile } from '../src/cratered-world-geometry';
import { drawAuthoredWorldDisc } from '../src/world-disc-appearance';
import { BODIES, SURFACE_POIS, bodyById } from '../src/world';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { ORBITAL_LEVELS, createOrbitalState, renderOrbital, transferBodyState, type OrbitalLevel } from '../src/orbital';
import { groundStream, type GroundLayer } from '../src/authored-ground-geometry';
let checks=0;
function assert(ok:unknown,msg:string):asserts ok{checks++;if(!ok)throw Error(msg);}
const json=(v:unknown)=>JSON.stringify(v);
function recorder(){
 const calls:unknown[][]=[],raw:any={measureText:(s:string)=>({width:s.length*8})};
 for(const name of ['createLinearGradient','createRadialGradient'])raw[name]=(...args:number[])=>{
  const g={name,args,stops:[] as unknown[],addColorStop(offset:number,color:string){this.stops.push([offset,color]);}};calls.push([name,g]);return g;
 };
 const ctx=new Proxy(raw,{get:(o,k)=>k in o?o[k]:(...args:unknown[])=>calls.push([String(k),...args]),set:(o,k,v)=>{o[k]=v;calls.push(['set',String(k),v]);return true;}})as CanvasRenderingContext2D;
 return{ctx,calls};
}
function frozen(v:any):void{if(!v||typeof v!=='object')return;assert(Object.isFrozen(v),'deep immutable models');Object.values(v).forEach(frozen);}
function inside(points:readonly (readonly [number,number])[],angle:number){
 const x=Math.cos(angle)*.985,y=-Math.sin(angle)*.985;let result=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [xi,yi]=points[i],[xj,yj]=points[j];
  if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)result=!result;
 }return result;
}
const before=json([BODIES,SURFACE_POIS]),rng=Math.random;
try{
 Math.random=()=>{throw Error('frame RNG forbidden');};
 assert(json(FINAL_MOONS.map(m=>m.seed))===json([1274548594,155964474,1940068925]),'fixed permanent ID seeds');
 for(const moon of FINAL_MOONS){
  const first=groundStream(moon.seed,'relief'),repeat=groundStream(moon.seed,'relief'),other=groundStream(moon.seed,'other');
  const sequence=Array.from({length:12},()=>first());
  assert(json(sequence)===json(Array.from({length:12},()=>repeat())),'independent stream repeatability');
  assert(json(sequence)!==json(Array.from({length:12},()=>other())),'separate feature streams');
 }
 for(const moon of FINAL_MOONS){
  const model=moon.model();frozen(model);assert(model===moon.model(),'same cached map');
  for(const key of ['clouds','storms','haze','cities','rings','fractures'])assert(!(key in model),'no deferred or unapproved layers');
  for(const group of Object.values(model))for(const layer of group as any[]){
   if(!layer.full)continue;
   const part=layer as GroundLayer;
   assert(part.coarse.every(p=>part.full.includes(p)),'LOD exact point subset');
   assert(part.full.every(p=>p.every(Number.isFinite)),'finite static surface');
  }
  for(const radius of [.25,3,8,14,59,60,220,2000]){
   const a=recorder(),b=recorder();moon.paint(a.ctx,640,400,radius);
   assert(drawAuthoredWorldDisc(b.ctx,moon.id,640,400,radius,bodyById(moon.id).color),'new explicit opt-in');
   assert(json(a.calls)===json(b.calls),'full and marker share painter');
   const repeat=recorder();moon.paint(repeat.ctx,640,400,radius);assert(json(a.calls)===json(repeat.calls),'repeat geometry identical');
   assert(a.calls.filter(c=>c[0]==='save').length===a.calls.filter(c=>c[0]==='restore').length,'balanced state');
   assert(a.calls.findIndex(c=>c[0]==='clip')<a.calls.findIndex(c=>c[0]==='fillRect'),'clipped original limb');
   assert(a.calls.some(c=>c[0]==='set'&&c[1]==='fillStyle'&&c[2]===moon.base),'opaque original-family palette');
   assert(a.calls.filter(c=>c[0]==='lineTo').length<2300,'bounded rendering');
   assert(a.calls.every(c=>c.slice(1).every(v=>typeof v!=='number'||Number.isFinite(v))),'finite draw calls');
   assert(!a.calls.some(c=>c[0]==='set'&&['shadowBlur','filter','globalCompositeOperation'].includes(String(c[1]))),'no glow or compositing');
   const impactCount=radius<14?3:radius<60?9:52;
   assert(a.calls.filter(c=>c[0]==='arc').length===(moon.stage===9?2+impactCount*(radius<14?1:3):2),'crater LOD only on Calatrava; no impact/storm circles on other moons');
  }
  for(const [x,y,r]of [[0,0,0],[0,0,-1],[0,0,NaN],[0,0,Infinity],[NaN,0,2],[0,Infinity,2]]){
   const a=recorder();moon.paint(a.ctx,x,y,r);assert(!a.calls.length,'invalid input safely ignored');
  }
 }
}finally{Math.random=rng;}
const c=calatravaGeometry(),a=almadenGeometry(),m=marismaGeometry();
assert(c.craters.length===52&&c.resurfaced.length===3&&c.geothermal.length===3,'bounded rocky hybrid');
assert(a.calderas.length===12&&a.flows.length===4&&a.sulfur.length===3,'four three-layer volcanic calderas');
assert(m.lowlands.length===3&&m.uplands.length===2&&m.surfaceTones.length===3,'cool ground only');
const area=(points:GroundLayer['full'])=>Math.abs(points.reduce((sum,[x,y],i)=>{
 const next=points[(i+1)%points.length];return sum+x*next[1]-y*next[0];
},0))/2;
assert(c.geothermal.reduce((sum,p)=>sum+area(p.full),0)/Math.PI<.10,'local geothermal belts, not a global molten face');
assert(c.resurfaced.reduce((sum,p)=>sum+area(p.full),0)/Math.PI<.40,'older crater terrain remains dominant');
assert(a.calderas.filter((_,i)=>i%3===1).reduce((sum,p)=>sum+area(p.full),0)/Math.PI<.12,'bounded dark calderas, sulfur plains dominant');
for(const lod of ['full','coarse']as const){
 assert(c.resurfaced.some(p=>inside(p[lod],-1.2)),'Marcher Wells on resurfaced geothermal belt');
 for(const angle of [1.45,2.55,-2.45])assert(!c.geothermal.some(p=>inside(p[lod],angle)),'proving/receiving sites not moved into geothermal interiors');
 assert(a.sulfur.some(p=>inside(p[lod],.2)),'Yellow Pit retains sulfur ground');
 for(const angle of [.2,1.65,-2.25])assert(!a.calderas.some(p=>inside(p[lod],angle)),'surface sites not in caldera interiors');
 assert(a.flows.some(p=>inside(p[lod],-2.25)),'Cinnabar Cut on contrasting volcanic ground');
 for(const angle of [.85,2.65])assert(m.lowlands.some(p=>inside(p[lod],angle)),'Blue Fen/Blackwater on lowlands at real angles');
}
const oldModel=json(c),oldRef=c.craters;
for(let i=0;i<80;i++)crateredWorldGeometry(crateredWorldProfile('stage9-eviction:'+i));
assert(calatravaGeometry().craters===oldRef&&json(calatravaGeometry())===oldModel,'retained hybrid independent of shared crater-cache eviction');
function render(level:OrbitalLevel,time:number){
 const orbit=Math.max(0,...(level.systemBodies??[]).map(b=>b.orbitRadius));
 const cam={x:1700,y:-2300,zoom:Math.min(140/level.planetRadius,orbit?250/orbit:Infinity)},state=createOrbitalState(level,{x:level.planetRadius*1.45,y:0,vx:0,vy:-300,time}),snapshot=json({level,state}),rec=recorder();
 renderOrbital(rec.ctx,{width:1280,height:800}as HTMLCanvasElement,cam,state,level,time);
 assert(json({level,state})===snapshot,'flight/objective state unchanged');return{...rec,cam};
}
function segment(calls:unknown[][],moon:typeof FINAL_MOONS[number],x:number,y:number,r:number){
 const expected=recorder();drawCurrentWorldDisc(expected.ctx,moon.id,x,y,r,bodyById(moon.id).color);
 const start=calls.findIndex(c=>c[0]==='translate'&&c[1]===x&&c[2]===y)-1;
 assert(start>=0&&json(calls.slice(start,start+expected.calls.length))===json(expected.calls),'production local/parent exact shared painter');
}
let mission=11000;
for(const moon of FINAL_MOONS)for(const [target,name,angle]of moon.targets){
 const existing=new Set(ORBITAL_LEVELS.map(l=>l.id)),body=bodyById(moon.id);
 createPlayableEstellaMission('estella-iii-main-customs',target,undefined,mission++);
 const levels=ORBITAL_LEVELS.filter(l=>!existing.has(l.id)),local=levels.find(l=>l.bodyId===moon.id)!,parent=levels.find(l=>l.bodyId===body.orbit!.parentBodyId&&l.systemBodies?.some(b=>b.id===moon.id))!;
 assert(local&&parent,`${target}: real moon and parent-frame phases`);
 if(angle!==null)assert(local.landingSiteAngle===angle,'actual site angle unchanged');
 if(moon.stage===9)assert(!body.atmosphere&&!local.atmoHeight,'Calatrava stays airless');
 else assert(local.atmoHeight===moon.atmosphere[0]&&local.surfaceDensity===moon.atmosphere[1]&&local.scaleHeight===moon.atmosphere[2],'existing atmosphere unchanged');
 for(const time of [0,123456]){
  const view=render(local,time);segment(view.calls,moon,640-view.cam.x*view.cam.zoom,400+view.cam.y*view.cam.zoom,body.radius*view.cam.zoom);
  for(const label of [moon.name.toUpperCase(),name.toUpperCase()]){
   const fill=view.calls.find(c=>c[0]==='fillText'&&c[1]===label),stroke=view.calls.find(c=>c[0]==='strokeText'&&c[1]===label);
   assert(fill&&stroke&&json(fill.slice(1))===json(stroke.slice(1)),`${label}: full outlined label at original anchor`);
  }
  if(body.atmosphere)assert(view.calls.some(c=>c[0]==='set'&&c[1]==='strokeStyle'&&c[2]===`rgba(${body.atmosphere!.color.join(', ')}, 0.3)`),'existing physical atmosphere drawn independently');
  const chart=render({...parent,targetBodyId:moon.id},time),pos=transferBodyState(parent,moon.id,time)!;
  segment(chart.calls,moon,640+(pos.x-chart.cam.x)*chart.cam.zoom,400-(pos.y-chart.cam.y)*chart.cam.zoom,Math.min(10,Math.max(3,body.radius*chart.cam.zoom)));
  assert(chart.calls.some(c=>c[0]==='strokeText'&&c[1]===moon.name.toUpperCase()),'parent marker readable label');
 }
}
assert(json([BODIES,SURFACE_POIS])===before,'all physics/palettes/sites preserved');
console.log(`Final moons passed: ${checks} assertions; all 14 real targets, immutable surface models, fixed sites/atmospheres/flight state. Seeds: ${FINAL_MOONS.map(m=>m.seed).join(', ')}.`);
