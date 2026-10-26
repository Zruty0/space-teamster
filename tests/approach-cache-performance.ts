// Desktop-only render benchmark, invoked from the save-free flight fixture.
// Includes cold frames and repeated LOD changes; no readbacks in timed loops.
// Since the outline rollout, synchronous v1 retains HISTORICAL FILLED art. This
// is no longer a same-art scheduling comparison; report the art style explicitly.
import { createApproachScenery } from '../src/approach-scenery-runtime';
import { createSynchronousGroundReference } from './fixtures/approach-ground-sync-v1';
import type { ApproachSceneryPainter } from '../src/approach';
const stats=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return{mean:values.reduce((a,b)=>a+b,0)/values.length,p95:sorted[Math.ceil(sorted.length*.95)-1],max:sorted[sorted.length-1]};};
export async function measureApproachCache(render:(painter:ApproachSceneryPainter,cam:Parameters<ApproachSceneryPainter>[1])=>void){
 const reports=[];
 for(const scenario of ['cold','zoom']as const)for(const mode of ['synchronous','incremental']as const){
  const painter=mode==='synchronous'?createSynchronousGroundReference():createApproachScenery();
  const cpu:number[]=[],intervals:number[]=[],trace:unknown[]=[];let last=0,first=0,readyFrame=-1,readyMs=-1,maxPixels=0,maxEntries=0;
  const frames=scenario==='cold'?120:360;
  try{
   for(let i=0;i<frames;i++){
    const now=await new Promise<number>(resolve=>requestAnimationFrame(resolve));if(!i)first=performance.now();
    const zoom=scenario==='cold'?.065:.008+.072*(1-Math.abs(i/179.5-1));
    const cam={x:-1200+i*60,y:2000,zoom};
    const start=performance.now();render(painter,cam);const cost=performance.now()-start;cpu.push(cost);
    if(i)intervals.push(now-last);last=now;
    const d=painter.diagnostics();maxPixels=Math.max(maxPixels,d.pixels);maxEntries=Math.max(maxEntries,d.entries);
    if(d.failures||d.pixels>8388608||d.entries>32)throw Error(`Cache failure: ${JSON.stringify(d)}`);
    if(readyFrame<0&&d.visibleMissing===0){readyFrame=i;readyMs=performance.now()-first;}
    trace.push({i,zoom,cpu:cost,...d});
   }
   const raf=stats(intervals);
   reports.push({scenario,mode,art:mode==='synchronous'?'historical-filled-v1':'current-outline',width:1920,height:1080,frames,firstFrameMs:cpu[0],cpu:stats(cpu),raf,fps:1000/raf.mean,
    intervalsOver20ms:intervals.filter(v=>v>20).length,readyFrame,readyMs,maxPixels,maxEntries,diagnostics:painter.diagnostics(),trace});
  }finally{painter.clear();}
 }
 return reports;
}
