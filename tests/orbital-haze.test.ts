import '../src/content/estella';
import { BODIES } from '../src/world';
import { orbitalHazeOpacity, drawOrbitalHaze } from '../src/orbital-haze';
let n=0;function assert(ok:unknown,msg:string){n++;if(!ok)throw Error(msg);}
const a={height:80000,scaleHeight:8000,surfaceDensity:1.2,color:[80,140,220] as [number,number,number]};
for(const density of [.001,.12,.18,1,1.2,2.2,8,64]){
 let previous=1;for(let h=0;h<=80000;h+=100){const value=orbitalHazeOpacity({...a,surfaceDensity:density},h);assert(value>=0&&value<=.65&&value<=previous,'bounded monotone altitude gradient');previous=value;}
}
for(let h=0;h<80000;h+=1000){let previous=0;for(const d of [.12,.18,1,1.2,2.2,8,64]){const value=orbitalHazeOpacity({...a,surfaceDensity:d},h);assert(value>=previous,'denser air has stronger optical haze');previous=value;}}
assert(orbitalHazeOpacity(null,0)===0&&orbitalHazeOpacity(a,-1)===0&&orbitalHazeOpacity(a,80000)===0,'vacuum / interior / outer edge absent');
for(const bad of [NaN,Infinity,-1,0])assert(orbitalHazeOpacity({...a,scaleHeight:bad},10)===0,'invalid atmosphere rejected');
const calls:any[]=[],stops:any[]=[],ctx=new Proxy({createRadialGradient:(...args:any[])=>{calls.push(['gradient',...args]);return{addColorStop:(u:number,c:string)=>{assert(u>=0&&u<=1,'valid stop');stops.push([u,c]);}};}} as any,{get:(o,k)=>k in o?o[k]:(...args:any[])=>calls.push([k,...args]),set:(o,k,v)=>{o[k]=v;return true;}});
for(const body of BODIES){const before=JSON.stringify(body);calls.length=stops.length=0;const painted=drawOrbitalHaze(ctx,300,300,100,body.radius,body.atmosphere,600,600);assert(painted===!!body.atmosphere,'all and only atmosphere bodies');if(painted){assert(calls.filter(c=>c[0]==='gradient').length===1&&stops.length===25,'one bounded gradient, no texture allocation');assert(stops[stops.length-1][1].endsWith(',0)'),'transparent edge');assert(calls.some(c=>c[0]==='fill'&&c[1]==='evenodd'),'annulus excludes solid surface');}assert(JSON.stringify(body)===before,'catalog immutable');}
for(const args of [[-10000,-10000,100,320000],[300,300,10000,320000],[300,300,3,320000],[300,300,100,Infinity]]){calls.length=0;assert(!drawOrbitalHaze(ctx,...args as [number,number,number,number],a,600,600)&&calls.length===0,'offscreen/inside/tiny/invalid skips all canvas work');}
calls.length=stops.length=0;assert(drawOrbitalHaze(ctx,300,300,100,320000,a,600,600,true)&&stops.length===26,'giant underlap is bounded');
// November 3 tuning: preserve whole profiles, not just saturated surface alpha.
const original=(air:NonNullable<typeof a>,h:number)=>{const rho=air.surfaceDensity*Math.exp(-h/air.scaleHeight),edge=1-h/air.height;return .65*(-Math.expm1(-rho*.65))*edge*edge;};
for(const body of BODIES){const air=body.atmosphere;if(!air||air.surfaceDensity>.22&&air.surfaceDensity<2.2)continue;
 for(let i=0;i<=1000;i++){const h=air.height*i/1000;assert(orbitalHazeOpacity(air,h)===original(air,h),`${body.name}: original complete haze profile retained`);}
}
const kuz= BODIES.find(b=>b.id==='estella-vi')!.atmosphere!;
for(const id of ['estella-iii','estella-iv']){const air=BODIES.find(b=>b.id===id)!.atmosphere!;
 assert(orbitalHazeOpacity(air,0)/original(kuz,0)>.94,'Gaia/Dahai within 6% of original Kuznia limb opacity');
 for(let i=0;i<100;i++){const h=air.height*i/100;assert(orbitalHazeOpacity(air,h)>original(air,h),'mid-density haze boosted throughout altitude fade');}
}
let prev=0;for(let i=0;i<=3000;i++){const alpha=orbitalHazeOpacity({...a,surfaceDensity:i/1000},0);assert(alpha>=prev,'nonlinear density mapping never reverses');prev=alpha;}
for(const anchor of [.22,2.2])assert(Math.abs(orbitalHazeOpacity({...a,surfaceDensity:anchor-1e-7},0)-orbitalHazeOpacity({...a,surfaceDensity:anchor+1e-7},0))<1e-6,'continuous density anchors');
console.log(`Orbital haze: ${n} assertions passed.`);
