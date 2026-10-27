// Cosmetic palette only; never changes physical atmosphere or terrain.
const tint=(color:readonly number[],amount:number)=>'#'+color.map(v=>Math.round(Math.max(0,Math.min(255,v*amount))).toString(16).padStart(2,'0')).join('');
/** Same 5.5% planet tint used by orbital disc backgrounds. */
export const planetBackgroundColor=(color:readonly number[])=>tint(color,.055);
export function flightSurfaceStyle(body:{color:readonly number[];atmosphere?:{color:readonly number[]}|null}){
 return{ground:planetBackgroundColor(body.color),sky:body.atmosphere?tint(body.atmosphere.color,.025):'#020204',edge:tint(body.color,1)};
}
export const HARTWELL_SURFACE_STYLE=Object.freeze({
 sky:'#030202',far:'#070504',middle:'#090605',ground:'#0a0705',
 farLine:'#302a27',middleLine:'#493c35',line:'#695b53',detail:'#423931',edge:'#be7855',
});
