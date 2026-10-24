import './svg-dom';
import { ESTELLA_NODES } from '../src/content/estella';
import { generateFactionContractCandidates } from '../src/content/estella/faction-contracts';
import { RICHELIEU, isGaiaSurface } from '../src/content/estella/gaia-logistics';
import { GAIA_CIVILIAN_ID, GOVERNMENT_ID, EDF_ID } from '../src/content/estella/faction-contracts/gaia-contracts';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';

const nav = new Set(estellaSelectableNavTargets().map(n => n.id));
const pois = ESTELLA_NODES.filter(n => n.kind === 'poi' && nav.has(n.id));
const isGaia = (id: string) => id === RICHELIEU || isGaiaSurface(id);
const tally = new Map<string, { count: number; weight: number; hub: number; hubWeight: number; civilian: number; civilianWeight: number }>();
const newOrders = new Map<string, number>();
const sources = new Set<string>();
for (let day = 0; day < 120; day++) for (const node of pois) {
  for (const c of generateFactionContractCandidates({sourceId: node.id, worldTime: day * 86400})) {
    if (!nav.has(c.destinationId) || isGaia(c.sourceId) === isGaia(c.destinationId)) continue;
    const key = `${isGaia(c.sourceId) ? 'out' : 'in'}:${c.category ?? 'freight'}`;
    const row = tally.get(key) ?? {count:0,weight:0,hub:0,hubWeight:0,civilian:0,civilianWeight:0};
    row.count++; row.weight += c.likelihood;
    if (c.sourceId === RICHELIEU || c.destinationId === RICHELIEU) {row.hub++;row.hubWeight += c.likelihood;}
    if ([GAIA_CIVILIAN_ID, 'dahai-civilian-bookings', 'camps-civilian-bookings', 'sahra-civilian-bookings'].includes(c.factionId)) {row.civilian++;row.civilianWeight += c.likelihood;}
    tally.set(key,row);
    sources.add(c.sourceId);
    if ([GAIA_CIVILIAN_ID,GOVERNMENT_ID,EDF_ID].includes(c.factionId)) newOrders.set(c.factionId, (newOrders.get(c.factionId) ?? 0)+1);
  }
}
console.log('Raw playable Gaia traffic (120 epochs, includes legacy providers and terminal-native services):');
for (const [key,r] of tally) console.log(key, {count:r.count,hubPercent:100*r.hub/r.count,hubWeightPercent:100*r.hubWeight/r.weight,civilianPercent:100*r.civilian/r.count,civilianWeightPercent:100*r.civilianWeight/r.weight});
console.log('New logical daily orders', Object.fromEntries([...newOrders].map(([k,v])=>[k,v/120])));
const boards = new Map<string, {count:number;hub:number;civilian:number}>();
for (const day of [0,1,2,3,10,11,20,21,30,31,60,61]) for (const source of sources) {
  for (const c of [...generateCareerContracts(source,day*86400),...generatePassengerContracts(source,day*86400)]) {
    if (isGaia(c.sourceId) === isGaia(c.destinationId)) continue;
    const key = `${isGaia(c.sourceId)?'out':'in'}:${c.category}`;
    const r = boards.get(key) ?? {count:0,hub:0,civilian:0};r.count++;
    if(c.sourceId===RICHELIEU||c.destinationId===RICHELIEU) r.hub++;
    if([GAIA_CIVILIAN_ID,'dahai-civilian-bookings','camps-civilian-bookings','sahra-civilian-bookings'].includes(c.factionId??''))r.civilian++;
    boards.set(key,r);
  }
}
console.log('Capped board sample (12 epochs; not a quota):');
for(const [k,r] of boards)console.log(k,{rows:r.count,hubPercent:100*r.hub/r.count,civilianPercent:100*r.civilian/r.count});
