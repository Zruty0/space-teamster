import './svg-dom';
import economyBaseline from './fixtures/sahra-economy-baseline.json';
import { contractLocationId } from '../src/contract-presentation';
import { reviewFingerprint } from './fixtures/camps-review-fingerprint';
import { publicContentText } from '../src/content-terminology';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID, ESTELLA_INSTITUTIONS } from '../src/content/estella';
import { generateFactionContractCandidates, type FactionContractCandidate } from '../src/content/estella/faction-contracts';
import { generateCareerContracts, generatePassengerContracts, type CareerContract } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { presentCareerContract } from '../src/contract-presentation';
import { classifyMissionCargo, isCatalogedCargoLabel } from '../src/cargo-handling';
import { passengerComfortTerms } from '../src/passenger-comfort';
import { LOCAL_DIRECTORY_ENTRIES } from '../src/local-directory';
import { MAINTENANCE_SHOPS } from '../src/maintenance/shops';
import { defaultCareerProfile, TEAMSTER_CERTIFICATION_IDS } from '../src/career-state';
import { Game } from '../src/game';

let assertions = 0;
function assert(ok: unknown, message: string): asserts ok { assertions++; if (!ok) throw Error(message); }
function clean(text: string): boolean { return !/\byards?\b|\bRidgeback\b|\bSYC\b/i.test(text); }
function visible(contract: CareerContract): string {
  return [contract.title, contract.issuerName, contract.issuerTag, contract.sourceName, contract.sourcePath,
    contract.destinationName, contract.destinationPath, contract.cargo.label, contract.details, contract.briefing, contract.completionMessage].join('\n');
}
assert(ESTELLA_NODES_BY_ID.get('estella-va-strip-mine')?.name === 'Flint Mine', 'new Pike name, stable location ID');
assert(ESTELLA_INSTITUTIONS.find(i => i.id === 'svarog-yard-company')?.name === 'Svarog Shipyard Company', 'new company name, stable institution ID');
for (const n of ESTELLA_NODES) assert(clean(n.name + ' ' + n.summary), `current node copy: ${n.id}`);
for (const entry of LOCAL_DIRECTORY_ENTRIES) assert(clean([entry.name, entry.description, entry.organizationName].join(' ')), `directory copy: ${entry.id}`);
for (const shop of MAINTENANCE_SHOPS) assert(clean(JSON.stringify({name: shop.name, organizationName: shop.organizationName, copy: shop.copy})), `shop copy: ${shop.id}`);
assert(publicContentText('cargo yards, assay yards, equipment yard, tilt-yard drone packs') === 'cargo depots, assay works, equipment depot, tilting-ground drone packs', 'non-shipbuilding uses get appropriate nouns');
assert(publicContentText('shipyard shipyards dockyard backyard') === 'shipyard shipyards dockyard backyard', 'word boundaries, no double ship prefixes');

// Original review snapshots remain historical fixtures. The approved Sahra
// routing/fuel deletion now has a separate BEFORE-change6067506 baseline.
const raw: FactionContractCandidate[] = [], boards: CareerContract[] = [];
const contexts: Array<{day:number;source:string;rows:CareerContract[]}> = [];
for (const day of [0, 1, 20, 21]) {
  for (const n of ESTELLA_NODES.filter(n => n.kind === 'poi')) raw.push(...generateFactionContractCandidates({sourceId: n.id, worldTime: day * 86400}));
  // The nav menu legitimately reorders renamed sites; compare boards by stable source ID.
  for (const n of estellaSelectableNavTargets().sort((a, b) => a.id.localeCompare(b.id))) {
    const rows = [...generateCareerContracts(n.id, day * 86400), ...generatePassengerContracts(n.id, day * 86400)];
    boards.push(...rows); contexts.push({day,source:n.id,rows});
  }
}
const touchesSahra = (c:FactionContractCandidate) => [c.sourceId,c.destinationId].some(id=>id.startsWith('estella-ix'));
assert(JSON.stringify(reviewFingerprint(raw.filter(c=>!touchesSahra(c)))) === JSON.stringify(economyBaseline.unaffectedRouted), 'all unrelated non-fuel routed candidates remain exact');
const affected = new Set(['still-distribution-bay', ...raw.filter(touchesSahra).map(c=>c.sourceId)].map(contractLocationId));
const unaffectedBoards: CareerContract[] = [];
for(const {day,source,rows} of contexts) if(!affected.has(contractLocationId(source))) {
  assert(JSON.stringify(reviewFingerprint(rows)) === JSON.stringify((economyBaseline.boardSources as Record<string,number[]>)[`${day}:${source}`]), 'untouched source board: exact original order, IDs, availability and quotes');
  unaffectedBoards.push(...rows);
}
const labels = new Set<string>();
for (const c of raw) {
  if (labels.has(c.cargo.label)) continue;
  labels.add(c.cargo.label);
  const label = publicContentText(c.cargo.label);
  assert(isCatalogedCargoLabel(label), `display cargo remains cataloged: ${label}`);
  const before = classifyMissionCargo({label: c.cargo.label, massTons: c.cargo.massTons});
  const after = classifyMissionCargo({label, massTons: c.cargo.massTons});
  assert(after.cargoTypeId === before.cargoTypeId && JSON.stringify(after.fragile) === JSON.stringify(before.fragile), 'display aliases preserve type IDs and fragility without a save migration');
  if (c.category === 'passenger') assert(JSON.stringify(passengerComfortTerms(label)) === JSON.stringify(passengerComfortTerms(c.cargo.label)), 'old/new passenger names have identical comfort');
}
for (const c of boards) {
  assert(clean(visible(c)), `no deprecated wording in live posting ${c.id}`);
  assert(JSON.stringify(presentCareerContract(c)) === JSON.stringify(c), 'new presentation idempotent');
}
assert(boards.some(c => c.issuerName === 'Kisaragi Harmony Shipyards') && boards.some(c => c.issuerName === 'Kisaragi Shipyards Estella'), 'both Kisaragi public names updated without changing seeded internal names');
const current = boards.find(c => c.factionId === 'svarog-yard-company' && c.cargo.label.includes('shipyard'))!;
assert(current, 'live SSC fixture with a renamed manifest');
const old: CareerContract = {...current, issuerName: 'Svarog Yard Company', issuerTag: 'SYC', cargo: {...current.cargo, label: current.quote.cargoLabel}, title: current.title.replace(/shipyard/g, 'yard')};
const snapshot = JSON.stringify(old), view = presentCareerContract(old);
assert(clean(visible(view)) && view.issuerName === 'Svarog Shipyard Company' && view.issuerTag === 'SSC', 'legacy cached/accepted SSC manifests render current wording');
assert(view.quote === old.quote && view.cargo.cargoTypeId === old.cargo.cargoTypeId && JSON.stringify(old) === snapshot, 'no accepted object, quote or cargo-type mutation');
let writes = 0;
(globalThis as any).localStorage = {getItem: () => null, setItem: () => { writes++; }, removeItem: () => { writes++; }};
const game: any = Object.create(Game.prototype);
game.canvas = {width: 1280, height: 900};
game.career = {...defaultCareerProfile(), locationId: old.sourceId, money: 1e9, certifications: [...TEAMSTER_CERTIFICATION_IDS]};
const scene = game.buildInteractiveScene({id: 'contractPosting', contracts: [old], contractIndex: 0, selectedIndex: 0});
for (const row of scene.bodyRows) assert(clean([row.label, row.value, row.text].join(' ')), 'actual posting rows, including immutable quote cargo caption, use public names');
assert(scene.bodyRows.some((r: any) => ['Passengers', 'Cargo'].includes(r.label) && r.value.startsWith(view.cargo.label)), 'manifest row is not leaking the historical quote label');
game.activeCareerContract = old;
assert(clean(game.currentMissionCompletionText()), 'accepted completion text normalized');
assert(JSON.stringify(old) === snapshot && writes === 0, 'rendering never writes saves or historical records');
console.log(`Camps review passed: ${assertions} assertions; ${raw.length} candidates, ${unaffectedBoards.length} exact non-Sahra quoted postings, ${labels.size} old/new cargo aliases. Approved Sahra retirement checked separately; saves untouched.`);
