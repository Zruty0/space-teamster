import { ATMOSPHERE_ART_STORAGE_KEY, loadAtmosphereArtSeed, productionWeatherProfiles, weatherArtSeconds } from '../src/atmosphere-art-state';
import { weatherSampleSets } from '../src/atmosphere-gallery-profiles';
let checks=0;const assert=(ok:unknown,message:string)=>{checks++;if(!ok)throw Error(message);};
const data=new Map([['space-teamster.career.v1','untouched-career']]);let writes=0;
const storage={getItem(key:string){assert(key===ATMOSPHERE_ART_STORAGE_KEY,'only read dedicated cosmetic seed');return data.get(key)??null;},setItem(key:string,value:string){assert(key===ATMOSPHERE_ART_STORAGE_KEY,'only write dedicated cosmetic seed');writes++;data.set(key,value);}};
const seed=loadAtmosphereArtSeed(storage,1792879200123);
assert(seed===1792879200123&&writes===1,'first timestamp persisted once');
assert(loadAtmosphereArtSeed(storage,1792999999999)===seed&&writes===1,'reload retains weather rather than rerolling');
assert(data.get('space-teamster.career.v1')==='untouched-career','career bytes unchanged');
data.set(ATMOSPHERE_ART_STORAGE_KEY,'corrupt');assert(loadAtmosphereArtSeed(storage,123)===123,'bad cosmetic JSON repaired independently');
const denied={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
assert(loadAtmosphereArtSeed(denied,456)===456,'denied storage uses supplied session seed');
assert(loadAtmosphereArtSeed(undefined,NaN)===849372310,'invalid timestamp safe fallback');
const models=productionWeatherProfiles(seed),again=productionWeatherProfiles(seed),sets=weatherSampleSets(seed);
assert(JSON.stringify(models)===JSON.stringify(again)&&Object.isFrozen(models),'immutable deterministic runtime selection');
assert(models.length===8&&!models.some(m=>['estella-i','estella-x','estella-xi','estella-xii'].includes(m.id)),'no Balor or giants receive weather');
for(const model of models){
 assert(Object.isFrozen(model)&&Object.isFrozen(model.profile),'frozen selected profiles');
 assert(model.sample>=1&&model.sample<=10&&Number.isInteger(model.sample),'one of the ten approved candidate ranges');
 assert(JSON.stringify(model.profile)===JSON.stringify(sets.find(s=>s.direction.id===model.id)!.samples[model.sample-1]),'runtime uses gallery profile, not separate approximation');
}
for(const time of [0,60,600,123456,-120])assert(weatherArtSeconds(time)===time/60,'one shared simulation-time epoch, independent of visit/render history');
assert(weatherArtSeconds(Infinity)===0&&weatherArtSeconds(NaN)===0,'invalid visual time guarded');
console.log(`Atmosphere runtime state passed: ${checks} assertions; independent seed persistence, reproducible selected profiles and shared world clock.`);
