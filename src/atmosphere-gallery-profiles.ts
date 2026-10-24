// Approved visual directions shared by the gallery and runtime artwork.
// These ranges do not alter atmospheric physics.
import { atmosphereProfile, type AtmosphereProfile } from './atmosphere-prototype-profile';
import { crateredWorldProfile } from './cratered-world-geometry';
export const WEATHER_SAMPLE_COUNT=10;
export const WEATHER_RANGE_VERSION='atmosphere-gallery-v2';
export const WEATHER_LEGACY_RANGE_VERSION='atmosphere-gallery-v1';
export const WEATHER_RANGE_VERSIONS=Object.freeze([WEATHER_LEGACY_RANGE_VERSION,WEATHER_RANGE_VERSION]);
export const DAHAI_CLOUD_AMOUNT_SCALE=.75;
type Color=readonly[number,number,number];
type NumericKey=Exclude<keyof AtmosphereProfile,'seed'|'cloudColor'|'hazeColor'>;
type Range=readonly[number,number];
export interface WeatherDirection{
  readonly id:string;readonly name:string;readonly description:string;
  readonly underdeck?:string;
  readonly cloudColors:readonly[Color,Color];readonly hazeColors:readonly[Color,Color];
  readonly ranges:Readonly<Record<NumericKey,Range>>;
}
const common:Record<NumericKey,Range>={
  coverage:[.3,.7],scale:[.7,1.4],fronts:[.3,1],detail:[.4,.9],shear:[.3,1],evolution:[.25,.8],cirrus:[.12,.4],opticalDepth:[2.5,4.5],
  vortexCount:[2,4],vortexSize:[.22,.38],vortexStrength:[.7,1.4],vortexEye:[.15,.7],vortexSpeed:[1,2],
  haze:[.15,.35],shadow:[.08,.2],cloudHeight:[.003,.009],zonalTurns:[1,2],tropicalTurns:[-2,-1],cirrusTurns:[2,3],loopSeconds:[300,500],
};
function direction(id:string,name:string,description:string,cloudColors:readonly[Color,Color],hazeColors:readonly[Color,Color],overrides:Partial<Record<NumericKey,Range>>,underdeck?:string):WeatherDirection{
  const ranges={...common,...overrides};Object.values(ranges).forEach(Object.freeze);
  const colors=(c:readonly[Color,Color])=>Object.freeze(c.map(v=>Object.freeze([...v])))as unknown as readonly[Color,Color];
  return Object.freeze({id,name,description,cloudColors:colors(cloudColors),hazeColors:colors(hazeColors),ranges:Object.freeze(ranges),underdeck});
}
export const WEATHER_DIRECTIONS:readonly WeatherDirection[]=Object.freeze([
  direction('estella-ii','Acheron','Dense ochre, brass and cream; broad fast-drifting opaque cloud decks.',[[.86,.67,.37],[1,.92,.70]],[[.72,.46,.18],[.94,.71,.36]],{
    coverage:[.72,.96],scale:[.55,1],fronts:[.15,.6],opticalDepth:[4.5,7],haze:[.4,.75],shadow:[.04,.1],cirrus:[.15,.4],vortexCount:[2,4],vortexSize:[.3,.48],vortexStrength:[.6,1.2],vortexSpeed:[1,1],zonalTurns:[2,4],loopSeconds:[400,700],
  },'#93692f'),
  direction('estella-iii','Gaia','Bright water clouds, blue limb, broken fronts and distinct rotating systems.',[[.92,.94,.98],[.99,.99,1]],[[.25,.48,.78],[.4,.65,.95]],{coverage:[.3,.68]}),
  direction('estella-iv','Dahai','Silvery marine clouds over the unchanged blue ocean and polar ice.',[[.68,.72,.76],[.9,.93,.96]],[[.45,.57,.65],[.66,.75,.8]],{
    coverage:[.58*DAHAI_CLOUD_AMOUNT_SCALE,.86*DAHAI_CLOUD_AMOUNT_SCALE],opticalDepth:[3.8,6],haze:[.22,.5],cirrus:[.3,.65],fronts:[.55,1.2],vortexCount:[3,5],vortexSize:[.25,.44],vortexStrength:[1,1.7],loopSeconds:[240,420],
  }),
  direction('estella-v','Hartwell','Thin copper and ochre dust veils; broad sparse movement, little high cloud.',[[.61,.34,.18],[.9,.62,.35]],[[.55,.29,.16],[.83,.49,.27]],{
    coverage:[.15,.4],scale:[.6,1.1],fronts:[0,.2],opticalDepth:[.5,1.8],cirrus:[0,.06],haze:[.08,.22],shadow:[.02,.08],vortexCount:[0,2],vortexSize:[.12,.25],vortexStrength:[.25,.65],vortexEye:[0,.2],vortexSpeed:[1,1],loopSeconds:[360,720],
  }),
  direction('estella-vi','Kuznia','Heavy steel-grey cloud banks, strong cold fronts and vigorous vortices.',[[.58,.67,.71],[.79,.86,.88]],[[.28,.41,.5],[.48,.62,.69]],{
    coverage:[.6,.9],opticalDepth:[3.5,6.5],fronts:[.55,1.4],haze:[.28,.55],vortexCount:[3,6],vortexSize:[.24,.44],vortexStrength:[1.1,1.7],shear:[.7,1.5],loopSeconds:[240,420],
  }),
  direction('estella-xia','Almaden','Faint sulfur-cream wisps above volcanic terrain; a thin veil, not an opaque deck.',[[.88,.76,.36],[1,.93,.65]],[[.8,.65,.2],[1,.85,.45]],{
    coverage:[.12,.34],fronts:[0,.15],opticalDepth:[.4,1.3],cirrus:[.02,.12],haze:[.08,.2],shadow:[.02,.07],vortexCount:[0,1],vortexSize:[.12,.2],vortexStrength:[.15,.45],vortexEye:[0,.1],vortexSpeed:[1,1],loopSeconds:[350,600],
  }),
  direction('estella-xib','Marisma','Muted amber and tan haze over the cold ground; slower, broad cloud masses.',[[.63,.46,.27],[.88,.72,.49]],[[.7,.42,.18],[.95,.66,.3]],{
    coverage:[.5,.8],scale:[.55,1],fronts:[.2,.6],opticalDepth:[2.5,5],haze:[.4,.75],cirrus:[.08,.25],vortexCount:[1,3],vortexStrength:[.6,1.2],vortexSpeed:[1,1],loopSeconds:[500,850],
  }),
  direction('estella-xiia','Mercy','Very thin pearl-violet high wisps; the approved icy surface stays prominent.',[[.74,.75,.88],[.94,.92,1]],[[.6,.65,.9],[.8,.82,1]],{
    coverage:[.1,.28],fronts:[0,.12],opticalDepth:[.35,1],cirrus:[.08,.2],haze:[.08,.2],shadow:[.02,.06],vortexCount:[0,1],vortexSize:[.12,.18],vortexStrength:[.1,.35],vortexEye:[0,0],vortexSpeed:[1,1],zonalTurns:[0,1],tropicalTurns:[-1,0],cirrusTurns:[1,3],loopSeconds:[600,1000],
  }),
]);
function stream(key:string){let seed=crateredWorldProfile(key).seed;return()=>{seed=seed*16807%2147483647;return seed/2147483647;};}
/** Latin-hypercube strata: random, but all ten span each specified range rather
 * than accidentally clustering. Independent parameter streams preserve IDs. */
function strata(key:string){
  const random=stream(key),order=Array.from({length:WEATHER_SAMPLE_COUNT},(_,i)=>i);
  for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  return order.map(i=>(i+random())/WEATHER_SAMPLE_COUNT);
}
const integerKeys=new Set<NumericKey>(['vortexCount','vortexSpeed','zonalTurns','tropicalTurns','cirrusTurns']);
export interface WeatherSet{readonly direction:WeatherDirection;readonly samples:readonly AtmosphereProfile[];}
/** Time is supplied ONCE by the page. No Date.now/Math.random inside generation. */
export function weatherSampleSets(batchSeed:number,version=WEATHER_RANGE_VERSION):readonly WeatherSet[]{
  if(!Number.isSafeInteger(batchSeed)||batchSeed<1)throw Error('Batch seed must be a positive safe integer');
  if(!WEATHER_RANGE_VERSIONS.includes(version))throw Error('Unsupported weather range version');
  return Object.freeze(WEATHER_DIRECTIONS.map(current=>{
    // Old review links reproduce the old amount. All other parameters/noise
    // streams remain identical; v2 reduces only Dahai's amount by one quarter.
    const direction=version===WEATHER_LEGACY_RANGE_VERSION&&current.id==='estella-iv'
      ?Object.freeze({...current,ranges:Object.freeze({...current.ranges,coverage:Object.freeze([.58,.86]as const)})}):current;
    const key=`${WEATHER_LEGACY_RANGE_VERSION}:${batchSeed}:${direction.id}`;
    const inputs=Array.from({length:WEATHER_SAMPLE_COUNT},(_,i):Partial<AtmosphereProfile>=>({seed:crateredWorldProfile(`${key}:sample:${i}`).seed}));
    for(const name of Object.keys(direction.ranges)as NumericKey[]){
      const [low,high]=direction.ranges[name];
      strata(`${key}:${name}`).forEach((t,i)=>{
        const value=integerKeys.has(name)?Math.min(high,low+Math.floor(t*(high-low+1))):low+(high-low)*t;
        Object.assign(inputs[i],{[name]:value});
      });
    }
    for(const [name,colors]of [['cloudColor',direction.cloudColors],['hazeColor',direction.hazeColors]]as const){
      strata(`${key}:${name}`).forEach((t,i)=>Object.assign(inputs[i],{[name]:colors[0].map((v,k)=>v+(colors[1][k]-v)*t)}));
    }
    return Object.freeze({direction,samples:Object.freeze(inputs.map(atmosphereProfile))});
  }));
}
