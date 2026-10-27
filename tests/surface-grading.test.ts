import { gradeSurfaceFootprint, gradedSurfaceHeight } from '../src/surface-grading';
import { parseSurfacePoiSvg, placeSurfacePoi } from '../src/surface-poi';
import { placeSurfaceSite, surfaceSvgSolids } from '../src/surface-site';
let count=0;function assert(ok:unknown,message:string){count++;if(!ok)throw Error(message);}
const near=(a:number,b:number)=>Math.abs(a-b)<1e-8;
for(const [left,right]of [[812,1112],[-25.3,35.7],[100,150],[1000,1800]])for(const width of [20,75,140])for(const slope of [-.3,0,.3]){
 const raw=(x:number)=>80+slope*x+4*Math.sin(x/35),g=gradeSurfaceFootprint(left,right,raw,{blendWidth:width});
 assert(near(g.deckY,(raw(left)+raw(right))/2),'mean of the two native footprint edges, not old pad altitude');
 assert(Object.isFrozen(g)&&Object.isFrozen(g.profile)&&g.profile.every(Object.isFrozen),'immutable authored grading');
 assert(g.profile.length<=2*width/2+6,'bounded shoulder geometry, no redundant interior samples');
 assert(near(gradedSurfaceHeight(g,g.blendLeft)!,raw(g.blendLeft))&&near(gradedSurfaceHeight(g,g.blendRight)!,raw(g.blendRight)),'exact native joins');
 assert(gradedSurfaceHeight(g,left)===g.deckY&&gradedSurfaceHeight(g,right)===g.deckY,'deck joins both shoulders exactly');
 assert(gradedSurfaceHeight(g,g.blendLeft-.001)===undefined&&gradedSurfaceHeight(g,g.blendRight+.001)===undefined,'outside terrain is not overridden');
 for(let i=0;i<g.profile.length;i++){
  const [x,y]=g.profile[i];assert(Number.isFinite(x)&&Number.isFinite(y),'finite mesh');
  if(i)assert(x>g.profile[i-1][0],'no vertical cuts/duplicate vertices');
  const t=x<left?(x-g.blendLeft)/width:(g.blendRight-x)/width,q=Math.max(0,Math.min(1,t));
  const expected=x>=left&&x<=right?g.deckY:raw(x)+(g.deckY-raw(x))*q*q*(3-2*q);
  assert(near(y,expected),'cubic terrain/deck crossfade at every sample');
  if(i){const a=g.profile[i-1],mid=(a[0]+x)/2;assert(near(gradedSurfaceHeight(g,mid)!,(a[1]+y)/2),'lookup interpolates the exact drawn/colliding segments');}
 }
 for(const edge of [g.blendLeft,left,right,g.blendRight]){
  const sample=(x:number)=>gradedSurfaceHeight(g,x)??raw(x);
  assert(Math.abs(sample(edge-.0001)-sample(edge+.0001))<.001,'height continuous through every seam');
 }
 assert(JSON.stringify(g)===JSON.stringify(gradeSurfaceFootprint(left,right,raw,{blendWidth:width})),'deterministic rebuild');
}
for(const options of [{blendWidth:0},{blendWidth:-1},{blendWidth:Infinity},{spacing:0},{spacing:NaN},{blendWidth:10000,spacing:.001}]){
 let failed=false;try{gradeSurfaceFootprint(0,100,()=>1,options);}catch{failed=true;}assert(failed,'invalid/budget-exceeding grading refused');
}
let bad=false;try{gradeSurfaceFootprint(0,100,()=>NaN);}catch{bad=true;}assert(bad,'invalid source terrain refused');
// A distinct, fractional-anchor SVG exercises the future per-POI asset contract.
// It is never registered/enabled in the game.
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100.5 -30 201 60"><metadata>{"version":1,"id":"test-other-site","bounds":{"x":-100.5,"y":-30,"width":201,"height":60},"pad":{"left":-20,"right":20,"y":0},"beacons":[{"x":-19,"y":-2},{"x":19,"y":-2}],"modules":[{"id":"test-hut","layer":"foreground","footLeft":-90,"footRight":-50,"bounds":{"x":-92,"y":-22,"width":44,"height":24}},{"id":"test-pad","layer":"pad","footLeft":-20,"footRight":20,"bounds":{"x":-22,"y":-2,"width":44,"height":4}}]}</metadata><g id="test-hut" transform="translate(-70 0)"><path data-solid="test-hut" fill="#112233" d="M-20 0 V-20 H20 V0Z"/></g><g id="test-pad"><path d="M-20 0 H20"/></g></svg>`;
const asset=parseSurfacePoiSvg(svg),shapes=surfaceSvgSolids(svg,asset);
for(const centerX of [-100,1000])for(const padWidth of [20,56,80]){
 const pad={left:centerX-padWidth/2,right:centerX+padWidth/2,centerX,y:-999};
 const raw=(x:number)=>100+x*.1,site=placeSurfaceSite(asset,shapes,pad,raw,{blendWidth:60}),scale=padWidth/40;
 const art=placeSurfacePoi(asset,{...pad,y:site.deckY},raw);
 assert(site.deckY===100+centerX*.1,'placement derives datum from terrain, never magic old pad Y');
 assert(near(site.right-site.left,201*scale),'fractional custom SVG bounds map correctly');
 assert(near(site.solids[0].top-site.deckY,20*scale)&&near(site.solids[0].left,centerX-90*scale),'custom SVG solids preserve exact scale/offset');
 assert(art.modules.every(m=>m.y===site.deckY),'all custom modules share the resolved physical datum');
 assert(pad.y===-999,'source pad definition is not mutated');
}
console.log(`Surface grading passed: ${count} assertions.`);
