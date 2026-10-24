import { WEATHER_DIRECTIONS, WEATHER_SAMPLE_COUNT, WEATHER_LEGACY_RANGE_VERSION, weatherSampleSets } from '../src/atmosphere-gallery-profiles';
import { atmosphereProfile } from '../src/atmosphere-prototype-profile';
import { ESTELLA_NODE_BLUEPRINTS } from '../src/content/estella';
import { ESTELLA_ATMOSPHERE_PHYSICS } from '../src/content/estella/physics';
let checks=0;const assert=(ok:unknown,message:string)=>{checks++;if(!ok)throw Error(message);};
const json=(v:unknown)=>JSON.stringify(v),ids=WEATHER_DIRECTIONS.map(d=>d.id).sort();
const giants=ESTELLA_NODE_BLUEPRINTS.filter(n=>n.kind==='gas-giant').map(n=>n.id);
const physical=Object.keys(ESTELLA_ATMOSPHERE_PHYSICS).filter(id=>!giants.includes(id)).sort();
const catalog=ESTELLA_NODE_BLUEPRINTS.filter(n=>n.capabilities?.hasAtmosphere&&n.kind!=='gas-giant').map(n=>n.id).sort();
assert(ids.length===8&&json(ids)===json(physical)&&json(ids)===json(catalog),'all eight non-giant atmospheric bodies, including moons');
assert(giants.every(id=>!ids.includes(id)),'giants excluded at explicit request');
assert(WEATHER_SAMPLE_COUNT===10,'ten representative samples per body');
const now=Date.now,random=Math.random;
try{
 Date.now=()=>{throw Error('no wall clock inside model');};Math.random=()=>{throw Error('no unseeded randomness');};
 const batch=weatherSampleSets(1792879200123);
 assert(Object.isFrozen(batch)&&json(batch)===json(weatherSampleSets(1792879200123)),'repeat batch deterministic and frozen');
 const legacy=weatherSampleSets(1792879200123,WEATHER_LEGACY_RANGE_VERSION);
 for(let i=0;i<batch.length;i++)for(let j=0;j<10;j++){
  const current=batch[i].samples[j],old=legacy[i].samples[j];
  if(batch[i].direction.id==='estella-iv'){
   assert(Math.abs(current.coverage-old.coverage*.75)<1e-12,'Dahai amount reduced25%');
   assert(json({...current,coverage:old.coverage})===json(old),'Dahai colors/noise/speeds otherwise preserved');
  }else assert(json(current)===json(old),'other seven worlds keep identical samples across range versions');
 }
 assert(json(batch)!==json(weatherSampleSets(1792879200124)),'new timestamp changes batch');
 const seeds=new Set<number>();
 for(const set of batch){
  const {direction,samples}=set;
  assert(Object.isFrozen(direction)&&Object.isFrozen(direction.ranges)&&Object.isFrozen(samples),'frozen direction/ranges/samples');
  assert(samples.length===10&&new Set(samples.map(json)).size===10,'ten distinct profiles');
  assert(new Set(samples.map(p=>json(p.cloudColor))).size===10,'different cloud colors within the palette');
  assert(new Set(samples.map(p=>p.loopSeconds)).size===10,'different sampled animation periods');
  for(const p of samples){
   seeds.add(p.seed);assert(Object.isFrozen(p)&&Object.isFrozen(p.cloudColor)&&Object.isFrozen(p.hazeColor),'deep immutable generated profile');
   assert(json(p)===json(atmosphereProfile(p)),'ranges fit renderer bounds without silent clipping');
   for(const [key,[low,high]]of Object.entries(direction.ranges)){
    const value=p[key as keyof typeof p]as number;
    assert(Number.isFinite(value)&&value>=low-1e-12&&value<=high+1e-12,`${direction.name}: ${key} in predefined range`);
   }
   for(const [name,colors]of [['cloudColor',direction.cloudColors],['hazeColor',direction.hazeColors]]as const){
    assert(p[name].every((v,k)=>v>=colors[0][k]&&v<=colors[1][k]),'coherent correlated color interpolation, not random RGB channels');
   }
  }
  // Continuous dimensions have exactly one sample in each decile.
  for(const key of ['coverage','loopSeconds','opticalDepth']as const){
   const [low,high]=direction.ranges[key];
   assert(new Set(samples.map(p=>Math.floor((p[key]-low)/(high-low)*10))).size===10,`${key}: representative stratification`);
  }
 }
 assert(seeds.size===80,'independent weather seeds for all80 candidates');
 const silver=batch.find(s=>s.direction.id==='estella-iv')!;
 for(const p of silver.samples)assert(p.cloudColor[0]>=.68&&p.cloudColor[0]<=.9&&p.cloudColor[2]-p.cloudColor[0]<=.081&&p.cloudColor[2]>=p.cloudColor[1]&&p.cloudColor[1]>=p.cloudColor[0],'Dahai stays silvery neutral/cool, not randomly colored');
 for(const set of batch.filter(s=>['estella-v','estella-xia','estella-xiia'].includes(s.direction.id)))assert(set.samples.every(p=>p.coverage<=.4&&p.opticalDepth<=1.8),'thin atmospheres stay sparse');
 assert(WEATHER_DIRECTIONS.filter(d=>d.underdeck).map(d=>d.id).join()==='estella-ii','only opaque Acheron uses an atmospheric underdeck; solid terrain stays original');
 for(const invalid of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]){let threw=false;try{weatherSampleSets(invalid);}catch{threw=true;}assert(threw,'invalid timestamp rejected');}
}finally{Date.now=now;Math.random=random;}
console.log(`Atmosphere gallery passed: ${checks} assertions; eight worlds, no giants,80 stratified time-seeded candidates, silver Dahai, bounded immutable ranges.`);
