import './svg-dom';
import baseline from './fixtures/sahra-economy-baseline.json';
import { reviewFingerprint } from './fixtures/camps-review-fingerprint';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID } from '../src/content/estella';
import { ESTELLA_FACTION_CONTRACT_PROVIDERS, generateFactionContractCandidates, type FactionContractCandidate } from '../src/content/estella/faction-contracts';
import { SAHRA_CIVILIAN_ID } from '../src/content/estella/faction-contracts/sahra-contracts';
import { PLANETOLOGY_ID } from '../src/content/estella/faction-contracts/dahai-contracts';
import { SAHRA_SITES, MULTAQA, BIR_SAFA, WADI, SUHAIL, RAQIB } from '../src/content/estella/sahra-sites';
import { generateSahraRoutedContracts, sahraDispatchUsesTerminal, isSahraSurface } from '../src/content/estella/sahra-logistics';
import { RICHELIEU } from '../src/content/estella/gaia-logistics';
import { DAHAI_ORBITAL } from '../src/content/estella/dahai-sites';
import { CAMPS_TRADE_WORLDS } from '../src/content/estella/camps-sites';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { estellaLocationIntroduction } from '../src/content/estella/location-copy';
import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { contractLocationId } from '../src/contract-presentation';
import { estimateEstellaMissionCost, makePayTerms } from '../src/mission-cost';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { defaultCareerProfile, loadCareerProfile } from '../src/career-state';
import { isCatalogedCargoLabel } from '../src/cargo-handling';
import { passengerComfortTerms } from '../src/passenger-comfort';
import { Game } from '../src/game';

let checks = 0;
function assert(ok: unknown, message: string): asserts ok { checks++; if (!ok) throw Error(message); }
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const pois = ESTELLA_NODES.filter(n => n.kind === 'poi');
const nav = new Set(estellaSelectableNavTargets().map(n => n.id));
const isNew = (c: {templateId?: string}) => !!c.templateId?.startsWith('sahra:');
const isFuel = (c: {cargo: {label: string}}) => c.cargo.label === 'stable fuel canisters';
const isSahra = (id: string) => (SAHRA_SITES as readonly string[]).includes(id);
assert(ESTELLA_FACTION_CONTRACT_PROVIDERS.length === 33 && new Set(ESTELLA_FACTION_CONTRACT_PROVIDERS.map(p => p.id)).size === 33, 'one civilian aggregator added, all original32 providers retained');
// Frozen at6067506 BEFORE any economy edits. The only raw deletions permitted
// are the eleven finished-fuel consignments. All other old fields remain exact.
for (const p of ESTELLA_FACTION_CONTRACT_PROVIDERS) {
  const expected = (baseline.providers as Record<string, number[]>)[p.id];
  if (!expected) { assert(p.id === SAHRA_CIVILIAN_ID, 'only authorized new actor'); continue; }
  const rows = baseline.providerDays.flatMap(day => pois.flatMap(n => p.generateContracts({sourceId: n.id, worldTime: day * 86400}).filter(c => !isNew(c))));
  assert(!rows.some(isFuel), 'no raw provider still produces finished-fuel loads');
  assert(same(reviewFingerprint(rows), expected), `${p.id}: every non-fuel old candidate, seed, mass, rate and receipt retained`);
}
assert(estellaLocationIntroduction(RAQIB)?.includes('All freight and passenger bookings') && estellaLocationIntroduction(RAQIB)?.includes('Institute'), 'Raqib Institute-only rule visible in terminal');
assert(estellaLocationIntroduction(SUHAIL)?.includes('half'), 'Suhail explains ordinary dispatch');

const orders = new Map<string, Map<number, FactionContractCandidate>>();
const pairs = new Map<string, FactionContractCandidate>();
const coverage = new Map<string, {in: number; out: number}>();
const affectedPhysical = new Set<string>([contractLocationId('still-distribution-bay')]);
const actors = new Map<string, Set<string>>();
let ice = 0, gems = 0, raqib = 0, oldPrecursor = 0;
for (let day = 0; day < 48; day++) for (const n of pois) {
  const all = generateFactionContractCandidates({sourceId: n.id, worldTime: day * 86400});
  if (all.some(c => isNew(c) || isSahra(c.sourceId) || isSahra(c.destinationId))) affectedPhysical.add(contractLocationId(n.id));
  for (const c of all) {
    assert(!isFuel(c), 'system-wide new-board fuel retirement, not just Sahra');
    if (c.factionId === 'teamsters-guild' && c.cargo.label === 'sealed antimatter precursor canisters') oldPrecursor++;
    if (isSahra(c.sourceId) || isSahra(c.destinationId)) assert(c.factionId !== 'teamsters-guild', 'no Guild Sahra shipments');
    if ([c.sourceId, c.destinationId].includes(RAQIB)) {
      raqib++; assert(c.factionId === PLANETOLOGY_ID && c.issuerId === PLANETOLOGY_ID && c.factionTag === 'EIP', 'all Raqib freight/passengers, inbound/outbound, are Institute-issued');
      if(c.sourceId === SUHAIL) assert(c.cargo.massTons <= 2.4, 'compact outpost stores, not industrial-scale restocking');
    }
    if (!isNew(c)) continue;
    assert(c.sourceId === n.id && c.sourceId !== c.destinationId && nav.has(c.sourceId) && nav.has(c.destinationId), 'scoped real playable endpoints');
    assert(isSahra(c.sourceId) || isSahra(c.destinationId), 'authored additions stay in approved region');
    assert(!(isSahraSurface(c.sourceId) && isSahraSurface(c.destinationId)), 'ground caravan work is not a spacecraft surface shuttle');
    assert(Number.isFinite(c.cargo.massTons) && c.cargo.massTons > 0 && c.likelihood > 0, 'positive finite manifests');
    assert(!c.flatReward && !c.boardPriority && c.maxCompAllowance === 2, 'ordinary board selection, no bounty or forced quota');
    assert(isCatalogedCargoLabel(c.cargo.label) && c.details && c.completionMessage, 'classified cargo, purposeful details and receipt');
    if (c.category === 'passenger') assert(same(c.cargo.passengerComfort, passengerComfortTerms(c.cargo.label)), 'explicit passenger comfort');
    if (c.cargo.fragile) assert(c.requiredCertification === 'fragile-cargo', 'fragile cargo requires qualification');
    for (const id of [c.sourceId, c.destinationId]) {
      const p = ESTELLA_NODES_BY_ID.get(id)?.placement;
      assert(!(p?.kind === 'surface' && ['estella-vi', 'estella-vib'].includes(p.parentId)), 'Kuznia/Kalyna surface membranes retained');
      assert(!['estella-xif-observatory','estella-xif-sealed-research-outpost','ark-quarantine-station-poi','estella-ix-low-orbit-research-station'].includes(id), 'reserves/removed station not invented as demand');
    }
    if (c.factionId === SAHRA_CIVILIAN_ID) assert(!c.factionTag && c.issuerName !== c.factionName, 'ordinary household/merchant issuers, no owning corporation');
    if (c.factionId === 'steel-combine') assert(c.issuerName === 'Steel Combine Foreign Trade Committee' && c.generosity === 0.15 && c.compensationRatio === 1, 'existing Combine external pay/authority');
    if (c.cargo.label === 'Sahra ice blocks' || c.cargo.label === 'bonded water tanks') { ice++; assert(c.cargo.massTons > 1, 'bulk staple water'); }
    if (c.cargo.label.includes('veil-opal')) { gems++; assert(c.cargo.massTons <= 0.18 && c.cargo.fragile?.shockAbsorbingContainer && c.generosity === 1.25 && c.likelihood === 0.35, 'small protected premium gemstone consignments, not tonnes of jewels'); }
    const key = `${c.factionId}:${c.templateId}`, days = orders.get(key) ?? new Map<number, FactionContractCandidate>();
    assert(!days.has(day), 'no simultaneous direct/hub duplicates'); days.set(day, c); orders.set(key, days);
    pairs.set(`${c.sourceId}->${c.destinationId}`, c);
    const a = actors.get(c.factionId) ?? new Set<string>(); a.add(key); actors.set(c.factionId, a);
    for (const [id, dir] of [[c.sourceId, 'out'], [c.destinationId, 'in']] as const) if (isSahra(id)) { const r = coverage.get(id) ?? {in: 0, out: 0}; r[dir]++; coverage.set(id, r); }
  }
}
assert(orders.size === 78 && [...orders.values()].reduce((n, days) => n + days.size, 0) === 67 * 48, '78 distinct authored orders, average67 daily including occasional gems/Raqib work');
assert(ice > gems * 4 && gems > 0 && raqib > 0 && oldPrecursor > 0, 'ice staple, scarce gems, modest Institute outpost; separate skim feedstock retained');
for (const id of SAHRA_SITES) assert(coverage.get(id)!.in > 0 && coverage.get(id)!.out > 0, `bidirectional authored traffic ${id}`);
const combinations = new Set<string>(); let paired = 0, localRotations = 0;
for (const days of orders.values()) {
  const sample = [...days.values()][0];
  assert(new Set([...days.values()].map(c => c.cargo.massTons)).size === 1, 'consignment mass independent of epoch/routing');
  if (sample.cargo.label.includes('veil-opal')) assert(days.size === (sample.cargo.label.startsWith('cut') ? 16 : 12), 'gem lots appear one pair per six/eight days');
  if ([sample.sourceId, sample.destinationId].includes(RAQIB)) assert(days.size === 12, 'modest Raqib demand, one pair per eight days');
  for (const [day, a] of days) {
    if (day % 2) continue;
    const b = days.get(day + 1); assert(b && a.likelihood === b.likelihood, 'cadence retains complete dispatch pairs');
    const via = (c: FactionContractCandidate, id: string) => c.sourceId === id || c.destinationId === id;
    if (a.details!.includes('Sahra site:')) { assert(via(a, SUHAIL) !== via(b, SUHAIL), 'exact50/50 Sahra ordinary dispatch'); paired++; }
    if (a.details!.includes('Dahai site:')) assert(via(a, DAHAI_ORBITAL) !== via(b, DAHAI_ORBITAL), 'independent Dahai pairing');
    if (a.details!.includes('Richelieu Orbital Terminal consolidation') || a.details!.includes('Direct Gaia surface handling.')) { assert(via(a, RICHELIEU) !== via(b, RICHELIEU), 'independent Gaia pairing'); if (a.details!.includes('Sahra site:')) combinations.add(`${via(a, SUHAIL)}:${via(a, RICHELIEU)}`); }
    for (const w of CAMPS_TRADE_WORLDS) if (a.details!.includes(`${w.name} site:`)) assert(via(a, w.hub) !== via(b, w.hub), 'independent Camps pairing');
    if ([a.sourceId, a.destinationId].includes(RAQIB) && [a.sourceId, a.destinationId].includes(MULTAQA)) { localRotations++; assert(!a.details!.includes('Sahra site:') && a.sourceId === b.sourceId && a.destinationId === b.destinationId, 'local Institute service does not become false consolidated work'); }
  }
}
assert(paired > 0 && localRotations > 0 && combinations.size === 4, 'native/local work retained, independent world choices');

const raw: FactionContractCandidate[] = []; let exactBoards = 0, exactRows = 0, allRows = 0, observedCivilian = false, observedInstitute = false;
let accepted: CareerContract | undefined;
for (const day of [0,1,20,21]) {
  for (const n of pois) raw.push(...generateFactionContractCandidates({sourceId: n.id, worldTime: day * 86400}).filter(c => !isSahra(c.sourceId) && !isSahra(c.destinationId)));
  for (const n of estellaSelectableNavTargets().sort((a,b) => a.id.localeCompare(b.id))) {
    const rows = [...generateCareerContracts(n.id, day * 86400), ...generatePassengerContracts(n.id, day * 86400)]; allRows += rows.length;
    if (!affectedPhysical.has(contractLocationId(n.id))) {
      assert(same(reviewFingerprint(rows), (baseline.boardSources as Record<string, number[]>)[`${day}:${n.id}`]), `unaffected board retains exact availability/order/IDs/quotes ${day}:${n.id}`);
      exactBoards++; exactRows += rows.length;
    }
    for (const c of rows) {
      assert(!isFuel(c), 'no finished fuel on actual freight/passenger boards');
      if ([c.sourceId, c.destinationId].includes(RAQIB)) assert(c.factionId === PLANETOLOGY_ID, 'only Institute on real Raqib incident postings');
      if (!isNew(c)) continue;
      assert(c.quote.sourceId === c.sourceId && c.quote.destinationId === c.destinationId && c.quote.grossPay > 0, 'positive quote at actual dispatched endpoints');
      assert(c.sourceName === ESTELLA_NODES_BY_ID.get(contractLocationId(c.sourceId))?.name && c.destinationName === ESTELLA_NODES_BY_ID.get(contractLocationId(c.destinationId))?.name, 'physical public names');
      observedCivilian ||= c.factionId === SAHRA_CIVILIAN_ID; observedInstitute ||= c.factionId === PLANETOLOGY_ID;
      if (c.destinationId === SUHAIL) accepted = c;
    }
  }
}
assert(same(reviewFingerprint(raw), baseline.unaffectedRouted), 'all15569 unrelated routed candidates exact; only authorized fuel removals/Sahra work differ');
assert(exactRows > 4000 && exactBoards > 400 && observedCivilian && observedInstitute && accepted, 'substantial independent unchanged-board baseline plus real new public work');
for (const c of pairs.values()) {
  const q = estimateEstellaMissionCost(c.sourceId, c.destinationId, c.cargo, undefined, makePayTerms(c));
  assert(Number.isFinite(q.parDv) && q.parDv > 0 && q.grossPay > 0, 'finite real route quote');
  assert(createPlayableEstellaMission(c.sourceId, c.destinationId, undefined, 742).start, 'production flight constructs for every physical pair');
}
const fixture: FactionContractCandidate = {factionId: 'fixture', factionName: 'Fixture', templateId: 'fixture', sahraDispatchKey: 'fixture', sourceId: MULTAQA, destinationId: 'estella-iii-capital-city', cargo: {label: 'test', massTons: 1}, likelihood: 1, completionMessage: 'External receipt.'};
let day = 0; while (!sahraDispatchUsesTerminal('fixture', day * 86400)) day++;
const query = (c: FactionContractCandidate, sourceId: string) => generateSahraRoutedContracts({sourceId, worldTime: day * 86400}, ctx => ctx.sourceId === c.sourceId ? [c] : []);
const before = JSON.stringify(fixture);
assert(query(fixture, SUHAIL)[0].sourceId === SUHAIL && query(fixture, MULTAQA).length === 0 && JSON.stringify(fixture) === before, 'hub collects redirected origins immutably');
for (const c of [{...fixture, sourceId: SUHAIL}, {...fixture, destinationId: SUHAIL}, {...fixture, destinationId: RAQIB}, {...fixture, destinationId: BIR_SAFA}, {...fixture, category: 'certification' as const}, {...fixture, travelMode: 'old-nell' as const}, {...fixture, destinationLeadAngleFromSource: 0.2}]) assert(query(c, c.sourceId)[0] === c, 'native/local/timed/certification boundaries untouched');
const inbound = {...fixture, sourceId: fixture.destinationId, destinationId: MULTAQA, completionMessage: 'Unloading in the surface auction hall.'};
assert(query(inbound, inbound.sourceId)[0].destinationId === SUHAIL && !query(inbound, inbound.sourceId)[0].completionMessage!.includes('auction hall'), 'hub receipt does not pretend to be a surface arrival');

// Retiring a template must never invalidate accepted work. Classifications and
// settlement remain available for a real pre-change fuel contract/quote.
const storage = new Map<string,string>();
(globalThis as any).localStorage = {getItem: (k:string) => storage.get(k) ?? null, setItem: (k:string,v:string) => storage.set(k,v), removeItem: (k:string) => storage.delete(k)};
const history = '[{"cargo":"stable fuel canisters","pay":123}]'; storage.set('space-teamster.missionProfiles.v1', history);
for (const c of [baseline.acceptedFuel as CareerContract, accepted]) {
  const saved = JSON.stringify(c); const game: any = Object.create(Game.prototype);
  game.career = {...defaultCareerProfile(), locationId: c.sourceId}; game.activeCareerContract = c; game.activeMissionQuote = c.quote;
  game.missionDvUsed = 0; game.worldTime = 2000; game.activeManifestCondition = {}; game.loadStationTerminal = () => {};
  game.finishCareerDelivery();
  assert(game.career.locationId === c.destinationId && loadCareerProfile().locationId === c.destinationId && JSON.stringify(c) === saved, 'real legacy/new settlement preserves accepted quote and arrives at contracted endpoint');
}
assert(storage.get('space-teamster.missionProfiles.v1') === history && isCatalogedCargoLabel('stable fuel canisters'), 'historical cargo type and mission history retained');
console.log(`Sahra economy: ${checks} checks, ${orders.size} distinct orders, ${pairs.size} playable pairs; ${exactRows} exact postings on ${exactBoards} unaffected boards of ${allRows} rows.`, Object.fromEntries([...actors].map(([k,v]) => [k,v.size])), Object.fromEntries(coverage));
