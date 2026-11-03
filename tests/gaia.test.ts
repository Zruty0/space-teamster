import './svg-dom';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID, ESTELLA_VALIDATION_ISSUES } from '../src/content/estella';
import { ESTELLA_SURFACE_FLIGHT_PROFILES } from '../src/content/estella/flight-profiles';
import { canonicalEstellaLocationId, estellaLocationScopeIds } from '../src/content/estella/location-aliases';
import { estellaFolderEntries, estellaDisplayPath, estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { estellaLocationIntroduction, PANDEMONIUM_COPY } from '../src/content/estella/location-copy';
import { defaultCareerProfile, loadCareerProfile } from '../src/career-state';
import { emptyRunDirectory, canTravelEmpty, createEmptyRun } from '../src/empty-runs';
import { localTerminalScopeIds, localDirectoryEntriesAt } from '../src/local-directory';
import { missionContacts } from '../src/contact-knowledge';
import { canonicalizeContractCandidates, generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { generateFactionContractCandidates, type FactionContractCandidate } from '../src/content/estella/faction-contracts';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { surfacePoiById, bodyById } from '../src/world';
import { ORBITAL_LEVELS } from '../src/orbital';
import { APPROACH_LEVELS } from '../src/approach';
import { LEVELS } from '../src/levels';
import { Game } from '../src/game';
import { contractLocationId } from '../src/contract-presentation';

let assertions=0;
function assert(ok:unknown,message:string):asserts ok {assertions++;if(!ok)throw Error(message);}
const capital='estella-iii-capital-city';
const aliases=['estella-iii-finance-city','estella-iii-historic-site'];
const retired='estella-iii-military-spaceport';
const legacyLocations=[...aliases,retired];
const sites:Record<string,string>={
  [capital]:'Orselle','estella-iii-high-tech-city':'Rochefort','estella-iii-agricultural-region':'Valenne',
  'estella-iii-coastal-resort':'Mirabel','estella-iii-polar-science':'Cousteau Station',
  'estella-iiia-helium-mining':'Ampere','estella-iiia-science-settlement':'Descartes Lab','estella-iiia-heritage-site':'Beaumont',
};
assert(!ESTELLA_VALIDATION_ISSUES.some(issue=>issue.severity==='error'),'world catalog valid');
assert(bodyById('estella-iiia').name==='Celeste','live lunar body renamed');
assert(ESTELLA_NODES_BY_ID.get('estella-iiia-main-port')?.name==='Celeste Main Port','orbital port follows moon name');
for(const [id,name] of Object.entries(sites)) {
  const node=ESTELLA_NODES_BY_ID.get(id)!;
  assert(node.name===name && surfacePoiById(id).name===name,`${name}: catalog and playable surface name`);
  assert(estellaDisplayPath(id).endsWith(name),`${name}: live navigation path`);
  const {subtitle,...flight}=ESTELLA_SURFACE_FLIGHT_PROFILES[id]!;
  const {subtitle:ignored,...baseline}=ESTELLA_SURFACE_FLIGHT_PROFILES[id.startsWith('estella-iiia-')?'estella-i-worker-hab':'estella-iv-primary-city']!;
  assert(subtitle.includes(name),'flight subtitle identifies actual site');
  assert(JSON.stringify(flight)===JSON.stringify(baseline),'site naming does not change flight tuning');
  assert(estellaLocationIntroduction(id)===node.summary && node.summary!.length>100,`${name}: factual role in terminal`);
}
assert(/billions/.test(ESTELLA_NODES_BY_ID.get('estella-iii')!.summary!) && /polar terraforming continues/.test(ESTELLA_NODES_BY_ID.get('estella-iii')!.summary!),'inhabited Gaia still undergoing terraforming');
assert(/breathable/.test(estellaLocationIntroduction('estella-iii-polar-science')!) && /heated habitation/.test(estellaLocationIntroduction('estella-iii-polar-science')!),'polar hazard is cold/ice, not isolated unbreathable atmosphere');
assert(/first inhabited/.test(ESTELLA_NODES_BY_ID.get('estella-iv')!.summary!) && /floating/.test(ESTELLA_NODES_BY_ID.get('estella-iv-primary-city')!.summary!),'Dahai-first floating-habitat chronology');
for(const id of ['estella-iv-primary-city','estella-iv-climate-poi-1','estella-iv-climate-poi-3']) assert(!/island|atoll|archipelago/i.test(ESTELLA_NODES_BY_ID.get(id)!.name),'obsolete Dahai island labels removed');
assert(estellaLocationIntroduction('estella-ii-pandemonium')===PANDEMONIUM_COPY.introduction,'approved Acheron prose unchanged');
assert(missionContacts().length===1,'no invented mission contacts');

const profile=defaultCareerProfile();profile.certifications=['basic-1','basic-2','basic-3','line','passenger','fragile-cargo'];
const gaia=emptyRunDirectory(profile,'node:estella-iii');
const surfaceNames=gaia.filter(e=>e.target && ESTELLA_NODES_BY_ID.get(e.target.id)?.placement?.kind==='surface').map(e=>e.label).sort();
assert(JSON.stringify(surfaceNames)===JSON.stringify(['Orselle','Rochefort','Valenne','Mirabel','Cousteau Station'].sort()),'exactly five meaningful public surface destinations');
const lunar=emptyRunDirectory(profile,'node:estella-iiia');
assert(lunar.filter(e=>e.target && ESTELLA_NODES_BY_ID.get(e.target.id)?.placement?.kind==='surface').length===3,'three living lunar surface sites');
assert(!ESTELLA_NODES_BY_ID.has(retired) && !ESTELLA_SURFACE_FLIGHT_PROFILES[retired], 'government spaceport removed from catalog and flight profiles');
assert(!canTravelEmpty(profile,retired) && !estellaSelectableNavTargets().some(t=>t.id===retired), 'retired site is not a travel destination');
assert(!estellaFolderEntries('node:estella-iii').some(e=>e.target?.id===retired), 'retired site absent from Gaia site list');
assert(canonicalEstellaLocationId(retired)===capital && !estellaLocationScopeIds(capital).includes(retired), 'old destination redirects without becoming a city district/provider scope');
assert(createEmptyRun({...profile,locationId:retired},'estella-iii-main-customs').sourceId===capital, 'legacy departure not stranded');
for(const alias of aliases) {
  assert(canonicalEstellaLocationId(alias)===capital && !canTravelEmpty(profile,alias),'district is not another empty destination');
  assert(!estellaFolderEntries('node:estella-iii').some(e=>e.target?.id===alias),'generic directory also hides district aliases');
  assert(estellaSelectableNavTargets().some(e=>e.id===alias),'legacy/provider endpoint remains resolvable');
  assert(surfacePoiById(alias).surfaceAngle===surfacePoiById(capital).surfaceAngle,'district co-located with city');
  assert(estellaDisplayPath(alias)===estellaDisplayPath(capital),'district display path points to city');
  assert(JSON.stringify(localTerminalScopeIds(alias))===JSON.stringify(localTerminalScopeIds(capital)),'district services are accessible from consolidated terminal');
  assert(JSON.stringify(localDirectoryEntriesAt(alias,profile.certifications))===JSON.stringify(localDirectoryEntriesAt(capital,profile.certifications)),'local office access preserved');
  for(const id of estellaLocationScopeIds(capital)) assert(!canTravelEmpty({...profile,locationId:alias},id),'no same-city empty hopping');
  assert(createEmptyRun({...profile,locationId:alias},'estella-iii-main-customs').sourceId===capital,'legacy departure normalized without stranding player');
}
assert(canonicalEstellaLocationId('constructor')==='constructor' && canonicalEstellaLocationId('elsewhere')==='elsewhere','aliases affect only explicit old IDs');

// Cloned candidate endpoints, no price/cargo/narrative changes, no doubled city orders.
const raw:FactionContractCandidate={factionId:'fixture',factionName:'Fixture',templateId:'test',sourceId:'estella-iii-main-customs',destinationId:aliases[0],cargo:{label:'fixture freight',massTons:4},likelihood:1,generosity:0.75};
const old=JSON.stringify(raw);
const normalized=canonicalizeContractCandidates([raw,{...raw,destinationId:capital},{...raw,cargo:{...raw.cargo,massTons:5}}]);
assert(normalized.length===2 && normalized.every(c=>c.destinationId===capital),'identical city postings collapse, distinct cargo remains');
assert(JSON.stringify(raw)===old && normalized[0].cargo===raw.cargo && normalized[0].generosity===raw.generosity,'raw candidate data untouched');
assert(canonicalizeContractCandidates([{...raw,destinationId:'estella-vi-heavy-cargo-station'},{...raw,destinationId:'estella-vi-heavy-cargo-station'}]).length===2,'unrelated candidate multiplicity unchanged');

const actors=new Set<string>(); let boardRows=0;
for(const day of [0,1,20,21,119]) {
  const time=day*86400;
  const jobs=[...generateCareerContracts(capital,time),...generatePassengerContracts(capital,time)];
  assert(jobs.length>0,'Orselle has real boards');
  for(const alias of aliases) {
    assert(JSON.stringify(generateCareerContracts(alias,time))===JSON.stringify(generateCareerContracts(capital,time)),'legacy freight entry opens same city board');
    assert(JSON.stringify(generatePassengerContracts(alias,time))===JSON.stringify(generatePassengerContracts(capital,time)),'legacy passenger entry opens same city board');
  }
  for(const id of localTerminalScopeIds(capital)) for(const c of generateFactionContractCandidates({sourceId:id,worldTime:time})) actors.add(c.factionId);
  for(const source of [capital,'estella-i-transit-customs','caravanserai-main-commercial-dock','still-guild-hq','estella-vi-heavy-cargo-station','estella-via-drydock-station','estella-xif-deep-listening-array']) {
    for(const c of [...generateCareerContracts(source,time),...generatePassengerContracts(source,time)]) {
      boardRows++;
      assert(!legacyLocations.includes(c.sourceId)&&!legacyLocations.includes(c.destinationId),'new boards never advertise districts or retired government spaceport');
      assert(c.sourceName===ESTELLA_NODES_BY_ID.get(contractLocationId(c.sourceId))?.name && c.destinationName===ESTELLA_NODES_BY_ID.get(contractLocationId(c.destinationId))?.name,'fresh board names reflect physical locations in current catalog');
      if(c.destinationId===capital) assert(c.quote.destinationId===capital && c.destinationName==='Orselle','canonical endpoint quoted and displayed');
    }
  }
}
assert(actors.has('voss-heinkel-metricwerke') && actors.has('kisaragi-harmony-yards'),'former financial-city corporate headquarters still provide work');

// Every new role can be flown both ways; legacy contracts generate the city's
// landing objective/marker, not an invisible old district objective.
for(const id of [...Object.keys(sites),...legacyLocations]) {
  const before=new Set(ORBITAL_LEVELS.map(l=>l.id));
  const beforeApproach=new Set(APPROACH_LEVELS.map(l=>l.id));
  const beforeLanding=new Set(LEVELS.map(l=>l.id));
  assert(createPlayableEstellaMission('estella-iii-main-customs',id,undefined,540).start,'arrival builds');
  assert(LEVELS.some(l=>!beforeLanding.has(l.id)&&l.poi.id===canonicalEstellaLocationId(id)),'arrival uses canonical landing site');
  for(const level of ORBITAL_LEVELS.filter(l=>!before.has(l.id)&&l.bodyId==='estella-iii')) {
    assert(!level.surfaceMarkers?.some(m=>legacyLocations.includes(m.id)),'no duplicate district or retired spaceport ground markers');
  }
  if(legacyLocations.includes(id)) assert(APPROACH_LEVELS.some(l=>!beforeApproach.has(l.id)&&l.poi.id===capital),'legacy descent uses Orselle objective');
  const departure=createPlayableEstellaMission(id,'estella-iii-main-customs',undefined,540);
  assert(departure.start.kind==='landing'&&departure.start.level.poi.id===canonicalEstellaLocationId(id),'canonical surface departure');
}

// Load-time migration affects only location. Keep balances, rig, credentials,
// contact knowledge, diagnostic credits and historical storage untouched.
const storage=new Map<string,string>();
(globalThis as any).localStorage={getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)};
const history='[{"destinationId":"estella-iii-finance-city","destinationName":"Secondary Finance City","grossPay":123}]';
storage.set('space-teamster.missionProfiles.v1',history);
for(const alias of legacyLocations) {
  const saved={...profile,locationId:alias,money:123456,worldTime:98765,knownContactIds:['gideon-gid-bell'],maintenanceShopInspections:{fixture:{diagnosedWorldTime:10,diagnosedMaintenanceMission:0,creditRemaining:123,dishonestyRevision:0,fabricatedFaults:[],fabricatedServiceComponentIds:[],pretendMaintainedComponentIds:[]}}};
  const serialized=JSON.stringify(saved);storage.set('space-teamster.career.v1',serialized);
  const loaded=loadCareerProfile();
  assert(loaded.locationId===capital,'old district save resumes in Orselle');
  assert(loaded.money===saved.money && loaded.worldTime===saved.worldTime,'money/time retained');
  assert(JSON.stringify(loaded.rig)===JSON.stringify(saved.rig),'rig retained');
  assert(JSON.stringify([...loaded.certifications].sort())===JSON.stringify([...saved.certifications].sort()),'qualifications retained');
  assert(JSON.stringify(loaded.knownContactIds)===JSON.stringify(saved.knownContactIds) && loaded.maintenanceShopInspections.fixture.creditRemaining===123,'contacts/inspection credit retained');
  assert(storage.get('space-teamster.career.v1')===serialized && storage.get('space-teamster.missionProfiles.v1')===history,'migration does not eagerly rewrite current-schema save or old logs');
}

const game:any=Object.create(Game.prototype);game.canvas={width:1280,height:900};game.career=profile;
for(const id of Object.keys(sites)) {
  game.career={...profile,locationId:id};
  const scene=game.buildInteractiveScene({id:'stationTerminal',selectedIndex:0});
  assert(scene.bodyRows.some((r:any)=>r.text===estellaLocationIntroduction(id)),'real terminal shows approved local role');
}
const legacyContract=generateCareerContracts('estella-iii-main-customs',0)[0];
game.loadStationTerminal=()=>{game.activeCareerContract=null;};
for(const destinationId of [aliases[0],retired]) {
  const accepted={...legacyContract,destinationId,destinationName:destinationId===retired?'Government/Military Spaceport':'Secondary Finance City',quote:{...legacyContract.quote,destinationId}};
  const acceptedJson=JSON.stringify(accepted);
  game.career={...profile};game.activeCareerContract=accepted;game.activeMissionQuote=accepted.quote;game.missionDvUsed=0;game.worldTime=100;game.activeManifestCondition={};
  game.finishCareerDelivery();
  assert(game.career.locationId===capital && loadCareerProfile().locationId===capital,'old accepted delivery settles in Orselle');
  assert(JSON.stringify(accepted)===acceptedJson && JSON.stringify(JSON.parse(storage.get('space-teamster.missionProfiles.v1')!).slice(0,1))===history,'accepted contract/quote and original historical entry never rewritten');
}
assert(JSON.parse(storage.get('space-teamster.missionProfiles.v1')!).length===3,'atomic delivery appends only the two newly completed flights');
console.log(`Gaia/Celeste passed: ${assertions} assertions; ${boardRows} board rows; ${actors.size} Orselle issuers; names, roles, districts, legacy saves/contracts, flight phases.`);
