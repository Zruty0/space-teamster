import './svg-dom';
import baseline from './fixtures/camps-existing-baseline.json';
import { preCampsNames } from './fixtures/pre-camps-names';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID, ESTELLA_INSTITUTIONS } from '../src/content/estella';
import { ESTELLA_FACTION_CONTRACT_PROVIDERS, generateFactionContractCandidates, type FactionContractCandidate } from '../src/content/estella/faction-contracts';
import { CAMPS_CIVILIAN_ID, SVAROG_YARD_COMPANY_ID } from '../src/content/estella/faction-contracts/camps-contracts';
import { CAMPS_LOCATION_IDS, CAMPS_TRADE_WORLDS, ROADSTEAD, CONCORD, DAWES, GALE, ASCENSION, FLINT, SWITCHBACK, PIKE_DEPOT, ANVIL, HAMMER, STRIBOG, MORANA, MOSAIC, ROSTER, FIRST_LANDING, BLACK_TILE } from '../src/content/estella/camps-sites';
import { generateCampsRoutedContracts, campsDispatchUsesTerminal } from '../src/content/estella/camps-logistics';
import { RICHELIEU, isGaiaSurface } from '../src/content/estella/gaia-logistics';
import { DAHAI_ORBITAL, DAHAI_SURFACE_SITES } from '../src/content/estella/dahai-sites';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { estellaLocationIntroduction } from '../src/content/estella/location-copy';
import { emptyTravelAccess } from '../src/content/estella/empty-travel-access';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { estimateEstellaMissionCost, makePayTerms } from '../src/mission-cost';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { defaultCareerProfile, loadCareerProfile } from '../src/career-state';
import { contractLocationId } from '../src/contract-presentation';
import { passengerComfortTerms } from '../src/passenger-comfort';
import { Game } from '../src/game';

let assertions = 0;
function assert(ok: unknown, message: string): asserts ok { assertions++; if (!ok) throw Error(message); }
const pois = ESTELLA_NODES.filter(n => n.kind === 'poi');
const camps = new Set<string>(CAMPS_LOCATION_IDS);
const nav = new Set(estellaSelectableNavTargets().map(n => n.id));
const isNew = (c: FactionContractCandidate) => c.templateId.startsWith('camps:');
function body(id: string): string | undefined {
  let n = ESTELLA_NODES_BY_ID.get(id);
  if (n?.placement?.kind === 'aboard') n = ESTELLA_NODES_BY_ID.get(n.placement.parentId);
  return n?.placement?.parentId;
}
assert(CAMPS_LOCATION_IDS.length === 31 && new Set(CAMPS_LOCATION_IDS).size === 31, 'all31 Camps sites, no invented duplicate destinations');
assert(ESTELLA_FACTION_CONTRACT_PROVIDERS.length === 34 && new Set(ESTELLA_FACTION_CONTRACT_PROVIDERS.map(p=>p.id)).size === 34, 'original Camps actors plus approved Sahra/Weymark bookings');
for (const id of CAMPS_LOCATION_IDS) {
  assert(ESTELLA_NODES_BY_ID.get(id)?.regionId === 'camps' && nav.has(id), `existing selectable Camps ID ${id}`);
  assert((estellaLocationIntroduction(id)?.length ?? 0) > 100, 'authored role visible in terminal, not just notes');
}
for (const [id,name] of [[FLINT,'Flint Mine'],[SWITCHBACK,'Switchback'],[PIKE_DEPOT,'Pike Depot']]) assert(ESTELLA_NODES_BY_ID.get(id)?.name===name, 'Pike proper names on stable IDs');
assert(ESTELLA_INSTITUTIONS.some(i=>i.id===SVAROG_YARD_COMPANY_ID&&i.summary.includes('Kisaragi')), 'landlord defined independently of tenants');
assert(emptyTravelAccess(FIRST_LANDING)==='unlisted'&&emptyTravelAccess(BLACK_TILE)==='restricted', 'reserves retain access policy');
for(const id of [STRIBOG,MORANA,'estella-vib-pharma-horticulture']) assert(emptyTravelAccess(id)==='restricted', 'controlled surface access retained');

// Captured at dae6547, BEFORE the pass. All30 raw actor rosters, seeded choices,
// prices and receipts remain exact except the three approved place-name edits.
for(const p of ESTELLA_FACTION_CONTRACT_PROVIDERS) {
  // Guild finished-fuel deletion is intentional; its entire surviving roster is
  // frozen independently before the change in sahra-economy.test.ts.
  if(!(p.id in baseline) || p.id === 'teamsters-guild') continue;
  const rows: FactionContractCandidate[]=[];
  for(const day of [0,1,7,20]) for(const n of pois) rows.push(...p.generateContracts({sourceId:n.id,worldTime:day*86400}).filter(c=>!isNew(c)&&!c.templateId.startsWith('sahra:')));
  let h=2166136261;for(const ch of preCampsNames(JSON.stringify(rows))){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
  const expected=(baseline as Record<string,number[]>)[p.id];
  assert(rows.length===expected[0]&&(h>>>0)===expected[1], `${p.id}: entire pre-pass raw economy preserved`);
}

const orders=new Map<string,Map<number,FactionContractCandidate>>();
const actors=new Map<string,number>();
const pairs=new Map<string,FactionContractCandidate>();
const traffic=new Map<string,{in:number;out:number}>();
const sources=new Set<string>(CAMPS_LOCATION_IDS);
for(let day=0;day<20;day++)for(const n of pois)for(const c of generateFactionContractCandidates({sourceId:n.id,worldTime:day*86400})) {
  for(const [id,direction] of [[c.sourceId,'out'],[c.destinationId,'in']] as const)if(camps.has(id)){const r=traffic.get(id)??{in:0,out:0};r[direction]++;traffic.set(id,r);}
  if(c.factionId==='pike-mining-companies'&&c.templateId.includes(':strip-to-cinderhook:'))assert(c.sourceId===FLINT&&c.destinationId==='estella-v-atmo-refinery','dedicated Pike refinery leg stays direct');
  if(!isNew(c))continue;
  assert(c.sourceId===n.id&&nav.has(c.sourceId)&&nav.has(c.destinationId), `valid scoped endpoints ${c.templateId}: ${c.sourceId}->${c.destinationId}`);
  assert(camps.has(c.sourceId)||camps.has(c.destinationId),'new order involves Camps');
  assert(![c.sourceId,c.destinationId].some(id=>[FIRST_LANDING,BLACK_TILE,'estella-xif-sealed-research-outpost','ark-quarantine-station-poi'].includes(id)),'reserved sites untouched');
  for(const id of [c.sourceId,c.destinationId]) {
    const placement=ESTELLA_NODES_BY_ID.get(id)?.placement;
    if(placement?.kind==='surface'&&placement.parentId==='estella-vi') assert(c.factionId==='steel-combine'&&body(c.sourceId)==='estella-vi'&&body(c.destinationId)==='estella-vi','only Combine-authorized internal surface additions');
    assert(!(placement?.kind==='surface'&&placement.parentId==='estella-vib'),'new ordinary Kalyna trade uses orbit');
  }
  assert(c.sourceId!==c.destinationId&&c.cargo.massTons>0&&Number.isFinite(c.cargo.massTons)&&c.likelihood>0,'finite non-self consignment');
  assert(!c.flatReward&&!c.boardPriority&&c.maxCompAllowance===2,'no bounties/forced board slots');
  assert(c.details&&c.completionMessage,'operational details/receipt');
  if(c.category==='passenger')assert(c.cargo.passengerComfort?.expectation===passengerComfortTerms(c.cargo.label).expectation,'explicit passenger handling');
  if(c.cargo.fragile)assert(c.requiredCertification==='fragile-cargo','fragile qualification');
  assert(c.cargo.label!=='stable fuel canisters','finished-fuel container work retired');
  if(c.factionId==='steel-combine')assert(c.generosity===0&&c.compensationRatio===1&&c.issuerName==='Steel Combine Planning Office','internal Combine compensation/authority retained');
  if(c.factionId===CAMPS_CIVILIAN_ID)assert(!c.factionTag&&c.issuerName!==c.factionName,'descriptive ordinary customers');
  if(c.factionId===SVAROG_YARD_COMPANY_ID)assert(c.factionTag==='SSC','shipyard identity distinct from Kisaragi');
  const key=`${c.factionId}:${c.templateId}`, days=orders.get(key)??new Map<number,FactionContractCandidate>();
  assert(!days.has(day),`one logical order per day ${key}`);days.set(day,c);orders.set(key,days);
  pairs.set(`${c.sourceId}->${c.destinationId}`,c);sources.add(c.sourceId);
  if(day===0)actors.set(c.factionId,(actors.get(c.factionId)??0)+1);
}
for(const id of [DAWES,ASCENSION,STRIBOG,MORANA])assert(traffic.get(id)!.in>0&&traffic.get(id)!.out>0,`identified working-site gap filled ${id}`);
for(const id of [FIRST_LANDING,BLACK_TILE])assert(!traffic.has(id),'deliberately reserved locations remain without public demand');
assert(orders.size===163&&actors.get(CAMPS_CIVILIAN_ID)===110&&actors.get(SVAROG_YARD_COMPANY_ID)===17,'163 original-program orders after one fuel retirement:110 civilian,17 landlord,36 existing-provider');
const combinations=new Set<string>();let crossGaia=0,crossDahai=0;
for(const [key,days] of orders) {
  assert(days.size===20,`daily coverage ${key}`);assert(new Set([...days.values()].map(c=>c.cargo.massTons)).size===1,'stable mass');
  for(let d=0;d<20;d+=2){const a=days.get(d)!,b=days.get(d+1)!;
    for(const w of CAMPS_TRADE_WORLDS){
      const wasRouted=a.details!.includes(`${w.name} site:`);
      if(wasRouted){const via=(c:FactionContractCandidate)=>c.sourceId===w.hub||c.destinationId===w.hub;assert(via(a)!==via(b)&&a.likelihood===b.likelihood,'each eligible world independently paired50/50');assert(a.details!.includes(`${w.hubName} consolidation`)===via(a),'correct local transport statement');}
    }
    if(a.details!.includes('Direct Gaia surface handling')||a.details!.includes('Richelieu Orbital Terminal consolidation')){assert((a.sourceId===RICHELIEU||a.destinationId===RICHELIEU)!==(b.sourceId===RICHELIEU||b.destinationId===RICHELIEU),'Gaia split preserved');crossGaia++;}
    if(a.details!.includes('Dahai site:')){assert((a.sourceId===DAHAI_ORBITAL||a.destinationId===DAHAI_ORBITAL)!==(b.sourceId===DAHAI_ORBITAL||b.destinationId===DAHAI_ORBITAL),'Dahai split preserved');crossDahai++;}
    if(a.details!.includes('Hartwell site:')&&a.details!.includes('Tessera site:'))combinations.add(`${a.sourceId===ROADSTEAD||a.destinationId===ROADSTEAD}:${a.sourceId===CAMPS_TRADE_WORLDS[1].hub||a.destinationId===CAMPS_TRADE_WORLDS[1].hub}`);
  }
}
assert(crossGaia>0&&crossDahai>0&&combinations.size===4,'independent gateway combinations across worlds');

// Adapter scope, native orbital/local legs, reserves, timed and qualification
// work, receipts and original object identity.
const fixture:FactionContractCandidate={factionId:'fixture',factionName:'Fixture',templateId:'fixture',campsDispatchKey:'fixture',sourceId:CONCORD,destinationId:'estella-iii-capital-city',cargo:{label:'test',massTons:1},likelihood:1,generosity:0.8,completionMessage:'External destination receipt.'};
const fixtureJson=JSON.stringify(fixture);let d=0;while(!campsDispatchUsesTerminal('estella-v','fixture',d*86400))d++;
const query=(c:FactionContractCandidate,sourceId:string)=>generateCampsRoutedContracts({sourceId,worldTime:d*86400},ctx=>ctx.sourceId===c.sourceId?[c]:[]);
assert(query(fixture,ROADSTEAD)[0].sourceId===ROADSTEAD&&query(fixture,CONCORD).length===0,'hub collects redirected source');
assert(query(fixture,ROADSTEAD)[0].completionMessage===fixture.completionMessage&&JSON.stringify(fixture)===fixtureJson,'input/external narrative immutable');
for(const c of [{...fixture,sourceId:ROADSTEAD},{...fixture,destinationId:ASCENSION},{...fixture,destinationId:GALE},{...fixture,sourceId:FIRST_LANDING},{...fixture,sourceId:BLACK_TILE},{...fixture,sourceId:STRIBOG},{...fixture,sourceId:SWITCHBACK},{...fixture,category:'certification' as const},{...fixture,travelMode:'old-nell' as const},{...fixture,destinationLeadAngleFromSource:0.2}])assert(query(c,c.sourceId)[0]===c,'native/local/restricted-world/reserved/timed/certification scope untouched');
const inbound={...fixture,sourceId:fixture.destinationId,destinationId:CONCORD,completionMessage:'Unloading in Concord.'};
assert(query(inbound,inbound.sourceId)[0].destinationId===ROADSTEAD&&!query(inbound,inbound.sourceId)[0].completionMessage!.includes('Concord'),'hub receipt does not stage a city arrival');

for(const c of pairs.values()) {
  const quote=estimateEstellaMissionCost(c.sourceId,c.destinationId,c.cargo,undefined,makePayTerms(c));
  assert(Number.isFinite(quote.parDv)&&quote.parDv>0&&quote.grossPay>0,'real finite quote');
  assert(createPlayableEstellaMission(c.sourceId,c.destinationId,undefined,931).start,'actual playable route');
}
let accepted:ReturnType<typeof generateCareerContracts>[number]|undefined;
const newActors=new Set<string>();let boardRows=0;
for(const day of [0,1,10,11])for(const sourceId of sources)for(const c of [...generateCareerContracts(sourceId,day*86400),...generatePassengerContracts(sourceId,day*86400)]) {
  assert(c.quote.sourceId===c.sourceId&&c.quote.destinationId===c.destinationId,'quoted dispatch endpoints');
  assert(c.sourceName===ESTELLA_NODES_BY_ID.get(contractLocationId(c.sourceId))?.name&&c.destinationName===ESTELLA_NODES_BY_ID.get(contractLocationId(c.destinationId))?.name,'physical presentation preserved');
  if([CAMPS_CIVILIAN_ID,SVAROG_YARD_COMPANY_ID].includes(c.factionId!)){newActors.add(c.factionId!);boardRows++;}
  if(c.destinationId===ROADSTEAD)accepted=c;
}
assert(newActors.size===2&&accepted,'both new actors on real boards');
const before=JSON.stringify(accepted);generateCareerContracts(ROADSTEAD,999*86400);assert(JSON.stringify(accepted)===before,'later generation leaves accepted quotes unchanged');
const storage=new Map<string,string>();(globalThis as any).localStorage={getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)};
const save=JSON.stringify({...defaultCareerProfile(),locationId:SWITCHBACK,money:123456,worldTime:1234});storage.set('space-teamster.career.v1',save);assert(loadCareerProfile().locationId===SWITCHBACK&&storage.get('space-teamster.career.v1')===save,'legacy Pike save ID preserved without rewrites');
const game:any=Object.create(Game.prototype);game.canvas={width:1280,height:900};game.career={...defaultCareerProfile(),locationId:CONCORD};
for(const id of CAMPS_LOCATION_IDS){game.career.locationId=id;assert(game.buildInteractiveScene({id:'stationTerminal',selectedIndex:0}).bodyRows.some((r:any)=>r.text===estellaLocationIntroduction(id)), 'all31 actual terminal roles visible');}
game.activeCareerContract=accepted;game.activeMissionQuote=accepted.quote;game.missionDvUsed=0;game.worldTime=2000;game.activeManifestCondition={};game.loadStationTerminal=()=>{game.activeCareerContract=null;};game.finishCareerDelivery();
assert(game.career.locationId===ROADSTEAD&&loadCareerProfile().locationId===ROADSTEAD&&JSON.stringify(accepted)===before,'real settlement ends at hub, accepted object unchanged');
console.log(`Camps pass: ${assertions} assertions; ${orders.size} new daily orders, ${pairs.size} playable pairs, ${boardRows} new-actor postings.`,Object.fromEntries(actors));
