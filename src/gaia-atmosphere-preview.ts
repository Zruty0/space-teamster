// Review entry point only; not imported by index.html or production rendering.
import { createAtmospherePrototype, atmosphereProfile, atmospherePhase, GAIA_ATMOSPHERE_PROFILE, type AtmosphereProfile } from './atmosphere-prototype';
import { drawGaiaDisc } from './world-disc-appearance';
const element=<T extends HTMLElement>(id:string)=>document.getElementById(id)as T;
const status=element('status');
try{
  const generator=createAtmospherePrototype(512),canvas=element<HTMLCanvasElement>('view'),ctx=canvas.getContext('2d')!;
  let profile=GAIA_ATMOSPHERE_PROFILE,seconds=0,playing=!new URLSearchParams(location.search).has('test'),last=performance.now(),lastPaint=0;
  let drawMs=0,disposed=false;
  const controls=element('controls'),inputs=new Map<keyof AtmosphereProfile,HTMLInputElement>();
  const specifications:[keyof AtmosphereProfile,string,number,number][]=[
    ['coverage','Lower cloud amount',0,1],['fronts','Frontal structure',0,1.5],['scale','Cloud feature scale',.4,2.5],['detail','Fine texture / erosion',0,1],
    ['shear','Wind shear',0,1.5],['evolution','Slow shape evolution',0,1.5],['cirrus','High cirrus',0,1],['opticalDepth','Cloud thickness',.2,8],
    ['haze','Blue atmospheric veil',0,1],['shadow','Cloud shadows',0,.5],
  ];
  function sync(){
    for(const [key,input]of inputs){input.value=String(profile[key]);input.parentElement!.querySelector('output')!.textContent=Number(profile[key]).toFixed(2);}
    element<HTMLInputElement>('seed').value=String(profile.seed);
    element('profile').textContent=JSON.stringify(profile,null,2);
    element<HTMLInputElement>('scrub').max=String(profile.loopSeconds);
    element('play').textContent=playing?'Pause':'Play';
  }
  function draw(){
    const start=performance.now();generator.render(seconds,profile);
    ctx.clearRect(0,0,1200,660);ctx.fillStyle='#060e17';ctx.fillRect(0,0,1200,660);ctx.textAlign='center';
    ctx.fillStyle='#c8dfec';ctx.font='17px system-ui';ctx.fillText('APPROVED GAIA — UNCHANGED SURFACE',285,30);ctx.fillText('GAIA — LIVE ATMOSPHERE PROTOTYPE',900,30);
    drawGaiaDisc(ctx,285,290,225);
    if(!element<HTMLInputElement>('cloudOnly').checked)drawGaiaDisc(ctx,900,290,225);
    generator.composite(ctx,900,290,225,profile);
    ctx.fillStyle='#88a6ba';ctx.font='12px system-ui';ctx.fillText('Fixed land, ocean and ice. No surface rotation.',285,550);ctx.fillText('Wind-driven structure; translucent edges; separate high deck.',900,550);
    for(const [i,r]of [3,8,14,28,48].entries()){
      const x=110+i*85;drawGaiaDisc(ctx,x,610,r);drawGaiaDisc(ctx,x+615,610,r);generator.composite(ctx,x+615,610,r,profile);
    }
    const phase=atmospherePhase(seconds,profile.loopSeconds);
    element<HTMLInputElement>('scrub').value=String(phase*profile.loopSeconds);element('clock').textContent=`${(phase*profile.loopSeconds).toFixed(1)} / ${profile.loopSeconds}s`;
    drawMs=performance.now()-start;
    status.textContent=`Seed ${profile.seed} · 512px cloud field · ${drawMs.toFixed(1)}ms CPU submission (not GPU timing) · ${playing?'playing':'paused'} · no game saves accessed`;
  }
  function setProfile(changes:Partial<AtmosphereProfile>){profile=atmosphereProfile({...profile,...changes});sync();draw();}
  for(const [key,name,min,max]of specifications){
    const label=document.createElement('label'),title=document.createElement('span'),output=document.createElement('output'),input=document.createElement('input');
    title.textContent=name;input.type='range';input.min=String(min);input.max=String(max);input.step='.01';input.dataset.key=key;
    input.oninput=()=>setProfile({[key]:Number(input.value)});label.append(title,output,input);controls.append(label);inputs.set(key,input);
  }
  element('play').onclick=()=>{playing=!playing;last=performance.now();sync();draw();};
  element('reset').onclick=()=>{seconds=0;draw();};
  element<HTMLInputElement>('scrub').oninput=()=>{playing=false;seconds=Number(element<HTMLInputElement>('scrub').value);sync();draw();};
  element('cloudOnly').onchange=()=>draw();
  element<HTMLInputElement>('seed').onchange=()=>setProfile({seed:Number(element<HTMLInputElement>('seed').value)});
  element('balanced').onclick=()=>{profile=GAIA_ATMOSPHERE_PROFILE;sync();draw();};
  element('broken').onclick=()=>{profile=atmosphereProfile({...GAIA_ATMOSPHERE_PROFILE,coverage:.35,fronts:.4,cirrus:.16});sync();draw();};
  element('fronts').onclick=()=>{profile=atmosphereProfile({...GAIA_ATMOSPHERE_PROFILE,coverage:.60,fronts:1.2,cirrus:.4});sync();draw();};
  element('export').onclick=()=>{
    const filename=`gaia-cloud-${profile.seed}-${Math.round(seconds*10)}.png`;
    generator.canvas.toBlob(blob=>{
      if(!blob)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
  };
  sync();draw();
  function frame(now:number){
    if(disposed)return;
    const elapsed=(now-last)/1000;last=now;
    if(playing&&!document.hidden){seconds+=Math.max(0,elapsed)*Number(element<HTMLSelectElement>('speed').value);if(now-lastPaint>=66){draw();lastPaint=now;}}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{last=performance.now();});
  window.addEventListener('pagehide',()=>{disposed=true;generator.dispose();},{once:true});
  // Explicit time/profile entry points for desktop native tests and later baking.
  const api={
    ready:true,
    cloudCanvas:generator.canvas,
    render(time:number,changes:Partial<AtmosphereProfile>={}){playing=false;seconds=time;profile=atmosphereProfile({...GAIA_ATMOSPHERE_PROFILE,...changes});sync();draw();return{profile,drawMs,...generator.diagnostics()};},
    cloudPixels(){const c=document.createElement('canvas');c.width=c.height=generator.resolution;const p=c.getContext('2d',{willReadFrequently:true})!;p.drawImage(generator.canvas,0,0);return p.getImageData(0,0,c.width,c.height).data;},
    phase:atmospherePhase,
    defaults:GAIA_ATMOSPHERE_PROFILE,
  };
  (window as any).gaiaAtmospherePreview=api;
  generator.canvas.addEventListener('webglcontextlost',()=>{
    disposed=true;playing=false;sync();
    const message='Graphics context lost. Reload this preview; the game is unchanged.';
    status.textContent=message;(window as any).gaiaAtmospherePreview={ready:false,error:message};
    document.querySelectorAll<HTMLButtonElement|HTMLInputElement|HTMLSelectElement>('button,input,select').forEach(control=>{control.disabled=true;});
  });
  element('checks').onclick=async()=>{
    const saved=profile,time=seconds,cloudOnly=element<HTMLInputElement>('cloudOnly');
    const wasCloudOnly=cloudOnly.checked;cloudOnly.checked=false;playing=false;sync();
    let message='';
    try{
      const {checkAtmosphereNative}=await import('../tests/atmosphere-native-checks');
      const result=checkAtmosphereNative(api,canvas);
      message=`PASS — ${result.checks} native checks; loop seam, replay, alpha, controls and unchanged Gaia. Sampled cloud pixels ${(result.cloudCoverage*100).toFixed(1)}% at start.`;
    }catch(error){message=`FAIL — ${String(error)}`;}
    profile=saved;seconds=time;cloudOnly.checked=wasCloudOnly;sync();draw();status.textContent=message;
  };
}catch(error){status.textContent=`Atmosphere preview unavailable: ${String(error)}`;(window as any).gaiaAtmospherePreview={ready:false,error:String(error)};console.error(error);}
