// Asset-independent grading: one flat site, smooth shoulders, untouched terrain
// beyond them. The sampled profile is shared by drawing, height lookup and collision.
export type GradePoint=readonly[number,number];
export interface SurfaceGradingOptions {blendWidth?:number;spacing?:number;}
export interface SurfaceGrading {
 readonly left:number;readonly right:number;readonly deckY:number;
 readonly blendLeft:number;readonly blendRight:number;
 readonly nativeLeftHeight:number;readonly nativeRightHeight:number;
 readonly profile:readonly GradePoint[];
}
export function gradeSurfaceFootprint(left:number,right:number,nativeHeight:(x:number)=>number,options:SurfaceGradingOptions={}):SurfaceGrading{
 const width=options.blendWidth??Math.max(40,Math.min(200,(right-left)*.25)),spacing=options.spacing??2;
 if(![left,right,width,spacing].every(Number.isFinite)||right<=left||width<=0||spacing<=0||2*width/spacing>8192)throw Error('Invalid surface grading bounds/budget');
 const nativeLeftHeight=nativeHeight(left),nativeRightHeight=nativeHeight(right),deckY=(nativeLeftHeight+nativeRightHeight)/2;
 const blendLeft=left-width,blendRight=right+width;
 if(!(blendLeft<left&&blendRight>right)||![blendLeft,blendRight].every(x=>Number.isSafeInteger(Math.floor(x/spacing))))throw Error('Unrepresentable surface grading grid');
 const smooth=(t:number)=>t*t*(3-2*t);
 const height=(x:number)=>{
  const raw=nativeHeight(x);if(!Number.isFinite(raw))throw Error('Invalid native surface height');
  if(x>=left&&x<=right)return deckY;
  const t=x<left?(x-blendLeft)/width:(blendRight-x)/width,w=smooth(Math.max(0,Math.min(1,t)));
  return raw+(deckY-raw)*w;
 };
 if(![nativeLeftHeight,nativeRightHeight,deckY].every(Number.isFinite))throw Error('Invalid surface datum');
 // Preserve the native world grid, but insert exact site/shoulder endpoints even
 // when a future SVG has fractional metre anchors. Flat interior needs no samples.
 const xs=new Set<number>([blendLeft,left,right,blendRight]);
 for(const [a,b]of [[blendLeft,left],[right,blendRight]])for(let i=Math.floor(a/spacing)+1;i*spacing<b;i++)xs.add(i*spacing);
 const profile=Object.freeze([...xs].sort((a,b)=>a-b).map(x=>Object.freeze([x,height(x)]as const)));
 return Object.freeze({left,right,deckY,blendLeft,blendRight,nativeLeftHeight,nativeRightHeight,profile});
}
export function gradedSurfaceHeight(grade:SurfaceGrading,x:number):number|undefined{
 if(x<grade.blendLeft||x>grade.blendRight)return undefined;
 if(x>=grade.left&&x<=grade.right)return grade.deckY;
 const p=grade.profile;let lo=0,hi=p.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(p[mid][0]<=x)lo=mid;else hi=mid;}
 return p[lo][1]+(p[hi][1]-p[lo][1])*(x-p[lo][0])/(p[hi][0]-p[lo][0]);
}
