// Review-only asynchronous GPU DRAW timing. Excludes Canvas2D copies, mipmaps,
// compositing and presentation; never substitute this for end-to-end frame time.
export function createAtmosphereGpuTimer(gl:WebGL2RenderingContext){
  const extension=gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const pending:WebGLQuery[]=[],samples:number[]=[];
  let active:WebGLQuery|null=null,disposed=false;
  function clear(){
    end();
    for(const query of pending)gl.deleteQuery(query);
    pending.length=0;samples.length=0;
  }
  function poll(){
    if(!extension||disposed||gl.isContextLost())return false;
    if(gl.getParameter(extension.GPU_DISJOINT_EXT)){clear();return false;}
    while(pending.length&&gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE)){
      const query=pending.shift()!,ns=gl.getQueryParameter(query,gl.QUERY_RESULT);
      gl.deleteQuery(query);
      if(typeof ns==='number'&&Number.isFinite(ns)&&ns>=0){
        samples.push(ns/1e6);if(samples.length>60)samples.shift();
      }
    }
    return true;
  }
  function end(){
    if(active){gl.endQuery(extension.TIME_ELAPSED_EXT);pending.push(active);active=null;}
  }
  return{
    begin(){
      // Never wait for results or accumulate an unbounded GPU query queue.
      if(!poll()||active||pending.length>=4)return;
      active=gl.createQuery();if(active)gl.beginQuery(extension.TIME_ELAPSED_EXT,active);
    },
    end,
    snapshot(){
      poll();const sorted=[...samples].sort((a,b)=>a-b);
      return{supported:!!extension,sampleCount:samples.length,pendingQueries:pending.length,
        lastMs:samples.length?samples[samples.length-1]:null,
        meanMs:samples.length?samples.reduce((a,b)=>a+b,0)/samples.length:null,
        p95Ms:sorted.length?sorted[Math.ceil(sorted.length*.95)-1]:null};
    },
    reset(){clear();},
    dispose(){clear();disposed=true;},
  };
}
