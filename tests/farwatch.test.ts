import './svg-dom';
import baseline from './fixtures/farwatch-baseline.json';
import {reviewFingerprint} from './fixtures/camps-review-fingerprint';
import {ESTELLA_NODES,ESTELLA_NODES_BY_ID,ESTELLA_BODY_PHYSICS,ESTELLA_VALIDATION_ISSUES} from '../src/content/estella';
import {ESTELLA_FACTION_CONTRACT_PROVIDERS,generateFactionContractCandidates,type FactionContractCandidate} from '../src/content/estella/faction-contracts';
import {FARWATCH,FARWATCH_EDF_LANES,FARWATCH_INSTITUTE_LANES} from '../src/content/estella/faction-contracts/farwatch-contracts';
import {estellaSelectableNavTargets} from '../src/content/estella/navigation';
import {emptyTravelAccess} from '../src/content/estella/empty-travel-access';
import {estellaLocationIntroduction} from '../src/content/estella/location-copy';
import {canTravelEmpty,createEmptyRun,emptyRunDirectory} from '../src/empty-runs';
import {defaultCareerProfile,TEAMSTER_CERTIFICATION_IDS,loadCareerProfile} from '../src/career-state';
import {LOCAL_DIRECTORY_ENTRIES,GIDEON_BELL} from '../src/local-directory';
import {generateCareerContracts,generatePassengerContracts,type CareerContract} from '../src/career-contracts';
import {contractLocationId,presentCareerContract} from '../src/contract-presentation';
import {estimateEstellaMissionCost,makePayTerms} from '../src/mission-cost';
import {createPlayableEstellaMission} from '../src/estella-playable';
import {Game} from '../src/game';

let checks=0;
function assert(ok:unknown,msg:string):asserts ok{checks++;if(!ok)throw Error(msg);}
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const isNew=(c:{templateId?:string})=>!!c.templateId?.startsWith('farwatch:');
const pois=ESTELLA_NODES.filter(n=>n.kind==='poi');
const nav=estellaSelectableNavTargets().sort((a,b)=>a.id.localeCompare(b.id));
const profile={...defaultCareerProfile(),certifications:[...TEAMSTER_CERTIFICATION_IDS],money:1e9};
assert(ESTELLA_FACTION_CONTRACT_PROVIDERS.length===34,'existing EDF/EIP providers only');
assert(!ESTELLA_VALIDATION_ISSUES.some(i=>i.severity==='error'),'catalog valid');
for(const [id,placement] of Object.entries(baseline.placements)){
 assert(same(ESTELLA_NODES_BY_ID.get(id)?.placement,placement),'original coordinates retained');
 assert(ESTELLA_NODES_BY_ID.get(id)?.name==='EDF Farwatch Station','parent and operational berth renamed');
}
assert(same(ESTELLA_BODY_PHYSICS['deepest-dock-body']??null,baseline.physics),'physical parameters retained');
assert(nav.some(n=>n.id===FARWATCH),'contract navigation remains playable');
assert(emptyTravelAccess(FARWATCH)==='contract-only'&&!canTravelEmpty(profile,FARWATCH),'no independent empty arrival');
assert(!emptyRunDirectory(profile,'region:reach').some(e=>e.target?.id===FARWATCH||e.key==='node:deepest-dock-body'),'no Farwatch branch in empty picker');
// Even a future genuine local representative cannot override this explicit rule.
LOCAL_DIRECTORY_ENTRIES.push({...GIDEON_BELL,id:'farwatch-test-contact',name:'Test liaison',locationIds:[FARWATCH]});
try{
 const known={...profile,knownContactIds:['farwatch-test-contact']};
 assert(!canTravelEmpty(known,FARWATCH),'known contact does not override contract-only');
 let denied=false;try{createEmptyRun(known,FARWATCH);}catch{denied=true;}
 assert(denied,'direct factory call cannot bypass no-empty policy');
}finally{LOCAL_DIRECTORY_ENTRIES.pop();}
assert(createEmptyRun({...profile,locationId:FARWATCH},'estella-xiii-main-port').category==='empty','private departure remains allowed');

for(const p of ESTELLA_FACTION_CONTRACT_PROVIDERS){
 const rows=baseline.days.flatMap(day=>pois.flatMap(n=>p.generateContracts({sourceId:n.id,worldTime:day*86400}).filter(c=>!isNew(c))));
 assert(same(reviewFingerprint(rows),(baseline.providers as Record<string,number[]>)[p.id]),`${p.id}: all old raw jobs/seeded pools exact`);
}
const old=baseline.days.flatMap(day=>pois.flatMap(n=>generateFactionContractCandidates({sourceId:n.id,worldTime:day*86400}).filter(c=>!isNew(c))));
assert(same(reviewFingerprint(old),baseline.raw),'15979 old dispatched candidates unchanged');
const orders=new Map<string,Map<number,FactionContractCandidate>>(),pairs=new Map<string,FactionContractCandidate>();
const affected=new Set<string>();let edf=0,eip=0,incoming=0,outgoing=0;
for(let day=0;day<24;day++)for(const n of pois)for(const c of generateFactionContractCandidates({sourceId:n.id,worldTime:day*86400}).filter(isNew)){
 assert(c.sourceId===n.id&&[c.sourceId,c.destinationId].includes(FARWATCH),'correct source scope and Farwatch endpoint');
 assert(['estella-defence-force','estella-institute-of-planetology'].includes(c.factionId)&&c.issuerId===c.factionId,'only station operator and scientific institution issue additions');
 assert(c.cargo.massTons>0&&c.cargo.massTons<=8,'small station manifests');
 assert(c.generosity===(c.category==='passenger'?0.6:0.8)&&c.compensationRatio===(c.category==='passenger'?0.6:0.45)&&c.maxCompAllowance===2,'normal institutional rates');
 assert(!c.flatReward&&!c.boardPriority,'no quotas or bounties');
 if(c.category==='passenger')assert(c.cargo.passengerComfort?.expectation==='standard','ordinary passenger comfort');
 if(c.cargo.fragile)assert(c.requiredCertification==='fragile-cargo','instrument handling qualification');
 assert(!/ghost|specimen|fuel|data/i.test(c.cargo.label),'no invented ghost harvest/data courier/finished-fuel cargo');
 const days=orders.get(c.templateId)??new Map<number,FactionContractCandidate>();assert(!days.has(day),'no duplicate logical order at gateway and surface');days.set(day,c);orders.set(c.templateId,days);
 affected.add(contractLocationId(c.sourceId));pairs.set(`${c.sourceId}->${c.destinationId}`,c);
 c.factionTag==='EDF'?edf++:eip++;c.destinationId===FARWATCH?incoming++:outgoing++;
}
assert(orders.size===15&&edf===88&&eip===40,'15 distinct occasional orders,9 EDF/6 EIP,128 occurrences per24 days');
const lanes=[...FARWATCH_EDF_LANES,...FARWATCH_INSTITUTE_LANES];
for(const [id,days] of orders){
 const lane=lanes.find(l=>id===`farwatch:${l.id}:out`||id===`farwatch:${l.id}:return`)!;
 assert(days.size===24/lane.everyPairs,'documented cadence');
 for(const day of days.keys())assert(days.has(day%2?day-1:day+1),'whole adjacent-day pairs preserve gateway split');
}
for(const c of pairs.values()){
 const quote=estimateEstellaMissionCost(c.sourceId,c.destinationId,c.cargo,undefined,makePayTerms(c));
 assert(quote.grossPay>0&&quote.parDv>0&&Number.isFinite(quote.parDv),'actual positive finite quote');
 assert(createPlayableEstellaMission(c.sourceId,c.destinationId,undefined,742).start,'actual playable mission');
}
let exactRows=0,exactBoards=0,newFreight=0,newPeople=0,oldInbound=0,oldOutbound=0;
let accepted:CareerContract|undefined,arrival:CareerContract|undefined;
for(const day of baseline.days)for(const n of nav){
 const rows=[...generateCareerContracts(n.id,day*86400),...generatePassengerContracts(n.id,day*86400)];
 if(!affected.has(contractLocationId(n.id))){assert(same(reviewFingerprint(rows),(baseline.boardSources as Record<string,number[]>)[`${day}:${n.id}`]),'untouched board exact including old Farwatch name normalization');exactRows+=rows.length;exactBoards++;}
 for(const c of rows){
  if(!isNew(c)){if(c.destinationId===FARWATCH)oldInbound++;if(c.sourceId===FARWATCH)oldOutbound++;continue;}
  assert(c.quote.sourceId===c.sourceId&&c.quote.destinationId===c.destinationId,'no post-quote reroute');
  assert(c.sourceName===ESTELLA_NODES_BY_ID.get(contractLocationId(c.sourceId))?.name&&c.destinationName===ESTELLA_NODES_BY_ID.get(contractLocationId(c.destinationId))?.name,'physical name on actual boards');
  if(c.category==='passenger'){newPeople++;assert(c.requiredCertification==='passenger','actual passenger posting requires qualification');}else newFreight++;
  accepted??=c;if(c.destinationId===FARWATCH)arrival??=c;
 }
}
assert(exactRows>6000&&exactBoards>600&&newFreight>0&&newPeople>0&&accepted&&arrival,'real boards contain both new categories with broad unchanged-board coverage');
assert(oldInbound>0&&oldOutbound>0,'old BFS/VHM public contract work remains both ways');
const oldAccepted=baseline.accepted as CareerContract,before=JSON.stringify(oldAccepted),view=presentCareerContract(oldAccepted);
assert(view.sourceName==='EDF Farwatch Station'&&!view.sourcePath.includes('The Deepest Dock'),'old accepted contract displays approved name');
assert(JSON.stringify(oldAccepted)===before&&view.quote===oldAccepted.quote,'rename display only, original quote/snapshot unmodified');
const custom={...oldAccepted,briefing:'Depart The Deepest Dock with the equipment.',completionMessage:'Returned from The Deepest Dock.'};
assert(presentCareerContract(custom).briefing?.includes('EDF Farwatch Station')&&presentCareerContract(custom).completionMessage.includes('EDF Farwatch Station'),'cached authored endpoint references updated at render time');
const storage=new Map<string,string>();(globalThis as any).localStorage={getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)};
const game:any=Object.create(Game.prototype);game.canvas={width:1280,height:900};game.career={...profile,locationId:FARWATCH};
assert(game.buildInteractiveScene({id:'stationTerminal',selectedIndex:0}).bodyRows.some((r:any)=>r.text===estellaLocationIntroduction(FARWATCH)),'EDF/research/access introduction in actual terminal');
const saved=JSON.stringify({...profile,locationId:FARWATCH});storage.set('space-teamster.career.v1',saved);
assert(loadCareerProfile().locationId===FARWATCH&&storage.get('space-teamster.career.v1')===saved,'parked legacy save unchanged');
for(const c of [oldAccepted,arrival]){
 const snapshot=JSON.stringify(c);game.career={...profile,locationId:c.sourceId};game.activeCareerContract=c;game.activeMissionQuote=c.quote;game.missionDvUsed=0;game.worldTime=2000;game.activeManifestCondition={};game.loadStationTerminal=()=>{};game.finishCareerDelivery();
 assert(game.career.locationId===c.destinationId&&loadCareerProfile().locationId===c.destinationId&&JSON.stringify(c)===snapshot,'old and new authorized flights settle without access gating or quote mutation');
 assert(!canTravelEmpty({...game.career,locationId:'estella-xiii-main-port'},FARWATCH),'visiting on a contract does not unlock empty arrival');
}
console.log(`Farwatch: ${checks} checks;15 orders (9 EDF/6 EIP),${pairs.size} playable pairs;24-day new traffic ${incoming}in/${outgoing}out;${exactRows} exact rows/${exactBoards} untouched boards;${newFreight} new freight/${newPeople} passenger postings;legacy ${oldInbound}in/${oldOutbound}out.`);
