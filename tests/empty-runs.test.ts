import './svg-dom';
import './empty-rig-rendering.test';
import { defaultCareerProfile, loadCareerProfile, saveCareerProfile } from '../src/career-state';
import { LOCAL_DIRECTORY_ENTRIES, GIDEON_BELL, localTerminalScopeIds } from '../src/local-directory';
import { contactSummary, knownMissionContacts, learnMissionContacts, missionContacts } from '../src/contact-knowledge';
import { EMPTY_TRAVEL_ACCESS, emptyTravelAccess } from '../src/content/estella/empty-travel-access';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID } from '../src/content/estella';
import { estellaFolderEntries, navigationOrbitRadius, compareNavigationNodes, type EstellaFolderKey } from '../src/content/estella/navigation';
import { canTravelEmpty, createEmptyRun, emptyRunDestinationIds, emptyRunDirectory, emptyRunLocationId, emptyRunLocationType } from '../src/empty-runs';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { actualFuelCostForQuote, contractPayoutForQuote } from '../src/mission-cost';
import { generateCareerContracts } from '../src/career-contracts';
import { createMissionProfileEntry, readMissionProfiles, missionProfilesToCsv } from '../src/mission-profile-log';
import { Game } from '../src/game';
import { interactiveOptionLayout } from '../src/interactive-scene';
import { createMaintenanceTelemetry } from '../src/maintenance/telemetry';
import { resolveMaintenanceSettlement } from '../src/maintenance/strike-resolution';

let assertions=0;
function assert(ok: unknown, message: string): asserts ok { assertions++; if (!ok) throw new Error(message); }
const storage = new Map<string,string>(); let failSave=false, saves=0;
(globalThis as any).localStorage={ getItem:(k:string)=>storage.get(k)??null, setItem:(k:string,v:string)=>{if(failSave)throw Error('test storage failure');saves++;storage.set(k,v);}, removeItem:(k:string)=>storage.delete(k) };
const profile=defaultCareerProfile(); profile.certifications=['basic-1','basic-2','basic-3','line'];
const unlisted=['estella-v-abandoned-colony','estella-viii-abandoned-site','reach-comet-fragment-2-poi','reach-rogue-lonely-beacon','deepest-dock-poi','reach-comet-fragment-4-poi','reach-comet-fragment-6-poi'];
const pois=ESTELLA_NODES.filter(n=>n.kind==='poi');
assert(Object.keys(EMPTY_TRAVEL_ACCESS).length===pois.length,'every POI explicitly reviewed, no stale access entries');
for(const n of pois) assert(Object.prototype.hasOwnProperty.call(EMPTY_TRAVEL_ACCESS,n.id),`access authored: ${n.id}`);
assert(emptyTravelAccess('future-unreviewed-node')==='unlisted' && emptyTravelAccess('constructor')==='unlisted','new sites and prototype keys fail closed');
for(const id of unlisted) assert(emptyTravelAccess(id)==='unlisted' && !canTravelEmpty(profile,id),'eight debated sites hidden for empty travel');
for(const id of ['estella-i-worker-hab','estella-ii-pandemonium','estella-xif-deep-listening-array','estella-xc-castle-mendes','estella-xiia-volatiles-transit','still-public-approach-dock']) assert(canTravelEmpty(profile,id),`public receiving exception: ${id}`);
for(const id of ['estella-vi-spaceport','estella-vib-vat-protein','still-refinery-core','estella-xif-observatory','estella-xif-sealed-research-outpost','estella-xiid-mirror-clinic']) assert(!canTravelEmpty(profile,id),`closed destination: ${id}`);
for(const id of localTerminalScopeIds(profile.locationId)) assert(!canTravelEmpty(profile,id),'no same-terminal repositioning');
assert(missionContacts().length===1 && missionContacts()[0].id===GIDEON_BELL.id,'Gid is the sole current mission contact, shop staff excluded');
assert(knownMissionContacts(profile).length===0 && !canTravelEmpty(profile,'still-guild-hq'),'unknown Gid grants no HQ arrival');
const learned=learnMissionContacts(profile,[GIDEON_BELL.id,GIDEON_BELL.id,'vilar-shop-person','unknown']);
assert(learned!==profile && profile.knownContactIds?.length===0 && learned.knownContactIds?.length===1,'atomic knowledge copy, dedupe, valid people only');
assert(canTravelEmpty(learned,'still-guild-hq') && !canTravelEmpty(learned,'still-refinery-core'),'known contact opens exact site, not sibling departments');
const stillEntry=emptyRunDirectory(learned,'node:new-canaan-field').find(e=>e.target?.id==='still-public-approach-dock');
assert(stillEntry?.contacts===GIDEON_BELL.name && stillEntry.label==='The Still','station selected directly, public entrance chosen, contact at sibling department still shown');
assert(!emptyRunDirectory(learned,'node:new-canaan-field').some(e=>e.key==='node:the-still'),'no final Still dock-selection folder');
assert(emptyRunDirectory(learned,'region:belt').find(e=>e.key==='node:new-canaan-field')?.contacts===GIDEON_BELL.name,'ancestor branch advertises known contact');
assert(!emptyRunDirectory(learned,'node:estella-viii-friendly-station').some(e=>e.contacts),'remote certification link does not relocate Gid to Nells Rest');
let oldSaves=saves; assert(learnMissionContacts(learned,[GIDEON_BELL.id])===learned && saves===oldSaves,'known introductions are no-op saves');
failSave=true; let failed=false; try{learnMissionContacts(profile,[GIDEON_BELL.id]);}catch{failed=true;} failSave=false;
assert(failed && !profile.knownContactIds?.length,'failed knowledge save does not unlock site');
assert(contactSummary([GIDEON_BELL,GIDEON_BELL])===GIDEON_BELL.name,'dedupe contact identity');
assert(contactSummary([])===undefined && contactSummary([GIDEON_BELL,{id:'another',name:'Another'}])==='2 contacts','zero omitted, plural uses count');

// Simulate future real representatives, not fake office/shop names.
const contacts=[{...GIDEON_BELL,id:'fixture-a',name:'Representative A',locationIds:[unlisted[2]]},{...GIDEON_BELL,id:'fixture-b',name:'Representative B',locationIds:[unlisted[2]]}];
try {
  LOCAL_DIRECTORY_ENTRIES.push(...contacts);
  const a=learnMissionContacts(profile,['fixture-a']);
  assert(canTravelEmpty(a,unlisted[2]),'known representative unlocks unlisted cache');
  assert(emptyRunDirectory(a,'node:reach-comet-swarm').find(e=>e.target?.id===unlisted[2])?.contacts==='Representative A','auto-selected unlisted receiving site requires known contact');
  assert(emptyRunDirectory(a,'node:reach-comet-fragment-2')[0].contacts==='Representative A','one known person name, unknown second person not leaked');
  const b=learnMissionContacts(a,['fixture-b']);
  assert(emptyRunDirectory(b,'node:reach-comet-fragment-2')[0].contacts==='2 contacts','plural display at unlocked site');
  assert(emptyRunDirectory(b,'region:reach').find(e=>e.key==='node:reach-comet-swarm')?.contacts==='2 contacts','folder aggregates actual known people');
} finally { LOCAL_DIRECTORY_ENTRIES.splice(LOCAL_DIRECTORY_ENTRIES.length-contacts.length,contacts.length); }

saveCareerProfile(learned);
assert(loadCareerProfile().knownContactIds?.[0]===GIDEON_BELL.id,'knowledge persists');
const legacy:any={...profile}; delete legacy.knownContactIds;
storage.set('space-teamster.career.v1',JSON.stringify(legacy));
assert(loadCareerProfile().knownContactIds?.includes(GIDEON_BELL.id),'legacy completed Gid practicals migrate knowledge');
storage.set('space-teamster.career.v1',JSON.stringify({...legacy,certifications:[]}));
assert(!loadCareerProfile().knownContactIds?.length,'legacy trainee knows nobody');
storage.set('space-teamster.career.v1',JSON.stringify({...legacy,knownContactIds:[]}));
assert(!loadCareerProfile().knownContactIds?.length,'explicit new-save empty knowledge wins over certifications');

// Player-facing location types, without orbital equations/coordinates.
for(const [id,label] of [
  ['estella-i','Planet'],['estella-viii','Dwarf planet'],['estella-x','Gas giant'],
  ['estella-i-worker-hab','Surface site'],['estella-iiia','Moon'],
  ['estella-via','Near moon'],['estella-vib','Far moon'],
  ['estella-xa','Near moon'],['estella-xb','Near moon'],['estella-xc','Far moon'],['estella-xd','Far moon'],
  ['estella-xia','Near moon'],['estella-xic','Near moon'],['estella-xid','Far moon'],['estella-xif','Far moon'],
  ['estella-i-transit-customs','Low orbit station'],['estella-vi-heavy-cargo-station','High orbit station'],
  ['skim-hub-alpha','Low orbit station'],['still-public-approach-dock','Asteroid'],['ark-quarantine-station','Station'],['estella-ii-olympos-platform','Atmospheric station'],['estella-ii-olympos','Surface site'],
  ['new-canaan-field','Asteroid field'],['reach-comet-swarm','Comet swarm'],['belt-cluster-wreckage-field','Debris field'],
  ['reach-comet-fragment-1-poi','Comet fragment'],['estella-xi-science-waypoint-poi','Asteroid'],
  ['estella-viii-moonlet-docking-site','Moon'],
]) assert(emptyRunLocationType(id)===label,`${id}: concise type ${label}`);

// Traverse the actual filtered tree. No empty branch, hidden target or wrong radius order.
const found=new Set<string>(), folders:EstellaFolderKey[]=['root'];
for(let i=0;i<folders.length;i++) {
  const entries=emptyRunDirectory(learned,folders[i]);
  assert(entries.length>0,'empty folders pruned');
  const nodes=entries.flatMap(e=>{ const n=ESTELLA_NODES_BY_ID.get(e.target?emptyRunLocationId(e.target.id):e.key?.slice(5)??'');return n?[n]:[]; });
  for(let j=1;j<nodes.length;j++) assert(compareNavigationNodes(nodes[j-1],nodes[j])<=0,'siblings sorted by shared-parent orbital radius, stable fallback');
  for(const e of entries) {
    const count=parseInt(e.detail);
    assert(!/circular|kepler|coordinates|r=|a=|km|°|aboard/i.test(e.detail),'no orbital jargon or coordinates in browsing details');
    if(e.key?.startsWith('node:') || e.target) {
      const id=e.target?.id??e.key!.slice(5);
      assert(e.detail.endsWith(` · ${emptyRunLocationType(id)}`),'folder and auto-selected destination use concise physical type');
    }
    assert(Number.isFinite(count) && count>0 && e.detail.startsWith(`${count} available destination${count===1?'':'s'}`),'available destinations shown at every tree level');
    if(e.kind==='folder') {
      const childCount=emptyRunDirectory(learned,e.key!).reduce((sum,child)=>sum+parseInt(child.detail),0);
      assert(count===childCount,'folder count equals all selectable descendant locations, not immediate child folders');
      folders.push(e.key!);
    }
    else assert(count===1,'surface sites and auto-selected terminals report one destination');
    if(e.kind==='target') { assert(canTravelEmpty(learned,e.target!.id),'tree contains only allowed targets'); found.add(e.target!.id); }
  }
}
const allowedLocations=new Set([...emptyRunDestinationIds(learned)].map(emptyRunLocationId));
assert(found.size===allowedLocations.size,'one choice per physical terminal/site, not per dock');
for(const id of found) assert(allowedLocations.delete(emptyRunLocationId(id)),'unique physical destination');
assert(allowedLocations.size===0,'every allowed physical destination represented');
assert(emptyRunDirectory(learned,'root').reduce((sum,e)=>sum+parseInt(e.detail),0)===found.size,'region counts report physical destinations rather than dock aliases');
const hearth=estellaFolderEntries('region:hearth');
assert(hearth[0].key==='node:skim-hub-alpha' && hearth[1].key==='node:skim-hub-beta' && hearth[2].key==='node:estella-i','stellar radius order, not alphabetic');
const moonNodes=estellaFolderEntries('node:estella-xi').map(e=>ESTELLA_NODES_BY_ID.get(e.key?.slice(5)??e.target?.id??'')!).filter(n=>n&&navigationOrbitRadius(n)!==undefined);
for(let i=1;i<moonNodes.length;i++) assert(navigationOrbitRadius(moonNodes[i-1])!<=navigationOrbitRadius(moonNodes[i])!,'moon and station radius order');

// Every eligible target is playable, with zero freight and zero payout at all fuel usage.
for(const destinationId of emptyRunDestinationIds(learned)) {
  if(ESTELLA_NODES_BY_ID.get(destinationId)?.placement?.kind==='aboard') assert(emptyRunLocationId(destinationId)!==destinationId,'all aboard dock types collapse to a physical destination');
  const c=createEmptyRun(learned,destinationId);
  assert(c.category==='empty' && c.cargo.massTons===0 && !c.cargo.fragile && !c.cargo.passengerComfort,'true empty manifest');
  assert(!c.certificationOnSuccess && !c.nunesInquiry && !c.factionId,'no delivery rewards, inquiry progress or faction issuer');
  assert(c.quote.grossPay===0 && c.quote.pay.compensationRatio===0 && c.quote.pay.generosity===0 && c.quote.pay.flatReward===0,'all pay explicitly zero');
  for(const dv of [0,100,c.quote.parDv*3]) assert(contractPayoutForQuote(c.quote,dv)===0,'no hidden fuel reimbursement');
  assert(c.quote.parFuelCost>0 && Number.isFinite(c.quote.parDv),'finite fuel estimate');
  assert(createPlayableEstellaMission(c.sourceId,c.destinationId,c.selectedTransfer,1965).start,'real playable empty route');
  assert(JSON.parse(JSON.stringify(c)).category==='empty','empty run serializes');
}
for(const [source,destination] of [['estella-xif-sealed-research-outpost','estella-xif-deep-listening-array'],['estella-i-worker-hab','estella-i-refractory-mine']]) {
  const c=createEmptyRun({...profile,locationId:source},destination);
  assert(createPlayableEstellaMission(source,destination,c.selectedTransfer,1966).start,'private departure and public surface-to-surface relocation');
}
let denied=false; try{createEmptyRun(profile,unlisted[2]);}catch{denied=true;}
assert(denied,'direct factory call cannot generate unauthorized empty run');
let publicPosting=false;
for(const id of [unlisted[2],unlisted[3],unlisted[4]]) for(const day of [0,1,10]) {
  const board=generateCareerContracts(id,day*86400);
  if(board.some(c=>c.sourceId===id)) publicPosting=true;
}
assert(publicPosting,'commercial boards at non-public locations retained, no discovery gating applied');
assert(generateCareerContracts('estella-vib-cold-chain-station',0).some(c=>!canTravelEmpty(profile,c.destinationId)), 'public board still authorizes deliveries TO non-public destinations');

// Real terminal/office action path; no browser or live career storage.
const game:any=Object.create(Game.prototype);
game.career={...profile,knownContactIds:[]}; game.canvas={width:1280,height:900};
game.guidance=[]; game.showGuidance=(s:string)=>game.guidance.push(s); game.showContextualOperationsManual=()=>{};
game.phase={kind:'interactiveScene',scene:{id:'stationTerminal',selectedIndex:0}};
let scene=game.buildInteractiveScene(game.phase.scene);
assert(scene.options.some((o:any)=>o.label==='Plan Empty Run'),'terminal entry present');
game.activateInteractiveSceneOption(game.phase.scene,'directoryEntry:teamsters-guild-certification-office');
assert(game.career.knownContactIds.includes(GIDEON_BELL.id),'seeing office introduction learns Gid');
const ctx:any={font:'14px monospace',measureText(text:string){return {width:Array.from(text).length*Number(this.font.match(/([\d.]+)px/)?.[1]??14)*0.62};}};
for(const folder of folders) for(const option of game.buildInteractiveScene({id:'emptyRunDirectory',selectedIndex:0,emptyFolder:folder}).options) {
  const layout=interactiveOptionLayout(ctx,920,option);
  assert(layout.labelLines.join('').replace(/\s/g,'')===option.label.replace(/\s/g,''),'desktop directory labels wrap without truncation');
  assert(layout.rightLines.join('').replace(/\s/g,'')===(option.rightText??'').replace(/\s/g,''),'contact annotations wrap without truncation');
}
game.activateInteractiveSceneOption(game.phase.scene,'emptyFolder:node:new-canaan-field');
scene=game.buildInteractiveScene(game.phase.scene);
assert(scene.options.some((o:any)=>o.rightText===GIDEON_BELL.name),'real directory displays Gid');
const stillOption=scene.options.find((o:any)=>o.label==='The Still');
assert(stillOption?.action==='emptyDestination:still-public-approach-dock','station row auto-selects allowed receiving dock');
game.activateInteractiveSceneOption(game.phase.scene,stillOption.action);
assert(game.phase.scene.id==='emptyRunConfirm','selection generates confirmation');
const c=game.phase.scene.contracts[0]; const before=JSON.stringify(game.career);
const confirmation=game.buildInteractiveScene(game.phase.scene);
assert(confirmation.options[0].label==='Depart Empty','confirm before departure');
assert(!/lowest|wait|departure|coast|approach dock/i.test(JSON.stringify(confirmation.bodyRows)),'no transfer/wait notice or internal dock in empty confirmation');
assert(c.destinationName==='The Still' && c.sourceName===ESTELLA_NODES_BY_ID.get(emptyRunLocationId(c.sourceId))?.name,'empty contracts present physical locations, not dock names');
game.activeManifestCondition={}; game.activeMaintenanceTelemetry=createMaintenanceTelemetry();
game.shownOperationsManualTutorials=new Set(); game.missionDvUsed=0;
game.activateInteractiveSceneOption(game.phase.scene,'launchEmptyRun');
assert(game.activeCareerContract.category==='empty' && game.activeMaintenanceContext.manifestKind==='empty','launch uses real career flight and empty wear context');
assert(JSON.stringify(game.career)===before,'launch commits no travel/cost/wear');
assert(!game.activeManifestCondition.integrity && !game.activeManifestCondition.comfort,'empty run has no cargo/passenger meters');
const startPhase=game.phase, originalTelemetry=JSON.stringify(game.activeMaintenanceTelemetry), originalAttempt=game.activeMaintenanceContext.attempt;
game.activeMaintenanceTelemetry.standardMainDriveDv=500;game.missionDvUsed=42;
game.reloadPhase(startPhase);
assert(JSON.stringify(game.activeMaintenanceTelemetry)===originalTelemetry && game.missionDvUsed===startPhase.missionDvStart, 'empty-run retry restores telemetry/delta-v snapshot');
assert(game.activeMaintenanceContext.attempt===originalAttempt+1 && JSON.stringify(game.career)===before,'retry changes attempt only, no career commitment');
const history=createMissionProfileEntry({mode:'career',quote:c.quote,actualDv:100,startWorldTime:0,completionWorldTime:100,careerContract:c});
assert(history.missionKind==='empty' && history.grossPay===0 && history.cargoMassTons===0,'history identifies empty travel');
assert(missionProfilesToCsv([history]).includes('missionKind') && missionProfilesToCsv([history]).includes('"empty"'),'CSV distinguishes empty runs');

// Successful arrival commits fuel/time/rig once; save failure leaves all state intact.
game.missionDvUsed=100; game.worldTime=12345;
game.pendingMaintenanceSettlement=resolveMaintenanceSettlement(game.activeMaintenanceTelemetry,game.activeMaintenanceContext,game.career.rig,game.worldTime);
const previousProfile=game.career, previousJson=JSON.stringify(previousProfile), settlement=game.pendingMaintenanceSettlement;
game.loadStationTerminal=()=>{game.activeCareerContract=null;game.terminalLoaded=true;};
failSave=true; failed=false;
try{game.finishCareerDelivery();}catch{failed=true;}
assert(failed && game.career===previousProfile && JSON.stringify(game.career)===previousJson && game.pendingMaintenanceSettlement===settlement,'failed arrival save atomic');
game.phase.ds.dvUsed=100;
game.completePhase(game.phase,()=>game.finishRunTransition().run(),c.completionMessage);
const overlay=game.phaseCompletion;
overlay.onContinue();
assert(game.phaseCompletion===overlay && game.career===previousProfile && readMissionProfiles().length===0,'save failure restores arrival screen without history/settlement');
failSave=false;
overlay.onContinue();
assert(game.career.locationId===c.destinationId && game.career.worldTime===12345,'arrival persisted');
assert(game.career.money===previousProfile.money-actualFuelCostForQuote(c.quote,100),'only actual fuel charged');
assert(game.career.rig.completedMaintenanceMissions===previousProfile.rig.completedMaintenanceMissions+1,'empty run commits normal maintenance and expires inspection');
assert(JSON.stringify(game.career.certifications)===JSON.stringify(previousProfile.certifications),'no certification awarded');
assert(readMissionProfiles().slice(-1)[0]?.missionKind==='empty','successful empty arrival logged');
const cash=game.career.money;game.finishCareerDelivery();assert(game.career.money===cash,'no repeat settlement after terminal return');

const locked:any=Object.create(Game.prototype);locked.career=defaultCareerProfile();locked.phase={kind:'interactiveScene',scene:{id:'stationTerminal',selectedIndex:0}};
assert(locked.buildInteractiveScene(locked.phase.scene).options.find((o:any)=>o.label==='Plan Empty Run').disabled,'trainee gate');
locked.activateInteractiveSceneOption(locked.phase.scene,'emptyFolder:root');assert(locked.phase.scene.id==='stationTerminal','action cannot bypass basic license');
locked.career={...profile};
locked.activateInteractiveSceneOption(locked.phase.scene,'emptyDestination:estella-iii-capital-city');
assert(locked.buildInteractiveScene(locked.phase.scene).options[0].disabled,'atmospheric equipment restriction on empty arrival');
locked.activateInteractiveSceneOption(locked.phase.scene,'launchEmptyRun');assert(!locked.activeCareerContract,'action cannot bypass rig restriction');
// Departure advances to the computed window automatically, without another menu/wait phase.
const waitContract=[...emptyRunDestinationIds(learned)].map(id=>createEmptyRun(learned,id)).find(c=>(c.selectedTransfer?.waitTime??0)>learned.worldTime)!;
assert(waitContract,'fixture has a future departure window');
const waiting:any=Object.create(Game.prototype);
Object.assign(waiting,{career:learned,canvas:{width:1280,height:900},shownOperationsManualTutorials:new Set(),showContextualOperationsManual:()=>{}});
waiting.phase={kind:'interactiveScene',scene:{id:'emptyRunConfirm',selectedIndex:0,contractIndex:0,contracts:[waitContract]}};
assert(!/lowest|wait|departure|coast/i.test(JSON.stringify(waiting.buildInteractiveScene(waiting.phase.scene).bodyRows)),'future departure remains invisible in confirmation');
waiting.activateInteractiveSceneOption(waiting.phase.scene,'launchEmptyRun');
assert(waiting.worldTime===waitContract.selectedTransfer!.waitTime && ['docking','cluster'].includes(waiting.phase.kind),`departure window skipped automatically straight into flight: ${waitContract.destinationId}, ${waiting.phase.kind}, ${waiting.worldTime}/${waitContract.selectedTransfer!.waitTime}`);
const departedAt=waiting.worldTime;
waiting.reloadPhase(waiting.phase);
assert(waiting.worldTime===departedAt && waiting.career.worldTime===learned.worldTime,'retry retains departure snapshot without charging waiting twice');
console.log(`Empty runs passed: ${assertions} assertions; ${found.size} physical destinations; ${folders.length} nonempty folders; full catalog, contacts, real launch/settlement.`);
