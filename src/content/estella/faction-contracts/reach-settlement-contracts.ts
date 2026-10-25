import {THULE_ANCHORAGE,COMMON_GROUND,DEEPWELL,FREEHOLD,VOLYA,BELLEVUE} from '../thule-sites';
import {BARATARIA_OBSERVATORY} from '../barataria-sites';
import type {FactionContractCandidate,FactionContractContext} from './index';

export type ReachIssuer = 'GOV'|'HSC'|'EIP';
export interface ReachSettlementLane {
  id:string; region:'thule'|'barataria'; issuer:ReachIssuer;
  from:string; to:string; label:string; mass:number; everyPairs:number;
  purpose:string; people?:boolean; both?:boolean;
}
const ANCHOR=THULE_ANCHORAGE, OBS=BARATARIA_OBSERVATORY;
const FUYUAN='estella-iv-primary-city';
export const REACH_SETTLEMENT_LANES:readonly ReachSettlementLane[] = [
  {id:'civic-stores',region:'thule',issuer:'GOV',from:ANCHOR,to:COMMON_GROUND,label:'Thule civic maintenance stores',mass:2,everyPairs:6,
    purpose:'Small replacement fittings and office equipment for Common Ground. The governor administers shared infrastructure from a tiny settlement, not a metropolitan capital.'},
  {id:'clinic-stores',region:'thule',issuer:'GOV',from:ANCHOR,to:COMMON_GROUND,label:'Thule clinic consumables',mass:1,everyPairs:6,
    purpose:'Routine packaged clinic consumables for residents of the scattered communities, consolidated at Thule Anchorage.'},
  {id:'community-services',region:'thule',issuer:'GOV',from:ANCHOR,to:COMMON_GROUND,label:'Thule community service personnel',mass:3,everyPairs:6,people:true,both:true,
    purpose:'Visiting clinicians, infrastructure staff and administrative personnel on scheduled assignments and separately booked return journeys.'},
  {id:'deepwell-technicians',region:'thule',issuer:'GOV',from:ANCHOR,to:DEEPWELL,label:'Thule community service personnel',mass:3,everyPairs:6,people:true,both:true,
    purpose:'Scheduled maintenance visits and return travel for the shared ice and life-support works. This is technical passenger service, not transport of labor debts or prisoners.'},
  {id:'local-ice',region:'thule',issuer:'HSC',from:DEEPWELL,to:ANCHOR,label:'Thule processed water containers',mass:12,everyPairs:4,
    purpose:'A modest local water lot for the orbital community. Most Deepwell output serves surface life support through ground distribution; no inner-system water export programme is implied.'},
  {id:'deepwell-service',region:'thule',issuer:'HSC',from:ANCHOR,to:DEEPWELL,label:'refurbished utility pump sets',mass:4,everyPairs:6,
    purpose:'Serviced pumps and recovery-loop equipment purchased for Deepwell. Return cores are a separate optional booking.'},
  {id:'deepwell-returns',region:'thule',issuer:'HSC',from:DEEPWELL,to:ANCHOR,label:'rebuildable utility pump cores',mass:4,everyPairs:6,
    purpose:'Customer-owned pumps returning to the Anchorage service connection for overhaul.'},
  ...[FREEHOLD,VOLYA,BELLEVUE].flatMap((site):ReachSettlementLane[]=>[
    {id:`household-stores:${site}`,region:'thule',issuer:'HSC',from:ANCHOR,to:site,label:'Thule household supply cases',mass:2,everyPairs:6,
      purpose:'Consolidated household necessities and replacement habitat fittings for a small resident community. Shared life-support capacity is funded through community shares, purchased outright or paid off through indentured work.'},
    {id:`household-travel:${site}`,region:'thule',issuer:'HSC',from:ANCHOR,to:site,label:'Thule household passengers',mass:3,everyPairs:6,people:true,both:true,
      purpose:'Ordinary household arrivals, family visits and voluntary onward travel. Residency-share arrangements are handled locally; this booking carries no custody warrant or claim on the passengers.'},
  ]),
  ...['caravanserai-main-commercial-dock','estella-xid-main-port'].map((port):ReachSettlementLane=>({
    id:`civilian-passage:${port}`,region:'thule',issuer:'HSC',from:port,to:ANCHOR,label:'Thule household passengers',mass:4,everyPairs:8,people:true,both:true,
    purpose:'Infrequent civilian passage between established public ports and Thule. Passengers arrange their own settlement funding or work agreement; this is not an extraction run, forced transfer or sale of indentures.'})),
  {id:'observatory-provisions',region:'barataria',issuer:'HSC',from:ANCHOR,to:OBS,label:'observatory provisions',mass:3,everyPairs:6,
    purpose:'Shelf-stable food and ordinary consumables for a small working orbital observation post. This public contract ends at Barataria Observatory, not a concealed surface site.'},
  {id:'observatory-service-returns',region:'barataria',issuer:'HSC',from:OBS,to:ANCHOR,label:'rebuildable utility pump cores',mass:2,everyPairs:8,
    purpose:'A small station utility pump lot returning through the regional port for servicing. Existing BFS/VHM propulsion work remains separate.'},
  {id:'observatory-instruments',region:'barataria',issuer:'EIP',from:FUYUAN,to:OBS,label:'planetology field instrument chests',mass:1,everyPairs:8,both:true,
    purpose:'Legitimate Institute observation equipment moving to the orbital post or returning for inspection and recalibration. Ordinary observations are transmitted electronically.'},
  {id:'observer-visits',region:'barataria',issuer:'EIP',from:FUYUAN,to:OBS,label:'Institute field researchers',mass:3,everyPairs:8,people:true,both:true,
    purpose:'Small visiting observer parties and their return passage. The public assignment concerns only the working observatory; no smuggling access or surface visit is included.'},
];
const ISSUERS = {
  GOV:{id:'estella-government',name:'Sector Government',tag:'GOV'},
  HSC:{id:'hartwell-shipping-companies',name:'Hartwell Shipping Companies',tag:'HSC'},
  EIP:{id:'estella-institute-of-planetology',name:'Estella Institute of Planetology',tag:'EIP'},
} as const;
function hash(text:string):number{let h=2166136261;for(const ch of text){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
/** Sparse independent bookings using existing institutions/carriers only. */
export function reachSettlementContracts(ctx:FactionContractContext,issuer:ReachIssuer):FactionContractCandidate[]{
  const actor=ISSUERS[issuer];
  return REACH_SETTLEMENT_LANES.filter(l=>l.issuer===issuer).flatMap(lane=>(lane.both?[false,true]:[false]).flatMap(reverse=>{
    const sourceId=reverse?lane.to:lane.from,destinationId=reverse?lane.from:lane.to;
    if(ctx.sourceId!==sourceId)return [];
    const templateId=`${lane.region}:${lane.id}:${reverse?'return':'out'}`,key=`${actor.id}:${templateId}`;
    if((Math.floor(ctx.worldTime/172800)+hash(`${key}:schedule`))%lane.everyPairs!==0)return [];
    return [{factionId:actor.id,factionName:actor.name,factionTag:actor.tag,issuerId:actor.id,issuerName:actor.name,
      templateId,sourceId,destinationId,gaiaDispatchKey:key,dahaiDispatchKey:key,campsDispatchKey:key,sahraDispatchKey:key,
      cargo:{label:lane.label,massClass:lane.mass<=4?'light':'standard',massTons:lane.mass},category:lane.people?'passenger':'freight',
      likelihood:0.6,generosity:lane.people?0.6:issuer==='HSC'?0.75:0.8,compensationRatio:lane.people?0.6:issuer==='HSC'?0.4:0.45,
      maxCompAllowance:2,details:lane.purpose,
    } satisfies FactionContractCandidate];
  }));
}
