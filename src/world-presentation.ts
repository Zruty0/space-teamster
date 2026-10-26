// Current game presentation. Filled painters remain independent historical
// references for the comparison gallery and geometry regression tests.
import { drawOutlineWorld } from './world-outline-appearance';
import type { WorldTint } from './world-disc-primitives';
export function drawCurrentWorldDisc(ctx:CanvasRenderingContext2D,id:string,cx:number,cy:number,radius:number,tint:WorldTint,eyeAngle=0,animatedDeck=false):boolean{
 return drawOutlineWorld(ctx,id,cx,cy,radius,eyeAngle,animatedDeck,tint);
}
