import { Game } from '../src/game';
import { defaultCareerProfile } from '../src/career-state';
import { config } from '../src/config';
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
let current:any,scenery:ReturnType<typeof createLandingScenery>,elapsed=0,paused=true,checking=false,last=performance.now(),accumulator=0;
const neutral=readInput(),catalog=JSON.stringify([BODIES,SURFACE_POIS]),baseline=JSON.stringify([level,terrain]);
function reset(mode=view.value){
 view.value=mode;paused=true;elapsed=accumulator=0;play.textContent='Fly';
 Object.assign(config,{gravity:level.gravity,landingMaxVSpeed:level.landingMaxVSpeed,landingMaxHSpeed:level.landingMaxHSpeed,landingMaxAngle:level.landingMaxAngle,startX:level.startX,startY:level.startY,startVX:level.startVX,startVY:level.startVY});
 const ship=createShip(),camera=createCamera();
 if(mode!=='entry'){ship.x=level.padCenterX;ship.y=level.padY+85;ship.vx=ship.vy=0;ship.gearDeployed=true;ship.throttle=level.gravity/config.mainEngineAccel;}
 updateCamera(camera,ship,landingReferenceHeight(level,terrain,ship.x),0);
 if(mode==='takeoff'){ship.x=level.padCenterX;ship.y=level.padY+4.05;ship.vx=ship.vy=0;ship.gearDeployed=true;ship.throttle=0;}
 if(mode==='overview')Object.assign(camera,{x:level.padCenterX,y:level.padY+100,zoom:2.6});
 if(mode==='close')Object.assign(camera,{x:level.padCenterX,y:level.padY+50,zoom:4.5});
 current={kind:'landing',level,terrain,ship,camera,state:'flying',score:null,worldTimeStart:12345,missionDvStart:0,...(mode==='takeoff'?{launchGuidance:{targetAltitude:500,orbitDir:1,nextApproachLevelId:approachLevel.id}}:{})};draw();
}
function draw(){
 game.time=elapsed;
 if(scenery)game.landingScenery=scenery;
 game.renderGameplayPhase(view.value==='approach'?approach:current,'Practice complete',level.poi.name,'Hartwell',false);
 if(original.checked&&view.value!=='approach'){
  ctx.save();ctx.strokeStyle='#ff9b88';ctx.lineWidth=1;ctx.setLineDash([3,3]);
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
 else{const previous={...current.ship};updateShip(current.ship,input,dt,elapsed);game.checkLandingCollision(current,previous);}
 updateCamera(current.camera,current.ship,landingReferenceHeight(level,terrain,current.ship.x),dt);
 if(current.state!=='flying'){paused=true;play.textContent='Fly';}
}
function advance(seconds:number,input:Partial<InputState>={}){
 if(seconds<0||seconds>20||!Number.isFinite(seconds))throw Error('Invalid practice advance');
 paused=true;const steps=Math.ceil(seconds*120);
 for(let i=0;i<steps;i++)step({...neutral,...input,toggleGear:i===0&&!!input.toggleGear,toggleSAS:i===0&&!!input.toggleSAS},seconds/steps);
 draw();return snapshot();
}
function snapshot(){return{view:view.value,elapsed,paused,state:current.state,ship:{...current.ship},camera:{...current.camera},pad:{...terrain.pad},scenery:scenery.diagnostics()};}
const image=()=>ctx.getImageData(0,0,1200,720).data;
function hash(data:Uint8ClampedArray){let h=2166136261;for(const v of data)h=Math.imul(h^v,16777619);return h>>>0;}
async function checks(){
 if(checking)throw Error('Checks already running');checking=true;paused=true;let count=0;
 const assert=(ok:unknown,text:string)=>{count++;if(!ok)throw Error(text);};
 const career=JSON.stringify(game.career);
 try{
  original.checked=false;reset('overview');await scenery.prepare(level);draw();
  assert(scenery.diagnostics().ready&&scenery.diagnostics().materialReady&&!scenery.diagnostics().failed,'SVG and material preparation succeed');
  assert(scenery.diagnostics().images===5&&scenery.diagnostics().pixels!<1048576,'bounded five-part foreground SVG raster set');
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
  const cutX=Math.round(600+(930-current.camera.x)*z),cutY=Math.round(360-(60-current.camera.y)*z),cut=s.getImageData(cutX,cutY,1,1).data;
  const deckPixel=s.getImageData(Math.round(600+(960-current.camera.x)*z),Math.round(360-(15-current.camera.y)*z),1,1).data;
  assert(deckPixel[0]===18&&deckPixel[1]===16&&deckPixel[2]===14&&deckPixel[3]===255,'opaque SVG deck replaces natural terrain across footprint');
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
  for(const [id,x,y]of [['warehouse-main',-326,-20],['warehouse-rear',-410,-35],['residential-dome',336,-50]]as const){
   const m=basicOutpost().modules.find(m=>m.id===id)!,c=warm.images.get(id)!;
   assert(c.getContext('2d')!.getImageData((x-m.bounds.x)*2,(y-m.bounds.y)*2,1,1).data[3]===255,`${id}: solid opaque building interior`);
  }
  for(const mode of ['overview','close','entry']){
   reset(mode);const actual=hash(image());game.landingScenery=()=>false;game.renderGameplayPhase(current,'Practice complete',level.poi.name,'Hartwell',false);
   assert(hash(image())!==actual,`${mode}: actual Game installs new surface art`);game.landingScenery=scenery;draw();
   assert(hash(image())===actual,`${mode}: original/new toggle exact replay`);
  }
  for(const zoom of [1,2.6,4.5])for(const x of [-100,900,1000,1100,2100]){
   current.camera={x,y:level.padY+100,zoom};draw();assert(JSON.stringify([level,terrain])===baseline,'pan/zoom never modifies collision terrain or pad');
  }
  reset('overview');const a=advance(.5,{throttleUp:true});reset('overview');const b=advance(.5,{throttleUp:true});
  assert(a.ship.dvUsed>0&&JSON.stringify(a.ship)===JSON.stringify(b.ship),'real controls/physics and retry deterministic');
  reset('close');current.ship.y=terrain.pad.y+4;current.ship.vy=0;game.checkLandingCollision(current);
  assert(current.state==='landed','real pad touchdown still works');
  reset('close');current.ship.x=820;current.ship.y=getTerrainHeight(terrain,820);game.checkLandingCollision(current);
  assert(current.state==='crashed','original terrain obstacles still collide');
  for(const [x,y]of [[918.5,40],[1084,53]]){reset('close');current.ship.x=x;current.ship.y=y;game.checkLandingCollision(current);assert(current.state==='crashed','foreground warehouse/dome cause real crashes');}
  reset('close');const previous={...current.ship,x:1040,y:56,gearDeployed:false,facingSign:-1,angle:0};Object.assign(current.ship,previous,{x:1104});game.checkLandingCollision(current);
  assert(current.state==='flying','fast sweep endpoint clear');game.checkLandingCollision(current,previous);assert(current.state==='crashed','actual Game swept hull cannot cross a dome');
  reset('takeoff');advance(.3);assert(current.state==='flying'&&Math.abs(current.ship.y-(level.padY+4.05))<.01,'real launch hold on original pad');
  advance(3,{throttleUp:true});assert(current.state==='flying'&&current.ship.y>level.padY+10,'takeoff from foreground pad works');
  const other=createLandingLevel('estella-v-capital-settlement',990027),otherTerrain=generateTerrain(other);
  render(ctx,canvas,current.camera,current.ship,otherTerrain,other,0);const old=hash(image());
  render(ctx,canvas,current.camera,current.ship,otherTerrain,other,0,true,scenery);assert(hash(image())===old,'unreviewed surface sites retain exact original rendering');
  assert(JSON.stringify(game.career)===career&&JSON.stringify([BODIES,SURFACE_POIS])===catalog&&JSON.stringify([level,terrain])===baseline,'career/catalog/levels untouched');
  reset('overview');const costs:number[]=[];
  for(let i=0;i<120;i++){
   await new Promise(requestAnimationFrame);current.camera.x=level.padCenterX+Math.sin(i/40)*60;current.camera.zoom=2.6+.3*Math.sin(i/50);elapsed=i/60;
   const start=performance.now();draw();costs.push(performance.now()-start);
  }
  costs.sort((a,b)=>a-b);reset('overview');
  return{passed:true,checks:count,cpuMean:costs.reduce((a,b)=>a+b,0)/costs.length,cpuP95:costs[Math.ceil(costs.length*.95)-1],scenery:scenery.diagnostics()};
 }finally{checking=false;}
}
async function performanceChecks(){
 if(checking)throw Error('Checks already running');checking=true;paused=true;original.checked=false;
 const oldW=canvas.width,oldH=canvas.height;
 try{
  reset('overview');await scenery.prepare(level);canvas.width=1920;canvas.height=1080;
  const costs:number[]=[],intervals:number[]=[];let previous=0;
  for(let i=0;i<210;i++){
   const now=await new Promise<number>(resolve=>requestAnimationFrame(resolve));
   current.camera={x:1000+150*Math.sin(i/80),y:110,zoom:2.6+1.2*Math.sin(i/100)};elapsed=i/60;
   const start=performance.now();draw();const cost=performance.now()-start;
   if(i>=30){costs.push(cost);intervals.push(now-previous);}previous=now;
  }
  costs.sort((a,b)=>a-b);intervals.sort((a,b)=>a-b);
  return{width:1920,height:1080,cpuMean:costs.reduce((a,b)=>a+b,0)/costs.length,cpuP95:costs[Math.ceil(costs.length*.95)-1],cpuMax:costs[costs.length-1],fps:1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length),frameP95:intervals[Math.ceil(intervals.length*.95)-1],frameMax:intervals[intervals.length-1]};
 }finally{canvas.width=oldW;canvas.height=oldH;reset('overview');checking=false;}
}
view.onchange=()=>reset();original.onchange=()=>{paused=true;draw();};
document.getElementById('reset')!.onclick=()=>reset();
play.onclick=()=>{if(view.value==='approach')reset('overview');if(current.state!=='flying')reset();paused=!paused;last=performance.now();play.textContent=paused?'Fly':'Pause';canvas.focus();};
document.getElementById('checks')!.onclick=async()=>{const r=await checks();status.textContent=`PASS — ${r.checks} checks`;};
function frame(now:number){
 if(checking){last=now;requestAnimationFrame(frame);return;}
 const input=readInput(),dt=Math.min(.1,(now-last)/1000);last=now;
 if(input.reset)reset();if(input.levelSelect){paused=true;play.textContent='Fly';}
 if(!paused&&!document.hidden){accumulator+=dt;let first=true;while(accumulator>=1/120){step({...input,toggleGear:first&&input.toggleGear,toggleSAS:first&&input.toggleSAS},1/120);first=false;accumulator-=1/120;}}
 draw();requestAnimationFrame(frame);
}
window.addEventListener('blur',()=>{paused=true;play.textContent='Fly';});document.addEventListener('visibilitychange',()=>{if(document.hidden){paused=true;accumulator=0;play.textContent='Fly';}});
async function start(){reset();scenery=game.landingScenery;await scenery.prepare(level);draw();requestAnimationFrame(frame);(window as any).dawesLanding={ready:true,reset,advance,snapshot,checks,performance:performanceChecks};}
void start();
