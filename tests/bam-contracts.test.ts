import './svg-dom';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID } from '../src/content/estella';
import { BALOR_ADVANCED_MATERIALS_PROVIDER as bam } from '../src/content/estella/faction-contracts/bam-contracts';
import { generateFactionContractCandidates, ESTELLA_FACTION_CONTRACT_PROVIDERS, type FactionContractCandidate } from '../src/content/estella/faction-contracts';
import { BALOR_ORBITAL, BAM_EXTRACTION, BAM_FOUNDRY, SHADE, BALOR_TRADE_SITES, balorDispatchEndpoint } from '../src/content/estella/balor-logistics';
import { classifyMissionCargo } from '../src/cargo-handling';
import { passengerComfortTerms } from '../src/passenger-comfort';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { createPlayableEstellaMission } from '../src/estella-playable';

let assertions = 0;
function assert(ok: unknown, message: string): asserts ok { assertions++; if (!ok) throw new Error(message); }
const local = new Set<string>(BALOR_TRADE_SITES);
const nav = new Set(estellaSelectableNavTargets().map(t => t.id));
const rows = new Map<string, Map<number, FactionContractCandidate>>();
const labels = new Set<string>();
const externalSources = new Set<string>();
const totals = new Map<string, { hub: number; direct: number; hubWeight: number; directWeight: number }>();
assert(ESTELLA_FACTION_CONTRACT_PROVIDERS.filter(p => p.id === bam.id).length === 1, 'BAM registered exactly once');
for (let day = 0; day < 120; day++) for (const node of ESTELLA_NODES.filter(n => n.kind === 'poi')) {
  const candidates = bam.generateContracts({ sourceId: node.id, worldTime: day * 86400 });
  for (const c of candidates) {
    assert(c.sourceId === node.id && nav.has(c.sourceId) && nav.has(c.destinationId), `source-scoped selectable endpoints: ${c.sourceId} -> ${c.destinationId}`);
    assert(local.has(c.sourceId) !== local.has(c.destinationId), 'exactly one Balor endpoint; no local shuttle or self-route');
    assert(c.factionId === bam.id && c.factionTag === 'BAM' && c.factionName === bam.name, 'stable BAM issuer');
    assert(c.likelihood > 0 && Number.isFinite(c.likelihood) && c.cargo.massTons! > 0, 'finite positive cargo and posting weight');
    assert(c.generosity === 1 && c.maxCompAllowance === 2 && c.flatReward === undefined, 'explicit fair pay without flat bounty');
    assert(c.compensationRatio === (c.category === 'passenger' ? 0.5 : 0.4), 'freight/personnel fuel terms');
    const cargo = classifyMissionCargo(c.cargo);
    labels.add(c.cargo.label);
    if (c.category === 'passenger') assert(passengerComfortTerms(c.cargo.label).expectation === 'elevated', 'skilled workers get elevated comfort');
    if (c.cargo.label === 'hot-zone sensor packages') assert(cargo.fragile?.level === 'fragile' && cargo.fragile.shockAbsorbingContainer, 'sensors have explicit fragile handling');
    const hub = c.sourceId === BALOR_ORBITAL || c.destinationId === BALOR_ORBITAL;
    assert(!!c.details?.includes('local transport arranged by BAM') === hub, 'hub details explain background local leg, not another player job');
    assert(c.details?.includes('BAM Extraction One') || c.details?.includes('BAM Foundry One') || c.details?.includes('Shade'), 'logical surface site retained even at hub');
    assert(c.completionMessage === undefined, 'unapproved narrative copy not installed; shared neutral receipt used');
    const external = local.has(c.sourceId) ? c.destinationId : c.sourceId;
    assert(!['estella-xif-observatory', 'estella-xif-sealed-research-outpost', 'estella-i-deep-listening'].includes(external), 'no retired observatory or private Daedalus scope');
    const placement = ESTELLA_NODES_BY_ID.get(external)?.placement;
    assert(!(placement?.kind === 'surface' && placement.parentId === 'estella-vi'), 'Kuznia trade stays orbital');
    assert(!(placement?.kind === 'surface' && placement.parentId === 'estella-vib'), 'Kalyna logistics stay through its orbital hub');
    if (!local.has(c.sourceId)) externalSources.add(c.sourceId);
    const byDay = rows.get(c.templateId) ?? new Map<number, FactionContractCandidate>();
    assert(!byDay.has(day), 'only one hub OR direct posting per logical consignment/day');
    byDay.set(day, c); rows.set(c.templateId, byDay);
    const group = `${c.category}:${local.has(c.sourceId) ? 'out' : 'in'}`;
    const counts = totals.get(group) ?? { hub: 0, direct: 0, hubWeight: 0, directWeight: 0 };
    if (hub) { counts.hub++; counts.hubWeight += c.likelihood; } else { counts.direct++; counts.directWeight += c.likelihood; }
    totals.set(group, counts);
  }
}
assert(rows.size > 40 && labels.size > 20, 'authored industrial/personnel breadth');
for (const [key, byDay] of rows) {
  assert(byDay.size === 120, `${key} dispatched each day`);
  const mass = new Set([...byDay.values()].map(c => c.cargo.massTons));
  assert(mass.size === 1, 'same logical cargo mass through direct and consolidated endpoints');
  for (let day = 0; day < 120; day += 2) {
    const first = byDay.get(day)!, second = byDay.get(day + 1)!;
    const via = (c: FactionContractCandidate) => c.sourceId === BALOR_ORBITAL || c.destinationId === BALOR_ORBITAL;
    assert(via(first) !== via(second), 'every dispatch pair is exactly 50/50');
    assert(first.likelihood === second.likelihood, 'routing does not create a weight bias');
  }
}
for (const [group, counts] of totals) {
  assert(counts.hub === counts.direct && Math.abs(counts.hubWeight - counts.directWeight) < 1e-8, `50/50 by count and likelihood for ${group}`);
}
for (const sourceId of [...BALOR_TRADE_SITES, ...externalSources]) {
  const a = bam.generateContracts({ sourceId, worldTime: 86400 * 7 + 1 });
  assert(JSON.stringify(a) === JSON.stringify(bam.generateContracts({ sourceId, worldTime: 86400 * 7 + 80000 })), 'dispatch unchanged within posting day');
  assert(JSON.stringify(a) === JSON.stringify(bam.generateContracts({ sourceId, worldTime: 86400 * 7 + 1 })), 'retry determinism');
  for (const c of generateFactionContractCandidates({ sourceId, worldTime: 86400 * 7 }).filter(c => c.factionId === bam.id)) {
    assert(c.completionMessage === 'Balor Advanced Materials thanks you for successfully completing this contract.', 'existing neutral completion fallback wired');
    if (c.cargo.fragile) assert(c.requiredCertification === 'fragile-cargo', 'fragile certification propagated');
    if (c.category === 'passenger') assert(c.cargo.passengerComfort?.expectation === 'elevated', 'passenger terms propagated');
  }
}
assert(bam.generateContracts({ sourceId: 'estella-i-deep-listening', worldTime: 0 }).length === 0, 'no work at retired observatory');
const negativePair = [balorDispatchEndpoint(SHADE, 'negative-fixture', -2 * 86400), balorDispatchEndpoint(SHADE, 'negative-fixture', -86400)];
assert(negativePair[0] !== negativePair[1], 'pair rule also deterministic for negative test epochs');

// Actual BBS integration: capped boards need not reproduce the raw dispatch
// ratio, but every Balor site must have real payable freight/personnel offers.
let boardRows = 0;
const seenSites = new Set<string>(), seenBoards = new Set<string>(), pairs = new Map<string, [string,string]>();
for (const day of [0, 1, 20, 21]) for (const sourceId of [...BALOR_TRADE_SITES, 'estella-vi-heavy-cargo-station', 'estella-via-component-supply-station', 'estella-iii-agricultural-region', 'estella-vib-cold-chain-station', 'estella-v-capital-settlement', 'estella-xif-deep-listening-array']) {
  for (const c of [...generateCareerContracts(sourceId, day * 86400), ...generatePassengerContracts(sourceId, day * 86400)].filter(c => c.factionId === bam.id)) {
    boardRows++;
    if (local.has(c.sourceId)) seenSites.add(c.sourceId);
    if (local.has(c.destinationId)) seenSites.add(c.destinationId);
    seenBoards.add(c.category!);
    assert(Number.isFinite(c.quote.parDv) && c.quote.parDv > 0 && Number.isFinite(c.quote.grossPay) && c.quote.grossPay > 0, 'finite positive real-board quote');
    assert(c.issuerTag === 'BAM' && c.details && c.completionMessage, 'board preserves issuer and operational details');
    if (c.category === 'passenger') assert(c.requiredCertification === 'passenger' && c.cargo.passengerComfort?.expectation === 'elevated', 'passenger license and comfort on board');
    if (c.cargo.fragile) assert(c.requiredCertification === 'fragile-cargo', 'board requires fragile license');
    assert(JSON.parse(JSON.stringify(c)).details === c.details, 'accepted-contract serialization retains handling facts');
    pairs.set(`${c.sourceId}->${c.destinationId}`, [c.sourceId,c.destinationId]);
  }
}
assert(boardRows > 50 && seenSites.size === 4 && seenBoards.size === 2, 'all Balor sites and both boards represented');
for (const [source, destination] of pairs.values()) assert(createPlayableEstellaMission(source, destination, undefined, 811).start, 'board route builds real playable phases');
console.log(`BAM regression passed: ${assertions} assertions; ${rows.size} logical routes, ${labels.size} cargo labels, ${boardRows} real-board rows, ${pairs.size} playable pairs.`);
console.log(JSON.stringify(Object.fromEntries(totals), null, 2));
