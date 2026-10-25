// Pure layout/budget policy for static, world-anchored foreground raster strips.
export const GROUND_STRIP_WIDTH = 512;
export const GROUND_STRIP_BLEED = 4;
export const GROUND_STRIP_TOP = 2000; // Existing terrain is bounded by1900m.
export const GROUND_STRIP_BOTTOM = -8000; // Below this the approved cutaway is solid dark.
export const GROUND_CACHE_PIXELS = 8 * 1024 * 1024;
export const GROUND_CACHE_ENTRIES = 32;
const SCALES = [.004,.00625,.008,.01,.0125,.016,.02,.025,.032,.04,.05,.064,.08,.1,.125];
export function groundCacheScale(zoom: number, width: number): number {
  if (!(zoom>0) || !(width>0) || !Number.isFinite(zoom+width)) throw new Error('Invalid ground cache view');
  let scale=SCALES.find(s=>s>=zoom)??SCALES[SCALES.length-1];
  while(true){
    const strips=Math.ceil(width/zoom*scale/GROUND_STRIP_WIDTH)+3;
    const pixels=strips*(GROUND_STRIP_WIDTH+2*GROUND_STRIP_BLEED)*(Math.ceil((GROUND_STRIP_TOP-GROUND_STRIP_BOTTOM)*scale)+2*GROUND_STRIP_BLEED);
    if(strips<=GROUND_CACHE_ENTRIES-2&&pixels<=GROUND_CACHE_PIXELS*.7)return scale;
    scale=[...SCALES].reverse().find(s=>s<scale)??scale/2;
  }
}
export function groundStripRange(x: number, zoom: number, width: number, scale: number): readonly [number,number] {
  const span=GROUND_STRIP_WIDTH/scale;
  return [Math.floor((x-width/(2*zoom))/span),Math.floor((x+width/(2*zoom))/span)];
}
