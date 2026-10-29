// Save-free, opt-in atmospheric presentation. All emission advances at physics ticks,
// never in draw; quality only thins paint, not weather or forces.
import { ENGINE_PODS, localToWorld, type ShipState } from './ship';
import { terrainSurfacePoints, getTerrainHeight, type TerrainData } from './terrain';
import { regionalAdvection, regionalWind, weatherSeed, weatherRandom, type LandingAir } from './landing-air';
import type { BodyDef } from './world';
import type { InputState } from './input';
export const PARTICLE_CAP=256;
export const NEUTRAL_FLIGHT_INPUT:InputState={pitch:0,throttleUp:false,throttleDown:false,stopAssist:false,killRotation:false,moveUp:false,moveDown:false,moveLeft:false,moveRight:false,rotateLeft:false,rotateRight:false,shiftHeld:false,setHoverThrottle:false,toggleGear:false,reset:false,toggleDevPanel:false,levelSelect:false,levelPick:0,menuUp:false,menuDown:false,menuLeft:false,menuRight:false,menuConfirm:false,pageUp:false,pageDown:false,continueAction:false,toggleWings:false,wingAngleUp:false,wingAngleDown:false,toggleSAS:false,warpUp:false,warpDown:false,toggleHighThrust:false};
type Camera={x:number;y:number;zoom:number};
type Puff={x:number;y:number;vx:number;vy:number;age:number;life:number;radius:number;active:boolean};
export interface AtmosphericPilot {visuals:boolean;wind:boolean;low:boolean;effects:ReturnType<typeof createFlightAtmosphere>;input?:InputState;}
export interface LandingAtmosphereView {pilot:AtmosphericPilot;air:LandingAir;physicsAir?:LandingAir;epoch:number;}
export function createFlightAtmosphere(){
 const pool:Puff[]=Array.from({length:PARTICLE_CAP},()=>({x:0,y:0,vx:0,vy:0,age:0,life:1,radius:1,active:false}));
 let cursor=0,serial=0,emission=0,lastTime=-Infinity,cloud:HTMLCanvasElement|undefined,smoke:HTMLCanvasElement|undefined,cloudColor='';
 function reset(){for(const p of pool)p.active=false;cursor=serial=emission=0;lastTime=-Infinity;}
 function step(ship:ShipState,air:LandingAir,terrain:TerrainData,dt:number,time:number){
  if(!(dt>0)||dt>.1||!Number.isFinite(time))return;
  if(time<lastTime)reset();lastTime=time;
  for(const p of pool){if(!p.active)continue;p.age+=dt;if(p.age>=p.life){p.active=false;continue;}
   const a=air.sample(p.x,p.y,time),mix=1-Math.exp(-dt*1.4);
   if(a.density>0){p.vx+=(a.vx-p.vx)*mix;p.vy*=1-mix;}
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   if(p.y<=getTerrainHeight(terrain,p.x))p.active=false;
  }
  if(!ship.thrustFiring){emission=0;return;}
  const power=Math.min(1,ship.thrustVisualLevel);emission+=dt*(12+30*power);
  while(emission>=1){emission--;for(const [lx,ly]of ENGINE_PODS){
   const [x,y]=localToWorld(lx,ly,ship.x,ship.y,ship.angle,ship.facingSign),dx=-Math.sin(ship.renderGimbalAngle),dy=-Math.cos(ship.renderGimbalAngle);
   const p=pool[cursor];cursor=(cursor+1)%PARTICLE_CAP;const r=weatherRandom(9137,serial++),atmo=air.sample(x,y,time).density>0;
   Object.assign(p,{x:x+dx*1.35,y:y+dy*1.35,vx:ship.vx+dx*(8+16*power)+(r-.5)*2,vy:ship.vy+dy*(8+16*power),age:0,life:atmo?2.2+r*.4:.25+r*.1,radius:atmo?1:.4,active:true});
  }}
 }
 function sprite(body:BodyDef){
  const color=(body.atmosphere?.color??body.color).map(c=>Math.round(90+c*.35)).join(',');
  if(cloud&&cloudColor===color)return cloud;
  cloudColor=color;cloud=document.createElement('canvas');cloud.width=256;cloud.height=96;
  const c=cloud.getContext('2d');if(!c)return undefined;
  // Soft overlapping lobes, not noise dots/grain. One small reusable raster.
  for(let i=0;i<7;i++){
   const x=30+i*32,y=48+Math.sin(i*2.1)*14;
   c.save();c.translate(x,y);c.scale(1.7,.85);const g=c.createRadialGradient(0,0,0,0,0,29);
   g.addColorStop(0,`rgba(${color},.33)`);g.addColorStop(.5,`rgba(${color},.16)`);g.addColorStop(1,`rgba(${color},0)`);
   c.fillStyle=g;c.fillRect(-30,-30,60,60);c.restore();
  }return cloud;
 }
 function drawClouds(ctx:CanvasRenderingContext2D,cam:Camera,body:BodyDef,id:string,gateX:number,dir:1|-1,time:number,W:number,H:number,height:(x:number)=>number,low=false){
  if(!body.atmosphere||!(cam.zoom>0))return;
  const image=sprite(body);if(!image)return;
  ctx.save();try{
   // Actual airspace: no clouds through the surface. Fixed screen sampling only clips, never seeds clouds.
   ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);
   for(let px=W;px>=0;px-=8){const x=cam.x+(px-W/2)/cam.zoom;ctx.lineTo(px,H/2-(height(x)-cam.y)*cam.zoom);}ctx.closePath();ctx.clip();
   const seed=weatherSeed(id),drift=regionalAdvection(id,time),span=W/cam.zoom;
   for(let layer=0;layer<3;layer++){
    const spacing=2400,depth=1-layer*.16,canonicalCam=(cam.x-gateX)*dir;
    const lo=Math.floor((canonicalCam-span/depth/2-drift)/spacing)-1,hi=Math.ceil((canonicalCam+span/depth/2-drift)/spacing)+1;
    const stride=Math.max(1,Math.ceil((hi-lo)/(low?6:12)));
    for(let cell=Math.ceil(lo/stride)*stride;cell<=hi;cell+=stride){
     const r=weatherRandom(seed+layer*71,cell),shape=weatherRandom(seed+layer*71+19,cell);
     if(r<.28)continue;
     const world=gateX+dir*(cell*spacing+drift+r*spacing);
     const altitude=Math.min(body.atmosphere.height*.8,1800+layer*2200+(shape-.5)*2200);
     const x=W/2+(world-cam.x)*cam.zoom*depth,y=H/2-(altitude-cam.y)*cam.zoom;
     const w=(1400+shape*2400)*cam.zoom*depth,h=(450+r*650)*cam.zoom;
     ctx.save();ctx.translate(x,y);ctx.rotate((shape-.5)*.08);ctx.scale(shape<.5?-1:1,1);
     ctx.globalAlpha=.45;ctx.drawImage(image,-w/2,-h/2,w,h);ctx.restore();
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
   const seed=weatherSeed(id),drift=regionalAdvection(id,absoluteTime),left=cam.x-W/(2*cam.zoom),right=cam.x+W/(2*cam.zoom);
   const start=Math.floor(left/80)-1,end=Math.ceil(right/80),stride=Math.max(1,Math.ceil((end-start)/(low?10:24)));
   ctx.strokeStyle='rgba(161,158,143,.18)';ctx.lineWidth=1;
   for(let i=Math.ceil(start/stride)*stride;i<=end;i+=stride){
    const y=terrain.pad.y+12+weatherRandom(seed,i)*150,w=air.sample(i*80+40,y,time).vx;
    if(Math.abs(w)<.01)continue;
    const phase=drift*w/regionalWind(id,absoluteTime)/80+weatherRandom(seed+1,i),u=((phase%1)+1)%1,x=i*80+u*80;
    ctx.globalAlpha=Math.sin(Math.PI*u);
    ctx.beginPath();ctx.moveTo(sx(x),sy(y));ctx.quadraticCurveTo(sx(x+w*.35),sy(y+1),sx(x+w*.8),sy(y));ctx.stroke();
   }
   ctx.globalAlpha=1;
   for(let i=0;i<pool.length;i++){const p=pool[i];if(!p.active||(low&&i%2))continue;
    const age=p.age/p.life,r=(.35+p.age*1.5)*p.radius*cam.zoom,x=sx(p.x),y=sy(p.y);
    if(x+r<0||x-r>W||y+r<0||y-r>H)continue;
    if(!smoke){smoke=document.createElement('canvas');smoke.width=smoke.height=64;const c=smoke.getContext('2d');if(c){const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(152,145,132,.8)');g.addColorStop(.4,'rgba(152,145,132,.5)');g.addColorStop(1,'rgba(152,145,132,0)');c.fillStyle=g;c.fillRect(0,0,64,64);}}
    ctx.globalAlpha=.20*Math.sin(Math.PI*age);ctx.drawImage(smoke,x-r,y-r*.7,2*r,1.4*r);
   }
  }finally{ctx.restore();}
 }
 return{reset,step,drawClouds,drawLanding,diagnostics:()=>({active:pool.filter(p=>p.active).length,capacity:PARTICLE_CAP,cloudPixels:cloud?cloud.width*cloud.height:0,smokePixels:smoke?smoke.width*smoke.height:0}),snapshot:()=>pool.filter(p=>p.active).map(p=>({...p}))};
}
