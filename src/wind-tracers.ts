// Sparse airborne tracers, not terrain decoration. World-space fixed-tick motion;
// camera and quality never participate in emission or advection.
import { weatherSeed, weatherRandom, type LandingAir } from './landing-air';
import { getTerrainHeight, type TerrainData } from './terrain';
import { pointHitsSite } from './surface-site';
export const WIND_TRACER_CAP=128;
type Tracer={id:number;x:number;y:number;vx:number;age:number;life:number;active:boolean;generation:number};
export function createWindTracers(regionId:string){
 const seed=weatherSeed(`wind-tracers-v1:${regionId}`);
 const pool:Tracer[]=Array.from({length:WIND_TRACER_CAP},(_,id)=>({id,x:0,y:0,vx:0,age:0,life:1,active:false,generation:0}));
 function reset(){for(const p of pool){p.active=false;p.generation=0;}}
 function step(air:LandingAir,terrain:TerrainData,dt:number,time:number){
  if(!(dt>0)||dt>.1||!Number.isFinite(time))return;
  const left=terrain.startX-200,right=terrain.startX+(terrain.points.length-1)*terrain.spacing+200;
  for(let i=0;i<pool.length;i++){
   const p=pool[i];
   if(!p.active){
    const key=i+p.generation++*WIND_TRACER_CAP,r=weatherRandom(seed,key);
    p.x=left+r*(right-left);p.y=Math.max(terrain.pad.y,getTerrainHeight(terrain,p.x))+8+weatherRandom(seed+1,key)*220;
    p.age=0;p.life=12+weatherRandom(seed+2,key)*16;p.active=true;
   }
   const wind=air.sample(p.x,p.y,time);p.vx=wind.vx;
   p.x+=p.vx*dt;p.age+=dt;
   if(wind.density<=0||p.age>=p.life||p.x<left||p.x>right||p.y<=getTerrainHeight(terrain,p.x)||(terrain.surfaceSite&&pointHitsSite(terrain.surfaceSite,p.x,p.y)))p.active=false;
  }
 }
 function draw(ctx:CanvasRenderingContext2D,cam:{x:number;y:number;zoom:number},W:number,H:number,low:boolean,air:LandingAir,time:number){
  ctx.save();ctx.lineCap='round';
  for(let i=0;i<pool.length;i++){
   const p=pool[i];if(!p.active||(low&&i%2))continue;
   const a=air.sample(p.x,p.y,time),wind=a.vx;if(a.density<=0||Math.abs(wind)<.05)continue;
   const x=W/2+(p.x-cam.x)*cam.zoom,y=H/2-(p.y-cam.y)*cam.zoom;
   if(x< -8||x>W+8||y< -2||y>H+2)continue;
   const alpha=Math.min(1,p.age/1.5,(p.life-p.age)/2,Math.abs(wind)/2),direction=Math.sign(wind);
   const length=Math.max(1.5,Math.min(6,Math.abs(wind)*.10*cam.zoom));
   ctx.globalAlpha=alpha;ctx.strokeStyle='rgba(165,157,137,.28)';ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(x-direction*length,y);ctx.lineTo(x,y);ctx.stroke();
   ctx.strokeStyle='rgba(200,188,158,.65)';ctx.lineWidth=1.2;
   ctx.beginPath();ctx.moveTo(x-direction*.6,y);ctx.lineTo(x,y);ctx.stroke();
  }
  ctx.restore();
 }
 return{reset,step,draw,diagnostics:()=>({active:pool.filter(p=>p.active).length,capacity:WIND_TRACER_CAP}),snapshot:()=>pool.filter(p=>p.active).map(p=>({...p}))};
}
