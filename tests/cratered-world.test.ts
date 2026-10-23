import './svg-dom';
import { CELESTE_CRATER_PROFILE, CRATER_GEOMETRY_CACHE_LIMIT, crateredWorldProfile, crateredWorldGeometry, resolveCrateredWorldProfile, type CrateredWorldProfile } from '../src/cratered-world-geometry';
import { drawCrateredDisc, drawGaiaDisc } from '../src/world-disc-appearance';
import { drawCrateredDisc as legacyCrateredDisc, drawGaiaDisc as legacyGaiaDisc } from './fixtures/world-disc-v1';
import { BODIES } from '../src/world';

let assertions = 0;
function assert(ok: unknown, message: string): asserts ok { assertions++; if (!ok) throw Error(message); }
function recorder() {
  const calls: unknown[][] = [], raw: any = {};
  raw.createRadialGradient = (...args: number[]) => {
    const gradient = { args, stops: [] as unknown[], addColorStop(offset: number, color: string) { this.stops.push([offset,color]); } };
    calls.push(['gradient',gradient]); return gradient;
  };
  const ctx = new Proxy(raw, {
    get: (target,key) => key in target ? target[key] : (...args: unknown[]) => calls.push([String(key),...args]),
    set: (target,key,value) => { calls.push(['set',String(key),value]); target[key]=value; return true; },
  }) as CanvasRenderingContext2D;
  return { ctx, calls };
}
const palette: [number,number,number] = [170,165,150];
const originalRandom = Math.random;
try {
  Math.random = () => { throw Error('frame/global randomness forbidden'); };
  const seeds = new Set<number>();
  for (const body of BODIES) {
    const profile = crateredWorldProfile(body.id), copy = crateredWorldProfile(body.id);
    assert(JSON.stringify(profile) === JSON.stringify(copy), 'stable ID creates repeatable immutable profile');
    assert(Object.isFrozen(profile), 'profile immutable');
    assert(profile.seed > 0 && profile.seed < 2147483647 && Number.isInteger(profile.seed), 'valid integer PRNG seed');
    assert(!seeds.has(profile.seed), 'no seed collisions among current bodies'); seeds.add(profile.seed);
    const model = crateredWorldGeometry(profile);
    assert(model === crateredWorldGeometry(copy), 'equivalent profiles reuse geometry across views');
    assert(model === crateredWorldGeometry({...copy,reliefContrast:2}), 'contrast cannot regenerate geometry');
    assert(Object.isFrozen(model) && Object.isFrozen(model.craters) && Object.isFrozen(model.basins), 'cached model/collections immutable');
    for (const crater of model.craters) {
      assert(Object.isFrozen(crater) && Object.values(crater).every(Number.isFinite), 'immutable finite crater');
      assert(Math.hypot(crater.x,crater.y) <= .981 && crater.r > 0 && crater.r <= .13 && crater.squash >= .24, 'bounded normalized crater relief');
    }
    for (const basin of model.basins) {
      assert(Object.isFrozen(basin) && basin.length === 56, 'bounded basin detail');
      assert(basin.every(p=>Object.isFrozen(p)&&p.every(Number.isFinite)&&Math.abs(p[0])<2&&Math.abs(p[1])<2), 'immutable finite basin coordinates');
    }
  }
  assert(crateredWorldProfile('estella-iiia').seed === 41873, 'Celeste original seed explicitly retained');
  assert(JSON.stringify(['estella-va','estella-vib','estella-viii'].map(id=>crateredWorldProfile(id).seed)) === '[247163096,1978820202,847598162]', 'v1 stable-ID seed mapping cannot silently change');
  assert(crateredWorldProfile('estella-iiia',{seed:123}).basinLayout === 'seeded', 'explicit alternate seed changes both crater and basin systems');
  // Independent pre-stage source, not a golden regenerated from the new code.
  for (const radius of [0.25,3,5,8,14,30,59,60,220,2000]) for (const tint of [palette,[205,70,62],[135,155,170]] as [number,number,number][]) {
    const old = recorder(), current = recorder(), explicit = recorder();
    legacyCrateredDisc(old.ctx, 320, 240, radius, tint);
    drawCrateredDisc(current.ctx, 320, 240, radius, tint);
    drawCrateredDisc(explicit.ctx, 320, 240, radius, tint, crateredWorldProfile('estella-iiia'));
    assert(JSON.stringify(current.calls) === JSON.stringify(old.calls), 'Celeste v1 painting exactly unchanged at every LOD/tint');
    assert(JSON.stringify(explicit.calls) === JSON.stringify(old.calls), 'explicit Celeste profile matches original painter');
    const before = recorder(), after = recorder();
    legacyGaiaDisc(before.ctx,320,240,radius); drawGaiaDisc(after.ctx,320,240,radius);
    assert(JSON.stringify(before.calls) === JSON.stringify(after.calls), 'Gaia painter unchanged');
  }
  const pike = crateredWorldProfile('estella-va'), kalyna = crateredWorldProfile('estella-vib');
  const a = crateredWorldGeometry(pike), b = crateredWorldGeometry(kalyna);
  assert(JSON.stringify(a.craters) !== JSON.stringify(b.craters), 'different bodies have different crater layouts');
  assert(JSON.stringify(a.basins) !== JSON.stringify(b.basins), 'different bodies have different basins, not identical splotches');
  for (const profile of [pike,kalyna,crateredWorldProfile('estella-viii')]) for (const radius of [3,10,40,220]) {
    const first=recorder(), second=recorder();
    drawCrateredDisc(first.ctx,320,240,radius,palette,profile);
    drawCrateredDisc(second.ctx,320,240,radius,palette,profile);
    assert(JSON.stringify(first.calls)===JSON.stringify(second.calls),'seeded drawing repeatable');
    assert(first.calls.filter(c=>c[0]==='save').length===first.calls.filter(c=>c[0]==='restore').length,'seeded canvas stack balanced');
    assert(first.calls.findIndex(c=>c[0]==='clip')<first.calls.findIndex(c=>c[0]==='fillRect'),'seeded painting clipped');
    const model=crateredWorldGeometry(profile);
    const translations=first.calls.filter(c=>c[0]==='translate').slice(1);
    const count=radius<14?3:radius<60?9:model.craters.length;
    assert(translations.length===count && translations.every((c,i)=>c[1]===model.craters[i].x&&c[2]===model.craters[i].y),'LOD uses a subset of the same geometry, never reseeds');
  }
  const sparse = crateredWorldGeometry({...pike,craterCount:12}), dense = crateredWorldGeometry({...pike,craterCount:96});
  assert(sparse.craters.length===12&&dense.craters.length===96,'density control');
  assert(JSON.stringify(sparse.craters)===JSON.stringify(dense.craters.slice(0,12)),'density does not move existing craters');
  assert(JSON.stringify(sparse.basins)===JSON.stringify(dense.basins),'basin random stream independent of crater count');
  const scaled=crateredWorldGeometry({...pike,craterScale:1.4});
  assert(scaled.craters.every((c,i)=>c.x===a.craters[i].x&&c.y===a.craters[i].y&&c.r===a.craters[i].r*1.4),'scale changes radius, not placement');
  const noBasins=crateredWorldGeometry({...pike,basinCoverage:0});
  assert(noBasins.basins.length===0&&JSON.stringify(noBasins.craters)===JSON.stringify(a.craters),'basin coverage independent of craters');
  assert(JSON.stringify(crateredWorldGeometry({...pike,basinCoverage:1.5}).basins)!==JSON.stringify(a.basins),'coverage changes basin extents');
  const flat=recorder(), normal=recorder();
  drawCrateredDisc(flat.ctx,0,0,220,palette,{...pike,reliefContrast:0});drawCrateredDisc(normal.ctx,0,0,220,palette,pike);
  assert(JSON.stringify(flat.calls)!==JSON.stringify(normal.calls),'relief contrast changes paint');
  assert(JSON.stringify(flat.calls.filter(c=>c[0]!=='set'))===JSON.stringify(normal.calls.filter(c=>c[0]!=='set')),'contrast never moves geology');
  const unsafe: CrateredWorldProfile={seed:NaN,craterCount:Infinity,craterScale:-5,basinCoverage:99,reliefContrast:NaN};
  const safe=resolveCrateredWorldProfile(unsafe);
  assert(safe.seed===41873&&safe.craterCount===58&&safe.craterScale===.35&&safe.basinCoverage===1.75&&safe.reliefContrast===1,'invalid preview controls bounded/defaulted');
  assert(resolveCrateredWorldProfile({seed:0,craterCount:999}).craterCount===160,'finite complexity cap');
  const empty=crateredWorldGeometry({seed:-12,craterCount:-99,basinCoverage:0});
  assert(!empty.craters.length&&!empty.basins.length,'zero-detail profile valid');
  const safePaint=recorder(); drawCrateredDisc(safePaint.ctx,0,0,220,palette,unsafe);
  assert(safePaint.calls.every(c=>c.slice(1).every(v=>typeof v!=='number'||Number.isFinite(v))),'bad controls never produce invalid canvas geometry');
  const cached=crateredWorldGeometry(CELESTE_CRATER_PROFILE), saved=JSON.stringify(cached);
  let mutationFailed=false;try{(cached.craters[0] as any).x=99;}catch{mutationFailed=true;}
  assert(mutationFailed&&JSON.stringify(cached)===saved,'callers cannot corrupt shared geometry');
  for(let i=0;i<=CRATER_GEOMETRY_CACHE_LIMIT;i++)crateredWorldGeometry({seed:100000+i});
  const rebuilt=crateredWorldGeometry(CELESTE_CRATER_PROFILE);
  assert(rebuilt!==cached&&JSON.stringify(rebuilt)===saved,'bounded cache evicts but rebuilds identical geography');
} finally { Math.random=originalRandom; }
console.log(`Seeded crater foundation passed: ${assertions} assertions; original Celeste/Gaia paint, per-ID craters/basins, controls, bounded immutable cache, LOD.`);
