import './svg-dom';
import { preCampsNames } from './fixtures/pre-camps-names';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID } from '../src/content/estella';
import { ESTELLA_FACTION_CONTRACT_PROVIDERS, generateFactionContractCandidates, type FactionContractCandidate } from '../src/content/estella/faction-contracts';
import { BALOR_TRADE_SITES, BALOR_ORBITAL } from '../src/content/estella/balor-logistics';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { classifyMissionCargo } from '../src/cargo-handling';
import { passengerComfortTerms } from '../src/passenger-comfort';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { estimateEstellaMissionCost, makePayTerms } from '../src/mission-cost';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { ORBITAL_LEVELS, createOrbitalState } from '../src/orbital';
import { DOCKING_LEVELS } from '../src/docking';
import { stationPoiById, stationState, bodyById } from '../src/world';
import { Game } from '../src/game';
import { defaultCareerProfile } from '../src/career-state';
import { createMaintenanceTelemetry } from '../src/maintenance/telemetry';

let assertions = 0;
function assert(ok: unknown, message: string): asserts ok { assertions++; if (!ok) throw new Error(message); }
function close(a: number, b: number, message: string, tolerance = 1e-6) { assert(Math.abs(a-b) <= tolerance, `${message}: ${a} / ${b}`); }
const isNew = (c: { templateId?: string }) => !!c.templateId?.startsWith('balor-trade:') || !!c.templateId?.startsWith('balor-skim-');
const local = new Set<string>(BALOR_TRADE_SITES);
const nav = new Set(estellaSelectableNavTargets().map(n => n.id));
const pois = ESTELLA_NODES.filter(n => n.kind === 'poi');
// Captured before expansion, from unmodified 0c3ca39 over days0,1,20,21,119.
// Protect existing seeded company identities, contracts, prices and narrative.
// Approved Gaia/Celeste/Dahai naming changes are presentation-only exceptions;
// keep the original pre-expansion hashes, not a freshly blessed baseline.
const legacyPlaceNames: Array<[string,string]> = [
  ['Richelieu Orbital Terminal','Main Customs and Arrival Hub'],
  ['Orselle Financial District','Secondary Finance City'], ['Orselle First Dome Quarter','Historic First Dome Site'],
  ['Orselle','Capital City Spaceport'], ['Rochefort','High-Tech Industrial City'], ['Mirabel','Coastal Resort'],
  ['Valenne','Agricultural Region'], ['Cousteau Station','Polar Science and Weather Research'],
  ['Celeste Main Port','Estella IIIa Main Port'], ['Celeste','Estella IIIa'],
  ['Ampere','Helium-3 and Regolith Mine'], ['Descartes Lab','Lunar Science Settlement'],
  ['Beaumont','First Off-World Colony Heritage Site'], ['Fuyuan','Primary Island Port'],
  ['Zhulong','Archipelago Weather Station'], ['Bingjie','Pelagic Research Atoll'], ['Jiuyuan','Floating Mariculture Platform'],
].sort((a,b)=>b[0].length-a[0].length) as Array<[string,string]>;
function legacyCandidateJson(candidate: FactionContractCandidate): string {
  return legacyPlaceNames.reduce((json,[current,old])=>json.split(current).join(old),preCampsNames(JSON.stringify(candidate)));
}
const legacy: Record<string, [number, number]> = {
  'kisaragi-yards-estella': [190,1018006390], 'teamsters-guild': [95,1590288798],
  'steel-combine': [170,3022841915], 'halloran-smelting-house': [50,879589401],
  'cinderhook-refining-houses': [325,4133405170], 'hartwell-shipping-companies': [3090,192262373],
  'merren-conservatory': [340,2674462853], 'daedalus-systems': [445,1210869324],
};
const providers = ESTELLA_FACTION_CONTRACT_PROVIDERS.filter(p => legacy[p.id]);
assert(providers.length === 8 && ESTELLA_FACTION_CONTRACT_PROVIDERS.length === 32 && new Set(ESTELLA_FACTION_CONTRACT_PROVIDERS.map(p=>p.id)).size === 32, 'eight existing actors retained; three Gaia provider registrations added without duplicates');
for (const p of providers) {
  // Merren's approved Dahai culture/specialist sites changed roles. Its complete
  // non-Dahai baseline is frozen independently in dahai-shipping.test.ts.
  if (p.id === 'merren-conservatory') continue;
  let hash = 2166136261, count = 0;
  for (const day of [0,1,20,21,119]) for (const node of pois) for (const c of p.generateContracts({sourceId: node.id, worldTime: day * 86400}).filter(c => !isNew(c) && !c.templateId.startsWith('dahai:') && !c.templateId.startsWith('camps:'))) {
    count++;
    for (const char of legacyCandidateJson(c)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash,16777619); }
  }
  assert(count === legacy[p.id][0] && (hash >>> 0) === legacy[p.id][1], `${p.id}: every old candidate unchanged`);
}

const routes = new Map<string, Map<number,FactionContractCandidate>>();
const pairs = new Map<string, FactionContractCandidate>();
const sources = new Set<string>(BALOR_TRADE_SITES);
const hubCounts = new Map<string,{hub:number; direct:number; hubWeight:number; directWeight:number}>();
for (let day = 0; day < 120; day++) for (const node of pois) for (const p of providers) {
  for (const c of p.generateContracts({sourceId:node.id, worldTime:day * 86400}).filter(isNew)) {
    assert(c.sourceId === node.id && nav.has(c.sourceId) && nav.has(c.destinationId), `selectable scoped endpoints: ${c.templateId}`);
    assert(local.has(c.sourceId) !== local.has(c.destinationId), 'one Balor endpoint, no local/duplicate shuttle');
    assert(Number.isFinite(c.likelihood) && c.likelihood > 0 && c.cargo.massTons > 0, 'positive finite weight/mass');
    assert(c.maxCompAllowance === 2 && !c.flatReward && !c.boardPriority, 'ordinary economics, no forced priority or bounty');
    assert(!c.completionMessage, 'new narrative not smuggled into implementation');
    classifyMissionCargo(c.cargo);
    const placement = ESTELLA_NODES_BY_ID.get(local.has(c.sourceId) ? c.destinationId : c.sourceId)?.placement;
    assert(!(placement?.kind === 'surface' && ['estella-vi','estella-vib'].includes(placement.parentId)), 'Combine/Kalyna trade membrane respected');
    assert(!/\b(?:Icarus|AGI|alignment|Pandemonium|bonded crew|debt crew)\b/i.test(JSON.stringify(c)), 'no reserved story or coerced-labor scope');
    assert(![c.sourceId,c.destinationId].includes('estella-xif-observatory') && ![c.sourceId,c.destinationId].includes('estella-xif-sealed-research-outpost'), 'Campus only for Balor Daedalus trade');
    const hub = c.sourceId === BALOR_ORBITAL || c.destinationId === BALOR_ORBITAL;
    if (c.factionId === 'teamsters-guild') {
      assert(hub && c.generosity === 1.7 && c.compensationRatio === 0, 'skim-specific route stays orbital with skim pay');
      if (c.category === 'passenger') assert(passengerComfortTerms(c.cargo.label).expectation === 'elevated', 'professional skim crew comfort');
      if (c.cargo.label.includes('precursor')) assert(c.requiredCertification === 'volatile-cargo', 'precursor custody remains certified');
    } else {
      assert(c.category === 'freight', 'no accidental change to existing passenger networks');
      assert(c.details?.includes('local transport arranged') === hub, 'consolidation is background, no second player leg');
      const group = `${p.id}:${local.has(c.sourceId) ? 'out' : 'in'}`;
      const counts = hubCounts.get(group) ?? {hub:0,direct:0,hubWeight:0,directWeight:0};
      if (hub) { counts.hub++; counts.hubWeight += c.likelihood; } else { counts.direct++; counts.directWeight += c.likelihood; }
      hubCounts.set(group,counts);
    }
    if (p.id === 'halloran-smelting-house') assert(c.destinationId === 'industrial-refinery-ore-intake' && c.cargo.label === 'furnace consumables', 'Halloran buys consumables, never ships metals');
    if (p.id === 'steel-combine') assert(c.issuerName === 'Steel Combine Foreign Trade Committee' && c.compensationRatio === 1 && c.generosity === (local.has(c.destinationId) ? 0.15 : 0), 'Combine imports reimbursed, exports add plan bonus');
    if (c.templateId.includes('isolated-hot-zone-trial')) assert(c.details?.includes('independent cutoff') && c.details.includes('production controls remain separate'), 'isolated trial, not production control experiment');
    if (p.id === 'merren-conservatory') assert(c.details?.includes('Shade'), 'food/clinic/garden orders tied to Shade, including via hub');
    const key = `${p.id}:${c.templateId}`;
    const days = routes.get(key) ?? new Map<number,FactionContractCandidate>();
    assert(!days.has(day), 'one consignment per day, no parallel direct/hub offer');
    days.set(day,c); routes.set(key,days);
    pairs.set(`${c.sourceId}->${c.destinationId}`,c);
    sources.add(c.sourceId);
  }
}
for (const [key,days] of routes) {
  assert(days.size === 120, `complete daily dispatch: ${key}`);
  assert(new Set([...days.values()].map(c=>c.cargo.massTons)).size === 1, 'stable mass independent of gateway/day');
  if (key.startsWith('teamsters-guild:')) continue;
  for (let day=0;day<120;day+=2) {
    const a=days.get(day)!, b=days.get(day+1)!;
    const via=(c:FactionContractCandidate)=>c.sourceId===BALOR_ORBITAL || c.destinationId===BALOR_ORBITAL;
    assert(via(a)!==via(b) && a.likelihood===b.likelihood, 'paired exact 50/50 dispatch, same weight');
  }
}
for (const [group,c] of hubCounts) assert(c.hub===c.direct && Math.abs(c.hubWeight-c.directWeight)<1e-8, `balanced count and weight: ${group}`);
for (const sourceId of sources) {
  const a=generateFactionContractCandidates({sourceId,worldTime:7*86400+1}).filter(isNew);
  assert(JSON.stringify(a)===JSON.stringify(generateFactionContractCandidates({sourceId,worldTime:7*86400+80000}).filter(isNew)), 'same-day deterministic output');
  for (const c of a) {
    assert(!!c.completionMessage?.includes('thanks you for successfully completing'), 'shared neutral receipt');
    if (c.cargo.fragile) assert(c.requiredCertification==='fragile-cargo', 'fragile license propagated');
    if (c.category==='passenger') assert(c.cargo.passengerComfort?.expectation==='elevated', 'passenger comfort attached');
  }
}

// Every new endpoint pair constructs a mission, not just a raw catalog entry.
for (const c of pairs.values()) {
  const quote=estimateEstellaMissionCost(c.sourceId,c.destinationId,c.cargo,undefined,makePayTerms(c));
  assert(Number.isFinite(quote.parDv) && quote.parDv>0 && Number.isFinite(quote.grossPay) && quote.grossPay>0, 'finite real route economics');
  assert(createPlayableEstellaMission(c.sourceId,c.destinationId,undefined,891).start, `playable route: ${c.sourceId}->${c.destinationId}`);
}
let boardRows=0;
const boardProviders=new Set<string>(), passengerHubs=new Set<string>();
// More competing Dahai orders change the capped board lottery, not eligibility.
// Exercise a full120-day window rather than assuming every rare actor appears
// within the previous twelve sampled epochs.
for (let day = 0; day < 120; day++) for (const sourceId of sources) {
  for (const c of [...generateCareerContracts(sourceId,day*86400),...generatePassengerContracts(sourceId,day*86400)].filter(isNew)) {
    boardRows++; boardProviders.add(c.factionId!);
    assert(Number.isFinite(c.quote.grossPay) && c.quote.grossPay>0 && c.details && c.completionMessage, 'real payable board preserves details/receipt');
    assert(JSON.parse(JSON.stringify(c)).templateId===c.templateId, 'accepted posting serializes unchanged');
    if (c.category==='passenger') {
      assert(c.requiredCertification==='passenger' && c.cargo.passengerComfort?.expectation==='elevated', 'passenger board credential/comfort');
      passengerHubs.add(c.sourceId===BALOR_ORBITAL ? c.destinationId : c.sourceId);
    }
  }
}
assert(boardProviders.size===8 && passengerHubs.size===2, `all eight actors and both skim-crew hubs reach actual boards: ${[...boardProviders]} / ${[...passengerHubs]}`);

// Exact source/destination/cargo clones of BAM's own orders are not additions.
const bam=ESTELLA_FACTION_CONTRACT_PROVIDERS.find(p=>p.id==='balor-advanced-materials')!;
for (const day of [0,1]) for (const sourceId of sources) {
  const bamOrders=new Set(bam.generateContracts({sourceId,worldTime:day*86400}).map(c=>`${c.destinationId}:${c.cargo.label}`));
  for (const p of providers) for (const c of p.generateContracts({sourceId,worldTime:day*86400}).filter(isNew)) {
    assert(!bamOrders.has(`${c.destinationId}:${c.cargo.label}`),'new orders complement rather than clone BAM consignments');
  }
}

// Placement also unlocks old Guild precursor-to-Still and Bruckner routes.
// Exercise those existing endpoints, including the star-to-cluster handoff.
const hubs=new Set(['skim-hub-alpha-precursor-dock','skim-hub-beta-precursor-dock']);
const unlockedPairs=new Map<string,FactionContractCandidate>();
for (const day of [0,1,10,11]) for (const node of pois) for (const c of generateFactionContractCandidates({sourceId:node.id,worldTime:day*86400})) {
  if (!isNew(c) && (hubs.has(c.sourceId) || hubs.has(c.destinationId))) unlockedPairs.set(`${c.sourceId}->${c.destinationId}`,c);
}
for (const c of unlockedPairs.values()) {
  assert(nav.has(c.sourceId) && nav.has(c.destinationId),'legacy near-star endpoints now selectable');
  assert(createPlayableEstellaMission(c.sourceId,c.destinationId,undefined,894).start,'previously unselectable legacy route builds');
  const q=estimateEstellaMissionCost(c.sourceId,c.destinationId,c.cargo,undefined,makePayTerms(c));
  assert(Number.isFinite(q.parDv) && q.parDv>0,'legacy near-star par is finite');
}
for (const hub of hubs) assert(unlockedPairs.has(`${hub}->still-skim-runner-berth-poi`),'original direct Guild precursor route retained and playable');

// Actual stellar-station frame and docking handoffs at different epochs.
const game:any=Object.create(Game.prototype);
game.career=defaultCareerProfile(); game.canvas={width:1280,height:900}; game.missionDvUsed=0;
game.activeManifestCondition={}; game.activeMaintenanceTelemetry=createMaintenanceTelemetry();
game.showGuidance=()=>{}; game.showContextualOperationsManual=()=>{};
for (const id of ['skim-hub-alpha','skim-hub-beta']) {
  const station=stationPoiById(id), poi=`${id}-precursor-dock`;
  assert(nav.has(poi) && station.bodyId==='estella' && station.orbit.orbitSense===-1 && !!station.layoutId, 'authored stellar orbit and docking art');
  assert(station.orbit.radius>bodyById('estella').radius && station.orbit.radius<bodyById('estella-i').orbit!.radius, 'safe star exterior, interior to Balor');
  const mission=createPlayableEstellaMission(poi,BALOR_ORBITAL,undefined,892);
  assert(mission.start.kind==='docking', 'skim departure starts at a dock');
  const departure=ORBITAL_LEVELS.find(l=>l.id===(mission.start as any).level.orbitalLevelId)!;
  assert(departure.bodyId==='estella' && departure.dynamicStartOrbit?.radius===station.orbit.radius, 'stellar departure starts at station orbit');
  for (const time of [0,86400,9876543]) {
    game.loadOrbital(departure,undefined,time);
    close(Math.hypot(game.phase.os.x,game.phase.os.y),station.orbit.radius,'departure radius tracks ephemeris');
    close(Math.hypot(game.phase.os.vx,game.phase.os.vy),Math.sqrt(bodyById('estella').gm/station.orbit.radius),'departure circular speed');
    const before=JSON.stringify(game.phase.os);
    game.loadOrbital(game.phase.level,game.phase.initOverride,time);
    assert(JSON.stringify(game.phase.os)===before,'deterministic retry at station orbit');
  }
  const previous=new Set(ORBITAL_LEVELS.map(l=>l.id));
  createPlayableEstellaMission(BALOR_ORBITAL,poi,undefined,893);
  const arrival=ORBITAL_LEVELS.find(l=>!previous.has(l.id) && l.station?.id===id)!;
  assert(arrival?.bodyId==='estella' && DOCKING_LEVELS.some(l=>l.id===arrival.dockingLevelId),'stellar rendezvous reaches authored dock');
  for (const time of [0,1234567]) {
    const st=stationState(id,time);
    const os=createOrbitalState(arrival,{...st,x:st.x+100,time});
    let received:any;
    game.loadDocking=(level:unknown,init:unknown,epoch:number)=>{received={level,init,epoch};};
    game.transitionOrbitalToDocking({level:arrival,os}).run();
    assert(received && received.epoch===time,'real stellar rendezvous enters docking');
    close(received.init.vx,0,'station-relative dock VX'); close(received.init.vy,0,'station-relative dock VY');
  }
}
assert(!nav.has('coronal-observation-post-ops'),'Coronal endgame reserve not silently activated');
console.log(`Balor expansion passed: ${assertions} assertions; ${routes.size} logical consignments; ${pairs.size} playable pairs; ${boardRows} real-board rows, ${boardProviders.size} actors; ${unlockedPairs.size} legacy near-star pairs unlocked.`);
console.log(JSON.stringify(Object.fromEntries(hubCounts),null,2));
