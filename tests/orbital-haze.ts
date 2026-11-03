import { BODIES, SURFACE_POIS, bodyById } from '../src/world';
import { drawCurrentWorldDisc } from '../src/world-presentation';
import { drawOrbitalHaze } from '../src/orbital-haze';
import { ORBITAL_LEVELS, createOrbitalState, renderOrbital } from '../src/orbital';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { Game } from '../src/game';
import { defaultCareerProfile } from '../src/career-state';
const atlas=document.getElementById('atlas') as HTMLCanvasElement,flight=document.getElementById('flight') as HTMLCanvasElement,ac=atlas.getContext('2d')!,fc=flight.getContext('2d')!;
const select=document.getElementById('body') as HTMLSelectElement,status=document.getElementById('status')!;
const bodies=[...BODIES.filter(b=>b.atmosphere),bodyById('estella-iiia')],catalog=JSON.stringify(BODIES);
const giant=(id:string)=>['estella-x','estella-xi','estella-xii'].includes(id);
for(const body of bodies){select.add(new Option(body.name,body.id));const poi=SURFACE_POIS.find(p=>p.bodyId===body.id);if(poi)createPlayableEstellaMission('estella-vi-heavy-cargo-station',poi.id,undefined,0);}
// Gryphon has no atmospheric surface POI; acquire its real parent scene via Beira.
createPlayableEstellaMission('estella-vi-heavy-cargo-station','estella-xa-deep-ice-mine',undefined,0);
function scene(id:string,density?:number){
 const body=bodyById(id),source=ORBITAL_LEVELS.find(l=>l.bodyId===id);if(!source)throw Error(`Missing orbital scene ${id}`);
 const level={...source,systemBodies:undefined,station:undefined,orbitMarkers:[],surfaceMarkers:[],showLandingSite:false,targetBodyId:undefined,...(density===undefined?{}:{surfaceDensity:density})};
 const distance=body.radius*1.5+(body.atmosphere?.height??0)*2;
 const state=createOrbitalState(level,{x:distance,y:0,vx:0,vy:Math.sqrt(body.gm/distance),time:0});
 const cam={x:0,y:0,zoom:260/(body.radius+(body.atmosphere?.height??0))};return{body,level,state,cam};
}
function draw(){
 ac.fillStyle='#030308';ac.fillRect(0,0,1200,780);
 bodies.forEach((b,i)=>{const cx=150+i%4*300,cy=130+Math.floor(i/4)*260,r=104/(1+(b.atmosphere?.height??0)/b.radius);
  drawOrbitalHaze(ac,cx,cy,r,b.radius,b.atmosphere,1200,780,giant(b.id));drawCurrentWorldDisc(ac,b.id,cx,cy,r,b.color);
  ac.fillStyle='#bed9ea';ac.font='16px system-ui';ac.textAlign='center';ac.fillText(b.name,cx,cy-112);ac.font='12px monospace';ac.fillText(b.atmosphere?`${b.atmosphere.surfaceDensity.toFixed(2)} kg/m³ · ${(b.atmosphere.height/1000).toFixed(0)} km`:'Airless — no haze',cx,cy+122);
 });
 const p=scene(select.value);renderOrbital(fc,flight,p.cam,p.state,p.level,0);status.textContent=`${p.body.name} — actual orbital renderer, no save IO`;
}
function checks(){
 let n=0;const assert=(ok:unknown,msg:string)=>{n++;if(!ok)throw Error(msg);};const scratch=document.createElement('canvas');scratch.width=scratch.height=512;const c=scratch.getContext('2d',{willReadFrequently:true})!;
 const pixel=(x:number,y:number)=>c.getImageData(x,y,1,1).data[3];
 for(const b of bodies){
  c.clearRect(0,0,512,512);const painted=drawOrbitalHaze(c,256,256,120,b.radius,b.atmosphere,512,512,giant(b.id));assert(painted===!!b.atmosphere,'native atmosphere dispatch');
  assert(pixel(256,256)===0&&pixel(300,256)===0,'no haze in globe interior');
  if(b.atmosphere){const outer=120*(1+b.atmosphere.height/b.radius);assert(pixel(Math.ceil(256+outer+2),256)===0,'nothing beyond physical boundary');assert(pixel(378,256)>0,'visible lower atmosphere');}
  else assert(c.getImageData(0,0,512,512).data.every(v=>v===0),'airless paint entirely empty');
  const p=scene(b.id),before=JSON.stringify([p.level,p.state]);renderOrbital(fc,flight,p.cam,p.state,p.level,0);const full=fc.getImageData(0,0,1200,720).data;
  const q=scene(b.id,0);renderOrbital(fc,flight,q.cam,q.state,q.level,0);const clear=fc.getImageData(0,0,1200,720).data;
  assert(full.some((v,i)=>v!==clear[i])===!!b.atmosphere,'actual orbital renderer includes density haze');
  assert(JSON.stringify([p.level,p.state])===before,'render does not change flight / level');
 }
 // Controlled same geometry/tint: native alpha increases with density, falls with altitude.
 const a={height:80000,scaleHeight:16000,surfaceDensity:1.2,color:[90,160,220] as [number,number,number]};let previous=0;
 for(const d of [.12,.18,1.2,2.2,8]){c.clearRect(0,0,512,512);drawOrbitalHaze(c,256,256,120,320000,{...a,surfaceDensity:d},512,512);const alpha=pixel(379,256);assert(alpha>previous,'native optical density ordering');previous=alpha;}
 c.clearRect(0,0,512,512);drawOrbitalHaze(c,256,256,120,320000,a,512,512);assert(pixel(379,256)>pixel(386,256)&&pixel(386,256)>pixel(395,256),'native altitude fade');
 // Close limb/offscreen center exercises the low-orbit viewport without a full-disc texture.
 c.clearRect(0,0,512,512);assert(drawOrbitalHaze(c,-900,256,1000,320000,a,512,512)&&pixel(102,256)>0,'close limb paints with offscreen center');
 c.clearRect(0,0,512,512);assert(!drawOrbitalHaze(c,-10000,256,1000,320000,a,512,512)&&c.getImageData(0,0,512,512).data.every(v=>v===0),'offscreen ring skipped');
 const p=scene('estella-iii'),g:any=Object.create(Game.prototype);Object.assign(g,{canvas:flight,ctx:fc,career:defaultCareerProfile(),time:0,activeManifestCondition:{},missionDvUsed:0,activeMissionQuote:null});
 const before=JSON.stringify(g.career);g.renderGameplayPhase({kind:'orbital',level:p.level,os:p.state,cam:p.cam,state:'orbiting',worldTimeStart:0,missionDvStart:0},'',undefined,undefined,true);assert(JSON.stringify(g.career)===before,'actual Game hook preserves career');
 const system=ORBITAL_LEVELS.find(l=>l.bodyId==='estella'&&l.systemBodies?.some(b=>giant(b.id)))!;
 const maxOrbit=Math.max(...system.systemBodies!.map(b=>b.orbitRadius)),systemCam={x:0,y:0,zoom:260/maxOrbit},systemState=createOrbitalState(system);
 const gradients:number[][]=[],original=fc.createRadialGradient.bind(fc);
 fc.createRadialGradient=(...args:[number,number,number,number,number,number])=>{gradients.push(args);return original(...args);};
 try{renderOrbital(fc,flight,systemCam,systemState,system,0);}finally{fc.createRadialGradient=original;}
 assert(gradients.some(g=>g[2]<20&&(Math.abs(g[0]-600)>1||Math.abs(g[1]-360)>1)),'actual system markers receive resolved atmospheric haze');
 assert(JSON.stringify(BODIES)===catalog,'body catalog unchanged');draw();return{passed:true,checks:n,atmosphericWorlds:bodies.filter(b=>b.atmosphere).length};
}
select.value='estella-iii';select.onchange=draw;document.getElementById('checks')!.onclick=()=>{status.textContent=JSON.stringify(checks());};draw();(window as any).orbitalHaze={ready:true,checks,draw,select:(id:string)=>{select.value=id;draw();}};
