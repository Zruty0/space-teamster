import './svg-dom';
import {assertPreThuleEconomy,assertPreThuleBoards,isReachSettlementAddition,THULE_RETIRED_PROVIDER_IDS} from './fixtures/pre-thule-economy';
import baseline from './fixtures/barataria-baseline.json';
import {reviewFingerprint} from './fixtures/camps-review-fingerprint';
import {ESTELLA_NODES,ESTELLA_NODES_BY_ID,ESTELLA_BODY_PHYSICS,ESTELLA_VALIDATION_ISSUES} from '../src/content/estella';
import {ESTELLA_SURFACE_FLIGHT_PROFILES} from '../src/content/estella/flight-profiles';
import {BARATARIA,BARATARIA_OBSERVATORY,WARREN,FALSE_BOTTOM_CACHE,BLIND_DROP,BARATARIA_SURFACE_SITES} from '../src/content/estella/barataria-sites';
import {ESTELLA_FACTION_CONTRACT_PROVIDERS,generateFactionContractCandidates} from '../src/content/estella/faction-contracts';
import {emptyTravelAccess} from '../src/content/estella/empty-travel-access';
import {canTravelEmpty,createEmptyRun,emptyRunDirectory} from '../src/empty-runs';
import {estellaSelectableNavTargets} from '../src/content/estella/navigation';
import {estellaLocationIntroduction} from '../src/content/estella/location-copy';
import {generateCareerContracts,generatePassengerContracts,type CareerContract} from '../src/career-contracts';
import {presentCareerContract} from '../src/contract-presentation';
import {defaultCareerProfile,loadCareerProfile,TEAMSTER_CERTIFICATION_IDS} from '../src/career-state';
import {missionContacts} from '../src/contact-knowledge';
import {createPlayableEstellaMission} from '../src/estella-playable';
import {ORBITAL_LEVELS,visibleOrbitalSurfaceMarkers,orbitalHasSurfaceObjective} from '../src/orbital';
import {Game} from '../src/game';
let checks=0;function assert(ok:unknown,msg:string):asserts ok{checks++;if(!ok)throw Error(msg);}
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const surface=(id:string)=>(BARATARIA_SURFACE_SITES as readonly string[]).includes(id);
const profile={...defaultCareerProfile(),certifications:[...TEAMSTER_CERTIFICATION_IDS],money:1e9};
const pois=ESTELLA_NODES.filter(n=>n.kind==='poi');
const nav=estellaSelectableNavTargets().sort((a,b)=>a.id.localeCompare(b.id));
assert(!ESTELLA_VALIDATION_ISSUES.some(i=>i.severity==='error'),'valid catalog');
assert(ESTELLA_FACTION_CONTRACT_PROVIDERS.length===34,'no added economy provider');
assert(pois.filter(n=>n.id.startsWith('estella-xiv')).length===4,'one existing station and three repurposed surface sites, no duplicate placeholders');
for(const [id,name] of [[BARATARIA,'Barataria'],[BARATARIA_OBSERVATORY,'Barataria Observatory'],['estella-xiv-transit-dock-station','Barataria Observatory'],[WARREN,'The Warren'],[FALSE_BOTTOM_CACHE,'False Bottom Cache'],[BLIND_DROP,'Blind Drop']])assert(ESTELLA_NODES_BY_ID.get(id)?.name===name,'approved descriptive names on stable IDs');
assert(BARATARIA_SURFACE_SITES.filter(id=>ESTELLA_NODES_BY_ID.get(id)?.tags?.includes('settlement')).length===1,'one settlement only');
assert(ESTELLA_NODES_BY_ID.get(FALSE_BOTTOM_CACHE)?.tags?.includes('cache')&&ESTELLA_NODES_BY_ID.get(BLIND_DROP)?.tags?.includes('dead-drop'),'remaining sites are storage and handoff, not new villages');
assert(ESTELLA_NODES_BY_ID.get(BARATARIA)?.summary?.includes('porous')&&ESTELLA_NODES_BY_ID.get(BARATARIA)?.atmosphere?.kind==='none','cavernous airless world');
assert(same(ESTELLA_BODY_PHYSICS[BARATARIA],baseline.physics),'original radius/gravity/rotation');
for(const [id,p] of Object.entries(baseline.placements))assert(same(ESTELLA_NODES_BY_ID.get(id)?.placement,p),'unchanged orbit/site coordinates');
for(const [id,p] of Object.entries(baseline.profiles)){
 const {labelVisibility:_old,...oldProfile}=p as any;
 const currentProfile=ESTELLA_SURFACE_FLIGHT_PROFILES[id];assert(currentProfile,'existing surface flight profile');
 const {labelVisibility,...current}=currentProfile;
 assert(same(current,oldProfile)&&labelVisibility==='target','only target-label visibility may change; terrain/flight profile exact');
}
assert(canTravelEmpty(profile,BARATARIA_OBSERVATORY)&&emptyTravelAccess(BARATARIA_OBSERVATORY)==='public','orbital observatory publicly approachable');
assert(emptyRunDirectory(profile,`node:${BARATARIA}`).some(e=>e.target?.id===BARATARIA_OBSERVATORY),'observatory is the only public receiving destination');
for(const id of BARATARIA_SURFACE_SITES){
 assert(nav.some(n=>n.id===id),'retained future playable endpoint');
 assert(emptyTravelAccess(id)==='unlisted'&&!canTravelEmpty(profile,id),'hidden from independent arrivals');
 assert(!missionContacts().some(c=>c.locationIds.includes(id)),'no new contact unlock or fake reputation implementation');
 assert(!emptyRunDirectory(profile,`node:${BARATARIA}`).some(e=>e.target?.id===id),'hidden from actual picker');
 assert(!ESTELLA_NODES_BY_ID.get(id)?.tags?.some(t=>['religious','abandoned','writer-territory'].includes(t)),'monastery and abandoned mystery themes superseded');
 assert(createEmptyRun({...profile,locationId:id},BARATARIA_OBSERVATORY).destinationId===BARATARIA_OBSERVATORY,'legacy resident can leave for public observatory');
}
// Identity added no jobs; the subsequent sparse observatory/Thule programme
// has its own pre-change snapshot including the approved role retirements.
for(const p of ESTELLA_FACTION_CONTRACT_PROVIDERS){
 if(THULE_RETIRED_PROVIDER_IDS.has(p.id))continue;
 const rows=baseline.days.flatMap(day=>pois.flatMap(n=>p.generateContracts({sourceId:n.id,worldTime:day*86400}).filter(c=>!isReachSettlementAddition(c))));
 assert(same(reviewFingerprint(rows),(baseline.providers as Record<string,number[]>)[p.id]),`${p.id}: full old roster/seed/mass/pay/receipt exact`);
}
assertPreThuleEconomy(assert);
assertPreThuleBoards(assert);
let existingIn=0,existingOut=0;
for(let day=0;day<24;day++)for(const n of pois)for(const c of generateFactionContractCandidates({sourceId:n.id,worldTime:day*86400})){
 assert(!surface(c.sourceId)&&!surface(c.destinationId),'zero surface contracts from every provider');
 if(c.sourceId===BARATARIA_OBSERVATORY)existingOut++;if(c.destinationId===BARATARIA_OBSERVATORY)existingIn++;
}
assert(existingIn>0&&existingOut>0,'existing orbital technical service contracts retained');
const old=baseline.accepted as CareerContract,snapshot=JSON.stringify(old),view=presentCareerContract(old);
assert(view.sourceName==='Barataria Observatory'&&view.sourcePath.includes('Barataria'),'accepted old orbital contract displays new names');
assert(view.quote===old.quote&&JSON.stringify(old)===snapshot,'no mutation of accepted snapshot or quotes');
assert(presentCareerContract({...old,briefing:'Collect at Estella XIV Transit Dock.'}).briefing==='Collect at Barataria Observatory.','cached authored endpoint references normalized');
const storage=new Map<string,string>();(globalThis as any).localStorage={getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)};
const game:any=Object.create(Game.prototype);game.canvas={width:1280,height:900};
for(const id of [BARATARIA_OBSERVATORY,...BARATARIA_SURFACE_SITES]){
 game.career={...profile,locationId:id};
 assert((estellaLocationIntroduction(id)?.length??0)>100&&game.buildInteractiveScene({id:'stationTerminal',selectedIndex:0}).bodyRows.some((r:any)=>r.text===estellaLocationIntroduction(id)),'four role descriptions in actual terminal');
 const saved=JSON.stringify(game.career);storage.set('space-teamster.career.v1',saved);assert(loadCareerProfile().locationId===id&&storage.get('space-teamster.career.v1')===saved,'existing parked saves retained byte-for-byte');
}
let before=new Set(ORBITAL_LEVELS.map(l=>l.id));
assert(createPlayableEstellaMission('estella-xiii-main-port',BARATARIA_OBSERVATORY,undefined,58001).start,'actual public orbital approach playable');
const arrival=ORBITAL_LEVELS.filter(l=>!before.has(l.id)).find(l=>l.station?.id==='estella-xiv-transit-dock-station');
assert(arrival&&visibleOrbitalSurfaceMarkers(arrival).length===0,'observatory approach reveals no hidden surface markers');
for(const id of BARATARIA_SURFACE_SITES){
 before=new Set(ORBITAL_LEVELS.map(l=>l.id));
 assert(createPlayableEstellaMission(BARATARIA_OBSERVATORY,id,undefined,58002+checks).start,'retained surface flight for future authored work');
 const landing=ORBITAL_LEVELS.filter(l=>!before.has(l.id)).find(l=>l.bodyId===BARATARIA&&orbitalHasSurfaceObjective(l));
 assert(landing&&visibleOrbitalSurfaceMarkers(landing).length===1&&visibleOrbitalSurfaceMarkers(landing)[0].id===id,'explicit future target marks only its own approach');
}
console.log(`Barataria: ${checks} checks;one settlement/two caches,zero surface jobs;pre-Thule surviving rosters/unchanged quoted boards exact;orbital24-day ${existingIn}in/${existingOut}out.`);
