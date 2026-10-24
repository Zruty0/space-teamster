// Stable airless crater terrain plus a static molten Eye. +X is sunward in
// authored coordinates; only the existing visit/system orientation rotates it.
import { crateredWorldProfile } from './cratered-world-geometry';
import { drawCrateredDisc } from './world-disc-appearance';
type Point=readonly[number,number];
export const BALOR_EYE_ARC=Math.PI/6;
const HALF_ARC=BALOR_EYE_ARC/2,SHORE_X=Math.cos(HALF_ARC),EYE_HEIGHT=Math.sin(HALF_ARC);
export const BALOR_CRATER_PROFILE=crateredWorldProfile('estella-i',{craterCount:68,craterScale:.88,basinCoverage:.8,reliefContrast:1.15});
export const BALOR_ROCK_TINT=Object.freeze([109,101,94]as const);
/** Same ±15° limb endpoints; deeper central shoreline, not a wider surface arc. */
export function balorShoreX(y:number):number{
  if(!Number.isFinite(y)||Math.abs(y)>EYE_HEIGHT)return 1.1;
  const v=y/EYE_HEIGHT,envelope=Math.pow(Math.max(0,1-v*v),1.3);
  return SHORE_X-.14*envelope+envelope*(.004*Math.sin(v*11+.4)+.002*Math.sin(v*31-.8));
}
const freeze=(points:Point[])=>Object.freeze(points.map(p=>Object.freeze(p)));
const SHORE=freeze(Array.from({length:81},(_,i)=>{const y=EYE_HEIGHT*(-1+2*i/80);return[balorShoreX(y),y];}));
function tendril(startY:number,endX:number,endY:number,width:number,bend:number,phase:number,scale=1):readonly Point[]{
  const edge=(side:number)=>Array.from({length:41},(_,i):Point=>{
    const u=i/40,x=.92+u*(endX-.92);
    const mid=startY+(endY-startY)*u+bend*Math.sin(u*Math.PI)+.007*Math.sin(u*15+phase)*Math.sin(u*Math.PI);
    const spread=width*Math.pow(1-u,.85)*scale;
    const limit=Math.min(EYE_HEIGHT*.98,x*Math.tan(HALF_ARC)*.96);
    return[x,Math.max(-limit,Math.min(limit,mid+side*spread))];
  });
  return freeze([...edge(-1),...edge(1).reverse()]);
}
const specs:readonly(readonly[number,number,number,number,number,number])[]=[[-.16,.65,-.11,.022,.015,1],[-.08,.52,-.035,.028,-.026,2],[.02,.62,.10,.024,.02,3],[.12,.72,.16,.018,-.018,4]];
export const BALOR_EYE_TENDRILS=Object.freeze(specs.map(s=>tendril(...s)));
const CORES=Object.freeze(specs.map(s=>tendril(...s,.28)));
const CRUST=Object.freeze([[.91,-.09,.012,.019],[.94,.07,.008,.027],[.88,.025,.008,.01]].map(([x,y,rx,ry],phase)=>freeze(Array.from({length:17},(_,i):Point=>{
  const a=i/17*Math.PI*2,r=1+.18*Math.sin(a*3+phase)+.1*Math.cos(a*5-phase);
  return[x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r];
}))));
function trace(ctx:CanvasRenderingContext2D,points:readonly Point[],inset=0){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x+inset,y):ctx.moveTo(x+inset,y));}
function cap(ctx:CanvasRenderingContext2D,inset=0){trace(ctx,SHORE,inset);ctx.lineTo(1.1,EYE_HEIGHT);ctx.lineTo(1.1,-EYE_HEIGHT);ctx.closePath();}
export function drawBalorDisc(ctx:CanvasRenderingContext2D,cx:number,cy:number,radius:number,eyeAngle:number):void{
  if(!(radius>0)||![cx,cy,radius,eyeAngle].every(Number.isFinite))return;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(-eyeAngle);
  // Same crater/basin renderer and nested LOD as the other airless worlds.
  drawCrateredDisc(ctx,0,0,radius,BALOR_ROCK_TINT,BALOR_CRATER_PROFILE);
  ctx.scale(radius,radius);ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.clip();
  // Even glow and tendrils stay inside the ORIGINAL angular wedge and limb.
  ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,1,-HALF_ARC,HALF_ARC);ctx.closePath();ctx.clip();
  const detailed=radius>=14;
  for(const path of BALOR_EYE_TENDRILS){trace(ctx,path);ctx.closePath();ctx.fillStyle=detailed?'#92361f':'#ed8634';ctx.fill();}
  if(detailed){
    const heat=ctx.createLinearGradient(.5,0,1,0);heat.addColorStop(0,'#a3391c');heat.addColorStop(.5,'#ed6e25');heat.addColorStop(1,'#ffc15c');
    for(const path of CORES){trace(ctx,path);ctx.closePath();ctx.fillStyle=heat;ctx.fill();}
  }
  cap(ctx);ctx.fillStyle=detailed?'#8e301d':'#ff9d32';ctx.fill();
  if(detailed){
    trace(ctx,SHORE);ctx.strokeStyle='rgba(225,65,20,.3)';ctx.lineWidth=.008;ctx.stroke();
    cap(ctx,.009);
    const lava=ctx.createRadialGradient(.99,0,.005,.99,0,.27);
    lava.addColorStop(0,'#ffe3a0');lava.addColorStop(.25,'#ffbd4b');lava.addColorStop(.55,'#f97a24');lava.addColorStop(.82,'#c64016');lava.addColorStop(1,'#7d251b');
    ctx.fillStyle=lava;ctx.fill();
    if(radius>=180){ctx.save();cap(ctx,.009);ctx.clip();for(const plate of CRUST){trace(ctx,plate);ctx.closePath();ctx.fillStyle='#342922';ctx.fill();}ctx.restore();}
  }
  ctx.restore();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.strokeStyle='#6b625c';ctx.lineWidth=radius>=14?1:.75;ctx.stroke();
  if(radius<45){ctx.beginPath();ctx.arc(cx,cy,Math.max(0,radius-.5),-eyeAngle-HALF_ARC,-eyeAngle+HALF_ARC);ctx.strokeStyle='#ffb448';ctx.lineWidth=1;ctx.stroke();}
  ctx.restore();
}
