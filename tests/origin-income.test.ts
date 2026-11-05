import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { calibrateNewContractQuote, incomeCalibrationKind, contractIncomeMinimum, ordinaryContractNetCredits, originContractNetCredits, incomeTargetId, incomeBoundaries, CONTRACT_INCOME_TARGETS } from '../src/contract-income';
import { ORIGIN_INCOME_CURVES, ORIGIN_ROUTE_WORKLOADS, ORIGIN_EMPLOYER_FEES } from '../src/contract-income-origin-curves';
import { originIncomeCredits, originIncomePosition } from '../src/origin-income-math';
import { contractWorkPolicy } from '../src/contract-work-policy';
import { contractReputationLockReasons, previewContractReputation } from '../src/contract-reputation';
import { physicalTerminalId } from '../src/physical-terminals';
import { contractGrossPay, contractFuelCompensation } from '../src/mission-cost';
import { defaultCareerProfile, TEAMSTER_CERTIFICATION_IDS } from '../src/career-state';
import { createDefaultRigState } from '../src/maintenance/rig-state';
import { Game } from '../src/game';
import { sampleIncomeBoards } from './audit-contract-income';
import { projectedOriginNet } from './audit-origin-income';
let checks = 0;
function assert(v: unknown, message: string): asserts v { checks++; if (!v) throw Error(message); }
function equal(a: unknown, b: unknown, message: string) { assert(JSON.stringify(a) === JSON.stringify(b), message); }
const fit = { curves: ORIGIN_INCOME_CURVES, routeWorkloads: ORIGIN_ROUTE_WORKLOADS, fees: ORIGIN_EMPLOYER_FEES };
assert(Object.keys(fit.curves).length > 200 && Object.keys(fit.routeWorkloads).length > 2000, 'system-wide origin coverage, not a Fuyuan special case');
for (const [key, curve] of Object.entries(fit.curves)) {
  assert(key.split('|').length === 2 && [1,8].includes(curve.length), 'explicit physical-origin/board market; employer fees are fitted separately');
  assert(curve.every((n,i)=>Number.isFinite(n)&&n>0&&(i===0||n>=curve[i-1])), 'ordered finite local workload knots');
  if(curve.length===8) assert(curve[1]<curve[2]&&curve[2]<curve[3]&&curve[4]<curve[5]&&curve[5]<curve[6], 'no singular local interpolation');
}
for(const [key,n] of Object.entries(fit.routeWorkloads)) assert(key.split('|').length===2&&Number.isFinite(n)&&n>0,'ordered directed-route reference, not live fuel accounting');
for (const [provider, fees] of Object.entries(ORIGIN_EMPLOYER_FEES)) {
  const target=incomeTargetId(provider)!, medians=CONTRACT_INCOME_TARGETS[target] as readonly number[], bounds=incomeBoundaries(target)!;
  for(const band of [0,1,2] as const) {
    for(const x of [fees[band*2],fees[band*2+1]]) assert(originIncomeCredits({band,workload:x},medians,bounds,fees)===medians[band],'both reference median anchors hit the approved employer target');
    let previous=-1;
    for(let i=0;i<=100;i++) {
      const net=originIncomeCredits({band,workload:fees[band*2+1]*i/20},medians,bounds,fees);
      assert(Number.isInteger(net)&&net>=previous,'local fee is finite, integral and monotone within its economic band'); previous=net;
      assert(band===0?net<=bounds[0]:band===1?net>bounds[0]&&net<=bounds[1]:net>bounds[1],'fees cannot leak into a different gate band');
    }
  }
}
for(const bad of [NaN,Infinity,-1]) { let failed=false;try{originIncomePosition(bad,[100]);}catch{failed=true;}assert(failed,'invalid reference workload rejected'); }
const rows=sampleIncomeBoards(0,2), zero=defaultCareerProfile();
let discounted=0, increased=0;
for(const {contract:c} of rows) {
  const before=JSON.stringify(c), kind=incomeCalibrationKind(c), policy=contractWorkPolicy(c);
  equal(c.quote,calibrateNewContractQuote(c,c.quote),'stable new quote; no board-state-dependent refit');
  assert(c.quote.expectedMargin===projectedOriginNet(c,fit),'runtime matches independent fixed-reference projection');
  assert(contractReputationLockReasons(zero,c).length===(contractIncomeMinimum(c)!>0?1:0),'real acceptance follows new net plus original trust floor');
  if(kind==='ordinary'&&policy?.trust===0) {
    const base=ordinaryContractNetCredits(c,c.quote.parFuelCost);
    if(c.quote.expectedMargin<base)discounted++;
    if(c.quote.expectedMargin>base)increased++;
    if(c.factionId==='covenant-remnants')assert(c.quote.expectedMargin===base,'Covenant retains reviewed import pricing, public on-ramp and premium pool');
    assert(originContractNetCredits(c,c.quote)===c.quote.expectedMargin,'local quote uses physical origin, category and provider');
    // Equivalent directory aliases use one market; display labels and issuer names do not price work.
    equal(calibrateNewContractQuote({...c,templateId:c.templateId},c.quote),c.quote,'same identity/route always same price');
  } else if(kind==='single'||(kind==='ordinary'&&policy?.trust===2)) {
    assert(c.quote.expectedMargin===ordinaryContractNetCredits(c,c.quote.parFuelCost),'direct/entrusted pricing untouched');
  } else if(kind==='important') assert(c.quote.expectedMargin===policy?.importantNet,'important low pay and trust unchanged');
  if(kind)for(const actual of [0,c.quote.parFuelCost,c.quote.parFuelCost*2,c.quote.parFuelCost*4]) {
    const net=contractGrossPay(c.quote.pay,c.quote.parFuelCost,actual)-actual;
    const expected=c.quote.expectedMargin+c.quote.parFuelCost-actual
      +contractFuelCompensation(c.quote.pay,c.quote.parFuelCost,actual)-contractFuelCompensation(c.quote.pay,c.quote.parFuelCost,c.quote.parFuelCost);
    assert(net===expected,'actual fuel compensation/caps and efficiency incentives preserved exactly');
  }
  assert(JSON.stringify(c)===before,'pricing inspection cannot mutate accepted/history objects');
}
assert(discounted>500,'meaningful lower-band supply across actual boards');
// Previously 0/308 at eleven dates. Include intermediate development dates and the old failure day 23.
const source='estella-iv-primary-city', cases=[], fuyuanOffers: CareerContract[]=[];
for(const day of [0,1,7,15,16,23,31,64,128,160,224,365,1000]) {
  const freight=generateCareerContracts(source,day*86400), passenger=generatePassengerContracts(source,day*86400);
  fuyuanOffers.push(...freight);
  const starter=freight.filter(c=>contractIncomeMinimum(c)===0);
  assert(starter.length+passenger.filter(c=>contractIncomeMinimum(c)===0).length>0,`Fuyuan no longer has a completely starter-free board on tested day ${day}`);
  assert(passenger.some(c=>contractIncomeMinimum(c)===0),'Fuyuan passenger entry is also represented');
  assert(starter.every(c=>!contractReputationLockReasons(zero,c).length),'newcomer standing actually meets gate');
  cases.push({day,freight:starter.length,passenger:passenger.filter(c=>contractIncomeMinimum(c)===0).length});
}
// Fixed prices do not force the daily selector to post a quota. Report isolated freight gaps.
assert(cases.filter(c=>c.freight>0).length/cases.length>=.9,'starter freight on at least 90% of these widely separated Fuyuan dates');
const civilian=fuyuanOffers.find(c=>c.factionId==='dahai-civilian-bookings'&&contractIncomeMinimum(c)===0)!;
assert(civilian,'ordinary Fuyuan civilian starter freight exists');
const ordinary=ordinaryContractNetCredits(civilian,civilian.quote.parFuelCost);
assert(ordinary>27500&&civilian.quote.expectedMargin<=27500,'formerly high-priced routine work now lies within approved entry ceiling');
assert(previewContractReputation(zero,civilian).reputations['estella-institutions']===0,'pricing grants neither GOV standing nor privileges');
for(const multiplier of [.25,2,10]) {
  const fuel=Math.round(civilian.quote.parFuelCost*multiplier), quote=calibrateNewContractQuote(civilian,{...civilian.quote,parFuelCost:fuel});
  assert(quote.expectedMargin===civilian.quote.expectedMargin,'known entry route cannot become high-tier solely from changed launch-window fuel');
  assert(quote.pay.compensationRatio===civilian.quote.pay.compensationRatio&&quote.pay.maxCompAllowance===civilian.quote.pay.maxCompAllowance,'changed par cost adjusts fixed fee, not reimbursement policy');
}
assert(physicalTerminalId(source)!==physicalTerminalId('estella-iv-main-orbital-station'),'surface and orbital markets never merged');
const local=rows.find(r=>physicalTerminalId(r.contract.sourceId)==='caravanserai'&&incomeCalibrationKind(r.contract)==='ordinary'&&contractWorkPolicy(r.contract)?.trust===0)!.contract;
const a=calibrateNewContractQuote(local,{...local.quote,sourceId:'caravanserai-main-commercial-dock'});
const b=calibrateNewContractQuote(local,{...local.quote,sourceId:'caravanserai-outfitter-drydock'});
assert(a.expectedMargin===b.expectedMargin,'internal station aliases cannot change a fee');
for(const invalid of [NaN,Infinity,0,-1]) {
  let threw=false;try{calibrateNewContractQuote(civilian,{...civilian.quote,loadedMassTons:invalid});}catch{threw=true;}
  assert(threw,'invalid local workload rejected');
}
// Real Game handler: new offer unlocks, an old high quote remains high-gated and settles unchanged.
const legacy=structuredClone(civilian), delta=ordinary-legacy.quote.expectedMargin;
legacy.quote.pay.flatReward+=delta;legacy.quote.grossPay+=delta;legacy.quote.expectedMargin+=delta;
let fail=false,logs=0;const storage=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>storage.get(k)??null,
  setItem:(k:string,v:string)=>{if(fail)throw Error('synthetic save denial');storage.set(k,v);}}});
for(const c of [civilian,legacy]) {
  const game:any=Object.create(Game.prototype);game.canvas={width:1360,height:940};game.career=defaultCareerProfile();
  game.career.locationId=source;game.career.money=1000000;game.career.rig=createDefaultRigState(true);game.career.certifications=[...TEAMSTER_CERTIFICATION_IDS];
  game.loadStationTerminal=()=>{};game.launchPlayableEstellaMission=()=>{};game.logSuccessfulGeneratedRun=()=>{logs++;};
  const post={id:'contractPosting',selectedIndex:0,contracts:[c],contractIndex:0};
  game.activateInteractiveSceneOption(post,'acceptContract');
  if(c===legacy) { assert(!game.activeCareerContract,'old high unaccepted quote keeps its own economic requirement');
    game.career.reputations['estella-institutions']=2;game.activateInteractiveSceneOption(post,'acceptContract'); }
  assert(game.activeCareerContract===c&&game.activeMissionQuote===c.quote,'booking keeps exactly the offered new/old terms');
  const before=JSON.stringify(game.career), quoted=JSON.stringify(c), count=logs;
  game.missionDvUsed=c.quote.parDv;game.activeManifestCondition={integrity:null,comfort:null};game.pendingMaintenanceSettlement=null;game.worldTime=1000;
  fail=true;let threw=false;try{game.finishCareerDelivery();}catch{threw=true;}
  assert(threw&&JSON.stringify(game.career)===before&&game.activeMissionQuote===c.quote&&logs===count,'failed save publishes no repricing, credit or booking loss');
  fail=false;game.finishCareerDelivery();game.finishCareerDelivery();
  assert(game.career.money===1000000+c.quote.expectedMargin&&logs===count+1,'retry/stale callback pays the exact accepted net once');
  equal(JSON.stringify(c),quoted,'historical accepted quote never rewritten');
}
console.log(JSON.stringify({checks,actualPostings:rows.length,discounted,increased,fuyuan:cases},null,2));
