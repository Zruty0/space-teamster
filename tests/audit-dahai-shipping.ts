import './svg-dom';
import { ESTELLA_NODES } from '../src/content/estella';
import { ESTELLA_FACTION_CONTRACT_PROVIDERS, generateFactionContractCandidates } from '../src/content/estella/faction-contracts';
import { DAHAI_ORBITAL, DAHAI_SURFACE_SITES } from '../src/content/estella/dahai-sites';
import { DAHAI_CIVILIAN_ID } from '../src/content/estella/faction-contracts/dahai-contracts';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { estellaSelectableNavTargets } from '../src/content/estella/navigation';

const pois = ESTELLA_NODES.filter(n => n.kind === 'poi');
const local = new Set<string>([DAHAI_ORBITAL, ...DAHAI_SURFACE_SITES]);
const nav = new Set(estellaSelectableNavTargets().map(n => n.id));
const civil = (id?: string) => [DAHAI_CIVILIAN_ID, 'gaia-civilian-bookings', 'camps-civilian-bookings', 'sahra-civilian-bookings'].includes(id ?? '');
const actorScope = ESTELLA_FACTION_CONTRACT_PROVIDERS.map(p => {
  let existing = 0, added = 0;
  for (const n of pois) for (const c of p.generateContracts({sourceId:n.id, worldTime:0})) {
    if (!local.has(c.sourceId) && !local.has(c.destinationId)) continue;
    if (c.templateId.startsWith('dahai:')) added++; else existing++;
  }
  return {provider:p.id, existingDahaiOrders:existing, addedDahaiOrders:added};
});
const totals = new Map<string,{count:number; hub:number; weight:number; hubWeight:number; civilian:number; civilianWeight:number}>();
const sources = new Set<string>();
for (let day=0; day<120; day++) for (const n of pois) for (const c of generateFactionContractCandidates({sourceId:n.id,worldTime:day*86400})) {
  if (!nav.has(c.sourceId)||!nav.has(c.destinationId)||local.has(c.sourceId)===local.has(c.destinationId)) continue;
  const key=`${local.has(c.sourceId)?'out':'in'}:${c.category??'freight'}`;
  const r=totals.get(key)??{count:0,hub:0,weight:0,hubWeight:0,civilian:0,civilianWeight:0};
  r.count++;r.weight+=c.likelihood;
  if(c.sourceId===DAHAI_ORBITAL||c.destinationId===DAHAI_ORBITAL){r.hub++;r.hubWeight+=c.likelihood;}
  if(civil(c.factionId)){r.civilian++;r.civilianWeight+=c.likelihood;}
  totals.set(key,r);sources.add(c.sourceId);
}
const boards=new Map<string,{count:number;civilian:number}>();
for(const day of [0,1,2,3,10,11,20,21,30,31,60,61]) for(const sourceId of sources) {
  for(const c of [...generateCareerContracts(sourceId,day*86400),...generatePassengerContracts(sourceId,day*86400)]) {
    if(local.has(c.sourceId)===local.has(c.destinationId)) continue;
    const key=`${local.has(c.sourceId)?'out':'in'}:${c.category}`;
    const r=boards.get(key)??{count:0,civilian:0};r.count++;if(civil(c.factionId))r.civilian++;boards.set(key,r);
  }
}
const percent=(n:number,d:number)=>(100*n/d).toFixed(1)+'%';
console.table(actorScope);
console.table([...totals].map(([direction,r])=>({direction,rawCount:r.count,hub:percent(r.hub,r.count),weightedHub:percent(r.hubWeight,r.weight),civilian:percent(r.civilian,r.count),weightedCivilian:percent(r.civilianWeight,r.weight),sampledBoardCivilian:percent(boards.get(direction)?.civilian??0,boards.get(direction)?.count??1)})));
console.log('120 raw epochs; 12 sampled board epochs. Native station services retained. Percentages describe consignments/demand, not forced player itineraries or tonnage quotas.');
