// Authored side-elevation SVGs, separate from environment, terrain and collision.
import basicOutpostSvg from '../art/surface/basic-outpost.svg?raw';
export const DAWES_CUT_ID='estella-v-open-cast-mine';
export function usesDawesSurfaceArt(level:{body:{id:string};poi:{id:string};landingLayout?:unknown}):boolean {
  return level.body.id==='estella-v'&&level.poi.id===DAWES_CUT_ID&&!level.landingLayout;
}
export interface SvgBounds {x:number;y:number;width:number;height:number;}
export interface SurfacePoiModule {id:string;layer:'backdrop'|'pad';footLeft:number;footRight:number;bounds:SvgBounds;}
export interface SurfacePoiAsset {version:1;id:string;bounds:SvgBounds;pad:{left:number;right:number;y:number};beacons:readonly{x:number;y:number}[];modules:readonly SurfacePoiModule[];}
export interface SurfacePad {left:number;right:number;y:number;centerX:number;}
export type SurfacePoiTheme=Partial<Record<'wall'|'roof'|'edge'|'trim'|'dust'|'glass'|'light'|'pad',string>>;
export const HARTWELL_OUTPOST_THEME:SurfacePoiTheme=Object.freeze({dust:'#875035',wall:'#39464b',roof:'#697477',trim:'#adb4ac',glass:'#405e68',light:'#dacda0',edge:'#172329',pad:'#43484a'});
let parsed:SurfacePoiAsset|undefined;
export function parseSurfacePoiSvg(svg:string):SurfacePoiAsset {
  const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
  if(doc.querySelector('parsererror')||/<(?:script|image|foreignObject)\b/i.test(svg))throw Error('Invalid surface POI SVG');
  const a=JSON.parse(doc.querySelector('metadata')?.textContent??'null') as SurfacePoiAsset;
  const finite=(...v:number[])=>v.every(Number.isFinite);
  const bounds=(b:SvgBounds)=>!!b&&finite(b.x,b.y,b.width,b.height)&&b.width>0&&b.height>0;
  if(!a||a.version!==1||!a.id||!bounds(a.bounds)||!a.pad||!finite(a.pad.left,a.pad.right,a.pad.y)||a.pad.right<=a.pad.left||!Array.isArray(a.modules)||!a.modules.length||!Array.isArray(a.beacons)||a.beacons.length!==2)throw Error('Invalid surface POI metadata');
  const groups:string[]=[];
  const visit=(e:Element)=>{if(e.localName==='g')groups.push(e.getAttribute('id')??'');for(const c of Array.from(e.children))visit(c);};visit(doc.documentElement);
  const ids=new Set<string>();
  for(const m of a.modules){
    if(!/^[a-z][a-z0-9-]*$/.test(m.id)||ids.has(m.id)||groups.filter(id=>id===m.id).length!==1||!['backdrop','pad'].includes(m.layer)||!bounds(m.bounds)||!finite(m.footLeft,m.footRight)||m.footRight<=m.footLeft)throw Error('Invalid surface POI module');
    if(m.bounds.x<a.bounds.x||m.bounds.y<a.bounds.y||m.bounds.x+m.bounds.width>a.bounds.x+a.bounds.width||m.bounds.y+m.bounds.height>a.bounds.y+a.bounds.height)throw Error('Surface POI module outside asset bounds');
    ids.add(m.id);Object.freeze(m.bounds);Object.freeze(m);
  }
  if(a.modules.filter(m=>m.layer==='pad').length!==1||a.beacons.some(b=>!finite(b.x,b.y)))throw Error('Invalid surface POI anchors');
  a.beacons.forEach(Object.freeze);Object.freeze(a.bounds);Object.freeze(a.pad);Object.freeze(a.modules);Object.freeze(a.beacons);return Object.freeze(a);
}
export function basicOutpost():SurfacePoiAsset{return parsed??=parseSurfacePoiSvg(basicOutpostSvg);}
export function placeSurfacePoi(asset:SurfacePoiAsset,pad:SurfacePad,height:(x:number)=>number){
  if(![pad.left,pad.right,pad.y,pad.centerX].every(Number.isFinite)||pad.right<=pad.left)throw Error('Invalid surface pad');
  const scale=(pad.right-pad.left)/(asset.pad.right-asset.pad.left),x=pad.centerX-(asset.pad.left+asset.pad.right)/2*scale;
  const modules=asset.modules.map(module=>{
    let y=pad.y;
    if(module.layer==='backdrop'){
      const left=x+module.footLeft*scale,right=x+module.footRight*scale;
      y=Math.max(height(left),height(right));
      for(let at=left;at<=right;at+=1)y=Math.max(y,height(at));
      y+=.15; // Tiny visual footing above the sampled terrain; not a collision deck.
    }
    return{module,x,y:y+asset.pad.y*scale,scale};
  });
  if(modules.some(m=>!Number.isFinite(m.y)))throw Error('Invalid surface terrain height');
  return{x,scale,width:asset.bounds.width*scale,modules};
}
export function surfaceBeaconOn(time:number):boolean {
  const t=((time%1.4)+1.4)%1.4;return t<.16||(t>=.30&&t<.46);
}
export function surfacePoiModuleSvg(svg:string,asset:SurfacePoiAsset,module:SurfacePoiModule,theme:SurfacePoiTheme):string {
  const tokens=Object.entries(theme).map(([key,value])=>{
    if(!['wall','roof','edge','trim','dust','glass','light','pad'].includes(key)||!/^#[0-9a-f]{6}$/i.test(value!))throw Error('Invalid surface POI theme');
    return`--poi-${key}:${value};`;
  }).join('');
  const b=module.bounds;
  return svg.replace(/<svg\b[^>]*>/,`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(b.width*2)}" height="${Math.ceil(b.height*2)}" viewBox="${b.x} ${b.y} ${b.width} ${b.height}">`)
    .replace('</svg>',`<style>:root{${tokens}}${asset.modules.map(m=>`#${m.id}{display:${m.id===module.id?'inline':'none'}}`).join('')}</style></svg>`);
}
/** One caller-owned raster set, not a global cache per location/planet. No animated SVG redecodes. */
export function createSurfacePoiArtwork(theme:SurfacePoiTheme={},svg=basicOutpostSvg){
  const asset=svg===basicOutpostSvg?basicOutpost():parseSurfacePoiSvg(svg);
  const rasterPixels=asset.modules.reduce((n,m)=>n+Math.ceil(m.bounds.width*2)*Math.ceil(m.bounds.height*2),0);
  if(rasterPixels>1048576||asset.modules.some(m=>m.bounds.width*2>2048||m.bounds.height*2>2048))throw Error('Surface POI raster budget exceeded');
  const images=new Map<string,HTMLCanvasElement>();let failed=false;
  const ready=Promise.all(asset.modules.map(module=>new Promise<void>((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>{
      try{
        const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
        const ctx=canvas.getContext('2d');if(!ctx)throw Error('Surface POI canvas unavailable');
        ctx.drawImage(image,0,0);images.set(module.id,canvas);resolve();
      }catch(error){reject(error);}finally{image.onload=image.onerror=null;}
    };
    image.onerror=()=>{image.onload=image.onerror=null;reject(Error('Surface POI SVG decode failed'));};
    image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(surfacePoiModuleSvg(svg,asset,module,theme));
  }))).then(()=>undefined).catch(()=>{failed=true;});
  return{asset,images,ready,diagnostics:()=>({ready:images.size===asset.modules.length,failed,images:images.size,pixels:[...images.values()].reduce((n,c)=>n+c.width*c.height,0)})};
}
