import './svg-dom';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID, ESTELLA_INSTITUTIONS } from '../src/content/estella';
import { ESTELLA_FACTION_CONTRACT_PROVIDERS, generateFactionContractCandidates, type FactionContractCandidate } from '../src/content/estella/faction-contracts';
import { GAIA_CIVILIAN_ID, GOVERNMENT_ID, EDF_ID } from '../src/content/estella/faction-contracts/gaia-contracts';
import { GAIA_SURFACE_SITES, RICHELIEU, generateGaiaRoutedContracts, gaiaDispatchUsesTerminal, isGaiaSurface } from '../src/content/estella/gaia-logistics';
import { estellaSelectableNavTargets, estellaDisplayPath } from '../src/content/estella/navigation';
import { estellaLocationIntroduction } from '../src/content/estella/location-copy';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { generateCareerContracts, generatePassengerContracts, canonicalizeContractCandidates } from '../src/career-contracts';
import { classifyMissionCargo } from '../src/cargo-handling';
import { passengerComfortTerms } from '../src/passenger-comfort';
import { defaultCareerProfile, loadCareerProfile } from '../src/career-state';
import { canTravelEmpty } from '../src/empty-runs';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { estimateEstellaMissionCost, makePayTerms } from '../src/mission-cost';
import { DOCKING_LEVELS } from '../src/docking';
import { LEVELS } from '../src/levels';
import { Game } from '../src/game';
import { contractLocationId } from '../src/contract-presentation';

let assertions=0;
function assert(ok:unknown,message:string):asserts ok {assertions++;if(!ok)throw Error(message);}
const newIds=new Set([GAIA_CIVILIAN_ID,GOVERNMENT_ID,EDF_ID]);
const isNew=(c:{factionId?:string})=>newIds.has(c.factionId!);
const nav=new Set(estellaSelectableNavTargets().map(n=>n.id));
const pois=ESTELLA_NODES.filter(n=>n.kind==='poi');
const isGaia=(id:string)=>id===RICHELIEU||isGaiaSurface(id);
assert(ESTELLA_NODES_BY_ID.get(RICHELIEU)?.name==='Richelieu Orbital Terminal','terminal renamed with stable ID');
assert(ESTELLA_NODES_BY_ID.get('estella-iii-main-customs-station')?.name==='Richelieu Orbital Terminal','station renamed with stable ID');
assert(estellaDisplayPath(RICHELIEU).includes('Richelieu Orbital Terminal'),'navigation uses live name');
assert(estellaLocationIntroduction(RICHELIEU)?.includes('biggest transit hub'),'actual terminal describes system-scale role');
for(const id of [GOVERNMENT_ID,EDF_ID])assert(ESTELLA_INSTITUTIONS.some(i=>i.id===id),'institution catalog registered');
assert(ESTELLA_FACTION_CONTRACT_PROVIDERS.length===28,'25 legacy providers plus two institutions and civilian aggregator');

const orders=new Map<string,Map<number,FactionContractCandidate>>();
const pairs=new Map<string,FactionContractCandidate>();
const sources=new Set<string>([RICHELIEU,...GAIA_SURFACE_SITES]);
const totals=new Map<string,{count:number;hub:number;civilian:number;weight:number;hubWeight:number;civilianWeight:number}>();
const counts=new Map<string,number>();
for(let day=0;day<20;day++)for(const node of pois) {
  const candidates=generateFactionContractCandidates({sourceId:node.id,worldTime:day*86400});
  for(const c of candidates) {
    if(nav.has(c.sourceId)&&nav.has(c.destinationId)&&isGaia(c.sourceId)!==isGaia(c.destinationId)) {
      const key=`${isGaia(c.sourceId)?'out':'in'}:${c.category??'freight'}`;
      const r=totals.get(key)??{count:0,hub:0,civilian:0,weight:0,hubWeight:0,civilianWeight:0};
      r.count++;r.weight+=c.likelihood;
      if(c.sourceId===RICHELIEU||c.destinationId===RICHELIEU){r.hub++;r.hubWeight+=c.likelihood;}
      if(c.factionId===GAIA_CIVILIAN_ID){r.civilian++;r.civilianWeight+=c.likelihood;}
      totals.set(key,r);sources.add(c.sourceId);
    }
    if(!isNew(c))continue;
    counts.set(c.factionId,(counts.get(c.factionId)??0)+1);
    assert(c.sourceId===node.id && nav.has(c.sourceId)&&nav.has(c.destinationId),`new posting has selectable scoped endpoints: ${c.sourceId}->${c.destinationId} (${c.templateId})`);
    assert(isGaia(c.sourceId)!==isGaia(c.destinationId),'one Gaia endpoint; no local surface shuttles');
    const external=isGaia(c.sourceId)?c.destinationId:c.sourceId;
    const placement=ESTELLA_NODES_BY_ID.get(external)?.placement;
    assert(!(placement?.kind==='surface'&&['estella-vi','estella-vib'].includes(placement.parentId)),'Kuznia/Kalyna membranes respected');
    assert(!['estella-xif-observatory','estella-xif-sealed-research-outpost','ark-quarantine-station-poi'].includes(external),'reserved/unplayable sites not opened');
    assert(c.cargo.massTons>0&&Number.isFinite(c.cargo.massTons)&&c.likelihood>0,'finite positive cargo and likelihood');
    assert(!c.boardPriority&&!c.flatReward&&c.maxCompAllowance===2,'ordinary weighted bookings, no bounty or priority quota');
    assert(c.generosity===(c.category==='passenger'?0.6:0.8)&&c.compensationRatio===(c.category==='passenger'?0.6:0.45),'documented pay terms');
    assert(c.details?.includes('site:')&&!!c.completionMessage,'operational details and neutral receipt');
    const hub=c.sourceId===RICHELIEU||c.destinationId===RICHELIEU;
    assert(c.details!.includes('local transport arranged')===hub,'consolidation is background handling only');
    assert(c.details!.includes('Direct Gaia surface handling.')===!hub,'direct handling accurately described');
    classifyMissionCargo(c.cargo);
    if(c.category==='passenger')assert(c.cargo.passengerComfort?.expectation===passengerComfortTerms(c.cargo.label).expectation,'explicit passenger comfort');
    if(c.cargo.fragile)assert(c.requiredCertification==='fragile-cargo','fragile license attached');
    if(c.factionId===GAIA_CIVILIAN_ID)assert(!c.factionTag&&c.issuerName!==c.factionName&&!!c.issuerId,'ordinary descriptive issuers, no civilian megacorporation tag');
    else assert(c.factionTag===(c.factionId===GOVERNMENT_ID?'GOV':'EDF'),'institution market tag');
    const key=`${c.factionId}:${c.templateId}`;
    const days=orders.get(key)??new Map<number,FactionContractCandidate>();
    assert(!days.has(day),'one logical order/day, no concurrent hub/direct duplicate');
    days.set(day,c);orders.set(key,days);
    pairs.set(`${c.sourceId}->${c.destinationId}`,c);sources.add(c.sourceId);
  }
}
assert(counts.get(GAIA_CIVILIAN_ID)===271*20&&counts.get(GOVERNMENT_ID)===27*20&&counts.get(EDF_ID)===21*20,'complete 271 civilian / 27 GOV / 21 EDF daily dispatches');
assert(orders.size===319,'319 unique logical consignments');
for(const [key,days] of orders) {
  assert(days.size===20,`complete daily coverage: ${key}`);
  assert(new Set([...days.values()].map(c=>c.cargo.massTons)).size===1,'cargo mass stable across gateway and days');
  for(let day=0;day<20;day+=2) {
    const a=days.get(day)!,b=days.get(day+1)!;
    const hub=(c:FactionContractCandidate)=>c.sourceId===RICHELIEU||c.destinationId===RICHELIEU;
    assert(hub(a)!==hub(b)&&a.likelihood===b.likelihood,'each dispatch pair exactly 50/50 count and weight');
  }
}
const edf=[...orders.values()].map(v=>v.get(0)!).filter(c=>c.factionId===EDF_ID);
assert(edf.filter(c=>c.category==='passenger').length===18&&edf.length===21,'EDF is predominantly personnel (18/21)');
for(const [key,r] of totals) {
  assert(r.civilian/r.count>0.5&&r.civilianWeight/r.weight>0.5,`civilian majority of total Gaia candidate counts and demand: ${key}`);
  assert(r.hub/r.count>0.4&&r.hub/r.count<0.6&&r.hubWeight/r.weight>0.43&&r.hubWeight/r.weight<0.57,`roughly half including native terminal services: ${key}`);
}
for(const direction of ['in','out']) {
  const rows=[...totals].filter(([key])=>key.startsWith(direction)).map(([,r])=>r);
  const share=rows.reduce((sum,r)=>sum+r.hub,0)/rows.reduce((sum,r)=>sum+r.count,0);
  assert(share>0.45&&share<0.55,`overall ${direction} traffic within five points of half`);
}
for(const sourceId of sources) {
  const a=generateFactionContractCandidates({sourceId,worldTime:7*86400+1});
  assert(JSON.stringify(a)===JSON.stringify(generateFactionContractCandidates({sourceId,worldTime:7*86400+80000})),'same epoch deterministic, no save/random-state dependency');
}

// Adapter policy: preserve unrelated/native/same-body work; reroute before
// pricing; preserve immutable provider input and certification/pay identity.
const fixture:FactionContractCandidate={factionId:'fixture',factionName:'Fixture',templateId:'fixture',sourceId:'estella-iii-finance-city',destinationId:'estella-iv-primary-city',cargo:{label:'preserved-food crates',massTons:4},likelihood:0.7,generosity:0.8,compensationRatio:0.45,maxCompAllowance:2};
const rawJson=JSON.stringify(fixture);
let hubDay=0;
while(!gaiaDispatchUsesTerminal(`fixture:estella-iii-capital-city:estella-iv-primary-city:out:freight`,hubDay*86400))hubDay++;
const query=(candidate:FactionContractCandidate,sourceId:string,day=hubDay)=>generateGaiaRoutedContracts({sourceId,worldTime:day*86400},ctx=>ctx.sourceId===candidate.sourceId?[candidate]:[]);
const routed=query(fixture,RICHELIEU)[0];
assert(routed.sourceId===RICHELIEU&&routed.destinationId===fixture.destinationId&&routed.cargo===fixture.cargo&&routed.generosity===fixture.generosity,'hub collects old district orders without changing cargo/pay');
assert(query(fixture,fixture.sourceId).length===0,'redirected offer disappears from former source');
assert(JSON.stringify(fixture)===rawJson,'provider input unchanged');
const externalReceipt={...fixture,completionMessage:'Approved external destination receipt.'};
assert(query(externalReceipt,RICHELIEU)[0].completionMessage===externalReceipt.completionMessage,'outbound consolidation preserves external destination narrative');
for(const candidate of [
  {...fixture,sourceId:RICHELIEU},
  {...fixture,destinationId:RICHELIEU},
  {...fixture,destinationId:'estella-iii-polar-science'},
  {...fixture,destinationId:'estella-iii-luxury-orbital-habitat'},
  {...fixture,category:'certification' as const},
  {...fixture,sourceId:'caravanserai-main-commercial-dock'},
])assert(query(candidate,candidate.sourceId)[0]===candidate,'native/local/contact-style/unrelated work retains identity');
const duplicateRaw=(ctx:{sourceId:string})=>['estella-iii-capital-city','estella-iii-finance-city'].includes(ctx.sourceId)?[{...fixture,sourceId:ctx.sourceId}]:[];
assert(generateGaiaRoutedContracts({sourceId:RICHELIEU,worldTime:hubDay*86400},duplicateRaw).length===1,'identical historic district orders deduplicate at hub');

// All actual new endpoint pairs build real flight phases and finite quotes.
for(const c of pairs.values()) {
  const q=estimateEstellaMissionCost(c.sourceId,c.destinationId,c.cargo,undefined,makePayTerms(c));
  assert(Number.isFinite(q.parDv)&&q.parDv>0&&q.grossPay>0,'real finite route estimate');
  const beforeDock=new Set(DOCKING_LEVELS.map(l=>l.id));
  const beforeGround=new Set(LEVELS.map(l=>l.id));
  const mission=createPlayableEstellaMission(c.sourceId,c.destinationId,undefined,742);
  assert(mission.start,'production mission constructs');
  if(c.sourceId===RICHELIEU)assert(mission.start.kind==='docking','hub departure actually docks, not invisible city launch');
  if(c.destinationId===RICHELIEU)assert(DOCKING_LEVELS.some(l=>!beforeDock.has(l.id)&&!l.exitMode&&l.finalDestinationName==='Richelieu Orbital Terminal'),'hub destination uses Richelieu docking');
  if(isGaiaSurface(c.destinationId))assert(LEVELS.some(l=>!beforeGround.has(l.id)&&l.poi.id===canonicalEstellaLocationId(c.destinationId)),'direct delivery uses actual surface site');
}

let boardRows=0;
const seenActors=new Set<string>();
const boardShares=new Map<string,{total:number;civilian:number}>();
let accepted:ReturnType<typeof generateCareerContracts>[number]|undefined;
for(const day of [0,1,2,3,10,11,20,21,30,31,60,61])for(const source of sources) {
  const all=[...generateCareerContracts(source,day*86400),...generatePassengerContracts(source,day*86400)];
  for(const c of all) {
    if(isGaia(c.sourceId)!==isGaia(c.destinationId)) {
      const key=`${isGaia(c.sourceId)?'out':'in'}:${c.category}`;
      const r=boardShares.get(key)??{total:0,civilian:0};r.total++;
      if(c.factionId===GAIA_CIVILIAN_ID)r.civilian++;
      boardShares.set(key,r);
    }
    if(!isNew(c))continue;
    boardRows++;seenActors.add(c.factionId!);
    assert(c.quote.sourceId===c.sourceId&&c.quote.destinationId===c.destinationId,'quote uses dispatched endpoints');
    assert(c.sourceName===ESTELLA_NODES_BY_ID.get(contractLocationId(c.sourceId))?.name&&c.destinationName===ESTELLA_NODES_BY_ID.get(contractLocationId(c.destinationId))?.name,'display names match physical terminals/surface sites');
    assert(c.quote.grossPay>0&&c.details&&c.completionMessage,'actual board is payable with handling information');
    if(c.category==='passenger')assert(!!c.cargo.passengerComfort&&['passenger','fragile-cargo'].includes(c.requiredCertification!),'passenger board license and comfort');
    assert(!['estella-iii-finance-city','estella-iii-historic-site'].includes(c.sourceId)&&!['estella-iii-finance-city','estella-iii-historic-site'].includes(c.destinationId),'no phantom district endpoints');
    if(c.destinationId===RICHELIEU)accepted=c;
  }
}
assert(seenActors.size===3,'all new issuers reach public boards');
for(const [key,r] of boardShares)assert(r.civilian/r.total>0.5,`sampled ${key} public postings predominantly civilian`);
assert(accepted,'real terminal-bound accepted fixture found');
const acceptedJson=JSON.stringify(accepted);
generateCareerContracts(RICHELIEU,100*86400);
assert(JSON.stringify(accepted)===acceptedJson,'later dispatch epochs never rewrite accepted contract/quote');
const profile=defaultCareerProfile();profile.certifications=['basic-1','basic-2','basic-3','line','passenger','fragile-cargo'];
assert(!canTravelEmpty(profile,'estella-iii-military-spaceport'),'retired government spaceport is not an empty-travel destination');
const storage=new Map<string,string>();
(globalThis as any).localStorage={getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)};
const saved={...profile,locationId:RICHELIEU,money:123456,worldTime:1234};
const savedJson=JSON.stringify(saved);storage.set('space-teamster.career.v1',savedJson);
const loaded=loadCareerProfile();
assert(loaded.locationId===RICHELIEU&&loaded.money===saved.money&&loaded.worldTime===saved.worldTime&&storage.get('space-teamster.career.v1')===savedJson,'terminal rename preserves saves without eager rewrites');
const game:any=Object.create(Game.prototype);game.canvas={width:1280,height:900};game.career={...profile,locationId:RICHELIEU};
const scene=game.buildInteractiveScene({id:'stationTerminal',selectedIndex:0});
assert(scene.bodyRows.some((r:any)=>r.text===estellaLocationIntroduction(RICHELIEU)),'real terminal shows Richelieu role');
game.activeCareerContract=accepted;game.activeMissionQuote=accepted.quote;game.missionDvUsed=0;game.worldTime=2000;game.activeManifestCondition={};
game.loadStationTerminal=()=>{game.activeCareerContract=null;};
game.finishCareerDelivery();
assert(game.career.locationId===RICHELIEU&&loadCareerProfile().locationId===RICHELIEU,'consolidated delivery settles at terminal, no hidden surface leg');
assert(JSON.stringify(accepted)===acceptedJson,'settlement leaves accepted posting immutable');
assert(canonicalizeContractCandidates([fixture])[0].sourceId==='estella-iii-capital-city','existing Orselle compatibility normalization retained');
console.log(`Gaia shipping passed: ${assertions} assertions; ${orders.size} daily consignments; ${pairs.size} playable pairs; ${boardRows} new board rows.`,Object.fromEntries([...boardShares].map(([k,r])=>[k,`${(100*r.civilian/r.total).toFixed(1)}% civilian`])));
