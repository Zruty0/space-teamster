// Pilot air velocities are m/s. Never interpret approach acceleration layers as velocity.
import type { BodyDef } from './world';
export interface AirSample { vx:number; density:number; }
export interface LandingAir { sample(x:number,y:number,time:number):AirSample; }
export function weatherSeed(id:string){let h=2166136261;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function weatherRandom(seed:number,index:number){let h=seed^Math.imul(index,374761393);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
/** One permanent regional wind orientation, slow absolute-clock gusts; no RNG state. */
export function regionalWind(id:string,seconds:number):number{
 const seed=weatherSeed(id),phase=weatherRandom(seed,1)*Math.PI*2,sign=weatherRandom(seed,2)<.5?-1:1;
 return sign*(12+3*Math.sin(seconds*.17+phase)+2*Math.sin(seconds*.043+phase*2));
}
/** Analytic integral of the regional flow, for frame-independent cloud/streak advection. */
export function regionalAdvection(id:string,seconds:number):number{
 const seed=weatherSeed(id),phase=weatherRandom(seed,1)*Math.PI*2,sign=weatherRandom(seed,2)<.5?-1:1;
 return sign*(12*seconds-3/.17*Math.cos(seconds*.17+phase)-2/.043*Math.cos(seconds*.043+phase*2));
}
export function createLandingAir(body:BodyDef,poiId:string,epoch:number,ground:(x:number)=>number,wind=true):LandingAir{
 return {sample(x,y,time){
  const a=body.atmosphere;if(!a||y>=a.height)return{vx:0,density:0};
  const density=a.surfaceDensity*Math.exp(-Math.max(0,y)/a.scaleHeight);
  const shelter=.45+.55*(1-Math.exp(-Math.max(0,y-ground(x))/40));
  return{vx:wind?regionalWind(poiId,epoch+time)*shelter:0,density};
 }};
}
export interface AeroForce {ax:number;ay:number;windX:number;windAX:number;windAY:number;}
export function landingAerodynamics(vx:number,vy:number,x:number,y:number,time:number,drag:number,air:LandingAir):AeroForce{
 const sample=air.sample(x,y,time);
 // Pilot tuned to Hartwell's thin air. Cap only the wind increment, not baseline drag.
 const coefficient=drag*Math.min(3,Math.max(0,sample.density/.18));
 const speed=Math.hypot(vx,vy),relativeX=vx-sample.vx,relativeSpeed=Math.hypot(relativeX,vy);
 const baseX=-vx*speed*coefficient,baseY=-vy*speed*coefficient;
 const deltaX=-relativeX*relativeSpeed*coefficient-baseX,deltaY=-vy*relativeSpeed*coefficient-baseY;
 const norm=Math.hypot(deltaX,deltaY),scale=norm>.35?.35/norm:1;
 return{ax:baseX+deltaX*scale,ay:baseY+deltaY*scale,windX:sample.vx,windAX:deltaX*scale,windAY:deltaY*scale};
}
/** Ground-relative zero-velocity target, with disturbance feed-forward. Not position lock. */
export function landingSasForce(vx:number,vy:number,authority:number,aero:AeroForce){
 // Reserve authority for wind rejection before velocity damping. A hard climb must
 // not starve lateral wind correction. Ordinary drag helps stop motion; don't cancel it.
 const disturbance=Math.hypot(aero.windAX,aero.windAY),feedScale=disturbance>authority?authority/disturbance:1;
 const fx=-aero.windAX*feedScale,fy=-aero.windAY*feedScale,remaining=Math.max(0,authority-Math.hypot(fx,fy));
 const ax=-vx*1.5,ay=-vy*1.5,n=Math.hypot(ax,ay),scale=n>remaining?remaining/n:1;
 return{ax:fx+ax*scale,ay:fy+ay*scale};
}
