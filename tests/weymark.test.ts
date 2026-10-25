import './svg-dom';
import baseline from './fixtures/weymark-baseline.json';
import { reviewFingerprint } from './fixtures/camps-review-fingerprint';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID, ESTELLA_BODY_PHYSICS, ESTELLA_VALIDATION_ISSUES } from '../src/content/estella';
import { ESTELLA_SURFACE_FLIGHT_PROFILES } from '../src/content/estella/flight-profiles';
import { ESTELLA_FACTION_CONTRACT_PROVIDERS, generateFactionContractCandidates, generateFactionContactContractCandidates, type FactionContractCandidate } from '../src/content/estella/faction-contracts';
import { WEYMARK_OPERATORS_ID } from '../src/content/estella/faction-contracts/weymark-contracts';
import { WEYMARK_SITES, NELLS_REST, BRUCKNER_DEPOT, WEYMARK_TOWN, LOW_GAUGE, LANTERN_DOCK, OLD_SURVEY_CAMP } from '../src/content/estella/weymark-sites';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { estellaLocationIntroduction } from '../src/content/estella/location-copy';
import { EMPTY_TRAVEL_ACCESS } from '../src/content/estella/empty-travel-access';
import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { contractLocationId } from '../src/contract-presentation';
import { defaultCareerProfile, loadCareerProfile, TEAMSTER_CERTIFICATION_IDS } from '../src/career-state';
import { estimateEstellaMissionCost, makePayTerms } from '../src/mission-cost';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { passengerComfortTerms } from '../src/passenger-comfort';
import { isCatalogedCargoLabel } from '../src/cargo-handling';
import { canTravelEmpty } from '../src/empty-runs';
import { GIDEON_BELL } from '../src/local-directory';
import { Game } from '../src/game';

let checks = 0;
function assert(ok: unknown, text: string): asserts ok { checks++; if (!ok) throw Error(text); }
const same = (a: unknown,b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const isNew = (c: {templateId?:string}) => !!c.templateId?.startsWith('weymark:');
// Additive Farwatch programme has its own independent pre-change baseline.
const isFarwatch = (c: {templateId?:string}) => !!c.templateId?.startsWith('farwatch:');
const pois = ESTELLA_NODES.filter(n=>n.kind==='poi');
const nav = new Set(estellaSelectableNavTargets().map(n=>n.id));
assert(ESTELLA_FACTION_CONTRACT_PROVIDERS.length===34 && new Set(ESTELLA_FACTION_CONTRACT_PROVIDERS.map(p=>p.id)).size===34, 'one independent booking aggregator, all33 existing providers');
assert(!ESTELLA_VALIDATION_ISSUES.some(i=>i.severity==='error'), 'valid catalog');
assert(same(ESTELLA_BODY_PHYSICS['estella-viii'],baseline.physics),'original Weymark physical parameters');
for(const [id,p] of Object.entries(baseline.placements))assert(same(ESTELLA_NODES_BY_ID.get(id)?.placement,p),'original coordinates, orbital senses and moonlet dock');
for(const [id,p] of Object.entries(baseline.profiles))assert(same(ESTELLA_SURFACE_FLIGHT_PROFILES[id],p),'surface profiles and terrain unchanged');
for(const [id,access] of Object.entries(baseline.access))assert(EMPTY_TRAVEL_ACCESS[id]===access,'access policy not inferred from new lore');
assert(ESTELLA_NODES_BY_ID.get('estella-viii-captured-moonlet')?.summary?.includes('abandoned navigation outpost')&&estellaLocationIntroduction(LANTERN_DOCK)?.includes('abandoned navigation outpost'), 'Lantern role in catalog and actual terminal');
const profile={...defaultCareerProfile(),certifications:[...TEAMSTER_CERTIFICATION_IDS],money:1e9};
assert(canTravelEmpty(profile,LANTERN_DOCK)&&!canTravelEmpty(profile,OLD_SURVEY_CAMP),'Lantern still visitable at own expense; camp stays unlisted');
for(const id of WEYMARK_SITES)assert((estellaLocationIntroduction(id)?.length??0)>100&&nav.has(id),'six existing roles authored, no added locations');

// Independent BEFORE-change snapshot678a9c0: no exemptions for renamed cargo,
// altered sampling, quotes, rates or rerouted old Weymark work are needed.
for(const p of ESTELLA_FACTION_CONTRACT_PROVIDERS){
 const expected=(baseline.providers as Record<string,number[]>)[p.id];
 if(!expected){assert(p.id===WEYMARK_OPERATORS_ID,'only authorized new provider');continue;}
 const rows=baseline.days.flatMap(day=>pois.flatMap(n=>p.generateContracts({sourceId:n.id,worldTime:day*86400}).filter(c=>!isFarwatch(c))));
 assert(same(reviewFingerprint(rows),expected),`${p.id}: complete pre-existing raw programme retained`);
}
const oldRouted: FactionContractCandidate[]=[];
for(const day of baseline.days)for(const n of pois)oldRouted.push(...generateFactionContractCandidates({sourceId:n.id,worldTime:day*86400}).filter(c=>!isNew(c)&&!isFarwatch(c)));
assert(same(reviewFingerprint(oldRouted),baseline.raw),'all15899 old dispatched candidates remain exact');

const orders=new Map<string,Map<number,FactionContractCandidate>>(),pairs=new Map<string,FactionContractCandidate>();
const affected=new Set<string>(),coverage=new Map<string,{in:number;out:number}>();
for(let day=0;day<24;day++)for(const n of pois)for(const c of generateFactionContractCandidates({sourceId:n.id,worldTime:day*86400})){
 assert(![c.sourceId,c.destinationId].some(id=>id===LANTERN_DOCK||id===OLD_SURVEY_CAMP),'Lantern and Old Survey Camp have zero freight/passenger traffic from every provider');
 assert(c.cargo.label!=='stable fuel canisters','no revived finished-fuel loads');
 if(isFarwatch(c))affected.add(contractLocationId(c.sourceId));
 if(!isNew(c))continue;
 assert(c.factionId===WEYMARK_OPERATORS_ID&&!c.factionTag&&c.issuerName!==c.factionName,'independent small customers, not a planet-owning company');
 assert(c.sourceId===n.id&&nav.has(c.sourceId)&&nav.has(c.destinationId)&&c.sourceId!==c.destinationId,'scoped playable endpoints');
 assert(!([c.sourceId,c.destinationId].includes(WEYMARK_TOWN)&&[c.sourceId,c.destinationId].includes(LOW_GAUGE)),'town/mine ground traffic is not a flight job');
 assert([c.sourceId,c.destinationId].some(id=>(WEYMARK_SITES as readonly string[]).includes(id)),'limited Weymark scope');
 assert(c.cargo.massTons>0&&c.cargo.massTons<=16&&Number.isFinite(c.cargo.massTons)&&isCatalogedCargoLabel(c.cargo.label),'small explicitly classified manifests');
 assert(!c.flatReward&&!c.boardPriority&&c.maxCompAllowance===2,'ordinary rates and selection');
 assert(c.generosity===(c.category==='passenger'?0.6:0.75)&&c.compensationRatio===(c.category==='passenger'?0.6:0.4),'documented modest freight/crew pay');
 if(c.category==='passenger')assert(same(c.cargo.passengerComfort,passengerComfortTerms(c.cargo.label))&&c.cargo.passengerComfort?.expectation==='standard','standard crew accommodation');
 if(c.cargo.fragile)assert(c.requiredCertification==='fragile-cargo','assay specimens protected');
 assert(c.details&&c.completionMessage,'purposeful details and receipt');
 for(const id of [c.sourceId,c.destinationId]){const p=ESTELLA_NODES_BY_ID.get(id)?.placement;assert(!(p?.kind==='surface'&&['estella-vi','estella-vib'].includes(p.parentId)),'controlled trade membranes retained');if((WEYMARK_SITES as readonly string[]).includes(id)){const r=coverage.get(id)??{in:0,out:0};r[id===c.sourceId?'out':'in']++;coverage.set(id,r);}}
 const days=orders.get(c.templateId)??new Map<number,FactionContractCandidate>();assert(!days.has(day),'one order per day, no duplicates');days.set(day,c);orders.set(c.templateId,days);
 pairs.set(`${c.sourceId}->${c.destinationId}`,c);affected.add(contractLocationId(c.sourceId));
}
assert(orders.size===20&&[...orders.values()].filter(days=>days.get(0)?.category==='passenger').length===12,'20 daily additions:8 freight,12 two-way crew orders');
for(const days of orders.values())assert(days.size===24&&new Set([...days.values()].map(c=>c.cargo.massTons)).size===1,'stable daily availability and mass');
for(const id of [NELLS_REST,BRUCKNER_DEPOT,WEYMARK_TOWN,LOW_GAUGE])assert(coverage.get(id)!.in>0&&coverage.get(id)!.out>0,'four working destinations both directions');
assert(!coverage.has(LANTERN_DOCK)&&!coverage.has(OLD_SURVEY_CAMP),'no reserve filler demand');
for(const c of pairs.values()){
 const q=estimateEstellaMissionCost(c.sourceId,c.destinationId,c.cargo,undefined,makePayTerms(c));assert(q.grossPay>0&&q.parDv>0&&Number.isFinite(q.parDv),'positive finite production quote');
 assert(createPlayableEstellaMission(c.sourceId,c.destinationId,undefined,742).start,'each actual flight pair constructs');
}
let exactRows=0,exactBoards=0,newFreight=0,newPeople=0;let accepted:CareerContract|undefined;
for(const day of baseline.days)for(const n of estellaSelectableNavTargets().sort((a,b)=>a.id.localeCompare(b.id))){
 const rows=[...generateCareerContracts(n.id,day*86400),...generatePassengerContracts(n.id,day*86400)];
 if(!affected.has(contractLocationId(n.id))){assert(same(reviewFingerprint(rows),(baseline.boardSources as Record<string,number[]>)[`${day}:${n.id}`]),'untouched board exact: IDs, order, availability, quotes');exactRows+=rows.length;exactBoards++;}
 for(const c of rows)if(isNew(c)){
  assert(c.quote.sourceId===c.sourceId&&c.quote.destinationId===c.destinationId&&c.quote.grossPay>0,'real board quotes use actual endpoints');
  assert(c.sourceName===ESTELLA_NODES_BY_ID.get(contractLocationId(c.sourceId))?.name&&c.destinationName===ESTELLA_NODES_BY_ID.get(contractLocationId(c.destinationId))?.name,'physical terminal names');
  if(c.category==='passenger'){newPeople++;assert(c.requiredCertification==='passenger','crew charter passenger qualification');}else newFreight++;
  if(c.destinationId===LOW_GAUGE)accepted=c;
 }
}
// Farwatch adds demand on40 more historical boards; its independent fixture
// protects all old Weymark orders and6743 postings immediately before that pass.
assert(exactRows>5000&&exactBoards>600&&newFreight>0&&newPeople>0&&accepted,`unaffected full-board baseline and both real new categories: ${exactRows} rows/${exactBoards} boards; ${newFreight} freight/${newPeople} crew; accepted=${!!accepted}`);
// Existing progression: timed training and Old Nell passage remain contact-only,
// not absorbed into the new local crew board or redirected to another station.
const training=generateFactionContactContractCandidates({sourceId:WEYMARK_TOWN,worldTime:0,issuer:{id:GIDEON_BELL.id,name:GIDEON_BELL.name,factionId:'teamsters-guild',missionTags:['certification-basic']},availableSourceIds:[WEYMARK_TOWN],progress:{basic1:1,basic2:1}});
assert(training.some(c=>c.destinationId===NELLS_REST&&c.destinationLeadAngleFromSource===150*Math.PI/180&&c.certificationOnSuccess==='basic-3'),'original timed training return preserved');
const nell=generateFactionContactContractCandidates({sourceId:NELLS_REST,worldTime:0,issuer:{id:GIDEON_BELL.id,name:GIDEON_BELL.name,factionId:'teamsters-guild',missionTags:['old-nell-passage']},availableSourceIds:[NELLS_REST],progress:{basic3:1}});
assert(nell.some(c=>c.travelMode==='old-nell'&&c.destinationId==='still-public-approach-dock'),'Old Nell passage preserved');
const storage=new Map<string,string>();(globalThis as any).localStorage={getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)};
const game:any=Object.create(Game.prototype);game.canvas={width:1280,height:900};
for(const id of WEYMARK_SITES){game.career={...profile,locationId:id};assert(game.buildInteractiveScene({id:'stationTerminal',selectedIndex:0}).bodyRows.some((r:any)=>r.text===estellaLocationIntroduction(id)),'all six terminal introductions actually rendered');}
const saved=JSON.stringify({...profile,locationId:LANTERN_DOCK});storage.set('space-teamster.career.v1',saved);assert(loadCareerProfile().locationId===LANTERN_DOCK&&storage.get('space-teamster.career.v1')===saved,'existing Lantern save unchanged, no fabricated relocation');
for(const c of [baseline.accepted as CareerContract,accepted]){const before=JSON.stringify(c);game.career={...profile,locationId:c.sourceId};game.activeCareerContract=c;game.activeMissionQuote=c.quote;game.missionDvUsed=0;game.worldTime=2000;game.activeManifestCondition={};game.loadStationTerminal=()=>{};game.finishCareerDelivery();assert(game.career.locationId===c.destinationId&&loadCareerProfile().locationId===c.destinationId&&JSON.stringify(c)===before,'old/new accepted work settles at original quote and destination');}
console.log(`Weymark: ${checks} checks;20 daily orders (8 freight/12 crew), ${pairs.size} playable pairs; ${exactRows} exact postings on ${exactBoards} untouched boards.`,Object.fromEntries(coverage));
