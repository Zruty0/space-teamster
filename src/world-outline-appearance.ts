// Approved game presentation. Same permanent geography as the filled reference.
// Current dispatch: world-presentation.ts. Very dark regional fills; no stipple.
import { beginDisc, trace, type WorldTint } from './world-disc-primitives';
import { gaiaDiscGeometry } from './world-disc-appearance';
import { crateredWorldGeometry, type Crater } from './cratered-world-geometry';
import { rockyWorldProfileFor } from './content/estella/rocky-world-appearance';
import { icyWorldProfileFor } from './content/estella/icy-world-appearance';
import { icyWorldGeometry } from './icy-world-geometry';
import { gasGiantProfileFor } from './content/estella/gas-giant-appearance';
import { drawSoftGiantDisc } from './soft-giant-appearance';
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
export const OUTLINE_INK=Object.freeze({water:'#7895ad',coast:'#7895ad',ice:'#c2c5c9',lava:'#e89148'});
export const MATERIAL_FILL=Object.freeze({water:'#0b1118',ice:'#141618',lava:'#201006'});
/** Retain30% of the world's chroma, then darken. Gray-tinted planetary ink,
 * rather than a single neutral gray shared by all terrain. Rim stays original. */
export function terrainOutlineInk(tint:WorldTint){
 const gray=tint[0]*.2126+tint[1]*.7152+tint[2]*.0722;
 const color=(strength:number)=>'#'+tint.map(v=>Math.round(Math.max(0,Math.min(255,(gray*.7+v*.3)*strength))).toString(16).padStart(2,'0')).join('');
 const background='#'+tint.map(v=>Math.round(Math.max(0,Math.min(255,v*.055))).toString(16).padStart(2,'0')).join('');
 return Object.freeze({land:color(.68),minor:color(.43),background});
}
export function hasOutlineWorld(id:string):boolean{
 return !!(rockyWorldProfileFor(id)||icyWorldProfileFor(id)||gasGiantProfileFor(id)||['estella-i','estella-ii','estella-iii','estella-iv','estella-v','estella-vi','estella-xd','estella-xia','estella-xib'].includes(id));
}
export function drawOutlineWorld(ctx:CanvasRenderingContext2D,id:string,cx:number,cy:number,r:number,eyeAngle=0,animatedDeck=false,rimTint:WorldTint=[150,150,150]):boolean{
 if(!hasOutlineWorld(id)||!(r>0)||![cx,cy,r,eyeAngle,...rimTint].every(Number.isFinite))return false;
 const giant=gasGiantProfileFor(id);
 if(giant){drawSoftGiantDisc(ctx,cx,cy,r,giant);return true;}
 if(!beginDisc(ctx,cx,cy,r))return false;
 const terrain=terrainOutlineInk(rimTint),width=(px:number)=>Math.min(.25,px/r);
 ctx.fillStyle=terrain.background;ctx.fillRect(-1,-1,2,2);ctx.lineJoin='round';ctx.lineCap='round';
 function line(points:readonly Point[],ink:string=terrain.land,px=1,closed=false){
  if(!points.length)return;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(closed)ctx.closePath();
  ctx.strokeStyle=ink;ctx.lineWidth=width(px);ctx.stroke();
 }
 function region(points:readonly Point[],ink:string=terrain.land,px=1,fill=terrain.background){trace(ctx,points);ctx.fillStyle=fill;ctx.fill();line(points,ink,px,true);}
 function layers(items:readonly Layer[],ink:string=terrain.land){for(const item of items)region(item.full,ink);}
 function craters(items:readonly Crater[]){
  const count=r<14?3:r<60?9:items.length;
  for(const {x,y,r:rad,squash,angle}of items.slice(0,count)){
   if(rad*r<1.15)continue;
   ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(squash,1);
   ctx.beginPath();ctx.arc(0,0,rad,0,TAU);ctx.fillStyle=terrain.background;ctx.fill();ctx.strokeStyle=terrain.land;ctx.lineWidth=width(.85);ctx.stroke();
   if(rad*r>3){ctx.beginPath();ctx.arc(0,0,rad*.76,-2.8-angle,-.3-angle);ctx.strokeStyle=terrain.minor;ctx.lineWidth=width(.65);ctx.stroke();}
   ctx.restore();
  }
 }
 const rocky=rockyWorldProfileFor(id),icy=icyWorldProfileFor(id);
 if(rocky){const m=crateredWorldGeometry(rocky);m.basins.forEach(p=>region(p,terrain.minor));craters(m.craters);}
 else if(icy){
  // Fully icy worlds: outlines only, explicitly NO whole-globe dot texture.
  const m=icyWorldGeometry(icy);m.surface.basins.forEach(p=>region(p,terrain.minor));m.frost.forEach(p=>region(p,OUTLINE_INK.ice,1,MATERIAL_FILL.ice));craters(m.surface.craters);
 }else if(id==='estella-iii'){
  const m=gaiaDiscGeometry();ctx.fillStyle=MATERIAL_FILL.water;ctx.fillRect(-1,-1,2,2);
  m.land.forEach((p,i)=>{region(p,OUTLINE_INK.coast,1.1);if(r>=60){ctx.save();trace(ctx,p);ctx.clip();line(m.forests[i],terrain.minor,.7,true);ctx.restore();}});
  m.islands.forEach(p=>region(p,OUTLINE_INK.coast,.8));
  m.iceEdges.forEach((edge,i)=>{const sign=i?1:-1;region([...edge,[1.1,sign*1.1],[-1.1,sign*1.1]],OUTLINE_INK.ice,.85,MATERIAL_FILL.ice);});
 }else if(id==='estella-iv'){
  // Keep the dark planet-blue ocean background, with only local ice regions.
  for(const layer of dahaiGeometry().ice)region(layer.full,OUTLINE_INK.ice,1,MATERIAL_FILL.ice);
 }else if(id==='estella-i'){
  ctx.save();ctx.rotate(-eyeAngle);const m=crateredWorldGeometry(BALOR_CRATER_PROFILE);
  m.basins.forEach(p=>region(p,terrain.minor));craters(m.craters);
  const h=Math.sin(BALOR_EYE_ARC/2),{shore,crust}=balorEyeGeometry();
  ctx.save();ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,1,-BALOR_EYE_ARC/2,BALOR_EYE_ARC/2);ctx.closePath();ctx.clip();
  trace(ctx,[...shore,[1.1,h],[1.1,-h]]);ctx.fillStyle=MATERIAL_FILL.lava;ctx.fill();ctx.save();ctx.clip();if(r>=180)crust.forEach(p=>region(p,OUTLINE_INK.lava,.7));ctx.restore();line(shore,OUTLINE_INK.lava,1.1);
  ctx.restore();ctx.restore();
 }else if(id==='estella-ii'){
  // Animated weather replaces this static deck, just as in the filled painter.
  if(!animatedDeck){const m=acheronCloudGeometry();for(const [i,b]of m.broad.entries())if(i%3===2){const edge=b.full.slice(0,b.full.length/2);line(edge.slice(8,48),b.color,.8);line(edge.slice(60,118),b.color,.8);}}
 }else if(id==='estella-v'){
  const m=hartwellGeometry();layers(m.uplands);layers(m.deposits,terrain.minor);layers(m.erosion,terrain.minor);craters(m.craters);
 }else if(id==='estella-vi'){
  const m=kuzniaGeometry();layers(m.lowlands,terrain.minor);layers(m.highlands);layers(m.slopes,terrain.minor);layers(m.polarGround);
 }else if(id==='estella-xd'){
  const m=calatravaGeometry();m.basins.forEach(p=>region(p,terrain.minor));craters(m.craters);layers(m.resurfaced);layers(m.geothermal,terrain.minor);
 }else if(id==='estella-xia'){
  const m=almadenGeometry();layers(m.flows);layers(m.sulfur,terrain.minor);layers(m.calderas);
 }else if(id==='estella-xib'){
  const m=marismaGeometry();layers(m.lowlands,terrain.minor);layers(m.uplands);layers(m.surfaceTones,terrain.minor);
 }
 ctx.beginPath();ctx.arc(0,0,1,0,TAU);ctx.strokeStyle=`rgb(${rimTint.join(',')})`;ctx.lineWidth=3/r;ctx.stroke();
 ctx.restore();return true;
}
