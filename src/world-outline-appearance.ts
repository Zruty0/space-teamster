// Review-only presentation. Uses the SAME permanent geography as filled art.
// No production caller until visual review. Black occlusion is not colored fill.
import { beginDisc, trace } from './world-disc-primitives';
import { gaiaDiscGeometry } from './world-disc-appearance';
import { crateredWorldGeometry, type Crater } from './cratered-world-geometry';
import { rockyWorldProfileFor } from './content/estella/rocky-world-appearance';
import { icyWorldProfileFor } from './content/estella/icy-world-appearance';
import { icyWorldGeometry } from './icy-world-geometry';
import { gasGiantProfileFor } from './content/estella/gas-giant-appearance';
import { gasGiantGeometry } from './gas-giant-geometry';
import { acheronCloudGeometry } from './acheron-appearance';
import { dahaiGeometry } from './dahai-appearance';
import { hartwellGeometry } from './hartwell-appearance';
import { kuzniaGeometry } from './kuznia-appearance';
import { calatravaGeometry } from './calatrava-appearance';
import { almadenGeometry } from './almaden-appearance';
import { marismaGeometry } from './marisma-appearance';
import { BALOR_CRATER_PROFILE, BALOR_EYE_ARC, balorEyeGeometry } from './balor-appearance';
type Point=readonly[number,number];
type Layer={readonly full:readonly Point[]};
const TAU=Math.PI*2;
export const OUTLINE_INK=Object.freeze({rim:'#6eac8c',land:'#588e74',minor:'#355e4c',water:'#476e79',coast:'#74a7ad',lava:'#c59a58'});
export function hasOutlineWorld(id:string):boolean{
 return !!(rockyWorldProfileFor(id)||icyWorldProfileFor(id)||gasGiantProfileFor(id)||['estella-i','estella-ii','estella-iii','estella-iv','estella-v','estella-vi','estella-xd','estella-xia','estella-xib'].includes(id));
}
/** Normalized sparse stipple, stable across scale/time. Only callers with actual
 * ocean/lava masks use this; pale ice/mineral lowlands do NOT become seas. */
export const LIQUID_DOTS:readonly Point[]=Object.freeze(Array.from({length:169},(_,i):Point=>{
 const row=Math.floor(i/13),col=i%13;
 return Object.freeze([-1+(col+.5)*2/13+.025*Math.sin(i*17.3),-1+(row+.5)*2/13+.025*Math.sin(i*31.7)]);
}).filter(([x,y])=>x*x+y*y<.98));
export function drawOutlineWorld(ctx:CanvasRenderingContext2D,id:string,cx:number,cy:number,r:number,eyeAngle=0,animatedDeck=false):boolean{
 if(!hasOutlineWorld(id)||!Number.isFinite(eyeAngle)||!beginDisc(ctx,cx,cy,r))return false;
 ctx.fillStyle='#000000';ctx.fillRect(-1,-1,2,2);ctx.lineJoin='round';ctx.lineCap='round';
 const width=(px:number)=>Math.min(.25,px/r);
 function line(points:readonly Point[],ink:string=OUTLINE_INK.land,px=1,closed=false){
  if(!points.length)return;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(closed)ctx.closePath();
  ctx.strokeStyle=ink;ctx.lineWidth=width(px);ctx.stroke();
 }
 function region(points:readonly Point[],ink:string=OUTLINE_INK.land,px=1){trace(ctx,points);ctx.fillStyle='#000000';ctx.fill();line(points,ink,px,true);}
 function layers(items:readonly Layer[],ink:string=OUTLINE_INK.land){for(const item of items)region(item.full,ink);}
 function dots(ink:string){if(r<45)return;ctx.fillStyle=ink;for(const [x,y]of LIQUID_DOTS){ctx.beginPath();ctx.arc(x,y,.75/r,0,TAU);ctx.fill();}}
 function craters(items:readonly Crater[]){
  const count=r<14?3:r<60?9:items.length;
  for(const {x,y,r:rad,squash,angle}of items.slice(0,count)){
   if(rad*r<1.15)continue;
   ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(squash,1);
   ctx.beginPath();ctx.arc(0,0,rad,0,TAU);ctx.fillStyle='#000000';ctx.fill();ctx.strokeStyle=OUTLINE_INK.land;ctx.lineWidth=width(.85);ctx.stroke();
   if(rad*r>3){ctx.beginPath();ctx.arc(0,0,rad*.76,-2.8-angle,-.3-angle);ctx.strokeStyle=OUTLINE_INK.minor;ctx.lineWidth=width(.65);ctx.stroke();}
   ctx.restore();
  }
 }
 const rocky=rockyWorldProfileFor(id),icy=icyWorldProfileFor(id),giant=gasGiantProfileFor(id);
 if(rocky){const m=crateredWorldGeometry(rocky);m.basins.forEach(p=>region(p,OUTLINE_INK.minor));craters(m.craters);}
 else if(icy){const m=icyWorldGeometry(icy);m.surface.basins.forEach(p=>region(p,OUTLINE_INK.minor));m.frost.forEach(p=>region(p));craters(m.surface.craters);}
 else if(giant){
  const m=gasGiantGeometry(giant);
  // Shared belt edges once, not doubled outlines of adjacent filled ribbons.
  const budget=r<14?3:r<45?7:64,stride=2**Math.max(0,Math.ceil(Math.log2((m.bands.length-1)/budget)));
  m.bands.slice(1).forEach((b,i)=>{if(i%stride===(stride>1?1:0))line(b.full.slice(0,b.full.length/2),OUTLINE_INK.land,.85);});
  if(r>=60)for(const f of m.filaments)line(f.slice(0,f.length/2),OUTLINE_INK.minor,.65);
  if(r>=14)for(const storm of m.storms){region(storm.outline,OUTLINE_INK.rim);for(const s of storm.swirls)line(s.slice(0,s.length/2),OUTLINE_INK.land,.8);}
 }else if(id==='estella-iii'){
  const m=gaiaDiscGeometry();dots(OUTLINE_INK.water);
  m.land.forEach((p,i)=>{region(p,OUTLINE_INK.coast,1.1);if(r>=60){ctx.save();trace(ctx,p);ctx.clip();line(m.forests[i],OUTLINE_INK.minor,.7,true);ctx.restore();}});
  m.islands.forEach(p=>region(p,OUTLINE_INK.coast,.8));
  m.iceEdges.forEach((edge,i)=>{const sign=i?1:-1;region([...edge,[1.1,sign*1.1],[-1.1,sign*1.1]],OUTLINE_INK.rim,.85);});
 }else if(id==='estella-iv'){
  dots(OUTLINE_INK.water);layers(dahaiGeometry().ice,OUTLINE_INK.coast);
 }else if(id==='estella-i'){
  ctx.save();ctx.rotate(-eyeAngle);const m=crateredWorldGeometry(BALOR_CRATER_PROFILE);
  m.basins.forEach(p=>region(p,OUTLINE_INK.minor));craters(m.craters);
  const h=Math.sin(BALOR_EYE_ARC/2),{shore,crust}=balorEyeGeometry();
  ctx.save();ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,1,-BALOR_EYE_ARC/2,BALOR_EYE_ARC/2);ctx.closePath();ctx.clip();
  trace(ctx,[...shore,[1.1,h],[1.1,-h]]);ctx.fillStyle='#000000';ctx.fill();ctx.save();ctx.clip();dots(OUTLINE_INK.lava);if(r>=180)crust.forEach(p=>region(p,OUTLINE_INK.lava,.7));ctx.restore();line(shore,OUTLINE_INK.lava,1.1);
  ctx.restore();ctx.beginPath();ctx.arc(0,0,1,-BALOR_EYE_ARC/2,BALOR_EYE_ARC/2);ctx.strokeStyle=OUTLINE_INK.lava;ctx.lineWidth=width(1.4);ctx.stroke();ctx.restore();
 }else if(id==='estella-ii'){
  // Animated weather replaces this static deck, just as in the filled painter.
  if(!animatedDeck){const m=acheronCloudGeometry();for(const [i,b]of m.broad.entries())if(i%3===2){const edge=b.full.slice(0,b.full.length/2);line(edge.slice(8,48),OUTLINE_INK.land,.8);line(edge.slice(60,118),OUTLINE_INK.land,.8);}}
 }else if(id==='estella-v'){
  const m=hartwellGeometry();layers(m.uplands);layers(m.deposits,OUTLINE_INK.minor);layers(m.erosion,OUTLINE_INK.minor);craters(m.craters);
 }else if(id==='estella-vi'){
  const m=kuzniaGeometry();layers(m.lowlands,OUTLINE_INK.minor);layers(m.highlands);layers(m.slopes,OUTLINE_INK.minor);layers(m.polarGround);
 }else if(id==='estella-xd'){
  const m=calatravaGeometry();m.basins.forEach(p=>region(p,OUTLINE_INK.minor));craters(m.craters);layers(m.resurfaced);layers(m.geothermal,OUTLINE_INK.minor);
 }else if(id==='estella-xia'){
  const m=almadenGeometry();layers(m.flows);layers(m.sulfur,OUTLINE_INK.minor);layers(m.calderas);
 }else if(id==='estella-xib'){
  const m=marismaGeometry();layers(m.lowlands,OUTLINE_INK.minor);layers(m.uplands);layers(m.surfaceTones,OUTLINE_INK.minor);
 }
 ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.strokeStyle=OUTLINE_INK.rim;ctx.lineWidth=width(1.5);ctx.stroke();
 if(id==='estella-i'){ctx.beginPath();ctx.arc(0,0,1,-eyeAngle-BALOR_EYE_ARC/2,-eyeAngle+BALOR_EYE_ARC/2);ctx.strokeStyle=OUTLINE_INK.lava;ctx.lineWidth=width(1.5);ctx.stroke();}
 ctx.restore();return true;
}
