import './svg-dom';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID, ESTELLA_PLACEMENTS, ESTELLA_VALIDATION_ISSUES, ESTELLA_BODY_PHYSICS } from '../src/content/estella';
import { ESTELLA_SURFACE_FLIGHT_PROFILES } from '../src/content/estella/flight-profiles';
import { estellaDisplayPath, estellaFolderEntries, estellaSelectableNavTargets } from '../src/content/estella/navigation';
import { ESTELLA_FACTION_CONTRACT_PROVIDERS } from '../src/content/estella/faction-contracts';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { defaultCareerProfile, loadCareerProfile } from '../src/career-state';
import { createDefaultNunesInquiryState } from '../src/content/estella/faction-contracts/nunes-inquiries';
import { bodyById, SURFACE_POIS, STATION_POIS } from '../src/world';
import { createPlayableEstellaMission } from '../src/estella-playable';
import { LEVELS } from '../src/levels';
import { DOCKING_LEVELS } from '../src/docking';
import { Game } from '../src/game';

let assertions = 0;
function assert(ok: unknown, message: string): asserts ok { assertions++; if (!ok) throw new Error(message); }
const retired = 'estella-i-deep-listening', shade = 'estella-i-worker-hab';
const sites: Record<string, string> = {
  'estella-i-transit-customs': 'Balor Orbital',
  [shade]: 'Shade',
  'estella-i-refractory-mine': 'BAM Extraction One',
  'estella-i-hot-processing': 'BAM Foundry One',
};
assert(!ESTELLA_VALIDATION_ISSUES.some(i => i.severity === 'error'), 'world catalog validates');
assert(ESTELLA_NODES_BY_ID.get('estella-i')?.name === 'Balor' && bodyById('estella-i').name === 'Balor', 'catalog and gameplay body renamed');
assert(ESTELLA_NODES_BY_ID.get('estella-i-low-orbit-station')?.name === 'Balor Orbital', 'physical station renamed');
assert(ESTELLA_NODES_BY_ID.get('estella-i')?.catalogId === 'Estella I', 'survey designation retained');
const nav = estellaSelectableNavTargets();
assert(nav.filter(n => Object.prototype.hasOwnProperty.call(sites, n.id)).length === 4, 'four destinations selectable');
assert(estellaFolderEntries('node:estella-i').length === 4, 'planet folder contains station and three surface sites');
assert(SURFACE_POIS.filter(p => p.bodyId === 'estella-i').length === 3, 'three gameplay surface sites');
assert(!ESTELLA_NODES_BY_ID.has(retired) && !nav.some(n => n.id === retired) && !SURFACE_POIS.some(p => p.id === retired), 'observatory removed from all catalogs');
assert(!ESTELLA_PLACEMENTS[retired] && !ESTELLA_SURFACE_FLIGHT_PROFILES[retired], 'no orphaned observatory overlays');
assert(ESTELLA_BODY_PHYSICS['estella-i']?.rotationPeriod === 42000, 'rotation intentionally unchanged until planet-visuals work');
const game: any = Object.create(Game.prototype);
game.worldTime = 0;
let boardRows = 0;
for (const [id, name] of Object.entries(sites)) {
  assert(ESTELLA_NODES_BY_ID.get(id)?.name === name, `stable ID retained for ${name}`);
  assert(nav.find(t => t.id === id)?.name === name, `navigation name: ${name}`);
  assert(estellaDisplayPath(id) === `The Hearth -> Balor -> ${name}`, `deduplicated display path: ${name}`);
  const gameplayPoi = id === 'estella-i-transit-customs' ? STATION_POIS.find(p => p.id === 'estella-i-low-orbit-station') : SURFACE_POIS.find(p => p.id === id);
  assert(gameplayPoi?.name === name, `gameplay POI: ${name}`);
  game.career = { ...defaultCareerProfile(), locationId: id };
  assert(game.buildInteractiveScene({ id: 'stationTerminal', selectedIndex: 0 }).subtitle.includes(`Balor -> ${name}`), 'terminal uses live names');
  const outbound = createPlayableEstellaMission(id, 'estella-vi-heavy-cargo-station', undefined, 501);
  assert(outbound.start.level.name.includes(name), `departure label: ${name}`);
  const oldIds = new Set([...LEVELS, ...DOCKING_LEVELS].map(l => l.id));
  createPlayableEstellaMission('estella-vi-heavy-cargo-station', id, undefined, 502);
  assert([...LEVELS, ...DOCKING_LEVELS].some(l => !oldIds.has(l.id) && l.name.includes(name)), `arrival label: ${name}`);
  for (let day = 0; day < 10; day++) for (const c of [...generateCareerContracts(id, day * 86400), ...generatePassengerContracts(id, day * 86400)]) {
    boardRows++;
    assert(c.sourceName === name && c.sourcePath === estellaDisplayPath(id), 'existing boards inherit renamed source');
    assert(c.destinationId !== retired, 'no retired destination in board');
  }
}
assert(boardRows > 0, 'existing Balor jobs remain available');
for (const provider of ESTELLA_FACTION_CONTRACT_PROVIDERS) for (const node of ESTELLA_NODES.filter(n => n.kind === 'poi')) {
  for (const c of provider.generateContracts({ sourceId: node.id, worldTime: 0 })) {
    assert(c.sourceId !== retired && c.destinationId !== retired, 'all providers exclude retired observatory');
    assert(ESTELLA_NODES_BY_ID.has(c.sourceId) && ESTELLA_NODES_BY_ID.has(c.destinationId), 'provider endpoints still resolve');
  }
}

// Storage is in-memory only. Old observatory careers recover in Shade rather
// than restarting; all remaining IDs and every unrelated field stay intact.
const storage = new Map<string, string>();
let writes = 0;
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { writes++; storage.set(key, value); },
  removeItem: (key: string) => storage.delete(key),
} });
for (const locationId of [retired, ...Object.keys(sites), 'caravanserai-main-commercial-dock']) {
  const original = { ...defaultCareerProfile(), locationId, money: 123456, worldTime: 9876, nunesInquiries: createDefaultNunesInquiryState(9876) };
  const serialized = JSON.stringify(original);
  storage.set('space-teamster.career.v1', serialized);
  storage.set('space-teamster.missionProfiles.v1', '["Historical observatory name remains unchanged"]');
  const loaded = loadCareerProfile();
  assert(loaded.locationId === (locationId === retired ? shade : locationId), 'location migration is narrowly scoped');
  assert(JSON.stringify({ ...loaded, locationId }) === serialized, 'money/time/rig/qualifications/inspection/inquiry state preserved');
  assert(storage.get('space-teamster.career.v1') === serialized && writes === 0, 'current-schema load does not eagerly rewrite saved career');
  assert(storage.get('space-teamster.missionProfiles.v1') === '["Historical observatory name remains unchanged"]', 'history untouched');
}
console.log(`Balor naming/site regression passed: ${assertions} assertions; ${boardRows} existing board rows.`);
