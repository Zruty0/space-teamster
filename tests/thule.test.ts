import './svg-dom';
import baseline from './fixtures/thule-baseline.json';
import {assertPreThuleEconomy,isReachSettlementAddition,thuleAffectedBoardSources} from './fixtures/pre-thule-economy';
import {reviewFingerprint} from './fixtures/camps-review-fingerprint';
import { preIncomeBoardQuotes } from './fixtures/pre-income-quotes';
import {ESTELLA_NODES,ESTELLA_NODES_BY_ID,ESTELLA_BODY_PHYSICS,ESTELLA_VALIDATION_ISSUES} from '../src/content/estella';
import {ESTELLA_SURFACE_FLIGHT_PROFILES} from '../src/content/estella/flight-profiles';
import {THULE,THULE_ANCHORAGE,COMMON_GROUND,DEEPWELL,FREEHOLD,VOLYA,BELLEVUE,THULE_SITES,THULE_SURFACE_SITES,retiredThuleLegacyOrder} from '../src/content/estella/thule-sites';
import {BARATARIA_OBSERVATORY,BARATARIA_SURFACE_SITES} from '../src/content/estella/barataria-sites';
import {REACH_SETTLEMENT_LANES} from '../src/content/estella/faction-contracts/reach-settlement-contracts';
import {ESTELLA_FACTION_CONTRACT_PROVIDERS,generateFactionContractCandidates,type FactionContractCandidate} from '../src/content/estella/faction-contracts';
import {NUNES_INQUIRY_CATALOG} from '../src/content/estella/faction-contracts/nunes-inquiries';
import {estellaSelectableNavTargets} from '../src/content/estella/navigation';
import {estellaLocationIntroduction} from '../src/content/estella/location-copy';
import {emptyTravelAccess} from '../src/content/estella/empty-travel-access';
import {canTravelEmpty} from '../src/empty-runs';
import {defaultCareerProfile,loadCareerProfile,TEAMSTER_CERTIFICATION_IDS} from '../src/career-state';
import {generateCareerContracts,generatePassengerContracts,type CareerContract} from '../src/career-contracts';
import {contractLocationId,presentCareerContract} from '../src/contract-presentation';
import {estimateEstellaMissionCost,makePayTerms} from '../src/mission-cost';
import {createPlayableEstellaMission} from '../src/estella-playable';
import {Game} from '../src/game';
let checks=0;function assert(ok:unknown,msg:string):asserts ok{checks++;if(!ok)throw Error(msg);}
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const pois=ESTELLA_NODES.filter(n=>n.kind==='poi'),nav=estellaSelectableNavTargets().sort((a,b)=>a.id.localeCompare(b.id));
const profile={...defaultCareerProfile(),certifications:[...TEAMSTER_CERTIFICATION_IDS],money:1e9};
assert(ESTELLA_FACTION_CONTRACT_PROVIDERS.length===34,'no new economic entities');
assert(!ESTELLA_VALIDATION_ISSUES.some(i=>i.severity==='error'),'valid catalog');
for(const [id,name] of [[THULE,'Thule'],[THULE_ANCHORAGE,'Thule Anchorage'],[COMMON_GROUND,'Common Ground'],[DEEPWELL,'Deepwell'],[FREEHOLD,'Freehold'],[VOLYA,'Volya'],[BELLEVUE,'Bellevue']])assert(ESTELLA_NODES_BY_ID.get(id)?.name===name,'approved names on original IDs');
assert(same(ESTELLA_BODY_PHYSICS[THULE],baseline.physics),'original physical parameters');
for(const [id,p] of Object.entries(baseline.placements))assert(same(ESTELLA_NODES_BY_ID.get(id)?.placement,p),'original placements');
for(const [id,p] of Object.entries(baseline.profiles)){
 const {labelVisibility:_old,...old}=p as any;const profile=ESTELLA_SURFACE_FLIGHT_PROFILES[id];assert(profile,'surface profile retained');const {labelVisibility:_new,...current}=profile;
 assert(same(current,old),'all physical flight-profile parameters unchanged');
}
for(const id of THULE_SITES){assert(emptyTravelAccess(id)==='public'&&canTravelEmpty(profile,id),'civilian receiving sites publicly approachable, residency is separate');assert((estellaLocationIntroduction(id)?.length??0)>100,'actual authored terminal role');}
assert(estellaLocationIntroduction(COMMON_GROUND)?.includes('indentured')&&estellaLocationIntroduction(COMMON_GROUND)?.includes('tiny'),'small share-funded refuge, no metropolis');
assert(estellaLocationIntroduction(FREEHOLD)?.includes('escaped Wells serfs')&&estellaLocationIntroduction(VOLYA)?.includes('Udarnik dissenters')&&estellaLocationIntroduction(BELLEVUE)?.includes('disgraced politicians'),'three distinct refugee cultures');
for(const id of [FREEHOLD,VOLYA,BELLEVUE])assert(!ESTELLA_NODES_BY_ID.get(id)?.tags?.some(t=>['prison','science','restricted'].includes(t)),'old prison/research roles superseded');
for(const id of BARATARIA_SURFACE_SITES)assert(!canTravelEmpty(profile,id),'no smuggling/empty-access bypass');
assert(canTravelEmpty(profile,BARATARIA_OBSERVATORY),'public observatory');
assertPreThuleEconomy(assert);
const orders=new Map<string,Map<number,FactionContractCandidate>>(),pairs=new Map<string,FactionContractCandidate>();
const coverage=new Map<string,{in:number;out:number}>(),affected=thuleAffectedBoardSources();let thuleCount=0,baratariaCount=0;
for(let day=0;day<48;day++)for(const n of pois)for(const c of generateFactionContractCandidates({sourceId:n.id,worldTime:day*86400})){
 assert(!retiredThuleLegacyOrder(c),'no new custody/watch/research postings at repurposed sites');
 assert(![c.sourceId,c.destinationId].some(id=>(BARATARIA_SURFACE_SITES as readonly string[]).includes(id)),'no public smuggling surface contracts');
 if(!isReachSettlementAddition(c))continue;
 assert(['estella-government','hartwell-shipping-companies','estella-institute-of-planetology'].includes(c.factionId)&&c.issuerId===c.factionId,'existing issuer, no new faction or employer');
 assert(c.sourceId===n.id&&nav.some(t=>t.id===c.destinationId),'actual scoped playable endpoints');
 assert(c.cargo.massTons>0&&c.cargo.massTons<=12,'small manifest');
 assert(!c.boardPriority&&!c.flatReward&&!c.nunesInquiry,'ordinary sparse bookings, no forced slots/custody event');
 assert(!/prison|guarded|custody|fuel|specimen|data|indenture/i.test(c.cargo.label),'ordinary passengers/goods, no forced transfer, fuel or speculative exports');
 assert(c.maxCompAllowance===2&&c.generosity===(c.category==='passenger'?0.6:c.factionTag==='HSC'?0.75:0.8)&&c.compensationRatio===(c.category==='passenger'?0.6:c.factionTag==='HSC'?0.4:0.45),'existing institutional/carrier terms');
 if(c.category==='passenger')assert(c.cargo.passengerComfort?.expectation==='standard','standard civilian comfort');
 const days=orders.get(c.templateId)??new Map<number,FactionContractCandidate>();assert(!days.has(day),'no duplicate logical order from routing');days.set(day,c);orders.set(c.templateId,days);
 affected.add(contractLocationId(c.sourceId));pairs.set(`${c.sourceId}->${c.destinationId}`,c);
 if(c.templateId.startsWith('thule:'))thuleCount++;else{baratariaCount++;assert([c.sourceId,c.destinationId].includes(BARATARIA_OBSERVATORY),'Barataria work only at observatory');}
 for(const [id,dir] of [[c.sourceId,'out'],[c.destinationId,'in']] as const)if((THULE_SITES as readonly string[]).includes(id)||id===BARATARIA_OBSERVATORY){const r=coverage.get(id)??{in:0,out:0};r[dir]++;coverage.set(id,r);}
}
assert(orders.size===28&&thuleCount===172&&baratariaCount===38,'22 Thule/6 Barataria orders, mean43/12 and19/24 daily;210 occurrences/48 days');
for(const [id,days] of orders){const lane=REACH_SETTLEMENT_LANES.find(l=>id===`${l.region}:${l.id}:out`||id===`${l.region}:${l.id}:return`)!;assert(lane&&days.size===48/lane.everyPairs,'documented sparse cadence');for(const day of days.keys())assert(days.has(day%2?day-1:day+1),'whole adjacent-day window');}
for(const id of [...THULE_SITES,BARATARIA_OBSERVATORY])assert(coverage.get(id)!.in>0&&coverage.get(id)!.out>0,'all working locations have occasional two-way work');
for(const c of pairs.values()){const q=estimateEstellaMissionCost(c.sourceId,c.destinationId,c.cargo,undefined,makePayTerms(c));assert(q.grossPay>0&&q.parDv>0&&Number.isFinite(q.parDv),'finite positive actual quote');assert(createPlayableEstellaMission(c.sourceId,c.destinationId,undefined,743).start,'actual playable route');}
// Retiring obsolete field sites must not strand any of the12 Nunes Inquiries.
const nunes=ESTELLA_FACTION_CONTRACT_PROVIDERS.find(p=>p.id==='house-nunes')!;
for(const entry of NUNES_INQUIRY_CATALOG)for(const day of [0,7,20]){
 const active={catalogId:entry.id,instanceId:`${entry.id}:1`,ordinal:1,progress:0};
 const rows=pois.flatMap(n=>nunes.generateContracts({sourceId:n.id,worldTime:day*86400,nunesInquiries:{active:[active]}}));
 assert(rows.some(c=>c.nunesInquiry?.instanceId===active.instanceId&&c.nunesInquiry.contribution>0),'every inquiry retains playable progression work');
 assert(!rows.some(retiredThuleLegacyOrder),'custom persisted inquiry never revives retired Thule roles');
}
let exactRows=0,exactBoards=0,newFreight=0,newPeople=0;let accepted:CareerContract|undefined;
for(const day of baseline.days)for(const n of nav){const rows=[...generateCareerContracts(n.id,day*86400),...generatePassengerContracts(n.id,day*86400)];
 if(!affected.has(contractLocationId(n.id))){assert(same(reviewFingerprint(preIncomeBoardQuotes(rows, n.id, day * 86400, assert)),(baseline.boardSources as Record<string,number[]>)[`${day}:${n.id}`]),'unchanged source-board selection/order/IDs/quotes');exactRows+=rows.length;exactBoards++;}
 for(const c of rows.filter(isReachSettlementAddition)){assert(c.quote.sourceId===c.sourceId&&c.quote.destinationId===c.destinationId,'quotes use actual routed endpoints');assert(c.sourceName===ESTELLA_NODES_BY_ID.get(contractLocationId(c.sourceId))?.name&&c.destinationName===ESTELLA_NODES_BY_ID.get(contractLocationId(c.destinationId))?.name,'physical names on real postings');if(c.category==='passenger'){newPeople++;assert(c.requiredCertification==='passenger','passenger credential retained');}else newFreight++;if(c.destinationId===FREEHOLD)accepted??=c;}
}
// Sparse Freehold schedules need not overlap the four historical quote epochs.
for(let day=0;!accepted&&day<48;day++)accepted=[...generateCareerContracts(THULE_ANCHORAGE,day*86400),...generatePassengerContracts(THULE_ANCHORAGE,day*86400)].find(c=>isReachSettlementAddition(c)&&c.destinationId===FREEHOLD);
assert(exactRows>4000&&exactBoards>500&&newFreight>0&&newPeople>0&&accepted,`full unchanged-board coverage/live jobs: ${exactRows}/${exactBoards}; ${newFreight}/${newPeople}; accepted=${!!accepted}`);
const old=baseline.accepted as CareerContract,before=JSON.stringify(old),view=presentCareerContract(old);
assert(view.sourceName==='Freehold'&&view.sourcePath.includes('Thule')&&view.quote===old.quote&&JSON.stringify(old)===before,'accepted retired job renames display, never mutates quote/contract');
const storage=new Map<string,string>();(globalThis as any).localStorage={getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)};
const game:any=Object.create(Game.prototype);game.canvas={width:1280,height:900};
for(const id of THULE_SITES){game.career={...profile,locationId:id};assert(game.buildInteractiveScene({id:'stationTerminal',selectedIndex:0}).bodyRows.some((r:any)=>r.text===estellaLocationIntroduction(id)),'six descriptions in actual terminal');const saved=JSON.stringify(game.career);storage.set('space-teamster.career.v1',saved);assert(loadCareerProfile().locationId===id&&storage.get('space-teamster.career.v1')===saved,'old parked save unchanged');}
for(const c of [old,accepted]){const snapshot=JSON.stringify(c);game.career={...profile,locationId:c.sourceId};game.activeCareerContract=c;game.activeMissionQuote=c.quote;game.missionDvUsed=0;game.worldTime=2000;game.activeManifestCondition={};game.loadStationTerminal=()=>{};game.finishCareerDelivery();assert(game.career.locationId===c.destinationId&&loadCareerProfile().locationId===c.destinationId&&JSON.stringify(c)===snapshot,'old retired/new civilian contract settles at accepted terms');}
console.log(`Thule/Barataria: ${checks} checks;28 sparse orders,${pairs.size} playable pairs;${thuleCount}/${baratariaCount} occurrences in48 days;${exactRows} exact rows/${exactBoards} boards;${newFreight} new freight/${newPeople} passengers.`,Object.fromEntries(coverage));
