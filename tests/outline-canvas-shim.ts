// Node command-recording fixtures need a canvas object for cached giant artwork.
// This does NOT approve raster pixels: native gallery/production checks do that.
if(typeof document==='undefined')Object.defineProperty(globalThis,'document',{configurable:true,value:{
 createElement(tag:string){
  if(tag!=='canvas')throw Error(`Unexpected test element: ${tag}`);
  const context=new Proxy({createRadialGradient:()=>({addColorStop(){}})}as any,{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>{o[k]=v;return true;}});
  return{width:0,height:0,getContext:()=>context};
 }
}});
