// Physical Dawes forecourt: one flat deck in the SVG footprint, exact SVG solids.
import svg from '../art/surface/basic-outpost.svg?raw';
import { basicOutpost, usesDawesSurfaceArt, type SurfacePad, type SurfacePoiModule } from './surface-poi';
import { flattenPath } from './local-layouts';
export type SitePoint=readonly[number,number];
export interface SiteSolid {id:string;points:readonly SitePoint[];left:number;right:number;bottom:number;top:number;}
export interface SurfaceSite {left:number;right:number;deckY:number;leftHeight:number;rightHeight:number;solids:readonly SiteSolid[];}
let shapes:readonly{id:string;points:readonly SitePoint[]}[]|undefined;
export function surfaceSvgSolids(){
 if(shapes)return shapes;
 const asset=basicOutpost(),stack:Array<{x:number;y:number;module?:SurfacePoiModule}>=[{x:0,y:0}],out:Array<{id:string;points:readonly SitePoint[]}>=[];
 for(const match of svg.matchAll(/<\/?g\b[^>]*>|<path\b[^>]*>/g)){
  const tag=match[0];
  if(tag.startsWith('</g')){if(stack.length===1)throw Error('Unbalanced surface group');stack.pop();continue;}
  if(tag.startsWith('<g')){
   const transform=tag.match(/\btransform="([^"]+)"/)?.[1],offset=stack[stack.length-1];let x=0,y=0;
   if(transform){const t=transform.match(/^translate\(\s*([-\d.]+)[ ,]+([-\d.]+)\s*\)$/);if(!t)throw Error('Surface solid groups require translate transforms');x=Number(t[1]);y=Number(t[2]);}
   const id=tag.match(/\bid="([^"]+)"/)?.[1];
   stack.push({x:offset.x+x,y:offset.y+y,module:asset.modules.find(m=>m.id===id)??offset.module});continue;
  }
  const id=tag.match(/\bdata-solid="([^"]+)"/)?.[1];if(!id)continue;
  const data=tag.match(/\bd="([^"]+)"/)?.[1];if(!data||(data.match(/[mM]/g)?.length??0)!==1)throw Error('Surface solids require one closed contour');
  const path=flattenPath(data),{x,y,module}=stack[stack.length-1];if(!path.closed||path.points.length<4||module?.layer!=='foreground')throw Error('Surface solids must be closed foreground paths');
  const b=module.bounds,points=path.points.map(p=>Object.freeze([p.x+x,p.y+y]as const));
  if(points.some(([a,c])=>a<b.x||a>b.x+b.width||c<b.y||c>b.y+b.height)||/\bfill="none"/.test(tag))throw Error('Surface solid is outside its painted crop');
  out.push(Object.freeze({id,points:Object.freeze(points)}));
 }
 if(stack.length!==1||!out.length||new Set(out.map(p=>p.id)).size!==out.length)throw Error('Invalid outpost solid roster');
 return shapes=Object.freeze(out);
}
export function createSurfaceSite(level:{body:{id:string};poi:{id:string};landingLayout?:unknown},pad:SurfacePad,originalHeight:(x:number)=>number):SurfaceSite|undefined{
 if(!usesDawesSurfaceArt(level))return undefined;
 const asset=basicOutpost(),scale=(pad.right-pad.left)/(asset.pad.right-asset.pad.left),origin=pad.centerX-(asset.pad.left+asset.pad.right)/2*scale;
 const left=origin+asset.bounds.x*scale,right=left+asset.bounds.width*scale;
 const solids=surfaceSvgSolids().map(s=>{
  const points=s.points.map(([x,y])=>Object.freeze([origin+x*scale,pad.y+(asset.pad.y-y)*scale]as const));
  return Object.freeze({id:s.id,points:Object.freeze(points),left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),bottom:Math.min(...points.map(p=>p[1])),top:Math.max(...points.map(p=>p[1]))});
 });
 return Object.freeze({left,right,deckY:pad.y,leftHeight:originalHeight(left),rightHeight:originalHeight(right),solids:Object.freeze(solids)});
}
export function pointInSitePolygon(x:number,y:number,p:readonly SitePoint[]):boolean{
 let inside=false;
 for(let i=0,j=p.length-1;i<p.length;j=i++){
  const [ax,ay]=p[j],[bx,by]=p[i],cross=(x-ax)*(by-ay)-(y-ay)*(bx-ax);
  if(Math.abs(cross)<1e-8&&x>=Math.min(ax,bx)-1e-8&&x<=Math.max(ax,bx)+1e-8&&y>=Math.min(ay,by)-1e-8&&y<=Math.max(ay,by)+1e-8)return true;
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside;
}
export function pointHitsSite(site:SurfaceSite,x:number,y:number){return site.solids.some(s=>x>=s.left&&x<=s.right&&y>=s.bottom&&y<=s.top&&pointInSitePolygon(x,y,s.points));}
