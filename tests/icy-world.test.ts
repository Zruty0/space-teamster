import './svg-dom';
import { icyWorldProfile, icyWorldGeometry, resolveIcyWorldProfile, ICE_GEOMETRY_CACHE_LIMIT } from '../src/icy-world-geometry';
import { ESTELLA_ICY_WORLD_PROFILES, icyWorldProfileFor } from '../src/content/estella/icy-world-appearance';
import { drawIcyDisc } from '../src/icy-world-appearance';
import { drawAuthoredWorldDisc } from '../src/world-disc-appearance';
import { BODIES, SURFACE_POIS, bodyById } from '../src/world';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { ORBITAL_LEVELS, createOrbitalState, renderOrbital, transferBodyState, type OrbitalLevel } from '../src/orbital';

export const EXPECTED_ICY_IDS: readonly string[] = ['estella-ix','estella-xa','estella-xic','estella-xiia','estella-xiic','estella-xiii','estella-xiv','reach-rogue-kbo-fragment'];
let assertions = 0;
function assert(ok: unknown, msg: string): asserts ok { assertions++; if (!ok) throw Error(msg); }
const json = (x: unknown) => JSON.stringify(x);
function recorder() {
  const calls: unknown[][] = [], raw: any = { measureText: (t: string) => ({width:t.length*8}) };
  for (const name of ['createLinearGradient','createRadialGradient']) raw[name] = (...args: number[]) => {
    const g = {name,args,stops:[] as unknown[],addColorStop(offset:number,color:string){this.stops.push([offset,color]);}};
    calls.push([name,g]); return g;
  };
  const ctx = new Proxy(raw, {get:(o,k)=>k in o?o[k]:(...args:unknown[])=>calls.push([String(k),...args]),set:(o,k,v)=>{o[k]=v;calls.push(['set',String(k),v]);return true;}}) as CanvasRenderingContext2D;
  return {ctx,calls};
}
function frozen(value: any): void {
  if (!value || typeof value !== 'object') return;
  assert(Object.isFrozen(value),'deeply immutable geometry');
  for (const v of Object.values(value)) frozen(v);
}
assert(json(Object.keys(ESTELLA_ICY_WORLD_PROFILES).sort())===json([...EXPECTED_ICY_IDS].sort()),'exact eight approved ice worlds');
assert(Object.isFrozen(ESTELLA_ICY_WORLD_PROFILES),'frozen registry');
const worldBefore=json([BODIES,SURFACE_POIS]),layouts=new Set<string>(),frosts=new Set<string>(),fractures=new Set<string>();
const originalRandom=Math.random;
try {
  Math.random=()=>{throw Error('No frame RNG');};
  for (const id of EXPECTED_ICY_IDS) {
    const p=icyWorldProfileFor(id)!, model=icyWorldGeometry(p), body=bodyById(id);
    assert(Object.isFrozen(p),'frozen profile'); frozen(model);
    layouts.add(json(model)); frosts.add(json(model.frost)); fractures.add(json(model.fractures));
    assert(icyWorldGeometry({...p,dirt:0.99,reliefContrast:0.3})===model,'material/contrast do not reroll/cache new geometry');
    const sparse=icyWorldGeometry({...p,craterCount:5,fractureCount:2});
    assert(json(sparse.frost)===json(model.frost),'changing counts does not reshuffle frost');
    assert(json(sparse.surface.craters)===json(model.surface.craters.slice(0,5)),'crater prefix stable');
    assert(json(sparse.fractures)===json(model.fractures.slice(0,2)),'fracture prefix stable');
    const lessFrost=icyWorldGeometry({...p,frostCoverage:0.1});
    assert(json(lessFrost.fractures)===json(model.fractures)&&json(lessFrost.surface)===json(model.surface),'independent material streams');
    for(const r of [0.25,3,8,14,59,60,220,2000]) {
      const a=recorder(),b=recorder();
      assert(drawAuthoredWorldDisc(a.ctx,id,640,400,r,body.color),'live dispatcher');
      drawIcyDisc(b.ctx,640,400,r,body.color,p);
      assert(json(a.calls)===json(b.calls),'same profile/geometry through dispatch at every LOD');
      const again=recorder();drawIcyDisc(again.ctx,640,400,r,body.color,p);
      assert(json(a.calls)===json(again.calls),'repeatable paint');
      assert(a.calls.filter(c=>c[0]==='save').length===a.calls.filter(c=>c[0]==='restore').length,'balanced state');
      assert(a.calls.findIndex(c=>c[0]==='clip')<a.calls.findIndex(c=>c[0]==='fillRect'),'all art clipped');
      assert(a.calls.every(c=>c.slice(1).every(v=>typeof v!=='number'||Number.isFinite(v))),'finite coordinates');
      assert(a.calls.filter(c=>c[0]==='lineTo').length<2400,'bounded vertex budget');
      const paths=a.calls.filter(c=>c[0]==='moveTo');
      assert(model.frost.every(field=>paths.some(c=>c[1]===field[0][0]&&c[2]===field[0][1])),'same frost fields at every scale');
      for (const crack of model.fractures.slice(0,r<14?0:r<60?4:undefined)) assert(paths.some(c=>c[1]===crack.main[0][0]&&c[2]===crack.main[0][1]),'LOD uses original fracture paths, not new geology');
    }
    for(const [x,y,r] of [[0,0,0],[0,0,-1],[0,0,NaN],[Infinity,0,10],[0,NaN,10]]){
      const a=recorder();drawIcyDisc(a.ctx,x,y,r,body.color,p);assert(!a.calls.length,'invalid inputs skipped');
    }
  }
} finally { Math.random=originalRandom; }
assert(layouts.size===8&&frosts.size===8&&fractures.size===8,'all eight have distinct frost/fracture/impact geography');
const base=icyWorldProfile('estella-xa'),old=icyWorldGeometry(base),snapshot=json(old);
assert(icyWorldProfile('estella-xa',{seed:undefined}).seed===base.seed,'undefined override keeps permanent ID seed');
assert(json(EXPECTED_ICY_IDS.map(id=>icyWorldProfileFor(id)!.seed))===json([267736572,852143118,1928884131,1680290610,1713845848,1814511562,1610109370,896573598]),'v1 icy body seed mapping pinned');
for(let i=0;i<ICE_GEOMETRY_CACHE_LIMIT+10;i++) icyWorldGeometry(icyWorldProfile(`eviction-${i}`));
const rebuilt=icyWorldGeometry(base);
assert(rebuilt!==old&&json(rebuilt)===snapshot,'bounded LRU evicts and rebuilds identical model');
const zero=icyWorldGeometry({...base,frostCoverage:0,fractureCount:0,craterCount:0,basinCoverage:0});
assert(!zero.frost.length&&!zero.fractures.length&&!zero.surface.craters.length&&!zero.surface.basins.length,'zero controls supported');
const invalid=resolveIcyWorldProfile({seed:NaN,frostCoverage:Infinity,fractureCount:Infinity,dirt:NaN});
assert(Object.values(invalid).every(v=>typeof v!=='number'||Number.isFinite(v)),'nonfinite profiles resolve safely');
const bounded=resolveIcyWorldProfile({seed:1,frostCoverage:5,fractureCount:999,dirt:-4});
assert(bounded.frostCoverage===1&&bounded.fractureCount===16&&bounded.dirt===0,'bounded controls');
const bad=recorder();drawIcyDisc(bad.ctx,0,0,100,[NaN,100,100],base);assert(!bad.calls.length,'invalid palette skipped');
for(const id of ['estella-iiia','estella-iv','estella-x','estella-xd','estella-ix-captured-moonlet','estella-viii-captured-moonlet','constructor','__proto__'])assert(!icyWorldProfileFor(id),'no accidental opt-in');
const mercy=bodyById('estella-xiia');
assert(mercy.atmosphere?.height===34000&&mercy.atmosphere.surfaceDensity===0.12&&mercy.atmosphere.scaleHeight===9000,'original thin nitrogen atmosphere retained');
assert(bodyById('estella-xa').atmosphere===null,'Beira remains airless, no exposed surface ocean/atmosphere');

function render(level:OrbitalLevel,time:number){
  const cam={x:1700,y:-2300,zoom:140/level.planetRadius},state=createOrbitalState(level,{x:level.planetRadius*1.45,y:0,vx:0,vy:-300,time});
  const before=json({level,state}),rec=recorder();
  renderOrbital(rec.ctx,{width:1280,height:800} as HTMLCanvasElement,cam,state,level,time);
  assert(json({level,state})===before,'rendering leaves physical state/objectives unchanged');return {...rec,cam};
}
function segment(calls:unknown[][],id:string,x:number,y:number,r:number){
  const expected=recorder();drawIcyDisc(expected.ctx,x,y,r,bodyById(id).color,icyWorldProfileFor(id)!);
  const start=calls.findIndex(c=>c[0]==='translate'&&c[1]===x&&c[2]===y)-1;
  assert(start>=0&&json(calls.slice(start,start+expected.calls.length))===json(expected.calls),'actual orbital renderer uses shared ice profile');
}
for(const [index,id] of EXPECTED_ICY_IDS.entries()){
  const body=bodyById(id),site=SURFACE_POIS.find(s=>s.bodyId===id)!;
  const before=new Set(ORBITAL_LEVELS.map(l=>l.id));
  createPlayableEstellaMission('estella-iii-main-customs',site.id,undefined,9300+index);
  const created=ORBITAL_LEVELS.filter(l=>!before.has(l.id));
  const local=created.find(l=>l.bodyId===id&&l.reentryApproachLevelId!==undefined)!;
  const parent=created.find(l=>l.bodyId===body.orbit!.parentBodyId&&l.systemBodies?.some(b=>b.id===id))!;
  assert(local&&parent,`${id}: real local and parent phases`);
  for(const time of [0,123456]){
    const full=render(local,time);segment(full.calls,id,640-full.cam.x*full.cam.zoom,400+full.cam.y*full.cam.zoom,body.radius*full.cam.zoom);
    if(id==='estella-xiia'){
      const tint=mercy.atmosphere!.color.join(', ');
      assert(full.calls.some(c=>c[0]==='set'&&c[1]==='fillStyle'&&c[2]===`rgba(${tint}, 0.15)`),'Mercy existing atmosphere layer still drawn');
    }
    const chart=render({...parent,targetBodyId:id},time),pos=transferBodyState(parent,id,time)!;
    segment(chart.calls,id,640+(pos.x-chart.cam.x)*chart.cam.zoom,400-(pos.y-chart.cam.y)*chart.cam.zoom,Math.min(10,Math.max(3,body.radius*chart.cam.zoom)));
  }
}
assert(json([BODIES,SURFACE_POIS])===worldBefore,'world physics, palettes, atmosphere, ephemerides and sites unchanged');
console.log(`Icy world family passed: ${assertions} assertions; eight distinct immutable worlds, stable LOD, actual orbital paths and Mercy atmosphere.`);
