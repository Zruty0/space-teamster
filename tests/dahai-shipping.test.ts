import './svg-dom';
import baseline from './fixtures/dahai-unrelated-baseline.json';
import { preCampsNames } from './fixtures/pre-camps-names';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID, ESTELLA_INSTITUTIONS } from '../src/content/estella';
import { ESTELLA_FACTION_CONTRACT_PROVIDERS, generateFactionContractCandidates, generateFactionContactContractCandidates, type FactionContractCandidate } from '../src/content/estella/faction-contracts';
import { DAHAI_CIVILIAN_ID, PLANETOLOGY_ID } from '../src/content/estella/faction-contracts/dahai-contracts';
import { DAHAI_ORBITAL, DAHAI_SURFACE_SITES, DAHAI_SITE_NAMES, FUYUAN, JIUYUAN, BINGJIE, ZHULONG } from '../src/content/estella/dahai-sites';
import { generateDahaiRoutedContracts, dahaiDispatchUsesTerminal, isDahaiSurface } from '../src/content/estella/dahai-logistics';
import { RICHELIEU, isGaiaSurface } from '../src/content/estella/gaia-logistics';
import { BALOR_TRADE_SITES, BALOR_ORBITAL } from '../src/content/estella/balor-logistics';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { estellaLocationIntroduction } from '../src/content/estella/location-copy';
import { passengerComfortTerms } from '../src/passenger-comfort';
import { estimateEstellaMissionCost, makePayTerms } from '../src/mission-cost';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { defaultCareerProfile, loadCareerProfile } from '../src/career-state';
import { contractLocationId } from '../src/contract-presentation';
import { Game } from '../src/game';

let assertions = 0;
function assert(ok: unknown, message: string): asserts ok { assertions++; if (!ok) throw Error(message); }
const pois = ESTELLA_NODES.filter(n => n.kind === 'poi');
const nav = new Set(estellaSelectableNavTargets().map(n => n.id));
const isNew = (c: FactionContractCandidate) => c.templateId.startsWith('dahai:');
const isDahai = (id: string) => id === DAHAI_ORBITAL || isDahaiSurface(id);
const isGaia = (id: string) => id === RICHELIEU || isGaiaSurface(id);
assert(ESTELLA_FACTION_CONTRACT_PROVIDERS.length === 34, 'Dahai providers retained with later Camps/Sahra/Weymark additions');
assert(new Set(ESTELLA_FACTION_CONTRACT_PROVIDERS.map(p => p.id)).size === 34, 'unique registrations');
assert(ESTELLA_INSTITUTIONS.some(i => i.id === PLANETOLOGY_ID && i.summary.includes('Fuyuan')), 'Institute institution and HQ');
assert(!ESTELLA_INSTITUTIONS.some(i => /Deepworks/.test(i.name)), 'rejected industrial entity absent');
for (const site of DAHAI_SURFACE_SITES) {
  assert(ESTELLA_NODES_BY_ID.get(site)?.name === DAHAI_SITE_NAMES[site], 'names on stable routing IDs');
  assert(nav.has(site) && !!estellaLocationIntroduction(site), 'playable city and actual terminal role');
}
assert(estellaLocationIntroduction(FUYUAN)?.includes('Institute of Planetology'), 'Fuyuan terminal shows Institute');
assert(estellaLocationIntroduction(JIUYUAN)?.includes('limited offworld freight'), 'Jiuyuan local economy');
assert(estellaLocationIntroduction(DAHAI_ORBITAL)?.includes('half'), 'hub role in actual terminal');

// Frozen BEFORE implementation at 1aa0309. All 28 providers retain every
// unrelated candidate, including seeded identities, rates, mass and receipts.
for (const p of ESTELLA_FACTION_CONTRACT_PROVIDERS) {
  // Authorized finished-fuel removal: sahra-economy.test.ts freezes the whole
  // surviving Guild roster independently; other historic hashes stay intact.
  if (!(p.id in baseline) || p.id === 'teamsters-guild') continue;
  const rows: FactionContractCandidate[] = [];
  for (const day of [0, 1, 7, 20]) for (const n of pois) for (const c of p.generateContracts({ sourceId: n.id, worldTime: day * 86400 })) {
    if (!c.sourceId.startsWith('estella-iv-') && !c.destinationId.startsWith('estella-iv-') && !isNew(c) && !c.templateId.startsWith('camps:') && !c.templateId.startsWith('sahra:') && !c.templateId.startsWith('farwatch:')) rows.push(c);
  }
  let h = 2166136261;
  for (const ch of preCampsNames(JSON.stringify(rows))) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const expected = (baseline as Record<string, number[]>)[p.id];
  assert(rows.length === expected[0] && (h >>> 0) === expected[1], `${p.id}: all unrelated original candidates unchanged`);
}

const orders = new Map<string, Map<number, FactionContractCandidate>>();
const pairs = new Map<string, FactionContractCandidate>();
const actorCounts = new Map<string, number>();
const cityCounts = new Map<string, { in: number; out: number }>();
const traffic = new Map<string, { total: number; hub: number; weight: number; hubWeight: number; civilianWeight: number }>();
const sourceSet = new Set<string>([DAHAI_ORBITAL, ...DAHAI_SURFACE_SITES]);
const reserved = new Set(['estella-xif-observatory', 'estella-xif-sealed-research-outpost', 'ark-quarantine-station-poi']);
for (let day = 0; day < 20; day++) for (const n of pois) {
  for (const c of generateFactionContractCandidates({ sourceId: n.id, worldTime: day * 86400 })) {
    if (isDahai(c.sourceId) !== isDahai(c.destinationId) && nav.has(c.sourceId) && nav.has(c.destinationId)) {
      const k = `${isDahai(c.sourceId) ? 'out' : 'in'}:${c.category ?? 'freight'}`;
      const r = traffic.get(k) ?? { total: 0, hub: 0, weight: 0, hubWeight: 0, civilianWeight: 0 };
      r.total++; r.weight += c.likelihood;
      if (c.sourceId === DAHAI_ORBITAL || c.destinationId === DAHAI_ORBITAL) { r.hub++; r.hubWeight += c.likelihood; }
      if ([DAHAI_CIVILIAN_ID, 'gaia-civilian-bookings', 'camps-civilian-bookings', 'sahra-civilian-bookings'].includes(c.factionId)) r.civilianWeight += c.likelihood;
      traffic.set(k, r);
    }
    if (!isNew(c)) continue;
    assert(c.sourceId === n.id && nav.has(c.sourceId) && nav.has(c.destinationId), `scoped selectable endpoints ${c.templateId}: ${c.sourceId} -> ${c.destinationId}`);
    assert(isDahai(c.sourceId) !== isDahai(c.destinationId), 'one Dahai end; no same-body surface shuttles');
    const external = isDahai(c.sourceId) ? c.destinationId : c.sourceId;
    const placement = ESTELLA_NODES_BY_ID.get(external)?.placement;
    assert(!(placement?.kind === 'surface' && ['estella-vi', 'estella-vib'].includes(placement.parentId)) && !reserved.has(external), 'trade membranes/private sites protected');
    assert(c.cargo.massTons > 0 && Number.isFinite(c.cargo.massTons) && c.likelihood > 0, 'finite positive mass/weight');
    assert(!c.flatReward && !c.boardPriority && c.maxCompAllowance === 2, 'no bounties or forced board quotas');
    assert(c.details?.includes('Dahai site:') && !!c.completionMessage, 'city context and receipt');
    const hub = c.sourceId === DAHAI_ORBITAL || c.destinationId === DAHAI_ORBITAL;
    assert(c.details!.includes('Dahai Main Orbital Station consolidation') === hub, 'correct hub handling, no invisible second player leg');
    assert(c.details!.includes('Direct Dahai surface handling.') === !hub, 'direct handling accurate');
    if (c.cargo.fragile) assert(c.requiredCertification === 'fragile-cargo', 'fragile requirement classified');
    if (c.category === 'passenger') assert(c.cargo.passengerComfort?.expectation === passengerComfortTerms(c.cargo.label).expectation, 'explicit passenger comfort');
    if (c.factionId === DAHAI_CIVILIAN_ID) assert(!c.factionTag && c.issuerName !== c.factionName, 'descriptive civilian issuers, not new megacorporation');
    if (c.factionId === PLANETOLOGY_ID) assert(c.factionTag === 'EIP', 'Institute identity');
    assert(c.cargo.label !== 'stable fuel canisters', 'Dahai finished-fuel container work retired');
    const key = `${c.factionId}:${c.templateId}`;
    const days = orders.get(key) ?? new Map<number, FactionContractCandidate>();
    assert(!days.has(day), `one logical dispatch/day, no duplicates: ${key}`);
    days.set(day, c); orders.set(key, days);
    pairs.set(`${c.sourceId}->${c.destinationId}`, c); sourceSet.add(c.sourceId);
    if (day === 0) {
      actorCounts.set(c.factionId, (actorCounts.get(c.factionId) ?? 0) + 1);
      const site = DAHAI_SURFACE_SITES.find(id => c.templateId.includes(`:${id}:`))!;
      const r = cityCounts.get(site) ?? { in: 0, out: 0 };
      if (c.category !== 'passenger') r[isDahai(c.sourceId) ? 'out' : 'in']++;
      cityCounts.set(site, r);
    }
  }
}
assert(orders.size === 338 && actorCounts.get(DAHAI_CIVILIAN_ID) === 214 && actorCounts.get(PLANETOLOGY_ID) === 78, '338 original-program orders after two fuel retirements:214 civilian,78 Institute,46 existing-provider');
let crossGaia = 0, crossBalor = 0;
const gatewayCombinations = new Set<string>();
for (const [key, days] of orders) {
  assert(days.size === 20, `daily coverage: ${key}`);
  assert(new Set([...days.values()].map(c => c.cargo.massTons)).size === 1, 'stable consignment mass');
  for (let day = 0; day < 20; day += 2) {
    const a = days.get(day)!, b = days.get(day + 1)!;
    const hub = (c: FactionContractCandidate) => c.sourceId === DAHAI_ORBITAL || c.destinationId === DAHAI_ORBITAL;
    assert(hub(a) !== hub(b) && a.likelihood === b.likelihood, 'exact paired50/50 count and weight');
    if (isGaia(a.sourceId) || isGaia(a.destinationId)) {
      assert((a.sourceId === RICHELIEU || a.destinationId === RICHELIEU) !== (b.sourceId === RICHELIEU || b.destinationId === RICHELIEU), 'Gaia independently retains50/50');
      gatewayCombinations.add(`${hub(a)}:${a.sourceId === RICHELIEU || a.destinationId === RICHELIEU}`); crossGaia++;
    }
    if ((BALOR_TRADE_SITES as readonly string[]).includes(a.sourceId) || (BALOR_TRADE_SITES as readonly string[]).includes(a.destinationId)) {
      assert((a.sourceId === BALOR_ORBITAL || a.destinationId === BALOR_ORBITAL) !== (b.sourceId === BALOR_ORBITAL || b.destinationId === BALOR_ORBITAL), 'Balor independently retains50/50');
      assert(a.details?.includes('Balor Orbital consolidation') === (a.sourceId === BALOR_ORBITAL || a.destinationId === BALOR_ORBITAL), 'both worlds explain their own consolidation'); crossBalor++;
    }
  }
}
assert(crossGaia > 0 && crossBalor > 0 && gatewayCombinations.size === 4, 'all gateway combinations reachable independently');
assert(cityCounts.get(JIUYUAN)!.in > cityCounts.get(JIUYUAN)!.out * 2, 'Jiuyuan import-heavy, no invented balancing exports');
for (const [key, r] of traffic) {
  assert(r.hub / r.total > 0.4 && r.hub / r.total < 0.6, `roughly half including native orbital services: ${key}`);
  assert(r.civilianWeight / r.weight > 0.5, `ordinary civilians majority of weighted traffic: ${key}`);
}

// Routing boundaries and immutable inputs, including a native source's
// destination, same-body services, timed departures and certification trips.
const fixture: FactionContractCandidate = { factionId: 'fixture', factionName: 'Fixture', templateId: 'fixture', dahaiDispatchKey: 'fixture', sourceId: FUYUAN, destinationId: 'estella-iii-capital-city', cargo: { label: 'test cargo', massTons: 1 }, likelihood: 1, generosity: 0.8, completionMessage: 'Approved external receipt.' };
const before = JSON.stringify(fixture);
let day = 0; while (!dahaiDispatchUsesTerminal('fixture', day * 86400)) day++;
const query = (c: FactionContractCandidate, sourceId: string) => generateDahaiRoutedContracts({ sourceId, worldTime: day * 86400 }, ctx => ctx.sourceId === c.sourceId ? [c] : []);
const routed = query(fixture, DAHAI_ORBITAL)[0];
assert(routed.sourceId === DAHAI_ORBITAL && routed.completionMessage === fixture.completionMessage && routed.cargo === fixture.cargo, 'preserve external receipts/cargo');
assert(query(fixture, FUYUAN).length === 0 && JSON.stringify(fixture) === before, 'remove redirected source offer without mutating raw/accepted objects');
for (const c of [
  { ...fixture, sourceId: DAHAI_ORBITAL }, { ...fixture, destinationId: DAHAI_ORBITAL }, { ...fixture, destinationId: ZHULONG },
  { ...fixture, category: 'certification' as const }, { ...fixture, destinationLeadAngleFromSource: 0.2 },
  { ...fixture, travelMode: 'old-nell' as const }, { ...fixture, sourceId: 'estella-iii-capital-city', destinationId: 'estella-v-capital-settlement' },
]) assert(query(c, c.sourceId)[0] === c, 'native/local/timed/certification/unrelated input unchanged');
const inbound = { ...fixture, sourceId: fixture.destinationId, destinationId: FUYUAN, completionMessage: 'Unloading inside the city.' };
assert(query(inbound, inbound.sourceId)[0].destinationId === DAHAI_ORBITAL && !query(inbound, inbound.sourceId)[0].completionMessage?.includes('inside the city'), 'hub arrival does not stage unloading in city');

// Every new physical route builds a real quote and playable mission.
for (const c of pairs.values()) {
  const q = estimateEstellaMissionCost(c.sourceId, c.destinationId, c.cargo, undefined, makePayTerms(c));
  assert(q.parDv > 0 && Number.isFinite(q.parDv) && q.grossPay > 0, 'finite production quote');
  assert(createPlayableEstellaMission(c.sourceId, c.destinationId, undefined, 742).start, 'production flight constructs');
}
let accepted: ReturnType<typeof generateCareerContracts>[number] | undefined;
let boardRows = 0;
const seenActors = new Set<string>();
for (const d of [0, 1, 10, 11]) for (const sourceId of sourceSet) {
  const rows = [...generateCareerContracts(sourceId, d * 86400), ...generatePassengerContracts(sourceId, d * 86400)];
  for (const c of rows) {
    assert(c.quote.sourceId === c.sourceId && c.quote.destinationId === c.destinationId, 'quotes use actual dispatch endpoints');
    assert(c.sourceName === ESTELLA_NODES_BY_ID.get(contractLocationId(c.sourceId))?.name && c.destinationName === ESTELLA_NODES_BY_ID.get(contractLocationId(c.destinationId))?.name, 'physical destination labels retained');
    if ([DAHAI_CIVILIAN_ID, PLANETOLOGY_ID].includes(c.factionId!)) { seenActors.add(c.factionId!); boardRows++; }
    if (c.destinationId === DAHAI_ORBITAL) accepted = c;
  }
}
assert(seenActors.size === 2 && accepted, 'both new providers appear on sampled boards; orbital arrival found');
const acceptedJson = JSON.stringify(accepted);
generateCareerContracts(DAHAI_ORBITAL, 999 * 86400);
assert(JSON.stringify(accepted) === acceptedJson, 'later epochs do not rewrite accepted quote');
const storage = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) };
const saved = { ...defaultCareerProfile(), locationId: JIUYUAN, money: 123456, worldTime: 1234 };
const savedJson = JSON.stringify(saved); storage.set('space-teamster.career.v1', savedJson);
assert(loadCareerProfile().locationId === JIUYUAN && storage.get('space-teamster.career.v1') === savedJson, 'city rename preserves legacy save without rewriting');
const game: any = Object.create(Game.prototype); game.canvas = { width: 1280, height: 900 }; game.career = { ...defaultCareerProfile(), locationId: FUYUAN };
assert(game.buildInteractiveScene({ id: 'stationTerminal', selectedIndex: 0 }).bodyRows.some((r: any) => r.text === estellaLocationIntroduction(FUYUAN)), 'real terminal displays city/Institute role');
game.activeCareerContract = accepted; game.activeMissionQuote = accepted.quote; game.missionDvUsed = 0; game.worldTime = 2000; game.activeManifestCondition = {};
game.loadStationTerminal = () => { game.activeCareerContract = null; }; game.finishCareerDelivery();
assert(game.career.locationId === DAHAI_ORBITAL && loadCareerProfile().locationId === DAHAI_ORBITAL, 'actual settlement ends at orbital terminal, no second player leg');
assert(JSON.stringify(accepted) === acceptedJson, 'settlement preserves accepted posting');
console.log(`Dahai shipping: ${assertions} assertions, ${orders.size} logical orders, ${pairs.size} playable pairs, ${boardRows} new-provider postings.`, Object.fromEntries(actorCounts), Object.fromEntries([...cityCounts].map(([k,v])=>[DAHAI_SITE_NAMES[k as typeof FUYUAN],v])), Object.fromEntries([...traffic].map(([k,r])=>[k,{hub:r.hub/r.total, weightedHub:r.hubWeight/r.weight, civilian:r.civilianWeight/r.weight}])));
