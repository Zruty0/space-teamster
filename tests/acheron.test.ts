import { ESTELLA_NODES, ESTELLA_NODES_BY_ID } from '../src/content/estella';
import { ESTELLA_FACTION_CONTRACT_PROVIDERS, generateFactionContractCandidates, type FactionContractCandidate } from '../src/content/estella/faction-contracts';
import { CERBERUS_HUMAN_RESOURCES_PROVIDER as chr } from '../src/content/estella/faction-contracts/cerberus-contracts';
import { PANDEMONIUM_COPY, ESTELLA_LOCATION_INTRODUCTIONS } from '../src/content/estella/location-copy';
import { classifyMissionCargo } from '../src/cargo-handling';
import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { defaultCareerProfile, TEAMSTER_CERTIFICATION_IDS } from '../src/career-state';
import { createDefaultRigState } from '../src/maintenance/rig-state';
import { Game } from '../src/game';
import { parseInteractiveTextMarkup, type InteractiveScene } from '../src/interactive-scene';

let assertions = 0;
function assert(value: unknown, message: string): asserts value { assertions++; if (!value) throw new Error(message); }
const pande = 'estella-ii-pandemonium', olympos = 'estella-ii-olympos', nimbus = 'estella-ii-nimbus-crucible';
const gryphon = 'estella-x-observation-skim-hub', hub = 'estella-ii-commercial-hub-dock';
const hammer = 'estella-vi-heavy-cargo-station', veles = 'estella-via-component-supply-station';
const equipment = new Set(['deep-pressure valve assemblies', 'mining cutting assemblies', 'industrial pressure seal crates']);
const metals = new Set(['rare-metal export staging pallets', 'platinum-group metal ingots', 'pressure-mined rare metal pallets']);
const seen = new Set<string>();
let relevant = 0;
function check(candidate: FactionContractCandidate): void {
  if (candidate.sourceId !== pande && candidate.destinationId !== pande && !/hydrogen/i.test(candidate.cargo.label)) return;
  relevant++;
  classifyMissionCargo(candidate.cargo);
  if (candidate.destinationId === pande) {
    assert(candidate.category === 'passenger' || equipment.has(candidate.cargo.label), 'Pandemonium intake only personnel/heavy industrial equipment');
    assert(candidate.sourceId !== olympos && candidate.sourceId !== nimbus, 'no routine local atmospheric/surface shuttle to Pandemonium');
    const expected = candidate.category === 'passenger' ? PANDEMONIUM_COPY.personnelArrival
      : candidate.cargo.label === 'mining cutting assemblies' ? PANDEMONIUM_COPY.miningEquipmentArrival
        : PANDEMONIUM_COPY.industrialPartsArrival;
    assert(candidate.completionMessage === expected, 'worker-led destination/cargo-specific completion');
    assert(!/compliance officer|Cerberus handlers|Cerberus staff|warden|Renard|Colette/.test(candidate.completionMessage!), 'no wardens, corporate dock reception or secret reveal');
    seen.add(candidate.cargo.label);
  }
  if (candidate.sourceId === pande) {
    assert(metals.has(candidate.cargo.label), 'Pandemonium exports metals only');
    assert(candidate.details === PANDEMONIUM_COPY.metalsPickup, 'metal pickup scene belongs in preflight details');
    assert(!candidate.completionMessage?.includes('Thorne'), 'offworld receipt does not pretend to be a Pandemonium pickup');
  }
}
// Check all providers, not just CHR: no other actor may quietly reintroduce
// public hydrogen or Nimbus aid. These are raw candidates, not live BBS saves.
for (let day = 0; day < 120; day++) for (const node of ESTELLA_NODES.filter(n => n.kind === 'poi')) {
  for (const provider of ESTELLA_FACTION_CONTRACT_PROVIDERS) for (const c of provider.generateContracts({ sourceId: node.id, worldTime: day * 86400 })) {
    if (c.sourceId === nimbus || c.destinationId === nimbus) assert(c.sourceId !== pande && c.destinationId !== pande, 'Nimbus/Pandemonium reserved for later vignette');
    if (c.sourceId === pande || c.destinationId === pande || (c.destinationId === olympos && /hydrogen/i.test(c.cargo.label))) check(c);
  }
}
for (const label of ['surface labor allocation', ...equipment]) assert(seen.has(label), `intake represented: ${label}`);
const imports = chr.generateContracts({ sourceId: gryphon, worldTime: 0 }).filter(c => c.templateId === 'hydrogen-to-olympos');
assert(imports.length === 1 && imports[0].destinationId === olympos, 'Gryphon Aerie supplies Olympos directly');
assert(imports[0].cargo.label === 'industrial hydrogen tanks' && imports[0].category !== 'passenger', 'ordinary industrial H2, not passengers or Guild fuel');
assert(imports[0].generosity === 0.85 && imports[0].compensationRatio === 0.4 && imports[0].maxCompAllowance === 2, 'normal CHR freight economics, no new smuggling premium');
assert(chr.generateContracts({ sourceId: nimbus, worldTime: 0 }).length === 0, 'Nimbus legitimate local H2 remains background logistics');
assert(chr.generateContracts({ sourceId: hub, worldTime: 0 }).some(c => c.destinationId === pande && c.category === 'passenger'), 'same-body orbital intake remains permitted');
assert(!chr.generateContracts({ sourceId: olympos, worldTime: 0 }).some(c => c.destinationId === pande), 'no routine surface-to-surface allocation');
assert(!chr.generateContracts({ sourceId: hub, worldTime: 0 }).some(c => /hydrogen/i.test(c.cargo.label)), 'no local H2 staging flight left behind');
for (const sourceId of [gryphon, hammer, veles, hub, olympos, pande]) {
  const first = generateFactionContractCandidates({ sourceId, worldTime: 0 });
  assert(JSON.stringify(first) === JSON.stringify(generateFactionContractCandidates({ sourceId, worldTime: 0 })), 'generation/completion deterministic for retries');
  for (const c of first.filter(c => c.factionId === chr.id)) classifyMissionCargo(c.cargo);
}

// Verify the approved passages actually reach visible terminal/posting scenes
// and persisted contract fields, not just unused content constants.
const game: any = Object.create(Game.prototype);
game.career = { ...defaultCareerProfile(), locationId: pande, money: 1e9, certifications: [...TEAMSTER_CERTIFICATION_IDS], rig: createDefaultRigState(true) };
game.worldTime = 0;
const terminal: InteractiveScene = game.buildInteractiveScene({ id: 'stationTerminal', selectedIndex: 0 });
assert(terminal.bodyRows?.some(row => row.kind === 'text' && row.text === PANDEMONIUM_COPY.introduction), 'approved location introduction visible at Pandemonium terminal');
assert(ESTELLA_NODES_BY_ID.get(pande)?.summary === PANDEMONIUM_COPY.introduction, 'catalog and terminal share approved location copy');
assert(ESTELLA_LOCATION_INTRODUCTIONS[pande] === PANDEMONIUM_COPY.introduction, 'location copy registered');
game.career.locationId = olympos;
const other: InteractiveScene = game.buildInteractiveScene({ id: 'stationTerminal', selectedIndex: 0 });
assert(!other.bodyRows?.some(row => row.kind === 'text' && row.text.includes('Thorne')), 'worker introduction does not leak to other terminals');

const boardSeen = new Set<string>();
let pickupContract: CareerContract | undefined;
for (let day = 0; day < 120; day++) {
  for (const sourceId of [gryphon, hammer, veles, pande, hub]) {
    const contracts = [...generateCareerContracts(sourceId, day * 86400), ...generatePassengerContracts(sourceId, day * 86400)];
    for (const c of contracts.filter(c => c.factionId === chr.id)) {
      if (c.destinationId === pande || c.sourceId === pande || c.templateId === 'hydrogen-to-olympos') {
        boardSeen.add(c.templateId!);
        assert(c.quote.parDv > 0 && Number.isFinite(c.quote.grossPay), 'new/retained board route has a finite quote');
        if (c.sourceId === pande) {
          const gaiaHandling = c.templateId === 'rare-metals-to-gaia-tech'
            ? ` Receiving site: Rochefort. ${c.destinationId === 'estella-iii-main-customs' ? 'Richelieu Orbital Terminal consolidation; local transport arranged by the issuer.' : 'Direct Gaia surface handling.'}` : '';
          assert(c.details === PANDEMONIUM_COPY.metalsPickup + gaiaHandling, 'board preserves exact pickup prose followed only by Gaia dispatch details');
          pickupContract ??= c;
        }
        if (c.destinationId === pande) assert(c.completionMessage.includes('[contact]Thorne[/contact]'), 'board preserves worker completion and rich contact markup');
        const saved = JSON.parse(JSON.stringify(c));
        assert(saved.completionMessage === c.completionMessage && saved.details === c.details, 'contract serialization preserves story fields');
      }
    }
  }
}
// The rare deep-surface equipment postings compete on Hammer's capped board.
// Additional actors can move their first appearance beyond the 120-day raw
// audit window; check one year of that source, without forcing board priority.
for (let day = 120; day < 365 && !boardSeen.has('mining-cutters-to-pandemonium'); day++) {
  for (const c of generateCareerContracts(hammer, day * 86400)) {
    if (c.factionId === chr.id && c.destinationId === pande) boardSeen.add(c.templateId!);
  }
}
for (const id of ['hydrogen-to-olympos', 'mining-cutters-to-pandemonium', 'pressure-seals-to-pandemonium', 'local-surface-labor-processing']) assert(boardSeen.has(id), `route reaches real board selection: ${id}`);
assert(pickupContract, 'metal export available');
game.career.locationId = pande;
const posting: InteractiveScene = game.buildInteractiveScene({ id: 'contractPosting', selectedIndex: 0, contracts: [pickupContract], contractIndex: 0 });
const parsed = parseInteractiveTextMarkup(pickupContract.details!);
assert(posting.bodyRows?.some(row => row.kind === 'kv' && row.label === 'Details' && row.value === parsed.text), 'pickup prose appears in posting Details');
for (const copy of Object.values(PANDEMONIUM_COPY)) {
  assert(copy.includes('[contact]') && !/Renard|Colette|Nimbus/.test(copy), 'Thorne named without revealing the later conflict');
  assert(!parseInteractiveTextMarkup(copy).text.includes('[contact]'), 'contact markup parses');
}
console.log(`Acheron regression passed: ${assertions} assertions; ${relevant} relevant raw candidates; board templates ${[...boardSeen].sort().join(', ')}.`);
