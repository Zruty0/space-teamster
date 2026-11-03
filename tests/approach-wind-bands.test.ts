import { drawRegionalWindBands } from '../src/approach-wind-bands';
let checks=0;const assert=(ok:unknown,msg:string)=>{checks++;if(!ok)throw Error(msg);};
const calls:any[]=[],samples:number[][]=[];
const ctx=new Proxy({} as any,{get:(_o,k)=>(...args:any[])=>calls.push([k,...args]),set:(_o,k,v)=>{calls.push([k,v]);return true;}});
const cam={x:0,y:2500,zoom:.065},before=JSON.stringify(cam);
const air={sample:(x:number,y:number,time:number)=>{samples.push([x,y,time]);return{vx:time<10?12:-8,density:1};}};
const draw=(time:number,wind=air)=>{calls.length=samples.length=0;return drawRegionalWindBands(ctx,cam,wind,()=>0,80000,1200,720,time);};
assert(draw(0)>0,'regional air has visible bands without legacy wind layers');
assert(calls.some(c=>c[0]==='fillText'&&c[1]==='→ 12.0 m/s'),'actual velocity units and rightward direction');
assert(calls.filter(c=>c[0]==='fillText').every(c=>c[2]>=220),'band labels clear of left telemetry');
assert(calls.filter(c=>c[0]==='clip').length===2,'both atmosphere ceiling and terrain clipping');
assert(samples.every(s=>s[2]===0),'supplied mission time used unchanged');
const first=JSON.stringify(calls);draw(0);assert(JSON.stringify(calls)===first,'paused redraw/retry identical');
draw(20);assert(calls.some(c=>c[0]==='fillText'&&c[1]==='← 8.0 m/s'),'wind reversal sampled live');
assert(samples.every(s=>s[2]===20),'no wall-clock sampling');
for(const s of [{vx:0,density:1},{vx:20,density:0},{vx:NaN,density:1},{vx:20,density:NaN}]){assert(draw(0,{sample:()=>s})===0&&!calls.some(c=>c[0]==='stroke'||c[0]==='fillText'),'calm/vacuum/invalid air paints no bands');}
assert(JSON.stringify(cam)===before,'camera immutable');
samples.length=0;assert(drawRegionalWindBands(ctx,{x:0,y:0,zoom:.00001},air,()=>0,1e10,10000,10000,0)<=26&&samples.length<2600,'bounded rows / samples at wide zoom');
console.log(`Approach regional wind bands: ${checks} checks passed.`);
