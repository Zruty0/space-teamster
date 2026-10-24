import { createAtmosphereGpuTimer } from '../src/atmosphere-prototype-timing';
let checks=0;
const assert=(ok:unknown,message:string)=>{checks++;if(!ok)throw Error(message);};
let ready=false,disjoint=false,lost=false,created=0,deleted=0,resultReads=0,active=false;
const records=new Map<WebGLQuery,number>();
const gl={
  QUERY_RESULT_AVAILABLE:1,QUERY_RESULT:2,
  getExtension:()=>({TIME_ELAPSED_EXT:3,GPU_DISJOINT_EXT:4}),
  isContextLost:()=>lost,getParameter:()=>disjoint,
  createQuery(){const q={id:++created}as unknown as WebGLQuery;records.set(q,created*1e6);return q;},
  beginQuery(){assert(!active,'no nested GPU query');active=true;},
  endQuery(){assert(active,'end only an active query');active=false;},
  deleteQuery(q:WebGLQuery){assert(records.has(q),'delete query once');records.delete(q);deleted++;},
  getQueryParameter(q:WebGLQuery,kind:number){if(kind===1)return ready;resultReads++;assert(ready,'never block on pending result');return records.get(q);},
}as unknown as WebGL2RenderingContext;
const timer=createAtmosphereGpuTimer(gl);
for(let i=0;i<20;i++){timer.begin();timer.end();}
assert(created===4&&timer.snapshot().pendingQueries===4,'bounded four-query queue');
assert(resultReads===0&&timer.snapshot().lastMs===null,'unavailable results are not read or reported as zero');
ready=true;const first=timer.snapshot();
assert(first.sampleCount===4&&first.meanMs===2.5&&first.p95Ms===4&&first.lastMs===4,'nanoseconds converted to milliseconds and rolling statistics');
assert(deleted===4,'completed query resources released');
for(let i=0;i<80;i++){timer.begin();timer.end();}
assert(timer.snapshot().sampleCount===60,'bounded sample history');
ready=false;timer.begin();timer.end();disjoint=true;
assert(timer.snapshot().sampleCount===0&&records.size===0,'disjoint results and historical statistics discarded');
const before=created;timer.begin();timer.end();assert(created===before,'no new query while disjoint');
disjoint=false;timer.begin();timer.end();timer.reset();
assert(records.size===0&&timer.snapshot().sampleCount===0,'reset drops warmup samples and pending queries');
lost=true;timer.begin();timer.end();assert(records.size===0,'context loss skips timing');
lost=false;timer.begin();timer.end();timer.dispose();timer.dispose();timer.begin();timer.end();
assert(records.size===0&&!active,'dispose is complete and idempotent');
const missing=createAtmosphereGpuTimer({getExtension:()=>null}as unknown as WebGL2RenderingContext);
missing.begin();missing.end();const fallback=missing.snapshot();missing.reset();missing.dispose();
assert(!fallback.supported&&fallback.meanMs===null&&fallback.sampleCount===0,'explicit unsupported fallback, no invented performance numbers');
console.log(`Atmosphere timing passed: ${checks} assertions; bounded asynchronous queries, disjoint/unsupported/context-loss cleanup.`);
