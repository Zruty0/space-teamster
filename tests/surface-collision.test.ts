import '../src/content/estella';
import { createLandingLevel } from '../src/levels';
import { generateTerrain, getTerrainHeight, checkLandingCollision } from '../src/terrain';
import { surfaceSvgSolids } from '../src/surface-site';
import { surfaceShipCollision } from '../src/surface-ship-collision';
import { createShip, SHIP_OUTLINE, CAB_OUTLINE, LANDING_GEAR_REST_HEIGHT } from '../src/ship';
import { DAWES_CUT_ID } from '../src/surface-poi';
import { gradeSurfaceFootprint } from '../src/surface-grading';
let n=0;function assert(ok:unknown,message:string){n++;if(!ok)throw Error(message);}
const old=(globalThis as any).DOMParser;delete(globalThis as any).DOMParser;
const level=createLandingLevel(DAWES_CUT_ID,990028),terrain=generateTerrain(level);(globalThis as any).DOMParser=old;
const site=terrain.surfaceSite!,at=(oldY:number)=>site.deckY+oldY-30;
assert(site.left===812&&site.right===1112&&site.deckY===(site.nativeLeftHeight+site.nativeRightHeight)/2,'same footprint at average native edge height');
assert(terrain.pad.left===982.5&&terrain.pad.right===1017.5,'landing target narrowed by 1.6x');
assert(surfaceSvgSolids().length===9&&site.solids.length===9,'buildings and both beacon towers from SVG paths');
for(let x=813;x<1112;x+=.5)assert(getTerrainHeight(terrain,x)===site.deckY,'flat engineered forecourt');
for(const [x,y,hit]of [[853.5,40,true],[853.5,50,false],[914.5,68,true],[914.5,69,false],[1000,31,false],[960,29,true],[848,50,true]]as const){
 const result=checkLandingCollision(level,terrain,x,at(y));assert(result.hit===hit,`authored solid at ${x},${y}`);if(hit)assert(!result.onPad,'buildings/courtyard are not landing targets');
}
assert(checkLandingCollision(level,terrain,1000,at(29)).onPad,'central pad still landable');
const pose=(x:number,y:number)=>({...createShip(),x,y:at(y),angle:0,gearDeployed:false});
assert(!surfaceShipCollision(terrain,pose(1000,40)),'clear pad airspace');
const rigPoints=[...SHIP_OUTLINE,...CAB_OUTLINE],rigHeight=LANDING_GEAR_REST_HEIGHT+Math.max(...rigPoints.map(p=>p[1])),rigWidth=Math.max(...rigPoints.map(p=>p[0]))-Math.min(...rigPoints.map(p=>p[0]));
assert(Math.abs((terrain.pad.right-terrain.pad.left)/rigWidth-2)<.1,'35 m pad is approximately twice the 17 m rig width');
for(const [id,x]of [['beacon-left',981.5],['beacon-right',1018.5]]as const){
 const tower=site.solids.find(s=>s.id===id)!;
 assert(Math.abs(tower.top-site.deckY-rigHeight*1.5)<1e-10,'tower is 1.5 times parked rig height');
 assert(tower.bottom===site.deckY&&tower.left===x-1&&tower.right===x+1,'tower placement and width match visible SVG');
 for(const y of [.5,5,10,11.7])assert(checkLandingCollision(level,terrain,x,site.deckY+y).hit,'tower shaft and cap are solid');
 assert(!checkLandingCollision(level,terrain,x,tower.top+.1).hit,'air above tower cap is clear');
 assert(surfaceShipCollision(terrain,pose(x,35)),'whole rig hits tower');
 const a=pose(x-14,37),b=pose(x+14,37);
 // Use an isolated tower to test tunnelling without the opposite beacon masking the endpoints.
 const isolated={...terrain,surfaceSite:{...site,solids:[tower]}};
 assert(!surfaceShipCollision(isolated,a)&&!surfaceShipCollision(isolated,b),'tower sweep endpoints clear');
 assert(surfaceShipCollision(isolated,b,a),'fast translation cannot tunnel through narrow tower');
 const gearPose=pose(x-2.35,30+rigHeight*1.5+3);
 assert(!surfaceShipCollision(isolated,gearPose)&&surfaceShipCollision(isolated,{...gearPose,gearDeployed:true}),'only deployed gear catches tower cap');
}
for(const facingSign of [-1,1]as const)assert(!surfaceShipCollision(terrain,{...pose(1000,30+LANDING_GEAR_REST_HEIGHT),facingSign,gearDeployed:true}),'centered parked rig clears both towers in either direction');
assert(!checkLandingCollision(level,terrain,980,site.deckY-.1).onPad&&!checkLandingCollision(level,terrain,1020,site.deckY-.1).onPad,'former outer pad strips no longer valid touchdown targets');
assert(!surfaceShipCollision(terrain,pose(1084,40))&&!checkLandingCollision(level,terrain,1084,at(40)).hit,'old right-side dome position has no ghost collider');
assert(surfaceShipCollision(terrain,pose(880,40)),'hull edge contact with buildings');
assert(!surfaceShipCollision(terrain,pose(970,60))&&!surfaceShipCollision(terrain,pose(790,60)),'sweep endpoints clear of site solids');
assert(surfaceShipCollision(terrain,pose(790,60),pose(970,60)),'fast translation cannot tunnel through buildings/graded shoulders');
assert(surfaceShipCollision(terrain,pose(853.5,20),pose(853.5,80)),'vertical sweep intersects roof');
assert(!surfaceShipCollision(terrain,pose(1140,150),pose(850,150)),'fast clear overflight remains clear');
assert(surfaceShipCollision(terrain,{...pose(875,45),angle:Math.PI/2}), 'rotated rig collides');
const other=createLandingLevel('estella-v-capital-settlement',990029),natural=generateTerrain(other);
assert(!natural.surfaceSite&&!surfaceShipCollision(natural,pose(918.5,40)),'other sites keep existing collision');
// Isolate a curved shoulder from buildings: endpoints clear, swept hull crosses its crest.
const graded=gradeSurfaceFootprint(0,100,x=>50+20*Math.sin(Math.PI*(x+50)/50),{blendWidth:50});
const slopeTerrain={...terrain,surfaceSite:{...graded,solids:[]}};
const a={...createShip(),x:-70,y:58,angle:0,gearDeployed:false},b={...a,x:20};
assert(!surfaceShipCollision(slopeTerrain,a)&&!surfaceShipCollision(slopeTerrain,b),'graded-shoulder sweep endpoints clear');
assert(surfaceShipCollision(slopeTerrain,b,a),'fast swept hull cannot pass through a visible slope crest');
assert(surfaceShipCollision(slopeTerrain,{...a,x:-25,y:60}),'static hull touches the same sampled slope');
const saved=JSON.stringify(terrain);for(let i=0;i<100;i++)surfaceShipCollision(terrain,pose(970+i,45));assert(JSON.stringify(terrain)===saved,'collision never mutates terrain/site');
console.log(`Foreground surface collision passed: ${n} assertions.`);
