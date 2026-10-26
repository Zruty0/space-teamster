// Dawes Cut test bed. Presentation only: existing terrain, pad and collision stay authoritative.
import type { Camera } from './renderer';
import type { LevelDef } from './levels';
import { getTerrainHeight, type TerrainData } from './terrain';
import { getApproachTerrainHeight } from './approach';
import { hartwellApproachRegion, regionNoise } from './approach-biomes';
import { createHartwellScenery } from './approach-scenery';
import { hartwellGroundMaterialSteps, GROUND_MATERIAL_WIDTH, GROUND_MATERIAL_HEIGHT } from './approach-ground-material';
import { DAWES_CUT_ID, HARTWELL_OUTPOST_THEME, usesDawesSurfaceArt, createSurfacePoiArtwork, placeSurfacePoi, surfaceBeaconOn } from './surface-poi';

export type LandingSceneryPainter=(ctx:CanvasRenderingContext2D,cam:Camera,terrain:TerrainData,level:LevelDef,W:number,H:number,time:number)=>boolean;
/** Exact native vertices, including the clamped terrain outside its finite mesh. */
export function landingSurfacePoints(terrain:TerrainData,left:number,right:number):readonly(readonly[number,number])[]{
  const points:Array<readonly[number,number]>=[[left,getTerrainHeight(terrain,left)]];
  const a=Math.max(0,Math.floor((left-terrain.startX)/terrain.spacing)+1),b=Math.min(terrain.points.length-1,Math.ceil((right-terrain.startX)/terrain.spacing)-1);
  for(let i=a;i<=b;i++)points.push(terrain.points[i]);
  points.push([right,getTerrainHeight(terrain,right)]);return points;
}
/** Distant relief retains the approach's regional angular size, while its datum
 * follows the real pad on screen. The gameplay camera/terrain are not rescaled. */
export function landingBackdropCamera(cam:Camera,terrain:TerrainData):Camera {
  const zoom=Math.min(.065,cam.zoom);
  return{x:cam.x-terrain.pad.centerX,y:getApproachTerrainHeight(0)+(cam.y-terrain.pad.y)*cam.zoom/zoom,zoom};
}
export function createLandingScenery(){
  const region=hartwellApproachRegion(DAWES_CUT_ID),backdrop=createHartwellScenery(region,true,'background');
  let artwork:ReturnType<typeof createSurfacePoiArtwork>|undefined,material:HTMLCanvasElement|undefined,preparation:Promise<void>|undefined,failed=false;
  const placements=new WeakMap<TerrainData,ReturnType<typeof placeSurfacePoi>>();
  function prepare(level:{body:{id:string};poi:{id:string};landingLayout?:unknown}):Promise<void>{
    if(!usesDawesSurfaceArt(level))return Promise.resolve();
    if(preparation)return preparation;
    artwork=createSurfacePoiArtwork(HARTWELL_OUTPOST_THEME);
    const texture=new Promise<void>(resolve=>{
      const work=hartwellGroundMaterialSteps(region.materialSeed);
      const step=()=>{
        if(document.hidden){requestAnimationFrame(step);return;}
        const begin=performance.now();
        try{
          do{
            const result=work.next();
            if(result.done){
              const canvas=document.createElement('canvas');canvas.width=GROUND_MATERIAL_WIDTH;canvas.height=GROUND_MATERIAL_HEIGHT;
              const ctx=canvas.getContext('2d');if(!ctx)throw Error('Landing material canvas unavailable');
              const image=ctx.createImageData(canvas.width,canvas.height);image.data.set(result.value);ctx.putImageData(image,0,0);material=canvas;resolve();return;
            }
          }while(performance.now()-begin<2);
          requestAnimationFrame(step);
        }catch{failed=true;resolve();}
      };
      requestAnimationFrame(step);
    });
    return preparation=Promise.all([artwork.ready,texture]).then(()=>undefined);
  }
  const draw:LandingSceneryPainter=(ctx,cam,terrain,level,W,H,time)=>{
    if(!usesDawesSurfaceArt(level))return false;
    if(!(cam.zoom>0)||![cam.x,cam.y,cam.zoom,W,H,time].every(Number.isFinite)||W<=0||H<=0)return false;
    void prepare(level);
    const z=cam.zoom,sx=(x:number)=>W/2+(x-cam.x)*z,sy=(y:number)=>H/2-(y-cam.y)*z;
    const datum=terrain.pad.y-getApproachTerrainHeight(0);
    const paint=artwork!;
    let placement=placements.get(terrain);
    if(!placement){placement=placeSurfacePoi(paint.asset,terrain.pad,x=>getTerrainHeight(terrain,x));placements.set(terrain,placement);}
    const moduleLayer=(layer:'backdrop'|'pad')=>{
      for(const p of placement!.modules){
        if(p.module.layer!==layer)continue;
        const image=paint.images.get(p.module.id);if(!image)continue;
        const b=p.module.bounds,x=sx(p.x+b.x*p.scale),y=sy(p.y)+b.y*p.scale*z,w=b.width*p.scale*z,h=b.height*p.scale*z;
        if(x+w<0||x>W||y+h<0||y>H)continue;
        ctx.drawImage(image,x,y,w,h);
      }
    };
    ctx.save();
    try{
      ctx.globalAlpha=1;ctx.setLineDash([]);
      backdrop(ctx,landingBackdropCamera(cam,terrain),{localDir:-1},{body:level.body,poi:level.poi,gateX:0},W,H);
      // Facilities are set back from the flight plane. Foreground buries their
      // deep plinths against the actual ground; no fake flattened collision floor.
      moduleLayer('backdrop');
      const left=cam.x-W/(2*z)-2,right=cam.x+W/(2*z)+2,points=landingSurfacePoints(terrain,left,right);
      const edge=()=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(sx(x),sy(y)):ctx.moveTo(sx(x),sy(y)));};
      ctx.save();edge();ctx.lineTo(W+4,H+4);ctx.lineTo(-4,H+4);ctx.closePath();ctx.clip();
      const rock=ctx.createLinearGradient(0,sy(datum+1300),0,sy(datum-2000));
      rock.addColorStop(0,region.biome.palette.ground);rock.addColorStop(.45,'#754630');rock.addColorStop(1,region.biome.palette.deep);
      ctx.fillStyle=rock;ctx.fillRect(0,0,W,H);
      // The same seed/material at approach scale, plus a fine close-range sample.
      // Three pattern fills, not thousands of per-frame rock primitives.
      if(material){
        const pattern=ctx.createPattern(material,'repeat');
        if(pattern)for(const [scale,alpha,dx,dy]of [[8,.72,0,0],[8*Math.SQRT2,.48,-913,457],[.08,.40,0,0]]){
          pattern.setTransform(new DOMMatrix([-scale*z,0,0,-scale*z,sx(terrain.pad.centerX+dx),sy(datum+dy)]));
          ctx.fillStyle=pattern;ctx.globalAlpha=alpha;ctx.fillRect(0,0,W,H);
        }
      }
      // Close-range broken bedding follows the native ground, always below it.
      for(let band=0;band<6;band++){
        const upper:Array<[number,number]>=[],lower:Array<[number,number]>=[];
        for(let x=left;x<=right+4/z;x+=4/z){
          const depth=4+band*7+3*regionNoise(region.materialSeed,(x-terrain.pad.centerX)/25,1600+band);
          const y=getTerrainHeight(terrain,x)-depth;upper.push([sx(x),sy(y)]);lower.push([sx(x),sy(y-1.2)]);
        }
        ctx.beginPath();[...upper,...lower.reverse()].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
        ctx.globalAlpha=.10;ctx.fillStyle=band%2?region.biome.palette.light:region.biome.palette.shadow;ctx.fill();
      }
      ctx.restore();edge();ctx.globalAlpha=1;ctx.strokeStyle='rgba(223,163,104,.58)';ctx.lineWidth=1;ctx.stroke();
      moduleLayer('pad');
      if(!paint.images.has('landing-pad')){
        ctx.fillStyle='#43484a';ctx.fillRect(sx(terrain.pad.left),sy(terrain.pad.y),(terrain.pad.right-terrain.pad.left)*z,Math.max(2,z*3));
        ctx.strokeStyle='#adb4ac';ctx.beginPath();ctx.moveTo(sx(terrain.pad.left),sy(terrain.pad.y));ctx.lineTo(sx(terrain.pad.right),sy(terrain.pad.y));ctx.stroke();
      }
      const lit=surfaceBeaconOn(time);
      for(const beacon of paint.asset.beacons){
        const x=sx(placement.x+beacon.x*placement.scale),y=sy(terrain.pad.y+(paint.asset.pad.y-beacon.y)*placement.scale);
        if(x< -20||x>W+20||y< -20||y>H+20)continue;
        if(lit){const r=Math.max(4,2*z),glow=ctx.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,'rgba(203,255,180,.65)');glow.addColorStop(1,'rgba(203,255,180,0)');ctx.fillStyle=glow;ctx.fillRect(x-r,y-r,2*r,2*r);}
        ctx.beginPath();ctx.arc(x,y,Math.max(1.2,.6*z),0,Math.PI*2);ctx.fillStyle=lit?'#efffd4':'#52654b';ctx.fill();
      }
      return true;
    }finally{ctx.restore();}
  };
  return Object.assign(draw,{prepare,diagnostics:()=>({...artwork?.diagnostics(),materialReady:!!material,failed:failed||!!artwork?.diagnostics().failed})});
}
