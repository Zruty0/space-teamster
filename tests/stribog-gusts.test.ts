// Spatial-field replacement for the former temporal-gust acceptance tests.
import { bodyById, surfacePoiById } from '../src/world';
import { createRegionalWeather } from '../src/surface-weather';
import { landingAerodynamics } from '../src/landing-air';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { APPROACH_LEVELS, approachTurbulenceTorque, approachInTurbulence, createApproachState, updateApproach, predictTrajectory } from '../src/approach';
import { NEUTRAL_FLIGHT_INPUT } from '../src/flight-atmosphere';
import { config } from '../src/config';
let checks=0;const assert=(ok:unknown,msg:string)=>{checks++;if(!ok)throw Error(msg);};
const poi=surfacePoiById('estella-vi-spaceport'),body=bodyById(poi.bodyId),weather=createRegionalWeather(body,poi),air=weather.air(0,()=>30);
const origin={xOffset:1000,siteX:1000,siteY:30,approach:true},approachAir=weather.air(0,()=>30,origin);
let left=0,right=0,up=0,down=0,lowPeak=0,upperPeak=0,forcePeak=0,maxJump=0;
for(let x=0;x<=2000;x+=20)for(let h=5;h<=140;h+=15){
 const a=air.sample(x,30+h,12345),b=air.sample(x+.01,30+h,12345);
 left+=a.vx< -5?1:0;right+=a.vx>5?1:0;up+=(a.vy??0)>3?1:0;down+=(a.vy??0)<-3?1:0;
 lowPeak=Math.max(lowPeak,Math.hypot(a.vx,a.vy??0));maxJump=Math.max(maxJump,Math.hypot(a.vx-b.vx,(a.vy??0)-(b.vy??0)));
 const force=landingAerodynamics(0,0,x,30+h,12345,config.dragCoeff,air);forcePeak=Math.max(forcePeak,Math.hypot(force.windAX,force.windAY));
 assert(a.windLimit===4.2,'Stribog landing now has a stronger force ceiling');
 assert(JSON.stringify(approachAir.sample(x-1000,30+h,12345))===JSON.stringify(weather.air(0,()=>30,{approach:true}).sample(x,30+h,12345)),'approach field remains anchored to the permanent site frame');
 assert(JSON.stringify(a)===JSON.stringify(weather.air(12000,()=>30).sample(x,30+h,345)),'epoch changes do not reroll field');
}
assert(left>50&&right>50&&up>50&&down>50,'at a fixed time, surface locations have opposing winds and up/down drafts');
assert(lowPeak>60&&lowPeak<85&&forcePeak>3.8&&forcePeak<4.2,'Stribog landing is measurably more severe, can exceed ordinary lateral plus SAS');
assert(maxJump<.1,'surface field spatially continuous');
let maxUpperForce=0,upperLeft=0,upperRight=0;
for(let h=1600;h<12000;h+=40){const a=approachAir.sample(0,30+h,12345);upperPeak=Math.max(upperPeak,Math.hypot(a.vx,a.vy??0));upperLeft+=a.vx< -30?1:0;upperRight+=a.vx>30?1:0;assert(a.vy===0,'approach has strictly horizontal wind at every altitude');
 const f=landingAerodynamics(120,-30,0,30+h,12345,config.dragCoeff,approachAir);maxUpperForce=Math.max(maxUpperForce,Math.hypot(f.windAX,f.windAY));}
assert(upperPeak>80&&maxUpperForce>8&&upperLeft>10&&upperRight>10,'approach retains strong opposing horizontal layers');
let smoothVariation=0,formerVariation=0;
for(let x=-8000;x<=8000;x+=250)for(let h=1600;h<=12000;h+=250){
 const a=approachAir.sample(x,30+h,0),old=air.sample(x+1000,30+h,0);
 for(const [dx,dy]of [[10,0],[0,10]]){
  smoothVariation+=Math.abs(approachAir.sample(x+dx,30+h+dy,0).vx-a.vx);
  formerVariation+=Math.abs(air.sample(x+1000+dx,30+h+dy,0).vx-old.vx)/1.4;
 }
}
assert(smoothVariation<formerVariation*.55,'approach horizontal spatial variation is less than 55% of former field');
console.log({horizontalVariationRatio:smoothVariation/formerVariation});
const cloudSpeeds=Array.from({length:15},(_,i)=>(weather.cloudAdvection(1600+i*350,12345.01)-weather.cloudAdvection(1600+i*350,12344.99))/.02);
assert(cloudSpeeds.some(v=>v>30)&&cloudSpeeds.some(v=>v< -30),'bulk cloud layers have opposing shear advection');
const before=air.sample(870,110,12345),later=air.sample(870,110,12350),elsewhere=air.sample(925,110,12345);
assert(Math.hypot(before.vx-elsewhere.vx,(before.vy??0)-(elsewhere.vy??0))>20*Math.hypot(before.vx-later.vx,(before.vy??0)-(later.vy??0)),'moving between cells dominates short-term temporal drift');
for(const h of [149.99,150,150.01,1349.99,1350,1350.01]){const a=air.sample(1000,h+30,0),b=air.sample(1000,h+30+.001,0);assert(Math.hypot(a.vx-b.vx,(a.vy??0)-(b.vy??0))<.01,'continuous low/high field blend');}
const atRest=landingAerodynamics(0,0,0,100,0,.001,{sample:()=>({vx:0,vy:10,density:.18,windLimit:3})});assert(atRest.windAY>0&&atRest.windAX===0,'vertical wind creates real vertical aerodynamic force');
const following=landingAerodynamics(0,10,0,100,0,.001,{sample:()=>({vx:0,vy:10,density:.18,windLimit:1e9})});assert(Math.abs(following.ay)<1e-10,'relative vertical airflow used, not an independent fake lift force');
createPlayableEstellaMission('estella-iii-main-customs',poi.id,undefined,0);
const template=APPROACH_LEVELS.find(l=>l.poi.id===poi.id&&!l.departure)!;
const level={...template,flightAir:approachAir,windLayers:[],turbulence:[],gateX:1e9,gateRadius:0,departure:undefined};
let peakTorque=0,core={x:0,y:3500,vx:140,vy:0},warned=0,total=0;
for(let x=-8000;x<=8000;x+=80)for(let y=1800;y<=8000;y+=80){
 const motion={x,y,vx:140,vy:0},torque=approachTurbulenceTorque(motion,level,0),warning=approachInTurbulence(y,level,0,motion);total++;if(warning)warned++;
 assert(warning===(Math.abs(torque)>.08),'warning follows actual local rotational force');
 if(Math.abs(torque)>peakTorque){peakTorque=Math.abs(torque);core=motion;}
}
assert(warned/total<.07&&warned>10&&peakTorque>.8&&peakTorque<2,'rare spatial pockets, tangible but controllable torque');
assert(!approachInTurbulence(core.y,{...level,flightAir:{sample:approachAir.sample}},0,core),'ordinary shear/current alone does not trigger fake turbulence warning');
assert(!approachInTurbulence(core.y,{...level,flightAir:{sample:(_x,_y,t)=>({vx:100+50*Math.sin(t*8),vy:0,density:1})}},0,core),'rapid temporal wind changes do not produce a fake buffet warning');
assert(approachAir.approachBuffet!(core.x,core.y,12345)===weather.air(12000,()=>30,origin).approachBuffet!(core.x,core.y,345),'spatial buffet epoch continuity');
assert(approachAir.approachBuffet!(0,body.atmosphere!.height,0)===0&&approachAir.approachBuffet!(0,20,0)===0,'no buffet outside airspace');
const start=createApproachState(level,{...core,angle:1.4}),live={...start},retry={...start},calm={...start},quietLevel={...level,flightAir:{sample:approachAir.sample}},dt=1/120;
const predicted=predictTrajectory(start,level,0,4,dt,true,false);let deflection=0;
for(let i=0;i<predicted.points.length;i++){
 updateApproach(live,{...NEUTRAL_FLIGHT_INPUT},level,dt,i*dt);updateApproach(retry,{...NEUTRAL_FLIGHT_INPUT},level,dt,i*dt);updateApproach(calm,{...NEUTRAL_FLIGHT_INPUT},quietLevel,dt,i*dt);
 deflection=Math.max(deflection,Math.abs(live.angle-calm.angle));
 assert(Math.hypot(live.x-predicted.points[i].x,live.y-predicted.points[i].y)<1e-6,'live/predicted trajectory share vector forces and buffet-induced rotation');
}
assert(live.alive&&deflection>.08&&deflection<.8,'actual bounded attitude kick, not just a warning');
assert(JSON.stringify(live)===JSON.stringify(retry),'input/mission retry is identical');
// A render-sized prediction step must integrate the same smooth physical path,
// not alias short wind/rotation changes into a visibly jumping forecast.
const coarse=predictTrajectory(start,level,0,8,.4,true,false),fine=predictTrajectory(start,level,0,8,.1,true,false);
for(let i=0;i<coarse.points.length;i++)assert(Math.hypot(coarse.points[i].x-fine.points[i*4+3].x,coarse.points[i].y-fine.points[i*4+3].y)<1e-6,'coarse displayed preview agrees with fine internal integration');
const precise=predictTrajectory(start,level,0,8,1/120,true,false),cEnd=coarse.points[coarse.points.length-1],pEnd=precise.points[959];
const previewError=Math.hypot(cEnd.x-pEnd.x,cEnd.y-pEnd.y);
assert(previewError<5,'render-sized preview remains close to the live-step reference over eight seconds');
let lastEnd:{x:number;y:number}|undefined,maxPreviewJump=0;const previewState={...start};
for(let i=0;i<120;i++){
 const path=predictTrajectory(previewState,level,i/60,8,.4,true,false),end=path.points[path.points.length-1];
 if(lastEnd)maxPreviewJump=Math.max(maxPreviewJump,Math.hypot(end.x-lastEnd.x,end.y-lastEnd.y));lastEnd=end;
 for(let j=0;j<2;j++)updateApproach(previewState,{...NEUTRAL_FLIGHT_INPUT},level,1/120,i/60+j/120);
}
assert(maxPreviewJump<5,'rolling eight-second preview changes smoothly across successive flight frames');
console.log({maxPreviewJump,previewError});
console.log(JSON.stringify({vectorField:{lowPeak,upperPeak,forcePeak,maxUpperForce,maxJump,warningCoverage:warned/total,peakTorque,deflectionDegrees:deflection*180/Math.PI}},null,2));
console.log(`Spatial wind field / approach buffeting: ${checks} checks passed.`);
