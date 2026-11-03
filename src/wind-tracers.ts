// Sparse airborne tracers, not terrain decoration. World-space fixed-tick motion;
// camera and quality never participate in emission or advection.
import { weatherSeed, weatherRandom, type LandingAir } from './landing-air';
import { getTerrainHeight, type TerrainData } from './terrain';
import { pointHitsSite } from './surface-site';
export const WIND_TRACER_CAP=512;
/** Linear ambient density up to 40 m/s; bounded even in extreme weather. */
export function windTracerTarget(speed:number){return Number.isFinite(speed)?Math.ceil(WIND_TRACER_CAP*Math.min(1,Math.max(0,speed)/40)):0;}
type Tracer={id:number;x:number;y:number;vx:number;vy:number;age:number;life:number;active:boolean;generation:number};
export function createWindTracers(regionId:string){
 const seed=weatherSeed(`wind-tracers-v1:${regionId}`);
 const pool:Tracer[]=Array.from({length:WIND_TRACER_CAP},(_,id)=>({id,x:0,y:0,vx:0,vy:0,age:0,life:1,active:false,generation:0}));
 function reset(){for(const p of pool){p.active=false;p.generation=0;}}
 function step(air:LandingAir,terrain:TerrainData,dt:number,time:number){
  if(!(dt>0)||dt>.1||!Number.isFinite(time))return;
  const left=terrain.startX-200,right=terrain.startX+(terrain.points.length-1)*terrain.spacing+200;
  for(let i=0;i<pool.length;i++){
   const p=pool[i];
   // Dormant candidates keep their seeded lifetime/position, rather than being
   // rerolled every tick until they find a strong cell (which biases density).
   if(p.generation===0||p.age>=p.life){
    const key=i+p.generation++*WIND_TRACER_CAP,r=weatherRandom(seed,key);
    p.x=left+r*(right-left);p.y=Math.max(terrain.pad.y,getTerrainHeight(terrain,p.x))+8+weatherRandom(seed+1,key)*220;
    // Renew often enough that spatial eddies cannot drain the visible field
    // into stagnant pockets for tens of seconds.
    p.age=0;p.life=2+weatherRandom(seed+2,key)*3;p.active=true;
   }
   const wind=air.sample(p.x,p.y,time);p.vx=wind.vx;p.vy=wind.vy??0;
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.age+=dt;
   p.active=wind.density>0&&i<windTracerTarget(Math.hypot(p.vx,p.vy));
   if(wind.density<=0||p.age>=p.life||p.x<left||p.x>right||p.y<=getTerrainHeight(terrain,p.x)||(terrain.surfaceSite&&pointHitsSite(terrain.surfaceSite,p.x,p.y))){p.active=false;p.age=p.life;}
  }
 }
 function draw(ctx:CanvasRenderingContext2D,cam:{x:number;y:number;zoom:number},W:number,H:number,low:boolean,air:LandingAir,time:number){
  ctx.save();ctx.lineCap='round';
  for(let i=0;i<pool.length;i++){
   const p=pool[i];if(!p.active||(low&&i%2))continue;
   const a=air.sample(p.x,p.y,time),vy=a.vy??0,speed=Math.hypot(a.vx,vy);if(a.density<=0||speed<.05||i>=windTracerTarget(speed))continue;
   const x=W/2+(p.x-cam.x)*cam.zoom,y=H/2-(p.y-cam.y)*cam.zoom;
   if(x< -8||x>W+8||y< -2||y>H+2)continue;
   const alpha=Math.min(1,p.age/.3,(p.life-p.age)/.5,speed/2),dx=a.vx/speed,dy=-vy/speed;
   const length=Math.max(1.5,Math.min(10,speed*.16*cam.zoom));
   ctx.globalAlpha=alpha;ctx.strokeStyle='rgba(165,157,137,.36)';ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(x-dx*length,y-dy*length);ctx.lineTo(x,y);ctx.stroke();
   ctx.strokeStyle='rgba(200,188,158,.65)';ctx.lineWidth=1.2;
   ctx.beginPath();ctx.moveTo(x-dx*.6,y-dy*.6);ctx.lineTo(x,y);ctx.stroke();
  }
  ctx.restore();
 }
 return{reset,step,draw,diagnostics:()=>({active:pool.filter(p=>p.active).length,capacity:WIND_TRACER_CAP}),snapshot:()=>pool.filter(p=>p.active).map(p=>({...p}))};
}
