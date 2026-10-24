import './svg-dom';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID } from '../src/content/estella';
import { estellaSelectableNavTargets, estellaDisplayPath } from '../src/content/estella/navigation';
import { canonicalEstellaLocationId } from '../src/content/estella/location-aliases';
import { generateFactionContractCandidates } from '../src/content/estella/faction-contracts';
import { generateCareerContracts, generatePassengerContracts, generateDirectoryEntryContracts, type CareerContract } from '../src/career-contracts';
import { contractLocationId, contractLocationPresentation, presentCareerContract } from '../src/contract-presentation';
import { defaultCareerProfile, TEAMSTER_CERTIFICATION_IDS } from '../src/career-state';
import { LOCAL_DIRECTORY_ENTRIES } from '../src/local-directory';
import { emptyRunLocationId, createEmptyRun } from '../src/empty-runs';
import { createDefaultRigState } from '../src/maintenance/rig-state';
import { Game } from '../src/game';

let assertions=0;
function assert(ok:unknown,message:string):asserts ok {assertions++;if(!ok)throw Error(message);}
const base=generateCareerContracts('caravanserai-main-commercial-dock',0)[0];
assert(base,'real priced contract fixture');
const terminals=new Set(['station','atmospheric-station','asteroid','comet-fragment']);
function expectedLocation(id:string):string {
  const canonical=canonicalEstellaLocationId(id);
  const node=ESTELLA_NODES_BY_ID.get(canonical);
  const parent=node?.placement?.kind==='aboard'?ESTELLA_NODES_BY_ID.get(node.placement.parentId):undefined;
  return parent&&terminals.has(parent.kind)?parent.id:canonical;
}
function check(contract:CareerContract):void {
  const src=ESTELLA_NODES_BY_ID.get(expectedLocation(contract.sourceId));
  const dst=ESTELLA_NODES_BY_ID.get(expectedLocation(contract.destinationId));
  assert(contract.sourceName===src?.name&&contract.destinationName===dst?.name,`physical source/destination names: ${contract.sourceId}->${contract.destinationId}`);
  assert(contract.sourcePath===estellaDisplayPath(src!.id)&&contract.destinationPath===estellaDisplayPath(dst!.id),'paths stop at the physical terminal, not its receiving dock');
  assert(contract.quote.sourceId===contract.sourceId&&contract.quote.destinationId===contract.destinationId,'quote retains operational berth IDs');
  assert(contractLocationId(contract.sourceId)===emptyRunLocationId(contract.sourceId)&&contractLocationId(contract.destinationId)===emptyRunLocationId(contract.destinationId),'same physical naming rule as empty runs');
  if(contract.category==='freight'||contract.category==='passenger'||contract.category==='empty') {
    const prefix=contract.category==='empty'?'Empty run to ':`${contract.category==='passenger'?'Transport':'Deliver'} ${contract.cargo.label} to `;
    if(contract.title.startsWith(prefix))assert(contract.title===`${prefix}${dst?.name}`,'ordinary title uses complete physical destination name');
  }
}

// Every catalog endpoint, including uncommon/unplayable internal docks, is
// covered independently of which candidates win the weighted public boards.
let terminalEndpoints=0;
for(const node of ESTELLA_NODES.filter(n=>n.kind==='poi')) {
  const source='estella-iii-capital-city',destination=node.id;
  const original:CareerContract={...base,sourceId:source,sourceName:'Orselle',sourcePath:estellaDisplayPath(source),destinationId:destination,destinationName:node.name,destinationPath:estellaDisplayPath(destination),category:'freight',title:`Deliver ${base.cargo.label} to ${node.name}`,completionMessage:`Received at ${node.name}.`,quote:{...base.quote,sourceId:source,destinationId:destination}};
  const snapshot=JSON.stringify(original);
  const displayed=presentCareerContract(original);
  check(displayed);
  assert(JSON.stringify(original)===snapshot&&displayed.quote===original.quote&&displayed.cargo===original.cargo,'presentation does not mutate old posting, quote, manifest or save data');
  assert(displayed.sourceId===original.sourceId&&displayed.destinationId===original.destinationId&&displayed.id===original.id,'routing/contract IDs unchanged');
  assert(JSON.stringify(presentCareerContract(displayed))===JSON.stringify(displayed),'presentation is idempotent');
  if(node.id!==expectedLocation(node.id)) {
    terminalEndpoints++;
    assert(displayed.completionMessage===`Received at ${displayed.destinationName}.`,'receipt uses terminal name too');
  }
}
assert(terminalEndpoints>50,'covers whole station/asteroid catalog, not two special cases');

const seenProviders=new Set<string>();let rawRows=0,boardRows=0;
for(const day of [0,1,20,21])for(const source of estellaSelectableNavTargets()) {
  const time=day*86400;
  // All issuer candidates, including those hidden by capped weighted sampling.
  for(const c of generateFactionContractCandidates({sourceId:source.id,worldTime:time})) {
    if(!ESTELLA_NODES_BY_ID.has(c.destinationId))continue;
    rawRows++;seenProviders.add(c.factionId);
    const fixture:CareerContract={...base,...c,sourceName:ESTELLA_NODES_BY_ID.get(c.sourceId)!.name,sourcePath:estellaDisplayPath(c.sourceId),destinationName:ESTELLA_NODES_BY_ID.get(c.destinationId)!.name,destinationPath:estellaDisplayPath(c.destinationId),title:c.title??`${c.category==='passenger'?'Transport':'Deliver'} ${c.cargo.label} to ${ESTELLA_NODES_BY_ID.get(c.destinationId)!.name}`,category:c.category??'freight',completionMessage:c.completionMessage!,quote:{...base.quote,sourceId:c.sourceId,destinationId:c.destinationId}};
    check(presentCareerContract(fixture));
  }
  for(const contract of [...generateCareerContracts(source.id,time),...generatePassengerContracts(source.id,time)]){boardRows++;check(contract);}
}
assert(seenProviders.size===34,'all existing and new provider families audited');

// Contact/certification routes use the same constructor, including the authored
// first practical title and Old Nell passages; none bypass physical naming.
let contactRows=0;let practical:CareerContract|undefined;
for(const entry of LOCAL_DIRECTORY_ENTRIES.filter(e=>e.factionId&&e.missionTags?.length))for(const source of new Set([...entry.locationIds,'caravanserai-main-commercial-dock'])) {
  for(const qualifications of [[],['basic-1'],['basic-1','basic-2'],['basic-1','basic-2','basic-3'],[...TEAMSTER_CERTIFICATION_IDS]] as typeof TEAMSTER_CERTIFICATION_IDS[number][][]) {
    for(const contract of generateDirectoryEntryContracts(entry.id,source,0,qualifications)) {
      contactRows++;check(contract);
      if(contract.certificationOnSuccess==='basic-1')practical=contract;
    }
  }
}
assert(contactRows>0&&practical?.destinationId==='still-public-approach-dock','first practical retains exact dock target');
assert(practical.title==='Land at The Still','authored tutorial title consolidated without doubled location wording');
assert(!practical.completionMessage.includes('Public Approach Dock'),'first-practical receipt also uses physical destination');

// Cached legacy titles include abbreviated labels as well as the exact old name.
const old:CareerContract={...base,sourceId:'caravanserai-outfitter-drydock',sourceName:'Outfitter / Drydock',sourcePath:estellaDisplayPath('caravanserai-outfitter-drydock'),destinationId:'still-public-approach-dock',destinationName:'Public Approach Dock',destinationPath:estellaDisplayPath('still-public-approach-dock'),title:`Deliver ${base.cargo.label} to Public approach dock`,category:'freight',details:'From the Outfitter / Drydock aboard The Caravanserai to the Public Approach Dock at The Still.',completionMessage:'The Public Approach Dock logs the delivery.',quote:{...base.quote,sourceId:'caravanserai-outfitter-drydock',destinationId:'still-public-approach-dock'}};
const oldJson=JSON.stringify(old);const oldView=presentCareerContract(old);
assert(oldView.title===`Deliver ${old.cargo.label} to The Still`&&oldView.sourceName==='The Caravanserai','legacy regular title and source consolidated');
assert(oldView.details==='From The Caravanserai to The Still.'&&oldView.completionMessage==='The Still logs the delivery.','no duplicated articles or parent-name suffixes');
assert(presentCareerContract({...old,title:'Land at the Public Approach Dock at The Still'}).title==='Land at The Still','legacy authored title normalized');
const namedCargo={...old,cargo:{...old.cargo,label:'Public Approach Dock equipment'},title:'Deliver Public Approach Dock equipment to Public Approach Dock'};
assert(presentCareerContract(namedCargo).title==='Deliver Public Approach Dock equipment to The Still','cargo text is not accidentally replaced in ordinary title');
const prose={...old,details:'A Public Approach Dockyard catalogue is enclosed.'};
assert(presentCareerContract(prose).details===prose.details,'endpoint replacements respect word boundaries');
const unknown={...old,destinationId:'unknown-historical-location',destinationName:'Old destination',destinationPath:'Old path',title:'Deliver special history'};
assert(presentCareerContract(unknown).destinationName===unknown.destinationName&&presentCareerContract(unknown).destinationPath===unknown.destinationPath,'unknown historical location has safe display fallback');
for(const id of ['estella-iii-capital-city','estella-iii-high-tech-city','estella-iiia-heritage-site'])assert(contractLocationId(id)===id,'distinct planetary/lunar surface settlements remain distinct');

// Actual scene and HUD readers normalize old cached/accepted contracts as views,
// without touching objects that acceptance, flight, settlement and history own.
let writes=0;
(globalThis as any).localStorage={getItem:()=>null,setItem:()=>{writes++;},removeItem:()=>{writes++;}};
const game:any=Object.create(Game.prototype);game.canvas={width:1280,height:900};game.career={...defaultCareerProfile(),locationId:'caravanserai-main-commercial-dock',money:1e9,certifications:[...TEAMSTER_CERTIFICATION_IDS],rig:createDefaultRigState(true)};
const state={id:'browseContracts',selectedIndex:0,contracts:[old]};
const board=game.buildInteractiveScene(state);
assert(board.options[0].label===oldView.title&&board.options[0].detail.includes('FROM The Caravanserai'),'legacy board title/source display');
const posting=game.buildInteractiveScene({...state,id:'contractPosting',contractIndex:0});
assert(posting.bodyRows.some((r:any)=>r.kind==='kv'&&r.label==='Destination'&&r.value==='The Still'),'legacy posting destination');
assert(posting.bodyRows.some((r:any)=>r.kind==='kv'&&r.label==='Location'&&r.value===estellaDisplayPath('the-still')),'legacy posting path');
assert(posting.bodyRows.some((r:any)=>r.kind==='kv'&&r.label==='Details'&&r.value===oldView.details),'legacy posting details');
game.activeCareerContract=old;
assert(game.currentMissionDestinationName()==='The Still'&&game.currentMissionDestinationLocation()===estellaDisplayPath('the-still'),'all flight HUD modes receive physical terminal name/path');
assert(game.currentMissionCompletionText()==='The Still logs the delivery.','accepted mission completion view');
assert(state.contracts[0]===old&&game.activeCareerContract===old&&JSON.stringify(old)===oldJson&&writes===0,'rendering never rewrites active/cached contracts or storage');
let launchIds:string[]=[];
game.launchPlayableEstellaMission=(source:string,destination:string)=>{launchIds=[source,destination];};
game.phase={kind:'interactiveScene',scene:{...state,id:'contractPosting',contractIndex:0}};
game.activateInteractiveSceneOption(game.phase.scene,'acceptContract');
assert(launchIds[0]===old.sourceId&&launchIds[1]===old.destinationId&&game.activeMissionQuote===old.quote&&game.activeCareerContract===old,'actual acceptance launches original detailed berth IDs and retains quoted economics');
game.missionDvUsed=0;game.worldTime=100;game.activeManifestCondition={};game.loadStationTerminal=()=>{};
game.finishCareerDelivery();
assert(game.career.locationId==='still-public-approach-dock'&&JSON.stringify(old)===oldJson,'settlement retains the operational receiving POI, not the display parent');
const profile={...game.career,locationId:'caravanserai-main-commercial-dock',knownContactIds:['gideon-gid-bell']};
const empty=createEmptyRun(profile,'still-public-approach-dock');check(empty);
assert(empty.title==='Empty run to The Still'&&empty.destinationId==='still-public-approach-dock','empty naming and authorization unchanged');
console.log(`Contract presentation passed: ${assertions} assertions; ${terminalEndpoints} internal endpoints; ${rawRows} raw candidates / ${seenProviders.size} providers; ${boardRows} public and ${contactRows} contact postings. No operational IDs/quotes/saves changed.`);
