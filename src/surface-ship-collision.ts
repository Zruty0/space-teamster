// Whole hull/cab/gear plus swept motion against foreground buildings and graded
// shoulders. Only authored surface sites opt in; legacy worlds keep their physics.
import { SHIP_OUTLINE, CAB_OUTLINE, GEAR_LEFT, GEAR_RIGHT, localToWorld, type ShipState } from './ship';
import { pointInSitePolygon, type SitePoint, type SiteSolid, type SurfaceSite } from './surface-site';
import type { TerrainData } from './terrain';
type Pose=Pick<ShipState,'x'|'y'|'angle'|'facingSign'|'gearDeployed'>;
function cross(a:SitePoint,b:SitePoint,c:SitePoint){return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
function intersects(a:SitePoint,b:SitePoint,c:SitePoint,d:SitePoint){
 if(Math.max(a[0],b[0])<Math.min(c[0],d[0])-1e-8||Math.min(a[0],b[0])>Math.max(c[0],d[0])+1e-8||Math.max(a[1],b[1])<Math.min(c[1],d[1])-1e-8||Math.min(a[1],b[1])>Math.max(c[1],d[1])+1e-8)return false;
 const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);return x*y<=1e-8&&z*w<=1e-8;
}
function overlaps(p:readonly SitePoint[],s:SiteSolid){
 if(Math.max(...p.map(v=>v[0]))<s.left||Math.min(...p.map(v=>v[0]))>s.right||Math.max(...p.map(v=>v[1]))<s.bottom||Math.min(...p.map(v=>v[1]))>s.top)return false;
 if(pointInSitePolygon(p[0][0],p[0][1],s.points)||pointInSitePolygon(s.points[0][0],s.points[0][1],p))return true;
 for(let i=0;i<p.length;i++)for(let j=0;j<s.points.length;j++)if(intersects(p[i],p[(i+1)%p.length],s.points[j],s.points[(j+1)%s.points.length]))return true;
 return false;
}
const obstacles=new WeakMap<SurfaceSite,readonly SiteSolid[]>();
function solids(site:SurfaceSite){
 let all=obstacles.get(site);if(all)return all;
 const shoulders:SiteSolid[]=[];
 for(let i=1;i<site.profile.length;i++){
  const a=site.profile[i-1],b=site.profile[i];
  if(a[0]>=site.left&&b[0]<=site.right)continue; // Flat deck retains normal pad landing rules.
  shoulders.push({id:`grade-${i}`,left:a[0],right:b[0],bottom:Math.min(a[1],b[1]),top:Math.max(a[1],b[1]),points:[a,b]});
 }
 all=[...site.solids,...shoulders];obstacles.set(site,all);return all;
}
function polygons(p:Pose){
 const project=(points:readonly SitePoint[])=>points.map(([x,y])=>localToWorld(x,y,p.x,p.y,p.angle,p.facingSign));
 const out=[project(SHIP_OUTLINE),project(CAB_OUTLINE)];
 if(p.gearDeployed)for(const leg of [GEAR_LEFT,GEAR_RIGHT])for(let i=1;i<leg.length;i++)out.push(project([leg[i-1],leg[i]]));
 return out;
}
export function surfaceShipCollision(terrain:TerrainData,current:Pose,previous:Pose=current):boolean{
 const site=terrain.surfaceSite;if(!site)return false;
 if(Math.max(current.x,previous.x)+12<site.blendLeft||Math.min(current.x,previous.x)-12>site.blendRight)return false;
 const left=Math.min(current.x,previous.x)-12,right=Math.max(current.x,previous.x)+12,bottom=Math.min(current.y,previous.y)-12,top=Math.max(current.y,previous.y)+12;
 const all=solids(site).filter(s=>s.right>=left&&s.left<=right&&s.top>=bottom&&s.bottom<=top);
 if(!all.length)return false;
 const turn=Math.atan2(Math.sin(current.angle-previous.angle),Math.cos(current.angle-previous.angle));
 // Translation is swept exactly by edge quadrilaterals. Rotation is divided into
 // at most2° arcs (<2mm chord error at this rig's radius), not point sampling.
 const steps=Math.max(1,Math.ceil(Math.abs(turn)/(Math.PI/90)));let before=polygons(previous);
 if(before.some(p=>all.some(s=>overlaps(p,s))))return true;
 if(current.x===previous.x&&current.y===previous.y&&current.angle===previous.angle&&current.facingSign===previous.facingSign&&current.gearDeployed===previous.gearDeployed)return false;
 for(let i=1;i<=steps;i++){
  const t=i/steps,pose={...current,x:previous.x+(current.x-previous.x)*t,y:previous.y+(current.y-previous.y)*t,angle:previous.angle+turn*t},after=polygons(pose);
  if(after.some(p=>all.some(s=>overlaps(p,s))))return true;
  for(let j=0;j<Math.min(before.length,after.length);j++)for(let k=0;k<before[j].length;k++){
   const n=(k+1)%before[j].length,sweep=[before[j][k],before[j][n],after[j][n],after[j][k]];
   if(all.some(s=>overlaps(sweep,s)))return true;
  }
  before=after;
 }
 return false;
}
