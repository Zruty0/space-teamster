import { weatherSampleSets, WEATHER_RANGE_VERSION } from './atmosphere-gallery-profiles';
import { crateredWorldProfile } from './cratered-world-geometry';
export const ATMOSPHERE_ART_STORAGE_KEY='space-teamster.atmosphere-art.v1';
// Visual clock only: one illustration second per simulated minute. No flight
// weather/rotation parameters are changed. Waits, transfers and retries agree.
export const WEATHER_GAME_SECONDS_PER_ART_SECOND=60;
export function weatherArtSeconds(worldTime:number):number{return Number.isFinite(worldTime)?worldTime/WEATHER_GAME_SECONDS_PER_ART_SECOND:0;}
export interface ArtSeedStorage{getItem(key:string):string|null;setItem(key:string,value:string):void;}
/** Separate cosmetic state, never a career-save migration. Storage denial still
 * yields one stable session seed supplied by the caller. */
export function loadAtmosphereArtSeed(storage:ArtSeedStorage|undefined,timestamp:number):number{
  try{const raw=storage?.getItem(ATMOSPHERE_ART_STORAGE_KEY);if(raw){const data=JSON.parse(raw);if(data?.version===1&&Number.isSafeInteger(data.seed)&&data.seed>0)return data.seed;}}catch{/* denied/corrupt visual storage */}
  const seed=Number.isSafeInteger(timestamp)&&timestamp>0?timestamp:849372310;
  try{storage?.setItem(ATMOSPHERE_ART_STORAGE_KEY,JSON.stringify({version:1,seed}));}catch{/* keep stable session seed */}
  return seed;
}
export function productionWeatherProfiles(seed:number){
  return Object.freeze(weatherSampleSets(seed).map(set=>{
    const index=crateredWorldProfile(`production-weather-choice-v1:${seed}:${set.direction.id}`).seed%set.samples.length;
    return Object.freeze({id:set.direction.id,sample:index+1,profile:set.samples[index],underdeck:set.direction.underdeck,rangeVersion:WEATHER_RANGE_VERSION});
  }));
}
