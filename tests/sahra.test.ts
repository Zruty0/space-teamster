import './svg-dom';
import baseline from './fixtures/sahra-baseline.json';
// The approved economic follow-up has its own pre-change roster/quote baseline.
import './sahra-economy.test';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID, ESTELLA_VALIDATION_ISSUES } from '../src/content/estella';
import { ESTELLA_BODY_PHYSICS, ESTELLA_BODY_FLIGHT_PROFILES } from '../src/content/estella/physics';
import { ESTELLA_PLACEMENTS } from '../src/content/estella/placements';
import { ESTELLA_LAYOUTS } from '../src/content/estella/layouts';
import { ESTELLA_SURFACE_FLIGHT_PROFILES } from '../src/content/estella/flight-profiles';
import { rockyWorldProfileFor } from '../src/content/estella/rocky-world-appearance';
import { icyWorldProfileFor } from '../src/content/estella/icy-world-appearance';
import { canonicalEstellaLocationId, estellaLocationScopeIds } from '../src/content/estella/location-aliases';
import { estellaSelectableNavTargets, estellaDisplayPath } from '../src/content/estella/navigation';
import { estellaLocationIntroduction } from '../src/content/estella/location-copy';
import { EMPTY_TRAVEL_ACCESS } from '../src/content/estella/empty-travel-access';
import { generateFactionContractCandidates, ESTELLA_FACTION_CONTRACT_PROVIDERS, type FactionContractCandidate } from '../src/content/estella/faction-contracts';
import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { defaultCareerProfile, loadCareerProfile } from '../src/career-state';
import { createEmptyRun, canTravelEmpty } from '../src/empty-runs';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { presentCareerContract } from '../src/contract-presentation';
import { bodyById } from '../src/world';
import { DOCKING_LEVELS } from '../src/docking';
import { Game } from '../src/game';

let checks=0;const assert=(ok:unknown,msg:string)=>{checks++;if(!ok)throw Error(msg);};
const hub='estella-ix-opposite-sense-supply-depot',oldPoi='estella-ix-low-orbit-research-station';
const retired=[oldPoi,'estella-ix-research-station'];
const sites:Record<string,string>={[hub]:'Suhail Anchorage','estella-ix-research-base':'Multaqa','estella-ix-ice-mine':'Bir Safa','estella-ix-geological-feature':'Wadi al-Layl','estella-ix-moonlet-observation-outpost':'Raqib'};
assert(!ESTELLA_VALIDATION_ISSUES.some(i=>i.severity==='error'),'catalog valid');
assert(ESTELLA_NODES.filter(n=>n.kind==='poi'&&n.id.startsWith('estella-ix')).length===5,'exactly five Sahra destinations');
assert(bodyById('estella-ix').name==='Sahra'&&bodyById('estella-ix').atmosphere===null,'Sahra renamed and still airless');
const {notes:oldNotes,...oldPhysics}=baseline.physics;
const {notes,...physics}=ESTELLA_BODY_PHYSICS['estella-ix']!;
assert(JSON.stringify(physics)===JSON.stringify(oldPhysics),'radius165km, gravity1.45 and rotation unchanged');
assert(JSON.stringify(ESTELLA_BODY_FLIGHT_PROFILES['estella-ix']!.orbitalDefaults)===JSON.stringify({baseTimeScale:50,thrustAccel:0.05,thrustAccelMax:1,fuelDeltaV:900,transitionAltitude:8000}),'orbital flight defaults unchanged');
for(const [id,placement] of Object.entries(baseline.placements))assert(JSON.stringify(ESTELLA_NODES_BY_ID.get(id)?.placement)===JSON.stringify(placement),`unchanged placement ${id}`);
for(const [id,profile] of Object.entries(baseline.profiles)){const {subtitle,...actual}=ESTELLA_SURFACE_FLIGHT_PROFILES[id]!;assert(JSON.stringify(actual)===JSON.stringify(profile),'surface tuning/terrain collision unchanged');assert(subtitle.includes(sites[id]),'named flight subtitle');}
assert(rockyWorldProfileFor('estella-ix')?.craterCount===38&&!icyWorldProfileFor('estella-ix'),'approved regolith artwork replaces exposed ice, no atmosphere');
for(const id of retired){assert(!ESTELLA_NODES_BY_ID.has(id)&&!ESTELLA_PLACEMENTS[id]&&!ESTELLA_LAYOUTS[id]&&!EMPTY_TRAVEL_ACCESS[id],'research station actually deleted');assert(canonicalEstellaLocationId(id)===hub&&!estellaLocationScopeIds(hub).includes(id),'compatibility only, never a new destination/district');}
const profile={...defaultCareerProfile(),money:1e9};
for(const [id,name] of Object.entries(sites)){
 assert(ESTELLA_NODES_BY_ID.get(id)?.name===name&&estellaDisplayPath(id).includes('Sahra'),'catalog/navigation names');
 assert(canTravelEmpty(profile,id),'five working destinations available for empty visits');
 assert((estellaLocationIntroduction(id)?.length??0)>100,'authored terminal role');
 assert(createPlayableEstellaMission('caravanserai-main-commercial-dock',id,undefined,9876).start,'playable arrival');
 assert(createPlayableEstellaMission(id,'caravanserai-main-commercial-dock',undefined,9876).start,'playable departure');
}
for(const id of retired){assert(!canTravelEmpty(profile,id),'retired destination not advertised');assert(createEmptyRun({...profile,locationId:id},'caravanserai-main-commercial-dock').sourceId===hub,'old save can depart');const before=new Set(DOCKING_LEVELS.map(l=>l.id));assert(createPlayableEstellaMission('caravanserai-main-commercial-dock',id,undefined,9876).start,'old accepted arrival remains playable');assert(DOCKING_LEVELS.some(l=>!before.has(l.id)&&!l.exitMode&&l.finalDestinationName==='Suhail Anchorage'),'retired arrival actually targets surviving anchorage');}
assert(ESTELLA_FACTION_CONTRACT_PROVIDERS.length===34,'approved Sahra and subsequent Weymark booking aggregators');
const raw:FactionContractCandidate[]=[],boards:CareerContract[]=[];
for(const day of [0,1,20,21]){for(const n of ESTELLA_NODES.filter(n=>n.kind==='poi'))raw.push(...generateFactionContractCandidates({sourceId:n.id,worldTime:day*86400}));for(const n of estellaSelectableNavTargets().sort((a,b)=>a.id.localeCompare(b.id)))boards.push(...generateCareerContracts(n.id,day*86400),...generatePassengerContracts(n.id,day*86400));}
// Original pre-identity snapshot still pins geometry/physics above. New
// routing and explicit fuel deletions supersede its aggregate economy hash;
// sahra-economy.test.ts protects every surviving raw order and untouched board.
let redirected=0;
for(const c of raw){assert(!retired.includes(c.sourceId)&&!retired.includes(c.destinationId),'no generated job points at removed station');if(c.templateId.includes(oldPoi)){redirected++;assert(c.destinationId===hub,'existing research cargo received through Suhail');}}
assert(redirected===8,'exactly two old logical orders/day redirected over four epochs');

const storage=new Map<string,string>();(globalThis as any).localStorage={getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)};
const history='[{"destinationId":"estella-ix-low-orbit-research-station","grossPay":123}]';storage.set('space-teamster.missionProfiles.v1',history);
for(const id of retired){const saved={...profile,locationId:id,money:123456,worldTime:7654};const text=JSON.stringify(saved);storage.set('space-teamster.career.v1',text);const loaded=loadCareerProfile();assert(loaded.locationId===hub&&loaded.money===saved.money&&loaded.worldTime===saved.worldTime,'old save redirected without changing finances/time');assert(JSON.stringify(loaded.rig)===JSON.stringify(saved.rig)&&storage.get('space-teamster.career.v1')===text,'rig and stored save untouched');}
const game:any=Object.create(Game.prototype);game.canvas={width:1280,height:900};game.career=profile;
for(const id of Object.keys(sites)){game.career={...profile,locationId:id};const scene=game.buildInteractiveScene({id:'stationTerminal',selectedIndex:0});assert(scene.bodyRows.some((r:any)=>r.text===estellaLocationIntroduction(id)),'actual terminal introduction');}
const current=boards.find(c=>c.templateId?.includes(oldPoi))!;assert(current,'real rerouted quote');
const accepted={...current,destinationId:oldPoi,destinationName:'Estella IX Research Station',title:'Deliver survey instrument crates to Estella IX Research Station',quote:{...current.quote,destinationId:oldPoi}};
const snapshot=JSON.stringify(accepted),view=presentCareerContract(accepted);assert(view.destinationName==='Suhail Anchorage'&&view.quote===accepted.quote&&JSON.stringify(accepted)===snapshot,'old accepted display changes, quote/object intact');
assert(presentCareerContract({...accepted,title:'Charter to Estella IX Research Station',details:'Reception at Estella IX Research Station.'}).title==='Charter to Suhail Anchorage','authored cached titles also follow retirement');
assert(presentCareerContract({...accepted,details:'Reception at Estella IX Research Station.'}).details==='Reception at Suhail Anchorage.','cached endpoint prose reconciled without rewriting originals');
game.career={...profile};game.activeCareerContract=accepted;game.activeMissionQuote=accepted.quote;game.missionDvUsed=0;game.worldTime=100;game.activeManifestCondition={};game.loadStationTerminal=()=>{};game.finishCareerDelivery();
assert(game.career.locationId===hub&&loadCareerProfile().locationId===hub,'real old-contract settlement resumes at Suhail');
const completedHistory=JSON.parse(storage.get('space-teamster.missionProfiles.v1')!);
assert(JSON.stringify(accepted)===snapshot&&JSON.stringify(completedHistory.slice(0,1))===history,'accepted quote and original historical entry never rewritten');
assert(completedHistory.length===2,'atomic delivery appends exactly its one new flight record');
console.log(`Sahra identity passed: ${checks} assertions; five destinations, removed station, original physics/placements, ${raw.length} candidates. Economic follow-up checked against its independent pre-change snapshot.`);
