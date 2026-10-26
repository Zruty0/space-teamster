import '../src/content/estella';
import { createLandingLevel } from '../src/levels';
import { generateTerrain, getTerrainHeight, checkLandingCollision } from '../src/terrain';
import { surfaceSvgSolids } from '../src/surface-site';
import { surfaceShipCollision } from '../src/surface-ship-collision';
import { createShip } from '../src/ship';
import { DAWES_CUT_ID } from '../src/surface-poi';
let n=0;function assert(ok:unknown,message:string){n++;if(!ok)throw Error(message);}
const old=(globalThis as any).DOMParser;delete(globalThis as any).DOMParser;
const level=createLandingLevel(DAWES_CUT_ID,990028),terrain=generateTerrain(level);(globalThis as any).DOMParser=old;
const site=terrain.surfaceSite!;
assert(site.left===888&&site.right===1112&&site.deckY===30,'four-pad-width foreground footprint, original pad height');
assert(terrain.pad.left===972&&terrain.pad.right===1028,'original landing target width');
assert(surfaceSvgSolids().length===7&&site.solids.length===7,'two warehouses, vents, dome, footing and airlock from SVG paths');
for(let x=889;x<1112;x+=.5)assert(getTerrainHeight(terrain,x)===30,'flat engineered forecourt');
for(const [x,y,hit]of [[918.5,40,true],[918.5,50,false],[1084,55,true],[1084,56,false],[1000,31,false],[960,29,true],[913,50,true]]as const){
 const result=checkLandingCollision(level,terrain,x,y);assert(result.hit===hit,`authored solid at ${x},${y}`);if(hit)assert(!result.onPad,'buildings/courtyard are not landing targets');
}
assert(checkLandingCollision(level,terrain,1000,29).onPad,'central pad still landable');
const pose=(x:number,y:number)=>({...createShip(),x,y,angle:0,gearDeployed:false});
assert(!surfaceShipCollision(terrain,pose(1000,40)),'clear pad airspace');
assert(surfaceShipCollision(terrain,pose(945,40)),'hull edge contact with warehouse');
assert(!surfaceShipCollision(terrain,pose(950,42))&&!surfaceShipCollision(terrain,pose(876,42)),'sweep endpoints clear of site solids');
assert(surfaceShipCollision(terrain,pose(876,42),pose(950,42)),'fast translation cannot tunnel through buildings/cut face');
assert(surfaceShipCollision(terrain,pose(918.5,20),pose(918.5,80)),'vertical sweep intersects roof');
assert(!surfaceShipCollision(terrain,pose(1140,150),pose(850,150)),'fast clear overflight remains clear');
assert(surfaceShipCollision(terrain,{...pose(940,45),angle:Math.PI/2}), 'rotated rig collides');
const other=createLandingLevel('estella-v-capital-settlement',990029),natural=generateTerrain(other);
assert(!natural.surfaceSite&&!surfaceShipCollision(natural,pose(918.5,40)),'other sites keep existing collision');
const saved=JSON.stringify(terrain);for(let i=0;i<100;i++)surfaceShipCollision(terrain,pose(970+i,45));assert(JSON.stringify(terrain)===saved,'collision never mutates terrain/site');
console.log(`Foreground surface collision passed: ${n} assertions.`);
