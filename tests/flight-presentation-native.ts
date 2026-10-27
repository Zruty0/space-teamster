// Save-free actual renderer coverage across every authored landing site and
// every surface world's approach/departure. No career construction or settlement.
import { SURFACE_POIS, BODIES } from '../src/world';
import { createLandingLevel } from '../src/levels';
import { generateTerrain, getTerrainHeight } from '../src/terrain';
import { createShip } from '../src/ship';
import { render } from '../src/renderer';
import { createLandingScenery } from '../src/landing-scenery';
import { DAWES_CUT_ID } from '../src/surface-poi';
import { flightSurfaceStyle } from '../src/flight-surface-style';
import { APPROACH_LEVELS, createApproachState, getApproachTerrainHeight, renderApproach } from '../src/approach';
import { createPlayableEstellaMission } from '../src/estella-playable';
export async function checkFlightPresentation(assert:(ok:unknown,message:string)=>void){
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=400;
 const ctx=canvas.getContext('2d')!,scenery=createLandingScenery(),catalog=JSON.stringify([BODIES,SURFACE_POIS]);
 const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const plain=(hex:string)=>{const data=ctx.getImageData(100,390,440,5).data,expected=[...rgb(hex),255];return data.every((v,i)=>v===expected[i%4]);};
 let outposts=0;const worlds=new Map<string,string>();
 for(const [i,poi]of SURFACE_POIS.entries()){
  const level=createLandingLevel(poi.id,991000+i),terrain=generateTerrain(level),before=JSON.stringify([level,terrain]);
  worlds.set(poi.bodyId,worlds.get(poi.bodyId)??poi.id);
  if(terrain.surfaceSite)outposts++;
  assert(!!terrain.surfaceSite===(poi.id===DAWES_CUT_ID),`${poi.id}: no outpost replication`);
  await scenery.prepare(level);
  const x=terrain.pad.centerX+200,cam={x,y:getTerrainHeight(terrain,x)-60,zoom:1};
  const ship={...createShip(),x:x+3000,y:cam.y+1000,vx:0,vy:0};
  render(ctx,canvas,cam,ship,terrain,level,0,true,scenery);
  assert(plain(flightSurfaceStyle(level.body).ground),`${poi.id}: plain planet-tinted landing subsurface`);
  assert(JSON.stringify([level,terrain])===before,`${poi.id}: rendering leaves physics intact`);
 }
 assert(outposts===1,'Dawes remains the only authored outpost');
 for(const [bodyId,poiId]of worlds){
  for(const departure of [false,true]){
   const old=new Set(APPROACH_LEVELS.map(l=>l.id));
   createPlayableEstellaMission(departure?poiId:'estella-iii-main-customs',departure?'estella-iii-main-customs':poiId,undefined,12345);
   const level=APPROACH_LEVELS.find(l=>!old.has(l.id)&&l.poi.id===poiId&&!!l.departure===departure);
   assert(level,`${bodyId}: actual generated ${departure?'departure':'approach'} level`);if(!level)continue;
   const before=JSON.stringify(level),state=createApproachState(level);state.x=100000;state.y=1000000;
   const cam={x:0,y:getApproachTerrainHeight(0,level)-5000,zoom:.04};
   renderApproach(ctx,canvas,cam,state,level,0);
   assert(plain(flightSurfaceStyle(level.body).ground),`${bodyId}: plain planet-tinted approach/departure subsurface`);
   const buriedWind={...level,windLayers:[{altitudeCenter:cam.y-4800,altitudeWidth:100,strength:12}]};
   renderApproach(ctx,canvas,cam,state,buriedWind,0);
   assert(plain(flightSurfaceStyle(level.body).ground),`${bodyId}: wind indicators cannot stripe solid ground`);
   assert(JSON.stringify(level)===before,`${bodyId}: approach rendering leaves physics intact`);
  }
 }
 assert(JSON.stringify([BODIES,SURFACE_POIS])===catalog,'cross-world styling leaves catalog intact');
 canvas.width=canvas.height=1;
 return{sites:SURFACE_POIS.length,worlds:worlds.size};
}
