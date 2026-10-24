import './svg-dom';
import { ESTELLA_ROCKY_WORLD_PROFILES, rockyWorldProfileFor } from '../src/content/estella/rocky-world-appearance';
import { crateredWorldGeometry, crateredWorldProfile } from '../src/cratered-world-geometry';
import { drawAuthoredWorldDisc, drawCrateredDisc } from '../src/world-disc-appearance';
import { drawCrateredDisc as originalCeleste } from './fixtures/world-disc-v1';
import { BODIES, SURFACE_POIS, bodyById } from '../src/world';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { ORBITAL_LEVELS, createOrbitalState, renderOrbital, transferBodyState, type OrbitalLevel } from '../src/orbital';

// Independent approval list: adding a registry entry cannot silently opt in ice
// worlds, Calatrava, atmospheric worlds, giants or captured asteroids.
export const EXPECTED_ROCKY_IDS: readonly string[] = [
  'estella-iiia','estella-va','estella-via','estella-vib','estella-vii','estella-viii',
  'estella-ix','estella-xb','estella-xc','estella-xid','estella-xie','estella-xif','estella-xiib','estella-xiid',
];
let assertions=0;
function assert(ok:unknown,message:string):asserts ok {assertions++;if(!ok)throw Error(message);}
function recorder(){
  const calls:unknown[][]=[],raw:any={measureText:(text:string)=>({width:text.length*8})};
  for(const name of ['createLinearGradient','createRadialGradient'])raw[name]=(...args:number[])=>{
    const gradient={name,args,stops:[] as unknown[],addColorStop(offset:number,color:string){this.stops.push([offset,color]);}};
    calls.push([name,gradient]);return gradient;
  };
  const ctx=new Proxy(raw,{
    get:(target,key)=>key in target?target[key]:(...args:unknown[])=>calls.push([String(key),...args]),
    set:(target,key,value)=>{calls.push(['set',String(key),value]);target[key]=value;return true;},
  }) as CanvasRenderingContext2D;
  return {ctx,calls};
}
assert(JSON.stringify(Object.keys(ESTELLA_ROCKY_WORLD_PROFILES).sort())===JSON.stringify([...EXPECTED_ROCKY_IDS].sort()),'13 approved rocky worlds plus approved Sahra regolith conversion');
assert(Object.isFrozen(ESTELLA_ROCKY_WORLD_PROFILES),'registry immutable');
const physicsBefore=JSON.stringify(BODIES),sitesBefore=JSON.stringify(SURFACE_POIS);
const seeds=new Set<number>(),layouts=new Set<string>();
for(const id of EXPECTED_ROCKY_IDS){
  const body=bodyById(id),profile=rockyWorldProfileFor(id)!;
  assert(profile&&Object.isFrozen(profile),`${body.name}: frozen authored profile`);
  assert(body.atmosphere===null,`${body.name}: airless family only`);
  assert(profile.seed===crateredWorldProfile(id).seed,`${body.name}: stable-ID seed, not display-name/visit RNG`);
  seeds.add(profile.seed);layouts.add(JSON.stringify(crateredWorldGeometry(profile)));
  for(const radius of [3,8,14,40,60,220,2000]){
    const actual=recorder(),expected=recorder();
    assert(drawAuthoredWorldDisc(actual.ctx,id,640,400,radius,body.color),`${body.name}: dispatched`);
    drawCrateredDisc(expected.ctx,640,400,radius,body.color,profile);
    assert(JSON.stringify(actual.calls)===JSON.stringify(expected.calls),`${body.name}: actual profile and existing palette used at every LOD`);
    assert(actual.calls.filter(c=>c[0]==='save').length===actual.calls.filter(c=>c[0]==='restore').length,'balanced canvas stack');
    assert(actual.calls.findIndex(c=>c[0]==='clip')<actual.calls.findIndex(c=>c[0]==='fillRect'),'body art clipped before paint');
    if(id==='estella-iiia'){
      const old=recorder();originalCeleste(old.ctx,640,400,radius,body.color);
      assert(JSON.stringify(old.calls)===JSON.stringify(actual.calls),'production Celeste retains exact original painter');
    }
  }
}
assert(seeds.size===14&&layouts.size===14,'all 14 worlds have distinct permanent geology');
for(const id of ['estella-i','estella-iii','estella-xa','estella-xic','estella-xiia','estella-xd','estella-iv','estella-x','estella-xiii','estella-viii-captured-moonlet','constructor','toString','__proto__']){
  assert(rockyWorldProfileFor(id)===undefined,`${id}: not accidentally included by atmosphere/prototype lookup`);
}

function render(level:OrbitalLevel,time:number){
  const cam={x:1700,y:-2300,zoom:140/level.planetRadius};
  const state=createOrbitalState(level,{x:level.planetRadius*1.45,y:0,vx:0,vy:-300,time});
  const before=JSON.stringify({level,state}),rec=recorder();
  renderOrbital(rec.ctx,{width:1280,height:800} as HTMLCanvasElement,cam,state,level,time);
  assert(JSON.stringify({level,state})===before,'rendering never mutates flight state or geometry');
  return {...rec,cam};
}
function assertDiscSegment(calls:unknown[][],id:string,x:number,y:number,radius:number):void{
  const expected=recorder();drawAuthoredWorldDisc(expected.ctx,id,x,y,radius,bodyById(id).color);
  const start=calls.findIndex(c=>c[0]==='translate'&&c[1]===x&&c[2]===y)-1;
  assert(start>=0&&JSON.stringify(calls.slice(start,start+expected.calls.length))===JSON.stringify(expected.calls),`${id}: production orbital path uses full shared painter/profile`);
}
for(let index=0;index<EXPECTED_ROCKY_IDS.length;index++){
  const id=EXPECTED_ROCKY_IDS[index],body=bodyById(id),site=SURFACE_POIS.find(s=>s.bodyId===id)!;
  assert(site,`${body.name}: real landing site`);
  const before=new Set(ORBITAL_LEVELS.map(l=>l.id));
  createPlayableEstellaMission('estella-iii-main-customs',site.id,undefined,8800+index);
  const created=ORBITAL_LEVELS.filter(l=>!before.has(l.id));
  const local=created.find(l=>l.bodyId===id&&l.reentryApproachLevelId!==undefined)!;
  const parent=created.find(l=>l.bodyId===body.orbit!.parentBodyId&&l.systemBodies?.some(b=>b.id===id))!;
  assert(local&&parent,`${body.name}: actual local and parent-frame phases exist`);
  for(const time of [0,123456]){
    const full=render(local,time);
    assertDiscSegment(full.calls,id,640-full.cam.x*full.cam.zoom,400+full.cam.y*full.cam.zoom,body.radius*full.cam.zoom);
    assert(full.calls.some(c=>c[0]==='fillText'&&c[1]===body.name.toUpperCase()),`${body.name}: central label retained`);
    const chart=render({...parent,targetBodyId:id},time),pos=transferBodyState(parent,id,time)!;
    assert(pos,`${body.name}: real marker ephemeris`);
    assertDiscSegment(chart.calls,id,640+(pos.x-chart.cam.x)*chart.cam.zoom,400-(pos.y-chart.cam.y)*chart.cam.zoom,Math.min(10,Math.max(3,body.radius*chart.cam.zoom)));
  }
}
assert(JSON.stringify(BODIES)===physicsBefore&&JSON.stringify(SURFACE_POIS)===sitesBefore,'body physics, palettes, ephemerides and surface placements unchanged');
console.log(`Rocky world rollout passed: ${assertions} assertions; 14 authored profiles, actual central/parent markers, exact Celeste and unchanged world geometry.`);
