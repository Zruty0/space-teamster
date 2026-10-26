import './svg-dom';
import svg from '../art/surface/basic-outpost.svg?raw';
import { basicOutpost, parseSurfacePoiSvg, placeSurfacePoi, surfacePoiModuleSvg, surfaceBeaconOn, HARTWELL_OUTPOST_THEME, DAWES_CUT_ID, usesDawesSurfaceArt } from '../src/surface-poi';
import { createLandingLevel } from '../src/levels';
import { generateTerrain, getTerrainHeight, checkLandingCollision } from '../src/terrain';
import { landingSurfacePoints, landingBackdropCamera } from '../src/landing-scenery';
import { getApproachTerrainHeight } from '../src/approach';
import { HARTWELL_APPROACH_BIOME } from '../src/approach-biomes';
let checks=0;function assert(ok:unknown,message:string):asserts ok {checks++;if(!ok)throw Error(message);}
const asset=basicOutpost(),level=createLandingLevel(DAWES_CUT_ID,90001),terrain=generateTerrain(level),before=JSON.stringify([level,terrain,asset]);
assert(asset===basicOutpost()&&Object.isFrozen(asset)&&Object.isFrozen(asset.modules),'immutable parsed asset cached');
assert(asset.modules.length===4&&asset.beacons.length===2,'two warehouses/dome/pad and paired beacon anchors');
assert(JSON.stringify(terrain.pad)===JSON.stringify({left:972,right:1028,y:30,centerX:1000}),'original Dawes pad geometry');
assert(level.roughness===.6&&JSON.stringify(level.features)===JSON.stringify([{xStart:820,xEnd:860,height:26},{xStart:1140,xEnd:1190,height:32}]),'original terrain profile and obstacles');
assert(usesDawesSurfaceArt(level),'Dawes opt-in');
for(const id of ['estella-v-capital-settlement','estella-v-atmo-refinery','estella-v-storm-research','estella-v-abandoned-colony'])assert(!usesDawesSurfaceArt({...level,poi:{id}}),'no other Hartwell rollout');
assert(!usesDawesSurfaceArt({...level,body:{id:'estella-iii'}})&&!usesDawesSurfaceArt({...level,landingLayout:{kind:'cloud-city'}}),'foreign/cloud platform refused');
assert(HARTWELL_OUTPOST_THEME.dust===HARTWELL_APPROACH_BIOME.palette.ground,'dust inherits biome ground tone');
for(const width of [28,56,140])for(const center of [-500,0,1000])for(const altitude of [0,30,4000]){
 const pad={left:center-width/2,right:center+width/2,y:altitude,centerX:center};
 const p=placeSurfacePoi(asset,pad,x=>altitude+2*Math.sin(x/20));
 assert(p.width===4*width,'whole outpost exactly four pad widths');
 assert(p.x+asset.pad.left*p.scale===pad.left&&p.x+asset.pad.right*p.scale===pad.right,'SVG pad never widens/offsets landing zone');
 const deck=p.modules.find(m=>m.module.layer==='pad')!;
 assert(deck.y-asset.pad.y*p.scale===pad.y,'deck aligned to real collision altitude');
 for(const m of p.modules.filter(m=>m.module.layer==='backdrop'))assert(m.y>=altitude-2,'portable module footing uses supplied environment');
}
// Exact physical mesh remains the visible silhouette, including off-mesh clamping.
for(const [a,b]of [[-500,500],[883.5,1010.2],[990,1200],[1700,2300]]){
 const points=landingSurfacePoints(terrain,a,b);
 assert(points[0][0]===a&&points[points.length-1][0]===b,'complete visible terrain span');
 for(const [x,y]of points)assert(y===getTerrainHeight(terrain,x),'every painted contour vertex is physical terrain');
 for(const p of terrain.points.filter(([x])=>x>a&&x<b))assert(points.some(([x,y])=>x===p[0]&&y===p[1]),'no native collision vertex skipped');
}
for(let x=0;x<=2000;x+=2){
 let y=60+27*Math.sin(x*.0025+.5)+18*Math.sin(x*.007+1.2)+10.8*Math.sin(x*.018+3.1)+6*Math.sin(x*.045+.7)+3*Math.sin(x*.11+2.3);
 const blend=Math.min(1,Math.max(0,Math.abs(x-1000)-28)/40);y=30+(y-30)*blend*blend;
 for(const f of [{xStart:820,xEnd:860,height:26},{xStart:1140,xEnd:1190,height:32}])if(x>=f.xStart&&x<=f.xEnd)y=Math.max(y,30+f.height);
 if(x>150&&x<450)y=Math.max(y,30+Math.max(0,36-Math.abs(x-300)*.4));y=Math.max(0,y);
 assert(Math.abs(getTerrainHeight(terrain,x)-y)<1e-10,'pre-art terrain formula unchanged');
 assert(checkLandingCollision(level,terrain,x,y-1).hit&&!checkLandingCollision(level,terrain,x,y+1).hit,'collision boundary unchanged');
}
for(const zoom of [.065,1,2.6,4.5]){
 const cam={x:1100,y:130,zoom},bg=landingBackdropCamera(cam,terrain);
 assert(bg.zoom<=.065&&bg.x===100,'background target anchor shared with approach');
 assert(Math.abs((cam.y-terrain.pad.y)*cam.zoom-(bg.y-getApproachTerrainHeight(0))*bg.zoom)<1e-9,'same projected surface datum across phases');
}
for(const t of [.05,.12,.35,2.85])assert(surfaceBeaconOn(t),'double-pulse beacon on');
for(const t of [.2,.7,1.1])assert(!surfaceBeaconOn(t),'beacon off interval');
for(let i=0;i<100;i++){const t=.013+i*.017;assert(surfaceBeaconOn(t)===surfaceBeaconOn(t+14),'beacon clock replay/no RNG');}
for(const m of asset.modules){
 const warm=surfacePoiModuleSvg(svg,asset,m,HARTWELL_OUTPOST_THEME),cold=surfacePoiModuleSvg(svg,asset,m,{dust:'#8899aa',wall:'#304452'});
 assert(warm!==cold&&warm.includes(`#${m.id}{display:inline}`),'environment palette independent of geometry');
 assert(warm.includes(`viewBox="${m.bounds.x} ${m.bounds.y} ${m.bounds.width} ${m.bounds.height}"`),'per-module raster crop anchored in authored SVG');
 assert(JSON.stringify(parseSurfacePoiSvg(svg))===JSON.stringify(asset),'independent SVG parse replay');
}
for(const bad of [svg.replace('"version":1','"version":2'),svg.replace('"width":896','"width":0'),svg.replace('id="residential-dome"','id="missing"'),svg.replace('</svg>','<script>bad()</script></svg>')]){
 let threw=false;try{parseSurfacePoiSvg(bad);}catch{threw=true;}assert(threw,'invalid authoring metadata rejected');
}
let rejected=false;try{surfacePoiModuleSvg(svg,asset,asset.modules[0],{dust:'url(external)'});}catch{rejected=true;}assert(rejected,'theme accepts color values only');
assert(JSON.stringify([level,terrain,asset])===before,'no level, terrain, asset or IDs mutated');
console.log(`Surface POI test bed passed: ${checks} assertions.`);
