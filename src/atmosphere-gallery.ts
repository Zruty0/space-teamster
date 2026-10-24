// Desktop review gallery only. No production renderer, weather, saves or clock integration.
import { createAtmospherePrototype } from './atmosphere-prototype';
import { weatherSampleSets, WEATHER_DIRECTIONS, WEATHER_SAMPLE_COUNT, WEATHER_RANGE_VERSION, type WeatherSet } from './atmosphere-gallery-profiles';
import { drawAuthoredWorldDisc } from './world-disc-appearance';
import { ESTELLA_BODY_FLIGHT_PROFILES } from './content/estella/physics';
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id)as T;
const status=el('status'),positions=Object.freeze([[215,151,132],[132,319,5],[200,319,12],[280,319,24]]as const);
interface Card{set:WeatherSet;index:number;root:HTMLElement;canvas:HTMLCanvasElement;base:HTMLCanvasElement;original:HTMLCanvasElement;input:HTMLInputElement;output:HTMLOutputElement;summary:HTMLElement;parameters:HTMLElement;visible:boolean;draws:number;}
let generator:ReturnType<typeof createAtmospherePrototype>|undefined;
try{
  const url=new URL(location.href),version=url.searchParams.get('version');
  if(version&&version!==WEATHER_RANGE_VERSION)throw Error('Unsupported weather range version; open this page without its query to start a new batch.');
  let batchSeed=url.searchParams.has('seed')?Number(url.searchParams.get('seed')):Date.now();
  let sets=weatherSampleSets(batchSeed),seconds=Number(url.searchParams.get('t')??0);
  if(!Number.isFinite(seconds)||seconds<0)seconds=0;
  let playing=!url.searchParams.has('test'),last=performance.now(),lastPaint=0,disposed=false,lastTimeSeed=Date.now();
  // One WebGL context/output; eight cached noise seeds (2MiB R8 total), not80
  // generators or an animation-frame cache. Each card retains only its image.
  generator=createAtmospherePrototype(256,WEATHER_DIRECTIONS.length);
  const engine=generator,cards:Card[]=[],grid=el('worlds');
  function original(ctx:CanvasRenderingContext2D,id:string,x:number,y:number,r:number){
    const tint=ESTELLA_BODY_FLIGHT_PROFILES[id]?.color??[160,170,180];
    if(!drawAuthoredWorldDisc(ctx,id,x,y,r,tint))throw Error(`Missing approved globe: ${id}`);
  }
  function paintBase(set:WeatherSet,animated:boolean){
    const c=document.createElement('canvas');c.width=400;c.height=360;const ctx=c.getContext('2d')!;
    ctx.fillStyle='#07111b';ctx.fillRect(0,0,400,360);
    original(ctx,set.direction.id,42,40,26);
    ctx.fillStyle='#9fb7c9';ctx.font='11px system-ui';ctx.fillText('Original',18,81);
    for(const [x,y,r]of positions){
      if(animated&&set.direction.underdeck){
        // Acheron's opaque cloud underdeck, not invented/exposed terrain. Its
        // old static cloud illustration is retained in the original reference.
        ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=set.direction.underdeck;ctx.fill();
        const shade=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r*1.3);
        shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,.38)');ctx.fillStyle=shade;ctx.fill();
      }else original(ctx,set.direction.id,x,y,r);
    }
    ctx.textAlign='center';ctx.fillStyle='#819bab';ctx.fillText('Same weather frame at every size',200,355);
    return c;
  }
  const selectedProfile=(card:Card)=>card.set.samples[card.index];
  const hex=(rgb:readonly number[])=>'#'+rgb.map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');
  function syncCard(card:Card){
    const p=selectedProfile(card);card.input.value=String(card.index+1);card.output.textContent=`${card.index+1} / ${WEATHER_SAMPLE_COUNT}`;
    card.summary.textContent=`Cloud ${hex(p.cloudColor)} · amount ${p.coverage.toFixed(2)} · thickness ${p.opticalDepth.toFixed(2)} · ${p.vortexCount} vortices · loop ${p.loopSeconds.toFixed(0)}s · drift ${p.zonalTurns} turns`;
    card.parameters.textContent=JSON.stringify({sample:card.index+1,profile:p,allowedRanges:card.set.direction.ranges,cloudColors:card.set.direction.cloudColors,hazeColors:card.set.direction.hazeColors},null,2);
  }
  let pendingURL:string|undefined,urlTimer:number|undefined,lastURLWrite=-Infinity;
  function flushURL(){
    if(urlTimer!==undefined)clearTimeout(urlTimer);urlTimer=undefined;
    if(pendingURL&&!disposed){history.replaceState(null,'',pendingURL);pendingURL=undefined;lastURLWrite=performance.now();}
  }
  function syncURL(){
    const next=new URL(location.href);next.searchParams.set('version',WEATHER_RANGE_VERSION);next.searchParams.set('seed',String(batchSeed));next.searchParams.set('t',String(seconds));
    for(const card of cards)next.searchParams.set(card.set.direction.id,String(card.index+1));
    // Keep the review link exact immediately, but limit address-bar writes.
    // Rapid scrubbing/testing otherwise triggers Chromium's history flood guard.
    pendingURL=next.href;el<HTMLAnchorElement>('permalink').href=next.href;
    if(performance.now()-lastURLWrite>=250)flushURL();
    else if(urlTimer===undefined)urlTimer=window.setTimeout(flushURL,250-(performance.now()-lastURLWrite));
    el<HTMLInputElement>('batch').value=String(batchSeed);
  }
  function syncTransport(){el('play').textContent=playing?'Pause':'Play';el('clock').textContent=`${seconds.toFixed(1)}s`;}
  function drawCard(card:Card){
    const ctx=card.canvas.getContext('2d',{willReadFrequently:false})!,show=el<HTMLInputElement>('weather').checked,p=selectedProfile(card);
    ctx.clearRect(0,0,400,360);ctx.drawImage(show?card.base:card.original,0,0);
    if(show){engine.render(seconds,p);for(const [x,y,r]of positions)engine.composite(ctx,x,y,r,p);}
    card.draws++;
  }
  function draw(all=false){
    const start=performance.now();let painted=0;
    for(const card of cards)if(all||card.visible){drawCard(card);painted++;}
    const gpu=engine.timing();
    status.textContent=`Batch ${batchSeed} · ${sets.length} worlds × 10 samples · ${painted} cards updated · one 256px generator · ${(performance.now()-start).toFixed(1)}ms CPU submission${gpu.meanMs===null?'':` · ${gpu.meanMs.toFixed(2)}ms mean GPU cloud draw (excludes copies/composite)`}`;
    syncTransport();
  }
  function select(id:string,index:number){
    const card=cards.find(c=>c.set.direction.id===id);
    if(!card||!Number.isInteger(index)||index<0||index>=WEATHER_SAMPLE_COUNT)throw Error('Unknown world or sample index');
    if(card.index!==index)engine.releaseNoise(selectedProfile(card).seed);
    card.index=index;syncCard(card);drawCard(card);syncURL();
  }
  for(const set of sets){
    const root=document.createElement('section');root.className='world';root.dataset.world=set.direction.id;
    const heading=document.createElement('h2');heading.textContent=set.direction.name;
    const description=document.createElement('p');description.textContent=set.direction.description;
    const canvas=document.createElement('canvas');canvas.width=400;canvas.height=360;canvas.setAttribute('aria-label',`${set.direction.name} animated atmosphere`);
    const label=document.createElement('label');label.textContent=`${set.direction.name} sample `;
    const input=document.createElement('input'),output=document.createElement('output');input.type='range';input.min='1';input.max=String(WEATHER_SAMPLE_COUNT);input.step='1';input.dataset.world=set.direction.id;label.append(output,input);
    const summary=document.createElement('p');summary.className='metrics';
    const details=document.createElement('details'),title=document.createElement('summary'),parameters=document.createElement('pre');title.textContent='Selected parameters and predefined ranges';details.append(title,parameters);
    root.append(heading,description,canvas,label,summary,details);grid.append(root);
    const value=Number(url.searchParams.get(set.direction.id)??1),index=Number.isInteger(value)&&value>=1&&value<=WEATHER_SAMPLE_COUNT?value-1:0;
    const approved=paintBase(set,false),base=set.direction.underdeck?paintBase(set,true):approved;
    const card:Card={set,index,root,canvas,base,original:approved,input,output,summary,parameters,visible:true,draws:0};cards.push(card);
    input.oninput=()=>select(set.direction.id,Number(input.value)-1);syncCard(card);
  }
  function reroll(seed:number){
    const next=weatherSampleSets(seed);sets=next;batchSeed=seed;el('seed-error').textContent='';
    cards.forEach((card,i)=>{card.set=next[i];syncCard(card);});syncURL();draw(true);
  }
  el('play').onclick=()=>{playing=!playing;last=performance.now();syncTransport();syncURL();};
  el('reset').onclick=()=>{seconds=0;syncURL();draw(true);};
  el('reroll').onclick=()=>{lastTimeSeed=Math.max(Date.now(),lastTimeSeed+1);reroll(lastTimeSeed);};
  el('seed-form').onsubmit=e=>{e.preventDefault();try{reroll(Number(el<HTMLInputElement>('batch').value));}catch(error){el('seed-error').textContent=String(error);}};
  el('weather').onchange=()=>draw(true);
  function snapshot(){return{version:WEATHER_RANGE_VERSION,batchSeed,seconds,worlds:cards.map(card=>({id:card.set.direction.id,name:card.set.direction.name,selectedSample:card.index+1,profile:selectedProfile(card),samples:card.set.samples}))};}
  el('export').onclick=()=>{
    const objectURL=URL.createObjectURL(new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=objectURL;link.download=`weather-review-${batchSeed}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(objectURL),1000);
  };
  syncURL();draw(true);
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){const card=cards.find(c=>c.canvas===entry.target);if(card){card.visible=entry.isIntersecting;if(card.visible&&!playing&&!disposed)drawCard(card);}}});
  cards.forEach(card=>observer.observe(card.canvas));
  function frame(now:number){
    if(disposed)return;const elapsed=Math.max(0,(now-last)/1000);last=now;
    if(playing&&!document.hidden){seconds+=elapsed*Number(el<HTMLSelectElement>('speed').value);if(now-lastPaint>=100){draw();lastPaint=now;}}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);document.addEventListener('visibilitychange',()=>{last=performance.now();});
  window.addEventListener('pagehide',()=>{disposed=true;if(urlTimer!==undefined)clearTimeout(urlTimer);observer.disconnect();engine.dispose();},{once:true});
  const api={ready:true,cloudCanvas:engine.canvas,snapshot,select,reroll,
    render(time:number){if(!Number.isFinite(time)||time<0)throw Error('Invalid review time');seconds=time;playing=false;draw(true);syncURL();return engine.diagnostics();},
    canvas(id:string){return cards.find(c=>c.set.direction.id===id)?.canvas;},
    diagnostics(){return{...engine.diagnostics(),playing,seconds,cards:cards.map(c=>({id:c.set.direction.id,visible:c.visible,draws:c.draws}))};},
  };
  (window as any).atmosphereGallery=api;
  engine.canvas.addEventListener('webglcontextlost',()=>{
    disposed=true;playing=false;observer.disconnect();status.textContent='Graphics context lost. Reload the review gallery; the game is unchanged.';
    (window as any).atmosphereGallery={ready:false,error:status.textContent};
    document.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLSelectElement>('input,button,select').forEach(c=>{c.disabled=true;});
  });
}catch(error){
  generator?.dispose();status.textContent=`Gallery unavailable: ${String(error)}`;(window as any).atmosphereGallery={ready:false,error:String(error)};
  document.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLSelectElement>('input,button,select').forEach(c=>{c.disabled=true;});
}
