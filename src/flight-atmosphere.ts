// Atmospheric presentation; legacy save-free pilot remains available. All emission advances at physics ticks,
// never in draw; quality only thins paint, not weather or forces.
import { ENGINE_PODS, localToWorld, type ShipState } from './ship';
import { terrainSurfacePoints, getTerrainHeight, type TerrainData } from './terrain';
import { regionalAdvection, regionalWind, weatherSeed, weatherRandom, type LandingAir } from './landing-air';
import type { BodyDef } from './world';
import type { InputState } from './input';
import { createWindTracers } from './wind-tracers';
import type { RegionalWeather } from './surface-weather';
export const PARTICLE_CAP=256;
export const NEUTRAL_FLIGHT_INPUT:InputState={pitch:0,throttleUp:false,throttleDown:false,stopAssist:false,killRotation:false,moveUp:false,moveDown:false,moveLeft:false,moveRight:false,rotateLeft:false,rotateRight:false,shiftHeld:false,setHoverThrottle:false,toggleGear:false,reset:false,toggleDevPanel:false,levelSelect:false,levelPick:0,menuUp:false,menuDown:false,menuLeft:false,menuRight:false,menuConfirm:false,pageUp:false,pageDown:false,continueAction:false,toggleWings:false,wingAngleUp:false,wingAngleDown:false,toggleSAS:false,warpUp:false,warpDown:false,toggleHighThrust:false};
type Camera={x:number;y:number;zoom:number};
type Puff={x:number;y:number;vx:number;vy:number;age:number;life:number;radius:number;active:boolean};
export interface AtmosphericPilot {visuals:boolean;wind:boolean;low:boolean;effects:ReturnType<typeof createFlightAtmosphere>;input?:InputState;}
export interface LandingAtmosphereView {pilot:AtmosphericPilot;air:LandingAir;physicsAir?:LandingAir;epoch:number;}
/** World-space source, reusable by future authored smokestack anchors. No stacks registered here. */
export interface SmokeSource {x:number;y:number;vx:number;vy:number;life?:number;size?:number;}
export function createFlightAtmosphere(regionId='',weather?:RegionalWeather){
 const tracers=createWindTracers(weather?.id??regionId);
 const pool:Puff[]=Array.from({length:PARTICLE_CAP},()=>({x:0,y:0,vx:0,vy:0,age:0,life:1,radius:1,active:false}));
 let cursor=0,serial=0,emission=0,lastTime=-Infinity,cloud:HTMLCanvasElement|undefined,smoke:HTMLCanvasElement|undefined,cloudColor='';
 function reset(){for(const p of pool)p.active=false;cursor=serial=emission=0;lastTime=-Infinity;tracers.reset();}
 // One puff per call; a future fixed source supplies its own bounded emission clock.
 // All sources share this fixed pool, wind relaxation, clipping and expiry.
 function emitSmoke(source:SmokeSource,air:LandingAir,time:number){
  if(![source.x,source.y,source.vx,source.vy,time,source.life??1,source.size??1].every(Number.isFinite))return;
  const p=pool[cursor];cursor=(cursor+1)%PARTICLE_CAP;
  const r=weatherRandom(9137,serial++),atmo=air.sample(source.x,source.y,time).density>0;
  Object.assign(p,{x:source.x,y:source.y,vx:source.vx+(r-.5)*2,vy:source.vy,age:0,
   life:atmo?Math.max(.1,Math.min(8,source.life??(2.2+r*.4))):.25+r*.1,
   radius:atmo?Math.max(.2,Math.min(3,source.size??1)):.4,active:true});
 }
 function step(ship:ShipState,air:LandingAir,terrain:TerrainData,dt:number,time:number){
  if(!(dt>0)||dt>.1||!Number.isFinite(time))return;
  if(time<lastTime)reset();lastTime=time;
  tracers.step(air,terrain,dt,time);
  for(const p of pool){if(!p.active)continue;p.age+=dt;if(p.age>=p.life){p.active=false;continue;}
   const a=air.sample(p.x,p.y,time),mix=1-Math.exp(-dt*1.4);
   if(a.density>0){p.vx+=(a.vx-p.vx)*mix;p.vy*=1-mix;}
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   if(p.y<=getTerrainHeight(terrain,p.x))p.active=false;
  }
  if(!ship.thrustFiring){emission=0;return;}
  const power=Math.min(1,ship.thrustVisualLevel);
  // Faster air stretches plumes: fill their gaps without increasing the pool.
  const stretch=weather?Math.min(24,Math.abs(air.sample(ship.x,ship.y,time).vx)*.2):0;
  emission+=dt*Math.min(48,12+30*power+stretch);
  while(emission>=1){emission--;for(const [lx,ly]of ENGINE_PODS){
   const [x,y]=localToWorld(lx,ly,ship.x,ship.y,ship.angle,ship.facingSign),dx=-Math.sin(ship.renderGimbalAngle),dy=-Math.cos(ship.renderGimbalAngle);
   emitSmoke({x:x+dx*1.35,y:y+dy*1.35,vx:ship.vx+dx*(8+16*power),vy:ship.vy+dy*(8+16*power)},air,time);
  }}
 }
 function sprite(body:BodyDef){
  const color=(body.atmosphere?.color??body.color).map(c=>Math.round(90+c*.35)).join(',');
  if(cloud&&cloudColor===color)return cloud;
  cloudColor=color;cloud=document.createElement('canvas');cloud.width=256;cloud.height=96;
  const c=cloud.getContext('2d');if(!c)return undefined;
  // Soft overlapping lobes, not noise dots/grain. One small reusable raster.
  for(let i=0;i<7;i++){
   const x=52+i*25,y=48+Math.sin(i*2.1)*14; // Transparent gutters prevent clipped cloud ends.
   c.save();c.translate(x,y);c.scale(1.7,.85);const g=c.createRadialGradient(0,0,0,0,0,29);
   g.addColorStop(0,`rgba(${color},.33)`);g.addColorStop(.5,`rgba(${color},.16)`);g.addColorStop(1,`rgba(${color},0)`);
   c.fillStyle=g;c.fillRect(-30,-30,60,60);c.restore();
  }return cloud;
 }
 function drawClouds(ctx:CanvasRenderingContext2D,cam:Camera,body:BodyDef,id:string,gateX:number,dir:1|-1,time:number,W:number,H:number,height:(x:number)=>number,low=false){
  if(!body.atmosphere||!(cam.zoom>0))return;
  const image=sprite(body);if(!image)return;
  ctx.save();try{
   // Actual airspace only, including the upper atmosphere boundary.
   ctx.beginPath();ctx.rect(0,Math.max(0,H/2-(body.atmosphere.height-cam.y)*cam.zoom),W,H);ctx.clip();
   // Fixed screen sampling only clips, never seeds clouds.
   ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);
   for(let px=W;px>=0;px-=8){const x=cam.x+(px-W/2)/cam.zoom;ctx.lineTo(px,H/2-(height(x)-cam.y)*cam.zoom);}ctx.closePath();ctx.clip();
   const seed=weatherSeed(weather?.id??id),drift=weather?.advection(time)??regionalAdvection(id,time),span=W/cam.zoom;
   const flowDir=weather?1:dir,cover=weather?.cover(time)??.72;
   for(let layer=0;layer<3;layer++){
    const spacing=2400,depth=1-layer*.16,canonicalCam=(cam.x-gateX)*flowDir;
    const lo=Math.floor((canonicalCam-span/depth/2-drift)/spacing)-1,hi=Math.ceil((canonicalCam+span/depth/2-drift)/spacing)+1;
    const stride=Math.max(1,Math.ceil((hi-lo)/(low?6:12)));
    for(let cell=Math.ceil(lo/stride)*stride;cell<=hi;cell+=stride){
     const r=weatherRandom(seed+layer*71,cell),shape=weatherRandom(seed+layer*71+19,cell);
     if(r<1-(weather?.climate.cloudCover??.72))continue;
     const world=gateX+flowDir*(cell*spacing+drift+r*spacing);
     const base=weather?weather.altitude+weather.climate.cloudBase:1800,depthY=weather?.climate.cloudDepth??2200;
     const altitude=Math.min(body.atmosphere.height*.9,base+layer*depthY+(shape-.5)*depthY*.6);
     const x=W/2+(world-cam.x)*cam.zoom*depth,y=H/2-(altitude-cam.y)*cam.zoom;
     const w=(1400+shape*2400)*cam.zoom*depth,h=(450+r*650)*cam.zoom;
     ctx.save();ctx.translate(x,y);ctx.rotate((shape-.5)*.08);ctx.scale(shape<.5?-1:1,1);
     ctx.globalAlpha=weather ? .25+cover*.5 : .45;ctx.drawImage(image,-w/2,-h/2,w,h);ctx.restore();
    }
   }
  }finally{ctx.restore();}
 }
 function drawLanding(ctx:CanvasRenderingContext2D,cam:Camera,terrain:TerrainData,air:LandingAir,id:string,time:number,absoluteTime:number,W:number,H:number,low=false){
  const sx=(x:number)=>W/2+(x-cam.x)*cam.zoom,sy=(y:number)=>H/2-(y-cam.y)*cam.zoom;
  ctx.save();try{
   ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);
   const points=terrainSurfacePoints(terrain,cam.x-W/(2*cam.zoom)-2,cam.x+W/(2*cam.zoom)+2);
   for(let i=points.length-1;i>=0;i--)ctx.lineTo(sx(points[i][0]),sy(points[i][1]));ctx.closePath();ctx.clip();
   // Separate exclusion clips preserve overlapping solids, unlike XORing all buildings together.
   for(const solid of terrain.surfaceSite?.solids??[]){ctx.beginPath();ctx.rect(0,0,W,H);solid.points.forEach(([x,y],i)=>i?ctx.lineTo(sx(x),sy(y)):ctx.moveTo(sx(x),sy(y)));ctx.closePath();ctx.clip('evenodd');}
   // Floating structures exclude only their actual geometry, never the whole air column.
   const layout=weather?.layout;
   if(layout?.kind==='cloud-city'){
    const rect=(x:number,y:number,w:number,h:number)=>{ctx.beginPath();ctx.rect(0,0,W,H);ctx.rect(sx(x),sy(y),w*cam.zoom,h*cam.zoom);ctx.clip('evenodd');};
    rect(layout.deckLeft,layout.deckY,layout.deckRight-layout.deckLeft,layout.deckThickness);
    for(const x of layout.supportXs)rect(x-layout.supportWidth/2,layout.deckY,layout.supportWidth,layout.supportHeight);
    for(const d of layout.domes){ctx.beginPath();ctx.rect(0,0,W,H);ctx.moveTo(sx(d.x-d.radius),sy(layout.deckY));ctx.ellipse(sx(d.x),sy(layout.deckY),d.radius*cam.zoom,d.height*cam.zoom,0,Math.PI,0);ctx.closePath();ctx.clip('evenodd');}
   }
   if(weather)drawClouds(ctx,cam,weather.body,id,terrain.pad.centerX,1,absoluteTime,W,H,x=>getTerrainHeight(terrain,x),low);
   const seed=weatherSeed(weather?.id??id),drift=weather?.advection(absoluteTime)??regionalAdvection(id,absoluteTime),left=cam.x-W/(2*cam.zoom),right=cam.x+W/(2*cam.zoom);
   const start=Math.floor(left/80)-1,end=Math.ceil(right/80),stride=Math.max(1,Math.ceil((end-start)/(low?10:24)));
   ctx.strokeStyle='rgba(161,158,143,.18)';ctx.lineWidth=1;
   for(let i=Math.ceil(start/stride)*stride;i<=end;i+=stride){
    const y=terrain.pad.y+12+weatherRandom(seed,i)*150,w=air.sample(i*80+40,y,time).vx;
    if(Math.abs(w)<.01)continue;
    const regional=weather?.wind(absoluteTime)??regionalWind(id,absoluteTime);
    const phase=drift*(Math.abs(regional)>.01?w/regional:1)/80+weatherRandom(seed+1,i),u=((phase%1)+1)%1,x=i*80+u*80;
    ctx.globalAlpha=Math.sin(Math.PI*u);
    ctx.beginPath();ctx.moveTo(sx(x),sy(y));ctx.quadraticCurveTo(sx(x+w*.35),sy(y+1),sx(x+w*.8),sy(y));ctx.stroke();
   }
   ctx.globalAlpha=1;
   tracers.draw(ctx,cam,W,H,low,air,time);
   for(let i=0;i<pool.length;i++){const p=pool[i];if(!p.active||(low&&i%2))continue;
    const age=p.age/p.life,r=(.35+p.age*1.5)*p.radius*cam.zoom,x=sx(p.x),y=sy(p.y);
    if(x+r<0||x-r>W||y+r<0||y-r>H)continue;
    if(!smoke){smoke=document.createElement('canvas');smoke.width=smoke.height=64;const c=smoke.getContext('2d');if(c){const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(152,145,132,.8)');g.addColorStop(.4,'rgba(152,145,132,.5)');g.addColorStop(1,'rgba(152,145,132,0)');c.fillStyle=g;c.fillRect(0,0,64,64);}}
    ctx.globalAlpha=.20*Math.sin(Math.PI*age);ctx.drawImage(smoke,x-r,y-r*.7,2*r,1.4*r);
   }
  }finally{ctx.restore();}
 }
 return{reset,step,emitSmoke,drawClouds,drawLanding,tracerSnapshot:tracers.snapshot,diagnostics:()=>({active:pool.filter(p=>p.active).length,capacity:PARTICLE_CAP,tracers:tracers.diagnostics(),cloudPixels:cloud?cloud.width*cloud.height:0,smokePixels:smoke?smoke.width*smoke.height:0}),snapshot:()=>pool.filter(p=>p.active).map(p=>({...p}))};
}
