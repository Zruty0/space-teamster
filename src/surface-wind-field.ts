import { weatherRandom } from './landing-air';
import type { SurfaceClimate } from './surface-weather';
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
/** Permanent regional vector field. Coordinates are metres from the receiving site.
 * Fine, modest surface circulation blends into strong alternating upper-air jets.
 * Time only evolves the pattern slowly; flying through it produces the rapid changes.
 */
export function createSurfaceWindField(seed:number,c:Readonly<SurfaceClimate>){
 const q=Math.max(0,Math.min(1,(c.windLimit-.25)/3.45));
 const p=Array.from({length:6},(_,i)=>weatherRandom(seed,80+i)*Math.PI*2);
 const surfaceScale=380-260*q,upperSpeed=40+45*q+c.gust*.8;
 function sample(x:number,height:number,seconds:number,background:number,approach=false){
  // Approach uses broad, soft shear instead of crossing landing-sized cells at flight speed.
  const scale=approach?3:1,jetSharpness=approach?1.25:2.5;
  const evolution=.18*Math.sin(seconds*2*Math.PI/c.period+p[5]);
  const a=x/(surfaceScale*scale)*Math.PI*2+p[0]+evolution,b=height/(surfaceScale*1.2*scale)*Math.PI*2+p[1];
  const blend=smooth((height-150)/1200),amplitude=c.gust*.8;
  let vx=background*.35+amplitude*(.62*Math.sin(a)*Math.cos(b)+.38*Math.sin(a*.57+b*1.27+p[2]));
  let vy=amplitude*(.55*Math.cos(a)*Math.sin(b)+.25*Math.sin(a*.83-b*1.31+p[3]));
  let buffet=0;
  if(blend>0){
   const layer=height/((650-250*q)*scale)+p[2]+.25*Math.sin(x/(2500*scale)+p[3])+evolution;
   const jet=Math.tanh(jetSharpness*Math.sin(layer));
   let upperX=upperSpeed*(.82*jet+.18*Math.sin(x/(800*scale)+height/(1100*scale)+p[0]));
   let upperY=upperSpeed*.45*Math.sin(x/(650-250*q)+p[4])*Math.cos(height/950+p[1]);
   // Sparse compact shear/vortex pockets. Support stays inside each cell, so
   // changing cells never creates discontinuities or requires neighbor caches.
   const pocketScale=approach?2:1;
   const cellW=(4000-1200*q)*pocketScale,cellH=(2200-600*q)*pocketScale,ix=Math.floor(x/cellW),iy=Math.floor(height/cellH);
   const key=Math.imul(ix,73856093)^Math.imul(iy,19349663);
   const cx=(ix+.3+.4*weatherRandom(seed+11,key))*cellW,cy=(iy+.3+.4*weatherRandom(seed+12,key))*cellH;
   const dx=(x-cx)/(cellW*.15),dy=(height-cy)/(cellH*.14),r2=dx*dx+dy*dy;
   if(r2<1){
    const direction=weatherRandom(seed+13,key)<.5?-1:1,shape=(1-r2)**3;
    upperX-=direction*upperSpeed*dy*shape;
    upperY+=direction*upperSpeed*dx*shape;
    // Signed curl-like doublet: a tangible attitude kick only in the pocket.
    // Ship angle is clockwise from up, opposite the mathematical curl sign.
    buffet=-direction*(.45+1.35*q)*(1-r2)**2*(1-4*r2)*blend*(approach?.5:1);
   }
   vx+=(upperX-vx)*blend;vy+=(upperY-vy)*blend;
  }
  return{vx,vy:approach?0:vy,blend,buffet};
 }
 // Bulk cloud sheets follow the large-scale shear, not individual small eddies.
 // Analytic first-order evolution avoids draw-time integration or frame RNG.
 function cloudAdvection(height:number,seconds:number,backgroundAdvection:number,approach=false){
  const scale=approach?3:1,sharpness=approach?1.25:2.5;
  const blend=smooth((height-150)/1200),layer=height/((650-250*q)*scale)+p[2]+.25*Math.sin(p[3]);
  const jet=Math.tanh(sharpness*Math.sin(layer)),derivative=sharpness*(1-jet*jet)*Math.cos(layer),omega=2*Math.PI/c.period;
  const upper=upperSpeed*.82*(jet*seconds-derivative*.18/omega*Math.cos(omega*seconds+p[5]));
  return backgroundAdvection*.35*(1-blend)+upper*blend;
 }
 return{sample,cloudAdvection};
}
