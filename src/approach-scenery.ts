// Approved Hartwell scenery, shared by the production dispatcher and review gallery.
import { getApproachTerrainHeight, type ApproachSceneryPainter } from './approach';
import { approachRidgeHeight, regionCoordinate, regionNoise, regionRandom, type ApproachRegion } from './approach-biomes';

import { hartwellGroundMaterialSteps, GROUND_MATERIAL_WIDTH, GROUND_MATERIAL_HEIGHT } from './approach-ground-material';

type Point = readonly [number, number];
function path(ctx: CanvasRenderingContext2D, points: readonly Point[]): void {
  ctx.beginPath();
  points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
}
function fillToBottom(ctx: CanvasRenderingContext2D, points: readonly Point[], height: number): void {
  path(ctx, points); ctx.lineTo(points[points.length-1][0], height+2);
  ctx.lineTo(points[0][0], height+2); ctx.closePath();
}
export type HartwellSceneryPart = 'all' | 'background' | 'material';
export function createHartwellScenery(region: ApproachRegion, detailedGround = true, part: HartwellSceneryPart = 'all'): ApproachSceneryPainter {
  const paint=createHartwellScenerySteps(region,detailedGround,part);
  return(...args)=>{const work=paint(...args);let step=work.next();while(!step.done)step=work.next();return step.value;};
}
// Each yielded chunk is small (four texture rows or one vector column/band).
// Only cache-owned canvases are suspended; the live/gallery painter drains synchronously.
export function createHartwellScenerySteps(region: ApproachRegion, detailedGround=true, part: HartwellSceneryPart='material') {
  let grain: HTMLCanvasElement | undefined;
  function* materialTile(): Generator<void,HTMLCanvasElement,void> {
    if (grain) return grain;
    const tile = document.createElement('canvas');
    tile.width = detailedGround ? GROUND_MATERIAL_WIDTH : 256;
    tile.height = detailedGround ? GROUND_MATERIAL_HEIGHT : 256;
    const context = tile.getContext('2d')!, image = context.createImageData(tile.width,tile.height);
    if(detailedGround){
      image.data.set(yield* hartwellGroundMaterialSteps(region.materialSeed));
      context.putImageData(image,0,0);grain=tile;return tile;
    }
    for (let i=0;i<256*256;i++) {
      const r=regionRandom(region.materialSeed,i,100), bright=r>.5;
      image.data[i*4]=bright?240:30;image.data[i*4+1]=bright?198:24;image.data[i*4+2]=bright?145:22;
      image.data[i*4+3]=Math.round(Math.abs(r-.5)*50);
    }
    context.putImageData(image,0,0);grain=tile;return tile;
  }
  return function* (...[ctx, cam, state, level, W, H]: Parameters<ApproachSceneryPainter>): Generator<void,boolean,void> {
    if (level.body.id !== region.biome.bodyId || level.poi.id !== region.targetId) return false;
    if (!(cam.zoom > 0) || ![cam.x, cam.y, cam.zoom, W, H].every(Number.isFinite)) return false;
    const palette = region.biome.palette, zoom = cam.zoom;
    const sx = (x: number) => W/2 + (x-cam.x)*zoom;
    const sy = (y: number) => H/2 - (y-cam.y)*zoom;
    const wx = (x: number) => cam.x + (x-W/2)/zoom;
    const canonical = (x: number) => regionCoordinate(x, level.gateX, state.localDir);
    const fromRegion = (x: number) => level.gateX + x * state.localDir;
    const noise = (x: number, scale: number, channel: number) => regionNoise(region.materialSeed, canonical(x)/scale, channel);
    const ground = (x: number) => getApproachTerrainHeight(x, level);
    const left = wx(-12), right = wx(W+12);
    const regionLeft = Math.min(canonical(left), canonical(right)), regionRight = Math.max(canonical(left), canonical(right));
    ctx.save();
    try {
      ctx.globalAlpha = 1; ctx.setLineDash([]);
      if(part!=='material'){
      // Altitude-anchored light: moving/zooming the camera does not move the horizon.
      const sky = ctx.createLinearGradient(0, sy(18000), 0, sy(0));
      sky.addColorStop(0, '#050a15'); sky.addColorStop(.50, palette.sky);
      sky.addColorStop(.82, '#555963'); sky.addColorStop(1, palette.horizon);
      ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

      // The two softer layers are distant BACKGROUND relief, not clearance geometry.
      for (const layer of [0,1] as const) {
        const parallax = layer ? .72 : .42;
        const rx = (x: number) => state.localDir * ((cam.x-level.gateX)*parallax + (x-W/2)/zoom);
        const points: Point[] = [];
        for (let x=-8; x<=W+8; x+=4) points.push([x,sy(approachRidgeHeight(region,layer,rx(x)))]);
        ctx.save(); fillToBottom(ctx,points,H); ctx.clip();
        const mass = ctx.createLinearGradient(0,sy(3600),0,sy(-500));
        mass.addColorStop(0,layer ? '#aa8164' : '#99918b');
        mass.addColorStop(.5,layer ? palette.middle : palette.far);
        mass.addColorStop(1,layer ? '#74625a' : '#8e8278');
        ctx.fillStyle=mass; ctx.fillRect(0,0,W,H);
        // Irregular, world-anchored buttresses; no screen-aligned mesh of vertical stripes.
        const cellSize=layer?1100:1900;
        const toScreen=(r:number)=>W/2+(state.localDir*r-(cam.x-level.gateX)*parallax)*zoom;
        const a=Math.min(rx(-8),rx(W+8)),b=Math.max(rx(-8),rx(W+8));
        for(let cell=Math.floor(a/cellSize)-1;cell<=Math.ceil(b/cellSize)+1;cell++) {
          const r=(channel:number)=>regionRandom(region.reliefSeed,cell,channel+layer*20);
          const x=(cell+r(0)*.3)*cellSize,w=cellSize*(.6+r(1)*.65),top=approachRidgeHeight(region,layer,x);
          const drift=(r(2)-.5)*800, depth=900+r(3)*1600;
          const face:Point[]=[];
          for(let i=0;i<=8;i++){const at=x+w*i/8;face.push([toScreen(at),sy(approachRidgeHeight(region,layer,at)-40)]);}
          face.push([toScreen(x+w+drift),sy(top-depth)],[toScreen(x+drift),sy(top-depth*.8)]);
          path(ctx,face);ctx.closePath();
          const shade=ctx.createLinearGradient(0,sy(top),0,sy(top-depth));
          const alpha=(layer ? .10 : .035)*(r(4)*.65+.35);
          shade.addColorStop(0,`rgba(48,33,31,${alpha})`);shade.addColorStop(1,'rgba(48,33,31,0)');
          ctx.fillStyle=shade;ctx.fill();
        }
        // Broad, interrupted beds rather than evenly spaced contour lines.
        if(layer)for(let band=0;band<2;band++) {
          const upper:Point[]=[],lower:Point[]=[];
          for(let x=-8;x<=W+8;x+=4){
            const r=rx(x),top=approachRidgeHeight(region,layer,r),depth=400+band*750+170*regionNoise(region.reliefSeed,r/2200,band+20);
            upper.push([x,sy(top-depth)]);lower.push([x,sy(top-depth-75-75*regionNoise(region.reliefSeed,r/700,band+23))]);
          }
          path(ctx,[...upper,...lower.reverse()]);ctx.closePath();ctx.fillStyle='rgba(231,180,122,.06)';ctx.fill();
        }
        ctx.restore();
      }

      }
      if(part==='background')return true;
      // The foreground boundary is the CURRENT gameplay terrain, unmodified.
      // Match the legacy renderer's sampling grid exactly; all material work is clipped below it.
      const step=4/zoom, start=cam.x-W/(2*zoom)-step, count=Math.ceil(W/4)+2;
      const surface: Point[]=[];
      for(let i=0;i<=count;i++){const x=start+i*step;surface.push([sx(x),sy(ground(x))]);}
      // High-altitude cameras need only the sky/distant relief. Don't build an invisible material tile.
      if(part!=='material'&&surface.every(([,y])=>y>H+2))return true;
      ctx.save();
      // Material strips are opaque and unclipped. Production clips them once against
      // the exact live collision contour, rather than scaling a rasterized silhouette.
      if(part!=='material'){fillToBottom(ctx,surface,H);ctx.clip();}
      const rock=ctx.createLinearGradient(0,sy(1300),0,sy(-2000));
      rock.addColorStop(0,palette.ground);rock.addColorStop(.45,'#754630');rock.addColorStop(1,palette.deep);
      ctx.fillStyle=rock;ctx.fillRect(0,0,W,H);

      // Thick depositional bands: filled masses rather than wireframe contours.
      for(let band=0;band<6;band++) {
        const upper: Point[]=[], lower: Point[]=[];
        for(let x=left;x<=right+step;x+=step) {
          const depth=100+band*400+210*noise(x,3800,30+band)+80*noise(x,900,50+band);
          upper.push([sx(x),sy(ground(x)-depth)]);
          lower.push([sx(x),sy(ground(x)-depth-95-130*noise(x,2200,70+band))]);
        }
        path(ctx,[...upper,...lower.reverse()]);ctx.closePath();
        ctx.fillStyle=band%2===0?palette.sediment:palette.shadow;ctx.globalAlpha=.18;ctx.fill();
        yield;
      }
      ctx.globalAlpha=1;
      // World-indexed talus/facets and erosion gullies. No frame RNG or moving texture.
      const cellSize=650;
      for(let cell=Math.floor(regionLeft/cellSize)-2;cell<=Math.ceil(regionRight/cellSize)+2;cell++) {
        const x=fromRegion(cell*cellSize);
        const r=(channel:number)=>regionRandom(region.materialSeed,cell,channel);
        const width=state.localDir*cellSize*(.55+r(1)*.8), depth=350+r(2)*1450;
        const top=ground(x)-35-r(3)*100, drift=state.localDir*(r(4)-.5)*800;
        path(ctx,[[sx(x),sy(top)],[sx(x+width*.35),sy(ground(x+width*.35)-70)],
          [sx(x+width+drift),sy(top-depth)],[sx(x+drift),sy(top-depth*.85)]]);
        ctx.closePath();ctx.fillStyle=r(5)>.45?palette.shadow:palette.light;ctx.globalAlpha=.025+r(6)*.035;ctx.fill();
        ctx.globalAlpha=.15;
        ctx.beginPath();ctx.moveTo(sx(x+width*.5),sy(top-90));
        ctx.bezierCurveTo(sx(x+width*.4),sy(top-depth*.35),sx(x+drift),sy(top-depth*.7),sx(x+drift+width*.1),sy(top-depth));
        ctx.strokeStyle=palette.shadow;ctx.lineWidth=Math.max(.5,Math.min(2,30*zoom));ctx.stroke();
        yield;
      }
      const texture=ctx.createPattern(yield* materialTile(),'repeat');
      if(texture){
        const scale=detailedGround?8:16;
        texture.setTransform(new DOMMatrix([scale*zoom*state.localDir,0,0,-scale*zoom,sx(level.gateX),sy(0)]));
        ctx.globalAlpha=detailedGround ? .72 : 1;ctx.fillStyle=texture;ctx.fillRect(0,0,W,H);
        if(detailedGround){
          // Incommensurate world scales conceal repeated patches without another bitmap.
          const second=scale*Math.SQRT2;
          texture.setTransform(new DOMMatrix([second*zoom*state.localDir,0,0,-second*zoom,sx(level.gateX+913*state.localDir),sy(457)]));
          ctx.globalAlpha=.48;ctx.fillStyle=texture;ctx.fillRect(0,0,W,H);
        }
      }
      if(detailedGround && zoom>.022){
        // Target-local, world-sized clasts/outcrop fragments, not screen-space speckle.
        // Everything stays below the original collision edge: no new obstacles.
        const fade=Math.min(1,Math.max(0,(zoom-.022)/.04));
        const bottom=cam.y-H/(2*zoom),cellWidth=170,rowHeight=135;
        for(let cell=Math.floor(regionLeft/cellWidth)-1;cell<=Math.ceil(regionRight/cellWidth)+1;cell++){
          const maxDepth=Math.max(0,ground(fromRegion(cell*cellWidth))-bottom+300);
          for(let row=0;row<Math.min(64,Math.ceil(maxDepth/rowHeight));row++){
            const r=(channel:number)=>regionRandom(region.materialSeed,cell,150+row*13+channel);
            const x=fromRegion((cell+r(0))*cellWidth),depth=24+(row+r(1)) * rowHeight;
            const y=ground(x)-depth,px=sx(x),py=sy(y);
            if(px< -20||px>W+20||py< -20||py>H+20||r(2)>.72)continue;
            const patch=.45+.55*noise(x,850,row%3+140);
            const rx=(13+r(3)*48)*zoom,ry=rx*(.25+r(4)*.4);
            if(rx<.5)continue;
            const shape:Point[]=[];
            for(let i=0;i<6;i++){
              const a=i*Math.PI/3+.35,rough=.72+.28*r(i+5);
              shape.push([px+Math.cos(a)*rx*rough,py+Math.sin(a)*ry*rough]);
            }
            ctx.globalAlpha=fade*patch*(.28+r(5)*.25);
            // Dark contact shadow, ochre face and one lit bevel give actual relief.
            path(ctx,shape.map(([a,b])=>[a+1,b+1]));ctx.closePath();ctx.fillStyle='#241c19';ctx.fill();
            path(ctx,shape);ctx.closePath();ctx.fillStyle=r(6)>.5?'#b58051':'#4b3227';ctx.fill();
            path(ctx,[shape[3],shape[4],shape[5],[px,py]]);ctx.closePath();ctx.fillStyle='#d2a06a';ctx.globalAlpha=fade*patch*.24;ctx.fill();
          }
          yield;
        }
        // Broken, fine bedding ledges: irregular lengths, each anchored in world space.
        for(let cell=Math.floor(regionLeft/450)-1;cell<=Math.ceil(regionRight/450);cell++){
        for(let row=0;row<14;row++){
          const r=(c:number)=>regionRandom(region.materialSeed,cell,1100+row*7+c);
          if(r(0)>.55)continue;
          const x=fromRegion((cell+r(1)*.6)*450),y=ground(x)-80-row*170-r(2)*90;
          if(sy(y)<-4||sy(y)>H+4)continue;
          const length=(80+r(3)*270)*state.localDir;
          const endY=ground(x+length)-(ground(x)-y)+35*(r(4)-.5);
          ctx.globalAlpha=fade*.24;ctx.strokeStyle='#291f1c';ctx.lineWidth=Math.max(.65,12*zoom);
          ctx.beginPath();ctx.moveTo(sx(x),sy(y));ctx.lineTo(sx(x+length*.45),sy(y-12));ctx.lineTo(sx(x+length),sy(endY));ctx.stroke();
          ctx.strokeStyle='#ce9860';ctx.globalAlpha=fade*.18;ctx.lineWidth=.7;
          ctx.beginPath();ctx.moveTo(sx(x),sy(y)+1.2);ctx.lineTo(sx(x+length*.45),sy(y-12)+1.2);ctx.stroke();
        }
        yield;
        }
      }
      // Sparse tiny scree strokes appear continuously with zoom; locations never reshuffle.
      ctx.globalAlpha=Math.min(.18,Math.max(0,(zoom-.025)*2));
      if(zoom>.025)for(let cell=Math.floor(regionLeft/140);cell<=Math.ceil(regionRight/140);cell++) {
        const x=fromRegion(cell*140);
        const y=ground(x)-80-regionRandom(region.materialSeed,cell,90)*1100;
        ctx.strokeStyle=palette.light;ctx.lineWidth=.7;
        ctx.beginPath();ctx.moveTo(sx(x),sy(y));ctx.lineTo(sx(x+state.localDir*(20+regionRandom(region.materialSeed,cell,91)*60)),sy(y-12));ctx.stroke();
      }
      // Wide ascent cameras expose kilometres of the schematic cutaway. Fade deep
      // material rather than filling half the screen with repeated rock texture.
      const deep=ctx.createLinearGradient(0,sy(-2000),0,sy(-8000));
      deep.addColorStop(0,'rgba(33,27,27,0)');deep.addColorStop(.7,'rgba(33,27,27,.85)');deep.addColorStop(1,'#211b1b');
      ctx.globalAlpha=1;ctx.fillStyle=deep;ctx.fillRect(0,0,W,H);
      ctx.restore();
      // A restrained lit edge makes the true flight plane unambiguous; no neon terrain mesh.
      if(part!=='material'){path(ctx,surface);ctx.strokeStyle='rgba(223,163,104,.58)';ctx.lineWidth=1;ctx.stroke();}
      return true;
    } finally { ctx.restore(); }
  };
}
