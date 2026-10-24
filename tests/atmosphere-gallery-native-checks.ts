import type { AtmosphereProfile } from '../src/atmosphere-prototype-profile';
interface Gallery{
 snapshot():{batchSeed:number;worlds:{id:string;selectedSample:number;profile:AtmosphereProfile;samples:readonly AtmosphereProfile[]}[]};
 select(id:string,index:number):void;reroll(seed:number):void;render(time:number):unknown;
 canvas(id:string):HTMLCanvasElement|undefined;
 diagnostics():{error:number;noiseCacheEntries:number;noiseCacheCapacity:number;noiseBytes:number};
}
export function checkAtmosphereGallery(api:Gallery){
 let checks=0;const assert=(ok:unknown,message:string)=>{checks++;if(!ok)throw Error(message);};
 const hash=(a:Uint8ClampedArray)=>{let h=2166136261;for(const v of a)h=Math.imul(h^v,16777619);return h>>>0;};
 const pixels=(id:string,reference=false)=>{const c=api.canvas(id)!;return c.getContext('2d')!.getImageData(0,0,reference?78:c.width,reference?90:c.height).data;};
 const saved=api.snapshot();api.render(0);
 const worlds=api.snapshot().worlds,ids=worlds.map(w=>w.id),weather=document.getElementById('weather')as HTMLInputElement;
 assert(worlds.length===8&&document.querySelectorAll('.world input[type=range]').length===8,'eight worlds and independent sliders');
 assert(!ids.some(id=>['estella-x','estella-xi','estella-xii'].includes(id)),'no giants in the page');
 const initial=new Map(ids.map(id=>[id,hash(pixels(id))])),references=new Map(ids.map(id=>[id,hash(pixels(id,true))]));
 const profilesBefore=JSON.stringify(worlds.slice(1).map(w=>w.profile));
 const firstSlider=document.querySelector<HTMLInputElement>('.world input[type=range]')!;firstSlider.value='4';firstSlider.dispatchEvent(new Event('input',{bubbles:true}));
 assert(api.snapshot().worlds[0].selectedSample===4,'slider selects requested sample');
 assert(JSON.stringify(api.snapshot().worlds.slice(1).map(w=>w.profile))===profilesBefore,'slider leaves other world profiles unchanged');
 assert(ids.slice(1).every(id=>hash(pixels(id))===initial.get(id)),'slider leaves other card pixels unchanged');
 const hashes:Record<string,number[]>={};
 for(const world of worlds){
  hashes[world.id]=[];
  for(let index=0;index<10;index++){
   api.render(0);api.select(world.id,index);const startPixels=pixels(world.id),start=hash(startPixels);hashes[world.id].push(start);
   api.render(world.samples[index].loopSeconds);const endPixels=pixels(world.id);
   let maxDifference=0;for(let j=0;j<endPixels.length;j++)maxDifference=Math.max(maxDifference,Math.abs(endPixels[j]-startPixels[j]));
   assert(hash(endPixels)===start,`${world.id} sample${index+1} exact loop/replay (max channel difference ${maxDifference})`);
   assert(hash(pixels(world.id,true))===references.get(world.id),'approved original reference pixels unchanged');
  }
  assert(new Set(hashes[world.id]).size===10,`${world.id}: all ten rendered candidates differ`);
  api.render(0);api.select(world.id,0);const solo=hash(pixels(world.id));api.render(0);
  assert(hash(pixels(world.id))===solo,'shared generator snapshots independent weather onto each card');
  api.render(3);assert(hash(pixels(world.id))!==solo,`${world.id} weather animates`);
 }
 api.render(0);const beforeBatch=ids.map(id=>hash(pixels(id)));api.reroll(saved.batchSeed+1);
 assert(ids.some((id,i)=>hash(pixels(id))!==beforeBatch[i]),'new batch changes artwork');
 assert(ids.every(id=>hash(pixels(id,true))===references.get(id)),'new batch never rerolls approved geography');
 const diag=api.diagnostics();assert(diag.noiseCacheCapacity===8&&diag.noiseCacheEntries<=8&&diag.noiseBytes<=8*64**3,'one generator with bounded2MiB noise residency, not80 contexts/frames');
 assert(diag.error===0,'all80 samples render without WebGL error');
 api.reroll(saved.batchSeed);api.render(0);
 for(const world of saved.worlds)api.select(world.id,world.selectedSample-1);
 assert(ids.every(id=>hash(pixels(id))===initial.get(id)),'replay after cache eviction restores exact initial pictures');
 weather.checked=false;weather.dispatchEvent(new Event('change'));
 const bare=ids.map(id=>hash(pixels(id)));api.select(ids[1],9);api.render(33);
 assert(ids.every((id,i)=>hash(pixels(id))===bare[i]),'weather-off leaves fixed original art through time/selection');
 weather.checked=true;weather.dispatchEvent(new Event('change'));api.render(0);
 for(const world of saved.worlds)api.select(world.id,world.selectedSample-1);
 const link=new URL((document.getElementById('permalink')as HTMLAnchorElement).href);
 assert(link.searchParams.get('seed')===String(saved.batchSeed)&&saved.worlds.every(w=>link.searchParams.get(w.id)===String(w.selectedSample)),'review link preserves seed and independent choices');
 return{checks,hashes,noiseCache:api.diagnostics()};
}
