import '../src/content/estella';
import { BODIES as ESTELLA_BODIES } from '../src/world';
import { drawAuthoredWorldDisc } from '../src/world-disc-appearance';
import { drawBalorDisc } from '../src/balor-appearance';
import { drawOutlineWorld, hasOutlineWorld, LIQUID_DOTS } from '../src/world-outline-appearance';
import { productionWeatherProfiles } from '../src/atmosphere-art-state';
import { createAtmospherePrototype } from '../src/atmosphere-prototype';
import { createShip } from '../src/ship';
import { drawLandingShip } from '../src/renderer';
const highlights=['estella-iii','estella-iv','estella-i','estella-iiia','estella-v','estella-ii'];
const order=(id:string)=>{const i=highlights.indexOf(id);return i<0?100:i;};
const bodies=ESTELLA_BODIES.filter(b=>hasOutlineWorld(b.id)).sort((a,b)=>order(a.id)-order(b.id));
const models=productionWeatherProfiles(1792879200123),byId=new Map(models.map(m=>[m.id,m]));
const world=document.querySelector<HTMLSelectElement>('#world')!,weather=document.querySelector<HTMLInputElement>('#weather')!,slider=document.querySelector<HTMLInputElement>('#time')!,status=document.querySelector('#status')!;
const ship={...createShip(),x:0,y:0},catalogBefore=JSON.stringify(ESTELLA_BODIES);
const cards=new Map<string,{node:HTMLElement;canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D}>(),baseCache=new Map<string,HTMLCanvasElement>();
const engines:ReturnType<typeof createAtmospherePrototype>[]=[];let weatherError='';
try{engines.push(createAtmospherePrototype(512,8));engines.push(createAtmospherePrototype(512,8,'outline'));}
catch(error){engines.forEach(e=>e.dispose());engines.length=0;weatherError=String(error);weather.checked=false;weather.disabled=true;}
let time=0,playing=false,last=performance.now(),lastPaint=0,checking=false;
for(const b of bodies){
 world.add(new Option(b.name,b.id));const node=document.createElement('article');node.id=b.id;
 const title=document.createElement('h2');title.textContent=b.name;const small=document.createElement('small');small.textContent=`${b.id}${byId.has(b.id)?' · animated atmosphere':''}`;title.append(small);
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=360;node.append(title,canvas);document.querySelector('#gallery')!.append(node);cards.set(b.id,{node,canvas,ctx:canvas.getContext('2d')!});
}
function base(id:string){
 const cached=baseCache.get(id);if(cached){baseCache.delete(id);baseCache.set(id,cached);return cached;}
 const b=bodies.find(b=>b.id===id)!,model=weather.checked?byId.get(id):undefined,c=document.createElement('canvas');c.width=960;c.height=360;const ctx=c.getContext('2d')!;
 ctx.fillStyle='#000';ctx.fillRect(0,0,960,360);
 for(const side of [0,1]){
  const offset=side*480;
  ctx.fillStyle='#9cb6a8';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(side?'AFTER · OUTLINES':'BEFORE · CURRENT',240+offset,22);
  for(const [x,y,r]of [[240,180,140],[420,264,22],[420,314,8]]){
   if(side)drawOutlineWorld(ctx,id,x+offset,y,r,0,!!model?.underdeck);
   else if(model?.underdeck){
    ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=model.underdeck;ctx.fill();const shade=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r*1.3);shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,.38)');ctx.fillStyle=shade;ctx.fill();ctx.restore();
   }else if(id==='estella-i')drawBalorDisc(ctx,x,y,r,0);
   else if(!drawAuthoredWorldDisc(ctx,id,x,y,r,b.color))throw Error(`Missing original art: ${id}`);
  }
  ctx.save();ctx.translate(420+offset,88);drawLandingShip(ctx,{x:0,y:0,zoom:2},ship,0,0,0);ctx.restore();
  ctx.fillStyle='#587965';ctx.font='10px monospace';ctx.fillText('RIG',420+offset,117);ctx.fillText('CHART',420+offset,230);
 }
 ctx.strokeStyle='#1d3026';ctx.beginPath();ctx.moveTo(480,0);ctx.lineTo(480,360);ctx.stroke();
 if(baseCache.size>=6){const key=baseCache.keys().next().value!;const old=baseCache.get(key)!;old.width=old.height=1;baseCache.delete(key);}baseCache.set(id,c);return c;
}
function paint(id:string){
 const {ctx}=cards.get(id)!;ctx.drawImage(base(id),0,0);const m=weather.checked?byId.get(id):undefined;
 if(m)for(const [side,engine]of engines.entries()){
  engine.render(time,m.profile);for(const [x,y,r]of [[240,180,140],[420,264,22],[420,314,8]])engine.composite(ctx,x+side*480,y,r,m.profile);
 }
}
function draw(all=false){
 for(const [id,{node}]of cards){node.hidden=world.value!=='all'&&world.value!==id;if(node.hidden)continue;const rect=node.getBoundingClientRect();if(all||rect.bottom>=0&&rect.top<innerHeight+200)paint(id);}
 slider.value=String(time);status.textContent=`${time.toFixed(1)} art seconds · same seed/time both sides · ${bodies.length} worlds${weatherError?' · Static only: '+weatherError:''}`;
}
function pause(){playing=false;document.querySelector('#play')!.textContent='Animate';}
function invalidate(){for(const c of baseCache.values())c.width=c.height=1;baseCache.clear();}
function hash(canvas:HTMLCanvasElement){let h=2166136261;for(const b of canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data)h=Math.imul(h^b,16777619);return h>>>0;}
async function checks(){
 if(checking)throw Error('Checks already running');checking=true;pause();const wasWeather=weather.checked,wasTime=time,wasWorld=world.value;let count=0;
 const assert=(ok:unknown,msg:string)=>{count++;if(!ok)throw Error(msg);};
 const probe=document.createElement('canvas');probe.width=probe.height=320;const ctx=probe.getContext('2d',{willReadFrequently:true})!;
 try{
  assert(engines.length===2,'native weather checks require WebGL2');
  assert(bodies.length===33,'all 33 authored globes represented');assert(LIQUID_DOTS.length<150,'very sparse stable liquid stipple');
  const coverage:Record<string,number>={};
  for(const b of bodies){
   ctx.clearRect(0,0,320,320);let arcPixels=Infinity;
   const guarded=new Proxy(ctx,{get(target,key){
    if(key==='arc')return(...args:Parameters<CanvasRenderingContext2D['arc']>)=>{const m=target.getTransform();arcPixels=args[2]*Math.hypot(m.a,m.b);return target.arc(...args);};
    if(key==='fill'||key==='fillRect')return(...args:any[])=>{
     const liquid=['estella-i','estella-iii','estella-iv'].includes(b.id)&&['#476e79','#c59a58'].includes(String(target.fillStyle))&&arcPixels<=.8&&key==='fill';
     if(target.fillStyle!=='#000000'&&!liquid)throw Error(`Non-outline fill: ${b.id} ${target.fillStyle}`);
     return(target[key]as Function).apply(target,args);
    };
    const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
   },set(target,key,value){return Reflect.set(target,key,value,target);}});
   assert(drawOutlineWorld(guarded,b.id,160,160,140),'outline dispatch / black-only fills except subpixel liquid dots');const first=hash(probe);
   let ink=0,inside=0;const p=ctx.getImageData(0,0,320,320).data;
   for(let y=0;y<320;y++)for(let x=0;x<320;x++){const d=Math.hypot(x+.5-160,y+.5-160),i=(y*320+x)*4;
    if(d<138){inside++;if(Math.max(p[i],p[i+1],p[i+2])>25)ink++;}
    if(d>142&&p[i+3])throw Error(`paint escaped limb: ${b.id}`);
   }
   coverage[b.id]=ink/inside;assert(ink/inside<.25,'mostly negative space even on densely banded giants: '+b.id);assert(ink>10,'surface features retained: '+b.id);
   ctx.clearRect(0,0,320,320);drawOutlineWorld(ctx,b.id,160,160,140);assert(hash(probe)===first,'deterministic geometry replay: '+b.id);
   for(const r of [4,8,22,60,140,300]){ctx.clearRect(0,0,320,320);assert(drawOutlineWorld(ctx,b.id,160,160,r),'chart/close sizes');}
  }
  assert(!drawOutlineWorld(ctx,'unknown',160,160,140),'unknown world declines');
  assert(!drawOutlineWorld(ctx,'estella-iii',0,0,NaN),'invalid view declines');
  const cloudCoverage:Record<string,number>={};
  for(const m of models){
   const engine=engines[1];engine.render(0,m.profile);ctx.clearRect(0,0,320,320);ctx.drawImage(engine.canvas,0,0,320,320);const first=hash(probe);
   const bytes=ctx.getImageData(0,0,320,320).data;let visible=0;for(let i=3;i<bytes.length;i+=4)if(bytes[i]>20)visible++;
   cloudCoverage[m.id]=visible/(Math.PI*160*160);assert(cloudCoverage[m.id]<.24,'wisps do not become filled decks: '+m.id);assert(visible>0,'weather remains visible: '+m.id);
   engine.render(37,m.profile);ctx.clearRect(0,0,320,320);ctx.drawImage(engine.canvas,0,0,320,320);assert(hash(probe)!==first,'weather moves: '+m.id);
   engine.render(0,m.profile);ctx.clearRect(0,0,320,320);ctx.drawImage(engine.canvas,0,0,320,320);assert(hash(probe)===first,'weather rewind replay: '+m.id);
   await new Promise(requestAnimationFrame);
  }
  assert(engines.every(e=>e.diagnostics().noiseCacheEntries<=8&&e.diagnostics().error===0),'bounded noise caches/no WebGL errors');
  assert(JSON.stringify(ESTELLA_BODIES)===catalogBefore,'catalog and physics unchanged');
  return{passed:true,checks:count,coverage,cloudCoverage,worlds:bodies.map(b=>b.id),engines:engines.map(e=>e.diagnostics())};
 }finally{weather.checked=wasWeather;time=wasTime;world.value=wasWorld;invalidate();checking=false;draw(true);}
}
world.onchange=()=>draw(true);weather.onchange=()=>{invalidate();draw(true);};slider.oninput=()=>{pause();time=Number(slider.value);draw(true);};
document.querySelector('#play')!.addEventListener('click',()=>{playing=!playing;last=performance.now();document.querySelector('#play')!.textContent=playing?'Pause':'Animate';});
document.querySelector('#reset')!.addEventListener('click',()=>{time=0;draw(true);});
document.querySelector('#checks')!.addEventListener('click',async()=>{try{const r=await checks();status.textContent=`PASS · ${r.checks} checks`;}catch(e){status.textContent=String(e);}});
window.addEventListener('scroll',()=>{if(!checking)draw();},{passive:true});
function frame(now:number){if(!checking&&playing&&!document.hidden){time+=(now-last)/1000;if(now-lastPaint>100){draw();lastPaint=now;}}last=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);
draw(true);(window as any).planetOutlineGallery={ready:true,checks,render(id='all',seconds=0,showWeather=true){pause();world.value=id;time=seconds;weather.checked=showWeather&&!weatherError;invalidate();draw(true);},snapshot(){return{world:world.value,time,weather:weather.checked,cachedBases:baseCache.size,worldCount:bodies.length};}};
window.addEventListener('pagehide',()=>{engines.forEach(e=>e.dispose());invalidate();},{once:true});
