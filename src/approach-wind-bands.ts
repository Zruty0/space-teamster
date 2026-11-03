import type { LandingAir } from './landing-air';

/** Read-only altitude guides for regional air. These are m/s samples, not force layers. */
export function drawRegionalWindBands(
 ctx:CanvasRenderingContext2D,cam:Readonly<{x:number;y:number;zoom:number}>,air:LandingAir,
 ground:(x:number)=>number,atmosphereHeight:number,W:number,H:number,time:number,
):number {
 if(![cam.x,cam.y,cam.zoom,atmosphereHeight,W,H,time].every(Number.isFinite)||cam.zoom<=0||atmosphereHeight<=0||W<=0||H<=0)return 0;
 const sy=(y:number)=>H/2-(y-cam.y)*cam.zoom;
 const skyTop=Math.max(0,sy(atmosphereHeight));if(skyTop>=H)return 0;
 // World-altitude anchored guides; bounded adaptive LOD, never camera-driven weather.
 const step=2**Math.ceil(Math.log2(Math.max(120,H/24)/cam.zoom));
 const low=cam.y-H/(2*cam.zoom),high=cam.y+H/(2*cam.zoom);
 const first=Math.floor(Math.max(0,low)/step),last=Math.min(first+25,Math.floor(Math.min(high,atmosphereHeight)/step));
 const sample=(x:number,y:number)=>{const a=air.sample(x,y,time);return Number.isFinite(a.vx)&&Number.isFinite(a.density)&&a.density>0&&Math.abs(a.vx)>=.5?a.vx:0;};
 const tint=(v:number,a:number)=>v<0?`rgba(80,140,255,${a})`:`rgba(255,200,80,${a})`;
 let painted=0;ctx.save();try{
  ctx.beginPath();ctx.rect(0,skyTop,W,H-skyTop);ctx.clip();
  // Never stripe through solid terrain, including authored approach scenery.
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);
  const segments=Math.min(384,Math.ceil(W/4));
  for(let i=segments;i>=0;i--){const x=W*i/segments;ctx.lineTo(x,sy(ground(cam.x+(x-W/2)/cam.zoom)));}
  ctx.closePath();ctx.clip();
  ctx.font='10px monospace';ctx.textAlign='left';ctx.lineWidth=1;
  const labelX=Math.min(220,W*.25); // Leave the left telemetry/temperature column clear.
  for(let i=first;i<=last;i++){
   const y=(i+.5)*step;if(y>=atmosphereHeight)continue;
   const v=sample(cam.x,y);if(!v)continue;
   const mid=sy(y),top=sy((i+1)*step),bottom=sy(i*step);
   const alpha=Math.min(.35,.16+Math.abs(v)/400);
   ctx.strokeStyle=tint(v,alpha*.3);ctx.beginPath();ctx.moveTo(0,top);ctx.lineTo(W,top);ctx.moveTo(0,bottom);ctx.lineTo(W,bottom);ctx.stroke();
   const spacing=Math.max(120,W/96);
   for(let x=labelX+110;x<W;x+=spacing){
    if(mid<280&&x>W-340)continue; // Upper-right destination panel.
    const local=sample(cam.x+(x-W/2)/cam.zoom,y);if(!local)continue;
    const dir=local<0?-1:1;ctx.strokeStyle=tint(local,alpha);ctx.beginPath();
    ctx.moveTo(x-dir*10,mid-4);ctx.lineTo(x+dir*10,mid);ctx.lineTo(x-dir*10,mid+4);ctx.stroke();
   }
   if(mid>10&&mid<H-10){ctx.fillStyle=tint(v,.65);ctx.fillText(`${v<0?'←':'→'} ${Math.abs(v).toFixed(1)} m/s`,labelX,mid+3);}
   painted++;
  }
 }finally{ctx.restore();}
 return painted;
}
