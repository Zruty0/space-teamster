// Regional climate is authored by world/POI, never by generated phase IDs.
// Weather is a pure function of permanent identity and absolute mission seconds.
import type { BodyDef, SurfacePoiDef } from './world';
import { canonicalEstellaLocationId } from './content/estella/location-aliases';
import { weatherSeed, weatherRandom, type LandingAir } from './landing-air';
export interface SurfaceClimate {
 label:string; base:number; gust:number; gustRate:number; period:number;
 exposure:number; windLimit:number; cloudCover:number; cloudBase:number; cloudDepth:number;
}
const temperate:SurfaceClimate={label:'Temperate',base:8,gust:4,gustRate:.13,period:21600,exposure:.4,windLimit:.65,cloudCover:.48,cloudBase:1400,cloudDepth:1800};
export const WORLD_CLIMATES:Readonly<Record<string,Readonly<SurfaceClimate>>>=Object.freeze({
 'estella-ii':{...temperate,label:'Cloud currents',base:20,gust:9,exposure:.8,windLimit:1.3,cloudCover:.94,cloudBase:700,cloudDepth:1500},
 'estella-iii':temperate,
 'estella-iv':{...temperate,label:'Marine breeze',base:12,gust:6,exposure:.75,windLimit:.9,cloudCover:.66,cloudBase:650,cloudDepth:1300},
 'estella-v':{...temperate,label:'Thin-air gusts',base:12,gust:6,exposure:.45,windLimit:.55,cloudCover:.3,cloudBase:1800,cloudDepth:2200},
 'estella-vi':{...temperate,label:'Cold squalls',base:24,gust:13,gustRate:.23,period:12600,exposure:.65,windLimit:1.6,cloudCover:.88,cloudBase:450,cloudDepth:1400},
 'estella-xia':{...temperate,label:'Sulfur drift',base:9,gust:5,windLimit:.45,cloudCover:.28,cloudBase:900,cloudDepth:1400},
 'estella-xib':{...temperate,label:'Methane squalls',base:16,gust:9,gustRate:.10,period:28800,exposure:.6,windLimit:1.2,cloudCover:.82,cloudBase:500,cloudDepth:1200},
 'estella-xiia':{...temperate,label:'Cold nitrogen breeze',base:6,gust:3,gustRate:.08,period:32400,windLimit:.25,cloudCover:.2,cloudBase:1100,cloudDepth:1600},
});
const SITES:Readonly<Record<string,Partial<SurfaceClimate>>>=Object.freeze({
 'estella-iii-agricultural-region':{label:'Sheltered temperate air',base:6,gust:3,exposure:.3,windLimit:.5,cloudCover:.42},
 'estella-iii-coastal-resort':{label:'Coastal crosswinds',base:12,gust:6,exposure:.6,windLimit:.8,cloudCover:.58},
 'estella-iii-polar-science':{label:'Polar-front gusts',base:15,gust:9,gustRate:.2,windLimit:1,cloudCover:.66,cloudBase:600},
 'estella-iv-primary-city':{label:'Calm-belt marine air',base:7,gust:3,exposure:.45,windLimit:.55,cloudCover:.5,cloudBase:900},
 'estella-iv-climate-poi-2':{label:'Open-ocean breeze',base:14,gust:7,exposure:.8},
 'estella-iv-climate-poi-3':{label:'Polar marine gusts',base:15,gust:8,exposure:.8,windLimit:.95},
 // Gust-dominated, not a saturated one-way shove: ~7/19 s components cross
 // through lulls/reversals. Near-hover peaks fit ordinary lateral thrust + SAS;
 // the ceiling is only .025 m/s² above that stock 3.675 m/s² control budget.
 'estella-vi-spaceport':{label:'Turbulent crosswinds',base:10,gust:55,gustRate:.9,period:9000,exposure:.9,windLimit:3.7,cloudCover:1,cloudBase:220,cloudDepth:1000},
 'estella-iv-climate-poi-1':{label:'Storm-belt squalls',base:36,gust:19,gustRate:.28,period:14400,exposure:.9,windLimit:2.25,cloudCover:.94,cloudBase:320,cloudDepth:1100},
 'estella-v-storm-research':{label:'Exposed dust-front gusts',base:25,gust:14,gustRate:.26,windLimit:1.1,exposure:.8,cloudCover:.52},
 'estella-v-capital-settlement':{label:'Sheltered thin air',base:7,gust:3,exposure:.3,windLimit:.35,cloudCover:.22},
 'estella-vi-polar-weather-research':{label:'Polar squalls',base:30,gust:17,gustRate:.3,windLimit:1.9,cloudBase:300},
 'estella-ii-nimbus-crucible':{label:'Acid-cloud currents',base:27,gust:13,windLimit:1.7,cloudCover:1},
});
export function surfaceClimate(body:BodyDef,poiId:string):Readonly<SurfaceClimate>{
 poiId=canonicalEstellaLocationId(poiId);
 const base=WORLD_CLIMATES[body.id]??temperate,variation=.85+.3*weatherRandom(weatherSeed(poiId),41);
 return Object.freeze({...base,base:base.base*variation,gust:base.gust*variation,period:base.period*(.85+.3*weatherRandom(weatherSeed(poiId),42)),...SITES[poiId]});
}
export function createRegionalWeather(body:BodyDef,poi:Pick<SurfacePoiDef,'id'|'altitude'|'landingLayout'>){
 const id=canonicalEstellaLocationId(poi.id);
 const climate=surfaceClimate(body,id),seed=weatherSeed(`surface-weather-v1:${id}`),sign=weatherRandom(seed,2)<.5?-1:1;
 const frequencies=[2*Math.PI/climate.period,2*Math.PI/(climate.period*1.73),climate.gustRate,climate.gustRate*.37];
 const amplitudes=[climate.base*.42,climate.base*.28,climate.gust*.65,climate.gust*.35];
 const phases=frequencies.map((_,i)=>weatherRandom(seed,10+i)*Math.PI*2);
 function wind(seconds:number){
  if(!body.atmosphere)return 0;
  let v=climate.base;for(let i=0;i<4;i++)v+=amplitudes[i]*Math.sin(frequencies[i]*seconds+phases[i]);return sign*v;
 }
 function advection(seconds:number){
  if(!body.atmosphere)return 0;
  let x=climate.base*seconds;for(let i=0;i<4;i++)x-=amplitudes[i]/frequencies[i]*Math.cos(frequencies[i]*seconds+phases[i]);return sign*x;
 }
 function cover(seconds:number){return Math.min(1,climate.cloudCover*(.8+.2*Math.sin(frequencies[0]*seconds+phases[0])));}
 function air(epoch:number,ground:(x:number)=>number):LandingAir{
  return {label:climate.label,sample(x,y,time){
   const a=body.atmosphere;if(!a||y>=a.height)return{vx:0,density:0,windLimit:climate.windLimit};
   // A floating deck is not a mountain: no ground shelter or sea-level density reset.
   const agl=Math.max(0,y-ground(x)),shelter=poi.landingLayout?.kind==='cloud-city'?1:climate.exposure+(1-climate.exposure)*(1-Math.exp(-agl/40));
   const topFade=Math.min(1,Math.max(0,(a.height-y)/(a.scaleHeight*.5)));
   return{vx:wind(epoch+time)*shelter*topFade,density:a.surfaceDensity*Math.exp(-Math.max(0,y)/a.scaleHeight)*topFade,windLimit:climate.windLimit};
  }};
 }
 return{id,climate,wind,advection,cover,air,altitude:poi.altitude,body,layout:poi.landingLayout};
}
export type RegionalWeather=ReturnType<typeof createRegionalWeather>;
