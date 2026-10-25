import './svg-dom';
import { HARTWELL_APPROACH_BIOME, HARTWELL_APPROACH_TARGETS, hartwellApproachRegion, approachRidgeHeight, regionCoordinate, regionNoise, regionRandom } from '../src/approach-biomes';
import { getApproachTerrainHeight } from '../src/approach';
import { hartwellGroundMaterial, GROUND_MATERIAL_WIDTH, GROUND_MATERIAL_HEIGHT } from '../src/approach-ground-material';
import { SURFACE_POIS } from '../src/world';
let checks=0;
function assert(ok: unknown, message: string): asserts ok { checks++;if(!ok)throw new Error(message); }
const ids=SURFACE_POIS.filter(p=>p.bodyId==='estella-v').map(p=>p.id).sort();
assert(JSON.stringify(ids)===JSON.stringify([...HARTWELL_APPROACH_TARGETS].sort()),'every Hartwell surface site, no orbital sites');
assert(Object.isFrozen(HARTWELL_APPROACH_BIOME)&&Object.isFrozen(HARTWELL_APPROACH_BIOME.palette)&&Object.isFrozen(HARTWELL_APPROACH_TARGETS),'frozen biome and assignments');
const models=ids.map(hartwellApproachRegion);
const expectedSeeds=[819666517,1382687953,2606388751,1520306920,999795556];
HARTWELL_APPROACH_TARGETS.forEach((id,i)=>assert(hartwellApproachRegion(id).seed===expectedSeeds[i],'persistent target seed pinned'));
assert(new Set(models.map(m=>m.seed)).size===5,'five unique target identity seeds');
assert(new Set(models.map(m=>m.reliefSeed)).size===5&&new Set(models.map(m=>m.materialSeed)).size===5,'separate stable feature streams');
for(const id of ['estella-v-transit-customs','estella-v-high-orbit-factory','estella-iii-main-city','unknown']) {
 let rejected=false;try{hartwellApproachRegion(id);}catch{rejected=true;}assert(rejected,'no unreviewed biome assignment');
}
for(const model of models){
 assert(Object.isFrozen(model)&&model.biome===HARTWELL_APPROACH_BIOME,'immutable region, shared biome');
 assert(JSON.stringify(hartwellApproachRegion(model.targetId))===JSON.stringify(model),'no camera/time/call-order dependence');
 for(const layer of [0,1] as const)for(let x=-200000;x<=200000;x+=1733){
  const h=approachRidgeHeight(model,layer,x);
  assert(Number.isFinite(h)&&h>=180&&h<4000,'bounded distant relief');
  assert(h===approachRidgeHeight(model,layer,x),'deterministic relief');
  assert(Math.abs(approachRidgeHeight(model,layer,x-.001)-approachRidgeHeight(model,layer,x+.001))<.1,'continuous terrain across negative/positive cells');
 }
 for(const layer of [0,1] as const)for(let cell=-12;cell<=12;cell++){
  const x=cell*(layer?12000:19000);
  assert(Math.abs(approachRidgeHeight(model,layer,x-.0001)-approachRidgeHeight(model,layer,x+.0001))<.01,'ridge feature-cell seam continuous');
 }
 for(let cell=-100;cell<=100;cell++){
  const r=regionRandom(model.seed,cell,4);assert(r>=0&&r<1,'bounded indexed stream');
  assert(regionNoise(model.seed,cell,4)===r,'continuous noise lattice');
  assert(Math.abs(regionNoise(model.seed,cell-.00001,4)-regionNoise(model.seed,cell+.00001,4))<1e-6,'continuous cell seams');
 }
}
for(let x=-50000;x<=50000;x+=1000){
 assert(regionCoordinate(x+7000,7000,1)===x,'target translation independent');
 assert(regionCoordinate(-x+7000,7000,-1)===x,'direction reverses coordinates, not seed');
}
// Freeze the pre-study flight terrain behavior independently of new material/scenery.
function legacyHeight(x:number){
 const n=(i:number)=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 const noise=(v:number)=>{const i=Math.floor(v),f=v-i,t=f*f*(3-2*f);return(n(i)*(1-t)+n(i+1)*t)*2-1;};
 return Math.max(0,noise(x*.00008+42)*1200+noise(x*.0003+97)*400+300);
}
for(let x=-250000;x<=250000;x+=500)assert(getApproachTerrainHeight(x)===legacyHeight(x),'flight/collision terrain unchanged');
const materialHashes=new Set<number>();
for(const model of models){
 const pixels=hartwellGroundMaterial(model.materialSeed),replay=hartwellGroundMaterial(model.materialSeed);
 assert(pixels.length===GROUND_MATERIAL_WIDTH*GROUND_MATERIAL_HEIGHT*4,'bounded material tile');
 assert(pixels!==replay&&pixels.every((v,i)=>v===replay[i]),'independent repeatable material buffers');
 let hash=2166136261,strong=0,seam=0,interior=0;
 for(let i=0;i<pixels.length;i++)hash=Math.imul(hash^pixels[i],16777619);
 for(let i=3;i<pixels.length;i+=4){assert(pixels[i]<=145,'material opacity bounded');if(pixels[i]>20)strong++;}
 assert(strong>pixels.length/4*.2,'visible multi-scale material contrast');
 for(let y=0;y<GROUND_MATERIAL_HEIGHT;y++){
  const row=y*GROUND_MATERIAL_WIDTH*4;
  seam+=Math.abs(pixels[row+3]-pixels[row+(GROUND_MATERIAL_WIDTH-1)*4+3]);
  for(let x=1;x<GROUND_MATERIAL_WIDTH;x++)interior+=Math.abs(pixels[row+x*4+3]-pixels[row+(x-1)*4+3]);
 }
 assert(seam/GROUND_MATERIAL_HEIGHT<interior/(GROUND_MATERIAL_HEIGHT*(GROUND_MATERIAL_WIDTH-1))*2+4,'no strong periodic alpha seam');
 materialHashes.add(hash>>>0);
}
assert(materialHashes.size===5,'each target has distinct material');
for(const seed of [-1,NaN,Infinity,1.5,0x100000000]){
 let rejected=false;try{hartwellGroundMaterial(seed);}catch{rejected=true;}assert(rejected,'invalid material seed rejected');
}
console.log(`Approach biome study passed: ${checks} assertions; five target seeds, one biome.`);
