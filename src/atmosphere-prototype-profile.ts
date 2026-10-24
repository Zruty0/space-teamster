// Visual-only Gaia pilot. Not imported by production orbital/flight code.
// Pure seed + periodic phase inputs also permit a future offline frame baker.
import { crateredWorldProfile } from './cratered-world-geometry';
export interface AtmosphereProfile {
  readonly seed:number;
  readonly coverage:number;
  readonly scale:number;
  readonly fronts:number;
  readonly detail:number;
  readonly shear:number;
  readonly evolution:number;
  readonly cirrus:number;
  readonly opticalDepth:number;
  readonly haze:number;
  readonly shadow:number;
  readonly cloudHeight:number;
  readonly zonalTurns:number;
  readonly tropicalTurns:number;
  readonly cirrusTurns:number;
  readonly loopSeconds:number;
  readonly cloudColor:readonly [number,number,number];
  readonly hazeColor:readonly [number,number,number];
}
export const GAIA_ATMOSPHERE_SEED=crateredWorldProfile('dynamic-cloud-prototype-v1:estella-iii').seed;
const DEFAULTS:AtmosphereProfile={seed:GAIA_ATMOSPHERE_SEED,coverage:.48,scale:1,fronts:.75,detail:.65,shear:.65,evolution:.5,cirrus:.28,opticalDepth:3.6,haze:.22,shadow:.15,cloudHeight:.004,zonalTurns:1,tropicalTurns:-1,cirrusTurns:2,loopSeconds:360,cloudColor:[.94,.965,1],hazeColor:[.30,.59,.93]};
const clamp=(v:unknown,base:number,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):base;
export function atmosphereProfile(input:Partial<AtmosphereProfile>={}):Readonly<AtmosphereProfile>{
  const p:{-readonly [K in keyof AtmosphereProfile]:AtmosphereProfile[K]}={...DEFAULTS};
  const bounds:Record<Exclude<keyof AtmosphereProfile,'seed'|'cloudColor'|'hazeColor'>,readonly [number,number]>={coverage:[0,1],scale:[.4,2.5],fronts:[0,1.5],detail:[0,1],shear:[0,1.5],evolution:[0,1.5],cirrus:[0,1],opticalDepth:[.2,8],haze:[0,1],shadow:[0,.5],cloudHeight:[0,.025],loopSeconds:[30,3600],zonalTurns:[-4,4],tropicalTurns:[-4,4],cirrusTurns:[-4,4]};
  for(const key of Object.keys(bounds) as (keyof typeof bounds)[]){
    p[key]=clamp(input[key],DEFAULTS[key],...bounds[key]);
  }
  p.seed=Math.trunc(clamp(input.seed,DEFAULTS.seed,1,2147483646));
  for(const key of ['zonalTurns','tropicalTurns','cirrusTurns']as const)p[key]=Math.round(p[key]);
  for(const key of ['cloudColor','hazeColor']as const){
    p[key]=Object.freeze(DEFAULTS[key].map((base,i)=>clamp(input[key]?.[i],base,0,1)))as unknown as readonly[number,number,number];
  }
  return Object.freeze(p);
}
export const GAIA_ATMOSPHERE_PROFILE=atmosphereProfile();
/** Absolute phase, not a mutable fluid state: replay, scrubbing and baking agree. */
export function atmospherePhase(seconds:number,period:number):number{
  if(!Number.isFinite(seconds)||!Number.isFinite(period)||period<=0)return 0;
  return ((seconds%period)+period)%period/period;
}
/** Small periodic 3-D noise volume. Generated once per seed, not per frame. */
export function atmosphereNoise(seed:number,size=64):Uint8Array{
  if(!Number.isInteger(size)||size<4||size>64)throw Error('Noise volume size must be 4–64');
  let state=atmosphereProfile({seed}).seed;
  const data=new Uint8Array(size**3);
  for(let i=0;i<data.length;i++){state=state*16807%2147483647;data[i]=Math.floor(state/2147483647*256);}
  return data;
}
