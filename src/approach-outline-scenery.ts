import { getApproachTerrainHeight, type ApproachSceneryPainter } from './approach';
import { approachRidgeHeight, regionCoordinate, regionNoise, regionRandom, type ApproachRegion } from './approach-biomes';
import { HARTWELL_SURFACE_STYLE as ink } from './flight-surface-style';
type Point=readonly[number,number];
type Args=[CanvasRenderingContext2D,Parameters<ApproachSceneryPainter>[1],{localDir:1|-1},{body:{id:string};poi:{id:string};gateX:number},number,number];
type Part='all'|'background'|'material';
function path(ctx:CanvasRenderingContext2D,p:readonly Point[]){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));}
export function createHartwellOutlineScenery(region:ApproachRegion,part:Part='all'){
 const factory=createHartwellOutlineScenerySteps(region,part);
 return Object.assign((...args:Args)=>{const work=factory(...args);let next=work.next();while(!next.done)next=work.next();return next.value;},{outlineWind:true});
}
/** Same region/ridge/rock streams; static strips still prepared cooperatively.
 * No painted grain, dot stipple or bright sky gradients. */
export function createHartwellOutlineScenerySteps(region:ApproachRegion,part:Part='material'){
 return function*(...[ctx,cam,state,level,W,H]:Args):Generator<void,boolean,void>{
  if(level.body.id!==region.biome.bodyId||level.poi.id!==region.targetId||!(cam.zoom>0)||![W,H,cam.x,cam.y,cam.zoom].every(Number.isFinite))return false;
  const z=cam.zoom,sx=(x:number)=>W/2+(x-cam.x)*z,sy=(y:number)=>H/2-(y-cam.y)*z;
  const wx=(x:number)=>cam.x+(x-W/2)/z,canon=(x:number)=>regionCoordinate(x,level.gateX,state.localDir),world=(x:number)=>level.gateX+x*state.localDir;
  const ground=getApproachTerrainHeight,left=wx(-12),right=wx(W+12),a=Math.min(canon(left),canon(right)),b=Math.max(canon(left),canon(right));
  const noise=(x:number,scale:number,c:number)=>regionNoise(region.materialSeed,canon(x)/scale,c);
  ctx.save();try{
   ctx.globalAlpha=1;ctx.setLineDash([]);
   if(part!=='material'){
    ctx.fillStyle=ink.sky;ctx.fillRect(0,0,W,H);
    for(const layer of [0,1]as const){
     const parallax=layer ? .72 : .42,points:Point[]=[];
     for(let x=-8;x<=W+8;x+=4)points.push([x,sy(approachRidgeHeight(region,layer,state.localDir*((cam.x-level.gateX)*parallax+(x-W/2)/z)))]);
     path(ctx,points);ctx.lineTo(W+8,H+2);ctx.lineTo(-8,H+2);ctx.closePath();ctx.fillStyle=layer?ink.middle:ink.far;ctx.fill();
     path(ctx,points);ctx.strokeStyle=layer?ink.middleLine:ink.farLine;ctx.lineWidth=.8;ctx.stroke();
    }
   }
   if(part==='background')return true;
   const step=4/z,start=wx(0)-step,surface:Point[]=[];
   for(let i=0;i<=Math.ceil(W/4)+2;i++){const x=start+i*step;surface.push([sx(x),sy(ground(x))]);}
   if(part!=='material'&&surface.every(([,y])=>y>H+2))return true;
   ctx.save();try{
    if(part!=='material'){path(ctx,surface);ctx.lineTo(W+8,H+4);ctx.lineTo(-8,H+4);ctx.closePath();ctx.clip();}
    ctx.fillStyle=ink.ground;ctx.fillRect(0,0,W,H);
    // Existing large beds, now subordinate contour lines instead of painted masses.
    for(let band=0;band<6;band++){
     const line:Point[]=[];for(let x=left;x<=right+step;x+=step){const depth=100+band*400+210*noise(x,3800,30+band)+80*noise(x,900,50+band);line.push([sx(x),sy(ground(x)-depth)]);}
     path(ctx,line);ctx.strokeStyle=ink.detail;ctx.lineWidth=.65;ctx.stroke();yield;
    }
    // The former650m buttress stream becomes large angular rock boundaries.
    // No tiny closed clasts/grain that would read as rejected dot stippling.
    for(let cell=Math.floor(a/650)-2;cell<=Math.ceil(b/650)+2;cell++){
     const x=world(cell*650),r=(c:number)=>regionRandom(region.materialSeed,cell,c);
     const w=state.localDir*650*(.55+r(1)*.8),depth=350+r(2)*1450,top=ground(x)-35-r(3)*100,drift=state.localDir*(r(4)-.5)*800;
     path(ctx,[[sx(x),sy(top)],[sx(x+w*.35),sy(ground(x+w*.35)-70)],[sx(x+w+drift),sy(top-depth)],[sx(x+drift),sy(top-depth*.85)]]);
     ctx.closePath();ctx.globalAlpha=.45;ctx.strokeStyle=ink.line;ctx.lineWidth=.65;ctx.stroke();yield;
    }
   }finally{ctx.restore();}
   if(part!=='material'){path(ctx,surface);ctx.strokeStyle=ink.edge;ctx.lineWidth=2.5;ctx.stroke();}
   return true;
  }finally{ctx.restore();}
 };
}
