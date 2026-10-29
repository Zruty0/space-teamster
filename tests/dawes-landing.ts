import { Game } from '../src/game';
import { checkFlightPresentation } from './flight-presentation-native';
import { defaultCareerProfile } from '../src/career-state';
import { config } from '../src/config';
import { createMaintenanceTelemetry } from '../src/maintenance/telemetry';
import { createFlightAtmosphere } from '../src/flight-atmosphere';
import { createLandingLevel } from '../src/levels';
import { generateTerrain, getTerrainHeight, landingReferenceHeight } from '../src/terrain';
import { createShip, updateShip } from '../src/ship';
import { createCamera, updateCamera, render } from '../src/renderer';
import { readInput, type InputState } from '../src/input';
import { DAWES_CUT_ID, HARTWELL_OUTPOST_THEME, basicOutpost, placeSurfacePoi, createSurfacePoiArtwork } from '../src/surface-poi';
import { createLandingScenery, landingBackdropCamera } from '../src/landing-scenery';
import { hartwellApproachRegion } from '../src/approach-biomes';
import { createHartwellOutlineScenery } from '../src/approach-outline-scenery';
import { APPROACH_LEVELS, createApproachState, applyApproachWeather } from '../src/approach';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { BODIES, SURFACE_POIS } from '../src/world';
const canvas=document.getElementById('flight')as HTMLCanvasElement,ctx=canvas.getContext('2d',{willReadFrequently:false})!;
const view=document.getElementById('view')as HTMLSelectElement,original=document.getElementById('original')as HTMLInputElement,play=document.getElementById('play')!;
const status=document.getElementById('status')!,level=createLandingLevel(DAWES_CUT_ID,990026),terrain=generateTerrain(level);
const beforeLevels=new Set(APPROACH_LEVELS.map(l=>l.id));createPlayableEstellaMission('estella-iii-main-customs',DAWES_CUT_ID,undefined,12345);
const approachLevel=APPROACH_LEVELS.find(l=>!beforeLevels.has(l.id)&&l.poi.id===DAWES_CUT_ID&&!l.departure)!;
applyApproachWeather(approachLevel,12345);
const approach={kind:'approach',level:approachLevel,as:createApproachState(approachLevel,{x:-1800,y:1400,vx:100,vy:-5,angle:1.5}),cam:{x:0,y:2300,zoom:.065},state:'approaching',worldTimeStart:12345,missionDvStart:0};
const game:any=Object.create(Game.prototype); // No constructor, career IO, access changes or settlements.
Object.assign(game,{canvas,ctx,career:defaultCareerProfile(),activeManifestCondition:{},missionDvUsed:0,activeMissionQuote:null,time:0});
const pilotMode=new URLSearchParams(location.search).has('atmosphere');
if(pilotMode){
 game.atmosphericPilot={visuals:true,wind:true,low:false,effects:createFlightAtmosphere()};
 const panel=document.createElement('p');panel.innerHTML='<strong>Atmosphere pilot — not enabled in careers.</strong> <label><input id="effects" type="checkbox" checked> Clouds / smoke / wind wisps</label> <label><input id="wind" type="checkbox" checked> Physical landing wind</label> <label><input id="low" type="checkbox"> Low effects</label> · T: SAS holds zero ground velocity (starts ON). Approach view previews moving clouds; Fly animates weather without advancing approach physics.';
 canvas.before(panel);
 for(const [id,key]of [['effects','visuals'],['wind','wind'],['low','low']])document.getElementById(id)!.onchange=e=>{game.atmosphericPilot[key]=(e.target as HTMLInputElement).checked;draw();};
}
let current:any,scenery:ReturnType<typeof createLandingScenery>,elapsed=0,paused=true,checking=false,last=performance.now(),accumulator=0;
const neutral=readInput(),catalog=JSON.stringify([BODIES,SURFACE_POIS]),baseline=JSON.stringify([level,terrain]);
function reset(mode=view.value){
 view.value=mode;paused=true;elapsed=accumulator=0;play.textContent='Fly';
 game.atmosphericPilot?.effects.reset();if(game.atmosphericPilot)game.atmosphericPilot.input=undefined;
 Object.assign(config,{gravity:level.gravity,landingMaxVSpeed:level.landingMaxVSpeed,landingMaxHSpeed:level.landingMaxHSpeed,landingMaxAngle:level.landingMaxAngle,startX:level.startX,startY:level.startY+(terrain.pad.y-level.padY),startVX:level.startVX,startVY:level.startVY});
 const ship=createShip(),camera=createCamera();ship.sas=!!game.atmosphericPilot;
 if(mode!=='entry'){ship.x=level.padCenterX;ship.y=terrain.pad.y+85;ship.vx=ship.vy=0;ship.gearDeployed=true;ship.throttle=level.gravity/config.mainEngineAccel;}
 updateCamera(camera,ship,landingReferenceHeight(level,terrain,ship.x),0);
 if(mode==='takeoff'){ship.x=level.padCenterX;ship.y=terrain.pad.y+4.05;ship.vx=ship.vy=0;ship.gearDeployed=true;ship.throttle=0;}
 if(mode==='overview')Object.assign(camera,{x:level.padCenterX,y:terrain.pad.y+100,zoom:2.6});
 if(mode==='close')Object.assign(camera,{x:level.padCenterX,y:terrain.pad.y+50,zoom:4.5});
 current={kind:'landing',level,terrain,ship,camera,state:'flying',score:null,worldTimeStart:12345,missionDvStart:0,...(mode==='takeoff'?{launchGuidance:{targetAltitude:500,orbitDir:1,nextApproachLevelId:approachLevel.id}}:{})};draw();
}
function draw(){
 game.time=elapsed;
 if(scenery)game.landingScenery=scenery;
 game.renderGameplayPhase(view.value==='approach'?approach:current,'Practice complete',level.poi.name,'Hartwell',false);
 if(original.checked&&view.value!=='approach'){
  ctx.save();ctx.strokeStyle='#ff9b88';ctx.lineWidth=1;ctx.setLineDash([3,3]);
  ctx.beginPath();terrain.surfaceSite!.profile.forEach(([x,y],i)=>{const a=canvas.width/2+(x-current.camera.x)*current.camera.zoom,b=canvas.height/2-(y-current.camera.y)*current.camera.zoom;i?ctx.lineTo(a,b):ctx.moveTo(a,b);});ctx.stroke();
  for(const s of terrain.surfaceSite!.solids){ctx.beginPath();s.points.forEach(([x,y],i)=>{const a=canvas.width/2+(x-current.camera.x)*current.camera.zoom,b=canvas.height/2-(y-current.camera.y)*current.camera.zoom;i?ctx.lineTo(a,b):ctx.moveTo(a,b);});ctx.closePath();ctx.stroke();}ctx.restore();
 }
 status.textContent=`Dawes Cut · ${view.value} · ${paused?'paused':'flying'} · ${elapsed.toFixed(1)}s · ${current.state} · no career/save changes`;
}
function step(input:InputState,dt:number){
 if(current.state!=='flying')return;
 if(input.toggleGear){current.ship.gearDeployed=!current.ship.gearDeployed;current.ship.autoRotateEnabled=true;}
 if(input.toggleSAS)current.ship.sas=!current.ship.sas;
 elapsed+=dt;
 if(game.shouldHoldLaunchOnPad(current,input))game.clampLaunchShipToPad(current);
 else{const previous={...current.ship},atmosphere=game.landingAtmosphere(current);
  if(atmosphere)atmosphere.pilot.input={...input};
  updateShip(current.ship,input,dt,elapsed,atmosphere?.physicsAir);
  atmosphere?.pilot.effects.step(current.ship,atmosphere.air,terrain,dt,elapsed);
  game.checkLandingCollision(current,previous);
 }
 updateCamera(current.camera,current.ship,landingReferenceHeight(level,terrain,current.ship.x),dt);
 if(current.state!=='flying'){paused=true;play.textContent='Fly';}
}
function advance(seconds:number,input:Partial<InputState>={}){
 if(seconds<0||seconds>20||!Number.isFinite(seconds))throw Error('Invalid practice advance');
 paused=true;const steps=Math.ceil(seconds*120);
 if(view.value==='approach'&&pilotMode)elapsed+=seconds;
 else for(let i=0;i<steps;i++)step({...neutral,...input,toggleGear:i===0&&!!input.toggleGear,toggleSAS:i===0&&!!input.toggleSAS},seconds/steps);
 draw();return snapshot();
}
function snapshot(){return{view:view.value,elapsed,paused,state:current.state,ship:{...current.ship},camera:{...current.camera},pad:{...terrain.pad},scenery:scenery.diagnostics(),effects:game.atmosphericPilot?.effects.diagnostics()};}
const image=()=>ctx.getImageData(0,0,1200,720).data;
function hash(data:Uint8ClampedArray){let h=2166136261;for(const v of data)h=Math.imul(h^v,16777619);return h>>>0;}
async function checks(){
 if(checking)throw Error('Checks already running');checking=true;paused=true;let count=0;
 const assert=(ok:unknown,text:string)=>{count++;if(!ok)throw Error(text);};
 const career=JSON.stringify(game.career),pilot=game.atmosphericPilot;game.atmosphericPilot=undefined;
 try{
  original.checked=false;reset('overview');await scenery.prepare(level);draw();
  assert(scenery.diagnostics().ready&&scenery.diagnostics().materialReady&&!scenery.diagnostics().failed,'SVG and material preparation succeed');
  const site=terrain.surfaceSite!;
  assert(site.deckY===(site.nativeLeftHeight+site.nativeRightHeight)/2&&site.deckY>level.padY,'site and pad raised to average native edge height');
  assert(site.profile.every((p,i)=>!i||p[0]>site.profile[i-1][0]),'shoulders have no vertical cut segments');
  assert(getTerrainHeight(terrain,site.left)===site.deckY&&getTerrainHeight(terrain,site.right)===site.deckY,'no physical step at either site boundary');
  assert(scenery.diagnostics().images===6&&scenery.diagnostics().pixels!<1048576,'bounded six-part foreground SVG raster set');
  const on=image();draw();assert(hash(image())===hash(on),'stationary scene repeats exactly');
  const state=JSON.stringify(current.ship);
  elapsed=.8;draw();const off=image();assert(hash(off)!==hash(on),'beacons blink');
  const placement=placeSurfacePoi(basicOutpost(),terrain.pad,x=>getTerrainHeight(terrain,x));
  let changed=0,outside=0;const z=current.camera.zoom;
  for(let y=0;y<720;y++)for(let x=0;x<1200;x++){
   const at=(y*1200+x)*4;if(![0,1,2,3].some(c=>on[at+c]!==off[at+c]))continue;changed++;
   if(!basicOutpost().beacons.some(b=>Math.hypot(x-(600+(placement.x+b.x*placement.scale-current.camera.x)*z),y-(360-(terrain.pad.y-b.y*placement.scale-current.camera.y)*z))<Math.max(4,2*z)+2))outside++;
  }
  assert(changed>10&&outside===0,'only the two beacon lights animate');
  for(const [i,b]of basicOutpost().beacons.entries()){
   const x=Math.round(600+(placement.x+b.x*placement.scale-current.camera.x)*z),y=Math.round(360-(terrain.pad.y-b.y*placement.scale-current.camera.y)*z),at=(y*1200+x)*4;
   assert(i?on[at]>on[at+1]*2&&on[at]>on[at+2]:on[at+1]>on[at]*2&&on[at+1]>on[at+2],i?'right beacon red':'left beacon green');
  }
  elapsed=1.4;draw();assert(hash(image())===hash(on),'beacon cycle replays exactly');
  assert(JSON.stringify(current.ship)===state,'rendering/blink does not change physics');
  const footer=ctx.getImageData(0,686,1,34).data;assert(footer.every((v,i)=>v===(i%4===3?255:0)),'opaque black control strip');
  const scratch=document.createElement('canvas');scratch.width=1200;scratch.height=720;const s=scratch.getContext('2d',{willReadFrequently:false})!;
  scenery(s,current.camera,terrain,level,1200,720,0);const scene=s.getImageData(0,0,1200,180).data;
  const cutX=Math.round(600+(960-current.camera.x)*z),cutY=Math.round(360-(terrain.pad.y+30-current.camera.y)*z),cut=s.getImageData(cutX,cutY,1,1).data;
  const deckPixel=s.getImageData(Math.round(600+(960-current.camera.x)*z),Math.round(360-(terrain.pad.y-15-current.camera.y)*z),1,1).data;
  assert(deckPixel[0]===10&&deckPixel[1]===7&&deckPixel[2]===5&&deckPixel[3]===255,'below-deck fill matches planet background instead of foundation stripes');
  for(const x of [site.left-25,site.right+25]){
   const y=getTerrainHeight(terrain,x),px=Math.round(600+(x-current.camera.x)*z);
   const below=s.getImageData(px,Math.round(360-(y-3-current.camera.y)*z),1,1).data;
   const above=s.getImageData(px,Math.round(360-(y+3-current.camera.y)*z),1,1).data;
   assert(below[0]===10&&below[1]===7&&below[2]===5&&below[3]===255,'visible graded slope agrees with solid ground');
   assert(!(above[0]===10&&above[1]===7&&above[2]===5),'air above physical slope is not painted solid');
  }
  const bottom=s.getImageData(0,700,1200,20).data;
  assert(bottom.every((v,i)=>v===[10,7,5,255][i%4]),'entire subsurface plain planet background, no ground or foundation stripes');
  createHartwellOutlineScenery(hartwellApproachRegion(DAWES_CUT_ID),'background')(s,landingBackdropCamera(current.camera,terrain),{localDir:-1},{body:level.body,poi:level.poi,gateX:0},1200,720);
  const bareCut=s.getImageData(cutX,cutY,1,1).data;assert(cut.every((v,i)=>Math.abs(v-bareCut[i])<=1),'no old hillside passes through the outpost');
  const sky=s.getImageData(0,0,1200,180).data;assert(scene.every((v,i)=>Math.abs(v-sky[i])<=1),'landing uses exact shared Hartwell backdrop');
  assert(sky.some((v,i)=>i%4!==3&&v>0)&&sky.every((v,i)=>i%4===3||v<20),'sky is near-black planetary tint, not painted daylight');
  const warm=createSurfacePoiArtwork(HARTWELL_OUTPOST_THEME),cool=createSurfacePoiArtwork({dust:'#879ba8',wall:'#344958',roof:'#7b919c',pad:'#596d79',trim:'#c2d1d4',light:'#bcd7d9'});
  await Promise.all([warm.ready,cool.ready]);assert(!warm.diagnostics().failed&&!cool.diagnostics().failed,'same SVG decodes in independent environment palettes');
  for(const module of basicOutpost().modules){
   const a=warm.images.get(module.id)!,b=cool.images.get(module.id)!;
   const wa=a.getContext('2d')!.getImageData(0,0,a.width,a.height).data,cb=b.getContext('2d')!.getImageData(0,0,b.width,b.height).data;
   assert(wa.every((v,i)=>i%4!==3||v===cb[i]),`${module.id}: palette swap preserves silhouette/anchors`);
   assert(wa.some((v,i)=>i%4!==3&&wa[(i>>2)*4+3]>200&&v!==cb[i]),`${module.id}: SVG responds to environment palette`);
  }
  for(const [id,x,y]of [['warehouse-main',-586,-20],['warehouse-rear',-714,-35],['residential-dome',-342,-75],['beacon-towers',-74,-20],['beacon-towers',74,-44.1]]as const){
   const m=basicOutpost().modules.find(m=>m.id===id)!,c=warm.images.get(id)!;
   assert(c.getContext('2d')!.getImageData((x-m.bounds.x)*2,(y-m.bounds.y)*2,1,1).data[3]===255,`${id}: solid opaque building interior`);
  }
  const domeModule=basicOutpost().modules.find(m=>m.id==='residential-dome')!,domeCanvas=warm.images.get(domeModule.id)!;
  const blue=domeCanvas.getContext('2d')!.getImageData((-320-domeModule.bounds.x)*2,(-95-domeModule.bounds.y)*2,1,1).data;
  assert(blue[3]===255&&blue[2]>blue[0]*2&&blue[2]>blue[1],'enlarged dome has opaque blue surfaces');
  for(const mode of ['overview','close','entry']){
   reset(mode);const actual=hash(image());game.landingScenery=()=>false;game.renderGameplayPhase(current,'Practice complete',level.poi.name,'Hartwell',false);
   assert(hash(image())!==actual,`${mode}: actual Game installs new surface art`);game.landingScenery=scenery;draw();
   assert(hash(image())===actual,`${mode}: original/new toggle exact replay`);
  }
  for(const zoom of [1,2.6,4.5])for(const x of [-100,900,1000,1100,2100]){
   current.camera={x,y:terrain.pad.y+100,zoom};draw();assert(JSON.stringify([level,terrain])===baseline,'pan/zoom never modifies collision terrain or pad');
  }
  reset('overview');const a=advance(.5,{throttleUp:true});reset('overview');const b=advance(.5,{throttleUp:true});
  assert(a.ship.dvUsed>0&&JSON.stringify(a.ship)===JSON.stringify(b.ship),'real controls/physics and retry deterministic');
  reset('close');current.ship.y=terrain.pad.y+4;current.ship.vy=0;game.checkLandingCollision(current);
  assert(current.state==='landed','real pad touchdown still works');
  reset('close');current.ship.x=1190;current.ship.y=getTerrainHeight(terrain,1190);game.checkLandingCollision(current);
  assert(current.state==='crashed','original terrain obstacles still collide');
  for(const [x,y]of [[853.5,40],[914.5,60]]){reset('close');current.ship.x=x;current.ship.y=terrain.pad.y+y-30;game.checkLandingCollision(current);assert(current.state==='crashed','foreground warehouse/dome cause real crashes');}
  reset('close');const previous={...current.ship,x:865,y:terrain.pad.y+40,gearDeployed:false,facingSign:-1,angle:0};Object.assign(current.ship,previous,{x:965});game.checkLandingCollision(current);
  assert(current.state==='flying','fast sweep endpoint clear');game.checkLandingCollision(current,previous);assert(current.state==='crashed','actual Game swept hull cannot cross a dome');
  for(const x of [981.5,1018.5]){
   reset('close');current.ship.x=x;current.ship.y=terrain.pad.y+7;elapsed=.8;draw();game.checkLandingCollision(current);
   assert(current.state==='crashed','actual Game collides with beacon tower even while light is off');
   reset('close');const previous={...current.ship,x:x-14,y:terrain.pad.y+7,gearDeployed:false,facingSign:1,angle:0};
   Object.assign(current.ship,previous,{x:x+14});game.checkLandingCollision(current);
   assert(current.state==='flying','beacon sweep endpoint remains clear');
   game.checkLandingCollision(current,previous);assert(current.state==='crashed','actual Game swept hull cannot tunnel through beacon tower');
  }
  assert(terrain.pad.right-terrain.pad.left===35,'actual landing target is narrowed to 35 m');
  reset('takeoff');advance(.3);assert(current.state==='flying'&&Math.abs(current.ship.y-(terrain.pad.y+4.05))<.01,'real launch hold on original pad');
  advance(3,{throttleUp:true});assert(current.state==='flying'&&current.ship.y>terrain.pad.y+10,'takeoff from foreground pad works');
  // Exercise actual loader/handoff/retry, not just the practice spawn helper.
  const loader:any=Object.create(Game.prototype);
  Object.assign(loader,{career:defaultCareerProfile(),worldTime:12345,missionDvUsed:0,activeManifestCondition:{integrity:null,comfort:null},activeMaintenanceTelemetry:createMaintenanceTelemetry(),landingScenery:scenery,showGuidance:()=>{},showContextualOperationsManual:()=>{}});
  loader.loadLanding(level);
  assert(Math.abs(loader.phase.ship.y-(level.startY+terrain.pad.y-level.padY))<1e-9,'actual default entry preserves altitude above raised datum');
  const initial=JSON.stringify(loader.phase);loader.reloadPhase(loader.phase);
  assert(JSON.stringify(loader.phase)===initial,'actual retry does not double-apply site elevation');
  loader.loadLanding(level,{x:1000,y:-999,vx:10,vy:10},{targetAltitude:500,orbitDir:1,nextApproachLevelId:approachLevel.id});
  assert(Math.abs(loader.phase.ship.y-(terrain.pad.y+4.05))<1e-9&&config.startY===loader.phase.ship.y,'actual launch ignores stale authored spawn height');
  const transition=loader.transitionApproachToLanding({...approach,as:{...approach.as,x:approachLevel.gateX,y:approachLevel.gateY/2}});
  assert(transition,'actual approach handoff exists');transition.run();
  assert(Math.abs(loader.phase.ship.y-loader.phase.terrain.pad.y-200)<1e-9,'actual approach handoff uses resolved pad altitude');
  const arrival=JSON.stringify(loader.phase);loader.reloadPhase(loader.phase);
  assert(JSON.stringify(loader.phase)===arrival,'actual arrival retry preserves resolved altitude exactly');
  reset('takeoff');
  const other=createLandingLevel('estella-v-capital-settlement',990027),otherTerrain=generateTerrain(other);
  render(ctx,canvas,current.camera,current.ship,otherTerrain,other,0);const old=hash(image());
  render(ctx,canvas,current.camera,current.ship,otherTerrain,other,0,true,scenery);assert(hash(image())===old,'unreviewed surface sites retain exact original rendering');
  const crossWorld=await checkFlightPresentation(assert);
  assert(JSON.stringify(game.career)===career&&JSON.stringify([BODIES,SURFACE_POIS])===catalog&&JSON.stringify([level,terrain])===baseline,'career/catalog/levels untouched');
  reset('overview');const costs:number[]=[];
  for(let i=0;i<120;i++){
   await new Promise(requestAnimationFrame);current.camera.x=level.padCenterX+Math.sin(i/40)*60;current.camera.zoom=2.6+.3*Math.sin(i/50);elapsed=i/60;
   const start=performance.now();draw();costs.push(performance.now()-start);
  }
  costs.sort((a,b)=>a-b);reset('overview');
  return{passed:true,checks:count,crossWorld,cpuMean:costs.reduce((a,b)=>a+b,0)/costs.length,cpuP95:costs[Math.ceil(costs.length*.95)-1],scenery:scenery.diagnostics()};
 }finally{game.atmosphericPilot=pilot;checking=false;reset('overview');}
}
async function pilotChecks(){
 if(!game.atmosphericPilot)throw Error('Open ?atmosphere=1');
 checking=true;paused=true;let count=0;const pilot=game.atmosphericPilot,saved={visuals:pilot.visuals,wind:pilot.wind,low:pilot.low},career=JSON.stringify(game.career);
 const assert=(ok:unknown,message:string)=>{count++;if(!ok)throw Error(message);};
 try{
  pilot.wind=pilot.visuals=true;pilot.low=false;reset('overview');const hold=advance(12);
  assert(hold.ship.sas&&Math.abs(hold.ship.vx)<1e-8&&Math.abs(hold.ship.vy)<1e-8&&Math.abs(hold.ship.x-1000)<1e-8,'SAS holds zero ground velocity against wind');
  assert(hold.ship.rcsTranslating&&hold.ship.dvUsed>12*level.gravity,'wind compensation consumes RCS delta-v');
  assert(hold.effects.active>0&&hold.effects.active<=256,'exhaust emitted into bounded pool');
  const plume=pilot.effects.snapshot();draw();draw();assert(JSON.stringify(pilot.effects.snapshot())===JSON.stringify(plume),'drawing/paused redraw never advances particles');
  pilot.visuals=false;draw();const hidden=hash(image());pilot.visuals=true;draw();assert(hash(image())!==hidden,'smoke and wind paint visible with effects enabled');
  reset('overview');const blown=advance(12,{toggleSAS:true});assert(Math.abs(blown.ship.x-1000)>.5,'SAS off allows wind drift');
  pilot.wind=false;reset('overview');const calm=advance(12,{toggleSAS:true});assert(Math.abs(calm.ship.x-1000)<1e-9,'wind off restores calm legacy simulation');
  pilot.wind=true;
  // Actual fixed-step Game handler, including RCS cost/maintenance telemetry; no career constructor or settlement.
  const runtime:any=Object.create(Game.prototype);
  Object.assign(runtime,{career:defaultCareerProfile(),worldTime:12345,missionDvUsed:0,activeManifestCondition:{integrity:null,comfort:null},activeMaintenanceTelemetry:createMaintenanceTelemetry(),landingScenery:scenery,atmosphericPilot:{...pilot,effects:createFlightAtmosphere()},showGuidance:()=>{},showContextualOperationsManual:()=>{}});
  runtime.loadLanding(level,{x:1000,y:terrain.pad.y+85,vx:0,vy:0});Object.assign(runtime.phase.ship,{sas:true,gearDeployed:true,throttle:level.gravity/config.mainEngineAccel});
  for(let i=0;i<480;i++)runtime.handleLanding({...neutral},1/120);
  assert(runtime.phase.state==='flying'&&Math.abs(runtime.phase.ship.vx)<1e-10&&runtime.phase.ship.x===1000,'actual Game handler applies ground-hold wind compensation');
  assert(runtime.activeMaintenanceTelemetry.standardManeuverDv>0&&runtime.atmosphericPilot.effects.diagnostics().active>0,'actual Game records SAS effort and advances exhaust');
  assert(!runtime.landingAtmosphere({...runtime.phase,level:createLandingLevel('estella-v-capital-settlement',993312)}),'pilot refuses other POIs');
  reset('overview');const first=advance(4,{toggleSAS:true}),particles=JSON.stringify(pilot.effects.snapshot());
  reset('overview');const second=advance(4,{toggleSAS:true});assert(JSON.stringify(first.ship)===JSON.stringify(second.ship)&&particles===JSON.stringify(pilot.effects.snapshot()),'retry restores weather, ship and emission exactly');
  pilot.visuals=false;pilot.low=true;reset('overview');const low=advance(4,{toggleSAS:true});assert(JSON.stringify(low.ship)===JSON.stringify(first.ship),'visual switches never change physics');
  pilot.visuals=true;reset('close');current.ship.y=terrain.pad.y+10;advance(3);current.camera={x:1000,y:terrain.pad.y+50,zoom:4};draw();
  const below=ctx.getImageData(300,590,600,40).data,building=ctx.getImageData(253,475,10,10).data;
  pilot.visuals=false;draw();const bareBelow=ctx.getImageData(300,590,600,40).data;assert(below.every((v,i)=>v===bareBelow[i]),'no smoke/wind below physical terrain');
  const bareBuilding=ctx.getImageData(253,475,10,10).data;assert(building.every((v,i)=>v===bareBuilding[i]),'smoke/wind do not paint through solid buildings');
  pilot.visuals=true;reset('approach');draw();const cloudy=hash(image());pilot.visuals=false;draw();assert(hash(image())!==cloudy,'actual approach shows clouds');
  pilot.visuals=true;advance(10);assert(hash(image())!==cloudy,'approach weather animates on absolute clock');
  assert(pilot.effects.diagnostics().cloudPixels===256*96,'one bounded cloud sprite');
  const scratch=document.createElement('canvas');scratch.width=600;scratch.height=400;const c=scratch.getContext('2d')!;
  pilot.effects.drawClouds(c,approach.cam,{...level.body,atmosphere:null},DAWES_CUT_ID,0,1,12345,600,400,()=>0);
  assert(c.getImageData(0,0,600,400).data.every(v=>v===0),'no atmospheric clouds on airless bodies');
  reset('takeoff');advance(.5);assert(current.state==='flying'&&current.ship.sas&&Math.abs(current.ship.y-terrain.pad.y-4.05)<1e-8,'parked launch hold preserves SAS choice and stays grounded in wind');
  advance(5,{throttleUp:true});assert(current.state==='flying'&&current.ship.sas&&Math.abs(current.ship.vx)<1e-8&&current.ship.y>terrain.pad.y+15,'wind/SAS takeoff retains zero lateral velocity during a full-thrust climb');
  assert(JSON.stringify(game.career)===career&&JSON.stringify([level,terrain])===baseline&&JSON.stringify([BODIES,SURFACE_POIS])===catalog,'pilot has no career/catalog/geometry side effects');
  return{passed:true,checks:count,hold:hold.ship,drift:blown.ship.x-1000,effects:hold.effects};
 }finally{Object.assign(pilot,saved);checking=false;reset('overview');}
}
async function performanceChecks(paint=true){
 if(checking)throw Error('Checks already running');checking=true;paused=true;original.checked=false;
 const oldW=canvas.width,oldH=canvas.height;
 try{
  reset('overview');await scenery.prepare(level);if(pilotMode)advance(3);canvas.width=1920;canvas.height=1080;
  const costs:number[]=[],intervals:number[]=[];let previous=0;
  for(let i=0;i<210;i++){
   const now=await new Promise<number>(resolve=>requestAnimationFrame(resolve));
   if(pilotMode){step(neutral,1/120);step(neutral,1/120);}
   current.camera={x:1000+150*Math.sin(i/80),y:terrain.pad.y+80,zoom:2.6+1.2*Math.sin(i/100)};if(!pilotMode)elapsed=i/60;
   const start=performance.now();if(paint)draw();const cost=performance.now()-start;
   if(i>=30){costs.push(cost);intervals.push(now-previous);}previous=now;
  }
  costs.sort((a,b)=>a-b);intervals.sort((a,b)=>a-b);
  return{width:1920,height:1080,paint,cpuMean:costs.reduce((a,b)=>a+b,0)/costs.length,cpuP95:costs[Math.ceil(costs.length*.95)-1],cpuMax:costs[costs.length-1],fps:1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length),frameP95:intervals[Math.ceil(intervals.length*.95)-1],frameMax:intervals[intervals.length-1]};
 }finally{canvas.width=oldW;canvas.height=oldH;reset('overview');checking=false;}
}
view.onchange=()=>reset();original.onchange=()=>{paused=true;draw();};
document.getElementById('reset')!.onclick=()=>reset();
play.onclick=()=>{if(view.value==='approach'&&!pilotMode)reset('overview');if(current.state!=='flying')reset();paused=!paused;last=performance.now();play.textContent=paused?'Fly':'Pause';canvas.focus();};
document.getElementById('checks')!.onclick=async()=>{const r=await checks(),p=pilotMode?await pilotChecks():undefined;status.textContent=`PASS — ${r.checks} baseline${p?` + ${p.checks} atmosphere`:''} checks`;};
function frame(now:number){
 if(checking){last=now;requestAnimationFrame(frame);return;}
 const input=readInput(),dt=Math.min(.1,(now-last)/1000);last=now;
 if(input.reset)reset();if(input.levelSelect){paused=true;play.textContent='Fly';}
 if(!paused&&!document.hidden&&pilotMode&&view.value==='approach'){elapsed+=dt;draw();requestAnimationFrame(frame);return;}
 if(!paused&&!document.hidden){accumulator+=dt;let first=true;while(accumulator>=1/120){step({...input,toggleGear:first&&input.toggleGear,toggleSAS:first&&input.toggleSAS},1/120);first=false;accumulator-=1/120;}}
 draw();requestAnimationFrame(frame);
}
window.addEventListener('blur',()=>{paused=true;play.textContent='Fly';});document.addEventListener('visibilitychange',()=>{if(document.hidden){paused=true;accumulator=0;play.textContent='Fly';}});
async function start(){reset();scenery=game.landingScenery;await scenery.prepare(level);draw();requestAnimationFrame(frame);(window as any).dawesLanding={ready:true,reset,advance,snapshot,checks,performance:performanceChecks,pilotChecks};}
void start();
