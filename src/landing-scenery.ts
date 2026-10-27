// Foreground Dawes site. Natural terrain stops at the SVG footprint; the same
// engineered deck and authored solid paths are used by physics and drawing.
import type { Camera } from './renderer';
import type { LevelDef } from './levels';
import { getTerrainHeight, type TerrainData } from './terrain';
import { getApproachTerrainHeight } from './approach';
import { hartwellApproachRegion } from './approach-biomes';
import { createHartwellOutlineScenery } from './approach-outline-scenery';
import { HARTWELL_SURFACE_STYLE as ink } from './flight-surface-style';
import { DAWES_CUT_ID, HARTWELL_OUTPOST_THEME, usesDawesSurfaceArt, createSurfacePoiArtwork, placeSurfacePoi, surfaceBeaconOn } from './surface-poi';
export type LandingSceneryPainter=(ctx:CanvasRenderingContext2D,cam:Camera,terrain:TerrainData,level:LevelDef,W:number,H:number,time:number)=>boolean;
/** Native outer vertices plus exact cut faces and deck. No natural ground under
 * or through the foreground outpost. The unmodified samples remain in TerrainData. */
export function landingSurfacePoints(terrain:TerrainData,left:number,right:number):readonly(readonly[number,number])[]{
 const site=terrain.surfaceSite,points:Array<readonly[number,number]>=[[left,getTerrainHeight(terrain,left)]];
 const a=Math.max(0,Math.floor((left-terrain.startX)/terrain.spacing)+1),b=Math.min(terrain.points.length-1,Math.ceil((right-terrain.startX)/terrain.spacing)-1);
 for(let i=a;i<=b;i++){const p=terrain.points[i];if(!site||p[0]<site.left||p[0]>site.right)points.push(p);}
 if(site){
  if(site.left>=left&&site.left<=right)points.push([site.left,site.leftHeight],[site.left,site.deckY]);
  if(site.right>=left&&site.right<=right)points.push([site.right,site.deckY],[site.right,site.rightHeight]);
 }
 points.push([right,getTerrainHeight(terrain,right)]);points.sort((a,b)=>a[0]-b[0]);return points;
}
export function landingBackdropCamera(cam:Camera,terrain:TerrainData):Camera{
 const zoom=Math.min(.065,cam.zoom);return{x:cam.x-terrain.pad.centerX,y:getApproachTerrainHeight(0)+(cam.y-terrain.pad.y)*cam.zoom/zoom,zoom};
}
export function createLandingScenery(){
 const region=hartwellApproachRegion(DAWES_CUT_ID),backdrop=createHartwellOutlineScenery(region,'background');
 let artwork:ReturnType<typeof createSurfacePoiArtwork>|undefined,preparation:Promise<void>|undefined;
 const placements=new WeakMap<TerrainData,ReturnType<typeof placeSurfacePoi>>();
 function prepare(level:{body:{id:string};poi:{id:string};landingLayout?:unknown}){
  if(!usesDawesSurfaceArt(level))return Promise.resolve();
  if(!preparation){artwork=createSurfacePoiArtwork(HARTWELL_OUTPOST_THEME);preparation=artwork.ready;}return preparation;
 }
 const draw:LandingSceneryPainter=(ctx,cam,terrain,level,W,H,time)=>{
  if(!usesDawesSurfaceArt(level)||!(cam.zoom>0)||![cam.x,cam.y,cam.zoom,W,H,time].every(Number.isFinite)||W<=0||H<=0)return false;
  void prepare(level);const paint=artwork!,site=terrain.surfaceSite;
  const z=cam.zoom,sx=(x:number)=>W/2+(x-cam.x)*z,sy=(y:number)=>H/2-(y-cam.y)*z;
  let placement=placements.get(terrain);if(!placement){placement=placeSurfacePoi(paint.asset,terrain.pad,x=>getTerrainHeight(terrain,x));placements.set(terrain,placement);}
  const moduleLayer=(layer:'deck'|'foreground'|'pad')=>{for(const p of placement!.modules){
   if(p.module.layer!==layer)continue;const image=paint.images.get(p.module.id);if(!image)continue;
   const b=p.module.bounds,x=sx(p.x+b.x*p.scale),y=sy(p.y)+b.y*p.scale*z,w=b.width*p.scale*z,h=b.height*p.scale*z;
   if(x+w>=0&&x<=W&&y+h>=0&&y<=H)ctx.drawImage(image,x,y,w,h);
  }};
  ctx.save();try{
   ctx.globalAlpha=1;ctx.setLineDash([]);backdrop(ctx,landingBackdropCamera(cam,terrain),{localDir:-1},{body:level.body,poi:level.poi,gateX:0},W,H);
   const left=cam.x-W/(2*z)-2,right=cam.x+W/(2*z)+2,points=landingSurfacePoints(terrain,left,right);
   const edge=(omitDeck=false)=>{ctx.beginPath();points.forEach(([x,y],i)=>{
    const previous=points[i-1],gap=omitDeck&&site&&previous&&previous[0]>=site.left&&x<=site.right&&x>previous[0];
    if(!i||gap)ctx.moveTo(sx(x),sy(y));else ctx.lineTo(sx(x),sy(y));
   });};
   ctx.save();edge();ctx.lineTo(W+4,H+4);ctx.lineTo(-4,H+4);ctx.closePath();ctx.clip();ctx.fillStyle=ink.ground;ctx.fillRect(0,0,W,H);
   ctx.restore();edge(true);ctx.strokeStyle=ink.edge;ctx.lineWidth=2.5;ctx.stroke();
   // Keep the physical deck edge visible after hiding its below-ground cutaway.
   if(site){ctx.beginPath();ctx.moveTo(sx(site.left),sy(site.deckY));ctx.lineTo(sx(site.right),sy(site.deckY));ctx.strokeStyle='#7c695c';ctx.lineWidth=1;ctx.stroke();}
   // Always visible collision silhouettes, even before SVG decode or on failure.
   if(site&&!paint.diagnostics().ready){
    ctx.save();ctx.beginPath();ctx.rect(0,0,W,Math.max(0,sy(site.deckY)));ctx.clip();
    for(const solid of site.solids){ctx.beginPath();solid.points.forEach(([x,y],i)=>i?ctx.lineTo(sx(x),sy(y)):ctx.moveTo(sx(x),sy(y)));ctx.closePath();ctx.fillStyle='#0d0907';ctx.fill();ctx.strokeStyle=ink.line;ctx.lineWidth=1;ctx.stroke();}
    ctx.restore();
   }
   // Bury the SVG foundation cutaway in the same plain planet-colored ground.
   // Preserve above-deck buildings and the thin authored landing-pad slab.
   ctx.save();ctx.beginPath();ctx.rect(0,0,W,Math.max(0,sy(terrain.pad.y)));ctx.clip();
   moduleLayer('deck');moduleLayer('foreground');ctx.restore();moduleLayer('pad');
   if(!paint.images.has('landing-pad')){ctx.strokeStyle='#8c8172';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx(terrain.pad.left),sy(terrain.pad.y));ctx.lineTo(sx(terrain.pad.right),sy(terrain.pad.y));ctx.stroke();}
   const lit=surfaceBeaconOn(time);
   for(const [i,beacon]of [...paint.asset.beacons].sort((a,b)=>a.x-b.x).entries()){
    const x=sx(placement.x+beacon.x*placement.scale),y=sy(terrain.pad.y+(paint.asset.pad.y-beacon.y)*placement.scale);
    if(x< -20||x>W+20||y< -20||y>H+20)continue;
    if(lit){const r=Math.max(4,2*z),glow=ctx.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,i?'rgba(255,75,85,.45)':'rgba(55,245,120,.45)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(x-r,y-r,2*r,2*r);}
    ctx.beginPath();ctx.arc(x,y,Math.max(1.2,.6*z),0,Math.PI*2);ctx.fillStyle=lit?(i?'#ff646b':'#54ee87'):(i?'#551e20':'#174c2c');ctx.fill();
   }
   return true;
  }finally{ctx.restore();}
 };
 return Object.assign(draw,{prepare,diagnostics:()=>({...artwork?.diagnostics(),materialReady:true,failed:!!artwork?.diagnostics().failed})});
}
