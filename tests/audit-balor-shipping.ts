// Read-only, deterministic census. No Game instance, browser or career storage.
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID } from '../src/content/estella';
import { ESTELLA_FACTION_CONTRACT_PROVIDERS } from '../src/content/estella/faction-contracts';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';

// Optional pre-BAM baseline in this isolated audit process only; no file/save
// mutation. Existing providers are otherwise unchanged by the BAM pass.
const baseline = (globalThis as any).process?.env?.BALOR_AUDIT_BASELINE === '1';
if (baseline) {
  const index = ESTELLA_FACTION_CONTRACT_PROVIDERS.findIndex(p => p.id === 'balor-advanced-materials');
  if (index >= 0) ESTELLA_FACTION_CONTRACT_PROVIDERS.splice(index, 1);
}
const selectable = new Set(estellaSelectableNavTargets().map(t => t.id));

const ids = ['estella-i-transit-customs', 'estella-i-refractory-mine', 'estella-i-hot-processing', 'estella-i-worker-hab'];
const balor = new Set(ids);
const sources = new Set<string>();
const raw = new Map<string, { provider: string; source: string; destination: string; cargo: string; category: string; samples: number; weight: number }>();
const offered = new Map<string, number>();
const pois = ESTELLA_NODES.filter(n => n.kind === 'poi');
for (let day = 0; day < 120; day++) for (const node of pois) for (const provider of ESTELLA_FACTION_CONTRACT_PROVIDERS) {
  for (const c of provider.generateContracts({ sourceId: node.id, worldTime: day * 86400 })) {
    if (!balor.has(c.sourceId) && !balor.has(c.destinationId)) continue;
    sources.add(c.sourceId);
    const key = [c.factionId, c.sourceId, c.destinationId, c.cargo.label].join('|');
    const row = raw.get(key) ?? { provider: c.factionId, source: c.sourceId, destination: c.destinationId, cargo: c.cargo.label, category: c.category ?? 'freight', samples: 0, weight: 0 };
    row.samples++; row.weight += c.likelihood;
    raw.set(key, row);
  }
}
console.error(`Raw census complete: ${raw.size} route/cargo combinations, ${sources.size} source boards. Sampling 12 board epochs.`);
const boardSources = [...sources].filter(id => selectable.has(id));
for (let day = 0; day < 120; day += 10) for (const source of boardSources) {
  for (const c of [...generateCareerContracts(source, day * 86400), ...generatePassengerContracts(source, day * 86400)]) {
    if (!balor.has(c.sourceId) && !balor.has(c.destinationId)) continue;
    const key = [c.factionId, c.sourceId, c.destinationId, c.cargo.label].join('|');
    offered.set(key, (offered.get(key) ?? 0) + 1);
  }
}
const rows = [...raw.values()];
const name = (id: string) => ESTELLA_NODES_BY_ID.get(id)?.name ?? id;
const providers = [...new Set(rows.map(r => r.provider))].map(provider => {
  const own = rows.filter(r => r.provider === provider);
  const ownOffers = [...offered.entries()].filter(([key]) => key.startsWith(provider + '|'));
  return { provider, distinctRoutesCargo: own.length, rawSamples: own.reduce((n,r) => n+r.samples,0), boardRows: ownOffers.reduce((n,[,count]) => n+count,0), boardDistinctRoutesCargo: ownOffers.length,
    cargo: [...new Set(own.map(r => r.cargo))].sort(), externalSites: [...new Set(own.flatMap(r => [r.source,r.destination]).filter(id => !balor.has(id)))].map(name).sort() };
});
const sites = ids.map(id => {
  const inbound = rows.filter(r => r.destination === id), outbound = rows.filter(r => r.source === id);
  const board = [...offered.entries()].filter(([key]) => { const parts=key.split('|'); return parts[1] === id || parts[2] === id; });
  return { id, name: name(id), uniqueInbound: inbound.length, uniqueOutbound: outbound.length, providers: [...new Set([...inbound,...outbound].map(r=>r.provider))], boardRows: board.reduce((n,[,count])=>n+count,0) };
});
const byProviderRouting = providers.map(({provider}) => {
  const own = rows.filter(r => r.provider === provider && balor.has(r.source) !== balor.has(r.destination));
  const via = own.filter(r => r.source === ids[0] || r.destination === ids[0]);
  const total = own.reduce((n,r)=>n+r.samples,0), hub = via.reduce((n,r)=>n+r.samples,0);
  return { provider, rawHubSamples: hub, rawDirectSamples: total-hub, hubFraction: total ? hub/total : 0 };
});
console.log(JSON.stringify({ baseline, rawEpochs: 120, boardEpochs: 12, boardEpochStep: 10, poiCount: pois.length, providerCount: ESTELLA_FACTION_CONTRACT_PROVIDERS.length, boardSources: boardSources.length, excludedUnselectableSources: [...sources].filter(id => !selectable.has(id)).map(name),
  note: 'Distinct route/cargo/provider combinations are not freight tonnage or actual deliveries. Boards sampled without changing saves; player choices and other providers need not reproduce a provider routing ratio.', sites, providers, byProviderRouting }, null, 2));
