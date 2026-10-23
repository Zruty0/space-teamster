import './svg-dom';
import { ESTELLA_NODES, ESTELLA_NODES_BY_ID } from '../src/content/estella';
import { generateFactionContractCandidates } from '../src/content/estella/faction-contracts';
import { CAMPS_LOCATION_IDS, CAMPS_TRADE_WORLDS } from '../src/content/estella/camps-sites';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
const pois=ESTELLA_NODES.filter(n=>n.kind==='poi');
const sites=new Map<string,{name:string;incoming:number;outgoing:number}>(CAMPS_LOCATION_IDS.map(id=>[id,{name:ESTELLA_NODES_BY_ID.get(id)!.name,incoming:0,outgoing:0}]));
const added=new Map<string,number>();
function body(id:string):string|undefined {let n=ESTELLA_NODES_BY_ID.get(id);if(n?.placement?.kind==='aboard')n=ESTELLA_NODES_BY_ID.get(n.placement.parentId);return n?.placement?.parentId;}
const mix=new Map<string,{total:number;hub:number;eligible:number;eligibleHub:number}>();
for(let day=0;day<120;day++)for(const n of pois)for(const c of generateFactionContractCandidates({sourceId:n.id,worldTime:day*86400})) {
  const a=sites.get(c.sourceId),b=sites.get(c.destinationId);if(a)a.outgoing++;if(b)b.incoming++;
  if(day===0&&c.templateId.startsWith('camps:'))added.set(c.factionId,(added.get(c.factionId)??0)+1);
  for(const w of CAMPS_TRADE_WORLDS){const out=body(c.sourceId)===w.bodyId, incoming=body(c.destinationId)===w.bodyId;if(out===incoming)continue;
    const key=`${w.name}:${out?'out':'in'}:${c.category??'freight'}`,r=mix.get(key)??{total:0,hub:0,eligible:0,eligibleHub:0};r.total++;
    const hub=c.sourceId===w.hub||c.destinationId===w.hub;if(hub)r.hub++;
    if(c.details?.includes(`${w.name} site:`)){r.eligible++;if(hub)r.eligibleHub++;}mix.set(key,r);
  }
}
let boards=0;const actors=new Set<string>();
for(const day of [0,1,10,11])for(const sourceId of CAMPS_LOCATION_IDS)for(const c of [...generateCareerContracts(sourceId,day*86400),...generatePassengerContracts(sourceId,day*86400)]){boards++;if(c.templateId?.startsWith('camps:'))actors.add(c.factionId!);}
console.table([...sites].map(([id,r])=>({id,...r})));
console.table([...added].map(([provider,dailyOrders])=>({provider,dailyOrders})));
console.table([...mix].map(([scope,r])=>({scope,rawCount:r.total,allTrafficHub:(100*r.hub/r.total).toFixed(1)+'%',eligibleSurfaceTradeHub:(100*r.eligibleHub/r.eligible).toFixed(1)+'%'})));
console.log(`120 raw epochs; four board epochs/${boards} rows. New families visible at Camps sources: ${[...actors].join(', ')}. Native station/industrial traffic is not a50/50 quota.`);
