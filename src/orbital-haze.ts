// Orbital presentation only. Same exponential density profile as the atmosphere;
// bounded optical opacity, with a smooth fade to the authored atmosphere edge.
import type { BodyDef } from './world';
type Atmosphere=BodyDef['atmosphere'];
export function orbitalHazeOpacity(atmosphere:Atmosphere,altitude:number):number {
 if(!atmosphere||![altitude,atmosphere.height,atmosphere.surfaceDensity,atmosphere.scaleHeight].every(Number.isFinite)||atmosphere.height<=0||atmosphere.scaleHeight<=0||atmosphere.surfaceDensity<=0||altitude<0||altitude>=atmosphere.height)return 0;
 const rho=atmosphere.surfaceDensity*Math.exp(-altitude/atmosphere.scaleHeight);
 const edge=1-altitude/atmosphere.height;
 return .65*(-Math.expm1(-rho*.65))*edge*edge;
}
/** Paint beneath the globe. Giants underlap their existing soft limb; solid worlds use an annulus. */
export function drawOrbitalHaze(ctx:CanvasRenderingContext2D,cx:number,cy:number,radius:number,planetRadius:number,atmosphere:Atmosphere,W:number,H:number,softLimb=false):boolean {
 if(!atmosphere||![cx,cy,radius,planetRadius,W,H,...atmosphere.color].every(Number.isFinite)||radius<6||planetRadius<=0||W<=0||H<=0||orbitalHazeOpacity(atmosphere,0)<=0)return false;
 const inner=softLimb?radius*.94:radius,outer=radius*(1+atmosphere.height/planetRadius);
 if(!Number.isFinite(outer)||outer-radius<.5)return false;
 // No allocation for offscreen rings or a viewport entirely beneath the surface.
 const near=Math.hypot(Math.max(0,-cx,cx-W),Math.max(0,-cy,cy-H));
 const far=Math.hypot(Math.max(Math.abs(cx),Math.abs(W-cx)),Math.max(Math.abs(cy),Math.abs(H-cy)));
 if(near>=outer||far<=inner)return false;
 const color=atmosphere.color.map(v=>Math.max(0,Math.min(255,Math.round(v)))).join(',');
 ctx.save();try{
  const gradient=ctx.createRadialGradient(cx,cy,inner,cx,cy,outer);
  if(softLimb)gradient.addColorStop(0,`rgba(${color},${orbitalHazeOpacity(atmosphere,0)})`);
  // Squared spacing resolves thin, dense lower layers without adding canvases/caches.
  for(let i=0;i<=24;i++){const u=(i/24)**2;gradient.addColorStop(Math.min(1,Math.max(0,(radius-inner+u*(outer-radius))/(outer-inner))),`rgba(${color},${orbitalHazeOpacity(atmosphere,u*atmosphere.height)})`);}
  ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(cx,cy,outer,0,Math.PI*2);ctx.arc(cx,cy,inner,0,Math.PI*2,true);ctx.fill('evenodd');
 }finally{ctx.restore();}
 return true;
}
